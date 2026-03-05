<?php

namespace Tests\Feature;

use App\Models\Jar;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class JarApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\JarSeeder::class);
    }

    public function test_list_jars(): void
    {
        $response = $this->getJson('/api/jars');

        $response->assertOk()
            ->assertJsonCount(6, 'data')
            ->assertJsonFragment(['key' => 'NEC'])
            ->assertJsonFragment(['key' => 'GIVE']);
    }

    public function test_show_jar(): void
    {
        $jar = Jar::where('key', 'NEC')->first();

        $response = $this->getJson("/api/jars/{$jar->id}");

        $response->assertOk()
            ->assertJsonPath('data.key', 'NEC')
            ->assertJsonPath('data.label', 'Thiết yếu');
    }

    public function test_update_jar(): void
    {
        $jar = Jar::where('key', 'PLAY')->first();

        $response = $this->putJson("/api/jars/{$jar->id}", [
            'percent' => 25,
        ]);

        $response->assertOk()
            ->assertJsonPath('data.percent', '25.00');
    }
}
