<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class EnsureCompanySetup
{
    /**
     * 檢查用戶是否已完成公司設定
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = Auth::user();
        
        // 如果未登入，直接通過
        if (!$user) {
            return $next($request);
        }
        
        // 檢查用戶是否完成公司設定
        if (!$user->hasCompany()) {
            // 如果是 AJAX 請求，返回 JSON 錯誤
            if ($request->expectsJson()) {
                return response()->json([
                    'error' => '請先完成公司設定',
                    'redirect' => route('auth.business-setup')
                ], 403);
            }
            
            // 重定向到公司設定頁面
            return redirect()->route('auth.business-setup')
                ->with('warning', '請完成公司設定以繼續使用系統');
        }
        
        // 設定當前公司 ID 到會話中
        if (!session()->has('current_company_id')) {
            // 使用原生查詢避開 RLS 政策問題，完全避開 companies 表
            $firstCompanyData = \Illuminate\Support\Facades\DB::table('user_companies')
                ->where('user_id', $user->id)
                ->where('is_active', true)
                ->select('company_id')
                ->first();
                
            if ($firstCompanyData) {
                session(['current_company_id' => $firstCompanyData->company_id]);
            }
        }
        
        return $next($request);
    }
}