<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\View\View;

class AuthenticatedSessionController extends Controller
{
    /**
     * Display the login view.
     */
    public function create(): View
    {
        return view('auth.login');
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        $request->authenticate();

        $request->session()->regenerate();

        // 登入成功後，自動設置用戶的主要公司上下文
        $this->setUserCompanyContext();

        return redirect()->intended(route('dashboard', absolute: false));
    }

    /**
     * 設置使用者的公司上下文
     * 自動選擇用戶的主要公司，如果沒有主要公司則選擇第一個有效公司
     */
    private function setUserCompanyContext(): void
    {
        $user = auth()->user();
        
        if (!$user) {
            return;
        }

        try {
            // 查找用戶的主要公司
            $primaryCompany = \Illuminate\Support\Facades\DB::table('user_companies')
                ->where('user_id', $user->id)
                ->where('is_primary', true)
                ->where('is_active', true)
                ->first();

            if ($primaryCompany) {
                session(['current_company_id' => $primaryCompany->company_id]);
                \Illuminate\Support\Facades\Log::info('Primary company context set on login', [
                    'user_id' => $user->id,
                    'company_id' => $primaryCompany->company_id
                ]);
                return;
            }

            // 如果沒有主要公司，選擇第一個有效公司
            $firstCompany = \Illuminate\Support\Facades\DB::table('user_companies')
                ->where('user_id', $user->id)
                ->where('is_active', true)
                ->first();

            if ($firstCompany) {
                session(['current_company_id' => $firstCompany->company_id]);
                \Illuminate\Support\Facades\Log::info('First available company context set on login', [
                    'user_id' => $user->id,
                    'company_id' => $firstCompany->company_id
                ]);
            } else {
                \Illuminate\Support\Facades\Log::warning('User has no active company associations', [
                    'user_id' => $user->id,
                    'email' => $user->email
                ]);
            }

        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Failed to set company context on login', [
                'user_id' => $user->id,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();

        $request->session()->regenerateToken();

        return redirect('/');
    }
}
