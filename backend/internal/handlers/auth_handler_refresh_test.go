package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"nexus-erp/backend/internal/config"
	"nexus-erp/backend/internal/models"
	"nexus-erp/backend/internal/services"
	"nexus-erp/backend/internal/utils"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// MockUserServiceForRefresh implements the interface for refresh token tests
type MockUserServiceForRefresh struct {
	mock.Mock
	refreshTokens map[string]*models.RefreshToken
}

func (m *MockUserServiceForRefresh) GetUserByID(id int64) (*models.User, error) {
	args := m.Called(id)
	return args.Get(0).(*models.User), args.Error(1)
}

func (m *MockUserServiceForRefresh) CreateUser(req *models.CreateUserRequest) (*models.User, error) {
	args := m.Called(req)
	return args.Get(0).(*models.User), args.Error(1)
}

func (m *MockUserServiceForRefresh) GetUserByUsername(username string) (*models.User, error) {
	args := m.Called(username)
	return args.Get(0).(*models.User), args.Error(1)
}

func (m *MockUserServiceForRefresh) GetUserByEmail(email string) (*models.User, error) {
	args := m.Called(email)
	return args.Get(0).(*models.User), args.Error(1)
}

func (m *MockUserServiceForRefresh) ValidatePassword(user *models.User, password string) error {
	args := m.Called(user, password)
	return args.Error(0)
}

func (m *MockUserServiceForRefresh) UserExists(email, username string) bool {
	args := m.Called(email, username)
	return args.Bool(0)
}

func (m *MockUserServiceForRefresh) GenerateJWT(user *models.User, jwtSecret string) (string, error) {
	args := m.Called(user, jwtSecret)
	return args.String(0), args.Error(1)
}

func (m *MockUserServiceForRefresh) CreateRefreshToken(userID int64) (*models.RefreshToken, error) {
	token, err := utils.GenerateRefreshToken()
	if err != nil {
		return nil, err
	}
	
	refreshToken := &models.RefreshToken{
		ID:        1,
		UserID:    userID,
		Token:     token,
		ExpiresAt: time.Now().Add(7 * 24 * time.Hour),
		CreatedAt: time.Now(),
	}
	
	if m.refreshTokens == nil {
		m.refreshTokens = make(map[string]*models.RefreshToken)
	}
	m.refreshTokens[token] = refreshToken
	
	return refreshToken, nil
}

func (m *MockUserServiceForRefresh) GetRefreshToken(token string) (*models.RefreshToken, error) {
	if refreshToken, exists := m.refreshTokens[token]; exists {
		return refreshToken, nil
	}
	return nil, assert.AnError
}

func (m *MockUserServiceForRefresh) ValidateRefreshToken(token string) (*models.RefreshToken, error) {
	if refreshToken, exists := m.refreshTokens[token]; exists {
		if refreshToken.RevokedAt == nil && time.Now().Before(refreshToken.ExpiresAt) {
			return refreshToken, nil
		}
	}
	return nil, assert.AnError
}

func (m *MockUserServiceForRefresh) RevokeRefreshToken(token string) error {
	if refreshToken, exists := m.refreshTokens[token]; exists {
		now := time.Now()
		refreshToken.RevokedAt = &now
		return nil
	}
	return assert.AnError
}

func (m *MockUserServiceForRefresh) RevokeAllUserRefreshTokens(userID int64) error {
	for _, refreshToken := range m.refreshTokens {
		if refreshToken.UserID == userID {
			now := time.Now()
			refreshToken.RevokedAt = &now
		}
	}
	return nil
}

// Password Reset methods for MockUserServiceForRefresh
func (m *MockUserServiceForRefresh) CreatePasswordResetToken(userID int64) (*models.PasswordResetToken, error) {
	args := m.Called(userID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.PasswordResetToken), args.Error(1)
}

func (m *MockUserServiceForRefresh) GetPasswordResetToken(token string) (*models.PasswordResetToken, error) {
	args := m.Called(token)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.PasswordResetToken), args.Error(1)
}

func (m *MockUserServiceForRefresh) ValidatePasswordResetToken(token string) (*models.PasswordResetToken, error) {
	args := m.Called(token)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.PasswordResetToken), args.Error(1)
}

