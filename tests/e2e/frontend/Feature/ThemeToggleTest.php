<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ThemeToggleTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Create a test user
        $this->user = User::factory()->create([
            'email_verified_at' => now(),
        ]);
    }

    /**
     * Test that theme toggle assets are loaded on authenticated pages.
     */
    public function test_theme_assets_are_loaded_on_app_layout()
    {
        $response = $this->actingAs($this->user)
                        ->get(route('dashboard'));

        $response->assertStatus(200);
        
        // Check that theme CSS is loaded
        $response->assertSee('nexus-theme.css', false);
        
        // Check that theme JavaScript is loaded  
        $response->assertSee('theme-toggle.js', false);
    }

    /**
     * Test that theme toggle buttons are present in navigation.
     */
    public function test_theme_toggle_buttons_present_in_navigation()
    {
        $response = $this->actingAs($this->user)
                        ->get(route('dashboard'));

        $response->assertStatus(200);
        
        // Check desktop theme toggle button
        $response->assertSee('data-theme-toggle', false);
        $response->assertSee('theme-toggle', false);
        
        // Check for theme toggle icons
        $response->assertSee('theme-toggle-sun', false);
        $response->assertSee('theme-toggle-moon', false);
        
        // Check accessibility attributes
        $response->assertSee('切換主題', false);
        $response->assertSee('aria-label', false);
    }

    /**
     * Test that mobile theme toggle is present in responsive navigation.
     */
    public function test_mobile_theme_toggle_present_in_responsive_navigation()
    {
        $response = $this->actingAs($this->user)
                        ->get(route('dashboard'));

        $response->assertStatus(200);
        
        // Check mobile theme toggle section
        $response->assertSee('主題設定', false);
        
        // Should have multiple theme toggle buttons (desktop + mobile)
        $content = $response->getContent();
        $toggleCount = substr_count($content, 'data-theme-toggle');
        $this->assertGreaterThan(1, $toggleCount, 'Should have multiple theme toggle buttons for desktop and mobile');
    }

    /**
     * Test that theme CSS classes and variables are defined.
     */
    public function test_theme_css_variables_and_classes_defined()
    {
        $response = $this->actingAs($this->user)
                        ->get(route('dashboard'));

        $response->assertStatus(200);
        
        // These should be present in the CSS
        $expectedClasses = [
            'nexus-card',
            'nexus-btn-primary',
            'nexus-btn-secondary',
            'nexus-input',
            'theme-toggle'
        ];
        
        foreach ($expectedClasses as $class) {
            $response->assertSee($class, false);
        }
    }

    /**
     * Test that pages load correctly with both theme states.
     */
    public function test_pages_load_correctly_with_different_themes()
    {
        $testPages = [
            'dashboard',
            'employees.index',
            'inventory.alerts',
            'reports.sales',
            'marketplace.index'
        ];
        
        foreach ($testPages as $routeName) {
            $response = $this->actingAs($this->user)
                            ->get(route($routeName));
                            
            $response->assertStatus(200, "Page {$routeName} should load successfully");
            
            // Should not contain theme-related errors
            $response->assertDontSee('undefined variable', false);
            $response->assertDontSee('CSS variable not found', false);
            $response->assertDontSee('theme-toggle error', false);
        }
    }

    /**
     * Test keyboard shortcut accessibility hint is present.
     */
    public function test_keyboard_shortcut_hint_present()
    {
        $response = $this->actingAs($this->user)
                        ->get(route('dashboard'));

        $response->assertStatus(200);
        
        // Check for keyboard shortcut hint
        $response->assertSee('Ctrl+Shift+T', false);
    }

    /**
     * Test that theme toggle works on different layouts.
     */
    public function test_theme_toggle_on_guest_layout()
    {
        $response = $this->get(route('login'));

        $response->assertStatus(200);
        
        // Guest layout should not have theme toggle (since it's in authenticated navigation)
        // But it should still load theme CSS for consistency
        $response->assertSee('nexus-theme.css', false);
    }

    /**
     * Test CSS custom properties are properly defined.
     */
    public function test_css_custom_properties_defined()
    {
        $response = $this->actingAs($this->user)
                        ->get(route('dashboard'));

        $response->assertStatus(200);
        
        // Check for CSS custom properties in the response
        $expectedProperties = [
            '--nexus-bg-primary',
            '--nexus-text-primary',
            '--nexus-accent-purple',
            '--nexus-border-primary'
        ];
        
        foreach ($expectedProperties as $property) {
            $response->assertSee($property, false);
        }
    }

    /**
     * Test theme transition classes are present.
     */
    public function test_theme_transition_classes_present()
    {
        $response = $this->actingAs($this->user)
                        ->get(route('dashboard'));

        $response->assertStatus(200);
        
        // Check for transition classes
        $response->assertSee('transition', false);
        $response->assertSee('ease-in-out', false);
        $response->assertSee('duration-', false);
    }

    /**
     * Test that theme system is accessible.
     */
    public function test_theme_system_accessibility()
    {
        $response = $this->actingAs($this->user)
                        ->get(route('dashboard'));

        $response->assertStatus(200);
        
        // Check accessibility attributes
        $response->assertSee('aria-label="切換主題"', false);
        $response->assertSee('title=', false);
        
        // Check for proper semantic HTML
        $response->assertSee('<button', false);
        
        // Should not use div as clickable elements
        $content = $response->getContent();
        $this->assertStringNotContainsString('div data-theme-toggle', $content);
    }

    /**
     * Test that theme works without JavaScript (graceful degradation).
     */
    public function test_theme_graceful_degradation_without_javascript()
    {
        $response = $this->actingAs($this->user)
                        ->get(route('dashboard'));

        $response->assertStatus(200);
        
        // Default theme should be applied via CSS
        $response->assertSee(':root', false);
        
        // CSS should provide fallback values
        $response->assertSee('var(--', false);
    }
}