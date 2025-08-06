# API安全強化方案

**階段**: 第一階段 - 安全基礎架構  
**預估時間**: 1週  
**優先級**: 🚨 高優先級 (安全關鍵)  

---

## 🎯 **實作目標**

### **核心目標**
- 實作API Rate Limiting防止濫用攻擊
- 強化CORS配置確保跨域安全
- 建立API存取記錄與監控系統
- 實作API Key管理機制
- 建立API安全監控告警

### **成功指標**
- ✅ API Rate Limiting正常運作，防止暴力攻擊
- ✅ CORS配置正確，無安全漏洞
- ✅ 完整的API存取日誌記錄
- ✅ API Key管理系統正常運作
- ✅ 安全監控告警及時觸發

---

## 📋 **現況分析**

### **當前API安全狀況** ⚠️
```go
// 當前問題分析 (基於現有架構)

// 1. 缺乏Rate Limiting
// 目前API端點沒有請求頻率限制，容易遭受：
// - 暴力破解攻擊
// - DDoS攻擊
// - 資源耗盡攻擊

// 2. CORS配置不完整
// 可能存在的問題：
// - 過於寬鬆的域名允許
// - 缺少預檢請求處理
// - Header控制不嚴格

// 3. 日誌記錄不足
// 當前缺乏：
// - 詳細的API存取記錄
// - 安全事件追蹤
// - 異常行為檢測
```

---

## 🔧 **詳細實作方案**

### **階段 3.1: Rate Limiting實作 (2天)**

