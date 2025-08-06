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

type customerPaymentService struct {
	db *sqlx.DB
}

// NewCustomerPaymentService creates a new customer payment service instance
func NewCustomerPaymentService(db *sqlx.DB) CustomerPaymentService {
	return &customerPaymentService{
		db: db,
	}
}

// CreateCustomerPayment creates a new customer payment record
func (s *customerPaymentService) CreateCustomerPayment(ctx context.Context, req *models.CreateCustomerPaymentRequest, userID int64) (*models.CustomerPaymentWithDetails, error) {
	// Validate customer exists
	var customerExists bool
	err := s.db.QueryRowContext(ctx, "SELECT EXISTS(SELECT 1 FROM customers WHERE id = $1)", req.CustomerID).Scan(&customerExists)
	if err != nil {
		return nil, fmt.Errorf("failed to validate customer: %w", err)
	}
	if !customerExists {
		return nil, fmt.Errorf("customer with ID %d not found", req.CustomerID)
	}

	// Validate payment method
	validMethods := []string{
		models.CustomerPaymentMethodBankTransfer,
		models.CustomerPaymentMethodCheck,
		models.CustomerPaymentMethodCash,
		models.CustomerPaymentMethodCreditCard,
		models.CustomerPaymentMethodWireTransfer,
		models.CustomerPaymentMethodACH,
		models.CustomerPaymentMethodOnlinePayment,
	}
	if !containsString(validMethods, req.PaymentMethod) {
		return nil, fmt.Errorf("invalid payment method: %s", req.PaymentMethod)
	}

	// Get currency exchange rate if not provided
	var exchangeRate float64 = 1.0
	if req.ExchangeRate != nil {
		exchangeRate = *req.ExchangeRate
	} else {
		err = s.db.QueryRowContext(ctx, 
			"SELECT exchange_rate FROM currencies WHERE id = $1 AND is_active = true", 
			req.CurrencyID).Scan(&exchangeRate)
		if err != nil {
			return nil, fmt.Errorf("failed to get currency exchange rate: %w", err)
		}
	}

	// Create customer payment record
	paymentQuery := `
		INSERT INTO customer_payments (
			customer_id, payment_date, amount, currency_id, exchange_rate,
			payment_method, reference_number, bank_account, notes, status,
			unapplied_amount, created_by_user_id, created_at, updated_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW()
		) RETURNING id, payment_number
	`

	var payment models.CustomerPayment
	err = s.db.QueryRowContext(ctx, paymentQuery,
		req.CustomerID, req.PaymentDate, req.Amount, req.CurrencyID, exchangeRate,
		req.PaymentMethod, nullStringFromPointer(req.ReferenceNumber), 
		nullStringFromPointer(req.BankAccount), nullStringFromPointer(req.Notes), 
		models.CustomerPaymentStatusPending, req.Amount, userID).Scan(&payment.ID, &payment.PaymentNumber)
	if err != nil {
		return nil, fmt.Errorf("failed to create customer payment: %w", err)
	}

	// Return created payment with details
	return s.GetCustomerPayment(ctx, payment.ID)
}

