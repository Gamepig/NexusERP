# JWT認證系統快速實作計劃 - 修正版

**階段**: 第一階段 - 快速開發版  
**預估時間**: 1-2週 (大幅縮減)  
**優先級**: 🚨 最高優先級 - 快速開發策略  

---

## 🚀 **快速開發核心原則**

### **MVP-First策略**
- ✅ **先求有，再求好** - 優先完成基本功能
- ✅ **漸進式安全** - 分階段增強安全特性
- ✅ **標準模式** - 使用成熟框架，避免過度設計
- ✅ **自動化測試** - 每階段都有驗收標準

### **避免過度工程化**
- ❌ **複雜安全機制** - 避免15+安全特性的企業級設計
- ❌ **多重依賴** - 避免Redis+分散式鎖+複雜監控
- ❌ **過度抽象** - 避免難以調試的多層架構
- ❌ **併發優化** - 基礎功能穩定前不考慮高併發

### **實作目標重新定義**
**第一階段 (1週)**: 基本JWT認證 + 簡單驗證
**第二階段 (1週)**: Token刷新 + 基本監控  
**第三階段 (選配)**: 高級安全特性

---

## 📋 **現況分析**

### **現有架構問題**
```go
// 🚨 當前問題：混合認證機制
func (m *AuthMiddleware) AuthenticateRequest(c *gin.Context) {
    // 問題1: 雙重認證邏輯造成混亂
    if claims, err := utils.ValidateJWT(tokenString, m.config.JWT.Secret); err == nil {
        // JWT 認證路徑
    } else if userID, err := m.validateSimpleToken(tokenString); err == nil {
        // 簡單Token認證路徑 (開發環境)
    }
    // 問題2: 無統一錯誤處理
    // 問題3: 缺少會話追蹤
}
```

### **資料庫結構缺陷**
```sql
-- 🚨 users表缺少必要欄位
-- 當前結構 (不完整)
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    remember_token VARCHAR(100),
    -- ❌ 缺少：api_token VARCHAR(255)
    -- ❌ 缺少：last_login_at TIMESTAMP
    -- ❌ 缺少：login_attempts INTEGER DEFAULT 0
    -- ❌ 缺少：locked_until TIMESTAMP
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🚀 **快速開發實作方案**

### **第一階段 (1週): MVP基礎實作**

#### **1.1 簡化的資料庫結構 (半天)**

**利用現有User表結構，最小化修改：**
```php
<?php
// 檔案: 2025_08_03_000000_minimal_jwt_fields.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // 只添加必要欄位，利用現有的api_token相關欄位
            if (!Schema::hasColumn('users', 'refresh_token')) {
                $table->string('refresh_token', 255)->nullable()->after('api_token_expires_at');
            }
            if (!Schema::hasColumn('users', 'last_login_at')) {
                $table->timestamp('last_login_at')->nullable();
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['refresh_token', 'last_login_at']);
        });
    }
};
```

**✅ 優勢**: 
- 使用現有欄位結構，避免大幅資料庫變更
- 開發風險最低，5分鐘完成遷移
- 可以立即開始功能開發

#### **1.2 簡化的Go JWT服務 (2天)**

**基於快速開發原則，使用最簡化的實作：**

#### **1.2.1 簡化的JWT配置**
```go
// 檔案: internal/auth/simple_jwt.go - 簡化版JWT服務
package auth

import (
    "time"
    "fmt"
    "github.com/golang-jwt/jwt/v5"
)

// 簡化的Claims結構 - 只包含必要資訊
type SimpleClaims struct {
    UserID    int64  `json:"user_id"`
    CompanyID int64  `json:"company_id"`
    Email     string `json:"email"`
    jwt.RegisteredClaims
}

// 簡化的JWT服務 - 專注核心功能
type SimpleJWTService struct {
    secretKey []byte
    issuer    string
    accessTTL time.Duration
}

