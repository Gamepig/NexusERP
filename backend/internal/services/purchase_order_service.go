package services

import (
	"context"
	"database/sql"
	"fmt"

	"nexus-erp/backend/internal/models"

	"github.com/jmoiron/sqlx"
)

type purchaseOrderService struct {
	db               *sqlx.DB
	inventoryService InventoryService
}

func NewPurchaseOrderService(db *sqlx.DB, inventoryService InventoryService) PurchaseOrderService {
	return &purchaseOrderService{
		db:               db,
		inventoryService: inventoryService,
	}
}

func (s *purchaseOrderService) CreatePurchaseOrder(ctx context.Context, req models.CreatePurchaseOrderRequest, userID int64) (*models.PurchaseOrderWithDetails, error) {
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to begin transaction: %v", err)
	}
	defer tx.Rollback()

	// Set default currency if not provided
	currency := req.Currency
	if currency == "" {
		currency = "USD"
	}

	// Create purchase order
	poQuery := `
		INSERT INTO purchase_orders (supplier_id, order_date, expected_delivery_date, delivery_address, currency, payment_terms, notes, created_by_user_id)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING id, po_number, supplier_id, status, order_date, expected_delivery_date, delivery_address, subtotal, tax_amount, total_amount, currency, payment_terms, notes, created_by_user_id, approved_by_user_id, approved_at, created_at, updated_at
	`

	var po models.PurchaseOrder
	var paymentTerms, notes sql.NullString
	var approvedByUserID sql.NullInt64
	var approvedAt sql.NullTime

	err = tx.QueryRowContext(ctx, poQuery, req.SupplierID, req.OrderDate, req.ExpectedDeliveryDate, req.DeliveryAddress, currency, nullStringFromString(req.PaymentTerms), nullStringFromString(req.Notes), userID).
		Scan(&po.ID, &po.PONumber, &po.SupplierID, &po.Status, &po.OrderDate, &po.ExpectedDeliveryDate, &po.DeliveryAddress, &po.Subtotal, &po.TaxAmount, &po.TotalAmount, &po.Currency, &paymentTerms, &notes, &po.CreatedByUserID, &approvedByUserID, &approvedAt, &po.CreatedAt, &po.UpdatedAt)

	if err != nil {
		return nil, fmt.Errorf("failed to create purchase order: %v", err)
	}

	// Convert nullable fields
	po.PaymentTerms = nullStringToPointer(paymentTerms)
	po.Notes = nullStringToPointer(notes)
	po.ApprovedByUserID = nullInt64ToPointer(approvedByUserID)
	po.ApprovedAt = nullTimeToPointer(approvedAt)

	// Create purchase order items
	for _, item := range req.Items {
		lineTotal := float64(item.Quantity) * item.UnitPrice
		itemQuery := `
			INSERT INTO purchase_order_items (purchase_order_id, product_id, quantity, unit_price, line_total, warehouse_id, notes)
			VALUES ($1, $2, $3, $4, $5, $6, $7)
		`

		_, err = tx.ExecContext(ctx, itemQuery, po.ID, item.ProductID, item.Quantity, item.UnitPrice, lineTotal, item.WarehouseID, nullStringFromString(item.Notes))
		if err != nil {
			return nil, fmt.Errorf("failed to create purchase order item: %v", err)
		}
	}

	// Commit transaction
	if err = tx.Commit(); err != nil {
		return nil, fmt.Errorf("failed to commit transaction: %v", err)
	}

	// Return the created purchase order with details
	return s.GetPurchaseOrder(ctx, po.ID)
}

