package handlers

import (
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"nexus-erp/backend/internal/models"
	"nexus-erp/backend/internal/services"
)

// PredictionHandler 處理預測相關的 HTTP 請求
type PredictionHandler struct {
	forecastingService          *services.ForecastingService
	inventoryOptimizationService *services.InventoryOptimizationService
}

// NewPredictionHandler 建立新的預測處理器實例
func NewPredictionHandler(
	forecastingService *services.ForecastingService,
	inventoryOptimizationService *services.InventoryOptimizationService,
) *PredictionHandler {
	return &PredictionHandler{
		forecastingService:          forecastingService,
		inventoryOptimizationService: inventoryOptimizationService,
	}
}

// CreateSalesForecast 產生銷售預測
// @Summary 產生銷售預測
// @Description 基於歷史銷售資料產生未來銷售預測，支援多種預測模型
// @Tags Predictions
// @Accept json
// @Produce json
// @Param request body models.SalesForecastRequest true "銷售預測請求"
// @Success 200 {object} models.SalesForecastResponse "預測結果"
// @Failure 400 {object} ErrorResponse "請求參數錯誤"
// @Failure 500 {object} ErrorResponse "伺服器內部錯誤"
// @Router /api/predictions/sales-forecast [post]
func (h *PredictionHandler) CreateSalesForecast(c *gin.Context) {
	var req models.SalesForecastRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error:   "Invalid request format",
			Message: err.Error(),
		})
		return
	}

	// 驗證請求參數
	if err := h.validateSalesForecastRequest(req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error:   "Invalid request parameters",
			Message: err.Error(),
		})
		return
	}

	// 產生預測
	response, err := h.forecastingService.GenerateSalesForecast(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error:   "Failed to generate sales forecast",
			Message: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, response)
}

// CreateInventoryOptimization 產生庫存優化建議
// @Summary 產生庫存優化建議
// @Description 基於歷史資料和需求預測產生庫存優化建議，包括補貨點和最佳訂購量
// @Tags Predictions
// @Accept json
// @Produce json
// @Param request body models.InventoryOptimizationRequest true "庫存優化請求"
// @Success 200 {object} models.InventoryOptimizationResponse "優化建議"
// @Failure 400 {object} ErrorResponse "請求參數錯誤"
// @Failure 500 {object} ErrorResponse "伺服器內部錯誤"
// @Router /api/predictions/inventory-optimization [post]
func (h *PredictionHandler) CreateInventoryOptimization(c *gin.Context) {
	var req models.InventoryOptimizationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error:   "Invalid request format",
			Message: err.Error(),
		})
		return
	}

	// 驗證請求參數
	if err := h.validateInventoryOptimizationRequest(req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error:   "Invalid request parameters",
			Message: err.Error(),
		})
		return
	}

	// 產生優化建議
	response, err := h.inventoryOptimizationService.GenerateInventoryOptimization(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error:   "Failed to generate inventory optimization",
			Message: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, response)
}

// GetPredictionAccuracy 獲取預測準確度資訊
// @Summary 獲取預測準確度資訊
// @Description 獲取各種預測模型的準確度統計資訊
// @Tags Predictions
// @Produce json
// @Param model_type query string false "模型類型" Enums(arima,moving_average,exponential_smoothing,linear_regression)
// @Param days query int false "統計天數" default(30)
// @Success 200 {object} map[string]interface{} "準確度統計"
// @Failure 500 {object} ErrorResponse "伺服器內部錯誤"
// @Router /api/predictions/accuracy [get]
func (h *PredictionHandler) GetPredictionAccuracy(c *gin.Context) {
	modelType := c.Query("model_type")
	daysStr := c.DefaultQuery("days", "30")
	
	days, err := strconv.Atoi(daysStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error:   "Invalid days parameter",
			Message: "days must be a valid integer",
		})
		return
	}

	// 這裡可以實作獲取準確度統計的邏輯
	// 暫時返回模擬資料
	accuracy := map[string]interface{}{
		"model_type":        modelType,
		"analysis_period":   days,
		"total_predictions": 150,
		"avg_mape":         0.12,
		"avg_mae":          8.5,
		"avg_rmse":         12.3,
		"accuracy_trend":   "improving",
		"last_updated":     time.Now(),
	}

	c.JSON(http.StatusOK, accuracy)
}

