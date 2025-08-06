# Phase 0: 本地基礎建設與 Docker 開發環境 (預計 2-3 週)

**相關規劃文件:** `documents/NexusERP_MajorDevelopmentSteps.md` (階段 1)

**核心目標：** 建立**基於 Docker** 的穩定本地開發環境，設定版本控制，定義專案結構，完成核心資料庫模型（用戶、權限、公司、業務單位），實現基礎的身份驗證與授權機制，並配置必要的本地工具（如 MinIO）。

---

*   **Task 0.1: Docker 化開發環境設定**
    *   **Task 0.1.1: 後端 (Go) Dockerfile**
        *   [ ] 0.1.1.1: 選擇 Go 基礎映像 (e.g., `golang:1.x-alpine`)。
        *   [ ] 0.1.1.2: 設定工作目錄 (`WORKDIR`)。
        *   [ ] 0.1.1.3: 複製 `go.mod` 和 `go.sum` 文件。
        *   [ ] 0.1.1.4: 下載 Go 依賴 (`go mod download`)。
        *   [ ] 0.1.1.5: 複製專案原始碼。
        *   [ ] 0.1.1.6: 設定開發模式下的建置命令 (e.g., `go build` 或使用熱加載工具如 `air`)。
        *   [ ] 0.1.1.7: 設定容器啟動命令 (`CMD` 或 `ENTRYPOINT`)。
        *   [ ] 0.1.1.8: 暴露後端服務端口 (`EXPOSE`)。
    *   **Task 0.1.2: 前端 (Laravel/Nginx) Dockerfile**
        *   [ ] 0.1.2.1: 選擇 PHP-FPM 基礎映像 (e.g., `php:8.x-fpm-alpine`)。
        *   [ ] 0.1.2.2: 安裝必要的 PHP 擴展 (e.g., pdo_pgsql, redis)。
        *   [ ] 0.1.2.3: 安裝 Composer。
        *   [ ] 0.1.2.4: 設定工作目錄 (`WORKDIR`)。
        *   [ ] 0.1.2.5: 複製 `composer.json` 和 `composer.lock`。
        *   [ ] 0.1.2.6: 安裝 Composer 依賴 (`composer install`)。
        *   [ ] 0.1.2.7: 複製 Laravel 專案原始碼。
        *   [ ] 0.1.2.8: 設定檔案權限。
        *   [ ] 0.1.2.9: 選擇 Nginx 基礎映像 (e.g., `nginx:stable-alpine`)。
        *   [ ] 0.1.2.10: 編寫 Nginx 配置文件，將請求轉發給 PHP-FPM。
        *   [ ] 0.1.2.11: 複製 Nginx 配置文件到映像中。
        *   [ ] 0.1.2.12: 暴露 Nginx 端口 (`EXPOSE 80`)。
    *   **Task 0.1.3: Docker Compose 配置 (`docker-compose.yml`)**
        *   [ ] 0.1.3.1: 定義後端 Go 服務 (`services.backend`)，使用 Task 0.1.1 的 Dockerfile。
        *   [ ] 0.1.3.2: 定義前端 PHP-FPM 服務 (`services.frontend-php`)，使用 Task 0.1.2 的 PHP 部分。
        *   [ ] 0.1.3.3: 定義 Nginx 服務 (`services.frontend-web`)，使用 Task 0.1.2 的 Nginx 部分，並依賴 `frontend-php`。
        *   [ ] 0.1.3.4: 定義 PostgreSQL 服務 (`services.db`)，使用官方映像，設定數據庫、用戶、密碼。
        *   [ ] 0.1.3.5: 定義 Redis 服務 (`services.cache`)，使用官方映像。
        *   [ ] 0.1.3.6: [可選] 定義 MinIO 服務 (`services.storage`)，使用 MinIO 官方映像，設定 Access/Secret Key。
        *   [ ] 0.1.3.7: 設定服務間的依賴關係 (`depends_on`)。
        *   [ ] 0.1.3.8: 設定網路 (`networks`)，確保服務可以互相通信。
    *   **Task 0.1.4: 共享卷與熱加載**
        *   [ ] 0.1.4.1: 在 `docker-compose.yml` 中為後端服務配置卷，將本地原始碼映射到容器內。
        *   [ ] 0.1.4.2: 在 `docker-compose.yml` 中為前端服務配置卷，將本地原始碼映射到容器內。
        *   [ ] 0.1.4.3: 在 `docker-compose.yml` 中為 PostgreSQL 配置卷，持久化數據庫數據。
        *   [ ] 0.1.4.4: [可選] 在 `docker-compose.yml` 中為 Redis 配置卷，持久化快取數據（通常開發環境不需要）。
        *   [ ] 0.1.4.5: [可選] 在 `docker-compose.yml` 中為 MinIO 配置卷，持久化儲存桶數據。
        *   [ ] 0.1.4.6: [後端] 整合或配置 Go 熱加載工具 (e.g., `air`) 並在 Dockerfile/Compose 中使用。
    *   **Task 0.1.5: 環境測試**
        *   [ ] 0.1.5.1: 執行 `docker compose build` 確保映像建置成功。
        *   [ ] 0.1.5.2: 執行 `docker compose up -d` 啟動所有服務。
        *   [ ] 0.1.5.3: 檢查 `docker compose ps` 確認所有容器正常運行。
        *   [ ] 0.1.5.4: 嘗試訪問前端 Nginx 提供的網址 (e.g., `http://localhost`)。
        *   [ ] 0.1.5.5: 嘗試從後端容器內部連接資料庫和 Redis。
    *   **Task 0.1.6: 文件編寫**
        *   [ ] 0.1.6.1: 在專案根目錄創建 `README.md`。
        *   [ ] 0.1.6.2: 編寫 Docker 環境的啟動步驟 (`docker compose up`, `docker compose down`)。
        *   [ ] 0.1.6.3: 說明如何進入容器執行命令 (e.g., `docker compose exec backend bash`)。
        *   [ ] 0.1.6.4: 說明常見問題及解決方法。

