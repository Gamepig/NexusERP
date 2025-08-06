# 採購訂單狀態修改問題 - 完整除錯過程記錄

## 問題描述
**用戶反映：** 「新增採購訂單後無法修改狀態，無法從草稿修改成其他狀態，雖然顯示修改完成，但是實際沒有」

## 🔍 除錯過程

### 階段1：初步診斷 (Laravel 模型層)
**發現問題：** Laravel PurchaseOrder 模型中多個方法引用不存在的狀態常數
- `isSubmitted()` 引用 `STATUS_SUBMITTED` (不存在)
- `isCompleted()` 引用 `STATUS_COMPLETED` (不存在)  
- `submit()` 嘗試設定 `STATUS_SUBMITTED` (不存在)
- `updateReceiveStatus()` 嘗試設定 `STATUS_COMPLETED` (不存在)
- `canCancel()` 引用 `STATUS_COMPLETED` (不存在)

**修復：** 將所有引用修正為正確的常數定義

### 階段2：深入調查 (API控制器層)
**發現更深層問題：** Laravel API控制器缺少 status 欄位處理
- `StorePurchaseOrderRequest` 驗證規則中沒有 `status` 欄位
- `store()` 方法強制設定狀態為草稿，忽略用戶輸入
- `update()` 方法完全不處理 `status` 欄位

**關鍵發現：** 錯誤出在資料表欄位未正確建立 - 不是資料庫表結構問題，而是應用層邏輯未正確處理 status 欄位

### 階段3：完整修復 (跨層級解決方案)
1. **請求驗證層**：新增 status 欄位驗證規則
2. **控制器層**：修復 store() 和 update() 方法處理 status 參數
3. **模型層**：修正所有狀態常數引用
4. **UI層**：修復深色模式下待核准狀態文字顏色

## 🛠️ 技術修復詳情

### Laravel Request 驗證修復
```php
// StorePurchaseOrderRequest.php
'status' => [
    'nullable',
    'string',
    'in:draft,pending_approval,approved,partially_received,received,cancelled',
],
```

### API 控制器修復
```php
// PurchaseOrderController.php - store()
'status' => $request->status ?? PurchaseOrder::STATUS_DRAFT,

// PurchaseOrderController.php - update()
'status' => $request->status ?? $purchaseOrder->status,
```

### Laravel 模型常數修復
```php
// 修正前 → 修正後
STATUS_SUBMITTED → STATUS_PENDING_APPROVAL
STATUS_COMPLETED → STATUS_RECEIVED
```

### UI 樣式修復
```php
// 深色模式下待核准狀態文字顏色
'pending_approval' => 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-white'
```

## ✅ 測試驗證結果

### 功能測試
1. **創建時指定狀態**：✅ 可直接創建為 pending_approval
2. **狀態修改**：✅ draft → pending_approval 成功
3. **批准流程**：✅ pending_approval → approved 正常
4. **UI顯示**：✅ 狀態標籤在深色模式下正確顯示白色文字

## 🎯 關鍵學習

### 除錯策略
1. **分層診斷**：從模型層 → 控制器層 → 請求驗證層逐步檢查
2. **實際測試**：不只檢查代碼，更要進行端到端功能測試
3. **根本原因**：表面上是模型常數問題，實際是API層完全未處理 status 欄位

### 系統性問題模式
- **症狀**：前端顯示成功但後端未實際更新
- **表面原因**：模型方法引用錯誤常數
- **根本原因**：API控制器未正確處理用戶輸入的狀態欄位
- **解決方案**：跨層級修復，確保從前端到資料庫的完整數據流

## 📋 預防措施
1. **API設計規範**：確保所有用戶可修改的欄位都在API層正確處理
2. **驗證規則完整性**：Request驗證類必須涵蓋所有業務欄位
3. **常數一致性檢查**：使用工具檢查模型方法中的常數引用
4. **端到端測試**：不只單元測試，更要實際操作測試

## 🔗 相關任務
- TaskMaster Task 10.5: Purchase Order Approval API
- TaskMaster Task 10.7: Purchase Order State Machine Logic
- 兩個任務都需要標記為 done 狀態