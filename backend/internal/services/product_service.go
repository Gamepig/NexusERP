package services

import (
	"context"
	"database/sql"
	"fmt"

	"nexus-erp/backend/internal/models"

	"github.com/jmoiron/sqlx"
)

type productService struct {
	db *sqlx.DB
}

func NewProductService(db *sqlx.DB) ProductService {
	return &productService{db: db}
}

func (s *productService) CreateProduct(ctx context.Context, req models.CreateProductRequest) (*models.Product, error) {
	query := `
		INSERT INTO products (sku, name, description, category_id, unit_of_measure, weight, dimensions, cost_price, selling_price, barcode, image_url, is_active, attributes, supplier_id, reorder_point, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, true, $12, $13, $14, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
		RETURNING id, sku, name, description, category_id, unit_of_measure, weight, dimensions, cost_price, selling_price, barcode, image_url, is_active, attributes, supplier_id, reorder_point, created_at, updated_at
	`

	var product models.Product
	var description, barcode, imageURL sql.NullString
	var categoryID, supplierID sql.NullInt64
	var weight, costPrice, sellingPrice sql.NullFloat64

	err := s.db.QueryRowContext(ctx, query, 
		req.SKU, req.Name, nullStringFromString(req.Description), req.CategoryID, req.UnitOfMeasure,
		req.Weight, req.Dimensions, req.CostPrice, req.SellingPrice,
		nullStringFromString(req.Barcode), nullStringFromString(req.ImageURL), req.Attributes,
		req.SupplierID, req.ReorderPoint).
		Scan(&product.ID, &product.SKU, &product.Name, &description, &categoryID, &product.UnitOfMeasure,
			&weight, &product.Dimensions, &costPrice, &sellingPrice, &barcode, &imageURL,
			&product.IsActive, &product.Attributes, &supplierID, &product.ReorderPoint,
			&product.CreatedAt, &product.UpdatedAt)

	if err != nil {
		return nil, fmt.Errorf("failed to create product: %v", err)
	}

	// Convert nullable fields
	product.Description = nullStringToPointer(description)
	product.CategoryID = nullInt64ToPointer(categoryID)
	product.Weight = nullFloat64ToPointer(weight)
	product.CostPrice = nullFloat64ToPointer(costPrice)
	product.SellingPrice = nullFloat64ToPointer(sellingPrice)
	product.Barcode = nullStringToPointer(barcode)
	product.ImageURL = nullStringToPointer(imageURL)
	product.SupplierID = nullInt64ToPointer(supplierID)

	return &product, nil
}

