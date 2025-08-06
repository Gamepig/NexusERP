package services

import (
	"database/sql"
	"fmt"
	"time"
	"strings"

	"github.com/jmoiron/sqlx"
	"nexus-erp/backend/internal/models"
)

type EmployeeService struct {
	db *sqlx.DB
}

func NewEmployeeService(db *sqlx.DB) *EmployeeService {
	return &EmployeeService{
		db: db,
	}
}

// CreateEmployee creates a new employee record
func (s *EmployeeService) CreateEmployee(req *models.CreateEmployeeRequest) (*models.Employee, error) {
	// Parse hire date
	hireDate, err := time.Parse("2006-01-02", req.HireDate)
	if err != nil {
		return nil, fmt.Errorf("invalid hire date format: %v", err)
	}

	// Set default status if not provided
	status := req.Status
	if status == "" {
		status = models.EmployeeStatusActive
	}

	// Check if employee code already exists
	var exists bool
	err = s.db.Get(&exists, "SELECT EXISTS(SELECT 1 FROM employees WHERE employee_code = $1 AND deleted_at IS NULL)", req.EmployeeCode)
	if err != nil {
		return nil, fmt.Errorf("failed to check employee code uniqueness: %v", err)
	}
	if exists {
		return nil, fmt.Errorf("employee code '%s' already exists", req.EmployeeCode)
	}

	// Check if email is unique (if provided)
	if req.Email != nil && *req.Email != "" {
		err = s.db.Get(&exists, "SELECT EXISTS(SELECT 1 FROM employees WHERE email = $1 AND deleted_at IS NULL)", *req.Email)
		if err != nil {
			return nil, fmt.Errorf("failed to check email uniqueness: %v", err)
		}
		if exists {
			return nil, fmt.Errorf("email '%s' already exists", *req.Email)
		}
	}

	query := `
		INSERT INTO employees (
			user_id, employee_code, first_name, last_name, email, phone, 
			department, position, hire_date, salary, status, address, 
			emergency_contact, notes
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
		) RETURNING 
			id, user_id, employee_code, first_name, last_name, email, phone, 
			department, position, hire_date, termination_date, salary, status, 
			address, emergency_contact, notes, created_at, updated_at, deleted_at`

	var employee models.Employee
	err = s.db.Get(&employee, query,
		req.UserID, req.EmployeeCode, req.FirstName, req.LastName, req.Email,
		req.Phone, req.Department, req.Position, hireDate, req.Salary, status,
		req.Address, req.EmergencyContact, req.Notes)

	if err != nil {
		return nil, fmt.Errorf("failed to create employee: %v", err)
	}

	return &employee, nil
}

// GetEmployeeByID retrieves an employee by ID
func (s *EmployeeService) GetEmployeeByID(id int64) (*models.Employee, error) {
	query := `
		SELECT id, user_id, employee_code, first_name, last_name, email, phone, 
			   department, position, hire_date, termination_date, salary, status, 
			   address, emergency_contact, notes, created_at, updated_at, deleted_at
		FROM employees 
		WHERE id = $1 AND deleted_at IS NULL`

	var employee models.Employee
	err := s.db.Get(&employee, query, id)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("employee not found")
		}
		return nil, fmt.Errorf("failed to get employee: %v", err)
	}

	return &employee, nil
}

// GetEmployeeByCode retrieves an employee by employee code
func (s *EmployeeService) GetEmployeeByCode(employeeCode string) (*models.Employee, error) {
	query := `
		SELECT id, user_id, employee_code, first_name, last_name, email, phone, 
			   department, position, hire_date, termination_date, salary, status, 
			   address, emergency_contact, notes, created_at, updated_at, deleted_at
		FROM employees 
		WHERE employee_code = $1 AND deleted_at IS NULL`

	var employee models.Employee
	err := s.db.Get(&employee, query, employeeCode)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("employee not found")
		}
		return nil, fmt.Errorf("failed to get employee: %v", err)
	}

	return &employee, nil
}

