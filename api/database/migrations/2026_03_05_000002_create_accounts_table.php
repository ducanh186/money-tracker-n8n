<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('accounts', function (Blueprint $table) {
            $table->id();
            $table->string('name');                       // "VCB Chính", "Tiền mặt"
            $table->string('type', 20)->default('checking'); // checking, savings, cash, ewallet, investment
            $table->string('institution')->nullable();    // "Vietcombank", "MB Bank"
            $table->bigInteger('balance')->default(0);    // in VND
            $table->string('currency', 3)->default('VND');
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('accounts');
    }
};
