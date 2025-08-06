package middleware

import (
	"strconv"

	"nexus-erp-fiber/internal/database"

	"github.com/gofiber/fiber/v2"
)

// TenantMiddleware handles multi-tenant isolation using PostgreSQL RLS
type TenantMiddleware struct {
	db *database.DB
}

// NewTenantMiddleware creates a new tenant middleware
func NewTenantMiddleware(db *database.DB) *TenantMiddleware {
	return &TenantMiddleware{
		db: db,
	}
}

// SetTenantContext middleware sets the PostgreSQL session variable for RLS
func (m *TenantMiddleware) SetTenantContext() fiber.Handler {
	return func(c *fiber.Ctx) error {
		// Get tenant ID from different possible sources
		var tenantID int
		var err error

		// 1. Try to get from JWT claims (preferred method)
		if user := c.Locals("user"); user != nil {
			if userMap, ok := user.(map[string]interface{}); ok {
				if companyID, exists := userMap["company_id"]; exists {
					if id, ok := companyID.(float64); ok {
						tenantID = int(id)
					} else if id, ok := companyID.(int); ok {
						tenantID = id
					}
				}
			}
		}

		// 2. Try to get from X-Company-ID header (for company switching)
		if tenantID == 0 {
			if headerTenantID := c.Get("X-Company-ID"); headerTenantID != "" {
				tenantID, err = strconv.Atoi(headerTenantID)
				if err != nil {
					return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
						"error":   "Invalid company ID format",
						"message": "X-Company-ID header must be a valid integer",
					})
				}
			}
		}

		// 3. Default to user's primary company if still not found
		if tenantID == 0 {
			if user := c.Locals("user"); user != nil {
				if userMap, ok := user.(map[string]interface{}); ok {
					if userID, exists := userMap["user_id"]; exists {
						// Get user's primary company from database
						primaryCompanyID, err := m.getUserPrimaryCompany(userID)
						if err != nil {
							return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
								"error":   "Failed to get user's primary company",
								"message": err.Error(),
							})
						}
						tenantID = primaryCompanyID
					}
				}
			}
		}

		// Validate tenant ID
		if tenantID <= 0 {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"error":   "Invalid or missing tenant context",
				"message": "Unable to determine company/tenant ID",
			})
		}

		// Verify user has access to this tenant
		if err := m.verifyTenantAccess(c, tenantID); err != nil {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"error":   "Access denied to company",
				"message": err.Error(),
			})
		}

		// Set tenant context in database session
		if err := m.db.SetTenantContext(tenantID); err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error":   "Failed to set tenant context",
				"message": err.Error(),
			})
		}

		// Store tenant ID in context for handlers
		c.Locals("tenant_id", tenantID)
		c.Locals("company_id", tenantID) // Alias for backward compatibility

		return c.Next()
	}
}

// RequireSuperAdmin middleware bypasses RLS for superuser operations
func (m *TenantMiddleware) RequireSuperAdmin() fiber.Handler {
	return func(c *fiber.Ctx) error {
		// Check if user is super admin
		if user := c.Locals("user"); user != nil {
			if userMap, ok := user.(map[string]interface{}); ok {
				if role, exists := userMap["role"]; exists {
					if roleStr, ok := role.(string); ok && roleStr == "super_admin" {
						// Bypass RLS for super admin
						db := m.db.BypassRLS()
						c.Locals("db", db)
						return c.Next()
					}
				}
			}
		}

		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error":   "Super admin access required",
			"message": "This operation requires super admin privileges",
		})
	}
}

// RequireCompanyAdmin middleware checks if user is admin of current company
func (m *TenantMiddleware) RequireCompanyAdmin() fiber.Handler {
	return func(c *fiber.Ctx) error {
		tenantID := c.Locals("tenant_id").(int)
		
		if user := c.Locals("user"); user != nil {
			if userMap, ok := user.(map[string]interface{}); ok {
				if userID, exists := userMap["user_id"]; exists {
					isAdmin, err := m.isCompanyAdmin(userID, tenantID)
					if err != nil {
						return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
							"error": "Failed to verify admin status",
						})
					}
					
					if !isAdmin {
						return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
							"error":   "Company admin access required",
							"message": "This operation requires company admin privileges",
						})
					}
				}
			}
		}

		return c.Next()
	}
}

// Helper methods

// getUserPrimaryCompany gets user's primary company ID
func (m *TenantMiddleware) getUserPrimaryCompany(userID interface{}) (int, error) {
	var companyID int
	
	query := `
		SELECT uc.company_id 
		FROM user_companies uc 
		WHERE uc.user_id = ? 
		AND uc.is_active = true 
		AND uc.is_primary = true
		LIMIT 1
	`
	
	err := m.db.Raw(query, userID).Scan(&companyID).Error
	if err != nil {
		// Fallback: get any active company for this user
		fallbackQuery := `
			SELECT uc.company_id 
			FROM user_companies uc 
			WHERE uc.user_id = ? 
			AND uc.is_active = true 
			ORDER BY uc.created_at ASC
			LIMIT 1
		`
		err = m.db.Raw(fallbackQuery, userID).Scan(&companyID).Error
	}
	
	return companyID, err
}

// verifyTenantAccess verifies user has access to the specified tenant
func (m *TenantMiddleware) verifyTenantAccess(c *fiber.Ctx, tenantID int) error {
	if user := c.Locals("user"); user != nil {
		if userMap, ok := user.(map[string]interface{}); ok {
			if userID, exists := userMap["user_id"]; exists {
				var count int64
				
				query := `
					SELECT COUNT(*) 
					FROM user_companies uc 
					JOIN companies comp ON uc.company_id = comp.id
					WHERE uc.user_id = ? 
					AND uc.company_id = ? 
					AND uc.is_active = true 
					AND comp.is_active = true
				`
				
				err := m.db.Raw(query, userID, tenantID).Scan(&count).Error
				if err != nil {
					return err
				}
				
				if count == 0 {
					return fiber.NewError(fiber.StatusForbidden, "User does not have access to this company")
				}
			}
		}
	}
	
	return nil
}

// isCompanyAdmin checks if user is admin of the specified company
func (m *TenantMiddleware) isCompanyAdmin(userID interface{}, companyID int) (bool, error) {
	var count int64
	
	query := `
		SELECT COUNT(*) 
		FROM user_companies uc 
		WHERE uc.user_id = ? 
		AND uc.company_id = ? 
		AND uc.role IN ('admin', 'owner')
		AND uc.is_active = true
	`
	
	err := m.db.Raw(query, userID, companyID).Scan(&count).Error
	return count > 0, err
}

// GetTenantID helper function to get tenant ID from context
func GetTenantID(c *fiber.Ctx) int {
	if tenantID := c.Locals("tenant_id"); tenantID != nil {
		if id, ok := tenantID.(int); ok {
			return id
		}
	}
	return 0
}

// GetCompanyID helper function to get company ID from context (alias)
func GetCompanyID(c *fiber.Ctx) int {
	return GetTenantID(c)
}