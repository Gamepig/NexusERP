package services

import (
	"context"
	"database/sql"
	"fmt"

	"nexus-erp/backend/internal/models"

	"github.com/jmoiron/sqlx"
)

type supplierService struct {
	db *sqlx.DB
}

func NewSupplierService(db *sqlx.DB) SupplierService {
	return &supplierService{db: db}
}

func (s *supplierService) CreateSupplier(ctx context.Context, req models.CreateSupplierRequest) (*models.Supplier, error) {
	query := `
		INSERT INTO suppliers (code, name, contact_person, email, phone, address, tax_number, payment_terms, credit_limit, notes)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
		RETURNING id, code, name, contact_person, email, phone, address, tax_number, payment_terms, credit_limit, is_active, notes, created_at, updated_at
	`

	var supplier models.Supplier
	var contactPerson, email, phone, taxNumber, paymentTerms, notes sql.NullString
	var creditLimit sql.NullFloat64

	err := s.db.QueryRowContext(ctx, query, req.Code, req.Name, 
		nullStringFromString(req.ContactPerson), nullStringFromString(req.Email), 
		nullStringFromString(req.Phone), req.Address, nullStringFromString(req.TaxNumber), 
		nullStringFromString(req.PaymentTerms), req.CreditLimit, nullStringFromString(req.Notes)).
		Scan(&supplier.ID, &supplier.Code, &supplier.Name, &contactPerson, &email, &phone, 
			&supplier.Address, &taxNumber, &paymentTerms, &creditLimit, &supplier.IsActive, 
			&notes, &supplier.CreatedAt, &supplier.UpdatedAt)

	if err != nil {
		return nil, fmt.Errorf("failed to create supplier: %v", err)
	}

	// Convert nullable fields
	supplier.ContactPerson = nullStringToPointer(contactPerson)
	supplier.Email = nullStringToPointer(email)
	supplier.Phone = nullStringToPointer(phone)
	supplier.TaxNumber = nullStringToPointer(taxNumber)
	supplier.PaymentTerms = nullStringToPointer(paymentTerms)
	supplier.Notes = nullStringToPointer(notes)
	supplier.CreditLimit = nullFloat64ToPointer(creditLimit)

	return &supplier, nil
}

func (s *supplierService) GetSuppliers(ctx context.Context, page, limit int, search string, isActive *bool) ([]models.Supplier, int, error) {
	offset := (page - 1) * limit
	
	whereClause := "WHERE 1=1"
	args := []interface{}{}
	argIndex := 1

	if search != "" {
		whereClause += fmt.Sprintf(" AND (name ILIKE $%d OR code ILIKE $%d OR email ILIKE $%d OR contact_person ILIKE $%d)", argIndex, argIndex, argIndex, argIndex)
		args = append(args, "%"+search+"%")
		argIndex++
	}

	if isActive != nil {
		whereClause += fmt.Sprintf(" AND is_active = $%d", argIndex)
		args = append(args, *isActive)
		argIndex++
	}

	// Count total records
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM suppliers %s", whereClause)
	var total int
	err := s.db.QueryRowContext(ctx, countQuery, args...).Scan(&total)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to count suppliers: %v", err)
	}

	// Get suppliers
	query := fmt.Sprintf(`
		SELECT id, code, name, contact_person, email, phone, address, tax_number, payment_terms, credit_limit, is_active, notes, created_at, updated_at
		FROM suppliers %s
		ORDER BY created_at DESC
		LIMIT $%d OFFSET $%d
	`, whereClause, argIndex, argIndex+1)

	args = append(args, limit, offset)
	
	rows, err := s.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to get suppliers: %v", err)
	}
	defer rows.Close()

	var suppliers []models.Supplier
	for rows.Next() {
		var supplier models.Supplier
		var contactPerson, email, phone, taxNumber, paymentTerms, notes sql.NullString
		var creditLimit sql.NullFloat64

		err := rows.Scan(&supplier.ID, &supplier.Code, &supplier.Name, &contactPerson, &email, &phone, 
			&supplier.Address, &taxNumber, &paymentTerms, &creditLimit, &supplier.IsActive, 
			&notes, &supplier.CreatedAt, &supplier.UpdatedAt)
		if err != nil {
			return nil, 0, fmt.Errorf("failed to scan supplier: %v", err)
		}

		// Convert nullable fields
		supplier.ContactPerson = nullStringToPointer(contactPerson)
		supplier.Email = nullStringToPointer(email)
		supplier.Phone = nullStringToPointer(phone)
		supplier.TaxNumber = nullStringToPointer(taxNumber)
		supplier.PaymentTerms = nullStringToPointer(paymentTerms)
		supplier.Notes = nullStringToPointer(notes)
		supplier.CreditLimit = nullFloat64ToPointer(creditLimit)

		suppliers = append(suppliers, supplier)
	}

	return suppliers, total, nil
}