func (m *MockUserServiceForRefresh) UsePasswordResetToken(token string) error {
	args := m.Called(token)
	return args.Error(0)
}

func (m *MockUserServiceForRefresh) UpdateUserPassword(userID int64, newPassword string) error {
	args := m.Called(userID, newPassword)
	return args.Error(0)
}

func (m *MockUserServiceForRefresh) RevokeAllPasswordResetTokens(userID int64) error {
	args := m.Called(userID)
	return args.Error(0)
}

// RBAC methods for MockUserServiceForRefresh
func (m *MockUserServiceForRefresh) GetUserRoles(userID int64) ([]models.Role, error) {
	args := m.Called(userID)
	return args.Get(0).([]models.Role), args.Error(1)
}

func (m *MockUserServiceForRefresh) GetUserPermissions(userID int64) ([]models.Permission, error) {
	args := m.Called(userID)
	return args.Get(0).([]models.Permission), args.Error(1)
}

func (m *MockUserServiceForRefresh) HasPermission(userID int64, resource, action string) (bool, error) {
	args := m.Called(userID, resource, action)
	return args.Bool(0), args.Error(1)
}

func (m *MockUserServiceForRefresh) AssignRole(userID int64, roleID int64) error {
	args := m.Called(userID, roleID)
	return args.Error(0)
}

func (m *MockUserServiceForRefresh) RemoveRole(userID int64, roleID int64) error {
	args := m.Called(userID, roleID)
	return args.Error(0)
}

func TestAuthHandler_RefreshToken(t *testing.T) {
	gin.SetMode(gin.TestMode)

	// Create mock services
	mockUserService := &MockUserServiceForRefresh{}
	mockAIService := &services.MockAIService{}
	cfg := &config.Config{
		JWT: config.JWTConfig{
			Secret: "test-secret",
		},
	}

	// Create handler
	handler := NewAuthHandler(mockUserService, mockAIService, cfg)

	// Create test user
	testUser := &models.User{
		ID:       1,
		Username: "testuser",
		Email:    "test@example.com",
		Status:   "active",
	}

	// Mock GetUserByID and GenerateJWT
	mockUserService.On("GetUserByID", int64(1)).Return(testUser, nil)
	mockUserService.On("GenerateJWT", mock.AnythingOfType("*models.User"), "test-secret").Return("mock-jwt-token", nil)

	// Test 1: Successful token refresh
	t.Run("Successful token refresh", func(t *testing.T) {
		// Create a refresh token
		refreshToken, err := mockUserService.CreateRefreshToken(testUser.ID)
		assert.NoError(t, err)

		// Prepare request
		reqBody := models.RefreshTokenRequest{
			RefreshToken: refreshToken.Token,
		}
		jsonBody, _ := json.Marshal(reqBody)

		// Create request
		req, _ := http.NewRequest(http.MethodPost, "/api/auth/refresh", bytes.NewBuffer(jsonBody))
		req.Header.Set("Content-Type", "application/json")

		// Create response recorder
		w := httptest.NewRecorder()

		// Create Gin context
		router := gin.New()
		router.POST("/api/auth/refresh", handler.RefreshToken)

		// Execute request
		router.ServeHTTP(w, req)

		// Assert response
		assert.Equal(t, http.StatusOK, w.Code)

		var response map[string]interface{}
		err = json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)

		assert.Equal(t, "Token refreshed successfully", response["message"])
		assert.NotEmpty(t, response["token"])
		assert.NotEmpty(t, response["refresh_token"])
		assert.NotNil(t, response["user"])
	})

	// Test 2: Invalid refresh token
	t.Run("Invalid refresh token", func(t *testing.T) {
		// Prepare request with invalid token
		reqBody := models.RefreshTokenRequest{
			RefreshToken: "invalid-token",
		}
		jsonBody, _ := json.Marshal(reqBody)

		// Create request
		req, _ := http.NewRequest(http.MethodPost, "/api/auth/refresh", bytes.NewBuffer(jsonBody))
		req.Header.Set("Content-Type", "application/json")

		// Create response recorder
		w := httptest.NewRecorder()

		// Create Gin context
		router := gin.New()
		router.POST("/api/auth/refresh", handler.RefreshToken)

		// Execute request
		router.ServeHTTP(w, req)

		// Assert response
		assert.Equal(t, http.StatusUnauthorized, w.Code)

		var response map[string]interface{}
		err := json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)

		assert.Equal(t, "Invalid or expired refresh token", response["error"])
	})

	// Test 3: Invalid JSON body
	t.Run("Invalid JSON body", func(t *testing.T) {
		// Create request with invalid JSON
		req, _ := http.NewRequest(http.MethodPost, "/api/auth/refresh", bytes.NewBuffer([]byte("invalid json")))
		req.Header.Set("Content-Type", "application/json")

		// Create response recorder
		w := httptest.NewRecorder()

		// Create Gin context
		router := gin.New()
		router.POST("/api/auth/refresh", handler.RefreshToken)

		// Execute request
		router.ServeHTTP(w, req)

		// Assert response
		assert.Equal(t, http.StatusBadRequest, w.Code)

		var response map[string]interface{}
		err := json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)

		assert.Equal(t, "Invalid request body", response["error"])
	})

	// Test 4: Missing refresh token
	t.Run("Missing refresh token", func(t *testing.T) {
		// Prepare request without refresh token
		reqBody := models.RefreshTokenRequest{}
		jsonBody, _ := json.Marshal(reqBody)

		// Create request
		req, _ := http.NewRequest(http.MethodPost, "/api/auth/refresh", bytes.NewBuffer(jsonBody))
		req.Header.Set("Content-Type", "application/json")

		// Create response recorder
		w := httptest.NewRecorder()

		// Create Gin context
		router := gin.New()
		router.POST("/api/auth/refresh", handler.RefreshToken)

		// Execute request
		router.ServeHTTP(w, req)

		// Assert response
		assert.Equal(t, http.StatusBadRequest, w.Code)
	})
}

