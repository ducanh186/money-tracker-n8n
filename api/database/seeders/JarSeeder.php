<?php

namespace Database\Seeders;

use App\Models\Jar;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class JarSeeder extends Seeder
{
    /**
     * Seed the default 6 jars.
     */
    public function run(): void
    {
        $jars = [
            ['key' => 'NEC',  'label' => 'Thiết yếu',          'percent' => 15, 'sort_order' => 1],
            ['key' => 'EDU',  'label' => 'Giáo dục',           'percent' => 10, 'sort_order' => 2],
            ['key' => 'LTSS', 'label' => 'Tiết kiệm dài hạn', 'percent' => 15, 'sort_order' => 3],
            ['key' => 'PLAY', 'label' => 'Hưởng thụ',          'percent' => 20, 'sort_order' => 4],
            ['key' => 'FFA',  'label' => 'Tự do tài chính',    'percent' => 10, 'sort_order' => 5],
            ['key' => 'GIVE', 'label' => 'Cho đi',             'percent' => 30, 'sort_order' => 6],
        ];

        foreach ($jars as $jar) {
            // Only set defaults on first creation — never overwrite user-edited values
            Jar::firstOrCreate(
                ['key' => $jar['key']],
                $jar
            );
        }

        $this->ensureSixJarTemplateItems();
    }

    private function ensureSixJarTemplateItems(): void
    {
        if (!Schema::hasTable('budget_templates') || !Schema::hasTable('budget_template_items')) {
            return;
        }

        $template = DB::table('budget_templates')->where('key', 'six_jars')->first();
        if (!$template) {
            return;
        }

        $jarPercents = [
            'NEC' => 55,
            'EDU' => 10,
            'LTSS' => 10,
            'PLAY' => 10,
            'FFA' => 10,
            'GIVE' => 5,
        ];

        $jars = DB::table('jars')->whereIn('key', array_keys($jarPercents))->pluck('id', 'key');
        $sort = 10;
        $now = now();

        foreach ($jarPercents as $key => $percent) {
            if (!isset($jars[$key])) {
                continue;
            }

            DB::table('budget_template_items')->updateOrInsert(
                ['budget_template_id' => $template->id, 'jar_id' => $jars[$key]],
                [
                    'category_id' => null,
                    'percent' => $percent,
                    'sort_order' => $sort,
                    'updated_at' => $now,
                    'created_at' => $now,
                ]
            );
            $sort += 10;
        }
    }
}
