<?php

namespace App\Support;

class TransactionFilters
{
    public const LOAN_JAR = 'LOAN';

    public static function isLoan(array $row): bool
    {
        return mb_strtoupper(trim((string)($row['jar'] ?? ''))) === self::LOAN_JAR;
    }
}
