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

type accountsPayableService struct {
	db *sqlx.DB
}

// NewAccountsPayableService creates a new accounts payable service instance
func NewAccountsPayableService(db *sqlx.DB) AccountsPayableService {
	return &accountsPayableService{
		db: db,
	}
}

// GetAccountsPayable retrieves accounts payable records with filtering and pagination
func (s *accountsPayableService) GetAccountsPayable(ctx context.Context, page, limit int, supplierID *int64, status string) ([]models.AccountsPayableWithDetails, int, error) {
	offset := (page - 1) * limit
	
	// Build WHERE conditions
	var whereConditions []string
	var args []interface{}
	argIndex := 1
	
	if supplierID != nil {
		whereConditions = append(whereConditions, fmt.Sprintf("ap.supplier_id = $%d", argIndex))
		args = append(args, *supplierID)
		argIndex++
	}
	
	if status != "" {
		whereConditions = append(whereConditions, fmt.Sprintf("ap.status = $%d", argIndex))
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
		FROM accounts_payable ap 
		%s
	`, whereClause)
	
	var total int
	err := s.db.QueryRowContext(ctx, countQuery, args...).Scan(&total)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to count accounts payable: %w", err)
	}

	// Get accounts payable with details
	query := fmt.Sprintf(`
		SELECT 
			ap.id, ap.invoice_id, ap.supplier_id, ap.amount, ap.currency_id, ap.due_date,
			ap.paid_amount, ap.outstanding_amount, ap.status, ap.aging_bucket, 
			ap.created_at, ap.updated_at,
			i.id, i.invoice_number, i.invoice_date, i.total_amount, i.status,
			s.id, s.name, s.code, s.email, s.phone,
			c.id, c.code, c.name, c.symbol, c.exchange_rate
		FROM accounts_payable ap
		LEFT JOIN invoices i ON ap.invoice_id = i.id
		LEFT JOIN suppliers s ON ap.supplier_id = s.id
		LEFT JOIN currencies c ON ap.currency_id = c.id
		%s
		ORDER BY ap.due_date ASC, ap.created_at DESC
		LIMIT $%d OFFSET $%d
	`, whereClause, argIndex, argIndex+1)

	args = append(args, limit, offset)

	rows, err := s.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to get accounts payable: %w", err)
	}
	defer rows.Close()

	var apRecords []models.AccountsPayableWithDetails
	for rows.Next() {
		var ap models.AccountsPayableWithDetails
		var invoice models.Invoice
		var supplier models.Supplier
		var currency models.Currency
		var agingBucket sql.NullString

		err := rows.Scan(
			&ap.ID, &ap.InvoiceID, &ap.SupplierID, &ap.Amount, &ap.CurrencyID, &ap.DueDate,
			&ap.PaidAmount, &ap.OutstandingAmount, &ap.Status, &agingBucket,
			&ap.CreatedAt, &ap.UpdatedAt,
			&invoice.ID, &invoice.InvoiceNumber, &invoice.InvoiceDate, &invoice.TotalAmount, &invoice.Status,
			&supplier.ID, &supplier.Name, &supplier.Code, &supplier.Email, &supplier.Phone,
			&currency.ID, &currency.Code, &currency.Name, &currency.Symbol, &currency.ExchangeRate,
		)
		if err != nil {
			return nil, 0, fmt.Errorf("failed to scan accounts payable: %w", err)
		}

		// Handle nullable fields
		if agingBucket.Valid {
			ap.AgingBucket = &agingBucket.String
		}

		ap.Invoice = &invoice
		ap.Supplier = &supplier
		ap.Currency = &currency

		apRecords = append(apRecords, ap)
	}

	return apRecords, total, nil
}

// GetAccountsPayableByID retrieves a single accounts payable record by ID
func (s *accountsPayableService) GetAccountsPayableByID(ctx context.Context, id int64) (*models.AccountsPayableWithDetails, error) {
	query := `
		SELECT 
			ap.id, ap.invoice_id, ap.supplier_id, ap.amount, ap.currency_id, ap.due_date,
			ap.paid_amount, ap.outstanding_amount, ap.status, ap.aging_bucket, 
			ap.created_at, ap.updated_at,
			i.id, i.invoice_number, i.invoice_date, i.due_date, i.total_amount, i.status,
			s.id, s.name, s.code, s.email, s.phone, s.address, s.city, s.state, s.country,
			c.id, c.code, c.name, c.symbol, c.exchange_rate
		FROM accounts_payable ap
		LEFT JOIN invoices i ON ap.invoice_id = i.id
		LEFT JOIN suppliers s ON ap.supplier_id = s.id
		LEFT JOIN currencies c ON ap.currency_id = c.id
		WHERE ap.id = $1
	`

	var ap models.AccountsPayableWithDetails
	var invoice models.Invoice
	var supplier models.Supplier
	var currency models.Currency
	var agingBucket sql.NullString
	
	// Temporary variables for address fields (no longer needed since we use JSON)
	var tempCity, tempState, tempCountry sql.NullString

	err := s.db.QueryRowContext(ctx, query, id).Scan(
		&ap.ID, &ap.InvoiceID, &ap.SupplierID, &ap.Amount, &ap.CurrencyID, &ap.DueDate,
		&ap.PaidAmount, &ap.OutstandingAmount, &ap.Status, &agingBucket,
		&ap.CreatedAt, &ap.UpdatedAt,
		&invoice.ID, &invoice.InvoiceNumber, &invoice.InvoiceDate, &invoice.DueDate, 
		&invoice.TotalAmount, &invoice.Status,
		&supplier.ID, &supplier.Name, &supplier.Code, &supplier.Email, &supplier.Phone,
		&supplier.Address, &tempCity, &tempState, &tempCountry,
		&currency.ID, &currency.Code, &currency.Name, &currency.Symbol, &currency.ExchangeRate,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("accounts payable record not found")
		}
		return nil, fmt.Errorf("failed to get accounts payable: %w", err)
	}

	// Handle nullable fields
	if agingBucket.Valid {
		ap.AgingBucket = &agingBucket.String
	}

	ap.Invoice = &invoice
	ap.Supplier = &supplier
	ap.Currency = &currency

	return &ap, nil
}

// GetAccountsPayableByInvoiceID retrieves accounts payable record by invoice ID
func (s *accountsPayableService) GetAccountsPayableByInvoiceID(ctx context.Context, invoiceID int64) (*models.AccountsPayableWithDetails, error) {
	query := `
		SELECT 
			ap.id, ap.invoice_id, ap.supplier_id, ap.amount, ap.currency_id, ap.due_date,
			ap.paid_amount, ap.outstanding_amount, ap.status, ap.aging_bucket, 
			ap.created_at, ap.updated_at,
			i.id, i.invoice_number, i.invoice_date, i.due_date, i.total_amount, i.status,
			s.id, s.name, s.code, s.email, s.phone,
			c.id, c.code, c.name, c.symbol, c.exchange_rate
		FROM accounts_payable ap
		LEFT JOIN invoices i ON ap.invoice_id = i.id
		LEFT JOIN suppliers s ON ap.supplier_id = s.id
		LEFT JOIN currencies c ON ap.currency_id = c.id
		WHERE ap.invoice_id = $1
	`

	var ap models.AccountsPayableWithDetails
	var invoice models.Invoice
	var supplier models.Supplier
	var currency models.Currency
	var agingBucket sql.NullString

	err := s.db.QueryRowContext(ctx, query, invoiceID).Scan(
		&ap.ID, &ap.InvoiceID, &ap.SupplierID, &ap.Amount, &ap.CurrencyID, &ap.DueDate,
		&ap.PaidAmount, &ap.OutstandingAmount, &ap.Status, &agingBucket,
		&ap.CreatedAt, &ap.UpdatedAt,
		&invoice.ID, &invoice.InvoiceNumber, &invoice.InvoiceDate, &invoice.DueDate, 
		&invoice.TotalAmount, &invoice.Status,
		&supplier.ID, &supplier.Name, &supplier.Code, &supplier.Email, &supplier.Phone,
		&currency.ID, &currency.Code, &currency.Name, &currency.Symbol, &currency.ExchangeRate,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("accounts payable record not found for invoice ID %d", invoiceID)
		}
		return nil, fmt.Errorf("failed to get accounts payable by invoice ID: %w", err)
	}

	// Handle nullable fields
	if agingBucket.Valid {
		ap.AgingBucket = &agingBucket.String
	}

	ap.Invoice = &invoice
	ap.Supplier = &supplier
	ap.Currency = &currency

	return &ap, nil
}

// AllocatePayment allocates a payment to an accounts payable record
func (s *accountsPayableService) AllocatePayment(ctx context.Context, apID int64, paymentAmount float64, paymentID int64) error {
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	// Get current AP record
	var currentPaidAmount, outstandingAmount float64
	err = tx.QueryRowContext(ctx, 
		"SELECT paid_amount, outstanding_amount FROM accounts_payable WHERE id = $1", 
		apID).Scan(&currentPaidAmount, &outstandingAmount)
	if err != nil {
		return fmt.Errorf("failed to get accounts payable record: %w", err)
	}

	// Check if payment amount doesn't exceed outstanding amount
	if paymentAmount > outstandingAmount {
		return fmt.Errorf("payment amount (%.2f) exceeds outstanding amount (%.2f)", paymentAmount, outstandingAmount)
	}

	// Update AP record with new payment allocation
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
		return fmt.Errorf("failed to update accounts payable: %w", err)
	}

	// Update aging bucket
	err = s.updateAgingBucketInTx(ctx, tx, apID)
	if err != nil {
		return fmt.Errorf("failed to update aging bucket: %w", err)
	}

	return tx.Commit()
}

// UpdateOutstandingAmount recalculates and updates the outstanding amount for an AP record
func (s *accountsPayableService) UpdateOutstandingAmount(ctx context.Context, apID int64) error {
	return s.updateOutstandingAmountInTx(ctx, s.db, apID)
}

// GetAPAgingReport generates an accounts payable aging report
func (s *accountsPayableService) GetAPAgingReport(ctx context.Context) (*models.APAgingReport, error) {
	// Query for AP aging data
	query := `
		SELECT 
			s.id, s.name, c.code as currency_code,
			SUM(CASE WHEN ap.aging_bucket = 'current' THEN ap.outstanding_amount ELSE 0 END) as current,
			SUM(CASE WHEN ap.aging_bucket = '1-30_days' THEN ap.outstanding_amount ELSE 0 END) as days_1_to_30,
			SUM(CASE WHEN ap.aging_bucket = '31-60_days' THEN ap.outstanding_amount ELSE 0 END) as days_31_to_60,
			SUM(CASE WHEN ap.aging_bucket = '61-90_days' THEN ap.outstanding_amount ELSE 0 END) as days_61_to_90,
			SUM(CASE WHEN ap.aging_bucket = 'over_90_days' THEN ap.outstanding_amount ELSE 0 END) as over_90_days,
			SUM(ap.outstanding_amount) as total_amount
		FROM accounts_payable ap
		JOIN suppliers s ON ap.supplier_id = s.id
		JOIN currencies c ON ap.currency_id = c.id
		WHERE ap.outstanding_amount > 0
		GROUP BY s.id, s.name, c.code
		ORDER BY total_amount DESC
	`

	rows, err := s.db.QueryContext(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to query AP aging data: %w", err)
	}
	defer rows.Close()

	var items []models.APAgingReportItem
	var summary models.APAgingReportSummary

	for rows.Next() {
		var item models.APAgingReportItem
		err := rows.Scan(
			&item.SupplierID, &item.SupplierName, &item.CurrencyCode,
			&item.Current, &item.Days1to30, &item.Days31to60, 
			&item.Days61to90, &item.Over90Days, &item.TotalAmount,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan AP aging item: %w", err)
		}

		items = append(items, item)

		// Accumulate summary totals
		summary.Current += item.Current
		summary.Days1to30 += item.Days1to30
		summary.Days31to60 += item.Days31to60
		summary.Days61to90 += item.Days61to90
		summary.Over90Days += item.Over90Days
		summary.TotalAmount += item.TotalAmount
	}

	summary.TotalSuppliers = len(items)

	return &models.APAgingReport{
		GeneratedAt: time.Now(),
		Summary:     summary,
		Items:       items,
	}, nil
}

// UpdateAgingBuckets updates aging buckets for all AP records
func (s *accountsPayableService) UpdateAgingBuckets(ctx context.Context) error {
	query := `
		UPDATE accounts_payable 
		SET aging_bucket = 
			CASE 
				WHEN due_date >= CURRENT_DATE THEN 'current'
				WHEN due_date >= CURRENT_DATE - INTERVAL '30 days' THEN '1-30_days'
				WHEN due_date >= CURRENT_DATE - INTERVAL '60 days' THEN '31-60_days'
				WHEN due_date >= CURRENT_DATE - INTERVAL '90 days' THEN '61-90_days'
				ELSE 'over_90_days'
			END,
			updated_at = NOW()
		WHERE outstanding_amount > 0
	`

	_, err := s.db.ExecContext(ctx, query)
	if err != nil {
		return fmt.Errorf("failed to update aging buckets: %w", err)
	}

	return nil
}

// UpdateAPStatus updates the status of an accounts payable record
func (s *accountsPayableService) UpdateAPStatus(ctx context.Context, apID int64, status string) error {
	// Validate status
	validStatuses := map[string]bool{
		models.APStatusPending:       true,
		models.APStatusPartiallyPaid: true,
		models.APStatusPaid:          true,
		models.APStatusOverdue:       true,
		models.APStatusDisputed:      true,
		models.APStatusCancelled:     true,
	}

	if !validStatuses[status] {
		return fmt.Errorf("invalid AP status: %s", status)
	}

	query := `
		UPDATE accounts_payable 
		SET status = $1, updated_at = NOW()
		WHERE id = $2
	`

	result, err := s.db.ExecContext(ctx, query, status, apID)
	if err != nil {
		return fmt.Errorf("failed to update AP status: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("accounts payable record not found")
	}

	return nil
}

// Helper functions

// updateOutstandingAmountInTx updates outstanding amount within a transaction
func (s *accountsPayableService) updateOutstandingAmountInTx(ctx context.Context, execer interface{}, apID int64) error {
	var db interface {
		QueryRowContext(ctx context.Context, query string, args ...interface{}) *sql.Row
		ExecContext(ctx context.Context, query string, args ...interface{}) (sql.Result, error)
	}

	switch v := execer.(type) {
	case *sql.DB:
		db = v
	case *sql.Tx:
		db = v
	default:
		return fmt.Errorf("invalid execer type")
	}

	// Get total amount and paid amount
	var totalAmount, paidAmount float64
	err := db.QueryRowContext(ctx, 
		"SELECT amount, paid_amount FROM accounts_payable WHERE id = $1", 
		apID).Scan(&totalAmount, &paidAmount)
	if err != nil {
		return fmt.Errorf("failed to get AP amounts: %w", err)
	}

	// Calculate outstanding amount
	outstandingAmount := totalAmount - paidAmount

	// Update outstanding amount
	_, err = db.ExecContext(ctx, 
		"UPDATE accounts_payable SET outstanding_amount = $1, updated_at = NOW() WHERE id = $2", 
		outstandingAmount, apID)
	if err != nil {
		return fmt.Errorf("failed to update outstanding amount: %w", err)
	}

	return nil
}

// updateAgingBucketInTx updates aging bucket for a specific AP record within a transaction
func (s *accountsPayableService) updateAgingBucketInTx(ctx context.Context, tx *sql.Tx, apID int64) error {
	query := `
		UPDATE accounts_payable 
		SET aging_bucket = 
			CASE 
				WHEN due_date >= CURRENT_DATE THEN 'current'
				WHEN due_date >= CURRENT_DATE - INTERVAL '30 days' THEN '1-30_days'
				WHEN due_date >= CURRENT_DATE - INTERVAL '60 days' THEN '31-60_days'
				WHEN due_date >= CURRENT_DATE - INTERVAL '90 days' THEN '61-90_days'
				ELSE 'over_90_days'
			END
		WHERE id = $1
	`

	_, err := tx.ExecContext(ctx, query, apID)
	if err != nil {
		return fmt.Errorf("failed to update aging bucket: %w", err)
	}

	return nil
}