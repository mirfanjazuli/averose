<?php

namespace Tests\Feature;

use App\Models\TryOut;
use App\Models\TryOutAccess;
use App\Models\TryOutAsset;
use App\Models\TryOutAttempt;
use App\Models\TryOutGroup;
use App\Models\TryOutQuestion;
use App\Models\User;
use App\Services\TryOutDocumentImporter;
use App\Services\TryOutDocumentTemplate;
use App\TryOutScoringMode;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;
use ZipArchive;

class AdminTryOutTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_are_redirected_to_the_login_page(): void
    {
        $response = $this->get(route('admin.try-outs'));

        $response->assertRedirect(route('login'));
    }

    public function test_admin_users_can_visit_the_try_out_page(): void
    {
        $user = User::factory()->admin()->create();

        $response = $this->actingAs($user)->get(route('admin.try-outs'));

        $response
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/academics/try-outs/index')
                ->has('tryOuts')
            );
    }

    public function test_admin_users_can_visit_the_try_out_import_page(): void
    {
        $user = User::factory()->admin()->create();

        $response = $this->actingAs($user)->get(route('admin.try-outs.import.page'));

        $response
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/academics/try-outs/import')
                ->where('breadcrumbs.1.title', 'Try Out')
                ->where('breadcrumbs.2.title', 'Import')
            );
    }

    public function test_admin_users_can_import_try_out_questions_from_docx(): void
    {
        $user = User::factory()->admin()->create();

        $response = $this
            ->actingAs($user)
            ->post(route('admin.try-outs.import.preview'), [
                'document' => $this->docxUpload(),
                'duration_minutes' => 120,
                'status' => 'public',
                'title' => 'SMUA UNAIR Saintek',
            ]);

        $response
            ->assertRedirect()
            ->assertSessionHasNoErrors()
            ->assertSessionHas('tryOutImportPreview');

        $this->assertDatabaseMissing('try_outs', [
            'title' => 'SMUA UNAIR Saintek',
        ]);

        $preview = session('tryOutImportPreview');

        $this
            ->actingAs($user)
            ->post(route('admin.try-outs.import'), [
                'token' => $preview['token'],
            ])
            ->assertRedirect(route('admin.try-outs.show', 'smua-unair-saintek'))
            ->assertSessionHasNoErrors();

        $this->assertDatabaseHas('try_outs', [
            'duration_minutes' => 120,
            'source_file_name' => null,
            'status' => 'public',
            'title' => 'SMUA UNAIR Saintek',
        ]);

        $this->assertDatabaseHas('questions', [
            'answer' => 'C',
            'number' => 1,
            'options->A' => '(1)/(2)',
            'options_html->A' => '<math class="math-equation" xmlns="http://www.w3.org/1998/Math/MathML"><mrow><mfrac><mrow><mn>1</mn></mrow><mrow><mn>2</mn></mrow></mfrac></mrow></math>',
            'question_html' => 'Nilai dari <math class="math-equation" xmlns="http://www.w3.org/1998/Math/MathML"><mrow><msup><mrow><mi>x</mi></mrow><mrow><mn>2</mn></mrow></msup></mrow></math> adalah …',
            'question_text' => 'Nilai dari x^2 adalah …',
            'subject_name' => 'Matematika IPA',
        ]);

        $this->assertDatabaseHas('questions', [
            'answer' => 'A',
            'number' => 2,
            'question_text' => 'Gaya termasuk besaran …',
            'subject_name' => 'Fisika',
        ]);
    }

    public function test_admin_users_can_import_embedded_docx_images(): void
    {
        Storage::fake('local');
        config()->set('filesystems.default', 'local');
        $user = User::factory()->admin()->create();

        $this
            ->actingAs($user)
            ->post(route('admin.try-outs.import.preview'), [
                'document' => $this->docxUploadWithEmbeddedImage(),
                'duration_minutes' => 60,
                'status' => 'public',
                'title' => 'Try Out With Image',
            ])
            ->assertRedirect(route('admin.try-outs.import.page'))
            ->assertSessionHasNoErrors();

        $preview = session('tryOutImportPreview');
        $asset = TryOutAsset::query()->sole();
        $previewPath = $asset->path;

        $this->assertSame('preview', $asset->status);
        $this->assertStringContainsString("/try-out-assets/{$asset->uuid}", $preview['questions'][0]['question_html']);
        Storage::disk('local')->assertExists($asset->path);

        $this
            ->actingAs($user)
            ->post(route('admin.try-outs.import'), ['token' => $preview['token']])
            ->assertRedirect(route('admin.try-outs.show', 'try-out-with-image'))
            ->assertSessionHasNoErrors();

        $asset->refresh();
        $this->assertSame('permanent', $asset->status);
        $this->assertNotNull($asset->try_out_id);
        $this->assertNull($asset->preview_token);
        $this->assertStringStartsWith("try-outs/{$asset->try_out_id}-try-out-with-image/", $asset->path);
        Storage::disk('local')->assertExists($asset->path);
        Storage::disk('local')->assertMissing($previewPath);
        $this->assertDatabaseHas('questions', [
            'question_html' => "Diagram berikut <img src=\"/try-out-assets/{$asset->uuid}\" alt=\"Diagram soal\" loading=\"lazy\" decoding=\"async\"> menunjukkan ...",
        ]);
    }

    public function test_admin_users_can_upload_and_attach_images_in_question_editor(): void
    {
        Storage::fake('local');
        config()->set('filesystems.default', 'local');
        $user = User::factory()->admin()->create();
        $tryOut = TryOut::factory()->create();
        $question = TryOutQuestion::factory()->create(['try_out_id' => $tryOut->id]);

        $uploadResponse = $this
            ->actingAs($user)
            ->postJson(route('admin.try-outs.assets.store', $tryOut), [
                'image' => UploadedFile::fake()->image('diagram.png', 800, 600),
            ])
            ->assertCreated()
            ->assertJsonStructure(['url', 'uuid']);

        $asset = TryOutAsset::query()->sole();
        $assetHtml = '<img src="'.$uploadResponse->json('url').'" alt="Diagram">';

        $this
            ->actingAs($user)
            ->put(route('admin.try-outs.questions.update', [$tryOut, $question]), [
                'answer' => 'A',
                'options' => $question->options,
                'options_html' => $question->options_html,
                'question_html' => 'Question text '.$assetHtml,
                'question_text' => 'Question text',
                'subject_name' => $question->subject_name,
            ])
            ->assertRedirect()
            ->assertSessionHasNoErrors();

        $this->assertSame('permanent', $asset->refresh()->status);
        $this->assertStringContainsString($uploadResponse->json('url'), $question->refresh()->question_html);
        Storage::disk('local')->assertExists($asset->path);
    }

    public function test_try_out_image_upload_rejects_unsupported_files(): void
    {
        Storage::fake('local');
        config()->set('filesystems.default', 'local');
        $user = User::factory()->admin()->create();
        $tryOut = TryOut::factory()->create();

        $this
            ->actingAs($user)
            ->postJson(route('admin.try-outs.assets.store', $tryOut), [
                'image' => UploadedFile::fake()->create('diagram.svg', 10, 'image/svg+xml'),
            ])
            ->assertUnprocessable()
            ->assertJson(fn ($json) => $json->has('errors.image')->etc());

        $this->assertDatabaseCount('try_out_assets', 0);
    }

    public function test_expired_temporary_try_out_images_are_cleaned_up(): void
    {
        Storage::fake('local');
        $asset = TryOutAsset::factory()->create([
            'created_at' => now()->subHours(2),
            'path' => 'try-out-previews/expired/image.png',
            'preview_token' => 'expired',
            'status' => 'preview',
            'try_out_id' => null,
        ]);
        Storage::disk('local')->put($asset->path, 'image');

        $this->artisan('try-outs:cleanup-preview-assets')
            ->expectsOutput('Deleted 1 expired try out image assets.')
            ->assertSuccessful();

        $this->assertModelMissing($asset);
        Storage::disk('local')->assertMissing($asset->path);
    }

    public function test_admin_users_can_preview_try_out_questions_from_word_automatic_numbering_lists(): void
    {
        $user = User::factory()->admin()->create();

        $this
            ->actingAs($user)
            ->post(route('admin.try-outs.import.preview'), [
                'document' => $this->docxUploadWithAutomaticNumbering(),
                'duration_minutes' => 100,
                'status' => 'public',
                'title' => 'Automatic Numbering Try Out',
            ])
            ->assertRedirect(route('admin.try-outs.import.page'))
            ->assertSessionHasNoErrors()
            ->assertSessionHas('tryOutImportPreview');

        $preview = session('tryOutImportPreview');

        $this->assertSame(2, $preview['questionCount']);
        $this->assertSame('Automatic Numbering Try Out', $preview['title']);
        $this->assertSame('Biologi', $preview['questions'][0]['subject_name']);
        $this->assertSame('E', $preview['questions'][0]['answer']);
        $this->assertSame('B', $preview['questions'][1]['answer']);
        $this->assertSame(range(1, 2), array_column($preview['questions'], 'number'));
        $this->assertSame(['A', 'B', 'C', 'D', 'E'], array_keys($preview['questions'][0]['options']));
        $this->assertSame('Mitokondria menghasilkan ATP melalui respirasi seluler.', $preview['questions'][0]['options']['A']);
    }

    public function test_admin_users_can_import_edited_preview_questions(): void
    {
        $user = User::factory()->admin()->create();

        $this
            ->actingAs($user)
            ->post(route('admin.try-outs.import.preview'), [
                'document' => $this->docxUpload(),
                'duration_minutes' => 90,
                'status' => 'draft',
                'title' => 'Edited Preview Try Out',
            ])
            ->assertRedirect(route('admin.try-outs.import.page'))
            ->assertSessionHas('tryOutImportPreview');

        $preview = session('tryOutImportPreview');
        $questions = $preview['questions'];
        $questions[0]['answer'] = 'A';
        $questions[0]['options']['A'] = 'Edited option';
        $questions[0]['options_html']['A'] = 'Edited option';
        $questions[0]['question_html'] = 'Edited question';
        $questions[0]['question_text'] = 'Edited question';
        $questions[0]['subject_name'] = 'Edited Subject';

        $this
            ->actingAs($user)
            ->post(route('admin.try-outs.import'), [
                'questions' => json_encode($questions, JSON_THROW_ON_ERROR),
                'token' => $preview['token'],
            ])
            ->assertRedirect(route('admin.try-outs.show', 'edited-preview-try-out'))
            ->assertSessionHasNoErrors();

        $this->assertDatabaseHas('questions', [
            'answer' => 'A',
            'number' => 1,
            'options->A' => 'Edited option',
            'question_html' => 'Edited question',
            'question_text' => 'Edited question',
            'subject_name' => 'Edited Subject',
        ]);
    }

    public function test_private_try_out_import_does_not_require_availability_dates(): void
    {
        $user = User::factory()->admin()->create();

        $this
            ->actingAs($user)
            ->post(route('admin.try-outs.import.preview'), [
                'document' => $this->docxUpload(),
                'status' => 'private',
                'title' => 'Private Missing Dates',
            ])
            ->assertRedirect(route('admin.try-outs.import.page'))
            ->assertSessionHasNoErrors()
            ->assertSessionHas('tryOutImportPreview');
    }

    public function test_admin_users_can_create_private_try_out_group(): void
    {
        $admin = User::factory()->admin()->create();
        $tryOut = TryOut::factory()->create([
            'status' => 'private',
            'title' => 'Token Group Try Out',
        ]);

        $this
            ->actingAs($admin)
            ->post(route('admin.try-outs.groups.store', $tryOut), [
                'attempt_quota' => 2,
                'available_from' => now()->toDateString(),
                'available_until' => now()->addWeek()->toDateString(),
                'max_participants' => 25,
                'name' => 'Batch Juli',
                'status' => 'active',
            ])
            ->assertRedirect()
            ->assertSessionHas('success', 'Try out group created successfully.');

        $group = TryOutGroup::query()->sole();

        $this->assertSame('Batch Juli', $group->name);
        $this->assertSame(2, $group->attempt_quota);
        $this->assertSame(25, $group->max_participants);
        $this->assertNotEmpty($group->token);

        $this
            ->actingAs($admin)
            ->get(route('admin.try-outs.show', $tryOut))
            ->assertInertia(fn (Assert $page) => $page
                ->where('tryOut.groups.0.name', 'Batch Juli')
                ->where('tryOut.groups.0.redeemedCount', 0)
                ->where('tryOut.groups.0.token', $group->token)
            );
    }

    public function test_admin_users_cannot_create_group_for_non_private_try_out(): void
    {
        $admin = User::factory()->admin()->create();
        $tryOut = TryOut::factory()->create(['status' => 'public']);

        $this
            ->actingAs($admin)
            ->post(route('admin.try-outs.groups.store', $tryOut), [
                'attempt_quota' => 1,
                'available_from' => now()->toDateString(),
                'available_until' => now()->addWeek()->toDateString(),
                'name' => 'Public Group',
                'status' => 'active',
            ])
            ->assertNotFound();

        $this->assertDatabaseCount('try_out_groups', 0);
    }

    public function test_admin_users_can_deactivate_try_out_group(): void
    {
        $admin = User::factory()->admin()->create();
        $group = TryOutGroup::factory()->create(['status' => 'active']);

        $this
            ->actingAs($admin)
            ->put(route('admin.try-outs.groups.deactivate', [$group->tryOut, $group]))
            ->assertRedirect()
            ->assertSessionHas('success', 'Try out group deactivated successfully.');

        $this->assertSame('inactive', $group->refresh()->status);
    }

    public function test_admin_users_can_add_private_try_out_access(): void
    {
        $admin = User::factory()->admin()->create();
        $student = User::factory()->student()->create();
        $tryOut = TryOut::factory()->create([
            'status' => 'private',
        ]);

        $this
            ->actingAs($admin)
            ->post(route('students.try-out-access.store', $student), [
                'attempt_quota' => 3,
                'available_from' => now()->toDateString(),
                'available_until' => now()->addMonth()->toDateString(),
                'status' => 'active',
                'try_out_id' => $tryOut->id,
            ])
            ->assertRedirect()
            ->assertSessionHas('success', 'Try out access added successfully.');

        $this->assertDatabaseHas('try_out_accesses', [
            'attempt_quota' => 3,
            'attempts_used' => 0,
            'try_out_id' => $tryOut->id,
            'user_id' => $student->id,
        ]);
    }

    public function test_student_detail_page_shows_try_out_access_history(): void
    {
        $admin = User::factory()->admin()->create();
        $student = User::factory()->student()->create([
            'name' => 'Student Access',
        ]);
        $tryOut = TryOut::factory()->create([
            'status' => 'private',
            'title' => 'Private Access Try Out',
        ]);
        $access = TryOutAccess::factory()->create([
            'attempt_quota' => 2,
            'attempts_used' => 1,
            'try_out_id' => $tryOut->id,
            'user_id' => $student->id,
        ]);

        $this
            ->actingAs($admin)
            ->get(route('students.show', $student))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/users/students/show')
                ->where('tryOutAccesses.0.id', $access->id)
                ->where('tryOutAccesses.0.remainingAttempts', 1)
                ->where('tryOutAccesses.0.tryOut.title', 'Private Access Try Out')
            );
    }

    public function test_import_keeps_geometry_labels_that_contain_option_letters(): void
    {
        $user = User::factory()->admin()->create();

        $this
            ->actingAs($user)
            ->post(route('admin.try-outs.import.preview'), [
                'document' => $this->docxUploadWithGeometryLabel(),
                'status' => 'draft',
            ])
            ->assertRedirect()
            ->assertSessionHasNoErrors()
            ->assertSessionHas('tryOutImportPreview');

        $preview = session('tryOutImportPreview');

        $this
            ->actingAs($user)
            ->post(route('admin.try-outs.import'), [
                'token' => $preview['token'],
            ])
            ->assertRedirect()
            ->assertSessionHasNoErrors();

        $this->assertDatabaseHas('questions', [
            'number' => 1,
            'options->A' => 'sqrt(3) cm',
            'question_text' => 'Pada kubus ABCD.EFGH, jarak titik A ke bidang BDE adalah …',
        ]);
    }

    public function test_import_accepts_lowercase_option_markers(): void
    {
        $user = User::factory()->admin()->create();

        $this
            ->actingAs($user)
            ->post(route('admin.try-outs.import.preview'), [
                'document' => $this->docxUploadWithLowercaseOptions(),
                'status' => 'draft',
            ])
            ->assertRedirect()
            ->assertSessionHasNoErrors()
            ->assertSessionHas('tryOutImportPreview');

        $preview = session('tryOutImportPreview');

        $this
            ->actingAs($user)
            ->post(route('admin.try-outs.import'), [
                'token' => $preview['token'],
            ])
            ->assertRedirect()
            ->assertSessionHasNoErrors();

        $this->assertDatabaseHas('questions', [
            'answer' => 'D',
            'number' => 1,
            'options->A' => '1',
            'options->D' => '4',
            'question_text' => 'Hasil dari 2 + 2 adalah …',
            'subject_name' => 'Matematika Dasar',
        ]);
    }

    public function test_imported_try_outs_are_sent_to_the_admin_page(): void
    {
        $user = User::factory()->admin()->create();
        $tryOut = TryOut::factory()
            ->hasQuestions(2)
            ->create(['status' => 'public', 'title' => 'Imported Try Out']);

        $response = $this->actingAs($user)->get(route('admin.try-outs'));

        $response
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/academics/try-outs/index')
                ->where('tryOuts.0.id', (string) $tryOut->id)
                ->where('tryOuts.0.questions', 2)
                ->where('tryOuts.0.status', 'Public')
                ->where('tryOuts.0.title', 'Imported Try Out')
            );
    }

    public function test_admin_users_can_view_try_out_detail(): void
    {
        $user = User::factory()->admin()->create();
        $tryOut = TryOut::factory()
            ->hasQuestions(2)
            ->create(['duration_minutes' => 120, 'title' => 'Detail Try Out']);

        $response = $this->actingAs($user)->get(route('admin.try-outs.show', $tryOut));

        $response
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/academics/try-outs/show')
                ->where('tryOut.title', 'Detail Try Out')
                ->where('tryOut.duration', '120')
                ->where('tryOut.questionsCount', 2)
            );
    }

    public function test_admin_users_can_view_try_out_questions_page(): void
    {
        $user = User::factory()->admin()->create();
        $tryOut = TryOut::factory()
            ->hasQuestions(2)
            ->create(['title' => 'Questions Try Out']);

        $response = $this->actingAs($user)->get(route('admin.try-outs.questions', $tryOut));

        $response
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/academics/try-outs/questions')
                ->where('tryOut.title', 'Questions Try Out')
                ->where('tryOut.questionsCount', 2)
                ->has('tryOut.questions', 2)
            );
    }

    public function test_try_out_detail_includes_leaderboard_summary(): void
    {
        $user = User::factory()->admin()->create();
        $firstStudent = User::factory()->student()->create(['name' => 'First Student']);
        $secondStudent = User::factory()->student()->create(['name' => 'Second Student']);
        $tryOut = TryOut::factory()
            ->hasQuestions(2)
            ->create(['duration_minutes' => 120, 'title' => 'Leaderboard Detail Try Out']);

        TryOutAttempt::factory()->create([
            'score' => 70,
            'submitted_at' => now()->subHours(3),
            'try_out_id' => $tryOut->id,
            'user_id' => $firstStudent->id,
        ]);
        TryOutAttempt::factory()->create([
            'score' => 90,
            'submitted_at' => now()->subHour(),
            'try_out_id' => $tryOut->id,
            'user_id' => $firstStudent->id,
        ]);
        TryOutAttempt::factory()->create([
            'score' => 80,
            'submitted_at' => now()->subHours(2),
            'try_out_id' => $tryOut->id,
            'user_id' => $secondStudent->id,
        ]);

        $this
            ->actingAs($user)
            ->get(route('admin.try-outs.show', $tryOut))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/academics/try-outs/show')
                ->where('tryOut.leaderboard.totalAttempts', 3)
                ->where('tryOut.leaderboard.participantsCount', 2)
                ->where('tryOut.leaderboard.highestScore', 90)
                ->where('tryOut.leaderboard.averageScore', 85)
                ->where('tryOut.leaderboard.preview.0.student.name', 'First Student')
                ->where('tryOut.leaderboard.preview.0.score', 90)
                ->where('tryOut.leaderboard.preview.1.student.name', 'Second Student')
            );
    }

    public function test_public_try_out_detail_includes_recent_attempts(): void
    {
        $admin = User::factory()->admin()->create();
        $firstStudent = User::factory()->student()->create(['name' => 'First Student']);
        $secondStudent = User::factory()->student()->create(['name' => 'Second Student']);
        $tryOut = TryOut::factory()
            ->hasQuestions(2)
            ->create(['status' => 'public', 'title' => 'Public Attempts Try Out']);

        TryOutAttempt::factory()->create([
            'correct_count' => 1,
            'question_count' => 2,
            'score' => 50,
            'submitted_at' => now()->subHours(2),
            'try_out_id' => $tryOut->id,
            'user_id' => $firstStudent->id,
        ]);
        TryOutAttempt::factory()->create([
            'correct_count' => 2,
            'question_count' => 2,
            'score' => 100,
            'submitted_at' => now()->subHour(),
            'try_out_id' => $tryOut->id,
            'user_id' => $secondStudent->id,
        ]);

        $this
            ->actingAs($admin)
            ->get(route('admin.try-outs.show', $tryOut))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/academics/try-outs/show')
                ->where('tryOut.status', 'Public')
                ->where('tryOut.recentAttempts.0.student.name', 'Second Student')
                ->where('tryOut.recentAttempts.0.score', 100)
                ->where('tryOut.recentAttempts.0.correctCount', 2)
                ->where('tryOut.recentAttempts.1.student.name', 'First Student')
            );
    }

    public function test_draft_try_out_detail_includes_publish_readiness(): void
    {
        $admin = User::factory()->admin()->create();
        $tryOut = TryOut::factory()->create([
            'scoring_mode' => TryOutScoringMode::NegativeMarking,
            'status' => 'draft',
            'title' => 'Draft Readiness Try Out',
        ]);

        TryOutQuestion::factory()->create([
            'answer' => null,
            'correct_answers' => null,
            'subject_name' => null,
            'try_out_id' => $tryOut->id,
        ]);

        $this
            ->actingAs($admin)
            ->get(route('admin.try-outs.show', $tryOut))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/academics/try-outs/show')
                ->where('tryOut.status', 'Draft')
                ->where('tryOut.readiness.readyCount', 1)
                ->where('tryOut.readiness.totalCount', 4)
                ->where('tryOut.readiness.items.0.ready', true)
                ->where('tryOut.readiness.items.1.ready', false)
                ->where('tryOut.readiness.items.2.ready', false)
                ->where('tryOut.readiness.items.3.ready', false)
            );
    }

    public function test_admin_users_can_view_try_out_leaderboard(): void
    {
        $admin = User::factory()->admin()->create();
        $firstStudent = User::factory()->student()->create([
            'email' => 'first@example.test',
            'name' => 'First Student',
        ]);
        $secondStudent = User::factory()->student()->create([
            'email' => 'second@example.test',
            'name' => 'Second Student',
        ]);
        $thirdStudent = User::factory()->student()->create([
            'name' => 'Third Student',
        ]);
        $tryOut = TryOut::factory()->create(['title' => 'Leaderboard Try Out']);

        TryOutAttempt::factory()->create([
            'correct_count' => 7,
            'question_count' => 10,
            'score' => 70,
            'submitted_at' => now()->setDate(2026, 7, 1)->setTime(10, 0),
            'try_out_id' => $tryOut->id,
            'user_id' => $firstStudent->id,
        ]);
        TryOutAttempt::factory()->create([
            'correct_count' => 8,
            'question_count' => 10,
            'score' => 85,
            'submitted_at' => now()->setDate(2026, 7, 1)->setTime(12, 0),
            'try_out_id' => $tryOut->id,
            'user_id' => $firstStudent->id,
        ]);
        TryOutAttempt::factory()->create([
            'correct_count' => 8,
            'question_count' => 10,
            'score' => 85,
            'submitted_at' => now()->setDate(2026, 7, 1)->setTime(11, 0),
            'try_out_id' => $tryOut->id,
            'user_id' => $secondStudent->id,
        ]);
        TryOutAttempt::factory()->create([
            'score' => 60,
            'submitted_at' => now()->setDate(2026, 7, 1)->setTime(9, 0),
            'try_out_id' => $tryOut->id,
            'user_id' => $thirdStudent->id,
        ]);

        $this
            ->actingAs($admin)
            ->get(route('admin.try-outs.leaderboard', $tryOut))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/academics/try-outs/leaderboard')
                ->where('tryOut.title', 'Leaderboard Try Out')
                ->where('tryOut.totalAttempts', 4)
                ->where('tryOut.participantsCount', 3)
                ->where('tryOut.highestScore', 85)
                ->where('tryOut.leaderboard.0.rank', 1)
                ->where('tryOut.leaderboard.0.student.name', 'Second Student')
                ->where('tryOut.leaderboard.0.score', 85)
                ->where('tryOut.leaderboard.1.rank', 2)
                ->where('tryOut.leaderboard.1.student.name', 'First Student')
                ->where('tryOut.leaderboard.1.score', 85)
                ->where('tryOut.leaderboard.1.correctCount', 8)
                ->where('tryOut.leaderboard.2.student.name', 'Third Student')
                ->missing('tryOut.leaderboard.3')
            );
    }

    public function test_students_cannot_view_admin_try_out_leaderboard(): void
    {
        $student = User::factory()->student()->create();
        $tryOut = TryOut::factory()->create();

        $this
            ->actingAs($student)
            ->get(route('admin.try-outs.leaderboard', $tryOut))
            ->assertForbidden();
    }

    public function test_admin_users_can_update_try_out_name_and_duration(): void
    {
        $user = User::factory()->admin()->create();
        $tryOut = TryOut::factory()->create([
            'duration_minutes' => 90,
            'title' => 'Old Try Out',
        ]);

        $this
            ->actingAs($user)
            ->put(route('admin.try-outs.update', $tryOut), [
                'duration_minutes' => 150,
                'status' => 'draft',
                'title' => 'Updated Try Out',
            ])
            ->assertRedirect()
            ->assertSessionHas('success', 'Updated Try Out updated successfully.');

        $this->assertDatabaseHas('try_outs', [
            'id' => $tryOut->id,
            'duration_minutes' => 150,
            'title' => 'Updated Try Out',
        ]);
    }

    public function test_admin_users_can_update_try_out_to_private_without_availability_dates(): void
    {
        $user = User::factory()->admin()->create();
        $tryOut = TryOut::factory()->create(['title' => 'Private Candidate']);
        TryOutQuestion::factory()->create([
            'points' => 100,
            'try_out_id' => $tryOut->id,
        ]);

        $this
            ->actingAs($user)
            ->put(route('admin.try-outs.update', $tryOut), [
                'duration_minutes' => 120,
                'status' => 'private',
                'title' => 'Private Candidate',
            ])
            ->assertRedirect()
            ->assertSessionHas('success', 'Private Candidate updated successfully.');

        $this->assertDatabaseHas('try_outs', [
            'id' => $tryOut->id,
            'status' => 'private',
            'title' => 'Private Candidate',
        ]);
    }

    public function test_admin_users_can_update_try_out_questions(): void
    {
        $user = User::factory()->admin()->create();
        $tryOut = TryOut::factory()->create();
        $question = TryOutQuestion::factory()->create([
            'answer' => 'A',
            'number' => 1,
            'try_out_id' => $tryOut->id,
        ]);

        $this
            ->actingAs($user)
            ->put(route('admin.try-outs.questions.update', [$tryOut, $question]), [
                'answer' => 'D',
                'options' => [
                    'A' => 'First option',
                    'B' => 'Second option',
                    'C' => 'Third option',
                    'D' => 'Fourth option',
                    'E' => 'Fifth option',
                ],
                'question_text' => 'Updated question text?',
                'subject_name' => 'Matematika Dasar',
            ])
            ->assertRedirect()
            ->assertSessionHas('success', 'Question 1 updated successfully.');

        $this->assertDatabaseHas('questions', [
            'answer' => 'D',
            'id' => $question->id,
            'options->D' => 'Fourth option',
            'question_html' => 'Updated question text?',
            'question_text' => 'Updated question text?',
            'subject_name' => 'Matematika Dasar',
        ]);
    }

    public function test_admin_users_can_change_a_question_to_numeric_answer(): void
    {
        $admin = User::factory()->admin()->create();
        $tryOut = TryOut::factory()->create();
        $question = TryOutQuestion::factory()->create(['try_out_id' => $tryOut->id]);

        $this->actingAs($admin)
            ->put(route('admin.try-outs.questions.update', [$tryOut, $question]), [
                'answer' => '0012,500',
                'points' => 2,
                'question_text' => 'What is the value of x?',
                'question_type' => 'numeric_answer',
            ])
            ->assertSessionHasNoErrors();

        $question->refresh();

        $this->assertSame('numeric_answer', $question->question_type->value);
        $this->assertSame('12.5', $question->answer);
        $this->assertSame(['12.5'], $question->correct_answers);
        $this->assertSame([], $question->options);
    }

    public function test_updating_try_out_question_preserves_existing_math_html_when_content_is_unchanged(): void
    {
        $user = User::factory()->admin()->create();
        $tryOut = TryOut::factory()->create();
        $questionHtml = 'Nilai dari <math class="math-equation" xmlns="http://www.w3.org/1998/Math/MathML"><mrow><msup><mrow><mi>x</mi></mrow><mrow><mn>2</mn></mrow></msup></mrow></math> adalah …';
        $optionHtml = '<math class="math-equation" xmlns="http://www.w3.org/1998/Math/MathML"><mrow><mfrac><mrow><mn>1</mn></mrow><mrow><mn>2</mn></mrow></mfrac></mrow></math>';
        $question = TryOutQuestion::factory()->create([
            'answer' => 'A',
            'number' => 1,
            'options' => [
                'A' => '(1)/(2)',
                'B' => '2',
                'C' => '3',
                'D' => '4',
                'E' => '5',
            ],
            'options_html' => [
                'A' => $optionHtml,
                'B' => '2',
                'C' => '3',
                'D' => '4',
                'E' => '5',
            ],
            'question_html' => $questionHtml,
            'question_text' => 'Nilai dari x^2 adalah …',
            'try_out_id' => $tryOut->id,
        ]);

        $this
            ->actingAs($user)
            ->put(route('admin.try-outs.questions.update', [$tryOut, $question]), [
                'answer' => 'B',
                'options' => [
                    'A' => '(1)/(2)',
                    'B' => '2',
                    'C' => '3',
                    'D' => '4',
                    'E' => '5',
                ],
                'question_text' => 'Nilai dari x^2 adalah …',
                'subject_name' => 'Matematika Dasar',
            ])
            ->assertRedirect()
            ->assertSessionHas('success', 'Question 1 updated successfully.');

        $this->assertDatabaseHas('questions', [
            'answer' => 'B',
            'id' => $question->id,
            'options_html->A' => $optionHtml,
            'question_html' => $questionHtml,
        ]);
    }

    public function test_admin_users_can_edit_math_content_with_latex_source(): void
    {
        $user = User::factory()->admin()->create();
        $tryOut = TryOut::factory()->create();
        $questionHtml = 'Nilai dari <math class="math-equation" xmlns="http://www.w3.org/1998/Math/MathML"><mrow><msup><mrow><mi>x</mi></mrow><mrow><mn>2</mn></mrow></msup></mrow></math> adalah …';
        $question = TryOutQuestion::factory()->create([
            'answer' => 'A',
            'number' => 1,
            'options' => [
                'A' => '1',
                'B' => '2',
                'C' => '3',
                'D' => '4',
                'E' => '5',
            ],
            'question_html' => $questionHtml,
            'question_text' => 'Nilai dari x^2 adalah …',
            'try_out_id' => $tryOut->id,
        ]);

        $this
            ->actingAs($user)
            ->from(route('admin.try-outs.show', $tryOut))
            ->put(route('admin.try-outs.questions.update', [$tryOut, $question]), [
                'answer' => 'B',
                'options' => [
                    'A' => '\(\frac{1}{2}\)',
                    'B' => '2',
                    'C' => '3',
                    'D' => '4',
                    'E' => '5',
                ],
                'question_text' => 'Nilai dari \(x^3\) adalah …',
                'subject_name' => 'Matematika Dasar',
            ])
            ->assertRedirect(route('admin.try-outs.show', $tryOut))
            ->assertSessionHasNoErrors()
            ->assertSessionHas('success', 'Question 1 updated successfully.');

        $this->assertDatabaseHas('questions', [
            'answer' => 'B',
            'id' => $question->id,
            'options->A' => '\(\frac{1}{2}\)',
            'options_html->A' => '\(\frac{1}{2}\)',
            'question_html' => 'Nilai dari \(x^3\) adalah …',
            'question_text' => 'Nilai dari \(x^3\) adalah …',
        ]);
    }

    public function test_admin_users_can_download_try_out_import_template(): void
    {
        $user = User::factory()->admin()->create();

        $this
            ->actingAs($user)
            ->get(route('admin.try-outs.import.template'))
            ->assertOk()
            ->assertDownload('averose-try-out-import-template.docx');
    }

    public function test_admin_users_can_unpublish_try_outs(): void
    {
        $user = User::factory()->admin()->create();
        $tryOut = TryOut::factory()->create([
            'status' => 'public',
            'title' => 'Public Try Out',
        ]);

        $this
            ->actingAs($user)
            ->put(route('admin.try-outs.unpublish', $tryOut))
            ->assertRedirect()
            ->assertSessionHas('success', 'Public Try Out unpublished successfully.');

        $this->assertDatabaseHas('try_outs', [
            'id' => $tryOut->id,
            'status' => 'draft',
        ]);
    }

    public function test_admin_users_can_publish_try_outs(): void
    {
        $user = User::factory()->admin()->create();
        $tryOut = TryOut::factory()->create([
            'status' => 'draft',
            'title' => 'Draft Try Out',
        ]);
        TryOutQuestion::factory()->create([
            'points' => 100,
            'try_out_id' => $tryOut->id,
        ]);

        $this
            ->actingAs($user)
            ->put(route('admin.try-outs.publish', $tryOut))
            ->assertRedirect()
            ->assertSessionHas('success', 'Draft Try Out published successfully.');

        $this->assertDatabaseHas('try_outs', [
            'id' => $tryOut->id,
            'status' => 'public',
        ]);
    }

    public function test_try_out_import_template_can_be_parsed(): void
    {
        $path = app(TryOutDocumentTemplate::class)->create();

        $zip = new ZipArchive;
        $zip->open($path);
        $documentXml = $zip->getFromName('word/document.xml');
        $zip->close();

        $questions = app(TryOutDocumentImporter::class)->parse($path);

        @unlink($path);

        $this->assertCount(4, $questions);
        $this->assertSame('Bahasa Indonesia', $questions[0]['subject_name']);
        $this->assertSame('D', $questions[0]['answer']);
        $this->assertSame(['A', 'B', 'C', 'D', 'E'], array_keys($questions[0]['options']));
        $this->assertSame('Matematika', $questions[1]['subject_name']);
        $this->assertSame(['A', 'C', 'E'], $questions[1]['correct_answers']);
        $this->assertSame('numeric_answer', $questions[2]['question_type']);
        $this->assertSame('12', $questions[2]['answer']);
        $this->assertSame([], $questions[2]['options']);
        $this->assertSame('Bahasa Inggris', $questions[3]['subject_name']);
        $this->assertSame('Reading', $questions[3]['sub_category_name']);
        $this->assertSame(['A', 'B', 'C', 'D', 'E'], array_keys($questions[3]['options']));
        $this->assertSame('Exams should be avoided.', $questions[3]['options']['B']);
        $this->assertSame('Concepts are impossible to remember.', $questions[3]['options']['D']);
        $this->assertStringContainsString('PASSAGE 1', $questions[3]['question_text']);
        $this->assertIsString($documentXml);
        $this->assertStringContainsString('Raw Score.', $documentXml);
        $this->assertStringContainsString('Negative Marking.', $documentXml);
        $this->assertStringContainsString('2. A,C,E', $documentXml);
        $this->assertStringContainsString('[NUMERIC ANSWER]', $documentXml);
        $this->assertStringContainsString('Template Try Out Averose', $documentXml);
        $this->assertStringContainsString('BAGIAN 1: SOAL', $documentXml);
        $this->assertStringContainsString('Soal bacaan.', $documentXml);
    }

    public function test_importer_parses_comma_separated_multiple_answer_keys(): void
    {
        $document = $this->docxUploadFromXml(<<<'XML'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
    <w:body>
        <w:p><w:r><w:t>BAGIAN 1: LEMBAR SOAL</w:t></w:r></w:p>
        <w:p><w:r><w:t>Biologi</w:t></w:r></w:p>
        <w:p><w:r><w:t>1. [MULTIPLE ANSWER] Pilih dua jawaban yang benar.A. SatuB. DuaC. TigaD. EmpatE. Lima</w:t></w:r></w:p>
        <w:p><w:r><w:t>BAGIAN 2: KUNCI JAWABAN</w:t></w:r></w:p>
        <w:p><w:r><w:t>1. A,C</w:t></w:r></w:p>
    </w:body>
</w:document>
XML, 'multiple-answer.docx');

        $questions = app(TryOutDocumentImporter::class)->parse(
            $document->getRealPath(),
            scoringMode: TryOutScoringMode::RawScore,
        );

        $this->assertSame(['A', 'C'], $questions[0]['correct_answers']);
        $this->assertSame(1, $questions[0]['points']);
    }

    public function test_importer_keeps_reading_passages_with_following_questions(): void
    {
        $document = $this->docxUploadFromXml(<<<'XML'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
    <w:body>
        <w:p><w:r><w:t>BAGIAN 1: LEMBAR SOAL</w:t></w:r></w:p>
        <w:p><w:r><w:t>BAHASA INGGRIS</w:t></w:r></w:p>
        <w:p><w:r><w:t>PASSAGE 1 — SLEEP AND LEARNING</w:t></w:r></w:p>
        <w:p><w:r><w:t>Sleep helps students consolidate new memories after deliberate practice.</w:t></w:r></w:p>
        <w:p><w:r><w:t>1. What is the main idea of the passage?</w:t></w:r></w:p>
        <w:p><w:r><w:t>A. Sleep supports learning.</w:t><w:br/><w:t>B. Sleep replaces study.</w:t><w:br/><w:t>C. Sleep stops memory.</w:t><w:br/><w:t>D. Sleep wastes time.</w:t><w:br/><w:t>E. Sleep removes books.</w:t></w:r></w:p>
        <w:p><w:r><w:t>2. The word consolidate is closest in meaning to ….</w:t></w:r></w:p>
        <w:p><w:r><w:t>A. erase</w:t><w:br/><w:t>B. strengthen</w:t><w:br/><w:t>C. separate</w:t><w:br/><w:t>D. ignore</w:t><w:br/><w:t>E. delay</w:t></w:r></w:p>
        <w:p><w:r><w:t>STRUCTURE AND VOCABULARY</w:t></w:r></w:p>
        <w:p><w:r><w:t>Choose the best answer to complete the sentence.</w:t></w:r></w:p>
        <w:p><w:r><w:t>3. Each student ___ required to attend class.</w:t></w:r></w:p>
        <w:p><w:r><w:t>A. are</w:t><w:br/><w:t>B. were</w:t><w:br/><w:t>C. is</w:t><w:br/><w:t>D. be</w:t><w:br/><w:t>E. being</w:t></w:r></w:p>
        <w:p><w:r><w:t>BAGIAN 2: KUNCI JAWABAN</w:t></w:r></w:p>
        <w:p><w:r><w:t>1. A</w:t></w:r></w:p>
        <w:p><w:r><w:t>2. B</w:t></w:r></w:p>
        <w:p><w:r><w:t>3. C</w:t></w:r></w:p>
    </w:body>
</w:document>
XML, 'reading-passage.docx');

        $questions = app(TryOutDocumentImporter::class)->parse($document->getRealPath());

        $this->assertCount(3, $questions);
        $this->assertSame('Bahasa Inggris', $questions[0]['subject_name']);
        $this->assertSame('Reading', $questions[0]['sub_category_name']);
        $this->assertStringContainsString('PASSAGE 1', $questions[0]['question_text']);
        $this->assertStringContainsString('Sleep helps students', $questions[1]['question_text']);
        $this->assertStringContainsString('try-out-passage', $questions[1]['question_html']);
        $this->assertSame('Bahasa Inggris', $questions[2]['subject_name']);
        $this->assertSame('Structure', $questions[2]['sub_category_name']);
        $this->assertStringContainsString('Choose the best answer', $questions[2]['question_text']);
    }

    public function test_importer_preserves_word_tables_inside_questions(): void
    {
        $document = $this->docxUploadFromXml(<<<'XML'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
    <w:body>
        <w:p><w:r><w:t>BAGIAN 1: SOAL</w:t></w:r></w:p>
        <w:p><w:r><w:t>Matematika</w:t></w:r></w:p>
        <w:p><w:r><w:t>1. Perhatikan data berikut. Bulan dengan pendaftar terbesar adalah ....</w:t></w:r></w:p>
        <w:tbl>
            <w:tr>
                <w:tc><w:p><w:r><w:t>Bulan</w:t></w:r></w:p></w:tc>
                <w:tc><w:p><w:r><w:t>Pendaftar</w:t></w:r></w:p></w:tc>
            </w:tr>
            <w:tr>
                <w:tc><w:p><w:r><w:t>Januari</w:t></w:r></w:p></w:tc>
                <w:tc><w:p><w:r><w:t>120</w:t></w:r></w:p></w:tc>
            </w:tr>
            <w:tr>
                <w:tc><w:p><w:r><w:t>Februari</w:t></w:r></w:p></w:tc>
                <w:tc><w:p><w:r><w:t>150</w:t></w:r></w:p></w:tc>
            </w:tr>
        </w:tbl>
        <w:p><w:r><w:t>A. Januari</w:t><w:br/><w:t>B. Februari</w:t><w:br/><w:t>C. Maret</w:t><w:br/><w:t>D. April</w:t><w:br/><w:t>E. Mei</w:t></w:r></w:p>
        <w:p><w:r><w:t>BAGIAN 2: KUNCI JAWABAN</w:t></w:r></w:p>
        <w:p><w:r><w:t>1. B</w:t></w:r></w:p>
    </w:body>
</w:document>
XML, 'table-question.docx');

        $questions = app(TryOutDocumentImporter::class)->parse($document->getRealPath());

        $this->assertCount(1, $questions);
        $this->assertSame('Matematika', $questions[0]['subject_name']);
        $this->assertSame('B', $questions[0]['answer']);
        $this->assertSame(['A', 'B', 'C', 'D', 'E'], array_keys($questions[0]['options']));
        $this->assertStringContainsString('Bulan | Pendaftar', $questions[0]['question_text']);
        $this->assertStringContainsString('try-out-table', $questions[0]['question_html']);
        $this->assertStringContainsString('<td>Bulan</td>', $questions[0]['question_html']);
    }

    public function test_importer_flattens_single_column_layout_tables_in_reading_passages(): void
    {
        $document = $this->docxUploadFromXml(<<<'XML'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
    <w:body>
        <w:p><w:r><w:t>BAGIAN 1: SOAL</w:t></w:r></w:p>
        <w:p><w:r><w:t>Bahasa Inggris</w:t></w:r></w:p>
        <w:tbl>
            <w:tr>
                <w:tc>
                    <w:p><w:r><w:t>PASSAGE 1 — STUDY HABITS</w:t></w:r></w:p>
                    <w:p><w:r><w:t>Students who review regularly remember concepts better.</w:t></w:r></w:p>
                    <w:p><w:r><w:t>Short reviews also help students prepare calmly.</w:t></w:r></w:p>
                </w:tc>
            </w:tr>
        </w:tbl>
        <w:p><w:r><w:t>1. What is the main idea of the passage?</w:t></w:r></w:p>
        <w:p><w:r><w:t>A. Regular review supports memory.</w:t><w:br/><w:t>B. Study should be avoided.</w:t><w:br/><w:t>C. Concepts cannot be learned.</w:t><w:br/><w:t>D. Reviews always create stress.</w:t><w:br/><w:t>E. Exams do not need preparation.</w:t></w:r></w:p>
        <w:p><w:r><w:t>BAGIAN 2: KUNCI JAWABAN</w:t></w:r></w:p>
        <w:p><w:r><w:t>1. A</w:t></w:r></w:p>
    </w:body>
</w:document>
XML, 'single-column-layout-table.docx');

        $questions = app(TryOutDocumentImporter::class)->parse($document->getRealPath());

        $this->assertCount(1, $questions);
        $this->assertSame('Reading', $questions[0]['sub_category_name']);
        $this->assertStringNotContainsString('try-out-table', $questions[0]['question_html']);
        $this->assertStringContainsString('<p>PASSAGE 1', $questions[0]['question_html']);
        $this->assertStringContainsString('<p>Students who review', $questions[0]['question_html']);
    }

    public function test_mentors_cannot_visit_the_admin_try_out_page(): void
    {
        $user = User::factory()->mentor()->create();

        $this->actingAs($user)
            ->get(route('admin.try-outs'))
            ->assertForbidden();
    }

    public function test_students_cannot_visit_the_admin_try_out_page(): void
    {
        $user = User::factory()->student()->create();

        $this->actingAs($user)
            ->get(route('admin.try-outs'))
            ->assertForbidden();
    }

    private function docxUpload(): UploadedFile
    {
        $path = tempnam(sys_get_temp_dir(), 'try-out-docx-');

        $zip = new ZipArchive;
        $zip->open($path, ZipArchive::OVERWRITE);
        $zip->addFromString('[Content_Types].xml', <<<'XML'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
    <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
    <Default Extension="xml" ContentType="application/xml"/>
    <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>
XML);
        $zip->addFromString('word/document.xml', <<<'XML'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math">
    <w:body>
        <w:p><w:r><w:t>BAGIAN 1: LEMBAR SOAL TKA SAINTEK</w:t></w:r></w:p>
        <w:p><w:r><w:t>Matematika IPA</w:t></w:r></w:p>
        <w:p>
            <w:r><w:t>1. Nilai dari </w:t></w:r>
            <m:oMath>
                <m:sSup>
                    <m:e><m:r><m:t>x</m:t></m:r></m:e>
                    <m:sup><m:r><m:t>2</m:t></m:r></m:sup>
                </m:sSup>
            </m:oMath>
            <w:r><w:t> adalah …A. </w:t></w:r>
            <m:oMath>
                <m:f>
                    <m:num><m:r><m:t>1</m:t></m:r></m:num>
                    <m:den><m:r><m:t>2</m:t></m:r></m:den>
                </m:f>
            </m:oMath>
            <w:r><w:t>B. 2C. 3D. 4E. 5</w:t></w:r>
        </w:p>
        <w:p><w:r><w:t>Fisika</w:t></w:r></w:p>
        <w:p><w:r><w:t>2. Gaya termasuk besaran …A. vektorB. skalarC. pokokD. turunanE. dasar</w:t></w:r></w:p>
        <w:p><w:r><w:t>BAGIAN 2: KUNCI JAWABAN</w:t></w:r></w:p>
        <w:p><w:r><w:t>C</w:t></w:r></w:p>
        <w:p><w:r><w:t>A</w:t></w:r></w:p>
    </w:body>
</w:document>
XML);
        $zip->close();

        return new UploadedFile(
            $path,
            'sample-try-out.docx',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            UPLOAD_ERR_OK,
            true
        );
    }

    private function docxUploadWithEmbeddedImage(): UploadedFile
    {
        $path = tempnam(sys_get_temp_dir(), 'try-out-docx-image-');
        $zip = new ZipArchive;
        $zip->open($path, ZipArchive::OVERWRITE);
        $zip->addFromString('[Content_Types].xml', <<<'XML'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
    <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
    <Default Extension="xml" ContentType="application/xml"/>
    <Default Extension="png" ContentType="image/png"/>
    <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>
XML);
        $zip->addFromString('word/_rels/document.xml.rels', <<<'XML'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
    <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/image1.png"/>
</Relationships>
XML);
        $zip->addFromString('word/document.xml', <<<'XML'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing">
    <w:body>
        <w:p><w:r><w:t>BAGIAN 1: LEMBAR SOAL</w:t></w:r></w:p>
        <w:p><w:r><w:t>Biologi</w:t></w:r></w:p>
        <w:p>
            <w:r><w:t>1. Diagram berikut </w:t></w:r>
            <w:r><w:drawing><wp:inline><wp:docPr id="1" name="Picture 1" descr="Diagram soal"/><a:graphic><a:graphicData><a:blip r:embed="rId1"/></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>
            <w:r><w:t> menunjukkan ...A. SelB. JaringanC. OrganD. Sistem organE. Organisme</w:t></w:r>
        </w:p>
        <w:p><w:r><w:t>BAGIAN 2: KUNCI JAWABAN</w:t></w:r></w:p>
        <w:p><w:r><w:t>A</w:t></w:r></w:p>
    </w:body>
</w:document>
XML);
        $zip->addFromString(
            'word/media/image1.png',
            base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', true),
        );
        $zip->close();

        return new UploadedFile(
            $path,
            'try-out-with-image.docx',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            UPLOAD_ERR_OK,
            true,
        );
    }

    private function docxUploadWithGeometryLabel(): UploadedFile
    {
        return $this->docxUploadFromXml(<<<'XML'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math">
    <w:body>
        <w:p><w:r><w:t>BAGIAN 1: LEMBAR SOAL TKA SAINTEK</w:t></w:r></w:p>
        <w:p><w:r><w:t>Matematika IPA</w:t></w:r></w:p>
        <w:p>
            <w:r><w:t>1. Pada kubus </w:t></w:r>
            <m:oMath><m:r><m:t>ABCD</m:t></m:r><m:r><m:t>.</m:t></m:r><m:r><m:t>EFGH</m:t></m:r></m:oMath>
            <w:r><w:t>, jarak titik </w:t></w:r>
            <m:oMath><m:r><m:t>A</m:t></m:r></m:oMath>
            <w:r><w:t> ke bidang </w:t></w:r>
            <m:oMath><m:r><m:t>BDE</m:t></m:r></m:oMath>
            <w:r><w:t> adalah …A. </w:t></w:r>
            <m:oMath><m:rad><m:deg/><m:e><m:r><m:t>3</m:t></m:r></m:e></m:rad></m:oMath>
            <w:r><w:t> cmB. 2 cmC. 3 cmD. 4 cmE. 5 cm</w:t></w:r>
        </w:p>
        <w:p><w:r><w:t>BAGIAN 2: KUNCI JAWABAN</w:t></w:r></w:p>
        <w:p><w:r><w:t>A</w:t></w:r></w:p>
    </w:body>
</w:document>
XML, 'geometry-try-out.docx');
    }

    private function docxUploadWithLowercaseOptions(): UploadedFile
    {
        return $this->docxUploadFromXml(<<<'XML'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
    <w:body>
        <w:p><w:r><w:t>BAGIAN 1: LEMBAR SOAL TKA SOSHUM</w:t></w:r></w:p>
        <w:p><w:r><w:t>Matematika Dasar</w:t></w:r></w:p>
        <w:p><w:r><w:t>1. Hasil dari 2 + 2 adalah …</w:t></w:r></w:p>
        <w:p><w:r><w:t>a. 1</w:t><w:br/><w:t>b. 2</w:t><w:br/><w:t>c. 3</w:t><w:br/><w:t>d. 4</w:t><w:br/><w:t>e. 5</w:t></w:r></w:p>
        <w:p><w:r><w:t>BAGIAN 2: KUNCI JAWABAN</w:t></w:r></w:p>
        <w:p><w:r><w:t>d</w:t></w:r></w:p>
    </w:body>
</w:document>
XML, 'lowercase-options-try-out.docx');
    }

    private function docxUploadWithAutomaticNumbering(): UploadedFile
    {
        return $this->docxUploadFromXml(<<<'XML'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
    <w:body>
        <w:p><w:r><w:t>BAGIAN 1: LEMBAR SOAL TKA SAINTEK</w:t></w:r></w:p>
        <w:p><w:r><w:t>Biologi</w:t></w:r></w:p>
        <w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr></w:pPr><w:r><w:t>Organel apa yang paling berperan dalam produksi energi sel eukariotik?</w:t></w:r></w:p>
        <w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="2"/></w:numPr></w:pPr><w:r><w:t>Mitokondria menghasilkan ATP melalui respirasi seluler.</w:t></w:r></w:p>
        <w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="2"/></w:numPr></w:pPr><w:r><w:t>Ribosom menyusun protein berdasarkan RNA duta.</w:t></w:r></w:p>
        <w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="2"/></w:numPr></w:pPr><w:r><w:t>Lisosom mencerna partikel asing di sitoplasma.</w:t></w:r></w:p>
        <w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="2"/></w:numPr></w:pPr><w:r><w:t>Badan Golgi memodifikasi dan mengemas protein.</w:t></w:r></w:p>
        <w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="2"/></w:numPr></w:pPr><w:r><w:t>Nukleus menyimpan materi genetik utama sel.</w:t></w:r></w:p>
        <w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr></w:pPr><w:r><w:t>Jaringan tumbuhan mana yang bertugas mengangkut air dari akar menuju daun?</w:t></w:r></w:p>
        <w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="4"/></w:numPr></w:pPr><w:r><w:t>Floem mengangkut hasil fotosintesis.</w:t></w:r></w:p>
        <w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="4"/></w:numPr></w:pPr><w:r><w:t>Xilem mengangkut air dan mineral.</w:t></w:r></w:p>
        <w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="4"/></w:numPr></w:pPr><w:r><w:t>Epidermis melindungi permukaan organ.</w:t></w:r></w:p>
        <w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="4"/></w:numPr></w:pPr><w:r><w:t>Parenkim menyimpan cadangan makanan.</w:t></w:r></w:p>
        <w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="4"/></w:numPr></w:pPr><w:r><w:t>Kolenkim menopang organ muda.</w:t></w:r></w:p>
        <w:p><w:r><w:t>BAGIAN 2: KUNCI JAWABAN</w:t></w:r></w:p>
        <w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="3"/></w:numPr></w:pPr><w:r><w:t>E</w:t></w:r></w:p>
        <w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="3"/></w:numPr></w:pPr><w:r><w:t>B</w:t></w:r></w:p>
    </w:body>
</w:document>
XML, 'automatic-numbering-try-out.docx');
    }

    private function docxUploadFromXml(string $documentXml, string $fileName): UploadedFile
    {
        $path = tempnam(sys_get_temp_dir(), 'try-out-docx-');

        $zip = new ZipArchive;
        $zip->open($path, ZipArchive::OVERWRITE);
        $zip->addFromString('[Content_Types].xml', <<<'XML'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
    <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
    <Default Extension="xml" ContentType="application/xml"/>
    <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>
XML);
        $zip->addFromString('word/document.xml', $documentXml);
        $zip->close();

        return new UploadedFile(
            $path,
            $fileName,
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            UPLOAD_ERR_OK,
            true
        );
    }
}
