<?php

namespace Tests\Feature;

use App\Models\TryOut;
use App\Models\TryOutQuestion;
use App\Models\User;
use App\Services\TryOutDocumentImporter;
use App\Services\TryOutDocumentTemplate;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
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
                ->component('admin/try-outs')
                ->has('tryOuts')
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
                'status' => 'published',
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
            ->assertRedirect()
            ->assertSessionHasNoErrors();

        $this->assertDatabaseHas('try_outs', [
            'duration_minutes' => 120,
            'source_file_name' => null,
            'status' => 'published',
            'title' => 'SMUA UNAIR Saintek',
        ]);

        $this->assertDatabaseHas('try_out_questions', [
            'answer' => 'C',
            'number' => 1,
            'options->A' => '(1)/(2)',
            'options_html->A' => '<math class="math-equation" xmlns="http://www.w3.org/1998/Math/MathML"><mrow><mfrac><mrow><mn>1</mn></mrow><mrow><mn>2</mn></mrow></mfrac></mrow></math>',
            'question_html' => 'Nilai dari <math class="math-equation" xmlns="http://www.w3.org/1998/Math/MathML"><mrow><msup><mrow><mi>x</mi></mrow><mrow><mn>2</mn></mrow></msup></mrow></math> adalah …',
            'question_text' => 'Nilai dari x^2 adalah …',
            'subject_name' => 'Matematika IPA',
        ]);

        $this->assertDatabaseHas('try_out_questions', [
            'answer' => 'A',
            'number' => 2,
            'question_text' => 'Gaya termasuk besaran …',
            'subject_name' => 'Fisika',
        ]);
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

        $this->assertDatabaseHas('try_out_questions', [
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

        $this->assertDatabaseHas('try_out_questions', [
            'answer' => 'D',
            'number' => 1,
            'options->A' => '1',
            'options->D' => '4',
            'question_text' => 'Hasil dari 2 + 2 adalah …',
            'subject_name' => 'Matematika Dasar',
        ]);
    }

    public function test_admin_users_can_reimport_try_out_questions_from_docx(): void
    {
        $user = User::factory()->admin()->create();
        $tryOut = TryOut::factory()
            ->hasQuestions(1, [
                'number' => 1,
                'question_text' => 'Old question',
            ])
            ->create([
                'duration_minutes' => 90,
                'status' => 'published',
                'title' => 'Existing Try Out',
            ]);
        $oldQuestionId = $tryOut->questions()->firstOrFail()->id;

        $this
            ->actingAs($user)
            ->post(route('admin.try-outs.reimport.preview', $tryOut), [
                'document' => $this->docxUpload(),
            ])
            ->assertRedirect()
            ->assertSessionHasNoErrors()
            ->assertSessionHas('tryOutReimportPreview');

        $preview = session('tryOutReimportPreview');

        $this
            ->actingAs($user)
            ->post(route('admin.try-outs.reimport', $tryOut), [
                'token' => $preview['token'],
            ])
            ->assertRedirect()
            ->assertSessionHasNoErrors()
            ->assertSessionHas('success', 'Existing Try Out questions reimported successfully.');

        $this->assertDatabaseHas('try_outs', [
            'duration_minutes' => 90,
            'id' => $tryOut->id,
            'status' => 'published',
            'title' => 'Existing Try Out',
        ]);
        $this->assertDatabaseMissing('try_out_questions', [
            'id' => $oldQuestionId,
        ]);
        $this->assertDatabaseHas('try_out_questions', [
            'answer' => 'C',
            'number' => 1,
            'question_text' => 'Nilai dari x^2 adalah …',
            'try_out_id' => $tryOut->id,
        ]);
        $this->assertDatabaseHas('try_out_questions', [
            'answer' => 'A',
            'number' => 2,
            'question_text' => 'Gaya termasuk besaran …',
            'try_out_id' => $tryOut->id,
        ]);
    }

    public function test_reimport_preview_is_shared_with_the_try_out_detail_page(): void
    {
        $user = User::factory()->admin()->create();
        $tryOut = TryOut::factory()->create(['title' => 'Existing Try Out']);

        $this
            ->actingAs($user)
            ->post(route('admin.try-outs.reimport.preview', $tryOut), [
                'document' => $this->docxUpload(),
            ])
            ->assertRedirect()
            ->assertSessionHas('tryOutReimportPreview');

        $response = $this
            ->withSession([
                'tryOutReimportPreview' => session('tryOutReimportPreview'),
            ])
            ->actingAs($user)
            ->get(route('admin.try-outs.show', $tryOut));

        $response
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('flash.tryOutReimportPreview.title', 'Existing Try Out')
                ->where('flash.tryOutReimportPreview.questionCount', 2)
            );
    }

    public function test_imported_try_outs_are_sent_to_the_admin_page(): void
    {
        $user = User::factory()->admin()->create();
        $tryOut = TryOut::factory()
            ->hasQuestions(2)
            ->create(['status' => 'published', 'title' => 'Imported Try Out']);

        $response = $this->actingAs($user)->get(route('admin.try-outs'));

        $response
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/try-outs')
                ->where('tryOuts.0.id', (string) $tryOut->id)
                ->where('tryOuts.0.questions', 2)
                ->where('tryOuts.0.status', 'Published')
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
                ->component('admin/try-out-detail')
                ->where('tryOut.title', 'Detail Try Out')
                ->where('tryOut.duration', '120 min')
                ->where('tryOut.questionsCount', 2)
            );
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

        $this->assertDatabaseHas('try_out_questions', [
            'answer' => 'D',
            'id' => $question->id,
            'options->D' => 'Fourth option',
            'question_html' => 'Updated question text?',
            'question_text' => 'Updated question text?',
            'subject_name' => 'Matematika Dasar',
        ]);
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

        $this->assertDatabaseHas('try_out_questions', [
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

        $this->assertDatabaseHas('try_out_questions', [
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
            'status' => 'published',
            'title' => 'Published Try Out',
        ]);

        $this
            ->actingAs($user)
            ->put(route('admin.try-outs.unpublish', $tryOut))
            ->assertRedirect()
            ->assertSessionHas('success', 'Published Try Out unpublished successfully.');

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

        $this
            ->actingAs($user)
            ->put(route('admin.try-outs.publish', $tryOut))
            ->assertRedirect()
            ->assertSessionHas('success', 'Draft Try Out published successfully.');

        $this->assertDatabaseHas('try_outs', [
            'id' => $tryOut->id,
            'status' => 'published',
        ]);
    }

    public function test_try_out_import_template_can_be_parsed(): void
    {
        $path = app(TryOutDocumentTemplate::class)->create();

        $questions = app(TryOutDocumentImporter::class)->parse($path);

        @unlink($path);

        $this->assertCount(3, $questions);
        $this->assertSame('Matematika Dasar', $questions[0]['subject_name']);
        $this->assertSame('D', $questions[0]['answer']);
        $this->assertSame(['A', 'B', 'C', 'D', 'E'], array_keys($questions[0]['options']));
        $this->assertSame('Bahasa Indonesia', $questions[2]['subject_name']);
        $this->assertSame('B', $questions[2]['answer']);
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
