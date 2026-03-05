<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Google Service Account Credentials
    |--------------------------------------------------------------------------
    |
    | Path to the JSON key file, or a raw JSON string.
    |
    */
    'credentials_json' => env('GOOGLE_SHEETS_CREDENTIALS_JSON', ''),

    /*
    |--------------------------------------------------------------------------
    | Spreadsheet ID
    |--------------------------------------------------------------------------
    |
    | The ID from the Google Sheets URL.
    |
    */
    'spreadsheet_id' => env('GOOGLE_SHEETS_SPREADSHEET_ID', ''),

    /*
    |--------------------------------------------------------------------------
    | Sheet (tab) name
    |--------------------------------------------------------------------------
    */
    'sheet_name' => env('GOOGLE_SHEETS_SHEET_NAME', 'TRANSACTIONS_LOG'),

    /*
    |--------------------------------------------------------------------------
    | Cache TTL (seconds)
    |--------------------------------------------------------------------------
    | Since sheets:sync runs every minute, we keep data cached for 3 minutes.
    | FE reads always hit this cache — never Google Sheets directly.
    */
    'cache_ttl' => (int) env('GOOGLE_SHEETS_CACHE_TTL', 180),

];
