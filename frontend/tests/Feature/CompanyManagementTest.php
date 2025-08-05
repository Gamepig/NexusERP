<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Company;
use App\Models\CompanyInvitation;
use App\Models\BusinessUnit;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * 多租戶公司管理功能測試
 * 
 * 測試範圍：
 * - 公司切換功能
 * - 用戶邀請流程  
 * - 多租戶數據隔離
 * - 邀請接受處理
 */
class CompanyManagementTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    protected $company1;
    protected $company2;
    protected $user1;
    protected $user2;

    protected function setUp(): void
    {
        parent::setUp();
        
        // 創建測試公司
        $this->company1 = Company::create([
            'name' => 'Company One',
            'display_name' => '第一公司',
            'code' => 'COMP1',
            'is_active' => true,
        ]);

        $this->company2 = Company::create([
            'name' => 'Company Two', 
            'display_name' => '第二公司',
            'code' => 'COMP2',
            'is_active' => true,
        ]);

        // 創建測試用戶
        $this->user1 = User::create([
            'name' => 'Test User 1',
            'email' => 'user1@test.com',
            'password' => bcrypt('password'),
            'email_verified_at' => now(),
        ]);

        $this->user2 = User::create([
            'name' => 'Test User 2',
            'email' => 'user2@test.com', 
            'password' => bcrypt('password'),
            'email_verified_at' => now(),
        ]);

        // 建立用戶-公司關聯
        $this->user1->companies()->attach($this->company1->id, [
            'role' => 'admin',
            'is_primary' => true,
            'is_active' => true,
            'joined_at' => now(),
        ]);

        $this->user2->companies()->attach($this->company2->id, [
            'role' => 'admin',
            'is_primary' => true,
            'is_active' => true,
            'joined_at' => now(),
        ]);
    }

    /**
     * 測試獲取用戶公司列表
     */
    public function test_can_get_user_companies()
    {
        $this->actingAs($this->user1)
             ->withSession(['current_company_id' => $this->company1->id]);

        $response = $this->getJson('/api/company-management/companies');

        $response->assertOk()
                 ->assertJsonStructure([
                     'success',
                     'companies' => [
                         '*' => ['id', 'name', 'display_name', 'code', 'role', 'is_primary', 'is_current']
                     ],
                     'current_company_id',
                     'total_count'
                 ])
                 ->assertJsonPath('success', true)
                 ->assertJsonPath('total_count', 1);
    }

    /**
     * 測試公司切換功能
     */
    public function test_can_switch_company()
    {
        // 讓 user1 也屬於 company2
        $this->user1->companies()->attach($this->company2->id, [
            'role' => 'member',
            'is_primary' => false,
            'is_active' => true,
            'joined_at' => now(),
        ]);

        $this->actingAs($this->user1)
             ->withSession(['current_company_id' => $this->company1->id]);

        $response = $this->postJson('/api/company-management/switch-company', [
            'company_id' => $this->company2->id
        ]);

        $response->assertOk()
                 ->assertJsonPath('success', true)
                 ->assertJsonPath('company.id', $this->company2->id);

        // 檢查會話是否更新
        $this->assertEquals($this->company2->id, session('current_company_id'));
    }

    /**
     * 測試無權限切換公司會被拒絕
     */
    public function test_cannot_switch_to_unauthorized_company()
    {
        $this->actingAs($this->user1)
             ->withSession(['current_company_id' => $this->company1->id]);

        $response = $this->postJson('/api/company-management/switch-company', [
            'company_id' => $this->company2->id
        ]);

        $response->assertStatus(403)
                 ->assertJsonPath('success', false);
    }

    /**
     * 測試邀請用戶功能
     */
    public function test_can_invite_user()
    {
        $this->actingAs($this->user1)
             ->withSession(['current_company_id' => $this->company1->id]);

        $inviteEmail = 'newuser@test.com';

        $response = $this->postJson('/api/company-management/invite-user', [
            'email' => $inviteEmail,
            'role' => 'member',
            'message' => '歡迎加入我們的公司！'
        ]);

        $response->assertOk()
                 ->assertJsonPath('success', true)
                 ->assertJsonStructure([
                     'success',
                     'message',
                     'invitation' => ['id', 'email', 'role', 'expires_at', 'invitation_url']
                 ]);

        // 檢查資料庫中是否創建了邀請記錄
        $this->assertDatabaseHas('company_invitations', [
            'company_id' => $this->company1->id,
            'email' => $inviteEmail,
            'role' => 'member',
            'invited_by_user_id' => $this->user1->id,
        ]);
    }

    /**
     * 測試重複邀請會被拒絕
     */
    public function test_cannot_invite_duplicate_user()
    {
        // 創建現有邀請
        CompanyInvitation::create([
            'company_id' => $this->company1->id,
            'email' => 'existing@test.com',
            'role' => 'member',
            'invited_by_user_id' => $this->user1->id,
            'token' => 'test-token',
            'expires_at' => now()->addDays(7),
        ]);

        $this->actingAs($this->user1)
             ->withSession(['current_company_id' => $this->company1->id]);

        $response = $this->postJson('/api/company-management/invite-user', [
            'email' => 'existing@test.com',
            'role' => 'member',
        ]);

        $response->assertStatus(422)
                 ->assertJsonPath('success', false);
    }

    /**
     * 測試邀請接受功能
     */
    public function test_can_accept_invitation()
    {
        $invitation = CompanyInvitation::create([
            'company_id' => $this->company2->id,
            'email' => $this->user1->email,
            'role' => 'member',
            'invited_by_user_id' => $this->user2->id,
            'token' => 'accept-test-token',
            'expires_at' => now()->addDays(7),
        ]);

        $this->actingAs($this->user1);

        $response = $this->postJson("/api/invitations/accept/{$invitation->token}");

        $response->assertOk()
                 ->assertJsonPath('success', true)
                 ->assertJsonStructure([
                     'success',
                     'message',
                     'company' => ['id', 'name', 'display_name', 'role'],
                     'redirect_url'
                 ]);

        // 檢查用戶是否被添加到公司
        $this->assertTrue(
            $this->user1->companies()->where('company_id', $this->company2->id)->exists()
        );

        // 檢查邀請是否被標記為已接受
        $invitation->refresh();
        $this->assertNotNull($invitation->accepted_at);
        $this->assertEquals($this->user1->id, $invitation->accepted_by_user_id);
    }

    /**
     * 測試過期邀請無法接受
     */
    public function test_cannot_accept_expired_invitation()
    {
        $invitation = CompanyInvitation::create([
            'company_id' => $this->company2->id,
            'email' => $this->user1->email,
            'role' => 'member',
            'invited_by_user_id' => $this->user2->id,
            'token' => 'expired-token',
            'expires_at' => now()->subDays(1), // 已過期
        ]);

        $this->actingAs($this->user1);

        $response = $this->postJson("/api/invitations/accept/{$invitation->token}");

        $response->assertStatus(404)
                 ->assertJsonPath('success', false);
    }

    /**
     * 測試獲取公司用戶列表
     */
    public function test_can_get_company_users()
    {
        $this->actingAs($this->user1)
             ->withSession(['current_company_id' => $this->company1->id]);

        $response = $this->getJson('/api/company-management/users');

        $response->assertOk()
                 ->assertJsonStructure([
                     'success',
                     'users' => [
                         '*' => ['id', 'name', 'email', 'role', 'is_primary', 'joined_at', 'is_active']
                     ],
                     'pending_invitations',
                     'total_users',
                     'total_pending'
                 ])
                 ->assertJsonPath('success', true);
    }

    /**
     * 測試更新用戶角色
     */
    public function test_can_update_user_role()
    {
        // 添加第二個用戶到第一個公司
        $this->user2->companies()->attach($this->company1->id, [
            'role' => 'member',
            'is_primary' => false,
            'is_active' => true,
            'joined_at' => now(),
        ]);

        $this->actingAs($this->user1)
             ->withSession(['current_company_id' => $this->company1->id]);

        $response = $this->putJson("/api/company-management/users/{$this->user2->id}/role", [
            'role' => 'manager'
        ]);

        $response->assertOk()
                 ->assertJsonPath('success', true)
                 ->assertJsonPath('user.role', 'manager');

        // 檢查資料庫中的角色是否更新
        $this->assertEquals('manager', 
            $this->user2->companies()
                        ->where('company_id', $this->company1->id)
                        ->first()
                        ->pivot
                        ->role
        );
    }

    /**
     * 測試多租戶數據隔離 - SetCompanyContext 中介層
     */
    public function test_company_context_middleware_sets_database_variable()
    {
        // 跳過 SQLite 測試，因為它不支援 PostgreSQL 特定函數
        if (DB::getDriverName() !== 'pgsql') {
            $this->markTestSkipped('PostgreSQL specific test - current_setting function not available in SQLite');
        }

        $this->actingAs($this->user1)
             ->withSession(['current_company_id' => $this->company1->id]);

        // 發送請求觸發中介層
        $this->getJson('/api/company-management/companies');

        // 檢查 PostgreSQL 會話變數是否設定
        $result = DB::selectOne("SELECT current_setting('app.current_company_id', true) as company_id");
        $this->assertEquals($this->company1->id, (int)$result->company_id);
    }

    /**
     * 測試數據隔離 - 用戶只能看到自己公司的數據
     */
    public function test_data_isolation_between_companies()
    {
        // 這個測試需要實際的業務數據模型來驗證
        // 這裡用 customers 作為例子（假設已實現 RLS）
        
        $this->markTestSkipped('需要實際的業務數據和 RLS 策略來完整測試數據隔離');
    }

    /**
     * 測試非管理員無法邀請用戶
     */
    public function test_non_admin_cannot_invite_users()
    {
        // 將 user1 的角色改為 member
        $this->user1->companies()->updateExistingPivot($this->company1->id, [
            'role' => 'member'
        ]);

        $this->actingAs($this->user1)
             ->withSession(['current_company_id' => $this->company1->id]);

        $response = $this->postJson('/api/company-management/invite-user', [
            'email' => 'newuser@test.com',
            'role' => 'member',
        ]);

        $response->assertStatus(403)
                 ->assertJsonPath('success', false);
    }

    /**
     * 測試獲取邀請資訊
     */
    public function test_can_get_invitation_info()
    {
        $invitation = CompanyInvitation::create([
            'company_id' => $this->company1->id,
            'email' => 'invited@test.com',
            'role' => 'member',
            'invited_by_user_id' => $this->user1->id,
            'token' => 'info-test-token',
            'expires_at' => now()->addDays(7),
            'message' => '歡迎加入我們！',
        ]);

        $response = $this->getJson("/api/invitations/{$invitation->token}");

        $response->assertOk()
                 ->assertJsonPath('success', true)
                 ->assertJsonStructure([
                     'success',
                     'invitation' => [
                         'company_name',
                         'company_code', 
                         'role',
                         'invited_by',
                         'invited_at',
                         'expires_at',
                         'message'
                     ]
                 ]);
    }

    /**
     * 測試邀請 token 驗證
     */
    public function test_invalid_invitation_token_returns_404()
    {
        $response = $this->getJson('/api/invitations/invalid-token');

        $response->assertStatus(404)
                 ->assertJsonPath('success', false);
    }
}