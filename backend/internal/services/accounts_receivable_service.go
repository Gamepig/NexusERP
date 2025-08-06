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

type accountsReceivableService struct {
	db *sqlx.DB
}

// NewAccountsReceivableService creates a new accounts receivable service instance
func NewAccountsReceivableService(db *sqlx.DB) AccountsReceivableService {
	return &accountsReceivableService{
		db: db,
	}
}

// GetAccountsReceivable retrieves AR records with filtering and pagination
func (s *accountsReceivableService) GetAccountsReceivable(ctx context.Context, page, limit int, customerID *int64, status string, startDate, endDate *string) ([]models.AccountsReceivableWithDetails, int, error) {
	offset := (page - 1) * limit
	
	// Build the WHERE clause based on filters
	var whereClauses []string
	var args []interface{}
	argIndex := 1

	if customerID != nil {
		whereClauses = append(whereClauses, fmt.Sprintf("ar.customer_id = $%d", argIndex))
		args = append(args, *customerID)
		argIndex++
	}

	if status != "" {
		whereClauses = append(whereClauses, fmt.Sprintf("ar.status = $%d", argIndex))
		args = append(args, status)
		argIndex++
	}

	if startDate != nil && *startDate != "" {
		whereClauses = append(whereClauses, fmt.Sprintf("ar.due_date >= $%d", argIndex))
		args = append(args, *startDate)
		argIndex++
	}

	if endDate != nil && *endDate != "" {
		whereClauses = append(whereClauses, fmt.Sprintf("ar.due_date <= $%d", argIndex))
		args = append(args, *endDate)
		argIndex++
	}

	whereClause := ""
	if len(whereClauses) > 0 {
		whereClause = "WHERE " + strings.Join(whereClauses, " AND ")
	}

	// Query for getting the records
	query := fmt.Sprintf(`
		SELECT 
			ar.id, ar.invoice_id, ar.customer_id, ar.amount_due, ar.balance_due,
			ar.currency_id, ar.due_date, ar.status, ar.aging_bucket, ar.terms,
			ar.created_at, ar.updated_at,
			i.invoice_number, i.invoice_date, i.total_amount as invoice_total,
			c.customer_code, c.company_name, c.name,
			cur.code as currency_code, cur.symbol as currency_symbol
		FROM accounts_receivable ar
		LEFT JOIN invoices i ON ar.invoice_id = i.id
		LEFT JOIN customers c ON ar.customer_id = c.id
		LEFT JOIN currencies cur ON ar.currency_id = cur.id
		%s
		ORDER BY ar.due_date ASC, ar.created_at DESC
		LIMIT $%d OFFSET $%d`,
		whereClause, argIndex, argIndex+1)

	args = append(args, limit, offset)

	rows, err := s.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to query accounts receivable: %w", err)
	}
	defer rows.Close()

	var arRecords []models.AccountsReceivableWithDetails
	for rows.Next() {
		var ar models.AccountsReceivableWithDetails
		var invoice models.Invoice
		var customer models.Customer
		var currency models.Currency

		err := rows.Scan(
			&ar.ID, &ar.InvoiceID, &ar.CustomerID, &ar.AmountDue, &ar.BalanceDue,
			&ar.CurrencyID, &ar.DueDate, &ar.Status, &ar.AgingBucket, &ar.Terms,
			&ar.CreatedAt, &ar.UpdatedAt,
			&invoice.InvoiceNumber, &invoice.InvoiceDate, &invoice.TotalAmount,
			&customer.CustomerCode, &customer.CompanyName, &customer.Name,
			&currency.Code, &currency.Symbol,
		)
		if err != nil {
			return nil, 0, fmt.Errorf("failed to scan AR record: %w", err)
		}

		// Set related entities
		ar.Invoice = &invoice
		ar.Customer = &customer
		ar.Currency = &currency

		arRecords = append(arRecords, ar)
	}

	// Count query for pagination
	countQuery := fmt.Sprintf(`
		SELECT COUNT(*)
		FROM accounts_receivable ar
		%s`, whereClause)

	var total int
	countArgs := args[:len(args)-2] // Remove LIMIT and OFFSET
	err = s.db.QueryRowContext(ctx, countQuery, countArgs...).Scan(&total)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to count AR records: %w", err)
	}

	return arRecords, total, nil
}

