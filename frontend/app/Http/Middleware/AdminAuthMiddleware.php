<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Session;
use Symfony\Component\HttpFoundation\Response;

class AdminAuthMiddleware
{
    /**
     * Handle an incoming request.
     * 處理後台管理員認證中介層
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // 檢查是否已透過後台登入
        if (!Session::has('admin_authenticated')) {
            return redirect()->route('admin.login')
                ->with('error', '請先進行後台登入');
        }

        // 檢查 session 中的管理員資訊
        $adminUser = Session::get('admin_user');
        if (!$adminUser) {
            Session::forget('admin_authenticated');
            return redirect()->route('admin.login')
                ->with('error', 'Session 已過期，請重新登入');
        }

        // 驗證管理員帳號類型
        $allowedAdminUsers = ['admin', 'DEMO'];
        if (!in_array($adminUser, $allowedAdminUsers)) {
            Session::forget(['admin_authenticated', 'admin_user']);
            return redirect()->route('admin.login')
                ->with('error', '無效的管理員帳號');
        }

        // 設定當前請求的管理員資訊，供控制器使用
        $request->attributes->set('admin_user', $adminUser);
        $request->attributes->set('is_demo_admin', $adminUser === 'DEMO');

        return $next($request);
    }
}