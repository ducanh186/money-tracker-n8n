<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('jar_allocations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('budget_period_id')->constrained()->cascadeOnDelete();
            $table->foreignId('jar_id')->constrained()->cascadeOnDelete();
            $table->decimal('percent_override', 5, 2)->nullable(); // null → use jar default
            $table->bigInteger('planned_amount')->default(0);
            $table->bigInteger('funded_amount')->default(0);       // actually funded so far
            $table->timestamps();

            $table->unique(['budget_period_id', 'jar_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('jar_allocations');
    }
};