func (s *supplierService) GetSupplier(ctx context.Context, id int64) (*models.Supplier, error) {
	query := `
		SELECT id, code, name, contact_person, email, phone, address, tax_number, payment_terms, credit_limit, is_active, notes, created_at, updated_at
		FROM suppliers
		WHERE id = $1
	`

	var supplier models.Supplier
	var contactPerson, email, phone, taxNumber, paymentTerms, notes sql.NullString
	var creditLimit sql.NullFloat64

	err := s.db.QueryRowContext(ctx, query, id).
		Scan(&supplier.ID, &supplier.Code, &supplier.Name, &contactPerson, &email, &phone, 
			&supplier.Address, &taxNumber, &paymentTerms, &creditLimit, &supplier.IsActive, 
			&notes, &supplier.CreatedAt, &supplier.UpdatedAt)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("supplier not found")
		}
		return nil, fmt.Errorf("failed to get supplier: %v", err)
	}

	// Convert nullable fields
	supplier.ContactPerson = nullStringToPointer(contactPerson)
	supplier.Email = nullStringToPointer(email)
	supplier.Phone = nullStringToPointer(phone)
	supplier.TaxNumber = nullStringToPointer(taxNumber)
	supplier.PaymentTerms = nullStringToPointer(paymentTerms)
	supplier.Notes = nullStringToPointer(notes)
	supplier.CreditLimit = nullFloat64ToPointer(creditLimit)

	return &supplier, nil
}

func (s *supplierService) UpdateSupplier(ctx context.Context, id int64, req models.UpdateSupplierRequest) (*models.Supplier, error) {
	query := `
		UPDATE suppliers 
		SET code = $2, name = $3, contact_person = $4, email = $5, phone = $6, address = $7, 
			tax_number = $8, payment_terms = $9, credit_limit = $10, is_active = $11, notes = $12, updated_at = CURRENT_TIMESTAMP
		WHERE id = $1
		RETURNING id, code, name, contact_person, email, phone, address, tax_number, payment_terms, credit_limit, is_active, notes, created_at, updated_at
	`

	var supplier models.Supplier
	var contactPerson, email, phone, taxNumber, paymentTerms, notes sql.NullString
	var creditLimit sql.NullFloat64

	err := s.db.QueryRowContext(ctx, query, id, req.Code, req.Name, 
		nullStringFromString(req.ContactPerson), nullStringFromString(req.Email), 
		nullStringFromString(req.Phone), req.Address, nullStringFromString(req.TaxNumber), 
		nullStringFromString(req.PaymentTerms), req.CreditLimit, req.IsActive, 
		nullStringFromString(req.Notes)).
		Scan(&supplier.ID, &supplier.Code, &supplier.Name, &contactPerson, &email, &phone, 
			&supplier.Address, &taxNumber, &paymentTerms, &creditLimit, &supplier.IsActive, 
			&notes, &supplier.CreatedAt, &supplier.UpdatedAt)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("supplier not found")
		}
		return nil, fmt.Errorf("failed to update supplier: %v", err)
	}

	// Convert nullable fields
	supplier.ContactPerson = nullStringToPointer(contactPerson)
	supplier.Email = nullStringToPointer(email)
	supplier.Phone = nullStringToPointer(phone)
	supplier.TaxNumber = nullStringToPointer(taxNumber)
	supplier.PaymentTerms = nullStringToPointer(paymentTerms)
	supplier.Notes = nullStringToPointer(notes)
	supplier.CreditLimit = nullFloat64ToPointer(creditLimit)

	return &supplier, nil
}

func (s *supplierService) DeleteSupplier(ctx context.Context, id int64) error {
	query := `DELETE FROM suppliers WHERE id = $1`

	result, err := s.db.ExecContext(ctx, query, id)
	if err != nil {
		return fmt.Errorf("failed to delete supplier: %v", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %v", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("supplier not found")
	}

	return nil
}

func (s *supplierService) GetSupplierByCode(ctx context.Context, code string) (*models.Supplier, error) {
	query := `
		SELECT id, code, name, contact_person, email, phone, address, tax_number, payment_terms, credit_limit, is_active, notes, created_at, updated_at
		FROM suppliers
		WHERE code = $1
	`

	var supplier models.Supplier
	var contactPerson, email, phone, taxNumber, paymentTerms, notes sql.NullString
	var creditLimit sql.NullFloat64

	err := s.db.QueryRowContext(ctx, query, code).
		Scan(&supplier.ID, &supplier.Code, &supplier.Name, &contactPerson, &email, &phone, 
			&supplier.Address, &taxNumber, &paymentTerms, &creditLimit, &supplier.IsActive, 
			&notes, &supplier.CreatedAt, &supplier.UpdatedAt)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("supplier not found")
		}
		return nil, fmt.Errorf("failed to get supplier: %v", err)
	}

	// Convert nullable fields
	supplier.ContactPerson = nullStringToPointer(contactPerson)
	supplier.Email = nullStringToPointer(email)
	supplier.Phone = nullStringToPointer(phone)
	supplier.TaxNumber = nullStringToPointer(taxNumber)
	supplier.PaymentTerms = nullStringToPointer(paymentTerms)
	supplier.Notes = nullStringToPointer(notes)
	supplier.CreditLimit = nullFloat64ToPointer(creditLimit)

	return &supplier, nil
}

