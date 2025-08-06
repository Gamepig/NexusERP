package handlers

import (
	"nexus-erp-fiber/internal/config"
	"nexus-erp-fiber/internal/middleware"
	"nexus-erp-fiber/internal/services"

	"github.com/gofiber/fiber/v2"
)

// AuthHandler handles authentication requests
type AuthHandler struct {
	userService    services.UserServiceInterface
	companyService services.CompanyServiceInterface
	authMiddleware *middleware.AuthMiddleware
	config         *config.Config
}

// NewAuthHandler creates a new auth handler
func NewAuthHandler(
	userService services.UserServiceInterface,
	companyService services.CompanyServiceInterface,
	config *config.Config,
) *AuthHandler {
	authMiddleware := middleware.NewAuthMiddleware(userService, config)
	
	return &AuthHandler{
		userService:    userService,
		companyService: companyService,
		authMiddleware: authMiddleware,
		config:         config,
	}
}

// LoginRequest represents login request payload
type LoginRequest struct {
	Username string `json:"username" validate:"required"`
	Password string `json:"password" validate:"required"`
}

// LoginResponse represents login response
type LoginResponse struct {
	Success      bool   `json:"success"`
	Token        string `json:"token"`
	RefreshToken string `json:"refresh_token"`
	User         UserInfo `json:"user"`
	Company      CompanyInfo `json:"company"`
	ExpiresIn    int64  `json:"expires_in"`
}

type UserInfo struct {
	ID       int    `json:"id"`
	Username string `json:"username"`
	Email    string `json:"email"`
	Role     string `json:"role"`
}

type CompanyInfo struct {
	ID   int    `json:"id"`
	Name string `json:"name"`
}

// Login handles user login
func (h *AuthHandler) Login(c *fiber.Ctx) error {
	var req LoginRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "Invalid request payload",
		})
	}

	// Find user by username
	user, err := h.userService.GetUserByUsername(req.Username)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"success": false,
			"error":   "Invalid credentials",
		})
	}

	// Validate password
	if !h.userService.ValidatePassword(user, req.Password) {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"success": false,
			"error":   "Invalid credentials",
		})
	}

	// Check if user is active
	if user.Status != "active" {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"success": false,
			"error":   "Account is not active",
		})
	}

	// Get user's primary company
	companies, err := h.userService.GetUserCompanies(user.ID)
	if err != nil || len(companies) == 0 {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"success": false,
			"error":   "No company access found",
		})
	}

	// Use the first active company as default
	var primaryCompany *services.UserCompany
	for _, company := range companies {
		if company.IsActive {
			primaryCompany = &company
			if company.IsPrimary {
				break // Prefer primary company
			}
		}
	}

	if primaryCompany == nil {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"success": false,
			"error":   "No active company access",
		})
	}

	// Generate JWT token
	token, err := h.authMiddleware.GenerateToken(
		int(user.ID),
		user.Username,
		user.Email,
		int(primaryCompany.CompanyID),
		"user", // Default role, could be enhanced
	)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"error":   "Failed to generate token",
		})
	}

	// Generate refresh token
	refreshToken, err := h.authMiddleware.GenerateRefreshToken(
		int(user.ID),
		user.Username,
	)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"error":   "Failed to generate refresh token",
		})
	}

	return c.JSON(LoginResponse{
		Success: true,
		Token:   token,
		RefreshToken: refreshToken,
		User: UserInfo{
			ID:       int(user.ID),
			Username: user.Username,
			Email:    user.Email,
			Role:     "user",
		},
		Company: CompanyInfo{
			ID:   int(primaryCompany.CompanyID),
			Name: "Company", // Would need to fetch company name
		},
		ExpiresIn: int64(h.config.JWT.ExpirationTime.Seconds()),
	})
}

// RegisterRequest represents registration request
type RegisterRequest struct {
	Username string `json:"username" validate:"required,min=3,max=50"`
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required,min=6"`
	CompanyName string `json:"company_name,omitempty"`
}

// Register handles user registration (stub)
func (h *AuthHandler) Register(c *fiber.Ctx) error {
	return c.Status(fiber.StatusNotImplemented).JSON(fiber.Map{
		"error": "User registration not yet implemented",
	})
}

// RefreshTokenRequest represents refresh token request
type RefreshTokenRequest struct {
	RefreshToken string `json:"refresh_token" validate:"required"`
}

// RefreshToken handles token refresh
func (h *AuthHandler) RefreshToken(c *fiber.Ctx) error {
	var req RefreshTokenRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "Invalid request payload",
		})
	}

	// Validate refresh token
	claims, err := h.authMiddleware.ValidateRefreshToken(req.RefreshToken)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"success": false,
			"error":   "Invalid refresh token",
		})
	}

	// Get user by username from claims
	user, err := h.userService.GetUserByUsername(claims.Subject)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"success": false,
			"error":   "User not found",
		})
	}

	// Get user's primary company (similar to login)
	companies, err := h.userService.GetUserCompanies(user.ID)
	if err != nil || len(companies) == 0 {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"success": false,
			"error":   "No company access found",
		})
	}

	var primaryCompany *services.UserCompany
	for _, company := range companies {
		if company.IsActive {
			primaryCompany = &company
			if company.IsPrimary {
				break
			}
		}
	}

	// Generate new token
	newToken, err := h.authMiddleware.GenerateToken(
		int(user.ID),
		user.Username,
		user.Email,
		int(primaryCompany.CompanyID),
		"user",
	)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"error":   "Failed to generate new token",
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"token":   newToken,
		"expires_in": int64(h.config.JWT.ExpirationTime.Seconds()),
	})
}

// ForgotPasswordRequest represents forgot password request
type ForgotPasswordRequest struct {
	Email string `json:"email" validate:"required,email"`
}

// ForgotPassword handles password reset request
func (h *AuthHandler) ForgotPassword(c *fiber.Ctx) error {
	return c.Status(fiber.StatusNotImplemented).JSON(fiber.Map{
		"error": "Password reset not yet implemented",
	})
}

// ResetPasswordRequest represents reset password request
type ResetPasswordRequest struct {
	Token       string `json:"token" validate:"required"`
	NewPassword string `json:"new_password" validate:"required,min=6"`
}

// ResetPassword handles password reset
func (h *AuthHandler) ResetPassword(c *fiber.Ctx) error {
	return c.Status(fiber.StatusNotImplemented).JSON(fiber.Map{
		"error": "Password reset not yet implemented",
	})
}