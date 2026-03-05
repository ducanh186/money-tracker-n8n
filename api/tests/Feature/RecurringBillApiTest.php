<?php

namespace Tests\Feature;

use App\Models\Jar;
use App\Models\RecurringBill;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RecurringBillApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\JarSeeder::class);
    }

    public function test_create_recurring_bill(): void
    {
        $jar = Jar::where('key', 'NEC')->first();

        $response = $this->postJson('/api/recurring-bills', [
            'name'          => 'Tiền nhà',
            'amount'        => 3_000_000,
            'frequency'     => 'monthly',
            'jar_id'        => $jar->id,
            'due_day'       => 5,
            'next_due_date' => '2026-04-05',
            'category'      => 'Housing',
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.name', 'Tiền nhà');
    }

    public function test_list_bills_with_summary(): void
    {
        $jar = Jar::where('key', 'NEC')->first();

        RecurringBill::create([
            'name' => 'Tiền nhà', 'amount' => 3_000_000,
            'frequency' => 'monthly', 'jar_id' => $jar->id, 'is_active' => true,
        ]);
        RecurringBill::create([
            'name' => 'Internet', 'amount' => 200_000,
            'frequency' => 'monthly', 'jar_id' => $jar->id, 'is_active' => true,
        ]);
        RecurringBill::create([
            'name' => 'Bảo hiểm', 'amount' => 6_000_000,
            'frequency' => 'annually', 'jar_id' => $jar->id, 'is_active' => true,
        ]);

        $response = $this->getJson('/api/recurring-bills');

        $response->assertOk()
            ->assertJsonCount(3, 'data');

        // Total monthly: 3M + 200k + 6M/12=500k = 3,700,000
        $this->assertEquals(3_700_000, $response->json('summary.total_monthly_forecast'));
    }

    public function test_due_soon(): void
    {
        $jar = Jar::where('key', 'NEC')->first();

        RecurringBill::create([
            'name' => 'Tiền nhà', 'amount' => 3_000_000,
            'frequency' => 'monthly', 'jar_id' => $jar->id,
            'next_due_date' => now()->addDays(3), 'is_active' => true,
        ]);
        RecurringBill::create([
            'name' => 'Internet', 'amount' => 200_000,
            'frequency' => 'monthly', 'jar_id' => $jar->id,
            'next_due_date' => now()->addDays(30), 'is_active' => true,
        ]);

        $response = $this->getJson('/api/recurring-bills/due-soon?days=7');

        $response->assertOk()
            ->assertJsonCount(1, 'data');
    }
}
