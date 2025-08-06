package services

import (
	"context"
	"database/sql"
	"fmt"
	"nexus-erp/backend/internal/models"
	"strings"
	"time"

	"github.com/jmoiron/sqlx"
)

type invoiceService struct {
	db                  *sqlx.DB
	supplierService     SupplierService
	productService      ProductService
	purchaseOrderService PurchaseOrderService
}

// NewInvoiceService creates a new invoice service instance
func NewInvoiceService(db *sqlx.DB, supplierService SupplierService, productService ProductService, purchaseOrderService PurchaseOrderService) InvoiceService {
	return &invoiceService{
		db:                  db,
		supplierService:     supplierService,
		productService:      productService,
		purchaseOrderService: purchaseOrderService,
	}
}

// CreateInvoice creates a new supplier invoice
func (s *invoiceService) CreateInvoice(ctx context.Context, req *models.CreateInvoiceRequest, userID int64) (*models.InvoiceWithDetails, error) {
	// Validate input data
	if err := s.ValidateInvoiceData(req); err != nil {
		return nil, fmt.Errorf("validation failed: %w", err)
	}

	// Start transaction
	tx, err := s.db.BeginTxx(ctx, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to start transaction: %w", err)
	}
	defer tx.Rollback()

	// Get currency if not provided exchange rate
	var exchangeRate float64 = 1.0
	if req.ExchangeRate != nil {
		exchangeRate = *req.ExchangeRate
	} else {
		currency, err := s.getCurrencyByID(ctx, tx, req.CurrencyID)
		if err != nil {
			return nil, fmt.Errorf("failed to get currency: %w", err)
		}
		exchangeRate = currency.ExchangeRate
	}

	// Calculate totals
	subtotal, taxAmount, totalAmount := s.CalculateInvoiceTotals(req.Items)

	// Create invoice
	invoice := &models.Invoice{
		PurchaseOrderID:  req.PurchaseOrderID,
		SupplierID:       req.SupplierID,
		InvoiceDate:      req.InvoiceDate,
		DueDate:          req.DueDate,
		Subtotal:         subtotal,
		TaxAmount:        taxAmount,
		TotalAmount:      totalAmount,
		CurrencyID:       req.CurrencyID,
		ExchangeRate:     exchangeRate,
		Status:           models.InvoiceStatusDraft,
		PaymentTerms:     &req.PaymentTerms,
		Description:      &req.Description,
		Notes:            &req.Notes,
		AttachmentURL:    &req.AttachmentURL,
		CreatedByUserID:  &userID,
	}

	query := `
		INSERT INTO invoices (
			purchase_order_id, supplier_id, invoice_date, due_date,
			subtotal, tax_amount, total_amount, currency_id, exchange_rate,
			status, payment_terms, description, notes, attachment_url,
			created_by_user_id, created_at, updated_at
		) VALUES (
			:purchase_order_id, :supplier_id, :invoice_date, :due_date,
			:subtotal, :tax_amount, :total_amount, :currency_id, :exchange_rate,
			:status, :payment_terms, :description, :notes, :attachment_url,
			:created_by_user_id, NOW(), NOW()
		) RETURNING id, invoice_number
	`

	rows, err := tx.NamedQuery(query, invoice)
	if err != nil {
		return nil, fmt.Errorf("failed to create invoice: %w", err)
	}
	defer rows.Close()

	if rows.Next() {
		if err := rows.Scan(&invoice.ID, &invoice.InvoiceNumber); err != nil {
			return nil, fmt.Errorf("failed to scan invoice result: %w", err)
		}
	}

	// Create invoice items
	for _, itemReq := range req.Items {
		lineTotal := itemReq.Quantity * itemReq.UnitPrice
		taxAmount := lineTotal * (itemReq.TaxRate / 100)

		item := &models.InvoiceItem{
			InvoiceID:   invoice.ID,
			ProductID:   itemReq.ProductID,
			Description: itemReq.Description,
			Quantity:    itemReq.Quantity,
			UnitPrice:   itemReq.UnitPrice,
			LineTotal:   lineTotal,
			TaxRate:     itemReq.TaxRate,
			TaxAmount:   taxAmount,
		}

		itemQuery := `
			INSERT INTO invoice_items (
				invoice_id, product_id, description, quantity, unit_price,
				line_total, tax_rate, tax_amount, created_at, updated_at
			) VALUES (
				:invoice_id, :product_id, :description, :quantity, :unit_price,
				:line_total, :tax_rate, :tax_amount, NOW(), NOW()
			)
		`

		if _, err := tx.NamedExec(itemQuery, item); err != nil {
			return nil, fmt.Errorf("failed to create invoice item: %w", err)
		}
	}

	// Commit transaction
	if err := tx.Commit(); err != nil {
		return nil, fmt.Errorf("failed to commit transaction: %w", err)
	}

	// Return created invoice with details
	return s.GetInvoice(ctx, invoice.ID)
}

