package services

import (
	"database/sql"
	"errors"
	"fmt"
	"strings"

	"nexus-erp/backend/internal/models"

	"github.com/jmoiron/sqlx"
)

type CustomerService struct {
	db *sqlx.DB
}

func NewCustomerService(db *sqlx.DB) *CustomerService {
	return &CustomerService{db: db}
}

// CreateCustomer creates a new customer
func (s *CustomerService) CreateCustomer(req *models.CreateCustomerRequest, userID int64, companyID int64) (*models.Customer, error) {
	// Validate customer code uniqueness within company
	var exists bool
	err := s.db.QueryRow("SELECT EXISTS(SELECT 1 FROM customers WHERE customer_code = $1 AND company_id = $2 AND deleted_at IS NULL)", req.CustomerCode, companyID).Scan(&exists)
	if err != nil {
		return nil, fmt.Errorf("failed to check customer code existence: %w", err)
	}
	if exists {
		return nil, errors.New("customer with this code already exists")
	}

	// Set default values
	if req.Status == "" {
		req.Status = models.CustomerStatusActive
	}
	if req.CustomerType == "" {
		req.CustomerType = models.CustomerTypeIndividual
	}
	if req.Country == nil {
		defaultCountry := "Taiwan"
		req.Country = &defaultCountry
	}

	// Insert new customer
	customer := &models.Customer{}
	query := `
		INSERT INTO customers (
			company_id, customer_code, name, company_name, customer_type, status,
			primary_email, primary_phone,
			address_line1, address_line2, city, state, postal_code, country,
			tax_id, credit_limit, payment_terms, discount_percentage,
			industry, customer_segment, lead_source, assigned_sales_rep_id,
			notes, tags, custom_fields, created_by_user_id,
			created_at, updated_at
		) VALUES (
			$1, $2, $3, $4, $5, $6,
			$7, $8,
			$9, $10, $11, $12, $13, $14,
			$15, $16, $17, $18,
			$19, $20, $21, $22,
			$23, $24, $25, $26,
			CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
		) RETURNING *`

	err = s.db.QueryRowx(query,
		companyID, req.CustomerCode, req.Name, req.CompanyName, req.CustomerType, req.Status,
		req.PrimaryEmail, req.PrimaryPhone,
		req.AddressLine1, req.AddressLine2, req.City, req.State, req.PostalCode, req.Country,
		req.TaxID, req.CreditLimit, req.PaymentTerms, req.DiscountPercentage,
		req.Industry, req.CustomerSegment, req.LeadSource, req.AssignedSalesRepID,
		req.Notes, req.Tags, req.CustomFields, userID,
	).StructScan(customer)

	if err != nil {
		return nil, fmt.Errorf("failed to create customer: %w", err)
	}

	return customer, nil
}

// GetCustomer retrieves a customer by ID
func (s *CustomerService) GetCustomer(id int64, companyID int64) (*models.CustomerResponse, error) {
	customer := &models.Customer{}
	query := `SELECT * FROM customers WHERE id = $1 AND company_id = $2 AND deleted_at IS NULL`
	
	err := s.db.QueryRowx(query, id, companyID).StructScan(customer)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, errors.New("customer not found")
		}
		return nil, fmt.Errorf("failed to get customer: %w", err)
	}

	// Get customer contacts
	contacts, err := s.getCustomerContacts(id)
	if err != nil {
		return nil, fmt.Errorf("failed to get customer contacts: %w", err)
	}

	// Get recent activities
	activities, err := s.getRecentCustomerActivities(id, 10)
	if err != nil {
		return nil, fmt.Errorf("failed to get customer activities: %w", err)
	}

	// Get sales rep info
	var salesRep *models.User
	if customer.AssignedSalesRepID != nil {
		salesRep, err = s.getUserByID(*customer.AssignedSalesRepID)
		if err != nil {
			// Log error but don't fail the request
			salesRep = nil
		}
	}

	// Calculate credit info
	creditInfo := models.CustomerCreditInfo{
		CreditLimit:       customer.CreditLimit,
		CreditUsed:        customer.CreditUsed,
		CreditAvailable:   customer.CreditLimit - customer.CreditUsed,
		CreditUtilization: 0,
	}
	if customer.CreditLimit > 0 {
		creditInfo.CreditUtilization = (customer.CreditUsed / customer.CreditLimit) * 100
	}

	response := &models.CustomerResponse{
		Customer:   *customer,
		Contacts:   contacts,
		Activities: activities,
		SalesRep:   salesRep,
		CreditInfo: creditInfo,
	}

	return response, nil
}

