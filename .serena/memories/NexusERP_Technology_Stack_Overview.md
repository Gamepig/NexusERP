# NexusERP 專案技術棧總覽

## 後端技術棧

### Go 1.23 後端 API
- **框架**: Gin Web Framework
- **認證**: JWT (golang-jwt/jwt/v5)
- **資料庫**: PostgreSQL 驅動 (lib/pq) + SQLx
- **快取**: Redis (redis/go-redis/v9)
- **物件儲存**: MinIO S3 相容介面
- **密碼學**: golang.org/x/crypto
- **測試**: Testify + SQLMock
- **外部服務**: Google Cloud Vision API

### 埠號配置
- **後端 API**: 8082:8080 (Docker 容器)
- **開發環境**: 127.0.0.1:8082

## 前端技術棧

### PHP 8.2 + Laravel 12 Web 前端
- **框架**: Laravel 12.0 (2025年2月發布)
- **認證**: Laravel Breeze
- **社交登入**: Laravel Socialite + Line Provider
- **測試**: PHPUnit + Faker
- **開發工具**: Laravel Pail, Pint, Sail

### JavaScript/Node.js 建置工具
- **建置工具**: Vite 6.2.4
- **CSS 框架**: TailwindCSS 3.1.0 + TailwindCSS Forms
- **JavaScript 框架**: Alpine.js 3.4.2
- **HTTP 客戶端**: Axios 1.8.2
- **E2E 測試**: Playwright 1.54.1
- **開發工具**: Concurrently (並行執行多個指令)

### 埠號配置
- **Laravel 主服務**: 127.0.0.1:8000
- **Laravel 管理面板**: 127.0.0.1:8001
- **Laravel Web 容器**: 8083:80
- **佇列處理器**: 8084

## 基礎設施技術

### 資料庫系統
- **主資料庫**: PostgreSQL 16
  - 容器: nexus-postgres:5432
  - 資料庫名稱: nexus_erp
  - 用戶: nexus

### 快取系統
- **Redis 7-alpine**
  - 容器: nexus-redis
  - 埠號: 6381:6379 (避免與系統 Redis 衝突)
  - 密碼保護: redispassword

### 物件儲存
- **MinIO (S3 相容)**
  - API 埠號: 9000:9000
  - 管理控制台: 9090:9090
  - 用戶: nexus

### 代理和負載平衡
- **Nginx Alpine**
  - HTTP: 80:80
  - HTTPS: 443:443
  - 設定: ./nginx/nginx.conf

### 容器化部署
- **Docker Compose**
  - 生產環境: docker-compose.yml
  - 測試環境: docker-compose.sandbox.yml
  - 網路: nexus-network (bridge)

## 開發和測試環境

### 沙盒測試環境埠號
- **PostgreSQL 測試**: 5433:5432
- **Redis 測試**: 6380:6379
- **後端 API 測試**: 8081:8080
- **前端測試**: 8081:80
- **MinIO 測試**: 9001:9000, 9091:9001
- **MailHog**: 1026:1025 (SMTP), 8026:8025 (Web UI)
- **Adminer**: 8086:8080

### 本地開發服務
- **Neo4j**: localhost:7687 (圖形資料庫)
- **Ollama**: 127.0.0.1:11434 (本地 AI 模型服務)

## 專案架構特色

### 微服務導向
- **後端 API**: 獨立的 Go 服務
- **前端 Web**: 獨立的 Laravel 服務
- **服務間通訊**: RESTful API

### 健康檢查機制
- **PostgreSQL**: pg_isready 檢查
- **Redis**: redis-cli ping 檢查
- **MinIO**: curl 健康檢查端點

### 資料持久化
- **Named Volumes**: postgres_data, redis_data, minio_data, nginx_logs
- **設定掛載**: 配置檔案透過 volumes 掛載

### 環境變數管理
- **後端**: 資料庫、Redis、MinIO、JWT 設定
- **前端**: Laravel 應用設定、資料庫連線、快取設定

## 開發工作流程

### 指令集合
- **後端開發**: `make run` (如果有 Makefile)
- **前端開發**: `composer dev` (並行執行伺服器、佇列、日誌、Vite)
- **測試**: `composer test`
- **容器管理**: `docker-compose up -d`

### 套件管理
- **Go**: go mod (Go 1.23.0, toolchain go1.24.3)
- **PHP**: Composer (Laravel 套件生態系)
- **JavaScript**: NPM (Vite 建置生態系)