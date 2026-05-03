<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('jar_allocations', function (Blueprint $table) {
            $table->dropColumn(['funded_amount', 'spent_amount']);
        });
    }

    public function down(): void
    {
        Schema::table('jar_allocations', function (Blueprint $table) {
            $table->bigInteger('funded_amount')->default(0)->after('planned_amount');
            $table->bigInteger('spent_amount')->default(0)->after('committed_amount');
        });
    }
};
