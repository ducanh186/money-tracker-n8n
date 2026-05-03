<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $now = now();

        DB::transaction(function () use ($now): void {
            foreach ($this->sheetCategories() as $category) {
                $existing = DB::table('categories')->where('key', $category['key'])->first();

                if ($existing) {
                    DB::table('categories')
                        ->where('id', $existing->id)
                        ->update($category + ['is_active' => true, 'updated_at' => $now]);

                    continue;
                }

                DB::table('categories')->insert($category + [
                    'is_active' => true,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }

            $sheetKeys = array_column($this->sheetCategories(), 'key');
            $categoryIdsByKey = DB::table('categories')
                ->whereIn('key', $sheetKeys)
                ->pluck('id', 'key')
                ->all();

            foreach ($this->legacyCategoryMap() as $legacyKey => $targetKey) {
                $legacyId = DB::table('categories')->where('key', $legacyKey)->value('id');
                $targetId = $categoryIdsByKey[$targetKey] ?? null;

                if (!$legacyId || !$targetId || $legacyId === $targetId) {
                    continue;
                }

                $this->remapCategoryBudgets($legacyId, $targetId, $now);

                DB::table('budget_template_items')
                    ->where('category_id', $legacyId)
                    ->update([
                        'category_id' => $targetId,
                        'updated_at' => $now,
                    ]);
            }

            DB::table('categories')
                ->whereNotIn('key', $sheetKeys)
                ->update([
                    'is_active' => false,
                    'updated_at' => $now,
                ]);
        });
    }

    public function down(): void
    {
        $now = now();
        $sheetKeys = array_column($this->sheetCategories(), 'key');

        DB::table('categories')
            ->whereIn('key', array_keys($this->legacyCategoryMap()))
            ->update([
                'is_active' => true,
                'updated_at' => $now,
            ]);

        DB::table('categories')
            ->whereIn('key', $sheetKeys)
            ->whereNotIn('key', array_keys($this->legacyCategoryMap()))
            ->update([
                'is_active' => false,
                'updated_at' => $now,
            ]);
    }

    private function remapCategoryBudgets(int $legacyId, int $targetId, $now): void
    {
        $budgets = DB::table('category_budgets')
            ->where('category_id', $legacyId)
            ->get();

        foreach ($budgets as $budget) {
            $existing = DB::table('category_budgets')
                ->where('budget_period_id', $budget->budget_period_id)
                ->where('category_id', $targetId)
                ->first();

            if ($existing) {
                DB::table('category_budgets')
                    ->where('id', $existing->id)
                    ->update([
                        'budgeted_amount' => (int) $existing->budgeted_amount + (int) $budget->budgeted_amount,
                        'reserved_amount' => (int) $existing->reserved_amount + (int) $budget->reserved_amount,
                        'rollover_amount' => (int) $existing->rollover_amount + (int) $budget->rollover_amount,
                        'notes' => $this->mergeNotes($existing->notes, $budget->notes),
                        'updated_at' => $now,
                    ]);

                DB::table('category_budgets')->where('id', $budget->id)->delete();

                continue;
            }

            DB::table('category_budgets')
                ->where('id', $budget->id)
                ->update([
                    'category_id' => $targetId,
                    'updated_at' => $now,
                ]);
        }
    }

    private function mergeNotes(?string $existingNotes, ?string $legacyNotes): ?string
    {
        $notes = array_values(array_unique(array_filter([
            $this->trimmedNote($existingNotes),
            $this->trimmedNote($legacyNotes),
        ])));

        if ($notes === []) {
            return null;
        }

        return implode(PHP_EOL . '---' . PHP_EOL, $notes);
    }

    private function trimmedNote(?string $note): ?string
    {
        $trimmed = trim((string) $note);

        return $trimmed === '' ? null : $trimmed;
    }

    private function legacyCategoryMap(): array
    {
        return [
            'food' => 'Groceries',
            'transport' => 'Transport',
            'housing' => 'Move-in Rent',
            'bills' => 'Subscriptions',
            'shopping' => 'Clothing & Grooming',
            'entertainment' => 'Leisure & Social',
            'education' => 'Courses',
            'health' => 'Healthcare',
            'saving' => 'Savings Transfer',
            'investment' => 'Long-term Investment',
            'debt' => 'Loan Repayment',
            'other' => 'Uncategorized',
        ];
    }

    private function sheetCategories(): array
    {
        return [
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
    }
};