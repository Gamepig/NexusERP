# Bug 記錄 - 銷售訂單編輯表單數據預填問題

## 📅 基本資訊
- **發現日期**: 2025-07-28
- **任務 ID**: 修復銷售訂單表單數據預設顯示問題
- **嚴重程度**: 高
- **狀態**: 部分解決，仍有時序問題

## 🐛 問題描述
銷售訂單編輯表單存在以下數據預填問題：
1. **客戶選擇未預填** - 所有訂單的客戶下拉選單都顯示"請選擇客戶"而非實際客戶
2. **產品項目部分未預填** - 大部分產品選擇器顯示"請選擇產品"，只有最後1-2個項目正確預填
3. **數量和價格正常** - 所有項目的數量和單價都正確載入

## 🔄 重現步驟
1. 登入系統 (test@example.com / password123)
2. 前往銷售訂單列表頁面
3. 點擊任一訂單的"修改訂單"按鈕
4. 觀察表單中的客戶選擇和產品項目預填情況

## 🔍 根本原因分析

### ✅ 已確認正常的部分
1. **後端數據載入完全正常**:
   - Controller 正確載入: company_id=77, customers=8, products=18, order_customer_id=937
   - 資料庫數據完整: 客戶937存在且屬於公司77，所有訂單項目都有完整產品數據
   - 路由配置正確: 使用 SalesOrderController::edit 而非閉包

2. **前端數據傳遞正常**:
   - Blade 模板正確接收後端數據
   - 產品選擇器正確載入對應公司的產品列表
   - JavaScript 能正確讀取後端傳遞的數據

### ❌ 問題根本原因 - 時序競爭問題
**控制台日誌證據**:
```javascript
// 客戶預填失敗
設定客戶ID: 937 實際值: (空白) // 客戶選項尚未載入完成

// 產品預填部分成功
設定項目數據: {product_id: 843, quantity: 3.00, unit_price: 824.00}
產品選擇器選項數量: 19
設定產品ID: 843 實際值: 843 // 設定成功

// 但最終表單檢查顯示
項目 1: 產品 ID="" // 被後續操作清空
項目 4: 產品 ID="833" // 最後一個保持正確
```

**時序問題詳細分析**:
1. **頁面重複載入**: populateServerData() 被調用兩次，第二次覆蓋第一次結果
2. **客戶選項載入延遲**: 設定客戶值時，客戶選項尚未完成載入
3. **產品項目異步衝突**: 前面的產品選擇被後續的 addItem 操作重置

## 🛠️ 已嘗試的解決方法

### 1. 修復後端數據載入
- **修改前**: 使用 `session('app.current_company_id')` (值為 null)
- **修改後**: 從訂單客戶獲取 company_id，fallback 到 user_companies 表
- **結果**: ✅ 後端數據載入完全正常

### 2. 修復路由配置
- **問題**: 路由緩存導致控制器未被調用
- **解決**: 執行 `php artisan route:clear`
- **結果**: ✅ 控制器正確被調用

### 3. 調整預填時序
- **修改**: 增加 setTimeout 延遲從 50ms 到 100ms
- **添加**: 詳細的控制台日誌用於診斷
- **結果**: ❌ 時序問題仍然存在

## 📁 相關檔案和程式碼位置

### 後端檔案
- **控制器**: `/Users/gamepig/projects/NexusERP/frontend/app/Http/Controllers/Web/SalesOrderController.php:50-130`
  - `edit()` 方法: 正確載入公司數據和訂單信息
  - 資料查詢: customers, products, sales_order, sales_order_items

### 前端檔案  
- **模板**: `/Users/gamepig/projects/NexusERP/frontend/resources/views/orders/sales/form.blade.php`
  - 第274行: `populateServerData()` 調用
  - 第440行: `populateServerData()` 函數定義
  - 第383行: `populateCustomerSelect()` 函數
  - 第524行: `addItem()` 函數和產品預填邏輯

### 路由配置
- **路由**: `/Users/gamepig/projects/NexusERP/frontend/routes/modules/orders.php:22`
  - `Route::get('/{id}/edit', [SalesOrderController::class, 'edit'])->name('edit')`

## 📊 測試數據和證據

### 資料庫數據驗證
```sql
-- 訂單7246的完整數據
ORDER: id=7246, customer_id=937, company_id=77
CUSTOMER: id=937, name="Test Company 客戶 3", company_id=77  
ITEMS: 4個項目，產品ID: 843, 856, 832, 833 (全部有效)
```

### 前端執行日誌
```javascript
// 成功設定但被重置的產品
設定產品ID: 843 實際值: 843 → 最終結果: ""
設定產品ID: 856 實際值: 856 → 最終結果: ""  
設定產品ID: 832 實際值: 832 → 最終結果: ""
設定產品ID: 833 實際值: 833 → 最終結果: "833" ✅
```

## 🚫 未解決的核心問題

### 1. 客戶預填時序問題
- **現象**: 客戶ID正確傳遞但選項未載入完成
- **需求**: 確保客戶選項載入完成後再設定預填值

### 2. 產品項目重複處理問題  
- **現象**: 產品成功設定後被後續操作清空
- **需求**: 防止重複調用和異步衝突

### 3. 頁面重複載入問題
- **現象**: populateServerData() 被調用兩次
- **需求**: 添加狀態管理避免重複處理

## 💡 建議的解決方案

### 短期解決方案 (緊急修復)
1. **添加載入狀態檢查**: 確保選項載入完成後再設定值
2. **增加重複調用保護**: 使用 flag 防止重複執行
3. **改進異步處理**: 使用 Promise 或 async/await 確保順序

### 長期解決方案 (架構改進)
1. **重構前端數據流**: 統一的狀態管理和數據載入機制
2. **改進組件化設計**: 獨立的客戶選擇和產品項目組件
3. **添加完整的錯誤處理**: 載入失敗時的回退機制

## 🔧 緊急修復程式碼建議

```javascript
// 在 populateServerData() 中添加載入完成檢查
function populateServerData() {
    if (window.dataPopulated) return; // 防止重複調用
    window.dataPopulated = true;
    
    // 等待客戶選項載入完成
    const checkCustomerOptions = () => {
        const customerSelect = document.getElementById('customer_id');
        if (customerSelect.options.length > 1) {
            customerSelect.value = salesOrder.customer_id;
        } else {
            setTimeout(checkCustomerOptions, 50);
        }
    };
    checkCustomerOptions();
}
```

## 🧠 知識庫更新記錄
- [x] 已建立 bug 記錄檔案: `memory-bank/bug_records/bug_20250728_sales_order_form_data_prefill.md`
- [ ] 需更新 `memory-bank/systemPatterns.md` 加入時序處理模式
- [ ] 需更新 `memory-bank/techContext.md` 加入前端數據載入最佳實踐
- [ ] 需更新 `memory-bank/progress.md` 記錄問題解決進度

## 📋 後續行動項目
1. **立即**: 實施緊急修復方案解決時序問題
2. **短期**: 添加完整的單元測試覆蓋數據預填邏輯  
3. **中期**: 重構前端數據載入架構
4. **長期**: 建立組件化的表單管理系統

---
**最後更新**: 2025-07-28 18:50
**當前狀態**: 問題已定位但未完全解決，需要重新開發時繼續修復時序問題