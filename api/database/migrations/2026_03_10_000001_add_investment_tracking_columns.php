<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Add type to funds (sinking_fund vs investment)
        Schema::table('funds', function (Blueprint $table) {
            $table->string('type', 20)->default('sinking_fund')
                  ->after('name')
                  ->comment('sinking_fund or investment');
            $table->timestamp('last_contributed_at')->nullable()->after('notes');
        });

        // Add fund_id to budget_lines so investment lines link to their fund
        Schema::table('budget_lines', function (Blueprint $table) {
            $table->foreignId('fund_id')->nullable()->after('recurring_bill_id')
                  ->constrained()->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('budget_lines', function (Blueprint $table) {
            $table->dropConstrainedForeignId('fund_id');
        });

        Schema::table('funds', function (Blueprint $table) {
            $table->dropColumn(['type', 'last_contributed_at']);
        });
    }
};