// GetCustomers retrieves a paginated list of customers
func (s *CustomerService) GetCustomers(params *models.CustomerQueryParams, companyID int64) (*models.CustomerListResponse, error) {
	// Build WHERE clause with company isolation
	whereConditions := []string{"deleted_at IS NULL", "company_id = $1"}
	args := []interface{}{companyID}
	argIndex := 2

	if params.Search != "" {
		whereConditions = append(whereConditions, fmt.Sprintf("(name ILIKE $%d OR company_name ILIKE $%d OR customer_code ILIKE $%d OR primary_email ILIKE $%d OR primary_phone ILIKE $%d)", argIndex, argIndex, argIndex, argIndex, argIndex))
		args = append(args, "%"+params.Search+"%")
		argIndex++
	}

	if params.CustomerType != "" {
		whereConditions = append(whereConditions, fmt.Sprintf("customer_type = $%d", argIndex))
		args = append(args, params.CustomerType)
		argIndex++
	}

	if params.Status != "" {
		whereConditions = append(whereConditions, fmt.Sprintf("status = $%d", argIndex))
		args = append(args, params.Status)
		argIndex++
	}

	if params.CustomerSegment != "" {
		whereConditions = append(whereConditions, fmt.Sprintf("customer_segment = $%d", argIndex))
		args = append(args, params.CustomerSegment)
		argIndex++
	}

	if params.SalesRepID != nil {
		whereConditions = append(whereConditions, fmt.Sprintf("assigned_sales_rep_id = $%d", argIndex))
		args = append(args, *params.SalesRepID)
		argIndex++
	}

	whereClause := strings.Join(whereConditions, " AND ")

	// Get total count
	var total int64
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM customers WHERE %s", whereClause)
	err := s.db.QueryRow(countQuery, args...).Scan(&total)
	if err != nil {
		return nil, fmt.Errorf("failed to get customer count: %w", err)
	}

	// Build ORDER BY clause
	orderBy := "created_at DESC"
	if params.SortBy != "" {
		orderBy = params.SortBy
		if params.SortOrder != "" {
			orderBy += " " + strings.ToUpper(params.SortOrder)
		}
	}

	// Build main query with pagination
	offset := (params.Page - 1) * params.PageSize
	query := fmt.Sprintf(`
		SELECT * FROM customers 
		WHERE %s 
		ORDER BY %s 
		LIMIT $%d OFFSET $%d`,
		whereClause, orderBy, argIndex, argIndex+1)

	args = append(args, params.PageSize, offset)

	var customers []models.Customer
	err = s.db.Select(&customers, query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to get customers: %w", err)
	}

	// Calculate total pages
	totalPages := int((total + int64(params.PageSize) - 1) / int64(params.PageSize))

	response := &models.CustomerListResponse{
		Customers: customers,
		Total:     total,
		Page:      params.Page,
		PageSize:  params.PageSize,
		Pages:     totalPages,
	}

	return response, nil
}

