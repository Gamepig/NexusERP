# Phase 0: 本地基礎建設與 Docker 開發環境 (Local Infrastructure & Docker Dev Environment)

**核心目標：** 建立**基於 Docker** 的穩定本地開發環境，設定版本控制，定義專案結構，完成核心資料庫模型（用戶、權限、公司、業務單位），實現基礎的身份驗證與授權機制，並配置必要的本地工具（如 MinIO）。

---

## P0.1: 專案啟動與環境準備 (Project Initiation & Environment Setup)

### P0.1.1: 版本控制系統建立 (Version Control System Setup)
*   **P0.1.1.1: 初始化 Git 本地儲存庫**
    *   P0.1.1.1.1: 創建專案根目錄
    *   P0.1.1.1.2: 執行 `git init`
*   **P0.1.1.2: 配置 `.gitignore` 檔案**
    *   P0.1.1.2.1: 收集各技術堆疊 (Node.js, Go, PHP/Laravel, Python, IDE configs) 的標準忽略規則
    *   P0.1.1.2.2: 撰寫並提交初始 `.gitignore`
*   **P0.1.1.3: 建立遠端儲存庫 (如 GitHub, GitLab)**
    *   P0.1.1.3.1: 在遠端平台創建 NexusERP 專案
    *   P0.1.1.3.2: 本地儲存庫關聯遠端儲存庫
    *   P0.1.1.3.3: 推送初始提交
*   **P0.1.1.4: 定義分支策略 (Branching Strategy)**
    *   P0.1.1.4.1: 選擇分支模型 (如 Gitflow: main, develop, feature/xxx, release/xxx, hotfix/xxx)
    *   P0.1.1.4.2: 撰寫分支策略說明文件 (`documents/development/branching_strategy.md`)

### P0.1.2: 開發工具與環境配置 (Development Tools & Environment Configuration)
*   **P0.1.2.1: 確認團隊成員本地開發環境**
    *   P0.1.2.1.1: 調查並統一主要開發作業系統 (macOS, Windows, Linux)
    *   P0.1.2.1.2: 確認 notwendige lokale Softwareinstallationen (IDE, Git client, Docker Desktop)
*   **P0.1.2.2: 專案文件結構初始化**
    *   P0.1.2.2.1: 根據 `nexuserp-rules.mdc` 和規劃建立初始目錄結構 (e.g., `documents/`, `src/`, `memory-bank/`, `scripts/`, `config/`)
    *   P0.1.2.2.2: 放置初始專案規則和說明文件
*   **P0.1.2.3: 建立 Memory Bank 核心文件**
    *   P0.1.2.3.1: 創建 `memory-bank/projectbrief.md`
    *   P0.1.2.3.2: 創建 `memory-bank/productContext.md`
    *   P0.1.2.3.3: 創建 `memory-bank/activeContext.md`
    *   P0.1.2.3.4: 創建 `memory-bank/systemPatterns.md`
    *   P0.1.2.3.5: 創建 `memory-bank/techContext.md`
    *   P0.1.2.3.6: 創建 `memory-bank/progress.md`
    *   P0.1.2.3.7: 初始化上述文件的基本內容或模板

### P0.1.3: 專案管理與溝通機制建立 (Project Management & Communication Setup)
*   **P0.1.3.1: 選擇並配置任務管理工具 (如 Jira, Trello, GitHub Issues)**
    *   P0.1.3.1.1: 創建專案看板
    *   P0.1.3.1.2: 定義任務狀態和流程
*   **P0.1.3.2: 建立團隊溝通渠道 (如 Slack, Microsoft Teams)**
    *   P0.1.3.2.1: 創建專案相關頻道
*   **P0.1.3.3: 定義例會與報告機制**
    *   P0.1.3.3.1: 規劃每日站會、週會等
    *   P0.1.3.3.2: 確定進度報告頻率和格式

---

## P0.2: Docker 化開發環境建置 (Dockerized Development Environment Setup)

