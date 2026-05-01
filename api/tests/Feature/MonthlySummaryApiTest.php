<?php

namespace Tests\Feature;

use App\Contracts\TransactionsRepositoryInterface;
use App\Models\BudgetPeriod;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MonthlySummaryApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(\Database\Seeders\JarSeeder::class);
    }

    public function test_monthly_summary_keeps_expected_income_when_actual_income_is_zero(): void
    {
        BudgetPeriod::create([
            'month' => 'May-2026',
            'year' => 2026,
            'month_num' => 5,
            'total_income' => 13_600_000,
            'to_be_budgeted' => 13_600_000,
            'status' => 'open',
        ]);

        $rows = [
            [
                'account' => 'Bank',
                'balance' => 8200,
                'month' => 'Apr-2026',
                'datetime' => '2026-04-30 23:00:00',
            ],
        ];

        $this->bindRows($rows);

        $response = $this->getJson('/api/monthly-summary?month=2026-05');

        $response->assertOk()
            ->assertJsonPath('data.month', '2026-05')
            ->assertJsonPath('data.expected_income_vnd', 13_600_000)
            ->assertJsonPath('data.actual_income_vnd', 0)
            ->assertJsonPath('data.actual_expense_vnd', 0)
            ->assertJsonPath('data.account_balance_vnd', 8_200_000)
            ->assertJsonPath('data.ending_balance_vnd', 8_200_000)
            ->assertJsonPath('data.period_status', 'open');
    }

    public function test_monthly_summary_marks_missing_period_as_needs_plan_without_zeroing_balance(): void
    {
        $rows = [
            [
                'account' => 'Bank',
                'balance' => 8200,
                'month' => 'Apr-2026',
                'datetime' => '2026-04-30 23:00:00',
            ],
        ];

        $this->bindRows($rows);

        $response = $this->getJson('/api/monthly-summary?month=2026-05');

        $response->assertOk()
            ->assertJsonPath('data.actual_income_vnd', 0)
            ->assertJsonPath('data.actual_expense_vnd', 0)
            ->assertJsonPath('data.account_balance_vnd', 8_200_000)
            ->assertJsonPath('data.period_status', 'needs_plan')
            ->assertJsonPath('data.has_period', false);
    }

    private function bindRows(array $rows): void
    {
        $this->app->instance(TransactionsRepositoryInterface::class, new class($rows) implements TransactionsRepositoryInterface {
            public function __construct(private readonly array $rows)
            {
            }

            public function getByMonth(string $month): array
            {
                return array_values(array_filter($this->rows, fn (array $row) => ($row['month'] ?? null) === $month));
            }

            public function all(): array
            {
                return $this->rows;
            }
        });
    }
}
