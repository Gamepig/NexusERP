<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Session;
use App\Models\User;

/**
 * 簡化的Go JWT整合服務
 * 專注於Laravel-Go認證整合的核心功能
 */
class SimpleGoJWTService
{
    private string $goApiUrl;
    private int $timeout;

    public function __construct()
    {
        $this->goApiUrl = config('go_backend.base_url', 'http://localhost:8082');
        $this->timeout = 30;
    }

    /**
     * Laravel整合專用的簡化認證
     */
    public function authenticateUser(User $user): array
    {
        try {
            // 1. 獲取用戶的公司ID
            $companyId = $this->getUserCompanyId($user);
            
            // 2. 調用Go Backend的簡化認證端點
            $response = Http::timeout($this->timeout)
                ->post("{$this->goApiUrl}/api/auth/simple-login", [
                    'user_id' => $user->id,
                    'company_id' => $companyId,
                    'email' => $user->email,
                ]);

            if (!$response->successful()) {
                throw new \Exception("Go Backend authentication failed: " . $response->body());
            }

            $authData = $response->json();

            // 3. 設定Laravel Session
            Auth::login($user);
            Session::put('go_jwt_token', $authData['access_token']);
            Session::put('go_company_id', $authData['company_id']);
            Session::put('go_rls_active', $authData['rls_active']);

            // 4. 記錄成功
            Log::info('SimpleGoJWT authentication successful', [
                'user_id' => $user->id,
                'company_id' => $companyId,
                'rls_active' => $authData['rls_active']
            ]);

            return [
                'success' => true,
                'access_token' => $authData['access_token'],
                'company_id' => $authData['company_id'],
                'rls_active' => $authData['rls_active'],
                'expires_in' => $authData['expires_in'],
            ];

        } catch (\Exception $e) {
            Log::error('SimpleGoJWT authentication failed', [
                'user_id' => $user->id,
                'error' => $e->getMessage()
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * 刷新JWT Token
     */
    public function refreshToken(): array
    {
        try {
            $user = Auth::user();
            if (!$user) {
                throw new \Exception('User not authenticated');
            }

            $companyId = Session::get('go_company_id', $this->getUserCompanyId($user));

            $response = Http::timeout($this->timeout)
                ->post("{$this->goApiUrl}/api/auth/simple-refresh", [
                    'user_id' => $user->id,
                    'company_id' => $companyId,
                    'email' => $user->email,
                ]);

            if (!$response->successful()) {
                throw new \Exception("Token refresh failed: " . $response->body());
            }

            $authData = $response->json();

            // 更新Session中的Token
            Session::put('go_jwt_token', $authData['access_token']);
            Session::put('go_rls_active', $authData['rls_active']);

            return [
                'success' => true,
                'access_token' => $authData['access_token'],
                'rls_active' => $authData['rls_active'],
            ];

        } catch (\Exception $e) {
            Log::error('Token refresh failed', ['error' => $e->getMessage()]);
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * 驗證RLS上下文狀態
     */
    public function verifyRLSContext(): array
    {
        try {
            $token = Session::get('go_jwt_token');
            if (!$token) {
                throw new \Exception('No JWT token found');
            }

            $response = Http::timeout($this->timeout)
                ->withHeaders([
                    'Authorization' => 'Bearer ' . $token,
                ])
                ->get("{$this->goApiUrl}/api/auth/verify-rls");

            if (!$response->successful()) {
                throw new \Exception("RLS verification failed: " . $response->body());
            }

            return [
                'success' => true,
                'rls_active' => $response->json('rls_active', false),
                'user_id' => $response->json('user_id'),
                'company_id' => $response->json('company_id'),
            ];

        } catch (\Exception $e) {
            Log::warning('RLS verification failed', ['error' => $e->getMessage()]);
            return [
                'success' => false,
                'rls_active' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * 登出並清除JWT和RLS上下文
     */
    public function logout(): array
    {
        try {
            $token = Session::get('go_jwt_token');
            if ($token) {
                // 調用Go Backend登出
                Http::timeout($this->timeout)
                    ->withHeaders([
                        'Authorization' => 'Bearer ' . $token,
                    ])
                    ->post("{$this->goApiUrl}/api/auth/simple-logout");
            }

            // 清除Laravel Session
            Session::forget(['go_jwt_token', 'go_company_id', 'go_rls_active']);
            Auth::logout();

            return ['success' => true];

        } catch (\Exception $e) {
            Log::error('Logout failed', ['error' => $e->getMessage()]);
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * 獲取當前JWT Token
     */
    public function getCurrentToken(): ?string
    {
        return Session::get('go_jwt_token');
    }

    /**
     * 檢查JWT Token是否存在
     */
    public function hasToken(): bool
    {
        return Session::has('go_jwt_token');
    }

    /**
     * 獲取用戶的公司ID
     */
    private function getUserCompanyId(User $user): int
    {
        // 簡化版：直接從用戶模型獲取
        if (isset($user->company_id)) {
            return $user->company_id;
        }

        // 備用方案：從第一個關聯的公司獲取
        if ($user->companies && $user->companies->isNotEmpty()) {
            return $user->companies->first()->id;
        }

        // 預設值
        return 1;
    }

    /**
     * 為API請求準備Bearer Token Header
     */
    public function getAuthHeaders(): array
    {
        $token = $this->getCurrentToken();
        if (!$token) {
            return [];
        }

        return [
            'Authorization' => 'Bearer ' . $token,
        ];
    }
}