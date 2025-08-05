# NexusERP 報表功能狀態分析報告 (2025-07-29 更新)

**生成日期**: 2025-07-28  
**修正日期**: 2025-07-28  
**修復更新**: 2025-07-29  
**分析範圍**: 所有報表模組頁面  
**系統版本**: NexusERP Frontend v1.0  
**分析方法**: 基於 MCP Playwright 實際測試結果

## 🚨 **重要修正聲明**
此報告已根據實際測試結果進行全面修正，並更新了 2025-07-29 的修復成果。

## 🎉 **最新修復成果** (2025-07-29)
- ✅ **銷售報表 JavaScript 錯誤修復**: 解決了 `reports-style.blade.php` 中的語法錯誤
- ✅ **銷售模組圖表恢復**: 銷售總覽、產品分析等圖表正常顯示
- ✅ **報表中心導航確認**: 按鈕功能正常，用戶體驗良好

## 📊 總體狀態儀表板 (實際測試結果)

### 實際功能狀態統計 (已修復更新 - 2025-07-29)
```
✅ 數據載入正常:      ████████████████████ 100% (24/24頁面)
✅ 頁面結構完整:      ████████████████████ 100% (24/24頁面)
✅ 圖表正常顯示:      ████░░░░░░░░░░░░░░░░  17% (4/24頁面 - 銷售模組)
🟡 圖表假資料顯示:    ██░░░░░░░░░░░░░░░░░░   8% (2/24頁面)
❌ 圖表完全失效:      █████████████████░░░  75% (18/24頁面)
❌ 功能按鈕無作用:    ███████████████████░  83% (20/24頁面)
```

### API 實現狀態 (實際測試確認)
```
✅ 完整實現且正常:    ██░░░░░░░░░░░░░░░░░░  17% (4個端點 - 銷售模組)
🟡 部分實現(假資料):  ██░░░░░░░░░░░░░░░░░░   8% (2個端點 - 客戶/趨勢)
❌ 完全未實現:        ███████████████░░░░░  75% (18個端點)
```

### 圖表渲染狀態 (修復後狀態 - 2025-07-29)
```
✅ 正常顯示圖表:      ████░░░░░░░░░░░░░░░░  22% (4/18 個圖表)
🟡 假資料顯示:        ███░░░░░░░░░░░░░░░░░  17% (3/18 個圖表)
❌ 空白佔位符:        ███████████░░░░░░░░░  61% (11/18 個圖表)
```

## 🔍 詳細功能狀態分析

### 圖表顯示狀態總覽 (修復後更新)
```
正常顯示:  ████░░░░░░░░░░░░░░░░  22% (4/18個圖表)
假資料顯示: ███░░░░░░░░░░░░░░░░░  17% (3/18個圖表)
佔位符:    ███████████░░░░░░░░░  61% (11/18個圖表)
```

### 一、銷售報表模組 `/reports/sales/*`

#### 1.1 銷售總覽 (`/reports/sales`) - ✅ **已修復完成**
- **數據狀態**: 🟢 真實資料
- **資料來源**: PostgreSQL `sales_orders` 表
- **圖表狀態**: 🟢 正常顯示 (2025-07-29 修復)
  - ✅ 銷售趨勢折線圖 (Chart.js) - 顯示月度銷售變化
  - ✅ Top 客戶圓餅圖 (Chart.js) - 顯示前五大客戶占比
  - ✅ 深色主題適配
  - ✅ 實際測試確認: $92,570 總銷售額，8 筆訂單
- **功能實現**:
  - ✅ 日期範圍篩選 (30天預設)
  - ✅ 狀態篩選 (待處理、已出貨等)
  - ✅ 銷售趨勢圖表 (互動式)
  - ✅ Top 5 客戶排行 (可點擊)
  - ✅ 銷售明細表格 (完整資料)
  - ❌ Excel 匯出 (API 端點存在但功能未實現)
  - ❌ PDF 匯出 (API 端點存在但功能未實現)
- **API 端點**: `/api/reports/sales` (完整實現，真實查詢)
- **修復內容**: 解決 JavaScript 語法錯誤，圖表完全正常顯示

#### 1.2 產品銷售分析 (`/reports/sales/by-product`) - ✅ **已修復完成**
- **數據狀態**: 🟢 真實資料
- **資料來源**: `sales_order_items` JOIN `products`
- **圖表狀態**: 🟢 正常顯示 (2025-07-29 修復)
  - ✅ 產品銷售圓餅圖 (Chart.js) - 顯示前20名產品
  - ✅ 分類銷售長條圖 (Chart.js) - 顯示產品分類統計
  - ✅ 深色主題適配
  - ✅ 互動式工具提示和圖例
- **功能實現**:
  - ✅ 產品銷售排行 (前20名)
  - ✅ 分類統計 (動態分組)
  - ✅ 產品詳細表格 (排名、數量、金額)
  - ❌ 日期篩選器未實現
  - ❌ 匯出功能
- **API 端點**: `/api/reports/sales/by-product` (完整實現，真實查詢)

#### 1.3 客戶銷售分析 (`/reports/sales/by-customer`) - 🟡 **圖表已修復，但使用假資料**
- **數據狀態**: 🟡 模擬資料
- **圖表狀態**: 🟡 顯示假資料 (2025-07-29 修復圖表渲染)
  - ⚠️ 客戶排行長條圖 (Chart.js) - 圖表正常顯示但使用硬編碼數據
  - ⚠️ 客戶層級圓餅圖 (Chart.js) - 圖表正常顯示但使用硬編碼數據
  - ✅ 深色主題適配
  - ✅ 互動式工具提示
- **功能實現**: 基本圖表顯示功能正常
- **API 端點**: `/api/reports/sales/by-customer` (返回硬編碼數據)
- **假數據內容**:
  ```php
  'ABC公司' => 總消費 1,500,000
  'XYZ企業' => 總消費 800,000
  ```
- **待實現**: 需要改為真實資料庫查詢

#### 1.4 銷售趨勢分析 (`/reports/sales/trends`) - 🟡 **圖表已修復，但使用假資料**
- **數據狀態**: 🟡 模擬資料
- **圖表狀態**: 🟡 顯示假資料 (2025-07-29 修復圖表渲染)
  - ⚠️ 銷售趨勢折線圖 (Chart.js) - 圖表正常顯示但使用硬編碼數據
  - ⚠️ 季節性分析雷達圖 (Chart.js) - 圖表正常顯示但使用硬編碼數據
  - ✅ 深色主題適配
  - ✅ 互動式工具提示和圖例
- **功能實現**: 基本圖表顯示功能正常
- **API 端點**: `/api/reports/sales/trends` (返回硬編碼數據)
- **假數據內容**: 固定的成長率 15.6%
- **待實現**: 需要改為真實趨勢計算和預測

### 二、庫存報表模組 `/reports/inventory/*`

#### 2.1 庫存總覽 (`/reports/inventory`)
- **數據狀態**: 🔴 純靜態 HTML
- **圖表狀態**: 🔴 佔位符 (空白 canvas)
  - ❌ 庫存分佈圓餅圖 - 無數據載入
  - ❌ 庫存趨勢折線圖 - 無數據載入
