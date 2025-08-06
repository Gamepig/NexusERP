# NexusERP 報表系統實作規劃書

## 📋 規劃概述

**規劃日期**: 2025-07-27  
**實作範圍**: 顏色主題修復 + 真實資料庫整合  
**預估工期**: 2-3 週  
**優先級**: 高 (影響用戶體驗與系統實用性)

## 🎯 實作目標

### 主要目標
1. **完全修復顏色主題問題**: 所有 UI 元素都符合 NexusERP 深色主題
2. **實現真實資料庫整合**: 所有報表顯示真實業務資料
3. **建立高效 API 連接**: Laravel 前端與 Go 後端無縫整合
4. **確保資料一致性**: 同一用戶/公司資料完全隔離

### 成功指標
- ✅ 零白色背景問題 (視覺一致性 100%)
- ✅ 所有報表顯示真實資料 (業務實用性 100%)
- ✅ API 響應時間 < 500ms (效能要求)
- ✅ 用戶資料完全隔離 (安全性要求)

## 📅 實作時程規劃

### 第一週：基礎架構建立

#### Day 1-2: 資料庫結構完善
```sql
-- 優先任務：建立缺少的資料表
1. 建立 accounts_receivable 資料表
2. 建立 accounts_payable 資料表  
3. 建立 inventory_movements 資料表
4. 建立必要的索引和約束
5. 生成測試資料
```

#### Day 3-4: Go 後端 API 開發
```go
// 優先任務：實作完整報表 API
1. 實作 /api/reports/sales 端點
2. 實作 /api/reports/inventory 端點
3. 實作 /api/reports/financial 端點
4. 實作 /api/reports/purchase 端點
5. 新增認證中介軟體
```

#### Day 5-7: Laravel API 服務層
```php
// 優先任務：建立 API 連接層
1. 建立 ReportApiService 類別
2. 實作 HTTP 客戶端封裝
3. 新增錯誤處理機制
4. 實作快取策略
5. 新增認證 token 管理
```

### 第二週：功能實作與主題修復

#### Day 8-10: 真實資料整合
```php
// 優先任務：報表控制器重構
1. 修改所有報表控制器使用 API
2. 實作資料篩選邏輯
3. 新增分頁功能
4. 實作匯出功能
5. 新增錯誤處理頁面
```

#### Day 11-12: 顏色主題深度修復
```css
/* 優先任務：動態內容主題修復 */
1. Chart.js 深色主題配置
2. 表單元件樣式修復
3. 模態視窗主題統一
4. 第三方插件主題客製化
5. 響應式主題問題修復
```

#### Day 13-14: 效能優化與測試
```bash
# 優先任務：系統優化
1. 資料庫查詢優化
2. API 回應快取實作
3. 前端資料載入優化
4. 自動化測試建立
5. 效能基準測試
```

### 第三週：整合測試與部署

#### Day 15-17: 整合測試
- 端到端功能測試
- 效能壓力測試
- 安全性測試
- 瀏覽器兼容性測試
- 行動裝置響應式測試

#### Day 18-19: 使用者驗收測試
- 內部測試與回饋
- 修復發現的問題
- 使用者介面優化
- 文件更新

#### Day 20-21: 生產環境部署
- 資料庫遷移腳本
- 後端服務部署
- 前端程式碼部署
- 監控與日誌設定

## 🔧 技術實作詳情

### 1. 資料庫結構建立

#### A. 應收帳款資料表
```sql
-- accounts_receivable 資料表
CREATE TABLE accounts_receivable (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number VARCHAR(50) NOT NULL UNIQUE,
    customer_id UUID NOT NULL,
    sales_order_id UUID,
    original_amount DECIMAL(12,2) NOT NULL,
    outstanding_amount DECIMAL(12,2) NOT NULL,
    paid_amount DECIMAL(12,2) DEFAULT 0,
    due_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'paid', 'overdue', 'written_off')),
    payment_terms INTEGER DEFAULT 30,
    created_by UUID NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (sales_order_id) REFERENCES sales_orders(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- 索引建立
CREATE INDEX idx_ar_customer_status ON accounts_receivable(customer_id, status);
CREATE INDEX idx_ar_due_date ON accounts_receivable(due_date);
CREATE INDEX idx_ar_created_by ON accounts_receivable(created_by);
```

