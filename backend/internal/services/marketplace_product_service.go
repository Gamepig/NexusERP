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

// MarketplaceProductService handles product listing and management
type MarketplaceProductService struct {
	db *sqlx.DB
}

// NewMarketplaceProductService creates a new marketplace product service
func NewMarketplaceProductService(db *sqlx.DB) *MarketplaceProductService {
	return &MarketplaceProductService{
		db: db,
	}
}

// ProductCreateRequest represents a product creation request
type ProductCreateRequest struct {
	SupplierID            int64                  `json:"supplier_id" validate:"required"`
	CategoryID            *int64                 `json:"category_id,omitempty"`
	InternalProductID     *int64                 `json:"internal_product_id,omitempty"`
	SKU                   *string                `json:"sku,omitempty"`
	Name                  string                 `json:"name" validate:"required,min=2,max=255"`
	ShortDescription      *string                `json:"short_description,omitempty"`
	Description           *string                `json:"description,omitempty"`
	Specifications        *string                `json:"specifications,omitempty"`
	Brand                 *string                `json:"brand,omitempty"`
	Model                 *string                `json:"model,omitempty"`
	UnitOfMeasure         *string                `json:"unit_of_measure,omitempty"`
	MinimumOrderQuantity  int                    `json:"minimum_order_quantity" validate:"min=1"`
	MaximumOrderQuantity  *int                   `json:"maximum_order_quantity,omitempty"`
	LeadTimeDays          *int                   `json:"lead_time_days,omitempty"`
	WeightKg              *float64               `json:"weight_kg,omitempty"`
	DimensionsCm          *string                `json:"dimensions_cm,omitempty"`
	OriginCountry         *string                `json:"origin_country,omitempty"`
	Certifications        *string                `json:"certifications,omitempty"`
	WarrantyInfo          *string                `json:"warranty_info,omitempty"`
	Price                 float64                `json:"price" validate:"required,min=0"`
	Currency              string                 `json:"currency" validate:"required"`
	DiscountPercentage    float64                `json:"discount_percentage" validate:"min=0,max=100"`
	PriceTier1Qty         *int                   `json:"price_tier_1_qty,omitempty"`
	PriceTier1Price       *float64               `json:"price_tier_1_price,omitempty"`
	PriceTier2Qty         *int                   `json:"price_tier_2_qty,omitempty"`
	PriceTier2Price       *float64               `json:"price_tier_2_price,omitempty"`
	PriceTier3Qty         *int                   `json:"price_tier_3_qty,omitempty"`
	PriceTier3Price       *float64               `json:"price_tier_3_price,omitempty"`
	StockQuantity         int                    `json:"stock_quantity" validate:"min=0"`
	LowStockThreshold     int                    `json:"low_stock_threshold" validate:"min=0"`
	MetaTitle             *string                `json:"meta_title,omitempty"`
	MetaDescription       *string                `json:"meta_description,omitempty"`
	Keywords              *string                `json:"keywords,omitempty"`
	IsFeatured            bool                   `json:"is_featured"`
	IsNewArrival          bool                   `json:"is_new_arrival"`
	IsBestseller          bool                   `json:"is_bestseller"`
	FeaturedUntil         *time.Time             `json:"featured_until,omitempty"`
	Images                []ProductImageRequest  `json:"images,omitempty"`
}

// ProductUpdateRequest represents a product update request
type ProductUpdateRequest struct {
	CategoryID            *int64    `json:"category_id,omitempty"`
	InternalProductID     *int64    `json:"internal_product_id,omitempty"`
	SKU                   *string   `json:"sku,omitempty"`
	Name                  *string   `json:"name,omitempty"`
	ShortDescription      *string   `json:"short_description,omitempty"`
	Description           *string   `json:"description,omitempty"`
	Specifications        *string   `json:"specifications,omitempty"`
	Brand                 *string   `json:"brand,omitempty"`
	Model                 *string   `json:"model,omitempty"`
	UnitOfMeasure         *string   `json:"unit_of_measure,omitempty"`
	MinimumOrderQuantity  *int      `json:"minimum_order_quantity,omitempty"`
	MaximumOrderQuantity  *int      `json:"maximum_order_quantity,omitempty"`
	LeadTimeDays          *int      `json:"lead_time_days,omitempty"`
	WeightKg              *float64  `json:"weight_kg,omitempty"`
	DimensionsCm          *string   `json:"dimensions_cm,omitempty"`
	OriginCountry         *string   `json:"origin_country,omitempty"`
	Certifications        *string   `json:"certifications,omitempty"`
	WarrantyInfo          *string   `json:"warranty_info,omitempty"`
	Price                 *float64  `json:"price,omitempty"`
	Currency              *string   `json:"currency,omitempty"`
	DiscountPercentage    *float64  `json:"discount_percentage,omitempty"`
	PriceTier1Qty         *int      `json:"price_tier_1_qty,omitempty"`
	PriceTier1Price       *float64  `json:"price_tier_1_price,omitempty"`
	PriceTier2Qty         *int      `json:"price_tier_2_qty,omitempty"`
	PriceTier2Price       *float64  `json:"price_tier_2_price,omitempty"`
	PriceTier3Qty         *int      `json:"price_tier_3_qty,omitempty"`
	PriceTier3Price       *float64  `json:"price_tier_3_price,omitempty"`
	StockQuantity         *int      `json:"stock_quantity,omitempty"`
	LowStockThreshold     *int      `json:"low_stock_threshold,omitempty"`
	MetaTitle             *string   `json:"meta_title,omitempty"`
	MetaDescription       *string   `json:"meta_description,omitempty"`
	Keywords              *string   `json:"keywords,omitempty"`
	IsFeatured            *bool     `json:"is_featured,omitempty"`
	IsNewArrival          *bool     `json:"is_new_arrival,omitempty"`
	IsBestseller          *bool     `json:"is_bestseller,omitempty"`
	FeaturedUntil         *time.Time `json:"featured_until,omitempty"`
}

