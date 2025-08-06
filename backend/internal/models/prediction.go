package models

import (
	"time"
)

// Prediction represents a prediction record in the database
type Prediction struct {
	ID                      int64     `json:"id" db:"id"`
	PredictionType          string    `json:"prediction_type" db:"prediction_type"`
	TargetEntityType        string    `json:"target_entity_type" db:"target_entity_type"`
	TargetEntityID          *int64    `json:"target_entity_id,omitempty" db:"target_entity_id"`
	PredictionDate          time.Time `json:"prediction_date" db:"prediction_date"`
	PredictedValue          float64   `json:"predicted_value" db:"predicted_value"`
	ConfidenceIntervalLower *float64  `json:"confidence_interval_lower,omitempty" db:"confidence_interval_lower"`
	ConfidenceIntervalUpper *float64  `json:"confidence_interval_upper,omitempty" db:"confidence_interval_upper"`
	ModelUsed               string    `json:"model_used" db:"model_used"`
	CreatedAt               time.Time `json:"created_at" db:"created_at"`
}

// PredictionModel represents a prediction model configuration
type PredictionModel struct {
	ID               int64                  `json:"id" db:"id"`
	Name             string                 `json:"name" db:"name"`
	ModelType        string                 `json:"model_type" db:"model_type"`
	Configuration    map[string]interface{} `json:"configuration" db:"configuration"`
	IsActive         bool                   `json:"is_active" db:"is_active"`
	LastTrainedAt    *time.Time             `json:"last_trained_at,omitempty" db:"last_trained_at"`
	AccuracyMAPE     *float64               `json:"accuracy_mape,omitempty" db:"accuracy_mape"`
	CreatedAt        time.Time              `json:"created_at" db:"created_at"`
	UpdatedAt        time.Time              `json:"updated_at" db:"updated_at"`
}

// PredictionAccuracy represents prediction accuracy metrics
type PredictionAccuracy struct {
	ID               int64     `json:"id" db:"id"`
	PredictionID     int64     `json:"prediction_id" db:"prediction_id"`
	ActualValue      float64   `json:"actual_value" db:"actual_value"`
	PredictedValue   float64   `json:"predicted_value" db:"predicted_value"`
	AbsoluteError    float64   `json:"absolute_error" db:"absolute_error"`
	PercentageError  float64   `json:"percentage_error" db:"percentage_error"`
	EvaluatedAt      time.Time `json:"evaluated_at" db:"evaluated_at"`
}

// Request/Response Models

// SalesForecastRequest represents a request for sales forecasting
type SalesForecastRequest struct {
	ProductID      *int64    `json:"product_id,omitempty"`
	CategoryID     *int64    `json:"category_id,omitempty"`
	BusinessUnitID *int64    `json:"business_unit_id,omitempty"`
	StartDate      time.Time `json:"start_date" binding:"required"`
	EndDate        time.Time `json:"end_date" binding:"required"`
	ForecastDays   int       `json:"forecast_days" binding:"required,min=1,max=365"`
	ModelType      string    `json:"model_type,omitempty"` // "arima", "moving_average", "exponential_smoothing"
	UseCache       bool      `json:"use_cache,omitempty"`
}

// SalesForecastResponse represents the response for sales forecasting
type SalesForecastResponse struct {
	RequestID      string                   `json:"request_id"`
	ProductID      *int64                   `json:"product_id,omitempty"`
	CategoryID     *int64                   `json:"category_id,omitempty"`
	BusinessUnitID *int64                   `json:"business_unit_id,omitempty"`
	ModelUsed      string                   `json:"model_used"`
	Forecasts      []SalesForecastDataPoint `json:"forecasts"`
	Accuracy       *PredictionAccuracyInfo  `json:"accuracy,omitempty"`
	GeneratedAt    time.Time                `json:"generated_at"`
	CachedUntil    *time.Time               `json:"cached_until,omitempty"`
}

