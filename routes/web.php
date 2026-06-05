<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\SchedulesController;
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
        Route::inertia('users/students', 'admin/users/students')->name('students');
        Route::inertia('users/mentors', 'admin/users/mentors')->name('mentors');
        Route::inertia('academics/fields', 'admin/academics/fields')->name('fields');
        Route::inertia('academics/programs', 'admin/academics/programs')->name('programs');
        Route::inertia('academics/subjects', 'admin/academics/subjects')->name('subjects');
        Route::inertia('academics/try-outs', 'admin/try-outs')->name('admin.try-outs');
        Route::get('zoom-accounts', [ZoomAccountsController::class, 'index'])->name('zoom-accounts');
        Route::post('zoom-accounts', [ZoomAccountsController::class, 'store'])->name('zoom-accounts.store');
        Route::get('zoom-accounts/{zoom_account}', [ZoomAccountsController::class, 'show'])->name('zoom-accounts.show');
        Route::put('zoom-accounts/{zoom_account}', [ZoomAccountsController::class, 'update'])->name('zoom-accounts.update');
        Route::delete('zoom-accounts/{zoom_account}', [ZoomAccountsController::class, 'destroy'])->name('zoom-accounts.destroy');
    });

    Route::middleware('role:student')->group(function () {
        Route::get('try-outs', TryOutsController::class)->name('try-outs');
    });
});

require __DIR__.'/settings.php';
