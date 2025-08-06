# Task 14 銷售訂單管理系統 - 關鍵問題修復計畫

## 📅 問題發現時間
2025-07-27 (透過 Playwright-mcp 完整測試)

## 🚨 問題摘要
雖然 TaskMaster 顯示 Task 14 已完成，但實際測試發現 3 個阻塞性問題導致核心功能無法使用。

## ❌ 發現的關鍵問題

### 1. 產品載入失敗 (阻塞性 - 優先級：緊急)
- **影響範圍**: 建立銷售訂單功能完全無法使用
- **具體現象**: `/orders/sales/create` 頁面產品下拉選單空白，只顯示"請選擇產品"
- **技術細節**: 產品 API 載入失敗，前端無法獲取產品數據
- **檔案位置**: 
  - 前端: `resources/views/orders/sales/create.blade.php`
  - API: `/api/products` 端點
  - Controller: `app/Http/Controllers/Api/ProductController.php`

### 2. 編輯功能完全失效 (阻塞性 - 優先級：緊急)
- **影響範圍**: 所有銷售訂單編輯功能無法使用
- **具體現象**: `/orders/sales/{id}/edit` 頁面載入失敗，JavaScript 錯誤
- **錯誤訊息**: "Cannot read properties of null (reading 'value')"
- **技術細節**: 編輯頁面 JavaScript 初始化時存在 null reference 錯誤
- **檔案位置**:
  - 前端: `resources/views/orders/sales/edit.blade.php`
  - JavaScript: 內嵌在 Blade 模板中的 JS 代碼

### 3. 庫存數據異常 (阻塞性 - 優先級：緊急)
- **影響範圍**: 出貨功能無法正常執行
- **具體現象**: 出貨頁面所有產品可用庫存顯示為 0
- **技術細節**: `inventory_levels` 表查詢邏輯或數據完整性問題
- **檔案位置**:
  - Controller: `app/Http/Controllers/SalesOrderController.php`
  - 模型: `app/Models/InventoryLevel.php`
  - 出貨頁面: `resources/views/orders/sales/ship.blade.php`

## ✅ 正常運作的功能
- 銷售訂單列表 (100% 正常，顯示 15 筆真實數據)
- 客戶下拉選單載入 (建立頁面正常)
- 基本頁面導航和 UI 介面
- 出貨頁面基本資訊顯示

## 🛠️ 詳細修復計畫

### 階段 1: API 和數據載入修復 (緊急 - 1-2 小時)

#### 1.1 修復產品 API 載入問題
```php
// 檢查項目:
1. 驗證 /api/products 端點是否返回正確格式數據
2. 檢查 ProductController 的回應格式與客戶 API 保持一致
3. 確認前端 JavaScript 正確處理 API 回應
4. 驗證產品表數據完整性

// 預期修復檔案:
- app/Http/Controllers/Api/ProductController.php
- resources/views/orders/sales/create.blade.php (JavaScript 部分)
```

#### 1.2 修復編輯頁面 JavaScript 錯誤
```javascript
// 檢查項目:
1. 識別造成 null reference 的具體變數
2. 添加適當的 null 檢查和錯誤處理
3. 確保表單欄位正確綁定現有訂單數據
4. 驗證產品和客戶下拉選單的數據載入

// 預期修復檔案:
- resources/views/orders/sales/edit.blade.php
- app/Http/Controllers/SalesOrderController.php (edit 方法)
```

#### 1.3 修復庫存查詢邏輯
```sql
-- 檢查項目:
1. 驗證 inventory_levels 表數據完整性
2. 檢查庫存查詢 SQL 語句
3. 確認倉庫和產品關聯關係
4. 驗證 quantity_available 欄位計算邏輯

-- 預期修復檔案:
- app/Models/InventoryLevel.php
- app/Http/Controllers/SalesOrderController.php (ship 方法)
```

### 階段 2: 端對端功能驗證 (重要 - 1 小時)

#### 2.1 完整流程測試
- 使用 Playwright-mcp 重新測試所有修復功能
- 驗證建立→編輯→出貨的完整流程
- 確認庫存減少機制正常運作
- 測試訂單狀態流轉

#### 2.2 數據一致性檢查
- 驗證客戶、產品、庫存數據關聯完整性
- 檢查外鍵約束和數據格式
- 確認 API 回應格式統一性

### 階段 3: 文檔和狀態更新 (標準 - 30 分鐘)

#### 3.1 更新專案記錄
- 更新 TaskMaster 中的 Task 14 狀態和詳情
- 在 `Task-Update.md` 中記錄修復過程
- 更新 Serena MCP 知識庫相關記錄

#### 3.2 建立預防措施
- 添加自動化測試以防止回歸
- 更新開發流程檢查清單
- 記錄問題根本原因分析

## 🎯 成功標準

### 修復完成標準:
1. **產品載入**: 建立頁面產品下拉選單顯示所有可用產品
2. **編輯功能**: 所有訂單編輯頁面正常載入，表單數據正確顯示
3. **庫存顯示**: 出貨頁面正確顯示實際可用庫存數量
4. **端對端測試**: 完整的建立→編輯→出貨流程無錯誤運行

### 驗證方法:
- 使用 Playwright-mcp 進行完整功能測試
- 手動驗證 API 端點回應
- 檢查瀏覽器控制台無 JavaScript 錯誤
- 確認資料庫數據變更正確

## 📊 預估工作量
- **總時間**: 2.5-3.5 小時
- **關鍵路徑**: API 修復 → JavaScript 錯誤修復 → 庫存邏輯修復 → 完整測試
- **風險評估**: 中等 (主要是前端 JavaScript 和數據查詢邏輯問題)

## 🔗 相關檔案和資源

### 主要修復檔案:
- `app/Http/Controllers/Api/ProductController.php`
- `app/Http/Controllers/SalesOrderController.php`
- `resources/views/orders/sales/create.blade.php`
- `resources/views/orders/sales/edit.blade.php`
- `resources/views/orders/sales/ship.blade.php`
- `app/Models/InventoryLevel.php`

### 測試和驗證:
- Playwright-mcp 自動化測試腳本
- API 端點手動測試 (`/api/products`, `/api/customers`)
- 瀏覽器開發者工具除錯

### 參考文檔:
- TaskMaster Task 14 詳細需求
- 現有的 memory-bank 記錄
- `documents/claude_code_rules.md` 開發規範

---

**重要提醒**: 這些問題說明 Task 14 實際上尚未完全完成，需要立即修復才能達到真正的 "done" 狀態。修復完成後需要重新進行完整的 Playwright-mcp 測試驗證。