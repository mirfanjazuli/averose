<?php

namespace App\Http\Controllers;

use App\UserRole;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * Handle the incoming request.
     */
    public function __invoke(Request $request): Response
    {
        return Inertia::render(match ($request->user()->role) {
            UserRole::Admin => 'admin/dashboard',
            UserRole::Mentor => 'mentor/dashboard',
            UserRole::Student => 'student/dashboard',
        });
    }
}