func NewSimpleJWTService(secret, issuer string) *SimpleJWTService {
    return &SimpleJWTService{
        secretKey: []byte(secret),
        issuer:    issuer,
        accessTTL: 15 * time.Minute, // 短期Token
    }
}
```

#### **1.2.2 核心Token操作**
```go
// 生成Token - 簡單直接
func (s *SimpleJWTService) GenerateToken(userID, companyID int64, email string) (string, error) {
    now := time.Now()
    claims := &SimpleClaims{
        UserID:    userID,
        CompanyID: companyID,
        Email:     email,
        RegisteredClaims: jwt.RegisteredClaims{
            Issuer:    s.issuer,
            Subject:   fmt.Sprintf("user:%d", userID),
            ExpiresAt: jwt.NewNumericDate(now.Add(s.accessTTL)),
            IssuedAt:  jwt.NewNumericDate(now),
            NotBefore: jwt.NewNumericDate(now),
        },
    }
    
    token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
    return token.SignedString(s.secretKey)
}

// 驗證Token - 基本驗證
func (s *SimpleJWTService) ValidateToken(tokenString string) (*SimpleClaims, error) {
    token, err := jwt.ParseWithClaims(tokenString, &SimpleClaims{}, func(token *jwt.Token) (interface{}, error) {
        if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
            return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
        }
        return s.secretKey, nil
    })
    
    if err != nil {
        return nil, err
    }
    
    if claims, ok := token.Claims.(*SimpleClaims); ok && token.Valid {
        return claims, nil
    }
    
    return nil, fmt.Errorf("invalid token")
}
```

#### **1.2.3 Go API端點實作**
```go
// 檔案: internal/handlers/simple_auth.go
package handlers

import (
    "net/http"
    "strings"
    "github.com/gin-gonic/gin"
)

type SimpleAuthHandler struct {
    jwtService *auth.SimpleJWTService
}

func NewSimpleAuthHandler(jwtService *auth.SimpleJWTService) *SimpleAuthHandler {
    return &SimpleAuthHandler{
        jwtService: jwtService,
    }
}

// 簡化的登入端點
func (h *SimpleAuthHandler) SimpleLogin(c *gin.Context) {
    var req struct {
        UserID    int64  `json:"user_id" binding:"required"`
        CompanyID int64  `json:"company_id" binding:"required"`
        Email     string `json:"email" binding:"required,email"`
    }
    
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }
    
    // 生成JWT
    token, err := h.jwtService.GenerateToken(req.UserID, req.CompanyID, req.Email)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
        return
    }
    
    c.JSON(http.StatusOK, gin.H{
        "access_token": token,
        "token_type":   "Bearer",
        "expires_in":   900, // 15分鐘
    })
}

// 簡化的Token驗證中間件
func (h *SimpleAuthHandler) SimpleAuthMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        authHeader := c.GetHeader("Authorization")
        if authHeader == "" {
            c.JSON(http.StatusUnauthorized, gin.H{"error": "Missing authorization header"})
            c.Abort()
            return
        }
        
        // 提取Token
        tokenString := strings.TrimPrefix(authHeader, "Bearer ")
        if tokenString == authHeader {
            c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid authorization format"})
            c.Abort()
            return
        }
        
        // 驗證Token
        claims, err := h.jwtService.ValidateToken(tokenString)
        if err != nil {
            c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
            c.Abort()
            return
        }
        
        // 設定上下文
        c.Set("user_id", claims.UserID)
        c.Set("company_id", claims.CompanyID)
        c.Set("email", claims.Email)
        c.Next()
    }
}
```

**✅ MVP版本優勢：**
- **開發時間**: 2天完成 vs 原版5-7天
- **程式碼量**: 150行 vs 原版800+行
- **依賴**: 只需要jwt庫 vs 原版需要Redis+Session管理
- **調試**: 簡單直接，容易排查問題
- **測試**: 單元測試容易編寫

#### **1.3 Laravel簡化整合 (2天)**

```php
<?php
// 檔案: app/Services/SimpleAuthService.php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\{Auth, Hash, DB, Log, Http};

class SimpleAuthService
{
    private string $goApiBaseUrl;
    
    public function __construct()
    {
        $this->goApiBaseUrl = config('app.go_api_base_url');
    }
    