// GetAccountsReceivableByID retrieves a specific AR record by ID
func (s *accountsReceivableService) GetAccountsReceivableByID(ctx context.Context, id int64) (*models.AccountsReceivableWithDetails, error) {
	query := `
		SELECT 
			ar.id, ar.invoice_id, ar.customer_id, ar.amount_due, ar.balance_due,
			ar.currency_id, ar.due_date, ar.status, ar.aging_bucket, ar.terms,
			ar.created_at, ar.updated_at,
			i.invoice_number, i.invoice_date, i.total_amount as invoice_total,
			i.invoice_type, i.description as invoice_description,
			c.customer_code, c.company_name, c.name, c.primary_email, c.primary_phone,
			c.address_line1, c.address_line2, c.credit_limit,
			cur.code as currency_code, cur.symbol as currency_symbol, cur.name as currency_name
		FROM accounts_receivable ar
		LEFT JOIN invoices i ON ar.invoice_id = i.id
		LEFT JOIN customers c ON ar.customer_id = c.id
		LEFT JOIN currencies cur ON ar.currency_id = cur.id
		WHERE ar.id = $1`

	var ar models.AccountsReceivableWithDetails
	var invoice models.Invoice
	var customer models.Customer
	var currency models.Currency

	err := s.db.QueryRowContext(ctx, query, id).Scan(
		&ar.ID, &ar.InvoiceID, &ar.CustomerID, &ar.AmountDue, &ar.BalanceDue,
		&ar.CurrencyID, &ar.DueDate, &ar.Status, &ar.AgingBucket, &ar.Terms,
		&ar.CreatedAt, &ar.UpdatedAt,
		&invoice.InvoiceNumber, &invoice.InvoiceDate, &invoice.TotalAmount,
		&invoice.InvoiceType, &invoice.Description,
		&customer.CustomerCode, &customer.CompanyName, &customer.Name,
		&customer.PrimaryEmail, &customer.PrimaryPhone, &customer.AddressLine1, &customer.AddressLine2,
		&customer.CreditLimit,
		&currency.Code, &currency.Symbol, &currency.Name,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("AR record with ID %d not found", id)
		}
		return nil, fmt.Errorf("failed to get AR record: %w", err)
	}

	// Set related entities
	ar.Invoice = &invoice
	ar.Customer = &customer
	ar.Currency = &currency

	return &ar, nil
}

