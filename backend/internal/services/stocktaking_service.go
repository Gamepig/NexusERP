package services

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"nexus-erp/backend/internal/models"

	"github.com/jmoiron/sqlx"
)


type stocktakingService struct {
	db *sqlx.DB
}

func NewStocktakingService(db *sqlx.DB) StocktakingService {
	return &stocktakingService{db: db}
}

// CreateStocktakingOrder creates a new stocktaking order and automatically adds items based on current inventory
func (s *stocktakingService) CreateStocktakingOrder(ctx context.Context, req *models.CreateStocktakingOrderRequest, userID int64) (*models.StocktakingOrderWithDetails, error) {
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to begin transaction: %v", err)
	}
	defer tx.Rollback()

	// Get planned status ID
	var plannedStatusID int64
	err = tx.QueryRowContext(ctx, "SELECT id FROM stocktaking_statuses WHERE name = $1", models.StocktakingStatusPlanned).Scan(&plannedStatusID)
	if err != nil {
		return nil, fmt.Errorf("failed to get planned status ID: %v", err)
	}

	// Create stocktaking order
	query := `
		INSERT INTO stocktaking_orders (title, description, warehouse_id, status_id, planned_date, created_by_user_id, notes)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id, reference_number, created_at, updated_at
	`

	var order models.StocktakingOrder
	err = tx.QueryRowContext(ctx, query, req.Title, req.Description, req.WarehouseID, plannedStatusID, req.PlannedDate, userID, req.Notes).Scan(
		&order.ID, &order.ReferenceNumber, &order.CreatedAt, &order.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create stocktaking order: %v", err)
	}

	// Fill in the known fields
	order.Title = req.Title
	order.Description = &req.Description
	order.WarehouseID = req.WarehouseID
	order.StatusID = plannedStatusID
	order.PlannedDate = req.PlannedDate
	order.CreatedByUserID = userID
	order.Notes = &req.Notes

	// Auto-populate stocktaking items based on current inventory levels
	itemQuery := `
		INSERT INTO stocktaking_items (stocktaking_order_id, product_id, system_quantity, unit_cost)
		SELECT $1, il.product_id, il.quantity_on_hand, p.cost_price
		FROM inventory_levels il
		JOIN products p ON il.product_id = p.id
		WHERE il.warehouse_id = $2 AND il.quantity_on_hand > 0
	`

	_, err = tx.ExecContext(ctx, itemQuery, order.ID, req.WarehouseID)
	if err != nil {
		return nil, fmt.Errorf("failed to create stocktaking items: %v", err)
	}

	// Commit transaction
	err = tx.Commit()
	if err != nil {
		return nil, fmt.Errorf("failed to commit transaction: %v", err)
	}

	// Return the created order with details
	return s.GetStocktakingOrderByID(ctx, order.ID)
}

// GetStocktakingOrders retrieves stocktaking orders with optional filtering
func (s *stocktakingService) GetStocktakingOrders(ctx context.Context, limit, offset int, warehouseID *int64, status string) ([]models.StocktakingOrderWithDetails, int, error) {
	// Build base query
	baseQuery := `
		FROM stocktaking_orders so
		LEFT JOIN stocktaking_statuses ss ON so.status_id = ss.id
		LEFT JOIN warehouses w ON so.warehouse_id = w.id
		LEFT JOIN users u ON so.created_by_user_id = u.id
		WHERE 1=1
	`

	var args []interface{}
	argIndex := 1

	// Add filters
	if warehouseID != nil {
		baseQuery += fmt.Sprintf(" AND so.warehouse_id = $%d", argIndex)
		args = append(args, *warehouseID)
		argIndex++
	}

	if status != "" {
		baseQuery += fmt.Sprintf(" AND ss.name = $%d", argIndex)
		args = append(args, status)
		argIndex++
	}

	// Count total records
	countQuery := "SELECT COUNT(*) " + baseQuery
	var total int
	err := s.db.QueryRowContext(ctx, countQuery, args...).Scan(&total)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to count stocktaking orders: %v", err)
	}

	// Get records with pagination
	query := `
		SELECT so.id, so.reference_number, so.title, so.description, so.warehouse_id, so.status_id, 
			   so.start_date, so.end_date, so.planned_date, so.created_by_user_id, so.approved_by_user_id, 
			   so.finalized_by_user_id, so.approved_at, so.finalized_at, so.notes, so.created_at, so.updated_at,
			   ss.name as status_name, w.name as warehouse_name, u.name as created_by_name
	` + baseQuery + `
		ORDER BY so.created_at DESC
		LIMIT $%d OFFSET $%d
	`

	args = append(args, limit, offset)
	query = fmt.Sprintf(query, argIndex, argIndex+1)

	rows, err := s.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to query stocktaking orders: %v", err)
	}
	defer rows.Close()

	var orders []models.StocktakingOrderWithDetails
	for rows.Next() {
		var order models.StocktakingOrderWithDetails
		var statusName, warehouseName, createdByName sql.NullString

		err := rows.Scan(
			&order.ID, &order.ReferenceNumber, &order.Title, &order.Description, &order.WarehouseID, &order.StatusID,
			&order.StartDate, &order.EndDate, &order.PlannedDate, &order.CreatedByUserID, &order.ApprovedByUserID,
			&order.FinalizedByUserID, &order.ApprovedAt, &order.FinalizedAt, &order.Notes, &order.CreatedAt, &order.UpdatedAt,
			&statusName, &warehouseName, &createdByName,
		)
		if err != nil {
			return nil, 0, fmt.Errorf("failed to scan stocktaking order: %v", err)
		}

		// Set related entities
		if statusName.Valid {
			order.Status = &models.StocktakingStatus{
				ID:   order.StatusID,
				Name: statusName.String,
			}
		}
		if warehouseName.Valid {
			order.Warehouse = &models.Warehouse{
				ID:   order.WarehouseID,
				Name: warehouseName.String,
			}
		}
		if createdByName.Valid {
			order.CreatedByUser = &models.User{
				ID:       order.CreatedByUserID,
				Username: createdByName.String,
			}
		}

		orders = append(orders, order)
	}

	return orders, total, nil
}