    /**
     * 簡化的認證流程
     */
    public function authenticate(array $credentials): array
    {
        // 1. Laravel本地驗證
        $user = $this->validateCredentials($credentials);
        
        // 2. 生成JWT (呼叫Go API)
        $jwtToken = $this->generateJWT($user);
        
        // 3. 設定Laravel Session
        $this->createSession($user, $jwtToken);
        
        // 4. 設定RLS上下文 (下階段實作)
        // $this->setRLSContext($user);
        
        return [
            'success' => true,
            'user' => $user->toArray(),
            'access_token' => $jwtToken,
            'token_type' => 'Bearer',
        ];
    }
    
    private function validateCredentials(array $credentials): User
    {
        $loginField = filter_var($credentials['login'], FILTER_VALIDATE_EMAIL) ? 'email' : 'name';
        
        $user = User::where($loginField, $credentials['login'])
                   ->where('is_active', true)
                   ->first();
        
        if (!$user || !Hash::check($credentials['password'], $user->password)) {
            throw new \InvalidArgumentException('登入憑證無效');
        }
        
        return $user;
    }
    
    private function generateJWT(User $user): string
    {
        try {
            $response = Http::timeout(10)->post("{$this->goApiBaseUrl}/auth/simple-login", [
                'user_id' => $user->id,
                'company_id' => $user->getCurrentCompanyId(),
                'email' => $user->email,
            ]);
            
            if ($response->successful()) {
                return $response->json()['access_token'];
            }
            
            throw new \RuntimeException('JWT生成失敗');
            
        } catch (\Exception $e) {
            Log::error('JWT生成錯誤', ['error' => $e->getMessage()]);
            throw new \RuntimeException('認證服務暫時不可用');
        }
    }
    
    private function createSession(User $user, string $jwtToken): void
    {
        Auth::login($user);
        session(['go_api_access_token' => $jwtToken]);
        
        // 更新用戶最後登入時間
        $user->update(['last_login_at' => now()]);
    }
}
```

### **第一階段測試策略 (1天)**

#### **1.4 基礎測試 - 確保MVP功能正常**

```php
<?php
// tests/Feature/SimpleAuthTest.php

class SimpleAuthTest extends TestCase
{
    /** @test */
    public function can_authenticate_user()
    {
        $user = User::factory()->create([
            'email' => 'test@example.com',
            'password' => bcrypt('password123'),
        ]);
        
        $response = $this->postJson('/api/auth/login', [
            'login' => 'test@example.com',
            'password' => 'password123',
        ]);
        
        $response->assertStatus(200)
                ->assertJsonStructure([
                    'success',
                    'user',
                    'access_token',
                    'token_type',
                ]);
    }
    
    /** @test */
    public function rejects_invalid_credentials()
    {
        $response = $this->postJson('/api/auth/login', [
            'login' => 'invalid@example.com',
            'password' => 'wrongpassword',
        ]);
        
        $response->assertStatus(422);
    }
    