*   **Task 0.2: 專案架構 (在 Docker 環境中)**
    *   **Task 0.2.1: 後端 (Go) 架構**
        *   [ ] 0.2.1.1: 選擇並確定 Go 專案佈局 (e.g., Standard Go Project Layout)。
        *   [ ] 0.2.1.2: 創建核心目錄 (e.g., `cmd/`, `internal/`, `pkg/`, `api/`)。
        *   [ ] 0.2.1.3: 在 `internal/` 下設計核心業務實體目錄 (e.g., `user/`, `auth/`, `company/`)。
        *   [ ] 0.2.1.4: 在 `internal/` 下設計業務邏輯目錄 (e.g., `inventory/`, `sales/`)。
        *   [ ] 0.2.1.5: 在 `cmd/server/` 或類似位置創建 `main.go` 作為服務入口點。
        *   [ ] 0.2.1.6: 在 `main.go` 中初始化 Gin 引擎。
        *   [ ] 0.2.1.7: 設定基礎 Gin 中介軟體 (Logger, Recovery)。
        *   [ ] 0.2.1.8: 建立基礎路由 (`/ping` 或 `/health`) 測試服務運行。
    *   **Task 0.2.2: 前端 (Laravel) 架構**
        *   [ ] 0.2.2.1: 進入前端容器執行 `composer create-project laravel/laravel src` （或將現有代碼放入）。
        *   [ ] 0.2.2.2: 在前端專案根目錄創建 `.env` 文件 (從 `.env.example` 複製)。
        *   [ ] 0.2.2.3: 配置 `.env` 中的 `DB_HOST` (指向 Docker DB 服務名), `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`。
        *   [ ] 0.2.2.4: 配置 `.env` 中的 `REDIS_HOST` (指向 Docker Redis 服務名)。
        *   [ ] 0.2.2.5: 配置 `.env` 中的 `APP_URL` (指向本地訪問的 URL, e.g., `http://localhost`)。
        *   [ ] 0.2.2.6: 執行 `php artisan key:generate`。
        *   [ ] 0.2.2.7: 確認 Laravel 預設目錄結構 (`app/Http/Controllers`, `app/Models`, `resources/views`, `routes/web.php`)。
        *   [ ] 0.2.2.8: 在 `routes/web.php` 中建立一個基礎路由 (`/`) 返回歡迎視圖。
        *   [ ] 0.2.2.9: 確認 Vite 配置 (`vite.config.js`, `package.json`)。
        *   [ ] 0.2.2.10: 執行 `npm install` 和 `npm run dev` (或 `build`) 確保前端資源正常處理。
        *   [ ] 0.2.2.11: 在 `resources/views/layouts/` 下建立基礎 Blade 佈局文件 (e.g., `app.blade.php`)。
        *   [ ] 0.2.2.12: 在 `resources/views/` 下建立歡迎頁面 Blade 文件。
    *   **Task 0.2.3: 前後端交互與共用**
        *   [ ] 0.2.3.1: (後端) 設計統一的 API 響應格式 (e.g., `{ "success": true/false, "data": ..., "message": ..., "error_code": ... }`)。
        *   [ ] 0.2.3.2: (後端) 實作共用的錯誤處理函數/中介軟體，返回標準錯誤響應。
        *   [ ] 0.2.3.3: (後端) 選擇並整合配置讀取庫 (e.g., Viper)，從環境變數或配置文件讀取配置。
        *   [ ] 0.2.3.4: (前端) 選擇 HTTP 客戶端 (e.g., Guzzle 或 Laravel HTTP Client)。
        *   [ ] 0.2.3.5: (前端) 在 `.env` 中配置後端 API 的基礎 URL (指向 Docker Go 服務)。
        *   [ ] 0.2.3.6: (前端) 創建一個基礎的 API 服務類或 Trait 來封裝 API 調用。
        *   [ ] 0.2.3.7: (前端) 在 `resources/views/components/` 下建立基礎 Blade 元件 (e.g., button, input, alert)。

