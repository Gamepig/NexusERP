package handlers

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"nexus-erp/backend/internal/models"
	"nexus-erp/backend/internal/services"
)

type EmployeeHandler struct {
	employeeService *services.EmployeeService
}

func NewEmployeeHandler(employeeService *services.EmployeeService) *EmployeeHandler {
	return &EmployeeHandler{
		employeeService: employeeService,
	}
}

// CreateEmployee godoc
// @Summary Create a new employee
// @Description Create a new employee record
// @Tags employees
// @Accept json
// @Produce json
// @Param employee body models.CreateEmployeeRequest true "Employee data"
// @Success 201 {object} models.Employee
// @Failure 400 {object} map[string]interface{}
// @Failure 409 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /api/employees [post]
// @Security BearerAuth
func (h *EmployeeHandler) CreateEmployee(c *gin.Context) {
	var req models.CreateEmployeeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	employee, err := h.employeeService.CreateEmployee(&req)
	if err != nil {
		if err.Error() == "employee code '"+req.EmployeeCode+"' already exists" ||
		   (req.Email != nil && err.Error() == "email '"+*req.Email+"' already exists") {
			c.JSON(http.StatusConflict, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, employee)
}

// GetEmployee godoc
// @Summary Get employee by ID
// @Description Get employee details by employee ID
// @Tags employees
// @Accept json
// @Produce json
// @Param id path int true "Employee ID"
// @Success 200 {object} models.Employee
// @Failure 400 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /api/employees/{id} [get]
// @Security BearerAuth
func (h *EmployeeHandler) GetEmployee(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid employee ID"})
		return
	}

	employee, err := h.employeeService.GetEmployeeByID(id)
	if err != nil {
		if err.Error() == "employee not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, employee)
}

// GetEmployeeByCode godoc
// @Summary Get employee by employee code
// @Description Get employee details by employee code
// @Tags employees
// @Accept json
// @Produce json
// @Param code path string true "Employee Code"
// @Success 200 {object} models.Employee
// @Failure 404 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /api/employees/code/{code} [get]
// @Security BearerAuth
func (h *EmployeeHandler) GetEmployeeByCode(c *gin.Context) {
	code := c.Param("code")

	employee, err := h.employeeService.GetEmployeeByCode(code)
	if err != nil {
		if err.Error() == "employee not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, employee)
}

// UpdateEmployee godoc
// @Summary Update employee
// @Description Update employee details
// @Tags employees
// @Accept json
// @Produce json
// @Param id path int true "Employee ID"
// @Param employee body models.UpdateEmployeeRequest true "Employee update data"
// @Success 200 {object} models.Employee
// @Failure 400 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Failure 409 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /api/employees/{id} [put]
// @Security BearerAuth
func (h *EmployeeHandler) UpdateEmployee(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid employee ID"})
		return
	}

	var req models.UpdateEmployeeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	employee, err := h.employeeService.UpdateEmployee(id, &req)
	if err != nil {
		if err.Error() == "employee not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		if err.Error() == "employee code '"+*req.EmployeeCode+"' already exists" ||
		   (req.Email != nil && err.Error() == "email '"+*req.Email+"' already exists") {
			c.JSON(http.StatusConflict, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, employee)
}

// DeleteEmployee godoc
// @Summary Delete employee
// @Description Soft delete an employee
// @Tags employees
// @Accept json
// @Produce json
// @Param id path int true "Employee ID"
// @Success 204
// @Failure 400 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /api/employees/{id} [delete]
// @Security BearerAuth
func (h *EmployeeHandler) DeleteEmployee(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid employee ID"})
		return
	}

	err = h.employeeService.DeleteEmployee(id)
	if err != nil {
		if err.Error() == "employee not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.Status(http.StatusNoContent)
}

// GetEmployees godoc
// @Summary Get employees list
// @Description Get paginated list of employees with optional filters
// @Tags employees
// @Accept json
// @Produce json
// @Param page query int false "Page number" default(1)
// @Param page_size query int false "Page size" default(20)
// @Param department query string false "Filter by department"
// @Param status query string false "Filter by status"
// @Param search query string false "Search in name, code, or email"
// @Success 200 {object} models.EmployeeListResponse
// @Failure 400 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /api/employees [get]
// @Security BearerAuth
func (h *EmployeeHandler) GetEmployees(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))

	filters := make(map[string]interface{})
	if department := c.Query("department"); department != "" {
		filters["department"] = department
	}
	if status := c.Query("status"); status != "" {
		filters["status"] = status
	}
	if search := c.Query("search"); search != "" {
		filters["search"] = search
	}

	response, err := h.employeeService.GetEmployees(page, pageSize, filters)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, response)
}

// Attendance endpoints

// ClockIn godoc
// @Summary Clock in employee
// @Description Record clock-in time for an employee
// @Tags attendance
// @Accept json
// @Produce json
// @Param clockin body models.ClockInRequest true "Clock-in data"
// @Success 201 {object} models.Attendance
// @Failure 400 {object} map[string]interface{}
// @Failure 409 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /api/attendance/clock-in [post]
// @Security BearerAuth
func (h *EmployeeHandler) ClockIn(c *gin.Context) {
	var req models.ClockInRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	attendance, err := h.employeeService.ClockIn(&req)
	if err != nil {
		if err.Error() == "employee has already clocked in today" {
			c.JSON(http.StatusConflict, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, attendance)
}

// ClockOut godoc
// @Summary Clock out employee
// @Description Record clock-out time for an attendance record
// @Tags attendance
// @Accept json
// @Produce json
// @Param clockout body models.ClockOutRequest true "Clock-out data"
// @Success 200 {object} models.Attendance
// @Failure 400 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /api/attendance/clock-out [put]
// @Security BearerAuth
func (h *EmployeeHandler) ClockOut(c *gin.Context) {
	var req models.ClockOutRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	attendance, err := h.employeeService.ClockOut(&req)
	if err != nil {
		if err.Error() == "attendance record not found or already clocked out" {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, attendance)
}

// GetAttendanceRecords godoc
// @Summary Get attendance records
// @Description Get paginated list of attendance records with optional filters
// @Tags attendance
// @Accept json
// @Produce json
// @Param employee_id query int false "Filter by employee ID"
// @Param start_date query string false "Start date (YYYY-MM-DD)"
// @Param end_date query string false "End date (YYYY-MM-DD)"
// @Param status query string false "Filter by attendance status"
// @Param page query int false "Page number" default(1)
// @Param page_size query int false "Page size" default(20)
// @Success 200 {object} models.AttendanceListResponse
// @Failure 400 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /api/attendance [get]
// @Security BearerAuth
func (h *EmployeeHandler) GetAttendanceRecords(c *gin.Context) {
	var req models.AttendanceQueryRequest

	if employeeIDStr := c.Query("employee_id"); employeeIDStr != "" {
		employeeID, err := strconv.ParseInt(employeeIDStr, 10, 64)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid employee ID"})
			return
		}
		req.EmployeeID = &employeeID
	}

	req.StartDate = c.Query("start_date")
	req.EndDate = c.Query("end_date")

	if statusStr := c.Query("status"); statusStr != "" {
		status := models.AttendanceStatus(statusStr)
		req.Status = &status
	}

	req.Page, _ = strconv.Atoi(c.DefaultQuery("page", "1"))
	req.PageSize, _ = strconv.Atoi(c.DefaultQuery("page_size", "20"))

	// Validate date formats if provided
	if req.StartDate != "" {
		if _, err := time.Parse("2006-01-02", req.StartDate); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid start_date format. Use YYYY-MM-DD"})
			return
		}
	}
	if req.EndDate != "" {
		if _, err := time.Parse("2006-01-02", req.EndDate); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid end_date format. Use YYYY-MM-DD"})
			return
		}
	}

	response, err := h.employeeService.GetAttendanceRecords(&req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, response)
}

// GetAttendanceSummary godoc
// @Summary Get attendance summary
// @Description Get attendance summary for an employee within a date range
// @Tags attendance
// @Accept json
// @Produce json
// @Param employee_id path int true "Employee ID"
// @Param start_date query string true "Start date (YYYY-MM-DD)"
// @Param end_date query string true "End date (YYYY-MM-DD)"
// @Success 200 {object} models.AttendanceSummaryResponse
// @Failure 400 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /api/attendance/summary/{employee_id} [get]
// @Security BearerAuth
func (h *EmployeeHandler) GetAttendanceSummary(c *gin.Context) {
	employeeIDStr := c.Param("employee_id")
	employeeID, err := strconv.ParseInt(employeeIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid employee ID"})
		return
	}

	startDate := c.Query("start_date")
	endDate := c.Query("end_date")

	if startDate == "" || endDate == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "start_date and end_date are required"})
		return
	}

	// Validate date formats
	if _, err := time.Parse("2006-01-02", startDate); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid start_date format. Use YYYY-MM-DD"})
		return
	}
	if _, err := time.Parse("2006-01-02", endDate); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid end_date format. Use YYYY-MM-DD"})
		return
	}

	summary, err := h.employeeService.GetEmployeeAttendanceSummary(employeeID, startDate, endDate)
	if err != nil {
		if err.Error() == "employee not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, summary)
}