    /** @test */
    public function go_api_integration_works()
    {
        Http::fake([
            '*/auth/simple-login' => Http::response([
                'access_token' => 'fake-jwt-token',
                'token_type' => 'Bearer',
                'expires_in' => 900,
            ], 200)
        ]);
        
        $user = User::factory()->create();
        $service = new SimpleAuthService();
        
        $result = $service->authenticate([
            'login' => $user->email,
            'password' => 'password',
        ]);
        
        $this->assertEquals('fake-jwt-token', $result['access_token']);
    }
}
```

---

## ✅ **快速開發版驗收標準**

### **第一階段 MVP (1週完成)**
- [ ] 用戶可以成功登入並獲得JWT
- [ ] JWT包含基本用戶資訊 (UserID, CompanyID, Email)
- [ ] Go API可以驗證JWT並提取用戶資訊
- [ ] Laravel Session與JWT狀態同步
- [ ] 基本的認證中間件正常工作
- [ ] 所有單元測試通過

### **效能要求**
- [ ] JWT生成時間 < 100ms
- [ ] JWT驗證時間 < 50ms
- [ ] 認證成功率 > 99%
- [ ] API回應時間 < 200ms

### **安全底線**
- [ ] JWT使用強隨機密鑰 (至少32字元)
- [ ] 密碼使用bcrypt雜湊
- [ ] 所有認證API使用HTTPS
- [ ] 基本的登入失敗限制

---

## 🚀 **第二階段規劃 (下週)**

### **增強功能 (選配)**
1. **Token刷新機制** - 自動刷新過期Token
2. **基本監控** - 記錄認證成功/失敗
3. **簡單黑名單** - 支援Token撤銷
4. **效能優化** - 快取用戶資訊

### **成功關鍵**
- ✅ **保持簡單** - 避免過度工程化
- ✅ **測試優先** - 每個功能都有測試
- ✅ **文件同步** - 實作與文件保持一致
- ✅ **漸進增強** - 基礎穩定後再添加功能

**🎯 總結**: 快速開發版將開發時間從3-4週縮短到1-2週，程式碼複雜度降低60%，同時保證基本安全要求，完美符合快速無錯誤開發的目標！
    
    // 4. 撤銷舊Refresh Token
    if err := s.sessionService.RevokeRefreshToken(refreshToken); err != nil {
        return nil, fmt.Errorf("failed to revoke old token: %w", err)
    }
    
    // 5. 生成新Token配對
    newTokenPair, err := s.GenerateTokenPair(user, session.IPAddress, session.UserAgent)
    if err != nil {
        return nil, fmt.Errorf("failed to generate new tokens: %w", err)
    }
    
    // 6. 更新會話最後活動時間
    s.sessionService.UpdateSessionActivity(session.ID)
    
    return newTokenPair, nil
}

// 撤銷所有用戶Token
func (s *JWTService) RevokeAllUserTokens(userID int64) error {
    return s.sessionService.InvalidateAllUserSessions(userID)
}
```

### **階段 1.3: Laravel統一認證服務 (2天)**

