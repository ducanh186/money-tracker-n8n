<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('budget_lines', function (Blueprint $table) {
            $table->id();
            $table->foreignId('jar_allocation_id')->constrained()->cascadeOnDelete();
            $table->string('name');                        // "Kính cận", "Tiền nhà", "Trả nợ laptop"
            $table->string('type', 20)->default('general'); // general, goal, bill, debt, sinking_fund
            $table->bigInteger('planned_amount')->default(0);
            $table->bigInteger('actual_amount')->default(0);
            $table->foreignId('goal_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('debt_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('recurring_bill_id')->nullable()->constrained()->nullOnDelete();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('budget_lines');
    }
};
