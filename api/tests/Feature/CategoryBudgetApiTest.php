<?php

namespace Tests\Feature;

use App\Contracts\TransactionsRepositoryInterface;
use App\Models\BudgetPeriod;
use App\Models\Category;
use App\Models\CategoryBudget;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CategoryBudgetApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(\Database\Seeders\JarSeeder::class);
    }

    public function test_default_categories_and_six_jar_template_are_available(): void
    {
        $this->getJson('/api/categories')
            ->assertOk()
            ->assertJsonCount(36, 'data')
            ->assertJsonPath('data.0.key', 'Relocation Setup')
            ->assertJsonPath('data.0.name', 'Relocation Setup')
            ->assertJsonPath('data.0.group', 'LTSS');

        $response = $this->getJson('/api/budget-templates');

        $response->assertOk()
            ->assertJsonPath('data.0.key', 'six_jars')
            ->assertJsonPath('data.0.type', 'jar');

        $this->assertCount(6, $response->json('data.0.items'));
    }

    public function test_category_budgets_can_be_read_by_iso_month(): void
    {
        $period = BudgetPeriod::create([
            'month' => 'May-2026',
            'year' => 2026,
            'month_num' => 5,
            'total_income' => 13_600_000,
            'to_be_budgeted' => 10_600_000,
            'status' => 'open',
        ]);

        $groceries = Category::where('key', 'Groceries')->firstOrFail();
        CategoryBudget::create([
            'budget_period_id' => $period->id,
            'category_id' => $groceries->id,
            'budgeted_amount' => 3_000_000,
            'reserved_amount' => 0,
            'rollover_amount' => 0,
        ]);

        $this->getJson('/api/category-budgets?month=2026-05')
            ->assertOk()
            ->assertJsonPath('data.0.category_key', 'Groceries')
            ->assertJsonPath('data.0.budgeted_amount', 3_000_000);
    }

    public function test_monthly_summary_uses_category_budgets_when_present(): void
    {
        $period = BudgetPeriod::create([
            'month' => 'May-2026',
            'year' => 2026,
            'month_num' => 5,
            'total_income' => 13_600_000,
            'to_be_budgeted' => 10_600_000,
            'status' => 'open',
        ]);

        $groceries = Category::where('key', 'Groceries')->firstOrFail();
        CategoryBudget::create([
            'budget_period_id' => $period->id,
            'category_id' => $groceries->id,
            'budgeted_amount' => 3_000_000,
            'reserved_amount' => 0,
            'rollover_amount' => 0,
        ]);

        $this->app->instance(TransactionsRepositoryInterface::class, new class implements TransactionsRepositoryInterface {
            public function getByMonth(string $month): array
            {
                return $this->all();
            }

            public function all(): array
            {
                return [
                    [
                        'month' => 'May-2026',
                        'datetime' => '2026-05-03 09:00:00',
                        'flow' => 'expense',
                        'amount' => -500,
                        'category' => ' groceries ',
                        'balance' => 7_700,
                    ],
                ];
            }
        });

        $this->getJson('/api/monthly-summary?month=2026-05')
            ->assertOk()
            ->assertJsonPath('data.budget_basis', 'category')
            ->assertJsonPath('data.budgeted_vnd', 3_000_000)
            ->assertJsonPath('data.spent_vnd', 500_000)
            ->assertJsonPath('data.remaining_vnd', 2_500_000)
            ->assertJsonFragment([
                'category_key' => 'Groceries',
                'category_name' => 'Groceries',
                'spent_vnd' => 500_000,
            ]);
    }
}
