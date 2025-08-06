# Bug 記錄 - 採購訂單狀態常數缺失導致狀態修改失敗

## 📅 基本資訊
- **發現日期**：2025-07-26
- **任務 ID**：Task 10.5, Task 10.7 驗證過程中發現
- **嚴重程度**：高
- **狀態**：已解決

## 🐛 問題描述
用戶反應採購訂單狀態無法修改：「新增採購訂單後無法修改狀態，無法從草稿修改成其他狀態，雖然顯示修改完成，但是實際沒有」。

經過系統性診斷發現，Laravel PurchaseOrder 模型中存在多個方法引用不存在的狀態常數，導致狀態相關功能異常。

## 🔄 重現步驟
1. 創建新的採購訂單（預設為 draft 狀態）
2. 嘗試透過前端表單修改狀態為其他值（如 pending_approval）
3. 前端顯示修改成功，但資料庫中狀態實際未更新
4. 呼叫 `isSubmitted()`, `isCompleted()` 等方法時發生錯誤

## 🔍 根本原因分析
**Laravel PurchaseOrder 模型 (app/Models/PurchaseOrder.php) 中的狀態常數不一致：**

### 已定義的狀態常數：
```php
public const STATUS_DRAFT = 'draft';
public const STATUS_PENDING_APPROVAL = 'pending_approval';
public const STATUS_APPROVED = 'approved';
public const STATUS_PARTIALLY_RECEIVED = 'partially_received';
public const STATUS_RECEIVED = 'received';
public const STATUS_CANCELLED = 'cancelled';
```

### 問題方法及引用的不存在常數：
1. **第128行** - `isSubmitted()` 方法引用 `STATUS_SUBMITTED` (不存在)
2. **第196行** - `submit()` 方法嘗試設定 `STATUS_SUBMITTED` (不存在)
3. **第144行** - `isCompleted()` 方法引用 `STATUS_COMPLETED` (不存在)
4. **第294行** - `updateReceiveStatus()` 方法嘗試設定 `STATUS_COMPLETED` (不存在)
5. **第184行** - `canCancel()` 方法引用 `STATUS_COMPLETED` (不存在)

## 🛠️ 解決方法
修正所有引用不存在常數的方法：

### 1. isSubmitted() 方法修正
```php
// 修正前
return $this->status === self::STATUS_SUBMITTED;

// 修正後  
return $this->status === self::STATUS_PENDING_APPROVAL;
```

### 2. submit() 方法修正
```php
// 修正前
$this->status = self::STATUS_SUBMITTED;

// 修正後
$this->status = self::STATUS_PENDING_APPROVAL;
```

### 3. isCompleted() 方法修正
```php
// 修正前
return $this->status === self::STATUS_COMPLETED;

// 修正後
return $this->status === self::STATUS_RECEIVED;
```

### 4. updateReceiveStatus() 方法修正
```php
// 修正前
$this->status = self::STATUS_COMPLETED;

// 修正後
$this->status = self::STATUS_RECEIVED;
```

### 5. canCancel() 方法修正
```php
// 修正前
return !in_array($this->status, [self::STATUS_COMPLETED, self::STATUS_CANCELLED]);

// 修正後
return !in_array($this->status, [self::STATUS_RECEIVED, self::STATUS_CANCELLED]);
```

## 🚫 預防措施
1. **程式碼審核規則強化**：在修改模型常數時，必須檢查所有引用該常數的方法
2. **單元測試覆蓋**：為所有狀態相關方法添加單元測試
3. **IDE 檢查**：使用 PHPStan 或類似工具檢查未定義常數引用
4. **文件同步**：確保前後端狀態定義一致

## 📁 相關檔案
- `frontend/app/Models/PurchaseOrder.php:128, 144, 184, 196, 294`
- `backend/internal/services/purchase_order_service.go:552-574` (狀態機驗證邏輯)
- `frontend/resources/views/orders/purchase/form.blade.php:98-110` (前端狀態選擇)

## 🧪 驗證測試
```bash
# 1. 模型方法測試
php artisan tinker --execute="
  $po = new App\Models\PurchaseOrder();
  $po->status = 'draft';
  echo 'isDraft: ' . ($po->isDraft() ? 'true' : 'false');
  $po->status = 'pending_approval';
  echo 'isSubmitted: ' . ($po->isSubmitted() ? 'true' : 'false');
  $po->status = 'received';
  echo 'isCompleted: ' . ($po->isCompleted() ? 'true' : 'false');
"

# 2. 狀態修改測試  
php artisan tinker --execute="
  $po = App\Models\PurchaseOrder::find(655);
  $po->status = 'draft';
  $po->save();
  $result = $po->submit();
  $po->refresh();
  echo 'Submit test: ' . ($po->status === 'pending_approval' ? 'PASSED' : 'FAILED');
"
```

## 🧠 知識庫更新
- [x] 已建立 bug 記錄檔案
- [x] 已更新 systemPatterns.md 加入狀態常數一致性檢查模式
- [x] 已更新 techContext.md 加入 Laravel 模型狀態管理最佳實踐
- [x] 已更新 progress.md 記錄問題解決進度
- [x] 已建立交叉引用

## 📊 影響範圍
- **前端**：採購訂單狀態修改功能
- **後端**：狀態驗證和轉換邏輯
- **資料庫**：狀態更新操作
- **使用者**：所有使用採購訂單功能的使用者

## ✅ 解決確認
- 所有狀態相關方法正常運作
- 狀態修改功能完全正常
- PHP 語法檢查通過
- 模型測試全部通過