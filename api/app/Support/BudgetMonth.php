<?php

namespace App\Support;

use DateTimeImmutable;
use InvalidArgumentException;

final class BudgetMonth
{
    private function __construct(
        public readonly int $year,
        public readonly int $monthNum,
        private readonly DateTimeImmutable $startDate,
    ) {}

    public static function parse(string $value): self
    {
        $value = trim($value);
        if ($value === '') {
            throw new InvalidArgumentException('Month value is required.');
        }

        if (preg_match('/^(\d{4})-(\d{2})$/', $value, $matches) === 1) {
            return self::fromYearMonth((int) $matches[1], (int) $matches[2]);
        }

        if (preg_match('/^([A-Za-z]{3})-(\d{4})$/', $value, $matches) === 1) {
            $date = DateTimeImmutable::createFromFormat('!M-Y', ucfirst(strtolower($matches[1])) . '-' . $matches[2]);
            if ($date !== false) {
                return self::fromDate($date);
            }
        }

        if (preg_match('/^([A-Za-z]+)-(\d{4})$/', $value, $matches) === 1) {
            $date = DateTimeImmutable::createFromFormat('!F-Y', ucfirst(strtolower($matches[1])) . '-' . $matches[2]);
            if ($date !== false) {
                return self::fromDate($date);
            }
        }

        throw new InvalidArgumentException('Unsupported month format. Use YYYY-MM or Mon-YYYY.');
    }

    public static function fromYearMonth(int $year, int $monthNum): self
    {
        if ($monthNum < 1 || $monthNum > 12 || $year < 1) {
            throw new InvalidArgumentException('Invalid month or year.');
        }

        $date = DateTimeImmutable::createFromFormat('!Y-n-j', sprintf('%04d-%d-1', $year, $monthNum));
        if ($date === false) {
            throw new InvalidArgumentException('Invalid month value.');
        }

        return self::fromDate($date);
    }

    public static function fromDate(DateTimeImmutable $date): self
    {
        $start = $date->modify('first day of this month')->setTime(0, 0, 0);

        return new self((int) $start->format('Y'), (int) $start->format('n'), $start);
    }

    public function canonical(): string
    {
        return $this->startDate->format('M-Y');
    }

    public function iso(): string
    {
        return $this->startDate->format('Y-m');
    }

    public function start(): DateTimeImmutable
    {
        return $this->startDate;
    }

    public function end(): DateTimeImmutable
    {
        return $this->startDate->modify('last day of this month')->setTime(23, 59, 59);
    }

    public function previous(): self
    {
        return self::fromDate($this->startDate->modify('-1 month'));
    }
}
