package services

import (
	"context"
	"database/sql"
	"fmt"

	"nexus-erp/backend/internal/models"

	"github.com/jmoiron/sqlx"
)

type inventoryService struct {
	db *sqlx.DB
}

func NewInventoryService(db *sqlx.DB) InventoryService {
	return &inventoryService{db: db}
}

func (s *inventoryService) CreateInventoryTransaction(ctx context.Context, req models.CreateInventoryTransactionRequest, userID int64) (*models.InventoryTransactionWithDetails, error) {
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to begin transaction: %v", err)
	}
	defer tx.Rollback()

	// Get current inventory level
	currentLevel, err := s.getCurrentInventoryLevel(ctx, tx, req.ProductID, req.WarehouseID)
	if err != nil {
		return nil, fmt.Errorf("failed to get current inventory level: %v", err)
	}

	quantityBefore := currentLevel
	quantityAfter := quantityBefore + req.QuantityChanged
	totalCost := float64(req.QuantityChanged) * *req.UnitCost

	// Create inventory transaction
	transactionQuery := `
		INSERT INTO inventory_transactions (transaction_type_id, product_id, warehouse_id, quantity_changed, quantity_before, quantity_after, unit_cost, total_cost, reference_document_type, reference_document_id, user_id, notes, batch_number, expiry_date)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
		RETURNING id, transaction_type_id, product_id, warehouse_id, quantity_changed, quantity_before, quantity_after, unit_cost, total_cost, transaction_date, reference_document_type, reference_document_id, user_id, notes, batch_number, expiry_date, created_at
	`

	var transaction models.InventoryTransaction
	var referenceDocumentType, notes, batchNumber sql.NullString
	var referenceDocumentID, transactionUserID sql.NullInt64
	var expiryDate sql.NullTime

	err = tx.QueryRowContext(ctx, transactionQuery, req.TransactionTypeID, req.ProductID, req.WarehouseID, req.QuantityChanged, quantityBefore, quantityAfter, req.UnitCost, &totalCost, req.ReferenceDocumentType, req.ReferenceDocumentID, userID, nullStringFromString(req.Notes), nullStringFromString(req.BatchNumber), req.ExpiryDate).
		Scan(&transaction.ID, &transaction.TransactionTypeID, &transaction.ProductID, &transaction.WarehouseID, &transaction.QuantityChanged, &transaction.QuantityBefore, &transaction.QuantityAfter, &transaction.UnitCost, &transaction.TotalCost, &transaction.TransactionDate, &referenceDocumentType, &referenceDocumentID, &transactionUserID, &notes, &batchNumber, &expiryDate, &transaction.CreatedAt)

	if err != nil {
		return nil, fmt.Errorf("failed to create inventory transaction: %v", err)
	}

	// Convert nullable fields
	transaction.ReferenceDocumentType = nullStringToPointer(referenceDocumentType)
	transaction.ReferenceDocumentID = nullInt64ToPointer(referenceDocumentID)
	transaction.UserID = nullInt64ToPointer(transactionUserID)
	transaction.Notes = nullStringToPointer(notes)
	transaction.BatchNumber = nullStringToPointer(batchNumber)
	transaction.ExpiryDate = nullTimeToPointer(expiryDate)

	// Update inventory level
	err = s.updateInventoryLevelInTransaction(ctx, tx, req.ProductID, req.WarehouseID, quantityAfter)
	if err != nil {
		return nil, fmt.Errorf("failed to update inventory level: %v", err)
	}

	// Commit transaction
	if err = tx.Commit(); err != nil {
		return nil, fmt.Errorf("failed to commit transaction: %v", err)
	}

	// Return transaction with details
	return s.GetInventoryTransaction(ctx, transaction.ID)
}

