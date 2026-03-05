<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('recurring_bills', function (Blueprint $table) {
            $table->id();
            $table->string('name');                        // "Tiền nhà", "Internet"
            $table->bigInteger('amount');
            $table->string('frequency', 20)->default('monthly'); // monthly, quarterly, semi_annually, annually
            $table->foreignId('jar_id')->nullable()->constrained()->nullOnDelete();
            $table->unsignedTinyInteger('due_day')->nullable();  // day of month
            $table->date('next_due_date')->nullable();
            $table->string('category')->nullable();
            $table->boolean('is_active')->default(true);
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('recurring_bills');
    }
};
