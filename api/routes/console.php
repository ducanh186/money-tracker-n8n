<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// ──────────────────────────────────────────────────────────────
// Google Sheets sync — runs every minute, caches data locally
// so FE requests never hit Google Sheets directly.
// ──────────────────────────────────────────────────────────────
Schedule::command('sheets:sync')
    ->everyMinute()
    ->withoutOverlapping()
    ->runInBackground()
    ->appendOutputTo(storage_path('logs/sheets-sync.log'));
