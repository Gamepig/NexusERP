<?php

namespace App\Services;

use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

/**
 * 報表 API 服務類別
 * 專門處理與 Go 後端報表相關的 API 通訊
 */
class ReportApiService extends BaseApiService
{
    /**
     * 快取過期時間（分鐘）
     */
    protected array $cacheExpiration = [
        'sales' => 30,      // 銷售報表快取 30 分鐘
        'inventory' => 15,  // 庫存報表快取 15 分鐘
        'financial' => 30,  // 財務報表快取 30 分鐘
        'purchase' => 30,   // 採購報表快取 30 分鐘
        'dashboard' => 10,  // 儀表板快取 10 分鐘
    ];

    /**
     * 獲取銷售報表
     * 
     * @param Carbon|null $dateFrom 開始日期
     * @param Carbon|null $dateTo 結束日期
     * @param array $filters 篩選條件
     * @param bool $useCache 是否使用快取
     * @return array 報表資料
     */
    public function getSalesReport(
        ?Carbon $dateFrom = null, 
        ?Carbon $dateTo = null, 
        array $filters = [],
        bool $useCache = true
    ): array {
        $params = $this->buildReportParams('sales', $dateFrom, $dateTo, $filters);
        $cacheKey = $this->generateCacheKey('sales_report', $params);

        if ($useCache) {
            return Cache::remember($cacheKey, $this->cacheExpiration['sales'] * 60, function () use ($params) {
                return $this->fetchSalesReport($params);
            });
        }

        return $this->fetchSalesReport($params);
    }

    /**
     * 獲取庫存報表
     */
    public function getInventoryReport(array $filters = [], bool $useCache = true): array
    {
        $params = $this->buildInventoryParams($filters);
        $cacheKey = $this->generateCacheKey('inventory_report', $params);

        if ($useCache) {
            return Cache::remember($cacheKey, $this->cacheExpiration['inventory'] * 60, function () use ($params) {
                return $this->fetchInventoryReport($params);
            });
        }

        return $this->fetchInventoryReport($params);
    }

    /**
     * 獲取財務報表
     */
    public function getFinancialReport(
        ?Carbon $dateFrom = null, 
        ?Carbon $dateTo = null, 
        array $filters = [],
        bool $useCache = true
    ): array {
        $params = $this->buildReportParams('financial', $dateFrom, $dateTo, $filters);
        $cacheKey = $this->generateCacheKey('financial_report', $params);

        if ($useCache) {
            return Cache::remember($cacheKey, $this->cacheExpiration['financial'] * 60, function () use ($params) {
                return $this->fetchFinancialReport($params);
            });
        }

        return $this->fetchFinancialReport($params);
    }

    /**
     * 獲取採購報表
     */
    public function getPurchaseReport(
        ?Carbon $dateFrom = null, 
        ?Carbon $dateTo = null, 
        array $filters = [],
        bool $useCache = true
    ): array {
        $params = $this->buildReportParams('purchase', $dateFrom, $dateTo, $filters);
        $cacheKey = $this->generateCacheKey('purchase_report', $params);

        if ($useCache) {
            return Cache::remember($cacheKey, $this->cacheExpiration['purchase'] * 60, function () use ($params) {
                return $this->fetchPurchaseReport($params);
            });
        }

        return $this->fetchPurchaseReport($params);
    }

    /**
     * 獲取儀表板資料
     */
    public function getDashboardData(array $filters = [], bool $useCache = true): array
    {
        $params = $this->buildDashboardParams($filters);
        $cacheKey = $this->generateCacheKey('dashboard_data', $params);

        if ($useCache) {
            return Cache::remember($cacheKey, $this->cacheExpiration['dashboard'] * 60, function () use ($params) {
                return $this->fetchDashboardData($params);
            });
        }

        return $this->fetchDashboardData($params);
    }

    /**
     * 匯出報表
     */
    public function exportReport(
        string $reportType, 
        string $format, 
        ?Carbon $dateFrom = null, 
        ?Carbon $dateTo = null, 
        array $filters = []
    ): array {
        $params = $this->buildReportParams($reportType, $dateFrom, $dateTo, $filters);
        $params['format'] = $format;

        return $this->makeRequest('GET', "/api/reports/{$reportType}/export", $params);
    }

    /**
     * 清除特定報表類型的快取
     */
    public function clearReportCache(string $reportType = null): bool
    {
        if ($reportType) {
            return $this->clearCache("{$reportType}_report");
        }
        
        return $this->clearCache();
    }

    /**
     * 實際獲取銷售報表資料
     */
    private function fetchSalesReport(array $params): array
    {
        try {
            Log::info('Fetching sales report', ['params' => $params]);
            
            $response = $this->makeRequest('GET', '/api/reports/sales', $params);
            
            // 確保回應格式正確
            return $this->formatReportResponse($response, 'sales');
            
        } catch (\Exception $e) {
            Log::error('Failed to fetch sales report', [
                'params' => $params,
                'error' => $e->getMessage()
            ]);
            
            // 回傳預設的空報表格式
            return $this->getEmptyReportResponse('sales');
        }
    }

    /**
     * 實際獲取庫存報表資料
     */
    private function fetchInventoryReport(array $params): array
    {
        try {
            Log::info('Fetching inventory report', ['params' => $params]);
            
            $response = $this->makeRequest('GET', '/api/reports/inventory', $params);
            
            return $this->formatReportResponse($response, 'inventory');
            
        } catch (\Exception $e) {
            Log::error('Failed to fetch inventory report', [
                'params' => $params,
                'error' => $e->getMessage()
            ]);
            
            return $this->getEmptyReportResponse('inventory');
        }
    }