#### **Redis-based Rate Limiter服務**
```go
// 檔案: internal/services/rate_limiter_service.go
package services

import (
    "context"
    "fmt"
    "strconv"
    "time"
    
    "github.com/go-redis/redis/v8"
)

type RateLimiterConfig struct {
    // 基礎配置
    WindowSize    time.Duration `mapstructure:"window_size" default:"1m"`
    MaxRequests   int           `mapstructure:"max_requests" default:"100"`
    
    // 分層限制
    AuthenticatedUserLimit int `mapstructure:"auth_user_limit" default:"1000"`
    AnonymousUserLimit     int `mapstructure:"anon_user_limit" default:"100"`
    AdminUserLimit         int `mapstructure:"admin_user_limit" default:"5000"`
    
    // 特殊端點限制
    LoginEndpointLimit     int `mapstructure:"login_limit" default:"5"`
    PasswordResetLimit     int `mapstructure:"password_reset_limit" default:"3"`
    
    // 阻斷配置
    BlockDuration         time.Duration `mapstructure:"block_duration" default:"15m"`
    MaxViolations         int           `mapstructure:"max_violations" default:"3"`
}

type RateLimiterService struct {
    redis  *redis.Client
    config *RateLimiterConfig
}

type RateLimitResult struct {
    Allowed         bool          `json:"allowed"`
    Limit           int           `json:"limit"`
    Remaining       int           `json:"remaining"`
    Reset           time.Time     `json:"reset"`
    RetryAfter      time.Duration `json:"retry_after,omitempty"`
    ViolationCount  int           `json:"violation_count,omitempty"`
}

func NewRateLimiterService(redis *redis.Client, config *RateLimiterConfig) *RateLimiterService {
    return &RateLimiterService{
        redis:  redis,
        config: config,
    }
}

// 檢查Rate Limit
func (s *RateLimiterService) CheckLimit(ctx context.Context, identifier, endpoint string, userType UserType) (*RateLimitResult, error) {
    // 1. 確定限制參數
    limit := s.getLimit(endpoint, userType)
    window := s.config.WindowSize
    
    // 2. 生成Redis鍵
    windowStart := time.Now().Truncate(window)
    key := fmt.Sprintf("rate_limit:%s:%s:%d", identifier, endpoint, windowStart.Unix())
    blockKey := fmt.Sprintf("rate_limit_block:%s", identifier)
    violationKey := fmt.Sprintf("rate_limit_violations:%s", identifier)
    
    // 3. 檢查是否被阻斷
    blocked, err := s.redis.Get(ctx, blockKey).Result()
    if err == nil && blocked != "" {
        blockUntil, _ := time.Parse(time.RFC3339, blocked)
        if time.Now().Before(blockUntil) {
            return &RateLimitResult{
                Allowed:    false,
                Limit:      limit,
                Reset:      blockUntil,
                RetryAfter: time.Until(blockUntil),
            }, nil
        }
    }
    
    // 4. 使用Lua腳本原子性檢查和增加計數
    luaScript := `
        local key = KEYS[1]
        local limit = tonumber(ARGV[1])
        local window = tonumber(ARGV[2])
        
        local current = redis.call('GET', key)
        if current == false then
            current = 0
        else
            current = tonumber(current)
        end
        
        if current < limit then
            local new_count = redis.call('INCR', key)
            if new_count == 1 then
                redis.call('EXPIRE', key, window)
            end
            return {1, new_count, limit - new_count}
        else
            return {0, current, 0}
        end
    `
    
    result, err := s.redis.Eval(ctx, luaScript, []string{key}, limit, int(window.Seconds())).Result()
    if err != nil {
        return nil, fmt.Errorf("rate limiter lua script failed: %w", err)
    }
    
    resultSlice := result.([]interface{})
    allowed := resultSlice[0].(int64) == 1
    current := int(resultSlice[1].(int64))
    remaining := int(resultSlice[2].(int64))
    
    // 5. 處理超限情況
    if !allowed {
        if err := s.handleViolation(ctx, identifier, violationKey); err != nil {
            return nil, err
        }
    }
    
    return &RateLimitResult{
        Allowed:   allowed,
        Limit:     limit,
        Remaining: remaining,
        Reset:     windowStart.Add(window),
    }, nil
}

// 獲取限制數量
func (s *RateLimiterService) getLimit(endpoint string, userType UserType) int {
    // 特殊端點限制
    switch endpoint {
    case "/auth/login":
        return s.config.LoginEndpointLimit
    case "/auth/password-reset":
        return s.config.PasswordResetLimit
    }
    
    // 用戶類型限制
    switch userType {
    case UserTypeAdmin:
        return s.config.AdminUserLimit
    case UserTypeAuthenticated:
        return s.config.AuthenticatedUserLimit
    case UserTypeAnonymous:
        return s.config.AnonymousUserLimit
    default:
        return s.config.MaxRequests
    }
}

// 處理違規
func (s *RateLimiterService) handleViolation(ctx context.Context, identifier, violationKey string) error {
    // 增加違規計數
    violations, err := s.redis.Incr(ctx, violationKey).Result()
    if err != nil {
        return err
    }
    
    // 設定違規記錄過期時間
    s.redis.Expire(ctx, violationKey, 24*time.Hour)
    
    // 達到最大違規次數時阻斷用戶
    if int(violations) >= s.config.MaxViolations {
        blockKey := fmt.Sprintf("rate_limit_block:%s", identifier)
        blockUntil := time.Now().Add(s.config.BlockDuration)
        
        return s.redis.Set(ctx, blockKey, blockUntil.Format(time.RFC3339), s.config.BlockDuration).Err()
    }
    
    return nil
}

// 重置用戶限制
func (s *RateLimiterService) ResetUserLimit(ctx context.Context, identifier string) error {
    pattern := fmt.Sprintf("rate_limit:%s:*", identifier)
    keys, err := s.redis.Keys(ctx, pattern).Result()
    if err != nil {
        return err
    }
    
    if len(keys) > 0 {
        return s.redis.Del(ctx, keys...).Err()
    }
    
    return nil
}

// 獲取用戶限制狀態
func (s *RateLimiterService) GetUserLimitStatus(ctx context.Context, identifier string) (*UserLimitStatus, error) {
    blockKey := fmt.Sprintf("rate_limit_block:%s", identifier)
    violationKey := fmt.Sprintf("rate_limit_violations:%s", identifier)
    
    // 檢查阻斷狀態
    blocked, err := s.redis.Get(ctx, blockKey).Result()
    isBlocked := err == nil && blocked != ""
    var blockUntil time.Time
    if isBlocked {
        blockUntil, _ = time.Parse(time.RFC3339, blocked)
    }
    
    // 獲取違規次數
    violations, _ := s.redis.Get(ctx, violationKey).Int()
    
    return &UserLimitStatus{
        IsBlocked:      isBlocked,
        BlockUntil:     blockUntil,
        ViolationCount: violations,
    }, nil
}

type UserType int

const (
    UserTypeAnonymous UserType = iota
    UserTypeAuthenticated
    UserTypeAdmin
)

type UserLimitStatus struct {
    IsBlocked      bool      `json:"is_blocked"`
    BlockUntil     time.Time `json:"block_until,omitempty"`
    ViolationCount int       `json:"violation_count"`
}
```

