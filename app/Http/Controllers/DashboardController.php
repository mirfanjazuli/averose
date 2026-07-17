<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Mentor\DashboardController as MentorDashboardController;
use App\Http\Controllers\Student\DashboardController as StudentDashboardController;
use App\UserRole;
use Illuminate\Http\Request;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        return match ($request->user()->role) {
            UserRole::Admin => app(AdminDashboardController::class)($request),
            UserRole::Mentor => app(MentorDashboardController::class)($request),
            UserRole::Student => app(StudentDashboardController::class)($request),
        };
    }
}
