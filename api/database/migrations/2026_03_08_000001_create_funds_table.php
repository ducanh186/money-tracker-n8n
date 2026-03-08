<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('funds', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->foreignId('jar_id')->constrained()->cascadeOnDelete();
            $table->foreignId('goal_id')->nullable()->constrained()->nullOnDelete();
            $table->bigInteger('target_amount')->default(0);
            $table->bigInteger('reserved_amount')->default(0);
            $table->bigInteger('spent_amount')->default(0);
            $table->bigInteger('monthly_reserve')->default(0)->comment('Auto-reserve amount per month');
            $table->enum('status', ['active', 'completed', 'paused'])->default('active');
            $table->text('notes')->nullable();
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('funds');
    }
};
