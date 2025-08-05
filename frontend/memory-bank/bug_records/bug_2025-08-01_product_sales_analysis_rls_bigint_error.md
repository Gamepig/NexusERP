# Bug 記錄 - 產品銷售分析頁面 PostgreSQL RLS bigint 空字符串錯誤

## 📅 基本資訊
- **發現日期**：2025-08-01
- **任務 ID**：Product Sales Analysis Page Issue Investigation
- **嚴重程度**：高 (核心報表功能完全無法使用)
- **狀態**：分析中 - 需要更深層的 RLS 政策修復
- **影響範圍**：產品銷售分析報表 (`/reports/sales/by-product`)

## 🐛 問題描述
產品銷售分析頁面完全無法載入，顯示「載入產品銷售報表失敗」錯誤訊息。API 端點 `/api/reports/sales/by-product` 回傳 HTTP 500 錯誤。

### 實際測試結果 (使用 Playwright MCP)
```
Product Sales API Status: 500
API Response: {"error":"無法載入產品銷售報表","message":"SQLSTATE[22P02]: Invalid text representation: 7 ERROR: invalid input syntax for type bigint: \"\" (Connection: pgsql, SQL: select \"p\".\"id\" as \"product_id\", \"p\".\"name\" as \"product_name\", \"pc\".\"name\" as \"category_name\", SUM(soi.quantity) as quantity_sold, SUM(soi.total_price) as total_sales, AVG(soi.unit_price) as average_price from \"sales_order_items\" as \"soi\" inner join \"sales_orders\" as ..."}
```

## 🔄 重現步驟
1. 用戶成功登入系統
2. 導航至 `/reports/sales/by-product` 或調用 API `/api/reports/sales/by-product`
3. 系統立即回傳 500 錯誤
4. 錯誤發生在複雜的 JOIN 查詢執行時

## 🔍 根本原因分析

### 技術深度分析
1. **PostgreSQL RLS 政策問題的系統性特徵**：
   - 錯誤：`SQLSTATE[22P02]: Invalid text representation: 7 ERROR: invalid input syntax for type bigint: ""`
   - 這與先前修復的儀表板問題類似，但更加深層
   - 問題出現在多表 JOIN 查詢中，每個表的 RLS 政策都會被觸發

2. **多層級 RLS 政策衝突**：
   - `sales_order_items` 表有 RLS 政策
   - `sales_orders` 表有 RLS 政策  
   - `products` 表有 RLS 政策
   - `product_categories` 表有 RLS 政策
   - 當進行 JOIN 操作時，所有表的 RLS 政策同時被觸發

3. **會話變數狀態問題**：
   - `current_setting('app.current_company_id', true)` 在某些情況下返回空字符串 `""`
   - PostgreSQL 嘗試進行 `""::bigint` 轉換時失敗
   - 即使在 `SetCompanyContext` 中間件中進行了 NULLIF 處理，某些 RLS 政策仍然遇到空字符串

### 嘗試的修復方案分析

#### ✅ 成功的修復嘗試
1. **SalesReportController::getCurrentCompanyId() 方法修復**：
   ```php
   // 使用 NULLIF 處理空字符串
   $result = DB::selectOne("SELECT NULLIF(current_setting('app.current_company_id', true), '') as company_id");
   ```

2. **方法級會話變數清理**：
   ```php
   // 在方法開始時確保會話變數不是空字符串
   DB::statement("SELECT set_config('app.current_company_id', NULLIF(current_setting('app.current_company_id', true), ''), true)");
   ```

#### ❌ 失敗的修復嘗試
1. **Laravel Query Builder 方式**：
   - 使用 `DB::table()` 和 `join()` 方法
   - 仍然觸發所有表的 RLS 政策，導致相同錯誤

2. **原生 SQL 查詢方式**：
   - 使用 `DB::select()` 直接執行 SQL
   - 即使繞過 Laravel Query Builder，PostgreSQL RLS 政策仍然被觸發
   - 顯示問題比預期更深層

### 問題的系統性特徵
- **影響範圍**：所有涉及多表 JOIN 的複雜查詢
- **觸發條件**：PostgreSQL 會話變數 `app.current_company_id` 為空字符串狀態
- **時機特徵**：在認證用戶進行複雜報表查詢時發生

## 🛠️ 已實施的修復措施

### 1. getCurrentCompanyId() 方法修復
**檔案**: `app/Http/Controllers/Api/SalesReportController.php`
```php
private function getCurrentCompanyId(): ?int
{
    try {
        // 🔧 修復：確保會話變數不會是空字符串，避免 PostgreSQL bigint 轉換錯誤
        // 使用 NULLIF 處理空字符串，就像 memory-bank 中記錄的修復方案
        $result = DB::selectOne("SELECT NULLIF(current_setting('app.current_company_id', true), '') as company_id");
        
        if ($result && $result->company_id) {
            $companyId = (int) $result->company_id;
            // ... 其餘邏輯
        }
    }
}
```

### 2. 方法級會話變數預防性清理
**檔案**: `app/Http/Controllers/Api/SalesReportController.php`
```php
public function getProductSalesReport(Request $request): JsonResponse
{
    try {
        // 🔧 預防性修復：確保資料庫會話變數不是空字符串
        try {
            DB::statement("SELECT set_config('app.current_company_id', NULLIF(current_setting('app.current_company_id', true), ''), true)");
        } catch (\Exception $e) {
            Log::warning('Failed to sanitize session variable', ['error' => $e->getMessage()]);
        }
        // ... 其餘邏輯
    }
}
```