#### B. 應付帳款資料表
```sql
-- accounts_payable 資料表  
CREATE TABLE accounts_payable (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number VARCHAR(50) NOT NULL UNIQUE,
    supplier_id UUID NOT NULL,
    purchase_order_id UUID,
    original_amount DECIMAL(12,2) NOT NULL,
    outstanding_amount DECIMAL(12,2) NOT NULL,
    paid_amount DECIMAL(12,2) DEFAULT 0,
    due_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'paid', 'overdue')),
    payment_terms INTEGER DEFAULT 30,
    created_by UUID NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE,
    FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- 索引建立
CREATE INDEX idx_ap_supplier_status ON accounts_payable(supplier_id, status);
CREATE INDEX idx_ap_due_date ON accounts_payable(due_date);
CREATE INDEX idx_ap_created_by ON accounts_payable(created_by);
```

#### C. 庫存異動記錄資料表
```sql
-- inventory_movements 資料表
CREATE TABLE inventory_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL,
    warehouse_id UUID NOT NULL,
    movement_type VARCHAR(20) NOT NULL CHECK (movement_type IN ('in', 'out', 'adjustment', 'transfer')),
    quantity INTEGER NOT NULL,
    reference_type VARCHAR(50), -- 'sales_order', 'purchase_order', 'adjustment', 'transfer'
    reference_id UUID,
    cost_per_unit DECIMAL(12,2),
    total_cost DECIMAL(12,2),
    notes TEXT,
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- 索引建立
CREATE INDEX idx_inv_movements_product_date ON inventory_movements(product_id, created_at);
CREATE INDEX idx_inv_movements_warehouse_date ON inventory_movements(warehouse_id, created_at);
CREATE INDEX idx_inv_movements_created_by ON inventory_movements(created_by);
```

### 2. Go 後端 API 實作

#### A. 報表路由設定
```go
// cmd/api/routes.go
func (app *application) routes() http.Handler {
    router := mux.NewRouter()
    
    // 報表 API 路由
    reports := router.PathPrefix("/api/reports").Subrouter()
    reports.Use(app.authenticate) // 認證中介軟體
    
    reports.HandleFunc("/sales", app.getSalesReport).Methods("GET")
    reports.HandleFunc("/inventory", app.getInventoryReport).Methods("GET")
    reports.HandleFunc("/financial", app.getFinancialReport).Methods("GET")
    reports.HandleFunc("/purchase", app.getPurchaseReport).Methods("GET")
    reports.HandleFunc("/dashboard", app.getDashboardData).Methods("GET")
    
    return router
}
```

#### B. 認證中介軟體
```go
// internal/middleware/auth.go
func (app *application) authenticate(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        // 從 Header 取得 token
        token := r.Header.Get("Authorization")
        if token == "" {
            app.errorResponse(w, r, http.StatusUnauthorized, "missing authorization token")
            return
        }
        
        // 驗證 JWT token 或 API key
        userID, err := app.validateToken(token)
        if err != nil {
            app.errorResponse(w, r, http.StatusUnauthorized, "invalid token")
            return
        }
        
        // 將用戶 ID 加入 context
        ctx := context.WithValue(r.Context(), "user_id", userID)
        next.ServeHTTP(w, r.WithContext(ctx))
    })
}
```

#### C. 報表處理器實作
```go
// cmd/api/reports.go
func (app *application) getSalesReport(w http.ResponseWriter, r *http.Request) {
    userID := r.Context().Value("user_id").(uuid.UUID)
    
    // 解析查詢參數
    req := models.ReportRequest{
        ReportType: "sales",
        UseCache:   true,
    }
    
    if dateFrom := r.URL.Query().Get("date_from"); dateFrom != "" {
        if parsed, err := time.Parse("2006-01-02", dateFrom); err == nil {
            req.DateFrom = &parsed
        }
    }
    
    if dateTo := r.URL.Query().Get("date_to"); dateTo != "" {
        if parsed, err := time.Parse("2006-01-02", dateTo); err == nil {
            req.DateTo = &parsed
        }
    }
    
    // 新增用戶過濾
    req.Parameters = map[string]interface{}{
        "user_id": userID.String(),
    }
    
    // 呼叫服務層
    report, err := app.services.Reports.GetSalesReport(req)
    if err != nil {
        app.serverErrorResponse(w, r, err)
        return
    }
    
    // 回傳 JSON 回應
    app.writeJSON(w, http.StatusOK, envelope{"report": report}, nil)
}
```

