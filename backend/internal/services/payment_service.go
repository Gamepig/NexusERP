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

type paymentService struct {
	db                     *sqlx.DB
	accountsPayableService AccountsPayableService
}

// NewPaymentService creates a new payment service instance
func NewPaymentService(db *sqlx.DB, accountsPayableService AccountsPayableService) PaymentService {
	return &paymentService{
		db:                     db,
		accountsPayableService: accountsPayableService,
	}
}

// CreatePayment creates a new payment to suppliers
func (s *paymentService) CreatePayment(ctx context.Context, req *models.CreatePaymentRequest, userID int64) (*models.PaymentWithDetails, error) {
	// Validate payment allocations
	if err := s.ValidatePaymentAllocations(req.Allocations, req.SupplierID); err != nil {
		return nil, fmt.Errorf("validation failed: %w", err)
	}

	// Start transaction
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to start transaction: %w", err)
	}
	defer tx.Rollback()

	// Get currency exchange rate if not provided
	var exchangeRate float64 = 1.0
	if req.ExchangeRate != nil {
		exchangeRate = *req.ExchangeRate
	} else {
		err = tx.QueryRowContext(ctx, 
			"SELECT exchange_rate FROM currencies WHERE id = $1 AND is_active = true", 
			req.CurrencyID).Scan(&exchangeRate)
		if err != nil {
			return nil, fmt.Errorf("failed to get currency exchange rate: %w", err)
		}
	}

	// Calculate total amount
	var totalAmount float64
	for _, allocation := range req.Allocations {
		totalAmount += allocation.AllocatedAmount
	}

	// Create payment record
	paymentQuery := `
		INSERT INTO payments (
			supplier_id, payment_date, total_amount, currency_id, exchange_rate,
			payment_method, reference_number, bank_account, notes, status,
			created_by_user_id, created_at, updated_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW()
		) RETURNING id, payment_number
	`

	var payment models.Payment
	err = tx.QueryRowContext(ctx, paymentQuery,
		req.SupplierID, req.PaymentDate, totalAmount, req.CurrencyID, exchangeRate,
		req.PaymentMethod, nullStringFromString(req.ReferenceNumber), 
		nullStringFromString(req.BankAccount), nullStringFromString(req.Notes), 
		models.PaymentStatusPending, userID).Scan(&payment.ID, &payment.PaymentNumber)
	if err != nil {
		return nil, fmt.Errorf("failed to create payment: %w", err)
	}

	// Create payment allocations
	for _, allocationReq := range req.Allocations {
		allocationQuery := `
			INSERT INTO payment_allocations (payment_id, invoice_id, allocated_amount, created_at)
			VALUES ($1, $2, $3, NOW())
		`

		_, err = tx.ExecContext(ctx, allocationQuery, 
			payment.ID, allocationReq.InvoiceID, allocationReq.AllocatedAmount)
		if err != nil {
			return nil, fmt.Errorf("failed to create payment allocation: %w", err)
		}

		// Update accounts payable record
		apRecord, err := s.getAPByInvoiceIDInTx(ctx, tx, allocationReq.InvoiceID)
		if err != nil {
			return nil, fmt.Errorf("failed to get AP record for invoice %d: %w", allocationReq.InvoiceID, err)
		}

		err = s.allocatePaymentInTx(ctx, tx, apRecord.ID, allocationReq.AllocatedAmount, payment.ID)
		if err != nil {
			return nil, fmt.Errorf("failed to allocate payment to AP: %w", err)
		}
	}

	// Commit transaction
	if err = tx.Commit(); err != nil {
		return nil, fmt.Errorf("failed to commit transaction: %w", err)
	}

	// Return created payment with details
	return s.GetPayment(ctx, payment.ID)
}

