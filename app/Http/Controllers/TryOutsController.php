<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response;

class TryOutsController extends Controller
{
    /**
     * Handle the incoming request.
     */
    public function __invoke(): Response
    {
        return Inertia::render('student/try-outs');
    }
}