// GetStocktakingOrderByID retrieves a single stocktaking order with full details
func (s *stocktakingService) GetStocktakingOrderByID(ctx context.Context, id int64) (*models.StocktakingOrderWithDetails, error) {
	query := `
		SELECT so.id, so.reference_number, so.title, so.description, so.warehouse_id, so.status_id, 
			   so.start_date, so.end_date, so.planned_date, so.created_by_user_id, so.approved_by_user_id, 
			   so.finalized_by_user_id, so.approved_at, so.finalized_at, so.notes, so.created_at, so.updated_at,
			   ss.name as status_name, w.name as warehouse_name, w.code as warehouse_code,
			   u.name as created_by_name, u.email as created_by_email
		FROM stocktaking_orders so
		LEFT JOIN stocktaking_statuses ss ON so.status_id = ss.id
		LEFT JOIN warehouses w ON so.warehouse_id = w.id
		LEFT JOIN users u ON so.created_by_user_id = u.id
		WHERE so.id = $1
	`

	var order models.StocktakingOrderWithDetails
	var statusName, warehouseName, warehouseCode, createdByName, createdByEmail sql.NullString

	err := s.db.QueryRowContext(ctx, query, id).Scan(
		&order.ID, &order.ReferenceNumber, &order.Title, &order.Description, &order.WarehouseID, &order.StatusID,
		&order.StartDate, &order.EndDate, &order.PlannedDate, &order.CreatedByUserID, &order.ApprovedByUserID,
		&order.FinalizedByUserID, &order.ApprovedAt, &order.FinalizedAt, &order.Notes, &order.CreatedAt, &order.UpdatedAt,
		&statusName, &warehouseName, &warehouseCode, &createdByName, &createdByEmail,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("stocktaking order not found")
		}
		return nil, fmt.Errorf("failed to get stocktaking order: %v", err)
	}

	// Set related entities
	if statusName.Valid {
		order.Status = &models.StocktakingStatus{
			ID:   order.StatusID,
			Name: statusName.String,
		}
	}
	if warehouseName.Valid {
		order.Warehouse = &models.Warehouse{
			ID:   order.WarehouseID,
			Name: warehouseName.String,
			Code: warehouseCode.String,
		}
	}
	if createdByName.Valid {
		order.CreatedByUser = &models.User{
			ID:       order.CreatedByUserID,
			Username: createdByName.String,
			Email:    createdByEmail.String,
		}
	}

	// Get items for this order
	items, err := s.GetStocktakingItems(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to get stocktaking items: %v", err)
	}
	order.Items = items

	// Calculate summary statistics
	order.ItemsCount = len(items)
	countedItems := 0
	totalAdjustments := 0
	totalCostImpact := 0.0

	for _, item := range items {
		if item.CountedQuantity != nil {
			countedItems++
		}
		totalAdjustments += item.AdjustmentQuantity
		if item.TotalCostImpact != nil {
			totalCostImpact += *item.TotalCostImpact
		}
	}

	order.CountedItemsCount = countedItems
	order.TotalAdjustments = totalAdjustments
	order.TotalCostImpact = totalCostImpact

	return &order, nil
}

