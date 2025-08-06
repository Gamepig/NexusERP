package models

import (
	"time"
	"database/sql/driver"
	"fmt"
)

// Employee represents an employee in the HR system
type Employee struct {
	ID           int64      `json:"id" db:"id"`
	UserID       *int64     `json:"user_id,omitempty" db:"user_id"`              // Optional link to users table
	EmployeeCode string     `json:"employee_code" db:"employee_code"`            // Unique employee identifier
	FirstName    string     `json:"first_name" db:"first_name"`
	LastName     string     `json:"last_name" db:"last_name"`
	Email        *string    `json:"email,omitempty" db:"email"`
	Phone        *string    `json:"phone,omitempty" db:"phone"`
	Department   *string    `json:"department,omitempty" db:"department"`
	Position     *string    `json:"position,omitempty" db:"position"`
	HireDate     time.Time  `json:"hire_date" db:"hire_date"`
	TerminationDate *time.Time `json:"termination_date,omitempty" db:"termination_date"`
	Salary       *float64   `json:"salary,omitempty" db:"salary"`
	Status       EmployeeStatus `json:"status" db:"status"`
	Address      *string    `json:"address,omitempty" db:"address"`
	EmergencyContact *string `json:"emergency_contact,omitempty" db:"emergency_contact"`
	Notes        *string    `json:"notes,omitempty" db:"notes"`
	CreatedAt    time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at" db:"updated_at"`
	DeletedAt    *time.Time `json:"deleted_at,omitempty" db:"deleted_at"`
}

// EmployeeStatus represents the employment status
type EmployeeStatus string

const (
	EmployeeStatusActive      EmployeeStatus = "active"
	EmployeeStatusInactive    EmployeeStatus = "inactive"
	EmployeeStatusTerminated  EmployeeStatus = "terminated"
	EmployeeStatusOnLeave     EmployeeStatus = "on_leave"
)

// Implement sql.Scanner interface for EmployeeStatus
func (es *EmployeeStatus) Scan(value interface{}) error {
	if value == nil {
		*es = EmployeeStatusActive
		return nil
	}
	
	switch s := value.(type) {
	case string:
		*es = EmployeeStatus(s)
	case []byte:
		*es = EmployeeStatus(s)
	default:
		return fmt.Errorf("cannot scan %T into EmployeeStatus", value)
	}
	
	return nil
}

// Implement driver.Valuer interface for EmployeeStatus
func (es EmployeeStatus) Value() (driver.Value, error) {
	return string(es), nil
}

// Attendance represents employee attendance records
type Attendance struct {
	ID          int64      `json:"id" db:"id"`
	EmployeeID  int64      `json:"employee_id" db:"employee_id"`
	ClockIn     time.Time  `json:"clock_in" db:"clock_in"`
	ClockOut    *time.Time `json:"clock_out,omitempty" db:"clock_out"`
	Duration    *int       `json:"duration,omitempty" db:"duration"`             // Duration in minutes
	Status      AttendanceStatus `json:"status" db:"status"`
	Notes       *string    `json:"notes,omitempty" db:"notes"`
	CreatedAt   time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at" db:"updated_at"`
}

// AttendanceStatus represents the attendance status
type AttendanceStatus string

const (
	AttendanceStatusPresent  AttendanceStatus = "present"
	AttendanceStatusAbsent   AttendanceStatus = "absent"
	AttendanceStatusLate     AttendanceStatus = "late"
	AttendanceStatusPartial  AttendanceStatus = "partial"
	AttendanceStatusOnLeave  AttendanceStatus = "on_leave"
)

// Implement sql.Scanner interface for AttendanceStatus
func (as *AttendanceStatus) Scan(value interface{}) error {
	if value == nil {
		*as = AttendanceStatusPresent
		return nil
	}
	
	switch s := value.(type) {
	case string:
		*as = AttendanceStatus(s)
	case []byte:
		*as = AttendanceStatus(s)
	default:
		return fmt.Errorf("cannot scan %T into AttendanceStatus", value)
	}
	
	return nil
}

// Implement driver.Valuer interface for AttendanceStatus
func (as AttendanceStatus) Value() (driver.Value, error) {
	return string(as), nil
}

// EmployeeWithUser represents an employee with optional user information
type EmployeeWithUser struct {
	Employee
	User *User `json:"user,omitempty"`
}

// Employee Request/Response Models

