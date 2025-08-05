# 🔧 Go Backend Architect - 任務指引

**Agent**: Go Backend Architect  
**專業領域**: Go 微服務、PostgreSQL、API 設計、多租戶架構  
**開發週期**: 4 週  
**預估總工時**: 150 小時  

---

## 🎯 **核心職責**

### 主要目標
1. **多租戶安全架構**: 設計並實現基於 PostgreSQL RLS 的多租戶隔離
2. **高性能 API 服務**: 開發處理報表數據的 Go 微服務
3. **資料庫優化**: 實現 stored procedures 和性能調校
4. **系統整合**: 與 Laravel 前端和 React 界面無縫整合

### 技術棧
- **Go 1.21+**: 主要開發語言
- **Fiber 框架**: 高性能 HTTP 框架
- **PostgreSQL 15+**: 主資料庫，啟用 RLS
- **Redis**: 快取和會話管理
- **Docker**: 容器化部署
- **JWT**: 身份認證和授權

---

## 📋 **詳細任務清單**

### 🔒 **任務組 A1: 多租戶安全後端 (週 1-2, 50 小時)**

#### **A1.1: Go 微服務基礎架構 (12 小時)**

**目標**: 建立基礎的 Go 微服務框架

**技術實現**:
```go
// cmd/server/main.go
package main

import (
    "log"
    "os"
    "nexus-erp-api/internal/config"
    "nexus-erp-api/internal/server"
)

func main() {
    cfg := config.Load()
    
    srv := server.New(cfg)
    
    log.Printf("🚀 NexusERP API Server starting on port %s", cfg.Port)
    if err := srv.Start(); err != nil {
        log.Fatal("Failed to start server:", err)
    }
}

// internal/config/config.go
type Config struct {
    Port        string `env:"PORT" default:"8080"`
    DatabaseURL string `env:"DATABASE_URL" required:"true"`
    RedisURL    string `env:"REDIS_URL" required:"true"`
    JWTSecret   string `env:"JWT_SECRET" required:"true"`
}

// internal/server/server.go
type Server struct {
    app    *fiber.App
    config *config.Config
    db     *gorm.DB
    redis  *redis.Client
}

func New(cfg *config.Config) *Server {
    return &Server{
        app:    fiber.New(fiber.Config{
            ErrorHandler: errorHandler,
            Prefork:     false,
        }),
        config: cfg,
    }
}
```

**驗收標準**:
- [ ] Go 微服務成功啟動並監聽指定端口
- [ ] PostgreSQL 連接池正常建立
- [ ] Redis 連接正常，可進行快取操作
- [ ] 基礎路由和健康檢查端點運作
- [ ] 錯誤處理和日誌記錄機制完善

#### **A1.2: PostgreSQL RLS 策略實現 (15 小時)**

**目標**: 實現資料庫層級的多租戶隔離

**RLS 策略設計**:
```sql
-- migrations/001_enable_rls.sql
-- 啟用 RLS 對所有租戶相關表
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;

-- 建立應用程式角色
CREATE ROLE nexus_app_user;
GRANT CONNECT ON DATABASE nexus_erp TO nexus_app_user;
GRANT USAGE ON SCHEMA public TO nexus_app_user;

-- 建立基本的公司隔離策略
CREATE POLICY company_isolation ON customers
    FOR ALL TO nexus_app_user
    USING (company_id = current_setting('app.current_company_id', true)::int);

CREATE POLICY company_isolation ON products
    FOR ALL TO nexus_app_user
    USING (company_id = current_setting('app.current_company_id', true)::int);

-- 處理關聯表的策略（通過 JOIN 驗證）
CREATE POLICY company_isolation_order_items ON sales_order_items
    FOR ALL TO nexus_app_user
    USING (EXISTS (
        SELECT 1 FROM sales_orders 
        WHERE sales_orders.id = sales_order_items.sales_order_id 
        AND sales_orders.company_id = current_setting('app.current_company_id', true)::int
    ));
```

