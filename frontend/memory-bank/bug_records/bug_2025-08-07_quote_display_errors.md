# Bug 記錄 - NexusERP 報價單顯示錯誤

## 📅 基本資訊
- **發現日期**：2025-08-07
- **任務 ID**：Task 72 (NexusERP multi-step quote form)
- **嚴重程度**：高
- **狀態**：✅ 已解決 (3/4問題完全修復, 1問題確認為後端問題)

## 🐛 問題描述
用戶報告報價單系統有三個核心顯示錯誤：
1. **報價單號格式錯誤** - 顯示 "QT-019" 而非正確格式
2. **產品名稱錯誤** - 顯示 "Unknown Product" 而非實際產品名稱  
3. **狀態欄位錯誤** - 用戶選擇 "已發送" 但資料庫儲存 "draft"

## 🔄 重現步驟
1. 進入報價單詳細頁面
2. 觀察報價單號顯示格式
3. 檢查產品名稱是否正確顯示
4. 進入編輯頁面，檢查產品名稱是否正確載入
5. 新增報價單時選擇 "已發送" 狀態，檢查資料庫實際儲存值

## 🔍 根本原因分析

### 問題 1: 報價單號格式錯誤 ✅
**根本原因**: `show.blade.php` 使用計算格式而非API返回數據
- **檔案位置**: `resources/views/quotes/show.blade.php:10, 52`
- **錯誤邏輯**: 使用 `'QT-' . str_pad($quoteId, 3, '0', STR_PAD_LEFT)` 而非 `$quote['quote_number']`

### 問題 2: 產品名稱顯示錯誤 ✅  
**根本原因**: Go API返回報價項目時缺少產品名稱 (缺少JOIN查詢)
- **檔案位置**: `QuoteController.php:841-911`
- **錯誤邏輯**: Go API只返回product_id，未JOIN products表獲取名稱

### 問題 3: 編輯頁面產品名稱載入錯誤 ✅
**根本原因**: Alpine.js初始化時未載入既有報價項目資料
- **檔案位置**: `multi-step-form.blade.php:456-466`
- **錯誤邏輯**: 無論創建或編輯模式都使用相同空白項目初始化

### 問題 4: 狀態欄位寫入錯誤 ❌ (後端問題)
**根本原因**: Go API後端有硬編碼業務邏輯強制覆蓋狀態
- **測試證據**: Laravel正確發送 `status: "sent"`，Go API強制儲存為 `status: "draft"`
- **需要修改**: Go後端API代碼

## 🛠️ 解決方法

### 修復 1: 報價單號顯示 ✅
```php
// 修改 resources/views/quotes/show.blade.php
// 舊代碼: 
<h1>Quote #QT-{{ str_pad($quoteId, 3, '0', STR_PAD_LEFT) }}</h1>

// 新代碼:
<h1>Quote #{{ $quote['quote_number'] ?? $quoteId }}</h1>
```

### 修復 2: 產品名稱顯示 ✅
```php
// 修改 QuoteController.php normalizeQuoteData 方法
private function normalizeQuoteData($quote): array
{
    // 為缺少名稱的items獲取產品資訊
    foreach ($quote['items'] as $item) {
        if (empty($item['name']) && !empty($item['product_id'])) {
            $productResponse = $this->callGoAPI("/api/products/{$item['product_id']}");
            if ($productResponse->successful()) {
                $productData = $productResponse->json();
                $item['name'] = $productData['name'] ?? 'Unknown Product';
            }
        }
    }
    return $normalizedData;
}
```

### 修復 3: 編輯頁面產品載入 ✅
```javascript
// 修改 multi-step-form.blade.php Alpine.js 初始化
items: @json(isset($quote) && isset($quote['items']) && is_array($quote['items']) && count($quote['items']) > 0 
    ? array_map(function($item) {
        return [
            'id' => $item['id'] ?? uniqid(),
            'name' => $item['name'] ?? $item['product_name'] ?? '',
            'quantity' => (float)($item['quantity'] ?? 1),
            'unit_price' => (float)($item['unit_price'] ?? 0),
            'product_id' => $item['product_id'] ?? null,
            // ... 其他欄位
        ];
    }, $quote['items'])
    : [/* 預設空白項目 */])
```

### 問題 4: 狀態覆蓋問題 ❌
**需要Go後端開發者修復**: 移除強制設定 status="draft" 的邏輯

## 🚫 預防措施

1. **API數據完整性檢查**: 實作API返回數據的完整性驗證
2. **編輯模式測試**: 為編輯功能建立專門的測試案例  
3. **狀態流程文檔**: 建立完整的狀態變更流程文檔
4. **前後端協作**: 建立API數據格式的明確規範

## 📁 相關檔案
- `resources/views/quotes/show.blade.php:10,52` - 報價單號顯示修復
- `app/Http/Controllers/Web/QuoteController.php:841-911` - 產品名稱API修復  
- `resources/views/quotes/multi-step-form.blade.php:456-480` - 編輯初始化修復
- `debug/quote-data-issues/debug_actual_form_submission.php` - 狀態問題調試腳本

## 🧠 知識庫更新
- ✅ 已建立 bug 記錄檔案  
- ✅ 已確認問題模式和解決方案
- ✅ 已建立調試方法和工具
- ✅ 已透過Playwright驗證修復結果

## 🎯 測試驗證結果

**Playwright MCP 測試結果**:
- ✅ 報價單號顯示: 修復成功 - 顯示 "QT2025000014" 格式
- ✅ 產品名稱顯示: 修復成功 - 無"Unknown Product"錯誤
- ✅ 編輯頁面載入: 修復成功 - 正確載入既有產品資料
- ❌ 狀態覆蓋: 確認為Go API後端問題，需要後端修復

**修復成功率**: 3/4 問題完全解決 (75%)

---
**最後更新**: 2025-08-07 19:16  
**超級思考四階段分析**: Phase 1-4 全部完成  
**狀態**: ✅ 前端問題已完全解決，後端問題已明確識別