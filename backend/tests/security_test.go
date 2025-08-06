package tests

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"nexus-erp/backend/internal/config"
	"nexus-erp/backend/internal/database"
	"nexus-erp/backend/internal/middleware"
	"nexus-erp/backend/internal/services"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// SecurityTestSuite 安全測試套件
type SecurityTestSuite struct {
	db     *database.DB
	router *gin.Engine
	config *config.Config
}

// SetupSecurityTestSuite 設置安全測試環境
func SetupSecurityTestSuite(t *testing.T) *SecurityTestSuite {
	// 載入測試配置
	cfg, err := config.Load()
	require.NoError(t, err)

	// 設置測試資料庫
	db, err := database.Connect(cfg.Database)
	require.NoError(t, err)

	// 設置 Gin 路由
	gin.SetMode(gin.TestMode)
	router := gin.New()

	// 添加安全中介軟體
	router.Use(middleware.SecurityHeaders())
	router.Use(middleware.RateLimit(10, time.Minute))

	return &SecurityTestSuite{
		db:     db,
		router: router,
		config: cfg,
	}
}

// TestSQLInjectionProtection 測試 SQL 注入防護
func TestSQLInjectionProtection(t *testing.T) {
	suite := SetupSecurityTestSuite(t)
	defer suite.db.Close()

	// 測試各種 SQL 注入攻擊向量
	sqlInjectionPayloads := []string{
		"'; DROP TABLE users; --",
		"1' OR '1'='1",
		"1' UNION SELECT * FROM users --",
		"'; INSERT INTO users (username) VALUES ('hacker'); --",
		"1' OR 1=1#",
		"1' OR 'a'='a",
		"1'; EXEC xp_cmdshell('dir'); --",
	}

	for _, payload := range sqlInjectionPayloads {
		t.Run(fmt.Sprintf("SQL injection payload: %s", payload), func(t *testing.T) {
			// 模擬帶有 SQL 注入攻擊的請求
			req, _ := http.NewRequest("GET", "/api/users?id="+payload, nil)
			w := httptest.NewRecorder()

			suite.router.ServeHTTP(w, req)

			// 應該返回錯誤而不是執行惡意 SQL
			assert.NotEqual(t, http.StatusOK, w.Code, "SQL injection payload should be rejected")
			assert.NotContains(t, w.Body.String(), "users", "Response should not contain database data")
		})
	}
}

// TestXSSProtection 測試 XSS 防護
func TestXSSProtection(t *testing.T) {
	suite := SetupSecurityTestSuite(t)
	defer suite.db.Close()

	xssPayloads := []string{
		"<script>alert('XSS')</script>",
		"javascript:alert('XSS')",
		"<img src=x onerror=alert('XSS')>",
		"<svg onload=alert('XSS')>",
		"<iframe src='javascript:alert(\"XSS\")'></iframe>",
		"'><script>alert('XSS')</script>",
		"\"><script>alert('XSS')</script>",
	}

	for _, payload := range xssPayloads {
		t.Run(fmt.Sprintf("XSS payload: %s", payload), func(t *testing.T) {
			// 創建包含 XSS 攻擊的註冊請求
			registerData := map[string]interface{}{
				"name":      payload,
				"email":     "test@example.com",
				"password":  "TestPassword123!",
				"firstName": payload,
				"lastName":  "Test",
			}

			jsonData, _ := json.Marshal(registerData)
			req, _ := http.NewRequest("POST", "/api/auth/register", bytes.NewBuffer(jsonData))
			req.Header.Set("Content-Type", "application/json")
			w := httptest.NewRecorder()

			suite.router.ServeHTTP(w, req)

			// 檢查回應中是否包含未轉義的腳本
			responseBody := w.Body.String()
			assert.NotContains(t, responseBody, "<script>", "Response should not contain unescaped script tags")
			assert.NotContains(t, responseBody, "javascript:", "Response should not contain javascript protocol")
		})
	}
}

// TestAuthenticationBypass 測試認證繞過
func TestAuthenticationBypass(t *testing.T) {
	suite := SetupSecurityTestSuite(t)
	defer suite.db.Close()

	// 測試未授權存取受保護的端點
	protectedEndpoints := []string{
		"/api/users",
		"/api/products",
		"/api/orders",
		"/api/dashboard",
	}

	for _, endpoint := range protectedEndpoints {
		t.Run(fmt.Sprintf("Unauthorized access to %s", endpoint), func(t *testing.T) {
			req, _ := http.NewRequest("GET", endpoint, nil)
			w := httptest.NewRecorder()

			suite.router.ServeHTTP(w, req)

			// 應該返回 401 Unauthorized
			assert.Equal(t, http.StatusUnauthorized, w.Code, "Protected endpoint should require authentication")
		})
	}
}

