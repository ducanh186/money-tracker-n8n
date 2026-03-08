<?php

namespace App\Http\Controllers\Api;

use App\Contracts\TransactionsRepositoryInterface;
use App\Http\Resources\TransactionResource;
use App\Models\Jar;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Cache;

class TransactionsController extends Controller
{
    private ?array $jarAliasMap = null;

    public function __construct(
        private readonly TransactionsRepositoryInterface $repository,
    ) {}

    // ------------------------------------------------------------------
    // GET /api/transactions
    // ------------------------------------------------------------------

    public function index(Request $request): JsonResponse
    {
        // 1. Validate required params ------------------------------------------------
        $month = $request->query('month');

        if (empty($month)) {
            return response()->json([
                'error'   => 'validation_error',
                'message' => 'The "month" query parameter is required (e.g. "Feb-2026").',
            ], 400);
        }

        // 2. Optional filters --------------------------------------------------------
        $flow     = $request->query('flow');
        $jar      = $request->query('jar');
        $status   = $request->query('status');
        $search   = $request->query('q');
        $page     = max(1, (int) ($request->query('page', 1)));
        $pageSize = min(200, max(1, (int) ($request->query('pageSize', 50))));
        $sort     = $request->query('sort', 'datetime_desc');

        // 3. Build a unique cache key for this exact request -------------------------
        $cacheKey = 'txn_' . md5(implode('|', [
            $month, $flow, $jar, $status, $search, $page, $pageSize, $sort,
        ]));

        $cached = Cache::get($cacheKey);
        if ($cached !== null) {
            return response()->json($cached);
        }

        // 4. Fetch rows for the month ------------------------------------------------
        try {
            $rows = $this->repository->getByMonth($month);
        } catch (\Throwable $e) {
            return response()->json([
                'error'   => 'sheets_error',
                'message' => 'Could not fetch transactions. Please try again later.',
            ], 500);
        }

        // 5. In-memory filtering ------------------------------------------------------
        $rows = $this->applyFilters($rows, $flow, $jar, $status, $search);

        // 6. Sort --------------------------------------------------------------------
        $rows = $this->applySort($rows, $sort);

        // 7. Compute totals BEFORE pagination ----------------------------------------
        $totals = $this->computeTotals($rows);

        // 8. Paginate ----------------------------------------------------------------
        $total      = count($rows);
        $offset     = ($page - 1) * $pageSize;
        $pageSlice  = array_slice($rows, $offset, $pageSize);

        // 9. Transform ---------------------------------------------------------------
        $data = TransactionResource::collection(collect($pageSlice))->resolve();

        // 10. Build response ----------------------------------------------------------
        $payload = [
            'data' => $data,
            'meta' => [
                'page'     => $page,
                'pageSize' => $pageSize,
                'total'    => $total,
                'totals'   => $totals,
            ],
        ];

        Cache::put($cacheKey, $payload, config('google_sheets.cache_ttl', 60));

        return response()->json($payload);
    }

    // ------------------------------------------------------------------
    // GET /api/transactions/{idempotencyKey}
    // ------------------------------------------------------------------

    public function show(Request $request, string $idempotencyKey): JsonResponse
    {
        // Validate that the month context is present OR search across all months.
        // For single-row lookup we search the whole sheet via a special month fetch.
        // To keep it simple, iterate all months — but the repo caches the full sheet
        // anyway, so we rely on a separate helper that scans all rows.

        $cacheKey = 'txn_detail_' . md5($idempotencyKey);
        $cached = Cache::get($cacheKey);

        if ($cached !== null) {
            return response()->json(['data' => $cached]);
        }

        try {
            // We need all rows; use a blank month that won't match, then scan raw.
            // Better: add a dedicated method. For now, fetch all via month trick.
            $allRows = $this->findByIdempotencyKey($idempotencyKey);
        } catch (\Throwable $e) {
            return response()->json([
                'error'   => 'sheets_error',
                'message' => 'Could not fetch transaction. Please try again later.',
            ], 500);
        }

        if ($allRows === null) {
            return response()->json([
                'error'   => 'not_found',
                'message' => "Transaction with idempotency_key \"{$idempotencyKey}\" not found.",
            ], 404);
        }

        $data = (new TransactionResource($allRows))->resolve();

        Cache::put($cacheKey, $data, config('google_sheets.cache_ttl', 60));

        return response()->json(['data' => $data]);
    }

    // ------------------------------------------------------------------
    // Private helpers
    // ------------------------------------------------------------------

