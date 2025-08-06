# NexusERP 後端功能檔案結構與詳細說明

> 本文件依據前端頁面需求、API 規劃、資料庫設計與專案概覽，規劃後端主要功能檔案，並詳細說明每個檔案的核心函數、變數與用途。所有檔案皆以 Golang/Gin 為主體，遵循 RESTful API、分層設計與高可維護性原則。

---

## 1. 專案目錄結構建議

```
backend/
  ├── main.go                # 入口點，啟動 Gin 伺服器與路由
  ├── config/                # 設定檔與環境變數管理
  ├── api/                   # API 路由與控制器
  │     ├── users.go         # 用戶管理 API
  │     ├── auth.go          # 認證/授權 API
  │     ├── companies.go     # 公司管理 API
  │     ├── business_units.go# 業務單位 API
  │     ├── employees.go     # 員工管理 API
  │     ├── products.go      # 商品管理 API
  │     ├── categories.go    # 商品分類 API
  │     ├── units.go         # 計量單位 API
  │     ├── warehouses.go    # 倉庫管理 API
  │     ├── inventory.go     # 庫存/異動/盤點 API
  │     ├── suppliers.go     # 供應商管理 API
  │     ├── purchase_orders.go # 採購單 API
  │     ├── sales_orders.go  # 銷售單 API
  │     ├── invoices.go      # 發票/財務 API
  │     ├── bi.go            # BI/報表 API
  │     ├── notifications.go # 通知中心 API
  │     ├── attachments.go   # 檔案上傳/附件 API
  │     ├── iot.go           # IoT 裝置 API
  │     ├── blockchain.go    # 區塊鏈 API
  │     ├── ocr.go           # OCR 服務 API
  │     └── ...
  ├── models/                # 資料庫模型（GORM）
  │     ├── user.go
  │     ├── company.go
  │     ├── product.go
  │     ├── ...
  ├── services/              # 業務邏輯/服務層
  │     ├── user_service.go
  │     ├── auth_service.go
  │     ├── ...
  ├── middleware/            # Gin 中介層（JWT、RBAC、日誌等）
  ├── utils/                 # 工具函式（加密、驗證、格式化等）
  ├── docs/                  # Swagger/OpenAPI 文件
  └── ...
```

---

## 2. 主要功能檔案與內容說明

### 2.1 main.go
- **用途**：專案啟動點，載入設定、初始化資料庫、註冊路由與中介層。
- **主要函數**：
  - `main()`：主函數，啟動伺服器。
  - `setupRouter()`：註冊所有 API 路由。
  - `initDB()`：初始化資料庫連線。
  - `loadConfig()`：載入設定檔與環境變數。

### 2.2 config/
- **用途**：集中管理設定檔、環境變數、連線參數。
- **主要變數/函數**：
  - `Config` 結構體：包含 DB、Redis、MinIO、JWT 等設定欄位。
  - `LoadConfig()`：讀取 .env 或 config.yaml。

### 2.3 api/（每個資源一檔）
#### users.go
- **用途**：用戶 CRUD、查詢、狀態切換、審計。
- **主要函數**：
  - `CreateUser(c *gin.Context)`：建立新用戶
  - `GetUsers(c *gin.Context)`：查詢用戶清單（支援分頁、篩選）
  - `GetUserByID(c *gin.Context)`：查詢單一用戶
  - `UpdateUser(c *gin.Context)`：更新用戶資料
  - `DeleteUser(c *gin.Context)`：軟刪除用戶
  - `GetUserActivity(c *gin.Context)`：查詢用戶操作紀錄
- **主要變數**：
  - `User` 結構體（models.User）

#### auth.go
- **用途**：登入、登出、JWT 驗證、OAuth2、RBAC 權限。
- **主要函數**：
  - `Login(c *gin.Context)`：用戶登入，回傳 JWT
  - `Logout(c *gin.Context)`：用戶登出
  - `Verify(c *gin.Context)`：驗證用戶身份
  - `RefreshToken(c *gin.Context)`：刷新 JWT
  - `Register(c *gin.Context)`：註冊新用戶
- **主要變數**：
  - `AuthRequest`、`AuthResponse` 結構體

#### companies.go
- **用途**：公司 CRUD、成員管理。
- **主要函數**：
  - `CreateCompany(c *gin.Context)`
  - `GetCompanies(c *gin.Context)`
  - `GetCompanyByID(c *gin.Context)`
  - `UpdateCompany(c *gin.Context)`
  - `DeleteCompany(c *gin.Context)`
  - `GetCompanyUsers(c *gin.Context)`
- **主要變數**：
  - `Company` 結構體

#### business_units.go
- **用途**：業務單位 CRUD、成員管理。
- **主要函數**：同上
- **主要變數**：`BusinessUnit` 結構體

#### employees.go
- **用途**：員工 CRUD、查詢、異動。
- **主要函數**：同上
- **主要變數**：`Employee` 結構體

#### products.go
- **用途**：商品 CRUD、查詢、庫存查詢。
- **主要函數**：
  - `CreateProduct(c *gin.Context)`
  - `GetProducts(c *gin.Context)`
  - `GetProductByID(c *gin.Context)`
  - `UpdateProduct(c *gin.Context)`
  - `DeleteProduct(c *gin.Context)`
  - `GetProductInventory(c *gin.Context)`
- **主要變數**：`Product` 結構體

#### categories.go
- **用途**：商品分類 CRUD、多層分類。
- **主要函數**：同上
- **主要變數**：`ProductCategory` 結構體