### 3. Laravel API 服務層實作

#### A. API 服務基礎類別
```php
// app/Services/BaseApiService.php
<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

abstract class BaseApiService
{
    protected string $baseUrl;
    protected int $timeout = 30;
    protected array $defaultHeaders = [];
    
    public function __construct()
    {
        $this->baseUrl = config('services.go_backend.url', 'http://localhost:8082');
        $this->defaultHeaders = [
            'Accept' => 'application/json',
            'Content-Type' => 'application/json',
        ];
    }
    
    protected function makeRequest(string $method, string $endpoint, array $data = [], array $headers = [])
    {
        $url = $this->baseUrl . $endpoint;
        $headers = array_merge($this->defaultHeaders, $headers, $this->getAuthHeaders());
        
        try {
            $response = Http::withHeaders($headers)
                ->timeout($this->timeout)
                ->$method($url, $data);
                
            if ($response->successful()) {
                return $response->json();
            }
            
            Log::error('API request failed', [
                'method' => $method,
                'url' => $url,
                'status' => $response->status(),
                'body' => $response->body()
            ]);
            
            throw new \Exception("API request failed: " . $response->body());
            
        } catch (\Exception $e) {
            Log::error('API request exception', [
                'method' => $method,
                'url' => $url,
                'error' => $e->getMessage()
            ]);
            
            throw $e;
        }
    }
    
    protected function getAuthHeaders(): array
    {
        $user = auth()->user();
        if (!$user) {
            return [];
        }
        
        // 生成或取得 JWT token
        $token = Cache::remember("api_token_{$user->id}", 3600, function () use ($user) {
            return $this->generateJWTToken($user);
        });
        
        return [
            'Authorization' => 'Bearer ' . $token
        ];
    }
    
    private function generateJWTToken($user): string
    {
        // JWT token 生成邏輯
        // 可使用 firebase/php-jwt 套件
        return "jwt_token_here";
    }
}
```

#### B. 報表 API 服務類別
```php
// app/Services/ReportApiService.php
<?php

namespace App\Services;

use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;

class ReportApiService extends BaseApiService
{
    public function getSalesReport(?Carbon $dateFrom = null, ?Carbon $dateTo = null, array $filters = [])
    {
        $cacheKey = $this->generateCacheKey('sales', $dateFrom, $dateTo, $filters);
        
        return Cache::remember($cacheKey, 300, function () use ($dateFrom, $dateTo, $filters) {
            $params = array_filter([
                'date_from' => $dateFrom?->format('Y-m-d'),
                'date_to' => $dateTo?->format('Y-m-d'),
            ]);
            
            foreach ($filters as $key => $value) {
                if (!empty($value)) {
                    $params[$key] = $value;
                }
            }
            
            $endpoint = '/api/reports/sales';
            if (!empty($params)) {
                $endpoint .= '?' . http_build_query($params);
            }
            
            return $this->makeRequest('get', $endpoint);
        });
    }
    
    public function getInventoryReport(array $filters = [])
    {
        $cacheKey = $this->generateCacheKey('inventory', null, null, $filters);
        
        return Cache::remember($cacheKey, 300, function () use ($filters) {
            $params = array_filter($filters);
            
            $endpoint = '/api/reports/inventory';
            if (!empty($params)) {
                $endpoint .= '?' . http_build_query($params);
            }
            
            return $this->makeRequest('get', $endpoint);
        });
    }
    
    public function getFinancialReport(?Carbon $dateFrom = null, ?Carbon $dateTo = null, array $filters = [])
    {
        $cacheKey = $this->generateCacheKey('financial', $dateFrom, $dateTo, $filters);
        
        return Cache::remember($cacheKey, 300, function () use ($dateFrom, $dateTo, $filters) {
            $params = array_filter([
                'date_from' => $dateFrom?->format('Y-m-d'),
                'date_to' => $dateTo?->format('Y-m-d'),
            ]);
            
            foreach ($filters as $key => $value) {
                if (!empty($value)) {
                    $params[$key] = $value;
                }
            }
            
            $endpoint = '/api/reports/financial';
            if (!empty($params)) {
                $endpoint .= '?' . http_build_query($params);
            }
            
            return $this->makeRequest('get', $endpoint);
        });
    }
    
    public function clearCache(string $reportType = null)
    {
        if ($reportType) {
            Cache::forget("report_cache_{$reportType}_*");
        } else {
            Cache::flush(); // 清除所有快取 (謹慎使用)
        }
    }
    
    private function generateCacheKey(string $reportType, ?Carbon $dateFrom, ?Carbon $dateTo, array $filters): string
    {
        $keyData = [
            'type' => $reportType,
            'user' => auth()->id(),
            'from' => $dateFrom?->format('Y-m-d'),
            'to' => $dateTo?->format('Y-m-d'),
            'filters' => $filters
        ];
        
        return 'report_cache_' . md5(serialize($keyData));
    }
}
```