// UpdateCustomer updates an existing customer
func (s *CustomerService) UpdateCustomer(id int64, req *models.UpdateCustomerRequest, companyID int64) (*models.Customer, error) {
	// Check if customer exists in company
	var exists bool
	err := s.db.QueryRow("SELECT EXISTS(SELECT 1 FROM customers WHERE id = $1 AND company_id = $2 AND deleted_at IS NULL)", id, companyID).Scan(&exists)
	if err != nil {
		return nil, fmt.Errorf("failed to check customer existence: %w", err)
	}
	if !exists {
		return nil, errors.New("customer not found")
	}

	// Build update query dynamically
	setParts := []string{"updated_at = CURRENT_TIMESTAMP"}
	args := []interface{}{}
	argIndex := 1

	if req.Name != nil {
		setParts = append(setParts, fmt.Sprintf("name = $%d", argIndex))
		args = append(args, *req.Name)
		argIndex++
	}

	if req.CompanyName != nil {
		setParts = append(setParts, fmt.Sprintf("company_name = $%d", argIndex))
		args = append(args, *req.CompanyName)
		argIndex++
	}

	if req.CustomerType != nil {
		setParts = append(setParts, fmt.Sprintf("customer_type = $%d", argIndex))
		args = append(args, *req.CustomerType)
		argIndex++
	}

	if req.Status != nil {
		setParts = append(setParts, fmt.Sprintf("status = $%d", argIndex))
		args = append(args, *req.Status)
		argIndex++
	}

	if req.PrimaryEmail != nil {
		setParts = append(setParts, fmt.Sprintf("primary_email = $%d", argIndex))
		args = append(args, *req.PrimaryEmail)
		argIndex++
	}

	if req.PrimaryPhone != nil {
		setParts = append(setParts, fmt.Sprintf("primary_phone = $%d", argIndex))
		args = append(args, *req.PrimaryPhone)
		argIndex++
	}

	if req.AddressLine1 != nil {
		setParts = append(setParts, fmt.Sprintf("address_line1 = $%d", argIndex))
		args = append(args, *req.AddressLine1)
		argIndex++
	}

	if req.AddressLine2 != nil {
		setParts = append(setParts, fmt.Sprintf("address_line2 = $%d", argIndex))
		args = append(args, *req.AddressLine2)
		argIndex++
	}

	if req.City != nil {
		setParts = append(setParts, fmt.Sprintf("city = $%d", argIndex))
		args = append(args, *req.City)
		argIndex++
	}

	if req.State != nil {
		setParts = append(setParts, fmt.Sprintf("state = $%d", argIndex))
		args = append(args, *req.State)
		argIndex++
	}

	if req.PostalCode != nil {
		setParts = append(setParts, fmt.Sprintf("postal_code = $%d", argIndex))
		args = append(args, *req.PostalCode)
		argIndex++
	}

	if req.Country != nil {
		setParts = append(setParts, fmt.Sprintf("country = $%d", argIndex))
		args = append(args, *req.Country)
		argIndex++
	}

	if req.TaxID != nil {
		setParts = append(setParts, fmt.Sprintf("tax_id = $%d", argIndex))
		args = append(args, *req.TaxID)
		argIndex++
	}

	if req.CreditLimit != nil {
		setParts = append(setParts, fmt.Sprintf("credit_limit = $%d", argIndex))
		args = append(args, *req.CreditLimit)
		argIndex++
	}

	if req.PaymentTerms != nil {
		setParts = append(setParts, fmt.Sprintf("payment_terms = $%d", argIndex))
		args = append(args, *req.PaymentTerms)
		argIndex++
	}

	if req.DiscountPercentage != nil {
		setParts = append(setParts, fmt.Sprintf("discount_percentage = $%d", argIndex))
		args = append(args, *req.DiscountPercentage)
		argIndex++
	}

	if req.Industry != nil {
		setParts = append(setParts, fmt.Sprintf("industry = $%d", argIndex))
		args = append(args, *req.Industry)
		argIndex++
	}

	if req.CustomerSegment != nil {
		setParts = append(setParts, fmt.Sprintf("customer_segment = $%d", argIndex))
		args = append(args, *req.CustomerSegment)
		argIndex++
	}

	if req.LeadSource != nil {
		setParts = append(setParts, fmt.Sprintf("lead_source = $%d", argIndex))
		args = append(args, *req.LeadSource)
		argIndex++
	}

	if req.AssignedSalesRepID != nil {
		setParts = append(setParts, fmt.Sprintf("assigned_sales_rep_id = $%d", argIndex))
		args = append(args, *req.AssignedSalesRepID)
		argIndex++
	}

	if req.Notes != nil {
		setParts = append(setParts, fmt.Sprintf("notes = $%d", argIndex))
		args = append(args, *req.Notes)
		argIndex++
	}

	if req.Tags != nil {
		setParts = append(setParts, fmt.Sprintf("tags = $%d", argIndex))
		args = append(args, req.Tags)
		argIndex++
	}

	if req.CustomFields != nil {
		setParts = append(setParts, fmt.Sprintf("custom_fields = $%d", argIndex))
		args = append(args, req.CustomFields)
		argIndex++
	}

	if len(setParts) == 1 {
		return nil, errors.New("no fields to update")
	}

	// Add customer ID to args
	args = append(args, id)

	query := fmt.Sprintf("UPDATE customers SET %s WHERE id = $%d AND company_id = $%d AND deleted_at IS NULL RETURNING *",
		strings.Join(setParts, ", "), argIndex, argIndex+1)
	
	// Add company ID to args
	args = append(args, companyID)

	customer := &models.Customer{}
	err = s.db.QueryRowx(query, args...).StructScan(customer)
	if err != nil {
		return nil, fmt.Errorf("failed to update customer: %w", err)
	}

	return customer, nil
}

