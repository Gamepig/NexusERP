package services

import (
	"context"
	"database/sql"
	"fmt"
	"strings"
	"time"

	"github.com/jmoiron/sqlx"
	"nexus-erp/backend/internal/models"
)

// MarketplaceSupplierService handles supplier registration and management
type MarketplaceSupplierService struct {
	db *sqlx.DB
}

// NewMarketplaceSupplierService creates a new marketplace supplier service
func NewMarketplaceSupplierService(db *sqlx.DB) *MarketplaceSupplierService {
	return &MarketplaceSupplierService{
		db: db,
	}
}

// SupplierRegistrationRequest represents a supplier registration request
type SupplierRegistrationRequest struct {
	UserID                    *int64  `json:"user_id,omitempty"`
	CompanyName               string  `json:"company_name" validate:"required,min=2,max=255"`
	BusinessRegistrationNumber *string `json:"business_registration_number,omitempty"`
	TaxID                     *string `json:"tax_id,omitempty"`
	ContactPersonName         string  `json:"contact_person_name" validate:"required,min=2,max=100"`
	ContactEmail              string  `json:"contact_email" validate:"required,email,max=255"`
	ContactPhone              *string `json:"contact_phone,omitempty"`
	BusinessAddress           *string `json:"business_address,omitempty"`
	BillingAddress            *string `json:"billing_address,omitempty"`
	WebsiteURL                *string `json:"website_url,omitempty"`
	BusinessType              *string `json:"business_type,omitempty"`
	BusinessCategory          *string `json:"business_category,omitempty"`
	Description               *string `json:"description,omitempty"`
	EstablishedYear           *int    `json:"established_year,omitempty"`
	EmployeeCountRange        *string `json:"employee_count_range,omitempty"`
	AnnualRevenueRange        *string `json:"annual_revenue_range,omitempty"`
	PaymentTerms              *string `json:"payment_terms,omitempty"`
	DeliveryCapabilities      *string `json:"delivery_capabilities,omitempty"`
	Certifications            *string `json:"certifications,omitempty"`
}

// SupplierUpdateRequest represents a supplier profile update request
type SupplierUpdateRequest struct {
	CompanyName               *string `json:"company_name,omitempty"`
	BusinessRegistrationNumber *string `json:"business_registration_number,omitempty"`
	TaxID                     *string `json:"tax_id,omitempty"`
	ContactPersonName         *string `json:"contact_person_name,omitempty"`
	ContactEmail              *string `json:"contact_email,omitempty"`
	ContactPhone              *string `json:"contact_phone,omitempty"`
	BusinessAddress           *string `json:"business_address,omitempty"`
	BillingAddress            *string `json:"billing_address,omitempty"`
	WebsiteURL                *string `json:"website_url,omitempty"`
	BusinessType              *string `json:"business_type,omitempty"`
	BusinessCategory          *string `json:"business_category,omitempty"`
	Description               *string `json:"description,omitempty"`
	EstablishedYear           *int    `json:"established_year,omitempty"`
	EmployeeCountRange        *string `json:"employee_count_range,omitempty"`
	AnnualRevenueRange        *string `json:"annual_revenue_range,omitempty"`
	PaymentTerms              *string `json:"payment_terms,omitempty"`
	DeliveryCapabilities      *string `json:"delivery_capabilities,omitempty"`
	Certifications            *string `json:"certifications,omitempty"`
	ProfileImageURL           *string `json:"profile_image_url,omitempty"`
	CoverImageURL             *string `json:"cover_image_url,omitempty"`
}

// SupplierApprovalRequest represents an approval/rejection request
type SupplierApprovalRequest struct {
	Status          models.SupplierStatus `json:"status" validate:"required"`
	RejectionReason *string               `json:"rejection_reason,omitempty"`
	ApprovedBy      int64                 `json:"approved_by" validate:"required"`
}

// SupplierSearchFilters represents search filters for suppliers
type SupplierSearchFilters struct {
	Status           []models.SupplierStatus `json:"status,omitempty"`
	BusinessType     []string                `json:"business_type,omitempty"`
	BusinessCategory []string                `json:"business_category,omitempty"`
	Search           string                  `json:"search,omitempty"`
	Page             int                     `json:"page"`
	PageSize         int                     `json:"page_size"`
}

