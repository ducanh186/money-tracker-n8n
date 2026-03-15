<?php

namespace Tests\Feature;

use App\Models\BudgetLine;
use App\Models\BudgetPeriod;
use App\Models\Jar;
use App\Models\JarAllocation;
use App\Services\PlannedExpenseAutoCleanupService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class PlannedExpenseAutoCleanupServiceTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\JarSeeder::class);
    }

    public function test_it_deletes_matching_planned_line_for_same_month_and_jar(): void
    {
        $jar = Jar::where('key', 'NEC')->firstOrFail();

        $period = BudgetPeriod::create([
            'month'        => 'Mar-2026',
            'year'         => 2026,
            'month_num'    => 3,
            'total_income' => 10_000_000,
            'status'       => 'open',
        ]);

        $allocation = JarAllocation::create([
            'budget_period_id' => $period->id,
            'jar_id'           => $jar->id,
            'planned_amount'   => 3_000_000,
            'committed_amount' => 2_500_000,
        ]);

        $lineToDelete = BudgetLine::create([
            'jar_allocation_id' => $allocation->id,
            'name'              => 'Tien nha thang 3',
            'type'              => 'bill',
            'planned_amount'    => 2_000_000,
        ]);

        $lineToKeep = BudgetLine::create([
            'jar_allocation_id' => $allocation->id,
            'name'              => 'Goi internet gia dinh',
            'type'              => 'bill',
            'planned_amount'    => 500_000,
        ]);

        Cache::put('budget_status_' . md5('Mar-2026'), 'stale', 120);
        Cache::put('budget_plan_' . md5('Mar-2026'), 'stale', 120);
        Cache::put('dashboard_summary_' . md5('Mar-2026'), 'stale', 120);

        $stats = app(PlannedExpenseAutoCleanupService::class)->cleanupFromSheetRows([
            [
                'flow'  => 'expense',
                'month' => 'Mar-2026',
                'jar'   => 'NEC',
                'note'  => 'Tien nha',
            ],
        ]);

        $this->assertSame(1, $stats['notes_checked']);
        $this->assertSame(1, $stats['matches_found']);
        $this->assertSame(1, $stats['deleted_lines']);
        $this->assertSame(['Mar-2026'], $stats['months_affected']);

        $this->assertDatabaseMissing('budget_lines', ['id' => $lineToDelete->id]);
        $this->assertDatabaseHas('budget_lines', ['id' => $lineToKeep->id]);
        $this->assertDatabaseHas('jar_allocations', [
            'id'               => $allocation->id,
            'committed_amount' => 500_000,
        ]);

        $this->assertNull(Cache::get('budget_status_' . md5('Mar-2026')));
        $this->assertNull(Cache::get('budget_plan_' . md5('Mar-2026')));
        $this->assertNull(Cache::get('dashboard_summary_' . md5('Mar-2026')));
    }

    public function test_it_skips_invalid_rows_and_non_matching_context(): void
    {
        $jar = Jar::where('key', 'NEC')->firstOrFail();

        $period = BudgetPeriod::create([
            'month'        => 'Mar-2026',
            'year'         => 2026,
            'month_num'    => 3,
            'total_income' => 8_000_000,
            'status'       => 'open',
        ]);

        $allocation = JarAllocation::create([
            'budget_period_id' => $period->id,
            'jar_id'           => $jar->id,
            'planned_amount'   => 2_000_000,
            'committed_amount' => 1_000_000,
        ]);

        $line = BudgetLine::create([
            'jar_allocation_id' => $allocation->id,
            'name'              => 'Tien internet',
            'type'              => 'bill',
            'planned_amount'    => 1_000_000,
        ]);

        $stats = app(PlannedExpenseAutoCleanupService::class)->cleanupFromSheetRows([
            [
                'flow'  => 'income',
                'month' => 'Mar-2026',
                'jar'   => 'NEC',
                'note'  => 'Tien internet',
            ],
            [
                'flow'  => 'expense',
                'month' => 'Mar-2026',
                'jar'   => 'NEC',
                'note'  => 'ab',
            ],
            [
                'flow'  => 'expense',
                'month' => 'Mar-2026',
                'jar'   => 'EDU',
                'note'  => 'Tien internet',
            ],
            [
                'flow'  => 'expense',
                'month' => 'Apr-2026',
                'jar'   => 'NEC',
                'note'  => 'Tien internet',
            ],
        ]);

        $this->assertSame(0, $stats['notes_checked']);
        $this->assertSame(0, $stats['matches_found']);
        $this->assertSame(0, $stats['deleted_lines']);
        $this->assertSame([], $stats['months_affected']);

        $this->assertDatabaseHas('budget_lines', ['id' => $line->id]);
        $this->assertDatabaseHas('jar_allocations', [
            'id'               => $allocation->id,
            'committed_amount' => 1_000_000,
        ]);
    }
}
