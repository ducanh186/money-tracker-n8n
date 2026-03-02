<?php

namespace Tests\Feature;

use App\Contracts\TransactionsRepositoryInterface;
use Tests\TestCase;

class TransactionsApiTest extends TestCase
{
    /**
     * Sample rows returned by the mocked repository.
     */
    private function sampleRows(): array
    {
        return [
            [
                'date'            => '2026-02-19',
                'flow'            => 'income',
                'amount'          => 5000,
                'currency'        => 'VND',
                'category'        => 'Salary',
                'description'     => 'Monthly salary',
                'account'         => 'Bank A',
                'jar'             => 'Necessities',
                'balance'         => 15000000,
                'month'           => 'Feb-2026',
                'status'          => 'confirmed',
                'idempotency_key' => 'txn_001',
                'note'            => 'Feb salary',
                'datetime'        => '2026-02-19 10:00:00',
                'time'            => '10:00',
            ],
            [
                'date'            => '2026-02-20',
                'flow'            => 'expense',
                'amount'          => 200,
                'currency'        => 'VND',
                'category'        => 'Food',
                'description'     => 'Lunch at restaurant',
                'account'         => 'Cash',
                'jar'             => 'Necessities',
                'balance'         => 14800000,
                'month'           => 'Feb-2026',
                'status'          => 'confirmed',
                'idempotency_key' => 'txn_002',
                'note'            => null,
                'datetime'        => '2026-02-20 12:30:00',
                'time'            => '12:30',
            ],
            [
                'date'            => '2026-02-21',
                'flow'            => 'expense',
                'amount'          => 100,
                'currency'        => 'VND',
                'category'        => 'Transport',
                'description'     => 'Grab ride home',
                'account'         => 'Bank A',
                'jar'             => 'Freedom',
                'balance'         => 14700000,
                'month'           => 'Feb-2026',
                'status'          => 'pending',
                'idempotency_key' => 'txn_003',
                'note'            => 'Late night ride',
                'datetime'        => '2026-02-21 23:48:36',
                'time'            => '23:48',
            ],
            [
                'date'            => '2026-02-22',
                'flow'            => 'transfer',
                'amount'          => 500,
                'currency'        => 'VND',
                'category'        => 'Transfer',
                'description'     => 'Move to savings',
                'account'         => 'Bank A',
                'jar'             => 'Long-term Savings',
                'balance'         => 14700000,
                'month'           => 'Feb-2026',
                'status'          => 'confirmed',
                'idempotency_key' => 'txn_004',
                'note'            => null,
                'datetime'        => '2026-02-22 09:00:00',
                'time'            => '09:00',
            ],
        ];
    }

    /**
     * Bind a mock repository that returns the sample rows.
     */
    private function mockRepository(array $rows = null): void
    {
        $rows = $rows ?? $this->sampleRows();

        $mock = $this->createMock(TransactionsRepositoryInterface::class);
        $mock->method('getByMonth')->willReturn($rows);

        $this->app->instance(TransactionsRepositoryInterface::class, $mock);

        // Pre-populate the cache key used by findByIdempotencyKey in the controller.
        cache()->put('sheets_all_rows', $rows, 120);
    }

    // =================================================================
    // GET /api/transactions
    // =================================================================

    public function test_index_requires_month_param(): void
    {
        $this->mockRepository();

        $response = $this->getJson('/api/transactions');

        $response->assertStatus(400)
            ->assertJsonFragment(['error' => 'validation_error']);
    }

    public function test_index_returns_all_rows_for_month(): void
    {
        $this->mockRepository();

        $response = $this->getJson('/api/transactions?month=Feb-2026');

        $response->assertStatus(200)
            ->assertJsonCount(4, 'data')
            ->assertJsonPath('meta.total', 4)
            ->assertJsonPath('meta.page', 1)
            ->assertJsonPath('meta.pageSize', 50);
    }

