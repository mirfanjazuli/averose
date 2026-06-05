<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\SchedulesController;
use Illuminate\Support\Facades\Route;

Route::redirect('/', '/login')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', DashboardController::class)->name('dashboard');
    Route::get('schedules', SchedulesController::class)->name('schedules');

    Route::middleware('role:admin')->group(function () {
        Route::inertia('schedules/mentor-assignments', 'admin/schedules/mentor-assignments')->name('schedules.mentor-assignments');
        Route::inertia('schedules/reschedule-requests', 'admin/schedules/reschedule-requests')->name('schedules.reschedule-requests');
        Route::inertia('schedules/working-hours', 'admin/schedules/working-hours')->name('schedules.working-hours');
        Route::inertia('schedules/public-holidays', 'admin/schedules/public-holidays')->name('schedules.public-holidays');
        Route::inertia('students', 'admin/users/students')->name('students');
        Route::inertia('mentors', 'admin/users/mentors')->name('mentors');
        Route::inertia('fields', 'admin/academics/fields')->name('fields');
        Route::inertia('programs', 'admin/academics/programs')->name('programs');
        Route::inertia('subjects', 'admin/academics/subjects')->name('subjects');
        Route::inertia('zoom-accounts', 'admin/integrations/zoom-accounts')->name('zoom-accounts');
    });

    Route::middleware('role:student')->group(function () {
        Route::inertia('try-outs', 'student/try-outs')->name('try-outs');
    });
});

require __DIR__.'/settings.php';