### P0.2.1: 核心服務 Docker 映像檔定義 (Core Services Docker Image Definition)
*   **P0.2.1.1: 後端服務 (Golang/Gin) Dockerfile 撰寫**
    *   P0.2.1.1.1: 選擇基礎 Go 映像檔
    *   P0.2.1.1.2: 配置工作目錄、依賴安裝 (go mod)、編譯步驟
    *   P0.2.1.1.3: 設定環境變數和啟動命令
*   **P0.2.1.2: 前端服務 (PHP/Laravel) Dockerfile 撰寫**
    *   P0.2.1.2.1: 選擇包含 PHP-FPM 和 Nginx (或 Caddy) 的基礎映像檔，或分別構建
    *   P0.2.1.2.2: 配置 PHP 擴展 (如 pgsql, redis)
    *   P0.2.1.2.3: 配置 Composer 安裝依賴
    *   P0.2.1.2.4: 配置 Vite 編譯環境 (如果前端資源在容器內編譯)
    *   P0.2.1.2.5: 設定 Nginx/PHP-FPM 配置和啟動腳本
*   **P0.2.1.3: 資料庫服務 (PostgreSQL) 映像檔選擇與配置**
    *   P0.2.1.3.1: 選擇官方 PostgreSQL 映像檔版本
    *   P0.2.1.3.2: 規劃數據持久化方式 (Docker Volume)
*   **P0.2.1.4: 快取服務 (Redis) 映像檔選擇與配置**
    *   P0.2.1.4.1: 選擇官方 Redis 映像檔版本
    *   P0.2.1.4.2: 規劃數據持久化方式 (可選)
*   **P0.2.1.5: 檔案儲存服務 (MinIO) 映像檔選擇與配置**
    *   P0.2.1.5.1: 選擇官方 MinIO 映像檔版本
    *   P0.2.1.5.2: 規劃數據持久化和初始 Bucket 創建
    *   P0.2.1.5.3: 設定 Access Key 和 Secret Key

### P0.2.2: Docker Compose 編排文件撰寫 (`docker-compose.yml`)
*   **P0.2.2.1: 定義所有服務 (Golang, PHP/Laravel, PostgreSQL, Redis, MinIO)**
    *   P0.2.2.1.1: 指定各服務的 `build` context 或 `image`
    *   P0.2.2.1.2: 配置服務間的依賴關係 (`depends_on`)
    *   P0.2.2.1.3: 設定端口映射 (`ports`)
    *   P0.2.2.1.4: 設定環境變數 (`environment`), 引用 `.env` 文件
    *   P0.2.2.1.5: 配置卷掛載 (`volumes`) 以實現程式碼熱加載和數據持久化
*   **P0.2.2.2: 定義網路 (`networks`)**
    *   P0.2.2.2.1: 創建自定義橋接網路供服務間通訊
*   **P0.2.2.3: 撰寫 `.env` 文件模板**
    *   P0.2.2.3.1: 包含所有服務所需的環境變數 (資料庫憑證, API Keys, 服務端口等)
    *   P0.2.2.3.2: 遵循 `nexuserp-rules.mdc` 中的範例，但 PostgreSQL 相關配置優先

### P0.2.3: 開發環境啟動與測試腳本
*   **P0.2.3.1: 撰寫啟動開發環境的腳本 (e.g., `scripts/dev-start.sh`)**
    *   P0.2.3.1.1: 包含 `docker-compose up -d --build` 等命令
    *   P0.2.3.1.2: 可選：執行初始資料庫遷移或種子數據填充
*   **P0.2.3.2: 撰寫停止開發環境的腳本 (e.g., `scripts/dev-stop.sh`)**
    *   P0.2.3.2.1: 包含 `docker-compose down` 等命令