func (s *purchaseOrderService) GetPurchaseOrders(ctx context.Context, page, limit int, search string, status string, supplierID *int64) ([]models.PurchaseOrderWithDetails, int, error) {
	offset := (page - 1) * limit
	
	whereClause := "WHERE 1=1"
	args := []interface{}{}
	argIndex := 1

	if search != "" {
		whereClause += fmt.Sprintf(" AND (po.po_number ILIKE $%d OR s.name ILIKE $%d)", argIndex, argIndex)
		args = append(args, "%"+search+"%")
		argIndex++
	}

	if status != "" {
		whereClause += fmt.Sprintf(" AND po.status = $%d", argIndex)
		args = append(args, status)
		argIndex++
	}

	if supplierID != nil {
		whereClause += fmt.Sprintf(" AND po.supplier_id = $%d", argIndex)
		args = append(args, *supplierID)
		argIndex++
	}

	// Count total records
	countQuery := fmt.Sprintf(`
		SELECT COUNT(*) 
		FROM purchase_orders po 
		LEFT JOIN suppliers s ON po.supplier_id = s.id 
		%s
	`, whereClause)

	var total int
	err := s.db.QueryRowContext(ctx, countQuery, args...).Scan(&total)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to count purchase orders: %v", err)
	}

	// Get purchase orders
	query := fmt.Sprintf(`
		SELECT po.id, po.po_number, po.supplier_id, po.status, po.order_date, po.expected_delivery_date, 
			   po.delivery_address, po.subtotal, po.tax_amount, po.total_amount, po.currency, po.payment_terms, 
			   po.notes, po.created_by_user_id, po.approved_by_user_id, po.approved_at, po.created_at, po.updated_at,
			   s.id, s.code, s.name, s.contact_person, s.email, s.phone, s.address, s.tax_number, s.payment_terms, s.credit_limit, s.is_active, s.notes, s.created_at, s.updated_at
		FROM purchase_orders po 
		LEFT JOIN suppliers s ON po.supplier_id = s.id 
		%s
		ORDER BY po.created_at DESC
		LIMIT $%d OFFSET $%d
	`, whereClause, argIndex, argIndex+1)

	args = append(args, limit, offset)
	
	rows, err := s.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to get purchase orders: %v", err)
	}
	defer rows.Close()

	var purchaseOrders []models.PurchaseOrderWithDetails
	for rows.Next() {
		var po models.PurchaseOrderWithDetails
		var paymentTerms, notes sql.NullString
		var approvedByUserID sql.NullInt64
		var approvedAt sql.NullTime

		// Supplier fields
		var supplier models.Supplier
		var supplierContactPerson, supplierEmail, supplierPhone, supplierTaxNumber, supplierPaymentTerms, supplierNotes sql.NullString
		var supplierCreditLimit sql.NullFloat64

		err := rows.Scan(&po.ID, &po.PONumber, &po.SupplierID, &po.Status, &po.OrderDate, &po.ExpectedDeliveryDate, 
			&po.DeliveryAddress, &po.Subtotal, &po.TaxAmount, &po.TotalAmount, &po.Currency, &paymentTerms, 
			&notes, &po.CreatedByUserID, &approvedByUserID, &approvedAt, &po.CreatedAt, &po.UpdatedAt,
			&supplier.ID, &supplier.Code, &supplier.Name, &supplierContactPerson, &supplierEmail, &supplierPhone, 
			&supplier.Address, &supplierTaxNumber, &supplierPaymentTerms, &supplierCreditLimit, &supplier.IsActive, 
			&supplierNotes, &supplier.CreatedAt, &supplier.UpdatedAt)

		if err != nil {
			return nil, 0, fmt.Errorf("failed to scan purchase order: %v", err)
		}

		// Convert nullable fields
		po.PaymentTerms = nullStringToPointer(paymentTerms)
		po.Notes = nullStringToPointer(notes)
		po.ApprovedByUserID = nullInt64ToPointer(approvedByUserID)
		po.ApprovedAt = nullTimeToPointer(approvedAt)

		// Convert supplier nullable fields
		supplier.ContactPerson = nullStringToPointer(supplierContactPerson)
		supplier.Email = nullStringToPointer(supplierEmail)
		supplier.Phone = nullStringToPointer(supplierPhone)
		supplier.TaxNumber = nullStringToPointer(supplierTaxNumber)
		supplier.PaymentTerms = nullStringToPointer(supplierPaymentTerms)
		supplier.Notes = nullStringToPointer(supplierNotes)
		supplier.CreditLimit = nullFloat64ToPointer(supplierCreditLimit)

		po.Supplier = &supplier
		purchaseOrders = append(purchaseOrders, po)
	}

	return purchaseOrders, total, nil
}