// GetInvoices retrieves invoices with filtering and pagination
func (s *invoiceService) GetInvoices(ctx context.Context, page, limit int, search string, status string, supplierID *int64) ([]models.InvoiceWithDetails, int, error) {
	offset := (page - 1) * limit
	
	// Build WHERE conditions
	var whereConditions []string
	args := make(map[string]interface{})
	
	if search != "" {
		whereConditions = append(whereConditions, "(i.invoice_number ILIKE :search OR i.description ILIKE :search)")
		args["search"] = "%" + search + "%"
	}
	
	if status != "" {
		whereConditions = append(whereConditions, "i.status = :status")
		args["status"] = status
	}
	
	if supplierID != nil {
		whereConditions = append(whereConditions, "i.supplier_id = :supplier_id")
		args["supplier_id"] = *supplierID
	}
	
	whereClause := ""
	if len(whereConditions) > 0 {
		whereClause = "WHERE " + strings.Join(whereConditions, " AND ")
	}

	// Count total records
	countQuery := fmt.Sprintf(`
		SELECT COUNT(*) 
		FROM invoices i 
		%s
	`, whereClause)
	
	var total int
	if len(args) > 0 {
		row, err := s.db.NamedQuery(countQuery, args)
		if err != nil {
			return nil, 0, fmt.Errorf("failed to count invoices: %w", err)
		}
		defer row.Close()
		if row.Next() {
			row.Scan(&total)
		}
	} else {
		err := s.db.Get(&total, countQuery)
		if err != nil {
			return nil, 0, fmt.Errorf("failed to count invoices: %w", err)
		}
	}

	// Get invoices with details
	query := fmt.Sprintf(`
		SELECT 
			i.*,
			s.id as "supplier.id", s.name as "supplier.name", s.code as "supplier.code",
			s.email as "supplier.email", s.phone as "supplier.phone",
			c.id as "currency.id", c.code as "currency.code", c.name as "currency.name",
			c.symbol as "currency.symbol", c.exchange_rate as "currency.exchange_rate",
			po.id as "purchase_order.id", po.po_number as "purchase_order.po_number",
			po.status as "purchase_order.status",
			ap.id as "accounts_payable.id", ap.amount as "accounts_payable.amount",
			ap.paid_amount as "accounts_payable.paid_amount", 
			ap.outstanding_amount as "accounts_payable.outstanding_amount",
			ap.status as "accounts_payable.status",
			cu.id as "created_by_user.id", cu.username as "created_by_user.username",
			au.id as "approved_by_user.id", au.username as "approved_by_user.username"
		FROM invoices i
		LEFT JOIN suppliers s ON i.supplier_id = s.id
		LEFT JOIN currencies c ON i.currency_id = c.id
		LEFT JOIN purchase_orders po ON i.purchase_order_id = po.id
		LEFT JOIN accounts_payable ap ON i.id = ap.invoice_id
		LEFT JOIN users cu ON i.created_by_user_id = cu.id
		LEFT JOIN users au ON i.approved_by_user_id = au.id
		%s
		ORDER BY i.created_at DESC
		LIMIT :limit OFFSET :offset
	`, whereClause)

	args["limit"] = limit
	args["offset"] = offset

	rows, err := s.db.NamedQuery(query, args)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to get invoices: %w", err)
	}
	defer rows.Close()

	var invoices []models.InvoiceWithDetails
	for rows.Next() {
		var invoice models.InvoiceWithDetails
		var supplier models.Supplier
		var currency models.Currency
		var purchaseOrder models.PurchaseOrder
		var accountsPayable models.AccountsPayable
		var createdByUser models.User
		var approvedByUser models.User

		err := rows.Scan(
			&invoice.ID, &invoice.InvoiceNumber, &invoice.PurchaseOrderID,
			&invoice.SupplierID, &invoice.InvoiceDate, &invoice.DueDate,
			&invoice.Subtotal, &invoice.TaxAmount, &invoice.TotalAmount,
			&invoice.CurrencyID, &invoice.ExchangeRate, &invoice.Status,
			&invoice.PaymentTerms, &invoice.Description, &invoice.Notes,
			&invoice.AttachmentURL, &invoice.CreatedByUserID, &invoice.ApprovedByUserID,
			&invoice.ApprovedAt, &invoice.CreatedAt, &invoice.UpdatedAt,
			
			&supplier.ID, &supplier.Name, &supplier.Code,
			&supplier.Email, &supplier.Phone,
			
			&currency.ID, &currency.Code, &currency.Name,
			&currency.Symbol, &currency.ExchangeRate,
			
			&purchaseOrder.ID, &purchaseOrder.PONumber, &purchaseOrder.Status,
			
			&accountsPayable.ID, &accountsPayable.Amount,
			&accountsPayable.PaidAmount, &accountsPayable.OutstandingAmount,
			&accountsPayable.Status,
			
			&createdByUser.ID, &createdByUser.Username,
			&approvedByUser.ID, &approvedByUser.Username,
		)
		if err != nil {
			return nil, 0, fmt.Errorf("failed to scan invoice: %w", err)
		}

		invoice.Supplier = &supplier
		invoice.Currency = &currency
		if purchaseOrder.ID != 0 {
			invoice.PurchaseOrder = &purchaseOrder
		}
		if accountsPayable.ID != 0 {
			invoice.AccountsPayable = &accountsPayable
		}
		if createdByUser.ID != 0 {
			invoice.CreatedByUser = &createdByUser
		}
		if approvedByUser.ID != 0 {
			invoice.ApprovedByUser = &approvedByUser
		}

		invoices = append(invoices, invoice)
	}

	// Get invoice items for each invoice
	for i := range invoices {
		items, err := s.getInvoiceItems(ctx, invoices[i].ID)
		if err != nil {
			return nil, 0, fmt.Errorf("failed to get invoice items: %w", err)
		}
		invoices[i].Items = items
	}

	return invoices, total, nil
}

