# 系統模式與常見問題模式

## 🚨 關鍵問題模式記錄

### 模擬數據殘留問題模式
**問題特徵**：
- 前端頁面顯示硬編碼的測試數據（如 PO-001, PO-002）
- 數據與實際資料庫內容不符
- 新增記錄後列表未更新或顯示舊數據

**識別方法**：
- 檢查 blade 模板中的 `<tr>` 或表格數據是否為靜態 HTML
- 查找硬編碼的測試 ID（PO-001, PROD-001 等模式）
- 確認 JavaScript 是否使用 `fetch()` 動態載入數據

**修復模式**：
1. 將靜態 HTML 表格替換為動態 JavaScript 載入
2. 使用 `fetch('/api/purchase-orders')` 等 API 端點
3. 實現載入狀態、錯誤處理、空數據狀態
4. 確保 API 回傳真實資料庫數據

**已知案例**：
- 採購單列表頁面模擬數據問題（已修復）
- 採購單檢視頁面模擬數據問題（待修復）
- 供應商/產品 API 模擬數據問題（已修復）

### Laravel CSRF 驗證問題模式
**問題特徵**：
- HTTP 419 "CSRF token mismatch" 錯誤
- JSON 請求與 Laravel web middleware 衝突
- 表單提交後重定向到登入頁面

**修復模式**：
1. 確保 API 路由使用 `middleware('web')`
2. JavaScript 請求包含 `X-CSRF-TOKEN` header
3. 使用 `document.querySelector('meta[name="csrf-token"]').getAttribute('content')` 獲取 token

### API 資料結構不匹配模式
**問題特徵**：
- 前端期待簡單陣列，後端回傳分頁結構
- JavaScript 無法正確解析 API 回應
- 頁面顯示空白或錯誤數據

**修復模式**：
```javascript
// 處理分頁 API 回應
const orders = data.data && data.data.data ? data.data.data : (data.data || []);
```

## ⚡ 開發最佳實踐

### 數據載入模式
- 始終使用動態 API 載入，避免靜態 HTML
- 實現完整的狀態管理（載入中、成功、錯誤、空數據）
- 確保 API 與前端數據結構一致

### 錯誤處理模式
- 所有 API 請求都需要 `.catch()` 錯誤處理
- 提供用戶友好的錯誤消息
- 記錄詳細的 console.error 用於調試

### 測試驗證模式
- 每次修復後進行完整功能測試
- 驗證新增、編輯、刪除、檢視所有 CRUD 操作
- 確認繁體中文本地化正確性