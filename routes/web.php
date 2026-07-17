<?php

use App\Http\Controllers\Admin\AcademicFieldController;
use App\Http\Controllers\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Admin\MentorJournalController;
use App\Http\Controllers\Admin\ProgramController;
use App\Http\Controllers\Admin\PublicHolidayController as AdminPublicHolidayController;
use App\Http\Controllers\Admin\RecordingController as AdminRecordingController;
use App\Http\Controllers\Admin\RescheduleRequestController as AdminRescheduleRequestController;
use App\Http\Controllers\Admin\RoleController;
use App\Http\Controllers\Admin\ScheduleAssignmentController;
use App\Http\Controllers\Admin\ScheduleController as AdminScheduleController;
use App\Http\Controllers\Admin\SubjectController;
use App\Http\Controllers\Admin\TryOutAssetController as AdminTryOutAssetController;
use App\Http\Controllers\Admin\TryOutController as AdminTryOutController;
use App\Http\Controllers\Admin\UserManagementController;
use App\Http\Controllers\Admin\WorkingHourController as AdminWorkingHourController;
use App\Http\Controllers\Admin\ZoomAccountController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\Mentor\JournalController as MentorJournalPageController;
use App\Http\Controllers\Mentor\SessionCompletionController;
use App\Http\Controllers\SchedulePageController;
use App\Http\Controllers\Shared\TryOutAssetController;
use App\Http\Controllers\Student\EnrollmentController as StudentEnrollmentController;
use App\Http\Controllers\Student\RecordingController as StudentRecordingController;
use App\Http\Controllers\Student\RescheduleRequestController as StudentRescheduleRequestController;
use App\Http\Controllers\Student\ScheduleController as StudentScheduleController;
use App\Http\Controllers\Student\TryOutController as StudentTryOutController;
use App\Models\Program;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome', [
        'programs' => Program::query()
            ->where('status', 'active')
            ->with(['fields:id,name'])
            ->latest()
            ->get(['id', 'name', 'slug', 'thumbnail', 'description'])
            ->map(fn (Program $program): array => [
                'description' => $program->description,
                'eyebrow' => $program->fields->pluck('name')->join(', ') ?: 'Program belajar',
                'id' => $program->id,
                'slug' => $program->slug,
                'thumbnailUrl' => $program->thumbnail ? Storage::disk('public')->url($program->thumbnail) : null,
                'title' => $program->name,
            ]),
    ]);
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', DashboardController::class)->name('dashboard');
    Route::get('schedules', SchedulePageController::class)->name('mentor.schedules');
    Route::get('try-out-assets/{try_out_asset:uuid}', [TryOutAssetController::class, 'show'])->name('try-out-assets.show');

    Route::middleware('role:admin')->group(function () {
        Route::get('dashboard/download-pdf', [AdminDashboardController::class, 'downloadAdminPdf'])
            ->middleware('permission:dashboard.export_pdf')
            ->name('dashboard.download-pdf');

        Route::prefix('scheduling')->group(function () {
            Route::prefix('schedules')->group(function () {
                Route::get('/', [AdminScheduleController::class, 'index'])->middleware('permission:schedules.view')->name('schedules');
                Route::put('{schedule}/assignment', [ScheduleAssignmentController::class, 'update'])->middleware('permission:schedules.assign')->name('schedules.assignment.update');
            });

            Route::prefix('working-hours')->group(function () {
                Route::get('/', [AdminWorkingHourController::class, 'index'])->middleware('permission:schedules.view')->name('schedules.working-hours');
                Route::put('{working_hour}', [AdminWorkingHourController::class, 'update'])->middleware('permission:schedules.view')->name('schedules.working-hours.update');
            });

            Route::prefix('public-holidays')->group(function () {
                Route::get('/', [AdminPublicHolidayController::class, 'index'])->middleware('permission:schedules.view')->name('schedules.public-holidays');
                Route::post('/', [AdminPublicHolidayController::class, 'store'])->middleware('permission:schedules.view')->name('schedules.public-holidays.store');
                Route::post('import', [AdminPublicHolidayController::class, 'import'])->middleware('permission:schedules.view')->name('schedules.public-holidays.import');
                Route::put('{public_holiday}', [AdminPublicHolidayController::class, 'update'])->middleware('permission:schedules.view')->name('schedules.public-holidays.update');
                Route::delete('{public_holiday}', [AdminPublicHolidayController::class, 'destroy'])->middleware('permission:schedules.view')->name('schedules.public-holidays.destroy');
            });

            Route::prefix('reschedule-requests')->group(function () {
                Route::get('/', [AdminRescheduleRequestController::class, 'index'])->middleware('permission:schedules.view')->name('schedules.reschedule-requests');
                Route::put('{reschedule_request}/approve', [AdminRescheduleRequestController::class, 'approve'])->middleware('permission:reschedule_requests.approve')->name('schedules.reschedule-requests.approve');
                Route::put('{reschedule_request}/reject', [AdminRescheduleRequestController::class, 'reject'])->middleware('permission:reschedule_requests.reject')->name('schedules.reschedule-requests.reject');
            });
        });

        Route::prefix('users')->group(function () {
            Route::put('{user}', [UserManagementController::class, 'update'])->middleware('permission:students.update,mentors.update,internal.update')->name('users.update');
            Route::delete('{user}', [UserManagementController::class, 'destroy'])->middleware('permission:students.delete,mentors.delete,internal.delete')->name('users.destroy');

            Route::prefix('internal')->group(function () {
                Route::get('/', [UserManagementController::class, 'internal'])->middleware('permission:internal.view')->name('internal');
                Route::post('/', [UserManagementController::class, 'storeInternal'])->middleware('permission:internal.create')->name('internal.store');
            });

            Route::prefix('roles')->group(function () {
                Route::get('/', [RoleController::class, 'index'])->middleware('permission:roles.view')->name('roles');
                Route::post('/', [RoleController::class, 'store'])->middleware('permission:roles.create')->name('roles.store');
                Route::put('{role}', [RoleController::class, 'update'])->middleware('permission:roles.update')->name('roles.update');
                Route::delete('{role}', [RoleController::class, 'destroy'])->middleware('permission:roles.delete')->name('roles.destroy');
            });

            Route::prefix('students')->group(function () {
                Route::get('/', [UserManagementController::class, 'students'])->middleware('permission:students.view')->name('students');
                Route::post('/', [UserManagementController::class, 'storeStudent'])->middleware('permission:students.create')->name('students.store');
                Route::get('{user}', [UserManagementController::class, 'showStudent'])->middleware('permission:students.view')->name('students.show');
                Route::post('{user}/enrollments', [UserManagementController::class, 'storeStudentEnrollment'])->middleware('permission:students.manage_enrollments')->name('students.enrollments.store');
                Route::post('{user}/try-out-access', [UserManagementController::class, 'storeStudentTryOutAccess'])->middleware('permission:students.manage_try_out_access')->name('students.try-out-access.store');
                Route::delete('{user}/try-out-access/{try_out_access}', [UserManagementController::class, 'destroyStudentTryOutAccess'])->middleware('permission:students.manage_try_out_access')->name('students.try-out-access.destroy');
            });

            Route::prefix('mentors')->group(function () {
                Route::get('/', [UserManagementController::class, 'mentors'])->middleware('permission:mentors.view')->name('mentors');
                Route::post('/', [UserManagementController::class, 'storeMentor'])->middleware('permission:mentors.create')->name('mentors.store');
                Route::get('{user}', [UserManagementController::class, 'showMentor'])->middleware('permission:mentors.view')->name('mentors.show');
            });
        });

        Route::prefix('academics')->group(function () {
            Route::prefix('fields')->group(function () {
                Route::get('/', [AcademicFieldController::class, 'index'])->middleware('permission:fields.view')->name('fields');
                Route::post('/', [AcademicFieldController::class, 'store'])->middleware('permission:fields.create')->name('fields.store');
                Route::put('{academic_field}', [AcademicFieldController::class, 'update'])->middleware('permission:fields.update')->name('fields.update');
                Route::delete('{academic_field}', [AcademicFieldController::class, 'destroy'])->middleware('permission:fields.delete')->name('fields.destroy');
            });

            Route::prefix('programs')->group(function () {
                Route::get('/', [ProgramController::class, 'index'])->middleware('permission:programs.view')->name('programs');
                Route::post('/', [ProgramController::class, 'store'])->middleware('permission:programs.create')->name('programs.store');
                Route::put('{program}/variants/{variant}', [ProgramController::class, 'updateVariant'])->middleware('permission:programs.update')->name('programs.variants.update');
                Route::get('{program}', [ProgramController::class, 'show'])->middleware('permission:programs.view')->name('programs.show');
                Route::put('{program}', [ProgramController::class, 'update'])->middleware('permission:programs.update')->name('programs.update');
                Route::delete('{program}', [ProgramController::class, 'destroy'])->middleware('permission:programs.delete')->name('programs.destroy');
            });

            Route::prefix('subjects')->group(function () {
                Route::get('/', [SubjectController::class, 'index'])->middleware('permission:subjects.view')->name('subjects');
                Route::post('/', [SubjectController::class, 'store'])->middleware('permission:subjects.create')->name('subjects.store');
                Route::put('{subject}', [SubjectController::class, 'update'])->middleware('permission:subjects.update')->name('subjects.update');
                Route::delete('{subject}', [SubjectController::class, 'destroy'])->middleware('permission:subjects.delete')->name('subjects.destroy');
            });

            Route::prefix('try-outs')->group(function () {
                Route::get('/', [AdminTryOutController::class, 'index'])->middleware('permission:try_outs.view')->name('admin.try-outs');
                Route::get('import', [AdminTryOutController::class, 'importPage'])->middleware('permission:try_outs.import')->name('admin.try-outs.import.page');
                Route::get('import/template', [AdminTryOutController::class, 'template'])->middleware('permission:try_outs.import')->name('admin.try-outs.import.template');
                Route::post('import/preview', [AdminTryOutController::class, 'preview'])->middleware('permission:try_outs.import')->name('admin.try-outs.import.preview');
                Route::post('import', [AdminTryOutController::class, 'import'])->middleware('permission:try_outs.import')->name('admin.try-outs.import');
                Route::get('{try_out}/leaderboard', [AdminTryOutController::class, 'leaderboard'])->middleware('permission:try_outs.view_leaderboard')->name('admin.try-outs.leaderboard');
                Route::get('{try_out}/questions', [AdminTryOutController::class, 'questions'])->middleware('permission:try_outs.manage_questions')->name('admin.try-outs.questions');
                Route::get('{try_out}', [AdminTryOutController::class, 'show'])->middleware('permission:try_outs.view')->name('admin.try-outs.show');
                Route::put('{try_out}', [AdminTryOutController::class, 'update'])->middleware('permission:try_outs.update')->name('admin.try-outs.update');
                Route::post('{try_out}/groups', [AdminTryOutController::class, 'storeGroup'])->middleware('permission:try_outs.manage_groups')->name('admin.try-outs.groups.store');
                Route::put('{try_out}/groups/{try_out_group}/deactivate', [AdminTryOutController::class, 'deactivateGroup'])->middleware('permission:try_outs.manage_groups')->name('admin.try-outs.groups.deactivate');
                Route::post('{try_out}/assets', [AdminTryOutAssetController::class, 'store'])->middleware('permission:try_outs.manage_questions')->name('admin.try-outs.assets.store');
                Route::put('{try_out}/questions/{question}', [AdminTryOutController::class, 'updateQuestion'])->middleware('permission:try_outs.manage_questions')->name('admin.try-outs.questions.update');
                Route::put('{try_out}/publish', [AdminTryOutController::class, 'publish'])->middleware('permission:try_outs.publish')->name('admin.try-outs.publish');
                Route::put('{try_out}/unpublish', [AdminTryOutController::class, 'unpublish'])->middleware('permission:try_outs.unpublish')->name('admin.try-outs.unpublish');
            });
        });

        Route::prefix('monitoring')->group(function () {
            Route::prefix('mentor-journals')->group(function () {
                Route::get('/', [MentorJournalController::class, 'index'])->middleware('permission:mentor_journals.view')->name('monitoring.mentor-journals');
                Route::get('{journal}', [MentorJournalController::class, 'show'])->middleware('permission:mentor_journals.view')->name('monitoring.mentor-journals.show');
            });

            Route::prefix('recordings')->group(function () {
                Route::get('/', [AdminRecordingController::class, 'index'])->middleware('permission:recordings.view')->name('monitoring.recordings');
                Route::post('/', [AdminRecordingController::class, 'store'])->middleware('permission:recordings.create')->name('monitoring.recordings.store');
                Route::delete('{recording}', [AdminRecordingController::class, 'destroy'])->middleware('permission:recordings.deactivate')->name('monitoring.recordings.destroy');
            });
        });

        Route::prefix('zoom-accounts')->group(function () {
            Route::get('/', [ZoomAccountController::class, 'index'])->middleware('permission:zoom_accounts.view')->name('zoom-accounts');
            Route::post('/', [ZoomAccountController::class, 'store'])->middleware('permission:zoom_accounts.create')->name('zoom-accounts.store');
            Route::get('{zoom_account}', [ZoomAccountController::class, 'show'])->middleware('permission:zoom_accounts.view')->name('zoom-accounts.show');
            Route::put('{zoom_account}', [ZoomAccountController::class, 'update'])->middleware('permission:zoom_accounts.update')->name('zoom-accounts.update');
            Route::delete('{zoom_account}', [ZoomAccountController::class, 'destroy'])->middleware('permission:zoom_accounts.delete')->name('zoom-accounts.destroy');
        });
    });

    Route::middleware('role:student')->group(function () {
        Route::get('enrollments', StudentEnrollmentController::class)->name('enrollments');
        Route::get('recordings', [StudentRecordingController::class, 'index'])->name('student.recordings');

        Route::prefix('schedules')->group(function () {
            Route::post('/', [StudentScheduleController::class, 'store'])->name('schedules.store');
            Route::put('{schedule}', [StudentScheduleController::class, 'update'])->name('schedules.update');
            Route::post('{schedule}/reschedule-requests', [StudentRescheduleRequestController::class, 'store'])->name('reschedule-requests.store');
        });

        Route::prefix('try-outs')->group(function () {
            Route::get('/', [StudentTryOutController::class, 'index'])->name('try-outs');
            Route::post('redeem', [StudentTryOutController::class, 'redeem'])->name('try-outs.redeem');
            Route::get('results', [StudentTryOutController::class, 'results'])->name('try-outs.results');
            Route::get('{try_out}/results/{try_out_attempt}', [StudentTryOutController::class, 'result'])->name('try-outs.results.show');
            Route::get('{try_out}', [StudentTryOutController::class, 'show'])->name('try-outs.show');
            Route::post('{try_out}/submit', [StudentTryOutController::class, 'submit'])->name('try-outs.submit');
        });
    });

    Route::middleware('role:mentor')->group(function () {
        Route::prefix('journals')->group(function () {
            Route::get('/', [MentorJournalPageController::class, 'index'])->name('mentor.journals');
            Route::get('{journal}', [MentorJournalPageController::class, 'show'])->name('mentor.journals.show');
        });

        Route::redirect('mentor/journals', 'journals');
        Route::post('mentor/sessions/{schedule}/complete', [SessionCompletionController::class, 'store'])->name('mentor.sessions.complete');
    });
});

require __DIR__.'/settings.php';