    public function test_index_filters_by_flow(): void
    {
        $this->mockRepository();

        $response = $this->getJson('/api/transactions?month=Feb-2026&flow=expense');

        $response->assertStatus(200)
            ->assertJsonCount(2, 'data');

        foreach ($response->json('data') as $row) {
            $this->assertEquals('expense', $row['flow']);
        }
    }

    public function test_index_filters_by_jar(): void
    {
        $this->mockRepository();

        $response = $this->getJson('/api/transactions?month=Feb-2026&jar=Freedom');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.jar', 'Freedom');
    }

    public function test_index_filters_by_status(): void
    {
        $this->mockRepository();

        $response = $this->getJson('/api/transactions?month=Feb-2026&status=pending');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.status', 'pending');
    }

    public function test_index_search_keyword(): void
    {
        $this->mockRepository();

        $response = $this->getJson('/api/transactions?month=Feb-2026&q=lunch');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.description', 'Lunch at restaurant');
    }

    public function test_index_search_in_note(): void
    {
        $this->mockRepository();

        $response = $this->getJson('/api/transactions?month=Feb-2026&q=late+night');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.idempotency_key', 'txn_003');
    }

    public function test_index_search_in_account(): void
    {
        $this->mockRepository();

        $response = $this->getJson('/api/transactions?month=Feb-2026&q=Cash');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.account', 'Cash');
    }

    public function test_index_pagination(): void
    {
        $this->mockRepository();

        $response = $this->getJson('/api/transactions?month=Feb-2026&pageSize=2&page=1');

        $response->assertStatus(200)
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('meta.total', 4)
            ->assertJsonPath('meta.page', 1)
            ->assertJsonPath('meta.pageSize', 2);

        $page2 = $this->getJson('/api/transactions?month=Feb-2026&pageSize=2&page=2');

        $page2->assertStatus(200)
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('meta.page', 2);
    }

    public function test_index_sort_asc(): void
    {
        $this->mockRepository();

        $response = $this->getJson('/api/transactions?month=Feb-2026&sort=datetime_asc');

        $response->assertStatus(200);

        $data = $response->json('data');
        $this->assertEquals('txn_001', $data[0]['idempotency_key']);
        $this->assertEquals('txn_004', $data[3]['idempotency_key']);
    }

    public function test_index_sort_desc_default(): void
    {
        $this->mockRepository();

        $response = $this->getJson('/api/transactions?month=Feb-2026');

        $response->assertStatus(200);

        $data = $response->json('data');
        // desc: latest first
        $this->assertEquals('txn_004', $data[0]['idempotency_key']);
        $this->assertEquals('txn_001', $data[3]['idempotency_key']);
    }

    public function test_index_amount_conversion(): void
    {
        $this->mockRepository();

        $response = $this->getJson('/api/transactions?month=Feb-2026&flow=income');

        $response->assertStatus(200);

        $row = $response->json('data.0');
        $this->assertEquals(5000, $row['amount_k']);
        $this->assertEquals(5000000, $row['amount_vnd']);
        $this->assertEquals(5000000, $row['signed_amount_vnd']);
    }

    public function test_index_expense_signed_amount(): void
    {
        $this->mockRepository();

        $response = $this->getJson('/api/transactions?month=Feb-2026&flow=expense');

        $response->assertStatus(200);

        foreach ($response->json('data') as $row) {
            $this->assertLessThan(0, $row['signed_amount_vnd']);
        }
    }

    public function test_index_transfer_signed_amount_is_zero(): void
    {
        $this->mockRepository();

        $response = $this->getJson('/api/transactions?month=Feb-2026&flow=transfer');

        $response->assertStatus(200);
        $this->assertEquals(0, $response->json('data.0.signed_amount_vnd'));
    }

    public function test_index_totals(): void
    {
        $this->mockRepository();

        $response = $this->getJson('/api/transactions?month=Feb-2026');

        $response->assertStatus(200);

        $totals = $response->json('meta.totals');

        // income: 5000 * 1000 = 5_000_000
        $this->assertEquals(5000000, $totals['income_vnd']);

        // expense: (200 + 100) * 1000 = 300_000
        $this->assertEquals(300000, $totals['expense_vnd']);

        // net: 5_000_000 - 300_000 = 4_700_000
        $this->assertEquals(4700000, $totals['net_vnd']);

        // ending_balance: latest tx (txn_004 at 2026-02-22 09:00:00) has balance 14700000
        $this->assertEquals(14700000, $totals['ending_balance_vnd']);
    }