func (s *purchaseOrderService) GetPurchaseOrder(ctx context.Context, id int64) (*models.PurchaseOrderWithDetails, error) {
	// Get purchase order with supplier details
	poQuery := `
		SELECT po.id, po.po_number, po.supplier_id, po.status, po.order_date, po.expected_delivery_date, 
			   po.delivery_address, po.subtotal, po.tax_amount, po.total_amount, po.currency, po.payment_terms, 
			   po.notes, po.created_by_user_id, po.approved_by_user_id, po.approved_at, po.created_at, po.updated_at,
			   s.id, s.code, s.name, s.contact_person, s.email, s.phone, s.address, s.tax_number, s.payment_terms, s.credit_limit, s.is_active, s.notes, s.created_at, s.updated_at
		FROM purchase_orders po 
		LEFT JOIN suppliers s ON po.supplier_id = s.id 
		WHERE po.id = $1
	`

	var po models.PurchaseOrderWithDetails
	var paymentTerms, notes sql.NullString
	var approvedByUserID sql.NullInt64
	var approvedAt sql.NullTime

	// Supplier fields
	var supplier models.Supplier
	var supplierContactPerson, supplierEmail, supplierPhone, supplierTaxNumber, supplierPaymentTerms, supplierNotes sql.NullString
	var supplierCreditLimit sql.NullFloat64

	err := s.db.QueryRowContext(ctx, poQuery, id).
		Scan(&po.ID, &po.PONumber, &po.SupplierID, &po.Status, &po.OrderDate, &po.ExpectedDeliveryDate, 
			&po.DeliveryAddress, &po.Subtotal, &po.TaxAmount, &po.TotalAmount, &po.Currency, &paymentTerms, 
			&notes, &po.CreatedByUserID, &approvedByUserID, &approvedAt, &po.CreatedAt, &po.UpdatedAt,
			&supplier.ID, &supplier.Code, &supplier.Name, &supplierContactPerson, &supplierEmail, &supplierPhone, 
			&supplier.Address, &supplierTaxNumber, &supplierPaymentTerms, &supplierCreditLimit, &supplier.IsActive, 
			&supplierNotes, &supplier.CreatedAt, &supplier.UpdatedAt)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("purchase order not found")
		}
		return nil, fmt.Errorf("failed to get purchase order: %v", err)
	}

	// Convert nullable fields
	po.PaymentTerms = nullStringToPointer(paymentTerms)
	po.Notes = nullStringToPointer(notes)
	po.ApprovedByUserID = nullInt64ToPointer(approvedByUserID)
	po.ApprovedAt = nullTimeToPointer(approvedAt)

	// Convert supplier nullable fields
	supplier.ContactPerson = nullStringToPointer(supplierContactPerson)
	supplier.Email = nullStringToPointer(supplierEmail)
	supplier.Phone = nullStringToPointer(supplierPhone)
	supplier.TaxNumber = nullStringToPointer(supplierTaxNumber)
	supplier.PaymentTerms = nullStringToPointer(supplierPaymentTerms)
	supplier.Notes = nullStringToPointer(supplierNotes)
	supplier.CreditLimit = nullFloat64ToPointer(supplierCreditLimit)

	po.Supplier = &supplier

	// Get purchase order items
	itemsQuery := `
		SELECT poi.id, poi.purchase_order_id, poi.product_id, poi.quantity, poi.unit_price, poi.line_total, 
			   poi.quantity_received, poi.warehouse_id, poi.notes, poi.created_at, poi.updated_at,
			   p.id, p.sku, p.name, p.description, p.category_id, p.unit_of_measure, p.weight, p.dimensions, 
			   p.cost_price, p.selling_price, p.barcode, p.image_url, p.is_active, p.attributes, p.supplier_id, p.reorder_point, p.created_at, p.updated_at
		FROM purchase_order_items poi
		LEFT JOIN products p ON poi.product_id = p.id
		WHERE poi.purchase_order_id = $1
		ORDER BY poi.id
	`

	itemRows, err := s.db.QueryContext(ctx, itemsQuery, id)
	if err != nil {
		return nil, fmt.Errorf("failed to get purchase order items: %v", err)
	}
	defer itemRows.Close()

	var items []models.PurchaseOrderItemWithDetails
	for itemRows.Next() {
		var item models.PurchaseOrderItemWithDetails
		var itemNotes sql.NullString

		// Product fields
		var product models.Product
		var productDescription, productBarcode, productImageURL sql.NullString
		var productCategoryID, productSupplierID sql.NullInt64
		var productWeight, productCostPrice, productSellingPrice sql.NullFloat64

		err := itemRows.Scan(&item.ID, &item.PurchaseOrderID, &item.ProductID, &item.Quantity, &item.UnitPrice, &item.LineTotal, 
			&item.QuantityReceived, &item.WarehouseID, &itemNotes, &item.CreatedAt, &item.UpdatedAt,
			&product.ID, &product.SKU, &product.Name, &productDescription, &productCategoryID, &product.UnitOfMeasure, 
			&productWeight, &product.Dimensions, &productCostPrice, &productSellingPrice, &productBarcode, 
			&productImageURL, &product.IsActive, &product.Attributes, &productSupplierID, &product.ReorderPoint, &product.CreatedAt, &product.UpdatedAt)

		if err != nil {
			return nil, fmt.Errorf("failed to scan purchase order item: %v", err)
		}

		// Convert nullable fields
		item.Notes = nullStringToPointer(itemNotes)

		// Convert product nullable fields
		product.Description = nullStringToPointer(productDescription)
		product.CategoryID = nullInt64ToPointer(productCategoryID)
		product.Weight = nullFloat64ToPointer(productWeight)
		product.CostPrice = nullFloat64ToPointer(productCostPrice)
		product.SellingPrice = nullFloat64ToPointer(productSellingPrice)
		product.Barcode = nullStringToPointer(productBarcode)
		product.ImageURL = nullStringToPointer(productImageURL)
		product.SupplierID = nullInt64ToPointer(productSupplierID)

		item.Product = &product
		items = append(items, item)
	}

	po.Items = items
	return &po, nil
}

