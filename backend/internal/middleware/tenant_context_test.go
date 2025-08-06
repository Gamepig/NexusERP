package middleware

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"nexus-erp/backend/internal/utils"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestTenantContextMiddleware_SetTenantContext(t *testing.T) {
	tests := []struct {
		name           string
		setupAuth      func() string
		expectedCompanyID int64
		expectedUserID    int64
		expectedUsername  string
	}{
		{
			name: "Valid JWT token",
			setupAuth: func() string {
				token, _ := utils.GenerateJWT(123, "testuser", 456, "test-secret")
				return "Bearer " + token
			},
			expectedCompanyID: 456,
			expectedUserID:    123,
			expectedUsername:  "testuser",
		},
		{
			name: "No Authorization header",
			setupAuth: func() string {
				return ""
			},
			expectedCompanyID: 1,
			expectedUserID:    0,
			expectedUsername:  "",
		},
		{
			name: "Invalid Authorization header format",
			setupAuth: func() string {
				return "InvalidFormat token"
			},
			expectedCompanyID: 1,
			expectedUserID:    0,
			expectedUsername:  "",
		},
		{
			name: "Invalid JWT token",
			setupAuth: func() string {
				return "Bearer invalid.jwt.token"
			},
			expectedCompanyID: 1,
			expectedUserID:    0,
			expectedUsername:  "",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Create middleware
			middleware := NewTenantContextMiddleware("test-secret")

			// Create test handler
			testHandler := func(c *gin.Context) {
				companyID := GetCompanyIDFromContext(c)
				userID := GetUserIDFromContext(c)
				username := GetUsernameFromContext(c)

				c.JSON(http.StatusOK, gin.H{
					"company_id": companyID,
					"user_id":    userID,
					"username":   username,
				})
			}

			// Create router
			r := gin.New()
			r.Use(middleware.SetTenantContext())
			r.GET("/test", testHandler)

			// Create request
			req, _ := http.NewRequest(http.MethodGet, "/test", nil)
			if authHeader := tt.setupAuth(); authHeader != "" {
				req.Header.Set("Authorization", authHeader)
			}

			// Execute request
			w := httptest.NewRecorder()
			r.ServeHTTP(w, req)

			// Assertions
			assert.Equal(t, http.StatusOK, w.Code)

			var response map[string]interface{}
			err := json.Unmarshal(w.Body.Bytes(), &response)
			require.NoError(t, err)

			assert.Equal(t, float64(tt.expectedCompanyID), response["company_id"])
			assert.Equal(t, float64(tt.expectedUserID), response["user_id"])
			assert.Equal(t, tt.expectedUsername, response["username"])
		})
	}
}

func TestTenantContextMiddleware_RequireTenantContext(t *testing.T) {
	tests := []struct {
		name           string
		setupAuth      func() string
		expectedStatus int
		expectError    bool
	}{
		{
			name: "Valid JWT token",
			setupAuth: func() string {
				token, _ := utils.GenerateJWT(123, "testuser", 456, "test-secret")
				return "Bearer " + token
			},
			expectedStatus: http.StatusOK,
			expectError:    false,
		},
		{
			name: "No Authorization header - should pass with default company ID",
			setupAuth: func() string {
				return ""
			},
			expectedStatus: http.StatusOK,
			expectError:    false,
		},
		{
			name: "Invalid JWT token - should pass with default company ID",
			setupAuth: func() string {
				return "Bearer invalid.jwt.token"
			},
			expectedStatus: http.StatusOK,
			expectError:    false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Create middleware
			middleware := NewTenantContextMiddleware("test-secret")

			// Create test handler
			testHandler := func(c *gin.Context) {
				companyID := GetCompanyIDFromContext(c)
				c.JSON(http.StatusOK, gin.H{
					"company_id": companyID,
					"message":    "success",
				})
			}

			// Create router
			r := gin.New()
			r.Use(middleware.RequireTenantContext())
			r.GET("/test", testHandler)

			// Create request
			req, _ := http.NewRequest(http.MethodGet, "/test", nil)
			if authHeader := tt.setupAuth(); authHeader != "" {
				req.Header.Set("Authorization", authHeader)
			}

			// Execute request
			w := httptest.NewRecorder()
			r.ServeHTTP(w, req)

			// Assertions
			assert.Equal(t, tt.expectedStatus, w.Code)

			var response map[string]interface{}
			err := json.Unmarshal(w.Body.Bytes(), &response)
			require.NoError(t, err)

			if tt.expectError {
				assert.Contains(t, response, "error")
			} else {
				assert.Contains(t, response, "company_id")
				// Company ID should be at least 1 (default)
				assert.GreaterOrEqual(t, response["company_id"], float64(1))
			}
		})
	}
}

func TestGetCompanyIDFromContext(t *testing.T) {
	tests := []struct {
		name     string
		setValue interface{}
		expected int64
	}{
		{
			name:     "Valid int64 company ID",
			setValue: int64(456),
			expected: 456,
		},
		{
			name:     "Invalid type",
			setValue: "not-a-number",
			expected: 1, // Default value
		},
		{
			name:     "No value set",
			setValue: nil,
			expected: 1, // Default value
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Create Gin context
			c, _ := gin.CreateTestContext(httptest.NewRecorder())

			// Set value if provided
			if tt.setValue != nil {
				c.Set("company_id", tt.setValue)
			}

			// Test function
			result := GetCompanyIDFromContext(c)
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestGetUserIDFromContext(t *testing.T) {
	tests := []struct {
		name     string
		setValue interface{}
		expected int64
	}{
		{
			name:     "Valid int64 user ID",
			setValue: int64(123),
			expected: 123,
		},
		{
			name:     "Invalid type",
			setValue: "not-a-number",
			expected: 0, // Default value
		},
		{
			name:     "No value set",
			setValue: nil,
			expected: 0, // Default value
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Create Gin context
			c, _ := gin.CreateTestContext(httptest.NewRecorder())

			// Set value if provided
			if tt.setValue != nil {
				c.Set("user_id", tt.setValue)
			}

			// Test function
			result := GetUserIDFromContext(c)
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestGetUsernameFromContext(t *testing.T) {
	tests := []struct {
		name     string
		setValue interface{}
		expected string
	}{
		{
			name:     "Valid username",
			setValue: "testuser",
			expected: "testuser",
		},
		{
			name:     "Invalid type",
			setValue: 123,
			expected: "", // Default value
		},
		{
			name:     "No value set",
			setValue: nil,
			expected: "", // Default value
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Create Gin context
			c, _ := gin.CreateTestContext(httptest.NewRecorder())

			// Set value if provided
			if tt.setValue != nil {
				c.Set("username", tt.setValue)
			}

			// Test function
			result := GetUsernameFromContext(c)
			assert.Equal(t, tt.expected, result)
		})
	}
}