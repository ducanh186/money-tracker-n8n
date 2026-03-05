<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('budget_periods', function (Blueprint $table) {
            $table->id();
            $table->string('month', 20)->unique();       // "Mar-2026"
            $table->unsignedSmallInteger('year');         // 2026
            $table->unsignedTinyInteger('month_num');     // 3
            $table->bigInteger('total_income')->default(0);
            $table->bigInteger('to_be_budgeted')->default(0); // unallocated remainder
            $table->string('status', 10)->default('draft'); // draft, active, closed
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('budget_periods');
    }
};