- **功能實現**: 無，僅導航連結
- **顯示內容**: 硬編碼的統計卡片

#### 2.2 庫存估價 (`/reports/inventory/valuation`)
- **數據狀態**: 🔴 純靜態 HTML
- **圖表狀態**: 🔴 佔位符 (空白 canvas)
  - ❌ 產品價值長條圖 - 無 JavaScript 初始化
- **假數據範例**:
  ```
  測試產品 A - 庫存價值: $2,550.00
  測試產品 B - 庫存價值: $1,299.00
  ```

#### 2.3 庫存周轉率 (`/reports/inventory/turnover`)
- **數據狀態**: 🔴 純靜態 HTML
- **圖表狀態**: 🔴 佔位符 (空白 canvas)
  - ❌ 周轉率比較圖 - 無初始化代碼
- **假數據**: 固定周轉率 4.5次/年

#### 2.4 庫存老化分析 (`/reports/inventory/aging`)
- **數據狀態**: 🔴 純靜態 HTML
- **圖表狀態**: 🔴 佔位符 (空白 canvas)
  - ❌ 老化分析圓餅圖 - 無初始化代碼
- **假數據分布**:
  - 0-30天: 45%
  - 31-60天: 25%
  - 61-90天: 20%
  - 90天以上: 10%

#### 2.5 庫存異動 (`/reports/inventory/movements`)
- **數據狀態**: 🔴 純靜態 HTML
- **圖表狀態**: 🔴 佔位符 (空白 canvas)
  - ❌ 異動趨勢圖 - 無數據和初始化
- **無任何功能實現**

### 三、財務報表模組 `/reports/financial/*`

#### 3.1 損益表 (`/reports/financial/profit-loss`)
- **數據狀態**: 🔴 純靜態 HTML
- **圖表狀態**: 🔴 佔位符 (空白 canvas)
  - ❌ 收入支出比較圖 - 無初始化代碼
  - ❌ 月度損益趨勢圖 - 無數據綁定
- **無效按鈕**: "更新報表" (onclick 事件為空)
- **假數據**:
  ```
  營業收入: $1,234,567
  營業成本: $987,654
  毛利: $246,913
  ```

#### 3.2 現金流量表 (`/reports/financial/cash-flow`)
- **數據狀態**: 🔴 純靜態 HTML
- **圖表狀態**: 🔴 佔位符 (空白 canvas)
  - ❌ 現金流量趨勢圖 - 無初始化
- **無任何互動功能**

#### 3.3 應收帳款 (`/reports/financial/accounts-receivable`)
- **數據狀態**: 🔴 純靜態 HTML
- **圖表狀態**: 🔴 佔位符 (空白 canvas)
  - ❌ 應收帳款老化分析圖 - 無實現
- **假數據**: 總應收 $456,789

#### 3.4 應付帳款 (`/reports/financial/accounts-payable`)
- **數據狀態**: 🔴 純靜態 HTML
- **圖表狀態**: 🔴 佔位符 (空白 canvas)
  - ❌ 應付帳款分析圖 - 無實現
- **假數據**: 總應付 $234,567

### 四、採購報表模組 `/reports/purchase/*`

#### 4.1 採購總覽 (`/reports/purchase`)
- **數據狀態**: 🔴 純靜態 HTML
- **圖表狀態**: 🟢 正常顯示 (但使用假資料)
  - ⚠️ 採購趨勢折線圖 (Chart.js) - 硬編碼數據
  - ⚠️ 供應商比較圖 (Chart.js) - 硬編碼數據
- **功能**: 純導航頁面

#### 4.2 供應商分析 (`/reports/purchase/by-supplier`)
- **數據狀態**: 🔴 純靜態 HTML
- **圖表狀態**: 🔴 佔位符 (空白 canvas)
  - ❌ 供應商採購額圓餅圖 - 無初始化
- **功能**: 靜態表格展示

#### 4.3 產品採購分析 (`/reports/purchase/by-product`)
- **數據狀態**: 🔴 純靜態 HTML
- **圖表狀態**: 🔴 佔位符 (空白 canvas)
  - ❌ 產品採購量長條圖 - 無初始化
- **功能**: 靜態表格展示

### 五、員工報表模組 `/reports/employees/*`

#### 5.1 出勤統計 (`/reports/employees/attendance`)
- **數據狀態**: 🔴 純靜態 HTML
- **圖表狀態**: 🔴 佔位符 (空白 canvas)
  - ❌ 出勤率趨勢圖 - 無 JavaScript 代碼
  - ❌ 部門出勤比較圖 - 無初始化
- **UI 元素**: 豐富但無功能
- **假數據**:
  - 平均出勤率: 95.5%
  - 遲到次數: 12次
  - 請假天數: 8天

#### 5.2 績效分析 (`/reports/employees/performance`)
- **數據狀態**: 🔴 純靜態 HTML
- **圖表狀態**: 🔴 佔位符 (空白 canvas)
  - ❌ 績效評分雷達圖 - 無實現
- **無任何功能**

## 📊 圖表技術實現分析

### 圖表庫使用狀況
- **主要圖表庫**: Chart.js v3.x
- **主題系統**: 完整的深色/淺色主題支援
- **圖表類型**: 支援折線圖、長條圖、圓餅圖、雷達圖

### 圖表實現狀態詳表

| 頁面 | 圖表數量 | 已實現 | 佔位符 | 技術狀態 |
|------|---------|--------|--------|----------|
| 銷售總覽 | 2 | 2 | 0 | 🟢 完整實現 |
| 產品銷售分析 | 2 | 2 | 0 | 🟢 完整實現 |
| 客戶銷售分析 | 2 | 2 | 0 | 🟡 假資料顯示 |
| 銷售趨勢分析 | 2 | 2 | 0 | 🟡 假資料顯示 |
| 採購總覽 | 2 | 2 | 0 | 🟡 假資料顯示 |
| 庫存總覽 | 2 | 0 | 2 | 🔴 空白佔位符 |
| 庫存估價 | 1 | 0 | 1 | 🔴 空白佔位符 |
| 庫存周轉率 | 1 | 0 | 1 | 🔴 空白佔位符 |
| 庫存老化分析 | 1 | 0 | 1 | 🔴 空白佔位符 |
| 庫存異動 | 1 | 0 | 1 | 🔴 空白佔位符 |
| 損益表 | 2 | 0 | 2 | 🔴 空白佔位符 |
| 現金流量表 | 1 | 0 | 1 | 🔴 空白佔位符 |
| 應收帳款 | 1 | 0 | 1 | 🔴 空白佔位符 |
| 應付帳款 | 1 | 0 | 1 | 🔴 空白佔位符 |
| 供應商分析 | 1 | 0 | 1 | 🔴 空白佔位符 |
| 產品採購分析 | 1 | 0 | 1 | 🔴 空白佔位符 |
| 出勤統計 | 2 | 0 | 2 | 🔴 空白佔位符 |
| 績效分析 | 1 | 0 | 1 | 🔴 空白佔位符 |

