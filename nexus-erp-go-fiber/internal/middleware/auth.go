package middleware

import (
	"strings"
	"time"

	"nexus-erp-fiber/internal/config"
	"nexus-erp-fiber/internal/services"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
)

// AuthMiddleware handles authentication
type AuthMiddleware struct {
	userService services.UserServiceInterface
	config      *config.Config
}

// Claims represents JWT claims with multi-tenant support
type Claims struct {
	UserID    int    `json:"user_id"`
	Username  string `json:"username"`
	Email     string `json:"email"`
	CompanyID int    `json:"company_id"`
	Role      string `json:"role"`
	jwt.RegisteredClaims
}

// NewAuthMiddleware creates a new authentication middleware
func NewAuthMiddleware(userService services.UserServiceInterface, config *config.Config) *AuthMiddleware {
	return &AuthMiddleware{
		userService: userService,
		config:      config,
	}
}

// RequireAuth middleware validates JWT token and sets user context
func (m *AuthMiddleware) RequireAuth() fiber.Handler {
	return func(c *fiber.Ctx) error {
		// Get Authorization header
		authHeader := c.Get("Authorization")
		if authHeader == "" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error":   "Authorization required",
				"message": "Missing Authorization header",
			})
		}

		// Extract token from Bearer format
		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		if tokenString == authHeader {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error":   "Invalid authorization format",
				"message": "Authorization header must use Bearer token format",
			})
		}

		// Parse and validate JWT token
		claims, err := m.validateJWT(tokenString)
		if err != nil {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error":   "Invalid token",
				"message": err.Error(),
			})
		}

		// Verify user still exists and is active
		user, err := m.userService.GetUserByID(int64(claims.UserID))
		if err != nil {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error":   "User not found",
				"message": "The user associated with this token no longer exists",
			})
		}

		if user.Status != "active" {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"error":   "Account inactive",
				"message": "User account is not active",
			})
		}

		// Set user context for downstream handlers
		userContext := map[string]interface{}{
			"user_id":    claims.UserID,
			"username":   claims.Username,
			"email":      claims.Email,
			"company_id": claims.CompanyID,
			"role":       claims.Role,
		}

		c.Locals("user", userContext)
		c.Locals("user_id", claims.UserID)
		c.Locals("username", claims.Username)
		c.Locals("email", claims.Email)
		c.Locals("company_id", claims.CompanyID)
		c.Locals("role", claims.Role)

		return c.Next()
	}
}

// RequireRole middleware checks if user has specific role
func (m *AuthMiddleware) RequireRole(requiredRole string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		userRole := c.Locals("role")
		if userRole == nil {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"error":   "Role verification failed",
				"message": "User role not found in context",
			})
		}

		if role, ok := userRole.(string); !ok || role != requiredRole {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"error":   "Insufficient privileges",
				"message": "Required role: " + requiredRole,
			})
		}

		return c.Next()
	}
}

// RequireAnyRole middleware checks if user has any of the specified roles
func (m *AuthMiddleware) RequireAnyRole(roles ...string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		userRole := c.Locals("role")
		if userRole == nil {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"error":   "Role verification failed",
				"message": "User role not found in context",
			})
		}

		role, ok := userRole.(string)
		if !ok {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"error":   "Invalid role format",
				"message": "User role is not in correct format",
			})
		}

		for _, allowedRole := range roles {
			if role == allowedRole {
				return c.Next()
			}
		}

		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error":   "Insufficient privileges",
			"message": "User does not have required role",
		})
	}
}

// RequirePermission middleware checks specific permission
func (m *AuthMiddleware) RequirePermission(resource, action string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		userID := c.Locals("user_id")
		if userID == nil {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"error": "User not authenticated",
			})
		}

		// Check if user has permission
		hasPermission, err := m.userService.HasPermission(int64(userID.(int)), resource, action)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error":   "Permission check failed",
				"message": err.Error(),
			})
		}

		if !hasPermission {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"error":   "Insufficient permissions",
				"message": "Required permission: " + resource + ":" + action,
			})
		}

		return c.Next()
	}
}

// GenerateToken generates JWT token with multi-tenant support
func (m *AuthMiddleware) GenerateToken(userID int, username, email string, companyID int, role string) (string, error) {
	claims := &Claims{
		UserID:    userID,
		Username:  username,
		Email:     email,
		CompanyID: companyID,
		Role:      role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(m.config.JWT.ExpirationTime)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Issuer:    "nexus-erp-api",
			Subject:   username,
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(m.config.JWT.Secret))
}

// GenerateRefreshToken generates refresh token
func (m *AuthMiddleware) GenerateRefreshToken(userID int, username string) (string, error) {
	claims := &jwt.RegisteredClaims{
		ExpiresAt: jwt.NewNumericDate(time.Now().Add(m.config.JWT.RefreshTime)),
		IssuedAt:  jwt.NewNumericDate(time.Now()),
		Issuer:    "nexus-erp-api",
		Subject:   username,
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(m.config.JWT.RefreshSecret))
}

// validateJWT validates and parses JWT token
func (m *AuthMiddleware) validateJWT(tokenString string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fiber.NewError(fiber.StatusUnauthorized, "Invalid signing method")
		}
		return []byte(m.config.JWT.Secret), nil
	})

	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(*Claims); ok && token.Valid {
		return claims, nil
	}

	return nil, fiber.NewError(fiber.StatusUnauthorized, "Invalid token claims")
}

// ValidateRefreshToken validates refresh token
func (m *AuthMiddleware) ValidateRefreshToken(tokenString string) (*jwt.RegisteredClaims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &jwt.RegisteredClaims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fiber.NewError(fiber.StatusUnauthorized, "Invalid signing method")
		}
		return []byte(m.config.JWT.RefreshSecret), nil
	})

	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(*jwt.RegisteredClaims); ok && token.Valid {
		return claims, nil
	}

	return nil, fiber.NewError(fiber.StatusUnauthorized, "Invalid refresh token")
}

// GetUserFromContext helper function to get user from context
func GetUserFromContext(c *fiber.Ctx) map[string]interface{} {
	if user := c.Locals("user"); user != nil {
		if userMap, ok := user.(map[string]interface{}); ok {
			return userMap
		}
	}
	return nil
}

// GetUserIDFromContext helper function to get user ID from context
func GetUserIDFromContext(c *fiber.Ctx) int {
	if userID := c.Locals("user_id"); userID != nil {
		if id, ok := userID.(int); ok {
			return id
		}
	}
	return 0
}