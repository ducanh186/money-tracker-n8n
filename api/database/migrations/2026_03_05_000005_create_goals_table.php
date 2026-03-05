<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('goals', function (Blueprint $table) {
            $table->id();
            $table->string('name');                        // "Kính cận", "Quỹ du lịch"
            $table->bigInteger('target_amount');           // 1,000,000
            $table->bigInteger('current_amount')->default(0);
            $table->foreignId('jar_id')->nullable()->constrained()->nullOnDelete();
            $table->date('deadline')->nullable();
            $table->unsignedTinyInteger('priority')->default(0); // higher = more urgent
            $table->string('funding_mode', 20)->default('fund_over_time'); // fund_now, fund_over_time
            $table->string('status', 20)->default('active'); // active, completed, paused, cancelled
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('goals');
    }
};
