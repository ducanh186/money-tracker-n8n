<?php

namespace App\Services;

use App\Contracts\TransactionsRepositoryInterface;
use Google\Client as GoogleClient;
use Google\Service\Sheets as GoogleSheets;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class GoogleSheetsTransactionsRepository implements TransactionsRepositoryInterface
{
    /**
     * Expected column headers in order.
     * Must match the sheet's header row exactly.
     */
    private const HEADERS = [
        'date',
        'flow',
        'amount',
        'currency',
        'category',
        'description',
        'account',
        'jar',
        'balance',
        'month',
        'status',
        'idempotency_key',
        'note',
        'datetime',
        'time',
    ];

    private ?GoogleSheets $sheets = null;

    private string $spreadsheetId;

    private string $sheetName;

    private int $cacheTtl;

    public function __construct()
    {
        $this->spreadsheetId = config('google_sheets.spreadsheet_id');
        $this->sheetName = config('google_sheets.sheet_name');
        $this->cacheTtl = config('google_sheets.cache_ttl', 60);

        // Fail fast with clear error messages
        if (empty($this->spreadsheetId)) {
            Log::error('Google Sheets: GOOGLE_SHEETS_SPREADSHEET_ID is empty in config');
        }
    }

    /**
     * Lazily build and return the Sheets client.
     */
    private function sheets(): GoogleSheets
    {
        if ($this->sheets === null) {
            $this->sheets = $this->buildSheetsClient();
        }

        return $this->sheets;
    }

    // ------------------------------------------------------------------
    // Public API
    // ------------------------------------------------------------------

    /**
     * {@inheritDoc}
     */
    public function getByMonth(string $month): array
    {
        $cacheKey = 'sheets_month_' . md5($month);

        return Cache::remember($cacheKey, $this->cacheTtl, function () use ($month) {
            $allRows = $this->fetchAllDataRows();

            return array_values(array_filter($allRows, function (array $row) use ($month) {
                return mb_strtolower(trim($row['month'] ?? '')) === mb_strtolower(trim($month));
            }));
        });
    }

    // ------------------------------------------------------------------
    // Google Sheets client setup
    // ------------------------------------------------------------------

    private function buildSheetsClient(): GoogleSheets
    {
        $client = new GoogleClient();
        $client->setApplicationName('Money Tracker API');
        $client->setScopes([GoogleSheets::SPREADSHEETS_READONLY]);

        $credentialsConfig = config('google_sheets.credentials_json');

        if (empty($credentialsConfig)) {
            throw new \RuntimeException('Google Sheets credentials not configured.');
        }

        // Support both a file path and a raw JSON string.
        if (is_string($credentialsConfig) && is_file($credentialsConfig)) {
            $client->setAuthConfig($credentialsConfig);
        } elseif (is_string($credentialsConfig) && str_starts_with(trim($credentialsConfig), '{')) {
            $client->setAuthConfig(json_decode($credentialsConfig, true));
        } else {
            // Treat as path relative to base_path
            $absolutePath = base_path($credentialsConfig);
            if (is_file($absolutePath)) {
                $client->setAuthConfig($absolutePath);
            } else {
                $tried = [$credentialsConfig, $absolutePath];
                Log::error('Google Sheets credentials file not found', [
                    'configured_value' => $credentialsConfig,
                    'tried_paths' => $tried,
                    'base_path' => base_path(),
                    'hint' => 'Check GOOGLE_SHEETS_CREDENTIALS_JSON in .env. Docker mount should place file at /var/www/storage/app/gsheets.json',
                ]);
                throw new \RuntimeException(
                    'Google Sheets credentials file not found. Tried: ' . implode(', ', $tried) .
                    '. Set GOOGLE_SHEETS_CREDENTIALS_JSON to the correct path (e.g. /var/www/storage/app/gsheets.json).'
                );
            }
        }

        return new GoogleSheets($client);
    }

    // ------------------------------------------------------------------
    // Data fetching & parsing
    // ------------------------------------------------------------------

    /**
     * Fetch ALL data rows from the sheet (excluding header) and map to
     * associative arrays using the known header list.
     *
     * Results are cached for the configured TTL.
     *
     * @return array<int, array<string, mixed>>
     */
    private function fetchAllDataRows(): array
    {
        $cacheKey = 'sheets_all_rows';

        return Cache::remember($cacheKey, $this->cacheTtl, function () {
            try {
                $range = $this->sheetName . '!A:O'; // columns A through O (15 columns)
                $response = $this->sheets()->spreadsheets_values->get(
                    $this->spreadsheetId,
                    $range,
                    ['valueRenderOption' => 'UNFORMATTED_VALUE', 'dateTimeRenderOption' => 'FORMATTED_STRING']
                );

                $rows = $response->getValues();

                if (empty($rows)) {
                    return [];
                }

                // First row is the header — skip it.
                array_shift($rows);

                return array_map(fn (array $row) => $this->mapRowToAssoc($row), $rows);
            } catch (\Throwable $e) {
                Log::error('Google Sheets fetch failed', [
                    'message' => $e->getMessage(),
                    'spreadsheet_id' => $this->spreadsheetId,
                    'sheet_name' => $this->sheetName,
                    'exception_class' => get_class($e),
                    'trace' => $e->getTraceAsString(),
                ]);
                throw new \RuntimeException('Failed to fetch data from Google Sheets: ' . $e->getMessage());
            }
        });
    }

    /**
     * Map a positional row array to an associative array using HEADERS.
     *
     * Missing columns are filled with null; extra columns are ignored.
     */
    private function mapRowToAssoc(array $row): array
    {
        $assoc = [];

        foreach (self::HEADERS as $index => $header) {
            $value = $row[$index] ?? null;

            // Trim string values
            if (is_string($value)) {
                $value = trim($value);
                if ($value === '') {
                    $value = null;
                }
            }

            $assoc[$header] = $value;
        }

        return $assoc;
    }
}