func (s *inventoryService) GetInventoryTransactions(ctx context.Context, page, limit int, productID *int64, warehouseID *int64, transactionTypeID *int64) ([]models.InventoryTransactionWithDetails, int, error) {
	offset := (page - 1) * limit
	
	whereClause := "WHERE 1=1"
	args := []interface{}{}
	argIndex := 1

	if productID != nil {
		whereClause += fmt.Sprintf(" AND it.product_id = $%d", argIndex)
		args = append(args, *productID)
		argIndex++
	}

	if warehouseID != nil {
		whereClause += fmt.Sprintf(" AND it.warehouse_id = $%d", argIndex)
		args = append(args, *warehouseID)
		argIndex++
	}

	if transactionTypeID != nil {
		whereClause += fmt.Sprintf(" AND it.transaction_type_id = $%d", argIndex)
		args = append(args, *transactionTypeID)
		argIndex++
	}

	// Count total records
	countQuery := fmt.Sprintf(`
		SELECT COUNT(*) 
		FROM inventory_transactions it 
		%s
	`, whereClause)

	var total int
	err := s.db.QueryRowContext(ctx, countQuery, args...).Scan(&total)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to count inventory transactions: %v", err)
	}

	// Get inventory transactions
	query := fmt.Sprintf(`
		SELECT it.id, it.transaction_type_id, it.product_id, it.warehouse_id, it.quantity_changed, it.quantity_before, it.quantity_after, it.unit_cost, it.total_cost, it.transaction_date, it.reference_document_type, it.reference_document_id, it.user_id, it.notes, it.batch_number, it.expiry_date, it.created_at,
			   itt.id, itt.name, itt.description, itt.is_inbound, itt.created_at,
			   p.id, p.sku, p.name, p.description, p.category_id, p.unit_of_measure, p.weight, p.dimensions, p.cost_price, p.selling_price, p.barcode, p.image_url, p.is_active, p.attributes, p.supplier_id, p.reorder_point, p.created_at, p.updated_at,
			   w.id, w.name, w.code, w.address, w.contact_info, w.is_active, w.created_at, w.updated_at
		FROM inventory_transactions it
		LEFT JOIN inventory_transaction_types itt ON it.transaction_type_id = itt.id
		LEFT JOIN products p ON it.product_id = p.id
		LEFT JOIN warehouses w ON it.warehouse_id = w.id
		%s
		ORDER BY it.transaction_date DESC
		LIMIT $%d OFFSET $%d
	`, whereClause, argIndex, argIndex+1)

	args = append(args, limit, offset)
	
	rows, err := s.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to get inventory transactions: %v", err)
	}
	defer rows.Close()

	var transactions []models.InventoryTransactionWithDetails
	for rows.Next() {
		var transaction models.InventoryTransactionWithDetails
		var referenceDocumentType, notes, batchNumber sql.NullString
		var referenceDocumentID, transactionUserID sql.NullInt64
		var expiryDate sql.NullTime

		// Transaction type fields
		var transactionType models.InventoryTransactionType
		var ttDescription sql.NullString

		// Product fields
		var product models.Product
		var productDescription, productBarcode, productImageURL sql.NullString
		var productCategoryID, productSupplierID sql.NullInt64
		var productWeight, productCostPrice, productSellingPrice sql.NullFloat64

		// Warehouse fields
		var warehouse models.Warehouse

		err := rows.Scan(&transaction.ID, &transaction.TransactionTypeID, &transaction.ProductID, &transaction.WarehouseID, &transaction.QuantityChanged, &transaction.QuantityBefore, &transaction.QuantityAfter, &transaction.UnitCost, &transaction.TotalCost, &transaction.TransactionDate, &referenceDocumentType, &referenceDocumentID, &transactionUserID, &notes, &batchNumber, &expiryDate, &transaction.CreatedAt,
			&transactionType.ID, &transactionType.Name, &ttDescription, &transactionType.IsInbound, &transactionType.CreatedAt,
			&product.ID, &product.SKU, &product.Name, &productDescription, &productCategoryID, &product.UnitOfMeasure, &productWeight, &product.Dimensions, &productCostPrice, &productSellingPrice, &productBarcode, &productImageURL, &product.IsActive, &product.Attributes, &productSupplierID, &product.ReorderPoint, &product.CreatedAt, &product.UpdatedAt,
			&warehouse.ID, &warehouse.Name, &warehouse.Code, &warehouse.Address, &warehouse.ContactInfo, &warehouse.IsActive, &warehouse.CreatedAt, &warehouse.UpdatedAt)

		if err != nil {
			return nil, 0, fmt.Errorf("failed to scan inventory transaction: %v", err)
		}

		// Convert nullable fields
		transaction.ReferenceDocumentType = nullStringToPointer(referenceDocumentType)
		transaction.ReferenceDocumentID = nullInt64ToPointer(referenceDocumentID)
		transaction.UserID = nullInt64ToPointer(transactionUserID)
		transaction.Notes = nullStringToPointer(notes)
		transaction.BatchNumber = nullStringToPointer(batchNumber)
		transaction.ExpiryDate = nullTimeToPointer(expiryDate)

		// Convert transaction type nullable fields
		transactionType.Description = nullStringToPointer(ttDescription)

		// Convert product nullable fields
		product.Description = nullStringToPointer(productDescription)
		product.CategoryID = nullInt64ToPointer(productCategoryID)
		product.Weight = nullFloat64ToPointer(productWeight)
		product.CostPrice = nullFloat64ToPointer(productCostPrice)
		product.SellingPrice = nullFloat64ToPointer(productSellingPrice)
		product.Barcode = nullStringToPointer(productBarcode)
		product.ImageURL = nullStringToPointer(productImageURL)
		product.SupplierID = nullInt64ToPointer(productSupplierID)

		transaction.TransactionType = &transactionType
		transaction.Product = &product
		transaction.Warehouse = &warehouse

		transactions = append(transactions, transaction)
	}

	return transactions, total, nil
}