// GetPayments retrieves payments with filtering and pagination
func (s *paymentService) GetPayments(ctx context.Context, page, limit int, supplierID *int64, status string) ([]models.PaymentWithDetails, int, error) {
	offset := (page - 1) * limit
	
	// Build WHERE conditions
	var whereConditions []string
	var args []interface{}
	argIndex := 1
	
	if supplierID != nil {
		whereConditions = append(whereConditions, fmt.Sprintf("p.supplier_id = $%d", argIndex))
		args = append(args, *supplierID)
		argIndex++
	}
	
	if status != "" {
		whereConditions = append(whereConditions, fmt.Sprintf("p.status = $%d", argIndex))
		args = append(args, status)
		argIndex++
	}
	
	whereClause := ""
	if len(whereConditions) > 0 {
		whereClause = "WHERE " + strings.Join(whereConditions, " AND ")
	}

	// Count total records
	countQuery := fmt.Sprintf(`
		SELECT COUNT(*) 
		FROM payments p 
		%s
	`, whereClause)
	
	var total int
	err := s.db.QueryRowContext(ctx, countQuery, args...).Scan(&total)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to count payments: %w", err)
	}

	// Get payments with details
	query := fmt.Sprintf(`
		SELECT 
			p.id, p.payment_number, p.supplier_id, p.payment_date, p.total_amount,
			p.currency_id, p.exchange_rate, p.payment_method, p.reference_number,
			p.bank_account, p.notes, p.status, p.created_by_user_id, p.processed_at,
			p.created_at, p.updated_at,
			s.id, s.name, s.code, s.email, s.phone,
			c.id, c.code, c.name, c.symbol, c.exchange_rate,
			u.id, u.username, u.email
		FROM payments p
		LEFT JOIN suppliers s ON p.supplier_id = s.id
		LEFT JOIN currencies c ON p.currency_id = c.id
		LEFT JOIN users u ON p.created_by_user_id = u.id
		%s
		ORDER BY p.payment_date DESC, p.created_at DESC
		LIMIT $%d OFFSET $%d
	`, whereClause, argIndex, argIndex+1)

	args = append(args, limit, offset)

	rows, err := s.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to get payments: %w", err)
	}
	defer rows.Close()

	var payments []models.PaymentWithDetails
	for rows.Next() {
		var payment models.PaymentWithDetails
		var supplier models.Supplier
		var currency models.Currency
		var user models.User
		var referenceNumber, bankAccount, notes sql.NullString
		var processedAt sql.NullTime

		err := rows.Scan(
			&payment.ID, &payment.PaymentNumber, &payment.SupplierID, &payment.PaymentDate,
			&payment.TotalAmount, &payment.CurrencyID, &payment.ExchangeRate, 
			&payment.PaymentMethod, &referenceNumber, &bankAccount, &notes, 
			&payment.Status, &payment.CreatedByUserID, &processedAt,
			&payment.CreatedAt, &payment.UpdatedAt,
			&supplier.ID, &supplier.Name, &supplier.Code, &supplier.Email, &supplier.Phone,
			&currency.ID, &currency.Code, &currency.Name, &currency.Symbol, &currency.ExchangeRate,
			&user.ID, &user.Username, &user.Email,
		)
		if err != nil {
			return nil, 0, fmt.Errorf("failed to scan payment: %w", err)
		}

		// Handle nullable fields
		if referenceNumber.Valid {
			payment.ReferenceNumber = &referenceNumber.String
		}
		if bankAccount.Valid {
			payment.BankAccount = &bankAccount.String
		}
		if notes.Valid {
			payment.Notes = &notes.String
		}
		if processedAt.Valid {
			payment.ProcessedAt = &processedAt.Time
		}

		payment.Supplier = &supplier
		payment.Currency = &currency
		payment.CreatedByUser = &user

		payments = append(payments, payment)
	}

	// Get payment allocations for each payment
	for i := range payments {
		allocations, err := s.GetPaymentAllocations(ctx, payments[i].ID)
		if err != nil {
			return nil, 0, fmt.Errorf("failed to get payment allocations: %w", err)
		}
		payments[i].Allocations = allocations
	}

	return payments, total, nil
}

