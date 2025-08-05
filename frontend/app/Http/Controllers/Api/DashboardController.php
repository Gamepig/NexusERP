<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\InventoryLevel;
use App\Models\Product;
use App\Models\SalesOrder;
use App\Models\Supplier;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

/**
 * Dashboard API 控制器
 * 
 * 提供儀表板所需的統計資料和 KPI 指標
 */
class DashboardController extends Controller
{
    /**
     * 儀表板主要 API 端點 - P1.3 增強版
     */
    public function index(Request $request): JsonResponse
    {
        try {
            // 獲取緩存的儀表板數據
            $dashboardData = Cache::remember('dashboard_data', 300, function () {
                return $this->buildDashboardData();
            });
            
            return response()->json([
                'success' => true,
                'message' => '儀表板資料載入成功',
                'statistics' => $dashboardData['statistics'],
                'charts' => $dashboardData['charts'],
                'quickActions' => $dashboardData['quickActions'],
                'timestamp' => now()->toISOString(),
            ]);
            
        } catch (\Exception $e) {
            Log::error('Dashboard index error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => '儀表板載入失敗',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * 獲取儀表板統計資料
     */
    public function getStats(Request $request): JsonResponse
    {
        try {
            // 低庫存統計
            $lowStockCount = InventoryLevel::lowStock()->count();
            
            // 缺貨統計
            $outOfStockCount = InventoryLevel::outOfStock()->count();
            
            // 總庫存價值（使用 selling_price 欄位）
            $totalInventoryValue = InventoryLevel::join('products', 'inventory_levels.product_id', '=', 'products.id')
                ->selectRaw('SUM(inventory_levels.quantity_available * products.selling_price) as total_value')
                ->value('total_value') ?? 0;
            
            // 基本統計
            $totalProducts = Product::count();
            $totalCustomers = Customer::count();
            $totalSuppliers = Supplier::count();
            
            $stats = [
                'inventory' => [
                    'total_value' => (float) $totalInventoryValue,
                    'low_stock_count' => $lowStockCount,
                    'out_of_stock_count' => $outOfStockCount,
                    'total_products' => $totalProducts,
                ],
                'overview' => [
                    'total_customers' => $totalCustomers,
                    'total_suppliers' => $totalSuppliers,
                    'total_products' => $totalProducts,
                ],
                'alerts' => [
                    'low_stock_items' => $lowStockCount,
                    'out_of_stock_items' => $outOfStockCount,
                ],
                'generated_at' => now()->toISOString(),
            ];

            return response()->json([
                'success' => true,
                'data' => $stats,
                'message' => '儀表板統計資料獲取成功',
            ]);

        } catch (\Exception $e) {
            Log::error('Dashboard stats error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => '獲取儀表板統計資料失敗',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * 獲取低庫存產品清單
     */
    public function getLowStockItems(Request $request): JsonResponse
    {
        try {
            $lowStockItems = InventoryLevel::lowStock()
                ->with(['product'])
                ->limit(10)
                ->get()
                ->map(function ($item) {
                    return [
                        'product_id' => $item->product_id,
                        'product_name' => $item->product->name ?? 'Unknown Product',
                        'sku' => $item->product->sku ?? 'N/A',
                        'warehouse_id' => $item->warehouse_id,
                        'current_stock' => $item->quantity_available,
                        'reorder_point' => $item->reorder_point,
                        'percentage' => $item->getAvailablePercentage(),
                        'is_out_of_stock' => $item->isOutOfStock(),
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => $lowStockItems,
                'message' => '低庫存產品清單獲取成功',
            ]);

        } catch (\Exception $e) {
            Log::error('Dashboard low stock items error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => '獲取低庫存產品清單失敗',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * 建構完整的儀表板數據 - P1.3 核心功能
     */
    private function buildDashboardData(): array
    {
        $startDate = Carbon::now()->subDays(30);
        $endDate = Carbon::now();
        $previousStartDate = Carbon::now()->subDays(60);
        $previousEndDate = Carbon::now()->subDays(30);

        // 統計數據
        $statistics = $this->buildStatistics($startDate, $endDate, $previousStartDate, $previousEndDate);
        
        // 圖表數據
        $charts = $this->buildChartsData($startDate, $endDate);
        
        // 快速操作
        $quickActions = $this->buildQuickActions();

        return [
            'statistics' => $statistics,
            'charts' => $charts,
            'quickActions' => $quickActions
        ];
    }

    /**
     * 建構統計數據
     */
    private function buildStatistics($startDate, $endDate, $previousStartDate, $previousEndDate): array
    {
        // 營收統計
        $currentRevenue = SalesOrder::whereBetween('order_date', [$startDate, $endDate])
            ->where('status', '!=', 'cancelled')
            ->sum('total_amount') ?? 0;
            
        $previousRevenue = SalesOrder::whereBetween('order_date', [$previousStartDate, $previousEndDate])
            ->where('status', '!=', 'cancelled')
            ->sum('total_amount') ?? 0;
            
        $revenueChange = $previousRevenue > 0 ? (($currentRevenue - $previousRevenue) / $previousRevenue) * 100 : 0;

        // 訂單統計
        $currentOrders = SalesOrder::whereBetween('order_date', [$startDate, $endDate])->count();
        $previousOrders = SalesOrder::whereBetween('order_date', [$previousStartDate, $previousEndDate])->count();
        $ordersChange = $previousOrders > 0 ? (($currentOrders - $previousOrders) / $previousOrders) * 100 : 0;

        // 客戶統計
        $totalCustomers = Customer::count();
        $newCustomers = Customer::whereBetween('created_at', [$startDate, $endDate])->count();
        $previousNewCustomers = Customer::whereBetween('created_at', [$previousStartDate, $previousEndDate])->count();
        $customersChange = $previousNewCustomers > 0 ? (($newCustomers - $previousNewCustomers) / $previousNewCustomers) * 100 : 0;

        // 待處理報價 (暫時使用草稿狀態的訂單作為報價)
        $pendingQuotes = SalesOrder::where('status', 'draft')->count();
        $previousPendingQuotes = SalesOrder::where('status', 'draft')
            ->where('created_at', '<', $startDate)
            ->count();
        $quotesChange = $previousPendingQuotes > 0 ? (($pendingQuotes - $previousPendingQuotes) / $previousPendingQuotes) * 100 : 0;

        // 低庫存警報
        $lowStockCount = InventoryLevel::lowStock()->count();
        $outOfStockCount = InventoryLevel::outOfStock()->count();
        $totalAlerts = $lowStockCount + $outOfStockCount;
        $alertsChange = 0; // 需要歷史數據來計算變化

        // 轉換率 (訂單數 / 客戶數 * 100)
        $conversionRate = $totalCustomers > 0 ? ($currentOrders / $totalCustomers) * 100 : 0;
        $previousConversionRate = $totalCustomers > 0 ? ($previousOrders / $totalCustomers) * 100 : 0;
        $conversionChange = $previousConversionRate > 0 ? $conversionRate - $previousConversionRate : 0;

        return [
            'totalRevenue' => [
                'value' => (float) $currentRevenue,
                'change' => round($revenueChange, 1),
                'trend' => $revenueChange > 0 ? 'up' : ($revenueChange < 0 ? 'down' : 'stable'),
                'description' => '過去30天營收'
            ],
            'totalOrders' => [
                'value' => $currentOrders,
                'change' => round($ordersChange, 1),
                'trend' => $ordersChange > 0 ? 'up' : ($ordersChange < 0 ? 'down' : 'stable'),
                'description' => '過去30天訂單數'
            ],
            'totalCustomers' => [
                'value' => $totalCustomers,
                'change' => round($customersChange, 1),
                'trend' => $customersChange > 0 ? 'up' : ($customersChange < 0 ? 'down' : 'stable'),
                'description' => '總客戶數量'
            ],
            'pendingQuotes' => [
                'value' => $pendingQuotes,
                'change' => round($quotesChange, 1),
                'trend' => $quotesChange > 0 ? 'up' : ($quotesChange < 0 ? 'down' : 'stable'),
                'description' => '待處理報價'
            ],
            'lowStockAlerts' => [
                'value' => $totalAlerts,
                'change' => round($alertsChange, 1),
                'trend' => $alertsChange > 0 ? 'up' : ($alertsChange < 0 ? 'down' : 'stable'),
                'description' => '庫存警報數量'
            ],
            'conversionRate' => [
                'value' => round($conversionRate, 1),
                'change' => round($conversionChange, 2),
                'trend' => $conversionChange > 0 ? 'up' : ($conversionChange < 0 ? 'down' : 'stable'),
                'description' => '客戶轉換率'
            ]
        ];
    }

    /**
     * 建構圖表數據
     */
    private function buildChartsData($startDate, $endDate): array
    {
        // 營收趨勢圖表 (過去7天)
        $revenueData = [];
        $revenueLabels = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = Carbon::now()->subDays($i);
            $dateStr = $date->format('Y-m-d');
            $revenue = SalesOrder::whereDate('order_date', $date)
                ->where('status', '!=', 'cancelled')
                ->sum('total_amount') ?? 0;
            
            $revenueLabels[] = $date->format('m/d');
            $revenueData[] = (float) $revenue;
        }

        // 訂單狀態分布
        $orderStatuses = SalesOrder::select('status', DB::raw('count(*) as count'))
            ->whereBetween('order_date', [$startDate, $endDate])
            ->groupBy('status')
            ->get();

        $statusLabels = [];
        $statusData = [];
        foreach ($orderStatuses as $status) {
            $statusLabels[] = ucfirst($status->status);
            $statusData[] = $status->count;
        }

        // 庫存水準圖表 (前10個產品)
        $inventoryData = InventoryLevel::with('product')
            ->select('product_id', DB::raw('SUM(quantity_available) as total_quantity'))
            ->groupBy('product_id')
            ->orderByDesc('total_quantity')
            ->limit(10)
            ->get();

        $inventoryLabels = [];
        $inventoryValues = [];
        foreach ($inventoryData as $item) {
            $inventoryLabels[] = $item->product->name ?? 'Unknown';
            $inventoryValues[] = $item->total_quantity;
        }

        // 月度業績目標達成率 (假設月目標為1,000,000)
        $monthlyTarget = 1000000; // NT$1,000,000
        $currentMonthRevenue = SalesOrder::whereMonth('order_date', Carbon::now()->month)
            ->whereYear('order_date', Carbon::now()->year)
            ->where('status', '!=', 'cancelled')
            ->sum('total_amount') ?? 0;
        
        $achievementPercentage = $monthlyTarget > 0 ? ($currentMonthRevenue / $monthlyTarget) * 100 : 0;
        $remainingPercentage = max(0, 100 - $achievementPercentage);
        
        Log::info('Performance chart data:', [
            'monthlyTarget' => $monthlyTarget,
            'currentMonthRevenue' => $currentMonthRevenue,
            'achievementPercentage' => $achievementPercentage,
            'remainingPercentage' => $remainingPercentage
        ]);

        return [
            'revenue' => [
                'labels' => $revenueLabels,
                'values' => $revenueData
            ],
            'orders' => [
                'labels' => $statusLabels,
                'values' => $statusData
            ],
            'inventory' => [
                'labels' => $inventoryLabels,
                'values' => $inventoryValues
            ],
            'performance' => [
                'labels' => ['已達成', '剩餘目標'],
                'values' => [round($achievementPercentage, 1), round($remainingPercentage, 1)],
                'target' => $monthlyTarget,
                'achieved' => $currentMonthRevenue
            ]
        ];
    }

    /**
     * 建構快速操作
     */
    private function buildQuickActions(): array
    {
        return [
            [
                'title' => '新增客戶',
                'subtitle' => '建立新客戶資料',
                'icon' => 'user-plus',
                'url' => '/customers/create',
                'iconColor' => 'var(--nexus-accent-blue)',
                'iconBg' => 'rgba(59, 130, 246, 0.1)'
            ],
            [
                'title' => '建立訂單',
                'subtitle' => '新增銷售訂單',
                'icon' => 'plus-circle',
                'url' => '/sales-orders/create',
                'iconColor' => 'var(--nexus-accent-green)',
                'iconBg' => 'rgba(16, 185, 129, 0.1)'
            ],
            [
                'title' => '產品管理',
                'subtitle' => '管理產品資料',
                'icon' => 'cube',
                'url' => '/products',
                'iconColor' => 'var(--nexus-accent-purple)',
                'iconBg' => 'rgba(139, 92, 246, 0.1)'
            ],
            [
                'title' => '庫存查看',
                'subtitle' => '檢視庫存狀況',
                'icon' => 'archive',
                'url' => '/inventory',
                'iconColor' => 'var(--nexus-accent-orange)',
                'iconBg' => 'rgba(245, 158, 11, 0.1)',
                'badge' => $this->getInventoryAlertCount()
            ]
        ];
    }

    /**
     * 獲取庫存警報數量
     */
    private function getInventoryAlertCount(): ?int
    {
        $alertCount = InventoryLevel::lowStock()->count() + InventoryLevel::outOfStock()->count();
        return $alertCount > 0 ? $alertCount : null;
    }

    /**
     * 實時更新端點
     */
    public function realtime(Request $request): JsonResponse
    {
        try {
            // 清除緩存以獲取最新數據
            Cache::forget('dashboard_data');
            
            // 獲取最新數據
            $dashboardData = $this->buildDashboardData();
            
            return response()->json([
                'success' => true,
                'type' => 'dashboard_update',
                'payload' => $dashboardData,
                'timestamp' => now()->toISOString(),
            ]);
            
        } catch (\Exception $e) {
            Log::error('Dashboard realtime error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => '實時更新失敗',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * 獲取圖表數據端點
     */
    public function getChartData(Request $request): JsonResponse
    {
        try {
            $type = $request->get('type', 'revenue');
            $startDate = Carbon::now()->subDays(30);
            $endDate = Carbon::now();
            
            $chartsData = $this->buildChartsData($startDate, $endDate);
            
            if (!isset($chartsData[$type])) {
                return response()->json([
                    'success' => false,
                    'message' => '未知的圖表類型',
                ], 400);
            }
            
            return response()->json([
                'success' => true,
                'data' => $chartsData[$type],
                'timestamp' => now()->toISOString(),
            ]);
            
        } catch (\Exception $e) {
            Log::error('Dashboard chart data error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => '獲取圖表數據失敗',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}