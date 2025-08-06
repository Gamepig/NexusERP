package handlers

import (
	"encoding/json"
	"net/http"

	"nexus-erp/backend/internal/config"
	"nexus-erp/backend/internal/models"
	"nexus-erp/backend/internal/services"

	"github.com/gin-gonic/gin"
)

type AuthHandler struct {
	userService services.UserServiceInterface
	aiService   services.AIClassifier
	config      *config.Config
}

func NewAuthHandler(userService services.UserServiceInterface, aiService services.AIClassifier, config *config.Config) *AuthHandler {
	return &AuthHandler{
		userService: userService,
		aiService:   aiService,
		config:      config,
	}
}

func (h *AuthHandler) Register(c *gin.Context) {
	var req models.CreateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request body",
			"details": err.Error(),
		})
		return
	}

	user, err := h.userService.CreateUser(&req)
	if err != nil {
		if err.Error() == "user with this email or username already exists" {
			c.JSON(http.StatusConflict, gin.H{
				"error": err.Error(),
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to create user",
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "User created successfully",
		"user":    user.ToUserResponse(),
	})
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req models.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request body",
			"details": err.Error(),
		})
		return
	}

	user, err := h.userService.GetUserByUsername(req.Name)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Invalid credentials",
		})
		return
	}

	if err := h.userService.ValidatePassword(user, req.Password); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Invalid credentials",
		})
		return
	}

	token, err := h.userService.GenerateJWT(user, h.config.JWT.Secret)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to generate token",
		})
		return
	}

	refreshToken, err := h.userService.CreateRefreshToken(user.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to generate refresh token",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":       "Login successful",
		"token":         token,
		"refresh_token": refreshToken.Token,
		"user":          user.ToUserResponse(),
	})
}

func (h *AuthHandler) AIRegister(c *gin.Context) {
	var req models.AIRegistrationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request body",
			"details": err.Error(),
		})
		return
	}

	// First, check if user already exists
	userReq := &models.CreateUserRequest{
		Name:      req.Name,
		Email:     req.Email,
		Password:  req.Password,
		FirstName: req.FirstName,
		LastName:  req.LastName,
	}

	// Check if user already exists
	if h.userService.UserExists(req.Email, req.Name) {
		c.JSON(http.StatusConflict, gin.H{
			"error": "User with this email or username already exists",
		})
		return
	}

	// Classify the business using AI
	classification, err := h.aiService.ClassifyBusiness(req.BusinessDescription)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to classify business description",
			"details": err.Error(),
		})
		return
	}

	// Generate YAML representation
	yamlData, err := h.aiService.GenerateYAML(classification)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to generate classification YAML",
		})
		return
	}

	// Convert classification to JSON for database storage
	classificationJSON, err := json.Marshal(classification)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to process classification data",
		})
		return
	}

	// Set AI classification data and registration method
	classificationRaw := json.RawMessage(classificationJSON)
	userReq.AIClassificationYAML = &classificationRaw
	registrationMethod := "ai-guided"
	userReq.RegistrationMethod = &registrationMethod

	// Create the user
	user, err := h.userService.CreateUser(userReq)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to create user",
			"details": err.Error(),
		})
		return
	}

	// Determine if confirmation is required based on confidence
	requiresConfirmation := classification.Confidence < 0.8

	response := models.AIRegistrationResponse{
		Message:               "User created successfully with AI classification",
		User:                  user.ToUserResponse(),
		Classification:        *classification,
		ClassificationYAML:    yamlData,
		RequiresConfirmation:  requiresConfirmation,
	}

	c.JSON(http.StatusCreated, response)
}

func (h *AuthHandler) LoginByEmail(c *gin.Context) {
	var req models.LoginByEmailRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request body",
			"details": err.Error(),
		})
		return
	}

	user, err := h.userService.GetUserByEmail(req.Email)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Invalid credentials",
		})
		return
	}

	if err := h.userService.ValidatePassword(user, req.Password); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Invalid credentials",
		})
		return
	}

	token, err := h.userService.GenerateJWT(user, h.config.JWT.Secret)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to generate token",
		})
		return
	}

	refreshToken, err := h.userService.CreateRefreshToken(user.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to generate refresh token",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":       "Login successful",
		"token":         token,
		"refresh_token": refreshToken.Token,
		"user":          user.ToUserResponse(),
	})
}

func (h *AuthHandler) RefreshToken(c *gin.Context) {
	var req models.RefreshTokenRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request body",
			"details": err.Error(),
		})
		return
	}

	// Validate refresh token
	refreshToken, err := h.userService.ValidateRefreshToken(req.RefreshToken)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Invalid or expired refresh token",
		})
		return
	}

	// Get user by ID
	user, err := h.userService.GetUserByID(refreshToken.UserID)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "User not found",
		})
		return
	}

	// Revoke the old refresh token
	if err := h.userService.RevokeRefreshToken(req.RefreshToken); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to revoke refresh token",
		})
		return
	}

	// Generate new access token
	newToken, err := h.userService.GenerateJWT(user, h.config.JWT.Secret)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to generate new token",
		})
		return
	}

	// Generate new refresh token
	newRefreshToken, err := h.userService.CreateRefreshToken(user.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to generate new refresh token",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":       "Token refreshed successfully",
		"token":         newToken,
		"refresh_token": newRefreshToken.Token,
		"user":          user.ToUserResponse(),
	})
}

func (h *AuthHandler) ForgotPassword(c *gin.Context) {
	var req models.ForgotPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request body",
			"details": err.Error(),
		})
		return
	}

	// Get user by email
	user, err := h.userService.GetUserByEmail(req.Email)
	if err != nil {
		// Don't reveal if email exists or not for security reasons
		c.JSON(http.StatusOK, gin.H{
			"message": "If the email exists in our system, a password reset link has been sent",
		})
		return
	}

	// Create password reset token
	resetToken, err := h.userService.CreatePasswordResetToken(user.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to create password reset token",
		})
		return
	}

	// TODO: Implement email service to send reset link
	// For now, we'll return the token in the response (not secure for production)
	// In production, this would be sent via email and not returned in the response
	c.JSON(http.StatusOK, gin.H{
		"message": "Password reset token created successfully",
		"token":   resetToken.Token, // Remove this in production
	})
}

func (h *AuthHandler) ResetPassword(c *gin.Context) {
	var req models.ResetPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request body",
			"details": err.Error(),
		})
		return
	}

	// Validate password reset token
	resetToken, err := h.userService.ValidatePasswordResetToken(req.Token)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid or expired password reset token",
		})
		return
	}

	// Update user password
	err = h.userService.UpdateUserPassword(resetToken.UserID, req.NewPassword)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to update password",
		})
		return
	}

	// Mark token as used
	err = h.userService.UsePasswordResetToken(req.Token)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to mark reset token as used",
		})
		return
	}

	// Revoke all existing refresh tokens for security
	err = h.userService.RevokeAllUserRefreshTokens(resetToken.UserID)
	if err != nil {
		// Log the error but don't fail the request
		// This is not critical for the password reset flow
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Password reset successfully",
	})
}