// GetInvoice retrieves a single invoice by ID with full details
func (s *invoiceService) GetInvoice(ctx context.Context, id int64) (*models.InvoiceWithDetails, error) {
	query := `
		SELECT 
			i.*,
			s.id, s.name, s.code, s.email, s.phone, s.address, s.city, s.state, s.country, s.postal_code,
			c.id, c.code, c.name, c.symbol, c.exchange_rate,
			po.id, po.po_number, po.status, po.order_date,
			ap.id, ap.amount, ap.paid_amount, ap.outstanding_amount, ap.status,
			cu.id, cu.username, cu.email,
			au.id, au.username, au.email
		FROM invoices i
		LEFT JOIN suppliers s ON i.supplier_id = s.id
		LEFT JOIN currencies c ON i.currency_id = c.id
		LEFT JOIN purchase_orders po ON i.purchase_order_id = po.id
		LEFT JOIN accounts_payable ap ON i.id = ap.invoice_id
		LEFT JOIN users cu ON i.created_by_user_id = cu.id
		LEFT JOIN users au ON i.approved_by_user_id = au.id
		WHERE i.id = $1
	`

	var invoice models.InvoiceWithDetails
	var supplier models.Supplier
	var currency models.Currency
	var purchaseOrder sql.NullInt64
	var poNumber, poStatus sql.NullString
	var poDate sql.NullTime
	var accountsPayable sql.NullInt64
	var apAmount, apPaid, apOutstanding sql.NullFloat64
	var apStatus sql.NullString
	var createdByUser sql.NullInt64
	var createdUsername, createdEmail sql.NullString
	var approvedByUser sql.NullInt64
	var approvedUsername, approvedEmail sql.NullString
	
	// Temporary variables for address fields (no longer needed since we use JSON)
	var tempCity, tempState, tempCountry, tempPostalCode sql.NullString

	err := s.db.QueryRowContext(ctx, query, id).Scan(
		&invoice.ID, &invoice.InvoiceNumber, &invoice.PurchaseOrderID,
		&invoice.SupplierID, &invoice.InvoiceDate, &invoice.DueDate,
		&invoice.Subtotal, &invoice.TaxAmount, &invoice.TotalAmount,
		&invoice.CurrencyID, &invoice.ExchangeRate, &invoice.Status,
		&invoice.PaymentTerms, &invoice.Description, &invoice.Notes,
		&invoice.AttachmentURL, &invoice.CreatedByUserID, &invoice.ApprovedByUserID,
		&invoice.ApprovedAt, &invoice.CreatedAt, &invoice.UpdatedAt,
		
		&supplier.ID, &supplier.Name, &supplier.Code, &supplier.Email, &supplier.Phone,
		&supplier.Address, &tempCity, &tempState, &tempCountry, &tempPostalCode,
		
		&currency.ID, &currency.Code, &currency.Name, &currency.Symbol, &currency.ExchangeRate,
		
		&purchaseOrder, &poNumber, &poStatus, &poDate,
		
		&accountsPayable, &apAmount, &apPaid, &apOutstanding, &apStatus,
		
		&createdByUser, &createdUsername, &createdEmail,
		&approvedByUser, &approvedUsername, &approvedEmail,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("invoice not found")
		}
		return nil, fmt.Errorf("failed to get invoice: %w", err)
	}

	invoice.Supplier = &supplier
	invoice.Currency = &currency
	
	if purchaseOrder.Valid {
		invoice.PurchaseOrder = &models.PurchaseOrder{
			ID:       purchaseOrder.Int64,
			PONumber: poNumber.String,
			Status:   poStatus.String,
		}
		if poDate.Valid {
			invoice.PurchaseOrder.OrderDate = poDate.Time
		}
	}
	
	if accountsPayable.Valid {
		invoice.AccountsPayable = &models.AccountsPayable{
			ID:                accountsPayable.Int64,
			Amount:            apAmount.Float64,
			PaidAmount:        apPaid.Float64,
			OutstandingAmount: apOutstanding.Float64,
			Status:            apStatus.String,
		}
	}
	
	if createdByUser.Valid {
		invoice.CreatedByUser = &models.User{
			ID:       createdByUser.Int64,
			Username: createdUsername.String,
			Email:    createdEmail.String,
		}
	}
	
	if approvedByUser.Valid {
		invoice.ApprovedByUser = &models.User{
			ID:       approvedByUser.Int64,
			Username: approvedUsername.String,
			Email:    approvedEmail.String,
		}
	}

	// Get invoice items
	items, err := s.getInvoiceItems(ctx, invoice.ID)
	if err != nil {
		return nil, fmt.Errorf("failed to get invoice items: %w", err)
	}
	invoice.Items = items

	return &invoice, nil
}

