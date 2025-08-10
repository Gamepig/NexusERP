package services

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strings"

	"nexus-erp/backend/internal/models"

	"github.com/jmoiron/sqlx"
)

type SalesOrderService struct {
	db               *sqlx.DB
	inventoryService InventoryService
}

func NewSalesOrderService(db *sqlx.DB, inventoryService InventoryService) *SalesOrderService {
	return &SalesOrderService{
		db:               db,
		inventoryService: inventoryService,
	}
}

// CreateSalesOrder creates a new sales order with items
func (s *SalesOrderService) CreateSalesOrder(req *models.CreateSalesOrderRequest, userID int64) (*models.SalesOrderWithDetails, error) {
	tx, err := s.db.Beginx()
	if err != nil {
		return nil, fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	// Validate customer exists
	var customerExists bool
	err = tx.QueryRow("SELECT EXISTS(SELECT 1 FROM customers WHERE id = $1 AND deleted_at IS NULL)", req.CustomerID).Scan(&customerExists)
	if err != nil {
		return nil, fmt.Errorf("failed to check customer existence: %w", err)
	}
	if !customerExists {
		return nil, errors.New("customer not found")
	}

	// Validate business unit if provided
	if req.BusinessUnitID != nil {
		var unitExists bool
		err = tx.QueryRow("SELECT EXISTS(SELECT 1 FROM business_units WHERE id = $1)", *req.BusinessUnitID).Scan(&unitExists)
		if err != nil {
			return nil, fmt.Errorf("failed to check business unit existence: %w", err)
		}
		if !unitExists {
			return nil, errors.New("business unit not found")
		}
	}

	// Validate currency if provided
	if req.CurrencyID != nil {
		var currencyExists bool
		err = tx.QueryRow("SELECT EXISTS(SELECT 1 FROM currencies WHERE id = $1 AND is_active = true)", *req.CurrencyID).Scan(&currencyExists)
		if err != nil {
			return nil, fmt.Errorf("failed to check currency existence: %w", err)
		}
		if !currencyExists {
			return nil, errors.New("currency not found or inactive")
		}
	}

	// Validate all products exist - 優化為單一查詢避免 N+1 問題
	if len(req.Items) > 0 {
		// 收集所有產品 ID
		productIDs := make([]interface{}, len(req.Items))
		for i, item := range req.Items {
			productIDs[i] = item.ProductID
		}

		// 建立 IN 查詢的佔位符
		placeholders := make([]string, len(productIDs))
		for i := range placeholders {
			placeholders[i] = fmt.Sprintf("$%d", i+1)
		}

		// 使用單一查詢驗證所有產品
		query := fmt.Sprintf("SELECT id FROM products WHERE id IN (%s) AND is_active = true", strings.Join(placeholders, ","))

		var validProductIDs []int64
		err = tx.Select(&validProductIDs, query, productIDs...)
		if err != nil {
			return nil, fmt.Errorf("failed to validate products: %w", err)
		}

		// 檢查是否所有產品都有效
		if len(validProductIDs) != len(req.Items) {
			// 找出無效的產品 ID
			validIDMap := make(map[int64]bool)
			for _, id := range validProductIDs {
				validIDMap[id] = true
			}

			for _, item := range req.Items {
				if !validIDMap[item.ProductID] {
					return nil, fmt.Errorf("product with ID %d not found or inactive", item.ProductID)
				}
			}
		}
	}

	// Calculate total amount
	var totalAmount float64
	for _, item := range req.Items {
		totalAmount += item.Quantity * item.UnitPrice
	}

	// Insert sales order
	salesOrder := &models.SalesOrder{}
	query := `
        INSERT INTO sales_orders (
            company_id, customer_id, business_unit_id, order_date, total_amount, currency_id, user_id, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, order_number, company_id, customer_id, business_unit_id, status, user_id, order_date, total_amount, currency_id, created_at, updated_at`

	err = tx.QueryRowx(query,
		req.CompanyID,
		req.CustomerID,
		req.BusinessUnitID,
		req.OrderDate,
		totalAmount,
		req.CurrencyID,
		userID,
		models.SalesOrderStatusDraft,
	).StructScan(salesOrder)
	if err != nil {
		return nil, fmt.Errorf("failed to create sales order: %w", err)
	}

	// Insert sales order items
	items := make([]models.SalesOrderItemWithDetails, len(req.Items))
	for i, itemReq := range req.Items {
		totalPrice := itemReq.Quantity * itemReq.UnitPrice

		item := &models.SalesOrderItem{}
		itemQuery := `
			INSERT INTO sales_order_items (
				sales_order_id, product_id, quantity, unit_price, total_price, status
			) VALUES ($1, $2, $3, $4, $5, $6)
			RETURNING id, sales_order_id, product_id, quantity, unit_price, total_price, status, created_at, updated_at`

		err = tx.QueryRowx(itemQuery,
			salesOrder.ID,
			itemReq.ProductID,
			itemReq.Quantity,
			itemReq.UnitPrice,
			totalPrice,
			models.SalesOrderItemStatusDraft,
		).StructScan(item)
		if err != nil {
			return nil, fmt.Errorf("failed to create sales order item: %w", err)
		}

		items[i] = models.SalesOrderItemWithDetails{
			SalesOrderItem: *item,
		}
	}

	if err = tx.Commit(); err != nil {
		return nil, fmt.Errorf("failed to commit transaction: %w", err)
	}

	// Load additional details
	result := &models.SalesOrderWithDetails{
		SalesOrder: *salesOrder,
		Items:      items,
	}

	// Load customer details
	if customer, err := s.getCustomerByID(salesOrder.CustomerID); err == nil {
		result.Customer = customer
	}

	// Load product details for items
	for i := range result.Items {
		if product, err := s.getProductByID(result.Items[i].ProductID); err == nil {
			result.Items[i].Product = product
		}
	}

	return result, nil
}

// GetSalesOrderByID retrieves a sales order by ID with all details
func (s *SalesOrderService) GetSalesOrderByID(id int64) (*models.SalesOrderWithDetails, error) {
	// Get sales order
	salesOrder := &models.SalesOrder{}
	query := `SELECT id, order_number, customer_id, business_unit_id, status, user_id, order_date, total_amount, currency_id, created_at, updated_at 
			  FROM sales_orders WHERE id = $1`

	err := s.db.QueryRowx(query, id).StructScan(salesOrder)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, errors.New("sales order not found")
		}
		return nil, fmt.Errorf("failed to get sales order: %w", err)
	}

	// Get sales order items
	items := []models.SalesOrderItemWithDetails{}
	itemQuery := `SELECT id, sales_order_id, product_id, quantity, unit_price, total_price, status, created_at, updated_at 
				  FROM sales_order_items WHERE sales_order_id = $1 ORDER BY id`

	rows, err := s.db.Queryx(itemQuery, id)
	if err != nil {
		return nil, fmt.Errorf("failed to get sales order items: %w", err)
	}
	defer rows.Close()

	for rows.Next() {
		var item models.SalesOrderItem
		if err := rows.StructScan(&item); err != nil {
			return nil, fmt.Errorf("failed to scan sales order item: %w", err)
		}

		itemWithDetails := models.SalesOrderItemWithDetails{
			SalesOrderItem: item,
		}

		// Load product details
		if product, err := s.getProductByID(item.ProductID); err == nil {
			itemWithDetails.Product = product
		}

		items = append(items, itemWithDetails)
	}

	result := &models.SalesOrderWithDetails{
		SalesOrder: *salesOrder,
		Items:      items,
	}

	// Load customer details
	if customer, err := s.getCustomerByID(salesOrder.CustomerID); err == nil {
		result.Customer = customer
	}

	return result, nil
}

