<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use App\Services\SimpleGoJWTService;

/**
 * 簡化的Go JWT中間件
 * 自動處理Laravel-Go認證整合
 */
class SimpleGoJWTMiddleware
{
    private SimpleGoJWTService $goJWTService;

    public function __construct(SimpleGoJWTService $goJWTService)
    {
        $this->goJWTService = $goJWTService;
    }

    /**
     * 處理傳入的請求
     */
    public function handle(Request $request, Closure $next)
    {
        // 1. 檢查Laravel認證狀態
        if (!Auth::check()) {
            return redirect()->route('login');
        }

        $user = Auth::user();

        // 2. 檢查是否已有有效的JWT Token
        if (!$this->goJWTService->hasToken()) {
            // 沒有JWT Token，嘗試獲取
            $result = $this->goJWTService->authenticateUser($user);
            
            if (!$result['success']) {
                Log::warning('Failed to obtain JWT token', [
                    'user_id' => $user->id,
                    'error' => $result['error']
                ]);
                
                // JWT獲取失敗，但不阻斷用戶（降級處理）
                $request->attributes->set('jwt_available', false);
                return $next($request);
            }
        }

        // 3. 驗證RLS上下文（可選，不影響主要流程）
        $rlsStatus = $this->goJWTService->verifyRLSContext();
        $request->attributes->set('rls_active', $rlsStatus['rls_active'] ?? false);
        $request->attributes->set('jwt_available', true);

        return $next($request);
    }
}