// SalesForecastDataPoint represents a single forecast data point
type SalesForecastDataPoint struct {
	Date                    time.Time `json:"date"`
	PredictedValue          float64   `json:"predicted_value"`
	ConfidenceIntervalLower *float64  `json:"confidence_interval_lower,omitempty"`
	ConfidenceIntervalUpper *float64  `json:"confidence_interval_upper,omitempty"`
}

// InventoryOptimizationRequest represents a request for inventory optimization
type InventoryOptimizationRequest struct {
	ProductID      *int64    `json:"product_id,omitempty"`
	WarehouseID    *int64    `json:"warehouse_id,omitempty"`
	BusinessUnitID *int64    `json:"business_unit_id,omitempty"`
	AnalysisDays   int       `json:"analysis_days" binding:"required,min=30,max=365"`
	LeadTimeDays   int       `json:"lead_time_days" binding:"required,min=1,max=180"`
	ServiceLevel   float64   `json:"service_level" binding:"required,min=0.8,max=0.99"`
	UseCache       bool      `json:"use_cache,omitempty"`
}

// InventoryOptimizationResponse represents the response for inventory optimization
type InventoryOptimizationResponse struct {
	RequestID       string                            `json:"request_id"`
	ProductID       *int64                            `json:"product_id,omitempty"`
	WarehouseID     *int64                            `json:"warehouse_id,omitempty"`
	BusinessUnitID  *int64                            `json:"business_unit_id,omitempty"`
	Recommendations []InventoryRecommendation         `json:"recommendations"`
	Summary         InventoryOptimizationSummary      `json:"summary"`
	GeneratedAt     time.Time                         `json:"generated_at"`
	CachedUntil     *time.Time                        `json:"cached_until,omitempty"`
}

// InventoryRecommendation represents an inventory recommendation for a specific product
type InventoryRecommendation struct {
	ProductID            int64   `json:"product_id"`
	ProductName          string  `json:"product_name"`
	WarehouseID          int64   `json:"warehouse_id"`
	WarehouseName        string  `json:"warehouse_name"`
	CurrentStock         float64 `json:"current_stock"`
	ReorderPoint         float64 `json:"reorder_point"`
	SafetyStock          float64 `json:"safety_stock"`
	OptimalOrderQuantity float64 `json:"optimal_order_quantity"`
	RecommendedAction    string  `json:"recommended_action"` // "order_now", "monitor", "reduce_stock"
	EstimatedDemand      float64 `json:"estimated_demand"`
	DaysOfStock          float64 `json:"days_of_stock"`
	Priority             string  `json:"priority"` // "high", "medium", "low"
}

// InventoryOptimizationSummary represents summary statistics for inventory optimization
type InventoryOptimizationSummary struct {
	TotalProductsAnalyzed    int     `json:"total_products_analyzed"`
	ProductsNeedingReorder   int     `json:"products_needing_reorder"`
	ProductsOverstocked      int     `json:"products_overstocked"`
	TotalInventoryValue      float64 `json:"total_inventory_value"`
	PotentialSavings         float64 `json:"potential_savings"`
	EstimatedCarryingCost    float64 `json:"estimated_carrying_cost"`
	EstimatedStockoutRisk    float64 `json:"estimated_stockout_risk"`
}

// PredictionAccuracyInfo represents accuracy information for a prediction
type PredictionAccuracyInfo struct {
	MAPE              float64   `json:"mape"`              // Mean Absolute Percentage Error
	MAE               float64   `json:"mae"`               // Mean Absolute Error
	RMSE              float64   `json:"rmse"`              // Root Mean Square Error
	LastEvaluatedAt   time.Time `json:"last_evaluated_at"`
	SampleSize        int       `json:"sample_size"`
	ConfidenceLevel   float64   `json:"confidence_level"`
}

