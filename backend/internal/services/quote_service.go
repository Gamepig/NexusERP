package services

import (
	"database/sql"
	"errors"
	"fmt"
	"strings"
	"time"

	"nexus-erp/backend/internal/models"

	"github.com/jmoiron/sqlx"
)

type QuoteService struct {
	db               *sqlx.DB
	salesOrderService *SalesOrderService
}

func NewQuoteService(db *sqlx.DB, salesOrderService *SalesOrderService) *QuoteService {
	return &QuoteService{
		db:               db,
		salesOrderService: salesOrderService,
	}
}

// CreateQuote creates a new quote with items
func (s *QuoteService) CreateQuote(req *models.CreateQuoteRequest, userID int64) (*models.QuoteWithDetails, error) {
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

	// Insert quote
	quote := &models.Quote{}
	query := `
		INSERT INTO quotes (
			customer_id, business_unit_id, quote_date, expiry_date, total_amount, currency_id, 
			user_id, notes, terms_and_conditions, status
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
		RETURNING id, quote_number, customer_id, business_unit_id, status, user_id, quote_date, 
		          expiry_date, total_amount, currency_id, notes, terms_and_conditions, created_at, updated_at`

	err = tx.QueryRowx(query,
		req.CustomerID,
		req.BusinessUnitID,
		req.QuoteDate,
		req.ExpiryDate,
		totalAmount,
		req.CurrencyID,
		userID,
		req.Notes,
		req.TermsAndConditions,
		models.QuoteStatusDraft,
	).StructScan(quote)
	if err != nil {
		return nil, fmt.Errorf("failed to create quote: %w", err)
	}

	// Insert quote items
	items := make([]models.QuoteItemWithDetails, len(req.Items))
	for i, itemReq := range req.Items {
		totalPrice := itemReq.Quantity * itemReq.UnitPrice
		
		item := &models.QuoteItem{}
		itemQuery := `
			INSERT INTO quote_items (
				quote_id, product_id, quantity, unit_price, total_price, description
			) VALUES ($1, $2, $3, $4, $5, $6)
			RETURNING id, quote_id, product_id, quantity, unit_price, total_price, description, created_at, updated_at`

		err = tx.QueryRowx(itemQuery,
			quote.ID,
			itemReq.ProductID,
			itemReq.Quantity,
			itemReq.UnitPrice,
			totalPrice,
			itemReq.Description,
		).StructScan(item)
		if err != nil {
			return nil, fmt.Errorf("failed to create quote item: %w", err)
		}

		items[i] = models.QuoteItemWithDetails{
			QuoteItem: *item,
		}
	}

	if err = tx.Commit(); err != nil {
		return nil, fmt.Errorf("failed to commit transaction: %w", err)
	}

	// Load additional details
	result := &models.QuoteWithDetails{
		Quote: *quote,
		Items: items,
	}

	// Load customer details
	if customer, err := s.getCustomerByID(quote.CustomerID); err == nil {
		result.Customer = customer
	}

	// Load user details
	if quote.UserID != nil {
		if user, err := s.getUserByID(*quote.UserID); err == nil {
			result.CreatedByUser = user
		}
	}

	// Load product details for items - 優化為單一查詢避免 N+1 問題
	if len(result.Items) > 0 {
		// 收集所有產品 ID
		productIDs := make([]interface{}, len(result.Items))
		productMap := make(map[int64]int) // 產品 ID 到 items 索引的映射
		for i, item := range result.Items {
			productIDs[i] = item.ProductID
			productMap[item.ProductID] = i
		}
		
		// 建立 IN 查詢的佔位符
		placeholders := make([]string, len(productIDs))
		for i := range placeholders {
			placeholders[i] = fmt.Sprintf("$%d", i+1)
		}
		
		// 使用單一查詢載入所有產品詳情
		query := fmt.Sprintf("SELECT * FROM products WHERE id IN (%s)", strings.Join(placeholders, ","))
		
		var products []models.Product
		err = s.db.Select(&products, query, productIDs...)
		if err == nil {
			// 將產品詳情分配到對應的項目
			for _, product := range products {
				if index, exists := productMap[product.ID]; exists {
					result.Items[index].Product = &product
				}
			}
		}
	}

	return result, nil
}

// GetQuoteByID retrieves a quote by ID
func (s *QuoteService) GetQuoteByID(id int64) (*models.QuoteWithDetails, error) {
	quote := &models.Quote{}
	query := `SELECT * FROM quotes WHERE id = $1`
	
	err := s.db.QueryRowx(query, id).StructScan(quote)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, errors.New("quote not found")
		}
		return nil, fmt.Errorf("failed to get quote: %w", err)
	}

	return s.enrichQuoteWithDetails(quote)
}