*   **Task 0.3: 資料庫設計 (透過 Docker)**
    *   **Task 0.3.1: 核心 Schema 設計**
        *   [ ] 0.3.1.1: 設計 `users` 表 Schema (id, name, email, password, created_at, updated_at)。
        *   [ ] 0.3.1.2: 設計 `roles` 表 Schema (id, name, description)。
        *   [ ] 0.3.1.3: 設計 `permissions` 表 Schema (id, name, description)。
        *   [ ] 0.3.1.4: 設計 `role_permissions` (多對多) 表 Schema (role_id, permission_id)。
        *   [ ] 0.3.1.5: 設計 `user_roles` (多對多) 表 Schema (user_id, role_id)。
        *   [ ] 0.3.1.6: 設計 `companies` 表 Schema (id, name, address, ...)。
        *   [ ] 0.3.1.7: 設計 `business_units` 表 Schema (id, company_id, name, industry_tag)。
        *   [ ] 0.3.1.8: 在需要區分業務單位的核心表規劃中加入 `business_unit_id` (外鍵)。
        *   [ ] 0.3.1.9: 設計基礎 `settings` 表 Schema (key, value, type)。
    *   **Task 0.3.2: ORM 與遷移**
        *   [ ] 0.3.2.1: (後端) 在 `go.mod` 中添加 GORM 及 PostgreSQL Driver (`gorm.io/gorm`, `gorm.io/driver/postgres`)。
        *   [ ] 0.3.2.2: (後端) 建立資料庫連接配置讀取邏輯 (從 .env)。
        *   [ ] 0.3.2.3: (後端) 實作 GORM 初始化和連接池設定。
        *   [ ] 0.3.2.4: 選擇遷移工具 (GORM AutoMigrate 或 `golang-migrate/migrate`)。
        *   [ ] 0.3.2.5: (如果用 `migrate`) 安裝 `migrate` 工具。
        *   [ ] 0.3.2.6: (後端) 為 Task 0.3.1 設計的每個表創建 GORM 模型 (`internal/.../models.go`)。
        *   [ ] 0.3.2.7: 創建第一個遷移文件 (`migrations/000001_init_schema.up.sql` 和 `.down.sql` 或使用 GORM AutoMigrate)。
        *   [ ] 0.3.2.8: 編寫腳本或 Makefile 命令在後端容器內執行資料庫遷移。
        *   [ ] 0.3.2.9: 決定數據隔離策略 (初步定為應用層過濾)。
    *   **Task 0.3.3: Redis 配置**
        *   [ ] 0.3.3.1: (後端) 在 `go.mod` 中添加 Redis 客戶端庫 (e.g., `go-redis/redis`)。
        *   [ ] 0.3.3.2: (後端) 建立 Redis 連接配置讀取邏輯 (從 .env)。
        *   [ ] 0.3.3.3: (後端) 實作 Redis 客戶端初始化和連接測試。
        *   [ ] 0.3.3.4: 規劃 Redis 的初步用途 (例如：Session 儲存)。

