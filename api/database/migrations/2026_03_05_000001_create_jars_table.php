<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('jars', function (Blueprint $table) {
            $table->id();
            $table->string('key', 10)->unique();        // NEC, EDU, LTSS, PLAY, FFA, GIVE
            $table->string('label');                      // Thiết yếu, Giáo dục, ...
            $table->decimal('percent', 5, 2);            // 15.00, 10.00, ...
            $table->unsignedInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('jars');
    }
};