func (s *inventoryService) GetInventoryTransaction(ctx context.Context, id int64) (*models.InventoryTransactionWithDetails, error) {
	query := `
		SELECT it.id, it.transaction_type_id, it.product_id, it.warehouse_id, it.quantity_changed, it.quantity_before, it.quantity_after, it.unit_cost, it.total_cost, it.transaction_date, it.reference_document_type, it.reference_document_id, it.user_id, it.notes, it.batch_number, it.expiry_date, it.created_at,
			   itt.id, itt.name, itt.description, itt.is_inbound, itt.created_at,
			   p.id, p.sku, p.name, p.description, p.category_id, p.unit_of_measure, p.weight, p.dimensions, p.cost_price, p.selling_price, p.barcode, p.image_url, p.is_active, p.attributes, p.supplier_id, p.reorder_point, p.created_at, p.updated_at,
			   w.id, w.name, w.code, w.address, w.contact_info, w.is_active, w.created_at, w.updated_at
		FROM inventory_transactions it
		LEFT JOIN inventory_transaction_types itt ON it.transaction_type_id = itt.id
		LEFT JOIN products p ON it.product_id = p.id
		LEFT JOIN warehouses w ON it.warehouse_id = w.id
		WHERE it.id = $1
	`

	var transaction models.InventoryTransactionWithDetails
	var referenceDocumentType, notes, batchNumber sql.NullString
	var referenceDocumentID, transactionUserID sql.NullInt64
	var expiryDate sql.NullTime

	// Transaction type fields
	var transactionType models.InventoryTransactionType
	var ttDescription sql.NullString

	// Product fields
	var product models.Product
	var productDescription, productBarcode, productImageURL sql.NullString
	var productCategoryID, productSupplierID sql.NullInt64
	var productWeight, productCostPrice, productSellingPrice sql.NullFloat64

	// Warehouse fields
	var warehouse models.Warehouse

	err := s.db.QueryRowContext(ctx, query, id).
		Scan(&transaction.ID, &transaction.TransactionTypeID, &transaction.ProductID, &transaction.WarehouseID, &transaction.QuantityChanged, &transaction.QuantityBefore, &transaction.QuantityAfter, &transaction.UnitCost, &transaction.TotalCost, &transaction.TransactionDate, &referenceDocumentType, &referenceDocumentID, &transactionUserID, &notes, &batchNumber, &expiryDate, &transaction.CreatedAt,
			&transactionType.ID, &transactionType.Name, &ttDescription, &transactionType.IsInbound, &transactionType.CreatedAt,
			&product.ID, &product.SKU, &product.Name, &productDescription, &productCategoryID, &product.UnitOfMeasure, &productWeight, &product.Dimensions, &productCostPrice, &productSellingPrice, &productBarcode, &productImageURL, &product.IsActive, &product.Attributes, &productSupplierID, &product.ReorderPoint, &product.CreatedAt, &product.UpdatedAt,
			&warehouse.ID, &warehouse.Name, &warehouse.Code, &warehouse.Address, &warehouse.ContactInfo, &warehouse.IsActive, &warehouse.CreatedAt, &warehouse.UpdatedAt)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("inventory transaction not found")
		}
		return nil, fmt.Errorf("failed to get inventory transaction: %v", err)
	}

	// Convert nullable fields
	transaction.ReferenceDocumentType = nullStringToPointer(referenceDocumentType)
	transaction.ReferenceDocumentID = nullInt64ToPointer(referenceDocumentID)
	transaction.UserID = nullInt64ToPointer(transactionUserID)
	transaction.Notes = nullStringToPointer(notes)
	transaction.BatchNumber = nullStringToPointer(batchNumber)
	transaction.ExpiryDate = nullTimeToPointer(expiryDate)

	// Convert transaction type nullable fields
	transactionType.Description = nullStringToPointer(ttDescription)

	// Convert product nullable fields
	product.Description = nullStringToPointer(productDescription)
	product.CategoryID = nullInt64ToPointer(productCategoryID)
	product.Weight = nullFloat64ToPointer(productWeight)
	product.CostPrice = nullFloat64ToPointer(productCostPrice)
	product.SellingPrice = nullFloat64ToPointer(productSellingPrice)
	product.Barcode = nullStringToPointer(productBarcode)
	product.ImageURL = nullStringToPointer(productImageURL)
	product.SupplierID = nullInt64ToPointer(productSupplierID)

	transaction.TransactionType = &transactionType
	transaction.Product = &product
	transaction.Warehouse = &warehouse

	return &transaction, nil
}