// GetEmployeeByUserID retrieves an employee by user ID
func (s *EmployeeService) GetEmployeeByUserID(userID int64) (*models.Employee, error) {
	query := `
		SELECT id, user_id, employee_code, first_name, last_name, email, phone, 
			   department, position, hire_date, termination_date, salary, status, 
			   address, emergency_contact, notes, created_at, updated_at, deleted_at
		FROM employees 
		WHERE user_id = $1 AND deleted_at IS NULL`

	var employee models.Employee
	err := s.db.Get(&employee, query, userID)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("employee not found")
		}
		return nil, fmt.Errorf("failed to get employee: %v", err)
	}

	return &employee, nil
}

// UpdateEmployee updates an employee record
func (s *EmployeeService) UpdateEmployee(id int64, req *models.UpdateEmployeeRequest) (*models.Employee, error) {
	// Check if employee exists
	existing, err := s.GetEmployeeByID(id)
	if err != nil {
		return nil, err
	}

	// Build dynamic update query
	setParts := []string{}
	args := []interface{}{}
	argIndex := 1

	if req.UserID != nil {
		setParts = append(setParts, fmt.Sprintf("user_id = $%d", argIndex))
		args = append(args, *req.UserID)
		argIndex++
	}

	if req.EmployeeCode != nil {
		// Check uniqueness if changing employee code
		if *req.EmployeeCode != existing.EmployeeCode {
			var exists bool
			err = s.db.Get(&exists, "SELECT EXISTS(SELECT 1 FROM employees WHERE employee_code = $1 AND id != $2 AND deleted_at IS NULL)", *req.EmployeeCode, id)
			if err != nil {
				return nil, fmt.Errorf("failed to check employee code uniqueness: %v", err)
			}
			if exists {
				return nil, fmt.Errorf("employee code '%s' already exists", *req.EmployeeCode)
			}
		}
		setParts = append(setParts, fmt.Sprintf("employee_code = $%d", argIndex))
		args = append(args, *req.EmployeeCode)
		argIndex++
	}

	if req.FirstName != nil {
		setParts = append(setParts, fmt.Sprintf("first_name = $%d", argIndex))
		args = append(args, *req.FirstName)
		argIndex++
	}

	if req.LastName != nil {
		setParts = append(setParts, fmt.Sprintf("last_name = $%d", argIndex))
		args = append(args, *req.LastName)
		argIndex++
	}

	if req.Email != nil {
		// Check uniqueness if changing email
		if (existing.Email == nil && *req.Email != "") || (existing.Email != nil && *req.Email != *existing.Email) {
			var exists bool
			err = s.db.Get(&exists, "SELECT EXISTS(SELECT 1 FROM employees WHERE email = $1 AND id != $2 AND deleted_at IS NULL)", *req.Email, id)
			if err != nil {
				return nil, fmt.Errorf("failed to check email uniqueness: %v", err)
			}
			if exists {
				return nil, fmt.Errorf("email '%s' already exists", *req.Email)
			}
		}
		setParts = append(setParts, fmt.Sprintf("email = $%d", argIndex))
		args = append(args, *req.Email)
		argIndex++
	}

	if req.Phone != nil {
		setParts = append(setParts, fmt.Sprintf("phone = $%d", argIndex))
		args = append(args, *req.Phone)
		argIndex++
	}

	if req.Department != nil {
		setParts = append(setParts, fmt.Sprintf("department = $%d", argIndex))
		args = append(args, *req.Department)
		argIndex++
	}

	if req.Position != nil {
		setParts = append(setParts, fmt.Sprintf("position = $%d", argIndex))
		args = append(args, *req.Position)
		argIndex++
	}

	if req.HireDate != nil {
		hireDate, err := time.Parse("2006-01-02", *req.HireDate)
		if err != nil {
			return nil, fmt.Errorf("invalid hire date format: %v", err)
		}
		setParts = append(setParts, fmt.Sprintf("hire_date = $%d", argIndex))
		args = append(args, hireDate)
		argIndex++
	}

	if req.TerminationDate != nil {
		if *req.TerminationDate == "" {
			setParts = append(setParts, fmt.Sprintf("termination_date = NULL"))
		} else {
			terminationDate, err := time.Parse("2006-01-02", *req.TerminationDate)
			if err != nil {
				return nil, fmt.Errorf("invalid termination date format: %v", err)
			}
			setParts = append(setParts, fmt.Sprintf("termination_date = $%d", argIndex))
			args = append(args, terminationDate)
			argIndex++
		}
	}

	if req.Salary != nil {
		setParts = append(setParts, fmt.Sprintf("salary = $%d", argIndex))
		args = append(args, *req.Salary)
		argIndex++
	}

	if req.Status != nil {
		setParts = append(setParts, fmt.Sprintf("status = $%d", argIndex))
		args = append(args, *req.Status)
		argIndex++
	}

	if req.Address != nil {
		setParts = append(setParts, fmt.Sprintf("address = $%d", argIndex))
		args = append(args, *req.Address)
		argIndex++
	}

	if req.EmergencyContact != nil {
		setParts = append(setParts, fmt.Sprintf("emergency_contact = $%d", argIndex))
		args = append(args, *req.EmergencyContact)
		argIndex++
	}

	if req.Notes != nil {
		setParts = append(setParts, fmt.Sprintf("notes = $%d", argIndex))
		args = append(args, *req.Notes)
		argIndex++
	}

	if len(setParts) == 0 {
		return existing, nil
	}

	query := fmt.Sprintf(`
		UPDATE employees 
		SET %s, updated_at = NOW()
		WHERE id = $%d AND deleted_at IS NULL
		RETURNING id, user_id, employee_code, first_name, last_name, email, phone, 
				  department, position, hire_date, termination_date, salary, status, 
				  address, emergency_contact, notes, created_at, updated_at, deleted_at`,
		strings.Join(setParts, ", "), argIndex)

	args = append(args, id)

	var employee models.Employee
	err = s.db.Get(&employee, query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to update employee: %v", err)
	}

	return &employee, nil
}