// GetCustomerBalance calculates and returns detailed customer balance information
func (s *accountsReceivableService) GetCustomerBalance(ctx context.Context, customerID int64) (*models.CustomerBalanceInfo, error) {
	// Get customer basic info
	var customer models.Customer
	err := s.db.QueryRowContext(ctx, `
		SELECT customer_code, company_name, credit_limit 
		FROM customers 
		WHERE id = $1`, customerID).Scan(&customer.CustomerCode, &customer.CompanyName, &customer.CreditLimit)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("customer with ID %d not found", customerID)
		}
		return nil, fmt.Errorf("failed to get customer info: %w", err)
	}

	// Calculate balance information
	balanceQuery := `
		SELECT 
			COALESCE(SUM(ar.balance_due), 0) as total_balance,
			COALESCE(SUM(CASE WHEN ar.due_date >= NOW()::date THEN ar.balance_due ELSE 0 END), 0) as current_balance,
			COALESCE(SUM(CASE WHEN ar.due_date < NOW()::date THEN ar.balance_due ELSE 0 END), 0) as overdue_balance,
			COUNT(CASE WHEN ar.balance_due > 0 THEN 1 END) as outstanding_invoices,
			MIN(CASE WHEN ar.balance_due > 0 THEN ar.due_date END) as oldest_invoice_date,
			cur.code as currency_code
		FROM accounts_receivable ar
		LEFT JOIN currencies cur ON ar.currency_id = cur.id
		WHERE ar.customer_id = $1 AND ar.status IN ('open', 'partially_paid', 'overdue')
		GROUP BY cur.code`

	var totalBalance, currentBalance, overdueBalance float64
	var outstandingInvoices int
	var oldestInvoiceDate sql.NullTime
	var currencyCode sql.NullString

	err = s.db.QueryRowContext(ctx, balanceQuery, customerID).Scan(
		&totalBalance, &currentBalance, &overdueBalance, &outstandingInvoices, &oldestInvoiceDate, &currencyCode)
	if err != nil && err != sql.ErrNoRows {
		return nil, fmt.Errorf("failed to calculate customer balance: %w", err)
	}

	// Get last payment information
	lastPaymentQuery := `
		SELECT payment_date, amount
		FROM customer_payments
		WHERE customer_id = $1 AND status = 'completed'
		ORDER BY payment_date DESC, created_at DESC
		LIMIT 1`

	var lastPaymentDate sql.NullTime
	var lastPaymentAmount sql.NullFloat64
	err = s.db.QueryRowContext(ctx, lastPaymentQuery, customerID).Scan(&lastPaymentDate, &lastPaymentAmount)
	if err != nil && err != sql.ErrNoRows {
		return nil, fmt.Errorf("failed to get last payment info: %w", err)
	}

	// Calculate available credit
	availableCredit := customer.CreditLimit - totalBalance
	if availableCredit < 0 {
		availableCredit = 0
	}

	// Format dates
	var lastPaymentDateStr *string
	if lastPaymentDate.Valid {
		dateStr := lastPaymentDate.Time.Format("2006-01-02")
		lastPaymentDateStr = &dateStr
	}

	var oldestInvoiceDateStr *string
	if oldestInvoiceDate.Valid {
		dateStr := oldestInvoiceDate.Time.Format("2006-01-02")
		oldestInvoiceDateStr = &dateStr
	}

	var lastPaymentAmountPtr *float64
	if lastPaymentAmount.Valid {
		lastPaymentAmountPtr = &lastPaymentAmount.Float64
	}

	// Set default currency if none found
	currency := "USD"
	if currencyCode.Valid && currencyCode.String != "" {
		currency = currencyCode.String
	}

	// Use company name if available, otherwise use regular name
	customerName := customer.Name
	if customer.CompanyName != nil && *customer.CompanyName != "" {
		customerName = *customer.CompanyName
	}

	return &models.CustomerBalanceInfo{
		CustomerID:          customerID,
		CustomerName:        customerName,
		CustomerCode:        customer.CustomerCode,
		TotalBalance:        totalBalance,
		CurrentBalance:      currentBalance,
		OverdueBalance:      overdueBalance,
		CreditLimit:         customer.CreditLimit,
		AvailableCredit:     availableCredit,
		Currency:            currency,
		LastPaymentDate:     lastPaymentDateStr,
		LastPaymentAmount:   lastPaymentAmountPtr,
		OutstandingInvoices: outstandingInvoices,
		OldestInvoiceDate:   oldestInvoiceDateStr,
	}, nil
}

// GetCustomerBalanceSummary returns a simplified balance summary for a customer
func (s *accountsReceivableService) GetCustomerBalanceSummary(ctx context.Context, customerID int64) (*models.CustomerBalanceSummary, error) {
	query := `
		SELECT 
			COALESCE(SUM(ar.balance_due), 0) as total_balance,
			COALESCE(SUM(CASE WHEN ar.due_date < NOW()::date THEN ar.balance_due ELSE 0 END), 0) as overdue_balance,
			COALESCE(c.credit_limit, 0) as credit_limit,
			COALESCE(cur.code, 'USD') as currency_code
		FROM customers c
		LEFT JOIN accounts_receivable ar ON c.id = ar.customer_id AND ar.status IN ('open', 'partially_paid', 'overdue')
		LEFT JOIN currencies cur ON ar.currency_id = cur.id
		WHERE c.id = $1
		GROUP BY c.credit_limit, cur.code`

	var totalBalance, overdueBalance, creditLimit float64
	var currencyCode string

	err := s.db.QueryRowContext(ctx, query, customerID).Scan(&totalBalance, &overdueBalance, &creditLimit, &currencyCode)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("customer with ID %d not found", customerID)
		}
		return nil, fmt.Errorf("failed to get customer balance summary: %w", err)
	}

	availableCredit := creditLimit - totalBalance
	if availableCredit < 0 {
		availableCredit = 0
	}

	return &models.CustomerBalanceSummary{
		CustomerID:      customerID,
		TotalBalance:    totalBalance,
		OverdueBalance:  overdueBalance,
		AvailableCredit: availableCredit,
		Currency:        currencyCode,
	}, nil
}