func (s *purchaseOrderService) UpdatePurchaseOrder(ctx context.Context, id int64, req models.UpdatePurchaseOrderRequest, userID int64) (*models.PurchaseOrderWithDetails, error) {
	// Check if PO exists and can be updated
	existingPO, err := s.GetPurchaseOrder(ctx, id)
	if err != nil {
		return nil, err
	}

	// Only allow updates for draft and pending approval status
	if existingPO.Status != "draft" && existingPO.Status != "pending_approval" {
		return nil, fmt.Errorf("cannot update purchase order with status: %s", existingPO.Status)
	}

	// Validate status transition
	if req.Status != "" {
		if err := validateStatusTransition(existingPO.Status, req.Status); err != nil {
			return nil, fmt.Errorf("invalid status transition: %v", err)
		}
	} else {
		// If status not provided, keep existing status
		req.Status = existingPO.Status
	}

	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to begin transaction: %v", err)
	}
	defer tx.Rollback()

	// Update purchase order
	poQuery := `
		UPDATE purchase_orders 
		SET supplier_id = $2, order_date = $3, expected_delivery_date = $4, delivery_address = $5, 
			currency = $6, payment_terms = $7, notes = $8, status = $9, updated_at = CURRENT_TIMESTAMP
		WHERE id = $1
	`

	_, err = tx.ExecContext(ctx, poQuery, id, req.SupplierID, req.OrderDate, req.ExpectedDeliveryDate, req.DeliveryAddress, req.Currency, nullStringFromString(req.PaymentTerms), nullStringFromString(req.Notes), req.Status)
	if err != nil {
		return nil, fmt.Errorf("failed to update purchase order: %v", err)
	}

	// Delete existing items
	_, err = tx.ExecContext(ctx, "DELETE FROM purchase_order_items WHERE purchase_order_id = $1", id)
	if err != nil {
		return nil, fmt.Errorf("failed to delete existing items: %v", err)
	}

	// Create new items
	for _, item := range req.Items {
		lineTotal := float64(item.Quantity) * item.UnitPrice
		itemQuery := `
			INSERT INTO purchase_order_items (purchase_order_id, product_id, quantity, unit_price, line_total, warehouse_id, notes)
			VALUES ($1, $2, $3, $4, $5, $6, $7)
		`

		_, err = tx.ExecContext(ctx, itemQuery, id, item.ProductID, item.Quantity, item.UnitPrice, lineTotal, item.WarehouseID, nullStringFromString(item.Notes))
		if err != nil {
			return nil, fmt.Errorf("failed to create purchase order item: %v", err)
		}
	}

	// Commit transaction
	if err = tx.Commit(); err != nil {
		return nil, fmt.Errorf("failed to commit transaction: %v", err)
	}

	// Return the updated purchase order with details
	return s.GetPurchaseOrder(ctx, id)
}

