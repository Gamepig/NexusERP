# Bug 記錄 - 銷售訂單計算顯示 $0.00 與搜尋功能錯誤

## 📅 基本資訊
- **發現日期**：2025-07-27
- **任務 ID**：6.11
- **嚴重程度**：高
- **狀態**：已解決
- **解決時間**：約4小時 (包含測試)

## 🐛 問題描述

### 主要問題
1. **銷售訂單計算顯示 $0.00** - 當修改數量或價格時，總額不會更新
2. **客戶電話號碼搜尋失效** - 根據電話號碼搜尋客戶時返回空結果
3. **供應商聯絡人搜尋錯誤** - 根據聯絡人搜尋供應商時返回 500 錯誤

### 症狀表現
- 在銷售訂單表單中輸入或修改數量、單價時，小計和總額保持為 $0.00
- 客戶搜尋框輸入電話號碼無法找到相應記錄
- 供應商搜尋框輸入聯絡人姓名觸發伺服器錯誤

## 🔄 重現步驟

### 銷售訂單計算問題
1. 登入系統：http://127.0.0.1:8000/login (test@example.com / password123)
2. 導航到銷售訂單頁面
3. 填入客戶資訊和產品
4. 修改數量或單價
5. 觀察小計和總額仍顯示 $0.00

### 搜尋功能問題
1. 進入客戶頁面，在搜尋框輸入電話號碼
2. 進入供應商頁面，在搜尋框輸入聯絡人姓名
3. 觀察搜尋結果錯誤

## 🔍 根本原因分析

### 1. JavaScript 虛值條件檢查錯誤
- **檔案**：`/resources/views/sales/orders/form.blade.php` 第 246 行
- **問題**：條件 `if (value)` 將字串 "0" 視為虛值，導致價格為 0 時跳過計算
- **影響**：合法的 0 價格無法觸發重新計算

### 2. 現有項目缺少事件監聽器
- **檔案**：`form.blade.php` 中的 `setupEventListeners()` 函數
- **問題**：事件監聽器只綁定到新增的項目，不包括頁面載入時的現有項目
- **影響**：編輯現有訂單項目時無法觸發重新計算

### 3. 系統架構誤解
- **誤解**：最初假設 Laravel 處理所有後端邏輯
- **實際**：Go 後端 (端口 8082) 處理核心業務邏輯，Laravel 僅為前端
- **影響**：修改錯誤的檔案，延遲問題解決

### 4. Go 後端搜尋查詢缺少欄位
- **檔案**：`customer_service.go` 和 `supplier_service.go`
- **問題**：搜尋查詢不包含電話號碼和聯絡人欄位
- **影響**：特定搜尋條件無法返回正確結果

## 🛠️ 解決方法

### 1. 修復 JavaScript 條件檢查
**檔案**：`/resources/views/sales/orders/form.blade.php`
**行號**：246
```javascript
// 修改前 (錯誤):
if (value) {
    input.value = parseFloat(value).toFixed(2);
}

// 修改後 (正確):
if (value !== '') {
    input.value = parseFloat(value).toFixed(2);
}
```

### 2. 為現有項目添加事件監聽器綁定
**檔案**：`/resources/views/sales/orders/form.blade.php`
**函數**：`setupEventListeners()`
```javascript
function setupEventListeners() {
    // 為所有現有行添加事件監聽器
    document.querySelectorAll('.order-item-row').forEach(row => {
        addRowEventListeners(row);
    });
    
    // 為動態添加的行設定
    document.getElementById('addOrderItem').addEventListener('click', function() {
        // ... 現有程式碼 ...
        addRowEventListeners(newRow);
    });
}
```

### 3. 修復 Go 後端搜尋查詢
**檔案**：`/backend/internal/services/customer_service.go`
**添加電話搜尋能力**：
```go
if search != "" {
    query = query.Where("name ILIKE ? OR email ILIKE ? OR phone ILIKE ? OR address ILIKE ?",
        "%"+search+"%", "%"+search+"%", "%"+search+"%", "%"+search+"%")
}
```

**檔案**：`/backend/internal/services/supplier_service.go`
**添加聯絡人搜尋**：
```go
if search != "" {
    query = query.Where("name ILIKE ? OR email ILIKE ? OR phone ILIKE ? OR address ILIKE ? OR contact_person ILIKE ?",
        "%"+search+"%", "%"+search+"%", "%"+search+"%", "%"+search+"%", "%"+search+"%")
}
```

