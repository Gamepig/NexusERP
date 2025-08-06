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
)

// TestPasswordResetFlow tests the complete password reset flow
func TestPasswordResetFlow(t *testing.T) {
	gin.SetMode(gin.TestMode)
	
	// Setup mock services
	mockUserService := new(MockUserServicePasswordReset)
	mockAIService := new(services.MockAIService)
	cfg := &config.Config{}
	
	handler := NewAuthHandler(mockUserService, mockAIService, cfg)
	
	// Test data
	testEmail := "test@example.com"
	testToken := "reset-token-123"
	newPassword := "newpassword123"
	userID := int64(1)
	
	user := &models.User{
		ID:    userID,
		Email: testEmail,
	}
	
	resetToken := &models.PasswordResetToken{
		ID:        1,
		UserID:    userID,
		Token:     testToken,
		ExpiresAt: time.Now().Add(time.Hour),
		CreatedAt: time.Now(),
	}

	t.Run("complete password reset flow", func(t *testing.T) {
		// Setup router
		router := gin.New()
		router.POST("/auth/forgot-password", handler.ForgotPassword)
		router.POST("/auth/reset-password", handler.ResetPassword)

		// Step 1: Request password reset
		mockUserService.On("GetUserByEmail", testEmail).Return(user, nil).Once()
		mockUserService.On("CreatePasswordResetToken", userID).Return(resetToken, nil).Once()

		forgotPasswordReq := models.ForgotPasswordRequest{
			Email: testEmail,
		}
		
		jsonData, _ := json.Marshal(forgotPasswordReq)
		req1, _ := http.NewRequest("POST", "/auth/forgot-password", bytes.NewBuffer(jsonData))
		req1.Header.Set("Content-Type", "application/json")

		w1 := httptest.NewRecorder()
		router.ServeHTTP(w1, req1)

		assert.Equal(t, http.StatusOK, w1.Code)
		
		var forgotResponse map[string]interface{}
		err := json.Unmarshal(w1.Body.Bytes(), &forgotResponse)
		assert.NoError(t, err)
		assert.Equal(t, "Password reset token created successfully", forgotResponse["message"])
		assert.Equal(t, testToken, forgotResponse["token"])

		// Step 2: Reset password using token
		mockUserService.On("ValidatePasswordResetToken", testToken).Return(resetToken, nil).Once()
		mockUserService.On("UpdateUserPassword", userID, newPassword).Return(nil).Once()
		mockUserService.On("UsePasswordResetToken", testToken).Return(nil).Once()
		mockUserService.On("RevokeAllUserRefreshTokens", userID).Return(nil).Once()

		resetPasswordReq := models.ResetPasswordRequest{
			Token:       testToken,
			NewPassword: newPassword,
		}
		
		jsonData2, _ := json.Marshal(resetPasswordReq)
		req2, _ := http.NewRequest("POST", "/auth/reset-password", bytes.NewBuffer(jsonData2))
		req2.Header.Set("Content-Type", "application/json")

		w2 := httptest.NewRecorder()
		router.ServeHTTP(w2, req2)

		assert.Equal(t, http.StatusOK, w2.Code)
		
		var resetResponse map[string]interface{}
		err = json.Unmarshal(w2.Body.Bytes(), &resetResponse)
		assert.NoError(t, err)
		assert.Equal(t, "Password reset successfully", resetResponse["message"])

		// Verify all expectations were met
		mockUserService.AssertExpectations(t)
	})

	t.Run("password reset with expired token", func(t *testing.T) {
		// Setup fresh mocks
		mockUserService = new(MockUserServicePasswordReset)
		handler = NewAuthHandler(mockUserService, mockAIService, cfg)
		
		router := gin.New()
		router.POST("/auth/reset-password", handler.ResetPassword)

		// Mock expired token validation
		mockUserService.On("ValidatePasswordResetToken", testToken).Return(nil, assert.AnError).Once()

		resetPasswordReq := models.ResetPasswordRequest{
			Token:       testToken,
			NewPassword: newPassword,
		}
		
		jsonData, _ := json.Marshal(resetPasswordReq)
		req, _ := http.NewRequest("POST", "/auth/reset-password", bytes.NewBuffer(jsonData))
		req.Header.Set("Content-Type", "application/json")

		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)
		
		var response map[string]interface{}
		err := json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)
		assert.Equal(t, "Invalid or expired password reset token", response["error"])

		mockUserService.AssertExpectations(t)
	})

	t.Run("password reset with non-existent email", func(t *testing.T) {
		// Setup fresh mocks
		mockUserService = new(MockUserServicePasswordReset)
		handler = NewAuthHandler(mockUserService, mockAIService, cfg)
		
		router := gin.New()
		router.POST("/auth/forgot-password", handler.ForgotPassword)

		// Mock user not found
		mockUserService.On("GetUserByEmail", "nonexistent@example.com").Return(nil, assert.AnError).Once()

		forgotPasswordReq := models.ForgotPasswordRequest{
			Email: "nonexistent@example.com",
		}
		
		jsonData, _ := json.Marshal(forgotPasswordReq)
		req, _ := http.NewRequest("POST", "/auth/forgot-password", bytes.NewBuffer(jsonData))
		req.Header.Set("Content-Type", "application/json")

		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		// Should still return 200 for security (don't reveal email existence)
		assert.Equal(t, http.StatusOK, w.Code)
		
		var response map[string]interface{}
		err := json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)
		assert.Equal(t, "If the email exists in our system, a password reset link has been sent", response["message"])

		mockUserService.AssertExpectations(t)
	})
}