// GetActiveClockIn godoc
// @Summary Get active clock-in
// @Description Get the active (unclosed) clock-in record for an employee
// @Tags attendance
// @Accept json
// @Produce json
// @Param employee_id path int true "Employee ID"
// @Success 200 {object} models.Attendance
// @Failure 400 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /api/attendance/active/{employee_id} [get]
// @Security BearerAuth
func (h *EmployeeHandler) GetActiveClockIn(c *gin.Context) {
	employeeIDStr := c.Param("employee_id")
	employeeID, err := strconv.ParseInt(employeeIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid employee ID"})
		return
	}

	attendance, err := h.employeeService.GetActiveClockIn(employeeID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if attendance == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "No active clock-in found"})
		return
	}

	c.JSON(http.StatusOK, attendance)
}

// QuickClockIn godoc
// @Summary Quick clock-in by employee code
// @Description Allow employees to quickly clock in using their employee code
// @Tags attendance
// @Accept json
// @Produce json
// @Param code path string true "Employee Code"
// @Param notes body map[string]string false "Optional notes"
// @Success 201 {object} models.Attendance
// @Failure 400 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Failure 409 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /api/attendance/quick-clock-in/{code} [post]
// @Security BearerAuth
func (h *EmployeeHandler) QuickClockIn(c *gin.Context) {
	code := c.Param("code")
	
	// Get employee by code
	employee, err := h.employeeService.GetEmployeeByCode(code)
	if err != nil {
		if err.Error() == "employee not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": "Employee code not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var reqBody map[string]string
	c.ShouldBindJSON(&reqBody)
	
	req := models.ClockInRequest{
		EmployeeID: employee.ID,
		Notes:      nil,
	}
	
	if notes, ok := reqBody["notes"]; ok {
		req.Notes = &notes
	}

	attendance, err := h.employeeService.ClockIn(&req)
	if err != nil {
		if err.Error() == "employee has already clocked in today" {
			c.JSON(http.StatusConflict, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, attendance)
}

// QuickClockOut godoc
// @Summary Quick clock-out by employee code
// @Description Allow employees to quickly clock out using their employee code
// @Tags attendance
// @Accept json
// @Produce json
// @Param code path string true "Employee Code"
// @Param notes body map[string]string false "Optional notes"
// @Success 200 {object} models.Attendance
// @Failure 400 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /api/attendance/quick-clock-out/{code} [post]
// @Security BearerAuth
func (h *EmployeeHandler) QuickClockOut(c *gin.Context) {
	code := c.Param("code")
	
	// Get employee by code
	employee, err := h.employeeService.GetEmployeeByCode(code)
	if err != nil {
		if err.Error() == "employee not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": "Employee code not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Get active clock-in
	activeClockIn, err := h.employeeService.GetActiveClockIn(employee.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if activeClockIn == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "No active clock-in found for this employee"})
		return
	}

	var reqBody map[string]string
	c.ShouldBindJSON(&reqBody)
	
	req := models.ClockOutRequest{
		AttendanceID: activeClockIn.ID,
		Notes:        nil,
	}
	
	if notes, ok := reqBody["notes"]; ok {
		req.Notes = &notes
	}

	attendance, err := h.employeeService.ClockOut(&req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, attendance)
}