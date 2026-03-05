<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('scenarios', function (Blueprint $table) {
            $table->id();
            $table->foreignId('budget_period_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name');                        // "Mua kính cận"
            $table->text('description')->nullable();
            $table->bigInteger('purchase_amount');
            $table->foreignId('target_jar_id')->nullable()->constrained('jars')->nullOnDelete();
            $table->json('proposals')->nullable();          // array of allocation proposals
            $table->json('impact')->nullable();             // impact analysis on all jars
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('scenarios');
    }
};