### 4. 報表控制器重構

#### A. 銷售報表控制器
```php
// app/Http/Controllers/Reports/SalesReportsController.php
<?php

namespace App\Http\Controllers\Reports;

use App\Http\Controllers\Controller;
use App\Services\ReportApiService;
use Carbon\Carbon;
use Illuminate\Http\Request;

class SalesReportsController extends Controller
{
    protected ReportApiService $reportApi;
    
    public function __construct(ReportApiService $reportApi)
    {
        $this->reportApi = $reportApi;
    }
    
    public function index(Request $request)
    {
        try {
            $dateFrom = $request->date_from ? Carbon::parse($request->date_from) : Carbon::now()->subDays(30);
            $dateTo = $request->date_to ? Carbon::parse($request->date_to) : Carbon::now();
            
            $filters = array_filter([
                'status' => $request->status,
                'customer_id' => $request->customer_id,
            ]);
            
            $reportData = $this->reportApi->getSalesReport($dateFrom, $dateTo, $filters);
            
            return view('reports.sales.index', [
                'reportData' => $reportData['report'] ?? [],
                'summary' => $reportData['report']['summary'] ?? [],
                'dateFrom' => $dateFrom,
                'dateTo' => $dateTo,
                'filters' => $filters
            ]);
            
        } catch (\Exception $e) {
            return view('reports.sales.index', [
                'error' => '報表資料載入失敗：' . $e->getMessage(),
                'reportData' => [],
                'summary' => [],
                'dateFrom' => Carbon::now()->subDays(30),
                'dateTo' => Carbon::now(),
                'filters' => []
            ]);
        }
    }
    
    public function byProduct(Request $request)
    {
        // 產品銷售分析實作
    }
    
    public function byCustomer(Request $request)
    {
        // 客戶銷售分析實作
    }
    
    public function trends(Request $request)
    {
        // 銷售趨勢分析實作
    }
}
```

### 5. 顏色主題深度修復

#### A. Chart.js 深色主題配置
```javascript
// public/js/chart-themes.js
const NexusChartTheme = {
    // Chart.js 預設配置
    defaults: {
        color: '#e1e5f2', // 文字顏色
        backgroundColor: '#2d3142', // 背景顏色
        borderColor: '#4a5568', // 邊框顏色
        font: {
            family: "'Inter', sans-serif",
            size: 12
        },
        plugins: {
            legend: {
                labels: {
                    color: '#e1e5f2',
                    padding: 20
                }
            },
            tooltip: {
                backgroundColor: '#2d3142',
                titleColor: '#e1e5f2',
                bodyColor: '#e1e5f2',
                borderColor: '#4a5568',
                borderWidth: 1
            }
        },
        scales: {
            x: {
                ticks: {
                    color: '#a0aec0'
                },
                grid: {
                    color: '#4a5568',
                    borderColor: '#4a5568'
                }
            },
            y: {
                ticks: {
                    color: '#a0aec0'
                },
                grid: {
                    color: '#4a5568',
                    borderColor: '#4a5568'
                }
            }
        }
    },
    
    // 顏色調色盤
    colorPalette: [
        '#8b5fbf', // 紫色
        '#4299e1', // 藍色  
        '#48bb78', // 綠色
        '#ed8936', // 橘色
        '#f56565', // 紅色
        '#38b2ac', // 青色
        '#9f7aea', // 淺紫色
        '#4fd1c7'  // 淺青色
    ],
    
    // 套用主題到圖表
    applyTheme: function(chartConfig) {
        // 合併預設配置
        chartConfig.options = {
            ...this.defaults,
            ...chartConfig.options
        };
        
        // 套用顏色調色盤
        if (chartConfig.data && chartConfig.data.datasets) {
            chartConfig.data.datasets.forEach((dataset, index) => {
                if (!dataset.backgroundColor) {
                    dataset.backgroundColor = this.colorPalette[index % this.colorPalette.length];
                }
                if (!dataset.borderColor) {
                    dataset.borderColor = this.colorPalette[index % this.colorPalette.length];
                }
            });
        }
        
        return chartConfig;
    }
};

// 全域套用主題
Chart.defaults.color = NexusChartTheme.defaults.color;
Chart.defaults.backgroundColor = NexusChartTheme.defaults.backgroundColor;
Chart.defaults.font = NexusChartTheme.defaults.font;
```

