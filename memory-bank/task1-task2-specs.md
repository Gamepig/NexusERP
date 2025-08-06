# TaskMaster 任務 1 & 2 詳細規格與設計文件

**更新時間：** 2025-07-18  
**目的：** 確保後續開發遵循原始設計，避免函數、變數名稱不符合的狀況

---

## 📋 開發規則與檢查清單

### 🔥 重要規則
1. **所有跟資料庫相關的設計，都必須參考文件** `/Users/gamepig/projects/NexusERP/documents/database_spec.md`
2. **在寫新函數或變數前，先檢查專案文件，是否已有寫過，不要重複程式碼**
3. **遵循命名規範文件** （詳見下方命名規範文件位置）

### 📂 關鍵規範文件位置
- **API 命名規範：** `/Users/gamepig/projects/NexusERP/documents/API_Planning_Document.md#命名慣例與版本控制建議`
- **後端檔案結構：** `/Users/gamepig/projects/NexusERP/documents/backend_file_structure_spec.md`
- **資料庫規格：** `/Users/gamepig/projects/NexusERP/documents/database_spec.md`
- **Go/Gin 最佳實踐：** `/Users/gamepig/projects/NexusERP/documents/Go_Gin_API_Best_Practices.md`
- **開發規範：** `/Users/gamepig/projects/NexusERP/documents/claude_code_rules.md`

---

## 🏗️ 任務 1：Phase 0 - Setup Dockerized Development Environment

### ✅ 已完成項目
- Docker Compose 環境設定
- PostgreSQL 資料庫 (nexus_erp)
- Redis 快取服務
- MinIO 物件儲存 (S3 相容)
- Nginx 反向代理

### 🔧 技術規格
- **PostgreSQL 16** - 主要資料庫
- **Redis 7** - 快取與會話管理
- **MinIO** - 檔案儲存
- **Nginx** - 反向代理和負載平衡
- **Docker Compose** - 容器編排

### 🌐 服務端口配置
- PostgreSQL: `5432`
- Redis: `6381` (外部存取)
- MinIO API: `9000`
- MinIO Console: `9090`
- Nginx: `80`, `443`
- Go Backend: `8082` (外部存取)

### 📊 資料庫連接配置
```yaml
DB_HOST: postgres
DB_PORT: 5432
DB_NAME: nexus_erp
DB_USER: nexus
DB_PASSWORD: securepassword
DB_SSLMODE: disable
```

---

## 🔐 任務 2：Phase 0 - Initialize Go/Gin Backend API Boilerplate

### ✅ 已完成的子任務

#### 2.1 資料庫架構設計
- **遵循規格：** `/Users/gamepig/projects/NexusERP/documents/database_spec.md`
- **已建立資料表：**
  - `users` - 用戶主檔 (BIGSERIAL, username, email, password_hash, AI 分類等)
  - `roles` - 角色管理 (BIGSERIAL)
  - `permissions` - 權限管理 (BIGSERIAL)
  - `user_roles` - 用戶角色關聯 (多對多)
  - `role_permissions` - 角色權限關聯 (多對多)
  - `password_reset_tokens` - 密碼重置令牌

#### 2.2 用戶註冊 API 端點
- **路徑：** `POST /api/auth/register`
- **函數：** `AuthHandler.Register(c *gin.Context)`
- **位置：** `/Users/gamepig/projects/NexusERP/backend/internal/handlers/auth_handler.go`
- **功能：** 用戶註冊、密碼加密、輸入驗證

#### 2.3 用戶登入和 JWT 生成
- **路徑：** `POST /api/auth/login` (用戶名登入)
- **路徑：** `POST /api/auth/login-email` (電子郵件登入)
- **函數：** `AuthHandler.Login(c *gin.Context)`, `AuthHandler.LoginByEmail(c *gin.Context)`
- **JWT 工具：** `/Users/gamepig/projects/NexusERP/backend/internal/utils/jwt.go`