func (s *inventoryService) GetInventoryLevels(ctx context.Context, page, limit int, productID *int64, warehouseID *int64, lowStock *bool) ([]models.InventoryLevelWithDetails, int, error) {
	offset := (page - 1) * limit
	
	whereClause := "WHERE 1=1"
	args := []interface{}{}
	argIndex := 1

	if productID != nil {
		whereClause += fmt.Sprintf(" AND il.product_id = $%d", argIndex)
		args = append(args, *productID)
		argIndex++
	}

	if warehouseID != nil {
		whereClause += fmt.Sprintf(" AND il.warehouse_id = $%d", argIndex)
		args = append(args, *warehouseID)
		argIndex++
	}

	if lowStock != nil && *lowStock {
		whereClause += " AND il.quantity_on_hand <= il.reorder_point"
	}

	// Count total records
	countQuery := fmt.Sprintf(`
		SELECT COUNT(*) 
		FROM inventory_levels il 
		%s
	`, whereClause)

	var total int
	err := s.db.QueryRowContext(ctx, countQuery, args...).Scan(&total)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to count inventory levels: %v", err)
	}

	// Get inventory levels
	query := fmt.Sprintf(`
		SELECT il.product_id, il.warehouse_id, il.quantity_on_hand, il.quantity_available, il.quantity_reserved, il.quantity_on_order, il.reorder_point, il.max_stock_level, il.last_updated_at, il.created_at, il.updated_at,
			   p.id, p.sku, p.name, p.description, p.category_id, p.unit_of_measure, p.weight, p.dimensions, p.cost_price, p.selling_price, p.barcode, p.image_url, p.is_active, p.attributes, p.supplier_id, p.reorder_point, p.created_at, p.updated_at,
			   w.id, w.name, w.code, w.address, w.contact_info, w.is_active, w.created_at, w.updated_at
		FROM inventory_levels il
		LEFT JOIN products p ON il.product_id = p.id
		LEFT JOIN warehouses w ON il.warehouse_id = w.id
		%s
		ORDER BY il.last_updated_at DESC
		LIMIT $%d OFFSET $%d
	`, whereClause, argIndex, argIndex+1)

	args = append(args, limit, offset)
	
	rows, err := s.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to get inventory levels: %v", err)
	}
	defer rows.Close()

	var levels []models.InventoryLevelWithDetails
	for rows.Next() {
		var level models.InventoryLevelWithDetails
		var maxStockLevel sql.NullInt64

		// Product fields
		var product models.Product
		var productDescription, productBarcode, productImageURL sql.NullString
		var productCategoryID, productSupplierID sql.NullInt64
		var productWeight, productCostPrice, productSellingPrice sql.NullFloat64

		// Warehouse fields
		var warehouse models.Warehouse

		err := rows.Scan(&level.ProductID, &level.WarehouseID, &level.QuantityOnHand, &level.QuantityAvailable, &level.QuantityReserved, &level.QuantityOnOrder, &level.ReorderPoint, &maxStockLevel, &level.LastUpdatedAt, &level.CreatedAt, &level.UpdatedAt,
			&product.ID, &product.SKU, &product.Name, &productDescription, &productCategoryID, &product.UnitOfMeasure, &productWeight, &product.Dimensions, &productCostPrice, &productSellingPrice, &productBarcode, &productImageURL, &product.IsActive, &product.Attributes, &productSupplierID, &product.ReorderPoint, &product.CreatedAt, &product.UpdatedAt,
			&warehouse.ID, &warehouse.Name, &warehouse.Code, &warehouse.Address, &warehouse.ContactInfo, &warehouse.IsActive, &warehouse.CreatedAt, &warehouse.UpdatedAt)

		if err != nil {
			return nil, 0, fmt.Errorf("failed to scan inventory level: %v", err)
		}

		// Convert nullable fields
		level.MaxStockLevel = nullInt64ToIntPointer(maxStockLevel)

		// Convert product nullable fields
		product.Description = nullStringToPointer(productDescription)
		product.CategoryID = nullInt64ToPointer(productCategoryID)
		product.Weight = nullFloat64ToPointer(productWeight)
		product.CostPrice = nullFloat64ToPointer(productCostPrice)
		product.SellingPrice = nullFloat64ToPointer(productSellingPrice)
		product.Barcode = nullStringToPointer(productBarcode)
		product.ImageURL = nullStringToPointer(productImageURL)
		product.SupplierID = nullInt64ToPointer(productSupplierID)

		level.Product = &product
		level.Warehouse = &warehouse

		levels = append(levels, level)
	}

	return levels, total, nil
}