// UpdateStocktakingOrder updates basic information of a stocktaking order
func (s *stocktakingService) UpdateStocktakingOrder(ctx context.Context, id int64, req *models.UpdateStocktakingOrderRequest) (*models.StocktakingOrderWithDetails, error) {
	query := `
		UPDATE stocktaking_orders 
		SET title = $1, description = $2, planned_date = $3, notes = $4, updated_at = CURRENT_TIMESTAMP
		WHERE id = $5
	`

	result, err := s.db.ExecContext(ctx, query, req.Title, req.Description, req.PlannedDate, req.Notes, id)
	if err != nil {
		return nil, fmt.Errorf("failed to update stocktaking order: %v", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return nil, fmt.Errorf("failed to get rows affected: %v", err)
	}

	if rowsAffected == 0 {
		return nil, fmt.Errorf("stocktaking order not found")
	}

	return s.GetStocktakingOrderByID(ctx, id)
}

// StartStocktakingOrder starts a stocktaking order
func (s *stocktakingService) StartStocktakingOrder(ctx context.Context, id int64, req *models.StartStocktakingOrderRequest, userID int64) (*models.StocktakingOrderWithDetails, error) {
	// Get in-progress status ID
	var inProgressStatusID int64
	err := s.db.QueryRowContext(ctx, "SELECT id FROM stocktaking_statuses WHERE name = $1", models.StocktakingStatusInProgress).Scan(&inProgressStatusID)
	if err != nil {
		return nil, fmt.Errorf("failed to get in-progress status ID: %v", err)
	}

	startDate := time.Now()
	if req.StartDate != nil {
		startDate = *req.StartDate
	}

	query := `
		UPDATE stocktaking_orders 
		SET status_id = $1, start_date = $2, notes = COALESCE($3, notes), updated_at = CURRENT_TIMESTAMP
		WHERE id = $4 AND status_id = (SELECT id FROM stocktaking_statuses WHERE name = $5)
	`

	result, err := s.db.ExecContext(ctx, query, inProgressStatusID, startDate, req.Notes, id, models.StocktakingStatusPlanned)
	if err != nil {
		return nil, fmt.Errorf("failed to start stocktaking order: %v", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return nil, fmt.Errorf("failed to get rows affected: %v", err)
	}

	if rowsAffected == 0 {
		return nil, fmt.Errorf("stocktaking order not found or not in planned status")
	}

	return s.GetStocktakingOrderByID(ctx, id)
}

// Implementation continues with other methods...
// For brevity, I'll implement the key methods. The complete implementation would include all interface methods.

// GetStocktakingItems retrieves items for a stocktaking order
func (s *stocktakingService) GetStocktakingItems(ctx context.Context, orderID int64) ([]models.StocktakingItemWithDetails, error) {
	query := `
		SELECT si.id, si.stocktaking_order_id, si.product_id, si.system_quantity, si.counted_quantity, 
			   si.adjustment_quantity, si.unit_cost, si.total_cost_impact, si.batch_number, si.expiry_date,
			   si.notes, si.counted_by_user_id, si.counted_at, si.created_at, si.updated_at,
			   p.sku, p.name as product_name, p.unit_of_measure,
			   u.name as counted_by_name
		FROM stocktaking_items si
		LEFT JOIN products p ON si.product_id = p.id
		LEFT JOIN users u ON si.counted_by_user_id = u.id
		WHERE si.stocktaking_order_id = $1
		ORDER BY p.sku, p.name
	`

	rows, err := s.db.QueryContext(ctx, query, orderID)
	if err != nil {
		return nil, fmt.Errorf("failed to query stocktaking items: %v", err)
	}
	defer rows.Close()

	var items []models.StocktakingItemWithDetails
	for rows.Next() {
		var item models.StocktakingItemWithDetails
		var productSKU, productName, productUOM, countedByName sql.NullString

		err := rows.Scan(
			&item.ID, &item.StocktakingOrderID, &item.ProductID, &item.SystemQuantity, &item.CountedQuantity,
			&item.AdjustmentQuantity, &item.UnitCost, &item.TotalCostImpact, &item.BatchNumber, &item.ExpiryDate,
			&item.Notes, &item.CountedByUserID, &item.CountedAt, &item.CreatedAt, &item.UpdatedAt,
			&productSKU, &productName, &productUOM, &countedByName,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan stocktaking item: %v", err)
		}

		// Set related entities
		if productSKU.Valid {
			item.Product = &models.Product{
				ID:            item.ProductID,
				SKU:           productSKU.String,
				Name:          productName.String,
				UnitOfMeasure: productUOM.String,
			}
		}
		if countedByName.Valid && item.CountedByUserID != nil {
			item.CountedByUser = &models.User{
				ID:       *item.CountedByUserID,
				Username: countedByName.String,
			}
		}

		items = append(items, item)
	}

	return items, nil
}

// CountStocktakingItem records the counted quantity for a stocktaking item
func (s *stocktakingService) CountStocktakingItem(ctx context.Context, orderID, productID int64, req *models.CountStocktakingItemRequest, userID int64) (*models.StocktakingItemWithDetails, error) {
	query := `
		UPDATE stocktaking_items 
		SET counted_quantity = $1, batch_number = $2, expiry_date = $3, notes = $4, 
			counted_by_user_id = $5, counted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
		WHERE stocktaking_order_id = $6 AND product_id = $7
	`

	result, err := s.db.ExecContext(ctx, query, req.CountedQuantity, req.BatchNumber, req.ExpiryDate, req.Notes, userID, orderID, productID)
	if err != nil {
		return nil, fmt.Errorf("failed to count stocktaking item: %v", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return nil, fmt.Errorf("failed to get rows affected: %v", err)
	}

	if rowsAffected == 0 {
		return nil, fmt.Errorf("stocktaking item not found")
	}

	// Get the updated item
	items, err := s.GetStocktakingItems(ctx, orderID)
	if err != nil {
		return nil, fmt.Errorf("failed to get updated stocktaking items: %v", err)
	}

	for _, item := range items {
		if item.ProductID == productID {
			return &item, nil
		}
	}

	return nil, fmt.Errorf("updated stocktaking item not found")
}

// ProcessStocktakingOrder processes multiple stocktaking items at once
func (s *stocktakingService) ProcessStocktakingOrder(ctx context.Context, id int64, req *models.ProcessStocktakingOrderRequest, userID int64) (*models.StocktakingOrderWithDetails, error) {
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to begin transaction: %v", err)
	}
	defer tx.Rollback()

	// Verify the order exists and is in the correct status
	var orderStatus string
	err = tx.QueryRowContext(ctx, `
		SELECT ss.name 
		FROM stocktaking_orders so 
		JOIN stocktaking_statuses ss ON so.status_id = ss.id 
		WHERE so.id = $1
	`, id).Scan(&orderStatus)
	if err != nil {
		return nil, fmt.Errorf("failed to get stocktaking order status: %v", err)
	}

	if orderStatus != models.StocktakingStatusInProgress {
		return nil, fmt.Errorf("stocktaking order must be in progress to process items")
	}

	// Process each item in the request
	for _, item := range req.Items {
		query := `
			UPDATE stocktaking_items 
			SET counted_quantity = $1, batch_number = $2, expiry_date = $3, 
				notes = $4, counted_by_user_id = $5, counted_at = CURRENT_TIMESTAMP, 
				updated_at = CURRENT_TIMESTAMP
			WHERE stocktaking_order_id = $6 AND product_id = $7
		`

		result, err := tx.ExecContext(ctx, query, item.CountedQuantity, item.BatchNumber, item.ExpiryDate, item.Notes, userID, id, item.ProductID)
		if err != nil {
			return nil, fmt.Errorf("failed to update stocktaking item for product %d: %v", item.ProductID, err)
		}

		rowsAffected, err := result.RowsAffected()
		if err != nil {
			return nil, fmt.Errorf("failed to get rows affected for product %d: %v", item.ProductID, err)
		}

		if rowsAffected == 0 {
			return nil, fmt.Errorf("stocktaking item not found for product %d", item.ProductID)
		}
	}

	// Update the order's notes if provided
	if req.Notes != "" {
		_, err = tx.ExecContext(ctx, `
			UPDATE stocktaking_orders 
			SET notes = COALESCE($1, notes), updated_at = CURRENT_TIMESTAMP
			WHERE id = $2
		`, req.Notes, id)
		if err != nil {
			return nil, fmt.Errorf("failed to update stocktaking order notes: %v", err)
		}
	}

	// Commit transaction
	err = tx.Commit()
	if err != nil {
		return nil, fmt.Errorf("failed to commit transaction: %v", err)
	}

	return s.GetStocktakingOrderByID(ctx, id)
}

// FinalizeStocktakingOrder completes a stocktaking order and creates inventory adjustment transactions
func (s *stocktakingService) FinalizeStocktakingOrder(ctx context.Context, id int64, req *models.FinalizeStocktakingOrderRequest, userID int64) (*models.StocktakingOrderWithDetails, error) {
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to begin transaction: %v", err)
	}
	defer tx.Rollback()

	// Get the order and verify it can be finalized
	var order models.StocktakingOrder
	var statusName string
	err = tx.QueryRowContext(ctx, `
		SELECT so.id, so.warehouse_id, so.status_id, ss.name as status_name
		FROM stocktaking_orders so
		JOIN stocktaking_statuses ss ON so.status_id = ss.id
		WHERE so.id = $1
	`, id).Scan(&order.ID, &order.WarehouseID, &order.StatusID, &statusName)
	if err != nil {
		return nil, fmt.Errorf("failed to get stocktaking order: %v", err)
	}

	if statusName != models.StocktakingStatusInProgress && statusName != models.StocktakingStatusCompleted {
		return nil, fmt.Errorf("stocktaking order must be in progress or completed to finalize")
	}

	// Get all items with discrepancies (where counted_quantity differs from system_quantity)
	itemsQuery := `
		SELECT si.id, si.product_id, si.system_quantity, si.counted_quantity, si.adjustment_quantity, si.unit_cost
		FROM stocktaking_items si
		WHERE si.stocktaking_order_id = $1 
		AND si.counted_quantity IS NOT NULL 
		AND si.adjustment_quantity != 0
	`

	rows, err := tx.QueryContext(ctx, itemsQuery, id)
	if err != nil {
		return nil, fmt.Errorf("failed to get stocktaking items: %v", err)
	}
	defer rows.Close()

	var adjustmentItems []struct {
		ID                int64
		ProductID         int64
		SystemQuantity    int
		CountedQuantity   int
		AdjustmentQuantity int
		UnitCost          *float64
	}

	for rows.Next() {
		var item struct {
			ID                int64
			ProductID         int64
			SystemQuantity    int
			CountedQuantity   int
			AdjustmentQuantity int
			UnitCost          *float64
		}

		err := rows.Scan(&item.ID, &item.ProductID, &item.SystemQuantity, &item.CountedQuantity, &item.AdjustmentQuantity, &item.UnitCost)
		if err != nil {
			return nil, fmt.Errorf("failed to scan stocktaking item: %v", err)
		}

		adjustmentItems = append(adjustmentItems, item)
	}

	// Create inventory adjustment transactions for each item with discrepancies
	for _, item := range adjustmentItems {
		// Get the appropriate transaction type (ADJUSTMENT_IN or ADJUSTMENT_OUT)
		var transactionTypeID int64
		if item.AdjustmentQuantity > 0 {
			err = tx.QueryRowContext(ctx, "SELECT id FROM inventory_transaction_types WHERE name = $1", "ADJUSTMENT_IN").Scan(&transactionTypeID)
		} else {
			err = tx.QueryRowContext(ctx, "SELECT id FROM inventory_transaction_types WHERE name = $1", "ADJUSTMENT_OUT").Scan(&transactionTypeID)
		}
		if err != nil {
			return nil, fmt.Errorf("failed to get transaction type: %v", err)
		}

		// Get current inventory level before adjustment
		var currentQuantity int
		err = tx.QueryRowContext(ctx, `
			SELECT COALESCE(quantity_on_hand, 0) 
			FROM inventory_levels 
			WHERE product_id = $1 AND warehouse_id = $2
		`, item.ProductID, order.WarehouseID).Scan(&currentQuantity)
		if err != nil {
			return nil, fmt.Errorf("failed to get current inventory level: %v", err)
		}

		// Calculate total cost
		var totalCost *float64
		if item.UnitCost != nil {
			cost := float64(item.AdjustmentQuantity) * *item.UnitCost
			totalCost = &cost
		}

		// Create inventory transaction
		transactionQuery := `
			INSERT INTO inventory_transactions 
			(transaction_type_id, product_id, warehouse_id, quantity_changed, quantity_before, quantity_after, 
			 unit_cost, total_cost, reference_document_type, reference_document_id, user_id, notes)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
		`

		newQuantity := currentQuantity + item.AdjustmentQuantity
		_, err = tx.ExecContext(ctx, transactionQuery, 
			transactionTypeID, item.ProductID, order.WarehouseID, 
			item.AdjustmentQuantity, currentQuantity, newQuantity,
			item.UnitCost, totalCost, "STOCKTAKING", id, userID,
			fmt.Sprintf("Stocktaking adjustment: System=%d, Counted=%d, Difference=%d", 
				item.SystemQuantity, item.CountedQuantity, item.AdjustmentQuantity))
		if err != nil {
			return nil, fmt.Errorf("failed to create inventory transaction: %v", err)
		}

		// Update inventory level
		upsertQuery := `
			INSERT INTO inventory_levels (product_id, warehouse_id, quantity_on_hand, quantity_available, quantity_reserved, quantity_on_order, reorder_point, last_updated_at)
			VALUES ($1, $2, $3, $3, 0, 0, 0, CURRENT_TIMESTAMP)
			ON CONFLICT (product_id, warehouse_id)
			DO UPDATE SET 
				quantity_on_hand = $3,
				quantity_available = $3,
				last_updated_at = CURRENT_TIMESTAMP
		`

		_, err = tx.ExecContext(ctx, upsertQuery, item.ProductID, order.WarehouseID, newQuantity)
		if err != nil {
			return nil, fmt.Errorf("failed to update inventory level: %v", err)
		}
	}

	// Update the stocktaking order status to finalized
	var finalizedStatusID int64
	err = tx.QueryRowContext(ctx, "SELECT id FROM stocktaking_statuses WHERE name = $1", models.StocktakingStatusFinalized).Scan(&finalizedStatusID)
	if err != nil {
		return nil, fmt.Errorf("failed to get finalized status ID: %v", err)
	}

	endDate := time.Now()
	if req.EndDate != nil {
		endDate = *req.EndDate
	}

	_, err = tx.ExecContext(ctx, `
		UPDATE stocktaking_orders 
		SET status_id = $1, end_date = $2, finalized_by_user_id = $3, finalized_at = CURRENT_TIMESTAMP, 
			notes = COALESCE($4, notes), updated_at = CURRENT_TIMESTAMP
		WHERE id = $5
	`, finalizedStatusID, endDate, userID, req.Notes, id)
	if err != nil {
		return nil, fmt.Errorf("failed to update stocktaking order status: %v", err)
	}

	// Commit transaction
	err = tx.Commit()
	if err != nil {
		return nil, fmt.Errorf("failed to commit transaction: %v", err)
	}

	return s.GetStocktakingOrderByID(ctx, id)
}

func (s *stocktakingService) ApproveStocktakingOrder(ctx context.Context, id int64, req *models.ApproveStocktakingOrderRequest, userID int64) (*models.StocktakingOrderWithDetails, error) {
	// Get approved status ID
	var approvedStatusID int64
	err := s.db.QueryRowContext(ctx, "SELECT id FROM stocktaking_statuses WHERE name = $1", models.StocktakingStatusApproved).Scan(&approvedStatusID)
	if err != nil {
		return nil, fmt.Errorf("failed to get approved status ID: %v", err)
	}

	query := `
		UPDATE stocktaking_orders 
		SET status_id = $1, approved_by_user_id = $2, approved_at = CURRENT_TIMESTAMP, 
			notes = COALESCE($3, notes), updated_at = CURRENT_TIMESTAMP
		WHERE id = $4 AND status_id = (SELECT id FROM stocktaking_statuses WHERE name = $5)
	`

	result, err := s.db.ExecContext(ctx, query, approvedStatusID, userID, req.Notes, id, models.StocktakingStatusFinalized)
	if err != nil {
		return nil, fmt.Errorf("failed to approve stocktaking order: %v", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return nil, fmt.Errorf("failed to get rows affected: %v", err)
	}

	if rowsAffected == 0 {
		return nil, fmt.Errorf("stocktaking order not found or not in finalized status")
	}

	return s.GetStocktakingOrderByID(ctx, id)
}

func (s *stocktakingService) DeleteStocktakingOrder(ctx context.Context, id int64) error {
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %v", err)
	}
	defer tx.Rollback()

	// Check if the order can be deleted (only planned orders can be deleted)
	var status string
	err = tx.QueryRowContext(ctx, `
		SELECT ss.name 
		FROM stocktaking_orders so 
		JOIN stocktaking_statuses ss ON so.status_id = ss.id 
		WHERE so.id = $1
	`, id).Scan(&status)
	if err != nil {
		if err == sql.ErrNoRows {
			return fmt.Errorf("stocktaking order not found")
		}
		return fmt.Errorf("failed to get stocktaking order status: %v", err)
	}

	if status != models.StocktakingStatusPlanned {
		return fmt.Errorf("only planned stocktaking orders can be deleted")
	}

	// Delete stocktaking items first
	_, err = tx.ExecContext(ctx, "DELETE FROM stocktaking_items WHERE stocktaking_order_id = $1", id)
	if err != nil {
		return fmt.Errorf("failed to delete stocktaking items: %v", err)
	}

	// Delete the stocktaking order
	result, err := tx.ExecContext(ctx, "DELETE FROM stocktaking_orders WHERE id = $1", id)
	if err != nil {
		return fmt.Errorf("failed to delete stocktaking order: %v", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %v", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("stocktaking order not found")
	}

	return tx.Commit()
}

func (s *stocktakingService) CreateProductSafetyStock(ctx context.Context, req *models.CreateProductSafetyStockRequest) (*models.ProductSafetyStockWithDetails, error) {
	query := `
		INSERT INTO product_safety_stocks (product_id, warehouse_id, safety_stock_level, reorder_quantity, is_active)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, created_at, updated_at
	`

	var safetyStock models.ProductSafetyStock
	err := s.db.QueryRowContext(ctx, query, req.ProductID, req.WarehouseID, req.SafetyStockLevel, req.ReorderQuantity, true).Scan(
		&safetyStock.ID, &safetyStock.CreatedAt, &safetyStock.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create product safety stock: %v", err)
	}

	// Fill in the known fields
	safetyStock.ProductID = req.ProductID
	safetyStock.WarehouseID = req.WarehouseID
	safetyStock.SafetyStockLevel = req.SafetyStockLevel
	safetyStock.ReorderQuantity = req.ReorderQuantity
	safetyStock.IsActive = true

	return s.GetProductSafetyStockByID(ctx, safetyStock.ID)
}

func (s *stocktakingService) GetProductSafetyStocks(ctx context.Context, limit, offset int, productID, warehouseID *int64) ([]models.ProductSafetyStockWithDetails, int, error) {
	// Build base query
	baseQuery := `
		FROM product_safety_stocks pss
		LEFT JOIN products p ON pss.product_id = p.id
		LEFT JOIN warehouses w ON pss.warehouse_id = w.id
		WHERE 1=1
	`

	var args []interface{}
	argIndex := 1

	// Add filters
	if productID != nil {
		baseQuery += fmt.Sprintf(" AND pss.product_id = $%d", argIndex)
		args = append(args, *productID)
		argIndex++
	}

	if warehouseID != nil {
		baseQuery += fmt.Sprintf(" AND pss.warehouse_id = $%d", argIndex)
		args = append(args, *warehouseID)
		argIndex++
	}

	// Count total records
	countQuery := "SELECT COUNT(*) " + baseQuery
	var total int
	err := s.db.QueryRowContext(ctx, countQuery, args...).Scan(&total)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to count product safety stocks: %v", err)
	}

	// Get records with pagination
	query := `
		SELECT pss.id, pss.product_id, pss.warehouse_id, pss.safety_stock_level, pss.reorder_quantity, pss.is_active,
			   pss.created_at, pss.updated_at,
			   p.sku, p.name as product_name, w.name as warehouse_name, w.code as warehouse_code
	` + baseQuery + `
		ORDER BY p.sku, w.name
		LIMIT $%d OFFSET $%d
	`

	args = append(args, limit, offset)
	query = fmt.Sprintf(query, argIndex, argIndex+1)

	rows, err := s.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to query product safety stocks: %v", err)
	}
	defer rows.Close()

	var safetyStocks []models.ProductSafetyStockWithDetails
	for rows.Next() {
		var safetyStock models.ProductSafetyStockWithDetails
		var productSKU, productName, warehouseName, warehouseCode sql.NullString

		err := rows.Scan(
			&safetyStock.ID, &safetyStock.ProductID, &safetyStock.WarehouseID, &safetyStock.SafetyStockLevel, &safetyStock.ReorderQuantity, &safetyStock.IsActive,
			&safetyStock.CreatedAt, &safetyStock.UpdatedAt,
			&productSKU, &productName, &warehouseName, &warehouseCode,
		)
		if err != nil {
			return nil, 0, fmt.Errorf("failed to scan product safety stock: %v", err)
		}

		// Set related entities
		if productSKU.Valid {
			safetyStock.Product = &models.Product{
				ID:   safetyStock.ProductID,
				SKU:  productSKU.String,
				Name: productName.String,
			}
		}
		if warehouseName.Valid {
			safetyStock.Warehouse = &models.Warehouse{
				ID:   safetyStock.WarehouseID,
				Name: warehouseName.String,
				Code: warehouseCode.String,
			}
		}

		safetyStocks = append(safetyStocks, safetyStock)
	}

	return safetyStocks, total, nil
}