**Go 中間件實現**:
```go
// internal/middleware/tenant.go
func SetTenantContext() fiber.Handler {
    return func(c *fiber.Ctx) error {
        // 從 JWT token 或 session 獲取 company_id
        claims := c.Locals("user").(*jwt.Claims)
        companyID := claims.CompanyID
        
        if companyID == 0 {
            return fiber.ErrForbidden
        }
        
        // 設置 PostgreSQL 會話變數
        db := database.GetDB()
        if err := db.Exec("SET LOCAL app.current_company_id = ?", companyID).Error; err != nil {
            return fiber.ErrInternalServerError
        }
        
        // 將 company_id 存入 context
        c.Locals("company_id", companyID)
        
        return c.Next()
    }
}
```

**驗收標準**:
- [ ] 所有業務表都啟用 RLS 並有對應策略
- [ ] 中間件正確設置資料庫會話變數
- [ ] 跨租戶數據存取測試 100% 被阻擋
- [ ] 性能測試顯示 RLS 對查詢影響 < 10%
- [ ] 資料庫遷移腳本可重複執行

#### **A1.3: JWT 認證和權限管理 (12 小時)**

**目標**: 實現安全的身份認證和細粒度權限控制

**JWT 實現**:
```go
// internal/auth/jwt.go
type Claims struct {
    UserID    uint   `json:"user_id"`
    CompanyID uint   `json:"company_id"`
    Role      string `json:"role"`
    jwt.RegisteredClaims
}

func GenerateToken(user *models.User, companyID uint, role string) (string, error) {
    claims := &Claims{
        UserID:    user.ID,
        CompanyID: companyID,
        Role:      role,
        RegisteredClaims: jwt.RegisteredClaims{
            ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
            IssuedAt:  jwt.NewNumericDate(time.Now()),
            Issuer:    "nexus-erp",
        },
    }
    
    token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
    return token.SignedString([]byte(os.Getenv("JWT_SECRET")))
}

// internal/middleware/auth.go
func RequireAuth() fiber.Handler {
    return jwtware.New(jwtware.Config{
        SigningKey:     []byte(os.Getenv("JWT_SECRET")),
        ErrorHandler:   jwtError,
        SuccessHandler: jwtSuccess,
    })
}

func RequireRole(allowedRoles ...string) fiber.Handler {
    return func(c *fiber.Ctx) error {
        claims := c.Locals("user").(*jwt.Claims)
        
        for _, role := range allowedRoles {
            if claims.Role == role {
                return c.Next()
            }
        }
        
        return fiber.ErrForbidden
    }
}
```

**驗收標準**:
- [ ] JWT token 生成和驗證功能正常
- [ ] 權限中間件正確攔截未授權請求
- [ ] Token 刷新機制運作正常
- [ ] 不同角色 (admin, manager, user) 權限隔離正確
- [ ] 安全漏洞測試通過

#### **A1.4: 公司管理 API (11 小時)**

**目標**: 實現多租戶公司管理相關 API

**API 實現**:
```go
// internal/handlers/company.go
type CompanyHandler struct {
    companyService *services.CompanyService
}

// POST /api/companies/:id/invite-user
func (h *CompanyHandler) InviteUser(c *fiber.Ctx) error {
    var req InviteUserRequest
    if err := c.BodyParser(&req); err != nil {
        return fiber.ErrBadRequest
    }
    
    companyID := c.Locals("company_id").(uint)
    inviterID := c.Locals("user_id").(uint)
    
    invitation, err := h.companyService.InviteUser(companyID, inviterID, req)
    if err != nil {
        return err
    }
    
    return c.Status(201).JSON(fiber.Map{
        "success": true,
        "invitation": invitation,
    })
}

// GET /api/users/companies
func (h *CompanyHandler) GetUserCompanies(c *fiber.Ctx) error {
    userID := c.Locals("user_id").(uint)
    
    companies, err := h.companyService.GetUserCompanies(userID)
    if err != nil {
        return err
    }
    
    return c.JSON(fiber.Map{
        "companies": companies,
    })
}

// POST /api/users/switch-company
func (h *CompanyHandler) SwitchCompany(c *fiber.Ctx) error {
    var req SwitchCompanyRequest
    if err := c.BodyParser(&req); err != nil {
        return fiber.ErrBadRequest
    }
    
    userID := c.Locals("user_id").(uint)
    
    newToken, err := h.companyService.SwitchCompany(userID, req.CompanyID)
    if err != nil {
        return err
    }
    
    return c.JSON(fiber.Map{
        "success": true,
        "token": newToken,
    })
}
```