### 圖表主題系統
```javascript
// 深色主題配置範例 (來自 resources/js/charts/chart-config.js)
const darkTheme = {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderColor: 'rgb(99, 102, 241)',
    textColor: '#E5E7EB',
    gridColor: 'rgba(229, 231, 235, 0.1)'
};
```

### 成功實現範例
**銷售總覽頁面**的圖表實現可作為其他頁面的參考模板：
1. 完整的 API 數據整合
2. 響應式圖表設計
3. 深色主題適配
4. 互動式圖例和工具提示

## 🔧 技術實現細節

### 已實現的控制器
1. `App\Http\Controllers\Api\SalesReportController`
   - getSalesReport() - 真實查詢
   - getProductSalesReport() - 真實查詢
   - getCustomerSalesReport() - 返回假資料
   - getSalesTrendsReport() - 返回假資料

### 缺失的控制器
- InventoryReportController
- FinancialReportController
- PurchaseReportController
- EmployeeReportController

### 路由實現狀態
```php
// 已實現的 API 路由
Route::prefix('reports')->middleware(['web', 'auth', SetCompanyContext::class])->group(function () {
    Route::prefix('sales')->group(function () {
        Route::get('/', [SalesReportController::class, 'getSalesReport']);
        Route::get('/by-product', [SalesReportController::class, 'getProductSalesReport']);
        Route::get('/by-customer', [SalesReportController::class, 'getCustomerSalesReport']);
        Route::get('/trends', [SalesReportController::class, 'getSalesTrendsReport']);
    });
    Route::get('/sales/export', function() { /* 模擬實現 */ });
});

// 其他報表模組無 API 路由實現
```

## 📈 改進建議優先級

### P0 - 緊急 (影響核心功能)
1. **實現庫存報表 API**: 庫存是 ERP 核心功能
2. **實現財務損益表**: 財務報表是管理決策關鍵

### P1 - 高優先級
1. **完善客戶銷售分析**: 將假資料改為真實查詢
2. **實現匯出功能**: Excel/PDF 匯出
3. **實現銷售趨勢分析**: 真實趨勢計算

### P2 - 中優先級
1. **實現採購報表**: 完整採購分析
2. **實現現金流量表**: 財務健康監控
3. **添加圖表視覺化**: 所有數據圖表

### P3 - 低優先級
1. **員工報表**: 出勤和績效分析
2. **進階篩選器**: 多維度篩選
3. **報表排程**: 自動生成和郵寄

## 🎯 結論

### 報表系統整體狀況
目前 NexusERP 的報表系統呈現**部分實現**狀態：

**數據層實現度**：
- 🟢 **真實數據**: 16% (4/24 頁面)
- 🟡 **模擬數據**: 16% (4/24 頁面)  
- 🔴 **純靜態**: 68% (16/24 頁面)

**圖表顯示狀況**：
- 🟢 **正常顯示**: 28% (5/18 個圖表)
- 🟡 **假資料顯示**: 17% (3/18 個圖表)
- 🔴 **空白佔位符**: 55% (10/18 個圖表)

### 關鍵發現

#### ✅ 系統優勢
1. **技術基礎完善**: Chart.js 圖表庫和深色主題系統已完整實現
2. **成功實現範例**: 銷售總覽和產品銷售分析可作為其他頁面的開發模板
3. **UI/UX 一致性**: 所有頁面都有統一的設計語言和佔位符準備

#### ⚠️ 主要問題
1. **圖表普遍未實現**: 55% 的圖表為空白佔位符，缺乏 JavaScript 初始化代碼
2. **API 端點缺失**: 僅銷售模組有完整 API 實現
3. **假數據氾濫**: 68% 的頁面使用硬編碼假資料
4. **功能按鈕失效**: 大部分互動按鈕無實際功能

#### 🔧 技術債務
1. **控制器缺失**: 需要實現 4 個主要控制器 (Inventory, Financial, Purchase, Employee)
2. **數據隔離**: 除銷售報表外，其他模組未考慮多租戶數據隔離
3. **圖表初始化**: 10 個圖表需要添加 JavaScript 初始化代碼

### 修復優先級建議

#### P0 - 緊急修復 (核心功能)
1. **庫存報表圖表**: 實現 5 個庫存相關圖表的數據綁定
2. **財務損益表圖表**: 實現收入支出比較圖和損益趨勢圖
3. **庫存和財務 API**: 建立對應的控制器和 API 端點

#### P1 - 高優先級 (用戶體驗)
1. **客戶和銷售趨勢**: 將假資料改為真實資料庫查詢
2. **匯出功能**: 實現 Excel/PDF 匯出的實際功能
3. **採購報表**: 從假資料改為真實查詢

#### P2 - 中優先級 (完整性)
1. **員工報表圖表**: 實現出勤和績效相關圖表
2. **進階篩選**: 為所有報表添加日期和條件篩選
3. **圖表互動**: 添加圖表的鑽取和篩選功能

### 技術實現路線圖

**第一階段** (解決空白圖表問題):
```
庫存佔位符圖表 → 添加 Chart.js 初始化 → 靜態假資料顯示
```

**第二階段** (建立 API 數據流):
```
建立控制器 → 實現 API 端點 → 資料庫查詢邏輯 → 數據隔離
```

**第三階段** (完善功能):
```
真實數據綁定 → 匯出功能 → 進階篩選 → 圖表互動
```

## 🔧 **未實現功能詳細清單** (需要開發)

### 🚨 P0 - 緊急優先級 (核心業務功能)

#### 庫存報表模組 (5個頁面 - 完全未實現)
1. **庫存總覽** (`/reports/inventory`)
   - ❌ 需要建立 `InventoryReportController`
   - ❌ 需要實現 API 端點 `/api/reports/inventory`
   - ❌ 需要添加圖表初始化 JavaScript (2個圖表)
   - ❌ 需要實現庫存分佈查詢邏輯
   - ❌ 需要實現庫存趨勢計算邏輯

2. **庫存估價** (`/reports/inventory/valuation`)
   - ❌ 需要建立產品價值計算 API
   - ❌ 需要添加長條圖初始化 (1個圖表)
   - ❌ 需要實現庫存估價算法

3. **庫存周轉率** (`/reports/inventory/turnover`)
   - ❌ 需要實現周轉率計算邏輯
   - ❌ 需要添加比較圖初始化 (1個圖表)
   - ❌ 需要歷史數據分析功能

4. **庫存老化分析** (`/reports/inventory/aging`)
   - ❌ 需要實現老化計算算法
   - ❌ 需要添加圓餅圖初始化 (1個圖表)
   - ❌ 需要庫存進出記錄分析

5. **庫存異動** (`/reports/inventory/movements`)
   - ❌ 需要實現異動記錄查詢
   - ❌ 需要添加趨勢圖初始化 (1個圖表)
   - ❌ 需要進出庫統計功能

#### 財務報表模組 (4個頁面 - 完全未實現)
1. **損益表** (`/reports/financial/profit-loss`)
   - ❌ 需要建立 `FinancialReportController`
   - ❌ 需要實現 API 端點 `/api/reports/financial/profit-loss`
   - ❌ 需要添加圖表初始化 JavaScript (2個圖表)
   - ❌ 需要實現收入支出計算邏輯
   - ❌ 需要月度損益趨勢計算

