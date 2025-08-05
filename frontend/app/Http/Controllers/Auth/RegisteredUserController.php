<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Illuminate\View\View;

class RegisteredUserController extends Controller
{
    /**
     * Display the registration view.
     */
    public function create(): View
    {
        return view('auth.register');
    }

    /**
     * Handle an incoming registration request.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(Request $request): RedirectResponse|JsonResponse
    {
        // 檢查是否為 JSON 請求
        if ($request->isJson()) {
            return $this->handleJsonRegistration($request);
        }

        $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'lowercase', 'email', 'max:255', 'unique:'.User::class],
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
        ]);

        event(new Registered($user));

        Auth::login($user);

        // 重定向到業務設定頁面
        return redirect()
            ->route('auth.business-setup')
            ->with('success', '註冊成功！請完成業務設定以開始使用系統');
    }

    /**
     * Handle JSON registration request (AI-guided registration)
     */
    private function handleJsonRegistration(Request $request)
    {
        try {
            $request->validate([
                'name' => ['required', 'string', 'max:255'],
                'email' => ['required', 'string', 'lowercase', 'email', 'max:255', 'unique:'.User::class],
                'password' => ['required', Rules\Password::defaults()],
                'business_description' => ['nullable', 'string'],
                'ai_analysis' => ['nullable', 'string'],
                'conversation_history' => ['nullable', 'string'],
            ]);

            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'password' => Hash::make($request->password),
            ]);

            // 保存 AI 對話歷史以供業務設定頁面使用
            if ($request->filled('business_description') || $request->filled('ai_analysis')) {
                session([
                    'registration_business_context' => [
                        'business_description' => $request->business_description,
                        'ai_analysis' => $request->ai_analysis,
                        'conversation_history' => $request->conversation_history,
                    ]
                ]);
            }

            event(new Registered($user));

            Auth::login($user);

            // 返回 JSON 回應
            return response()->json([
                'success' => true,
                'message' => '註冊成功！請完成業務設定',
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                ],
                'redirect' => route('auth.business-setup')
            ], 201);
            
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => '驗證失敗',
                'errors' => $e->errors()
            ], 422);
            
        } catch (\Illuminate\Database\QueryException $e) {
            // 處理資料庫約束錯誤
            if ($e->errorInfo[0] === '23505') { // PostgreSQL unique violation
                if (strpos($e->getMessage(), 'users_email_unique') !== false) {
                    return response()->json([
                        'success' => false,
                        'message' => '此電子郵件已被使用',
                        'errors' => ['email' => ['此電子郵件已被註冊']]
                    ], 422);
                } elseif (strpos($e->getMessage(), 'users_username_key') !== false || strpos($e->getMessage(), 'name') !== false) {
                    return response()->json([
                        'success' => false,
                        'message' => '此姓名已被使用',
                        'errors' => ['name' => ['此姓名已被註冊，請使用不同的姓名']]
                    ], 422);
                }
            }
            
            return response()->json([
                'success' => false,
                'message' => '註冊失敗，請稍後再試',
                'error' => config('app.debug') ? $e->getMessage() : '資料庫錯誤'
            ], 500);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => '註冊失敗，請稍後再試',
                'error' => config('app.debug') ? $e->getMessage() : '系統錯誤'
            ], 500);
        }
    }

}
