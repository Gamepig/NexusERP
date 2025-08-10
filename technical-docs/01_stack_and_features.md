## 技術堆疊與功能重點（Stack & Features）

本文件聚焦 NexusERP 的主要技術選型、系統能力與工程價值。內容以「工程導向展示」為核心，強調可維運性、安全性與擴展性。

### 1) 核心技術棧
- 前端：Laravel 10、Blade、Vite、JavaScript（Chart.js、Web Speech API）
- 後端：Golang + Gin、sqlx/GORM、Zap、Go-Redis
- 資料庫：PostgreSQL（JSONB、RLS 多租戶隔離）、Redis（快取/工作佇列）
- 容器化：Docker、Docker Compose、Nginx、PHP-FPM
- 測試：Playwright（E2E）、Go `*_test.go`、PHPUnit（前端側）
- AI 與整合：OCR/RAG/CAG/LLM 設計、QuickBooks、物流追蹤（DHL/FedEx/UPS/USPS）

### 2) 架構關鍵點
- 分層清晰：Handlers/Services（Go）、Controllers/Services（Laravel）與明確責任界線
- API 契約化：RESTful、統一錯誤格式、版本控制（/api/v1）、欄位映射層
- 主題與資產：Vite 作為唯一樣式/資產管道，CSS 變數命名空間一致（`--nexus-*`）
- 多租戶安全：RLS + App 中介軟體（`SET app.current_company_id`）+ 複合索引與安全觸發器
- 觀測性：結構化日誌、索引策略、錯誤模式庫（memory-bank/*）

### 3) 已完成與示範能力
- 認證：註冊/登入/JWT 產生驗證、受保護路由
- 存貨：`products / inventory_levels / inventory_transactions` 模式與 API、表單與欄位映射標準化
- 報表：銷售與財務頁的資料層整合、圖表主題化藍圖
- 測試：路由/庫存/設定/現金流 Playwright 場景，Go 後端單元/整合測試

### 4) 工程設計原則
- 安全優先：OWASP、RLS 行級安全、Token 遮罩、審計與速率限制（規劃）
- DRY 與契約一致：前後端欄位映射、搜尋欄位覆蓋標準、服務層抽象
- 可擴充：多倉庫、Marketplace 微服務預備、AI 能力可插拔
- 可驗證：實際測試優先於程式碼推測，測試報告與證據存檔

參考：`memory-bank/systemPatterns.md`、`memory-bank/techContext.md`、`docs/development/api-specification.md`、`documents/安全優先UI先行詳細計劃/*`


