<?php

namespace App\Providers;

use App\Contracts\TransactionsRepositoryInterface;
use App\Services\GoogleSheetsTransactionsRepository;
use Illuminate\Support\ServiceProvider;

class GoogleSheetsServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(
            TransactionsRepositoryInterface::class,
            GoogleSheetsTransactionsRepository::class
        );
    }
}