// GetARAgingReport generates an aging report for accounts receivable
func (s *accountsReceivableService) GetARAgingReport(ctx context.Context, customerID *int64) (*models.ARAgingReport, error) {
	whereClause := ""
	var args []interface{}
	if customerID != nil {
		whereClause = "WHERE ar.customer_id = $1"
		args = append(args, *customerID)
	}

	query := fmt.Sprintf(`
		SELECT 
			c.id as customer_id,
			c.customer_code,
			c.company_name,
			cur.code as currency_code,
			COALESCE(SUM(CASE WHEN ar.due_date >= NOW()::date THEN ar.balance_due ELSE 0 END), 0) as current_amount,
			COALESCE(SUM(CASE WHEN ar.due_date < NOW()::date AND ar.due_date >= NOW()::date - INTERVAL '30 days' THEN ar.balance_due ELSE 0 END), 0) as days_1_to_30,
			COALESCE(SUM(CASE WHEN ar.due_date < NOW()::date - INTERVAL '30 days' AND ar.due_date >= NOW()::date - INTERVAL '60 days' THEN ar.balance_due ELSE 0 END), 0) as days_31_to_60,
			COALESCE(SUM(CASE WHEN ar.due_date < NOW()::date - INTERVAL '60 days' AND ar.due_date >= NOW()::date - INTERVAL '90 days' THEN ar.balance_due ELSE 0 END), 0) as days_61_to_90,
			COALESCE(SUM(CASE WHEN ar.due_date < NOW()::date - INTERVAL '90 days' THEN ar.balance_due ELSE 0 END), 0) as over_90_days,
			COALESCE(SUM(ar.balance_due), 0) as total_balance
		FROM customers c
		LEFT JOIN accounts_receivable ar ON c.id = ar.customer_id AND ar.status IN ('open', 'partially_paid', 'overdue')
		LEFT JOIN currencies cur ON ar.currency_id = cur.id
		%s
		GROUP BY c.id, c.customer_code, c.company_name, cur.code
		HAVING COALESCE(SUM(ar.balance_due), 0) > 0
		ORDER BY total_balance DESC`, whereClause)

	rows, err := s.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to generate AR aging report: %w", err)
	}
	defer rows.Close()

	var items []models.ARAgingReportItem
	var summary models.ARAgingReportSummary

	for rows.Next() {
		var item models.ARAgingReportItem
		err := rows.Scan(
			&item.CustomerID, &item.CustomerCode, &item.CustomerName, &item.CurrencyCode,
			&item.Current, &item.Days1to30, &item.Days31to60, &item.Days61to90,
			&item.Over90Days, &item.TotalBalance,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan aging report item: %w", err)
		}

		items = append(items, item)

		// Accumulate summary totals
		summary.Current += item.Current
		summary.Days1to30 += item.Days1to30
		summary.Days31to60 += item.Days31to60
		summary.Days61to90 += item.Days61to90
		summary.Over90Days += item.Over90Days
		summary.TotalBalance += item.TotalBalance
		summary.TotalCustomers++
	}

	return &models.ARAgingReport{
		GeneratedAt: time.Now(),
		Summary:     summary,
		Items:       items,
	}, nil
}

// UpdateAgingBuckets updates the aging buckets for all AR records
func (s *accountsReceivableService) UpdateAgingBuckets(ctx context.Context) error {
	query := `
		UPDATE accounts_receivable 
		SET aging_bucket = 
			CASE 
				WHEN due_date >= NOW()::date THEN 'current'
				WHEN due_date < NOW()::date AND due_date >= NOW()::date - INTERVAL '30 days' THEN '1-30_days'
				WHEN due_date < NOW()::date - INTERVAL '30 days' AND due_date >= NOW()::date - INTERVAL '60 days' THEN '31-60_days'
				WHEN due_date < NOW()::date - INTERVAL '60 days' AND due_date >= NOW()::date - INTERVAL '90 days' THEN '61-90_days'
				ELSE 'over_90_days'
			END,
			updated_at = NOW()
		WHERE status IN ('open', 'partially_paid', 'overdue')`

	_, err := s.db.ExecContext(ctx, query)
	if err != nil {
		return fmt.Errorf("failed to update aging buckets: %w", err)
	}

	return nil
}