// GetPredictionHistory 獲取歷史預測記錄
// @Summary 獲取歷史預測記錄
// @Description 獲取歷史預測記錄，支援分頁和篩選
// @Tags Predictions
// @Produce json
// @Param prediction_type query string false "預測類型" Enums(sales,inventory)
// @Param target_entity_type query string false "目標實體類型" Enums(product,category,total)
// @Param target_entity_id query int false "目標實體ID"
// @Param date_from query string false "開始日期" Format(date)
// @Param date_to query string false "結束日期" Format(date)
// @Param page query int false "頁碼" default(1)
// @Param page_size query int false "每頁大小" default(20)
// @Param sort_by query string false "排序欄位" default(created_at)
// @Param sort_order query string false "排序順序" Enums(asc,desc) default(desc)
// @Success 200 {object} models.PredictionHistoryResponse "預測記錄"
// @Failure 400 {object} ErrorResponse "請求參數錯誤"
// @Failure 500 {object} ErrorResponse "伺服器內部錯誤"
// @Router /api/predictions/history [get]
func (h *PredictionHandler) GetPredictionHistory(c *gin.Context) {
	var req models.PredictionHistoryRequest
	if err := c.ShouldBindQuery(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error:   "Invalid query parameters",
			Message: err.Error(),
		})
		return
	}

	// 解析日期參數
	if dateFromStr := c.Query("date_from"); dateFromStr != "" {
		if dateFrom, err := time.Parse("2006-01-02", dateFromStr); err == nil {
			req.DateFrom = &dateFrom
		}
	}
	
	if dateToStr := c.Query("date_to"); dateToStr != "" {
		if dateTo, err := time.Parse("2006-01-02", dateToStr); err == nil {
			req.DateTo = &dateTo
		}
	}

	// 驗證預測類型
	if req.PredictionType != "" && !models.ValidatePredictionType(req.PredictionType) {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error:   "Invalid prediction_type",
			Message: "prediction_type must be 'sales' or 'inventory'",
		})
		return
	}

	// 驗證目標實體類型
	if req.TargetEntityType != "" && !models.ValidateTargetEntityType(req.TargetEntityType) {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error:   "Invalid target_entity_type",
			Message: "target_entity_type must be 'product', 'category', or 'total'",
		})
		return
	}

	// 獲取預測記錄
	response, err := h.forecastingService.GetPredictionHistory(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error:   "Failed to get prediction history",
			Message: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, response)
}

// GetInventoryAnalysisReport 獲取庫存分析報告
// @Summary 獲取庫存分析報告
// @Description 獲取包含 ABC 分析、VED 分析和週轉率分析的綜合庫存報告
// @Tags Predictions
// @Produce json
// @Param warehouse_id query int false "倉庫ID"
// @Param analysis_days query int false "分析天數" default(90)
// @Success 200 {object} map[string]interface{} "庫存分析報告"
// @Failure 400 {object} ErrorResponse "請求參數錯誤"
// @Failure 500 {object} ErrorResponse "伺服器內部錯誤"
// @Router /api/predictions/inventory-analysis [get]
func (h *PredictionHandler) GetInventoryAnalysisReport(c *gin.Context) {
	var warehouseID *int64
	if warehouseIDStr := c.Query("warehouse_id"); warehouseIDStr != "" {
		if id, err := strconv.ParseInt(warehouseIDStr, 10, 64); err == nil {
			warehouseID = &id
		} else {
			c.JSON(http.StatusBadRequest, ErrorResponse{
				Error:   "Invalid warehouse_id",
				Message: "warehouse_id must be a valid integer",
			})
			return
		}
	}

	analysisDaysStr := c.DefaultQuery("analysis_days", "90")
	analysisDays, err := strconv.Atoi(analysisDaysStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error:   "Invalid analysis_days",
			Message: "analysis_days must be a valid integer",
		})
		return
	}

	// 獲取庫存分析報告
	report, err := h.inventoryOptimizationService.GenerateInventoryReport(warehouseID, analysisDays)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error:   "Failed to generate inventory analysis report",
			Message: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, report)
}

// ValidateModelConfiguration 驗證模型配置
// @Summary 驗證模型配置
// @Description 驗證預測模型的配置參數是否正確
// @Tags Predictions
// @Accept json
// @Produce json
// @Param model_type path string true "模型類型" Enums(arima,moving_average,exponential_smoothing,linear_regression)
// @Param configuration body map[string]interface{} true "模型配置"
// @Success 200 {object} map[string]interface{} "驗證結果"
// @Failure 400 {object} ErrorResponse "配置參數錯誤"
// @Router /api/predictions/models/{model_type}/validate [post]
func (h *PredictionHandler) ValidateModelConfiguration(c *gin.Context) {
	modelType := c.Param("model_type")
	
	if !models.ValidateModelType(modelType) {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error:   "Invalid model type",
			Message: "model_type must be one of: arima, moving_average, exponential_smoothing, linear_regression",
		})
		return
	}

	var config map[string]interface{}
	if err := c.ShouldBindJSON(&config); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error:   "Invalid configuration format",
			Message: err.Error(),
		})
		return
	}

	// 驗證配置參數
	validationResult := h.validateModelConfiguration(modelType, config)
	
	c.JSON(http.StatusOK, validationResult)
}