// ListSalesOrders retrieves a paginated list of sales orders
func (s *SalesOrderService) ListSalesOrders(params *models.SalesOrderQueryParams) (*models.SalesOrderListResponse, error) {
	var whereConditions []string
	var args []interface{}
	argCount := 0

	// Build WHERE conditions
	if params.CustomerID != nil {
		argCount++
		whereConditions = append(whereConditions, fmt.Sprintf("so.customer_id = $%d", argCount))
		args = append(args, *params.CustomerID)
	}

	if params.Status != "" {
		argCount++
		whereConditions = append(whereConditions, fmt.Sprintf("so.status = $%d", argCount))
		args = append(args, params.Status)
	}

	if params.BusinessUnitID != nil {
		argCount++
		whereConditions = append(whereConditions, fmt.Sprintf("so.business_unit_id = $%d", argCount))
		args = append(args, *params.BusinessUnitID)
	}

	if params.DateFrom != "" {
		argCount++
		whereConditions = append(whereConditions, fmt.Sprintf("so.order_date >= $%d", argCount))
		args = append(args, params.DateFrom)
	}

	if params.DateTo != "" {
		argCount++
		whereConditions = append(whereConditions, fmt.Sprintf("so.order_date <= $%d", argCount))
		args = append(args, params.DateTo)
	}

	whereClause := ""
	if len(whereConditions) > 0 {
		whereClause = "WHERE " + strings.Join(whereConditions, " AND ")
	}

	// Build ORDER BY clause
	orderBy := "so.created_at DESC" // default
	if params.SortBy != "" && params.SortOrder != "" {
		validSortFields := map[string]bool{
			"order_number": true,
			"order_date":   true,
			"total_amount": true,
			"status":       true,
			"created_at":   true,
		}
		if validSortFields[params.SortBy] {
			orderBy = fmt.Sprintf("so.%s %s", params.SortBy, strings.ToUpper(params.SortOrder))
		}
	}

	// Calculate offset
	offset := (params.Page - 1) * params.PageSize

	// Count total records
	var total int64
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM sales_orders so %s", whereClause)
	err := s.db.QueryRow(countQuery, args...).Scan(&total)
	if err != nil {
		return nil, fmt.Errorf("failed to count sales orders: %w", err)
	}

	// Get sales orders with basic customer info
	query := fmt.Sprintf(`
		SELECT 
			so.id, so.order_number, so.customer_id, so.business_unit_id, so.status, 
			so.user_id, so.order_date, so.total_amount, so.currency_id, so.created_at, so.updated_at,
			c.name as customer_name, c.customer_code
		FROM sales_orders so
		LEFT JOIN customers c ON so.customer_id = c.id
		%s
		ORDER BY %s
		LIMIT $%d OFFSET $%d`,
		whereClause, orderBy, argCount+1, argCount+2)

	args = append(args, params.PageSize, offset)

	rows, err := s.db.Queryx(query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to get sales orders: %w", err)
	}
	defer rows.Close()

	var salesOrders []models.SalesOrderWithDetails
	for rows.Next() {
		var so models.SalesOrder
		var customerName, customerCode sql.NullString

		err := rows.Scan(
			&so.ID, &so.OrderNumber, &so.CustomerID, &so.BusinessUnitID, &so.Status,
			&so.UserID, &so.OrderDate, &so.TotalAmount, &so.CurrencyID, &so.CreatedAt, &so.UpdatedAt,
			&customerName, &customerCode,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan sales order: %w", err)
		}

		soWithDetails := models.SalesOrderWithDetails{
			SalesOrder: so,
		}

		// Add basic customer info if available
		if customerName.Valid && customerCode.Valid {
			soWithDetails.Customer = &models.Customer{
				ID:           so.CustomerID,
				Name:         customerName.String,
				CustomerCode: customerCode.String,
			}
		}

		salesOrders = append(salesOrders, soWithDetails)
	}

	// Calculate total pages
	totalPages := int((total + int64(params.PageSize) - 1) / int64(params.PageSize))

	return &models.SalesOrderListResponse{
		SalesOrders: salesOrders,
		Total:       total,
		Page:        params.Page,
		PageSize:    params.PageSize,
		Pages:       totalPages,
	}, nil
}

