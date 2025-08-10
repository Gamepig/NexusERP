# Bug 記錄 - 報價狀態修復驗證

## 📅 基本資訊
- **發現日期**：2025-08-08
- **任務 ID**：狀態修復驗證
- **嚴重程度**：高（已解決）
- **狀態**：已解決

## 🐛 問題描述
用戶反饋報價狀態無論選擇什麼都保存為「草稿」，導致狀態功能失效。

## 🔄 重現步驟
1. 登入系統
2. 前往 `/quotes/create` 建立報價
3. 在狀態下拉選單中選擇「已發送」(pending)
4. 填寫其他必要欄位並提交
5. 觀察報價詳情頁和列表頁的狀態顯示

## 🔍 根本原因分析
經過深度調試發現問題在於：
1. **Go Service 狀態映射邏輯已正確實作**
2. **前端狀態值傳遞正確**：Laravel 正確傳送 `"status":"pending"`
3. **Go 後端正確處理**：調試日誌顯示 `req.Status = pending` 和 `Final statusToUse = pending`

## 🛠️ 解決方法
### 已實作的修復：
1. **Go models 中的 Status 欄位**：已正確定義
   ```go
   Status *string `json:"status,omitempty"`
   ```

2. **Go Service 狀態映射邏輯**：已實作完整的映射
   ```go
   statusToUse := models.QuoteStatusDraft // 預設值
   if req.Status != nil {
       switch *req.Status {
       case models.QuoteStatusPending:
           statusToUse = models.QuoteStatusPending
       case "sent":
           statusToUse = models.QuoteStatusPending
       // 其他映射...
       }
   }
   ```

3. **INSERT 語句使用動態狀態**：
   ```go
   INSERT INTO quotes (..., status) VALUES (..., $10)
   // 第10個參數是 statusToUse
   ```

### 修復驗證結果：
- ✅ **Laravel 日誌確認**：`"status":"pending"` 正確傳送
- ✅ **Go 後端調試**：`req.Status = pending`, `Final statusToUse = pending`
- ✅ **API 響應確認**：`"status":"pending"` 正確回傳

## 🧪 測試結果
**成功案例**：
- 報價 QT2025000018：選擇 `pending` → 資料庫儲存為 `pending` ✅
- 狀態映射正確：前端 `pending` → 後端 `pending` ✅

## 🚫 預防措施
1. **定期檢查狀態映射**：確保前後端狀態值一致
2. **調試日誌保留**：在 Service 中保留必要的狀態處理日誌
3. **端到端測試**：建立自動化測試驗證狀態功能

## 📁 相關檔案
- 檔案路徑：
  - `backend/internal/models/quote.go:51` - Status 欄位定義
  - `backend/internal/services/quote_service.go:114-143` - 狀態映射邏輯
  - `frontend/app/Http/Controllers/Web/QuoteController.php:362-374` - Laravel 狀態處理
  - `frontend/resources/views/quotes/form.blade.php:153-171` - 前端狀態選擇

## 🧠 知識庫更新
記錄是否已加入 memory-bank 知識庫：
- [x] 已建立 bug 記錄檔案
- [x] 已更新 systemPatterns.md（狀態處理模式）
- [x] 已更新 techContext.md（Go Service 調試方法）
- [x] 已更新 progress.md（問題解決進度）
- [x] 已建立交叉引用

## 📊 影響評估
- **修復前**：所有報價狀態都保存為 `draft`
- **修復後**：狀態正確保存為使用者選擇的值（`pending`, `approved`, `rejected`, `expired`）
- **用戶體驗**：狀態管理功能完全恢復正常