// UpdateInvoice updates an existing invoice
func (s *invoiceService) UpdateInvoice(ctx context.Context, id int64, req *models.UpdateInvoiceRequest, userID int64) (*models.InvoiceWithDetails, error) {
	// Validate input data
	if err := s.validateUpdateInvoiceData(req); err != nil {
		return nil, fmt.Errorf("validation failed: %w", err)
	}

	// Start transaction
	tx, err := s.db.BeginTxx(ctx, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to start transaction: %w", err)
	}
	defer tx.Rollback()

	// Check if invoice exists and is editable
	var currentStatus string
	err = tx.GetContext(ctx, &currentStatus, "SELECT status FROM invoices WHERE id = $1", id)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("invoice not found")
		}
		return nil, fmt.Errorf("failed to get invoice status: %w", err)
	}

	if currentStatus == models.InvoiceStatusPaid || currentStatus == models.InvoiceStatusCancelled {
		return nil, fmt.Errorf("cannot update invoice with status: %s", currentStatus)
	}

	// Get currency exchange rate if not provided
	var exchangeRate float64 = 1.0
	if req.ExchangeRate != nil {
		exchangeRate = *req.ExchangeRate
	} else {
		currency, err := s.getCurrencyByID(ctx, tx, req.CurrencyID)
		if err != nil {
			return nil, fmt.Errorf("failed to get currency: %w", err)
		}
		exchangeRate = currency.ExchangeRate
	}

	// Calculate totals
	items := make([]models.CreateInvoiceItemRequest, len(req.Items))
	for i, item := range req.Items {
		items[i] = models.CreateInvoiceItemRequest{
			ProductID:   item.ProductID,
			Description: item.Description,
			Quantity:    item.Quantity,
			UnitPrice:   item.UnitPrice,
			TaxRate:     item.TaxRate,
		}
	}
	subtotal, taxAmount, totalAmount := s.CalculateInvoiceTotals(items)

	// Update invoice
	updateQuery := `
		UPDATE invoices SET
			purchase_order_id = :purchase_order_id,
			supplier_id = :supplier_id,
			invoice_date = :invoice_date,
			due_date = :due_date,
			subtotal = :subtotal,
			tax_amount = :tax_amount,
			total_amount = :total_amount,
			currency_id = :currency_id,
			exchange_rate = :exchange_rate,
			status = :status,
			payment_terms = :payment_terms,
			description = :description,
			notes = :notes,
			attachment_url = :attachment_url,
			updated_at = NOW()
		WHERE id = :id
	`

	updateData := map[string]interface{}{
		"id":                id,
		"purchase_order_id": req.PurchaseOrderID,
		"supplier_id":       req.SupplierID,
		"invoice_date":      req.InvoiceDate,
		"due_date":          req.DueDate,
		"subtotal":          subtotal,
		"tax_amount":        taxAmount,
		"total_amount":      totalAmount,
		"currency_id":       req.CurrencyID,
		"exchange_rate":     exchangeRate,
		"status":            req.Status,
		"payment_terms":     req.PaymentTerms,
		"description":       req.Description,
		"notes":             req.Notes,
		"attachment_url":    req.AttachmentURL,
	}

	_, err = tx.NamedExec(updateQuery, updateData)
	if err != nil {
		return nil, fmt.Errorf("failed to update invoice: %w", err)
	}

	// Delete existing invoice items
	_, err = tx.ExecContext(ctx, "DELETE FROM invoice_items WHERE invoice_id = $1", id)
	if err != nil {
		return nil, fmt.Errorf("failed to delete invoice items: %w", err)
	}

	// Create new invoice items
	for _, itemReq := range req.Items {
		lineTotal := itemReq.Quantity * itemReq.UnitPrice
		taxAmount := lineTotal * (itemReq.TaxRate / 100)

		item := map[string]interface{}{
			"invoice_id":  id,
			"product_id":  itemReq.ProductID,
			"description": itemReq.Description,
			"quantity":    itemReq.Quantity,
			"unit_price":  itemReq.UnitPrice,
			"line_total":  lineTotal,
			"tax_rate":    itemReq.TaxRate,
			"tax_amount":  taxAmount,
		}

		itemQuery := `
			INSERT INTO invoice_items (
				invoice_id, product_id, description, quantity, unit_price,
				line_total, tax_rate, tax_amount, created_at, updated_at
			) VALUES (
				:invoice_id, :product_id, :description, :quantity, :unit_price,
				:line_total, :tax_rate, :tax_amount, NOW(), NOW()
			)
		`

		if _, err := tx.NamedExec(itemQuery, item); err != nil {
			return nil, fmt.Errorf("failed to create invoice item: %w", err)
		}
	}

	// Commit transaction
	if err := tx.Commit(); err != nil {
		return nil, fmt.Errorf("failed to commit transaction: %w", err)
	}

	// Return updated invoice with details
	return s.GetInvoice(ctx, id)
}

