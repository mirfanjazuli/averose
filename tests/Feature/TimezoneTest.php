<?php

namespace Tests\Feature;

use App\Models\PublicHoliday;
use App\Models\User;
use App\Models\WorkingHour;
use App\Services\Scheduling\BusinessCalendarService;
use App\UserTimezoneMode;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class TimezoneTest extends TestCase
{
    use RefreshDatabase;

    public function test_an_authenticated_user_can_sync_a_valid_browser_timezone(): void
    {
        $user = User::factory()->create(['timezone' => 'Asia/Jakarta']);

        $response = $this->actingAs($user)->post(route('timezone.sync'), [
            'timezone' => 'Asia/Tokyo',
        ]);

        $response->assertRedirect();
        $this->assertSame('Asia/Tokyo', $user->fresh()->timezone);
    }

    public function test_sync_rejects_an_invalid_or_offset_timezone(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->post(route('timezone.sync'), [
            'timezone' => 'UTC+7',
        ]);

        $response->assertSessionHasErrors('timezone');
        $this->assertSame('Asia/Jakarta', $user->fresh()->timezone);
    }

    public function test_sync_is_idempotent_when_timezone_is_unchanged(): void
    {
        $user = User::factory()->create(['timezone' => 'Asia/Makassar']);
        $updatedAt = $user->updated_at;

        $this->travel(1)->minutes();
        $this->actingAs($user)->post(route('timezone.sync'), [
            'timezone' => 'Asia/Makassar',
        ])->assertRedirect();

        $this->assertTrue($user->fresh()->updated_at->equalTo($updatedAt));
    }

    public function test_browser_sync_does_not_override_a_manual_preference(): void
    {
        $user = User::factory()->create([
            'timezone' => 'Asia/Tokyo',
            'timezone_mode' => UserTimezoneMode::Manual,
        ]);

        $this->actingAs($user)->post(route('timezone.sync'), [
            'timezone' => 'Asia/Jayapura',
        ])->assertRedirect();

        $this->assertSame('Asia/Tokyo', $user->fresh()->timezone);
        $this->assertSame(UserTimezoneMode::Manual, $user->fresh()->timezone_mode);
    }

    public function test_user_can_set_and_clear_a_manual_timezone_preference(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->patch(route('timezone.update'), [
            'mode' => 'manual',
            'timezone' => 'Asia/Tokyo',
        ])->assertRedirect();

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'timezone' => 'Asia/Tokyo',
            'timezone_mode' => 'manual',
        ]);

        $this->actingAs($user)->patch(route('timezone.update'), [
            'mode' => 'auto',
            'timezone' => 'Asia/Makassar',
        ])->assertRedirect();

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'timezone' => 'Asia/Makassar',
            'timezone_mode' => 'auto',
        ]);
    }

    public function test_guest_cannot_sync_a_timezone(): void
    {
        $this->post(route('timezone.sync'), [
            'timezone' => 'Asia/Tokyo',
        ])->assertRedirect(route('login'));
    }

    public function test_profile_settings_expose_the_preference_and_iana_timezones(): void
    {
        $user = User::factory()->create([
            'timezone' => 'Asia/Tokyo',
            'timezone_mode' => UserTimezoneMode::Manual,
        ]);

        $this->actingAs($user)
            ->get(route('profile.edit'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('settings/profile')
                ->where('auth.user.timezone', 'Asia/Tokyo')
                ->where('auth.user.timezoneMode', 'manual')
                ->where('timezones', fn ($timezones): bool => collect($timezones)->contains('value', 'Asia/Tokyo'))
            );
    }

    public function test_shared_timezone_mode_falls_back_for_legacy_user_data(): void
    {
        $user = User::factory()->create();
        $user->setAttribute('timezone_mode', null);

        $this->actingAs($user)
            ->get(route('dashboard'))
            ->assertOk()
            ->assertInertia(fn (Assert $page): Assert => $page
                ->where('auth.user.timezoneMode', 'auto')
            );
    }

    public function test_working_hours_are_evaluated_in_the_business_timezone(): void
    {
        WorkingHour::query()->create([
            'day_of_week' => 5,
            'end_time' => '20:00',
            'is_active' => true,
            'start_time' => '09:00',
        ]);

        $calendar = app(BusinessCalendarService::class);

        $this->assertNull($calendar->unavailabilityReason(
            CarbonImmutable::parse('2026-07-31 02:00:00', 'UTC'),
            60,
        ));
        $this->assertSame(
            'Jadwal harus berada dalam jam operasional 09.00–20.00 WIB.',
            $calendar->unavailabilityReason(
                CarbonImmutable::parse('2026-07-31 01:59:00', 'UTC'),
                60,
            ),
        );
    }

    public function test_public_holiday_dates_do_not_shift_with_user_timezones(): void
    {
        PublicHoliday::query()->create([
            'date' => '2026-07-31',
            'name' => 'Hari Libur Internal',
            'source' => 'manual',
            'status' => 'active',
            'type' => 'internal',
        ]);

        $reason = app(BusinessCalendarService::class)->unavailabilityReason(
            CarbonImmutable::parse('2026-07-30 17:00:00', 'UTC'),
            60,
        );

        $this->assertSame('Tanggal yang dipilih merupakan hari libur.', $reason);
        $this->assertDatabaseHas('public_holidays', ['date' => '2026-07-31']);
    }
}
