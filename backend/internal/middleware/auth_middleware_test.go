package middleware

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"nexus-erp/backend/internal/config"
	"nexus-erp/backend/internal/models"
	"nexus-erp/backend/internal/utils"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// MockUserService is a mock implementation of UserService
type MockUserService struct {
	mock.Mock
}

func (m *MockUserService) GetUserByID(id int64) (*models.User, error) {
	args := m.Called(id)
	return args.Get(0).(*models.User), args.Error(1)
}

func (m *MockUserService) CreateUser(req *models.CreateUserRequest) (*models.User, error) {
	args := m.Called(req)
	return args.Get(0).(*models.User), args.Error(1)
}

func (m *MockUserService) GetUserByUsername(username string) (*models.User, error) {
	args := m.Called(username)
	return args.Get(0).(*models.User), args.Error(1)
}

func (m *MockUserService) GetUserByEmail(email string) (*models.User, error) {
	args := m.Called(email)
	return args.Get(0).(*models.User), args.Error(1)
}

func (m *MockUserService) ValidatePassword(user *models.User, password string) error {
	args := m.Called(user, password)
	return args.Error(0)
}

func (m *MockUserService) UserExists(email, username string) bool {
	args := m.Called(email, username)
	return args.Bool(0)
}

func (m *MockUserService) GenerateJWT(user *models.User, jwtSecret string) (string, error) {
	args := m.Called(user, jwtSecret)
	return args.String(0), args.Error(1)
}

// Refresh Token methods for MockUserService
func (m *MockUserService) CreateRefreshToken(userID int64) (*models.RefreshToken, error) {
	args := m.Called(userID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.RefreshToken), args.Error(1)
}

func (m *MockUserService) GetRefreshToken(token string) (*models.RefreshToken, error) {
	args := m.Called(token)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.RefreshToken), args.Error(1)
}

func (m *MockUserService) RevokeRefreshToken(token string) error {
	args := m.Called(token)
	return args.Error(0)
}

func (m *MockUserService) RevokeAllUserRefreshTokens(userID int64) error {
	args := m.Called(userID)
	return args.Error(0)
}

func (m *MockUserService) ValidateRefreshToken(token string) (*models.RefreshToken, error) {
	args := m.Called(token)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.RefreshToken), args.Error(1)
}

// Password Reset methods for MockUserService
func (m *MockUserService) CreatePasswordResetToken(userID int64) (*models.PasswordResetToken, error) {
	args := m.Called(userID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.PasswordResetToken), args.Error(1)
}

func (m *MockUserService) GetPasswordResetToken(token string) (*models.PasswordResetToken, error) {
	args := m.Called(token)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.PasswordResetToken), args.Error(1)
}

func (m *MockUserService) ValidatePasswordResetToken(token string) (*models.PasswordResetToken, error) {
	args := m.Called(token)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.PasswordResetToken), args.Error(1)
}

func (m *MockUserService) UsePasswordResetToken(token string) error {
	args := m.Called(token)
	return args.Error(0)
}

func (m *MockUserService) UpdateUserPassword(userID int64, newPassword string) error {
	args := m.Called(userID, newPassword)
	return args.Error(0)
}

func (m *MockUserService) RevokeAllPasswordResetTokens(userID int64) error {
	args := m.Called(userID)
	return args.Error(0)
}

// RBAC methods for MockUserService
func (m *MockUserService) GetUserRoles(userID int64) ([]models.Role, error) {
	args := m.Called(userID)
	return args.Get(0).([]models.Role), args.Error(1)
}

func (m *MockUserService) GetUserPermissions(userID int64) ([]models.Permission, error) {
	args := m.Called(userID)
	return args.Get(0).([]models.Permission), args.Error(1)
}

func (m *MockUserService) HasPermission(userID int64, resource, action string) (bool, error) {
	args := m.Called(userID, resource, action)
	return args.Bool(0), args.Error(1)
}

func (m *MockUserService) AssignRole(userID int64, roleID int64) error {
	args := m.Called(userID, roleID)
	return args.Error(0)
}

func (m *MockUserService) RemoveRole(userID int64, roleID int64) error {
	args := m.Called(userID, roleID)
	return args.Error(0)
}

