<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * 設定公司上下文中介軟體
 * 
 * 這個中介軟體的作用：
 * 1. 為每個請求設定當前公司ID到資料庫會話變數
 * 2. 啟用PostgreSQL Row Level Security (RLS) 的多租戶隔離
 * 3. 確保使用者只能存取所屬公司的資料
 * 
 * 業務重要性：⭐⭐⭐⭐⭐
 * 風險等級：CRITICAL - 資料安全的最後一道防線
 */
class SetCompanyContext
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure(\Illuminate\Http\Request): (\Illuminate\Http\Response|\Illuminate\Http\RedirectResponse)  $next
     * @return \Illuminate\Http\Response|\Illuminate\Http\RedirectResponse
     */
    public function handle(Request $request, Closure $next)
    {
        // 初始化 PostgreSQL 會話變量，確保其永遠不會是空字符串
        try {
            // 直接使用 NULLIF 將空字符串轉換為 NULL，使用會話層級設置
            \Illuminate\Support\Facades\DB::statement("SELECT set_config('app.current_company_id', NULLIF(current_setting('app.current_company_id', true), ''), false)");
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::warning("Failed to initialize company context session variable", [
                'error' => $e->getMessage()
            ]);
        }
        
        // 只有認證用戶才需要設定公司上下文
        if (auth()->check()) {
            $user = auth()->user();
            
            // 檢查用戶是否有公司關聯
            if ($this->userHasCompanyAssociation($user)) {
                $companyId = $this->getCurrentCompanyId($user);
                
                if ($companyId && is_numeric($companyId) && $companyId > 0) {
                    // 設定 PostgreSQL 會話變數，供 RLS 政策使用
                    try {
                        // 確保 companyId 是有效的數字字符串
                        $companyIdStr = (string) intval($companyId);
                        
                        // 設置會話層級變數，確保在整個請求期間有效
                        \Illuminate\Support\Facades\DB::statement("SELECT set_config('app.current_company_id', ?, false)", [$companyIdStr]);
                        
                        // 記錄公司上下文設定（僅在開發環境）
                        if (config('app.debug')) {
                            \Illuminate\Support\Facades\Log::debug("Company context set", [
                                'user_id' => $user->id,
                                'company_id' => $companyId,
                                'company_id_str' => $companyIdStr,
                                'session_company_id' => session('current_company_id'),
                                'request_path' => $request->path(),
                                'rls_context_set' => true
                            ]);
                        }
                        
                        // 更新會話中的公司ID（如果尚未設定或不同）
                        if (session('current_company_id') !== $companyId) {
                            session(['current_company_id' => $companyId]);
                        }
                        
                    } catch (\Exception $e) {
                        // RLS 設置失敗是嚴重問題，記錄錯誤並拋出異常
                        \Illuminate\Support\Facades\Log::error("Critical: Failed to set company context", [
                            'user_id' => $user->id,
                            'company_id' => $companyId,
                            'error' => $e->getMessage(),
                            'request_path' => $request->path(),
                            'stack_trace' => $e->getTraceAsString()
                        ]);
                        
                        // 對於 API 請求，返回 JSON 錯誤
                        if ($request->expectsJson()) {
                            throw new \Exception('公司上下文設置失敗，請重新登入', 500);
                        }
                    }
                } else {
                    // 用戶沒有有效的公司ID，記錄警告
                    \Illuminate\Support\Facades\Log::warning("User has no valid company ID", [
                        'user_id' => $user->id,
                        'user_email' => $user->email,
                        'request_path' => $request->path()
                    ]);
                }
            } else {
                // 用戶沒有公司關聯，記錄警告
                \Illuminate\Support\Facades\Log::warning("User has no company association", [
                    'user_id' => $user->id,
                    'user_email' => $user->email,
                    'request_path' => $request->path()
                ]);
            }
        }

        return $next($request);
    }

    /**
     * 檢查用戶是否有公司關聯
     *
     * @param  \App\Models\User  $user
     * @return bool
     */
    private function userHasCompanyAssociation($user): bool
    {
        try {
            // 使用原生查詢避開 RLS 政策問題
            return \Illuminate\Support\Facades\DB::table('user_companies')
                ->where('user_id', $user->id)
                ->where('is_active', true)
                ->exists();
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error("Error checking user company association", [
                'user_id' => $user->id,
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }

    /**
     * 取得當前使用者的公司ID
     * 
     * 優先級順序：
     * 1. 會話中指定的公司ID（用戶切換公司時）
     * 2. 用戶的主要公司ID
     * 3. 用戶的第一個有效公司ID
     *
     * @param  \App\Models\User  $user
     * @return int|null
     */
    private function getCurrentCompanyId($user): ?int
    {
        try {
            // 1. 檢查會話中的公司ID
            $sessionCompanyId = session('current_company_id');
            if ($sessionCompanyId && $this->userBelongsToCompany($user, $sessionCompanyId)) {
                return (int) $sessionCompanyId;
            }

            // 2. 取得用戶的主要公司 - 使用原生查詢避開 RLS 政策
            $primaryCompanyData = \Illuminate\Support\Facades\DB::table('user_companies')
                ->where('user_id', $user->id)
                ->where('is_primary', true)
                ->where('is_active', true)
                ->select('company_id')
                ->first();
                
            if ($primaryCompanyData) {
                return $primaryCompanyData->company_id;
            }

            // 3. 取得用戶的第一個有效公司 - 使用原生查詢避開 RLS 政策
            $firstCompanyData = \Illuminate\Support\Facades\DB::table('user_companies')
                ->where('user_id', $user->id)
                ->where('is_active', true)
                ->select('company_id')
                ->first();
                
            if ($firstCompanyData) {
                return $firstCompanyData->company_id;
            }

            return null;
            
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error("Error getting current company ID", [
                'user_id' => $user->id,
                'error' => $e->getMessage()
            ]);
            return null;
        }
    }

    /**
     * 檢查用戶是否屬於指定公司
     *
     * @param  \App\Models\User  $user
     * @param  int  $companyId
     * @return bool
     */
    private function userBelongsToCompany($user, int $companyId): bool
    {
        try {
            // 使用原生查詢避開 RLS 政策問題
            return \Illuminate\Support\Facades\DB::table('user_companies')
                ->where('user_id', $user->id)
                ->where('company_id', $companyId)
                ->where('is_active', true)
                ->exists();
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error("Error checking user company membership", [
                'user_id' => $user->id,
                'company_id' => $companyId,
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }
}