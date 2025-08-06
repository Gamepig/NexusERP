# NexusERP 商品編輯庫存欄位 Bug 記錄

## 🐛 問題描述

**日期**: 2025-07-27  
**狀態**: 待修復  
**嚴重程度**: 中等  
**任務 ID**: 商品編輯功能修復的最後階段

### 具體問題

在商品編輯功能修復過程中，發現庫存相關欄位無法正常保存：

- ❌ **初始庫存數量** (`stock_quantity`): 編輯後仍顯示 "0"，無法保存用戶輸入值
- ❌ **低庫存警告值** (`low_stock_threshold`): 編輯後回到預設值 "10"，無法保存用戶輸入值

### 測試案例

**測試產品**: ID 837 "測試產品 API修復完成版"  
**測試步驟**: 
1. 進入編輯頁面 `/products/837/edit`
2. 修改 `stock_quantity` 為 "100"
3. 修改 `low_stock_threshold` 為 "20" 
4. 提交表單
5. 重新載入編輯頁面檢查

**預期結果**: 庫存欄位顯示修改後的值  
**實際結果**: 庫存欄位回到原始值

## 🔍 已排查的技術細節

### 資料庫 Schema 分析
- ✅ `products` 表確實有 `stock_quantity` 欄位 (integer, default 0)
- ✅ `products` 表確實有 `minimum_stock` 欄位 (integer, default 0)
- ✅ 表結構正常，無約束問題

### 後端 API 分析 (`ProductController.php`)

**update 方法欄位映射**:
```php
// 已修復的映射邏輯
if (isset($validatedData['low_stock_threshold'])) {
    $validatedData['minimum_stock'] = $validatedData['low_stock_threshold'];
    unset($validatedData['low_stock_threshold']);
}

// stock_quantity 處理邏輯
if (isset($validatedData['stock_quantity'])) {
    // 保留 stock_quantity，讓它正常更新
}
```

**show 方法欄位映射**:
```php
if (isset($productData['minimum_stock'])) {
    $productData['low_stock_threshold'] = $productData['minimum_stock'];
}
```

### 前端表單分析 (`form.blade.php`)
- ✅ 表單欄位名稱正確: `stock_quantity`, `low_stock_threshold`
- ✅ FormData 提交邏輯正常
- ✅ POST + _method=PUT 方式正常運作

## ✅ 已修復的問題

1. **PUT + FormData 兼容性**: 改用 POST + _method=PUT ✅
2. **欄位名稱映射**: 修復 frontend ↔ backend 欄位對應 ✅  
3. **文件上傳錯誤**: 修復 file input 類型檢查 ✅
4. **基本欄位編輯**: SKU、名稱、價格等完全正常 ✅

## 🔧 需要進一步排查的方向

### 1. 資料庫操作驗證
- 檢查 Laravel Model 的 `$fillable` 屬性是否包含庫存欄位
- 驗證資料庫連接和事務處理
- 檢查是否有觸發器或其他約束影響

### 2. 表單數據流追蹤
- 使用 `Log::info()` 追蹤提交的原始數據
- 驗證 `$validatedData` 陣列內容
- 確認 `$product->update()` 的實際執行結果

### 3. 快取或Session 問題
- 檢查是否有應用級快取影響
- 驗證表單 CSRF token 和 session 狀態

## 📝 建議的修復步驟

1. **添加調試日志**: 在 `ProductController::update` 中添加詳細日志
2. **驗證 Model 配置**: 檢查 `Product.php` model 的設定
3. **資料庫直接測試**: 使用 Tinker 或直接 SQL 驗證更新操作
4. **表單數據驗證**: 確認前端提交的數據格式

## 🚀 成功案例參考

其他欄位 (SKU, name, price) 的編輯完全正常，可作為參考模式。

**測試驗證**: 
- SKU: "TEST-API-FIX-001" → "TEST-API-FIX-FINAL" ✅
- Name: "測試產品 API修復" → "測試產品 API修復完成版" ✅  
- Price: "99.99" → "199.99" ✅