<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Mentor\ScheduleController as MentorScheduleController;
use App\Http\Controllers\Student\ScheduleController as StudentScheduleController;
use App\UserRole;
use Illuminate\Http\Request;
use Inertia\Response;

class SchedulePageController extends Controller
{
    /**
     * Dispatch the shared /schedules URL to the role-specific page controller.
     */
    public function __invoke(Request $request): Response
    {
        return match ($request->user()->role) {
            UserRole::Mentor => app(MentorScheduleController::class)->index($request),
            UserRole::Student => app(StudentScheduleController::class)->index($request),
            default => abort(403),
        };
    }
}
