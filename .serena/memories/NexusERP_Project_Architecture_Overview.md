# NexusERP 專案架構總覽

## 專案基本資訊
- **專案名稱**: NexusERP
- **專案類型**: 企業資源規劃系統 (ERP)
- **架構模式**: 微服務 + 分離前後端
- **開發環境**: macOS 15
- **部署方式**: Docker Compose

## 核心架構設計

### 微服務架構
- **後端 API 服務**: 獨立的 Go 服務 (Gin Framework)
- **前端 Web 服務**: 獨立的 Laravel 服務 (PHP 8.2)
- **服務間通訊**: RESTful API 介面
- **資料同步**: 共享 PostgreSQL 資料庫

### 技術棧分層

#### 後端層 (Go 1.23)
```
Go Backend API (Port: 8082)
├── Framework: Gin Web Framework
├── Authentication: JWT (golang-jwt/jwt/v5)
├── Database: PostgreSQL + SQLx ORM
├── Cache: Redis Client
├── Storage: MinIO S3 Compatible
├── Security: golang.org/x/crypto
├── Testing: Testify + SQLMock
└── External APIs: Google Cloud Vision
```

#### 前端層 (PHP 8.2 + Laravel 12)
```
Laravel Web Frontend (Port: 8083)
├── Framework: Laravel 12.0 (2025年最新版)
├── Authentication: Laravel Breeze + Socialite
├── UI Framework: TailwindCSS + Alpine.js
├── Build Tool: Vite 6.2.4
├── HTTP Client: Axios 1.8.2
├── Testing: PHPUnit + Playwright
└── Development: Concurrently
```

#### 資料層
```
Data Infrastructure
├── Primary DB: PostgreSQL 16 (Port: 5432)
├── Cache: Redis 7-alpine (Port: 6381)
├── Object Storage: MinIO (API: 9000, Console: 9090)
└── Proxy: Nginx Alpine (HTTP: 80, HTTPS: 443)
```

## 網路架構與端口配置

### 生產環境端口
```yaml
服務端口配置:
  PostgreSQL:     5432:5432   # 主資料庫
  Redis:          6381:6379   # 快取服務 (避免衝突)
  MinIO API:      9000:9000   # 物件儲存
  MinIO Console:  9090:9090   # 管理控制台
  Nginx HTTP:     80:80       # Web 服務
  Nginx HTTPS:    443:443     # SSL 服務
  Go Backend:     8082:8080   # 後端 API
  Laravel Web:    8083:80     # 前端應用
```

### 測試環境端口 (Sandbox)
```yaml
測試端口配置:
  PostgreSQL:     5433:5432   # 測試資料庫
  Redis:          6380:6379   # 測試快取
  Backend API:    8081:8080   # 測試後端
  Frontend:       8081:80     # 測試前端
  MinIO API:      9001:9000   # 測試物件儲存
  MailHog SMTP:   1026:1025   # 測試郵件
  MailHog Web:    8026:8025   # 郵件 Web UI
  Adminer:        8086:8080   # 資料庫管理
```

### 本地開發端口
```yaml
本地服務:
  Laravel Main:   127.0.0.1:8000   # 主要開發伺服器
  Laravel Admin:  127.0.0.1:8001   # 管理面板
  Neo4j:         localhost:7687     # 圖形資料庫
  Ollama:        127.0.0.1:11434   # AI 模型服務
  Queue Worker:   8084             # 佇列處理器
```

## 資料庫架構

### PostgreSQL 16 特性運用
- **高併發處理**: 利用寫入吞吐量 2 倍提升
- **JSON 支援**: JSON_TABLE、JSON_EXISTS、JSON_QUERY 功能
- **查詢優化**: 並行 FULL/RIGHT 連接、增量排序
- **效能監控**: pg_stat_io 細粒度 I/O 分析

### 資料庫設計原則
- **正規化**: 減少資料冗餘，邏輯組織結構
- **索引策略**: 基於查詢模式的智慧索引
- **分區策略**: 大表分區提升查詢效能
- **備份策略**: 完整 + 增量備份機制