### 4. 修復 Laravel 與 Go 之間的認證
**檔案**：`/app/Services/ApiService.php`
**確保正確的令牌傳遞**：
```php
private function getHeaders()
{
    $headers = [
        'Accept' => 'application/json',
        'Content-Type' => 'application/json',
    ];

    if ($this->token) {
        $headers['Authorization'] = 'Bearer ' . $this->token;
    }

    return $headers;
}
```

## 🚫 預防措施

### 1. JavaScript 條件檢查最佳實踐
- 對於字串/數字驗證，使用明確比較而非虛值檢查
- 更好的做法：`value !== ''` 而非 `if (value)`
- 在處理表單數值時，考慮 "0" 是有效值

### 2. 事件綁定完整性
- 必須處理現有元素（頁面載入時）和動態添加的元素
- 分離關注點：一個函數綁定事件，重複使用於兩種情況
- 總是測試新增和編輯記錄的情況

### 3. 系統架構理解
- 在修改之前總是驗證哪個組件處理特定功能
- 本案例：Laravel (前端) → Go API (後端業務邏輯)
- 不要僅基於檔案結構做假設

### 4. 全面測試方法
- 僅手動測試會遺漏邊界案例
- 自動化測試 (Playwright) 一致地捕捉問題
- 測試資料設定對可靠測試至關重要

## 📁 相關檔案

### 主要修改檔案
1. `/resources/views/sales/orders/form.blade.php` - 前端計算邏輯
2. `/backend/internal/services/customer_service.go` - 客戶搜尋後端
3. `/backend/internal/services/supplier_service.go` - 供應商搜尋後端
4. `/app/Services/ApiService.php` - API 通訊層
5. `/tests/e2e/sales-order.spec.js` - Playwright 測試套件

### 關鍵修改行號
- form.blade.php:246 - 修復虛值檢查
- form.blade.php:280-295 - 添加 setupEventListeners 函數
- customer_service.go:45-48 - 添加電話到搜尋查詢
- supplier_service.go:45-48 - 添加聯絡人到搜尋查詢

## 🧪 測試方法

### Playwright 自動化測試
```javascript
test('sales order calculations work correctly', async ({ page }) => {
    // 測試登入
    await page.goto('http://127.0.0.1:8000/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    
    // 測試計算
    await page.fill('input[name="order_items[0][quantity]"]', '5');
    await page.fill('input[name="order_items[0][unit_price]"]', '10.50');
    
    // 驗證總額
    await expect(page.locator('#orderTotal')).toHaveText('52.50');
});
```

### 驗證測試案例
- 基本計算：數量 × 單價 = 小計
- 多項目總和計算
- 邊界案例：價格為 0、負數
- 客戶電話號碼搜尋
- 供應商聯絡人搜尋

## ✅ 驗證結果
- ✅ 銷售訂單計算正常運作
- ✅ 修改數量或價格時總額立即更新
- ✅ 客戶電話號碼搜尋功能正常
- ✅ 供應商聯絡人搜尋功能正常
- ✅ 所有自動化測試通過

## 🧠 知識庫更新

### 系統模式更新
- JavaScript 虛值條件檢查模式
- 事件監聽器綁定模式 (現有 + 動態元素)
- 雙系統架構模式 (Laravel + Go)

### 技術解決方案更新
- 表單計算邏輯修復方法
- Go 查詢優化技術
- API 認證處理模式

### 進度記錄更新
- Task 6.11 完整解決記錄
- 相關組件影響分析
- 後續優化建議

## 🔗 交叉引用
- 相關任務：6.11 (修復銷售訂單計算)
- 相關組件：採購訂單可能有類似問題
- 依賴項：客戶和供應商服務
- 相關知識：systemPatterns.md, techContext.md

## 📈 後續建議

### 1. 程式碼品質改進
- 為 JavaScript 計算函數添加單元測試
- 實作 API 失敗的適當錯誤處理
- 考慮在後端添加計算驗證

### 2. 文件與架構
- 明確記錄雙系統架構
- 為計算問題調試添加日誌記錄

### 3. 相關模組檢查
- 檢查採購訂單是否有類似計算問題
- 驗證其他表單的事件綁定邏輯

### 4. 性能優化
- 考慮計算結果快取
- 優化搜尋查詢性能

## 📊 影響分析

### 業務影響
- **嚴重程度**：高 - 核心功能受損
- **用戶體驗**：重大改善
- **數據準確性**：顯著提升

### 技術債務
- 需要系統性檢查類似的虛值條件問題
- 事件綁定模式需要標準化
- API 錯誤處理需要統一

---
*解決完成時間：2025-07-27*
*解決總時間：約4小時（包含測試）*
*測試覆蓋率：自動化測試 + 手動驗證*
*影響範圍：銷售管理模組、客戶管理、供應商管理*