#### **Laravel認證服務包裝**
```php
<?php
// 檔案: app/Services/UnifiedAuthService.php

namespace App\Services;

use App\Models\User;
use App\Models\UserSession;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Session;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class UnifiedAuthService
{
    private PendingRequest $goApiClient;
    private string $goApiBaseUrl;
    
    public function __construct()
    {
        $this->goApiBaseUrl = config('app.go_api_base_url');
        $this->goApiClient = Http::timeout(30)
            ->withHeaders([
                'Content-Type' => 'application/json',
                'X-API-Version' => 'v1',
            ]);
    }
    
    /**
     * 統一登入處理
     */
    public function authenticate(array $credentials): array
    {
        // 1. Laravel本地用戶驗證
        $user = $this->validateLocalCredentials($credentials);
        
        // 2. 呼叫Go API生成JWT
        $jwtResponse = $this->generateJWTTokens($user, $credentials);
        
        // 3. 建立Laravel Session
        $this->createLaravelSession($user, $jwtResponse);
        
        // 4. 記錄登入活動
        $this->logUserActivity($user, request()->ip(), request()->userAgent());
        
        return [
            'success' => true,
            'user' => $user->toArray(),
            'access_token' => $jwtResponse['access_token'],
            'refresh_token' => $jwtResponse['refresh_token'],
            'expires_in' => $jwtResponse['expires_in'],
            'token_type' => 'Bearer',
        ];
    }
    
    /**
     * 本地憑證驗證
     */
    private function validateLocalCredentials(array $credentials): User
    {
        // 支援email或username登入
        $loginField = filter_var($credentials['login'], FILTER_VALIDATE_EMAIL) ? 'email' : 'name';
        
        $user = User::where($loginField, $credentials['login'])->first();
        
        if (!$user) {
            throw new \InvalidArgumentException('用戶不存在');
        }
        
        // 檢查帳號鎖定狀態
        if ($user->locked_until && Carbon::parse($user->locked_until)->isFuture()) {
            throw new \RuntimeException('帳號已被鎖定，請稍後再試');
        }
        
        // 驗證密碼
        if (!Hash::check($credentials['password'], $user->password)) {
            $this->handleFailedAttempt($user);
            throw new \InvalidArgumentException('密碼錯誤');
        }
        
        // 重置登入嘗試次數
        $this->resetLoginAttempts($user);
        
        return $user;
    }
    
    /**
     * 呼叫Go API生成JWT
     */
    private function generateJWTTokens(User $user, array $credentials): array
    {
        try {
            $response = $this->goApiClient->post("{$this->goApiBaseUrl}/auth/login", [
                'user_id' => $user->id,
                'email' => $user->email,
                'name' => $user->name,
                'company_id' => $user->active_company_id ?? $user->companies->first()?->id,
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
            ]);
            
            if ($response->successful()) {
                return $response->json();
            }
            
            throw new \RuntimeException('JWT生成失敗: ' . $response->body());
            
        } catch (\Exception $e) {
            Log::error('JWT生成錯誤', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);
            throw new \RuntimeException('認證服務暫時不可用');
        }
    }
    
    /**
     * 建立Laravel Session
     */
    private function createLaravelSession(User $user, array $jwtResponse): void
    {
        // Laravel內建認證
        Auth::login($user);
        
        // 儲存JWT資訊到Session
        Session::put([
            'go_api_access_token' => $jwtResponse['access_token'],
            'go_api_refresh_token' => $jwtResponse['refresh_token'],
            'go_api_expires_at' => now()->addSeconds($jwtResponse['expires_in']),
            'current_company_id' => $user->active_company_id,
        ]);
        
        // 更新用戶Token記錄
        $user->update([
            'api_token' => $jwtResponse['access_token'],
            'api_token_expires_at' => now()->addSeconds($jwtResponse['expires_in']),
            'refresh_token' => $jwtResponse['refresh_token'],
            'refresh_token_expires_at' => now()->addDays(7),
            'last_login_at' => now(),
            'last_login_ip' => request()->ip(),
        ]);
    }
    
    /**
     * Token自動刷新中間件
     */
    public function refreshTokenIfNeeded(): bool
    {
        $expiresAt = Session::get('go_api_expires_at');
        
        // 如果Token在5分鐘內過期，自動刷新
        if ($expiresAt && Carbon::parse($expiresAt)->subMinutes(5)->isPast()) {
            return $this->refreshTokens();
        }
        
        return true;
    }
    
    /**
     * 刷新JWT Token
     */
    public function refreshTokens(): bool
    {
        $refreshToken = Session::get('go_api_refresh_token');
        
        if (!$refreshToken) {
            return false;
        }
        
        try {
            $response = $this->goApiClient->post("{$this->goApiBaseUrl}/auth/refresh", [
                'refresh_token' => $refreshToken,
            ]);
            
            if ($response->successful()) {
                $data = $response->json();
                
                // 更新Session
                Session::put([
                    'go_api_access_token' => $data['access_token'],
                    'go_api_refresh_token' => $data['refresh_token'],
                    'go_api_expires_at' => now()->addSeconds($data['expires_in']),
                ]);
                
                // 更新用戶記錄
                if ($user = Auth::user()) {
                    $user->update([
                        'api_token' => $data['access_token'],
                        'api_token_expires_at' => now()->addSeconds($data['expires_in']),
                        'refresh_token' => $data['refresh_token'],
                    ]);
                }
                
                return true;
            }
            
        } catch (\Exception $e) {
            Log::error('Token刷新失敗', [
                'user_id' => Auth::id(),
                'error' => $e->getMessage(),
            ]);
        }
        
        return false;
    }
    
    /**
     * 統一登出處理
     */
    public function logout(): void
    {
        $accessToken = Session::get('go_api_access_token');
        
        // 撤銷Go API Token
        if ($accessToken) {
            try {
                $this->goApiClient
                    ->withToken($accessToken)
                    ->post("{$this->goApiBaseUrl}/auth/logout");
            } catch (\Exception $e) {
                Log::warning('Go API登出失敗', ['error' => $e->getMessage()]);
            }
        }
        
        // Laravel登出
        Auth::logout();
        Session::flush();
        Session::regenerate();
    }
    
    /**
     * 處理登入失敗
     */
    private function handleFailedAttempt(User $user): void
    {
        $attempts = $user->login_attempts + 1;
        
        $updateData = ['login_attempts' => $attempts];
        
        // 達到最大嘗試次數時鎖定帳號
        if ($attempts >= 5) {
            $updateData['locked_until'] = now()->addMinutes(30);
        }
        
        $user->update($updateData);
    }
    
    /**
     * 重置登入嘗試次數
     */
    private function resetLoginAttempts(User $user): void
    {
        if ($user->login_attempts > 0) {
            $user->update([
                'login_attempts' => 0,
                'locked_until' => null,
            ]);
        }
    }
    
    /**
     * 記錄用戶活動
     */
    private function logUserActivity(User $user, string $ipAddress, string $userAgent): void
    {
        UserSession::create([
            'user_id' => $user->id,
            'session_token' => Session::getId(),
            'ip_address' => $ipAddress,
            'user_agent' => $userAgent,
            'expires_at' => now()->addHours(2),
            'last_activity' => now(),
        ]);
    }
}
```

