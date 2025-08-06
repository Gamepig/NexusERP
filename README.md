# NexusERP 企業資源規劃系統

企業級 ERP 解決方案，提供全面的業務管理功能與企業級安全保障。

## 🏗️ 系統架構

### 前端
- **PHP Laravel** - 主要業務邏輯和用戶介面
- **響應式設計** - 支援桌面和行動裝置
- **深色主題** - 現代化用戶體驗

### 後端
- **Go (Golang)** - 高效能 API 服務
- **RESTful API** - 標準化介面設計
- **微服務架構** - 可擴展的服務架構

### 資料庫
- **PostgreSQL** - 主要業務資料
- **Redis** - 快取和會話管理
- **資料加密** - AES-256-GCM 敏感資料保護

### 基礎設施
- **Nginx** - 反向代理和負載平衡
- **Docker** - 容器化部署
- **SSL/TLS** - 企業級傳輸加密

## 📁 檔案結構

```
├── frontend/                   # PHP Laravel 前端
│   ├── app/                   # 應用程式邏輯
│   ├── resources/             # 視圖、CSS、JS 資源
│   ├── public/                # 公開資源
│   └── config/                # 配置檔案
├── backend/                   # Go 後端 API
│   ├── cmd/                   # 主程式和工具
│   ├── internal/              # 內部套件
│   │   ├── api/              # API 處理器
│   │   ├── services/         # 業務邏輯服務
│   │   ├── middleware/       # 中介軟體
│   │   └── database/         # 資料庫操作
│   └── tests/                # 測試檔案
├── database/                  # 資料庫相關
│   ├── migrations/           # 資料庫遷移
│   └── seeders/             # 測試資料
├── nginx/                    # Nginx 配置
│   └── conf.d/              # 安全配置
├── scripts/                  # 部署和維護腳本
├── documents/               # 文件和規範
└── style/                   # 風格指南
```

## 🔒 安全設計

NexusERP 實施了全面的企業級安全框架，符合國際資安標準和法規要求。

### 核心安全功能

#### 🛡️ 認證與授權
- **多層認證系統**
  - JWT Token 基礎認證
  - 多因素認證 (MFA) 支援
  - 角色基礎存取控制 (RBAC)
  - 實施位置：`backend/internal/middleware/auth_middleware.go`

- **密碼安全政策**
  - 強制複雜密碼要求
  - 自動弱密碼檢測
  - 密碼歷史記錄和到期機制
  - 實施位置：`backend/internal/services/auth_service.go`

#### 🔐 資料保護
- **傳輸加密**
  - 強制 HTTPS (TLS 1.2+)
  - 現代加密套件配置
  - HSTS 和安全標頭實施
  - 配置位置：`nginx/conf.d/ssl-security.conf`

- **靜態資料加密**
  - AES-256-GCM 演算法
  - PBKDF2 金鑰衍生
  - 搜索友好的雜湊機制
  - 實施位置：`backend/internal/services/encryption_service.go`

#### 🚨 威脅防護
- **OWASP Top 10 防護**
  - SQL 注入防護：參數化查詢
  - XSS 防護：內容安全政策 (CSP)
  - CSRF 防護：Token 驗證
  - 詳細報告：`documents/OWASP_TOP_10_SECURITY_AUDIT_REPORT.md`

- **速率限制與 DDoS 防護**
  - Redis 基礎速率限制
  - IP 基礎請求限制
  - Fail2Ban 入侵防護
  - 實施位置：`backend/internal/services/rate_limit_service.go`

#### 📊 監控與審計
- **安全監控**
  - 即時威脅檢測
  - 異常行為監控
  - 自動化回應機制
  - 監控腳本：`scripts/security_scan.sh`

- **審計日誌**
  - 完整操作記錄
  - 不可篡改日誌
  - 法規合規支援
  - 實施位置：`backend/internal/services/audit_service.go`

### 安全配置與工具

#### 🔧 自動化安全工具
- **安全掃描腳本**
  ```bash
  # 執行全面安全掃描
  ./scripts/security_scan.sh
  
  # SSL/TLS 安全配置
  ./scripts/setup_ssl_security.sh
  ```

- **資料加密工具**
  ```bash
  # 加密敏感資料
  go run backend/cmd/encrypt_data.go
  
  # 解密資料（僅限維護）
  go run backend/cmd/encrypt_data.go --decrypt
  ```

#### 🛡️ 網路安全
- **防火牆配置**
  - 嚴格的入站/出站規則
  - 僅開放必要埠號
  - IP 白名單機制

- **SSL/TLS 強化**
  - 禁用舊版協議
  - 強制現代加密套件
  - OCSP Stapling 支援

### 安全測試與驗證

#### 🧪 自動化安全測試
- **滲透測試模擬**
  - SQL 注入測試
  - XSS 攻擊模擬
  - 認證繞過測試
  - 測試套件：`backend/tests/security_test.go`

- **依賴漏洞掃描**
  - Go 模組安全掃描
  - NPM 套件漏洞檢查
  - 定期安全更新

#### 📋 合規性與政策
- **安全政策文件**
  - 完整安全政策：`documents/SECURITY_POLICIES_AND_PROCEDURES.md`
  - 事件回應程序
  - 合規性檢查清單

- **風險管理**
  - 定期風險評估
  - 威脅建模分析
  - 安全意識培訓

## 🚀 快速開始

### 環境要求
- **Go** 1.21+
- **PHP** 8.1+
- **PostgreSQL** 13+
- **Redis** 6+
- **Nginx** 1.20+