// ProductImageRequest represents a product image request
type ProductImageRequest struct {
	ImageURL  string  `json:"image_url" validate:"required,url"`
	AltText   *string `json:"alt_text,omitempty"`
	SortOrder int     `json:"sort_order"`
	IsPrimary bool    `json:"is_primary"`
}

// ProductApprovalRequest represents a product approval/rejection request
type ProductApprovalRequest struct {
	Status          models.ProductStatus `json:"status" validate:"required"`
	RejectionReason *string              `json:"rejection_reason,omitempty"`
	ApprovedBy      int64                `json:"approved_by" validate:"required"`
}

// ProductSearchFilters represents search filters for products
type ProductSearchFilters struct {
	SupplierID      []int64                  `json:"supplier_id,omitempty"`
	CategoryID      []int64                  `json:"category_id,omitempty"`
	Status          []models.ProductStatus   `json:"status,omitempty"`
	StockStatus     []models.StockStatus     `json:"stock_status,omitempty"`
	Brand           []string                 `json:"brand,omitempty"`
	PriceMin        *float64                 `json:"price_min,omitempty"`
	PriceMax        *float64                 `json:"price_max,omitempty"`
	IsFeatured      *bool                    `json:"is_featured,omitempty"`
	IsNewArrival    *bool                    `json:"is_new_arrival,omitempty"`
	IsBestseller    *bool                    `json:"is_bestseller,omitempty"`
	Search          string                   `json:"search,omitempty"`
	SortBy          string                   `json:"sort_by,omitempty"` // name, price, created_at, view_count
	SortOrder       string                   `json:"sort_order,omitempty"` // asc, desc
	Page            int                      `json:"page"`
	PageSize        int                      `json:"page_size"`
}

// ProductSearchResult represents the result of a product search
type ProductSearchResult struct {
	Products   []*models.MarketplaceProduct `json:"products"`
	Total      int64                        `json:"total"`
	Page       int                          `json:"page"`
	PageSize   int                          `json:"page_size"`
	TotalPages int                          `json:"total_pages"`
}