// DeleteCustomer soft deletes a customer
func (s *CustomerService) DeleteCustomer(id int64, companyID int64) error {
	query := `UPDATE customers SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1 AND company_id = $2 AND deleted_at IS NULL`
	result, err := s.db.Exec(query, id, companyID)
	if err != nil {
		return fmt.Errorf("failed to delete customer: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return errors.New("customer not found")
	}

	return nil
}

// Customer Contact Methods

// CreateCustomerContact creates a new customer contact
func (s *CustomerService) CreateCustomerContact(req *models.CreateCustomerContactRequest, companyID int64) (*models.CustomerContact, error) {
	// Check if customer exists in company
	var exists bool
	err := s.db.QueryRow("SELECT EXISTS(SELECT 1 FROM customers WHERE id = $1 AND company_id = $2 AND deleted_at IS NULL)", req.CustomerID, companyID).Scan(&exists)
	if err != nil {
		return nil, fmt.Errorf("failed to check customer existence: %w", err)
	}
	if !exists {
		return nil, errors.New("customer not found")
	}

	// If this is set as primary, unset other primary contacts for this customer
	if req.IsPrimary {
		_, err = s.db.Exec("UPDATE customer_contacts SET is_primary = false WHERE customer_id = $1 AND deleted_at IS NULL", req.CustomerID)
		if err != nil {
			return nil, fmt.Errorf("failed to unset other primary contacts: %w", err)
		}
	}

	// Set default values
	if req.ContactType == "" {
		req.ContactType = models.ContactTypeGeneral
	}
	if req.PreferredContactMethod == "" {
		req.PreferredContactMethod = "email"
	}

	contact := &models.CustomerContact{}
	query := `
		INSERT INTO customer_contacts (
			customer_id, contact_type,
			first_name, last_name, title, department,
			email, phone, mobile, fax,
			address_line1, address_line2, city, state, postal_code, country,
			is_primary, receive_marketing, receive_invoices, receive_shipping_updates, preferred_contact_method,
			notes, tags,
			created_at, updated_at
		) VALUES (
			$1, $2,
			$3, $4, $5, $6,
			$7, $8, $9, $10,
			$11, $12, $13, $14, $15, $16,
			$17, $18, $19, $20, $21,
			$22, $23,
			CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
		) RETURNING *`

	err = s.db.QueryRowx(query,
		req.CustomerID, req.ContactType,
		req.FirstName, req.LastName, req.Title, req.Department,
		req.Email, req.Phone, req.Mobile, req.Fax,
		req.AddressLine1, req.AddressLine2, req.City, req.State, req.PostalCode, req.Country,
		req.IsPrimary, req.ReceiveMarketing, req.ReceiveInvoices, req.ReceiveShippingUpdates, req.PreferredContactMethod,
		req.Notes, req.Tags,
	).StructScan(contact)

	if err != nil {
		return nil, fmt.Errorf("failed to create customer contact: %w", err)
	}

	return contact, nil
}

// CreateCustomerActivity creates a new customer activity
func (s *CustomerService) CreateCustomerActivity(req *models.CreateCustomerActivityRequest, userID int64, companyID int64) (*models.CustomerActivity, error) {
	// Check if customer exists in company
	var exists bool
	err := s.db.QueryRow("SELECT EXISTS(SELECT 1 FROM customers WHERE id = $1 AND company_id = $2 AND deleted_at IS NULL)", req.CustomerID, companyID).Scan(&exists)
	if err != nil {
		return nil, fmt.Errorf("failed to check customer existence: %w", err)
	}
	if !exists {
		return nil, errors.New("customer not found")
	}

	// Check if contact exists (if provided)
	if req.ContactID != nil {
		err = s.db.QueryRow("SELECT EXISTS(SELECT 1 FROM customer_contacts WHERE id = $1 AND customer_id = $2 AND deleted_at IS NULL)", *req.ContactID, req.CustomerID).Scan(&exists)
		if err != nil {
			return nil, fmt.Errorf("failed to check contact existence: %w", err)
		}
		if !exists {
			return nil, errors.New("contact not found")
		}
	}

	// Set default values
	if req.Status == "" {
		req.Status = models.ActivityStatusCompleted
	}
	if req.Priority == "" {
		req.Priority = models.ActivityPriorityMedium
	}

	activity := &models.CustomerActivity{}
	query := `
		INSERT INTO customer_activities (
			customer_id, contact_id,
			activity_type, activity_subtype, subject, description,
			status, priority,
			related_document_type, related_document_id,
			created_by_user_id, assigned_to_user_id,
			scheduled_at, duration_minutes,
			follow_up_required, follow_up_date, follow_up_notes,
			tags, custom_fields,
			created_at, updated_at
		) VALUES (
			$1, $2,
			$3, $4, $5, $6,
			$7, $8,
			$9, $10,
			$11, $12,
			$13, $14,
			$15, $16, $17,
			$18, $19,
			CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
		) RETURNING *`

	err = s.db.QueryRowx(query,
		req.CustomerID, req.ContactID,
		req.ActivityType, req.ActivitySubtype, req.Subject, req.Description,
		req.Status, req.Priority,
		req.RelatedDocumentType, req.RelatedDocumentID,
		userID, req.AssignedToUserID,
		req.ScheduledAt, req.DurationMinutes,
		req.FollowUpRequired, req.FollowUpDate, req.FollowUpNotes,
		req.Tags, req.CustomFields,
	).StructScan(activity)

	if err != nil {
		return nil, fmt.Errorf("failed to create customer activity: %w", err)
	}

	return activity, nil
}

// UpdateCreditLimit updates a customer's credit limit with history tracking
func (s *CustomerService) UpdateCreditLimit(customerID int64, newLimit float64, reason string, userID int64, companyID int64) error {
	tx, err := s.db.Beginx()
	if err != nil {
		return fmt.Errorf("failed to start transaction: %w", err)
	}
	defer tx.Rollback()

	// Get current credit limit
	var currentLimit float64
	err = tx.QueryRow("SELECT credit_limit FROM customers WHERE id = $1 AND company_id = $2 AND deleted_at IS NULL", customerID, companyID).Scan(&currentLimit)
	if err != nil {
		if err == sql.ErrNoRows {
			return errors.New("customer not found")
		}
		return fmt.Errorf("failed to get current credit limit: %w", err)
	}

	// Update customer credit limit
	_, err = tx.Exec("UPDATE customers SET credit_limit = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND company_id = $3", newLimit, customerID, companyID)
	if err != nil {
		return fmt.Errorf("failed to update credit limit: %w", err)
	}

	// Determine change type
	changeType := models.CreditChangeAdjustment
	amount := newLimit - currentLimit
	if amount > 0 {
		changeType = models.CreditChangeIncrease
	} else if amount < 0 {
		changeType = models.CreditChangeDecrease
		amount = -amount
	}

	// Insert credit history record
	_, err = tx.Exec(`
		INSERT INTO customer_credit_history (
			customer_id, change_type, amount, previous_limit, new_limit, reason,
			requested_by_user_id, approved_by_user_id, approved_at, created_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
		customerID, changeType, amount, currentLimit, newLimit, reason,
		userID, userID, // For now, requester and approver are the same
	)
	if err != nil {
		return fmt.Errorf("failed to insert credit history: %w", err)
	}

	return tx.Commit()
}

// Helper methods

func (s *CustomerService) getCustomerContacts(customerID int64) ([]models.CustomerContact, error) {
	var contacts []models.CustomerContact
	query := `SELECT * FROM customer_contacts WHERE customer_id = $1 AND deleted_at IS NULL ORDER BY is_primary DESC, created_at ASC`
	err := s.db.Select(&contacts, query, customerID)
	if err != nil {
		return nil, err
	}
	return contacts, nil
}

func (s *CustomerService) getRecentCustomerActivities(customerID int64, limit int) ([]models.CustomerActivity, error) {
	var activities []models.CustomerActivity
	query := `SELECT * FROM customer_activities WHERE customer_id = $1 ORDER BY created_at DESC LIMIT $2`
	err := s.db.Select(&activities, query, customerID, limit)
	if err != nil {
		return nil, err
	}
	return activities, nil
}

func (s *CustomerService) getUserByID(userID int64) (*models.User, error) {
	user := &models.User{}
	query := `SELECT * FROM users WHERE id = $1 AND deleted_at IS NULL`
	err := s.db.QueryRowx(query, userID).StructScan(user)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, errors.New("user not found")
		}
		return nil, err
	}
	return user, nil
}

// GenerateCustomerCode generates a unique customer code within company
func (s *CustomerService) GenerateCustomerCode(companyID int64) (string, error) {
	// Get the latest customer code number for the company
	var maxNumber int
	query := `
		SELECT COALESCE(MAX(CAST(REGEXP_REPLACE(customer_code, '^C', '') AS INTEGER)), 0) 
		FROM customers 
		WHERE customer_code ~ '^C[0-9]+$' AND company_id = $1 AND deleted_at IS NULL`
	
	err := s.db.QueryRow(query, companyID).Scan(&maxNumber)
	if err != nil {
		return "", fmt.Errorf("failed to get max customer code: %w", err)
	}

	// Generate new customer code
	newNumber := maxNumber + 1
	customerCode := fmt.Sprintf("C%06d", newNumber) // C000001, C000002, etc.

	return customerCode, nil
}

// ValidateCustomerCode checks if a customer code is valid and unique within company
func (s *CustomerService) ValidateCustomerCode(code string, companyID int64) error {
	if code == "" {
		return errors.New("customer code cannot be empty")
	}

	var exists bool
	err := s.db.QueryRow("SELECT EXISTS(SELECT 1 FROM customers WHERE customer_code = $1 AND company_id = $2 AND deleted_at IS NULL)", code, companyID).Scan(&exists)
	if err != nil {
		return fmt.Errorf("failed to validate customer code: %w", err)
	}

	if exists {
		return errors.New("customer code already exists")
	}

	return nil
}