// DeleteEmployee soft deletes an employee
func (s *EmployeeService) DeleteEmployee(id int64) error {
	query := `UPDATE employees SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL`
	result, err := s.db.Exec(query, id)
	if err != nil {
		return fmt.Errorf("failed to delete employee: %v", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get affected rows: %v", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("employee not found")
	}

	return nil
}

// GetEmployees retrieves a paginated list of employees
func (s *EmployeeService) GetEmployees(page, pageSize int, filters map[string]interface{}) (*models.EmployeeListResponse, error) {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	offset := (page - 1) * pageSize

	// Build where clause based on filters
	whereClauses := []string{"deleted_at IS NULL"}
	args := []interface{}{}
	argIndex := 1

	if department, ok := filters["department"].(string); ok && department != "" {
		whereClauses = append(whereClauses, fmt.Sprintf("department = $%d", argIndex))
		args = append(args, department)
		argIndex++
	}

	if status, ok := filters["status"].(string); ok && status != "" {
		whereClauses = append(whereClauses, fmt.Sprintf("status = $%d", argIndex))
		args = append(args, status)
		argIndex++
	}

	if search, ok := filters["search"].(string); ok && search != "" {
		whereClauses = append(whereClauses, fmt.Sprintf("(first_name ILIKE $%d OR last_name ILIKE $%d OR employee_code ILIKE $%d OR email ILIKE $%d)", argIndex, argIndex, argIndex, argIndex))
		args = append(args, "%"+search+"%")
		argIndex++
	}

	whereClause := strings.Join(whereClauses, " AND ")

	// Count total records
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM employees WHERE %s", whereClause)
	var total int64
	err := s.db.Get(&total, countQuery, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to count employees: %v", err)
	}

	// Get employees
	query := fmt.Sprintf(`
		SELECT id, user_id, employee_code, first_name, last_name, email, phone, 
			   department, position, hire_date, termination_date, salary, status, 
			   address, emergency_contact, notes, created_at, updated_at, deleted_at
		FROM employees 
		WHERE %s
		ORDER BY employee_code, first_name, last_name
		LIMIT $%d OFFSET $%d`, whereClause, argIndex, argIndex+1)

	args = append(args, pageSize, offset)

	var employees []models.Employee
	err = s.db.Select(&employees, query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to get employees: %v", err)
	}

	totalPages := (int(total) + pageSize - 1) / pageSize

	return &models.EmployeeListResponse{
		Employees:  employees,
		Total:      total,
		Page:       page,
		PageSize:   pageSize,
		TotalPages: totalPages,
	}, nil
}

// Attendance related methods

// ClockIn records a clock-in for an employee
func (s *EmployeeService) ClockIn(req *models.ClockInRequest) (*models.Attendance, error) {
	// Check if employee exists
	_, err := s.GetEmployeeByID(req.EmployeeID)
	if err != nil {
		return nil, err
	}

	// Check if there's already an active clock-in for today
	today := time.Now().Format("2006-01-02")
	var exists bool
	err = s.db.Get(&exists, `
		SELECT EXISTS(
			SELECT 1 FROM attendance 
			WHERE employee_id = $1 
			AND DATE(clock_in) = $2 
			AND clock_out IS NULL
		)`, req.EmployeeID, today)
	if err != nil {
		return nil, fmt.Errorf("failed to check existing clock-in: %v", err)
	}
	if exists {
		return nil, fmt.Errorf("employee has already clocked in today")
	}

	query := `
		INSERT INTO attendance (employee_id, clock_in, status, notes)
		VALUES ($1, NOW(), 'present', $2)
		RETURNING id, employee_id, clock_in, clock_out, duration, status, notes, created_at, updated_at`

	var attendance models.Attendance
	err = s.db.Get(&attendance, query, req.EmployeeID, req.Notes)
	if err != nil {
		return nil, fmt.Errorf("failed to record clock-in: %v", err)
	}

	return &attendance, nil
}

// ClockOut records a clock-out for an attendance record
func (s *EmployeeService) ClockOut(req *models.ClockOutRequest) (*models.Attendance, error) {
	// Check if attendance record exists and is not already clocked out
	var attendance models.Attendance
	err := s.db.Get(&attendance, `
		SELECT id, employee_id, clock_in, clock_out, duration, status, notes, created_at, updated_at
		FROM attendance 
		WHERE id = $1 AND clock_out IS NULL`, req.AttendanceID)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("attendance record not found or already clocked out")
		}
		return nil, fmt.Errorf("failed to get attendance record: %v", err)
	}

	query := `
		UPDATE attendance 
		SET clock_out = NOW(), notes = $2
		WHERE id = $1
		RETURNING id, employee_id, clock_in, clock_out, duration, status, notes, created_at, updated_at`

	err = s.db.Get(&attendance, query, req.AttendanceID, req.Notes)
	if err != nil {
		return nil, fmt.Errorf("failed to record clock-out: %v", err)
	}

	return &attendance, nil
}