*   **Task 0.4: 認證與授權 (Authentication & Authorization)**
    *   Task 0.4.1: 資料庫 Schema (users, roles, permissions)
        *   [ ] 0.4.1.1: 設計 users, roles, permissions, role_user, permission_role 表。
        *   [ ] 0.4.1.2: 創建對應的 GORM 模型。
        *   [ ] 0.4.1.3: 創建資料庫遷移檔案。
    *   Task 0.4.2: 後端 API (Go)
        *   [ ] 0.4.2.1: 實現使用者註冊 API (`POST /api/v1/register`) (帳號密碼)。
        *   [ ] 0.4.2.2: 實現使用者登入 API (`POST /api/v1/login`) (帳號密碼)，回傳 JWT 或設定 Session。
        *   [ ] 0.4.2.3: **實現 Google OAuth2 回調 API (`GET /auth/google/callback`)。**
        *   [ ] 0.4.2.4: **實現 LINE OAuth2 回調 API (`GET /auth/line/callback`)。**
        *   [ ] 0.4.2.5: 實現獲取使用者資訊 API (`GET /api/v1/me`)。
        *   [ ] 0.4.2.6: 實現角色與權限管理 CRUD API。
        *   [ ] 0.4.2.7: 設計並實現 API 認證中介軟體 (JWT 或 Session)。
        *   [ ] 0.4.2.8: 設計並實現 API 授權中介軟體 (RBAC)。
    *   Task 0.4.3: 前端介面 (Laravel Blade)
        *   [ ] 0.4.3.1: 建立註冊頁面。
        *   [ ] 0.4.3.2: 建立登入頁面 (包含帳號密碼及 **Google/LINE 登入按鈕**)。
        *   [ ] 0.4.3.3: 實現前端登出邏輯。
        *   [ ] 0.4.3.4: 建立角色與權限管理介面 (初步)。
    *   Task 0.4.4: 測試
        *   [ ] 0.4.4.1: (測試) 測試註冊、登入、登出流程。
        *   [ ] 0.4.4.2: (測試) **測試 Google/LINE OAuth 登入流程。**
        *   [ ] 0.4.4.3: (測試) 測試 API 權限控管是否生效。

*   **Task 0.5: 本地基礎設施 (如 MinIO in Docker)**
    *   **Task 0.5.1: S3 兼容儲存 (MinIO)**
        *   [ ] 0.5.1.1: 確認 `docker-compose.yml` 中已包含 MinIO 服務。
        *   [ ] 0.5.1.2: 配置 MinIO 的環境變數 (ROOT_USER, ROOT_PASSWORD)。
        *   [ ] 0.5.1.3: 配置 MinIO 的 Port 映射 (e.g., 9000 for API, 9001 for Console)。
        *   [ ] 0.5.1.4: 啟動環境後，訪問 MinIO 控制台 (e.g., `http://localhost:9001`) 並創建一個 Bucket (e.g., `nexuserp-dev`)。
        *   [ ] 0.5.1.5: (後端) 在 `go.mod` 中添加 AWS SDK for Go v2。
        *   [ ] 0.5.1.6: (後端) 建立 S3 客戶端配置邏輯，讀取 MinIO 的 Endpoint URL, Access Key, Secret Key, Bucket Name, Region (e.g., `us-east-1`)。
        *   [ ] 0.5.1.7: (後端) 實作一個基礎的文件上傳函數到 MinIO。
        *   [ ] 0.5.1.8: (後端) 實作一個基礎的文件下載/獲取 URL 函數。
    *   **Task 0.5.2: 記錄與監控 (本地)**
        *   [ ] 0.5.2.1: (後端) 選擇結構化記錄庫 (e.g., Zap, Logrus)。
        *   [ ] 0.5.2.2: (後端) 配置記錄器輸出為 JSON 格式到標準輸出 (stdout)。
        *   [ ] 0.5.2.3: (前端) 確認 Laravel 預設記錄配置輸出到 Docker 控制台。
        *   [ ] 0.5.2.4: [可選] 在 `docker-compose.yml` 中加入 Prometheus 服務。
        *   [ ] 0.5.2.5: [可選] 在 `docker-compose.yml` 中加入 Grafana 服務。
        *   [ ] 0.5.2.6: (後端) [可選] 選擇 Go 指標庫 (e.g., `prometheus/client_golang`)。
        *   [ ] 0.5.2.7: (後端) [可選] 暴露基礎 HTTP 指標端點 (`/metrics`)。
        *   [ ] 0.5.2.8: [可選] 配置 Prometheus 抓取後端指標。
        *   [ ] 0.5.2.9: [可選] 配置 Grafana 連接 Prometheus 並創建基礎儀表板。

