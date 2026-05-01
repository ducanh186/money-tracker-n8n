<?php

namespace Tests\Feature;

use App\Contracts\TransactionsRepositoryInterface;
use Tests\TestCase;

class BalanceApiTest extends TestCase
{
    public function test_month_without_transactions_carries_forward_previous_balance(): void
    {
        $rows = [
            [
                'date' => '2026-04-30',
                'flow' => 'expense',
                'amount' => -100,
                'account' => 'Bank',
                'balance' => 8200,
                'month' => 'Apr-2026',
                'datetime' => '2026-04-30 23:00:00',
            ],
        ];

        $this->bindRows($rows);

        $response = $this->getJson('/api/balances?month=2026-05');

        $response->assertOk()
            ->assertJsonPath('data.month', '2026-05')
            ->assertJsonPath('data.opening_balance_vnd', 8_200_000)
            ->assertJsonPath('data.ending_balance_vnd', 8_200_000)
            ->assertJsonPath('data.account_balance_vnd', 8_200_000)
            ->assertJsonPath('data.source.type', 'carry_forward')
            ->assertJsonPath('data.source.from_transaction_datetime', '2026-04-30 23:00:00');
    }

    public function test_month_with_transactions_uses_latest_balance_in_month(): void
    {
        $rows = [
            [
                'account' => 'Bank',
                'balance' => 8200,
                'month' => 'Apr-2026',
                'datetime' => '2026-04-30 23:00:00',
            ],
            [
                'account' => 'Bank',
                'balance' => 7600,
                'month' => 'May-2026',
                'datetime' => '2026-05-12 09:00:00',
            ],
            [
                'account' => 'Bank',
                'balance' => 7800,
                'month' => 'May-2026',
                'datetime' => '2026-05-20 18:00:00',
            ],
        ];

        $this->bindRows($rows);

        $response = $this->getJson('/api/balances?month=May-2026');

        $response->assertOk()
            ->assertJsonPath('data.opening_balance_vnd', 8_200_000)
            ->assertJsonPath('data.ending_balance_vnd', 7_800_000)
            ->assertJsonPath('data.account_balance_vnd', 7_800_000)
            ->assertJsonPath('data.source.type', 'current_month');
    }

    public function test_month_without_any_rows_returns_zero_balances(): void
    {
        $this->bindRows([]);

        $response = $this->getJson('/api/balances?month=2026-05');

        $response->assertOk()
            ->assertJsonPath('data.opening_balance_vnd', 0)
            ->assertJsonPath('data.ending_balance_vnd', 0)
            ->assertJsonPath('data.account_balance_vnd', 0)
            ->assertJsonPath('data.source.type', 'none');
    }

    private function bindRows(array $rows): void
    {
        $this->app->instance(TransactionsRepositoryInterface::class, new class($rows) implements TransactionsRepositoryInterface {
            public function __construct(private readonly array $rows)
            {
            }

            public function getByMonth(string $month): array
            {
                return array_values(array_filter($this->rows, fn (array $row) => ($row['month'] ?? null) === $month));
            }

            public function all(): array
            {
                return $this->rows;
            }
        });
    }
}