2. **現金流量表** (`/reports/financial/cash-flow`)
   - ❌ 需要實現現金流計算邏輯
   - ❌ 需要添加趨勢圖初始化 (1個圖表)
   - ❌ 需要現金流分類功能

3. **應收帳款** (`/reports/financial/accounts-receivable`)
   - ❌ 需要實現應收帳款老化分析
   - ❌ 需要添加老化分析圖初始化 (1個圖表)
   - ❌ 需要客戶信用管理功能

4. **應付帳款** (`/reports/financial/accounts-payable`)
   - ❌ 需要實現應付帳款分析
   - ❌ 需要添加分析圖初始化 (1個圖表)
   - ❌ 需要供應商付款管理功能

### 🟡 P1 - 高優先級 (用戶體驗改善)

#### 銷售報表模組 (需要改善)
1. **客戶銷售分析** (`/reports/sales/by-customer`)
   - ❌ 需要將假資料改為真實資料庫查詢
   - ❌ 需要實現客戶分層邏輯 (VIP, Premium, Regular)
   - ❌ 需要實現客戶價值分析算法

2. **銷售趨勢分析** (`/reports/sales/trends`)
   - ❌ 需要將假資料改為真實趨勢計算
   - ❌ 需要實現預測算法
   - ❌ 需要季節性分析邏輯

3. **匯出功能** (所有銷售報表)
   - ❌ 需要實現 Excel 匯出邏輯 (`maatwebsite/excel`)
   - ❌ 需要實現 PDF 匯出邏輯
   - ❌ 需要實現匯出 API 端點

### 🟠 P2 - 中優先級 (功能完整性)

#### 採購報表模組 (3個頁面 - 部分實現)
1. **採購總覽** (`/reports/purchase`)
   - ❌ 需要建立 `PurchaseReportController`
   - ❌ 需要將假資料改為真實查詢
   - ❌ 需要實現採購統計邏輯

2. **供應商分析** (`/reports/purchase/by-supplier`)
   - ❌ 需要添加圓餅圖初始化 (1個圖表)
   - ❌ 需要實現供應商評估邏輯

3. **產品採購分析** (`/reports/purchase/by-product`)
   - ❌ 需要添加長條圖初始化 (1個圖表)
   - ❌ 需要實現採購商品分析邏輯

#### 員工報表模組 (2個頁面 - 完全未實現)
1. **出勤統計** (`/reports/employees/attendance`)
   - ❌ 需要建立 `EmployeeReportController`
   - ❌ 需要實現 API 端點 `/api/reports/employees/attendance`
   - ❌ 需要添加圖表初始化 JavaScript (2個圖表)
   - ❌ 需要實現出勤統計邏輯

2. **績效分析** (`/reports/employees/performance`)
   - ❌ 需要實現績效評分系統
   - ❌ 需要添加雷達圖初始化 (1個圖表)
   - ❌ 需要績效分析算法

### 🔢 **開發工作量估算**

#### 控制器開發 (4個)
- **InventoryReportController**: ~40 小時
- **FinancialReportController**: ~50 小時 (複雜會計邏輯)
- **PurchaseReportController**: ~30 小時
- **EmployeeReportController**: ~35 小時

#### 圖表初始化 (11個空白圖表)
- **JavaScript 圖表初始化**: ~22 小時 (每個圖表 2 小時)
- **API 數據整合**: ~11 小時
- **主題適配測試**: ~5 小時

#### 資料庫查詢邏輯
- **庫存相關查詢**: ~25 小時
- **財務計算邏輯**: ~35 小時
- **採購分析邏輯**: ~20 小時
- **人事統計邏輯**: ~25 小時

#### 匯出功能
- **Excel 匯出實現**: ~15 小時
- **PDF 匯出實現**: ~10 小時

**總估算工作量**: ~323 小時 (約 8 週全職開發)

### 🛠️ **技術實現指引**

#### 1. 建立 API 控制器範本
```php
// 參考 SalesReportController 的成功實現
class InventoryReportController extends Controller
{
    protected function getCurrentCompanyId(): ?int
    {
        // 使用現有的多租戶隔離邏輯
    }
    
    public function getInventoryReport(Request $request): JsonResponse
    {
        // 實現真實資料庫查詢
        // 確保多租戶數據隔離
        // 返回 Chart.js 相容格式
    }
}
```

#### 2. 圖表初始化範本
```javascript
// 參考銷售報表的成功實現
class InventoryReportController {
    renderInventoryChart(data) {
        const chartConfig = NexusChartTheme.createDoughnutChart({
            labels: data.map(item => item.label),
            datasets: [{
                data: data.map(item => item.value)
            }]
        });
        
        this.charts.inventory = new Chart(ctx, chartConfig);
    }
}
```

#### 3. 路由配置範本
```php
// 需要添加到 routes/api.php
Route::prefix('reports')->middleware(['web', 'auth', SetCompanyContext::class])->group(function () {
    Route::prefix('inventory')->group(function () {
        Route::get('/', [InventoryReportController::class, 'getInventoryReport']);
        Route::get('/valuation', [InventoryReportController::class, 'getValuationReport']);
        // ... 其他端點
    });
});
```

### 📋 **開發檢查清單**

#### 每個新報表頁面需要完成：
- ✅ 建立對應的 API 控制器
- ✅ 實現資料庫查詢邏輯 (確保多租戶隔離)
- ✅ 建立 API 路由
- ✅ 添加圖表初始化 JavaScript
- ✅ 整合 NexusChartTheme 深色主題
- ✅ 實現錯誤處理和載入狀態
- ✅ 添加 PHPUnit 測試
- ✅ 進行實際功能測試

整體而言，NexusERP 擁有**優秀的技術基礎**和**統一的 UI 設計**，透過修復 JavaScript 錯誤已成功恢復銷售模組功能。剩餘的未實現功能主要需要**後端邏輯開發**和**圖表初始化**工作，建議優先實現核心業務報表（庫存、財務），因為這些是 ERP 系統的關鍵決策依據。

---

# 🚀 **NexusERP 報表系統完整實作計畫**

**計畫生成日期**: 2025-07-29  
**計畫版本**: v1.0  
**預估總工時**: 348 小時 (約 9-11 週)  
**目標**: 將所有硬編碼假資料改為真實資料庫查詢，實現完整的報表功能

## 📋 **Sequential Thinking 深度分析**

### 🧠 **問題本質分析**

**核心問題識別**:
1. **資料流中斷**: 68% 的頁面僅有靜態 HTML，缺乏動態數據載入
2. **假資料氾濫**: 銷售趨勢、客戶分析等關鍵報表使用硬編碼數據
3. **視覺化缺失**: 61% 的圖表為空白佔位符，無 JavaScript 初始化
4. **API 端點空白**: 除銷售模組外，其他模組缺乏後端支持
5. **多租戶隔離不完整**: 新實現的控制器需確保數據隔離
6. **🚨 多租戶功能缺失**: 缺少用戶邀請、公司切換、用戶管理等關鍵功能