#### **Rate Limiting中間件**
```go
// 檔案: internal/middleware/rate_limit_middleware.go
package middleware

import (
    "net/http"
    "nexus-erp/backend/internal/services"
    
    "github.com/gin-gonic/gin"
)

type RateLimitMiddleware struct {
    rateLimiter services.RateLimiterServiceInterface
}

func NewRateLimitMiddleware(rateLimiter services.RateLimiterServiceInterface) *RateLimitMiddleware {
    return &RateLimitMiddleware{
        rateLimiter: rateLimiter,
    }
}

func (m *RateLimitMiddleware) Limit() gin.HandlerFunc {
    return func(c *gin.Context) {
        // 1. 確定識別符
        identifier := m.getIdentifier(c)
        
        // 2. 確定用戶類型
        userType := m.getUserType(c)
        
        // 3. 獲取端點路徑
        endpoint := c.Request.URL.Path
        
        // 4. 檢查Rate Limit
        result, err := m.rateLimiter.CheckLimit(c.Request.Context(), identifier, endpoint, userType)
        if err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{
                "error": "rate_limiter_error",
                "message": "限流服務暫時不可用",
            })
            c.Abort()
            return
        }
        
        // 5. 設定響應標頭
        c.Header("X-RateLimit-Limit", fmt.Sprintf("%d", result.Limit))
        c.Header("X-RateLimit-Remaining", fmt.Sprintf("%d", result.Remaining))
        c.Header("X-RateLimit-Reset", fmt.Sprintf("%d", result.Reset.Unix()))
        
        // 6. 檢查是否超限
        if !result.Allowed {
            c.Header("Retry-After", fmt.Sprintf("%.0f", result.RetryAfter.Seconds()))
            
            c.JSON(http.StatusTooManyRequests, gin.H{
                "error": "rate_limit_exceeded",
                "message": "請求頻率過高，請稍後再試",
                "retry_after": int(result.RetryAfter.Seconds()),
                "limit": result.Limit,
                "reset": result.Reset.Unix(),
            })
            c.Abort()
            return
        }
        
        c.Next()
    }
}

// 獲取用戶識別符
func (m *RateLimitMiddleware) getIdentifier(c *gin.Context) string {
    // 優先級: 用戶ID > API Key > IP地址
    
    // 1. 已認證用戶
    if userID := c.GetInt64("user_id"); userID > 0 {
        return fmt.Sprintf("user:%d", userID)
    }
    
    // 2. API Key用戶
    if apiKey := c.GetHeader("X-API-Key"); apiKey != "" {
        return fmt.Sprintf("api_key:%s", apiKey)
    }
    
    // 3. IP地址 (匿名用戶)
    return fmt.Sprintf("ip:%s", c.ClientIP())
}

// 確定用戶類型
func (m *RateLimitMiddleware) getUserType(c *gin.Context) services.UserType {
    // 檢查用戶角色
    if roles := c.GetStringSlice("user_roles"); len(roles) > 0 {
        for _, role := range roles {
            if role == "admin" || role == "super_admin" {
                return services.UserTypeAdmin
            }
        }
        return services.UserTypeAuthenticated
    }
    
    // API Key用戶
    if c.GetHeader("X-API-Key") != "" {
        return services.UserTypeAuthenticated
    }
    
    return services.UserTypeAnonymous
}
```

### **階段 3.2: CORS安全配置 (1天)**