#### B. 進階樣式修復
```scss
// resources/sass/components/_report-themes.scss
.nx-reports {
    // 表單元件主題修復
    .form-control,
    .form-select,
    .form-check-input {
        background-color: var(--nx-card-bg) !important;
        color: var(--nx-text-primary) !important;
        border-color: var(--nx-border-primary) !important;
        
        &:focus {
            background-color: var(--nx-card-bg) !important;
            color: var(--nx-text-primary) !important;
            border-color: var(--nx-accent-blue) !important;
            box-shadow: 0 0 0 0.2rem rgba(66, 153, 225, 0.25) !important;
        }
        
        &::placeholder {
            color: var(--nx-text-muted) !important;
        }
    }
    
    // 下拉選單主題
    .dropdown-menu {
        background-color: var(--nx-card-bg) !important;
        border-color: var(--nx-border-primary) !important;
        
        .dropdown-item {
            color: var(--nx-text-primary) !important;
            
            &:hover,
            &:focus {
                background-color: var(--nx-secondary-bg) !important;
                color: var(--nx-text-primary) !important;
            }
            
            &.active {
                background-color: var(--nx-accent-blue) !important;
                color: white !important;
            }
        }
    }
    
    // 模態視窗主題
    .modal-content {
        background-color: var(--nx-card-bg) !important;
        border-color: var(--nx-border-primary) !important;
        
        .modal-header {
            border-bottom-color: var(--nx-border-primary) !important;
            
            .modal-title {
                color: var(--nx-text-primary) !important;
            }
            
            .btn-close {
                filter: invert(1) !important;
            }
        }
        
        .modal-body {
            color: var(--nx-text-primary) !important;
        }
        
        .modal-footer {
            border-top-color: var(--nx-border-primary) !important;
        }
    }
    
    // 資料表格主題
    .table {
        color: var(--nx-text-primary) !important;
        
        th,
        td {
            border-color: var(--nx-border-primary) !important;
        }
        
        thead th {
            background-color: var(--nx-secondary-bg) !important;
            color: var(--nx-text-primary) !important;
        }
        
        tbody tr {
            &:hover {
                background-color: var(--nx-secondary-bg) !important;
            }
            
            &:nth-of-type(odd) {
                background-color: rgba(255, 255, 255, 0.02) !important;
            }
        }
    }
    
    // 分頁主題
    .pagination {
        .page-link {
            background-color: var(--nx-card-bg) !important;
            color: var(--nx-text-primary) !important;
            border-color: var(--nx-border-primary) !important;
            
            &:hover {
                background-color: var(--nx-secondary-bg) !important;
                color: var(--nx-text-primary) !important;
                border-color: var(--nx-accent-blue) !important;
            }
        }
        
        .page-item.active .page-link {
            background-color: var(--nx-accent-blue) !important;
            border-color: var(--nx-accent-blue) !important;
        }
        
        .page-item.disabled .page-link {
            background-color: var(--nx-secondary-bg) !important;
            color: var(--nx-text-muted) !important;
        }
    }
    
    // 工具提示主題
    .tooltip {
        .tooltip-inner {
            background-color: var(--nx-card-bg) !important;
            color: var(--nx-text-primary) !important;
            border: 1px solid var(--nx-border-primary) !important;
        }
        
        &.bs-tooltip-top .tooltip-arrow::before {
            border-top-color: var(--nx-card-bg) !important;
        }
        
        &.bs-tooltip-bottom .tooltip-arrow::before {
            border-bottom-color: var(--nx-card-bg) !important;
        }
    }
    
    // 日期選擇器主題 (如使用 flatpickr)
    .flatpickr-calendar {
        background-color: var(--nx-card-bg) !important;
        border-color: var(--nx-border-primary) !important;
        
        .flatpickr-month {
            background-color: var(--nx-secondary-bg) !important;
            color: var(--nx-text-primary) !important;
        }
        
        .flatpickr-weekday {
            background-color: var(--nx-secondary-bg) !important;
            color: var(--nx-text-secondary) !important;
        }
        
        .flatpickr-day {
            color: var(--nx-text-primary) !important;
            
            &:hover {
                background-color: var(--nx-secondary-bg) !important;
            }
            
            &.selected {
                background-color: var(--nx-accent-blue) !important;
            }
        }
    }
}
```