// SupplierSearchResult represents the result of a supplier search
type SupplierSearchResult struct {
	Suppliers []*models.MarketplaceSupplier `json:"suppliers"`
	Total     int64                         `json:"total"`
	Page      int                           `json:"page"`
	PageSize  int                           `json:"page_size"`
	TotalPages int                          `json:"total_pages"`
}

// RegisterSupplier registers a new supplier
func (s *MarketplaceSupplierService) RegisterSupplier(ctx context.Context, req *SupplierRegistrationRequest) (*models.MarketplaceSupplier, error) {
	// Check if supplier already exists for this user
	if req.UserID != nil {
		existing, err := s.GetSupplierByUserID(ctx, *req.UserID)
		if err != nil && err != sql.ErrNoRows {
			return nil, fmt.Errorf("failed to check existing supplier: %w", err)
		}
		if existing != nil {
			return nil, fmt.Errorf("supplier already exists for this user")
		}
	}

	// Check for duplicate business registration number
	if req.BusinessRegistrationNumber != nil && *req.BusinessRegistrationNumber != "" {
		exists, err := s.checkBusinessRegistrationExists(ctx, *req.BusinessRegistrationNumber)
		if err != nil {
			return nil, fmt.Errorf("failed to check business registration: %w", err)
		}
		if exists {
			return nil, fmt.Errorf("business registration number already exists")
		}
	}

	supplier := &models.MarketplaceSupplier{
		UserID:                    req.UserID,
		CompanyName:               req.CompanyName,
		BusinessRegistrationNumber: req.BusinessRegistrationNumber,
		TaxID:                     req.TaxID,
		ContactPersonName:         req.ContactPersonName,
		ContactEmail:              req.ContactEmail,
		ContactPhone:              req.ContactPhone,
		BusinessAddress:           req.BusinessAddress,
		BillingAddress:            req.BillingAddress,
		WebsiteURL:                req.WebsiteURL,
		BusinessCategory:          req.BusinessCategory,
		Description:               req.Description,
		EstablishedYear:           req.EstablishedYear,
		EmployeeCountRange:        req.EmployeeCountRange,
		AnnualRevenueRange:        req.AnnualRevenueRange,
		PaymentTerms:              req.PaymentTerms,
		DeliveryCapabilities:      req.DeliveryCapabilities,
		Certifications:            req.Certifications,
		Status:                    models.SupplierStatusPending,
		CreatedAt:                 time.Now(),
		UpdatedAt:                 time.Now(),
	}

	// Convert business type string to enum
	if req.BusinessType != nil {
		businessType := models.BusinessType(*req.BusinessType)
		supplier.BusinessType = &businessType
	}

	query := `
		INSERT INTO marketplace_suppliers (
			user_id, company_name, business_registration_number, tax_id, contact_person_name,
			contact_email, contact_phone, business_address, billing_address, website_url,
			business_type, business_category, description, established_year, employee_count_range,
			annual_revenue_range, payment_terms, delivery_capabilities, certifications,
			status, created_at, updated_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22
		) RETURNING id, created_at, updated_at`

	err := s.db.QueryRowContext(ctx, query,
		supplier.UserID, supplier.CompanyName, supplier.BusinessRegistrationNumber, supplier.TaxID,
		supplier.ContactPersonName, supplier.ContactEmail, supplier.ContactPhone, supplier.BusinessAddress,
		supplier.BillingAddress, supplier.WebsiteURL, supplier.BusinessType, supplier.BusinessCategory,
		supplier.Description, supplier.EstablishedYear, supplier.EmployeeCountRange, supplier.AnnualRevenueRange,
		supplier.PaymentTerms, supplier.DeliveryCapabilities, supplier.Certifications,
		supplier.Status, supplier.CreatedAt, supplier.UpdatedAt,
	).Scan(&supplier.ID, &supplier.CreatedAt, &supplier.UpdatedAt)

	if err != nil {
		return nil, fmt.Errorf("failed to create supplier: %w", err)
	}

	return supplier, nil
}

