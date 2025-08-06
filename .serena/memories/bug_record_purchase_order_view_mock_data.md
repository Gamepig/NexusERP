# Bug 記錄 - 採購訂單檢視頁面使用模擬數據

## 📅 基本資訊
- **發現日期**：2025-07-25
- **任務 ID**：相關任務 #21, #23
- **嚴重程度**：高
- **狀態**：已發現，待修復

## 🐛 問題描述
採購訂單檢視頁面顯示模擬數據而非真實資料庫數據，違反專案核心規則。

**用戶反饋**：「採購訂單檢視頁面數據不對，不能使用模擬數據」

## 🔄 重現步驟
1. 前往採購單列表頁面 http://127.0.0.1:8000/orders/purchase
2. 點擊任一採購單的「檢視」連結
3. 進入檢視頁面後觀察顯示的數據
4. 發現數據為模擬數據而非真實資料庫內容

## 🔍 根本原因分析
採購單檢視頁面可能使用以下問題模式之一：
- 前端模板包含硬編碼的模擬數據
- 路由未正確連接到 PurchaseOrderController::show() 方法
- JavaScript 未使用動態 API 載入數據
- 檢視頁面仍使用靜態 HTML 而非動態載入

## 🛠️ 解決方法
**預期修復步驟**：
1. 檢查 `resources/views/orders/purchase/show.blade.php` 檔案
2. 確認路由 `/orders/purchase/{id}` 處理方式
3. 驗證 API 端點 `/api/purchase-orders/{id}` 是否正常
4. 實作動態數據載入機制
5. 替換所有模擬數據為 API 呼叫
6. 測試與驗證修復結果

## 🚫 預防措施
- 建立程式碼審查檢查清單，確保無模擬數據殘留
- 在 CI/CD 流程中加入模擬數據檢測
- 制定明確的資料來源規範文件
- 定期進行全系統模擬數據掃描

## 📁 相關檔案
- 檔案路徑：resources/views/orders/purchase/show.blade.php
- 檔案路徑：routes/modules/orders.php:52-53
- 檔案路徑：app/Http/Controllers/Api/PurchaseOrderController.php:187-206
- 相關任務 ID：#21（列表頁面模擬數據已修復）, #23（檢視頁面待修復）

## 🧠 知識庫更新
- 已建立 bug 記錄檔案
- 需更新 systemPatterns.md 加入模擬數據檢測模式
- 需更新 techContext.md 記錄採購單檢視頁面架構
- 需更新 progress.md 記錄問題發現與修復進度