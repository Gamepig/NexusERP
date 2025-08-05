<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DashboardRoutingTest extends TestCase
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
     * Test that inventory alerts page loads successfully.
     */
    public function test_inventory_alerts_page_loads_successfully()
    {
        $response = $this->actingAs($this->user)
                        ->get(route('inventory.alerts'));

        $response->assertStatus(200);
        $response->assertViewIs('inventory.alerts');
        $response->assertSee('庫存警示'); // Check for unique content
    }

    /**
     * Test that reports sales page loads successfully.
     */
    public function test_reports_sales_page_loads_successfully()
    {
        $response = $this->actingAs($this->user)
                        ->get(route('reports.sales'));

        $response->assertStatus(200);
        $response->assertViewIs('reports.sales');
        $response->assertSee('銷售報表'); // Check for unique content
    }

    /**
     * Test that reports inventory page loads successfully.
     */
    public function test_reports_inventory_page_loads_successfully()
    {
        $response = $this->actingAs($this->user)
                        ->get(route('reports.inventory'));

        $response->assertStatus(200);
        $response->assertViewIs('reports.inventory');
        $response->assertSee('庫存報表'); // Check for unique content
    }

    /**
     * Test that reports financial page loads successfully.
     */
    public function test_reports_financial_page_loads_successfully()
    {
        $response = $this->actingAs($this->user)
                        ->get(route('reports.financial'));

        $response->assertStatus(200);
        $response->assertViewIs('reports.financial');
        $response->assertSee('財務報表'); // Check for unique content
    }

    /**
     * Test that employees index page loads successfully.
     */
    public function test_employees_index_page_loads_successfully()
    {
        $response = $this->actingAs($this->user)
                        ->get(route('employees.index'));

        $response->assertStatus(200);
        $response->assertViewIs('employees.index');
        $response->assertSee('員工管理'); // Check for unique content
    }

    /**
     * Test that marketplace index page loads successfully.
     */
    public function test_marketplace_index_page_loads_successfully()
    {
        $response = $this->actingAs($this->user)
                        ->get(route('marketplace.index'));

        $response->assertStatus(200);
        $response->assertViewIs('marketplace.products.browse');
        $response->assertSee('NexusERP 市集'); // Check for unique content
    }

    /**
     * Test that dashboard loads successfully with component syntax.
     */
    public function test_dashboard_loads_successfully()
    {
        $response = $this->actingAs($this->user)
                        ->get(route('dashboard'));

        $response->assertStatus(200);
        $response->assertViewIs('dashboard');
        $response->assertSee('管理儀表板'); // Check for unique content
    }

    /**
     * Test that all pages don't contain the $slot error.
     */
    public function test_no_slot_errors_in_critical_pages()
    {
        $routes = [
            'inventory.alerts',
            'reports.sales',
            'reports.inventory',
            'reports.financial',
            'employees.index',
            'marketplace.index',
            'dashboard'
        ];

        foreach ($routes as $routeName) {
            $response = $this->actingAs($this->user)
                            ->get(route($routeName));
            
            $response->assertStatus(200);
            $response->assertDontSee('Undefined variable $slot');
            $response->assertDontSee('ErrorException');
        }
    }

    /**
     * Test that unauthenticated users are redirected to login.
     */
    public function test_unauthenticated_users_redirected_to_login()
    {
        $routes = [
            'inventory.alerts',
            'reports.sales',
            'employees.index',
            'marketplace.index',
            'dashboard'
        ];

        foreach ($routes as $routeName) {
            $response = $this->get(route($routeName));
            $response->assertRedirect(route('login'));
        }
    }
}