// GetSupplierByID retrieves a supplier by ID
func (s *MarketplaceSupplierService) GetSupplierByID(ctx context.Context, id int64) (*models.MarketplaceSupplier, error) {
	supplier := &models.MarketplaceSupplier{}
	query := `
		SELECT id, user_id, company_name, business_registration_number, tax_id, contact_person_name,
			   contact_email, contact_phone, business_address, billing_address, website_url,
			   business_type, business_category, description, established_year, employee_count_range,
			   annual_revenue_range, payment_terms, delivery_capabilities, certifications,
			   profile_image_url, cover_image_url, status, approval_date, approved_by, rejection_reason,
			   last_activity_date, created_at, updated_at, deleted_at
		FROM marketplace_suppliers
		WHERE id = $1 AND deleted_at IS NULL`

	err := s.db.QueryRowContext(ctx, query, id).Scan(
		&supplier.ID, &supplier.UserID, &supplier.CompanyName, &supplier.BusinessRegistrationNumber,
		&supplier.TaxID, &supplier.ContactPersonName, &supplier.ContactEmail, &supplier.ContactPhone,
		&supplier.BusinessAddress, &supplier.BillingAddress, &supplier.WebsiteURL, &supplier.BusinessType,
		&supplier.BusinessCategory, &supplier.Description, &supplier.EstablishedYear, &supplier.EmployeeCountRange,
		&supplier.AnnualRevenueRange, &supplier.PaymentTerms, &supplier.DeliveryCapabilities, &supplier.Certifications,
		&supplier.ProfileImageURL, &supplier.CoverImageURL, &supplier.Status, &supplier.ApprovalDate,
		&supplier.ApprovedBy, &supplier.RejectionReason, &supplier.LastActivityDate, &supplier.CreatedAt,
		&supplier.UpdatedAt, &supplier.DeletedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("supplier not found")
		}
		return nil, fmt.Errorf("failed to get supplier: %w", err)
	}

	return supplier, nil
}

// GetSupplierByUserID retrieves a supplier by user ID
func (s *MarketplaceSupplierService) GetSupplierByUserID(ctx context.Context, userID int64) (*models.MarketplaceSupplier, error) {
	supplier := &models.MarketplaceSupplier{}
	query := `
		SELECT id, user_id, company_name, business_registration_number, tax_id, contact_person_name,
			   contact_email, contact_phone, business_address, billing_address, website_url,
			   business_type, business_category, description, established_year, employee_count_range,
			   annual_revenue_range, payment_terms, delivery_capabilities, certifications,
			   profile_image_url, cover_image_url, status, approval_date, approved_by, rejection_reason,
			   last_activity_date, created_at, updated_at, deleted_at
		FROM marketplace_suppliers
		WHERE user_id = $1 AND deleted_at IS NULL`

	err := s.db.QueryRowContext(ctx, query, userID).Scan(
		&supplier.ID, &supplier.UserID, &supplier.CompanyName, &supplier.BusinessRegistrationNumber,
		&supplier.TaxID, &supplier.ContactPersonName, &supplier.ContactEmail, &supplier.ContactPhone,
		&supplier.BusinessAddress, &supplier.BillingAddress, &supplier.WebsiteURL, &supplier.BusinessType,
		&supplier.BusinessCategory, &supplier.Description, &supplier.EstablishedYear, &supplier.EmployeeCountRange,
		&supplier.AnnualRevenueRange, &supplier.PaymentTerms, &supplier.DeliveryCapabilities, &supplier.Certifications,
		&supplier.ProfileImageURL, &supplier.CoverImageURL, &supplier.Status, &supplier.ApprovalDate,
		&supplier.ApprovedBy, &supplier.RejectionReason, &supplier.LastActivityDate, &supplier.CreatedAt,
		&supplier.UpdatedAt, &supplier.DeletedAt,
	)

	if err != nil {
		return nil, err
	}

	return supplier, nil
}

