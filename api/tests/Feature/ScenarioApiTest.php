<?php

namespace Tests\Feature;

use App\Models\BudgetPeriod;
use App\Models\Jar;
use App\Models\JarAllocation;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ScenarioApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\JarSeeder::class);
    }

    public function test_simulate_purchase_scenario(): void
    {
        // Create a budget period with allocations
        $this->postJson('/api/budget-periods', [
            'month'        => 'Mar-2026',
            'year'         => 2026,
            'month_num'    => 3,
            'total_income' => 13_600_000,
        ]);

        $response = $this->postJson('/api/scenarios/simulate', [
            'name'            => 'Mua kính cận',
            'purchase_amount' => 1_000_000,
            'target_jar_key'  => 'NEC',
            'month'           => 'Mar-2026',
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.name', 'Mua kính cận')
            ->assertJsonPath('data.purchase_amount', 1_000_000)
            ->assertJsonPath('data.target_jar', 'NEC');

        // Should have multiple proposals
        $proposals = $response->json('data.proposals');
        $this->assertGreaterThanOrEqual(3, count($proposals));

        // Check proposal types exist
        $proposalIds = collect($proposals)->pluck('id')->toArray();
        $this->assertContains('fund_now', $proposalIds);
        $this->assertContains('fund_over_time', $proposalIds);
        $this->assertContains('use_emergency', $proposalIds);
    }

    public function test_scenario_fund_now_feasibility(): void
    {
        $this->postJson('/api/budget-periods', [
            'month'        => 'Mar-2026',
            'year'         => 2026,
            'month_num'    => 3,
            'total_income' => 13_600_000,
        ]);

        // NEC has 15% of 13.6M = 2,040,000. Buying 1M should be feasible
        $response = $this->postJson('/api/scenarios/simulate', [
            'name'            => 'Kính cận',
            'purchase_amount' => 1_000_000,
            'target_jar_key'  => 'NEC',
            'month'           => 'Mar-2026',
        ]);

        $fundNow = collect($response->json('data.proposals'))->firstWhere('id', 'fund_now');
        $this->assertTrue($fundNow['feasible']);

        // Buying 3M from NEC should NOT be feasible (only 2.04M available)
        $response2 = $this->postJson('/api/scenarios/simulate', [
            'name'            => 'Laptop',
            'purchase_amount' => 3_000_000,
            'target_jar_key'  => 'NEC',
            'month'           => 'Mar-2026',
        ]);

        $fundNow2 = collect($response2->json('data.proposals'))->firstWhere('id', 'fund_now');
        $this->assertFalse($fundNow2['feasible']);
    }

    public function test_list_scenarios(): void
    {
        $this->postJson('/api/budget-periods', [
            'month'        => 'Mar-2026',
            'year'         => 2026,
            'month_num'    => 3,
            'total_income' => 13_600_000,
        ]);

        $this->postJson('/api/scenarios/simulate', [
            'name'            => 'Kính cận',
            'purchase_amount' => 1_000_000,
            'target_jar_key'  => 'NEC',
            'month'           => 'Mar-2026',
        ]);

        $response = $this->getJson('/api/scenarios');

        $response->assertOk()
            ->assertJsonCount(1, 'data');
    }
}
