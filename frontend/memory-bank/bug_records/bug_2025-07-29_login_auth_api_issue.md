# Bug 記錄 - 登入成功但客戶管理頁面授權失敗

## 📅 基本資訊
- **發現日期**：2025-07-29
- **任務 ID**：登入功能測試驗證
- **嚴重程度**：中等
- **狀態**：已發現，待修復

## 🐛 問題描述
使用 Playwright MCP 進行實際瀏覽器測試時發現：
1. 登入功能基本正常，能成功使用憑證 `test@example.com` / `password123` 登入
2. 登入後成功重定向到儀表板頁面（`/dashboard`）
3. 但是訪問客戶管理頁面（`/customers`）時顯示 "Authorization header required" 錯誤

## 🔄 重現步驟
1. 訪問登入頁面：`http://127.0.0.1:8000/login`
2. 填寫正確的登入憑證：
   - Email: test@example.com
   - Password: password123
3. 成功登入並重定向到儀表板
4. 導航到客戶管理頁面：`http://127.0.0.1:8000/customers`
5. 頁面顯示 "Authorization header required" 錯誤訊息

## 🔍 根本原因分析
這是一個前後端認證機制不一致的問題：
1. **Laravel 會話認證**：登入功能正常，使用 Laravel 的會話認證機制
2. **API 認證問題**：客戶管理頁面可能使用 AJAX 調用後端 Go API，但缺少必要的 Authorization header
3. **認證機制混用**：前端使用 Laravel 會話，但 API 調用需要 JWT token 或其他認證方式

## 🛠️ 解決方法建議

### 方案 1：統一使用 Laravel 會話認證
```php
// 在客戶管理相關的 API 路由中使用 web 中介軟體
Route::middleware(['web', 'auth'])->group(function () {
    Route::get('/customers', [CustomerController::class, 'index']);
    // 其他客戶相關路由
});
```

### 方案 2：實作 API Token 機制
```javascript
// 在前端 AJAX 請求中加入 CSRF token 或 API token
$.ajaxSetup({
    headers: {
        'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content'),
        'Authorization': 'Bearer ' + getApiToken()
    }
});
```

### 方案 3：檔查 Go 後端 API 認證設定
- 確認 Go 後端是否正確處理 Laravel 的會話認證
- 檢查跨域請求的 cookie 傳遞設定

## 🚫 預防措施
1. **統一認證策略**：確保前後端使用一致的認證機制
2. **完整測試**：每次認證相關變更都要測試完整的使用者流程
3. **API 文件**：明確記錄所有 API 端點的認證需求
4. **錯誤處理**：改善錯誤訊息，提供更明確的問題指引

## 📁 相關檔案
- 登入路由：`routes/web.php`
- 客戶管理控制器：可能在後端 Go 服務中
- 前端客戶管理頁面：需要檢查 AJAX 請求設定
- 認證中介軟體：Laravel 的 auth 中介軟體和 Go 後端的認證機制

## 🧪 測試證據
- **登入頁面截圖**：`screenshots/01-login-page.png`
- **登入成功截圖**：`screenshots/03-after-login.png` - 顯示成功重定向到儀表板
- **客戶頁面錯誤截圖**：`screenshots/04-customers-page.png` - 顯示 "Authorization header required" 錯誤

## 🧠 知識庫更新
已記錄到 memory-bank，需要在以下文件中建立交叉引用：
- [ ] `systemPatterns.md` - 認證機制模式
- [ ] `techContext.md` - 前後端整合問題  
- [ ] `progress.md` - 測試發現記錄

## 📊 測試統計
- **Playwright 測試執行時間**：8.5秒
- **測試案例**：2個（有效登入、無效登入）
- **測試結果**：2個通過，但發現功能問題
- **截圖記錄**：5張測試截圖

## 🎯 後續行動建議
1. **立即修復**：檢查客戶管理頁面的 API 認證設定
2. **全面檢查**：測試其他需要認證的頁面是否有相同問題
3. **文件更新**：明確記錄認證機制的使用方式
4. **測試擴展**：建立更完整的認證相關測試案例

## ✅ 驗證標準
修復完成後需要通過以下驗證：
- [ ] 登入後能正常訪問客戶管理頁面
- [ ] 客戶列表能正常載入和顯示
- [ ] 不再出現 "Authorization header required" 錯誤
- [ ] 其他需要認證的頁面也能正常工作