// UpdateSupplier updates a supplier's profile
func (s *MarketplaceSupplierService) UpdateSupplier(ctx context.Context, id int64, req *SupplierUpdateRequest) (*models.MarketplaceSupplier, error) {
	// Build dynamic update query
	setParts := []string{}
	args := []interface{}{}
	argIndex := 1

	if req.CompanyName != nil {
		setParts = append(setParts, fmt.Sprintf("company_name = $%d", argIndex))
		args = append(args, *req.CompanyName)
		argIndex++
	}

	if req.BusinessRegistrationNumber != nil {
		setParts = append(setParts, fmt.Sprintf("business_registration_number = $%d", argIndex))
		args = append(args, *req.BusinessRegistrationNumber)
		argIndex++
	}

	if req.TaxID != nil {
		setParts = append(setParts, fmt.Sprintf("tax_id = $%d", argIndex))
		args = append(args, *req.TaxID)
		argIndex++
	}

	if req.ContactPersonName != nil {
		setParts = append(setParts, fmt.Sprintf("contact_person_name = $%d", argIndex))
		args = append(args, *req.ContactPersonName)
		argIndex++
	}

	if req.ContactEmail != nil {
		setParts = append(setParts, fmt.Sprintf("contact_email = $%d", argIndex))
		args = append(args, *req.ContactEmail)
		argIndex++
	}

	if req.ContactPhone != nil {
		setParts = append(setParts, fmt.Sprintf("contact_phone = $%d", argIndex))
		args = append(args, *req.ContactPhone)
		argIndex++
	}

	if req.BusinessAddress != nil {
		setParts = append(setParts, fmt.Sprintf("business_address = $%d", argIndex))
		args = append(args, *req.BusinessAddress)
		argIndex++
	}

	if req.BillingAddress != nil {
		setParts = append(setParts, fmt.Sprintf("billing_address = $%d", argIndex))
		args = append(args, *req.BillingAddress)
		argIndex++
	}

	if req.WebsiteURL != nil {
		setParts = append(setParts, fmt.Sprintf("website_url = $%d", argIndex))
		args = append(args, *req.WebsiteURL)
		argIndex++
	}

	if req.BusinessType != nil {
		setParts = append(setParts, fmt.Sprintf("business_type = $%d", argIndex))
		args = append(args, *req.BusinessType)
		argIndex++
	}

	if req.BusinessCategory != nil {
		setParts = append(setParts, fmt.Sprintf("business_category = $%d", argIndex))
		args = append(args, *req.BusinessCategory)
		argIndex++
	}

	if req.Description != nil {
		setParts = append(setParts, fmt.Sprintf("description = $%d", argIndex))
		args = append(args, *req.Description)
		argIndex++
	}

	if req.EstablishedYear != nil {
		setParts = append(setParts, fmt.Sprintf("established_year = $%d", argIndex))
		args = append(args, *req.EstablishedYear)
		argIndex++
	}

	if req.EmployeeCountRange != nil {
		setParts = append(setParts, fmt.Sprintf("employee_count_range = $%d", argIndex))
		args = append(args, *req.EmployeeCountRange)
		argIndex++
	}

	if req.AnnualRevenueRange != nil {
		setParts = append(setParts, fmt.Sprintf("annual_revenue_range = $%d", argIndex))
		args = append(args, *req.AnnualRevenueRange)
		argIndex++
	}

	if req.PaymentTerms != nil {
		setParts = append(setParts, fmt.Sprintf("payment_terms = $%d", argIndex))
		args = append(args, *req.PaymentTerms)
		argIndex++
	}

	if req.DeliveryCapabilities != nil {
		setParts = append(setParts, fmt.Sprintf("delivery_capabilities = $%d", argIndex))
		args = append(args, *req.DeliveryCapabilities)
		argIndex++
	}

	if req.Certifications != nil {
		setParts = append(setParts, fmt.Sprintf("certifications = $%d", argIndex))
		args = append(args, *req.Certifications)
		argIndex++
	}

	if req.ProfileImageURL != nil {
		setParts = append(setParts, fmt.Sprintf("profile_image_url = $%d", argIndex))
		args = append(args, *req.ProfileImageURL)
		argIndex++
	}

	if req.CoverImageURL != nil {
		setParts = append(setParts, fmt.Sprintf("cover_image_url = $%d", argIndex))
		args = append(args, *req.CoverImageURL)
		argIndex++
	}

	if len(setParts) == 0 {
		return s.GetSupplierByID(ctx, id)
	}

	// Add updated_at
	setParts = append(setParts, fmt.Sprintf("updated_at = $%d", argIndex))
	args = append(args, time.Now())
	argIndex++

	// Add WHERE clause
	args = append(args, id)

	query := fmt.Sprintf(`
		UPDATE marketplace_suppliers 
		SET %s
		WHERE id = $%d AND deleted_at IS NULL`,
		strings.Join(setParts, ", "), argIndex)

	_, err := s.db.ExecContext(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to update supplier: %w", err)
	}

	return s.GetSupplierByID(ctx, id)
}