// GetAttendanceRecords retrieves attendance records with optional filters
func (s *EmployeeService) GetAttendanceRecords(req *models.AttendanceQueryRequest) (*models.AttendanceListResponse, error) {
	page := req.Page
	pageSize := req.PageSize
	
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	offset := (page - 1) * pageSize

	// Build where clause based on filters
	whereClauses := []string{}
	args := []interface{}{}
	argIndex := 1

	if req.EmployeeID != nil {
		whereClauses = append(whereClauses, fmt.Sprintf("a.employee_id = $%d", argIndex))
		args = append(args, *req.EmployeeID)
		argIndex++
	}

	if req.StartDate != "" {
		whereClauses = append(whereClauses, fmt.Sprintf("DATE(a.clock_in) >= $%d", argIndex))
		args = append(args, req.StartDate)
		argIndex++
	}

	if req.EndDate != "" {
		whereClauses = append(whereClauses, fmt.Sprintf("DATE(a.clock_in) <= $%d", argIndex))
		args = append(args, req.EndDate)
		argIndex++
	}

	if req.Status != nil {
		whereClauses = append(whereClauses, fmt.Sprintf("a.status = $%d", argIndex))
		args = append(args, *req.Status)
		argIndex++
	}

	whereClause := ""
	if len(whereClauses) > 0 {
		whereClause = "WHERE " + strings.Join(whereClauses, " AND ")
	}

	// Count total records
	countQuery := fmt.Sprintf(`
		SELECT COUNT(*) 
		FROM attendance a 
		INNER JOIN employees e ON a.employee_id = e.id 
		%s`, whereClause)
	
	var total int64
	err := s.db.Get(&total, countQuery, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to count attendance records: %v", err)
	}

	// Get attendance records with employee info
	query := fmt.Sprintf(`
		SELECT a.id, a.employee_id, a.clock_in, a.clock_out, a.duration, a.status, a.notes, a.created_at, a.updated_at,
			   e.employee_code, e.first_name, e.last_name, e.department, e.position
		FROM attendance a 
		INNER JOIN employees e ON a.employee_id = e.id 
		%s
		ORDER BY a.clock_in DESC
		LIMIT $%d OFFSET $%d`, whereClause, argIndex, argIndex+1)

	args = append(args, pageSize, offset)

	rows, err := s.db.Query(query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to get attendance records: %v", err)
	}
	defer rows.Close()

	var attendanceRecords []models.AttendanceResponse
	for rows.Next() {
		var record models.AttendanceResponse
		var employee models.Employee
		
		err := rows.Scan(
			&record.ID, &record.EmployeeID, &record.ClockIn, &record.ClockOut, 
			&record.Duration, &record.Status, &record.Notes, &record.CreatedAt, &record.UpdatedAt,
			&employee.EmployeeCode, &employee.FirstName, &employee.LastName, 
			&employee.Department, &employee.Position)
		if err != nil {
			return nil, fmt.Errorf("failed to scan attendance record: %v", err)
		}
		
		employee.ID = record.EmployeeID
		record.Employee = &employee
		attendanceRecords = append(attendanceRecords, record)
	}

	totalPages := (int(total) + pageSize - 1) / pageSize

	return &models.AttendanceListResponse{
		Attendance: attendanceRecords,
		Total:      total,
		Page:       page,
		PageSize:   pageSize,
		TotalPages: totalPages,
	}, nil
}

