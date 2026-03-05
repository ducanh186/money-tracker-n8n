<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class RateLimitServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        // ── General API: 60 requests/min per IP ────────────────────────
        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(60)->by($request->ip());
        });

        // ── Heavy read endpoints: 20 requests/min per IP ──────────────
        // For: transactions list, budget-plan detail, exports
        RateLimiter::for('heavy-read', function (Request $request) {
            return Limit::perMinute(20)->by('heavy:' . $request->ip());
        });

        // ── Manual sync: 3 requests/min per IP ────────────────────────
        // Prevents FE bug or abuse from hammering Google Sheets
        RateLimiter::for('sync', function (Request $request) {
            return Limit::perMinute(3)->by('sync:' . $request->ip());
        });

        // ── Write operations: 30 requests/min per IP ──────────────────
        RateLimiter::for('write', function (Request $request) {
            return Limit::perMinute(30)->by('write:' . $request->ip());
        });
    }
}