// GetPayment retrieves a single payment by ID with full details
func (s *paymentService) GetPayment(ctx context.Context, id int64) (*models.PaymentWithDetails, error) {
	query := `
		SELECT 
			p.id, p.payment_number, p.supplier_id, p.payment_date, p.total_amount,
			p.currency_id, p.exchange_rate, p.payment_method, p.reference_number,
			p.bank_account, p.notes, p.status, p.created_by_user_id, p.processed_at,
			p.created_at, p.updated_at,
			s.id, s.name, s.code, s.email, s.phone, s.address, s.city, s.state, s.country,
			c.id, c.code, c.name, c.symbol, c.exchange_rate,
			u.id, u.username, u.email
		FROM payments p
		LEFT JOIN suppliers s ON p.supplier_id = s.id
		LEFT JOIN currencies c ON p.currency_id = c.id
		LEFT JOIN users u ON p.created_by_user_id = u.id
		WHERE p.id = $1
	`

	var payment models.PaymentWithDetails
	var supplier models.Supplier
	var currency models.Currency
	var user models.User
	var referenceNumber, bankAccount, notes sql.NullString
	var processedAt sql.NullTime
	
	// Temporary variables for address fields (no longer needed since we use JSON)
	var tempCity, tempState, tempCountry sql.NullString

	err := s.db.QueryRowContext(ctx, query, id).Scan(
		&payment.ID, &payment.PaymentNumber, &payment.SupplierID, &payment.PaymentDate,
		&payment.TotalAmount, &payment.CurrencyID, &payment.ExchangeRate, 
		&payment.PaymentMethod, &referenceNumber, &bankAccount, &notes, 
		&payment.Status, &payment.CreatedByUserID, &processedAt,
		&payment.CreatedAt, &payment.UpdatedAt,
		&supplier.ID, &supplier.Name, &supplier.Code, &supplier.Email, &supplier.Phone,
		&supplier.Address, &tempCity, &tempState, &tempCountry,
		&currency.ID, &currency.Code, &currency.Name, &currency.Symbol, &currency.ExchangeRate,
		&user.ID, &user.Username, &user.Email,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("payment not found")
		}
		return nil, fmt.Errorf("failed to get payment: %w", err)
	}

	// Handle nullable fields
	if referenceNumber.Valid {
		payment.ReferenceNumber = &referenceNumber.String
	}
	if bankAccount.Valid {
		payment.BankAccount = &bankAccount.String
	}
	if notes.Valid {
		payment.Notes = &notes.String
	}
	if processedAt.Valid {
		payment.ProcessedAt = &processedAt.Time
	}

	payment.Supplier = &supplier
	payment.Currency = &currency
	payment.CreatedByUser = &user

	// Get payment allocations
	allocations, err := s.GetPaymentAllocations(ctx, payment.ID)
	if err != nil {
		return nil, fmt.Errorf("failed to get payment allocations: %w", err)
	}
	payment.Allocations = allocations

	return &payment, nil
}