## 🧪 測試策略

### 1. 單元測試
```php
// tests/Unit/Services/ReportApiServiceTest.php
<?php

namespace Tests\Unit\Services;

use Tests\TestCase;
use App\Services\ReportApiService;
use Illuminate\Support\Facades\Http;

class ReportApiServiceTest extends TestCase
{
    public function test_sales_report_api_call()
    {
        Http::fake([
            'localhost:8082/api/reports/sales*' => Http::response([
                'report' => [
                    'data' => [],
                    'summary' => []
                ]
            ], 200)
        ]);
        
        $service = new ReportApiService();
        $result = $service->getSalesReport();
        
        $this->assertArrayHasKey('report', $result);
    }
}
```

### 2. 整合測試
```php
// tests/Feature/Reports/SalesReportTest.php
<?php

namespace Tests\Feature\Reports;

use Tests\TestCase;
use App\Models\User;

class SalesReportTest extends TestCase
{
    public function test_sales_report_page_loads()
    {
        $user = User::factory()->create();
        
        $response = $this->actingAs($user)->get('/reports/sales');
        
        $response->assertStatus(200);
        $response->assertViewIs('reports.sales.index');
    }
}
```

### 3. 前端測試 (Playwright)
```javascript
// tests/e2e/reports.spec.js
const { test, expect } = require('@playwright/test');

test('報表顏色主題正確', async ({ page }) => {
    await page.goto('/reports');
    
    // 檢查背景顏色
    const bgColor = await page.locator('body').evaluate(el => 
        getComputedStyle(el).backgroundColor
    );
    expect(bgColor).toBe('rgb(26, 29, 41)'); // #1a1d29
    
    // 檢查卡片背景
    const cardBgColor = await page.locator('.nx-card').first().evaluate(el =>
        getComputedStyle(el).backgroundColor
    );
    expect(cardBgColor).toBe('rgb(45, 49, 66)'); // #2d3142
    
    // 檢查圖表背景 (如果存在)
    const chartCanvas = page.locator('canvas').first();
    if (await chartCanvas.isVisible()) {
        // 檢查圖表父容器背景
        const chartBgColor = await chartCanvas.locator('..').evaluate(el =>
            getComputedStyle(el).backgroundColor
        );
        expect(chartBgColor).not.toBe('rgb(255, 255, 255)'); // 不應該是白色
    }
});
```

## 📊 效能監控與優化

### 1. API 回應時間監控
```go
// internal/middleware/metrics.go
func (app *application) metricsMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        start := time.Now()
        
        next.ServeHTTP(w, r)
        
        duration := time.Since(start)
        
        // 記錄到監控系統 (如 Prometheus)
        app.metrics.RecordHTTPRequest(r.Method, r.URL.Path, duration)
        
        // 如果回應時間過長，記錄警告
        if duration > 500*time.Millisecond {
            app.logger.Warn("Slow API response", 
                "method", r.Method,
                "path", r.URL.Path,
                "duration", duration,
            )
        }
    })
}
```

