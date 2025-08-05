# Bug 記錄 - 多倉庫庫存系統的數據不一致問題

## 📅 基本資訊
- **發現日期**：2025-08-01
- **任務 ID**：數據一致性測試
- **嚴重程度**：高
- **狀態**：已確認問題

## 🐛 問題描述
用戶在編輯產品頁面輸入庫存數量時，顯示的數據與實際保存的數據不一致。

### 具體症狀
- 用戶輸入庫存數量：290
- 系統回應：更新成功
- 產品列表顯示：490 (比輸入值多 200)

## 🔄 重現步驟
1. 登入系統 (test@example.com)
2. 導航到產品 857 編輯頁面
3. 修改庫存數量為 290，低庫存閾值為 20
4. 點擊「更新商品」
5. 檢查產品列表中的庫存顯示

## 🔍 根本原因分析

### 技術分析
系統採用**多倉庫庫存管理**，但前端編輯界面沒有正確處理多倉庫情況：

#### 資料庫實際狀態 (產品 857)
```
Warehouse 53: quantity_on_hand = 150, reorder_point = 20  
Warehouse 48: quantity_on_hand = 50, reorder_point = 15   
Warehouse 60: quantity_on_hand = 290, reorder_point = 20  (剛更新的倉庫)
總庫存 = 150 + 50 + 290 = 490
```

#### 後端邏輯問題
1. **ProductController::update()** 方法中：
   ```php
   // 獲取預設倉庫ID（使用第一個可用倉庫）
   $defaultWarehouseId = DB::table('warehouses')
       ->where('is_active', 1)
       ->orderBy('id')
       ->value('id');
   ```

2. **只更新單一倉庫**：
   - 系統選擇了倉庫 60 作為預設倉庫
   - 只更新該倉庫的庫存為 290
   - 其他倉庫 (53: 150, 48: 50) 的庫存保持不變

3. **前端顯示總庫存**：
   ```php
   // ProductController::index() 中
   $product->stock_quantity = $product->getTotalStockQuantity(); // 返回所有倉庫加總
   ```

## 🛠️ 解決方法

### 方案 1：前端指定倉庫編輯 (推薦)
- 在編輯頁面加入倉庫選擇器
- 顯示各倉庫的個別庫存
- 允許用戶選擇要編輯的特定倉庫

### 方案 2：總庫存分配邏輯
- 前端輸入總庫存數量
- 後端按比例分配到各倉庫
- 或設定主倉庫承擔差額

### 方案 3：庫存統一管理
- 產品編輯只處理預設倉庫
- 提供獨立的倉庫庫存管理頁面

## 🚫 預防措施
1. **API 文檔說明**：明確說明庫存更新的倉庫邏輯
2. **前端 UI 改進**：顯示倉庫資訊，避免用戶混淆
3. **資料驗證**：加入庫存數據一致性檢查
4. **測試用例**：增加多倉庫場景測試

## 📁 相關檔案
- `/frontend/app/Http/Controllers/Api/ProductController.php:277-315`
- `/frontend/app/Models/Product.php` - `getTotalStockQuantity()` 方法
- `/frontend/resources/views/products/form.blade.php` - 編輯表單

## 🧠 知識庫更新
- [x] 已建立 bug 記錄檔案
- [x] 已確認問題根源
- [ ] 需更新 systemPatterns.md - 多倉庫庫存管理模式
- [ ] 需更新 techContext.md - 前後端庫存數據處理邏輯
- [ ] 需建立修復方案優先級評估

## 📋 測試結果詳情

### API 請求內容 (正確)
```
stock_quantity: 290
low_stock_threshold: 20
```

### API 回應 (成功)
```json
{
  "success": true,
  "message": "產品更新成功",
  "data": {...}
}
```

### 實際數據庫狀態
- 倉庫 60 更新為 290 (正確)
- 其他倉庫保持原值 (問題所在)
- 前端顯示總和 490 (技術上正確，但用戶困惑)

## 🎯 優先修復建議
**高優先級**：此問題直接影響用戶對庫存管理的理解和操作正確性，建議立即處理。

修復選項：
1. **短期**：在編輯頁面加入提示文字說明多倉庫邏輯
2. **中期**：實現倉庫選擇功能
3. **長期**：重新設計庫存管理 UI/UX