    private function applyFilters(array $rows, ?string $flow, ?string $jar, ?string $status, ?string $search): array
    {
        return array_values(array_filter($rows, function (array $row) use ($flow, $jar, $status, $search) {
            if ($flow !== null && mb_strtolower($row['flow'] ?? '') !== mb_strtolower($flow)) {
                return false;
            }

            if ($jar !== null && ! $this->matchesJarFilter($row['jar'] ?? null, $jar)) {
                return false;
            }

            if ($status !== null && mb_strtolower($row['status'] ?? '') !== mb_strtolower($status)) {
                return false;
            }

            if ($search !== null && $search !== '') {
                $needle = mb_strtolower($search);
                $haystack = mb_strtolower(
                    ($row['description'] ?? '') . ' ' .
                    ($row['note'] ?? '') . ' ' .
                    ($row['account'] ?? '')
                );

                if (mb_strpos($haystack, $needle) === false) {
                    return false;
                }
            }

            return true;
        }));
    }

    private function applySort(array $rows, string $sort): array
    {
        // Supported: datetime_asc, datetime_desc (default)
        $desc = ! str_ends_with($sort, '_asc');

        usort($rows, function (array $a, array $b) use ($desc) {
            $dtA = $a['datetime'] ?? '';
            $dtB = $b['datetime'] ?? '';

            $cmp = strcmp($dtA, $dtB);

            return $desc ? -$cmp : $cmp;
        });

        return $rows;
    }

    private function computeTotals(array $rows): array
    {
        $incomeVnd  = 0;
        $expenseVnd = 0;

        foreach ($rows as $row) {
            $amountK   = TransactionResource::parseNumeric($row['amount'] ?? null);
            $amountVnd = abs($amountK) * 1000;
            $flow      = mb_strtolower(trim($row['flow'] ?? ''));

            if ($flow === 'income') {
                $incomeVnd += $amountVnd;
            } elseif ($flow === 'expense') {
                $expenseVnd += $amountVnd;
            }
        }

        // Ending balance: pick the latest row by datetime
        $endingBalanceVnd = null;
        $latestDatetime   = '';

        foreach ($rows as $row) {
            $dt = $row['datetime'] ?? '';
            if ($dt > $latestDatetime) {
                $latestDatetime   = $dt;
                $endingBalanceVnd = TransactionResource::parseNumeric($row['balance'] ?? null) * 1000;
            }
        }

        return [
            'income_vnd'         => $incomeVnd,
            'expense_vnd'        => $expenseVnd,
            'net_vnd'            => $incomeVnd - $expenseVnd,
            'ending_balance_vnd' => $endingBalanceVnd,
        ];
    }

    /**
     * Match jar filter by key OR label to support both FE and sheet values.
     */
    private function matchesJarFilter(?string $rowJar, string $filter): bool
    {
        $rowJarNorm = $this->normalizeToken($rowJar);
        $filterNorm = $this->normalizeToken($filter);

        if ($filterNorm === '') {
            return true;
        }

        if ($rowJarNorm === $filterNorm) {
            return true;
        }

        if ($rowJarNorm === '') {
            return false;
        }

        $aliases = $this->jarAliases();

        if (! isset($aliases[$filterNorm])) {
            return false;
        }

        return in_array($rowJarNorm, $aliases[$filterNorm], true);
    }

    private function jarAliases(): array
    {
        if ($this->jarAliasMap !== null) {
            return $this->jarAliasMap;
        }

        $map = [];

        foreach (Jar::query()->select(['key', 'label'])->get() as $jar) {
            $tokens = array_values(array_filter([
                $this->normalizeToken($jar->key),
                $this->normalizeToken($jar->label),
            ]));

            if ($tokens === []) {
                continue;
            }

            $tokens = array_values(array_unique($tokens));

            foreach ($tokens as $token) {
                $map[$token] = isset($map[$token])
                    ? array_values(array_unique(array_merge($map[$token], $tokens)))
                    : $tokens;
            }
        }

        $this->jarAliasMap = $map;

        return $this->jarAliasMap;
    }

    private function normalizeToken(?string $value): string
    {
        return mb_strtolower(trim((string) $value));
    }

    /**
     * Scan all sheet rows for a row matching the given idempotency_key.
     */
    private function findByIdempotencyKey(string $key): ?array
    {
        // The repository is designed to fetch by month, but we need a global scan.
        // We'll fetch all rows via the underlying cache (sheets_all_rows) which is
        // already populated after any getByMonth call. For a direct lookup we
        // trigger a month fetch with a wildcard-like approach.
        //
        // Better approach: allow repository to expose all rows.
        // For now, leverage reflection / known cache key.
        $allRows = Cache::get('sheets_all_rows');

        if ($allRows === null) {
            // Force-populate the cache by fetching a dummy month
            // (the underlying fetchAllDataRows caches everything).
            $this->repository->getByMonth('__force_cache__');
            $allRows = Cache::get('sheets_all_rows') ?? [];
        }

        foreach ($allRows as $row) {
            if (($row['idempotency_key'] ?? '') === $key) {
                return $row;
            }
        }

        return null;
    }
}