#### 2.4 認證中間件
- **中間件：** `AuthMiddleware.RequireAuth()`
- **位置：** `/Users/gamepig/projects/NexusERP/backend/internal/middleware/auth_middleware.go`
- **受保護端點：** `GET /api/users/me`

---

## 🏗️ 專案結構設計

### 📁 後端目錄結構 (已實現)
```
backend/
├── cmd/main.go                           # 應用程式入口點
├── internal/
│   ├── config/config.go                 # 配置管理
│   ├── database/db.go                   # 資料庫連接
│   ├── handlers/                        # HTTP 處理器
│   │   ├── auth_handler.go             # 認證相關 API
│   │   └── user_handler.go             # 用戶相關 API
│   ├── middleware/                      # 中間件
│   │   └── auth_middleware.go          # 認證中間件
│   ├── models/user.go                   # 資料模型
│   ├── services/user_service.go         # 業務邏輯層
│   └── utils/jwt.go                     # JWT 工具
├── migrations/                          # 資料庫遷移
│   ├── 000001_create_users_table.up.sql
│   └── 000001_create_users_table.down.sql
├── go.mod                               # Go 模組依賴
├── go.sum                               # Go 模組檢查和
└── .env                                 # 環境變數
```

### 📋 關鍵函數與變數命名規範

#### 🔧 結構體命名 (Pascal Case)
```go
// 用戶相關
type User struct                         // 用戶主檔
type Role struct                         // 角色
type Permission struct                   // 權限
type UserRole struct                     // 用戶角色關聯
type RolePermission struct               // 角色權限關聯
type PasswordResetToken struct           // 密碼重置令牌

// 請求/回應結構
type CreateUserRequest struct            // 註冊請求
type LoginRequest struct                 // 登入請求
type LoginByEmailRequest struct          // 電子郵件登入請求
type LoginResponse struct                // 登入回應
type UserResponse struct                 // 用戶回應
```

#### 🎯 函數命名 (camelCase/PascalCase)
```go
// 服務層函數 (UserService)
func (s *UserService) CreateUser(req *CreateUserRequest) (*User, error)
func (s *UserService) GetUserByUsername(username string) (*User, error)
func (s *UserService) GetUserByEmail(email string) (*User, error)
func (s *UserService) GetUserByID(id int64) (*User, error)
func (s *UserService) ValidatePassword(user *User, password string) error
func (s *UserService) GenerateJWT(user *User, jwtSecret string) (string, error)

// 處理器函數 (AuthHandler)
func (h *AuthHandler) Register(c *gin.Context)
func (h *AuthHandler) Login(c *gin.Context)
func (h *AuthHandler) LoginByEmail(c *gin.Context)

// 中間件函數 (AuthMiddleware)
func (m *AuthMiddleware) RequireAuth() gin.HandlerFunc

// 工具函數 (JWT)
func GenerateJWT(userID int64, username, secret string) (string, error)
func ValidateJWT(tokenString, secret string) (*Claims, error)
```

#### 🗂️ 資料庫欄位命名 (snake_case)
```sql
-- 用戶表欄位
id                     BIGSERIAL
username               VARCHAR(64)
email                  VARCHAR(128) 
password_hash          VARCHAR(128)
first_name             VARCHAR(64)
last_name              VARCHAR(64)
status                 VARCHAR(16)
ai_classification_yaml JSONB
registration_method    VARCHAR(32)
created_at             TIMESTAMP
updated_at             TIMESTAMP
deleted_at             TIMESTAMP
```

---

## 🔌 API 端點設計

### 🚀 已實現 API 端點

#### 🏥 健康檢查
- **GET** `/health` - 服務健康檢查
- **函數：** `UserHandler.Health(c *gin.Context)`

#### 🔐 認證相關
- **POST** `/api/auth/register` - 用戶註冊
- **POST** `/api/auth/login` - 用戶名登入
- **POST** `/api/auth/login-email` - 電子郵件登入

#### 👤 用戶相關 (受保護)
- **GET** `/api/users/me` - 取得個人資料