func (s *stocktakingService) GetProductSafetyStockByID(ctx context.Context, id int64) (*models.ProductSafetyStockWithDetails, error) {
	query := `
		SELECT pss.id, pss.product_id, pss.warehouse_id, pss.safety_stock_level, pss.reorder_quantity, pss.is_active,
			   pss.created_at, pss.updated_at,
			   p.sku, p.name as product_name, p.unit_of_measure,
			   w.name as warehouse_name, w.code as warehouse_code
		FROM product_safety_stocks pss
		LEFT JOIN products p ON pss.product_id = p.id
		LEFT JOIN warehouses w ON pss.warehouse_id = w.id
		WHERE pss.id = $1
	`

	var safetyStock models.ProductSafetyStockWithDetails
	var productSKU, productName, productUOM, warehouseName, warehouseCode sql.NullString

	err := s.db.QueryRowContext(ctx, query, id).Scan(
		&safetyStock.ID, &safetyStock.ProductID, &safetyStock.WarehouseID, &safetyStock.SafetyStockLevel, &safetyStock.ReorderQuantity, &safetyStock.IsActive,
		&safetyStock.CreatedAt, &safetyStock.UpdatedAt,
		&productSKU, &productName, &productUOM, &warehouseName, &warehouseCode,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("product safety stock not found")
		}
		return nil, fmt.Errorf("failed to get product safety stock: %v", err)
	}

	// Set related entities
	if productSKU.Valid {
		safetyStock.Product = &models.Product{
			ID:            safetyStock.ProductID,
			SKU:           productSKU.String,
			Name:          productName.String,
			UnitOfMeasure: productUOM.String,
		}
	}
	if warehouseName.Valid {
		safetyStock.Warehouse = &models.Warehouse{
			ID:   safetyStock.WarehouseID,
			Name: warehouseName.String,
			Code: warehouseCode.String,
		}
	}

	return &safetyStock, nil
}