func TestAuthHandler_LoginWithRefreshToken(t *testing.T) {
	gin.SetMode(gin.TestMode)

	// Create mock services
	mockUserService := &MockUserServiceForRefresh{}
	mockAIService := &services.MockAIService{}
	cfg := &config.Config{
		JWT: config.JWTConfig{
			Secret: "test-secret",
		},
	}

	// Create handler
	handler := NewAuthHandler(mockUserService, mockAIService, cfg)

	// Create test user
	testUser := &models.User{
		ID:           1,
		Username:     "testuser",
		Email:        "test@example.com",
		PasswordHash: "$2a$10$tNwTTZVxVFWFEJiXBLvNk.E7D7IIxfMcDJQqCYPJ9e6pzFZOgJfTa", // "password123"
		Status:       "active",
	}

	// Mock user service methods
	mockUserService.On("GetUserByUsername", "testuser").Return(testUser, nil)
	mockUserService.On("ValidatePassword", mock.AnythingOfType("*models.User"), "password123").Return(nil)
	mockUserService.On("GenerateJWT", mock.AnythingOfType("*models.User"), "test-secret").Return("mock-jwt-token", nil)

	// Test login returns refresh token
	t.Run("Login returns refresh token", func(t *testing.T) {
		// Prepare request
		reqBody := models.LoginRequest{
			Name:     "testuser",
			Password: "password123",
		}
		jsonBody, _ := json.Marshal(reqBody)

		// Create request
		req, _ := http.NewRequest(http.MethodPost, "/api/auth/login", bytes.NewBuffer(jsonBody))
		req.Header.Set("Content-Type", "application/json")

		// Create response recorder
		w := httptest.NewRecorder()

		// Create Gin context
		router := gin.New()
		router.POST("/api/auth/login", handler.Login)

		// Execute request
		router.ServeHTTP(w, req)

		// Assert response
		assert.Equal(t, http.StatusOK, w.Code)

		var response map[string]interface{}
		err := json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)

		assert.Equal(t, "Login successful", response["message"])
		assert.NotEmpty(t, response["token"])
		assert.NotEmpty(t, response["refresh_token"])
		assert.NotNil(t, response["user"])
	})
}