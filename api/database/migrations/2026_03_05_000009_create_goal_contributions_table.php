<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('goal_contributions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('goal_id')->constrained()->cascadeOnDelete();
            $table->foreignId('budget_period_id')->nullable()->constrained()->nullOnDelete();
            $table->bigInteger('amount');
            $table->foreignId('source_jar_id')->nullable()->constrained('jars')->nullOnDelete();
            $table->text('notes')->nullable();
            $table->datetime('contributed_at');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('goal_contributions');
    }
};