// GetCustomerPayments retrieves customer payments with filtering and pagination
func (s *customerPaymentService) GetCustomerPayments(ctx context.Context, page, limit int, customerID *int64, status string) ([]models.CustomerPaymentWithDetails, int, error) {
	offset := (page - 1) * limit
	
	// Build WHERE conditions
	var whereConditions []string
	var args []interface{}
	argIndex := 1
	
	if customerID != nil {
		whereConditions = append(whereConditions, fmt.Sprintf("cp.customer_id = $%d", argIndex))
		args = append(args, *customerID)
		argIndex++
	}
	
	if status != "" {
		whereConditions = append(whereConditions, fmt.Sprintf("cp.status = $%d", argIndex))
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
		FROM customer_payments cp 
		%s
	`, whereClause)
	
	var total int
	err := s.db.QueryRowContext(ctx, countQuery, args...).Scan(&total)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to count customer payments: %w", err)
	}

	// Get payments with details
	query := fmt.Sprintf(`
		SELECT 
			cp.id, cp.payment_number, cp.customer_id, cp.payment_date, cp.amount,
			cp.currency_id, cp.exchange_rate, cp.payment_method, cp.reference_number,
			cp.bank_account, cp.notes, cp.status, cp.unapplied_amount, 
			cp.created_by_user_id, cp.processed_at, cp.created_at, cp.updated_at,
			c.id, c.name, c.primary_email, c.primary_phone,
			curr.id, curr.code, curr.name, curr.symbol, curr.exchange_rate,
			u.id, u.username, u.email
		FROM customer_payments cp
		LEFT JOIN customers c ON cp.customer_id = c.id
		LEFT JOIN currencies curr ON cp.currency_id = curr.id
		LEFT JOIN users u ON cp.created_by_user_id = u.id
		%s
		ORDER BY cp.payment_date DESC, cp.created_at DESC
		LIMIT $%d OFFSET $%d
	`, whereClause, argIndex, argIndex+1)

	args = append(args, limit, offset)

	rows, err := s.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to get customer payments: %w", err)
	}
	defer rows.Close()

	var payments []models.CustomerPaymentWithDetails
	for rows.Next() {
		var payment models.CustomerPaymentWithDetails
		var customer models.Customer
		var currency models.Currency
		var user models.User
		var referenceNumber, bankAccount, notes sql.NullString
		var processedAt sql.NullTime

		err := rows.Scan(
			&payment.ID, &payment.PaymentNumber, &payment.CustomerID, &payment.PaymentDate,
			&payment.Amount, &payment.CurrencyID, &payment.ExchangeRate, 
			&payment.PaymentMethod, &referenceNumber, &bankAccount, &notes, 
			&payment.Status, &payment.UnappliedAmount, &payment.CreatedByUserID, 
			&processedAt, &payment.CreatedAt, &payment.UpdatedAt,
			&customer.ID, &customer.Name, &customer.PrimaryEmail, &customer.PrimaryPhone,
			&currency.ID, &currency.Code, &currency.Name, &currency.Symbol, &currency.ExchangeRate,
			&user.ID, &user.Username, &user.Email,
		)
		if err != nil {
			return nil, 0, fmt.Errorf("failed to scan customer payment: %w", err)
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

		payment.Customer = &customer
		payment.Currency = &currency
		payment.CreatedByUser = &user

		payments = append(payments, payment)
	}

	return payments, total, nil
}

// GetCustomerPayment retrieves a single customer payment by ID with full details
func (s *customerPaymentService) GetCustomerPayment(ctx context.Context, id int64) (*models.CustomerPaymentWithDetails, error) {
	query := `
		SELECT 
			cp.id, cp.payment_number, cp.customer_id, cp.payment_date, cp.amount,
			cp.currency_id, cp.exchange_rate, cp.payment_method, cp.reference_number,
			cp.bank_account, cp.notes, cp.status, cp.unapplied_amount, 
			cp.created_by_user_id, cp.processed_at, cp.created_at, cp.updated_at,
			c.id, c.name, c.primary_email, c.primary_phone,
			curr.id, curr.code, curr.name, curr.symbol, curr.exchange_rate,
			u.id, u.username, u.email
		FROM customer_payments cp
		LEFT JOIN customers c ON cp.customer_id = c.id
		LEFT JOIN currencies curr ON cp.currency_id = curr.id
		LEFT JOIN users u ON cp.created_by_user_id = u.id
		WHERE cp.id = $1
	`

	var payment models.CustomerPaymentWithDetails
	var customer models.Customer
	var currency models.Currency
	var user models.User
	var referenceNumber, bankAccount, notes sql.NullString
	var processedAt sql.NullTime

	err := s.db.QueryRowContext(ctx, query, id).Scan(
		&payment.ID, &payment.PaymentNumber, &payment.CustomerID, &payment.PaymentDate,
		&payment.Amount, &payment.CurrencyID, &payment.ExchangeRate, 
		&payment.PaymentMethod, &referenceNumber, &bankAccount, &notes, 
		&payment.Status, &payment.UnappliedAmount, &payment.CreatedByUserID, 
		&processedAt, &payment.CreatedAt, &payment.UpdatedAt,
		&customer.ID, &customer.Name, &customer.PrimaryEmail, &customer.PrimaryPhone,
		&currency.ID, &currency.Code, &currency.Name, &currency.Symbol, &currency.ExchangeRate,
		&user.ID, &user.Username, &user.Email,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("customer payment not found")
		}
		return nil, fmt.Errorf("failed to get customer payment: %w", err)
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

	payment.Customer = &customer
	payment.Currency = &currency
	payment.CreatedByUser = &user

	return &payment, nil
}

// UpdateCustomerPayment updates an existing customer payment
func (s *customerPaymentService) UpdateCustomerPayment(ctx context.Context, id int64, req *models.UpdateCustomerPaymentRequest, userID int64) (*models.CustomerPaymentWithDetails, error) {
	// Check if payment exists and can be updated
	var currentStatus string
	err := s.db.QueryRowContext(ctx, "SELECT status FROM customer_payments WHERE id = $1", id).Scan(&currentStatus)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("customer payment not found")
		}
		return nil, fmt.Errorf("failed to get customer payment status: %w", err)
	}

	if currentStatus == models.CustomerPaymentStatusCompleted || currentStatus == models.CustomerPaymentStatusCancelled {
		return nil, fmt.Errorf("cannot update customer payment with status: %s", currentStatus)
	}

	// Get currency exchange rate if not provided
	var exchangeRate float64 = 1.0
	if req.ExchangeRate != nil {
		exchangeRate = *req.ExchangeRate
	} else {
		err = s.db.QueryRowContext(ctx, 
			"SELECT exchange_rate FROM currencies WHERE id = $1 AND is_active = true", 
			req.CurrencyID).Scan(&exchangeRate)
		if err != nil {
			return nil, fmt.Errorf("failed to get currency exchange rate: %w", err)
		}
	}

	// Update payment
	updateQuery := `
		UPDATE customer_payments SET
			payment_date = $1, amount = $2, currency_id = $3, exchange_rate = $4,
			payment_method = $5, reference_number = $6, bank_account = $7, 
			notes = $8, status = $9, unapplied_amount = $10, updated_at = NOW()
		WHERE id = $11
	`

	_, err = s.db.ExecContext(ctx, updateQuery,
		req.PaymentDate, req.Amount, req.CurrencyID, exchangeRate,
		req.PaymentMethod, nullStringFromPointer(req.ReferenceNumber), 
		nullStringFromPointer(req.BankAccount), nullStringFromPointer(req.Notes), 
		req.Status, req.Amount, id)
	if err != nil {
		return nil, fmt.Errorf("failed to update customer payment: %w", err)
	}

	return s.GetCustomerPayment(ctx, id)
}

// DeleteCustomerPayment deletes a customer payment (soft delete by setting status to cancelled)
func (s *customerPaymentService) DeleteCustomerPayment(ctx context.Context, id int64) error {
	// Check if payment can be deleted
	var status string
	err := s.db.QueryRowContext(ctx, "SELECT status FROM customer_payments WHERE id = $1", id).Scan(&status)
	if err != nil {
		if err == sql.ErrNoRows {
			return fmt.Errorf("customer payment not found")
		}
		return fmt.Errorf("failed to get customer payment status: %w", err)
	}

	if status == models.CustomerPaymentStatusCompleted {
		return fmt.Errorf("cannot delete completed customer payment")
	}

	// Set status to cancelled
	_, err = s.db.ExecContext(ctx, 
		"UPDATE customer_payments SET status = $1, updated_at = NOW() WHERE id = $2", 
		models.CustomerPaymentStatusCancelled, id)
	if err != nil {
		return fmt.Errorf("failed to delete customer payment: %w", err)
	}

	return nil
}

// ProcessCustomerPayment processes a customer payment and updates status
func (s *customerPaymentService) ProcessCustomerPayment(ctx context.Context, id int64, req *models.ProcessCustomerPaymentRequest, userID int64) (*models.CustomerPaymentWithDetails, error) {
	// Check payment status
	var currentStatus string
	err := s.db.QueryRowContext(ctx, "SELECT status FROM customer_payments WHERE id = $1", id).Scan(&currentStatus)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("customer payment not found")
		}
		return nil, fmt.Errorf("failed to get customer payment status: %w", err)
	}

	if currentStatus != models.CustomerPaymentStatusPending {
		return nil, fmt.Errorf("customer payment cannot be processed from status: %s", currentStatus)
	}

	// Update payment status to completed
	processedAt := time.Now()
	updateQuery := `
		UPDATE customer_payments 
		SET status = $1, processed_at = $2, updated_at = NOW()
	`
	args := []interface{}{models.CustomerPaymentStatusCompleted, processedAt}

	if req.Notes != nil {
		updateQuery += ", notes = $3"
		args = append(args, *req.Notes)
	}

	updateQuery += " WHERE id = $" + fmt.Sprintf("%d", len(args)+1)
	args = append(args, id)

	_, err = s.db.ExecContext(ctx, updateQuery, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to update customer payment status: %w", err)
	}

	return s.GetCustomerPayment(ctx, id)
}

// CancelCustomerPayment cancels a customer payment
func (s *customerPaymentService) CancelCustomerPayment(ctx context.Context, id int64, req *models.CancelCustomerPaymentRequest, userID int64) (*models.CustomerPaymentWithDetails, error) {
	// Check payment status
	var currentStatus string
	err := s.db.QueryRowContext(ctx, "SELECT status FROM customer_payments WHERE id = $1", id).Scan(&currentStatus)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("customer payment not found")
		}
		return nil, fmt.Errorf("failed to get customer payment status: %w", err)
	}

	if currentStatus == models.CustomerPaymentStatusCompleted {
		return nil, fmt.Errorf("cannot cancel completed customer payment")
	}

	// Update payment status to cancelled
	updateQuery := `
		UPDATE customer_payments 
		SET status = $1, updated_at = NOW()
	`
	args := []interface{}{models.CustomerPaymentStatusCancelled}

	if req.Reason != nil {
		updateQuery += ", notes = $2"
		args = append(args, *req.Reason)
	}

	updateQuery += " WHERE id = $" + fmt.Sprintf("%d", len(args)+1)
	args = append(args, id)

	_, err = s.db.ExecContext(ctx, updateQuery, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to cancel customer payment: %w", err)
	}

	return s.GetCustomerPayment(ctx, id)
}

// GetOutstandingAccountsReceivable retrieves outstanding AR records for a customer, ordered by due date (oldest first)
func (s *customerPaymentService) GetOutstandingAccountsReceivable(ctx context.Context, customerID int64) ([]models.AccountsReceivableWithDetails, error) {
	query := `
		SELECT 
			ar.id, ar.invoice_id, ar.customer_id, ar.amount_due, ar.balance_due,
			ar.currency_id, ar.due_date, ar.status, ar.aging_bucket, ar.terms,
			ar.created_at, ar.updated_at,
			i.id, i.invoice_number, i.invoice_type, i.invoice_date, i.due_date, 
			i.total_amount, i.status,
			c.id, c.name, c.primary_email, c.primary_phone,
			curr.id, curr.code, curr.name, curr.symbol, curr.exchange_rate
		FROM accounts_receivable ar
		LEFT JOIN invoices i ON ar.invoice_id = i.id
		LEFT JOIN customers c ON ar.customer_id = c.id
		LEFT JOIN currencies curr ON ar.currency_id = curr.id
		WHERE ar.customer_id = $1 AND ar.balance_due > 0 AND ar.status IN ('open', 'partially_paid', 'overdue')
		ORDER BY ar.due_date ASC, ar.created_at ASC
	`

	rows, err := s.db.QueryContext(ctx, query, customerID)
	if err != nil {
		return nil, fmt.Errorf("failed to get outstanding accounts receivable: %w", err)
	}
	defer rows.Close()

	var arRecords []models.AccountsReceivableWithDetails
	for rows.Next() {
		var ar models.AccountsReceivableWithDetails
		var invoice models.Invoice
		var customer models.Customer
		var currency models.Currency
		var arTerms, arAgingBucket sql.NullString

		err := rows.Scan(
			&ar.ID, &ar.InvoiceID, &ar.CustomerID, &ar.AmountDue, &ar.BalanceDue,
			&ar.CurrencyID, &ar.DueDate, &ar.Status, &arAgingBucket, &arTerms,
			&ar.CreatedAt, &ar.UpdatedAt,
			&invoice.ID, &invoice.InvoiceNumber, &invoice.InvoiceType, &invoice.InvoiceDate, &invoice.DueDate,
			&invoice.TotalAmount, &invoice.Status,
			&customer.ID, &customer.Name, &customer.PrimaryEmail, &customer.PrimaryPhone,
			&currency.ID, &currency.Code, &currency.Name, &currency.Symbol, &currency.ExchangeRate,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan accounts receivable record: %w", err)
		}

		// Handle nullable fields
		if arTerms.Valid {
			ar.Terms = &arTerms.String
		}
		if arAgingBucket.Valid {
			ar.AgingBucket = &arAgingBucket.String
		}

		// Set related objects
		ar.Invoice = &invoice
		ar.Customer = &customer
		ar.Currency = &currency

		arRecords = append(arRecords, ar)
	}

	return arRecords, nil
}

// ApplyCustomerPayment applies a customer payment to outstanding invoices
func (s *customerPaymentService) ApplyCustomerPayment(ctx context.Context, paymentID int64, req *models.ApplyCustomerPaymentRequest, userID int64) (*models.CustomerPaymentWithDetails, error) {
	// Begin transaction
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	// Get payment details and validate
	var payment models.CustomerPayment
	var customerID int64
	err = tx.QueryRowContext(ctx, `
		SELECT id, customer_id, amount, unapplied_amount, status 
		FROM customer_payments 
		WHERE id = $1
	`, paymentID).Scan(&payment.ID, &customerID, &payment.Amount, &payment.UnappliedAmount, &payment.Status)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("customer payment not found")
		}
		return nil, fmt.Errorf("failed to get customer payment: %w", err)
	}

	if payment.Status != models.CustomerPaymentStatusCompleted {
		return nil, fmt.Errorf("can only apply completed payments")
	}

	if payment.UnappliedAmount <= 0 {
		return nil, fmt.Errorf("payment has no unapplied amount to allocate")
	}

	var allocations []models.CreateCustomerPaymentAllocationRequest

	if req.ApplicationMode == models.PaymentApplicationModeAutomatic {
		// Automatic application: get outstanding AR records ordered by due date
		outstandingAR, err := s.getOutstandingARInTransaction(ctx, tx, customerID)
		if err != nil {
			return nil, fmt.Errorf("failed to get outstanding AR records: %w", err)
		}

		// Apply payment to oldest invoices first
		remainingAmount := payment.UnappliedAmount
		for _, ar := range outstandingAR {
			if remainingAmount <= 0 {
				break
			}

			allocateAmount := remainingAmount
			if allocateAmount > ar.BalanceDue {
				allocateAmount = ar.BalanceDue
			}

			allocations = append(allocations, models.CreateCustomerPaymentAllocationRequest{
				AccountsReceivableID: ar.ID,
				AllocatedAmount:      allocateAmount,
				Notes:                req.Notes,
			})

			remainingAmount -= allocateAmount
		}
	} else if req.ApplicationMode == models.PaymentApplicationModeManual {
		// Manual application: validate provided allocations
		if len(req.Allocations) == 0 {
			return nil, fmt.Errorf("manual application mode requires allocations")
		}

		totalAllocated := 0.0
		for _, allocation := range req.Allocations {
			totalAllocated += allocation.AllocatedAmount
		}

		if totalAllocated > payment.UnappliedAmount {
			return nil, fmt.Errorf("total allocation amount (%.2f) exceeds unapplied payment amount (%.2f)", 
				totalAllocated, payment.UnappliedAmount)
		}

		// Validate each allocation
		for _, allocation := range req.Allocations {
			var balanceDue float64
			err = tx.QueryRowContext(ctx, `
				SELECT balance_due 
				FROM accounts_receivable 
				WHERE id = $1 AND customer_id = $2 AND balance_due > 0
			`, allocation.AccountsReceivableID, customerID).Scan(&balanceDue)
			if err != nil {
				if err == sql.ErrNoRows {
					return nil, fmt.Errorf("accounts receivable record %d not found or has no outstanding balance", allocation.AccountsReceivableID)
				}
				return nil, fmt.Errorf("failed to validate AR record %d: %w", allocation.AccountsReceivableID, err)
			}

			if allocation.AllocatedAmount > balanceDue {
				return nil, fmt.Errorf("allocation amount %.2f exceeds balance due %.2f for AR record %d", 
					allocation.AllocatedAmount, balanceDue, allocation.AccountsReceivableID)
			}
		}

		allocations = req.Allocations
	} else {
		return nil, fmt.Errorf("invalid application mode: %s", req.ApplicationMode)
	}

	// Create payment allocations
	for _, allocation := range allocations {
		_, err = tx.ExecContext(ctx, `
			INSERT INTO customer_payment_allocations (
				payment_id, accounts_receivable_id, allocated_amount, allocation_date, notes
			) VALUES ($1, $2, $3, CURRENT_DATE, $4)
		`, paymentID, allocation.AccountsReceivableID, allocation.AllocatedAmount, allocation.Notes)
		if err != nil {
			return nil, fmt.Errorf("failed to create payment allocation: %w", err)
		}
	}

	// Update payment notes if provided
	if req.Notes != nil {
		_, err = tx.ExecContext(ctx, `
			UPDATE customer_payments 
			SET notes = COALESCE(notes, '') || CASE WHEN notes IS NOT NULL AND notes != '' THEN E'\n' ELSE '' END || $1,
			    updated_at = NOW()
			WHERE id = $2
		`, "Payment applied: "+*req.Notes, paymentID)
		if err != nil {
			return nil, fmt.Errorf("failed to update payment notes: %w", err)
		}
	}

	// Commit transaction
	if err = tx.Commit(); err != nil {
		return nil, fmt.Errorf("failed to commit transaction: %w", err)
	}

	// Return updated payment with details
	return s.GetCustomerPayment(ctx, paymentID)
}

// getOutstandingARInTransaction is a helper method to get outstanding AR records within a transaction
func (s *customerPaymentService) getOutstandingARInTransaction(ctx context.Context, tx *sql.Tx, customerID int64) ([]models.AccountsReceivable, error) {
	query := `
		SELECT id, invoice_id, customer_id, amount_due, balance_due, currency_id, due_date, status
		FROM accounts_receivable 
		WHERE customer_id = $1 AND balance_due > 0 AND status IN ('open', 'partially_paid', 'overdue')
		ORDER BY due_date ASC, created_at ASC
	`

	rows, err := tx.QueryContext(ctx, query, customerID)
	if err != nil {
		return nil, fmt.Errorf("failed to query outstanding AR: %w", err)
	}
	defer rows.Close()

	var arRecords []models.AccountsReceivable
	for rows.Next() {
		var ar models.AccountsReceivable
		err := rows.Scan(
			&ar.ID, &ar.InvoiceID, &ar.CustomerID, &ar.AmountDue, &ar.BalanceDue,
			&ar.CurrencyID, &ar.DueDate, &ar.Status,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan AR record: %w", err)
		}
		arRecords = append(arRecords, ar)
	}

	return arRecords, nil
}

// GetCustomerPaymentAllocations retrieves payment allocations for a specific payment
func (s *customerPaymentService) GetCustomerPaymentAllocations(ctx context.Context, paymentID int64) ([]models.CustomerPaymentAllocationWithDetails, error) {
	query := `
		SELECT 
			cpa.id, cpa.payment_id, cpa.accounts_receivable_id, cpa.allocated_amount,
			cpa.allocation_date, cpa.notes, cpa.created_at,
			ar.id, ar.invoice_id, ar.customer_id, ar.amount_due, ar.balance_due,
			ar.currency_id, ar.due_date, ar.status, ar.aging_bucket, ar.terms,
			ar.created_at, ar.updated_at
		FROM customer_payment_allocations cpa
		LEFT JOIN accounts_receivable ar ON cpa.accounts_receivable_id = ar.id
		WHERE cpa.payment_id = $1
		ORDER BY cpa.allocation_date ASC, cpa.created_at ASC
	`

	rows, err := s.db.QueryContext(ctx, query, paymentID)
	if err != nil {
		return nil, fmt.Errorf("failed to get payment allocations: %w", err)
	}
	defer rows.Close()

	var allocations []models.CustomerPaymentAllocationWithDetails
	for rows.Next() {
		var allocation models.CustomerPaymentAllocationWithDetails
		var ar models.AccountsReceivable
		var notes sql.NullString
		var arAgingBucket, arTerms sql.NullString

		err := rows.Scan(
			&allocation.ID, &allocation.PaymentID, &allocation.AccountsReceivableID, &allocation.AllocatedAmount,
			&allocation.AllocationDate, &notes, &allocation.CreatedAt,
			&ar.ID, &ar.InvoiceID, &ar.CustomerID, &ar.AmountDue, &ar.BalanceDue,
			&ar.CurrencyID, &ar.DueDate, &ar.Status, &arAgingBucket, &arTerms,
			&ar.CreatedAt, &ar.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan payment allocation: %w", err)
		}

		// Handle nullable fields
		if notes.Valid {
			allocation.Notes = &notes.String
		}
		if arAgingBucket.Valid {
			ar.AgingBucket = &arAgingBucket.String
		}
		if arTerms.Valid {
			ar.Terms = &arTerms.String
		}

		allocation.AccountsReceivable = &ar
		allocations = append(allocations, allocation)
	}

	return allocations, nil
}

// RemovePaymentAllocation removes a payment allocation
func (s *customerPaymentService) RemovePaymentAllocation(ctx context.Context, allocationID int64, userID int64) error {
	// Check if allocation exists and get payment details
	var paymentID int64
	var paymentStatus string
	err := s.db.QueryRowContext(ctx, `
		SELECT cp.id, cp.status
		FROM customer_payment_allocations cpa
		JOIN customer_payments cp ON cpa.payment_id = cp.id
		WHERE cpa.id = $1
	`, allocationID).Scan(&paymentID, &paymentStatus)
	if err != nil {
		if err == sql.ErrNoRows {
			return fmt.Errorf("payment allocation not found")
		}
		return fmt.Errorf("failed to get payment allocation details: %w", err)
	}

	if paymentStatus != models.CustomerPaymentStatusCompleted {
		return fmt.Errorf("can only remove allocations from completed payments")
	}

	// Delete the allocation (triggers will handle updating AR and payment)
	result, err := s.db.ExecContext(ctx, "DELETE FROM customer_payment_allocations WHERE id = $1", allocationID)
	if err != nil {
		return fmt.Errorf("failed to remove payment allocation: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get affected rows: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("payment allocation not found")
	}

	return nil
}

// Helper function to check if a slice contains a string
func containsString(slice []string, item string) bool {
	for _, s := range slice {
		if s == item {
			return true
		}
	}
	return false
}

// Helper function to convert string pointer to sql.NullString
func nullStringFromPointer(s *string) sql.NullString {
	if s == nil {
		return sql.NullString{}
	}
	return sql.NullString{String: *s, Valid: true}
}