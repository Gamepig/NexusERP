package handlers

import (
	"strconv"
	"time"

	"nexus-erp-fiber/internal/middleware"
	"nexus-erp-fiber/internal/models"
	"nexus-erp-fiber/internal/services"

	"github.com/gofiber/fiber/v2"
)

// ReportHandler handles report-related requests
type ReportHandler struct {
	reportService           services.ReportServiceInterface
	inventoryReportService  services.InventoryReportServiceInterface
	financialReportService  services.FinancialReportServiceInterface
}

// NewReportHandler creates a new report handler
func NewReportHandler(
	reportService services.ReportServiceInterface,
	inventoryReportService services.InventoryReportServiceInterface,
	financialReportService services.FinancialReportServiceInterface,
) *ReportHandler {
	return &ReportHandler{
		reportService:           reportService,
		inventoryReportService:  inventoryReportService,
		financialReportService:  financialReportService,
	}
}

// Dashboard endpoints

// GetDashboardStats returns dashboard statistics
func (h *ReportHandler) GetDashboardStats(c *fiber.Ctx) error {
	tenantID := middleware.GetTenantID(c)
	if tenantID == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid tenant context",
		})
	}

	startTime := time.Now()
	
	stats, err := h.reportService.GetDashboardStats(tenantID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error":   "Failed to retrieve dashboard stats",
			"message": err.Error(),
		})
	}

	return c.JSON(models.ReportResponse{
		Data: stats,
		Metadata: models.ReportMeta{
			ProcessingTime: time.Since(startTime),
			DataSource:     "database",
			ReportType:     "dashboard_stats",
		},
		GeneratedAt: time.Now(),
	})
}

// GetDashboardCharts returns dashboard chart data
func (h *ReportHandler) GetDashboardCharts(c *fiber.Ctx) error {
	tenantID := middleware.GetTenantID(c)
	if tenantID == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid tenant context",
		})
	}

	// Parse filters from query parameters
	filters := h.parseFilters(c)
	
	startTime := time.Now()
	
	charts, err := h.reportService.GetDashboardCharts(tenantID, filters)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error":   "Failed to retrieve dashboard charts",
			"message": err.Error(),
		})
	}

	return c.JSON(models.ReportResponse{
		Data: charts,
		Metadata: models.ReportMeta{
			ProcessingTime: time.Since(startTime),
			DataSource:     "database",
			ReportType:     "dashboard_charts",
			Period:         filters.DateRange,
		},
		GeneratedAt: time.Now(),
	})
}

// GetDashboardAlerts returns dashboard alerts
func (h *ReportHandler) GetDashboardAlerts(c *fiber.Ctx) error {
	tenantID := middleware.GetTenantID(c)
	if tenantID == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid tenant context",
		})
	}

	startTime := time.Now()
	
	alerts, err := h.reportService.GetDashboardAlerts(tenantID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error":   "Failed to retrieve dashboard alerts",
			"message": err.Error(),
		})
	}

	return c.JSON(models.ReportResponse{
		Data: alerts,
		Metadata: models.ReportMeta{
			ProcessingTime: time.Since(startTime),
			DataSource:     "database",
			ReportType:     "dashboard_alerts",
		},
		GeneratedAt: time.Now(),
	})
}

// Inventory Report endpoints

// GetInventoryOverview returns comprehensive inventory overview
func (h *ReportHandler) GetInventoryOverview(c *fiber.Ctx) error {
	tenantID := middleware.GetTenantID(c)
	if tenantID == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid tenant context",
		})
	}

	filters := h.parseFilters(c)
	startTime := time.Now()
	
	overview, err := h.inventoryReportService.GetInventoryOverview(tenantID, filters)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error":   "Failed to retrieve inventory overview",
			"message": err.Error(),
		})
	}

	return c.JSON(models.ReportResponse{
		Data: overview,
		Metadata: models.ReportMeta{
			ProcessingTime: time.Since(startTime),
			DataSource:     "database+cache",
			ReportType:     "inventory_overview",
			Period:         filters.DateRange,
		},
		GeneratedAt: time.Now(),
	})
}

