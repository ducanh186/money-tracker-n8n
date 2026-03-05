<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('debts', function (Blueprint $table) {
            $table->id();
            $table->string('name');                        // "Trả góp Laptop", "Credit card"
            $table->bigInteger('total_amount');
            $table->bigInteger('remaining_amount');
            $table->decimal('interest_rate', 5, 2)->default(0); // annual %
            $table->bigInteger('minimum_payment')->default(0);
            $table->unsignedTinyInteger('due_day_of_month')->nullable(); // 1-31
            $table->string('strategy', 15)->default('snowball'); // snowball, avalanche
            $table->string('status', 15)->default('active');     // active, paid_off, defaulted
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('debts');
    }
};
