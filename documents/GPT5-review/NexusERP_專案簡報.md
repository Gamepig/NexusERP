## 專案簡報（管理層/跨部門）

### 專案總覽
- **專案**: NexusERP（AI 驅動 ERP，支援多行業、Marketplace、生產營運）
- **目標**: 整合核心 ERP 流程，導入 AI 自動化/洞察，實現企業級安全（JWT + PostgreSQL RLS）
- **目前階段**: Phase 0 完成（Docker、Go/Gin API、認證/RLS 基礎），多模組 Demo 與 E2E 測試已跑通（部分模組待補）

### 功能模組與狀態
| 模組 | 功能重點 | 現況 | 備註 |
|---|---|---|---|
| 庫存管理 | 產品主檔、庫存層級、交易、警示 | 🟢 75-100%（頁面/統計齊全；API 整合正常） | 多倉庫架構已預留；API 匯總/單品查詢齊備 |
| 產品管理 | CRUD、分類、圖片 | 🟢 90% | 欄位映射與庫存關聯已修正 |
| 採購管理 | 供應商、PO、收貨、發票 | 🟡 60-80% | 狀態流+API 存取正常，少量錯誤處理可強化 |
| 銷售管理 | 報價、訂單、出貨 | 🟡 40-75% | 訂單完整度中等，報價草稿 API 已掛載 |
| 財務/報表 | 應收應付、報表 | 🟡 45-75% | 報表資料層齊備，圖表主題/初始化待統一 |
| 設定/權限 | 公司/BU、RBAC | 🟢 90-100% | 巢狀路由、公司上下文、RLS 中介層齊備 |
| Marketplace | 商品瀏覽/推薦（Demo） | 🟡 50-70% | Demo 資料/路由就緒，安全性規則待收斂 |
| AI 能力 | OCR、RAG/CAG、LLM | 🟡 30-60% | 介面/Service 介面齊備，部分供應商/範本尚未實作 |

### 檔案結構（高層）
- `backend/`（Go/Gin API、RLS、認證、安全/監控）
- `frontend/`（Laravel/Blade、Vite、設計系統、路由與 API 整合）
- `documents/`（PRD、API/DB/RLS 安規與修復方案、測試與報告）
- `memory-bank/`（專案知識庫：系統模式、技術堆疊、進度、Bug 修復記錄）

### 技術堆疊
- 前端: Laravel + Blade + Vite、Chart.js、Playwright（E2E）
- 後端: Go/Gin、sqlx、Redis、JWT、Zap、（Fiber PoC 專案另置）
- 資料庫: PostgreSQL（RLS 多租戶）、索引最佳化、審計/效能收集腳本（規劃）
- 容器化: Docker Compose（API、Postgres、Redis、Nginx、MailHog、Adminer）

### 目前進度與測試
- Phase 0 完成；Go API 運作於 `:8082`，前端已串接
- 多租戶 RLS 完成（12 表），孤立資料修復完成
- E2E：路由/庫存/產品/設定測試🟢；部分 API 與圖表初始化待補
- 效能：JWT/資料庫/RLS 基準顯示高效，頁面載入 < 1s（報表圖表初始化待統一）

### Code Review 摘要（可交付風險）
- **高優先級**
  - 報表/全站主題系統不一致：Vite 與 Blade 動態 CSS 併行，變數前綴衝突（`--nexus-*` vs `--nx-*`）致圖表未初始化；應統一 Vite 載入與變數前綴
  - Laravel `GET /api/auth/token` 為示範性 base64「擬 JWT」：需改為正式 JWT 或移除 Demo 端點（僅保留 Go JWT 流程）
  - OCR Service 多項 TODO 未實作（樣板 CRUD、批次處理、驗證流程）；對 AI/文件流程的交付具影響
  - API 路由重複/歷史段落殘留（已多處合併，仍須清理註解/死碼避免混淆）
- **中優先級**
  - 前端尚有 Tailwind 與設計系統並用，未廣泛套用 `nexus-*` 元件類別
  - 客戶/供應商部分 API 仍出現 404 或 500（個別路由/控制器需補齊）
  - 安全性：CORS、RateLimit、API Key 管理已設計，需進一步落地使用
- **低優先級**
  - 多處 TODO 註記（表單提交/刪除流程、搜尋/篩選前端交互）

### 建議與里程碑（4 週）
1. 第 1 週：統一主題與圖表初始化（Vite 專一），移除 Demo JWT；補齊供應商/客戶路由與錯誤處理
2. 第 2 週：OCR 模組最小可用（樣板 CRUD、驗證流程、批次 Job 構面）
3. 第 3 週：安全落地（Rate Limit、CORS、API Key）；加強 E2E 覆蓋（權限/表單）
4. 第 4 週：報表中心一致性與導出、Inventory/Orders 報表串圖表主題

### 主要介面與入口
- Web（前端）: `http://localhost:8000`
- Go API: `http://localhost:8082`
- Adminer: `http://localhost:8086`；MailHog: `http://localhost:8025`

### 附：依據/來源
- `docs/`、`documents/`（PRD、API/RLS、安全方案）
- `memory-bank/`（systemPatterns/techContext/progress）
- `backend/internal/*`、`frontend/routes/*`、Playwright 測試與報告