// UpdateQuote updates a quote
func (s *QuoteService) UpdateQuote(id int64, req *models.UpdateQuoteRequest, userID int64) (*models.QuoteWithDetails, error) {
	tx, err := s.db.Beginx()
	if err != nil {
		return nil, fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	// Check if quote exists and get current status
	var currentStatus string
	err = tx.QueryRow("SELECT status FROM quotes WHERE id = $1", id).Scan(&currentStatus)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, errors.New("quote not found")
		}
		return nil, fmt.Errorf("failed to check quote existence: %w", err)
	}

	// Prevent updates to converted quotes
	if currentStatus == models.QuoteStatusConverted {
		return nil, errors.New("cannot update converted quote")
	}

	// Build update query dynamically
	updateFields := []string{}
	args := []interface{}{}
	argIndex := 1

	if req.CustomerID != nil {
		updateFields = append(updateFields, fmt.Sprintf("customer_id = $%d", argIndex))
		args = append(args, *req.CustomerID)
		argIndex++
	}

	if req.BusinessUnitID != nil {
		updateFields = append(updateFields, fmt.Sprintf("business_unit_id = $%d", argIndex))
		args = append(args, *req.BusinessUnitID)
		argIndex++
	}

	if req.Status != nil {
		updateFields = append(updateFields, fmt.Sprintf("status = $%d", argIndex))
		args = append(args, *req.Status)
		argIndex++
	}

	if req.QuoteDate != nil {
		updateFields = append(updateFields, fmt.Sprintf("quote_date = $%d", argIndex))
		args = append(args, *req.QuoteDate)
		argIndex++
	}

	if req.ExpiryDate != nil {
		updateFields = append(updateFields, fmt.Sprintf("expiry_date = $%d", argIndex))
		args = append(args, *req.ExpiryDate)
		argIndex++
	}

	if req.CurrencyID != nil {
		updateFields = append(updateFields, fmt.Sprintf("currency_id = $%d", argIndex))
		args = append(args, *req.CurrencyID)
		argIndex++
	}

	if req.Notes != nil {
		updateFields = append(updateFields, fmt.Sprintf("notes = $%d", argIndex))
		args = append(args, *req.Notes)
		argIndex++
	}

	if req.TermsAndConditions != nil {
		updateFields = append(updateFields, fmt.Sprintf("terms_and_conditions = $%d", argIndex))
		args = append(args, *req.TermsAndConditions)
		argIndex++
	}

	// Always update updated_at
	updateFields = append(updateFields, fmt.Sprintf("updated_at = $%d", argIndex))
	args = append(args, time.Now())
	argIndex++

	// Add quote ID as the last parameter
	args = append(args, id)

	if len(updateFields) > 1 { // More than just updated_at
		query := fmt.Sprintf("UPDATE quotes SET %s WHERE id = $%d", strings.Join(updateFields, ", "), argIndex)
		_, err = tx.Exec(query, args...)
		if err != nil {
			return nil, fmt.Errorf("failed to update quote: %w", err)
		}
	}

	// Update items if provided
	if req.Items != nil {
		// Delete existing items
		_, err = tx.Exec("DELETE FROM quote_items WHERE quote_id = $1", id)
		if err != nil {
			return nil, fmt.Errorf("failed to delete existing quote items: %w", err)
		}

		// Insert new items
		for _, itemReq := range req.Items {
			totalPrice := itemReq.Quantity * itemReq.UnitPrice
			
			itemQuery := `
				INSERT INTO quote_items (
					quote_id, product_id, quantity, unit_price, total_price, description
				) VALUES ($1, $2, $3, $4, $5, $6)`

			_, err = tx.Exec(itemQuery,
				id,
				itemReq.ProductID,
				itemReq.Quantity,
				itemReq.UnitPrice,
				totalPrice,
				itemReq.Description,
			)
			if err != nil {
				return nil, fmt.Errorf("failed to create quote item: %w", err)
			}
		}
	}

	if err = tx.Commit(); err != nil {
		return nil, fmt.Errorf("failed to commit transaction: %w", err)
	}

	return s.GetQuoteByID(id)
}

// DeleteQuote deletes a quote
func (s *QuoteService) DeleteQuote(id int64) error {
	// Check if quote exists and get current status
	var currentStatus string
	err := s.db.QueryRow("SELECT status FROM quotes WHERE id = $1", id).Scan(&currentStatus)
	if err != nil {
		if err == sql.ErrNoRows {
			return errors.New("quote not found")
		}
		return fmt.Errorf("failed to check quote existence: %w", err)
	}

	// Prevent deletion of converted quotes
	if currentStatus == models.QuoteStatusConverted {
		return errors.New("cannot delete converted quote")
	}

	_, err = s.db.Exec("DELETE FROM quotes WHERE id = $1", id)
	if err != nil {
		return fmt.Errorf("failed to delete quote: %w", err)
	}

	return nil
}