// TestJWTTokenSecurity 測試 JWT Token 安全性
func TestJWTTokenSecurity(t *testing.T) {
	suite := SetupSecurityTestSuite(t)
	defer suite.db.Close()

	// 測試各種無效的 JWT token
	invalidTokens := []string{
		"", // 空 token
		"invalid.token.here",
		"Bearer invalid",
		"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature", // 無效簽名
		"Bearer " + strings.Repeat("a", 1000), // 過長的 token
	}

	for _, token := range invalidTokens {
		t.Run(fmt.Sprintf("Invalid token: %s", token), func(t *testing.T) {
			req, _ := http.NewRequest("GET", "/api/users", nil)
			if token != "" {
				req.Header.Set("Authorization", token)
			}
			w := httptest.NewRecorder()

			suite.router.ServeHTTP(w, req)

			assert.Equal(t, http.StatusUnauthorized, w.Code, "Invalid token should be rejected")
		})
	}
}

// TestRateLimiting 測試速率限制
func TestRateLimiting(t *testing.T) {
	suite := SetupSecurityTestSuite(t)
	defer suite.db.Close()

	// 快速發送多個請求以觸發速率限制
	endpoint := "/api/auth/login"
	loginData := map[string]string{
		"name":     "testuser",
		"password": "wrongpassword",
	}

	var rateLimitTriggered bool
	for i := 0; i < 20; i++ {
		jsonData, _ := json.Marshal(loginData)
		req, _ := http.NewRequest("POST", endpoint, bytes.NewBuffer(jsonData))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()

		suite.router.ServeHTTP(w, req)

		if w.Code == http.StatusTooManyRequests {
			rateLimitTriggered = true
			break
		}
	}

	assert.True(t, rateLimitTriggered, "Rate limiting should be triggered after multiple requests")
}

// TestSecurityHeaders 測試安全標頭
func TestSecurityHeaders(t *testing.T) {
	suite := SetupSecurityTestSuite(t)
	defer suite.db.Close()

	req, _ := http.NewRequest("GET", "/", nil)
	w := httptest.NewRecorder()

	suite.router.ServeHTTP(w, req)

	// 檢查是否包含重要的安全標頭
	expectedHeaders := map[string]string{
		"X-Frame-Options":           "DENY",
		"X-Content-Type-Options":    "nosniff",
		"X-XSS-Protection":          "1; mode=block",
		"Content-Security-Policy":   "", // 應該存在
	}

	for header, expectedValue := range expectedHeaders {
		actualValue := w.Header().Get(header)
		if expectedValue == "" {
			assert.NotEmpty(t, actualValue, fmt.Sprintf("Header %s should be present", header))
		} else {
			assert.Equal(t, expectedValue, actualValue, fmt.Sprintf("Header %s should have correct value", header))
		}
	}
}

// TestPasswordPolicy 測試密碼政策
func TestPasswordPolicy(t *testing.T) {
	suite := SetupSecurityTestSuite(t)
	defer suite.db.Close()

	weakPasswords := []string{
		"123456",
		"password",
		"admin",
		"123",
		"abc",
		"qwerty",
		"111111",
		"test",
	}

	for _, password := range weakPasswords {
		t.Run(fmt.Sprintf("Weak password: %s", password), func(t *testing.T) {
			registerData := map[string]interface{}{
				"name":      "testuser" + password,
				"email":     fmt.Sprintf("test%s@example.com", password),
				"password":  password,
				"firstName": "Test",
				"lastName":  "User",
			}

			jsonData, _ := json.Marshal(registerData)
			req, _ := http.NewRequest("POST", "/api/auth/register", bytes.NewBuffer(jsonData))
			req.Header.Set("Content-Type", "application/json")
			w := httptest.NewRecorder()

			suite.router.ServeHTTP(w, req)

			// 弱密碼應該被拒絕
			assert.NotEqual(t, http.StatusCreated, w.Code, "Weak password should be rejected")
		})
	}
}