func (s *stocktakingService) UpdateProductSafetyStock(ctx context.Context, id int64, req *models.UpdateProductSafetyStockRequest) (*models.ProductSafetyStockWithDetails, error) {
	query := `
		UPDATE product_safety_stocks 
		SET safety_stock_level = $1, reorder_quantity = $2, is_active = $3, updated_at = CURRENT_TIMESTAMP
		WHERE id = $4
	`

	result, err := s.db.ExecContext(ctx, query, req.SafetyStockLevel, req.ReorderQuantity, req.IsActive, id)
	if err != nil {
		return nil, fmt.Errorf("failed to update product safety stock: %v", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return nil, fmt.Errorf("failed to get rows affected: %v", err)
	}

	if rowsAffected == 0 {
		return nil, fmt.Errorf("product safety stock not found")
	}

	return s.GetProductSafetyStockByID(ctx, id)
}

func (s *stocktakingService) DeleteProductSafetyStock(ctx context.Context, id int64) error {
	result, err := s.db.ExecContext(ctx, "DELETE FROM product_safety_stocks WHERE id = $1", id)
	if err != nil {
		return fmt.Errorf("failed to delete product safety stock: %v", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %v", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("product safety stock not found")
	}

	return nil
}

func (s *stocktakingService) GetInventoryAlerts(ctx context.Context, limit, offset int, status string, alertTypeID, productID, warehouseID *int64) ([]models.InventoryAlertWithDetails, int, error) {
	// Build base query
	baseQuery := `
		FROM inventory_alerts ia
		LEFT JOIN inventory_alert_types iat ON ia.alert_type_id = iat.id
		LEFT JOIN products p ON ia.product_id = p.id
		LEFT JOIN warehouses w ON ia.warehouse_id = w.id
		LEFT JOIN users u ON ia.resolved_by_user_id = u.id
		WHERE 1=1
	`

	var args []interface{}
	argIndex := 1

	// Add filters
	if status != "" {
		baseQuery += fmt.Sprintf(" AND ia.status = $%d", argIndex)
		args = append(args, status)
		argIndex++
	}

	if alertTypeID != nil {
		baseQuery += fmt.Sprintf(" AND ia.alert_type_id = $%d", argIndex)
		args = append(args, *alertTypeID)
		argIndex++
	}

	if productID != nil {
		baseQuery += fmt.Sprintf(" AND ia.product_id = $%d", argIndex)
		args = append(args, *productID)
		argIndex++
	}

	if warehouseID != nil {
		baseQuery += fmt.Sprintf(" AND ia.warehouse_id = $%d", argIndex)
		args = append(args, *warehouseID)
		argIndex++
	}

	// Count total records
	countQuery := "SELECT COUNT(*) " + baseQuery
	var total int
	err := s.db.QueryRowContext(ctx, countQuery, args...).Scan(&total)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to count inventory alerts: %v", err)
	}

	// Get records with pagination
	query := `
		SELECT ia.id, ia.alert_type_id, ia.product_id, ia.warehouse_id, ia.current_level, 
			   ia.safety_level, ia.max_level, ia.status, ia.alert_message, ia.resolved_by_user_id,
			   ia.resolved_at, ia.triggered_at, ia.created_at, ia.updated_at,
			   iat.name as alert_type_name, iat.description as alert_type_description,
			   p.sku, p.name as product_name, p.unit_of_measure,
			   w.name as warehouse_name, w.code as warehouse_code,
			   u.name as resolved_by_name
	` + baseQuery + `
		ORDER BY ia.created_at DESC
		LIMIT $%d OFFSET $%d
	`

	args = append(args, limit, offset)
	query = fmt.Sprintf(query, argIndex, argIndex+1)

	rows, err := s.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to query inventory alerts: %v", err)
	}
	defer rows.Close()

	var alerts []models.InventoryAlertWithDetails
	for rows.Next() {
		var alert models.InventoryAlertWithDetails
		var alertTypeName, alertTypeDescription, productSKU, productName, productUOM, warehouseName, warehouseCode, resolvedByName sql.NullString

		err := rows.Scan(
			&alert.ID, &alert.AlertTypeID, &alert.ProductID, &alert.WarehouseID, &alert.CurrentLevel,
			&alert.SafetyLevel, &alert.MaxLevel, &alert.Status, &alert.AlertMessage, &alert.ResolvedByUserID,
			&alert.ResolvedAt, &alert.TriggeredAt, &alert.CreatedAt, &alert.UpdatedAt,
			&alertTypeName, &alertTypeDescription, &productSKU, &productName, &productUOM, &warehouseName, &warehouseCode, &resolvedByName,
		)
		if err != nil {
			return nil, 0, fmt.Errorf("failed to scan inventory alert: %v", err)
		}

		// Set related entities
		if alertTypeName.Valid {
			alert.AlertType = &models.InventoryAlertType{
				ID:          alert.AlertTypeID,
				Name:        alertTypeName.String,
				Description: &alertTypeDescription.String,
			}
		}
		if productSKU.Valid {
			alert.Product = &models.Product{
				ID:            alert.ProductID,
				SKU:           productSKU.String,
				Name:          productName.String,
				UnitOfMeasure: productUOM.String,
			}
		}
		if warehouseName.Valid {
			alert.Warehouse = &models.Warehouse{
				ID:   alert.WarehouseID,
				Name: warehouseName.String,
				Code: warehouseCode.String,
			}
		}
		if resolvedByName.Valid && alert.ResolvedByUserID != nil {
			alert.ResolvedByUser = &models.User{
				ID:       *alert.ResolvedByUserID,
				Username: resolvedByName.String,
			}
		}

		alerts = append(alerts, alert)
	}

	return alerts, total, nil
}