// ApproveSupplier approves or rejects a supplier
func (s *MarketplaceSupplierService) ApproveSupplier(ctx context.Context, id int64, req *SupplierApprovalRequest) (*models.MarketplaceSupplier, error) {
	query := `
		UPDATE marketplace_suppliers 
		SET status = $1, approved_by = $2, approval_date = $3, rejection_reason = $4, updated_at = $5
		WHERE id = $6 AND deleted_at IS NULL`

	var approvalDate *time.Time
	if req.Status == models.SupplierStatusApproved {
		now := time.Now()
		approvalDate = &now
	}

	_, err := s.db.ExecContext(ctx, query, req.Status, req.ApprovedBy, approvalDate, req.RejectionReason, time.Now(), id)
	if err != nil {
		return nil, fmt.Errorf("failed to update supplier status: %w", err)
	}

	return s.GetSupplierByID(ctx, id)
}

// SearchSuppliers searches suppliers with filters
func (s *MarketplaceSupplierService) SearchSuppliers(ctx context.Context, filters *SupplierSearchFilters) (*SupplierSearchResult, error) {
	// Build WHERE clause
	whereParts := []string{"deleted_at IS NULL"}
	args := []interface{}{}
	argIndex := 1

	if len(filters.Status) > 0 {
		placeholders := make([]string, len(filters.Status))
		for i, status := range filters.Status {
			placeholders[i] = fmt.Sprintf("$%d", argIndex)
			args = append(args, status)
			argIndex++
		}
		whereParts = append(whereParts, fmt.Sprintf("status IN (%s)", strings.Join(placeholders, ",")))
	}

	if len(filters.BusinessType) > 0 {
		placeholders := make([]string, len(filters.BusinessType))
		for i, businessType := range filters.BusinessType {
			placeholders[i] = fmt.Sprintf("$%d", argIndex)
			args = append(args, businessType)
			argIndex++
		}
		whereParts = append(whereParts, fmt.Sprintf("business_type IN (%s)", strings.Join(placeholders, ",")))
	}

	if len(filters.BusinessCategory) > 0 {
		placeholders := make([]string, len(filters.BusinessCategory))
		for i, category := range filters.BusinessCategory {
			placeholders[i] = fmt.Sprintf("$%d", argIndex)
			args = append(args, category)
			argIndex++
		}
		whereParts = append(whereParts, fmt.Sprintf("business_category IN (%s)", strings.Join(placeholders, ",")))
	}

	if filters.Search != "" {
		searchTerm := "%" + strings.ToLower(filters.Search) + "%"
		whereParts = append(whereParts, fmt.Sprintf("(LOWER(company_name) LIKE $%d OR LOWER(contact_person_name) LIKE $%d OR LOWER(contact_email) LIKE $%d)", argIndex, argIndex, argIndex))
		args = append(args, searchTerm)
		argIndex++
	}

	whereClause := strings.Join(whereParts, " AND ")

	// Count total
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM marketplace_suppliers WHERE %s", whereClause)
	var total int64
	err := s.db.QueryRowContext(ctx, countQuery, args...).Scan(&total)
	if err != nil {
		return nil, fmt.Errorf("failed to count suppliers: %w", err)
	}

	// Calculate pagination
	if filters.PageSize <= 0 {
		filters.PageSize = 20
	}
	if filters.Page <= 0 {
		filters.Page = 1
	}

	offset := (filters.Page - 1) * filters.PageSize
	totalPages := int((total + int64(filters.PageSize) - 1) / int64(filters.PageSize))

	// Query suppliers
	selectQuery := fmt.Sprintf(`
		SELECT id, user_id, company_name, business_registration_number, tax_id, contact_person_name,
			   contact_email, contact_phone, business_address, billing_address, website_url,
			   business_type, business_category, description, established_year, employee_count_range,
			   annual_revenue_range, payment_terms, delivery_capabilities, certifications,
			   profile_image_url, cover_image_url, status, approval_date, approved_by, rejection_reason,
			   last_activity_date, created_at, updated_at, deleted_at
		FROM marketplace_suppliers
		WHERE %s
		ORDER BY created_at DESC
		LIMIT $%d OFFSET $%d`, whereClause, argIndex, argIndex+1)

	args = append(args, filters.PageSize, offset)

	rows, err := s.db.QueryContext(ctx, selectQuery, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to query suppliers: %w", err)
	}
	defer rows.Close()

	var suppliers []*models.MarketplaceSupplier
	for rows.Next() {
		supplier := &models.MarketplaceSupplier{}
		err := rows.Scan(
			&supplier.ID, &supplier.UserID, &supplier.CompanyName, &supplier.BusinessRegistrationNumber,
			&supplier.TaxID, &supplier.ContactPersonName, &supplier.ContactEmail, &supplier.ContactPhone,
			&supplier.BusinessAddress, &supplier.BillingAddress, &supplier.WebsiteURL, &supplier.BusinessType,
			&supplier.BusinessCategory, &supplier.Description, &supplier.EstablishedYear, &supplier.EmployeeCountRange,
			&supplier.AnnualRevenueRange, &supplier.PaymentTerms, &supplier.DeliveryCapabilities, &supplier.Certifications,
			&supplier.ProfileImageURL, &supplier.CoverImageURL, &supplier.Status, &supplier.ApprovalDate,
			&supplier.ApprovedBy, &supplier.RejectionReason, &supplier.LastActivityDate, &supplier.CreatedAt,
			&supplier.UpdatedAt, &supplier.DeletedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan supplier: %w", err)
		}
		suppliers = append(suppliers, supplier)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("failed to iterate suppliers: %w", err)
	}

	return &SupplierSearchResult{
		Suppliers:  suppliers,
		Total:      total,
		Page:       filters.Page,
		PageSize:   filters.PageSize,
		TotalPages: totalPages,
	}, nil
}