**驗收標準**:
- [ ] 用戶邀請 API 功能完整，郵件發送正常
- [ ] 公司切換 API 正確更換 JWT token
- [ ] 用戶公司列表 API 只返回有權限的公司
- [ ] API 響應時間 < 500ms
- [ ] 錯誤處理和驗證完善

### 📊 **任務組 A2: 報表資料處理服務 (週 2-3, 60 小時)**

#### **A2.1: 庫存報表 API 微服務 (15 小時)**

**目標**: 實現高性能的庫存報表數據處理

**服務實現**:
```go
// internal/services/inventory_report.go
type InventoryReportService struct {
    db    *gorm.DB
    cache *redis.Client
}

func (s *InventoryReportService) GetInventoryOverview(companyID uint, filters InventoryFilters) (*InventoryOverview, error) {
    // 快取策略
    cacheKey := fmt.Sprintf("inventory_overview:%d:%s", companyID, filters.Hash())
    
    var result InventoryOverview
    if cached := s.cache.Get(context.Background(), cacheKey).Val(); cached != "" {
        json.Unmarshal([]byte(cached), &result)
        return &result, nil
    }
    
    // 複雜查詢邏輯
    query := `
        WITH inventory_summary AS (
            SELECT 
                p.category,
                COUNT(*) as product_count,
                SUM(p.quantity) as total_quantity,
                SUM(p.quantity * p.unit_price) as total_value,
                AVG(p.quantity) as avg_quantity
            FROM products p
            WHERE p.company_id = $1 
                AND p.quantity > 0
                AND ($2::text IS NULL OR p.category = $2)
            GROUP BY p.category
        )
        SELECT 
            category,
            product_count,
            total_quantity,
            total_value,
            avg_quantity,
            ROUND((total_value / SUM(total_value) OVER()) * 100, 2) as percentage
        FROM inventory_summary
        ORDER BY total_value DESC;
    `
    
    var summaries []InventorySummary
    if err := s.db.Raw(query, companyID, filters.Category).Scan(&summaries).Error; err != nil {
        return nil, err
    }
    
    // 計算庫存趨勢
    trends, err := s.getInventoryTrends(companyID, filters.DateRange)
    if err != nil {
        return nil, err
    }
    
    result = InventoryOverview{
        Summary: summaries,
        Trends:  trends,
        GeneratedAt: time.Now(),
    }
    
    // 快取結果 (15 分鐘)
    jsonData, _ := json.Marshal(result)
    s.cache.Set(context.Background(), cacheKey, jsonData, 15*time.Minute)
    
    return &result, nil
}
```

**驗收標準**:
- [ ] 庫存總覽 API 返回正確的分類統計
- [ ] 庫存趨勢計算邏輯正確
- [ ] 快取機制有效，命中率 > 70%
- [ ] 查詢性能 < 100ms (10k 產品)
- [ ] 支援多種篩選條件

#### **A2.2: 財務計算邏輯實現 (20 小時)**

**目標**: 實現複雜的財務報表計算邏輯

**損益表計算**:
```go
// internal/services/financial_report.go
func (s *FinancialReportService) CalculateProfitLoss(companyID uint, period DatePeriod) (*ProfitLossReport, error) {
    // 使用 stored procedure 進行複雜計算
    query := `SELECT * FROM calculate_profit_loss($1, $2, $3)`
    
    var result ProfitLossData
    if err := s.db.Raw(query, companyID, period.StartDate, period.EndDate).Scan(&result).Error; err != nil {
        return nil, err
    }
    
    // 計算月度趨勢
    monthlyTrends := s.calculateMonthlyTrends(companyID, period)
    
    // 計算關鍵財務比率
    ratios := FinancialRatios{
        GrossMargin:     result.GrossProfit / result.Revenue * 100,
        NetMargin:       result.NetIncome / result.Revenue * 100,
        OperatingMargin: result.OperatingIncome / result.Revenue * 100,
    }
    
    return &ProfitLossReport{
        Data:         result,
        Trends:       monthlyTrends,
        Ratios:       ratios,
        GeneratedAt:  time.Now(),
    }, nil
}
```