#### **安全CORS配置**
```go
// 檔案: internal/middleware/cors_middleware.go
package middleware

import (
    "net/http"
    "strings"
    "time"
    
    "github.com/gin-contrib/cors"
    "github.com/gin-gonic/gin"
)

type CORSConfig struct {
    // 允許的域名
    AllowedOrigins []string `mapstructure:"allowed_origins"`
    
    // 開發環境配置
    AllowAllOrigins    bool `mapstructure:"allow_all_origins" default:"false"`
    AllowLocalhost     bool `mapstructure:"allow_localhost" default:"true"`
    
    // Headers配置
    AllowedHeaders     []string `mapstructure:"allowed_headers"`
    ExposedHeaders     []string `mapstructure:"exposed_headers"`
    
    // 方法配置
    AllowedMethods     []string `mapstructure:"allowed_methods"`
    
    // 憑證配置
    AllowCredentials   bool `mapstructure:"allow_credentials" default:"true"`
    
    // 預檢請求
    MaxAge             time.Duration `mapstructure:"max_age" default:"12h"`
}

func NewSecureCORSMiddleware(config *CORSConfig) gin.HandlerFunc {
    corsConfig := cors.Config{
        // 基礎配置
        AllowAllOrigins:  config.AllowAllOrigins,
        AllowCredentials: config.AllowCredentials,
        MaxAge:          config.MaxAge,
        
        // 允許的方法
        AllowMethods: []string{
            http.MethodGet,
            http.MethodPost,
            http.MethodPut,
            http.MethodPatch,
            http.MethodDelete,
            http.MethodOptions,
            http.MethodHead,
        },
        
        // 允許的Headers
        AllowHeaders: []string{
            "Origin",
            "Content-Length",
            "Content-Type",
            "Authorization",
            "X-Requested-With",
            "X-API-Key",
            "X-CSRF-Token",
            "X-Company-ID",
        },
        
        // 暴露的Headers
        ExposeHeaders: []string{
            "X-RateLimit-Limit",
            "X-RateLimit-Remaining",
            "X-RateLimit-Reset",
            "X-Request-ID",
            "X-Response-Time",
        },
    }
    
    // 設定允許的域名
    if !config.AllowAllOrigins {
        corsConfig.AllowOrigins = buildAllowedOrigins(config)
        corsConfig.AllowOriginFunc = buildOriginValidator(config)
    }
    
    return cors.New(corsConfig)
}

// 建立允許的域名清單
func buildAllowedOrigins(config *CORSConfig) []string {
    origins := make([]string, 0, len(config.AllowedOrigins)+10)
    
    // 配置的域名
    origins = append(origins, config.AllowedOrigins...)
    
    // 開發環境localhost
    if config.AllowLocalhost {
        localhostOrigins := []string{
            "http://localhost:3000",
            "http://localhost:8000",
            "http://localhost:8080",
            "http://127.0.0.1:3000",
            "http://127.0.0.1:8000",
            "http://127.0.0.1:8080",
        }
        origins = append(origins, localhostOrigins...)
    }
    
    return origins
}

// 建立Origin驗證函數
func buildOriginValidator(config *CORSConfig) func(origin string) bool {
    return func(origin string) bool {
        // 空Origin (同源請求)
        if origin == "" {
            return true
        }
        
        // 檢查配置的域名
        for _, allowed := range config.AllowedOrigins {
            if matchOrigin(origin, allowed) {
                return true
            }
        }
        
        // 開發環境localhost檢查
        if config.AllowLocalhost {
            if strings.HasPrefix(origin, "http://localhost:") ||
               strings.HasPrefix(origin, "http://127.0.0.1:") {
                return true
            }
        }
        
        return false
    }
}

// Origin匹配邏輯
func matchOrigin(origin, pattern string) bool {
    // 完全匹配
    if origin == pattern {
        return true
    }
    
    // 萬用字元匹配 (*.example.com)
    if strings.HasPrefix(pattern, "*.") {
        domain := strings.TrimPrefix(pattern, "*.")
        if strings.HasSuffix(origin, "."+domain) {
            return true
        }
    }
    
    return false
}
```

### **階段 3.3: API存取記錄系統 (2天)**

