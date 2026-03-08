<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('budget_periods', function (Blueprint $table) {
            $table->string('rollover_policy')->default('keep_in_jar')
                  ->comment('keep_in_jar|push_to_ffa|push_to_fund|reset')
                  ->after('status');
        });

        Schema::table('jar_allocations', function (Blueprint $table) {
            $table->bigInteger('committed_amount')->default(0)
                  ->comment('Reserved for funds/goals')
                  ->after('funded_amount');
            $table->bigInteger('spent_amount')->default(0)
                  ->comment('Actually spent')
                  ->after('committed_amount');
            $table->bigInteger('rollover_amount')->default(0)
                  ->comment('Carried over from previous month')
                  ->after('spent_amount');
        });
    }

    public function down(): void
    {
        Schema::table('budget_periods', function (Blueprint $table) {
            $table->dropColumn('rollover_policy');
        });

        Schema::table('jar_allocations', function (Blueprint $table) {
            $table->dropColumn(['committed_amount', 'spent_amount', 'rollover_amount']);
        });
    }
};
