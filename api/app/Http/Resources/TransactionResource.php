<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TransactionResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $row = $this->resource; // associative array from repository

        $amountK = self::parseNumeric($row['amount'] ?? null);
        $amountVnd = abs($amountK) * 1000;

        $flow = mb_strtolower(trim($row['flow'] ?? ''));

        $signedAmountVnd = match ($flow) {
            'expense'  => -$amountVnd,
            'income'   => $amountVnd,
            'transfer' => 0,
            default    => 0,
        };

        $balanceRaw = self::parseNumeric($row['balance'] ?? null);
        // balance is stored in "k" (thousands) just like amount.
        $balanceVnd = $balanceRaw * 1000;

        $datetimeIso = self::toIso8601($row['datetime'] ?? null);

        return [
            'date'              => $row['date'] ?? null,
            'flow'              => $row['flow'] ?? null,
            'amount_k'          => $amountK,
            'amount_vnd'        => $amountVnd,
            'signed_amount_vnd' => $signedAmountVnd,
            'currency'          => $row['currency'] ?? null,
            'category'          => $row['category'] ?? null,
            'description'       => $row['description'] ?? null,
            'account'           => $row['account'] ?? null,
            'jar'               => $row['jar'] ?? null,
            'balance'           => $balanceRaw,
            'balance_vnd'       => $balanceVnd,
            'month'             => $row['month'] ?? null,
            'status'            => $row['status'] ?? null,
            'idempotency_key'   => $row['idempotency_key'] ?? null,
            'note'              => $row['note'] ?? null,
            'datetime'          => $row['datetime'] ?? null,
            'datetime_iso'      => $datetimeIso,
            'time'              => $row['time'] ?? null,
        ];
    }

    // ------------------------------------------------------------------
    // Helpers
    // ------------------------------------------------------------------

    /**
     * Safely parse a numeric value from a sheet cell.
     */
    public static function parseNumeric(mixed $value): int
    {
        if (is_numeric($value)) {
            return (int) $value;
        }

        return 0;
    }

    /**
     * Convert "YYYY-MM-DD HH:MM:SS" string to ISO 8601.
     */
    public static function toIso8601(?string $datetime): ?string
    {
        if (empty($datetime)) {
            return null;
        }

        try {
            return (new \DateTimeImmutable($datetime))->format(\DateTimeInterface::ATOM);
        } catch (\Throwable) {
            return null;
        }
    }

    /**
     * Return signed_amount_vnd for a raw row (used in summary calculations).
     */
    public static function signedAmountVnd(array $row): int
    {
        $amountK = self::parseNumeric($row['amount'] ?? null);
        $amountVnd = abs($amountK) * 1000;
        $flow = mb_strtolower(trim($row['flow'] ?? ''));

        return match ($flow) {
            'expense'  => -$amountVnd,
            'income'   => $amountVnd,
            'transfer' => 0,
            default    => 0,
        };
    }
}