func (s *inventoryService) GetInventoryLevel(ctx context.Context, productID, warehouseID int64) (*models.InventoryLevelWithDetails, error) {
	query := `
		SELECT il.product_id, il.warehouse_id, il.quantity_on_hand, il.quantity_available, il.quantity_reserved, il.quantity_on_order, il.reorder_point, il.max_stock_level, il.last_updated_at, il.created_at, il.updated_at,
			   p.id, p.sku, p.name, p.description, p.category_id, p.unit_of_measure, p.weight, p.dimensions, p.cost_price, p.selling_price, p.barcode, p.image_url, p.is_active, p.attributes, p.supplier_id, p.reorder_point, p.created_at, p.updated_at,
			   w.id, w.name, w.code, w.address, w.contact_info, w.is_active, w.created_at, w.updated_at
		FROM inventory_levels il
		LEFT JOIN products p ON il.product_id = p.id
		LEFT JOIN warehouses w ON il.warehouse_id = w.id
		WHERE il.product_id = $1 AND il.warehouse_id = $2
	`

	var level models.InventoryLevelWithDetails
	var maxStockLevel sql.NullInt64

	// Product fields
	var product models.Product
	var productDescription, productBarcode, productImageURL sql.NullString
	var productCategoryID, productSupplierID sql.NullInt64
	var productWeight, productCostPrice, productSellingPrice sql.NullFloat64

	// Warehouse fields
	var warehouse models.Warehouse

	err := s.db.QueryRowContext(ctx, query, productID, warehouseID).
		Scan(&level.ProductID, &level.WarehouseID, &level.QuantityOnHand, &level.QuantityAvailable, &level.QuantityReserved, &level.QuantityOnOrder, &level.ReorderPoint, &maxStockLevel, &level.LastUpdatedAt, &level.CreatedAt, &level.UpdatedAt,
			&product.ID, &product.SKU, &product.Name, &productDescription, &productCategoryID, &product.UnitOfMeasure, &productWeight, &product.Dimensions, &productCostPrice, &productSellingPrice, &productBarcode, &productImageURL, &product.IsActive, &product.Attributes, &productSupplierID, &product.ReorderPoint, &product.CreatedAt, &product.UpdatedAt,
			&warehouse.ID, &warehouse.Name, &warehouse.Code, &warehouse.Address, &warehouse.ContactInfo, &warehouse.IsActive, &warehouse.CreatedAt, &warehouse.UpdatedAt)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("inventory level not found")
		}
		return nil, fmt.Errorf("failed to get inventory level: %v", err)
	}

	// Convert nullable fields
	level.MaxStockLevel = nullInt64ToIntPointer(maxStockLevel)

	// Convert product nullable fields
	product.Description = nullStringToPointer(productDescription)
	product.CategoryID = nullInt64ToPointer(productCategoryID)
	product.Weight = nullFloat64ToPointer(productWeight)
	product.CostPrice = nullFloat64ToPointer(productCostPrice)
	product.SellingPrice = nullFloat64ToPointer(productSellingPrice)
	product.Barcode = nullStringToPointer(productBarcode)
	product.ImageURL = nullStringToPointer(productImageURL)
	product.SupplierID = nullInt64ToPointer(productSupplierID)

	level.Product = &product
	level.Warehouse = &warehouse

	return &level, nil
}

func (s *inventoryService) UpdateInventoryLevel(ctx context.Context, productID, warehouseID int64, quantityChange int, unitCost *float64, referenceDocumentType *string, referenceDocumentID *int64, userID int64, notes *string) error {
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %v", err)
	}
	defer tx.Rollback()

	// Get current inventory level
	currentLevel, err := s.getCurrentInventoryLevel(ctx, tx, productID, warehouseID)
	if err != nil {
		return fmt.Errorf("failed to get current inventory level: %v", err)
	}

	// Get appropriate transaction type
	var transactionTypeID int64
	if quantityChange > 0 {
		transactionTypeID = 1 // RECEIPT
	} else {
		transactionTypeID = 2 // ISSUE
	}

	quantityBefore := currentLevel
	quantityAfter := quantityBefore + quantityChange

	// Calculate total cost
	var totalCost *float64
	if unitCost != nil {
		cost := float64(quantityChange) * *unitCost
		totalCost = &cost
	}

	// Create inventory transaction
	transactionQuery := `
		INSERT INTO inventory_transactions (transaction_type_id, product_id, warehouse_id, quantity_changed, quantity_before, quantity_after, unit_cost, total_cost, reference_document_type, reference_document_id, user_id, notes)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
	`

	_, err = tx.ExecContext(ctx, transactionQuery, transactionTypeID, productID, warehouseID, quantityChange, quantityBefore, quantityAfter, unitCost, totalCost, referenceDocumentType, referenceDocumentID, userID, notes)
	if err != nil {
		return fmt.Errorf("failed to create inventory transaction: %v", err)
	}

	// Update inventory level
	err = s.updateInventoryLevelInTransaction(ctx, tx, productID, warehouseID, quantityAfter)
	if err != nil {
		return fmt.Errorf("failed to update inventory level: %v", err)
	}

	// Commit transaction
	return tx.Commit()
}