// GetInventoryLevels returns current inventory levels
func (h *ReportHandler) GetInventoryLevels(c *fiber.Ctx) error {
	tenantID := middleware.GetTenantID(c)
	if tenantID == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid tenant context",
		})
	}

	filters := h.parseFilters(c)
	startTime := time.Now()
	
	levels, err := h.inventoryReportService.GetInventoryLevels(tenantID, filters)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error":   "Failed to retrieve inventory levels",
			"message": err.Error(),
		})
	}

	return c.JSON(models.ReportResponse{
		Data: levels,
		Metadata: models.ReportMeta{
			TotalRecords:   len(levels),
			ProcessingTime: time.Since(startTime),
			DataSource:     "database",
			ReportType:     "inventory_levels",
		},
		GeneratedAt: time.Now(),
	})
}

// GetInventoryMovements returns inventory movement history
func (h *ReportHandler) GetInventoryMovements(c *fiber.Ctx) error {
	tenantID := middleware.GetTenantID(c)
	if tenantID == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid tenant context",
		})
	}

	filters := h.parseFilters(c)
	startTime := time.Now()
	
	movements, err := h.inventoryReportService.GetInventoryMovements(tenantID, filters)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error":   "Failed to retrieve inventory movements",
			"message": err.Error(),
		})
	}

	return c.JSON(models.ReportResponse{
		Data: movements,
		Metadata: models.ReportMeta{
			TotalRecords:   len(movements),
			ProcessingTime: time.Since(startTime),
			DataSource:     "database",
			ReportType:     "inventory_movements",
			Period:         filters.DateRange,
		},
		GeneratedAt: time.Now(),
	})
}

// GetInventoryAging returns inventory aging analysis
func (h *ReportHandler) GetInventoryAging(c *fiber.Ctx) error {
	tenantID := middleware.GetTenantID(c)
	if tenantID == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid tenant context",
		})
	}

	filters := h.parseFilters(c)
	startTime := time.Now()
	
	aging, err := h.inventoryReportService.GetInventoryAging(tenantID, filters)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error":   "Failed to retrieve inventory aging",
			"message": err.Error(),
		})
	}

	return c.JSON(models.ReportResponse{
		Data: aging,
		Metadata: models.ReportMeta{
			TotalRecords:   len(aging),
			ProcessingTime: time.Since(startTime),
			DataSource:     "database",
			ReportType:     "inventory_aging",
		},
		GeneratedAt: time.Now(),
	})
}

// GetInventoryTurnover returns inventory turnover analysis
func (h *ReportHandler) GetInventoryTurnover(c *fiber.Ctx) error {
	tenantID := middleware.GetTenantID(c)
	if tenantID == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid tenant context",
		})
	}

	filters := h.parseFilters(c)
	startTime := time.Now()
	
	turnover, err := h.inventoryReportService.GetInventoryTurnover(tenantID, filters)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error":   "Failed to retrieve inventory turnover",
			"message": err.Error(),
		})
	}

	return c.JSON(models.ReportResponse{
		Data: turnover,
		Metadata: models.ReportMeta{
			TotalRecords:   len(turnover),
			ProcessingTime: time.Since(startTime),
			DataSource:     "database",
			ReportType:     "inventory_turnover",
			Period:         filters.DateRange,
		},
		GeneratedAt: time.Now(),
	})
}

// Financial Report endpoints

// GetProfitLossReport returns P&L report
func (h *ReportHandler) GetProfitLossReport(c *fiber.Ctx) error {
	tenantID := middleware.GetTenantID(c)
	if tenantID == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid tenant context",
		})
	}

	period := h.parseDateRange(c)
	startTime := time.Now()
	
	report, err := h.financialReportService.GetProfitLossReport(tenantID, period)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error":   "Failed to retrieve profit & loss report",
			"message": err.Error(),
		})
	}

	return c.JSON(models.ReportResponse{
		Data: report,
		Metadata: models.ReportMeta{
			ProcessingTime: time.Since(startTime),
			DataSource:     "database+cache",
			ReportType:     "profit_loss",
			Period:         period,
		},
		GeneratedAt: time.Now(),
	})
}