// UpdatePayment updates an existing payment
func (s *paymentService) UpdatePayment(ctx context.Context, id int64, req *models.UpdatePaymentRequest, userID int64) (*models.PaymentWithDetails, error) {
	// Check if payment exists and can be updated
	var currentStatus string
	err := s.db.QueryRowContext(ctx, "SELECT status FROM payments WHERE id = $1", id).Scan(&currentStatus)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("payment not found")
		}
		return nil, fmt.Errorf("failed to get payment status: %w", err)
	}

	if currentStatus == models.PaymentStatusCompleted || currentStatus == models.PaymentStatusCancelled {
		return nil, fmt.Errorf("cannot update payment with status: %s", currentStatus)
	}

	// Start transaction
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to start transaction: %w", err)
	}
	defer tx.Rollback()

	// Get currency exchange rate if not provided
	var exchangeRate float64 = 1.0
	if req.ExchangeRate != nil {
		exchangeRate = *req.ExchangeRate
	} else {
		err = tx.QueryRowContext(ctx, 
			"SELECT exchange_rate FROM currencies WHERE id = $1 AND is_active = true", 
			req.CurrencyID).Scan(&exchangeRate)
		if err != nil {
			return nil, fmt.Errorf("failed to get currency exchange rate: %w", err)
		}
	}

	// Calculate total amount from allocations
	var totalAmount float64
	for _, allocation := range req.Allocations {
		totalAmount += allocation.AllocatedAmount
	}

	// Update payment
	updateQuery := `
		UPDATE payments SET
			payment_date = $1, total_amount = $2, currency_id = $3, exchange_rate = $4,
			payment_method = $5, reference_number = $6, bank_account = $7, 
			notes = $8, status = $9, updated_at = NOW()
		WHERE id = $10
	`

	_, err = tx.ExecContext(ctx, updateQuery,
		req.PaymentDate, totalAmount, req.CurrencyID, exchangeRate,
		req.PaymentMethod, nullStringFromString(req.ReferenceNumber), 
		nullStringFromString(req.BankAccount), nullStringFromString(req.Notes), 
		req.Status, id)
	if err != nil {
		return nil, fmt.Errorf("failed to update payment: %w", err)
	}

	// Delete existing allocations
	_, err = tx.ExecContext(ctx, "DELETE FROM payment_allocations WHERE payment_id = $1", id)
	if err != nil {
		return nil, fmt.Errorf("failed to delete payment allocations: %w", err)
	}

	// Create new allocations
	for _, allocationReq := range req.Allocations {
		allocationQuery := `
			INSERT INTO payment_allocations (payment_id, invoice_id, allocated_amount, created_at)
			VALUES ($1, $2, $3, NOW())
		`

		_, err = tx.ExecContext(ctx, allocationQuery, 
			id, allocationReq.InvoiceID, allocationReq.AllocatedAmount)
		if err != nil {
			return nil, fmt.Errorf("failed to create payment allocation: %w", err)
		}
	}

	// Commit transaction
	if err = tx.Commit(); err != nil {
		return nil, fmt.Errorf("failed to commit transaction: %w", err)
	}

	return s.GetPayment(ctx, id)
}

// DeletePayment deletes a payment (soft delete by setting status to cancelled)
func (s *paymentService) DeletePayment(ctx context.Context, id int64) error {
	// Check if payment can be deleted
	var status string
	err := s.db.QueryRowContext(ctx, "SELECT status FROM payments WHERE id = $1", id).Scan(&status)
	if err != nil {
		if err == sql.ErrNoRows {
			return fmt.Errorf("payment not found")
		}
		return fmt.Errorf("failed to get payment status: %w", err)
	}

	if status == models.PaymentStatusCompleted {
		return fmt.Errorf("cannot delete completed payment")
	}

	// Set status to cancelled
	_, err = s.db.ExecContext(ctx, 
		"UPDATE payments SET status = $1, updated_at = NOW() WHERE id = $2", 
		models.PaymentStatusCancelled, id)
	if err != nil {
		return fmt.Errorf("failed to delete payment: %w", err)
	}

	return nil
}

// ProcessPayment processes a payment and updates related AP records
func (s *paymentService) ProcessPayment(ctx context.Context, id int64, userID int64) (*models.PaymentWithDetails, error) {
	// Start transaction
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to start transaction: %w", err)
	}
	defer tx.Rollback()

	// Check payment status
	var currentStatus string
	err = tx.QueryRowContext(ctx, "SELECT status FROM payments WHERE id = $1", id).Scan(&currentStatus)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("payment not found")
		}
		return nil, fmt.Errorf("failed to get payment status: %w", err)
	}

	if currentStatus != models.PaymentStatusPending {
		return nil, fmt.Errorf("payment cannot be processed from status: %s", currentStatus)
	}

	// Update payment status to completed
	processedAt := time.Now()
	_, err = tx.ExecContext(ctx, 
		"UPDATE payments SET status = $1, processed_at = $2, updated_at = NOW() WHERE id = $3", 
		models.PaymentStatusCompleted, processedAt, id)
	if err != nil {
		return nil, fmt.Errorf("failed to update payment status: %w", err)
	}

	// Get payment allocations and update AP records
	allocations, err := s.getPaymentAllocationsInTx(ctx, tx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to get payment allocations: %w", err)
	}

	for _, allocation := range allocations {
		apRecord, err := s.getAPByInvoiceIDInTx(ctx, tx, allocation.InvoiceID)
		if err != nil {
			return nil, fmt.Errorf("failed to get AP record: %w", err)
		}

		err = s.allocatePaymentInTx(ctx, tx, apRecord.ID, allocation.AllocatedAmount, id)
		if err != nil {
			return nil, fmt.Errorf("failed to allocate payment: %w", err)
		}
	}

	// Commit transaction
	if err = tx.Commit(); err != nil {
		return nil, fmt.Errorf("failed to commit transaction: %w", err)
	}

	return s.GetPayment(ctx, id)
}