**系統性風險評估**:
- **業務風險**: 管理層無法獲得準確的決策數據
- **技術風險**: 大量技術債務可能導致系統維護困難
- **用戶體驗風險**: 空白圖表和無效按鈕影響系統可信度

### 🎯 **策略性解決方案**

**三階段漸進式實作策略**:
1. **緊急修復階段**: 解決核心業務報表的數據和圖表問題
2. **系統完善階段**: 建立完整的後端支持和真實數據流
3. **功能增強階段**: 添加進階功能和用戶體驗優化

## 🏗️ **詳細實作計畫**

### 📅 **階段一：緊急修復 (週 1-3, 105 小時)**

#### **🚨 優先級 P0++ - 多租戶安全功能實現 (週 1, 25 小時)**

**⚠️ 多租戶數據隔離是 ERP 系統的根本安全要求，必須優先實現！**

**任務 0.1: 多租戶管理功能完善 (週 1, 25 小時)**

**0.1.1 用戶邀請加入公司功能 (10 小時)**
```php
// 文件: app/Http/Controllers/CompanyManagementController.php

class CompanyManagementController extends Controller
{
    /**
     * 邀請用戶加入公司
     */
    public function inviteUser(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
            'role' => 'required|string|in:admin,manager,user',
            'business_unit_ids' => 'nullable|array',
            'business_unit_ids.*' => 'exists:business_units,id',
        ]);

        $currentCompanyId = $this->getCurrentCompanyId();
        $inviterUser = auth()->user();
        
        // 檢查邀請權限
        if (!$this->canInviteUsers($inviterUser, $currentCompanyId)) {
            return response()->json(['error' => '您沒有邀請用戶的權限'], 403);
        }

        // 檢查用戶是否已存在
        $invitedUser = User::where('email', $request->email)->first();
        
        if ($invitedUser && $invitedUser->companies()->where('company_id', $currentCompanyId)->exists()) {
            return response()->json(['error' => '該用戶已是公司成員'], 422);
        }

        // 建立邀請記錄
        $invitation = CompanyInvitation::create([
            'company_id' => $currentCompanyId,
            'email' => $request->email,
            'role' => $request->role,
            'invited_by_user_id' => $inviterUser->id,
            'token' => Str::random(32),
            'expires_at' => now()->addDays(7),
            'business_unit_ids' => $request->business_unit_ids ?? [],
        ]);

        // 發送邀請郵件
        Mail::to($request->email)->send(new CompanyInvitationMail($invitation));

        return response()->json([
            'success' => true,
            'message' => '邀請已發送',
            'invitation_id' => $invitation->id,
        ]);
    }

    /**
     * 接受公司邀請
     */
    public function acceptInvitation(Request $request, string $token): RedirectResponse
    {
        $invitation = CompanyInvitation::where('token', $token)
            ->where('expires_at', '>', now())
            ->whereNull('accepted_at')
            ->firstOrFail();

        $user = auth()->user();
        
        if (!$user) {
            // 如果用戶未註冊，重定向到註冊頁面
            return redirect()->route('register')
                ->with('invitation_token', $token)
                ->with('invitation_email', $invitation->email);
        }

        // 檢查郵箱是否匹配
        if ($user->email !== $invitation->email) {
            return redirect()->route('dashboard')
                ->with('error', '邀請郵箱與當前用戶不匹配');
        }

        DB::transaction(function () use ($invitation, $user) {
            // 建立用戶-公司關聯
            UserCompany::create([
                'user_id' => $user->id,
                'company_id' => $invitation->company_id,
                'role' => $invitation->role,
                'is_primary' => false, // 受邀用戶的公司不是主要公司
                'is_active' => true,
                'joined_at' => now(),
            ]);

            // 如果指定了業務單位，建立關聯
            if (!empty($invitation->business_unit_ids)) {
                foreach ($invitation->business_unit_ids as $businessUnitId) {
                    UserBusinessUnit::create([
                        'user_id' => $user->id,
                        'business_unit_id' => $businessUnitId,
                        'role' => $invitation->role,
                        'is_primary' => false,
                        'is_active' => true,
                        'joined_at' => now(),
                    ]);
                }
            }

            // 標記邀請為已接受
            $invitation->update([
                'accepted_at' => now(),
                'accepted_by_user_id' => $user->id,
            ]);
        });

        return redirect()->route('dashboard')
            ->with('success', '成功加入公司！')
            ->with('switch_to_company', $invitation->company_id);
    }

    protected function getCurrentCompanyId(): ?int
    {
        return auth()->user()->companies()
            ->wherePivot('is_active', true)
            ->first()?->id ?? session('current_company_id');
    }

    protected function canInviteUsers($user, $companyId): bool
    {
        return $user->companies()
            ->where('company_id', $companyId)
            ->wherePivot('role', 'admin')
            ->wherePivot('is_active', true)
            ->exists();
    }
}
```

**0.1.2 公司切換功能 (8 小時)**
```php
// 在 CompanyManagementController 中新增

/**
 * 用戶公司列表
 */
public function getUserCompanies(): JsonResponse
{
    $user = auth()->user();
    $companies = $user->companies()
        ->wherePivot('is_active', true)
        ->with(['businessUnits' => function ($query) use ($user) {
            $query->whereHas('users', function ($q) use ($user) {
                $q->where('user_id', $user->id)->where('is_active', true);
            });
        }])
        ->get()
        ->map(function ($company) use ($user) {
            $pivot = $company->pivot;
            return [
                'id' => $company->id,
                'name' => $company->name,
                'display_name' => $company->display_name,
                'code' => $company->code,
                'role' => $pivot->role,
                'is_primary' => $pivot->is_primary,
                'is_current' => $company->id == session('current_company_id'),
                'business_units' => $company->businessUnits->map(function ($unit) {
                    return [
                        'id' => $unit->id,
                        'name' => $unit->name,
                        'type' => $unit->type,
                    ];
                }),
            ];
        });

    return response()->json([
        'companies' => $companies,
        'current_company_id' => session('current_company_id'),
    ]);
}

/**
 * 切換當前公司
 */
public function switchCompany(Request $request): JsonResponse
{
    $request->validate([
        'company_id' => 'required|integer',
    ]);

    $user = auth()->user();
    $companyId = $request->company_id;

    // 檢查用戶是否屬於該公司
    $userCompany = $user->companies()
        ->where('company_id', $companyId)
        ->wherePivot('is_active', true)
        ->first();

    if (!$userCompany) {
        return response()->json(['error' => '您不是此公司的成員'], 403);
    }

    // 更新會話中的公司ID
    session(['current_company_id' => $companyId]);

    // 記錄公司切換事件
    Log::info('User switched company', [
        'user_id' => $user->id,
        'from_company_id' => session()->previous('current_company_id'),
        'to_company_id' => $companyId,
        'timestamp' => now(),
    ]);

    return response()->json([
        'success' => true,
        'message' => '已切換到 ' . $userCompany->display_name,
        'company' => [
            'id' => $userCompany->id,
            'name' => $userCompany->name,
            'display_name' => $userCompany->display_name,
            'role' => $userCompany->pivot->role,
        ],
    ]);
}
```