#### units.go
- **用途**：計量單位 CRUD。
- **主要函數**：同上
- **主要變數**：`UnitOfMeasure` 結構體

#### warehouses.go
- **用途**：倉庫 CRUD、庫存查詢。
- **主要函數**：同上
- **主要變數**：`Warehouse` 結構體

#### inventory.go
- **用途**：庫存異動、盤點、查詢。
- **主要函數**：
  - `GetInventoryLevels(c *gin.Context)`
  - `UpdateInventoryLevel(c *gin.Context)`
  - `CreateInventoryTransaction(c *gin.Context)`
  - `GetInventoryTransactions(c *gin.Context)`
  - `CreateStocktakingOrder(c *gin.Context)`
  - `CompleteStocktakingOrder(c *gin.Context)`
- **主要變數**：`InventoryLevel`、`InventoryTransaction`、`StocktakingOrder` 結構體

#### suppliers.go
- **用途**：供應商 CRUD、查詢。
- **主要函數**：同上
- **主要變數**：`Supplier` 結構體

#### purchase_orders.go
- **用途**：採購單 CRUD、收貨、審核。
- **主要函數**：
  - `CreatePurchaseOrder(c *gin.Context)`
  - `GetPurchaseOrders(c *gin.Context)`
  - `GetPurchaseOrderByID(c *gin.Context)`
  - `UpdatePurchaseOrder(c *gin.Context)`
  - `DeletePurchaseOrder(c *gin.Context)`
  - `ReceivePurchaseOrder(c *gin.Context)`
  - `ApprovePurchaseOrder(c *gin.Context)`
  - `CompletePurchaseOrder(c *gin.Context)`
- **主要變數**：`PurchaseOrder`、`PurchaseOrderItem` 結構體

#### sales_orders.go
- **用途**：銷售單 CRUD、出貨、結案。
- **主要函數**：同上
- **主要變數**：`SalesOrder`、`SalesOrderItem` 結構體

#### invoices.go
- **用途**：發票 CRUD、查詢、作廢。
- **主要函數**：同上
- **主要變數**：`Invoice` 結構體

#### bi.go
- **用途**：BI 報表查詢、自訂儀表板。
- **主要函數**：
  - `GetBIReports(c *gin.Context)`
  - `CreateBIReport(c *gin.Context)`
  - `UpdateBIReport(c *gin.Context)`
  - `DeleteBIReport(c *gin.Context)`
- **主要變數**：`BIReport` 結構體

#### notifications.go
- **用途**：通知推播、訊息中心。
- **主要函數**：
  - `SendNotification(c *gin.Context)`
  - `GetNotifications(c *gin.Context)`
  - `UpdateNotification(c *gin.Context)`
  - `DeleteNotification(c *gin.Context)`
- **主要變數**：`Notification` 結構體

#### attachments.go
- **用途**：檔案上傳、附件管理。
- **主要函數**：
  - `UploadAttachment(c *gin.Context)`
  - `GetAttachments(c *gin.Context)`
  - `DeleteAttachment(c *gin.Context)`
- **主要變數**：`Attachment` 結構體

#### iot.go
- **用途**：IoT 裝置 CRUD、資料查詢。
- **主要函數**：同上
- **主要變數**：`IoTDevice` 結構體

#### blockchain.go
- **用途**：區塊鏈交易紀錄。
- **主要函數**：
  - `CreateBlockchainTx(c *gin.Context)`
  - `GetBlockchainTxs(c *gin.Context)`
  - `GetBlockchainTxByID(c *gin.Context)`
- **主要變數**：`BlockchainTx` 結構體

#### ocr.go
- **用途**：OCR 文件上傳、辨識、結果查詢。
- **主要函數**：
  - `UploadOCRDocument(c *gin.Context)`
  - `GetOCRResult(c *gin.Context)`
- **主要變數**：`OCRDocument` 結構體

---

## 3. models/（資料庫模型）
- 每個資源一個結構體，對應 database_spec.md 的表格設計。
- 例如：User, Company, Product, InventoryLevel, PurchaseOrder, SalesOrder, Invoice, Notification, Attachment, IoTDevice, BlockchainTx, 等。
- 每個結構體包含欄位、GORM 標籤、關聯（如 has-many, belongs-to）。

---

## 4. services/（業務邏輯層）
- 每個資源一個 service 檔案，封裝複雜邏輯、跨表操作、交易處理。
- 例如：
  - `UserService`：用戶註冊、密碼加密、權限檢查
  - `InventoryService`：庫存異動、盤點調整、預警
  - `OrderService`：採購/銷售單流程、狀態流轉
  - `NotificationService`：推播、訊息中心

---

## 5. middleware/（中介層）
- JWT 驗證、RBAC 權限、日誌、錯誤處理、CORS 等。
- 例如：
  - `JWTMiddleware`：驗證 JWT Token
  - `RBACMiddleware`：檢查用戶權限
  - `LoggerMiddleware`：請求日誌

---

## 6. utils/（工具函式）
- 密碼加密、資料驗證、格式化、檔案處理、第三方 API 整合。
- 例如：
  - `HashPassword(password string) string`
  - `CheckPassword(hash, password string) bool`
  - `ValidateEmail(email string) bool`
  - `FormatDate(t time.Time) string`

---

## 7. docs/（API 文件）
- OpenAPI/Swagger 規格檔，與 API 程式碼同步。

---

> 本文件為 NexusERP 後端開發檔案結構與功能說明唯一依據，所有新開發、維護、AI 生成程式碼皆需遵循本規範。若有異動，請同步更新本文件與 OpenAPI 文件。 