**Stored Procedure**:
```sql
-- stored_procedures/calculate_profit_loss.sql
CREATE OR REPLACE FUNCTION calculate_profit_loss(
    p_company_id integer,
    p_start_date date,
    p_end_date date
)
RETURNS TABLE (
    revenue numeric,
    cogs numeric,
    gross_profit numeric,
    operating_expenses numeric,
    operating_income numeric,
    net_income numeric
) AS $$
BEGIN
    RETURN QUERY
    WITH revenue_calc AS (
        SELECT COALESCE(SUM(total_amount), 0) as total_revenue
        FROM sales_orders so
        WHERE so.company_id = p_company_id
            AND so.order_date BETWEEN p_start_date AND p_end_date
            AND so.status = 'completed'
    ),
    cogs_calc AS (
        SELECT COALESCE(SUM(soi.quantity * p.cost_price), 0) as total_cogs
        FROM sales_order_items soi
        JOIN sales_orders so ON soi.sales_order_id = so.id
        JOIN products p ON soi.product_id = p.id
        WHERE so.company_id = p_company_id
            AND so.order_date BETWEEN p_start_date AND p_end_date
            AND so.status = 'completed'
    ),
    expenses_calc AS (
        SELECT COALESCE(SUM(amount), 0) as total_expenses
        FROM expenses e
        WHERE e.company_id = p_company_id
            AND e.expense_date BETWEEN p_start_date AND p_end_date
    )
    SELECT 
        r.total_revenue,
        c.total_cogs,
        r.total_revenue - c.total_cogs,
        e.total_expenses,
        r.total_revenue - c.total_cogs - e.total_expenses,
        r.total_revenue - c.total_cogs - e.total_expenses
    FROM revenue_calc r, cogs_calc c, expenses_calc e;
END;
$$ LANGUAGE plpgsql STABLE;
```

**驗收標準**:
- [ ] 損益表計算邏輯正確，與會計準則一致
- [ ] 現金流量表三大活動分類正確
- [ ] Stored procedures 性能優異
- [ ] 財務比率計算準確
- [ ] 支援多種會計期間

#### **A2.3: 採購分析服務 (15 小時)**

**目標**: 實現採購相關的分析和報表功能

#### **A2.4: 員工統計 API (10 小時)**

**目標**: 實現員工出勤和績效統計功能

### 🔧 **任務組 A3: 系統整合和優化 (週 3-4, 40 小時)**

#### **A3.1: Excel/PDF 匯出服務 (15 小時)**
#### **A3.2: 監控和日誌系統 (10 小時)**
#### **A3.3: 性能優化和快取策略 (15 小時)**

---

## 🛠️ **開發環境設置**

### **必要工具**
```bash
# Go 環境
go version  # 需要 1.21+

# 依賴管理
go mod init nexus-erp-api
go get github.com/gofiber/fiber/v2
go get gorm.io/gorm
go get github.com/golang-jwt/jwt/v5
go get github.com/go-redis/redis/v8

# 開發工具
go install github.com/air-verse/air@latest  # 熱重載
go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest
```

### **專案結構**
```
nexus-erp-api/
├── cmd/
│   └── server/
│       └── main.go
├── internal/
│   ├── config/
│   ├── handlers/
│   ├── middleware/
│   ├── models/
│   ├── services/
│   └── database/
├── migrations/
├── stored_procedures/
├── docker/
├── scripts/
└── tests/
```

---

## 📊 **進度追蹤**

### **每日檢查點**
- [ ] 代碼提交和推送到版本控制
- [ ] 單元測試執行並通過
- [ ] API 端點測試驗證
- [ ] 性能基準測試記錄
- [ ] 技術文檔更新

### **週度里程碑**
- **週 1**: 多租戶基礎架構完成
- **週 2**: 核心報表 API 實現
- **週 3**: 系統整合和優化
- **週 4**: 測試和上線準備

### **品質標準**
- 代碼覆蓋率 > 85%
- API 響應時間 < 100ms
- 記憶體使用 < 512MB
- 並發處理 > 1000 req/s

---

**任務負責人**: Go Backend Architect Agent  
**技術導師**: 可諮詢其他 Agent 的技術支援  
**更新頻率**: 每日更新進度，週度調整計畫