// CancelPayment cancels a payment
func (s *paymentService) CancelPayment(ctx context.Context, id int64, userID int64) (*models.PaymentWithDetails, error) {
	// Check payment status
	var currentStatus string
	err := s.db.QueryRowContext(ctx, "SELECT status FROM payments WHERE id = $1", id).Scan(&currentStatus)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("payment not found")
		}
		return nil, fmt.Errorf("failed to get payment status: %w", err)
	}

	if currentStatus == models.PaymentStatusCompleted {
		return nil, fmt.Errorf("cannot cancel completed payment")
	}

	// Update payment status to cancelled
	_, err = s.db.ExecContext(ctx, 
		"UPDATE payments SET status = $1, updated_at = NOW() WHERE id = $2", 
		models.PaymentStatusCancelled, id)
	if err != nil {
		return nil, fmt.Errorf("failed to cancel payment: %w", err)
	}

	return s.GetPayment(ctx, id)
}

// ValidatePaymentAllocations validates payment allocations
func (s *paymentService) ValidatePaymentAllocations(allocations []models.CreatePaymentAllocationRequest, supplierID int64) error {
	if len(allocations) == 0 {
		return fmt.Errorf("at least one allocation is required")
	}

	for i, allocation := range allocations {
		if allocation.InvoiceID <= 0 {
			return fmt.Errorf("allocation %d: invoice_id is required", i+1)
		}

		if allocation.AllocatedAmount <= 0 {
			return fmt.Errorf("allocation %d: allocated_amount must be positive", i+1)
		}

		// Check if invoice belongs to supplier and has outstanding amount
		var invoiceSupplierID int64
		var outstandingAmount float64
		err := s.db.QueryRowContext(context.Background(), `
			SELECT i.supplier_id, COALESCE(ap.outstanding_amount, i.total_amount)
			FROM invoices i
			LEFT JOIN accounts_payable ap ON i.id = ap.invoice_id
			WHERE i.id = $1
		`, allocation.InvoiceID).Scan(&invoiceSupplierID, &outstandingAmount)
		
		if err != nil {
			if err == sql.ErrNoRows {
				return fmt.Errorf("allocation %d: invoice not found", i+1)
			}
			return fmt.Errorf("allocation %d: failed to validate invoice: %w", i+1, err)
		}

		if invoiceSupplierID != supplierID {
			return fmt.Errorf("allocation %d: invoice does not belong to supplier", i+1)
		}

		if allocation.AllocatedAmount > outstandingAmount {
			return fmt.Errorf("allocation %d: allocated amount (%.2f) exceeds outstanding amount (%.2f)", 
				i+1, allocation.AllocatedAmount, outstandingAmount)
		}
	}

	return nil
}

// GetPaymentAllocations retrieves payment allocations for a payment
func (s *paymentService) GetPaymentAllocations(ctx context.Context, paymentID int64) ([]models.PaymentAllocationWithDetails, error) {
	return s.getPaymentAllocationsInTx(ctx, s.db, paymentID)
}

// Helper functions are now centralized in utils.go

