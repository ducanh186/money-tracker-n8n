<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('transfers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('from_account_id')->constrained('accounts')->cascadeOnDelete();
            $table->foreignId('to_account_id')->constrained('accounts')->cascadeOnDelete();
            $table->bigInteger('amount');
            $table->foreignId('goal_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('jar_id')->nullable()->constrained()->nullOnDelete();
            $table->string('description')->nullable();
            $table->datetime('transferred_at');
            $table->foreignId('budget_period_id')->nullable()->constrained()->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transfers');
    }
};