// CreateProduct creates a new marketplace product
func (s *MarketplaceProductService) CreateProduct(ctx context.Context, req *ProductCreateRequest) (*models.MarketplaceProduct, error) {
	// Verify supplier exists and is approved
	supplier, err := s.getSupplierByID(ctx, req.SupplierID)
	if err != nil {
		return nil, fmt.Errorf("supplier not found: %w", err)
	}
	if supplier.Status != models.SupplierStatusApproved {
		return nil, fmt.Errorf("supplier must be approved to create products")
	}

	// Validate price tiers
	if err := s.validatePriceTiers(req.Price, req.PriceTier1Qty, req.PriceTier1Price, req.PriceTier2Qty, req.PriceTier2Price, req.PriceTier3Qty, req.PriceTier3Price); err != nil {
		return nil, err
	}

	// Check for duplicate SKU if provided
	if req.SKU != nil && *req.SKU != "" {
		exists, err := s.checkSKUExists(ctx, *req.SKU, req.SupplierID)
		if err != nil {
			return nil, fmt.Errorf("failed to check SKU: %w", err)
		}
		if exists {
			return nil, fmt.Errorf("SKU already exists for this supplier")
		}
	}

	// Generate slug from name
	slug := s.generateSlug(req.Name)

	// Determine stock status
	stockStatus := s.calculateStockStatus(req.StockQuantity, req.LowStockThreshold)

	product := &models.MarketplaceProduct{
		SupplierID:           req.SupplierID,
		CategoryID:           req.CategoryID,
		InternalProductID:    req.InternalProductID,
		SKU:                  req.SKU,
		Name:                 req.Name,
		Slug:                 slug,
		ShortDescription:     req.ShortDescription,
		Description:          req.Description,
		Specifications:       req.Specifications,
		Brand:                req.Brand,
		Model:                req.Model,
		UnitOfMeasure:        req.UnitOfMeasure,
		MinimumOrderQuantity: req.MinimumOrderQuantity,
		MaximumOrderQuantity: req.MaximumOrderQuantity,
		LeadTimeDays:         req.LeadTimeDays,
		WeightKg:             req.WeightKg,
		DimensionsCm:         req.DimensionsCm,
		OriginCountry:        req.OriginCountry,
		Certifications:       req.Certifications,
		WarrantyInfo:         req.WarrantyInfo,
		Price:                req.Price,
		Currency:             req.Currency,
		DiscountPercentage:   req.DiscountPercentage,
		PriceTier1Qty:        req.PriceTier1Qty,
		PriceTier1Price:      req.PriceTier1Price,
		PriceTier2Qty:        req.PriceTier2Qty,
		PriceTier2Price:      req.PriceTier2Price,
		PriceTier3Qty:        req.PriceTier3Qty,
		PriceTier3Price:      req.PriceTier3Price,
		StockQuantity:        req.StockQuantity,
		LowStockThreshold:    req.LowStockThreshold,
		StockStatus:          stockStatus,
		MetaTitle:            req.MetaTitle,
		MetaDescription:      req.MetaDescription,
		Keywords:             req.Keywords,
		Status:               models.ProductStatusDraft,
		IsFeatured:           req.IsFeatured,
		IsNewArrival:         req.IsNewArrival,
		IsBestseller:         req.IsBestseller,
		FeaturedUntil:        req.FeaturedUntil,
		ViewCount:            0,
		InquiryCount:         0,
		OrderCount:           0,
		CreatedAt:            time.Now(),
		UpdatedAt:            time.Now(),
	}

	// Start transaction
	tx, err := s.db.BeginTxx(ctx, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to start transaction: %w", err)
	}
	defer tx.Rollback()

	// Insert product
	query := `
		INSERT INTO marketplace_products (
			supplier_id, category_id, internal_product_id, sku, name, slug, short_description,
			description, specifications, brand, model, unit_of_measure, minimum_order_quantity,
			maximum_order_quantity, lead_time_days, weight_kg, dimensions_cm, origin_country,
			certifications, warranty_info, price, currency, discount_percentage,
			price_tier_1_qty, price_tier_1_price, price_tier_2_qty, price_tier_2_price,
			price_tier_3_qty, price_tier_3_price, stock_quantity, low_stock_threshold,
			stock_status, meta_title, meta_description, keywords, status, is_featured,
			is_new_arrival, is_bestseller, featured_until, view_count, inquiry_count,
			order_count, created_at, updated_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18,
			$19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34,
			$35, $36, $37, $38, $39, $40, $41, $42, $43, $44, $45
		) RETURNING id, created_at, updated_at`

	err = tx.QueryRowContext(ctx, query,
		product.SupplierID, product.CategoryID, product.InternalProductID, product.SKU,
		product.Name, product.Slug, product.ShortDescription, product.Description,
		product.Specifications, product.Brand, product.Model, product.UnitOfMeasure,
		product.MinimumOrderQuantity, product.MaximumOrderQuantity, product.LeadTimeDays,
		product.WeightKg, product.DimensionsCm, product.OriginCountry, product.Certifications,
		product.WarrantyInfo, product.Price, product.Currency, product.DiscountPercentage,
		product.PriceTier1Qty, product.PriceTier1Price, product.PriceTier2Qty, product.PriceTier2Price,
		product.PriceTier3Qty, product.PriceTier3Price, product.StockQuantity, product.LowStockThreshold,
		product.StockStatus, product.MetaTitle, product.MetaDescription, product.Keywords,
		product.Status, product.IsFeatured, product.IsNewArrival, product.IsBestseller,
		product.FeaturedUntil, product.ViewCount, product.InquiryCount, product.OrderCount,
		product.CreatedAt, product.UpdatedAt,
	).Scan(&product.ID, &product.CreatedAt, &product.UpdatedAt)

	if err != nil {
		return nil, fmt.Errorf("failed to create product: %w", err)
	}

	// Insert product images if provided
	if len(req.Images) > 0 {
		err = s.insertProductImages(ctx, tx, product.ID, req.Images)
		if err != nil {
			return nil, fmt.Errorf("failed to insert product images: %w", err)
		}
	}

	if err = tx.Commit(); err != nil {
		return nil, fmt.Errorf("failed to commit transaction: %w", err)
	}

	return product, nil
}

// GetProductByID retrieves a product by ID
func (s *MarketplaceProductService) GetProductByID(ctx context.Context, id int64) (*models.MarketplaceProduct, error) {
	product := &models.MarketplaceProduct{}
	query := `
		SELECT id, supplier_id, category_id, internal_product_id, sku, name, slug,
			   short_description, description, specifications, brand, model, unit_of_measure,
			   minimum_order_quantity, maximum_order_quantity, lead_time_days, weight_kg,
			   dimensions_cm, origin_country, certifications, warranty_info, price, currency,
			   discount_percentage, price_tier_1_qty, price_tier_1_price, price_tier_2_qty,
			   price_tier_2_price, price_tier_3_qty, price_tier_3_price, stock_quantity,
			   low_stock_threshold, stock_status, meta_title, meta_description, keywords,
			   status, is_featured, is_new_arrival, is_bestseller, featured_until,
			   view_count, inquiry_count, order_count, last_viewed_at, approved_date,
			   approved_by, rejection_reason, created_at, updated_at, deleted_at
		FROM marketplace_products
		WHERE id = $1 AND deleted_at IS NULL`

	err := s.db.QueryRowContext(ctx, query, id).Scan(
		&product.ID, &product.SupplierID, &product.CategoryID, &product.InternalProductID,
		&product.SKU, &product.Name, &product.Slug, &product.ShortDescription,
		&product.Description, &product.Specifications, &product.Brand, &product.Model,
		&product.UnitOfMeasure, &product.MinimumOrderQuantity, &product.MaximumOrderQuantity,
		&product.LeadTimeDays, &product.WeightKg, &product.DimensionsCm, &product.OriginCountry,
		&product.Certifications, &product.WarrantyInfo, &product.Price, &product.Currency,
		&product.DiscountPercentage, &product.PriceTier1Qty, &product.PriceTier1Price,
		&product.PriceTier2Qty, &product.PriceTier2Price, &product.PriceTier3Qty,
		&product.PriceTier3Price, &product.StockQuantity, &product.LowStockThreshold,
		&product.StockStatus, &product.MetaTitle, &product.MetaDescription, &product.Keywords,
		&product.Status, &product.IsFeatured, &product.IsNewArrival, &product.IsBestseller,
		&product.FeaturedUntil, &product.ViewCount, &product.InquiryCount, &product.OrderCount,
		&product.LastViewedAt, &product.ApprovedDate, &product.ApprovedBy, &product.RejectionReason,
		&product.CreatedAt, &product.UpdatedAt, &product.DeletedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("product not found")
		}
		return nil, fmt.Errorf("failed to get product: %w", err)
	}

	return product, nil
}