func (s *inventoryService) GetInventoryTransactionTypes(ctx context.Context) ([]models.InventoryTransactionType, error) {
	query := `
		SELECT id, name, description, is_inbound, created_at
		FROM inventory_transaction_types
		ORDER BY name
	`

	rows, err := s.db.QueryContext(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to get inventory transaction types: %v", err)
	}
	defer rows.Close()

	var types []models.InventoryTransactionType
	for rows.Next() {
		var transactionType models.InventoryTransactionType
		var description sql.NullString

		err := rows.Scan(&transactionType.ID, &transactionType.Name, &description, &transactionType.IsInbound, &transactionType.CreatedAt)
		if err != nil {
			return nil, fmt.Errorf("failed to scan transaction type: %v", err)
		}

		// Convert nullable fields
		transactionType.Description = nullStringToPointer(description)

		types = append(types, transactionType)
	}

	return types, nil
}

// Helper functions
func (s *inventoryService) getCurrentInventoryLevel(ctx context.Context, tx *sql.Tx, productID, warehouseID int64) (int, error) {
	query := `
		SELECT COALESCE(quantity_on_hand, 0) 
		FROM inventory_levels 
		WHERE product_id = $1 AND warehouse_id = $2
	`

	var currentLevel int
	err := tx.QueryRowContext(ctx, query, productID, warehouseID).Scan(&currentLevel)
	if err != nil {
		if err == sql.ErrNoRows {
			return 0, nil // No existing level, start from 0
		}
		return 0, err
	}

	return currentLevel, nil
}

func (s *inventoryService) updateInventoryLevelInTransaction(ctx context.Context, tx *sql.Tx, productID, warehouseID int64, newQuantity int) error {
	// Upsert inventory level
	query := `
		INSERT INTO inventory_levels (product_id, warehouse_id, quantity_on_hand, quantity_available, quantity_reserved, quantity_on_order, reorder_point, last_updated_at)
		VALUES ($1, $2, $3, $3, 0, 0, 0, CURRENT_TIMESTAMP)
		ON CONFLICT (product_id, warehouse_id)
		DO UPDATE SET 
			quantity_on_hand = $3,
			quantity_available = $3,
			last_updated_at = CURRENT_TIMESTAMP
	`

	_, err := tx.ExecContext(ctx, query, productID, warehouseID, newQuantity)
	return err
}

// GetProductInventoryAcrossWarehouses gets inventory levels for a product across all warehouses
func (s *inventoryService) GetProductInventoryAcrossWarehouses(ctx context.Context, productID int64) ([]models.InventoryLevelWithDetails, error) {
	query := `
		SELECT il.product_id, il.warehouse_id, il.quantity_on_hand, il.quantity_available, il.quantity_reserved, il.quantity_on_order, il.reorder_point, il.max_stock_level, il.last_updated_at, il.created_at, il.updated_at,
			   p.id, p.sku, p.name, p.description, p.category_id, p.unit_of_measure, p.weight, p.dimensions, p.cost_price, p.selling_price, p.barcode, p.image_url, p.is_active, p.attributes, p.supplier_id, p.reorder_point, p.created_at, p.updated_at,
			   w.id, w.name, w.code, w.address, w.contact_info, w.is_active, w.created_at, w.updated_at
		FROM inventory_levels il
		LEFT JOIN products p ON il.product_id = p.id
		LEFT JOIN warehouses w ON il.warehouse_id = w.id
		WHERE il.product_id = $1
		ORDER BY w.name
	`

	rows, err := s.db.QueryContext(ctx, query, productID)
	if err != nil {
		return nil, fmt.Errorf("failed to get product inventory: %v", err)
	}
	defer rows.Close()

	var levels []models.InventoryLevelWithDetails
	for rows.Next() {
		var level models.InventoryLevelWithDetails
		var maxStockLevel sql.NullInt64

		// Product fields
		var product models.Product
		var productDescription, productBarcode, productImageURL sql.NullString
		var productCategoryID, productSupplierID sql.NullInt64
		var productWeight, productCostPrice, productSellingPrice sql.NullFloat64

		// Warehouse fields
		var warehouse models.Warehouse

		err := rows.Scan(&level.ProductID, &level.WarehouseID, &level.QuantityOnHand, &level.QuantityAvailable, &level.QuantityReserved, &level.QuantityOnOrder, &level.ReorderPoint, &maxStockLevel, &level.LastUpdatedAt, &level.CreatedAt, &level.UpdatedAt,
			&product.ID, &product.SKU, &product.Name, &productDescription, &productCategoryID, &product.UnitOfMeasure, &productWeight, &product.Dimensions, &productCostPrice, &productSellingPrice, &productBarcode, &productImageURL, &product.IsActive, &product.Attributes, &productSupplierID, &product.ReorderPoint, &product.CreatedAt, &product.UpdatedAt,
			&warehouse.ID, &warehouse.Name, &warehouse.Code, &warehouse.Address, &warehouse.ContactInfo, &warehouse.IsActive, &warehouse.CreatedAt, &warehouse.UpdatedAt)

		if err != nil {
			return nil, fmt.Errorf("failed to scan inventory level: %v", err)
		}

		// Convert nullable fields
		level.MaxStockLevel = nullInt64ToIntPointer(maxStockLevel)

		// Convert product nullable fields
		product.Description = nullStringToPointer(productDescription)
		product.CategoryID = nullInt64ToPointer(productCategoryID)
		product.Weight = nullFloat64ToPointer(productWeight)
		product.CostPrice = nullFloat64ToPointer(productCostPrice)
		product.SellingPrice = nullFloat64ToPointer(productSellingPrice)
		product.Barcode = nullStringToPointer(productBarcode)
		product.ImageURL = nullStringToPointer(productImageURL)
		product.SupplierID = nullInt64ToPointer(productSupplierID)

		level.Product = &product
		level.Warehouse = &warehouse

		levels = append(levels, level)
	}

	return levels, nil
}