// UpdateSalesOrderStatus updates the status of a sales order
func (s *SalesOrderService) UpdateSalesOrderStatus(id int64, status string, userID int64) error {
	// Validate status
	validStatuses := map[string]bool{
		models.SalesOrderStatusDraft:      true,
		models.SalesOrderStatusProcessing: true,
		models.SalesOrderStatusShipped:    true,
		models.SalesOrderStatusCompleted:  true,
		models.SalesOrderStatusCancelled:  true,
	}
	if !validStatuses[status] {
		return errors.New("invalid sales order status")
	}

	// Update sales order status
	query := `UPDATE sales_orders SET status = $1, updated_at = NOW() WHERE id = $2`
	result, err := s.db.Exec(query, status, id)
	if err != nil {
		return fmt.Errorf("failed to update sales order status: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}
	if rowsAffected == 0 {
		return errors.New("sales order not found")
	}

	return nil
}

// ShipSalesOrder processes the shipping of a sales order
func (s *SalesOrderService) ShipSalesOrder(id int64, req *models.ShipSalesOrderRequest, userID int64) error {
	tx, err := s.db.Beginx()
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	// Get sales order
	var salesOrder models.SalesOrder
	query := `SELECT id, order_number, customer_id, status FROM sales_orders WHERE id = $1`
	err = tx.QueryRowx(query, id).StructScan(&salesOrder)
	if err != nil {
		if err == sql.ErrNoRows {
			return errors.New("sales order not found")
		}
		return fmt.Errorf("failed to get sales order: %w", err)
	}

	// Check if order can be shipped
	if salesOrder.Status != models.SalesOrderStatusDraft && salesOrder.Status != models.SalesOrderStatusProcessing {
		return fmt.Errorf("cannot ship sales order with status: %s", salesOrder.Status)
	}

	// Process each item shipment
	for _, shipItem := range req.Items {
		// Validate sales order item exists and belongs to this order
		var item models.SalesOrderItem
		itemQuery := `SELECT id, sales_order_id, product_id, quantity, status 
					  FROM sales_order_items 
					  WHERE id = $1 AND sales_order_id = $2`
		err = tx.QueryRowx(itemQuery, shipItem.SalesOrderItemID, id).StructScan(&item)
		if err != nil {
			if err == sql.ErrNoRows {
				return fmt.Errorf("sales order item %d not found", shipItem.SalesOrderItemID)
			}
			return fmt.Errorf("failed to get sales order item: %w", err)
		}

		// Check if quantity to ship doesn't exceed ordered quantity
		if shipItem.QuantityShipped > item.Quantity {
			return fmt.Errorf("cannot ship %f units, only %f units ordered for item %d",
				shipItem.QuantityShipped, item.Quantity, shipItem.SalesOrderItemID)
		}

		// Create inventory transaction for outbound shipment
		if s.inventoryService != nil {
			transactionReq := models.CreateInventoryTransactionRequest{
				TransactionTypeID:     2, // Assuming 2 is "outbound/sales" transaction type
				ProductID:             item.ProductID,
				WarehouseID:           shipItem.WarehouseID,
				QuantityChanged:       int(-shipItem.QuantityShipped), // Negative for outbound
				ReferenceDocumentType: &[]string{"sales_order"}[0],
				ReferenceDocumentID:   &id,
				Notes:                 fmt.Sprintf("Sales order shipment: %s", salesOrder.OrderNumber),
			}

			_, err = s.inventoryService.CreateInventoryTransaction(context.Background(), transactionReq, userID)
			if err != nil {
				return fmt.Errorf("failed to create inventory transaction for product %d: %w", item.ProductID, err)
			}
		}

		// Update sales order item status to shipped
		updateItemQuery := `UPDATE sales_order_items SET status = $1, updated_at = NOW() WHERE id = $2`
		_, err = tx.Exec(updateItemQuery, models.SalesOrderItemStatusShipped, shipItem.SalesOrderItemID)
		if err != nil {
			return fmt.Errorf("failed to update sales order item status: %w", err)
		}
	}

	// Update sales order status to shipped
	updateOrderQuery := `UPDATE sales_orders SET status = $1, updated_at = NOW() WHERE id = $2`
	_, err = tx.Exec(updateOrderQuery, models.SalesOrderStatusShipped, id)
	if err != nil {
		return fmt.Errorf("failed to update sales order status: %w", err)
	}

	if err = tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}

	return nil
}

// Helper methods

func (s *SalesOrderService) getCustomerByID(id int64) (*models.Customer, error) {
	customer := &models.Customer{}
	query := `SELECT id, customer_code, name, company_name, customer_type, status, 
			  primary_email, primary_phone, city, state, country
			  FROM customers WHERE id = $1 AND deleted_at IS NULL`

	err := s.db.QueryRowx(query, id).StructScan(customer)
	if err != nil {
		return nil, err
	}
	return customer, nil
}

func (s *SalesOrderService) getProductByID(id int64) (*models.Product, error) {
	product := &models.Product{}
	query := `SELECT id, sku, name, description, unit_of_measure, cost_price, selling_price, is_active
			  FROM products WHERE id = $1`

	err := s.db.QueryRowx(query, id).StructScan(product)
	if err != nil {
		return nil, err
	}
	return product, nil
}