// GetCashFlowReport returns cash flow report
func (h *ReportHandler) GetCashFlowReport(c *fiber.Ctx) error {
	tenantID := middleware.GetTenantID(c)
	if tenantID == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid tenant context",
		})
	}

	period := h.parseDateRange(c)
	startTime := time.Now()
	
	report, err := h.financialReportService.GetCashFlowReport(tenantID, period)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error":   "Failed to retrieve cash flow report",
			"message": err.Error(),
		})
	}

	return c.JSON(models.ReportResponse{
		Data: report,
		Metadata: models.ReportMeta{
			ProcessingTime: time.Since(startTime),
			DataSource:     "database+cache",
			ReportType:     "cash_flow",
			Period:         period,
		},
		GeneratedAt: time.Now(),
	})
}

// GetBalanceSheetReport returns balance sheet report
func (h *ReportHandler) GetBalanceSheetReport(c *fiber.Ctx) error {
	tenantID := middleware.GetTenantID(c)
	if tenantID == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid tenant context",
		})
	}

	period := h.parseDateRange(c)
	startTime := time.Now()
	
	report, err := h.financialReportService.GetBalanceSheetReport(tenantID, period)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error":   "Failed to retrieve balance sheet report",
			"message": err.Error(),
		})
	}

	return c.JSON(models.ReportResponse{
		Data: report,
		Metadata: models.ReportMeta{
			ProcessingTime: time.Since(startTime),
			DataSource:     "database+cache",
			ReportType:     "balance_sheet",
			Period:         period,
		},
		GeneratedAt: time.Now(),
	})
}

// GetFinancialRatios returns financial ratios
func (h *ReportHandler) GetFinancialRatios(c *fiber.Ctx) error {
	tenantID := middleware.GetTenantID(c)
	if tenantID == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid tenant context",
		})
	}

	period := h.parseDateRange(c)
	startTime := time.Now()
	
	ratios, err := h.financialReportService.GetFinancialRatios(tenantID, period)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error":   "Failed to retrieve financial ratios",
			"message": err.Error(),
		})
	}

	return c.JSON(models.ReportResponse{
		Data: ratios,
		Metadata: models.ReportMeta{
			ProcessingTime: time.Since(startTime),
			DataSource:     "database+cache",
			ReportType:     "financial_ratios",
			Period:         period,
		},
		GeneratedAt: time.Now(),
	})
}

// Sales and Purchase Report stubs (to be implemented)

func (h *ReportHandler) GetSalesOverview(c *fiber.Ctx) error {
	return c.Status(fiber.StatusNotImplemented).JSON(fiber.Map{
		"error": "Sales overview report not yet implemented",
	})
}

func (h *ReportHandler) GetSalesTrends(c *fiber.Ctx) error {
	return c.Status(fiber.StatusNotImplemented).JSON(fiber.Map{
		"error": "Sales trends report not yet implemented",
	})
}

func (h *ReportHandler) GetSalesByCustomer(c *fiber.Ctx) error {
	return c.Status(fiber.StatusNotImplemented).JSON(fiber.Map{
		"error": "Sales by customer report not yet implemented",
	})
}

func (h *ReportHandler) GetSalesByProduct(c *fiber.Ctx) error {
	return c.Status(fiber.StatusNotImplemented).JSON(fiber.Map{
		"error": "Sales by product report not yet implemented",
	})
}

func (h *ReportHandler) GetPurchaseOverview(c *fiber.Ctx) error {
	return c.Status(fiber.StatusNotImplemented).JSON(fiber.Map{
		"error": "Purchase overview report not yet implemented",
	})
}

func (h *ReportHandler) GetPurchaseBySupplier(c *fiber.Ctx) error {
	return c.Status(fiber.StatusNotImplemented).JSON(fiber.Map{
		"error": "Purchase by supplier report not yet implemented",
	})
}

