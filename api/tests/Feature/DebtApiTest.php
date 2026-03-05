<?php

namespace Tests\Feature;

use App\Models\Debt;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DebtApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_create_debt(): void
    {
        $response = $this->postJson('/api/debts', [
            'name'             => 'Trả góp Laptop',
            'total_amount'     => 15_000_000,
            'remaining_amount' => 12_000_000,
            'interest_rate'    => 12.5,
            'minimum_payment'  => 2_000_000,
            'due_day_of_month' => 15,
            'strategy'         => 'snowball',
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.name', 'Trả góp Laptop')
            ->assertJsonPath('data.status', 'active');
    }

    public function test_list_debts_with_summary(): void
    {
        Debt::create([
            'name' => 'Laptop', 'total_amount' => 15_000_000,
            'remaining_amount' => 12_000_000, 'minimum_payment' => 2_000_000,
            'status' => 'active',
        ]);
        Debt::create([
            'name' => 'Credit card', 'total_amount' => 5_000_000,
            'remaining_amount' => 3_000_000, 'minimum_payment' => 500_000,
            'status' => 'active',
        ]);

        $response = $this->getJson('/api/debts');

        $response->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('summary.total_debt', 15_000_000)
            ->assertJsonPath('summary.total_minimum', 2_500_000)
            ->assertJsonPath('summary.count_active', 2);
    }

    public function test_pay_debt(): void
    {
        $debt = Debt::create([
            'name' => 'Laptop', 'total_amount' => 15_000_000,
            'remaining_amount' => 5_000_000, 'minimum_payment' => 2_000_000,
            'status' => 'active',
        ]);

        $response = $this->postJson("/api/debts/{$debt->id}/pay", [
            'amount'    => 2_000_000,
            'principal' => 1_800_000,
            'interest'  => 200_000,
        ]);

        $response->assertCreated()
            ->assertJsonPath('debt.remaining_amount', 3_200_000);
    }

    public function test_pay_off_debt(): void
    {
        $debt = Debt::create([
            'name' => 'Small debt', 'total_amount' => 1_000_000,
            'remaining_amount' => 500_000, 'status' => 'active',
        ]);

        $response = $this->postJson("/api/debts/{$debt->id}/pay", [
            'amount'    => 500_000,
            'principal' => 500_000,
            'interest'  => 0,
        ]);

        $response->assertCreated()
            ->assertJsonPath('debt.remaining_amount', 0)
            ->assertJsonPath('debt.status', 'paid_off');
    }

    public function test_show_debt_with_payments(): void
    {
        $debt = Debt::create([
            'name' => 'Laptop', 'total_amount' => 15_000_000,
            'remaining_amount' => 10_000_000, 'status' => 'active',
        ]);

        $this->postJson("/api/debts/{$debt->id}/pay", [
            'amount' => 2_000_000, 'principal' => 2_000_000,
        ]);

        $response = $this->getJson("/api/debts/{$debt->id}");

        $response->assertOk()
            ->assertJsonCount(1, 'data.payments');
    }
}
