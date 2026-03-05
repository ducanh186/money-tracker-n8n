<?php

namespace Tests\Feature;

use App\Models\Goal;
use App\Models\Jar;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class GoalApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\JarSeeder::class);
    }

    public function test_create_goal(): void
    {
        $necJar = Jar::where('key', 'NEC')->first();

        $response = $this->postJson('/api/goals', [
            'name'          => 'Kính cận',
            'target_amount' => 1_000_000,
            'jar_id'        => $necJar->id,
            'deadline'      => '2026-04-01',
            'funding_mode'  => 'fund_over_time',
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.name', 'Kính cận')
            ->assertJsonPath('data.target_amount', 1_000_000)
            ->assertJsonPath('data.status', 'active');
    }

    public function test_list_goals(): void
    {
        $jar = Jar::where('key', 'NEC')->first();
        Goal::create([
            'name' => 'Kính cận', 'target_amount' => 1_000_000,
            'jar_id' => $jar->id, 'status' => 'active',
        ]);
        Goal::create([
            'name' => 'Quỹ du lịch', 'target_amount' => 5_000_000,
            'jar_id' => $jar->id, 'status' => 'active',
        ]);

        $response = $this->getJson('/api/goals');

        $response->assertOk()
            ->assertJsonCount(2, 'data');
    }

    public function test_contribute_to_goal(): void
    {
        $jar = Jar::where('key', 'NEC')->first();
        $goal = Goal::create([
            'name' => 'Kính cận', 'target_amount' => 1_000_000,
            'jar_id' => $jar->id, 'status' => 'active',
        ]);

        // First contribution
        $response = $this->postJson("/api/goals/{$goal->id}/contribute", [
            'amount'        => 500_000,
            'source_jar_id' => $jar->id,
        ]);

        $response->assertCreated()
            ->assertJsonPath('goal.current_amount', 500_000)
            ->assertJsonPath('goal.status', 'active');

        // Second contribution — completes goal
        $response2 = $this->postJson("/api/goals/{$goal->id}/contribute", [
            'amount'        => 500_000,
            'source_jar_id' => $jar->id,
        ]);

        $response2->assertCreated()
            ->assertJsonPath('goal.current_amount', 1_000_000)
            ->assertJsonPath('goal.status', 'completed');
    }

    public function test_show_goal_with_contributions(): void
    {
        $jar = Jar::where('key', 'NEC')->first();
        $goal = Goal::create([
            'name' => 'Kính cận', 'target_amount' => 1_000_000,
            'jar_id' => $jar->id, 'status' => 'active',
        ]);

        $this->postJson("/api/goals/{$goal->id}/contribute", [
            'amount' => 300_000,
            'source_jar_id' => $jar->id,
        ]);

        $response = $this->getJson("/api/goals/{$goal->id}");

        $response->assertOk()
            ->assertJsonPath('data.current_amount', 300_000)
            ->assertJsonPath('data.shortfall', 700_000)
            ->assertJsonCount(1, 'data.contributions');
    }

    public function test_update_goal(): void
    {
        $jar = Jar::where('key', 'NEC')->first();
        $goal = Goal::create([
            'name' => 'Kính cận', 'target_amount' => 1_000_000,
            'jar_id' => $jar->id, 'status' => 'active',
        ]);

        $response = $this->putJson("/api/goals/{$goal->id}", [
            'priority' => 5,
            'status'   => 'paused',
        ]);

        $response->assertOk()
            ->assertJsonPath('data.priority', 5)
            ->assertJsonPath('data.status', 'paused');
    }

    public function test_delete_goal(): void
    {
        $goal = Goal::create([
            'name' => 'Test', 'target_amount' => 100_000, 'status' => 'active',
        ]);

        $response = $this->deleteJson("/api/goals/{$goal->id}");

        $response->assertOk();
        $this->assertDatabaseMissing('goals', ['id' => $goal->id]);
    }
}