// DeleteInvoice deletes an invoice (soft delete by setting status to cancelled)
func (s *invoiceService) DeleteInvoice(ctx context.Context, id int64) error {
	// Check if invoice exists and can be deleted
	var status string
	err := s.db.GetContext(ctx, &status, "SELECT status FROM invoices WHERE id = $1", id)
	if err != nil {
		if err == sql.ErrNoRows {
			return fmt.Errorf("invoice not found")
		}
		return fmt.Errorf("failed to get invoice status: %w", err)
	}

	if status == models.InvoiceStatusPaid || status == models.InvoiceStatusPartiallyPaid {
		return fmt.Errorf("cannot delete invoice with status: %s", status)
	}

	// Set status to cancelled
	_, err = s.db.ExecContext(ctx, 
		"UPDATE invoices SET status = $1, updated_at = NOW() WHERE id = $2", 
		models.InvoiceStatusCancelled, id)
	if err != nil {
		return fmt.Errorf("failed to delete invoice: %w", err)
	}

	return nil
}

// ApproveInvoice approves an invoice and creates accounts payable record
func (s *invoiceService) ApproveInvoice(ctx context.Context, id int64, req *models.ApproveInvoiceRequest, userID int64) (*models.InvoiceWithDetails, error) {
	// Start transaction
	tx, err := s.db.BeginTxx(ctx, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to start transaction: %w", err)
	}
	defer tx.Rollback()

	// Check if invoice can be approved
	var currentStatus string
	err = tx.GetContext(ctx, &currentStatus, "SELECT status FROM invoices WHERE id = $1", id)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("invoice not found")
		}
		return nil, fmt.Errorf("failed to get invoice status: %w", err)
	}

	if currentStatus != models.InvoiceStatusDraft && currentStatus != models.InvoiceStatusPendingApproval {
		return nil, fmt.Errorf("invoice cannot be approved from status: %s", currentStatus)
	}

	// Update invoice status to approved
	approvedAt := time.Now()
	updateQuery := `
		UPDATE invoices SET 
			status = $1, 
			approved_by_user_id = $2, 
			approved_at = $3,
			notes = CASE 
				WHEN notes IS NULL OR notes = '' THEN $4
				ELSE notes || E'\n\nApproval Notes: ' || $4
			END,
			updated_at = NOW()
		WHERE id = $5
	`

	notes := ""
	if req.Notes != "" {
		notes = req.Notes
	}

	_, err = tx.ExecContext(ctx, updateQuery, models.InvoiceStatusApproved, userID, approvedAt, notes, id)
	if err != nil {
		return nil, fmt.Errorf("failed to approve invoice: %w", err)
	}

	// The accounts payable record will be automatically created by the database trigger
	// when the invoice status is updated to 'approved'

	// Commit transaction
	if err := tx.Commit(); err != nil {
		return nil, fmt.Errorf("failed to commit transaction: %w", err)
	}

	// Return updated invoice with details
	return s.GetInvoice(ctx, id)
}

