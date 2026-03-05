<?php

namespace Tests\Feature;

use App\Models\Account;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AccountApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_create_account(): void
    {
        $response = $this->postJson('/api/accounts', [
            'name'        => 'VCB Chính',
            'type'        => 'checking',
            'institution' => 'Vietcombank',
            'balance'     => 50_000_000,
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.name', 'VCB Chính')
            ->assertJsonPath('data.balance', 50_000_000);
    }

    public function test_list_accounts(): void
    {
        Account::factory()->count(3)->create();

        $response = $this->getJson('/api/accounts');

        $response->assertOk()
            ->assertJsonCount(3, 'data');
    }

    public function test_update_account(): void
    {
        $account = Account::factory()->create(['balance' => 10_000_000]);

        $response = $this->putJson("/api/accounts/{$account->id}", [
            'balance' => 15_000_000,
        ]);

        $response->assertOk()
            ->assertJsonPath('data.balance', 15_000_000);
    }

    public function test_delete_account(): void
    {
        $account = Account::factory()->create();

        $response = $this->deleteJson("/api/accounts/{$account->id}");

        $response->assertOk();
        $this->assertDatabaseMissing('accounts', ['id' => $account->id]);
    }

    public function test_net_worth(): void
    {
        Account::factory()->create(['balance' => 50_000_000]);
        Account::factory()->create(['balance' => 30_000_000]);

        $response = $this->getJson('/api/accounts/net-worth');

        $response->assertOk()
            ->assertJsonPath('net_worth', 80_000_000)
            ->assertJsonCount(2, 'accounts');
    }
}
