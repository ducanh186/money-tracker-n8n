<?php

namespace Tests\Feature;

use App\Models\Account;
use App\Models\Goal;
use App\Models\Jar;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TransferApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\JarSeeder::class);
    }

    public function test_create_transfer_updates_balances(): void
    {
        $vcb = Account::create([
            'name' => 'VCB', 'type' => 'checking', 'balance' => 50_000_000,
        ]);
        $savings = Account::create([
            'name' => 'Savings', 'type' => 'savings', 'balance' => 10_000_000,
        ]);

        $response = $this->postJson('/api/transfers', [
            'from_account_id' => $vcb->id,
            'to_account_id'   => $savings->id,
            'amount'          => 5_000_000,
            'description'     => 'Monthly savings transfer',
        ]);

        $response->assertCreated();

        $this->assertEquals(45_000_000, $vcb->fresh()->balance);
        $this->assertEquals(15_000_000, $savings->fresh()->balance);
    }

    public function test_transfer_linked_to_goal(): void
    {
        $vcb = Account::create([
            'name' => 'VCB', 'type' => 'checking', 'balance' => 50_000_000,
        ]);
        $savings = Account::create([
            'name' => 'Savings', 'type' => 'savings', 'balance' => 10_000_000,
        ]);

        $jar = Jar::where('key', 'LTSS')->first();
        $goal = Goal::create([
            'name' => 'Quỹ du lịch', 'target_amount' => 10_000_000,
            'jar_id' => $jar->id, 'status' => 'active',
        ]);

        $response = $this->postJson('/api/transfers', [
            'from_account_id' => $vcb->id,
            'to_account_id'   => $savings->id,
            'amount'          => 3_000_000,
            'goal_id'         => $goal->id,
            'jar_id'          => $jar->id,
            'description'     => 'Góp quỹ du lịch',
        ]);

        $response->assertCreated();

        // Goal should be updated
        $this->assertEquals(3_000_000, $goal->fresh()->current_amount);
        // Contribution should be recorded
        $this->assertDatabaseCount('goal_contributions', 1);
    }

    public function test_transfer_cannot_be_same_account(): void
    {
        $account = Account::create([
            'name' => 'VCB', 'type' => 'checking', 'balance' => 50_000_000,
        ]);

        $response = $this->postJson('/api/transfers', [
            'from_account_id' => $account->id,
            'to_account_id'   => $account->id,
            'amount'          => 1_000_000,
        ]);

        $response->assertStatus(422);
    }

    public function test_list_transfers(): void
    {
        $vcb = Account::create([
            'name' => 'VCB', 'type' => 'checking', 'balance' => 50_000_000,
        ]);
        $savings = Account::create([
            'name' => 'Savings', 'type' => 'savings', 'balance' => 10_000_000,
        ]);

        $this->postJson('/api/transfers', [
            'from_account_id' => $vcb->id,
            'to_account_id'   => $savings->id,
            'amount'          => 1_000_000,
        ]);

        $response = $this->getJson('/api/transfers');

        $response->assertOk()
            ->assertJsonCount(1, 'data');
    }
}
