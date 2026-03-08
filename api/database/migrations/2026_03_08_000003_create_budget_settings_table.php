<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('budget_settings', function (Blueprint $table) {
            $table->id();
            $table->string('month')->unique()->comment('e.g. Mar-2026');
            $table->bigInteger('base_income_override')->nullable()->comment('Custom base income for this month');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('budget_settings');
    }
};