*   **P0.2.3.3: 初步測試各服務是否能正常啟動和基礎通訊**
    *   P0.2.3.3.1: 檢查 Golang 後端是否能連線 PostgreSQL 和 Redis
    *   P0.2.3.3.2: 檢查 Laravel 前端是否能連線 Golang 後端 API (健康檢查端點)

### P0.2.4: Docker 環境文檔撰寫
*   **P0.2.4.1: 撰寫 `documents/development/docker_setup_guide.md`**
    *   P0.2.4.1.1: 說明如何在本地設置和運行 Docker 化開發環境
    *   P0.2.4.1.2: 包含常見問題排除

---

## P0.3: 專案架構與核心模組初始化 (Project Architecture & Core Modules Initialization)

### P0.3.1: 後端服務 (Golang/Gin) 專案結構初始化
*   **P0.3.1.1: 創建主要目錄結構 (e.g., `cmd/`, `internal/` or `pkg/`, `api/`, `config/`, `migrations/`, `scripts/`)**
    *   P0.3.1.1.1: `cmd/server/main.go` 作為主程式入口
    *   P0.3.1.1.2: `internal/core/` (或 `pkg/core/`) 存放核心業務邏輯 (用戶、權限等)
    *   P0.3.1.1.3: `internal/database/` (或 `pkg/database/`) 處理資料庫連接和遷移
    *   P0.3.1.1.4: `internal/auth/` (或 `pkg/auth/`) 處理認證與授權
    *   P0.3.1.1.5: `api/v1/` 定義 RESTful API 路由和處理器
*   **P0.3.1.2: 引入核心依賴 (Gin, GORM, Go-Redis, Viper/godotenv for config)**
    *   P0.3.1.2.1: 初始化 `go.mod`
    *   P0.3.1.2.2: `go get` 相關依賴
*   **P0.3.1.3: 配置管理模組實現**
    *   P0.3.1.3.1: 從環境變數或配置文件加載配置
*   **P0.3.1.4: 日誌系統整合 (e.g., Zap, Logrus)**
    *   P0.3.1.4.1: 配置日誌級別和輸出格式

### P0.3.2: 前端服務 (PHP/Laravel) 專案結構初始化
*   **P0.3.2.1: 使用 Composer 創建新的 Laravel 專案**
    *   P0.3.2.1.1: `composer create-project laravel/laravel nexus-erp-frontend`
*   **P0.3.2.2: 配置資料庫連接 (指向 Docker 中的 PostgreSQL)**
    *   P0.3.2.2.1: 修改 `.env` 中的資料庫配置
*   **P0.3.2.3: 引入前端打包工具 (Vite) 配置**
    *   P0.3.2.3.1: 確認 `vite.config.js` 和 `package.json`
*   **P0.3.2.4: 移除 Laravel 預設不需要的組件 (視情況)**
    *   P0.3.2.4.1: 例如，如果認證完全由後端處理，可以移除 Breeze/Jetstream 的部分 UI
*   **P0.3.2.5: 建立與後端 Golang API 通訊的服務層或 HTTP Client (e.g., Guzzle)**
    *   P0.3.2.5.1: 封裝 API 請求邏輯

### P0.3.3: 共用配置與腳本
*   **P0.3.3.1: Makefile 或 `scripts/` 目錄下常用腳本 (lint, test, build)**
    *   P0.3.3.1.1: 設置程式碼風格檢查工具 (Golangci-lint for Go, PHP CS Fixer/Psalm/Larastan for PHP)
    *   P0.3.3.1.2: 基礎測試框架配置 (Go testing package, PHPUnit)

---

## P0.4: 核心資料庫設計與實現 (Core Database Design & Implementation)

### P0.4.1: 核心實體資料庫模型定義 (Core Entity DB Model Definition)
*   **P0.4.1.1: 用戶 (Users) 模型設計**
    *   P0.4.1.1.1: 欄位定義 (ID, username, password_hash, email, first_name, last_name, status, created_at, updated_at, deleted_at)