// TestInputValidation 測試輸入驗證
func TestInputValidation(t *testing.T) {
	suite := SetupSecurityTestSuite(t)
	defer suite.db.Close()

	// 測試過長的輸入
	testCases := []struct {
		name string
		data map[string]interface{}
	}{
		{
			name: "Extremely long username",
			data: map[string]interface{}{
				"name":      strings.Repeat("a", 1000),
				"email":     "test@example.com",
				"password":  "ValidPassword123!",
				"firstName": "Test",
				"lastName":  "User",
			},
		},
		{
			name: "Invalid email format",
			data: map[string]interface{}{
				"name":      "testuser",
				"email":     "invalid-email",
				"password":  "ValidPassword123!",
				"firstName": "Test",
				"lastName":  "User",
			},
		},
		{
			name: "Null bytes in input",
			data: map[string]interface{}{
				"name":      "test\x00user",
				"email":     "test@example.com",
				"password":  "ValidPassword123!",
				"firstName": "Test",
				"lastName":  "User",
			},
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			jsonData, _ := json.Marshal(tc.data)
			req, _ := http.NewRequest("POST", "/api/auth/register", bytes.NewBuffer(jsonData))
			req.Header.Set("Content-Type", "application/json")
			w := httptest.NewRecorder()

			suite.router.ServeHTTP(w, req)

			// 無效輸入應該被拒絕
			assert.NotEqual(t, http.StatusCreated, w.Code, "Invalid input should be rejected")
		})
	}
}

// TestFileUploadSecurity 測試檔案上傳安全性
func TestFileUploadSecurity(t *testing.T) {
	suite := SetupSecurityTestSuite(t)
	defer suite.db.Close()

	maliciousFiles := []struct {
		name     string
		content  string
		mimeType string
	}{
		{
			name:     "malicious.php",
			content:  "<?php system($_GET['cmd']); ?>",
			mimeType: "text/php",
		},
		{
			name:     "malicious.exe",
			content:  "fake executable content",
			mimeType: "application/octet-stream",
		},
		{
			name:     "../../../etc/passwd",
			content:  "trying path traversal",
			mimeType: "text/plain",
		},
		{
			name:     "virus.bat",
			content:  "@echo off\ndel /f /q C:\\*.*",
			mimeType: "application/bat",
		},
	}

	for _, file := range maliciousFiles {
		t.Run(fmt.Sprintf("Malicious file: %s", file.name), func(t *testing.T) {
			// 創建檔案上傳請求
			body := &bytes.Buffer{}
			body.WriteString(fmt.Sprintf("--boundary\r\nContent-Disposition: form-data; name=\"file\"; filename=\"%s\"\r\nContent-Type: %s\r\n\r\n%s\r\n--boundary--\r\n",
				file.name, file.mimeType, file.content))

			req, _ := http.NewRequest("POST", "/api/upload", body)
			req.Header.Set("Content-Type", "multipart/form-data; boundary=boundary")
			w := httptest.NewRecorder()

			suite.router.ServeHTTP(w, req)

			// 惡意檔案應該被拒絕
			assert.NotEqual(t, http.StatusOK, w.Code, "Malicious file upload should be rejected")
		})
	}
}

// BenchmarkSecurityMiddleware 安全中介軟體效能測試
func BenchmarkSecurityMiddleware(b *testing.B) {
	suite := SetupSecurityTestSuite(&testing.T{})
	defer suite.db.Close()

	req, _ := http.NewRequest("GET", "/api/test", nil)

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		w := httptest.NewRecorder()
		suite.router.ServeHTTP(w, req)
	}
}

// TestConcurrentSecurityRequests 併發安全請求測試
func TestConcurrentSecurityRequests(t *testing.T) {
	suite := SetupSecurityTestSuite(t)
	defer suite.db.Close()

	const numRequests = 100
	results := make(chan int, numRequests)

	// 併發發送請求
	for i := 0; i < numRequests; i++ {
		go func() {
			req, _ := http.NewRequest("GET", "/api/users", nil)
			w := httptest.NewRecorder()
			suite.router.ServeHTTP(w, req)
			results <- w.Code
		}()
	}

	// 收集結果
	unauthorizedCount := 0
	for i := 0; i < numRequests; i++ {
		code := <-results
		if code == http.StatusUnauthorized {
			unauthorizedCount++
		}
	}

	// 所有請求都應該被正確處理（返回 401）
	assert.Equal(t, numRequests, unauthorizedCount, "All unauthorized requests should be properly handled")
}