func (s *productService) GetProducts(ctx context.Context, page, limit int, search string, categoryID *int64, isActive *bool) ([]models.Product, int, error) {
	offset := (page - 1) * limit
	
	whereClause := "WHERE 1=1"
	args := []interface{}{}
	argIndex := 1

	if search != "" {
		whereClause += fmt.Sprintf(" AND (name ILIKE $%d OR sku ILIKE $%d OR description ILIKE $%d)", argIndex, argIndex, argIndex)
		args = append(args, "%"+search+"%")
		argIndex++
	}

	if categoryID != nil {
		whereClause += fmt.Sprintf(" AND category_id = $%d", argIndex)
		args = append(args, *categoryID)
		argIndex++
	}

	if isActive != nil {
		whereClause += fmt.Sprintf(" AND is_active = $%d", argIndex)
		args = append(args, *isActive)
		argIndex++
	}

	// Count total records
	countQuery := fmt.Sprintf(`
		SELECT COUNT(*) 
		FROM products 
		%s
	`, whereClause)

	var total int
	err := s.db.QueryRowContext(ctx, countQuery, args...).Scan(&total)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to count products: %v", err)
	}

	// Get products
	query := fmt.Sprintf(`
		SELECT id, sku, name, description, category_id, unit_of_measure, weight, dimensions, cost_price, selling_price, barcode, image_url, is_active, attributes, supplier_id, reorder_point, created_at, updated_at
		FROM products
		%s
		ORDER BY name
		LIMIT $%d OFFSET $%d
	`, whereClause, argIndex, argIndex+1)

	args = append(args, limit, offset)
	
	rows, err := s.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to get products: %v", err)
	}
	defer rows.Close()

	var products []models.Product
	for rows.Next() {
		var product models.Product
		var description, barcode, imageURL sql.NullString
		var categoryID, supplierID sql.NullInt64
		var weight, costPrice, sellingPrice sql.NullFloat64

		err := rows.Scan(&product.ID, &product.SKU, &product.Name, &description, &categoryID, &product.UnitOfMeasure,
			&weight, &product.Dimensions, &costPrice, &sellingPrice, &barcode, &imageURL,
			&product.IsActive, &product.Attributes, &supplierID, &product.ReorderPoint,
			&product.CreatedAt, &product.UpdatedAt)

		if err != nil {
			return nil, 0, fmt.Errorf("failed to scan product: %v", err)
		}

		// Convert nullable fields
		product.Description = nullStringToPointer(description)
		product.CategoryID = nullInt64ToPointer(categoryID)
		product.Weight = nullFloat64ToPointer(weight)
		product.CostPrice = nullFloat64ToPointer(costPrice)
		product.SellingPrice = nullFloat64ToPointer(sellingPrice)
		product.Barcode = nullStringToPointer(barcode)
		product.ImageURL = nullStringToPointer(imageURL)
		product.SupplierID = nullInt64ToPointer(supplierID)

		products = append(products, product)
	}

	return products, total, nil
}

func (s *productService) GetProduct(ctx context.Context, id int64) (*models.Product, error) {
	return s.GetProductByID(ctx, id)
}

func (s *productService) GetProductByID(ctx context.Context, id int64) (*models.Product, error) {
	query := `
		SELECT id, sku, name, description, category_id, unit_of_measure, weight, dimensions, cost_price, selling_price, barcode, image_url, is_active, attributes, supplier_id, reorder_point, created_at, updated_at
		FROM products
		WHERE id = $1
	`

	var product models.Product
	var description, barcode, imageURL sql.NullString
	var categoryID, supplierID sql.NullInt64
	var weight, costPrice, sellingPrice sql.NullFloat64

	err := s.db.QueryRowContext(ctx, query, id).
		Scan(&product.ID, &product.SKU, &product.Name, &description, &categoryID, &product.UnitOfMeasure,
			&weight, &product.Dimensions, &costPrice, &sellingPrice, &barcode, &imageURL,
			&product.IsActive, &product.Attributes, &supplierID, &product.ReorderPoint,
			&product.CreatedAt, &product.UpdatedAt)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("product not found")
		}
		return nil, fmt.Errorf("failed to get product: %v", err)
	}

	// Convert nullable fields
	product.Description = nullStringToPointer(description)
	product.CategoryID = nullInt64ToPointer(categoryID)
	product.Weight = nullFloat64ToPointer(weight)
	product.CostPrice = nullFloat64ToPointer(costPrice)
	product.SellingPrice = nullFloat64ToPointer(sellingPrice)
	product.Barcode = nullStringToPointer(barcode)
	product.ImageURL = nullStringToPointer(imageURL)
	product.SupplierID = nullInt64ToPointer(supplierID)

	return &product, nil
}