### 安裝步驟

1. **複製專案**
   ```bash
   git clone https://github.com/your-org/nexus-erp.git
   cd nexus-erp
   ```

2. **設定環境變數**
   ```bash
   cp .env.example .env
   # 編輯 .env 檔案，設定資料庫和安全金鑰
   ```

3. **安裝依賴**
   ```bash
   # 後端依賴
   cd backend && go mod download
   
   # 前端依賴
   cd frontend && composer install && npm install
   ```

4. **資料庫設定**
   ```bash
   # 執行資料庫遷移
   cd backend && go run cmd/migrate.go
   
   # Laravel 遷移
   cd frontend && php artisan migrate
   ```

5. **安全設定**
   ```bash
   # 設定 SSL/TLS 和安全配置
   sudo ./scripts/setup_ssl_security.sh
   
   # 加密敏感資料
   go run backend/cmd/encrypt_data.go
   ```

6. **啟動服務**
   ```bash
   # 啟動後端 API
   cd backend && go run cmd/main.go
   
   # 啟動前端服務
   cd frontend && php artisan serve
   ```

## 🌐 系統存取

### 主要系統網址

#### 前台使用者介面
- **主要網址**: http://127.0.0.1:8000
- **功能**: 一般使用者介面、業務操作、資料管理
- **登入方式**: Google OAuth、LINE OAuth、電子郵件註冊

#### 後台管理系統
- **管理網址**: http://127.0.0.1:8000/admin
- **登入頁面**: http://127.0.0.1:8000/admin/login
- **功能**: 系統管理、使用者管理、訂單管理、財務管理

### 🔐 後台管理帳號

#### 管理員帳號
- **使用者名稱**: `admin`
- **密碼**: `NexusERP@Admin2025!SecurePass#789`
- **權限**: 完整系統管理權限
- **功能**: 
  - 使用者管理（新增、編輯、刪除）
  - 訂單管理和編輯
  - 財務資料管理
  - 系統設定

#### 展示帳號
- **使用者名稱**: `DEMO`
- **密碼**: `DEMO`
- **權限**: 僅限觀看，無編輯權限
- **功能**:
  - 查看所有管理介面
  - 瀏覽使用者資料
  - 查看訂單和財務資料
  - 嘗試編輯時顯示權限警告

### 🎛️ 後台管理功能

#### 主控台 (`/admin`)
- 系統統計資料總覽
- 快速動作連結
- 使用者活動監控

#### 使用者管理 (`/admin/users`)
- 使用者列表和詳細資訊
- 新增、編輯、刪除使用者
- 角色和權限管理
- 使用者活動記錄

#### 訂單管理 (`/admin/orders`)
- 所有銷售訂單總覽
- 訂單狀態管理
- 訂單詳細資訊編輯
- 客戶資訊關聯

#### 財務管理 (`/admin/finance`)
- **應收帳款** (`/admin/finance/receivables`)
- **應付帳款** (`/admin/finance/payables`)
- **發票管理** (`/admin/finance/invoices`)
- **付款記錄** (`/admin/finance/payments`)

### 🔒 安全特性

#### 後台安全防護
- 獨立認證系統（不依賴前台認證）
- Session 基礎身份驗證
- CSRF 保護和表單驗證
- 權限分級控制

#### DEMO 帳號限制
- 所有刪除操作顯示權限警告
- 新增功能按鈕自動禁用
- 編輯操作包含權限檢查
- 操作嘗試記錄安全日誌

## 🧪 測試

### 功能測試
```bash
# 後端測試
cd backend && go test ./...

# 安全測試
cd backend && go test ./tests/security_test.go -v
```

### 安全掃描
```bash
# 執行全面安全掃描
./scripts/security_scan.sh

# 檢查依賴漏洞
cd backend && go list -json -deps ./... | nancy sleuth
cd frontend && npm audit
```

## 📚 文件與資源

### 主要文件
- **[安全政策與程序](documents/SECURITY_POLICIES_AND_PROCEDURES.md)** - 完整安全框架
- **[OWASP 安全審計報告](documents/OWASP_TOP_10_SECURITY_AUDIT_REPORT.md)** - 安全評估結果
- **[風格指南](style/style-guide.md)** - UI/UX 設計規範
- **[資料庫規範](documents/database_spec.md)** - 資料庫設計文件

### 技術參考
- **[Claude Code 開發規範](documents/claude_code_rules.md)** - 開發標準和規範
- **[技術名詞對照](documents/CS_TW_CN_TERMS.md)** - 中英文技術術語

### 安全工具
- **[安全掃描腳本](scripts/security_scan.sh)** - 自動化安全檢查
- **[SSL 設定腳本](scripts/setup_ssl_security.sh)** - 安全配置自動化
- **[資料加密工具](backend/cmd/encrypt_data.go)** - 敏感資料保護

## 🤝 貢獻指南

1. **Fork** 專案到你的 GitHub 帳號
2. **建立** 功能分支 (`git checkout -b feature/amazing-feature`)
3. **遵循** 安全開發規範和程式碼品質標準
4. **執行** 安全測試和程式碼掃描
5. **提交** 變更 (`git commit -m 'Add amazing feature'`)
6. **推送** 到分支 (`git push origin feature/amazing-feature`)
7. **開啟** Pull Request

### 安全開發要求
- 所有程式碼必須通過安全掃描
- 新功能必須包含安全測試
- 敏感資料處理必須遵循加密政策
- 所有 API 必須實施適當的認證和授權

---

**NexusERP** - 企業級安全，現代化體驗 🚀 