// 驗證方法

// validateSalesForecastRequest 驗證銷售預測請求
func (h *PredictionHandler) validateSalesForecastRequest(req models.SalesForecastRequest) error {
	// 檢查日期範圍
	if req.StartDate.After(req.EndDate) {
		return fmt.Errorf("start_date must be before end_date")
	}

	// 檢查預測天數
	if req.ForecastDays < 1 || req.ForecastDays > 365 {
		return fmt.Errorf("forecast_days must be between 1 and 365")
	}

	// 檢查模型類型
	if req.ModelType != "" && !models.ValidateModelType(req.ModelType) {
		return fmt.Errorf("invalid model_type: %s", req.ModelType)
	}

	// 檢查至少要有一個目標實體
	if req.ProductID == nil && req.CategoryID == nil {
		return fmt.Errorf("must specify either product_id or category_id")
	}

	return nil
}

// validateInventoryOptimizationRequest 驗證庫存優化請求
func (h *PredictionHandler) validateInventoryOptimizationRequest(req models.InventoryOptimizationRequest) error {
	// 檢查分析天數
	if req.AnalysisDays < 30 || req.AnalysisDays > 365 {
		return fmt.Errorf("analysis_days must be between 30 and 365")
	}

	// 檢查交期天數
	if req.LeadTimeDays < 1 || req.LeadTimeDays > 180 {
		return fmt.Errorf("lead_time_days must be between 1 and 180")
	}

	// 檢查服務水準
	if req.ServiceLevel < 0.8 || req.ServiceLevel > 0.99 {
		return fmt.Errorf("service_level must be between 0.8 and 0.99")
	}

	return nil
}

// validateModelConfiguration 驗證模型配置
func (h *PredictionHandler) validateModelConfiguration(modelType string, config map[string]interface{}) map[string]interface{} {
	result := map[string]interface{}{
		"valid":        true,
		"errors":       []string{},
		"warnings":     []string{},
		"model_type":   modelType,
		"config":       config,
	}

	errors := []string{}
	warnings := []string{}

	switch modelType {
	case models.ModelTypeMovingAverage:
		if windowSize, exists := config["window_size"]; exists {
			if ws, ok := windowSize.(float64); ok {
				if ws < 3 || ws > 60 {
					errors = append(errors, "window_size must be between 3 and 60")
				} else if ws > 30 {
					warnings = append(warnings, "large window_size may reduce responsiveness to recent changes")
				}
			} else {
				errors = append(errors, "window_size must be a number")
			}
		} else {
			warnings = append(warnings, "window_size not specified, will use default value")
		}

	case models.ModelTypeExponentialSmoothing:
		if alpha, exists := config["alpha"]; exists {
			if a, ok := alpha.(float64); ok {
				if a <= 0 || a >= 1 {
					errors = append(errors, "alpha must be between 0 and 1 (exclusive)")
				}
			} else {
				errors = append(errors, "alpha must be a number")
			}
		}

		if beta, exists := config["beta"]; exists {
			if b, ok := beta.(float64); ok {
				if b < 0 || b >= 1 {
					errors = append(errors, "beta must be between 0 and 1 (inclusive)")
				}
			} else {
				errors = append(errors, "beta must be a number")
			}
		}

	case models.ModelTypeLinearRegression:
		if minDataPoints, exists := config["min_data_points"]; exists {
			if mdp, ok := minDataPoints.(float64); ok {
				if mdp < 10 {
					warnings = append(warnings, "min_data_points less than 10 may result in unreliable predictions")
				}
			}
		}

	case models.ModelTypeARIMA:
		// ARIMA 參數驗證 (p, d, q)
		if p, exists := config["p"]; exists {
			if pVal, ok := p.(float64); ok {
				if pVal < 0 || pVal > 5 {
					errors = append(errors, "ARIMA parameter p must be between 0 and 5")
				}
			}
		}
		if d, exists := config["d"]; exists {
			if dVal, ok := d.(float64); ok {
				if dVal < 0 || dVal > 2 {
					errors = append(errors, "ARIMA parameter d must be between 0 and 2")
				}
			}
		}
		if q, exists := config["q"]; exists {
			if qVal, ok := q.(float64); ok {
				if qVal < 0 || qVal > 5 {
					errors = append(errors, "ARIMA parameter q must be between 0 and 5")
				}
			}
		}
	}

	if len(errors) > 0 {
		result["valid"] = false
		result["errors"] = errors
	}
	
	if len(warnings) > 0 {
		result["warnings"] = warnings
	}

	return result
}

// ErrorResponse 錯誤回應結構
type ErrorResponse struct {
	Error   string `json:"error"`
	Message string `json:"message"`
}