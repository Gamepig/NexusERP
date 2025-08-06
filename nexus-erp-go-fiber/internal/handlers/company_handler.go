package handlers

import (
	"nexus-erp-fiber/internal/middleware"
	"nexus-erp-fiber/internal/services"

	"github.com/gofiber/fiber/v2"
)

// CompanyHandler handles company-related requests
type CompanyHandler struct {
	companyService services.CompanyServiceInterface
	userService    services.UserServiceInterface
}

// NewCompanyHandler creates a new company handler
func NewCompanyHandler(
	companyService services.CompanyServiceInterface,
	userService services.UserServiceInterface,
) *CompanyHandler {
	return &CompanyHandler{
		companyService: companyService,
		userService:    userService,
	}
}

// GetUserCompanies returns companies accessible by the user
func (h *CompanyHandler) GetUserCompanies(c *fiber.Ctx) error {
	userID := middleware.GetUserIDFromContext(c)
	if userID == 0 {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "User not authenticated",
		})
	}

	companies, err := h.companyService.GetUserCompanies(userID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error":   "Failed to retrieve companies",
			"message": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"success":   true,
		"companies": companies,
		"count":     len(companies),
	})
}

// SwitchCompanyRequest represents company switch request
type SwitchCompanyRequest struct {
	CompanyID int `json:"company_id" validate:"required"`
}

// SwitchCompany handles company switching for multi-tenant users
func (h *CompanyHandler) SwitchCompany(c *fiber.Ctx) error {
	userID := middleware.GetUserIDFromContext(c)
	if userID == 0 {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "User not authenticated",
		})
	}

	var req SwitchCompanyRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":   "Invalid request payload",
			"message": err.Error(),
		})
	}

	// Switch company and get new token
	newToken, err := h.companyService.SwitchCompany(userID, req.CompanyID)
	if err != nil {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error":   "Failed to switch company",
			"message": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"success":    true,
		"message":    "Company switched successfully",
		"token":      newToken,
		"company_id": req.CompanyID,
	})
}

// InviteUserRequest represents user invitation request
type InviteUserRequest struct {
	Email string `json:"email" validate:"required,email"`
	Role  string `json:"role" validate:"required"`
}

// InviteUser invites a user to join the company
func (h *CompanyHandler) InviteUser(c *fiber.Ctx) error {
	companyID := c.ParamsInt("id")
	if companyID == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid company ID",
		})
	}

	userID := middleware.GetUserIDFromContext(c)
	if userID == 0 {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "User not authenticated",
		})
	}

	var req InviteUserRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":   "Invalid request payload",
			"message": err.Error(),
		})
	}

	// Convert to service request type
	serviceReq := services.InviteUserRequest{
		Email: req.Email,
		Role:  req.Role,
	}

	invitation, err := h.companyService.InviteUser(companyID, userID, serviceReq)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error":   "Failed to invite user",
			"message": err.Error(),
		})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"success":    true,
		"message":    "User invitation sent successfully",
		"invitation": invitation,
	})
}

// GetCompanyUsers returns users in the company
func (h *CompanyHandler) GetCompanyUsers(c *fiber.Ctx) error {
	companyID := c.ParamsInt("id")
	if companyID == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid company ID",
		})
	}

	// Verify user has access to this company
	userID := middleware.GetUserIDFromContext(c)
	if userID == 0 {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "User not authenticated",
		})
	}

	users, err := h.companyService.GetCompanyUsers(companyID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error":   "Failed to retrieve company users",
			"message": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"users":   users,
		"count":   len(users),
	})
}

// UpdateUserRoleRequest represents user role update request
type UpdateUserRoleRequest struct {
	Role string `json:"role" validate:"required"`
}

// UpdateUserRole updates a user's role in the company
func (h *CompanyHandler) UpdateUserRole(c *fiber.Ctx) error {
	companyID := c.ParamsInt("id")
	userToUpdateID := c.ParamsInt("user_id")
	
	if companyID == 0 || userToUpdateID == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid company ID or user ID",
		})
	}

	// Verify current user has admin access to this company
	currentUserID := middleware.GetUserIDFromContext(c)
	if currentUserID == 0 {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "User not authenticated",
		})
	}

	var req UpdateUserRoleRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":   "Invalid request payload",
			"message": err.Error(),
		})
	}

	err := h.companyService.UpdateUserRole(companyID, userToUpdateID, req.Role)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error":   "Failed to update user role",
			"message": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"message": "User role updated successfully",
		"user_id": userToUpdateID,
		"new_role": req.Role,
	})
}