package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"

	"nexus-erp/backend/internal/models"
	"nexus-erp/backend/internal/services"
)

type ReportHandler struct {
	reportService *services.ReportService
}

func NewReportHandler(reportService *services.ReportService) *ReportHandler {
	return &ReportHandler{
		reportService: reportService,
	}
}

// GetSalesReport 獲取銷售報表
// @Summary 獲取銷售報表
// @Description 獲取銷售報表資料，包含訂單統計、客戶分析等
// @Tags reports
// @Accept json
// @Produce json
// @Param date_from query string false "開始日期 (YYYY-MM-DD)"
// @Param date_to query string false "結束日期 (YYYY-MM-DD)"
// @Param status query string false "訂單狀態"
// @Param use_cache query bool false "是否使用快取"
// @Success 200 {object} models.ReportResponse
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/sales-reports [get]
func (h *ReportHandler) GetSalesReport(c *gin.Context) {
	req := models.ReportRequest{
		ReportType: "sales",
		Parameters: make(map[string]interface{}),
		UseCache:   true,
	}
	
	// 解析查詢參數
	if dateFromStr := c.Query("date_from"); dateFromStr != "" {
		if dateFrom, err := time.Parse("2006-01-02", dateFromStr); err == nil {
			req.DateFrom = &dateFrom
		} else {
			c.JSON(http.StatusBadRequest, gin.H{"error": "無效的開始日期格式"})
			return
		}
	}
	
	if dateToStr := c.Query("date_to"); dateToStr != "" {
		if dateTo, err := time.Parse("2006-01-02", dateToStr); err == nil {
			req.DateTo = &dateTo
		} else {
			c.JSON(http.StatusBadRequest, gin.H{"error": "無效的結束日期格式"})
			return
		}
	}
	
	if status := c.Query("status"); status != "" {
		req.Parameters["status"] = status
	}
	
	if reportType := c.Query("report_type"); reportType != "" {
		req.Parameters["report_type"] = reportType
	}
	
	if useCacheStr := c.Query("use_cache"); useCacheStr != "" {
		if useCache, err := strconv.ParseBool(useCacheStr); err == nil {
			req.UseCache = useCache
		}
	}
	
	// 獲取報表
	report, err := h.reportService.GetSalesReport(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	
	c.JSON(http.StatusOK, report)
}

// GetInventoryReport 獲取庫存報表
// @Summary 獲取庫存報表
// @Description 獲取庫存報表資料，包含庫存水準、週轉率等
// @Tags reports
// @Accept json
// @Produce json
// @Param warehouse_id query string false "倉庫ID"
// @Param stock_status query string false "庫存狀態 (normal/low_stock/out_of_stock)"
// @Param use_cache query bool false "是否使用快取"
// @Success 200 {object} models.ReportResponse
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/inventory-reports [get]
func (h *ReportHandler) GetInventoryReport(c *gin.Context) {
	req := models.ReportRequest{
		ReportType: "inventory",
		Parameters: make(map[string]interface{}),
		UseCache:   true,
	}
	
	// 解析查詢參數
	if warehouseID := c.Query("warehouse_id"); warehouseID != "" {
		req.Parameters["warehouse_id"] = warehouseID
	}
	
	if stockStatus := c.Query("stock_status"); stockStatus != "" {
		req.Parameters["stock_status"] = stockStatus
	}
	
	if useCacheStr := c.Query("use_cache"); useCacheStr != "" {
		if useCache, err := strconv.ParseBool(useCacheStr); err == nil {
			req.UseCache = useCache
		}
	}
	
	// 獲取報表
	report, err := h.reportService.GetInventoryReport(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	
	c.JSON(http.StatusOK, report)
}

// GetFinancialReport 獲取財務報表
// @Summary 獲取財務報表
// @Description 獲取財務報表資料，包含應收應付帳款、現金流等
// @Tags reports
// @Accept json
// @Produce json
// @Param date_from query string false "開始日期 (YYYY-MM-DD)"
// @Param date_to query string false "結束日期 (YYYY-MM-DD)"
// @Param ar_status query string false "應收帳款狀態"
// @Param ap_status query string false "應付帳款狀態"
// @Param use_cache query bool false "是否使用快取"
// @Success 200 {object} models.ReportResponse
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/financial-reports [get]
func (h *ReportHandler) GetFinancialReport(c *gin.Context) {
	req := models.ReportRequest{
		ReportType: "financial",
		Parameters: make(map[string]interface{}),
		UseCache:   true,
	}
	
	// 解析查詢參數
	if dateFromStr := c.Query("date_from"); dateFromStr != "" {
		if dateFrom, err := time.Parse("2006-01-02", dateFromStr); err == nil {
			req.DateFrom = &dateFrom
		} else {
			c.JSON(http.StatusBadRequest, gin.H{"error": "無效的開始日期格式"})
			return
		}
	}
	
	if dateToStr := c.Query("date_to"); dateToStr != "" {
		if dateTo, err := time.Parse("2006-01-02", dateToStr); err == nil {
			req.DateTo = &dateTo
		} else {
			c.JSON(http.StatusBadRequest, gin.H{"error": "無效的結束日期格式"})
			return
		}
	}
	
	if arStatus := c.Query("ar_status"); arStatus != "" {
		req.Parameters["ar_status"] = arStatus
	}
	
	if apStatus := c.Query("ap_status"); apStatus != "" {
		req.Parameters["ap_status"] = apStatus
	}
	
	if useCacheStr := c.Query("use_cache"); useCacheStr != "" {
		if useCache, err := strconv.ParseBool(useCacheStr); err == nil {
			req.UseCache = useCache
		}
	}
	
	// 獲取報表
	report, err := h.reportService.GetFinancialReport(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	
	c.JSON(http.StatusOK, report)
}

// GetDashboardData 獲取儀表板摘要資料
// @Summary 獲取儀表板摘要資料
// @Description 獲取所有報表的摘要資料，用於儀表板顯示
// @Tags reports
// @Accept json
// @Produce json
// @Success 200 {object} map[string]interface{}
// @Failure 500 {object} map[string]string
// @Router /api/dashboard [get]
func (h *ReportHandler) GetDashboardData(c *gin.Context) {
	// 設定預設查詢參數（最近30天）
	now := time.Now()
	thirtyDaysAgo := now.AddDate(0, 0, -30)
	
	req := models.ReportRequest{
		DateFrom:   &thirtyDaysAgo,
		DateTo:     &now,
		Parameters: make(map[string]interface{}),
		UseCache:   true,
	}
	
	// 並行獲取所有報表
	salesChan := make(chan *models.ReportResponse, 1)
	inventoryChan := make(chan *models.ReportResponse, 1)
	financialChan := make(chan *models.ReportResponse, 1)
	errorChan := make(chan error, 3)
	
	// 獲取銷售報表
	go func() {
		req.ReportType = "sales"
		report, err := h.reportService.GetSalesReport(req)
		if err != nil {
			errorChan <- err
			return
		}
		salesChan <- report
	}()
	
	// 獲取庫存報表
	go func() {
		req.ReportType = "inventory"
		report, err := h.reportService.GetInventoryReport(req)
		if err != nil {
			errorChan <- err
			return
		}
		inventoryChan <- report
	}()
	
	// 獲取財務報表
	go func() {
		req.ReportType = "financial"
		report, err := h.reportService.GetFinancialReport(req)
		if err != nil {
			errorChan <- err
			return
		}
		financialChan <- report
	}()
	
	// 收集結果
	dashboard := make(map[string]interface{})
	completed := 0
	
	for completed < 3 {
		select {
		case salesReport := <-salesChan:
			var summary models.SalesReportSummary
			if err := json.Unmarshal(salesReport.Summary, &summary); err == nil {
				dashboard["sales"] = summary
			}
			completed++
			
		case inventoryReport := <-inventoryChan:
			var summary models.InventoryReportSummary
			if err := json.Unmarshal(inventoryReport.Summary, &summary); err == nil {
				dashboard["inventory"] = summary
			}
			completed++
			
		case financialReport := <-financialChan:
			var summary models.FinancialReportSummary
			if err := json.Unmarshal(financialReport.Summary, &summary); err == nil {
				dashboard["financial"] = summary
			}
			completed++
			
		case err := <-errorChan:
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	}
	
	// 添加時間戳
	dashboard["generated_at"] = time.Now()
	dashboard["period"] = map[string]interface{}{
		"from": thirtyDaysAgo,
		"to":   now,
	}
	
	c.JSON(http.StatusOK, dashboard)
}

// ClearReportCache 清理報表快取
// @Summary 清理報表快取
// @Description 清理過期的報表快取
// @Tags reports
// @Accept json
// @Produce json
// @Success 200 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/reports/cache/clear [post]
func (h *ReportHandler) ClearReportCache(c *gin.Context) {
	err := h.reportService.ClearExpiredCache()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{"message": "快取清理完成"})
}