*   **P0.4.1.2: 公司 (Companies) 模型設計**
    *   P0.4.1.2.1: 欄位定義 (ID, name, registration_number, address, contact_email, status, created_at, updated_at)
*   **P0.4.1.3: 業務單位/分店 (BusinessUnits) 模型設計**
    *   P0.4.1.3.1: 欄位定義 (ID, company_id (FK), name, type, address, status, created_at, updated_at)
*   **P0.4.1.4: 角色 (Roles) 模型設計**
    *   P0.4.1.4.1: 欄位定義 (ID, name, description, created_at, updated_at)
*   **P0.4.1.5: 權限 (Permissions) 模型設計**
    *   P0.4.1.5.1: 欄位定義 (ID, name, resource, action, description, created_at, updated_at)
*   **P0.4.1.6: 用戶-角色關聯 (UserRoles) 模型設計 (多對多)**
    *   P0.4.1.6.1: 欄位定義 (user_id (FK), role_id (FK))
*   **P0.4.1.7: 角色-權限關聯 (RolePermissions) 模型設計 (多對多)**
    *   P0.4.1.7.1: 欄位定義 (role_id (FK), permission_id (FK))
*   **P0.4.1.8: 用戶-業務單位關聯 (UserBusinessUnits) 模型設計 (多對多, 用戶可屬於哪些分店)**
    *   P0.4.1.8.1: 欄位定義 (user_id (FK), business_unit_id (FK))

### P0.4.2: 資料庫遷移 (Migrations) 實現 (Golang/GORM)
*   **P0.4.2.1: 建立上述核心模型的 GORM 結構體 (structs)**
*   **P0.4.2.2: 撰寫初始資料庫遷移腳本 (使用 GORM `AutoMigrate` 或 goose/migrate 等工具)**
    *   P0.4.2.2.1: 創建 `users` 表
    *   P0.4.2.2.2: 創建 `companies` 表
    *   P0.4.2.2.3: 創建 `business_units` 表
    *   P0.4.2.2.4: 創建 `roles` 表
    *   P0.4.2.2.5: 創建 `permissions` 表
    *   P0.4.2.2.6: 創建 `user_roles` (pivot) 表
    *   P0.4.2.2.7: 創建 `role_permissions` (pivot) 表
    *   P0.4.2.2.8: 創建 `user_business_units` (pivot) 表

### P0.4.3: 資料庫種子數據 (Seeders) 實現 (可選, 用於開發測試)
*   **P0.4.3.1: 撰寫腳本填充初始角色 (e.g., SuperAdmin, Admin, User)**
*   **P0.4.3.2: 撰寫腳本填充初始權限 (e.g., create_user, view_reports)**
*   **P0.4.3.3: 撰寫腳本填充一個預設的 SuperAdmin 用戶**

---

## P0.5: 基礎認證與授權機制 (Basic Authentication & Authorization)

### P0.5.1: 用戶註冊 API (Golang/Gin)
*   **P0.5.1.1: 設計 API 端點 (`POST /api/v1/auth/register`)**
*   **P0.5.1.2: 實現請求驗證 (username, email, password 格式與唯一性)**
*   **P0.5.1.3: 密碼雜湊 (hashing) 存儲 (e.g., bcrypt, Argon2)**
*   **P0.5.1.4: 創建用戶記錄並分配預設角色 (如有)**

### P0.5.2: 用戶登入 API (Golang/Gin)
*   **P0.5.2.1: 設計 API 端點 (`POST /api/v1/auth/login`)**
*   **P0.5.2.2: 實現用戶名/郵箱和密碼驗證**
*   **P0.5.2.3: 生成 JWT (JSON Web Token) 或 Session Token**
    *   P0.5.2.3.1: JWT 包含用戶 ID, 角色, 過期時間等 payload
    *   P0.5.2.3.2: 配置 JWT secret key (從環境變數讀取)
*   **P0.5.2.4: 返回 Token 給客戶端**

