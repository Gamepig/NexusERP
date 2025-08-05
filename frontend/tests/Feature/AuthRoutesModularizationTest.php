<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

class AuthRoutesModularizationTest extends TestCase
{
    /**
     * Test that authentication routes are properly loaded via modular system
     *
     * @return void
     */
    public function test_authentication_routes_are_loaded_via_modular_system()
    {
        // Test that login routes exist
        $this->assertTrue(Route::has('login'));
        $this->assertTrue(Route::has('login.store'));
        
        // Test that registration routes exist
        $this->assertTrue(Route::has('register'));
        $this->assertTrue(Route::has('register.store'));
        
        // Test that password reset routes exist
        $this->assertTrue(Route::has('password.request'));
        $this->assertTrue(Route::has('password.email'));
        $this->assertTrue(Route::has('password.reset'));
        $this->assertTrue(Route::has('password.store'));
        
        // Test that social auth routes exist
        $this->assertTrue(Route::has('auth.google'));
        $this->assertTrue(Route::has('auth.google.callback'));
        $this->assertTrue(Route::has('auth.line'));
        $this->assertTrue(Route::has('auth.line.callback'));
        
        // Test that authenticated routes exist
        $this->assertTrue(Route::has('verification.notice'));
        $this->assertTrue(Route::has('verification.verify'));
        $this->assertTrue(Route::has('password.confirm'));
        $this->assertTrue(Route::has('logout'));
    }
    
    /**
     * Test that guest routes are accessible to unauthenticated users
     *
     * @return void
     */
    public function test_guest_routes_accessible_to_unauthenticated_users()
    {
        // Test login page
        $response = $this->get(route('login'));
        $response->assertStatus(200);
        
        // Test registration page
        $response = $this->get(route('register'));
        $response->assertStatus(200);
        
        // Test forgot password page
        $response = $this->get(route('password.request'));
        $response->assertStatus(200);
    }
    
    /**
     * Test that authenticated routes redirect unauthenticated users
     *
     * @return void
     */
    public function test_authenticated_routes_redirect_unauthenticated_users()
    {
        // Test verification notice redirects to login
        $response = $this->get(route('verification.notice'));
        $response->assertRedirect(route('login'));
        
        // Test password confirm redirects to login
        $response = $this->get(route('password.confirm'));
        $response->assertRedirect(route('login'));
    }
    
    /**
     * Test that route naming follows RESTful conventions
     *
     * @return void
     */
    public function test_route_naming_follows_restful_conventions()
    {
        $routes = Route::getRoutes();
        
        // Check for consistent naming patterns
        $authRoutes = collect($routes)->filter(function ($route) {
            $name = $route->getName();
            return $name && (
                str_starts_with($name, 'auth.') ||
                str_starts_with($name, 'password.') ||
                in_array($name, ['login', 'register', 'logout', 'login.store', 'register.store'])
            );
        });
        
        $this->assertGreaterThan(10, $authRoutes->count(), 'Authentication routes should be loaded');
        
        // Verify specific RESTful naming patterns
        $this->assertTrue(Route::has('login')); // GET login form
        $this->assertTrue(Route::has('login.store')); // POST login action
        $this->assertTrue(Route::has('register')); // GET registration form  
        $this->assertTrue(Route::has('register.store')); // POST registration action
    }
}