### **階段 1.4: 中間件整合與安全強化 (2天)**

#### **統一認證中間件**
```go
// 檔案: internal/middleware/unified_auth_middleware.go
package middleware

import (
    "net/http"
    "strings"
    "nexus-erp/backend/internal/services"
    "nexus-erp/backend/internal/config"
    
    "github.com/gin-gonic/gin"
)

type UnifiedAuthMiddleware struct {
    jwtService    services.JWTServiceInterface
    config        *config.JWTConfig
    rateLimiter   services.RateLimiterInterface
}

func NewUnifiedAuthMiddleware(jwtService services.JWTServiceInterface, config *config.JWTConfig, rateLimiter services.RateLimiterInterface) *UnifiedAuthMiddleware {
    return &UnifiedAuthMiddleware{
        jwtService:  jwtService,
        config:      config,
        rateLimiter: rateLimiter,
    }
}

func (m *UnifiedAuthMiddleware) RequireAuth() gin.HandlerFunc {
    return func(c *gin.Context) {
        // 1. Rate Limiting檢查
        if !m.rateLimiter.Allow(c.ClientIP()) {
            c.JSON(http.StatusTooManyRequests, gin.H{
                "error": "rate_limit_exceeded",
                "message": "請求頻率過高，請稍後再試",
                "retry_after": 60,
            })
            c.Abort()
            return
        }
        
        // 2. 提取Token
        token := m.extractToken(c)
        if token == "" {
            m.respondUnauthorized(c, "missing_token", "缺少認證Token")
            return
        }
        
        // 3. 驗證Token
        claims, err := m.jwtService.ValidateAccessToken(token)
        if err != nil {
            m.respondUnauthorized(c, "invalid_token", err.Error())
            return
        }
        
        // 4. 設定用戶上下文
        m.setUserContext(c, claims)
        
        // 5. 記錄存取日誌
        m.logAccess(c, claims)
        
        c.Next()
    }
}

func (m *UnifiedAuthMiddleware) extractToken(c *gin.Context) string {
    // 優先級: Header > Cookie > Query
    
    // 1. Authorization Header
    authHeader := c.GetHeader("Authorization")
    if strings.HasPrefix(authHeader, "Bearer ") {
        return strings.TrimPrefix(authHeader, "Bearer ")
    }
    
    // 2. Cookie
    if cookie, err := c.Cookie(m.config.CookieName); err == nil && cookie != "" {
        return cookie
    }
    
    // 3. Query Parameter (僅限WebSocket等特殊情況)
    if token := c.Query("token"); token != "" {
        return token
    }
    
    return ""
}

func (m *UnifiedAuthMiddleware) setUserContext(c *gin.Context, claims *models.EnhancedClaims) {
    // 設定用戶資訊到Context
    c.Set("user_id", claims.UserID)
    c.Set("user_email", claims.Email)
    c.Set("user_name", claims.Name)
    c.Set("company_id", claims.CompanyID)
    c.Set("user_roles", claims.Roles)
    c.Set("user_permissions", claims.Permissions)
    c.Set("session_id", claims.SessionID)
    
    // 設定PostgreSQL會話變數 (RLS使用)
    c.Set("db_company_id", claims.CompanyID)
    c.Set("db_user_id", claims.UserID)
}

func (m *UnifiedAuthMiddleware) respondUnauthorized(c *gin.Context, errorCode, message string) {
    c.JSON(http.StatusUnauthorized, gin.H{
        "error":   errorCode,
        "message": message,
        "timestamp": time.Now().Unix(),
    })
    c.Abort()
}
```

