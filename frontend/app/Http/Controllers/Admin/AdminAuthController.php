<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Session;
use Illuminate\View\View;
use Illuminate\Http\RedirectResponse;

class AdminAuthController extends Controller
{
    /**
     * 預設的後台管理員帳號
     * admin: 高強度密碼
     * DEMO: DEMO (僅供展示使用)
     */
    private const ADMIN_CREDENTIALS = [
        'admin' => 'NexusERP@Admin2025!SecurePass#789',
        'DEMO' => 'DEMO'
    ];

    /**
     * 顯示後台登入表單
     */
    public function showLoginForm(): View
    {
        return view('admin.auth.login');
    }

    /**
     * 處理後台登入請求
     */
    public function login(Request $request): RedirectResponse
    {
        $request->validate([
            'username' => 'required|string',
            'password' => 'required|string',
        ], [
            'username.required' => '請輸入使用者名稱',
            'password.required' => '請輸入密碼',
        ]);

        $username = $request->input('username');
        $password = $request->input('password');

        // 驗證管理員帳號
        if (!$this->validateAdminCredentials($username, $password)) {
            return back()->withErrors([
                'login' => '使用者名稱或密碼錯誤'
            ])->withInput($request->only('username'));
        }

        // 設定登入 session
        Session::put('admin_authenticated', true);
        Session::put('admin_user', $username);
        Session::put('admin_login_time', now());

        // 記錄登入資訊
        \Log::info('Admin login successful', [
            'username' => $username,
            'ip' => $request->ip(),
            'user_agent' => $request->userAgent()
        ]);

        return redirect()->route('admin.dashboard')
            ->with('success', '登入成功！歡迎使用後台管理系統');
    }

    /**
     * 處理後台登出
     */
    public function logout(Request $request): RedirectResponse
    {
        $adminUser = Session::get('admin_user');
        
        // 清除 session
        Session::forget(['admin_authenticated', 'admin_user', 'admin_login_time']);
        
        // 記錄登出資訊
        \Log::info('Admin logout', [
            'username' => $adminUser,
            'ip' => $request->ip()
        ]);

        return redirect()->route('admin.login')
            ->with('success', '已成功登出');
    }

    /**
     * 驗證管理員帳號密碼
     */
    private function validateAdminCredentials(string $username, string $password): bool
    {
        if (!array_key_exists($username, self::ADMIN_CREDENTIALS)) {
            return false;
        }

        $expectedPassword = self::ADMIN_CREDENTIALS[$username];
        
        // 簡單字串比對 (在實際生產環境中應使用更安全的方式)
        return $password === $expectedPassword;
    }

    /**
     * 檢查當前登入狀態 (API)
     */
    public function checkAuth(): \Illuminate\Http\JsonResponse
    {
        $isAuthenticated = Session::has('admin_authenticated');
        $adminUser = Session::get('admin_user');
        
        return response()->json([
            'authenticated' => $isAuthenticated,
            'user' => $adminUser,
            'is_demo' => $adminUser === 'DEMO'
        ]);
    }
}