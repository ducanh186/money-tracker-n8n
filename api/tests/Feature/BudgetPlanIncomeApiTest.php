<?php

namespace Tests\Feature;

use App\Contracts\TransactionsRepositoryInterface;
use App\Models\BudgetPeriod;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BudgetPlanIncomeApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(\Database\Seeders\JarSeeder::class);
    }

    public function test_budget_plan_uses_expected_income_even_when_actual_income_is_zero(): void
    {
        BudgetPeriod::create([
            'month' => 'May-2026',
            'year' => 2026,
            'month_num' => 5,
            'total_income' => 13_600_000,
            'to_be_budgeted' => 0,
            'status' => 'open',
        ]);

        $this->app->instance(TransactionsRepositoryInterface::class, new class implements TransactionsRepositoryInterface {
            public function getByMonth(string $month): array
            {
                return [];
            }

            public function all(): array
            {
                return [];
            }
        });

        $response = $this->getJson('/api/budget-plan?month=May-2026');

        $response->assertOk()
            ->assertJsonPath('data.base_income', 13_600_000)
            ->assertJsonPath('data.expected_income_vnd', 13_600_000)
            ->assertJsonPath('data.actual_income_vnd', 0)
            ->assertJsonPath('data.sheet_income', 0);
    }
}