// PredictionHistoryRequest represents a request for prediction history
type PredictionHistoryRequest struct {
	PredictionType   string     `form:"prediction_type"`   // "sales", "inventory"
	TargetEntityType string     `form:"target_entity_type"` // "product", "category", "total"
	TargetEntityID   *int64     `form:"target_entity_id"`
	DateFrom         *time.Time `form:"date_from"`
	DateTo           *time.Time `form:"date_to"`
	Page             int        `form:"page,default=1"`
	PageSize         int        `form:"page_size,default=20"`
	SortBy           string     `form:"sort_by,default=created_at"`
	SortOrder        string     `form:"sort_order,default=desc"`
}

// PredictionHistoryResponse represents paginated prediction history
type PredictionHistoryResponse struct {
	Predictions []PredictionWithDetails `json:"predictions"`
	Total       int64                   `json:"total"`
	Page        int                     `json:"page"`
	PageSize    int                     `json:"page_size"`
	Pages       int                     `json:"total_pages"`
}

// PredictionWithDetails represents a prediction with related details
type PredictionWithDetails struct {
	Prediction
	TargetEntityName string                   `json:"target_entity_name,omitempty"`
	Accuracy         *PredictionAccuracyInfo  `json:"accuracy,omitempty"`
}

// HistoricalSalesData represents historical sales data for forecasting
type HistoricalSalesData struct {
	Date        time.Time `json:"date" db:"date"`
	ProductID   *int64    `json:"product_id,omitempty" db:"product_id"`
	CategoryID  *int64    `json:"category_id,omitempty" db:"category_id"`
	Quantity    float64   `json:"quantity" db:"quantity"`
	Amount      float64   `json:"amount" db:"amount"`
	OrderCount  int       `json:"order_count" db:"order_count"`
}

// InventoryMovementData represents historical inventory movement data
type InventoryMovementData struct {
	Date               time.Time `json:"date" db:"date"`
	ProductID          int64     `json:"product_id" db:"product_id"`
	WarehouseID        int64     `json:"warehouse_id" db:"warehouse_id"`
	OpeningStock       float64   `json:"opening_stock" db:"opening_stock"`
	Inbound            float64   `json:"inbound" db:"inbound"`
	Outbound           float64   `json:"outbound" db:"outbound"`
	ClosingStock       float64   `json:"closing_stock" db:"closing_stock"`
	StockoutOccurred   bool      `json:"stockout_occurred" db:"stockout_occurred"`
}

// Model Constants
const (
	// Prediction Types
	PredictionTypeSales     = "sales"
	PredictionTypeInventory = "inventory"

	// Target Entity Types
	TargetEntityTypeProduct  = "product"
	TargetEntityTypeCategory = "category"
	TargetEntityTypeTotal    = "total"

	// Model Types
	ModelTypeARIMA              = "arima"
	ModelTypeMovingAverage      = "moving_average"
	ModelTypeExponentialSmoothing = "exponential_smoothing"
	ModelTypeLinearRegression   = "linear_regression"

	// Recommendation Actions
	ActionOrderNow    = "order_now"
	ActionMonitor     = "monitor"
	ActionReduceStock = "reduce_stock"

	// Priority Levels
	PriorityHigh   = "high"
	PriorityMedium = "medium"
	PriorityLow    = "low"
)

// Validation functions

// ValidatePredictionType 驗證預測類型
func ValidatePredictionType(predictionType string) bool {
	switch predictionType {
	case PredictionTypeSales, PredictionTypeInventory:
		return true
	default:
		return false
	}
}

// ValidateTargetEntityType 驗證目標實體類型
func ValidateTargetEntityType(entityType string) bool {
	switch entityType {
	case TargetEntityTypeProduct, TargetEntityTypeCategory, TargetEntityTypeTotal:
		return true
	default:
		return false
	}
}

// ValidateModelType 驗證模型類型
func ValidateModelType(modelType string) bool {
	switch modelType {
	case ModelTypeARIMA, ModelTypeMovingAverage, ModelTypeExponentialSmoothing, ModelTypeLinearRegression:
		return true
	default:
		return false
	}
}