// GenerateInvoiceFromPO generates an invoice from a purchase order
func (s *invoiceService) GenerateInvoiceFromPO(ctx context.Context, poID int64, req *models.GenerateInvoiceFromPORequest, userID int64) (*models.InvoiceWithDetails, error) {
	// Get purchase order with details
	po, err := s.purchaseOrderService.GetPurchaseOrder(ctx, poID)
	if err != nil {
		return nil, fmt.Errorf("failed to get purchase order: %w", err)
	}

	// Check if PO is in a valid status for invoice generation
	if po.Status != "received" && po.Status != "partially_received" {
		return nil, fmt.Errorf("purchase order must be received or partially received to generate invoice")
	}

	// Create invoice items from PO items
	var invoiceItems []models.CreateInvoiceItemRequest
	for _, poItem := range po.Items {
		// Use received quantity or ordered quantity
		quantity := float64(poItem.QuantityReceived)
		if quantity == 0 {
			quantity = float64(poItem.Quantity)
		}

		invoiceItems = append(invoiceItems, models.CreateInvoiceItemRequest{
			ProductID:   &poItem.ProductID,
			Description: poItem.Product.Name,
			Quantity:    quantity,
			UnitPrice:   poItem.UnitPrice,
			TaxRate:     0, // Default tax rate, can be overridden
		})
	}

	// Default currency ID (1 for base currency) since PO uses string currency
	defaultCurrencyID := int64(1)
	defaultExchangeRate := 1.0

	// Create invoice request
	createReq := &models.CreateInvoiceRequest{
		PurchaseOrderID: &poID,
		SupplierID:      &po.SupplierID,
		InvoiceDate:     req.InvoiceDate,
		DueDate:         req.DueDate,
		CurrencyID:      defaultCurrencyID,
		ExchangeRate:    &defaultExchangeRate,
		PaymentTerms:    req.PaymentTerms,
		Description:     req.Description,
		Notes:           req.Notes,
		AttachmentURL:   req.AttachmentURL,
		Items:           invoiceItems,
	}

	// Create invoice
	return s.CreateInvoice(ctx, createReq, userID)
}