func (s *stocktakingService) GetInventoryAlertByID(ctx context.Context, id int64) (*models.InventoryAlertWithDetails, error) {
	query := `
		SELECT ia.id, ia.alert_type_id, ia.product_id, ia.warehouse_id, ia.current_level, 
			   ia.safety_level, ia.max_level, ia.status, ia.alert_message, ia.resolved_by_user_id,
			   ia.resolved_at, ia.triggered_at, ia.created_at, ia.updated_at,
			   iat.name as alert_type_name, iat.description as alert_type_description,
			   p.sku, p.name as product_name, p.unit_of_measure,
			   w.name as warehouse_name, w.code as warehouse_code,
			   u.name as resolved_by_name, u.email as resolved_by_email
		FROM inventory_alerts ia
		LEFT JOIN inventory_alert_types iat ON ia.alert_type_id = iat.id
		LEFT JOIN products p ON ia.product_id = p.id
		LEFT JOIN warehouses w ON ia.warehouse_id = w.id
		LEFT JOIN users u ON ia.resolved_by_user_id = u.id
		WHERE ia.id = $1
	`

	var alert models.InventoryAlertWithDetails
	var alertTypeName, alertTypeDescription, productSKU, productName, productUOM, warehouseName, warehouseCode, resolvedByName, resolvedByEmail sql.NullString

	err := s.db.QueryRowContext(ctx, query, id).Scan(
		&alert.ID, &alert.AlertTypeID, &alert.ProductID, &alert.WarehouseID, &alert.CurrentLevel,
		&alert.SafetyLevel, &alert.MaxLevel, &alert.Status, &alert.AlertMessage, &alert.ResolvedByUserID,
		&alert.ResolvedAt, &alert.TriggeredAt, &alert.CreatedAt, &alert.UpdatedAt,
		&alertTypeName, &alertTypeDescription, &productSKU, &productName, &productUOM, &warehouseName, &warehouseCode, &resolvedByName, &resolvedByEmail,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("inventory alert not found")
		}
		return nil, fmt.Errorf("failed to get inventory alert: %v", err)
	}

	// Set related entities
	if alertTypeName.Valid {
		alert.AlertType = &models.InventoryAlertType{
			ID:          alert.AlertTypeID,
			Name:        alertTypeName.String,
			Description: &alertTypeDescription.String,
		}
	}
	if productSKU.Valid {
		alert.Product = &models.Product{
			ID:            alert.ProductID,
			SKU:           productSKU.String,
			Name:          productName.String,
			UnitOfMeasure: productUOM.String,
		}
	}
	if warehouseName.Valid {
		alert.Warehouse = &models.Warehouse{
			ID:   alert.WarehouseID,
			Name: warehouseName.String,
			Code: warehouseCode.String,
		}
	}
	if resolvedByName.Valid && alert.ResolvedByUserID != nil {
		alert.ResolvedByUser = &models.User{
			ID:       *alert.ResolvedByUserID,
			Username: resolvedByName.String,
			Email:    resolvedByEmail.String,
		}
	}

	return &alert, nil
}