*   **Task 0.6: 版本控制與 CI/CD (Git/GitHub & CI/CD)**
    *   **Task 0.6.1: Git 初始化 (原 Task 0.1.7)**
        *   [ ] 0.6.1.1: 執行 `git init`。
        *   [ ] 0.6.1.2: 創建 `.gitignore` 文件，忽略不必要的檔案 (e.g., `vendor/`, `node_modules/`, `.env`, build artifacts)。
        *   [ ] 0.6.1.3: 首次提交基礎結構 (`git add .`, `git commit -m "Initial commit with Docker setup and base structure"`)。
    *   **Task 0.6.2: GitHub 儲存庫**
        *   [ ] 0.6.2.1: 在 GitHub 上創建一個新的私有儲存庫。
        *   [ ] 0.6.2.2: 將本地儲存庫連接到遠端 GitHub 儲存庫 (`git remote add origin <repository_url>`)。
        *   [ ] 0.6.2.3: 推送初始提交到 `main` 或 `master` 分支 (`git push -u origin main`)。
    *   **Task 0.6.3: 分支策略 (原 Task 0.1.8)**
        *   [ ] 0.6.3.1: 確定並文檔化分支策略 (e.g., Gitflow: `main`, `develop`, `feature/`, `release/`, `hotfix/`)。
        *   [ ] 0.6.3.2: 創建 `develop` 分支 (`git checkout -b develop`, `git push -u origin develop`)。
        *   [ ] 0.6.3.3: 在團隊內溝通並強制執行分支策略。
    *   **Task 0.6.4: 基礎 CI 流程 (GitHub Actions)**
        *   [ ] 0.6.4.1: 在專案根目錄創建 `.github/workflows` 目錄。
        *   [ ] 0.6.4.2: 創建一個基礎的 CI workflow YAML 檔案 (e.g., `ci.yml`)。
        *   [ ] 0.6.4.3: 設定 workflow 在推送到 `develop` 和 `feature/*` 分支時觸發。
        *   [ ] 0.6.4.4: [可選] 加入程式碼風格檢查步驟 (e.g., `golangci-lint`, `php-cs-fixer` or `pint`)。
        *   [ ] 0.6.4.5: 加入後端單元測試步驟 (參考 Task 0.6.5)。
        *   [ ] 0.6.4.6: 加入前端單元測試步驟 (參考 Task 0.6.5)。
        *   [ ] 0.6.4.7: 加入 Docker 映像檔建置步驟 (確保 Dockerfile 可以成功建置，但不推送)。
    *   **Task 0.6.5: 自動化測試執行整合 (原 Task 0.1.9)**
        *   [ ] 0.6.5.1: 編寫腳本或在 `Makefile` 中定義命令，用於在 **CI 環境** (或本地容器) 內執行 `go test ./...`。
        *   [ ] 0.6.5.2: 編寫腳本或在 `Makefile` 中定義命令，用於在 **CI 環境** (或本地容器) 內執行 `php artisan test`。
        *   [ ] 0.6.5.3: 確保測試命令可以在 GitHub Actions workflow 中成功執行。 