func (h *ReportHandler) GetPurchaseByProduct(c *fiber.Ctx) error {
	return c.Status(fiber.StatusNotImplemented).JSON(fiber.Map{
		"error": "Purchase by product report not yet implemented",
	})
}

func (h *ReportHandler) GetEmployeeAttendance(c *fiber.Ctx) error {
	return c.Status(fiber.StatusNotImplemented).JSON(fiber.Map{
		"error": "Employee attendance report not yet implemented",
	})
}

func (h *ReportHandler) GetEmployeePerformance(c *fiber.Ctx) error {
	return c.Status(fiber.StatusNotImplemented).JSON(fiber.Map{
		"error": "Employee performance report not yet implemented",
	})
}

// Utility endpoints

// ClearReportCache clears all cached reports for the tenant
func (h *ReportHandler) ClearReportCache(c *fiber.Ctx) error {
	tenantID := middleware.GetTenantID(c)
	if tenantID == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid tenant context",
		})
	}

	// Clear caches in all report services
	services := []interface {
		ClearCache(int) error
	}{
		h.reportService,
		h.inventoryReportService,
		h.financialReportService,
	}

	for _, service := range services {
		if err := service.ClearCache(tenantID); err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error":   "Failed to clear cache",
				"message": err.Error(),
			})
		}
	}

	return c.JSON(fiber.Map{
		"success": true,
		"message": "Report cache cleared successfully",
		"tenant_id": tenantID,
		"cleared_at": time.Now(),
	})
}

// ExportReport exports report in various formats
func (h *ReportHandler) ExportReport(c *fiber.Ctx) error {
	reportType := c.Params("type")
	format := c.Params("format")

	return c.Status(fiber.StatusNotImplemented).JSON(fiber.Map{
		"error": "Report export not yet implemented",
		"report_type": reportType,
		"format": format,
	})
}

// Helper methods

// parseFilters parses query parameters into ReportFilters
func (h *ReportHandler) parseFilters(c *fiber.Ctx) models.ReportFilters {
	filters := models.ReportFilters{}

	// Parse date range
	if startDate := c.Query("start_date"); startDate != "" {
		if t, err := time.Parse("2006-01-02", startDate); err == nil {
			filters.DateRange.StartDate = t
		}
	}
	
	if endDate := c.Query("end_date"); endDate != "" {
		if t, err := time.Parse("2006-01-02", endDate); err == nil {
			filters.DateRange.EndDate = t
		}
	}

	// Parse other filters
	filters.Category = c.Query("category")
	filters.Warehouse = c.Query("warehouse")
	filters.Customer = c.Query("customer")
	filters.Supplier = c.Query("supplier")
	filters.Product = c.Query("product")
	filters.Status = c.Query("status")
	filters.GroupBy = c.Query("group_by")
	filters.SortBy = c.Query("sort_by")
	filters.SortOrder = c.Query("sort_order")

	// Parse pagination
	if limit, err := strconv.Atoi(c.Query("limit")); err == nil {
		filters.Limit = limit
	}
	
	if offset, err := strconv.Atoi(c.Query("offset")); err == nil {
		filters.Offset = offset
	}

	// Set defaults
	filters.SetDefaults()

	return filters
}

// parseDateRange parses date range from query parameters
func (h *ReportHandler) parseDateRange(c *fiber.Ctx) models.DateRange {
	dateRange := models.DateRange{}

	if startDate := c.Query("start_date"); startDate != "" {
		if t, err := time.Parse("2006-01-02", startDate); err == nil {
			dateRange.StartDate = t
		}
	}
	
	if endDate := c.Query("end_date"); endDate != "" {
		if t, err := time.Parse("2006-01-02", endDate); err == nil {
			dateRange.EndDate = t
		}
	}

	// Set defaults if not provided
	if dateRange.StartDate.IsZero() {
		dateRange.StartDate = time.Now().AddDate(0, -3, 0) // 3 months ago
	}
	
	if dateRange.EndDate.IsZero() {
		dateRange.EndDate = time.Now()
	}

	return dateRange
}