func (s *purchaseOrderService) DeletePurchaseOrder(ctx context.Context, id int64) error {
	// Check if PO exists and can be deleted
	existingPO, err := s.GetPurchaseOrder(ctx, id)
	if err != nil {
		return err
	}

	// Only allow deletion for draft status
	if existingPO.Status != "draft" {
		return fmt.Errorf("cannot delete purchase order with status: %s", existingPO.Status)
	}

	query := `DELETE FROM purchase_orders WHERE id = $1`

	result, err := s.db.ExecContext(ctx, query, id)
	if err != nil {
		return fmt.Errorf("failed to delete purchase order: %v", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %v", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("purchase order not found")
	}

	return nil
}

func (s *purchaseOrderService) ApprovePurchaseOrder(ctx context.Context, id int64, req models.ApprovePurchaseOrderRequest, userID int64) (*models.PurchaseOrderWithDetails, error) {
	// Check if PO exists and can be approved
	existingPO, err := s.GetPurchaseOrder(ctx, id)
	if err != nil {
		return nil, err
	}

	// Only allow approval for pending approval status
	if existingPO.Status != "pending_approval" {
		return nil, fmt.Errorf("cannot approve purchase order with status: %s", existingPO.Status)
	}

	query := `
		UPDATE purchase_orders 
		SET status = 'approved', approved_by_user_id = $2, approved_at = CURRENT_TIMESTAMP, 
			notes = COALESCE(notes, '') || CASE WHEN LENGTH(COALESCE(notes, '')) > 0 THEN E'\n' ELSE '' END || $3,
			updated_at = CURRENT_TIMESTAMP
		WHERE id = $1
	`

	_, err = s.db.ExecContext(ctx, query, id, userID, fmt.Sprintf("Approved by user %d: %s", userID, req.Notes))
	if err != nil {
		return nil, fmt.Errorf("failed to approve purchase order: %v", err)
	}

	return s.GetPurchaseOrder(ctx, id)
}

func (s *purchaseOrderService) ReceivePurchaseOrder(ctx context.Context, id int64, req models.ReceivePurchaseOrderRequest, userID int64) (*models.PurchaseOrderWithDetails, error) {
	// Check if PO exists and can be received
	existingPO, err := s.GetPurchaseOrder(ctx, id)
	if err != nil {
		return nil, err
	}

	// Only allow receiving for approved status
	if existingPO.Status != "approved" && existingPO.Status != "partially_received" {
		return nil, fmt.Errorf("cannot receive purchase order with status: %s", existingPO.Status)
	}

	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to begin transaction: %v", err)
	}
	defer tx.Rollback()

	// Update received quantities and create inventory transactions
	for _, item := range req.Items {
		// Update purchase order item
		updateItemQuery := `
			UPDATE purchase_order_items 
			SET quantity_received = quantity_received + $2, updated_at = CURRENT_TIMESTAMP
			WHERE id = $1 AND purchase_order_id = $3
		`

		_, err = tx.ExecContext(ctx, updateItemQuery, item.PurchaseOrderItemID, item.QuantityReceived, id)
		if err != nil {
			return nil, fmt.Errorf("failed to update purchase order item: %v", err)
		}

		// Get item details for inventory transaction
		itemQuery := `
			SELECT product_id, warehouse_id, unit_price 
			FROM purchase_order_items 
			WHERE id = $1
		`

		var productID int64
		var warehouseID sql.NullInt64
		var unitPrice float64

		err = tx.QueryRowContext(ctx, itemQuery, item.PurchaseOrderItemID).Scan(&productID, &warehouseID, &unitPrice)
		if err != nil {
			return nil, fmt.Errorf("failed to get item details: %v", err)
		}

		// Use default warehouse if not specified
		targetWarehouseID := int64(1) // Default warehouse
		if warehouseID.Valid {
			targetWarehouseID = warehouseID.Int64
		}

		// Update inventory using InventoryService
		referenceDocumentType := "purchase_order"
		err = s.inventoryService.UpdateInventoryLevel(ctx, productID, targetWarehouseID, item.QuantityReceived, &unitPrice, &referenceDocumentType, &id, userID, &req.Notes)
		if err != nil {
			return nil, fmt.Errorf("failed to update inventory: %v", err)
		}
	}

	// Check if all items are fully received
	checkQuery := `
		SELECT COUNT(*) FROM purchase_order_items 
		WHERE purchase_order_id = $1 AND quantity_received < quantity
	`

	var pendingCount int
	err = tx.QueryRowContext(ctx, checkQuery, id).Scan(&pendingCount)
	if err != nil {
		return nil, fmt.Errorf("failed to check pending items: %v", err)
	}

	// Update PO status
	newStatus := "partially_received"
	if pendingCount == 0 {
		newStatus = "received"
	}

	statusQuery := `
		UPDATE purchase_orders 
		SET status = $2, 
			notes = COALESCE(notes, '') || CASE WHEN LENGTH(COALESCE(notes, '')) > 0 THEN E'\n' ELSE '' END || $3,
			updated_at = CURRENT_TIMESTAMP
		WHERE id = $1
	`

	_, err = tx.ExecContext(ctx, statusQuery, id, newStatus, fmt.Sprintf("Received by user %d: %s", userID, req.Notes))
	if err != nil {
		return nil, fmt.Errorf("failed to update purchase order status: %v", err)
	}

	// Commit transaction
	if err = tx.Commit(); err != nil {
		return nil, fmt.Errorf("failed to commit transaction: %v", err)
	}

	return s.GetPurchaseOrder(ctx, id)
}