    /**
     * 實際獲取財務報表資料
     */
    private function fetchFinancialReport(array $params): array
    {
        try {
            Log::info('Fetching financial report', ['params' => $params]);
            
            $response = $this->makeRequest('GET', '/api/reports/financial', $params);
            
            return $this->formatReportResponse($response, 'financial');
            
        } catch (\Exception $e) {
            Log::error('Failed to fetch financial report', [
                'params' => $params,
                'error' => $e->getMessage()
            ]);
            
            return $this->getEmptyReportResponse('financial');
        }
    }

    /**
     * 實際獲取採購報表資料
     */
    private function fetchPurchaseReport(array $params): array
    {
        try {
            Log::info('Fetching purchase report', ['params' => $params]);
            
            $response = $this->makeRequest('GET', '/api/reports/purchase', $params);
            
            return $this->formatReportResponse($response, 'purchase');
            
        } catch (\Exception $e) {
            Log::error('Failed to fetch purchase report', [
                'params' => $params,
                'error' => $e->getMessage()
            ]);
            
            return $this->getEmptyReportResponse('purchase');
        }
    }

    /**
     * 實際獲取儀表板資料
     */
    private function fetchDashboardData(array $params): array
    {
        try {
            Log::info('Fetching dashboard data', ['params' => $params]);
            
            $response = $this->makeRequest('GET', '/api/dashboard', $params);
            
            return $this->formatDashboardResponse($response);
            
        } catch (\Exception $e) {
            Log::error('Failed to fetch dashboard data', [
                'params' => $params,
                'error' => $e->getMessage()
            ]);
            
            return $this->getEmptyDashboardResponse();
        }
    }

    /**
     * 建立報表參數
     */
    private function buildReportParams(
        string $reportType, 
        ?Carbon $dateFrom, 
        ?Carbon $dateTo, 
        array $filters
    ): array {
        $params = [
            'report_type' => $reportType,
            'use_cache' => true,
        ];

        if ($dateFrom) {
            $params['date_from'] = $dateFrom->format('Y-m-d');
        }

        if ($dateTo) {
            $params['date_to'] = $dateTo->format('Y-m-d');
        }

        // 過濾空值
        foreach ($filters as $key => $value) {
            if (!empty($value)) {
                $params[$key] = $value;
            }
        }

        return $params;
    }

    /**
     * 建立庫存參數
     */
    private function buildInventoryParams(array $filters): array
    {
        $params = ['use_cache' => true];

        foreach ($filters as $key => $value) {
            if (!empty($value)) {
                $params[$key] = $value;
            }
        }

        return $params;
    }

    /**
     * 建立儀表板參數
     */
    private function buildDashboardParams(array $filters): array
    {
        $params = ['use_cache' => true];

        foreach ($filters as $key => $value) {
            if (!empty($value)) {
                $params[$key] = $value;
            }
        }

        return $params;
    }

    /**
     * 格式化報表回應
     */
    private function formatReportResponse(array $response, string $reportType): array
    {
        return [
            'report_type' => $reportType,
            'generated_at' => $response['generated_at'] ?? now()->toISOString(),
            'summary' => $response['summary'] ?? [],
            'data' => $response['data'] ?? [],
            'metadata' => $response['metadata'] ?? [],
            'pagination' => $response['pagination'] ?? null,
        ];
    }

    /**
     * 格式化儀表板回應
     */
    private function formatDashboardResponse(array $response): array
    {
        return [
            'generated_at' => $response['generated_at'] ?? now()->toISOString(),
            'summary' => $response['summary'] ?? [],
            'charts' => $response['charts'] ?? [],
            'widgets' => $response['widgets'] ?? [],
            'alerts' => $response['alerts'] ?? [],
        ];
    }

    /**
     * 取得空的報表回應格式
     */
    private function getEmptyReportResponse(string $reportType): array
    {
        return [
            'report_type' => $reportType,
            'generated_at' => now()->toISOString(),
            'summary' => $this->getEmptySummary($reportType),
            'data' => [],
            'metadata' => [
                'total_records' => 0,
                'filtered_records' => 0,
                'date_range' => null,
            ],
            'pagination' => null,
            'error' => '無法載入報表資料，請稍後再試',
        ];
    }

    /**
     * 取得空的儀表板回應格式
     */
    private function getEmptyDashboardResponse(): array
    {
        return [
            'generated_at' => now()->toISOString(),
            'summary' => [],
            'charts' => [],
            'widgets' => [],
            'alerts' => [
                [
                    'type' => 'warning',
                    'message' => '無法載入儀表板資料，請檢查網路連線',
                    'timestamp' => now()->toISOString(),
                ]
            ],
        ];
    }

    /**
     * 取得空的摘要資料
     */
    private function getEmptySummary(string $reportType): array
    {
        return match ($reportType) {
            'sales' => [
                'total_sales' => 0,
                'order_count' => 0,
                'average_order_size' => 0,
                'sales_by_month' => [],
                'top_customers' => [],
            ],
            'inventory' => [
                'total_products' => 0,
                'total_value' => 0,
                'low_stock_count' => 0,
                'out_of_stock_count' => 0,
            ],
            'financial' => [
                'total_revenue' => 0,
                'total_expenses' => 0,
                'net_profit' => 0,
                'accounts_receivable' => 0,
                'accounts_payable' => 0,
            ],
            'purchase' => [
                'total_purchases' => 0,
                'purchase_count' => 0,
                'average_purchase_size' => 0,
                'top_suppliers' => [],
            ],
            default => [],
        };
    }
}