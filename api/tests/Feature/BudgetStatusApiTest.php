<?php

namespace Tests\Feature;

use App\Contracts\TransactionsRepositoryInterface;
use App\Models\BudgetPeriod;
use App\Models\BudgetLine;
use App\Models\Jar;
use App\Models\JarAllocation;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BudgetStatusApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(\Database\Seeders\JarSeeder::class);
    }

    public function test_budget_status_uses_sum_of_jar_available_for_available_to_spend(): void
    {
        $rows = [
            [
                'flow' => 'expense',
                'amount' => 900,
                'jar' => 'NEC',
            ],
            [
                'flow' => 'expense',
                'amount' => 100,
                'jar' => 'PLAY',
            ],
        ];

        $this->app->instance(TransactionsRepositoryInterface::class, new class($rows) implements TransactionsRepositoryInterface {
            public function __construct(private readonly array $rows)
            {
            }

            public function getByMonth(string $month): array
            {
                return $this->rows;
            }

            public function all(): array
            {
                return $this->rows;
            }
        });

        $period = BudgetPeriod::create([
            'month' => 'Apr-2026',
            'year' => 2026,
            'month_num' => 4,
            'total_income' => 700_000,
            'to_be_budgeted' => 0,
            'status' => 'open',
        ]);

        $nec = Jar::where('key', 'NEC')->firstOrFail();
        $play = Jar::where('key', 'PLAY')->firstOrFail();

        JarAllocation::create([
            'budget_period_id' => $period->id,
            'jar_id' => $nec->id,
            'planned_amount' => 500_000,
            'committed_amount' => 100_000,
            'rollover_amount' => 250_000,
        ]);

        JarAllocation::create([
            'budget_period_id' => $period->id,
            'jar_id' => $play->id,
            'planned_amount' => 200_000,
            'committed_amount' => 0,
            'rollover_amount' => 0,
        ]);

        $response = $this->getJson('/api/budget-status?month=Apr-2026');

        $response->assertOk();
        $response->assertJsonPath('data.assigned', 700_000);
        $response->assertJsonPath('data.committed', 100_000);
        $response->assertJsonPath('data.total_spent', 1_000_000);
        $response->assertJsonPath('data.available_to_spend', -150_000);
        $response->assertJsonPath('data.planning_insights_enabled', true);

        $jars = collect($response->json('data.jars'));

        $this->assertSame(-250_000, $jars->firstWhere('key', 'NEC')['available']);
        $this->assertSame(100_000, $jars->firstWhere('key', 'PLAY')['available']);
        $this->assertSame(
            -150_000,
            $jars->sum('available'),
            'available_to_spend should match the sum of per-jar available balances.'
        );
    }

    public function test_general_budget_lines_do_not_reduce_available_to_spend(): void
    {
        $rows = [
            [
                'flow' => 'expense',
                'amount' => -500,
                'jar' => 'NEC',
                'month' => 'Apr-2026',
            ],
        ];

        $this->app->instance(TransactionsRepositoryInterface::class, new class($rows) implements TransactionsRepositoryInterface {
            public function __construct(private readonly array $rows)
            {
            }

            public function getByMonth(string $month): array
            {
                return $this->rows;
            }

            public function all(): array
            {
                return $this->rows;
            }
        });

        $period = BudgetPeriod::create([
            'month' => 'Apr-2026',
            'year' => 2026,
            'month_num' => 4,
            'total_income' => 3_000_000,
            'to_be_budgeted' => 0,
            'status' => 'open',
        ]);

        $nec = Jar::where('key', 'NEC')->firstOrFail();
        $allocation = JarAllocation::create([
            'budget_period_id' => $period->id,
            'jar_id' => $nec->id,
            'planned_amount' => 3_000_000,
            'committed_amount' => 3_000_000,
            'rollover_amount' => 0,
        ]);

        BudgetLine::create([
            'jar_allocation_id' => $allocation->id,
            'name' => 'Food envelope breakdown',
            'type' => 'general',
            'planned_amount' => 3_000_000,
        ]);

        $response = $this->getJson('/api/budget-status?month=Apr-2026');

        $response->assertOk();
        $response->assertJsonPath('data.available_to_spend', 2_500_000);
        $response->assertJsonPath('data.reserved_vnd', 0);
        $response->assertJsonPath('data.jars.0.available', 2_500_000);
        $response->assertJsonPath('data.jars.0.reserved', 0);
    }

    public function test_reserved_budget_lines_reduce_available_to_spend_once(): void
    {
        $rows = [
            [
                'flow' => 'expense',
                'amount' => -500,
                'jar' => 'NEC',
                'month' => 'Apr-2026',
            ],
        ];

        $this->app->instance(TransactionsRepositoryInterface::class, new class($rows) implements TransactionsRepositoryInterface {
            public function __construct(private readonly array $rows)
            {
            }

            public function getByMonth(string $month): array
            {
                return $this->rows;
            }

            public function all(): array
            {
                return $this->rows;
            }
        });

        $period = BudgetPeriod::create([
            'month' => 'Apr-2026',
            'year' => 2026,
            'month_num' => 4,
            'total_income' => 3_000_000,
            'to_be_budgeted' => 0,
            'status' => 'open',
        ]);

        $nec = Jar::where('key', 'NEC')->firstOrFail();
        $allocation = JarAllocation::create([
            'budget_period_id' => $period->id,
            'jar_id' => $nec->id,
            'planned_amount' => 3_000_000,
            'committed_amount' => 1_000_000,
            'rollover_amount' => 0,
        ]);

        BudgetLine::create([
            'jar_allocation_id' => $allocation->id,
            'name' => 'Upcoming rent',
            'type' => 'bill',
            'planned_amount' => 1_000_000,
        ]);

        $response = $this->getJson('/api/budget-status?month=Apr-2026');

        $response->assertOk();
        $response->assertJsonPath('data.available_to_spend', 1_500_000);
        $response->assertJsonPath('data.reserved_vnd', 1_000_000);
        $response->assertJsonPath('data.jars.0.available', 1_500_000);
        $response->assertJsonPath('data.jars.0.reserved', 1_000_000);
    }
}
