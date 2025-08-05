<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use App\Services\SimpleGoJWTService;
use App\Models\User;

/**
 * 簡化的Go認證控制器
 * 處理Laravel-Go整合認證
 */
class SimpleGoAuthController extends Controller
{
    private SimpleGoJWTService $goJWTService;

    public function __construct(SimpleGoJWTService $goJWTService)
    {
        $this->goJWTService = $goJWTService;
    }

    /**
     * 整合認證端點
     * 當用戶登入Laravel後自動獲取Go JWT
     */
    public function integrateAuth(Request $request)
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'error' => 'User not authenticated'
                ], 401);
            }

            // 獲取Go JWT Token
            $result = $this->goJWTService->authenticateUser($user);

            if ($result['success']) {
                return response()->json([
                    'success' => true,
                    'message' => 'Go JWT authentication successful',
                    'rls_active' => $result['rls_active'],
                    'company_id' => $result['company_id'],
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'error' => $result['error']
                ], 500);
            }

        } catch (\Exception $e) {
            Log::error('Integration auth failed', [
                'error' => $e->getMessage(),
                'user_id' => Auth::id()
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Authentication integration failed'
            ], 500);
        }
    }

    /**
     * 刷新JWT Token
     */
    public function refreshToken(Request $request)
    {
        try {
            $result = $this->goJWTService->refreshToken();

            return response()->json($result);

        } catch (\Exception $e) {
            Log::error('Token refresh failed', ['error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'error' => 'Token refresh failed'
            ], 500);
        }
    }

    /**
     * 驗證RLS狀態
     */
    public function verifyRLS(Request $request)
    {
        try {
            $result = $this->goJWTService->verifyRLSContext();

            return response()->json($result);

        } catch (\Exception $e) {
            Log::error('RLS verification failed', ['error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'error' => 'RLS verification failed'
            ], 500);
        }
    }

    /**
     * 獲取認證狀態
     */
    public function status(Request $request)
    {
        $user = Auth::user();
        $hasJWT = $this->goJWTService->hasToken();
        $rlsStatus = $hasJWT ? $this->goJWTService->verifyRLSContext() : ['rls_active' => false];

        return response()->json([
            'laravel_authenticated' => Auth::check(),
            'user_id' => $user?->id,
            'jwt_available' => $hasJWT,
            'rls_active' => $rlsStatus['rls_active'] ?? false,
            'go_backend_available' => $this->checkGoBackendHealth(),
        ]);
    }

    /**
     * 整合登出
     */
    public function integrateLogout(Request $request)
    {
        try {
            $result = $this->goJWTService->logout();

            return response()->json([
                'success' => true,
                'message' => 'Logout successful'
            ]);

        } catch (\Exception $e) {
            Log::error('Integration logout failed', ['error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'error' => 'Logout failed'
            ], 500);
        }
    }

    /**
     * 檢查Go Backend健康狀態
     */
    private function checkGoBackendHealth(): bool
    {
        try {
            $goApiUrl = config('go_backend.base_url', 'http://localhost:8082');
            $response = \Http::timeout(5)->get("{$goApiUrl}/health");
            return $response->successful();
        } catch (\Exception $e) {
            return false;
        }
    }
}