func (s *productService) UpdateProduct(ctx context.Context, id int64, req models.UpdateProductRequest) (*models.Product, error) {
	query := `
		UPDATE products
		SET sku = $1, name = $2, description = $3, category_id = $4, unit_of_measure = $5, weight = $6, dimensions = $7, cost_price = $8, selling_price = $9, barcode = $10, image_url = $11, is_active = $12, attributes = $13, supplier_id = $14, reorder_point = $15, updated_at = CURRENT_TIMESTAMP
		WHERE id = $16
		RETURNING id, sku, name, description, category_id, unit_of_measure, weight, dimensions, cost_price, selling_price, barcode, image_url, is_active, attributes, supplier_id, reorder_point, created_at, updated_at
	`

	var product models.Product
	var description, barcode, imageURL sql.NullString
	var categoryID, supplierID sql.NullInt64
	var weight, costPrice, sellingPrice sql.NullFloat64

	err := s.db.QueryRowContext(ctx, query, 
		req.SKU, req.Name, nullStringFromString(req.Description), req.CategoryID, req.UnitOfMeasure,
		req.Weight, req.Dimensions, req.CostPrice, req.SellingPrice,
		nullStringFromString(req.Barcode), nullStringFromString(req.ImageURL), req.IsActive,
		req.Attributes, req.SupplierID, req.ReorderPoint, id).
		Scan(&product.ID, &product.SKU, &product.Name, &description, &categoryID, &product.UnitOfMeasure,
			&weight, &product.Dimensions, &costPrice, &sellingPrice, &barcode, &imageURL,
			&product.IsActive, &product.Attributes, &supplierID, &product.ReorderPoint,
			&product.CreatedAt, &product.UpdatedAt)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("product not found")
		}
		return nil, fmt.Errorf("failed to update product: %v", err)
	}

	// Convert nullable fields
	product.Description = nullStringToPointer(description)
	product.CategoryID = nullInt64ToPointer(categoryID)
	product.Weight = nullFloat64ToPointer(weight)
	product.CostPrice = nullFloat64ToPointer(costPrice)
	product.SellingPrice = nullFloat64ToPointer(sellingPrice)
	product.Barcode = nullStringToPointer(barcode)
	product.ImageURL = nullStringToPointer(imageURL)
	product.SupplierID = nullInt64ToPointer(supplierID)

	return &product, nil
}

func (s *productService) DeleteProduct(ctx context.Context, id int64) error {
	query := `
		UPDATE products
		SET is_active = false, updated_at = CURRENT_TIMESTAMP
		WHERE id = $1
	`

	result, err := s.db.ExecContext(ctx, query, id)
	if err != nil {
		return fmt.Errorf("failed to delete product: %v", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %v", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("product not found")
	}

	return nil
}

func (s *productService) GetProductBySKU(ctx context.Context, sku string) (*models.Product, error) {
	query := `
		SELECT id, sku, name, description, category_id, unit_of_measure, weight, dimensions, cost_price, selling_price, barcode, image_url, is_active, attributes, supplier_id, reorder_point, created_at, updated_at
		FROM products
		WHERE sku = $1
	`

	var product models.Product
	var description, barcode, imageURL sql.NullString
	var categoryID, supplierID sql.NullInt64
	var weight, costPrice, sellingPrice sql.NullFloat64

	err := s.db.QueryRowContext(ctx, query, sku).
		Scan(&product.ID, &product.SKU, &product.Name, &description, &categoryID, &product.UnitOfMeasure,
			&weight, &product.Dimensions, &costPrice, &sellingPrice, &barcode, &imageURL,
			&product.IsActive, &product.Attributes, &supplierID, &product.ReorderPoint,
			&product.CreatedAt, &product.UpdatedAt)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("product not found")
		}
		return nil, fmt.Errorf("failed to get product: %v", err)
	}

	// Convert nullable fields
	product.Description = nullStringToPointer(description)
	product.CategoryID = nullInt64ToPointer(categoryID)
	product.Weight = nullFloat64ToPointer(weight)
	product.CostPrice = nullFloat64ToPointer(costPrice)
	product.SellingPrice = nullFloat64ToPointer(sellingPrice)
	product.Barcode = nullStringToPointer(barcode)
	product.ImageURL = nullStringToPointer(imageURL)
	product.SupplierID = nullInt64ToPointer(supplierID)

	return &product, nil
}

// Product Category methods

