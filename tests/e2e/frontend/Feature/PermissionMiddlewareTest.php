<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Role;
use App\Models\Permission;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

/**
 * 權限中間件功能測試
 * 
 * 測試 RBAC 權限系統的中間件功能，包含權限檢查、角色檢查、403 錯誤處理等
 */
class PermissionMiddlewareTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected Role $role;
    protected Permission $permission;

    protected function setUp(): void
    {
        parent::setUp();
        
        // 建立測試用權限、角色、使用者
        $this->permission = Permission::create([
            'name' => 'test.view',
            'display_name' => '測試檢視',
            'description' => '測試權限',
            'group' => 'test',
            'is_system' => false,
            'is_active' => true,
        ]);

        $this->role = Role::create([
            'name' => 'test_role',
            'display_name' => '測試角色',
            'description' => '測試用角色',
            'is_system' => false,
            'is_active' => true,
        ]);

        $this->role->permissions()->attach($this->permission->id);

        $this->user = User::factory()->create();
        $this->user->assignRole($this->role);

        // 註冊測試路由
        $this->registerTestRoutes();
    }

    protected function registerTestRoutes(): void
    {
        Route::get('/test/permission-required', function () {
            return response()->json(['message' => 'Access granted']);
        })->middleware(['auth', 'permission:test.view,single']);

        Route::get('/test/role-required', function () {
            return response()->json(['message' => 'Access granted']);
        })->middleware(['auth', 'role:test_role,single']);

        Route::get('/test/admin-required', function () {
            return response()->json(['message' => 'Access granted']);
        })->middleware(['auth', 'permission:admin,admin']);

        Route::get('/test/multiple-permissions', function () {
            return response()->json(['message' => 'Access granted']);
        })->middleware(['auth', 'permission:test.view|test.edit,any']);
    }

    /**
     * 測試權限中間件：有權限的使用者可以存取
     */
    public function test_permission_middleware_allows_access_with_valid_permission(): void
    {
        $response = $this->actingAs($this->user)
            ->getJson('/test/permission-required');

        $response->assertStatus(200)
            ->assertJson(['message' => 'Access granted']);
    }

    /**
     * 測試權限中間件：沒有權限的使用者被拒絕存取
     */
    public function test_permission_middleware_denies_access_without_permission(): void
    {
        // 建立沒有權限的使用者
        $userWithoutPermission = User::factory()->create();

        $response = $this->actingAs($userWithoutPermission)
            ->getJson('/test/permission-required');

        $response->assertStatus(403)
            ->assertJson([
                'error' => '權限不足',
                'code' => 'INSUFFICIENT_PERMISSIONS',
                'required_permission' => 'test.view'
            ]);
    }

    /**
     * 測試角色中間件：有角色的使用者可以存取
     */
    public function test_role_middleware_allows_access_with_valid_role(): void
    {
        $response = $this->actingAs($this->user)
            ->getJson('/test/role-required');

        $response->assertStatus(200)
            ->assertJson(['message' => 'Access granted']);
    }

    /**
     * 測試角色中間件：沒有角色的使用者被拒絕存取
     */
    public function test_role_middleware_denies_access_without_role(): void
    {
        // 建立沒有角色的使用者
        $userWithoutRole = User::factory()->create();

        $response = $this->actingAs($userWithoutRole)
            ->getJson('/test/role-required');

        $response->assertStatus(403)
            ->assertJson([
                'error' => '角色權限不足',
                'code' => 'INSUFFICIENT_ROLE',
                'required_role' => 'test_role'
            ]);
    }

    /**
     * 測試未認證使用者被重定向到登入頁
     */
    public function test_middleware_redirects_unauthenticated_users(): void
    {
        $response = $this->get('/test/permission-required');

        $response->assertStatus(302)
            ->assertRedirect('/login');
    }

    /**
     * 測試未認證使用者的 JSON 請求回傳 401
     */
    public function test_middleware_returns_401_for_unauthenticated_json_requests(): void
    {
        $response = $this->getJson('/test/permission-required');

        $response->assertStatus(401)
            ->assertJson([
                'error' => '未認證',
                'code' => 'UNAUTHORIZED'
            ]);
    }

    /**
     * 測試權限快取機制
     */
    public function test_permission_caching_works(): void
    {
        // 第一次檢查會查詢資料庫
        $this->assertTrue($this->user->hasPermission('test.view'));

        // 修改資料庫中的權限（移除）
        $this->role->permissions()->detach($this->permission->id);

        // 由於快取，仍然回傳 true
        $this->assertTrue($this->user->hasPermission('test.view'));

        // 清除快取後應該回傳 false
        $this->user->clearPermissionCache();
        $this->assertFalse($this->user->hasPermission('test.view'));
    }

    /**
     * 測試多重權限檢查（任一權限）
     */
    public function test_any_permission_check(): void
    {
        // 建立額外權限
        $editPermission = Permission::create([
            'name' => 'test.edit',
            'display_name' => '測試編輯',
            'group' => 'test',
            'is_active' => true,
        ]);

        // 使用者只有 test.view 權限，沒有 test.edit
        $this->assertTrue($this->user->hasAnyPermission(['test.view', 'test.edit']));
        $this->assertFalse($this->user->hasAllPermissions(['test.view', 'test.edit']));
    }

    /**
     * 測試角色方法
     */
    public function test_role_methods(): void
    {
        $this->assertTrue($this->user->hasRole('test_role'));
        $this->assertFalse($this->user->hasRole('non_existent_role'));

        $this->assertTrue($this->user->hasAnyRole(['test_role', 'other_role']));
        $this->assertFalse($this->user->hasAllRoles(['test_role', 'other_role']));
    }

    /**
     * 測試管理員檢查
     */
    public function test_admin_checks(): void
    {
        // 建立管理員角色
        $adminRole = Role::create([
            'name' => 'admin',
            'display_name' => '管理員',
            'is_active' => true,
        ]);

        $adminUser = User::factory()->create();
        $adminUser->assignRole($adminRole);

        $this->assertTrue($adminUser->isAdmin());
        $this->assertFalse($adminUser->isSuperAdmin());
        $this->assertTrue($adminUser->isManager());

        // 建立超級管理員角色
        $superAdminRole = Role::create([
            'name' => 'super_admin',
            'display_name' => '超級管理員',
            'is_active' => true,
        ]);

        $superAdminUser = User::factory()->create();
        $superAdminUser->assignRole($superAdminRole);

        $this->assertTrue($superAdminUser->isAdmin());
        $this->assertTrue($superAdminUser->isSuperAdmin());
        $this->assertTrue($superAdminUser->isManager());
    }

    /**
     * 測試角色同步
     */
    public function test_role_sync(): void
    {
        // 建立額外角色
        $role2 = Role::create([
            'name' => 'test_role_2',
            'display_name' => '測試角色2',
            'is_active' => true,
        ]);

        // 同步角色
        $this->user->syncRoles(['test_role_2']);

        $this->assertFalse($this->user->hasRole('test_role'));
        $this->assertTrue($this->user->hasRole('test_role_2'));
    }

    /**
     * 測試公司權限檢查
     */
    public function test_company_permission_check(): void
    {
        // 模擬會話中的公司 ID
        session(['current_company_id' => 1]);

        // 假設使用者屬於該公司（需要建立適當的關聯）
        // 這裡僅測試方法邏輯
        $result = $this->user->hasPermissionInCompany('test.view', 1);

        // 由於沒有公司關聯，應該回傳 false
        $this->assertFalse($result);
    }

    /**
     * 測試權限模型方法
     */
    public function test_permission_model_methods(): void
    {
        $this->assertTrue($this->permission->isActive());
        $this->assertFalse($this->permission->isSystemPermission());
        $this->assertTrue($this->permission->isValidPermissionFormat());
        $this->assertEquals('test', $this->permission->getModule());
        $this->assertEquals('view', $this->permission->getAction());
    }

    /**
     * 測試角色模型方法
     */
    public function test_role_model_methods(): void
    {
        $this->assertTrue($this->role->isActive());
        $this->assertFalse($this->role->isSystemRole());
        $this->assertTrue($this->role->hasPermission('test.view'));
        $this->assertContains('test.view', $this->role->getPermissionNames());
    }

    /**
     * 測試權限群組功能
     */
    public function test_permission_groups(): void
    {
        $groups = Permission::getGroups();
        $this->assertContains('test', $groups);

        $testPermissions = Permission::getByGroup('test');
        $this->assertCount(1, $testPermissions);
        $this->assertEquals('test.view', $testPermissions->first()->name);
    }
}