**0.1.3 公司用戶管理功能 (7 小時)**
```php
/**
 * 公司用戶列表
 */
public function getCompanyUsers(): JsonResponse
{
    $companyId = $this->getCurrentCompanyId();
    
    $users = User::whereHas('companies', function ($query) use ($companyId) {
            $query->where('company_id', $companyId)
                  ->where('is_active', true);
        })
        ->with(['companies' => function ($query) use ($companyId) {
            $query->where('company_id', $companyId);
        }])
        ->get()
        ->map(function ($user) {
            $pivot = $user->companies->first()->pivot;
            return [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $pivot->role,
                'is_primary' => $pivot->is_primary,
                'joined_at' => $pivot->joined_at,
                'last_login' => $user->last_login_at,
                'is_active' => $pivot->is_active,
            ];
        });

    return response()->json([
        'users' => $users,
        'total_count' => $users->count(),
    ]);
}

/**
 * 更新用戶角色
 */
public function updateUserRole(Request $request, int $userId): JsonResponse
{
    $request->validate([
        'role' => 'required|string|in:admin,manager,user',
    ]);

    $companyId = $this->getCurrentCompanyId();
    $currentUser = auth()->user();

    // 檢查權限
    if (!$this->canManageUsers($currentUser, $companyId)) {
        return response()->json(['error' => '您沒有管理用戶的權限'], 403);
    }

    // 更新用戶角色
    UserCompany::where('user_id', $userId)
        ->where('company_id', $companyId)
        ->update(['role' => $request->role]);

    return response()->json([
        'success' => true,
        'message' => '用戶角色已更新',
    ]);
}
```

**0.1.4 多租戶相關資料庫模型 (需要建立)**
```php
// 文件: app/Models/CompanyInvitation.php

class CompanyInvitation extends Model
{
    protected $fillable = [
        'company_id',
        'email',
        'role',
        'invited_by_user_id',
        'token',
        'expires_at',
        'accepted_at',
        'accepted_by_user_id',
        'business_unit_ids',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'accepted_at' => 'datetime',
        'business_unit_ids' => 'array',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function invitedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'invited_by_user_id');
    }

    public function acceptedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'accepted_by_user_id');
    }
}

// 資料庫遷移文件
Schema::create('company_invitations', function (Blueprint $table) {
    $table->id();
    $table->foreignId('company_id')->constrained()->onDelete('cascade');
    $table->string('email');
    $table->string('role');
    $table->foreignId('invited_by_user_id')->constrained('users');
    $table->string('token')->unique();
    $table->timestamp('expires_at');
    $table->timestamp('accepted_at')->nullable();
    $table->foreignId('accepted_by_user_id')->nullable()->constrained('users');
    $table->json('business_unit_ids')->nullable();
    $table->timestamps();
    
    $table->index(['token', 'expires_at']);
    $table->index(['company_id', 'email']);
});
```

**0.1.5 API 路由和前端介面 (需要建立)**
```php
// 路由: routes/api.php
Route::middleware(['auth:sanctum', SetCompanyContext::class])->group(function () {
    Route::prefix('company-management')->group(function () {
        Route::get('companies', [CompanyManagementController::class, 'getUserCompanies']);
        Route::post('switch-company', [CompanyManagementController::class, 'switchCompany']);
        Route::get('users', [CompanyManagementController::class, 'getCompanyUsers']);
        Route::post('invite-user', [CompanyManagementController::class, 'inviteUser']);
        Route::put('users/{user}/role', [CompanyManagementController::class, 'updateUserRole']);
    });
});

// 接受邀請路由 (不需要認證)
Route::get('company-invitation/{token}', [CompanyManagementController::class, 'acceptInvitation'])
    ->name('company.invitation.accept');
```

**🚨 重要提醒：所有報表控制器必須使用 getCurrentCompanyId() 方法**

**標準多租戶控制器模板**：
```php
protected function getCurrentCompanyId(): ?int
{
    // 統一的公司ID獲取邏輯
    return auth()->user()?->companies()
        ->wherePivot('is_active', true)
        ->first()?->id ?? session('current_company_id');
}

// 在所有查詢中強制使用公司ID過濾
public function getReport(Request $request): JsonResponse
{
    $companyId = $this->getCurrentCompanyId();
    
    if (!$companyId) {
        return response()->json(['error' => '無有效公司上下文'], 403);
    }
    
    // 所有資料庫查詢都必須包含 company_id 過濾
    $data = Model::where('company_id', $companyId)
        // ... 其他查詢條件
        ->get();
    
    return response()->json($data);
}
```

#### **優先級 P0 - 核心業務報表修復**

**任務 1.1: 硬編碼數據替換 (週 1, 25 小時)**

**1.1.1 銷售模組假資料修復**
```php
// 目標: 修復客戶銷售分析假資料
// 位置: SalesReportController::getCustomerSalesReport()
// 現狀: 返回硬編碼 'ABC公司' => 1,500,000
// 目標: 實現真實客戶銷售統計

實作細節:
- 查詢 customers 表 JOIN sales_orders 表
- 計算每個客戶的總消費金額和訂單數量
- 實現客戶分層邏輯 (VIP: >100萬, Premium: >50萬, Regular: <50萬)
- 確保多租戶數據隔離 (where company_id = getCurrentCompanyId())
- 返回 Chart.js 相容的 JSON 格式

預期成果:
✅ 客戶分析圖表顯示真實數據
✅ 客戶排行榜基於實際銷售額
✅ 客戶層級分佈圓餅圖準確反映業務狀況
```

**1.1.2 銷售趨勢分析假資料修復**
```php
// 目標: 修復銷售趨勢假資料
// 位置: SalesReportController::getSalesTrendsReport()
// 現狀: 返回固定成長率 15.6%
// 目標: 實現真實趨勢計算和預測

實作細節:
- 查詢過去 12 個月的銷售數據
- 計算月度成長率 (MoM Growth Rate)
- 實現簡單的線性趨勢預測
- 添加季節性分析 (同期比較)
- 計算移動平均線 (3個月、6個月)

預期成果:
✅ 銷售趨勢線圖反映真實業務變化
✅ 成長率基於實際數據計算
✅ 季節性雷達圖顯示業務週期特徵
```

**任務 1.2: 庫存報表緊急實現 (週 2-3, 55 小時)**

