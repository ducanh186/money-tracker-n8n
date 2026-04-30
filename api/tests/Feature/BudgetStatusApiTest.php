<?php

namespace Tests\Feature;

use App\Contracts\TransactionsRepositoryInterface;
use App\Models\BudgetPeriod;
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

        $jars = collect($response->json('data.jars'));

        $this->assertSame(-250_000, $jars->firstWhere('key', 'NEC')['available']);
        $this->assertSame(100_000, $jars->firstWhere('key', 'PLAY')['available']);
        $this->assertSame(
            -150_000,
            $jars->sum('available'),
            'available_to_spend should match the sum of per-jar available balances.'
        );
    }
}