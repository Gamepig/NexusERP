<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

/**
 * 設定多租戶上下文中介軟體
 * 
 * 功能：
 * 1. 為每個請求設定當前公司 ID 到 PostgreSQL 會話
 * 2. 啟用 Row Level Security (RLS) 資料隔離
 * 3. 處理超級管理員繞過邏輯
 * 4. 記錄租戶切換日誌
 * 
 * 安全等級：CRITICAL
 * 影響範圍：所有 API 請求的資料隔離
 */
class SetTenantContext
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // 1. 獲取當前用戶和公司資訊
        $user = Auth::user();
        $companyId = $this->getCurrentCompanyId($request, $user);
        
        // 2. 設定 PostgreSQL RLS 上下文
        if ($companyId) {
            $this->setDatabaseContext($companyId, $user);
        }
        
        // 3. 記錄租戶上下文設定
        $this->logTenantContext($request, $companyId, $user);
        
        // 4. 處理請求
        $response = $next($request);
        
        // 5. 清理資料庫上下文（可選）
        $this->cleanupDatabaseContext();
        
        return $response;
    }

    /**
     * 獲取目前用戶的公司 ID
     */
    private function getCurrentCompanyId(Request $request, $user): ?int
    {
        // 1. 優先從請求標頭獲取（API 客戶端）
        if ($request->hasHeader('X-Company-ID')) {
            $headerCompanyId = (int) $request->header('X-Company-ID');
            if ($this->validateUserCompanyAccess($user, $headerCompanyId)) {
                return $headerCompanyId;
            }
        }
        
        // 2. 從會話獲取（Web 應用）
        if ($request->session()->has('current_company_id')) {
            $sessionCompanyId = (int) $request->session()->get('current_company_id');
            if ($this->validateUserCompanyAccess($user, $sessionCompanyId)) {
                return $sessionCompanyId;
            }
        }
        
        // 3. 從用戶的預設公司獲取
        if ($user && method_exists($user, 'getCurrentCompany')) {
            $defaultCompany = $user->getCurrentCompany();
            if ($defaultCompany) {
                return $defaultCompany->id;
            }
        }
        
        // 4. 從用戶公司關聯表獲取第一個公司
        if ($user) {
            $userCompany = DB::table('user_companies')
                ->where('user_id', $user->id)
                ->where('status', 'active')
                ->orderBy('is_primary', 'desc')
                ->orderBy('created_at', 'asc')
                ->first();
                
            if ($userCompany) {
                return $userCompany->company_id;
            }
        }
        
        return null;
    }

    /**
     * 驗證用戶是否有存取指定公司的權限
     */
    private function validateUserCompanyAccess($user, int $companyId): bool
    {
        if (!$user) {
            return false;
        }
        
        // 檢查超級管理員權限
        if ($this->isSuperAdmin($user)) {
            return true;
        }
        
        // 檢查用戶是否屬於該公司
        return DB::table('user_companies')
            ->where('user_id', $user->id)
            ->where('company_id', $companyId)
            ->where('status', 'active')
            ->exists();
    }

    /**
     * 設定資料庫上下文
     */
    private function setDatabaseContext(int $companyId, $user): void
    {
        try {
            // 設定當前公司 ID（用於 RLS 策略）
            DB::statement("SET LOCAL app.current_company_id = ?", [$companyId]);
            
            // 設定當前用戶 ID（用於審計日誌）
            if ($user) {
                DB::statement("SET LOCAL app.current_user_id = ?", [$user->id]);
            }
            
            // 設定超級管理員模式（謹慎使用）
            $isSuperAdmin = $this->isSuperAdmin($user);
            DB::statement("SET LOCAL app.superuser_mode = ?", [$isSuperAdmin ? 'true' : 'false']);
            
            // 設定客戶端資訊（用於審計）
            $clientInfo = [
                'ip' => request()->ip(),
                'user_agent' => request()->userAgent(),
                'timestamp' => now()->toISOString()
            ];
            DB::statement("SET LOCAL app.client_info = ?", [json_encode($clientInfo)]);
            
        } catch (\Exception $e) {
            Log::error('資料庫上下文設定失敗', [
                'company_id' => $companyId,
                'user_id' => $user?->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            // 拋出異常，避免在沒有適當隔離的情況下繼續執行
            throw new \RuntimeException('多租戶上下文設定失敗：' . $e->getMessage());
        }
    }

    /**
     * 檢查是否為超級管理員
     */
    private function isSuperAdmin($user): bool
    {
        if (!$user) {
            return false;
        }
        
        // 檢查用戶是否有系統管理員角色
        if (method_exists($user, 'hasRole')) {
            return $user->hasRole('super_admin') || $user->hasRole('system_admin');
        }
        
        // 檢查用戶表中的 is_admin 欄位
        if (isset($user->is_admin)) {
            return (bool) $user->is_admin;
        }
        
        // 從資料庫檢查角色
        return DB::table('user_roles')
            ->join('roles', 'roles.id', '=', 'user_roles.role_id')
            ->where('user_roles.user_id', $user->id)
            ->where('roles.name', 'super_admin')
            ->where('user_roles.status', 'active')
            ->exists();
    }

    /**
     * 記錄租戶上下文設定
     */
    private function logTenantContext(Request $request, ?int $companyId, $user): void
    {
        // 只在開發環境記錄詳細日誌
        if (config('app.debug')) {
            Log::info('租戶上下文已設定', [
                'company_id' => $companyId,
                'user_id' => $user?->id,
                'route' => $request->getPathInfo(),
                'method' => $request->getMethod(),
                'ip' => $request->ip(),
                'is_super_admin' => $this->isSuperAdmin($user)
            ]);
        }
        
        // 在生產環境只記錄異常情況
        if (!$companyId && $user) {
            Log::warning('用戶無法設定租戶上下文', [
                'user_id' => $user->id,
                'route' => $request->getPathInfo(),
                'ip' => $request->ip()
            ]);
        }
    }

    /**
     * 清理資料庫上下文（請求結束後）
     */
    private function cleanupDatabaseContext(): void
    {
        try {
            // PostgreSQL 會在連線結束時自動清理 LOCAL 設定
            // 這裡可以添加額外的清理邏輯（如果需要）
            
        } catch (\Exception $e) {
            Log::error('資料庫上下文清理失敗', [
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * 處理上下文設定例外
     */
    private function handleContextException(\Exception $e, Request $request): Response
    {
        Log::critical('多租戶上下文設定嚴重錯誤', [
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString(),
            'request' => [
                'url' => $request->fullUrl(),
                'method' => $request->getMethod(),
                'ip' => $request->ip(),
                'user_agent' => $request->userAgent()
            ]
        ]);
        
        // 在生產環境返回通用錯誤訊息
        return response()->json([
            'error' => '系統暫時無法處理請求，請稍後再試',
            'code' => 'TENANT_CONTEXT_ERROR'
        ], 500);
    }
}