// CreateEmployeeRequest represents the request body for creating an employee
type CreateEmployeeRequest struct {
	UserID          *int64  `json:"user_id,omitempty"`
	EmployeeCode    string  `json:"employee_code" binding:"required"`
	FirstName       string  `json:"first_name" binding:"required"`
	LastName        string  `json:"last_name" binding:"required"`
	Email           *string `json:"email,omitempty" binding:"omitempty,email"`
	Phone           *string `json:"phone,omitempty"`
	Department      *string `json:"department,omitempty"`
	Position        *string `json:"position,omitempty"`
	HireDate        string  `json:"hire_date" binding:"required"`
	Salary          *float64 `json:"salary,omitempty"`
	Status          EmployeeStatus `json:"status,omitempty"`
	Address         *string `json:"address,omitempty"`
	EmergencyContact *string `json:"emergency_contact,omitempty"`
	Notes           *string `json:"notes,omitempty"`
}

// UpdateEmployeeRequest represents the request body for updating an employee
type UpdateEmployeeRequest struct {
	UserID          *int64  `json:"user_id,omitempty"`
	EmployeeCode    *string `json:"employee_code,omitempty"`
	FirstName       *string `json:"first_name,omitempty"`
	LastName        *string `json:"last_name,omitempty"`
	Email           *string `json:"email,omitempty" binding:"omitempty,email"`
	Phone           *string `json:"phone,omitempty"`
	Department      *string `json:"department,omitempty"`
	Position        *string `json:"position,omitempty"`
	HireDate        *string `json:"hire_date,omitempty"`
	TerminationDate *string `json:"termination_date,omitempty"`
	Salary          *float64 `json:"salary,omitempty"`
	Status          *EmployeeStatus `json:"status,omitempty"`
	Address         *string `json:"address,omitempty"`
	EmergencyContact *string `json:"emergency_contact,omitempty"`
	Notes           *string `json:"notes,omitempty"`
}

// ClockInRequest represents the request body for clocking in
type ClockInRequest struct {
	EmployeeID int64   `json:"employee_id" binding:"required"`
	Notes      *string `json:"notes,omitempty"`
}

// ClockOutRequest represents the request body for clocking out
type ClockOutRequest struct {
	AttendanceID int64   `json:"attendance_id" binding:"required"`
	Notes        *string `json:"notes,omitempty"`
}

// AttendanceQueryRequest represents the request parameters for attendance queries
type AttendanceQueryRequest struct {
	EmployeeID *int64 `form:"employee_id"`
	StartDate  string `form:"start_date"`
	EndDate    string `form:"end_date"`
	Status     *AttendanceStatus `form:"status"`
	Page       int    `form:"page"`
	PageSize   int    `form:"page_size"`
}

// AttendanceResponse represents the response body for attendance records
type AttendanceResponse struct {
	ID          int64            `json:"id"`
	EmployeeID  int64            `json:"employee_id"`
	Employee    *Employee        `json:"employee,omitempty"`
	ClockIn     time.Time        `json:"clock_in"`
	ClockOut    *time.Time       `json:"clock_out,omitempty"`
	Duration    *int             `json:"duration,omitempty"`
	Status      AttendanceStatus `json:"status"`
	Notes       *string          `json:"notes,omitempty"`
	CreatedAt   time.Time        `json:"created_at"`
	UpdatedAt   time.Time        `json:"updated_at"`
}

// EmployeeListResponse represents the response body for employee list
type EmployeeListResponse struct {
	Employees  []Employee `json:"employees"`
	Total      int64      `json:"total"`
	Page       int        `json:"page"`
	PageSize   int        `json:"page_size"`
	TotalPages int        `json:"total_pages"`
}

// AttendanceListResponse represents the response body for attendance list
type AttendanceListResponse struct {
	Attendance []AttendanceResponse `json:"attendance"`
	Total      int64                `json:"total"`
	Page       int                  `json:"page"`
	PageSize   int                  `json:"page_size"`
	TotalPages int                  `json:"total_pages"`
}

// AttendanceSummaryResponse represents attendance summary for an employee
type AttendanceSummaryResponse struct {
	EmployeeID      int64   `json:"employee_id"`
	Employee        *Employee `json:"employee,omitempty"`
	Period          string  `json:"period"`
	TotalDays       int     `json:"total_days"`
	PresentDays     int     `json:"present_days"`
	AbsentDays      int     `json:"absent_days"`
	LateDays        int     `json:"late_days"`
	TotalHours      int     `json:"total_hours"`
	AttendanceRate  float64 `json:"attendance_rate"`
}