// ListQuotes lists quotes with pagination and filtering
func (s *QuoteService) ListQuotes(params *models.QuoteQueryParams) (*models.QuoteListResponse, error) {
	whereConditions := []string{}
	args := []interface{}{}
	argIndex := 1

	// Build WHERE conditions
	if params.CustomerID != nil {
		whereConditions = append(whereConditions, fmt.Sprintf("q.customer_id = $%d", argIndex))
		args = append(args, *params.CustomerID)
		argIndex++
	}

	if params.Status != "" {
		whereConditions = append(whereConditions, fmt.Sprintf("q.status = $%d", argIndex))
		args = append(args, params.Status)
		argIndex++
	}

	if params.BusinessUnitID != nil {
		whereConditions = append(whereConditions, fmt.Sprintf("q.business_unit_id = $%d", argIndex))
		args = append(args, *params.BusinessUnitID)
		argIndex++
	}

	if params.DateFrom != "" {
		whereConditions = append(whereConditions, fmt.Sprintf("q.quote_date >= $%d", argIndex))
		args = append(args, params.DateFrom)
		argIndex++
	}

	if params.DateTo != "" {
		whereConditions = append(whereConditions, fmt.Sprintf("q.quote_date <= $%d", argIndex))
		args = append(args, params.DateTo)
		argIndex++
	}

	if params.ExpiryFrom != "" {
		whereConditions = append(whereConditions, fmt.Sprintf("q.expiry_date >= $%d", argIndex))
		args = append(args, params.ExpiryFrom)
		argIndex++
	}

	if params.ExpiryTo != "" {
		whereConditions = append(whereConditions, fmt.Sprintf("q.expiry_date <= $%d", argIndex))
		args = append(args, params.ExpiryTo)
		argIndex++
	}

	whereClause := ""
	if len(whereConditions) > 0 {
		whereClause = "WHERE " + strings.Join(whereConditions, " AND ")
	}

	// Count total records
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM quotes q %s", whereClause)
	var total int64
	err := s.db.QueryRow(countQuery, args...).Scan(&total)
	if err != nil {
		return nil, fmt.Errorf("failed to count quotes: %w", err)
	}

	// Calculate pagination
	offset := (params.Page - 1) * params.PageSize
	pages := int((total + int64(params.PageSize) - 1) / int64(params.PageSize))

	// Build ORDER BY clause
	orderBy := "q.created_at DESC"
	if params.SortBy != "" {
		direction := "ASC"
		if params.SortOrder == "desc" {
			direction = "DESC"
		}
		orderBy = fmt.Sprintf("q.%s %s", params.SortBy, direction)
	}

	// Query quotes
	query := fmt.Sprintf(`
		SELECT q.* FROM quotes q 
		%s 
		ORDER BY %s 
		LIMIT $%d OFFSET $%d`,
		whereClause, orderBy, argIndex, argIndex+1)

	args = append(args, params.PageSize, offset)

	rows, err := s.db.Queryx(query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to query quotes: %w", err)
	}
	defer rows.Close()

	quotes := []models.QuoteWithDetails{}
	for rows.Next() {
		quote := &models.Quote{}
		err = rows.StructScan(quote)
		if err != nil {
			return nil, fmt.Errorf("failed to scan quote: %w", err)
		}

		enrichedQuote, err := s.enrichQuoteWithDetails(quote)
		if err != nil {
			return nil, fmt.Errorf("failed to enrich quote details: %w", err)
		}

		quotes = append(quotes, *enrichedQuote)
	}

	return &models.QuoteListResponse{
		Quotes:   quotes,
		Total:    total,
		Page:     params.Page,
		PageSize: params.PageSize,
		Pages:    pages,
	}, nil
}

