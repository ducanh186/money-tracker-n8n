<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Add priority + creditor to debts
        Schema::table('debts', function (Blueprint $table) {
            $table->unsignedTinyInteger('priority')->default(0)->after('strategy');
            $table->string('creditor', 255)->nullable()->after('name');
        });

        // Add salary lifecycle fields to budget_periods
        Schema::table('budget_periods', function (Blueprint $table) {
            $table->date('salary_received_at')->nullable()->after('notes');
            $table->date('allocation_locked_at')->nullable()->after('salary_received_at');
        });
    }

    public function down(): void
    {
        Schema::table('debts', function (Blueprint $table) {
            $table->dropColumn(['priority', 'creditor']);
        });
        Schema::table('budget_periods', function (Blueprint $table) {
            $table->dropColumn(['salary_received_at', 'allocation_locked_at']);
        });
    }
};