## 安全架構

### 認證與授權
```
Security Architecture:
├── Backend: JWT Token Authentication
├── Frontend: Laravel Breeze + Session
├── Social Login: Laravel Socialite (Line)
├── API Security: Rate Limiting + CORS
├── Database: Connection Pooling + SSL
└── Storage: MinIO Access Control
```

### 資料保護
- **傳輸加密**: HTTPS/TLS 1.3
- **資料加密**: PostgreSQL 透明資料加密
- **存取控制**: 角色基礎權限管理
- **稽核日誌**: 完整的操作記錄

## 容器化架構

### Docker Compose 服務
```yaml
Container Services:
  nexus-postgres:     # PostgreSQL 資料庫容器
  nexus-redis:        # Redis 快取容器
  nexus-minio:        # MinIO 物件儲存容器
  nexus-nginx:        # Nginx 代理容器
  nexus-go-backend:   # Go 後端 API 容器
  nexus-laravel:      # Laravel 前端容器
```

### 容器網路
- **網路名稱**: nexus-network (bridge mode)
- **服務發現**: 容器名稱解析
- **健康檢查**: 所有服務配置健康檢查
- **資料持久化**: Named volumes 資料保存

## 開發工作流程

### 本地開發環境
```bash
Development Workflow:
├── Backend Development:
│   ├── go mod download
│   ├── go run cmd/main.go
│   └── Testing: go test ./...
├── Frontend Development:
│   ├── composer install
│   ├── npm install && npm run dev
│   └── Testing: php artisan test
└── Container Management:
    ├── docker-compose up -d
    └── docker-compose ps
```

### 建置與部署
- **建置工具**: Makefile + Composer + NPM
- **自動化**: GitHub Actions CI/CD (計劃中)
- **部署策略**: 藍綠部署 + 健康檢查
- **回滾機制**: 版本標籤 + 快速回滾

## 監控與日誌

### 監控策略
```
Monitoring Stack:
├── Application Metrics: 
│   ├── Go: 內建 metrics 端點
│   └── Laravel: Laravel Telescope (計劃)
├── Infrastructure Metrics:
│   ├── PostgreSQL: pg_stat 系列視圖
│   ├── Redis: INFO 指令監控
│   └── Nginx: 存取和錯誤日誌
└── Health Checks:
    └── 所有服務配置健康檢查端點
```

### 日誌管理
- **集中式日誌**: 所有服務統一日誌格式
- **結構化日誌**: JSON 格式便於解析
- **日誌等級**: DEBUG/INFO/WARN/ERROR
- **日誌輪轉**: 按日期和大小輪轉

## 擴展性設計

### 水平擴展準備
- **無狀態服務**: 後端 API 設計為無狀態
- **資料庫分片**: PostgreSQL 支援分片擴展
- **快取分散**: Redis Cluster 支援
- **負載平衡**: Nginx upstream 配置

### 垂直整合能力
- **微服務邊界**: 清晰的服務職責劃分
- **API 版本控制**: RESTful API 版本管理
- **事件驅動**: 支援未來事件驅動架構
- **插件機制**: Laravel 套件生態系統

## 開發規範整合

### 程式碼品質
- **測試覆蓋率**: 80% 以上強制要求
- **程式碼審查**: 完整的 Code Review 流程
- **文件同步**: 技術文件與程式碼同步更新
- **標準遵循**: PSR-12 (PHP)、Go 官方風格指南

### 專案管理
- **TaskMaster 整合**: 完整的任務追蹤機制
- **記錄規範**: Task-Update.md 技術記錄
- **暫停機制**: 主要任務完成後強制暫停
- **知識管理**: memory-bank 知識庫維護

這個架構設計確保了 NexusERP 系統的高效能、高可用性、可擴展性和可維護性，同時符合現代 ERP 系統的架構最佳實踐。