func (s *stocktakingService) ResolveInventoryAlert(ctx context.Context, id int64, req *models.ResolveInventoryAlertRequest, userID int64) (*models.InventoryAlertWithDetails, error) {
	query := `
		UPDATE inventory_alerts 
		SET status = 'RESOLVED', resolved_by_user_id = $1, resolved_at = CURRENT_TIMESTAMP, 
			updated_at = CURRENT_TIMESTAMP
		WHERE id = $2 AND status = 'ACTIVE'
	`

	result, err := s.db.ExecContext(ctx, query, userID, id)
	if err != nil {
		return nil, fmt.Errorf("failed to resolve inventory alert: %v", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return nil, fmt.Errorf("failed to get rows affected: %v", err)
	}

	if rowsAffected == 0 {
		return nil, fmt.Errorf("inventory alert not found or already resolved")
	}

	return s.GetInventoryAlertByID(ctx, id)
}

func (s *stocktakingService) DismissInventoryAlert(ctx context.Context, id int64, req *models.DismissInventoryAlertRequest, userID int64) (*models.InventoryAlertWithDetails, error) {
	query := `
		UPDATE inventory_alerts 
		SET status = 'DISMISSED', resolved_by_user_id = $1, resolved_at = CURRENT_TIMESTAMP, 
			updated_at = CURRENT_TIMESTAMP
		WHERE id = $2 AND status = 'ACTIVE'
	`

	result, err := s.db.ExecContext(ctx, query, userID, id)
	if err != nil {
		return nil, fmt.Errorf("failed to dismiss inventory alert: %v", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return nil, fmt.Errorf("failed to get rows affected: %v", err)
	}

	if rowsAffected == 0 {
		return nil, fmt.Errorf("inventory alert not found or already resolved")
	}

	return s.GetInventoryAlertByID(ctx, id)
}

func (s *stocktakingService) CheckInventoryLevels(ctx context.Context) error {
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %v", err)
	}
	defer tx.Rollback()

	// Get all active safety stock configurations with current inventory levels
	query := `
		SELECT pss.id, pss.product_id, pss.warehouse_id, pss.safety_stock_level, pss.reorder_quantity,
			   il.quantity_on_hand, il.quantity_available,
			   p.sku, p.name as product_name, w.name as warehouse_name
		FROM product_safety_stocks pss
		JOIN products p ON pss.product_id = p.id
		JOIN warehouses w ON pss.warehouse_id = w.id
		LEFT JOIN inventory_levels il ON pss.product_id = il.product_id AND pss.warehouse_id = il.warehouse_id
		WHERE pss.is_active = true
	`

	rows, err := tx.QueryContext(ctx, query)
	if err != nil {
		return fmt.Errorf("failed to query safety stocks: %v", err)
	}
	defer rows.Close()

	// Get alert type IDs
	var lowStockAlertTypeID, overStockAlertTypeID, reorderAlertTypeID int64
	
	err = tx.QueryRowContext(ctx, "SELECT id FROM inventory_alert_types WHERE name = 'LOW_STOCK'").Scan(&lowStockAlertTypeID)
	if err != nil {
		return fmt.Errorf("failed to get LOW_STOCK alert type ID: %v", err)
	}
	
	err = tx.QueryRowContext(ctx, "SELECT id FROM inventory_alert_types WHERE name = 'OVERSTOCK'").Scan(&overStockAlertTypeID)
	if err != nil {
		return fmt.Errorf("failed to get OVERSTOCK alert type ID: %v", err)
	}
	
	err = tx.QueryRowContext(ctx, "SELECT id FROM inventory_alert_types WHERE name = 'REORDER_POINT'").Scan(&reorderAlertTypeID)
	if err != nil {
		return fmt.Errorf("failed to get REORDER_POINT alert type ID: %v", err)
	}

	alertsCreated := 0
	
	for rows.Next() {
		var safetyStockID, productID, warehouseID int64
		var safetyStockLevel, reorderQuantity int
		var quantityOnHand, quantityAvailable sql.NullInt64
		var productSKU, productName, warehouseName string

		err := rows.Scan(
			&safetyStockID, &productID, &warehouseID, &safetyStockLevel, &reorderQuantity,
			&quantityOnHand, &quantityAvailable,
			&productSKU, &productName, &warehouseName,
		)
		if err != nil {
			return fmt.Errorf("failed to scan safety stock row: %v", err)
		}

		currentStock := int64(0)
		if quantityOnHand.Valid {
			currentStock = quantityOnHand.Int64
		}

		// Check for existing active alerts to avoid duplicates
		var existingAlertCount int
		err = tx.QueryRowContext(ctx, `
			SELECT COUNT(*) FROM inventory_alerts 
			WHERE product_id = $1 AND warehouse_id = $2 AND status = 'ACTIVE'
		`, productID, warehouseID).Scan(&existingAlertCount)
		if err != nil {
			return fmt.Errorf("failed to check existing alerts: %v", err)
		}

		// Skip if there are already active alerts for this product/warehouse
		if existingAlertCount > 0 {
			continue
		}

		// Check different alert conditions
		alerts := []struct {
			alertTypeID    int64
			message        string
			safetyLevel    *int
			condition      bool
		}{
			{
				alertTypeID: lowStockAlertTypeID,
				message:     fmt.Sprintf("Low stock alert: %s in %s has %d units (safety level: %d)", productName, warehouseName, currentStock, safetyStockLevel),
				safetyLevel: &safetyStockLevel,
				condition:   currentStock <= int64(safetyStockLevel),
			},
			{
				alertTypeID: reorderAlertTypeID,
				message:     fmt.Sprintf("Reorder point reached: %s in %s has %d units (reorder quantity: %d)", productName, warehouseName, currentStock, reorderQuantity),
				safetyLevel: &safetyStockLevel,
				condition:   currentStock <= int64(reorderQuantity),
			},
		}

		// Create alerts for conditions that are met
		for _, alert := range alerts {
			if alert.condition {
				_, err = tx.ExecContext(ctx, `
					INSERT INTO inventory_alerts (alert_type_id, product_id, warehouse_id, current_level, 
						safety_level, status, alert_message, triggered_at)
					VALUES ($1, $2, $3, $4, $5, 'ACTIVE', $6, CURRENT_TIMESTAMP)
				`, alert.alertTypeID, productID, warehouseID, currentStock, alert.safetyLevel, alert.message)
				if err != nil {
					return fmt.Errorf("failed to create inventory alert: %v", err)
				}
				alertsCreated++
			}
		}
	}

	// Commit transaction
	err = tx.Commit()
	if err != nil {
		return fmt.Errorf("failed to commit transaction: %v", err)
	}

	fmt.Printf("CheckInventoryLevels completed: %d alerts created\n", alertsCreated)
	return nil
}

func (s *stocktakingService) MarkAlertNotificationSent(ctx context.Context, alertID int64) error {
	query := `
		UPDATE inventory_alerts 
		SET notification_sent = true, notification_sent_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
		WHERE id = $1
	`

	result, err := s.db.ExecContext(ctx, query, alertID)
	if err != nil {
		return fmt.Errorf("failed to mark alert notification as sent: %v", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %v", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("alert not found")
	}

	return nil
}

func (s *stocktakingService) GetStocktakingReport(ctx context.Context, req *models.StocktakingReportRequest) (*models.StocktakingReportResponse, error) {
	// Build base query with filters
	baseQuery := `
		FROM stocktaking_orders so
		JOIN stocktaking_statuses ss ON so.status_id = ss.id
		JOIN warehouses w ON so.warehouse_id = w.id
		WHERE 1=1
	`
	
	var args []interface{}
	argIndex := 1
	
	// Add date range filter
	if req.FromDate != nil {
		baseQuery += fmt.Sprintf(" AND so.created_at >= $%d", argIndex)
		args = append(args, *req.FromDate)
		argIndex++
	}
	
	if req.ToDate != nil {
		baseQuery += fmt.Sprintf(" AND so.created_at <= $%d", argIndex)
		args = append(args, *req.ToDate)
		argIndex++
	}
	
	// Add warehouse filter
	if req.WarehouseID != nil {
		baseQuery += fmt.Sprintf(" AND so.warehouse_id = $%d", argIndex)
		args = append(args, *req.WarehouseID)
		argIndex++
	}
	
	// Add status filter
	if req.Status != "" {
		baseQuery += fmt.Sprintf(" AND ss.name = $%d", argIndex)
		args = append(args, req.Status)
		argIndex++
	}

	// Get summary statistics
	summaryQuery := `
		SELECT 
			COUNT(*) as total_orders,
			COUNT(CASE WHEN ss.name = 'COMPLETED' THEN 1 END) as completed_orders,
			COUNT(CASE WHEN ss.name = 'PLANNED' THEN 1 END) as pending_orders,
			COALESCE(SUM(total_items.items_count), 0) as total_items_counted,
			COALESCE(SUM(total_items.total_adjustments), 0) as total_adjustments,
			COALESCE(SUM(total_items.total_cost_impact), 0) as total_cost_impact,
			COALESCE(SUM(CASE WHEN total_items.total_adjustments > 0 THEN 1 ELSE 0 END), 0) as positive_adjustments,
			COALESCE(SUM(CASE WHEN total_items.total_adjustments < 0 THEN 1 ELSE 0 END), 0) as negative_adjustments
	` + baseQuery + `
		LEFT JOIN (
			SELECT stocktaking_order_id, 
				COUNT(*) as items_count,
				SUM(COALESCE(adjustment_quantity, 0)) as total_adjustments,
				SUM(COALESCE(total_cost_impact, 0)) as total_cost_impact
			FROM stocktaking_items 
			WHERE counted_quantity IS NOT NULL
			GROUP BY stocktaking_order_id
		) total_items ON so.id = total_items.stocktaking_order_id
	`

	var totalOrders, completedOrders, pendingOrders, totalItemsCounted, totalAdjustments, positiveAdjustments, negativeAdjustments int
	var totalCostImpact float64
	err := s.db.QueryRowContext(ctx, summaryQuery, args...).Scan(
		&totalOrders, &completedOrders, &pendingOrders, &totalItemsCounted,
		&totalAdjustments, &totalCostImpact, &positiveAdjustments, &negativeAdjustments,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to get stocktaking report summary: %v", err)
	}

	// Get detailed orders (using StocktakingOrderWithDetails)
	detailQuery := `
		SELECT so.id, so.reference_number, so.title, so.created_at, so.finalized_at,
			   ss.name as status, w.name as warehouse_name
	` + baseQuery + `
		ORDER BY so.created_at DESC
	`

	rows, err := s.db.QueryContext(ctx, detailQuery, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to query stocktaking report details: %v", err)
	}
	defer rows.Close()

	var orders []models.StocktakingOrderWithDetails
	for rows.Next() {
		var order models.StocktakingOrderWithDetails
		var finalizedAt sql.NullTime
		var statusName, warehouseName string

		err := rows.Scan(
			&order.ID, &order.ReferenceNumber, &order.Title, &order.CreatedAt, &finalizedAt,
			&statusName, &warehouseName,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan stocktaking report item: %v", err)
		}

		if finalizedAt.Valid {
			order.FinalizedAt = &finalizedAt.Time
		}

		// Set status and warehouse info
		order.Status = &models.StocktakingStatus{Name: statusName}
		order.Warehouse = &models.Warehouse{Name: warehouseName}

		orders = append(orders, order)
	}

	return &models.StocktakingReportResponse{
		TotalOrders:         totalOrders,
		CompletedOrders:     completedOrders,
		PendingOrders:       pendingOrders,
		TotalItemsCounted:   totalItemsCounted,
		TotalAdjustments:    totalAdjustments,
		TotalCostImpact:     totalCostImpact,
		PositiveAdjustments: positiveAdjustments,
		NegativeAdjustments: negativeAdjustments,
		Orders:              orders,
	}, nil
}

func (s *stocktakingService) GetInventoryAlertReport(ctx context.Context, req *models.InventoryAlertReportRequest) (*models.InventoryAlertReportResponse, error) {
	// Build base query with filters
	baseQuery := `
		FROM inventory_alerts ia
		JOIN inventory_alert_types iat ON ia.alert_type_id = iat.id
		JOIN products p ON ia.product_id = p.id
		JOIN warehouses w ON ia.warehouse_id = w.id
		WHERE 1=1
	`
	
	var args []interface{}
	argIndex := 1
	
	// Add date range filter
	if req.FromDate != nil {
		baseQuery += fmt.Sprintf(" AND ia.created_at >= $%d", argIndex)
		args = append(args, *req.FromDate)
		argIndex++
	}
	
	if req.ToDate != nil {
		baseQuery += fmt.Sprintf(" AND ia.created_at <= $%d", argIndex)
		args = append(args, *req.ToDate)
		argIndex++
	}
	
	// Add warehouse filter
	if req.WarehouseID != nil {
		baseQuery += fmt.Sprintf(" AND ia.warehouse_id = $%d", argIndex)
		args = append(args, *req.WarehouseID)
		argIndex++
	}
	
	// Add status filter
	if req.Status != "" {
		baseQuery += fmt.Sprintf(" AND ia.status = $%d", argIndex)
		args = append(args, req.Status)
		argIndex++
	}

	// Get summary statistics (removed severity filter as it's not in the model)
	summaryQuery := `
		SELECT 
			COUNT(*) as total_alerts,
			COUNT(CASE WHEN ia.status = 'ACTIVE' THEN 1 END) as active_alerts,
			COUNT(CASE WHEN ia.status = 'RESOLVED' THEN 1 END) as resolved_alerts,
			COUNT(CASE WHEN ia.status = 'DISMISSED' THEN 1 END) as dismissed_alerts,
			0 as critical_alerts
	` + baseQuery

	var totalAlerts, activeAlerts, resolvedAlerts, dismissedAlerts, criticalAlerts int
	err := s.db.QueryRowContext(ctx, summaryQuery, args...).Scan(
		&totalAlerts, &activeAlerts, &resolvedAlerts, &dismissedAlerts, &criticalAlerts,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to get inventory alert report summary: %v", err)
	}

	// Get detailed alerts (using InventoryAlertWithDetails)
	detailQuery := `
		SELECT ia.id, ia.created_at, ia.resolved_at, ia.status, ia.alert_message,
			   ia.current_level, ia.safety_level,
			   iat.name as alert_type, p.sku, p.name as product_name, w.name as warehouse_name
	` + baseQuery + `
		ORDER BY ia.created_at DESC
	`

	rows, err := s.db.QueryContext(ctx, detailQuery, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to query inventory alert report details: %v", err)
	}
	defer rows.Close()

	var alerts []models.InventoryAlertWithDetails
	for rows.Next() {
		var alert models.InventoryAlertWithDetails
		var resolvedAt sql.NullTime
		var alertMessage sql.NullString
		var alertType, productSKU, productName, warehouseName string

		err := rows.Scan(
			&alert.ID, &alert.CreatedAt, &resolvedAt, &alert.Status, &alertMessage,
			&alert.CurrentLevel, &alert.SafetyLevel,
			&alertType, &productSKU, &productName, &warehouseName,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan inventory alert report item: %v", err)
		}

		if resolvedAt.Valid {
			alert.ResolvedAt = &resolvedAt.Time
		}

		if alertMessage.Valid {
			alert.AlertMessage = &alertMessage.String
		}

		// Set related entities
		alert.AlertType = &models.InventoryAlertType{Name: alertType}
		alert.Product = &models.Product{SKU: productSKU, Name: productName}
		alert.Warehouse = &models.Warehouse{Name: warehouseName}

		alerts = append(alerts, alert)
	}

	return &models.InventoryAlertReportResponse{
		TotalAlerts:     totalAlerts,
		ActiveAlerts:    activeAlerts,
		ResolvedAlerts:  resolvedAlerts,
		DismissedAlerts: dismissedAlerts,
		CriticalAlerts:  criticalAlerts,
		Alerts:          alerts,
	}, nil
}