// Helper functions
func (s *MarketplaceProductService) getSupplierByID(ctx context.Context, supplierID int64) (*models.MarketplaceSupplier, error) {
	supplier := &models.MarketplaceSupplier{}
	query := `SELECT id, status FROM marketplace_suppliers WHERE id = $1 AND deleted_at IS NULL`
	err := s.db.QueryRowContext(ctx, query, supplierID).Scan(&supplier.ID, &supplier.Status)
	if err != nil {
		return nil, err
	}
	return supplier, nil
}

func (s *MarketplaceProductService) checkSKUExists(ctx context.Context, sku string, supplierID int64) (bool, error) {
	var count int
	query := `SELECT COUNT(*) FROM marketplace_products WHERE sku = $1 AND supplier_id = $2 AND deleted_at IS NULL`
	err := s.db.QueryRowContext(ctx, query, sku, supplierID).Scan(&count)
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

func (s *MarketplaceProductService) generateSlug(name string) string {
	// Improved slug generation with proper sanitization
	slug := strings.ToLower(strings.TrimSpace(name))
	slug = strings.ReplaceAll(slug, " ", "-")
	slug = strings.ReplaceAll(slug, "_", "-")
	
	// Remove special characters and keep only alphanumeric and hyphens
	var result strings.Builder
	for _, r := range slug {
		if (r >= 'a' && r <= 'z') || (r >= '0' && r <= '9') || r == '-' {
			result.WriteRune(r)
		}
	}
	
	// Remove consecutive hyphens and trim
	slug = result.String()
	for strings.Contains(slug, "--") {
		slug = strings.ReplaceAll(slug, "--", "-")
	}
	
	return strings.Trim(slug, "-")
}

func (s *MarketplaceProductService) calculateStockStatus(quantity, threshold int) models.StockStatus {
	if quantity == 0 {
		return models.StockStatusOutOfStock
	}
	if quantity <= threshold {
		return models.StockStatusLowStock
	}
	return models.StockStatusInStock
}

func (s *MarketplaceProductService) insertProductImages(ctx context.Context, tx *sqlx.Tx, productID int64, images []ProductImageRequest) error {
	for _, img := range images {
		query := `
			INSERT INTO marketplace_product_images (product_id, image_url, alt_text, sort_order, is_primary, created_at)
			VALUES ($1, $2, $3, $4, $5, $6)`
		_, err := tx.ExecContext(ctx, query, productID, img.ImageURL, img.AltText, img.SortOrder, img.IsPrimary, time.Now())
		if err != nil {
			return err
		}
	}
	return nil
}

// UpdateProduct updates an existing product
func (s *MarketplaceProductService) UpdateProduct(ctx context.Context, id int64, supplierID int64, req *ProductUpdateRequest) (*models.MarketplaceProduct, error) {
	// Verify product exists and belongs to supplier
	existing, err := s.GetProductByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if existing.SupplierID != supplierID {
		return nil, fmt.Errorf("product does not belong to supplier")
	}

	// Build dynamic update query
	setParts := []string{}
	args := []interface{}{}
	argIndex := 1

	if req.CategoryID != nil {
		setParts = append(setParts, fmt.Sprintf("category_id = $%d", argIndex))
		args = append(args, *req.CategoryID)
		argIndex++
	}

	if req.InternalProductID != nil {
		setParts = append(setParts, fmt.Sprintf("internal_product_id = $%d", argIndex))
		args = append(args, *req.InternalProductID)
		argIndex++
	}

	if req.SKU != nil {
		// Check for duplicate SKU if changed
		if existing.SKU == nil || *existing.SKU != *req.SKU {
			exists, err := s.checkSKUExists(ctx, *req.SKU, supplierID)
			if err != nil {
				return nil, fmt.Errorf("failed to check SKU: %w", err)
			}
			if exists {
				return nil, fmt.Errorf("SKU already exists for this supplier")
			}
		}
		setParts = append(setParts, fmt.Sprintf("sku = $%d", argIndex))
		args = append(args, *req.SKU)
		argIndex++
	}

	if req.Name != nil {
		setParts = append(setParts, fmt.Sprintf("name = $%d", argIndex))
		args = append(args, *req.Name)
		argIndex++
		
		// Update slug if name changed
		slug := s.generateSlug(*req.Name)
		setParts = append(setParts, fmt.Sprintf("slug = $%d", argIndex))
		args = append(args, slug)
		argIndex++
	}

	if req.ShortDescription != nil {
		setParts = append(setParts, fmt.Sprintf("short_description = $%d", argIndex))
		args = append(args, *req.ShortDescription)
		argIndex++
	}

	if req.Description != nil {
		setParts = append(setParts, fmt.Sprintf("description = $%d", argIndex))
		args = append(args, *req.Description)
		argIndex++
	}

	if req.Specifications != nil {
		setParts = append(setParts, fmt.Sprintf("specifications = $%d", argIndex))
		args = append(args, *req.Specifications)
		argIndex++
	}

	if req.Brand != nil {
		setParts = append(setParts, fmt.Sprintf("brand = $%d", argIndex))
		args = append(args, *req.Brand)
		argIndex++
	}

	if req.Model != nil {
		setParts = append(setParts, fmt.Sprintf("model = $%d", argIndex))
		args = append(args, *req.Model)
		argIndex++
	}

	if req.UnitOfMeasure != nil {
		setParts = append(setParts, fmt.Sprintf("unit_of_measure = $%d", argIndex))
		args = append(args, *req.UnitOfMeasure)
		argIndex++
	}

	if req.MinimumOrderQuantity != nil {
		setParts = append(setParts, fmt.Sprintf("minimum_order_quantity = $%d", argIndex))
		args = append(args, *req.MinimumOrderQuantity)
		argIndex++
	}

	if req.MaximumOrderQuantity != nil {
		setParts = append(setParts, fmt.Sprintf("maximum_order_quantity = $%d", argIndex))
		args = append(args, *req.MaximumOrderQuantity)
		argIndex++
	}

	if req.LeadTimeDays != nil {
		setParts = append(setParts, fmt.Sprintf("lead_time_days = $%d", argIndex))
		args = append(args, *req.LeadTimeDays)
		argIndex++
	}

	if req.WeightKg != nil {
		setParts = append(setParts, fmt.Sprintf("weight_kg = $%d", argIndex))
		args = append(args, *req.WeightKg)
		argIndex++
	}

	if req.DimensionsCm != nil {
		setParts = append(setParts, fmt.Sprintf("dimensions_cm = $%d", argIndex))
		args = append(args, *req.DimensionsCm)
		argIndex++
	}

	if req.OriginCountry != nil {
		setParts = append(setParts, fmt.Sprintf("origin_country = $%d", argIndex))
		args = append(args, *req.OriginCountry)
		argIndex++
	}

	if req.Certifications != nil {
		setParts = append(setParts, fmt.Sprintf("certifications = $%d", argIndex))
		args = append(args, *req.Certifications)
		argIndex++
	}

	if req.WarrantyInfo != nil {
		setParts = append(setParts, fmt.Sprintf("warranty_info = $%d", argIndex))
		args = append(args, *req.WarrantyInfo)
		argIndex++
	}

	if req.Price != nil {
		setParts = append(setParts, fmt.Sprintf("price = $%d", argIndex))
		args = append(args, *req.Price)
		argIndex++
	}

	if req.Currency != nil {
		setParts = append(setParts, fmt.Sprintf("currency = $%d", argIndex))
		args = append(args, *req.Currency)
		argIndex++
	}

	if req.DiscountPercentage != nil {
		setParts = append(setParts, fmt.Sprintf("discount_percentage = $%d", argIndex))
		args = append(args, *req.DiscountPercentage)
		argIndex++
	}

	// Update price tiers
	if req.PriceTier1Qty != nil {
		setParts = append(setParts, fmt.Sprintf("price_tier_1_qty = $%d", argIndex))
		args = append(args, *req.PriceTier1Qty)
		argIndex++
	}

	if req.PriceTier1Price != nil {
		setParts = append(setParts, fmt.Sprintf("price_tier_1_price = $%d", argIndex))
		args = append(args, *req.PriceTier1Price)
		argIndex++
	}

	if req.PriceTier2Qty != nil {
		setParts = append(setParts, fmt.Sprintf("price_tier_2_qty = $%d", argIndex))
		args = append(args, *req.PriceTier2Qty)
		argIndex++
	}

	if req.PriceTier2Price != nil {
		setParts = append(setParts, fmt.Sprintf("price_tier_2_price = $%d", argIndex))
		args = append(args, *req.PriceTier2Price)
		argIndex++
	}

	if req.PriceTier3Qty != nil {
		setParts = append(setParts, fmt.Sprintf("price_tier_3_qty = $%d", argIndex))
		args = append(args, *req.PriceTier3Qty)
		argIndex++
	}

	if req.PriceTier3Price != nil {
		setParts = append(setParts, fmt.Sprintf("price_tier_3_price = $%d", argIndex))
		args = append(args, *req.PriceTier3Price)
		argIndex++
	}

	// Update stock information
	stockQuantity := existing.StockQuantity
	lowStockThreshold := existing.LowStockThreshold

	if req.StockQuantity != nil {
		stockQuantity = *req.StockQuantity
		setParts = append(setParts, fmt.Sprintf("stock_quantity = $%d", argIndex))
		args = append(args, *req.StockQuantity)
		argIndex++
	}

	if req.LowStockThreshold != nil {
		lowStockThreshold = *req.LowStockThreshold
		setParts = append(setParts, fmt.Sprintf("low_stock_threshold = $%d", argIndex))
		args = append(args, *req.LowStockThreshold)
		argIndex++
	}

	// Update stock status based on new values
	if req.StockQuantity != nil || req.LowStockThreshold != nil {
		stockStatus := s.calculateStockStatus(stockQuantity, lowStockThreshold)
		setParts = append(setParts, fmt.Sprintf("stock_status = $%d", argIndex))
		args = append(args, stockStatus)
		argIndex++
	}

	if req.MetaTitle != nil {
		setParts = append(setParts, fmt.Sprintf("meta_title = $%d", argIndex))
		args = append(args, *req.MetaTitle)
		argIndex++
	}

	if req.MetaDescription != nil {
		setParts = append(setParts, fmt.Sprintf("meta_description = $%d", argIndex))
		args = append(args, *req.MetaDescription)
		argIndex++
	}

	if req.Keywords != nil {
		setParts = append(setParts, fmt.Sprintf("keywords = $%d", argIndex))
		args = append(args, *req.Keywords)
		argIndex++
	}

	if req.IsFeatured != nil {
		setParts = append(setParts, fmt.Sprintf("is_featured = $%d", argIndex))
		args = append(args, *req.IsFeatured)
		argIndex++
	}

	if req.IsNewArrival != nil {
		setParts = append(setParts, fmt.Sprintf("is_new_arrival = $%d", argIndex))
		args = append(args, *req.IsNewArrival)
		argIndex++
	}

	if req.IsBestseller != nil {
		setParts = append(setParts, fmt.Sprintf("is_bestseller = $%d", argIndex))
		args = append(args, *req.IsBestseller)
		argIndex++
	}

	if req.FeaturedUntil != nil {
		setParts = append(setParts, fmt.Sprintf("featured_until = $%d", argIndex))
		args = append(args, *req.FeaturedUntil)
		argIndex++
	}

	if len(setParts) == 0 {
		return s.GetProductByID(ctx, id)
	}

	// Add updated_at
	setParts = append(setParts, fmt.Sprintf("updated_at = $%d", argIndex))
	args = append(args, time.Now())
	argIndex++

	// Add WHERE clause
	args = append(args, id)

	query := fmt.Sprintf(`
		UPDATE marketplace_products 
		SET %s
		WHERE id = $%d AND deleted_at IS NULL`,
		strings.Join(setParts, ", "), argIndex)

	_, err = s.db.ExecContext(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to update product: %w", err)
	}

	return s.GetProductByID(ctx, id)
}

// ApproveProduct approves or rejects a product
func (s *MarketplaceProductService) ApproveProduct(ctx context.Context, id int64, req *ProductApprovalRequest) (*models.MarketplaceProduct, error) {
	query := `
		UPDATE marketplace_products 
		SET status = $1, approved_by = $2, approved_date = $3, rejection_reason = $4, updated_at = $5
		WHERE id = $6 AND deleted_at IS NULL`

	var approvedDate *time.Time
	if req.Status == models.ProductStatusApproved {
		now := time.Now()
		approvedDate = &now
	}

	_, err := s.db.ExecContext(ctx, query, req.Status, req.ApprovedBy, approvedDate, req.RejectionReason, time.Now(), id)
	if err != nil {
		return nil, fmt.Errorf("failed to update product status: %w", err)
	}

	return s.GetProductByID(ctx, id)
}

// SearchProducts searches products with filters
func (s *MarketplaceProductService) SearchProducts(ctx context.Context, filters *ProductSearchFilters) (*ProductSearchResult, error) {
	// Build WHERE clause
	whereParts := []string{"deleted_at IS NULL"}
	args := []interface{}{}
	argIndex := 1

	if len(filters.SupplierID) > 0 {
		placeholders := make([]string, len(filters.SupplierID))
		for i, supplierID := range filters.SupplierID {
			placeholders[i] = fmt.Sprintf("$%d", argIndex)
			args = append(args, supplierID)
			argIndex++
		}
		whereParts = append(whereParts, fmt.Sprintf("supplier_id IN (%s)", strings.Join(placeholders, ",")))
	}

	if len(filters.CategoryID) > 0 {
		placeholders := make([]string, len(filters.CategoryID))
		for i, categoryID := range filters.CategoryID {
			placeholders[i] = fmt.Sprintf("$%d", argIndex)
			args = append(args, categoryID)
			argIndex++
		}
		whereParts = append(whereParts, fmt.Sprintf("category_id IN (%s)", strings.Join(placeholders, ",")))
	}

	if len(filters.Status) > 0 {
		placeholders := make([]string, len(filters.Status))
		for i, status := range filters.Status {
			placeholders[i] = fmt.Sprintf("$%d", argIndex)
			args = append(args, status)
			argIndex++
		}
		whereParts = append(whereParts, fmt.Sprintf("status IN (%s)", strings.Join(placeholders, ",")))
	}

	if len(filters.StockStatus) > 0 {
		placeholders := make([]string, len(filters.StockStatus))
		for i, stockStatus := range filters.StockStatus {
			placeholders[i] = fmt.Sprintf("$%d", argIndex)
			args = append(args, stockStatus)
			argIndex++
		}
		whereParts = append(whereParts, fmt.Sprintf("stock_status IN (%s)", strings.Join(placeholders, ",")))
	}

	if len(filters.Brand) > 0 {
		placeholders := make([]string, len(filters.Brand))
		for i, brand := range filters.Brand {
			placeholders[i] = fmt.Sprintf("$%d", argIndex)
			args = append(args, brand)
			argIndex++
		}
		whereParts = append(whereParts, fmt.Sprintf("brand IN (%s)", strings.Join(placeholders, ",")))
	}

	if filters.PriceMin != nil {
		whereParts = append(whereParts, fmt.Sprintf("price >= $%d", argIndex))
		args = append(args, *filters.PriceMin)
		argIndex++
	}

	if filters.PriceMax != nil {
		whereParts = append(whereParts, fmt.Sprintf("price <= $%d", argIndex))
		args = append(args, *filters.PriceMax)
		argIndex++
	}

	if filters.IsFeatured != nil {
		whereParts = append(whereParts, fmt.Sprintf("is_featured = $%d", argIndex))
		args = append(args, *filters.IsFeatured)
		argIndex++
	}

	if filters.IsNewArrival != nil {
		whereParts = append(whereParts, fmt.Sprintf("is_new_arrival = $%d", argIndex))
		args = append(args, *filters.IsNewArrival)
		argIndex++
	}

	if filters.IsBestseller != nil {
		whereParts = append(whereParts, fmt.Sprintf("is_bestseller = $%d", argIndex))
		args = append(args, *filters.IsBestseller)
		argIndex++
	}

	if filters.Search != "" {
		searchTerm := "%" + strings.ToLower(filters.Search) + "%"
		whereParts = append(whereParts, fmt.Sprintf("(LOWER(name) LIKE $%d OR LOWER(description) LIKE $%d OR LOWER(brand) LIKE $%d OR LOWER(keywords) LIKE $%d)", argIndex, argIndex, argIndex, argIndex))
		args = append(args, searchTerm)
		argIndex++
	}

	whereClause := strings.Join(whereParts, " AND ")

	// Count total
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM marketplace_products WHERE %s", whereClause)
	var total int64
	err := s.db.QueryRowContext(ctx, countQuery, args...).Scan(&total)
	if err != nil {
		return nil, fmt.Errorf("failed to count products: %w", err)
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

	// Build ORDER BY clause
	orderBy := "created_at DESC"
	if filters.SortBy != "" {
		validSortFields := map[string]bool{
			"name":       true,
			"price":      true,
			"created_at": true,
			"view_count": true,
		}
		if validSortFields[filters.SortBy] {
			sortOrder := "DESC"
			if filters.SortOrder == "asc" {
				sortOrder = "ASC"
			}
			orderBy = fmt.Sprintf("%s %s", filters.SortBy, sortOrder)
		}
	}

	// Query products
	selectQuery := fmt.Sprintf(`
		SELECT id, supplier_id, category_id, internal_product_id, sku, name, slug,
			   short_description, description, specifications, brand, model, unit_of_measure,
			   minimum_order_quantity, maximum_order_quantity, lead_time_days, weight_kg,
			   dimensions_cm, origin_country, certifications, warranty_info, price, currency,
			   discount_percentage, price_tier_1_qty, price_tier_1_price, price_tier_2_qty,
			   price_tier_2_price, price_tier_3_qty, price_tier_3_price, stock_quantity,
			   low_stock_threshold, stock_status, meta_title, meta_description, keywords,
			   status, is_featured, is_new_arrival, is_bestseller, featured_until,
			   view_count, inquiry_count, order_count, last_viewed_at, approved_date,
			   approved_by, rejection_reason, created_at, updated_at, deleted_at
		FROM marketplace_products
		WHERE %s
		ORDER BY %s
		LIMIT $%d OFFSET $%d`, whereClause, orderBy, argIndex, argIndex+1)

	args = append(args, filters.PageSize, offset)

	rows, err := s.db.QueryContext(ctx, selectQuery, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to query products: %w", err)
	}
	defer rows.Close()

	var products []*models.MarketplaceProduct
	for rows.Next() {
		product := &models.MarketplaceProduct{}
		err := rows.Scan(
			&product.ID, &product.SupplierID, &product.CategoryID, &product.InternalProductID,
			&product.SKU, &product.Name, &product.Slug, &product.ShortDescription,
			&product.Description, &product.Specifications, &product.Brand, &product.Model,
			&product.UnitOfMeasure, &product.MinimumOrderQuantity, &product.MaximumOrderQuantity,
			&product.LeadTimeDays, &product.WeightKg, &product.DimensionsCm, &product.OriginCountry,
			&product.Certifications, &product.WarrantyInfo, &product.Price, &product.Currency,
			&product.DiscountPercentage, &product.PriceTier1Qty, &product.PriceTier1Price,
			&product.PriceTier2Qty, &product.PriceTier2Price, &product.PriceTier3Qty,
			&product.PriceTier3Price, &product.StockQuantity, &product.LowStockThreshold,
			&product.StockStatus, &product.MetaTitle, &product.MetaDescription, &product.Keywords,
			&product.Status, &product.IsFeatured, &product.IsNewArrival, &product.IsBestseller,
			&product.FeaturedUntil, &product.ViewCount, &product.InquiryCount, &product.OrderCount,
			&product.LastViewedAt, &product.ApprovedDate, &product.ApprovedBy, &product.RejectionReason,
			&product.CreatedAt, &product.UpdatedAt, &product.DeletedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan product: %w", err)
		}
		products = append(products, product)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("failed to iterate products: %w", err)
	}

	return &ProductSearchResult{
		Products:   products,
		Total:      total,
		Page:       filters.Page,
		PageSize:   filters.PageSize,
		TotalPages: totalPages,
	}, nil
}

// DeleteProduct soft deletes a product
func (s *MarketplaceProductService) DeleteProduct(ctx context.Context, id int64, supplierID int64) error {
	// Verify product belongs to supplier
	existing, err := s.GetProductByID(ctx, id)
	if err != nil {
		return err
	}
	if existing.SupplierID != supplierID {
		return fmt.Errorf("product does not belong to supplier")
	}

	query := `UPDATE marketplace_products SET deleted_at = $1, updated_at = $1 WHERE id = $2 AND deleted_at IS NULL`
	result, err := s.db.ExecContext(ctx, query, time.Now(), id)
	if err != nil {
		return fmt.Errorf("failed to delete product: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("product not found")
	}

	return nil
}

// GetProductsBySupplier retrieves products for a specific supplier
func (s *MarketplaceProductService) GetProductsBySupplier(ctx context.Context, supplierID int64, filters *ProductSearchFilters) (*ProductSearchResult, error) {
	// Override supplier filter
	filters.SupplierID = []int64{supplierID}
	return s.SearchProducts(ctx, filters)
}

// UpdateProductViewCount increments the view count for a product
func (s *MarketplaceProductService) UpdateProductViewCount(ctx context.Context, id int64) error {
	query := `UPDATE marketplace_products SET view_count = view_count + 1, last_viewed_at = $1, updated_at = $1 WHERE id = $2 AND deleted_at IS NULL`
	_, err := s.db.ExecContext(ctx, query, time.Now(), id)
	if err != nil {
		return fmt.Errorf("failed to update view count: %w", err)
	}
	return nil
}

// GetProductImages retrieves images for a product
func (s *MarketplaceProductService) GetProductImages(ctx context.Context, productID int64) ([]*models.MarketplaceProductImage, error) {
	query := `
		SELECT id, product_id, image_url, alt_text, sort_order, is_primary, created_at
		FROM marketplace_product_images
		WHERE product_id = $1
		ORDER BY sort_order ASC, created_at ASC`

	rows, err := s.db.QueryContext(ctx, query, productID)
	if err != nil {
		return nil, fmt.Errorf("failed to query product images: %w", err)
	}
	defer rows.Close()

	var images []*models.MarketplaceProductImage
	for rows.Next() {
		image := &models.MarketplaceProductImage{}
		err := rows.Scan(
			&image.ID, &image.ProductID, &image.ImageURL, &image.AltText,
			&image.SortOrder, &image.IsPrimary, &image.CreatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan product image: %w", err)
		}
		images = append(images, image)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("failed to iterate product images: %w", err)
	}

	return images, nil
}

// validatePriceTiers validates the price tier logic
func (s *MarketplaceProductService) validatePriceTiers(basePrice float64, tier1Qty *int, tier1Price *float64, tier2Qty *int, tier2Price *float64, tier3Qty *int, tier3Price *float64) error {
	if tier1Qty != nil && tier1Price != nil {
		if *tier1Qty <= 0 {
			return fmt.Errorf("price tier 1 quantity must be positive")
		}
		if *tier1Price >= basePrice {
			return fmt.Errorf("price tier 1 price must be lower than base price")
		}
	}
	
	if tier2Qty != nil && tier2Price != nil {
		if *tier2Qty <= 0 {
			return fmt.Errorf("price tier 2 quantity must be positive")
		}
		if tier1Qty != nil && *tier2Qty <= *tier1Qty {
			return fmt.Errorf("price tier 2 quantity must be greater than tier 1 quantity")
		}
		if tier1Price != nil && *tier2Price >= *tier1Price {
			return fmt.Errorf("price tier 2 price must be lower than tier 1 price")
		} else if tier1Price == nil && *tier2Price >= basePrice {
			return fmt.Errorf("price tier 2 price must be lower than base price")
		}
	}
	
	if tier3Qty != nil && tier3Price != nil {
		if *tier3Qty <= 0 {
			return fmt.Errorf("price tier 3 quantity must be positive")
		}
		if tier2Qty != nil && *tier3Qty <= *tier2Qty {
			return fmt.Errorf("price tier 3 quantity must be greater than tier 2 quantity")
		} else if tier2Qty == nil && tier1Qty != nil && *tier3Qty <= *tier1Qty {
			return fmt.Errorf("price tier 3 quantity must be greater than tier 1 quantity")
		}
		
		if tier2Price != nil && *tier3Price >= *tier2Price {
			return fmt.Errorf("price tier 3 price must be lower than tier 2 price")
		} else if tier2Price == nil && tier1Price != nil && *tier3Price >= *tier1Price {
			return fmt.Errorf("price tier 3 price must be lower than tier 1 price")
		} else if tier2Price == nil && tier1Price == nil && *tier3Price >= basePrice {
			return fmt.Errorf("price tier 3 price must be lower than base price")
		}
	}
	
	return nil
}