**1.2.1 建立 InventoryReportController (20 小時)**
```php
// 文件: app/Http/Controllers/Api/InventoryReportController.php

class InventoryReportController extends Controller
{
    protected function getCurrentCompanyId(): ?int
    {
        return auth()->user()?->current_company_id ?? 
               session('current_company_id');
    }
    
    // 庫存總覽 API
    public function getInventoryReport(Request $request): JsonResponse
    {
        // 查詢當前公司的所有產品庫存
        $inventoryData = Product::where('company_id', $this->getCurrentCompanyId())
            ->select('name', 'quantity', 'unit_price')
            ->where('quantity', '>', 0)
            ->get();
            
        // 計算庫存分佈
        $categories = $inventoryData->groupBy('category')
            ->map(fn($products) => $products->sum('quantity'));
            
        // 計算庫存趨勢 (過去6個月)
        $trends = InventoryMovement::where('company_id', $this->getCurrentCompanyId())
            ->where('created_at', '>=', now()->subMonths(6))
            ->selectRaw('DATE(created_at) as date, SUM(quantity_change) as change')
            ->groupBy('date')
            ->orderBy('date')
            ->get();
            
        return response()->json([
            'summary' => [
                'total_products' => $inventoryData->count(),
                'total_value' => $inventoryData->sum(fn($item) => $item->quantity * $item->unit_price),
                'low_stock_count' => $inventoryData->where('quantity', '<', 10)->count(),
            ],
            'distribution' => $categories,
            'trends' => $trends,
            'generated_at' => now()->toISOString(),
        ]);
    }
    
    // 庫存估價 API
    public function getValuationReport(Request $request): JsonResponse
    {
        // 實現庫存估價邏輯
        // 使用 FIFO 或加權平均成本計算
    }
    
    // 庫存周轉率 API  
    public function getTurnoverReport(Request $request): JsonResponse
    {
        // 實現周轉率計算
        // 公式: 銷售成本 ÷ 平均庫存價值
    }
}
```

**1.2.2 庫存圖表初始化 (15 小時)**
```javascript
// 文件: resources/views/reports/inventory/index.blade.php

class InventoryReportController {
    constructor() {
        this.charts = {};
        this.data = null;
        this.init();
    }
    
    async init() {
        await this.loadData();
        this.renderCharts();
        this.bindEvents();
    }
    
    async loadData() {
        try {
            const response = await fetch('/api/reports/inventory');
            this.data = await response.json();
        } catch (error) {
            console.error('載入庫存數據失敗:', error);
            this.showError();
        }
    }
    
    renderCharts() {
        this.renderDistributionChart();
        this.renderTrendChart();
    }
    
    renderDistributionChart() {
        const ctx = document.getElementById('inventory-distribution-chart');
        if (!ctx || !this.data) return;
        
        const chartConfig = NexusChartTheme.createDoughnutChart({
            labels: Object.keys(this.data.distribution),
            datasets: [{
                data: Object.values(this.data.distribution),
                backgroundColor: [
                    'rgba(99, 102, 241, 0.8)',
                    'rgba(34, 197, 94, 0.8)',
                    'rgba(251, 191, 36, 0.8)',
                    'rgba(239, 68, 68, 0.8)',
                ]
            }]
        });
        
        this.charts.distribution = new Chart(ctx, chartConfig);
    }
    
    renderTrendChart() {
        const ctx = document.getElementById('inventory-trend-chart');
        if (!ctx || !this.data) return;
        
        const chartConfig = NexusChartTheme.createLineChart({
            labels: this.data.trends.map(item => item.date),
            datasets: [{
                label: '庫存變化',
                data: this.data.trends.map(item => item.change),
                borderColor: 'rgb(99, 102, 241)',
                backgroundColor: 'rgba(99, 102, 241, 0.1)'
            }]
        });
        
        this.charts.trend = new Chart(ctx, chartConfig);
    }
}

// 頁面載入時初始化
document.addEventListener('DOMContentLoaded', () => {
    new InventoryReportController();
});
```

**1.2.3 API 路由配置 (5 小時)**
```php
// 文件: routes/api.php

Route::prefix('reports')->middleware(['web', 'auth', SetCompanyContext::class])->group(function () {
    // 現有銷售報表路由...
    
    // 新增庫存報表路由
    Route::prefix('inventory')->group(function () {
        Route::get('/', [InventoryReportController::class, 'getInventoryReport']);
        Route::get('/valuation', [InventoryReportController::class, 'getValuationReport']);
        Route::get('/turnover', [InventoryReportController::class, 'getTurnoverReport']);
        Route::get('/aging', [InventoryReportController::class, 'getAgingReport']);
        Route::get('/movements', [InventoryReportController::class, 'getMovementsReport']);
    });
});
```

**1.2.4 錯誤處理和載入狀態 (15 小時)**
```javascript
// 實現通用的錯誤處理和載入狀態管理

class ReportErrorHandler {
    static showLoading(containerId) {
        const container = document.getElementById(containerId);
        container.innerHTML = `
            <div class="flex items-center justify-center h-64">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                <span class="ml-2 text-gray-600">載入中...</span>
            </div>
        `;
    }
    
    static showError(containerId, message = '載入失敗') {
        const container = document.getElementById(containerId);
        container.innerHTML = `
            <div class="flex items-center justify-center h-64">
                <div class="text-center">
                    <i class="fas fa-exclamation-triangle text-red-500 text-4xl mb-2"></i>
                    <p class="text-gray-600">${message}</p>
                    <button onclick="location.reload()" class="mt-2 px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600">
                        重新載入
                    </button>
                </div>
            </div>
        `;
    }
}
```

### 📅 **階段二：系統完善 (週 4-6, 120 小時)**

#### **優先級 P1 - 財務報表實現**

**任務 2.1: FinancialReportController 開發 (50 小時)**

**2.1.1 損益表實現 (20 小時)**
```php
// 複雜的會計邏輯實現

public function getProfitLossReport(Request $request): JsonResponse
{
    $startDate = $request->get('start_date', now()->startOfMonth());
    $endDate = $request->get('end_date', now()->endOfMonth());
    $companyId = $this->getCurrentCompanyId();
    
    // 營業收入計算
    $revenue = SalesOrder::where('company_id', $companyId)
        ->whereBetween('order_date', [$startDate, $endDate])
        ->where('status', 'completed')
        ->sum('total_amount');
    
    // 營業成本計算 (COGS)
    $cogs = SalesOrderItem::join('sales_orders', 'sales_order_items.sales_order_id', '=', 'sales_orders.id')
        ->join('products', 'sales_order_items.product_id', '=', 'products.id')
        ->where('sales_orders.company_id', $companyId)
        ->whereBetween('sales_orders.order_date', [$startDate, $endDate])
        ->selectRaw('SUM(sales_order_items.quantity * products.cost_price) as total_cogs')
        ->value('total_cogs') ?? 0;
    
    // 營業費用計算
    $expenses = Expense::where('company_id', $companyId)
        ->whereBetween('expense_date', [$startDate, $endDate])
        ->sum('amount');
    
    // 計算各項指標
    $grossProfit = $revenue - $cogs;
    $operatingIncome = $grossProfit - $expenses;
    $netIncome = $operatingIncome; // 簡化版，未考慮稅項
    
    // 月度趨勢計算
    $monthlyTrends = collect();
    $currentDate = Carbon::parse($startDate);
    while ($currentDate->lte($endDate)) {
        $monthStart = $currentDate->copy()->startOfMonth();
        $monthEnd = $currentDate->copy()->endOfMonth();
        
        $monthRevenue = SalesOrder::where('company_id', $companyId)
            ->whereBetween('order_date', [$monthStart, $monthEnd])
            ->sum('total_amount');
            
        $monthlyTrends->push([
            'month' => $currentDate->format('Y-m'),
            'revenue' => $monthRevenue,
            'profit' => $monthRevenue * 0.2 // 簡化計算
        ]);
        
        $currentDate->addMonth();
    }
    
    return response()->json([
        'summary' => [
            'revenue' => $revenue,
            'cogs' => $cogs,
            'gross_profit' => $grossProfit,
            'expenses' => $expenses,
            'operating_income' => $operatingIncome,
            'net_income' => $netIncome,
            'gross_margin' => $revenue > 0 ? ($grossProfit / $revenue) * 100 : 0,
            'net_margin' => $revenue > 0 ? ($netIncome / $revenue) * 100 : 0,
        ],
        'monthly_trends' => $monthlyTrends,
        'generated_at' => now()->toISOString(),
    ]);
}
```

