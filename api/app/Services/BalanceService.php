<?php

namespace App\Services;

use App\Contracts\TransactionsRepositoryInterface;
use App\Support\BudgetMonth;
use App\Support\MoneyAmount;
use DateTimeImmutable;

class BalanceService
{
    public function __construct(
        private readonly TransactionsRepositoryInterface $repository,
    ) {}

    /**
     * Return continuous account balance for a month.
     *
     * @return array<string, mixed>
     */
    public function forMonth(string $monthValue): array
    {
        $month = BudgetMonth::parse($monthValue);
        $rows = $this->rowsSortedByDate($this->repository->all());

        $openingRow = null;
        $endingRow = null;
        $hasCurrentMonthRow = false;

        foreach ($rows as $row) {
            $dateTime = MoneyAmount::rowDateTime($row);
            if ($dateTime === null) {
                continue;
            }

            if ($dateTime < $month->start()) {
                $openingRow = $row;
            }

            if ($dateTime <= $month->end()) {
                $endingRow = $row;
                if ($dateTime >= $month->start()) {
                    $hasCurrentMonthRow = true;
                }
            }
        }

        $openingBalance = $openingRow === null ? 0 : MoneyAmount::balanceVnd($openingRow['balance'] ?? null);
        $endingBalance = $endingRow === null ? $openingBalance : MoneyAmount::balanceVnd($endingRow['balance'] ?? null);

        $source = $this->source($endingRow, $hasCurrentMonthRow);

        return [
            'month' => $monthValue,
            'canonical_month' => $month->canonical(),
            'month_iso' => $month->iso(),
            'as_of' => $month->start()->format(DATE_ATOM),
            'opening_balance_vnd' => $openingBalance,
            'ending_balance_vnd' => $endingBalance,
            'account_balance_vnd' => $endingBalance,
            'source' => $source,
            'accounts' => $this->accountBalances($rows, $month),
        ];
    }

    /**
     * Return balance as of a specific date/time.
     *
     * @return array<string, mixed>
     */
    public function asOf(string $dateValue): array
    {
        $asOf = new DateTimeImmutable($dateValue);
        $rows = $this->rowsSortedByDate($this->repository->all());
        $latestRow = null;

        foreach ($rows as $row) {
            $dateTime = MoneyAmount::rowDateTime($row);
            if ($dateTime !== null && $dateTime <= $asOf) {
                $latestRow = $row;
            }
        }

        $balance = $latestRow === null ? 0 : MoneyAmount::balanceVnd($latestRow['balance'] ?? null);

        return [
            'as_of' => $asOf->format(DATE_ATOM),
            'balance_vnd' => $balance,
            'account_balance_vnd' => $balance,
            'source' => $this->source($latestRow, $latestRow !== null),
        ];
    }

    /**
     * @param  array<int, array<string, mixed>>  $rows
     * @return array<int, array<string, mixed>>
     */
    private function rowsSortedByDate(array $rows): array
    {
        usort($rows, function (array $a, array $b) {
            $aTime = MoneyAmount::rowDateTime($a)?->getTimestamp() ?? PHP_INT_MIN;
            $bTime = MoneyAmount::rowDateTime($b)?->getTimestamp() ?? PHP_INT_MIN;

            return $aTime <=> $bTime;
        });

        return $rows;
    }

    /**
     * @return array<string, mixed>
     */
    private function source(?array $row, bool $isCurrentMonth): array
    {
        if ($row === null) {
            return ['type' => 'none', 'from_transaction_datetime' => null];
        }

        return [
            'type' => $isCurrentMonth ? 'current_month' : 'carry_forward',
            'from_transaction_datetime' => $row['datetime'] ?? $row['date'] ?? null,
        ];
    }

    /**
     * @param  array<int, array<string, mixed>>  $rows
     * @return array<int, array<string, mixed>>
     */
    private function accountBalances(array $rows, BudgetMonth $month): array
    {
        $accounts = [];

        foreach ($rows as $row) {
            $account = trim((string) ($row['account'] ?? ''));
            $dateTime = MoneyAmount::rowDateTime($row);
            if ($account === '' || $dateTime === null || $dateTime > $month->end()) {
                continue;
            }

            $bucket = $accounts[$account] ?? [
                'account' => $account,
                'opening_balance_vnd' => 0,
                'ending_balance_vnd' => 0,
            ];

            if ($dateTime < $month->start()) {
                $bucket['opening_balance_vnd'] = MoneyAmount::balanceVnd($row['balance'] ?? null);
            }

            $bucket['ending_balance_vnd'] = MoneyAmount::balanceVnd($row['balance'] ?? null);
            $accounts[$account] = $bucket;
        }

        return array_values($accounts);
    }
}
