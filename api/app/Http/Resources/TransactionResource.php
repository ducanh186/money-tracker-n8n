<?php

namespace App\Http\Resources;

use App\Support\MoneyAmount;
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

        $amountRaw = MoneyAmount::amountRaw($row);
        $amountSignedVnd = MoneyAmount::amountSignedVnd($row);
        $amountAbsVnd = MoneyAmount::amountAbsVnd($row);
        $direction = MoneyAmount::direction($row);
        $signedAmountVnd = MoneyAmount::signedForBudget($row);

        $balanceRaw = MoneyAmount::parseNumeric($row['balance'] ?? null);
        $balanceVnd = MoneyAmount::balanceVnd($row['balance'] ?? null);

        $datetimeIso = self::toIso8601($row['datetime'] ?? null);

        return [
            'date'              => $row['date'] ?? null,
            'flow'              => $row['flow'] ?? null,
            'amount_k'          => $amountRaw,
            'amount_raw'        => $amountRaw,
            'amount_vnd'        => $amountAbsVnd,
            'amount_vnd_signed' => $amountSignedVnd,
            'amount_vnd_abs'    => $amountAbsVnd,
            'signed_amount_vnd' => $signedAmountVnd,
            'direction'         => $direction,
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
        return MoneyAmount::parseNumeric($value);
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
        return MoneyAmount::signedForBudget($row);
    }
}
