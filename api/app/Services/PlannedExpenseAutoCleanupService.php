<?php

namespace App\Services;

use App\Models\BudgetLine;
use App\Models\BudgetPeriod;
use App\Models\Jar;
use App\Models\JarAllocation;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PlannedExpenseAutoCleanupService
{
    private const SIMILARITY_THRESHOLD = 60.0;
    private const MIN_NOTE_LENGTH = 3;

    /**
     * @param  array<int, array<string, mixed>>  $rows
     * @return array{
     *   notes_checked:int,
     *   matches_found:int,
     *   deleted_lines:int,
     *   months_affected:array<int, string>,
     *   threshold:float
     * }
     */
    public function cleanupFromSheetRows(array $rows): array
    {
        $candidates = $this->collectCandidates($rows);

        if ($candidates === []) {
            return $this->buildResult(0, 0, 0, []);
        }

        $jarTokenToId = $this->buildJarTokenMap();
        $periodsByMonth = BudgetPeriod::query()
            ->whereIn('month', array_keys($candidates))
            ->where('status', '!=', 'closed')
            ->get()
            ->keyBy('month');

        $notesChecked = 0;
        $matchesFound = 0;
        $lineIdsByAllocation = [];
        $affectedMonths = [];

        foreach ($candidates as $month => $jarCandidates) {
            /** @var BudgetPeriod|null $period */
            $period = $periodsByMonth->get($month);
            if (! $period) {
                continue;
            }

            $allocationsByJar = JarAllocation::query()
                ->where('budget_period_id', $period->id)
                ->with(['budgetLines:id,jar_allocation_id,name'])
                ->get()
                ->keyBy('jar_id');

            foreach ($jarCandidates as $jarToken => $notes) {
                $jarId = $jarTokenToId[$jarToken] ?? null;
                if (! $jarId) {
                    continue;
                }

                /** @var JarAllocation|null $allocation */
                $allocation = $allocationsByJar->get($jarId);
                if (! $allocation || $allocation->budgetLines->isEmpty()) {
                    continue;
                }

                $reservedLineIds = array_fill_keys($lineIdsByAllocation[$allocation->id] ?? [], true);

                foreach ($notes as $note) {
                    $notesChecked++;

                    [$lineId, $score] = $this->findBestMatchLineId(
                        $note,
                        $allocation->budgetLines,
                        $reservedLineIds
                    );

                    if ($lineId === null || $score <= self::SIMILARITY_THRESHOLD) {
                        continue;
                    }

                    $lineIdsByAllocation[$allocation->id][] = $lineId;
                    $reservedLineIds[$lineId] = true;
                    $matchesFound++;
                    $affectedMonths[$month] = true;
                }
            }
        }

        if ($lineIdsByAllocation === []) {
            return $this->buildResult($notesChecked, $matchesFound, 0, []);
        }

        $deletedLineCount = $this->deleteMatchedLines($lineIdsByAllocation);
        $monthsAffected = array_values(array_keys($affectedMonths));
        $this->forgetBudgetCaches($monthsAffected);

        if ($deletedLineCount > 0) {
            Log::info('Planned expense auto cleanup completed', [
                'notes_checked' => $notesChecked,
                'matches_found' => $matchesFound,
                'deleted_lines' => $deletedLineCount,
                'months_affected' => $monthsAffected,
                'threshold' => self::SIMILARITY_THRESHOLD,
            ]);
        }

        return $this->buildResult($notesChecked, $matchesFound, $deletedLineCount, $monthsAffected);
    }

    /**
     * @param  array<int, array<string, mixed>>  $rows
     * @return array<string, array<string, array<int, string>>>
     */
    private function collectCandidates(array $rows): array
    {
        $bucket = [];

        foreach ($rows as $row) {
            if (! is_array($row)) {
                continue;
            }

            $flow = mb_strtolower(trim((string) ($row['flow'] ?? '')));
            if ($flow !== 'expense') {
                continue;
            }

            $month = trim((string) ($row['month'] ?? ''));
            $jar = $this->normalizeText((string) ($row['jar'] ?? ''));
            $note = $this->normalizeText((string) ($row['note'] ?? ''));

            if ($month === '' || $jar === '' || $note === '' || mb_strlen($note) < self::MIN_NOTE_LENGTH) {
                continue;
            }

            $bucket[$month][$jar][$note] = true;
        }

        $result = [];
        foreach ($bucket as $month => $jarMap) {
            foreach ($jarMap as $jar => $notesMap) {
                $result[$month][$jar] = array_keys($notesMap);
            }
        }

        return $result;
    }

    /**
     * @return array<string, int>
     */
    private function buildJarTokenMap(): array
    {
        $map = [];

        foreach (Jar::query()->select(['id', 'key', 'label'])->get() as $jar) {
            foreach ([$jar->key, $jar->label] as $token) {
                $normalized = $this->normalizeText((string) $token);
                if ($normalized === '' || isset($map[$normalized])) {
                    continue;
                }
                $map[$normalized] = $jar->id;
            }
        }

        return $map;
    }

    /**
     * @param  Collection<int, BudgetLine>  $lines
     * @param  array<int, bool>  $reservedLineIds
     * @return array{0:int|null, 1:float}
     */
    private function findBestMatchLineId(string $note, Collection $lines, array $reservedLineIds): array
    {
        $bestLineId = null;
        $bestScore = 0.0;

        foreach ($lines as $line) {
            if (isset($reservedLineIds[$line->id])) {
                continue;
            }

            $score = $this->similarityPercent($note, (string) $line->name);
            if ($score <= $bestScore) {
                continue;
            }

            $bestScore = $score;
            $bestLineId = $line->id;
        }

        return [$bestLineId, $bestScore];
    }

    /**
     * @param  array<int, array<int, int>>  $lineIdsByAllocation
     */
    private function deleteMatchedLines(array $lineIdsByAllocation): int
    {
        $deletedLineCount = 0;

        DB::transaction(function () use ($lineIdsByAllocation, &$deletedLineCount): void {
            foreach ($lineIdsByAllocation as $allocationId => $lineIds) {
                $lineIds = array_values(array_unique($lineIds));
                if ($lineIds === []) {
                    continue;
                }

                $existingIds = BudgetLine::query()
                    ->where('jar_allocation_id', $allocationId)
                    ->whereIn('id', $lineIds)
                    ->pluck('id')
                    ->all();

                if ($existingIds === []) {
                    continue;
                }

                BudgetLine::query()
                    ->whereIn('id', $existingIds)
                    ->delete();

                $deletedLineCount += count($existingIds);

                JarAllocation::query()
                    ->whereKey($allocationId)
                    ->update([
                        'committed_amount' => (int) BudgetLine::query()
                            ->where('jar_allocation_id', $allocationId)
                            ->whereIn('type', BudgetLine::RESERVED_TYPES)
                            ->sum('planned_amount'),
                    ]);
            }
        });

        return $deletedLineCount;
    }

    /**
     * @param  array<int, string>  $months
     */
    private function forgetBudgetCaches(array $months): void
    {
        foreach ($months as $month) {
            Cache::forget('budget_status_' . md5($month));
            Cache::forget('budget_plan_' . md5($month));
            Cache::forget('dashboard_summary_' . md5($month));
        }
    }

    private function normalizeText(string $value): string
    {
        $normalized = mb_strtolower(trim($value));
        if ($normalized === '') {
            return '';
        }

        $transliterated = @iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $normalized);
        if (is_string($transliterated) && $transliterated !== '') {
            $normalized = $transliterated;
        }

        $normalized = preg_replace('/[^a-z0-9\s]/', ' ', $normalized) ?? $normalized;
        $normalized = preg_replace('/\s+/', ' ', trim($normalized)) ?? trim($normalized);

        return $normalized;
    }

    private function similarityPercent(string $left, string $right): float
    {
        $left = $this->normalizeText($left);
        $right = $this->normalizeText($right);

        if ($left === '' || $right === '') {
            return 0.0;
        }

        similar_text($left, $right, $charScore);

        $leftTokens = array_values(array_filter(explode(' ', $left)));
        $rightTokens = array_values(array_filter(explode(' ', $right)));
        $leftTokens = array_values(array_unique($leftTokens));
        $rightTokens = array_values(array_unique($rightTokens));

        $tokenScore = 0.0;
        if ($leftTokens !== [] && $rightTokens !== []) {
            $shared = array_intersect($leftTokens, $rightTokens);
            $tokenScore = (count($shared) / max(count($leftTokens), count($rightTokens))) * 100;
        }

        $containScore = 0.0;
        if (str_contains($left, $right) || str_contains($right, $left)) {
            $containScore = (min(mb_strlen($left), mb_strlen($right)) / max(mb_strlen($left), mb_strlen($right))) * 100;
        }

        return max($charScore, $tokenScore, $containScore);
    }

    /**
     * @param  array<int, string>  $monthsAffected
     * @return array{
     *   notes_checked:int,
     *   matches_found:int,
     *   deleted_lines:int,
     *   months_affected:array<int, string>,
     *   threshold:float
     * }
     */
    private function buildResult(
        int $notesChecked,
        int $matchesFound,
        int $deletedLines,
        array $monthsAffected
    ): array {
        return [
            'notes_checked' => $notesChecked,
            'matches_found' => $matchesFound,
            'deleted_lines' => $deletedLines,
            'months_affected' => $monthsAffected,
            'threshold' => self::SIMILARITY_THRESHOLD,
        ];
    }
}