    public function test_index_datetime_iso(): void
    {
        $this->mockRepository();

        $response = $this->getJson('/api/transactions?month=Feb-2026&flow=income');

        $response->assertStatus(200);
        $this->assertNotNull($response->json('data.0.datetime_iso'));
        $this->assertStringContainsString('2026-02-19', $response->json('data.0.datetime_iso'));
    }

    // =================================================================
    // GET /api/transactions/{idempotencyKey}
    // =================================================================

    public function test_show_returns_single_transaction(): void
    {
        $this->mockRepository();

        $response = $this->getJson('/api/transactions/txn_002');

        $response->assertStatus(200)
            ->assertJsonPath('data.idempotency_key', 'txn_002')
            ->assertJsonPath('data.description', 'Lunch at restaurant')
            ->assertJsonPath('data.amount_k', 200)
            ->assertJsonPath('data.amount_vnd', 200000);
    }

    public function test_show_returns_404_for_unknown_key(): void
    {
        $this->mockRepository();

        $response = $this->getJson('/api/transactions/nonexistent_key');

        $response->assertStatus(404)
            ->assertJsonFragment(['error' => 'not_found']);
    }

    // =================================================================
    // Defensive parsing
    // =================================================================

    public function test_missing_fields_default_to_null(): void
    {
        $rows = [
            [
                'date'            => null,
                'flow'            => null,
                'amount'          => null,
                'currency'        => null,
                'category'        => null,
                'description'     => null,
                'account'         => null,
                'jar'             => null,
                'balance'         => null,
                'month'           => 'Feb-2026',
                'status'          => null,
                'idempotency_key' => 'txn_null',
                'note'            => null,
                'datetime'        => null,
                'time'            => null,
            ],
        ];
        $this->mockRepository($rows);

        $response = $this->getJson('/api/transactions?month=Feb-2026');

        $response->assertStatus(200);
        $data = $response->json('data.0');
        $this->assertNull($data['date']);
        $this->assertEquals(0, $data['amount_k']);
        $this->assertEquals(0, $data['amount_vnd']);
        $this->assertNull($data['datetime_iso']);
    }

    public function test_invalid_amount_treated_as_zero(): void
    {
        $rows = [
            [
                'date'            => '2026-02-19',
                'flow'            => 'income',
                'amount'          => 'not_a_number',
                'currency'        => 'VND',
                'category'        => 'Test',
                'description'     => 'Bad amount',
                'account'         => 'Bank',
                'jar'             => 'Test',
                'balance'         => 'also_bad',
                'month'           => 'Feb-2026',
                'status'          => 'confirmed',
                'idempotency_key' => 'txn_bad',
                'note'            => null,
                'datetime'        => '2026-02-19 10:00:00',
                'time'            => '10:00',
            ],
        ];
        $this->mockRepository($rows);

        $response = $this->getJson('/api/transactions?month=Feb-2026');

        $response->assertStatus(200);
        $this->assertEquals(0, $response->json('data.0.amount_k'));
        $this->assertEquals(0, $response->json('data.0.amount_vnd'));
        $this->assertEquals(0, $response->json('data.0.balance_vnd'));
    }

    public function test_combined_filters(): void
    {
        $this->mockRepository();

        $response = $this->getJson('/api/transactions?month=Feb-2026&flow=expense&status=confirmed');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.idempotency_key', 'txn_002');
    }

    public function test_page_size_capped_at_200(): void
    {
        $this->mockRepository();

        $response = $this->getJson('/api/transactions?month=Feb-2026&pageSize=999');

        $response->assertStatus(200)
            ->assertJsonPath('meta.pageSize', 200);
    }
}
