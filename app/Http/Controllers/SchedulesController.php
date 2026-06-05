<?php

namespace App\Http\Controllers;

use App\UserRole;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SchedulesController extends Controller
{
    /**
     * Handle the incoming request.
     */
    public function __invoke(Request $request): Response
    {
        return match ($request->user()->role) {
            UserRole::Admin => Inertia::render('admin/schedules/index'),
            UserRole::Mentor => Inertia::render('mentor/schedules'),
            UserRole::Student => Inertia::render('student/schedules'),
        };
    }
}
