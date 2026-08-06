<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreProgramMaterialsRequest;
use App\Http\Requests\UpdateProgramMaterialRequest;
use App\Models\Program;
use App\Models\ProgramMaterial;
use App\Services\ProgramAssetStorage;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Throwable;

class ProgramMaterialController extends Controller
{
    public function store(
        StoreProgramMaterialsRequest $request,
        Program $program,
        ProgramAssetStorage $storage,
    ): RedirectResponse {
        $uploads = [];

        try {
            foreach ($request->file('materials', []) as $file) {
                $uploads[] = $storage->storeMaterial($file, $program);
            }

            DB::transaction(function () use ($program, $request, $uploads): void {
                foreach ($uploads as $upload) {
                    $program->materials()->create([
                        ...$upload,
                        'uploaded_by' => $request->user()->id,
                        'title' => pathinfo($upload['original_name'], PATHINFO_FILENAME),
                        'status' => 'active',
                    ]);
                }
            });
        } catch (Throwable $exception) {
            $storage->deleteUploads($uploads);

            throw $exception;
        }

        return back();
    }

    public function update(
        UpdateProgramMaterialRequest $request,
        Program $program,
        ProgramMaterial $programMaterial,
    ): RedirectResponse {
        $this->ensureBelongsToProgram($program, $programMaterial);
        $programMaterial->update($request->validated());

        return back();
    }

    public function updateStatus(
        Request $request,
        Program $program,
        ProgramMaterial $programMaterial,
    ): RedirectResponse {
        abort_unless($request->user()?->hasPermission('programs.update'), 403);
        $this->ensureBelongsToProgram($program, $programMaterial);

        $validated = $request->validate([
            'status' => ['required', 'in:active,inactive'],
        ]);

        $programMaterial->update($validated);

        return back();
    }

    private function ensureBelongsToProgram(Program $program, ProgramMaterial $material): void
    {
        abort_unless($material->program_id === $program->id, 404);
    }
}
