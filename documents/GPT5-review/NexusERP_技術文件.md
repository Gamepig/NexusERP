## 技術文件（工程團隊）

### 1. 系統架構與技術棧
- 前端: Laravel 10 + Blade + Vite、JS（Chart.js、Web Speech API）、Playwright（E2E）
- 後端: Go/Gin（主）、sqlx、Redis、JWT、Zap；另有 Fiber PoC 子專案 `nexus-erp-go-fiber/`
- 資料庫: PostgreSQL（RLS 行級安全，多租戶隔離）、JSONB、索引策略
- 容器: Docker Compose（API/Postgres/Redis/Nginx/Adminer/MailHog）

### 2. 檔案結構（重點目錄）
- `backend/internal/handlers/`：REST 控制器（auth/inventory/sales/reports/ocr/...）
- `backend/internal/services/`：業務服務層（product/sales_order/ocr/report/...）
- `backend/migrations`：SQL 遷移（多租戶/索引/RLS）
- `frontend/routes/api.php`：前端 API Proxy/直連 DB 報表/庫存資料聚合（臨時）
- `frontend/app/Services/`：Go 後端整合（`ApiService.php`, `SimpleGoJWTService.php`, `ReportApiService.php`）
- `documents/`：PRD、API 規格、RLS/安全/部署/測試報告
- `memory-bank/`：`systemPatterns.md`, `techContext.md`, `progress.md`, `bug_records/*`

### 3. API 與資料流（摘錄）
- 認證（Go）: `/api/auth/login|refresh|logout|me`（JWT），Laravel 以 `SimpleGoAuthService` 整合；移除示範 base64 token（見整治）
- 產品/庫存/採購/銷售 REST：`handlers/*.go` + `services/*.go` + `sqlx` 查詢
- 報表：Laravel `SalesReportController` 與 `ReportApiService`；圖表使用 Chart.js（主題方案需統一）
- Inventory Levels 聚合：`frontend/routes/api.php` 以 DB join 匯總（短期），待改以 Go API 端匯總

### 4. 多租戶與安全
- PostgreSQL RLS：12 核心表啟用，`SET app.current_company_id` 由中介層注入；索引策略與審計/效能收集腳本已規劃
- RBAC：Laravel/Go 兩端一致；常數與狀態值需契約化
- 安全加固（規劃→落地）：CORS、Rate Limiting、API Key 管理、審計觸發器與 API 存取日誌中介層

### 5. 測試與品質
- Playwright：路由/庫存/產品/設定/現金流頁面驗證；E2E 報告與截圖齊備
- Go 測試：`*_test.go` 覆蓋 JWT/通知/AI/解析器/權限等
- 準則：實際測試優於程式碼推測；UI 主題一致性須納入回歸檢查

### 6. 函數/變數總覽（代表性）
- Go 服務層（`backend/internal/services/`）
  - `GenerateTokenPair`, `ValidateAccessToken`（JWT）
  - `GetProducts`, `SearchCustomers`, `GetInventoryTransactions` 等查詢動作（sqlx）
  - OCR：`ProcessDocument`, `ExtractData`, `GetOCRStats`（多數模板 CRUD TODO）
- Go 處理器（`backend/internal/handlers/`）
  - `AuthHandler`, `ProductHandler`, `SalesOrderHandler`, `ReportHandler`, `OCRHandler` ... 對應 REST 端點
- Laravel Service（`frontend/app/Services/`）
  - `ApiService`（用戶/公司關聯、同步）、`SimpleGoJWTService`（JWT 整合）、`ReportApiService`
- Laravel API（`frontend/routes/api.php`）
  - `GET /api/inventory/levels|transactions`（臨時聚合）、`/reports/sales/*`、`/company-management/*`

註：完整函式/變數清單可自 `backend/internal/{services,handlers}/*.go` 與 `frontend/app/Services/*.php` 索引（已於審查時檢閱）。

### 7. Code Review（技術面詳列）
1) 主題/圖表初始化一致性
   - 問題：Vite 與 Blade 動態 CSS 並行，`--nexus-*` vs `--nx-*` 前綴衝突，部分頁面「圖表載入中」且未初始化
   - 修正：
     - 僅用 Vite 載入：`resources/css/nexus-theme.css` → 所有頁面統一引用
     - 建立 `nx→nexus` 相容層，移除 Blade 內聯動態變數；Chart.js 主題在 Vite 入口初始化
2) 認證端點安全
   - 問題：Laravel `GET /api/auth/token` 以 base64 當示範性 token
   - 修正：移除或僅限本地 DEV；正式流程以 Go JWT 為單一來源
3) OCR 模組未完成項
   - `CreateTemplate/GetTemplate/List/Update/Delete` 皆為 TODO；`BatchProcessDocuments/VerifyOCRResult` 未落地
   - 修正：先完備樣板 CRUD 與驗證流，再接批次處理與統計
4) API 路由殘留/重複
   - 多段 DISABLED/合併註解仍留存；容易造成維護誤判
   - 修正：清理歷史段落，保留單一路由來源與中介鏈
5) 設計系統落地
   - 大量 Blade 元件仍使用 Tailwind 預設類；應套用 `nexus-*` 元件類（`nexus-btn-primary`, `nexus-card`, `nexus-input`）
6) 搜尋/欄位映射一致性
   - 已修復：欄位名稱契約（`selling_price→unit_price`）、搜尋欄位覆蓋（phone/contact_person）

### 8. 風險與技術債
- OCR/AI 子系統未完備影響 AI 相關承諾
- 報表主題與 E2E 視覺一致性需要制度化檢查
- 前端偶有直接 DB 查詢聚合（短期權宜），應回遷 API 邏輯

### 9. 落地計畫（技術路線）
Week1：主題統一 + 移除 Demo JWT + 修補 suppliers/customers API；加強錯誤處理
Week2：OCR 樣板 CRUD/驗證/批次；補單元測試
Week3：安規落地（RateLimit/CORS/API Key/審計與 API 日誌）；調整前端呼叫
Week4：報表圖表初始化與導出、Inventory/Orders 報表接 Chart.js 主題

### 10. 依據/連結
- `docs/development/api-specification.md`, `documents/API_Planning_Document.md`
- `documents/安全優先UI先行詳細計劃/*`
- `memory-bank/systemPatterns.md`, `techContext.md`, `progress.md`
- `backend/internal/{handlers,services}/*.go`, `frontend/routes/api.php`


