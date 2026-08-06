<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class UserAccountAnonymizer
{
    public function anonymize(User $user): void
    {
        DB::transaction(function () use ($user): void {
            $originalEmail = $user->email;

            $user->passkeys()->delete();
            $user->notifications()->delete();
            DB::table('sessions')->where('user_id', $user->getKey())->delete();
            $user->studentProfile()->update([
                'parent_phone' => null,
                'school' => null,
                'education_level' => null,
                'grade' => null,
            ]);
            $user->mentorProfile()->update([
                'bio' => null,
                'expertise' => null,
                'bank_name' => null,
                'bank_account_name' => null,
                'bank_account_number' => null,
            ]);
            $user->internalProfile()->update([
                'department' => null,
                'position' => null,
                'employee_code' => null,
            ]);

            DB::table('password_reset_tokens')->where('email', $originalEmail)->delete();

            $user->forceFill([
                'name' => 'Deleted user',
                'email' => sprintf('deleted+%d.%s@averose.invalid', $user->getKey(), Str::uuid()),
                'email_verified_at' => null,
                'password' => Str::random(64),
                'remember_token' => null,
                'role_id' => null,
                'status' => 'inactive',
                'two_factor_secret' => null,
                'two_factor_recovery_codes' => null,
                'two_factor_confirmed_at' => null,
            ])->save();
        });
    }
}