func (s *purchaseOrderService) GetPurchaseOrderByPONumber(ctx context.Context, poNumber string) (*models.PurchaseOrderWithDetails, error) {
	// Get purchase order ID by PO number
	query := `SELECT id FROM purchase_orders WHERE po_number = $1`
	
	var id int64
	err := s.db.QueryRowContext(ctx, query, poNumber).Scan(&id)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("purchase order not found")
		}
		return nil, fmt.Errorf("failed to get purchase order: %v", err)
	}

	return s.GetPurchaseOrder(ctx, id)
}

// validateStatusTransition validates if the status transition is allowed
func validateStatusTransition(fromStatus, toStatus string) error {
	// Define allowed transitions based on state machine
	allowedTransitions := map[string][]string{
		"draft":               {"pending_approval", "cancelled"},
		"pending_approval":    {"approved", "draft", "cancelled"},
		"approved":           {"partially_received", "received", "cancelled"},
		"partially_received": {"received", "cancelled"},
		"received":           {}, // Terminal state
		"cancelled":          {}, // Terminal state
	}

	allowed, exists := allowedTransitions[fromStatus]
	if !exists {
		return fmt.Errorf("unknown status: %s", fromStatus)
	}

	for _, validStatus := range allowed {
		if validStatus == toStatus {
			return nil
		}
	}

	return fmt.Errorf("cannot transition from %s to %s", fromStatus, toStatus)
}