// getPaymentAllocationsInTx retrieves payment allocations within a transaction
func (s *paymentService) getPaymentAllocationsInTx(ctx context.Context, execer interface{}, paymentID int64) ([]models.PaymentAllocationWithDetails, error) {
	var db interface {
		QueryContext(ctx context.Context, query string, args ...interface{}) (*sql.Rows, error)
	}

	switch v := execer.(type) {
	case *sql.DB:
		db = v
	case *sql.Tx:
		db = v
	default:
		return nil, fmt.Errorf("invalid execer type")
	}

	query := `
		SELECT 
			pa.id, pa.payment_id, pa.invoice_id, pa.allocated_amount, pa.created_at,
			i.id, i.invoice_number, i.invoice_date, i.total_amount, i.status
		FROM payment_allocations pa
		LEFT JOIN invoices i ON pa.invoice_id = i.id
		WHERE pa.payment_id = $1
		ORDER BY pa.id
	`

	rows, err := db.QueryContext(ctx, query, paymentID)
	if err != nil {
		return nil, fmt.Errorf("failed to query payment allocations: %w", err)
	}
	defer rows.Close()

	var allocations []models.PaymentAllocationWithDetails
	for rows.Next() {
		var allocation models.PaymentAllocationWithDetails
		var invoice models.Invoice

		err := rows.Scan(
			&allocation.ID, &allocation.PaymentID, &allocation.InvoiceID, 
			&allocation.AllocatedAmount, &allocation.CreatedAt,
			&invoice.ID, &invoice.InvoiceNumber, &invoice.InvoiceDate, 
			&invoice.TotalAmount, &invoice.Status,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan payment allocation: %w", err)
		}

		allocation.Invoice = &invoice
		allocations = append(allocations, allocation)
	}

	return allocations, nil
}

// getAPByInvoiceIDInTx retrieves AP record by invoice ID within a transaction
func (s *paymentService) getAPByInvoiceIDInTx(ctx context.Context, tx *sql.Tx, invoiceID int64) (*models.AccountsPayable, error) {
	var ap models.AccountsPayable
	var agingBucket sql.NullString

	err := tx.QueryRowContext(ctx, `
		SELECT id, invoice_id, supplier_id, amount, currency_id, due_date,
		       paid_amount, outstanding_amount, status, aging_bucket,
		       created_at, updated_at
		FROM accounts_payable WHERE invoice_id = $1
	`, invoiceID).Scan(
		&ap.ID, &ap.InvoiceID, &ap.SupplierID, &ap.Amount, &ap.CurrencyID, &ap.DueDate,
		&ap.PaidAmount, &ap.OutstandingAmount, &ap.Status, &agingBucket,
		&ap.CreatedAt, &ap.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to get AP record: %w", err)
	}

	if agingBucket.Valid {
		ap.AgingBucket = &agingBucket.String
	}

	return &ap, nil
}

// allocatePaymentInTx allocates payment to AP record within a transaction
func (s *paymentService) allocatePaymentInTx(ctx context.Context, tx *sql.Tx, apID int64, paymentAmount float64, paymentID int64) error {
	// Get current AP record
	var currentPaidAmount, outstandingAmount float64
	err := tx.QueryRowContext(ctx, 
		"SELECT paid_amount, outstanding_amount FROM accounts_payable WHERE id = $1", 
		apID).Scan(&currentPaidAmount, &outstandingAmount)
	if err != nil {
		return fmt.Errorf("failed to get AP record: %w", err)
	}

	// Check if payment amount doesn't exceed outstanding amount
	if paymentAmount > outstandingAmount {
		return fmt.Errorf("payment amount (%.2f) exceeds outstanding amount (%.2f)", paymentAmount, outstandingAmount)
	}

	// Update AP record
	newPaidAmount := currentPaidAmount + paymentAmount
	newOutstandingAmount := outstandingAmount - paymentAmount

	// Determine new status
	var newStatus string
	if newOutstandingAmount == 0 {
		newStatus = models.APStatusPaid
	} else if newPaidAmount > 0 {
		newStatus = models.APStatusPartiallyPaid
	} else {
		newStatus = models.APStatusPending
	}

	updateQuery := `
		UPDATE accounts_payable 
		SET paid_amount = $1, outstanding_amount = $2, status = $3, updated_at = NOW()
		WHERE id = $4
	`

	_, err = tx.ExecContext(ctx, updateQuery, newPaidAmount, newOutstandingAmount, newStatus, apID)
	if err != nil {
		return fmt.Errorf("failed to update AP record: %w", err)
	}

	return nil
}