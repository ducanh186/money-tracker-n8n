<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('categories', function (Blueprint $table) {
            $table->id();
            $table->string('key', 50)->unique();
            $table->string('name', 100);
            $table->string('group', 50)->nullable();
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('category_budgets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('budget_period_id')->constrained()->cascadeOnDelete();
            $table->foreignId('category_id')->constrained()->cascadeOnDelete();
            $table->bigInteger('budgeted_amount')->default(0);
            $table->bigInteger('reserved_amount')->default(0);
            $table->bigInteger('rollover_amount')->default(0);
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['budget_period_id', 'category_id']);
        });

        Schema::create('budget_templates', function (Blueprint $table) {
            $table->id();
            $table->string('key', 50)->unique();
            $table->string('name', 100);
            $table->string('type', 50)->default('category');
            $table->boolean('is_default')->default(false);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('budget_template_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('budget_template_id')->constrained()->cascadeOnDelete();
            $table->foreignId('category_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('jar_id')->nullable()->constrained()->nullOnDelete();
            $table->decimal('percent', 5, 2)->default(0);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
        });

        $now = now();
        $categories = [
            ['key' => 'food', 'name' => 'Ăn uống', 'group' => 'needs', 'sort_order' => 10],
            ['key' => 'transport', 'name' => 'Di chuyển', 'group' => 'needs', 'sort_order' => 20],
            ['key' => 'housing', 'name' => 'Nhà ở', 'group' => 'needs', 'sort_order' => 30],
            ['key' => 'bills', 'name' => 'Hóa đơn', 'group' => 'needs', 'sort_order' => 40],
            ['key' => 'shopping', 'name' => 'Mua sắm', 'group' => 'wants', 'sort_order' => 50],
            ['key' => 'entertainment', 'name' => 'Giải trí', 'group' => 'wants', 'sort_order' => 60],
            ['key' => 'education', 'name' => 'Học tập', 'group' => 'growth', 'sort_order' => 70],
            ['key' => 'health', 'name' => 'Sức khỏe', 'group' => 'needs', 'sort_order' => 80],
            ['key' => 'saving', 'name' => 'Tiết kiệm', 'group' => 'future', 'sort_order' => 90],
            ['key' => 'investment', 'name' => 'Đầu tư', 'group' => 'future', 'sort_order' => 100],
            ['key' => 'debt', 'name' => 'Nợ', 'group' => 'obligation', 'sort_order' => 110],
            ['key' => 'other', 'name' => 'Khác', 'group' => 'other', 'sort_order' => 120],
        ];

        DB::table('categories')->insert(array_map(
            fn (array $category) => $category + ['is_active' => true, 'created_at' => $now, 'updated_at' => $now],
            $categories
        ));

        $templateId = DB::table('budget_templates')->insertGetId([
            'key' => 'six_jars',
            'name' => '6 hũ truyền thống',
            'type' => 'jar',
            'is_default' => false,
            'is_active' => true,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        $jarPercents = [
            'NEC' => 55,
            'EDU' => 10,
            'LTSS' => 10,
            'PLAY' => 10,
            'FFA' => 10,
            'GIVE' => 5,
        ];

        $jars = DB::table('jars')->whereIn('key', array_keys($jarPercents))->pluck('id', 'key');
        $items = [];
        $sort = 10;
        foreach ($jarPercents as $key => $percent) {
            if (!isset($jars[$key])) {
                continue;
            }

            $items[] = [
                'budget_template_id' => $templateId,
                'jar_id' => $jars[$key],
                'category_id' => null,
                'percent' => $percent,
                'sort_order' => $sort,
                'created_at' => $now,
                'updated_at' => $now,
            ];
            $sort += 10;
        }

        if ($items !== []) {
            DB::table('budget_template_items')->insert($items);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('budget_template_items');
        Schema::dropIfExists('budget_templates');
        Schema::dropIfExists('category_budgets');
        Schema::dropIfExists('categories');
    }
};