// GetEmployeeAttendanceSummary generates attendance summary for an employee
func (s *EmployeeService) GetEmployeeAttendanceSummary(employeeID int64, startDate, endDate string) (*models.AttendanceSummaryResponse, error) {
	// Get employee info
	employee, err := s.GetEmployeeByID(employeeID)
	if err != nil {
		return nil, err
	}

	query := `
		SELECT 
			COUNT(*) as total_days,
			COUNT(CASE WHEN status = 'present' THEN 1 END) as present_days,
			COUNT(CASE WHEN status = 'absent' THEN 1 END) as absent_days,
			COUNT(CASE WHEN status = 'late' THEN 1 END) as late_days,
			COALESCE(SUM(duration), 0) as total_minutes
		FROM attendance 
		WHERE employee_id = $1 
		AND DATE(clock_in) >= $2 
		AND DATE(clock_in) <= $3`

	var totalDays, presentDays, absentDays, lateDays int
	var totalMinutes int64

	err = s.db.QueryRow(query, employeeID, startDate, endDate).Scan(
		&totalDays, &presentDays, &absentDays, &lateDays, &totalMinutes)
	if err != nil {
		return nil, fmt.Errorf("failed to get attendance summary: %v", err)
	}

	totalHours := int(totalMinutes / 60)
	attendanceRate := 0.0
	if totalDays > 0 {
		attendanceRate = float64(presentDays) / float64(totalDays) * 100
	}

	period := fmt.Sprintf("%s to %s", startDate, endDate)

	return &models.AttendanceSummaryResponse{
		EmployeeID:     employeeID,
		Employee:       employee,
		Period:         period,
		TotalDays:      totalDays,
		PresentDays:    presentDays,
		AbsentDays:     absentDays,
		LateDays:       lateDays,
		TotalHours:     totalHours,
		AttendanceRate: attendanceRate,
	}, nil
}

// GetActiveClockIn gets the active (unclosed) clock-in record for an employee
func (s *EmployeeService) GetActiveClockIn(employeeID int64) (*models.Attendance, error) {
	query := `
		SELECT id, employee_id, clock_in, clock_out, duration, status, notes, created_at, updated_at
		FROM attendance 
		WHERE employee_id = $1 AND clock_out IS NULL
		ORDER BY clock_in DESC
		LIMIT 1`

	var attendance models.Attendance
	err := s.db.Get(&attendance, query, employeeID)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil // No active clock-in found
		}
		return nil, fmt.Errorf("failed to get active clock-in: %v", err)
	}

	return &attendance, nil
}