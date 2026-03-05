<?php

namespace Database\Seeders;

use App\Models\Jar;
use Illuminate\Database\Seeder;

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
            Jar::updateOrCreate(
                ['key' => $jar['key']],
                $jar
            );
        }
    }
}