// ConvertQuoteToSalesOrder converts a quote to a sales order
func (s *QuoteService) ConvertQuoteToSalesOrder(quoteID int64, req *models.ConvertQuoteRequest, userID int64) (*models.ConvertQuoteResponse, error) {
	tx, err := s.db.Beginx()
	if err != nil {
		return nil, fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	// Get quote details
	quote, err := s.GetQuoteByID(quoteID)
	if err != nil {
		return nil, fmt.Errorf("failed to get quote: %w", err)
	}

	// Check if quote can be converted
	if quote.Status != models.QuoteStatusApproved {
		return &models.ConvertQuoteResponse{
			Success: false,
			Message: "quote must be approved before conversion",
		}, nil
	}

	if quote.Status == models.QuoteStatusConverted {
		return &models.ConvertQuoteResponse{
			Success: false,
			Message: "quote has already been converted",
		}, nil
	}

	// Check if quote has expired
	if quote.ExpiryDate != nil && quote.ExpiryDate.Before(time.Now()) {
		return &models.ConvertQuoteResponse{
			Success: false,
			Message: "quote has expired",
		}, nil
	}

	// Prepare sales order request
	orderDate := time.Now()
	if req.OrderDate != nil {
		orderDate = *req.OrderDate
	}

	salesOrderReq := &models.CreateSalesOrderRequest{
		CustomerID:     quote.CustomerID,
		BusinessUnitID: quote.BusinessUnitID,
		OrderDate:      orderDate,
		CurrencyID:     quote.CurrencyID,
		Items:          make([]models.CreateSalesOrderItemRequest, len(quote.Items)),
	}

	// Convert quote items to sales order items
	for i, item := range quote.Items {
		salesOrderReq.Items[i] = models.CreateSalesOrderItemRequest{
			ProductID: item.ProductID,
			Quantity:  item.Quantity,
			UnitPrice: item.UnitPrice,
		}
	}

	// Create sales order
	salesOrder, err := s.salesOrderService.CreateSalesOrder(salesOrderReq, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to create sales order: %w", err)
	}

	// Update quote status to converted
	_, err = tx.Exec("UPDATE quotes SET status = $1, updated_at = $2 WHERE id = $3", 
		models.QuoteStatusConverted, time.Now(), quoteID)
	if err != nil {
		return nil, fmt.Errorf("failed to update quote status: %w", err)
	}

	if err = tx.Commit(); err != nil {
		return nil, fmt.Errorf("failed to commit transaction: %w", err)
	}

	return &models.ConvertQuoteResponse{
		Success:      true,
		Message:      "quote successfully converted to sales order",
		SalesOrderID: salesOrder.ID,
		SalesOrder:   salesOrder,
	}, nil
}

// Helper methods

func (s *QuoteService) enrichQuoteWithDetails(quote *models.Quote) (*models.QuoteWithDetails, error) {
	result := &models.QuoteWithDetails{
		Quote: *quote,
	}

	// Load customer details
	if customer, err := s.getCustomerByID(quote.CustomerID); err == nil {
		result.Customer = customer
	}

	// Load user details
	if quote.UserID != nil {
		if user, err := s.getUserByID(*quote.UserID); err == nil {
			result.CreatedByUser = user
		}
	}

	// Load quote items
	items, err := s.getQuoteItems(quote.ID)
	if err != nil {
		return nil, fmt.Errorf("failed to load quote items: %w", err)
	}
	result.Items = items

	return result, nil
}

func (s *QuoteService) getQuoteItems(quoteID int64) ([]models.QuoteItemWithDetails, error) {
	query := `SELECT * FROM quote_items WHERE quote_id = $1 ORDER BY id`
	
	rows, err := s.db.Queryx(query, quoteID)
	if err != nil {
		return nil, fmt.Errorf("failed to query quote items: %w", err)
	}
	defer rows.Close()

	items := []models.QuoteItemWithDetails{}
	for rows.Next() {
		item := &models.QuoteItem{}
		err = rows.StructScan(item)
		if err != nil {
			return nil, fmt.Errorf("failed to scan quote item: %w", err)
		}

		itemWithDetails := models.QuoteItemWithDetails{
			QuoteItem: *item,
		}

		// Load product details
		if product, err := s.getProductByID(item.ProductID); err == nil {
			itemWithDetails.Product = product
		}

		items = append(items, itemWithDetails)
	}

	return items, nil
}

func (s *QuoteService) getCustomerByID(id int64) (*models.Customer, error) {
	customer := &models.Customer{}
	query := `SELECT * FROM customers WHERE id = $1 AND deleted_at IS NULL`
	
	err := s.db.QueryRowx(query, id).StructScan(customer)
	if err != nil {
		return nil, err
	}
	
	return customer, nil
}

func (s *QuoteService) getUserByID(id int64) (*models.User, error) {
	user := &models.User{}
	query := `SELECT id, username, email, created_at, updated_at FROM users WHERE id = $1`
	
	err := s.db.QueryRowx(query, id).StructScan(user)
	if err != nil {
		return nil, err
	}
	
	return user, nil
}

func (s *QuoteService) getProductByID(id int64) (*models.Product, error) {
	product := &models.Product{}
	query := `SELECT * FROM products WHERE id = $1 AND is_active = true`
	
	err := s.db.QueryRowx(query, id).StructScan(product)
	if err != nil {
		return nil, err
	}
	
	return product, nil
}