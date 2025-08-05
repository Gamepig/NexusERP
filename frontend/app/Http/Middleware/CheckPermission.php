<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * 權限檢查中間件
 * 
 * 基於 RBAC 系統檢查用戶權限，支援多種權限檢查模式
 * 支援 AJAX 請求的 JSON 錯誤回應
 */
class CheckPermission
{
    /**
     * 處理傳入請求
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, string $permission, string $mode = 'single'): Response
    {
        // 檢查用戶是否已認證
        if (!auth()->check()) {
            return $this->handleUnauthorized($request);
        }

        $user = auth()->user();
        $hasPermission = false;

        // 根據檢查模式執行不同的權限檢查
        switch ($mode) {
            case 'single':
                // 單一權限檢查
                $hasPermission = $user->hasPermission($permission);
                break;
                
            case 'any':
                // 任一權限檢查（多個權限用 | 分隔）
                $permissions = explode('|', $permission);
                $hasPermission = $user->hasAnyPermission($permissions);
                break;
                
            case 'all':
                // 所有權限檢查（多個權限用 & 分隔）
                $permissions = explode('&', $permission);
                $hasPermission = $user->hasAllPermissions($permissions);
                break;
                
            case 'role':
                // 角色檢查
                $hasPermission = $user->hasRole($permission);
                break;
                
            case 'role_any':
                // 任一角色檢查
                $roles = explode('|', $permission);
                $hasPermission = $user->hasAnyRole($roles);
                break;
                
            case 'admin':
                // 管理員檢查
                $hasPermission = $user->isAdmin();
                break;
                
            case 'super_admin':
                // 超級管理員檢查
                $hasPermission = $user->isSuperAdmin();
                break;
                
            case 'manager_or_admin':
                // 經理或管理員檢查
                $hasPermission = $user->isManager();
                break;
                
            default:
                // 預設為單一權限檢查
                $hasPermission = $user->hasPermission($permission);
        }

        // 如果沒有權限，返回 403 錯誤
        if (!$hasPermission) {
            return $this->handleForbidden($request, $permission, $mode);
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
     * 處理權限不足錯誤
     */
    private function handleForbidden(Request $request, string $permission, string $mode): Response
    {
        // 記錄權限檢查失敗（用於安全審核）
        logger()->warning('Permission check failed', [
            'user_id' => auth()->id(),
            'permission' => $permission,
            'mode' => $mode,
            'url' => $request->url(),
            'ip' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        if ($request->expectsJson()) {
            return response()->json([
                'error' => '權限不足',
                'message' => '您沒有足夠的權限執行此操作',
                'code' => 'INSUFFICIENT_PERMISSIONS',
                'required_permission' => $permission,
                'check_mode' => $mode
            ], 403);
        }

        // 重定向到 403 錯誤頁面
        abort(403, '您沒有足夠的權限存取此頁面');
    }
}