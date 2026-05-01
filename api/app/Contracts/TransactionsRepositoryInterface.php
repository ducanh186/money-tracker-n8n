<?php

namespace App\Contracts;

interface TransactionsRepositoryInterface
{
    /**
     * Fetch all rows for a given month from the sheet.
     *
     * @param  string  $month  e.g. "Feb-2026"
     * @return array<int, array<string, mixed>>
     */
    public function getByMonth(string $month): array;

    /**
     * Fetch every data row from the sheet.
     *
     * @return array<int, array<string, mixed>>
     */
    public function all(): array;
}
