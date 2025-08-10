<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use App\Services\SuperAdminService;

/**
 * 超級管理員控制器
 * 
 * 功能：
 * 1. 啟用/停用超級管理員模式的 Web 界面
 * 2. 顯示存取監控面板
 * 3. 提供系統級資料存取界面
 * 
 * 安全等級：CRITICAL
 * 存取限制：僅限超級管理員角色
 */
class SuperAdminController extends Controller
{
    private SuperAdminService $superAdminService;

    public function __construct(SuperAdminService $superAdminService)
    {
        $this->superAdminService = $superAdminService;
        
        // 確保只有超級管理員可以存取
        $this->middleware(function ($request, $next) {
            $user = Auth::user();
            if (!$user || !$this->superAdminService->isSuperAdmin($user)) {
                abort(403, '存取被拒：需要超級管理員權限');
            }
            return $next($request);
        });
    }

    /**
     * 顯示超級管理員控制面板
     */
    public function dashboard(Request $request)
    {
        $user = Auth::user();
        
        // 獲取當前狀態
        $isModeEnabled = $this->superAdminService->isSuperAdminModeEnabled($user);
        
        // 獲取存取統計
        $statistics = $this->superAdminService->getAccessStatistics();
        
        // 獲取最近的存取記錄
        $recentAccess = $this->superAdminService->getAccessMonitor(10);
        
        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email
            ],
            'superadmin_mode_enabled' => $isModeEnabled,
            'statistics' => $statistics,
            'recent_access' => $recentAccess,
            'timestamp' => now()->toISOString()
        ]);
    }

    /**
     * 啟用超級管理員模式
     */
    public function enableMode(Request $request)
    {
        $user = Auth::user();
        
        $request->validate([
            'reason' => 'required|string|min:3|max:255',
        ], [
            'reason.required' => '必須提供存取原因',
            'reason.min' => '存取原因至少需要 3 個字元',
            'reason.max' => '存取原因不能超過 255 個字元'
        ]);

        $reason = $request->input('reason');
        $clientIp = $request->ip();

        // 啟用超級管理員模式
        $success = $this->superAdminService->enableSuperAdminMode($user, $reason, $clientIp);

        if ($success) {
            return response()->json([
                'message' => '超級管理員模式已啟用',
                'user_id' => $user->id,
                'reason' => $reason,
                'enabled_at' => now()->toISOString(),
                'expires_at' => now()->addMinutes(30)->toISOString(),
                'warning' => '⚠️ 您現在可以存取所有資料，請謹慎操作'
            ]);
        } else {
            return response()->json([
                'error' => '無法啟用超級管理員模式',
                'message' => '請檢查您的權限或聯繫系統管理員'
            ], 403);
        }
    }

    /**
     * 停用超級管理員模式
     */
    public function disableMode(Request $request)
    {
        $user = Auth::user();
        
        // 停用超級管理員模式
        $success = $this->superAdminService->disableSuperAdminMode($user);

        if ($success) {
            return response()->json([
                'message' => '超級管理員模式已停用',
                'user_id' => $user->id,
                'disabled_at' => now()->toISOString()
            ]);
        } else {
            return response()->json([
                'error' => '無法停用超級管理員模式',
                'message' => '請聯繫系統管理員'
            ], 500);
        }
    }

    /**
     * 獲取存取監控資料
     */
    public function getAccessMonitor(Request $request)
    {
        $limit = $request->input('limit', 50);
        $monitors = $this->superAdminService->getAccessMonitor($limit);

        return response()->json([
            'access_monitors' => $monitors,
            'total_records' => count($monitors),
            'limit' => $limit,
            'generated_at' => now()->toISOString()
        ]);
    }

    /**
     * 獲取存取統計
     */
    public function getStatistics(Request $request)
    {
        $statistics = $this->superAdminService->getAccessStatistics();

        return response()->json($statistics);
    }

    /**
     * 系統級資料查看（範例）
     */
    public function viewSystemData(Request $request)
    {
        $user = Auth::user();
        
        // 檢查是否啟用超級管理員模式
        if (!$this->superAdminService->isSuperAdminModeEnabled($user)) {
            return response()->json([
                'error' => '需要啟用超級管理員模式',
                'message' => '請先啟用超級管理員模式再存取系統資料'
            ], 403);
        }

        $dataType = $request->input('type', 'overview');

        try {
            $result = $this->superAdminService->executeAsSuperAdmin($user, function () use ($dataType) {
                return match ($dataType) {
                    'companies' => $this->getCompaniesData(),
                    'users' => $this->getUsersData(),
                    'products' => $this->getProductsData(),
                    'orders' => $this->getOrdersData(),
                    default => $this->getOverviewData()
                };
            }, "查看系統資料：{$dataType}");

            return response()->json([
                'data_type' => $dataType,
                'data' => $result,
                'accessed_at' => now()->toISOString()
            ]);

        } catch (\Exception $e) {
            Log::error('系統資料存取失敗', [
                'user_id' => $user->id,
                'data_type' => $dataType,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'error' => '資料存取失敗',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * 獲取公司資料（超級管理員模式）
     */
    private function getCompaniesData(): array
    {
        $companies = \DB::table('companies')
            ->select(['id', 'name', 'email', 'status', 'created_at'])
            ->orderBy('created_at', 'desc')
            ->limit(100)
            ->get();

        return [
            'total_companies' => \DB::table('companies')->count(),
            'companies' => $companies->toArray()
        ];
    }

    /**
     * 獲取用戶資料（超級管理員模式）
     */
    private function getUsersData(): array
    {
        $users = \DB::table('users')
            ->select(['id', 'name', 'email', 'status', 'created_at'])
            ->orderBy('created_at', 'desc')
            ->limit(100)
            ->get();

        return [
            'total_users' => \DB::table('users')->count(),
            'users' => $users->toArray()
        ];
    }

    /**
     * 獲取產品資料（超級管理員模式）
     */
    private function getProductsData(): array
    {
        $products = \DB::table('products')
            ->select(['id', 'name', 'sku', 'company_id', 'is_active', 'created_at'])
            ->orderBy('created_at', 'desc')
            ->limit(100)
            ->get();

        return [
            'total_products' => \DB::table('products')->count(),
            'products' => $products->toArray()
        ];
    }

    /**
     * 獲取訂單資料（超級管理員模式）
     */
    private function getOrdersData(): array
    {
        $orders = \DB::table('sales_orders')
            ->select(['id', 'order_number', 'company_id', 'customer_id', 'status', 'total_amount', 'created_at'])
            ->orderBy('created_at', 'desc')
            ->limit(100)
            ->get();

        return [
            'total_orders' => \DB::table('sales_orders')->count(),
            'orders' => $orders->toArray()
        ];
    }

    /**
     * 獲取系統概覽資料（超級管理員模式）
     */
    private function getOverviewData(): array
    {
        return [
            'system_statistics' => [
                'total_companies' => \DB::table('companies')->count(),
                'active_companies' => \DB::table('companies')->where('status', 'active')->count(),
                'total_users' => \DB::table('users')->count(),
                'active_users' => \DB::table('users')->where('status', 'active')->count(),
                'total_products' => \DB::table('products')->count(),
                'active_products' => \DB::table('products')->where('is_active', true)->count(),
                'total_orders' => \DB::table('sales_orders')->count(),
                'completed_orders' => \DB::table('sales_orders')->where('status', 'completed')->count(),
            ],
            'database_info' => [
                'connection' => config('database.default'),
                'host' => config('database.connections.pgsql.host'),
                'database' => config('database.connections.pgsql.database'),
                'username' => config('database.connections.pgsql.username')
            ],
            'generated_at' => now()->toISOString()
        ];
    }
}