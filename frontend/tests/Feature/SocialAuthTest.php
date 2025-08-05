<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\GoogleProvider;
use Laravel\Socialite\Two\User as SocialiteUser;
use Tests\TestCase;

class SocialAuthTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test Google authentication redirect.
     */
    public function test_google_redirect_redirects_to_provider()
    {
        // Mock Socialite
        $provider = \Mockery::mock(GoogleProvider::class);
        $provider->shouldReceive('scopes')->with(['email', 'profile'])->andReturnSelf();
        $provider->shouldReceive('redirect')->once()->andReturn(redirect('https://accounts.google.com/oauth/authorize'));

        Socialite::shouldReceive('driver')->with('google')->andReturn($provider);

        $response = $this->get(route('auth.google'));

        $response->assertRedirect();
    }

    /**
     * Test Google callback creates new user.
     */
    public function test_google_callback_creates_new_user()
    {
        // Mock Google user data
        $googleUser = \Mockery::mock(SocialiteUser::class);
        $googleUser->shouldReceive('getId')->andReturn('google-123');
        $googleUser->shouldReceive('getEmail')->andReturn('test@example.com');
        $googleUser->shouldReceive('getName')->andReturn('Test User');
        $googleUser->shouldReceive('getAvatar')->andReturn('https://example.com/avatar.jpg');

        // Mock Socialite driver
        $provider = \Mockery::mock(GoogleProvider::class);
        $provider->shouldReceive('user')->once()->andReturn($googleUser);

        Socialite::shouldReceive('driver')->with('google')->andReturn($provider);

        // Ensure user doesn't exist
        $this->assertDatabaseMissing('users', ['email' => 'test@example.com']);

        $response = $this->get(route('auth.google.callback'));

        // Should redirect to dashboard
        $response->assertRedirect(route('dashboard'));

        // Should create user in database
        $this->assertDatabaseHas('users', [
            'email' => 'test@example.com',
            'name' => 'Test User',
            'google_id' => 'google-123',
            'avatar' => 'https://example.com/avatar.jpg'
        ]);

        // Should be authenticated
        $this->assertAuthenticated();
    }

    /**
     * Test Google callback with existing user (by email).
     */
    public function test_google_callback_with_existing_user_by_email()
    {
        // Create existing user
        $existingUser = User::factory()->create([
            'email' => 'test@example.com',
            'google_id' => null,
        ]);

        // Mock Google user data
        $googleUser = \Mockery::mock(SocialiteUser::class);
        $googleUser->shouldReceive('getId')->andReturn('google-123');
        $googleUser->shouldReceive('getEmail')->andReturn('test@example.com');
        $googleUser->shouldReceive('getName')->andReturn('Test User');
        $googleUser->shouldReceive('getAvatar')->andReturn('https://example.com/avatar.jpg');

        // Mock Socialite driver
        $provider = \Mockery::mock(GoogleProvider::class);
        $provider->shouldReceive('user')->once()->andReturn($googleUser);

        Socialite::shouldReceive('driver')->with('google')->andReturn($provider);

        $response = $this->get(route('auth.google.callback'));

        // Should redirect to dashboard
        $response->assertRedirect(route('dashboard'));

        // Should update existing user with Google ID
        $this->assertDatabaseHas('users', [
            'id' => $existingUser->id,
            'email' => 'test@example.com',
            'google_id' => 'google-123',
        ]);

        // Should be authenticated as existing user
        $this->assertAuthenticated();
        $this->assertEquals($existingUser->id, auth()->id());
    }

    /**
     * Test Google callback with existing user (by Google ID).
     */
    public function test_google_callback_with_existing_user_by_google_id()
    {
        // Create existing user
        $existingUser = User::factory()->create([
            'email' => 'test@example.com',
            'google_id' => 'google-123',
        ]);

        // Mock Google user data
        $googleUser = \Mockery::mock(SocialiteUser::class);
        $googleUser->shouldReceive('getId')->andReturn('google-123');
        $googleUser->shouldReceive('getEmail')->andReturn('test@example.com');
        $googleUser->shouldReceive('getName')->andReturn('Test User');
        $googleUser->shouldReceive('getAvatar')->andReturn('https://example.com/avatar.jpg');

        // Mock Socialite driver
        $provider = \Mockery::mock(GoogleProvider::class);
        $provider->shouldReceive('user')->once()->andReturn($googleUser);

        Socialite::shouldReceive('driver')->with('google')->andReturn($provider);

        $response = $this->get(route('auth.google.callback'));

        // Should redirect to dashboard
        $response->assertRedirect(route('dashboard'));

        // Should be authenticated as existing user
        $this->assertAuthenticated();
        $this->assertEquals($existingUser->id, auth()->id());
    }

    /**
     * Test authentication pages display social login buttons.
     */
    public function test_register_page_displays_google_login_button()
    {
        $response = $this->get(route('register'));

        $response->assertStatus(200);
        $response->assertSee('使用 Google 帳號註冊');
        $response->assertSee('使用 LINE 帳號註冊');
        $response->assertSee(route('auth.google'), false);
        $response->assertSee(route('auth.line'), false);
    }

    /**
     * Test login page displays social login buttons.
     */
    public function test_login_page_displays_social_login_buttons()
    {
        $response = $this->get(route('login'));

        $response->assertStatus(200);
        $response->assertSee('使用 Google 帳號登入');
        $response->assertSee('使用 LINE 帳號登入');
        $response->assertSee(route('auth.google'), false);
        $response->assertSee(route('auth.line'), false);
    }

    /**
     * Test social authentication routes are accessible.
     */
    public function test_social_auth_routes_are_accessible()
    {
        // These routes should exist (even if they redirect to auth providers)
        $routes = [
            'auth.google',
            'auth.google.callback', 
            'auth.line',
            'auth.line.callback'
        ];

        foreach ($routes as $routeName) {
            $this->assertTrue(
                \Route::has($routeName), 
                "Route '{$routeName}' does not exist"
            );
        }
    }

    protected function tearDown(): void
    {
        \Mockery::close();
        parent::tearDown();
    }
}