func (s *productService) CreateProductCategory(ctx context.Context, req models.CreateProductCategoryRequest) (*models.ProductCategory, error) {
	query := `
		INSERT INTO product_categories (name, parent_category_id, description, is_active, created_at, updated_at)
		VALUES ($1, $2, $3, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
		RETURNING id, name, parent_category_id, description, is_active, created_at, updated_at
	`

	var category models.ProductCategory
	var description sql.NullString
	var parentCategoryID sql.NullInt64

	err := s.db.QueryRowContext(ctx, query, req.Name, req.ParentCategoryID, nullStringFromString(req.Description)).
		Scan(&category.ID, &category.Name, &parentCategoryID, &description, &category.IsActive, &category.CreatedAt, &category.UpdatedAt)

	if err != nil {
		return nil, fmt.Errorf("failed to create product category: %v", err)
	}

	// Convert nullable fields
	category.ParentCategoryID = nullInt64ToPointer(parentCategoryID)
	category.Description = nullStringToPointer(description)

	return &category, nil
}

func (s *productService) GetProductCategories(ctx context.Context) ([]models.ProductCategory, error) {
	query := `
		SELECT id, name, parent_category_id, description, is_active, created_at, updated_at
		FROM product_categories
		WHERE is_active = true
		ORDER BY name
	`

	rows, err := s.db.QueryContext(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to get product categories: %v", err)
	}
	defer rows.Close()

	var categories []models.ProductCategory
	for rows.Next() {
		var category models.ProductCategory
		var description sql.NullString
		var parentCategoryID sql.NullInt64

		err := rows.Scan(&category.ID, &category.Name, &parentCategoryID, &description, &category.IsActive, &category.CreatedAt, &category.UpdatedAt)
		if err != nil {
			return nil, fmt.Errorf("failed to scan product category: %v", err)
		}

		// Convert nullable fields
		category.ParentCategoryID = nullInt64ToPointer(parentCategoryID)
		category.Description = nullStringToPointer(description)

		categories = append(categories, category)
	}

	return categories, nil
}

func (s *productService) GetProductCategoryByID(ctx context.Context, id int64) (*models.ProductCategory, error) {
	query := `
		SELECT id, name, parent_category_id, description, is_active, created_at, updated_at
		FROM product_categories
		WHERE id = $1
	`

	var category models.ProductCategory
	var description sql.NullString
	var parentCategoryID sql.NullInt64

	err := s.db.QueryRowContext(ctx, query, id).
		Scan(&category.ID, &category.Name, &parentCategoryID, &description, &category.IsActive, &category.CreatedAt, &category.UpdatedAt)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("product category not found")
		}
		return nil, fmt.Errorf("failed to get product category: %v", err)
	}

	// Convert nullable fields
	category.ParentCategoryID = nullInt64ToPointer(parentCategoryID)
	category.Description = nullStringToPointer(description)

	return &category, nil
}

func (s *productService) UpdateProductCategory(ctx context.Context, id int64, req models.UpdateProductCategoryRequest) (*models.ProductCategory, error) {
	query := `
		UPDATE product_categories
		SET name = $1, parent_category_id = $2, description = $3, is_active = $4, updated_at = CURRENT_TIMESTAMP
		WHERE id = $5
		RETURNING id, name, parent_category_id, description, is_active, created_at, updated_at
	`

	var category models.ProductCategory
	var description sql.NullString
	var parentCategoryID sql.NullInt64

	err := s.db.QueryRowContext(ctx, query, req.Name, req.ParentCategoryID, nullStringFromString(req.Description), req.IsActive, id).
		Scan(&category.ID, &category.Name, &parentCategoryID, &description, &category.IsActive, &category.CreatedAt, &category.UpdatedAt)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("product category not found")
		}
		return nil, fmt.Errorf("failed to update product category: %v", err)
	}

	// Convert nullable fields
	category.ParentCategoryID = nullInt64ToPointer(parentCategoryID)
	category.Description = nullStringToPointer(description)

	return &category, nil
}

func (s *productService) DeleteProductCategory(ctx context.Context, id int64) error {
	query := `
		UPDATE product_categories
		SET is_active = false, updated_at = CURRENT_TIMESTAMP
		WHERE id = $1
	`

	result, err := s.db.ExecContext(ctx, query, id)
	if err != nil {
		return fmt.Errorf("failed to delete product category: %v", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %v", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("product category not found")
	}

	return nil
}