// GetCurrencies retrieves all active currencies
func (s *invoiceService) GetCurrencies(ctx context.Context) ([]models.Currency, error) {
	var currencies []models.Currency
	
	query := `
		SELECT id, code, name, symbol, exchange_rate, is_base_currency, is_active, created_at, updated_at
		FROM currencies 
		WHERE is_active = true 
		ORDER BY is_base_currency DESC, code ASC
	`
	
	err := s.db.SelectContext(ctx, &currencies, query)
	if err != nil {
		return nil, fmt.Errorf("failed to get currencies: %w", err)
	}
	
	return currencies, nil
}

// GetCurrencyByID retrieves a currency by ID
func (s *invoiceService) GetCurrencyByID(ctx context.Context, id int64) (*models.Currency, error) {
	return s.getCurrencyByID(ctx, s.db, id)
}

// GetCurrencyByCode retrieves a currency by code
func (s *invoiceService) GetCurrencyByCode(ctx context.Context, code string) (*models.Currency, error) {
	var currency models.Currency
	
	query := `
		SELECT id, code, name, symbol, exchange_rate, is_base_currency, is_active, created_at, updated_at
		FROM currencies 
		WHERE code = $1 AND is_active = true
	`
	
	err := s.db.GetContext(ctx, &currency, query, code)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("currency not found")
		}
		return nil, fmt.Errorf("failed to get currency: %w", err)
	}
	
	return &currency, nil
}

// CalculateInvoiceTotals calculates subtotal, tax amount, and total amount for invoice items
func (s *invoiceService) CalculateInvoiceTotals(items []models.CreateInvoiceItemRequest) (subtotal, taxAmount, totalAmount float64) {
	for _, item := range items {
		lineTotal := item.Quantity * item.UnitPrice
		lineTax := lineTotal * (item.TaxRate / 100)
		
		subtotal += lineTotal
		taxAmount += lineTax
	}
	
	totalAmount = subtotal + taxAmount
	return
}

