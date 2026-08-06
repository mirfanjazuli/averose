<?php

namespace Tests\Feature;

use App\Models\AcademicField;
use App\Models\Program;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia;
use Tests\TestCase;

class ExampleTest extends TestCase
{
    use RefreshDatabase;

    public function test_home_page_displays_the_landing_page(): void
    {
        $field = AcademicField::factory()->create(['name' => 'Medical Prep']);
        $activeProgram = Program::factory()->create([
            'description' => 'Program aktif untuk landing page.',
            'name' => 'Private Masuk FK',
            'status' => 'active',
        ]);
        Program::factory()->create([
            'name' => 'Inactive Program',
            'status' => 'inactive',
        ]);

        $activeProgram->fields()->attach($field);

        $response = $this->get(route('home'));

        $response->assertOk();
        $response->assertInertia(fn (AssertableInertia $page) => $page
            ->component('welcome')
            ->where('canonicalUrl', route('home'))
            ->has('programs', 1)
            ->where('programs.0.title', 'Private Masuk FK')
            ->where('programs.0.description', 'Program aktif untuk landing page.')
            ->where('programs.0.eyebrow', 'Medical Prep')
        );
    }
}
