<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Category extends Model
{
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

    public static function normalizeKey(?string $value): string
    {
        $normalized = mb_strtolower(trim((string) $value));
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
        $normalized = preg_replace('/\s+/u', ' ', $normalized) ?: '';

        return match (true) {
            $normalized === '' => 'other',
            str_contains($normalized, 'an uong') || str_contains($normalized, 'food') || str_contains($normalized, 'meal') || str_contains($normalized, 'coffee') => 'food',
            str_contains($normalized, 'di chuyen') || str_contains($normalized, 'xang') || str_contains($normalized, 'grab') || str_contains($normalized, 'transport') => 'transport',
            str_contains($normalized, 'nha') || str_contains($normalized, 'rent') || str_contains($normalized, 'housing') => 'housing',
            str_contains($normalized, 'hoa don') || str_contains($normalized, 'bill') || str_contains($normalized, 'dien') || str_contains($normalized, 'nuoc') || str_contains($normalized, 'internet') => 'bills',
            str_contains($normalized, 'mua sam') || str_contains($normalized, 'shopping') => 'shopping',
            str_contains($normalized, 'giai tri') || str_contains($normalized, 'play') || str_contains($normalized, 'entertain') => 'entertainment',
            str_contains($normalized, 'hoc') || str_contains($normalized, 'edu') || str_contains($normalized, 'course') => 'education',
            str_contains($normalized, 'suc khoe') || str_contains($normalized, 'health') || str_contains($normalized, 'thuoc') => 'health',
            str_contains($normalized, 'tiet kiem') || str_contains($normalized, 'saving') => 'saving',
            str_contains($normalized, 'dau tu') || str_contains($normalized, 'investment') || str_contains($normalized, 'invest') => 'investment',
            str_contains($normalized, 'no') || str_contains($normalized, 'debt') || str_contains($normalized, 'loan') => 'debt',
            default => self::keyExists($normalized) ? $normalized : 'other',
        };
    }

    private static function keyExists(string $key): bool
    {
        return in_array($key, [
            'food',
            'transport',
            'housing',
            'bills',
            'shopping',
            'entertainment',
            'education',
            'health',
            'saving',
            'investment',
            'debt',
            'other',
        ], true);
    }
}