### 2. 資料庫查詢優化
```sql
-- 分析慢查詢
SELECT query, mean_time, calls, total_time
FROM pg_stat_statements
WHERE mean_time > 100  -- 超過 100ms 的查詢
ORDER BY mean_time DESC;

-- 建立必要索引
EXPLAIN ANALYZE SELECT * FROM sales_orders WHERE user_id = ? AND order_date BETWEEN ? AND ?;

-- 如果需要複合索引
CREATE INDEX CONCURRENTLY idx_sales_orders_user_date_status 
ON sales_orders(user_id, order_date, status) 
WHERE status IN ('completed', 'shipped');
```

## 🚀 部署與維護計畫

### 1. 資料庫遷移策略
```bash
# 分階段部署避免服務中斷

# 階段 1: 新增資料表（不影響現有功能）
./migrate up --only 001_add_accounts_receivable
./migrate up --only 002_add_accounts_payable
./migrate up --only 003_add_inventory_movements

# 階段 2: 資料遷移（背景執行）
./data-migration --source sales_orders --target accounts_receivable

# 階段 3: 應用程式部署
docker-compose down --remove-orphans
docker-compose up -d --build
```

### 2. 監控與告警設定
```yaml
# prometheus/alert.rules.yml
groups:
- name: nexus-erp-reports
  rules:
  - alert: HighAPILatency
    expr: histogram_quantile(0.95, http_request_duration_seconds_bucket{job="nexus-erp-backend"}) > 0.5
    for: 2m
    annotations:
      summary: "API 回應延遲過高"
      
  - alert: HighErrorRate  
    expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
    for: 1m
    annotations:
      summary: "API 錯誤率過高"
```

## ✅ 驗收標準

### 功能驗收
- [ ] 所有報表頁面零白色背景問題
- [ ] 銷售報表顯示真實訂單資料
- [ ] 庫存報表顯示真實庫存資料  
- [ ] 財務報表顯示真實應收應付資料
- [ ] 採購報表顯示真實採購資料
- [ ] 所有篩選功能正常運作
- [ ] 資料匯出功能正常
- [ ] 響應式設計在各裝置正常

### 效能驗收
- [ ] API 回應時間 < 500ms (95% 請求)
- [ ] 頁面載入時間 < 2 秒
- [ ] 大數據量報表 (1000+ 記錄) 正常載入
- [ ] 同時 50 用戶使用無效能問題

### 安全驗收  
- [ ] 用戶資料完全隔離 (A 用戶看不到 B 用戶資料)
- [ ] API 認證機制正常運作
- [ ] SQL 注入防護測試通過
- [ ] XSS 攻擊防護測試通過

### 維護性驗收
- [ ] 程式碼覆蓋率 > 80%
- [ ] API 文件完整
- [ ] 錯誤日誌記錄完整
- [ ] 監控告警設定完成

## 📝 風險評估與應對

### 高風險項目
1. **Go-Laravel API 整合複雜性**
   - **風險**: 跨語言整合可能出現意外錯誤
   - **應對**: 建立完整的錯誤處理和回退機制

2. **大數據量查詢效能**
   - **風險**: 隨著資料成長，查詢可能變慢
   - **應對**: 實作分頁、索引優化、快取策略

### 中風險項目
1. **第三方插件主題相容性**
   - **風險**: 某些插件可能無法完美適配深色主題
   - **應對**: 準備自訂 CSS 覆蓋和替代方案

2. **資料庫遷移風險**
   - **風險**: 大量資料遷移可能影響效能
   - **應對**: 分批遷移、低峰期執行

## 🎯 成功指標

### 量化指標
- **視覺一致性**: 100% 頁面符合深色主題 (零白色背景)
- **資料真實性**: 100% 報表顯示真實業務資料
- **API 效能**: 95% 請求回應時間 < 500ms
- **系統穩定性**: 99.9% 正常運行時間

### 質化指標
- **使用者體驗**: 報表載入流暢，視覺統一
- **業務價值**: 報表提供真實決策支援資訊
- **維護性**: 程式碼結構清晰，易於擴展
- **安全性**: 用戶資料隔離完整

---

**規劃文件版本**: v1.0  
**預計開始時間**: 2025-07-28  
**預計完成時間**: 2025-08-18  
**負責團隊**: 全端開發團隊  
**審核狀態**: 待用戶確認 ✅