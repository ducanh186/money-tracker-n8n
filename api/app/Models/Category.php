<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Category extends Model
{
    private const SHEET_CATEGORIES = [
        ['key' => 'Relocation Setup', 'name' => 'Relocation Setup', 'group' => 'LTSS', 'sort_order' => 10],
        ['key' => 'Visa & Paperwork', 'name' => 'Visa & Paperwork', 'group' => 'LTSS', 'sort_order' => 20],
        ['key' => 'Flights', 'name' => 'Flights', 'group' => 'LTSS', 'sort_order' => 30],
        ['key' => 'Move-in Rent', 'name' => 'Move-in Rent', 'group' => 'LTSS', 'sort_order' => 40],
        ['key' => 'Gold Transfer', 'name' => 'Gold Transfer', 'group' => 'FFA', 'sort_order' => 50],
        ['key' => 'Index Investment', 'name' => 'Index Investment', 'group' => 'FFA', 'sort_order' => 60],
        ['key' => 'Savings Transfer', 'name' => 'Savings Transfer', 'group' => 'FFA', 'sort_order' => 70],
        ['key' => 'Long-term Investment', 'name' => 'Long-term Investment', 'group' => 'FFA', 'sort_order' => 80],
        ['key' => 'Family Support', 'name' => 'Family Support', 'group' => 'GIVE', 'sort_order' => 90],
        ['key' => 'Fuel', 'name' => 'Fuel', 'group' => 'NEC', 'sort_order' => 100],
        ['key' => 'Phone & Data', 'name' => 'Phone & Data', 'group' => 'NEC', 'sort_order' => 110],
        ['key' => 'Groceries', 'name' => 'Groceries', 'group' => 'NEC', 'sort_order' => 120],
        ['key' => 'Transport', 'name' => 'Transport', 'group' => 'NEC', 'sort_order' => 130],
        ['key' => 'Healthcare', 'name' => 'Healthcare', 'group' => 'NEC', 'sort_order' => 140],
        ['key' => 'Subscriptions', 'name' => 'Subscriptions', 'group' => 'NEC', 'sort_order' => 150],
        ['key' => 'Transfer', 'name' => 'Transfer', 'group' => 'NEC', 'sort_order' => 160],
        ['key' => 'Uncategorized', 'name' => 'Uncategorized', 'group' => 'NEC', 'sort_order' => 170],
        ['key' => 'Pet Care', 'name' => 'Pet Care', 'group' => 'NEC', 'sort_order' => 180],
        ['key' => 'Clothing & Grooming', 'name' => 'Clothing & Grooming', 'group' => 'NEC', 'sort_order' => 190],
        ['key' => 'Learning Materials', 'name' => 'Learning Materials', 'group' => 'EDU', 'sort_order' => 200],
        ['key' => 'Certification Fees', 'name' => 'Certification Fees', 'group' => 'EDU', 'sort_order' => 210],
        ['key' => 'Courses', 'name' => 'Courses', 'group' => 'EDU', 'sort_order' => 220],
        ['key' => 'Tuition', 'name' => 'Tuition', 'group' => 'EDU', 'sort_order' => 230],
        ['key' => 'Snacks & Drinks', 'name' => 'Snacks & Drinks', 'group' => 'PLAY', 'sort_order' => 240],
        ['key' => 'Leisure & Social', 'name' => 'Leisure & Social', 'group' => 'PLAY', 'sort_order' => 250],
        ['key' => 'Date', 'name' => 'Date', 'group' => 'PLAY', 'sort_order' => 260],
        ['key' => 'Salary', 'name' => 'Salary', 'group' => 'INCOME', 'sort_order' => 270],
        ['key' => 'Side Income', 'name' => 'Side Income', 'group' => 'INCOME', 'sort_order' => 280],
        ['key' => 'Refund', 'name' => 'Refund', 'group' => 'INCOME', 'sort_order' => 290],
        ['key' => 'Interest Income', 'name' => 'Interest Income', 'group' => 'INCOME', 'sort_order' => 300],
        ['key' => 'Transfer In', 'name' => 'Transfer In', 'group' => 'INCOME', 'sort_order' => 310],
        ['key' => 'Gift Income', 'name' => 'Gift Income', 'group' => 'INCOME', 'sort_order' => 320],
        ['key' => 'Loan In', 'name' => 'Loan In', 'group' => 'LOAN', 'sort_order' => 330],
        ['key' => 'Loan Repayment', 'name' => 'Loan Repayment', 'group' => 'LOAN', 'sort_order' => 340],
        ['key' => 'Loan Out', 'name' => 'Loan Out', 'group' => 'LOAN', 'sort_order' => 350],
        ['key' => 'Loan Recovery', 'name' => 'Loan Recovery', 'group' => 'LOAN', 'sort_order' => 360],
    ];

    protected $fillable = [
        'key',
        'name',
        'group',
        'sort_order',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'sort_order' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    public function categoryBudgets(): HasMany
    {
        return $this->hasMany(CategoryBudget::class);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeOrdered($query)
    {
        return $query->orderBy('sort_order')->orderBy('name');
    }

    public static function sheetDefinitions(): array
    {
        return self::SHEET_CATEGORIES;
    }

    public static function normalizeKey(?string $value): string
    {
        $cleaned = self::cleanValue($value);
        if ($cleaned === '') {
            return 'Uncategorized';
        }

        $normalized = self::normalizeLookupValue($cleaned);
        $lookup = self::sheetLookup();

        return $lookup[$normalized] ?? $cleaned;
    }

    private static function sheetLookup(): array
    {
        static $lookup = null;

        if ($lookup !== null) {
            return $lookup;
        }

        $lookup = [];

        foreach (self::sheetDefinitions() as $category) {
            foreach (array_unique([$category['key'], $category['name']]) as $alias) {
                $lookup[self::normalizeLookupValue($alias)] = $category['key'];
            }
        }

        return $lookup;
    }

    private static function cleanValue(?string $value): string
    {
        return preg_replace('/\s+/u', ' ', trim((string) $value)) ?: '';
    }

    private static function normalizeLookupValue(?string $value): string
    {
        $normalized = mb_strtolower(self::cleanValue($value));
        $normalized = strtr($normalized, [
            'à' => 'a', 'á' => 'a', 'ạ' => 'a', 'ả' => 'a', 'ã' => 'a',
            'â' => 'a', 'ầ' => 'a', 'ấ' => 'a', 'ậ' => 'a', 'ẩ' => 'a', 'ẫ' => 'a',
            'ă' => 'a', 'ằ' => 'a', 'ắ' => 'a', 'ặ' => 'a', 'ẳ' => 'a', 'ẵ' => 'a',
            'è' => 'e', 'é' => 'e', 'ẹ' => 'e', 'ẻ' => 'e', 'ẽ' => 'e',
            'ê' => 'e', 'ề' => 'e', 'ế' => 'e', 'ệ' => 'e', 'ể' => 'e', 'ễ' => 'e',
            'ì' => 'i', 'í' => 'i', 'ị' => 'i', 'ỉ' => 'i', 'ĩ' => 'i',
            'ò' => 'o', 'ó' => 'o', 'ọ' => 'o', 'ỏ' => 'o', 'õ' => 'o',
            'ô' => 'o', 'ồ' => 'o', 'ố' => 'o', 'ộ' => 'o', 'ổ' => 'o', 'ỗ' => 'o',
            'ơ' => 'o', 'ờ' => 'o', 'ớ' => 'o', 'ợ' => 'o', 'ở' => 'o', 'ỡ' => 'o',
            'ù' => 'u', 'ú' => 'u', 'ụ' => 'u', 'ủ' => 'u', 'ũ' => 'u',
            'ư' => 'u', 'ừ' => 'u', 'ứ' => 'u', 'ự' => 'u', 'ử' => 'u', 'ữ' => 'u',
            'ỳ' => 'y', 'ý' => 'y', 'ỵ' => 'y', 'ỷ' => 'y', 'ỹ' => 'y',
            'đ' => 'd',
        ]);

        return preg_replace('/\s+/u', ' ', $normalized) ?: '';
    }
}
