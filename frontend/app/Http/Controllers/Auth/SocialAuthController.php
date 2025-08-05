<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Laravel\Socialite\Facades\Socialite;
use Exception;

class SocialAuthController extends Controller
{
    /**
     * Redirect to Google OAuth provider
     */
    public function redirectToGoogle(): RedirectResponse
    {
        try {
            return Socialite::driver('google')->redirect();
        } catch (Exception $e) {
            Log::error('Google OAuth redirect failed', [
                'error' => $e->getMessage()
            ]);
            
            return redirect()
                ->route('register')
                ->with('error', 'Google 登入服務暫時無法使用，請稍後再試');
        }
    }

    /**
     * Handle Google OAuth callback
     */
    public function handleGoogleCallback(): RedirectResponse
    {
        try {
            $googleUser = Socialite::driver('google')->user();
            
            // 檢查是否已存在用戶
            $existingUser = User::where('email', $googleUser->getEmail())->first();
            
            if ($existingUser) {
                // 更新 Google 相關資料
                $existingUser->update([
                    'google_id' => $googleUser->getId(),
                    'avatar' => $googleUser->getAvatar(),
                ]);
                
                Auth::login($existingUser);
                
                Log::info('User logged in via Google', [
                    'user_id' => $existingUser->id,
                    'email' => $existingUser->email
                ]);
                
                // 檢查用戶是否已完成業務設定
                if (!$existingUser->business_type || !$existingUser->role) {
                    return redirect()->route('auth.business-setup');
                }
                
                return redirect()->intended(route('dashboard'));
            }
            
            // 建立新用戶
            $user = User::create([
                'name' => $googleUser->getName(),
                'email' => $googleUser->getEmail(),
                'google_id' => $googleUser->getId(),
                'avatar' => $googleUser->getAvatar(),
                'email_verified_at' => now(),
                'password' => Hash::make(str()->random(24)), // 產生隨機密碼
            ]);

            event(new Registered($user));
            Auth::login($user);
            
            Log::info('New user registered via Google', [
                'user_id' => $user->id,
                'email' => $user->email
            ]);

            return redirect()
                ->route('auth.business-setup')
                ->with('success', '歡迎使用 NexusERP！請完成業務設定以開始使用系統');
                
        } catch (Exception $e) {
            Log::error('Google OAuth callback failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return redirect()
                ->route('register')
                ->with('error', 'Google 登入失敗：' . $e->getMessage());
        }
    }

    /**
     * Redirect to LINE OAuth provider
     */
    public function redirectToLine(): RedirectResponse
    {
        try {
            return Socialite::driver('line')->redirect();
        } catch (Exception $e) {
            Log::error('LINE OAuth redirect failed', [
                'error' => $e->getMessage()
            ]);
            
            return redirect()
                ->route('register')
                ->with('error', 'LINE 登入服務暫時無法使用，請稍後再試');
        }
    }

    /**
     * Handle LINE OAuth callback
     */
    public function handleLineCallback(): RedirectResponse
    {
        try {
            $lineUser = Socialite::driver('line')->user();
            
            // LINE 不提供 email，需要使用 LINE ID 作為唯一識別
            $lineId = $lineUser->getId();
            $existingUser = User::where('line_id', $lineId)->first();
            
            if ($existingUser) {
                // 更新 LINE 相關資料
                $existingUser->update([
                    'avatar' => $lineUser->getAvatar(),
                ]);
                
                Auth::login($existingUser);
                
                Log::info('User logged in via LINE', [
                    'user_id' => $existingUser->id,
                    'line_id' => $lineId
                ]);
                
                // 檢查用戶是否已完成業務設定
                if (!$existingUser->business_type || !$existingUser->role) {
                    return redirect()->route('auth.business-setup');
                }
                
                return redirect()->intended(route('dashboard'));
            }
            
            // LINE 沒有提供 email，需要生成一個唯一的 email（轉為小寫避免驗證錯誤）
            $email = strtolower('line_' . $lineId . '@nexus.local');
            
            // 檢查生成的 email 是否已存在
            if (User::where('email', $email)->exists()) {
                return redirect()
                    ->route('register')
                    ->with('error', '此 LINE 帳號已註冊過，請直接登入');
            }
            
            // 建立新用戶
            $user = User::create([
                'name' => $lineUser->getName() ?: 'LINE 用戶',
                'email' => $email,
                'line_id' => $lineId,
                'avatar' => $lineUser->getAvatar(),
                'email_verified_at' => now(), // LINE 帳號視為已驗證
                'password' => Hash::make(str()->random(24)), // 產生隨機密碼
            ]);

            event(new Registered($user));
            Auth::login($user);
            
            Log::info('New user registered via LINE', [
                'user_id' => $user->id,
                'line_id' => $lineId
            ]);

            return redirect()
                ->route('auth.business-setup')
                ->with('success', '歡迎使用 NexusERP！請完成業務設定以開始使用系統');
                
        } catch (Exception $e) {
            Log::error('LINE OAuth callback failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return redirect()
                ->route('register')
                ->with('error', 'LINE 登入失敗：' . $e->getMessage());
        }
    }

    /**
     * Handle OAuth errors
     */
    public function handleOAuthError(Request $request): RedirectResponse
    {
        $error = $request->get('error');
        $errorDescription = $request->get('error_description', '未知錯誤');
        
        Log::warning('OAuth authentication cancelled or failed', [
            'error' => $error,
            'error_description' => $errorDescription,
            'url' => $request->url()
        ]);
        
        $message = match($error) {
            'access_denied' => '您取消了第三方登入授權',
            'invalid_request' => '登入請求無效，請重試',
            'server_error' => '第三方登入服務暫時無法使用',
            default => '第三方登入失敗：' . $errorDescription
        };
        
        return redirect()
            ->route('register')
            ->with('warning', $message);
    }
}