### 📋 API 命名規範 (遵循 API_Planning_Document.md)
- 路徑小寫、使用 snake_case
- 版本前綴：`/api/v1/` (目前暫用 `/api/`)
- 參數、欄位命名採用 snake_case
- RESTful 設計原則

---

## 🔧 技術實現細節

### 🛠️ 使用技術棧
- **Go 1.21** - 主要開發語言
- **Gin** - Web 框架
- **PostgreSQL** - 資料庫
- **JWT** - 認證機制
- **bcrypt** - 密碼加密
- **GORM** - ORM (預計後續使用)
- **Docker** - 容器化部署

### 🔐 安全實現
- **密碼加密：** bcrypt.DefaultCost
- **JWT 有效期：** 24 小時
- **Bearer Token 認證：** Authorization header
- **軟刪除：** deleted_at 欄位
- **輸入驗證：** Gin binding tags

### 🌐 環境變數配置
```env
DB_HOST=postgres
DB_PORT=5432
DB_NAME=nexus_erp
DB_USER=nexus
DB_PASSWORD=securepassword
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=redispassword
JWT_SECRET=your-jwt-secret-key-here-make-it-long-and-secure
APP_ENV=development
APP_PORT=8080
APP_DEBUG=true
```

---

## 🧪 測試結果

### ✅ 端點測試狀態
- 🟢 `GET /health` - 正常運行
- 🟢 `POST /api/auth/register` - 用戶註冊成功
- 🟢 `POST /api/auth/login` - 登入成功，JWT 生成
- 🟢 `GET /api/users/me` - 受保護端點驗證成功

### 📊 測試數據示例
```json
// 註冊成功回應
{
  "message": "User created successfully",
  "user": {
    "id": 1,
    "username": "testuser",
    "email": "test@example.com",
    "first_name": "Test",
    "last_name": "User",
    "status": "active",
    "registration_method": "traditional",
    "created_at": "2025-07-17T20:12:26.42386Z",
    "updated_at": "2025-07-17T20:12:26.42386Z"
  }
}

// 登入成功回應
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { ... }
}
```

---

## 🔮 後續開發指引

### 📝 開發前檢查清單
1. ✅ 檢查 `/Users/gamepig/projects/NexusERP/documents/database_spec.md` 是否有相關資料表定義
2. ✅ 查看 `/Users/gamepig/projects/NexusERP/documents/backend_file_structure_spec.md` 確認函數命名
3. ✅ 參考 `/Users/gamepig/projects/NexusERP/documents/API_Planning_Document.md` 的 API 設計
4. ✅ 確認是否已有類似功能的函數存在，避免重複開發

### 🎯 下一個任務：任務 3 - PHP/Laravel Frontend Boilerplate
- 前端框架設定
- 與後端 API 整合
- 用戶介面開發

---

## 🗂️ 附錄：相關文件索引

### 📋 命名規範文件
- **API 命名：** `/Users/gamepig/projects/NexusERP/documents/API_Planning_Document.md` (第8節)
- **後端結構：** `/Users/gamepig/projects/NexusERP/documents/backend_file_structure_spec.md`
- **Go 最佳實踐：** `/Users/gamepig/projects/NexusERP/documents/Go_Gin_API_Best_Practices.md`
- **CSS 命名：** `/Users/gamepig/projects/NexusERP/style/style-guide.md`

### 🗃️ 技術規格文件
- **資料庫規格：** `/Users/gamepig/projects/NexusERP/documents/database_spec.md`
- **前端結構：** `/Users/gamepig/projects/NexusERP/documents/frontend_file_structure_spec.md`
- **開發規範：** `/Users/gamepig/projects/NexusERP/documents/claude_code_rules.md`

### 🌍 語言規範
- **台灣用語：** `/Users/gamepig/projects/NexusERP/documents/reference/CS_TW_CN_TERMS.md`
- **補充用語：** `/Users/gamepig/projects/NexusERP/documents/reference/CS_TW_CN_TERMS_2.md`

---

*本文件為 NexusERP 任務 1 & 2 的完整規格記錄，所有後續開發都應參考此文件確保一致性。*