### P0.5.3: Token 驗證中介軟體 (Middleware) (Golang/Gin)
*   **P0.5.3.1: 實現檢查請求 Header 中 Token 的有效性**
*   **P0.5.3.2: 解析 Token 並將用戶資訊存儲到請求上下文中**
*   **P0.5.3.3: 保護需要認證的 API 端點**

### P0.5.4: 基礎授權中介軟體 (RBAC - Role-Based Access Control) (Golang/Gin)
*   **P0.5.4.1: 實現檢查用戶角色是否擁有訪問特定資源/執行特定操作的權限**
    *   P0.5.4.1.1: 從請求上下文中獲取用戶角色
    *   P0.5.4.1.2: 查詢 `role_permissions` 和 `permissions` 表
*   **P0.5.4.2: 保護需要特定權限的 API 端點**

### P0.5.5: 前端 (Laravel) 登入/註冊頁面與邏輯
*   **P0.5.5.1: 創建登入表單頁面 (Blade 模板)**
*   **P0.5.5.2: 實現調用後端登入 API 的邏輯**
*   **P0.5.5.3: 安全存儲 Token (e.g., HttpOnly Cookie, LocalStorage - 需注意 XSS 風險)**
*   **P0.5.5.4: 創建註冊表單頁面 (Blade 模板)**
*   **P0.5.5.5: 實現調用後端註冊 API 的邏輯**
*   **P0.5.5.6: 實現登出邏輯 (清除 Token)**

### P0.5.6: 受保護的前端路由
*   **P0.5.6.1: 實現前端路由守衛，未登入用戶跳轉至登入頁**

---

## P0.6: 基礎設施與 CI/CD 初步設定 (Infrastructure & Basic CI/CD Setup)

### P0.6.1: 本地檔案儲存 (MinIO) 配置與測試
*   **P0.6.1.1: 確認 MinIO 服務在 Docker Compose 中正常運行**
*   **P0.6.1.2: 創建初始存儲桶 (bucket) (e.g., `user-avatars`, `product-images`)**
*   **P0.6.1.3: 測試文件上傳和下載 (可透過 MinIO Client 或 API)**

### P0.6.2: 基礎 CI (持續整合) 流程設定 (e.g., GitHub Actions)
*   **P0.6.2.1: 創建 CI 工作流程文件 (e.g., `.github/workflows/ci.yml`)**
*   **P0.6.2.2: 配置觸發條件 (e.g., push to `develop`, pull request to `main`)**
*   **P0.6.2.3: Golang 後端 CI 步驟:**
    *   P0.6.2.3.1: checkout 程式碼
    *   P0.6.2.3.2: 設定 Go 環境
    *   P0.6.2.3.3: 執行程式碼風格檢查 (lint)
    *   P0.6.2.3.4: 執行單元測試 (`go test ./...`)
    *   P0.6.2.3.5: (可選) 建置二進制文件
*   **P0.6.2.4: PHP/Laravel 前端 CI 步驟:**
    *   P0.6.2.4.1: checkout 程式碼
    *   P0.6.2.4.2: 設定 PHP 環境 (with Composer)
    *   P0.6.2.4.3: 安裝依賴 (`composer install`)
    *   P0.6.2.4.4: 執行程式碼風格檢查 (lint)
    *   P0.6.2.4.5: 執行單元測試 (`php artisan test`)
*   **P0.6.2.5: (可選) Docker 映像檔建置與推送到倉庫 (如 Docker Hub, GitHub Container Registry)**
    *   P0.6.2.5.1: 在 CI 中登入 Docker 倉庫
    *   P0.6.2.5.2: 建置後端服務映像檔並推送
    *   P0.6.2.5.3: 建置前端服務映像檔並推送

### P0.6.3: 專案 Readme.md 更新
*   **P0.6.3.1: 包含專案簡介、本地開發環境設置步驟、主要技術堆疊、如何運行等。**

--- 