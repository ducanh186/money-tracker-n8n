<?php

namespace App\Support;

use DateTimeImmutable;

final class MoneyAmount
{
    public static function parseNumeric(mixed $value): int
    {
        if (is_numeric($value)) {
            return (int) $value;
        }

        return 0;
    }

    public static function amountRaw(array $row): int
    {
        return self::parseNumeric($row['amount'] ?? null);
    }

    public static function amountSignedVnd(array $row): int
    {
        return self::amountRaw($row) * 1000;
    }

    public static function amountAbsVnd(array $row): int
    {
        return abs(self::amountSignedVnd($row));
    }

    public static function direction(array $row): string
    {
        $flow = mb_strtolower(trim((string) ($row['flow'] ?? '')));
        if (in_array($flow, ['income', 'expense', 'transfer', 'refund', 'adjustment'], true)) {
            return $flow;
        }

        $signed = self::amountSignedVnd($row);

        return match (true) {
            $signed > 0 => 'income',
            $signed < 0 => 'expense',
            default => 'adjustment',
        };
    }

    public static function signedForBudget(array $row): int
    {
        $amountAbs = self::amountAbsVnd($row);

        return match (self::direction($row)) {
            'income' => $amountAbs,
            'expense' => -$amountAbs,
            'transfer' => 0,
            'refund' => $amountAbs,
            default => self::amountSignedVnd($row),
        };
    }

    public static function balanceVnd(mixed $value): int
    {
        $raw = self::parseNumeric($value);

        if (abs($raw) >= 1_000_000) {
            return $raw;
        }

        return $raw * 1000;
    }

    public static function rowDateTime(array $row): ?DateTimeImmutable
    {
        foreach (['datetime', 'date'] as $key) {
            $value = trim((string) ($row[$key] ?? ''));
            if ($value === '') {
                continue;
            }

            try {
                return new DateTimeImmutable($value);
            } catch (\Throwable) {
                continue;
            }
        }

        return null;
    }

    public static function rowBelongsToMonth(array $row, BudgetMonth $month): bool
    {
        $rowMonth = trim((string) ($row['month'] ?? ''));
        if ($rowMonth !== '') {
            try {
                return BudgetMonth::parse($rowMonth)->iso() === $month->iso();
            } catch (\Throwable) {
                // Fall back to datetime below.
            }
        }

        $dateTime = self::rowDateTime($row);
        if ($dateTime === null) {
            return false;
        }

        return BudgetMonth::fromDate($dateTime)->iso() === $month->iso();
    }
}
