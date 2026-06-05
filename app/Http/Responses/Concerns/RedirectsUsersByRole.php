<?php

namespace App\Http\Responses\Concerns;

use App\Models\User;

trait RedirectsUsersByRole
{
    protected function redirectPathFor(User $user): string
    {
        return route('dashboard', absolute: false);
    }
}
