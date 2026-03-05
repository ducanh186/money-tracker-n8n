<?php

namespace Tests\Feature;

use App\Models\Jar;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BudgetPeriodApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\JarSeeder::class);
    }

    public function test_create_budget_period_with_auto_allocation(): void
    {
        $response = $this->postJson('/api/budget-periods', [
            'month'        => 'Mar-2026',
            'year'         => 2026,
            'month_num'    => 3,
            'total_income' => 13_600_000,
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.period.month', 'Mar-2026')
            ->assertJsonPath('data.period.total_income', 13_600_000)
            ->assertJsonCount(6, 'data.jars');

        // Verify NEC allocation: 15% of 13,600,000 = 2,040,000
        $nec = collect($response->json('data.jars'))->firstWhere('jar_key', 'NEC');
        $this->assertEquals(2_040_000, $nec['planned_amount']);

        // Verify GIVE allocation: 30% of 13,600,000 = 4,080,000
        $give = collect($response->json('data.jars'))->firstWhere('jar_key', 'GIVE');
        $this->assertEquals(4_080_000, $give['planned_amount']);
    }

    public function test_show_budget_workspace(): void
    {
        $createResponse = $this->postJson('/api/budget-periods', [
            'month'        => 'Mar-2026',
            'year'         => 2026,
            'month_num'    => 3,
            'total_income' => 13_600_000,
        ]);

        $periodId = $createResponse->json('data.period.id');

        $response = $this->getJson("/api/budget-periods/{$periodId}");

        $response->assertOk()
            ->assertJsonPath('data.period.month', 'Mar-2026')
            ->assertJsonCount(6, 'data.jars');
    }

    public function test_update_income_reallocates(): void
    {
        $createResponse = $this->postJson('/api/budget-periods', [
            'month'        => 'Mar-2026',
            'year'         => 2026,
            'month_num'    => 3,
            'total_income' => 13_600_000,
        ]);

        $periodId = $createResponse->json('data.period.id');

        $response = $this->putJson("/api/budget-periods/{$periodId}", [
            'total_income' => 20_000_000,
        ]);

        $response->assertOk()
            ->assertJsonPath('data.period.total_income', 20_000_000);

        // NEC should be 15% of 20M = 3,000,000
        $nec = collect($response->json('data.jars'))->firstWhere('jar_key', 'NEC');
        $this->assertEquals(3_000_000, $nec['planned_amount']);
    }

    public function test_bonus_allocation_savings_first(): void
    {
        $createResponse = $this->postJson('/api/budget-periods', [
            'month'        => 'Mar-2026',
            'year'         => 2026,
            'month_num'    => 3,
            'total_income' => 13_600_000,
        ]);

        $periodId = $createResponse->json('data.period.id');

        $response = $this->postJson("/api/budget-periods/{$periodId}/bonus", [
            'amount' => 5_000_000,
            'policy' => 'savings_first',
        ]);

        $response->assertOk()
            ->assertJsonPath('data.period.total_income', 18_600_000);

        // LTSS and FFA should each get 2,500,000 extra
        $ltss = collect($response->json('data.jars'))->firstWhere('jar_key', 'LTSS');
        $ffa = collect($response->json('data.jars'))->firstWhere('jar_key', 'FFA');

        // LTSS was 2,040,000 + 2,500,000 = 4,540,000
        $this->assertEquals(4_540_000, $ltss['planned_amount']);
        // FFA was 1,360,000 + 2,500,000 = 3,860,000
        $this->assertEquals(3_860_000, $ffa['planned_amount']);
    }

    public function test_jar_override(): void
    {
        $createResponse = $this->postJson('/api/budget-periods', [
            'month'        => 'Mar-2026',
            'year'         => 2026,
            'month_num'    => 3,
            'total_income' => 10_000_000,
        ]);

        $periodId = $createResponse->json('data.period.id');
        $playJar = Jar::where('key', 'PLAY')->first();

        $response = $this->putJson("/api/budget-periods/{$periodId}/jar-override/{$playJar->id}", [
            'percent' => 10,
        ]);

        $response->assertOk()
            ->assertJsonPath('data.planned_amount', 1_000_000); // 10% of 10M
    }

    public function test_budget_lines_crud(): void
    {
        $createResponse = $this->postJson('/api/budget-periods', [
            'month'        => 'Mar-2026',
            'year'         => 2026,
            'month_num'    => 3,
            'total_income' => 13_600_000,
        ]);

        $periodId = $createResponse->json('data.period.id');
        $necAlloc = collect($createResponse->json('data.jars'))->firstWhere('jar_key', 'NEC');

        // Create a budget line
        $lineResponse = $this->postJson('/api/budget-lines', [
            'jar_allocation_id' => $necAlloc['allocation_id'],
            'name'              => 'Tiền nhà',
            'type'              => 'bill',
            'planned_amount'    => 1_500_000,
        ]);

        $lineResponse->assertCreated()
            ->assertJsonPath('data.name', 'Tiền nhà');

        $lineId = $lineResponse->json('data.id');

        // Update
        $this->putJson("/api/budget-lines/{$lineId}", [
            'actual_amount' => 1_500_000,
        ])->assertOk();

        // List
        $this->getJson("/api/budget-periods/{$periodId}/lines")
            ->assertOk()
            ->assertJsonCount(1, 'data');

        // Delete
        $this->deleteJson("/api/budget-lines/{$lineId}")
            ->assertOk();
    }
}