// GetWarehouseInventory gets inventory levels for all products in a warehouse
func (s *inventoryService) GetWarehouseInventory(ctx context.Context, warehouseID int64) ([]models.InventoryLevelWithDetails, error) {
	query := `
		SELECT il.product_id, il.warehouse_id, il.quantity_on_hand, il.quantity_available, il.quantity_reserved, il.quantity_on_order, il.reorder_point, il.max_stock_level, il.last_updated_at, il.created_at, il.updated_at,
			   p.id, p.sku, p.name, p.description, p.category_id, p.unit_of_measure, p.weight, p.dimensions, p.cost_price, p.selling_price, p.barcode, p.image_url, p.is_active, p.attributes, p.supplier_id, p.reorder_point, p.created_at, p.updated_at,
			   w.id, w.name, w.code, w.address, w.contact_info, w.is_active, w.created_at, w.updated_at
		FROM inventory_levels il
		LEFT JOIN products p ON il.product_id = p.id
		LEFT JOIN warehouses w ON il.warehouse_id = w.id
		WHERE il.warehouse_id = $1
		ORDER BY p.name
	`

	rows, err := s.db.QueryContext(ctx, query, warehouseID)
	if err != nil {
		return nil, fmt.Errorf("failed to get warehouse inventory: %v", err)
	}
	defer rows.Close()

	var levels []models.InventoryLevelWithDetails
	for rows.Next() {
		var level models.InventoryLevelWithDetails
		var maxStockLevel sql.NullInt64

		// Product fields
		var product models.Product
		var productDescription, productBarcode, productImageURL sql.NullString
		var productCategoryID, productSupplierID sql.NullInt64
		var productWeight, productCostPrice, productSellingPrice sql.NullFloat64

		// Warehouse fields
		var warehouse models.Warehouse

		err := rows.Scan(&level.ProductID, &level.WarehouseID, &level.QuantityOnHand, &level.QuantityAvailable, &level.QuantityReserved, &level.QuantityOnOrder, &level.ReorderPoint, &maxStockLevel, &level.LastUpdatedAt, &level.CreatedAt, &level.UpdatedAt,
			&product.ID, &product.SKU, &product.Name, &productDescription, &productCategoryID, &product.UnitOfMeasure, &productWeight, &product.Dimensions, &productCostPrice, &productSellingPrice, &productBarcode, &productImageURL, &product.IsActive, &product.Attributes, &productSupplierID, &product.ReorderPoint, &product.CreatedAt, &product.UpdatedAt,
			&warehouse.ID, &warehouse.Name, &warehouse.Code, &warehouse.Address, &warehouse.ContactInfo, &warehouse.IsActive, &warehouse.CreatedAt, &warehouse.UpdatedAt)

		if err != nil {
			return nil, fmt.Errorf("failed to scan inventory level: %v", err)
		}

		// Convert nullable fields
		level.MaxStockLevel = nullInt64ToIntPointer(maxStockLevel)

		// Convert product nullable fields
		product.Description = nullStringToPointer(productDescription)
		product.CategoryID = nullInt64ToPointer(productCategoryID)
		product.Weight = nullFloat64ToPointer(productWeight)
		product.CostPrice = nullFloat64ToPointer(productCostPrice)
		product.SellingPrice = nullFloat64ToPointer(productSellingPrice)
		product.Barcode = nullStringToPointer(productBarcode)
		product.ImageURL = nullStringToPointer(productImageURL)
		product.SupplierID = nullInt64ToPointer(productSupplierID)

		level.Product = &product
		level.Warehouse = &warehouse

		levels = append(levels, level)
	}

	return levels, nil
}

