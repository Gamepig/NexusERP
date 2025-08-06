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

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// MockUserService for password reset testing
type MockUserServicePasswordReset struct {
	mock.Mock
}

func (m *MockUserServicePasswordReset) GetUserByEmail(email string) (*models.User, error) {
	args := m.Called(email)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.User), args.Error(1)
}

func (m *MockUserServicePasswordReset) CreatePasswordResetToken(userID int64) (*models.PasswordResetToken, error) {
	args := m.Called(userID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.PasswordResetToken), args.Error(1)
}

func (m *MockUserServicePasswordReset) ValidatePasswordResetToken(token string) (*models.PasswordResetToken, error) {
	args := m.Called(token)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.PasswordResetToken), args.Error(1)
}

func (m *MockUserServicePasswordReset) UpdateUserPassword(userID int64, newPassword string) error {
	args := m.Called(userID, newPassword)
	return args.Error(0)
}

func (m *MockUserServicePasswordReset) UsePasswordResetToken(token string) error {
	args := m.Called(token)
	return args.Error(0)
}

func (m *MockUserServicePasswordReset) RevokeAllUserRefreshTokens(userID int64) error {
	args := m.Called(userID)
	return args.Error(0)
}

// Implement other required interface methods as stubs
func (m *MockUserServicePasswordReset) GetUserByID(id int64) (*models.User, error) { return nil, nil }
func (m *MockUserServicePasswordReset) GetUserByUsername(username string) (*models.User, error) { return nil, nil }
func (m *MockUserServicePasswordReset) CreateUser(req *models.CreateUserRequest) (*models.User, error) { return nil, nil }
func (m *MockUserServicePasswordReset) ValidatePassword(user *models.User, password string) error { return nil }
func (m *MockUserServicePasswordReset) GenerateJWT(user *models.User, jwtSecret string) (string, error) { return "", nil }
func (m *MockUserServicePasswordReset) UserExists(email, username string) bool { return false }
func (m *MockUserServicePasswordReset) CreateRefreshToken(userID int64) (*models.RefreshToken, error) { return nil, nil }
func (m *MockUserServicePasswordReset) GetRefreshToken(token string) (*models.RefreshToken, error) { return nil, nil }
func (m *MockUserServicePasswordReset) RevokeRefreshToken(token string) error { return nil }
func (m *MockUserServicePasswordReset) ValidateRefreshToken(token string) (*models.RefreshToken, error) { return nil, nil }
func (m *MockUserServicePasswordReset) GetPasswordResetToken(token string) (*models.PasswordResetToken, error) { return nil, nil }
func (m *MockUserServicePasswordReset) RevokeAllPasswordResetTokens(userID int64) error { return nil }
func (m *MockUserServicePasswordReset) GetUserRoles(userID int64) ([]models.Role, error) { return nil, nil }
func (m *MockUserServicePasswordReset) GetUserPermissions(userID int64) ([]models.Permission, error) { return nil, nil }
func (m *MockUserServicePasswordReset) HasPermission(userID int64, resource, action string) (bool, error) { return false, nil }
func (m *MockUserServicePasswordReset) AssignRole(userID int64, roleID int64) error { return nil }
func (m *MockUserServicePasswordReset) RemoveRole(userID int64, roleID int64) error { return nil }

