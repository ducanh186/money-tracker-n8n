<?php

namespace Database\Factories;

use App\Models\Account;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Account>
 */
class AccountFactory extends Factory
{
    protected $model = Account::class;

    public function definition(): array
    {
        return [
            'name'        => fake()->company() . ' Account',
            'type'        => fake()->randomElement(['checking', 'savings', 'cash', 'ewallet']),
            'institution' => fake()->company(),
            'balance'     => fake()->numberBetween(1_000_000, 100_000_000),
            'currency'    => 'VND',
            'is_active'   => true,
            'sort_order'  => 0,
        ];
    }
}