#### **API日誌記錄服務**
```go
// 檔案: internal/services/api_logger_service.go
package services

import (
    "context"
    "encoding/json"
    "fmt"
    "time"
    
    "github.com/gin-gonic/gin"
    "github.com/google/uuid"
)

type APILogEntry struct {
    // 基礎資訊
    ID            string    `json:"id" db:"id"`
    RequestID     string    `json:"request_id" db:"request_id"`
    Timestamp     time.Time `json:"timestamp" db:"timestamp"`
    
    // 請求資訊
    Method        string    `json:"method" db:"method"`
    Path          string    `json:"path" db:"path"`
    Query         string    `json:"query" db:"query"`
    UserAgent     string    `json:"user_agent" db:"user_agent"`
    IPAddress     string    `json:"ip_address" db:"ip_address"`
    
    // 用戶資訊
    UserID        *int64    `json:"user_id,omitempty" db:"user_id"`
    CompanyID     *int64    `json:"company_id,omitempty" db:"company_id"`
    SessionID     string    `json:"session_id,omitempty" db:"session_id"`
    
    // 響應資訊
    StatusCode    int       `json:"status_code" db:"status_code"`
    ResponseTime  int64     `json:"response_time_ms" db:"response_time_ms"`
    ResponseSize  int64     `json:"response_size_bytes" db:"response_size_bytes"`
    
    // 錯誤資訊
    ErrorMessage  string    `json:"error_message,omitempty" db:"error_message"`
    ErrorCode     string    `json:"error_code,omitempty" db:"error_code"`
    
    // 安全標記
    SecurityLevel string    `json:"security_level" db:"security_level"`
    RiskScore     int       `json:"risk_score" db:"risk_score"`
    
    // 業務上下文
    BusinessAction string   `json:"business_action,omitempty" db:"business_action"`
    ResourceID     string   `json:"resource_id,omitempty" db:"resource_id"`
    ResourceType   string   `json:"resource_type,omitempty" db:"resource_type"`
}

type APILoggerService struct {
    db           DatabaseInterface
    asyncChannel chan *APILogEntry
    batchSize    int
    flushInterval time.Duration
}

func NewAPILoggerService(db DatabaseInterface) *APILoggerService {
    service := &APILoggerService{
        db:            db,
        asyncChannel:  make(chan *APILogEntry, 10000), // 緩衝區
        batchSize:     100,
        flushInterval: 5 * time.Second,
    }
    
    // 啟動批次處理協程
    go service.startBatchProcessor()
    
    return service
}

// 記錄API存取
func (s *APILoggerService) LogAPIAccess(c *gin.Context, responseTime time.Duration, responseSize int64) {
    entry := &APILogEntry{
        ID:           uuid.New().String(),
        RequestID:    c.GetString("request_id"),
        Timestamp:    time.Now(),
        Method:       c.Request.Method,
        Path:         c.Request.URL.Path,
        Query:        c.Request.URL.RawQuery,
        UserAgent:    c.GetHeader("User-Agent"),
        IPAddress:    c.ClientIP(),
        StatusCode:   c.Writer.Status(),
        ResponseTime: responseTime.Milliseconds(),
        ResponseSize: responseSize,
    }
    
    // 用戶資訊
    if userID := c.GetInt64("user_id"); userID > 0 {
        entry.UserID = &userID
    }
    if companyID := c.GetInt64("company_id"); companyID > 0 {
        entry.CompanyID = &companyID
    }
    entry.SessionID = c.GetString("session_id")
    
    // 錯誤資訊
    if errors := c.Errors; len(errors) > 0 {
        entry.ErrorMessage = errors[0].Error()
        entry.ErrorCode = c.GetString("error_code")
    }
    
    // 安全級別和風險評分
    entry.SecurityLevel = s.classifySecurityLevel(c)
    entry.RiskScore = s.calculateRiskScore(entry)
    
    // 業務上下文
    entry.BusinessAction = c.GetString("business_action")
    entry.ResourceID = c.GetString("resource_id")
    entry.ResourceType = c.GetString("resource_type")
    
    // 異步寫入
    select {
    case s.asyncChannel <- entry:
        // 成功加入隊列
    default:
        // 隊列滿了，記錄警告但不阻塞請求
        fmt.Printf("Warning: API log queue is full, dropping log entry\n")
    }
}

// 批次處理器
func (s *APILoggerService) startBatchProcessor() {
    batch := make([]*APILogEntry, 0, s.batchSize)
    ticker := time.NewTicker(s.flushInterval)
    defer ticker.Stop()
    
    for {
        select {
        case entry := <-s.asyncChannel:
            batch = append(batch, entry)
            
            // 達到批次大小時寫入
            if len(batch) >= s.batchSize {
                s.flushBatch(batch)
                batch = batch[:0] // 重置batch
            }
            
        case <-ticker.C:
            // 定時寫入
            if len(batch) > 0 {
                s.flushBatch(batch)
                batch = batch[:0]
            }
        }
    }
}

// 批次寫入資料庫
func (s *APILoggerService) flushBatch(batch []*APILogEntry) {
    if len(batch) == 0 {
        return
    }
    
    ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
    defer cancel()
    
    query := `
        INSERT INTO api_access_logs (
            id, request_id, timestamp, method, path, query, user_agent, ip_address,
            user_id, company_id, session_id, status_code, response_time_ms, response_size_bytes,
            error_message, error_code, security_level, risk_score,
            business_action, resource_id, resource_type
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
    `
    
    // 批次插入
    for _, entry := range batch {
        _, err := s.db.ExecContext(ctx, query,
            entry.ID, entry.RequestID, entry.Timestamp, entry.Method, entry.Path,
            entry.Query, entry.UserAgent, entry.IPAddress, entry.UserID, entry.CompanyID,
            entry.SessionID, entry.StatusCode, entry.ResponseTime, entry.ResponseSize,
            entry.ErrorMessage, entry.ErrorCode, entry.SecurityLevel, entry.RiskScore,
            entry.BusinessAction, entry.ResourceID, entry.ResourceType,
        )
        
        if err != nil {
            fmt.Printf("Failed to insert API log: %v\n", err)
        }
    }
}

// 安全級別分類
func (s *APILoggerService) classifySecurityLevel(c *gin.Context) string {
    path := c.Request.URL.Path
    method := c.Request.Method
    
    // 高安全級別端點
    if strings.Contains(path, "/auth/") ||
       strings.Contains(path, "/admin/") ||
       strings.Contains(path, "/user/") ||
       strings.Contains(path, "/financial/") {
        return "high"
    }
    
    // 中安全級別端點
    if method == "POST" || method == "PUT" || method == "DELETE" {
        return "medium"
    }
    
    return "low"
}

// 計算風險評分
func (s *APILoggerService) calculateRiskScore(entry *APILogEntry) int {
    score := 0
    
    // 狀態碼評分
    if entry.StatusCode >= 400 && entry.StatusCode < 500 {
        score += 3 // 客戶端錯誤
    } else if entry.StatusCode >= 500 {
        score += 5 // 伺服器錯誤
    }
    
    // 響應時間評分
    if entry.ResponseTime > 5000 { // 超過5秒
        score += 2
    } else if entry.ResponseTime > 2000 { // 超過2秒
        score += 1
    }
    
    // 錯誤訊息評分
    if entry.ErrorMessage != "" {
        score += 2
    }
    
    // 匿名用戶評分
    if entry.UserID == nil {
        score += 1
    }
    
    return score
}
```

#### **API日誌中間件**
```go
// 檔案: internal/middleware/api_logger_middleware.go
package middleware

import (
    "bytes"
    "io"
    "time"
    
    "github.com/gin-gonic/gin"
    "github.com/google/uuid"
)

type APILoggerMiddleware struct {
    logger services.APILoggerServiceInterface
}

type responseWriter struct {
    gin.ResponseWriter
    body *bytes.Buffer
}

func (w *responseWriter) Write(b []byte) (int, error) {
    w.body.Write(b)
    return w.ResponseWriter.Write(b)
}

func NewAPILoggerMiddleware(logger services.APILoggerServiceInterface) *APILoggerMiddleware {
    return &APILoggerMiddleware{
        logger: logger,
    }
}

func (m *APILoggerMiddleware) LogRequests() gin.HandlerFunc {
    return func(c *gin.Context) {
        // 生成請求ID
        requestID := uuid.New().String()
        c.Set("request_id", requestID)
        c.Header("X-Request-ID", requestID)
        
        // 記錄開始時間
        startTime := time.Now()
        
        // 包裝ResponseWriter來捕獲響應大小
        responseWriter := &responseWriter{
            ResponseWriter: c.Writer,
            body:          &bytes.Buffer{},
        }
        c.Writer = responseWriter
        
        // 執行請求
        c.Next()
        
        // 計算響應時間和大小
        responseTime := time.Since(startTime)
        responseSize := int64(responseWriter.body.Len())
        
        // 記錄API存取
        m.logger.LogAPIAccess(c, responseTime, responseSize)
    }
}
```

### **階段 3.4: API Key管理系統 (2天)**

#### **API Key管理服務**
```go
// 檔案: internal/services/api_key_service.go
package services

import (
    "crypto/rand"
    "crypto/sha256"
    "encoding/hex"
    "fmt"
    "time"
)

type APIKey struct {
    ID          int64     `json:"id" db:"id"`
    KeyID       string    `json:"key_id" db:"key_id"`
    KeyHash     string    `json:"-" db:"key_hash"` // 不在JSON中暴露
    Name        string    `json:"name" db:"name"`
    Description string    `json:"description" db:"description"`
    
    // 權限設定
    UserID      int64     `json:"user_id" db:"user_id"`
    CompanyID   int64     `json:"company_id" db:"company_id"`
    Scopes      []string  `json:"scopes" db:"scopes"`
    
    // 限制設定
    RateLimit   int       `json:"rate_limit" db:"rate_limit"`
    IPWhitelist []string  `json:"ip_whitelist" db:"ip_whitelist"`
    
    // 狀態資訊
    IsActive    bool      `json:"is_active" db:"is_active"`
    LastUsedAt  *time.Time `json:"last_used_at" db:"last_used_at"`
    UsageCount  int64     `json:"usage_count" db:"usage_count"`
    
    // 時間資訊
    ExpiresAt   *time.Time `json:"expires_at" db:"expires_at"`
    CreatedAt   time.Time `json:"created_at" db:"created_at"`
    UpdatedAt   time.Time `json:"updated_at" db:"updated_at"`
}

type CreateAPIKeyRequest struct {
    Name        string    `json:"name" validate:"required,max=100"`
    Description string    `json:"description" validate:"max=500"`
    Scopes      []string  `json:"scopes" validate:"required"`
    RateLimit   int       `json:"rate_limit" validate:"min=1,max=10000"`
    IPWhitelist []string  `json:"ip_whitelist"`
    ExpiresAt   *time.Time `json:"expires_at"`
}

type APIKeyService struct {
    db DatabaseInterface
}

func NewAPIKeyService(db DatabaseInterface) *APIKeyService {
    return &APIKeyService{db: db}
}

// 創建API Key
func (s *APIKeyService) CreateAPIKey(userID, companyID int64, req *CreateAPIKeyRequest) (*APIKey, string, error) {
    // 1. 生成API Key
    keyValue, keyID, keyHash, err := s.generateAPIKey()
    if err != nil {
        return nil, "", fmt.Errorf("failed to generate API key: %w", err)
    }
    
    // 2. 驗證Scopes
    if err := s.validateScopes(req.Scopes); err != nil {
        return nil, "", fmt.Errorf("invalid scopes: %w", err)
    }
    
    // 3. 儲存到資料庫
    apiKey := &APIKey{
        KeyID:       keyID,
        KeyHash:     keyHash,
        Name:        req.Name,
        Description: req.Description,
        UserID:      userID,
        CompanyID:   companyID,
        Scopes:      req.Scopes,
        RateLimit:   req.RateLimit,
        IPWhitelist: req.IPWhitelist,
        IsActive:    true,
        ExpiresAt:   req.ExpiresAt,
        CreatedAt:   time.Now(),
        UpdatedAt:   time.Now(),
    }
    
    query := `
        INSERT INTO api_keys (
            key_id, key_hash, name, description, user_id, company_id,
            scopes, rate_limit, ip_whitelist, is_active, expires_at,
            created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING id
    `
    
    err = s.db.QueryRow(query,
        apiKey.KeyID, apiKey.KeyHash, apiKey.Name, apiKey.Description,
        apiKey.UserID, apiKey.CompanyID, apiKey.Scopes, apiKey.RateLimit,
        apiKey.IPWhitelist, apiKey.IsActive, apiKey.ExpiresAt,
        apiKey.CreatedAt, apiKey.UpdatedAt,
    ).Scan(&apiKey.ID)
    
    if err != nil {
        return nil, "", fmt.Errorf("failed to save API key: %w", err)
    }
    
    return apiKey, keyValue, nil
}

// 生成API Key
func (s *APIKeyService) generateAPIKey() (keyValue, keyID, keyHash string, err error) {
    // 生成32字節隨機數據
    randomBytes := make([]byte, 32)
    if _, err = rand.Read(randomBytes); err != nil {
        return "", "", "", err
    }
    
    // API Key格式: nexus_[keyID]_[secret]
    keyID = hex.EncodeToString(randomBytes[:8])  // 前8字節作為Key ID
    secret := hex.EncodeToString(randomBytes[8:]) // 後24字節作為Secret
    keyValue = fmt.Sprintf("nexus_%s_%s", keyID, secret)
    
    // 生成Hash用於儲存
    hash := sha256.Sum256([]byte(keyValue))
    keyHash = hex.EncodeToString(hash[:])
    
    return keyValue, keyID, keyHash, nil
}

// 驗證API Key
func (s *APIKeyService) ValidateAPIKey(keyValue string) (*APIKey, error) {
    // 1. 解析Key格式
    keyID, err := s.parseKeyID(keyValue)
    if err != nil {
        return nil, fmt.Errorf("invalid key format: %w", err)
    }
    
    // 2. 計算Hash
    hash := sha256.Sum256([]byte(keyValue))
    keyHash := hex.EncodeToString(hash[:])
    
    // 3. 從資料庫查詢
    var apiKey APIKey
    query := `
        SELECT id, key_id, name, description, user_id, company_id,
               scopes, rate_limit, ip_whitelist, is_active,
               last_used_at, usage_count, expires_at, created_at, updated_at
        FROM api_keys 
        WHERE key_id = $1 AND key_hash = $2 AND is_active = true
    `
    
    err = s.db.QueryRow(query, keyID, keyHash).Scan(
        &apiKey.ID, &apiKey.KeyID, &apiKey.Name, &apiKey.Description,
        &apiKey.UserID, &apiKey.CompanyID, &apiKey.Scopes, &apiKey.RateLimit,
        &apiKey.IPWhitelist, &apiKey.IsActive, &apiKey.LastUsedAt,
        &apiKey.UsageCount, &apiKey.ExpiresAt, &apiKey.CreatedAt, &apiKey.UpdatedAt,
    )
    
    if err != nil {
        return nil, fmt.Errorf("API key not found or invalid: %w", err)
    }
    
    // 4. 檢查過期時間
    if apiKey.ExpiresAt != nil && time.Now().After(*apiKey.ExpiresAt) {
        return nil, fmt.Errorf("API key has expired")
    }
    
    // 5. 更新使用記錄
    go s.updateUsageStats(apiKey.ID)
    
    return &apiKey, nil
}

// 解析Key ID
func (s *APIKeyService) parseKeyID(keyValue string) (string, error) {
    parts := strings.Split(keyValue, "_")
    if len(parts) != 3 || parts[0] != "nexus" {
        return "", fmt.Errorf("invalid API key format")
    }
    return parts[1], nil
}

// 更新使用統計
func (s *APIKeyService) updateUsageStats(keyID int64) {
    query := `
        UPDATE api_keys 
        SET last_used_at = $1, usage_count = usage_count + 1, updated_at = $1
        WHERE id = $2
    `
    s.db.Exec(query, time.Now(), keyID)
}

// 驗證Scopes
func (s *APIKeyService) validateScopes(scopes []string) error {
    validScopes := map[string]bool{
        "read:products":   true,
        "write:products":  true,
        "read:customers":  true,
        "write:customers": true,
        "read:orders":     true,
        "write:orders":    true,
        "read:inventory":  true,
        "write:inventory": true,
        "read:reports":    true,
        "admin:all":       true,
    }
    
    for _, scope := range scopes {
        if !validScopes[scope] {
            return fmt.Errorf("invalid scope: %s", scope)
        }
    }
    
    return nil
}
```

---

## 🧪 **測試策略**

### **Rate Limiting測試**
```go
// 檔案: internal/middleware/rate_limit_test.go
func TestRateLimitMiddleware(t *testing.T) {
    // 設定測試環境
    redis := setupTestRedis()
    config := &services.RateLimiterConfig{
        WindowSize:         1 * time.Minute,
        AnonymousUserLimit: 10,
    }
    
    rateLimiter := services.NewRateLimiterService(redis, config)
    middleware := NewRateLimitMiddleware(rateLimiter)
    
    router := gin.New()
    router.Use(middleware.Limit())
    router.GET("/test", func(c *gin.Context) {
        c.JSON(200, gin.H{"message": "ok"})
    })
    
    // 測試正常請求
    for i := 0; i < 10; i++ {
        req := httptest.NewRequest("GET", "/test", nil)
        w := httptest.NewRecorder()
        router.ServeHTTP(w, req)
        
        assert.Equal(t, 200, w.Code)
    }
    
    // 測試超限請求
    req := httptest.NewRequest("GET", "/test", nil)
    w := httptest.NewRecorder()
    router.ServeHTTP(w, req)
    
    assert.Equal(t, 429, w.Code)
    assert.Contains(t, w.Header().Get("Retry-After"), "")
}
```

### **安全測試**
```go
func TestCORSSecurityMiddleware(t *testing.T) {
    config := &CORSConfig{
        AllowedOrigins: []string{"https://app.nexuserp.com"},
        AllowLocalhost: false,
    }
    
    middleware := NewSecureCORSMiddleware(config)
    
    router := gin.New()
    router.Use(middleware)
    router.GET("/test", func(c *gin.Context) {
        c.JSON(200, gin.H{"message": "ok"})
    })
    
    // 測試允許的域名
    req := httptest.NewRequest("GET", "/test", nil)
    req.Header.Set("Origin", "https://app.nexuserp.com")
    w := httptest.NewRecorder()
    router.ServeHTTP(w, req)
    
    assert.Equal(t, 200, w.Code)
    assert.Equal(t, "https://app.nexuserp.com", w.Header().Get("Access-Control-Allow-Origin"))
    
    // 測試不允許的域名
    req = httptest.NewRequest("GET", "/test", nil)
    req.Header.Set("Origin", "https://evil.com")
    w = httptest.NewRecorder()
    router.ServeHTTP(w, req)
    
    assert.NotEqual(t, "https://evil.com", w.Header().Get("Access-Control-Allow-Origin"))
}
```

---

## 🎯 **驗收標準**

### **安全驗收**
- [ ] Rate Limiting正確限制請求頻率
- [ ] CORS配置阻止惡意跨域請求
- [ ] API Key認證機制正常運作
- [ ] 安全日誌完整記錄存取行為
- [ ] 異常行為告警及時觸發

### **效능驗收**
- [ ] Rate Limiting不影響正常請求 (<5ms額外延遲)
- [ ] 日誌記錄異步處理，不阻塞請求
- [ ] API Key驗證快速響應 (<10ms)
- [ ] 並發請求處理正常

### **功能驗收**
- [ ] 不同用戶類型有不同的限制配額
- [ ] API Key支援Scope權限控制
- [ ] 管理員可以查看API使用統計
- [ ] 支援IP白名單功能

---

## 📅 **實作時程**

| 階段 | 任務 | 時間 | 負責人 |
|------|------|------|--------|
| 3.1 | Rate Limiting實作 | 2天 | 後端工程師 |
| 3.2 | CORS安全配置 | 1天 | 後端工程師 |
| 3.3 | API存取記錄系統 | 2天 | 後端工程師 |
| 3.4 | API Key管理系統 | 2天 | 後端工程師 |

**總計**: 7個工作天 (約1週)

---

**下一階段**: [04_設計系統與UI組件庫.md](./04_設計系統與UI組件庫.md)