func TestAuthHandler_ForgotPassword(t *testing.T) {
	gin.SetMode(gin.TestMode)

	tests := []struct {
		name           string
		requestBody    models.ForgotPasswordRequest
		setupMocks     func(*MockUserServicePasswordReset)
		expectedStatus int
		expectedBody   map[string]interface{}
	}{
		{
			name: "successful forgot password",
			requestBody: models.ForgotPasswordRequest{
				Email: "test@example.com",
			},
			setupMocks: func(m *MockUserServicePasswordReset) {
				user := &models.User{
					ID:    1,
					Email: "test@example.com",
				}
				resetToken := &models.PasswordResetToken{
					ID:        1,
					UserID:    1,
					Token:     "reset-token-123",
					ExpiresAt: time.Now().Add(time.Hour),
					CreatedAt: time.Now(),
				}
				m.On("GetUserByEmail", "test@example.com").Return(user, nil)
				m.On("CreatePasswordResetToken", int64(1)).Return(resetToken, nil)
			},
			expectedStatus: http.StatusOK,
			expectedBody: map[string]interface{}{
				"message": "Password reset token created successfully",
				"token":   "reset-token-123",
			},
		},
		{
			name: "email not found",
			requestBody: models.ForgotPasswordRequest{
				Email: "notfound@example.com",
			},
			setupMocks: func(m *MockUserServicePasswordReset) {
				m.On("GetUserByEmail", "notfound@example.com").Return(nil, assert.AnError)
			},
			expectedStatus: http.StatusOK,
			expectedBody: map[string]interface{}{
				"message": "If the email exists in our system, a password reset link has been sent",
			},
		},
		{
			name: "invalid request body",
			requestBody: models.ForgotPasswordRequest{
				Email: "invalid-email",
			},
			setupMocks:     func(m *MockUserServicePasswordReset) {},
			expectedStatus: http.StatusBadRequest,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockUserService := new(MockUserServicePasswordReset)
			mockAIService := new(services.MockAIService)
			tt.setupMocks(mockUserService)

			cfg := &config.Config{}
			handler := NewAuthHandler(mockUserService, mockAIService, cfg)

			jsonData, _ := json.Marshal(tt.requestBody)
			req, _ := http.NewRequest("POST", "/auth/forgot-password", bytes.NewBuffer(jsonData))
			req.Header.Set("Content-Type", "application/json")

			w := httptest.NewRecorder()
			router := gin.New()
			router.POST("/auth/forgot-password", handler.ForgotPassword)
			router.ServeHTTP(w, req)

			assert.Equal(t, tt.expectedStatus, w.Code)

			if tt.expectedBody != nil {
				var response map[string]interface{}
				err := json.Unmarshal(w.Body.Bytes(), &response)
				assert.NoError(t, err)
				
				for key, expectedValue := range tt.expectedBody {
					assert.Equal(t, expectedValue, response[key])
				}
			}

			mockUserService.AssertExpectations(t)
		})
	}
}

func TestAuthHandler_ResetPassword(t *testing.T) {
	gin.SetMode(gin.TestMode)

	tests := []struct {
		name           string
		requestBody    models.ResetPasswordRequest
		setupMocks     func(*MockUserServicePasswordReset)
		expectedStatus int
		expectedBody   map[string]interface{}
	}{
		{
			name: "successful password reset",
			requestBody: models.ResetPasswordRequest{
				Token:       "valid-reset-token",
				NewPassword: "newpassword123",
			},
			setupMocks: func(m *MockUserServicePasswordReset) {
				resetToken := &models.PasswordResetToken{
					ID:        1,
					UserID:    1,
					Token:     "valid-reset-token",
					ExpiresAt: time.Now().Add(time.Hour),
				}
				m.On("ValidatePasswordResetToken", "valid-reset-token").Return(resetToken, nil)
				m.On("UpdateUserPassword", int64(1), "newpassword123").Return(nil)
				m.On("UsePasswordResetToken", "valid-reset-token").Return(nil)
				m.On("RevokeAllUserRefreshTokens", int64(1)).Return(nil)
			},
			expectedStatus: http.StatusOK,
			expectedBody: map[string]interface{}{
				"message": "Password reset successfully",
			},
		},
		{
			name: "invalid reset token",
			requestBody: models.ResetPasswordRequest{
				Token:       "invalid-token",
				NewPassword: "newpassword123",
			},
			setupMocks: func(m *MockUserServicePasswordReset) {
				m.On("ValidatePasswordResetToken", "invalid-token").Return(nil, assert.AnError)
			},
			expectedStatus: http.StatusBadRequest,
			expectedBody: map[string]interface{}{
				"error": "Invalid or expired password reset token",
			},
		},
		{
			name: "password too short",
			requestBody: models.ResetPasswordRequest{
				Token:       "valid-token",
				NewPassword: "123",
			},
			setupMocks:     func(m *MockUserServicePasswordReset) {},
			expectedStatus: http.StatusBadRequest,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockUserService := new(MockUserServicePasswordReset)
			mockAIService := new(services.MockAIService)
			tt.setupMocks(mockUserService)

			cfg := &config.Config{}
			handler := NewAuthHandler(mockUserService, mockAIService, cfg)

			jsonData, _ := json.Marshal(tt.requestBody)
			req, _ := http.NewRequest("POST", "/auth/reset-password", bytes.NewBuffer(jsonData))
			req.Header.Set("Content-Type", "application/json")

			w := httptest.NewRecorder()
			router := gin.New()
			router.POST("/auth/reset-password", handler.ResetPassword)
			router.ServeHTTP(w, req)

			assert.Equal(t, tt.expectedStatus, w.Code)

			if tt.expectedBody != nil {
				var response map[string]interface{}
				err := json.Unmarshal(w.Body.Bytes(), &response)
				assert.NoError(t, err)
				
				for key, expectedValue := range tt.expectedBody {
					assert.Equal(t, expectedValue, response[key])
				}
			}

			mockUserService.AssertExpectations(t)
		})
	}
}