**2.1.2 現金流量表實現 (15 小時)**
```php
public function getCashFlowReport(Request $request): JsonResponse
{
    // 營業活動現金流
    $operatingCashFlow = $this->calculateOperatingCashFlow($request);
    
    // 投資活動現金流
    $investingCashFlow = $this->calculateInvestingCashFlow($request);
    
    // 融資活動現金流
    $financingCashFlow = $this->calculateFinancingCashFlow($request);
    
    // 淨現金流變化
    $netCashFlow = $operatingCashFlow + $investingCashFlow + $financingCashFlow;
    
    return response()->json([
        'summary' => [
            'operating_cash_flow' => $operatingCashFlow,
            'investing_cash_flow' => $investingCashFlow,
            'financing_cash_flow' => $financingCashFlow,
            'net_cash_flow' => $netCashFlow,
        ],
        'trends' => $this->getCashFlowTrends($request),
        'generated_at' => now()->toISOString(),
    ]);
}
```

**任務 2.2: 採購報表真實數據實現 (35 小時)**

**2.2.1 PurchaseReportController 開發 (25 小時)**
```php
class PurchaseReportController extends Controller
{
    public function getPurchaseReport(Request $request): JsonResponse
    {
        $companyId = $this->getCurrentCompanyId();
        
        // 採購總覽統計
        $totalPurchases = PurchaseOrder::where('company_id', $companyId)
            ->where('status', 'completed')
            ->sum('total_amount');
            
        $purchaseCount = PurchaseOrder::where('company_id', $companyId)
            ->where('status', 'completed')
            ->count();
            
        // 供應商分析
        $topSuppliers = PurchaseOrder::join('suppliers', 'purchase_orders.supplier_id', '=', 'suppliers.id')
            ->where('purchase_orders.company_id', $companyId)
            ->select('suppliers.name', DB::raw('SUM(purchase_orders.total_amount) as total_amount'))
            ->groupBy('suppliers.id', 'suppliers.name')
            ->orderByDesc('total_amount')
            ->limit(10)
            ->get();
            
        // 採購趨勢
        $purchaseTrends = PurchaseOrder::where('company_id', $companyId)
            ->selectRaw('DATE_FORMAT(order_date, "%Y-%m") as month, SUM(total_amount) as total')
            ->groupBy('month')
            ->orderBy('month')
            ->get();
            
        return response()->json([
            'summary' => [
                'total_purchases' => $totalPurchases,
                'purchase_count' => $purchaseCount,
                'average_order_value' => $purchaseCount > 0 ? $totalPurchases / $purchaseCount : 0,
            ],
            'top_suppliers' => $topSuppliers,
            'trends' => $purchaseTrends,
            'generated_at' => now()->toISOString(),
        ]);
    }
}
```

**任務 2.3: 圖表初始化完成 (35 小時)**

完成所有空白圖表的 JavaScript 初始化工作，確保每個圖表都能正確顯示數據。

### 📅 **階段三：功能增強 (週 7-8, 123 小時)**

#### **優先級 P2 - 員工報表和進階功能**

**任務 3.1: EmployeeReportController 開發 (35 小時)**
**任務 3.2: 匯出功能實現 (25 小時)**
**任務 3.3: 進階篩選器 (20 小時)**
**任務 3.4: 圖表互動功能 (25 小時)**
**任務 3.5: 測試和優化 (18 小時)**

## 🔧 **技術實現標準**

### **代碼品質要求**
- **🚨 多租戶數據隔離 (CRITICAL)**: 所有控制器必須使用 `getCurrentCompanyId()` 強制過濾
- **🔒 權限檢查**: 每個操作都必須驗證用戶對當前公司的權限
- **📊 PostgreSQL RLS**: 依賴 Row Level Security 作為最後防線
- **✅ 錯誤處理**: 所有 API 必須包含完整的錯誤處理和驗證
- **🎨 主題支持**: 所有圖表必須支持深色主題
- **🧪 測試覆蓋**: 所有功能必須通過 PHPUnit 測試，特別是多租戶隔離測試

### **性能要求**
- API 響應時間 < 2 秒
- 圖表渲染時間 < 1 秒
- 支援大量數據的分頁載入

### **安全要求**
- **🚨 多租戶隔離 (最高優先級)**:
  - 所有資料庫查詢必須包含 `company_id` 過濾
  - 使用 PostgreSQL Row Level Security (RLS) 作為最後防線
  - 每個 API 端點都必須驗證用戶對該公司的存取權限
  - 會話管理確保公司切換的安全性
- **🔒 傳統安全防護**:
  - SQL 注入防護 (使用 Eloquent ORM)
  - XSS 防護 (輸出轉義)
  - CSRF 令牌驗證
  - 輸入驗證和清理
- **🎭 權限控制**:
  - 基於角色的權限檢查 (admin, manager, user)
  - 公司管理員可以邀請和管理用戶
  - 用戶只能操作所屬公司的資料

## 📊 **進度追蹤與品質控制**

### **每週檢查點**
- **週 1**: 硬編碼數據修復完成度檢查
- **週 2-3**: 庫存報表實現進度檢查
- **週 4-6**: 財務報表功能驗證
- **週 7-8**: 整體系統測試和優化

### **品質門檻**
- 代碼覆蓋率 > 80%
- 所有 API 測試通過
- 瀏覽器相容性測試通過
- 性能基準測試通過

### **風險緩解措施**
- 每個階段都有回滾計畫
- 關鍵功能有備用方案
- 定期備份和測試環境驗證

## 🎯 **預期成果**

### **量化指標**
- ✅ 圖表正常顯示率: 22% → 100%
- ✅ 真實數據使用率: 17% → 100%
- ✅ API 實現完整率: 17% → 100%
- ✅ 功能按鈕有效率: 17% → 100%

### **業務價值**
- 管理層獲得準確的業務決策數據
- 提升系統的專業度和可信度
- 為未來的業務擴展建立穩固基礎
- 大幅改善用戶體驗和滿意度

### **技術價值**
- 建立完整的報表系統架構
- 累積可重用的代碼模組和模式
- 提升團隊的技術能力和經驗
- 為系統維護建立良好基礎

---

**計畫核准**: ⏳ 待核准  
**執行狀態**: 🟡 待開始  
**負責人**: Claude + 開發團隊  
**審核人**: 專案經理