// CreateWarehouse creates a new warehouse
func (s *inventoryService) CreateWarehouse(ctx context.Context, req models.CreateWarehouseRequest) (*models.Warehouse, error) {
	query := `
		INSERT INTO warehouses (name, code, address, contact_info, is_active, created_at, updated_at)
		VALUES ($1, $2, $3, $4, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
		RETURNING id, name, code, address, contact_info, is_active, created_at, updated_at
	`

	var warehouse models.Warehouse
	err := s.db.QueryRowContext(ctx, query, req.Name, req.Code, req.Address, req.ContactInfo).
		Scan(&warehouse.ID, &warehouse.Name, &warehouse.Code, &warehouse.Address, &warehouse.ContactInfo, &warehouse.IsActive, &warehouse.CreatedAt, &warehouse.UpdatedAt)

	if err != nil {
		return nil, fmt.Errorf("failed to create warehouse: %v", err)
	}

	return &warehouse, nil
}

// GetWarehouses gets all warehouses
func (s *inventoryService) GetWarehouses(ctx context.Context) ([]models.Warehouse, error) {
	query := `
		SELECT id, name, code, address, contact_info, is_active, created_at, updated_at
		FROM warehouses
		WHERE is_active = true
		ORDER BY name
	`

	rows, err := s.db.QueryContext(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to get warehouses: %v", err)
	}
	defer rows.Close()

	var warehouses []models.Warehouse
	for rows.Next() {
		var warehouse models.Warehouse
		err := rows.Scan(&warehouse.ID, &warehouse.Name, &warehouse.Code, &warehouse.Address, &warehouse.ContactInfo, &warehouse.IsActive, &warehouse.CreatedAt, &warehouse.UpdatedAt)
		if err != nil {
			return nil, fmt.Errorf("failed to scan warehouse: %v", err)
		}
		warehouses = append(warehouses, warehouse)
	}

	return warehouses, nil
}

// GetWarehouseByID gets a warehouse by ID
func (s *inventoryService) GetWarehouseByID(ctx context.Context, id int64) (*models.Warehouse, error) {
	query := `
		SELECT id, name, code, address, contact_info, is_active, created_at, updated_at
		FROM warehouses
		WHERE id = $1
	`

	var warehouse models.Warehouse
	err := s.db.QueryRowContext(ctx, query, id).
		Scan(&warehouse.ID, &warehouse.Name, &warehouse.Code, &warehouse.Address, &warehouse.ContactInfo, &warehouse.IsActive, &warehouse.CreatedAt, &warehouse.UpdatedAt)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("warehouse not found")
		}
		return nil, fmt.Errorf("failed to get warehouse: %v", err)
	}

	return &warehouse, nil
}

// UpdateWarehouse updates a warehouse
func (s *inventoryService) UpdateWarehouse(ctx context.Context, id int64, req models.UpdateWarehouseRequest) (*models.Warehouse, error) {
	query := `
		UPDATE warehouses
		SET name = $1, code = $2, address = $3, contact_info = $4, is_active = $5, updated_at = CURRENT_TIMESTAMP
		WHERE id = $6
		RETURNING id, name, code, address, contact_info, is_active, created_at, updated_at
	`

	var warehouse models.Warehouse
	err := s.db.QueryRowContext(ctx, query, req.Name, req.Code, req.Address, req.ContactInfo, req.IsActive, id).
		Scan(&warehouse.ID, &warehouse.Name, &warehouse.Code, &warehouse.Address, &warehouse.ContactInfo, &warehouse.IsActive, &warehouse.CreatedAt, &warehouse.UpdatedAt)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("warehouse not found")
		}
		return nil, fmt.Errorf("failed to update warehouse: %v", err)
	}

	return &warehouse, nil
}

// DeleteWarehouse deletes a warehouse
func (s *inventoryService) DeleteWarehouse(ctx context.Context, id int64) error {
	query := `
		UPDATE warehouses
		SET is_active = false, updated_at = CURRENT_TIMESTAMP
		WHERE id = $1
	`

	result, err := s.db.ExecContext(ctx, query, id)
	if err != nil {
		return fmt.Errorf("failed to delete warehouse: %v", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %v", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("warehouse not found")
	}

	return nil
}

