<?php

namespace Tests\Unit;

use App\Http\Middleware\SetCompanyContext;
use App\Models\User;
use App\Models\Company;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * SetCompanyContext 中介層測試
 * 
 * 測試 SetCompanyContext 中介層是否正確設定公司上下文
 */
class SetCompanyContextMiddlewareTest extends TestCase
{
    use RefreshDatabase;

    protected $middleware;
    protected $user;
    protected $company;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->middleware = new SetCompanyContext();
        
        // 創建測試公司和用戶
        $this->company = Company::create([
            'name' => 'Test Company',
            'display_name' => '測試公司',
            'code' => 'TEST',
            'is_active' => true,
        ]);

        $this->user = User::create([
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => bcrypt('password'),
            'email_verified_at' => now(),
        ]);

        $this->user->companies()->attach($this->company->id, [
            'role' => 'admin',
            'is_primary' => true,
            'is_active' => true,
            'joined_at' => now(),
        ]);
    }

    /**
     * 測試已認證用戶的公司上下文設定
     */
    public function test_sets_company_context_for_authenticated_user()
    {
        Auth::login($this->user);
        session(['current_company_id' => $this->company->id]);

        $request = Request::create('/test', 'GET');
        $next = function ($request) {
            return response('OK');
        };

        $response = $this->middleware->handle($request, $next);

        // 檢查 PostgreSQL 會話變數是否設定 (只在 PostgreSQL 環境測試)
        if (DB::getDriverName() === 'pgsql') {
            $result = DB::selectOne("SELECT current_setting('app.current_company_id', true) as company_id");
            $this->assertEquals($this->company->id, (int)$result->company_id);
        }
        
        $this->assertEquals(200, $response->getStatusCode());
    }

    /**
     * 測試未認證用戶不設定公司上下文
     */
    public function test_does_not_set_context_for_unauthenticated_user()
    {
        $request = Request::create('/test', 'GET');
        $next = function ($request) {
            return response('OK');
        };

        $response = $this->middleware->handle($request, $next);

        // 檢查 PostgreSQL 會話變數未設定 (只在 PostgreSQL 環境測試)
        if (DB::getDriverName() === 'pgsql') {
            $result = DB::selectOne("SELECT current_setting('app.current_company_id', true) as company_id");
            $this->assertEmpty($result->company_id);
        }
        
        $this->assertEquals(200, $response->getStatusCode());
    }

    /**
     * 測試用戶沒有公司關聯的情況
     */
    public function test_handles_user_without_company_association()
    {
        $userWithoutCompany = User::create([
            'name' => 'No Company User',
            'email' => 'nocompany@example.com',
            'password' => bcrypt('password'),
            'email_verified_at' => now(),
        ]);

        Auth::login($userWithoutCompany);

        $request = Request::create('/test', 'GET');
        $next = function ($request) {
            return response('OK');
        };

        // 不應拋出異常
        $response = $this->middleware->handle($request, $next);
        $this->assertEquals(200, $response->getStatusCode());
    }

    /**
     * 測試獲取主要公司ID的邏輯
     */
    public function test_gets_primary_company_id_when_no_session()
    {
        Auth::login($this->user);
        // 不設定 session company_id

        $request = Request::create('/test', 'GET');
        $next = function ($request) {
            return response('OK');
        };

        $response = $this->middleware->handle($request, $next);

        // 應該使用主要公司ID (只在 PostgreSQL 環境測試)
        if (DB::getDriverName() === 'pgsql') {
            $result = DB::selectOne("SELECT current_setting('app.current_company_id', true) as company_id");
            $this->assertEquals($this->company->id, (int)$result->company_id);
        }
        
        $this->assertEquals(200, $response->getStatusCode());
    }

    /**
     * 測試會話公司ID的優先級
     */
    public function test_session_company_id_takes_priority()
    {
        // 創建第二個公司
        $company2 = Company::create([
            'name' => 'Second Company',
            'display_name' => '第二公司',
            'code' => 'TEST2',
            'is_active' => true,
        ]);

        $this->user->companies()->attach($company2->id, [
            'role' => 'member',
            'is_primary' => false,
            'is_active' => true,
            'joined_at' => now(),
        ]);

        Auth::login($this->user);
        session(['current_company_id' => $company2->id]);

        $request = Request::create('/test', 'GET');
        $next = function ($request) {
            return response('OK');
        };

        $response = $this->middleware->handle($request, $next);

        // 應該使用會話中的公司ID，而不是主要公司ID (只在 PostgreSQL 環境測試)
        if (DB::getDriverName() === 'pgsql') {
            $result = DB::selectOne("SELECT current_setting('app.current_company_id', true) as company_id");
            $this->assertEquals($company2->id, (int)$result->company_id);
        }
        
        $this->assertEquals(200, $response->getStatusCode());
    }

    /**
     * 測試用戶不屬於會話中指定公司的情況
     */
    public function test_ignores_invalid_session_company_id()
    {
        $invalidCompany = Company::create([
            'name' => 'Invalid Company',
            'display_name' => '無效公司',
            'code' => 'INVALID',
            'is_active' => true,
        ]);

        Auth::login($this->user);
        session(['current_company_id' => $invalidCompany->id]); // 用戶不屬於這個公司

        $request = Request::create('/test', 'GET');
        $next = function ($request) {
            return response('OK');
        };

        $response = $this->middleware->handle($request, $next);

        // 應該回退到用戶的主要公司 (只在 PostgreSQL 環境測試)
        if (DB::getDriverName() === 'pgsql') {
            $result = DB::selectOne("SELECT current_setting('app.current_company_id', true) as company_id");
            $this->assertEquals($this->company->id, (int)$result->company_id);
        }
        
        $this->assertEquals(200, $response->getStatusCode());
    }

    /**
     * 測試停用公司關聯的處理
     */
    public function test_ignores_inactive_company_association()
    {
        // 停用用戶的公司關聯
        $this->user->companies()->updateExistingPivot($this->company->id, [
            'is_active' => false
        ]);

        Auth::login($this->user);

        $request = Request::create('/test', 'GET');
        $next = function ($request) {
            return response('OK');
        };

        $response = $this->middleware->handle($request, $next);

        // 由於沒有活躍的公司關聯，不應設定公司上下文 (只在 PostgreSQL 環境測試)
        if (DB::getDriverName() === 'pgsql') {
            $result = DB::selectOne("SELECT current_setting('app.current_company_id', true) as company_id");
            $this->assertEmpty($result->company_id);
        }
        
        $this->assertEquals(200, $response->getStatusCode());
    }

    /**
     * 測試數據庫錯誤的處理
     */
    public function test_handles_database_errors_gracefully()
    {
        Auth::login($this->user);
        session(['current_company_id' => $this->company->id]);

        // Mock DB::statement 拋出異常
        DB::shouldReceive('statement')
          ->once()
          ->with(\Mockery::pattern('/SET app\.current_company_id/'))
          ->andThrow(new \Exception('Database error'));

        $request = Request::create('/test', 'GET');
        $next = function ($request) {
            return response('OK');
        };

        // 不應拋出異常，應該正常繼續
        $response = $this->middleware->handle($request, $next);
        $this->assertEquals(200, $response->getStatusCode());
    }
}