### 3. 原生 SQL 查詢實作 (仍然失敗)
嘗試使用直接 SQL 查詢繞過 Laravel Query Builder：
```php
$productsSql = "
    SELECT 
        p.id as product_id,
        p.name as product_name,
        pc.name as category_name,
        SUM(soi.quantity) as quantity_sold,
        SUM(soi.total_price) as total_sales,
        AVG(soi.unit_price) as average_price
    FROM sales_order_items soi
    INNER JOIN sales_orders so ON soi.sales_order_id = so.id
    INNER JOIN products p ON soi.product_id = p.id
    LEFT JOIN product_categories pc ON p.category_id = pc.id
    WHERE so.business_unit_id = ?
    AND so.order_date BETWEEN ? AND ?
    AND so.status != 'cancelled'
    GROUP BY p.id, p.name, pc.name
    ORDER BY total_sales DESC
    LIMIT 20
";

$productsResult = DB::select($productsSql, $sqlParams);
```

**結果**: 仍然產生相同的 `SQLSTATE[22P02]` 錯誤，顯示問題在 PostgreSQL RLS 政策層級。

## 🚫 尚未解決的核心問題

### RLS 政策層級的系統性問題
1. **多表 RLS 政策同時觸發**：
   - 每個表的 RLS 政策都包含類似的會話變數檢查
   - 在 JOIN 查詢中，所有相關表的 RLS 政策都會被評估
   - 任何一個表的 RLS 政策遇到空字符串都會導致整個查詢失敗

2. **PostgreSQL 系統層級的會話變數管理**：
   - 即使在 Laravel 層級進行了 NULLIF 處理，PostgreSQL 底層的會話變數狀態可能仍然存在問題
   - 需要更深層的資料庫會話管理機制

3. **RLS 政策設計問題**：
   - 現有的 RLS 政策可能需要重新設計以更好地處理空值情況
   - 需要統一的 RLS 政策模式來避免類似問題

## 🔧 建議的解決方案

### 1. 短期解決方案 (優先級：高)
**禁用產品銷售查詢的 RLS 政策驗證**：
```sql
-- 臨時禁用相關表的 RLS 政策，僅針對特定查詢
SET row_security = off;
-- 執行查詢
-- 重新啟用 RLS
SET row_security = on;
```

### 2. 中期解決方案 (優先級：中)
**更新所有相關 RLS 政策以統一處理空值**：
```sql
-- 更新所有表的 RLS 政策，使用一致的 NULLIF 處理
ALTER POLICY policy_name ON table_name 
USING (column_id = COALESCE(NULLIF(current_setting('app.current_company_id', true), '')::bigint, column_id));
```

### 3. 長期解決方案 (優先級：高)
**重新設計 RLS 架構**：
- 實作統一的 RLS 政策管理服務
- 建立更robust的會話變數管理機制
- 加強 PostgreSQL 會話狀態的一致性驗證

## 📁 相關檔案
- `app/Http/Controllers/Api/SalesReportController.php:177-280` - 主要修復位置
- `app/Http/Middleware/SetCompanyContext.php` - 會話變數設定
- 各種資料庫表的 RLS 政策 - 需要統一更新

## 🧪 測試結果記錄

### Playwright MCP 測試結果
```
測試執行時間: 2025-08-01 12:08:36
測試腳本: product-sales-fix-verification.spec.js

結果:
- API 狀態: 500 (失敗)
- 錯誤訊息: SQLSTATE[22P02]: Invalid text representation: 7 ERROR: invalid input syntax for type bigint: ""
- 頁面載入: 失敗，顯示錯誤訊息
- 修復效果: 無效果，問題依然存在
```

### 測試證據
- 截圖: `fix-verification-01-login-success.png`
- 截圖: `fix-verification-02-page-loaded.png`  
- 截圖: `fix-verification-03-final-state.png`

## 🧠 知識庫更新
- [x] 已建立詳細的 bug 記錄檔案
- [x] 已記錄所有嘗試的修復方案和結果
- [x] 已記錄實際測試結果和證據
- [ ] 需要更新 systemPatterns.md 中的 RLS 政策模式
- [ ] 需要建立 PostgreSQL RLS 最佳實踐文檔

## 📊 影響評估
- **功能影響**: 產品銷售分析報表完全無法使用
- **用戶體驗**: 報表頁面顯示錯誤訊息，影響業務決策
- **系統穩定性**: 可能影響其他涉及複雜 JOIN 查詢的功能
- **資料完整性**: 無直接影響，主要是查詢執行問題

## 📝 後續行動項目
1. **🔴 緊急**: 實作臨時的 RLS 繞過解決方案
2. **🟡 重要**: 系統性檢查所有 RLS 政策的空值處理
3. **🟢 改進**: 建立統一的 RLS 政策管理框架
4. **🔵 監控**: 建立會話變數狀態監控機制

## 📈 成功標準
- [ ] API `/api/reports/sales/by-product` 返回 HTTP 200
- [ ] 產品銷售分析頁面正常顯示資料
- [ ] 不再出現 `SQLSTATE[22P02]` 錯誤
- [ ] 其他類似的複雜查詢功能正常運作

---

**記錄時間**: 2025-08-01 20:00  
**記錄負責人**: Claude Code  
**驗證狀態**: 問題已確認，解決方案待實施  
**優先級**: 高 - 影響核心業務功能