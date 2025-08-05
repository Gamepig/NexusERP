# Bug 記錄 - 銷售訂單出貨庫存計算錯誤

## 📅 基本資訊
- **發現日期**：2025-08-02
- **任務 ID**：stock-calc-fix
- **嚴重程度**：高
- **狀態**：已解決

## 🐛 問題描述
銷售訂單出貨功能出現庫存檢查不一致的問題：
- **前端顯示**：商品「測試產品 15」顯示庫存數量 25
- **出貨錯誤**：點擊出貨時返回 422 錯誤，提示「商品 測試產品 15 庫存不足，無法出貨（可用庫存：0，需要：5）」
- **API 端點**：`POST /api/sales-orders/7266/ship` 返回錯誤

## 🔄 重現步驟
1. 進入銷售訂單出貨頁面 (`/orders/sales/{orderId}/ship`)
2. 觀察產品「測試產品 15」顯示可用庫存為 25
3. 設定出貨數量為 5（小於顯示庫存）
4. 點擊「確認出貨」按鈕
5. 系統返回 422 錯誤，提示庫存不足（可用庫存：0）

## 🔍 根本原因分析
通過實際數據庫測試發現問題根源：

### 前端庫存查詢邏輯
- **API 端點**：`/api/inventory/levels?product_id={productId}`
- **邏輯問題**：取第一個倉庫的庫存數據 (`result.data[0]`)
- **實際情況**：產品 857（測試產品 15）在倉庫 60（預設倉庫）有 25 個庫存

### 後端出貨檢查邏輯
- **檔案位置**：`SalesOrderController.php:507-521`
- **邏輯問題**：硬編碼只檢查倉庫 ID=53（台北總倉）
- **實際情況**：倉庫 53 沒有該產品的庫存記錄，返回 0

### 數據庫驗證結果
```sql
-- 產品 857 的實際庫存分布
Product 857 (測試產品 15):
Warehouse 60 (預設倉庫): Available=25, OnHand=25, Reserved=0

-- 倉庫 53 檢查結果  
Warehouse 53 (台北總倉): No inventory record found for product 857
```

## 🛠️ 解決方法

### 1. 修復後端庫存檢查邏輯
**檔案**：`frontend/app/Http/Controllers/Api/SalesOrderController.php`

**修改前**：硬編碼檢查單一倉庫
```php
$warehouseId = 53; // 硬編碼台北總倉
$inventoryLevel = DB::table('inventory_levels')
    ->where('product_id', $item->product_id)
    ->where('warehouse_id', $warehouseId)
    ->first();
```

**修改後**：檢查所有倉庫總庫存
```php
// 檢查所有倉庫的總庫存是否足夠
$totalAvailableStock = DB::table('inventory_levels')
    ->where('product_id', $item->product_id)
    ->sum('quantity_available');

// 獲取該產品有庫存的倉庫（按庫存數量降序排列）
$availableWarehouses = DB::table('inventory_levels')
    ->where('product_id', $item->product_id)
    ->where('quantity_available', '>', 0)
    ->orderBy('quantity_available', 'desc')
    ->get();
```

### 2. 實現跨倉庫庫存扣除
支援從多個倉庫按順序扣除庫存，並為每個倉庫記錄詳細的庫存交易。

### 3. 統一前端庫存查詢
**檔案**：`frontend/routes/api.php`

**修改後**：返回所有倉庫的總庫存
```php
// 獲取該產品在所有倉庫的庫存匯總
$inventorySummary = DB::table('inventory_levels as il')
    ->join('products as p', 'il.product_id', '=', 'p.id')
    ->where('il.product_id', $productId)
    ->select([
        DB::raw('SUM(il.quantity_available) as total_quantity_available'),
        // ... 其他匯總欄位
    ])
    ->groupBy('il.product_id', 'p.name', 'p.sku')
    ->first();
```

## 🚫 預防措施

### 1. 架構層面改進
- **統一庫存查詢服務**：建立統一的庫存查詢服務類，避免前後端使用不同邏輯
- **移除硬編碼**：避免在業務邏輯中硬編碼特定倉庫 ID
- **配置化倉庫選擇**：將預設倉庫設定移至配置檔案

### 2. 測試改進
- **跨倉庫測試**：建立多倉庫環境的測試案例
- **庫存一致性測試**：確保前後端庫存計算邏輯一致
- **邊界條件測試**：測試庫存不足、跨倉庫扣除等場景

### 3. 程式碼審查標準
- **庫存相關程式碼**：需特別審查庫存計算邏輯的一致性
- **硬編碼檢查**：禁止在業務邏輯中硬編碼倉庫、產品等 ID
- **API 一致性**：確保相關 API 端點使用相同的計算邏輯

## 📁 相關檔案
- **控制器**：`frontend/app/Http/Controllers/Api/SalesOrderController.php:472-583`
- **API 路由**：`frontend/routes/api.php:170-218`
- **前端頁面**：`frontend/resources/views/orders/sales/shipping.blade.php:235-276`
- **錯誤 API**：`POST /api/sales-orders/{id}/ship`

## 🧠 知識庫更新
- [x] 已建立 bug 記錄檔案
- [x] 已更新 systemPatterns.md 加入多倉庫庫存模式
- [x] 已更新 techContext.md 加入庫存計算最佳實踐
- [x] 已更新 progress.md 記錄問題解決進度

## 📊 影響評估
- **使用者影響**：所有多倉庫環境的銷售訂單出貨功能
- **數據影響**：無數據遺失，修復後正常運作
- **系統影響**：提升了跨倉庫庫存管理的準確性和靈活性

## ✅ 驗證結果
修復後系統行為：
- 前端顯示所有倉庫的總庫存量
- 後端檢查所有倉庫的總庫存是否足夠
- 支援從多個倉庫按優先順序扣除庫存
- 為每個倉庫的庫存變動記錄詳細交易記錄

**修復狀態**：✅ 已完成並測試