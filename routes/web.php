<?php

use App\Http\Controllers\Admin\AcademicFieldController;
use App\Http\Controllers\Admin\MentorJournalController;
use App\Http\Controllers\Admin\ProgramController;
use App\Http\Controllers\Admin\SessionAssignmentController;
use App\Http\Controllers\Admin\SubjectController;
use App\Http\Controllers\Admin\TryOutController as AdminTryOutController;
use App\Http\Controllers\Admin\UserManagementController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\MentorSessionCompletionController;
use App\Http\Controllers\RecordingsController;
use App\Http\Controllers\SchedulesController;
use App\Http\Controllers\SessionBookingController;
use App\Http\Controllers\StudentEnrollmentsController;
use App\Http\Controllers\TryOutsController;
use App\Http\Controllers\ZoomAccountsController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', DashboardController::class)->name('dashboard');
    Route::get('scheduling/schedules', SchedulesController::class)->name('schedules');

    Route::middleware('role:admin')->group(function () {
        Route::inertia('scheduling/mentor-assignments', 'admin/schedules/mentor-assignments')->name('schedules.mentor-assignments');
        Route::inertia('scheduling/reschedule-requests', 'admin/schedules/reschedule-requests')->name('schedules.reschedule-requests');
        Route::inertia('scheduling/working-hours', 'admin/schedules/working-hours')->name('schedules.working-hours');
        Route::inertia('scheduling/public-holidays', 'admin/schedules/public-holidays')->name('schedules.public-holidays');
        Route::put('scheduling/schedules/{session_booking}/assignment', [SessionAssignmentController::class, 'update'])->name('schedules.assignment.update');
        Route::get('users/students', [UserManagementController::class, 'students'])->name('students');
        Route::post('users/students', [UserManagementController::class, 'storeStudent'])->name('students.store');
        Route::get('users/students/{user}', [UserManagementController::class, 'showStudent'])->name('students.show');
        Route::post('users/students/{user}/enrollments', [UserManagementController::class, 'storeStudentEnrollment'])->name('students.enrollments.store');
        Route::get('users/mentors', [UserManagementController::class, 'mentors'])->name('mentors');
        Route::post('users/mentors', [UserManagementController::class, 'storeMentor'])->name('mentors.store');
        Route::get('users/mentors/{user}', [UserManagementController::class, 'showMentor'])->name('mentors.show');
        Route::put('users/{user}', [UserManagementController::class, 'update'])->name('users.update');
        Route::delete('users/{user}', [UserManagementController::class, 'destroy'])->name('users.destroy');
        Route::get('academics/fields', [AcademicFieldController::class, 'index'])->name('fields');
        Route::post('academics/fields', [AcademicFieldController::class, 'store'])->name('fields.store');
        Route::put('academics/fields/{academic_field}', [AcademicFieldController::class, 'update'])->name('fields.update');
        Route::delete('academics/fields/{academic_field}', [AcademicFieldController::class, 'destroy'])->name('fields.destroy');
        Route::get('academics/programs', [ProgramController::class, 'index'])->name('programs');
        Route::post('academics/programs', [ProgramController::class, 'store'])->name('programs.store');
        Route::put('academics/programs/{program}/variants/{variant}', [ProgramController::class, 'updateVariant'])->name('programs.variants.update');
        Route::get('academics/programs/{program}', [ProgramController::class, 'show'])->name('programs.show');
        Route::put('academics/programs/{program}', [ProgramController::class, 'update'])->name('programs.update');
        Route::delete('academics/programs/{program}', [ProgramController::class, 'destroy'])->name('programs.destroy');
        Route::get('academics/subjects', [SubjectController::class, 'index'])->name('subjects');
        Route::post('academics/subjects', [SubjectController::class, 'store'])->name('subjects.store');
        Route::put('academics/subjects/{subject}', [SubjectController::class, 'update'])->name('subjects.update');
        Route::delete('academics/subjects/{subject}', [SubjectController::class, 'destroy'])->name('subjects.destroy');
        Route::get('academics/try-outs', [AdminTryOutController::class, 'index'])->name('admin.try-outs');
        Route::get('academics/try-outs/import/template', [AdminTryOutController::class, 'template'])->name('admin.try-outs.import.template');
        Route::post('academics/try-outs/import/preview', [AdminTryOutController::class, 'preview'])->name('admin.try-outs.import.preview');
        Route::post('academics/try-outs/import', [AdminTryOutController::class, 'import'])->name('admin.try-outs.import');
        Route::get('academics/try-outs/{try_out}', [AdminTryOutController::class, 'show'])->name('admin.try-outs.show');
        Route::put('academics/try-outs/{try_out}', [AdminTryOutController::class, 'update'])->name('admin.try-outs.update');
        Route::post('academics/try-outs/{try_out}/reimport/preview', [AdminTryOutController::class, 'reimportPreview'])->name('admin.try-outs.reimport.preview');
        Route::post('academics/try-outs/{try_out}/reimport', [AdminTryOutController::class, 'reimport'])->name('admin.try-outs.reimport');
        Route::put('academics/try-outs/{try_out}/questions/{question}', [AdminTryOutController::class, 'updateQuestion'])->name('admin.try-outs.questions.update');
        Route::put('academics/try-outs/{try_out}/publish', [AdminTryOutController::class, 'publish'])->name('admin.try-outs.publish');
        Route::put('academics/try-outs/{try_out}/unpublish', [AdminTryOutController::class, 'unpublish'])->name('admin.try-outs.unpublish');
        Route::get('monitoring/mentor-journals', [MentorJournalController::class, 'index'])->name('monitoring.mentor-journals');
        Route::get('monitoring/mentor-journals/{journal}', [MentorJournalController::class, 'show'])->name('monitoring.mentor-journals.show');
        Route::get('monitoring/recordings', [RecordingsController::class, 'index'])->name('monitoring.recordings');
        Route::post('monitoring/recordings', [RecordingsController::class, 'store'])->name('monitoring.recordings.store');
        Route::get('zoom-accounts', [ZoomAccountsController::class, 'index'])->name('zoom-accounts');
        Route::post('zoom-accounts', [ZoomAccountsController::class, 'store'])->name('zoom-accounts.store');
        Route::get('zoom-accounts/{zoom_account}', [ZoomAccountsController::class, 'show'])->name('zoom-accounts.show');
        Route::put('zoom-accounts/{zoom_account}', [ZoomAccountsController::class, 'update'])->name('zoom-accounts.update');
        Route::delete('zoom-accounts/{zoom_account}', [ZoomAccountsController::class, 'destroy'])->name('zoom-accounts.destroy');
    });

    Route::middleware('role:student')->group(function () {
        Route::get('enrollments', StudentEnrollmentsController::class)->name('enrollments');
        Route::get('recordings', [RecordingsController::class, 'index'])->name('student.recordings');
        Route::post('scheduling/schedules/bookings', [SessionBookingController::class, 'store'])->name('session-bookings.store');
        Route::get('try-outs', [TryOutsController::class, 'index'])->name('try-outs');
        Route::get('try-outs/results', [TryOutsController::class, 'results'])->name('try-outs.results');
        Route::get('try-outs/{try_out}/results/{try_out_attempt}', [TryOutsController::class, 'result'])->name('try-outs.results.show');
        Route::get('try-outs/{try_out}', [TryOutsController::class, 'show'])->name('try-outs.show');
        Route::post('try-outs/{try_out}/submit', [TryOutsController::class, 'submit'])->name('try-outs.submit');
    });

    Route::middleware('role:mentor')->group(function () {
        Route::post('mentor/sessions/{session_booking}/complete', [MentorSessionCompletionController::class, 'store'])->name('mentor.sessions.complete');
    });
});

require __DIR__.'/settings.php';