// DeleteSupplier soft deletes a supplier
func (s *MarketplaceSupplierService) DeleteSupplier(ctx context.Context, id int64) error {
	query := `UPDATE marketplace_suppliers SET deleted_at = $1, updated_at = $1 WHERE id = $2 AND deleted_at IS NULL`
	result, err := s.db.ExecContext(ctx, query, time.Now(), id)
	if err != nil {
		return fmt.Errorf("failed to delete supplier: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("supplier not found")
	}

	return nil
}

// checkBusinessRegistrationExists checks if a business registration number already exists
func (s *MarketplaceSupplierService) checkBusinessRegistrationExists(ctx context.Context, businessRegNumber string) (bool, error) {
	var count int
	query := `SELECT COUNT(*) FROM marketplace_suppliers WHERE business_registration_number = $1 AND deleted_at IS NULL`
	err := s.db.QueryRowContext(ctx, query, businessRegNumber).Scan(&count)
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

// UpdateLastActivity updates the last activity date for a supplier
func (s *MarketplaceSupplierService) UpdateLastActivity(ctx context.Context, supplierID int64) error {
	query := `UPDATE marketplace_suppliers SET last_activity_date = $1, updated_at = $1 WHERE id = $2 AND deleted_at IS NULL`
	_, err := s.db.ExecContext(ctx, query, time.Now(), supplierID)
	if err != nil {
		return fmt.Errorf("failed to update last activity: %w", err)
	}
	return nil
}

// GetSupplierStatistics returns supplier statistics
func (s *MarketplaceSupplierService) GetSupplierStatistics(ctx context.Context) (map[string]int64, error) {
	query := `
		SELECT 
			status,
			COUNT(*) as count
		FROM marketplace_suppliers 
		WHERE deleted_at IS NULL 
		GROUP BY status`

	rows, err := s.db.QueryContext(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to get supplier statistics: %w", err)
	}
	defer rows.Close()

	stats := make(map[string]int64)
	for rows.Next() {
		var status string
		var count int64
		if err := rows.Scan(&status, &count); err != nil {
			return nil, fmt.Errorf("failed to scan statistics: %w", err)
		}
		stats[status] = count
	}

	return stats, nil
}