func TestAuthMiddleware_RequireAuth_Success(t *testing.T) {
	// Setup
	gin.SetMode(gin.TestMode)
	mockUserService := new(MockUserService)
	cfg := &config.Config{
		JWT: config.JWTConfig{
			Secret: "test-secret",
		},
	}
	
	middleware := NewAuthMiddleware(mockUserService, cfg)

	// Create a test user
	testUser := &models.User{
		ID:       1,
		Username: "testuser",
		Email:    "test@example.com",
		Status:   "active",
	}

	// Generate a valid JWT token
	tokenString, err := utils.GenerateJWT(testUser.ID, testUser.Username, 1, cfg.JWT.Secret)
	assert.NoError(t, err)

	// Mock the user service
	mockUserService.On("GetUserByID", testUser.ID).Return(testUser, nil)

	// Create a test handler
	testHandler := func(c *gin.Context) {
		user, exists := c.Get("user")
		assert.True(t, exists)
		assert.Equal(t, testUser, user)
		
		userID, exists := c.Get("user_id")
		assert.True(t, exists)
		assert.Equal(t, testUser.ID, userID)
		
		username, exists := c.Get("username")
		assert.True(t, exists)
		assert.Equal(t, testUser.Username, username)
		
		c.JSON(http.StatusOK, gin.H{"message": "success"})
	}

	// Create router and set up middleware
	r := gin.New()
	r.Use(middleware.RequireAuth())
	r.GET("/protected", testHandler)

	// Create request with valid token
	req, _ := http.NewRequest(http.MethodGet, "/protected", nil)
	req.Header.Set("Authorization", "Bearer "+tokenString)

	// Execute request
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	// Assertions
	assert.Equal(t, http.StatusOK, w.Code)
	mockUserService.AssertExpectations(t)
}

func TestAuthMiddleware_RequireAuth_MissingAuthHeader(t *testing.T) {
	// Setup
	gin.SetMode(gin.TestMode)
	mockUserService := new(MockUserService)
	cfg := &config.Config{
		JWT: config.JWTConfig{
			Secret: "test-secret",
		},
	}
	
	middleware := NewAuthMiddleware(mockUserService, cfg)

	// Create router and set up middleware
	r := gin.New()
	r.Use(middleware.RequireAuth())
	r.GET("/protected", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "success"})
	})

	// Create request without authorization header
	req, _ := http.NewRequest(http.MethodGet, "/protected", nil)

	// Execute request
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	// Assertions
	assert.Equal(t, http.StatusUnauthorized, w.Code)
	
	var response map[string]string
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Equal(t, "Authorization header required", response["error"])
}

func TestAuthMiddleware_RequireAuth_InvalidAuthHeaderFormat(t *testing.T) {
	// Setup
	gin.SetMode(gin.TestMode)
	mockUserService := new(MockUserService)
	cfg := &config.Config{
		JWT: config.JWTConfig{
			Secret: "test-secret",
		},
	}
	
	middleware := NewAuthMiddleware(mockUserService, cfg)

	// Create router and set up middleware
	r := gin.New()
	r.Use(middleware.RequireAuth())
	r.GET("/protected", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "success"})
	})

	// Create request with invalid authorization header format
	req, _ := http.NewRequest(http.MethodGet, "/protected", nil)
	req.Header.Set("Authorization", "InvalidFormat token")

	// Execute request
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	// Assertions
	assert.Equal(t, http.StatusUnauthorized, w.Code)
	
	var response map[string]string
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Equal(t, "Invalid authorization header format", response["error"])
}

func TestAuthMiddleware_RequireAuth_InvalidToken(t *testing.T) {
	// Setup
	gin.SetMode(gin.TestMode)
	mockUserService := new(MockUserService)
	cfg := &config.Config{
		JWT: config.JWTConfig{
			Secret: "test-secret",
		},
	}
	
	middleware := NewAuthMiddleware(mockUserService, cfg)

	// Create router and set up middleware
	r := gin.New()
	r.Use(middleware.RequireAuth())
	r.GET("/protected", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "success"})
	})

	// Create request with invalid token
	req, _ := http.NewRequest(http.MethodGet, "/protected", nil)
	req.Header.Set("Authorization", "Bearer invalid.token.here")

	// Execute request
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	// Assertions
	assert.Equal(t, http.StatusUnauthorized, w.Code)
	
	var response map[string]string
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Equal(t, "Invalid token", response["error"])
}

