<?php

/**
 * Budget Plan Configuration
 * 
 * Kế hoạch chi tiêu theo % lương gốc (hệ thống 6 hũ).
 * base_income: thu nhập gốc mỗi tháng (VND).
 * jars: mỗi hũ có key (viết tắt), label tiếng Việt, và phần trăm ngân sách.
 * thresholds: ngưỡng cảnh báo (usage_pct).
 */

return [
    'base_income' => (int) env('BUDGET_BASE_INCOME', 13_600_000),

    'jars' => [
        'NEC'  => ['label' => 'Thiết yếu',            'percent' => 15],
        'EDU'  => ['label' => 'Giáo dục',             'percent' => 10],
        'LTSS' => ['label' => 'Tiết kiệm dài hạn',   'percent' => 15],
        'PLAY' => ['label' => 'Hưởng thụ',            'percent' => 20],
        'FFA'  => ['label' => 'Tự do tài chính',      'percent' => 10],
        'GIVE' => ['label' => 'Cho đi',               'percent' => 30],
    ],

    'thresholds' => [
        'ok_max'   => 80,   // <= 80%  → OK
        'warn_max' => 100,  // 80-100% → WARN
                            // > 100%  → OVER
    ],
];
