<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\ZoomAccount;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ZoomAccountsTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_are_redirected_to_the_login_page(): void
    {
        $response = $this->get(route('zoom-accounts'));

        $response->assertRedirect(route('login'));
    }

    public function test_admin_users_can_visit_the_zoom_accounts_page(): void
    {
        $user = User::factory()->admin()->create();

        $this->actingAs($user);

        $response = $this->get(route('zoom-accounts'));

        $response
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/integrations/zoom-accounts')
                ->has('accounts'));
    }

    public function test_admin_users_can_visit_a_zoom_account_detail_page(): void
    {
        $user = User::factory()->admin()->create();
        $account = ZoomAccount::factory()->create([
            'name' => 'AveRose Detail Room',
            'account_id' => 'detail-account',
            'client_id' => 'detail-client',
            'client_secret' => 'detail-client-secret',
            'token_secret' => 'detail-token-secret',
        ]);

        $this->assertSame('averose-detail-room', $account->slug);

        $response = $this->actingAs($user)->get(route('zoom-accounts.show', $account));

        $response
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/integrations/zoom-account-detail')
                ->where('account.name', 'AveRose Detail Room')
                ->where('account.slug', 'averose-detail-room')
                ->where('account.accountId', 'detail-account')
                ->where('account.clientId', 'detail-client')
                ->where('account.clientSecret', 'detail-client-secret')
                ->where('account.tokenSecret', 'detail-token-secret')
                ->where('breadcrumbs.0.title', 'Zoom Accounts')
                ->where('breadcrumbs.1.title', 'AveRose Detail Room')
                ->missing('breadcrumbs.2'));
    }

    public function test_zoom_accounts_table_has_required_columns(): void
    {
        $this->assertTrue(Schema::hasTable('zoom_accounts'));
        $this->assertTrue(Schema::hasColumns('zoom_accounts', [
            'id',
            'name',
            'slug',
            'account_id',
            'client_id',
            'client_secret',
            'token_secret',
            'created_at',
            'updated_at',
        ]));
    }

    public function test_admin_users_can_store_zoom_accounts(): void
    {
        $user = User::factory()->admin()->create();

        $response = $this->actingAs($user)->post(route('zoom-accounts.store'), [
            'name' => 'AveRose Main Room',
            'account_id' => 'account-123',
            'client_id' => 'client-123',
            'client_secret' => 'client-secret-value',
            'token_secret' => 'token-secret-value',
        ]);

        $response->assertRedirect();

        $this->assertDatabaseHas('zoom_accounts', [
            'name' => 'AveRose Main Room',
            'slug' => 'averose-main-room',
            'account_id' => 'account-123',
            'client_id' => 'client-123',
        ]);

        $account = ZoomAccount::firstWhere('account_id', 'account-123');

        $this->assertSame('client-secret-value', $account->client_secret);
        $this->assertSame('token-secret-value', $account->token_secret);
    }

    public function test_zoom_account_credentials_are_required(): void
    {
        $user = User::factory()->admin()->create();

        $response = $this->actingAs($user)->post(route('zoom-accounts.store'), [
            'name' => '',
            'account_id' => '',
            'client_id' => '',
            'client_secret' => '',
            'token_secret' => '',
        ]);

        $response->assertSessionHasErrors([
            'name',
            'account_id',
            'client_id',
            'client_secret',
            'token_secret',
        ]);
    }

    public function test_admin_users_can_update_zoom_accounts(): void
    {
        $user = User::factory()->admin()->create();
        $account = ZoomAccount::factory()->create([
            'client_secret' => 'existing-client-secret',
            'token_secret' => 'existing-token-secret',
        ]);

        $response = $this->actingAs($user)->put(route('zoom-accounts.update', $account), [
            'name' => 'AveRose Updated Room',
            'account_id' => 'updated-account',
            'client_id' => 'updated-client',
            'client_secret' => '',
            'token_secret' => 'new-token-secret',
        ]);

        $response->assertRedirect();

        $account->refresh();

        $this->assertSame('AveRose Updated Room', $account->name);
        $this->assertSame('averose-updated-room', $account->slug);
        $this->assertSame('updated-account', $account->account_id);
        $this->assertSame('updated-client', $account->client_id);
        $this->assertSame('existing-client-secret', $account->client_secret);
        $this->assertSame('new-token-secret', $account->token_secret);
    }

    public function test_admin_users_are_redirected_to_the_updated_detail_slug_when_updating_from_detail(): void
    {
        $user = User::factory()->admin()->create();
        $account = ZoomAccount::factory()->create([
            'name' => 'Old Zoom Room',
            'account_id' => 'old-account',
            'client_id' => 'old-client',
            'client_secret' => 'old-client-secret',
            'token_secret' => 'old-token-secret',
        ]);

        $response = $this->actingAs($user)->put(route('zoom-accounts.update', [
            'zoom_account' => $account,
            'redirect' => 'detail',
        ]), [
            'name' => 'New Zoom Room',
            'account_id' => 'new-account',
            'client_id' => 'new-client',
            'client_secret' => 'new-client-secret',
            'token_secret' => 'new-token-secret',
        ]);

        $account->refresh();

        $response->assertRedirect(route('zoom-accounts.show', $account));

        $this->assertSame('new-zoom-room', $account->slug);
    }

    public function test_admin_users_can_delete_zoom_accounts(): void
    {
        $user = User::factory()->admin()->create();
        $account = ZoomAccount::factory()->create();

        $response = $this->actingAs($user)->delete(route('zoom-accounts.destroy', $account));

        $response->assertRedirect();

        $this->assertDatabaseMissing('zoom_accounts', [
            'id' => $account->id,
        ]);
    }
}