func TestAuthMiddleware_RequireAuth_ExpiredToken(t *testing.T) {
	// Setup
	gin.SetMode(gin.TestMode)
	mockUserService := new(MockUserService)
	cfg := &config.Config{
		JWT: config.JWTConfig{
			Secret: "test-secret",
		},
	}
	
	middleware := NewAuthMiddleware(mockUserService, cfg)

	// Create an expired token manually (this is a simplified test)
	expiredToken := "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxLCJ1c2VybmFtZSI6InRlc3R1c2VyIiwiZXhwIjoxNTc3ODM2ODAwfQ.invalid"

	// Create router and set up middleware
	r := gin.New()
	r.Use(middleware.RequireAuth())
	r.GET("/protected", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "success"})
	})

	// Create request with expired token
	req, _ := http.NewRequest(http.MethodGet, "/protected", nil)
	req.Header.Set("Authorization", "Bearer "+expiredToken)

	// Execute request
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	// Assertions
	assert.Equal(t, http.StatusUnauthorized, w.Code)
	
	var response map[string]string
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Equal(t, "Invalid token", response["error"])
}

func TestAuthMiddleware_RequireAuth_UserNotFound(t *testing.T) {
	// Setup
	gin.SetMode(gin.TestMode)
	mockUserService := new(MockUserService)
	cfg := &config.Config{
		JWT: config.JWTConfig{
			Secret: "test-secret",
		},
	}
	
	middleware := NewAuthMiddleware(mockUserService, cfg)

	// Generate a valid JWT token
	tokenString, err := utils.GenerateJWT(999, "nonexistent", 1, cfg.JWT.Secret)
	assert.NoError(t, err)

	// Mock the user service to return an error
	mockUserService.On("GetUserByID", int64(999)).Return((*models.User)(nil), assert.AnError)

	// Create router and set up middleware
	r := gin.New()
	r.Use(middleware.RequireAuth())
	r.GET("/protected", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "success"})
	})

	// Create request with valid token but non-existent user
	req, _ := http.NewRequest(http.MethodGet, "/protected", nil)
	req.Header.Set("Authorization", "Bearer "+tokenString)

	// Execute request
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	// Assertions
	assert.Equal(t, http.StatusUnauthorized, w.Code)
	
	var response map[string]string
	err = json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Equal(t, "User not found", response["error"])
	
	mockUserService.AssertExpectations(t)
}

func TestAuthMiddleware_RequireAuth_InactiveUser(t *testing.T) {
	// Setup
	gin.SetMode(gin.TestMode)
	mockUserService := new(MockUserService)
	cfg := &config.Config{
		JWT: config.JWTConfig{
			Secret: "test-secret",
		},
	}
	
	middleware := NewAuthMiddleware(mockUserService, cfg)

	// Create an inactive test user
	testUser := &models.User{
		ID:       1,
		Username: "testuser",
		Email:    "test@example.com",
		Status:   "inactive",
	}

	// Generate a valid JWT token
	tokenString, err := utils.GenerateJWT(testUser.ID, testUser.Username, 1, cfg.JWT.Secret)
	assert.NoError(t, err)

	// Mock the user service
	mockUserService.On("GetUserByID", testUser.ID).Return(testUser, nil)

	// Create router and set up middleware
	r := gin.New()
	r.Use(middleware.RequireAuth())
	r.GET("/protected", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "success"})
	})

	// Create request with valid token but inactive user
	req, _ := http.NewRequest(http.MethodGet, "/protected", nil)
	req.Header.Set("Authorization", "Bearer "+tokenString)

	// Execute request
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	// Assertions
	assert.Equal(t, http.StatusForbidden, w.Code)
	
	var response map[string]string
	err = json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Equal(t, "User account is not active", response["error"])
	
	mockUserService.AssertExpectations(t)
}

func TestAuthMiddleware_RequireAuth_DifferentSecretKey(t *testing.T) {
	// Setup
	gin.SetMode(gin.TestMode)
	mockUserService := new(MockUserService)
	cfg := &config.Config{
		JWT: config.JWTConfig{
			Secret: "test-secret",
		},
	}
	
	middleware := NewAuthMiddleware(mockUserService, cfg)

	// Generate a token with different secret
	tokenString, err := utils.GenerateJWT(1, "testuser", 1, "different-secret")
	assert.NoError(t, err)

	// Create router and set up middleware
	r := gin.New()
	r.Use(middleware.RequireAuth())
	r.GET("/protected", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "success"})
	})

	// Create request with token signed with different secret
	req, _ := http.NewRequest(http.MethodGet, "/protected", nil)
	req.Header.Set("Authorization", "Bearer "+tokenString)

	// Execute request
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	// Assertions
	assert.Equal(t, http.StatusUnauthorized, w.Code)
	
	var response map[string]string
	err = json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Equal(t, "Invalid token", response["error"])
}