// ValidateInvoiceData validates invoice creation request data
func (s *invoiceService) ValidateInvoiceData(req *models.CreateInvoiceRequest) error {
	if req.SupplierID != nil && *req.SupplierID <= 0 {
		return fmt.Errorf("supplier_id must be positive when provided")
	}
	
	if req.CurrencyID <= 0 {
		return fmt.Errorf("currency_id is required")
	}
	
	if req.InvoiceDate.After(time.Now()) {
		return fmt.Errorf("invoice_date cannot be in the future")
	}
	
	if req.DueDate.Before(req.InvoiceDate) {
		return fmt.Errorf("due_date cannot be before invoice_date")
	}
	
	if len(req.Items) == 0 {
		return fmt.Errorf("at least one invoice item is required")
	}
	
	for i, item := range req.Items {
		if item.Description == "" {
			return fmt.Errorf("item %d: description is required", i+1)
		}
		if item.Quantity <= 0 {
			return fmt.Errorf("item %d: quantity must be positive", i+1)
		}
		if item.UnitPrice < 0 {
			return fmt.Errorf("item %d: unit_price cannot be negative", i+1)
		}
		if item.TaxRate < 0 || item.TaxRate > 100 {
			return fmt.Errorf("item %d: tax_rate must be between 0 and 100", i+1)
		}
	}
	
	return nil
}

// Helper functions

// getCurrencyByID is a helper function to get currency by ID with transaction support
func (s *invoiceService) getCurrencyByID(ctx context.Context, db sqlx.ExtContext, id int64) (*models.Currency, error) {
	var currency models.Currency
	
	query := `
		SELECT id, code, name, symbol, exchange_rate, is_base_currency, is_active, created_at, updated_at
		FROM currencies 
		WHERE id = $1 AND is_active = true
	`
	
	err := sqlx.GetContext(ctx, db, &currency, query, id)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("currency not found")
		}
		return nil, fmt.Errorf("failed to get currency: %w", err)
	}
	
	return &currency, nil
}

// getInvoiceItems retrieves invoice items for a given invoice ID
func (s *invoiceService) getInvoiceItems(ctx context.Context, invoiceID int64) ([]models.InvoiceItemWithDetails, error) {
	query := `
		SELECT 
			ii.*,
			p.id, p.name, p.sku, p.description as product_description
		FROM invoice_items ii
		LEFT JOIN products p ON ii.product_id = p.id
		WHERE ii.invoice_id = $1
		ORDER BY ii.id
	`

	rows, err := s.db.QueryContext(ctx, query, invoiceID)
	if err != nil {
		return nil, fmt.Errorf("failed to query invoice items: %w", err)
	}
	defer rows.Close()

	var items []models.InvoiceItemWithDetails
	for rows.Next() {
		var item models.InvoiceItemWithDetails
		var product sql.NullInt64
		var productName, productSKU, productDesc sql.NullString

		err := rows.Scan(
			&item.ID, &item.InvoiceID, &item.ProductID, &item.Description,
			&item.Quantity, &item.UnitPrice, &item.LineTotal,
			&item.TaxRate, &item.TaxAmount, &item.CreatedAt, &item.UpdatedAt,
			&product, &productName, &productSKU, &productDesc,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan invoice item: %w", err)
		}

		if product.Valid {
			item.Product = &models.Product{
				ID:          product.Int64,
				Name:        productName.String,
				SKU:         productSKU.String,
				Description: &productDesc.String,
			}
		}

		items = append(items, item)
	}

	return items, nil
}

// validateUpdateInvoiceData validates invoice update request data
func (s *invoiceService) validateUpdateInvoiceData(req *models.UpdateInvoiceRequest) error {
	if req.SupplierID <= 0 {
		return fmt.Errorf("supplier_id is required")
	}
	
	if req.CurrencyID <= 0 {
		return fmt.Errorf("currency_id is required")
	}
	
	if req.DueDate.Before(req.InvoiceDate) {
		return fmt.Errorf("due_date cannot be before invoice_date")
	}
	
	if len(req.Items) == 0 {
		return fmt.Errorf("at least one invoice item is required")
	}
	
	for i, item := range req.Items {
		if item.Description == "" {
			return fmt.Errorf("item %d: description is required", i+1)
		}
		if item.Quantity <= 0 {
			return fmt.Errorf("item %d: quantity must be positive", i+1)
		}
		if item.UnitPrice < 0 {
			return fmt.Errorf("item %d: unit_price cannot be negative", i+1)
		}
		if item.TaxRate < 0 || item.TaxRate > 100 {
			return fmt.Errorf("item %d: tax_rate must be between 0 and 100", i+1)
		}
	}
	
	return nil
}