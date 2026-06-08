<?php

use App\Http\Controllers\Admin\AcademicFieldController;
use App\Http\Controllers\Admin\ProgramController;
use App\Http\Controllers\Admin\SessionAssignmentController;
use App\Http\Controllers\Admin\SubjectController;
use App\Http\Controllers\Admin\UserManagementController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\SchedulesController;
use App\Http\Controllers\SessionBookingController;
use App\Http\Controllers\StudentEnrollmentsController;
use App\Http\Controllers\TryOutsController;
use App\Http\Controllers\ZoomAccountsController;
use Illuminate\Support\Facades\Route;

Route::redirect('/', '/login')->name('home');

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
        Route::inertia('academics/try-outs', 'admin/try-outs')->name('admin.try-outs');
        Route::get('zoom-accounts', [ZoomAccountsController::class, 'index'])->name('zoom-accounts');
        Route::post('zoom-accounts', [ZoomAccountsController::class, 'store'])->name('zoom-accounts.store');
        Route::get('zoom-accounts/{zoom_account}', [ZoomAccountsController::class, 'show'])->name('zoom-accounts.show');
        Route::put('zoom-accounts/{zoom_account}', [ZoomAccountsController::class, 'update'])->name('zoom-accounts.update');
        Route::delete('zoom-accounts/{zoom_account}', [ZoomAccountsController::class, 'destroy'])->name('zoom-accounts.destroy');
    });

    Route::middleware('role:student')->group(function () {
        Route::get('enrollments', StudentEnrollmentsController::class)->name('enrollments');
        Route::post('scheduling/schedules/bookings', [SessionBookingController::class, 'store'])->name('session-bookings.store');
        Route::get('try-outs', TryOutsController::class)->name('try-outs');
    });
});

require __DIR__.'/settings.php';