---

## 🧪 **測試策略**

### **單元測試**
```go
// 檔案: internal/services/jwt_service_test.go
func TestJWTService_GenerateTokenPair(t *testing.T) {
    // 測試配置
    config := &config.JWTConfig{
        Secret:          "test-secret-key-must-be-at-least-32-chars",
        AccessTokenTTL:  15 * time.Minute,
        RefreshTokenTTL: 7 * 24 * time.Hour,
    }
    
    // Mock依賴
    mockSessionService := &MockSessionService{}
    mockUserService := &MockUserService{}
    
    service := NewJWTService(config, mockSessionService, mockUserService)
    
    // 測試用戶
    user := &models.User{
        ID:        1,
        Email:     "test@example.com",
        Name:      "Test User",
        CompanyID: 1,
    }
    
    // 執行測試
    tokenPair, err := service.GenerateTokenPair(user, "127.0.0.1", "test-agent")
    
    // 驗證結果
    assert.NoError(t, err)
    assert.NotEmpty(t, tokenPair.AccessToken)
    assert.NotEmpty(t, tokenPair.RefreshToken)
    assert.Equal(t, "Bearer", tokenPair.TokenType)
    assert.True(t, tokenPair.ExpiresIn > 0)
}
```

### **整合測試**
```php
<?php
// 檔案: tests/Feature/UnifiedAuthTest.php

use App\Services\UnifiedAuthService;
use Tests\TestCase;

class UnifiedAuthTest extends TestCase
{
    public function test_complete_authentication_flow()
    {
        // 1. 建立測試用戶
        $user = User::factory()->create([
            'email' => 'test@example.com',
            'password' => Hash::make('password123'),
        ]);
        
        // 2. 測試登入
        $response = $this->postJson('/api/auth/login', [
            'login' => 'test@example.com',
            'password' => 'password123',
        ]);
        
        $response->assertStatus(200)
                ->assertJsonStructure([
                    'success',
                    'user',
                    'access_token',
                    'refresh_token',
                    'expires_in',
                ]);
        
        $token = $response->json('access_token');
        
        // 3. 測試認證API呼叫
        $protectedResponse = $this->withHeaders([
            'Authorization' => "Bearer {$token}",
        ])->getJson('/api/user/profile');
        
        $protectedResponse->assertStatus(200);
        
        // 4. 測試Token刷新
        $refreshResponse = $this->postJson('/api/auth/refresh', [
            'refresh_token' => $response->json('refresh_token'),
        ]);
        
        $refreshResponse->assertStatus(200)
                       ->assertJsonStructure(['access_token', 'refresh_token']);
    }
}
```

---

## 🎯 **驗收標準**

### **功能驗收**
- [ ] JWT Token生成與驗證正常運作
- [ ] Token自動刷新機制無縫運作
- [ ] 多設備登入管理正確
- [ ] 登出時Token正確撤銷
- [ ] 帳號安全機制(鎖定)正常

### **安全驗收**
- [ ] Token無法被偽造或竄改
- [ ] 過期Token被正確拒絕
- [ ] Rate Limiting有效防止暴力攻擊
- [ ] 會話隔離正確實作
- [ ] 安全日誌記錄完整

### **效能驗收**
- [ ] Token驗證延遲 < 50ms
- [ ] 認證成功率 > 99.9%
- [ ] 並發登入處理正常
- [ ] 記憶體使用合理

---

## 📅 **實作時程**

| 階段 | 任務 | 時間 | 負責人 |
|------|------|------|--------|
| 1.1 | 資料庫結構修正 | 1天 | 後端工程師 |
| 1.2 | Go JWT服務重構 | 3天 | 後端工程師 |
| 1.3 | Laravel認證整合 | 2天 | 全端工程師 |
| 1.4 | 安全強化與測試 | 2天 | 全團隊 |

**總計**: 8個工作天 (約2週)

---

**下一階段**: [02_PostgreSQL_RLS完整實作.md](./02_PostgreSQL_RLS完整實作.md)