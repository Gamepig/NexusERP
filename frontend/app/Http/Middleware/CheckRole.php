<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * 角色檢查中間件
 * 
 * 檢查用戶是否擁有特定角色，支援多種檢查模式
 * 支援 AJAX 請求的 JSON 錯誤回應
 */
class CheckRole
{
    /**
     * 處理傳入請求
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, string $role, string $mode = 'single'): Response
    {
        // 檢查用戶是否已認證
        if (!auth()->check()) {
            return $this->handleUnauthorized($request);
        }

        $user = auth()->user();
        $hasRole = false;

        // 根據檢查模式執行不同的角色檢查
        switch ($mode) {
            case 'single':
                // 單一角色檢查
                $hasRole = $user->hasRole($role);
                break;
                
            case 'any':
                // 任一角色檢查（多個角色用 | 分隔）
                $roles = explode('|', $role);
                $hasRole = $user->hasAnyRole($roles);
                break;
                
            case 'all':
                // 所有角色檢查（多個角色用 & 分隔）
                $roles = explode('&', $role);
                $hasRole = $user->hasAllRoles($roles);
                break;
                
            default:
                // 預設為單一角色檢查
                $hasRole = $user->hasRole($role);
        }

        // 如果沒有角色，返回 403 錯誤
        if (!$hasRole) {
            return $this->handleForbidden($request, $role, $mode);
        }

        return $next($request);
    }

    /**
     * 處理未認證錯誤
     */
    private function handleUnauthorized(Request $request): Response
    {
        if ($request->expectsJson()) {
            return response()->json([
                'error' => '未認證',
                'message' => '請先登入後再試',
                'code' => 'UNAUTHORIZED'
            ], 401);
        }

        return redirect()->guest(route('login'));
    }

    /**
     * 處理角色不足錯誤
     */
    private function handleForbidden(Request $request, string $role, string $mode): Response
    {
        // 記錄角色檢查失敗（用於安全審核）
        logger()->warning('Role check failed', [
            'user_id' => auth()->id(),
            'required_role' => $role,
            'mode' => $mode,
            'user_roles' => auth()->user()->getRoleNames(),
            'url' => $request->url(),
            'ip' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        if ($request->expectsJson()) {
            return response()->json([
                'error' => '角色權限不足',
                'message' => '您的角色權限不足以執行此操作',
                'code' => 'INSUFFICIENT_ROLE',
                'required_role' => $role,
                'check_mode' => $mode,
                'user_roles' => auth()->user()->getRoleNames()
            ], 403);
        }

        // 重定向到 403 錯誤頁面
        abort(403, '您的角色權限不足以存取此頁面');
    }
}