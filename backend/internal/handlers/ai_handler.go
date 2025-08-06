package handlers

import (
	"net/http"
	"strconv"

	"nexus-erp/backend/internal/services"

	"github.com/gin-gonic/gin"
)

type AIHandler struct {
	aiService services.AIClassifier
}

func NewAIHandler(aiService services.AIClassifier) *AIHandler {
	return &AIHandler{
		aiService: aiService,
	}
}

// AI Query request structure for API
type AIQueryAPIRequest struct {
	Query   string `json:"query" binding:"required"`
	Context string `json:"context,omitempty"`
}

// AIQuery handles POST /api/ai/query endpoint
// @Summary Process natural language query
// @Description Process user's natural language query and return AI response with intent classification
// @Tags AI
// @Accept json
// @Produce json
// @Param request body AIQueryAPIRequest true "AI Query Request"
// @Success 200 {object} services.AIQueryResponse
// @Failure 400 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /api/ai/query [post]
func (h *AIHandler) AIQuery(c *gin.Context) {
	var req AIQueryAPIRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request format",
			"details": err.Error(),
			"success": false,
		})
		return
	}

	// 驗證查詢內容不為空
	if len(req.Query) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Query cannot be empty",
			"success": false,
		})
		return
	}

	// 限制查詢長度避免濫用
	if len(req.Query) > 1000 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Query too long (max 1000 characters)",
			"success": false,
		})
		return
	}

	// 取得用戶 ID (從 JWT middleware 設定)
	userIDInterface, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error":   "User not authenticated",
			"success": false,
		})
		return
	}

	userID, ok := userIDInterface.(string)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error":   "Invalid user ID format",
			"success": false,
		})
		return
	}

	// 轉換為整數 (假設用戶 ID 是整數)
	userIDInt, err := strconv.Atoi(userID)
	if err != nil {
		// 如果轉換失敗，嘗試其他方式或使用預設值
		userIDInt = 0
	}

	// 建立 AI 查詢請求
	aiReq := &services.AIQueryRequest{
		Query:   req.Query,
		Context: req.Context,
		UserID:  userIDInt,
	}

	// 處理 AI 查詢
	response, err := h.aiService.ProcessQuery(aiReq)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to process AI query",
			"details": err.Error(),
			"success": false,
		})
		return
	}

	// 記錄查詢日誌 (可選)
	// TODO: 實作查詢日誌記錄功能，用於分析和改進

	c.JSON(http.StatusOK, response)
}

// GetAICapabilities returns available AI assistant capabilities
// @Summary Get AI capabilities
// @Description Get available AI assistant capabilities and example queries
// @Tags AI
// @Produce json
// @Success 200 {object} map[string]interface{}
// @Router /api/ai/capabilities [get]
func (h *AIHandler) GetAICapabilities(c *gin.Context) {
	capabilities := map[string]interface{}{
		"intents": []map[string]interface{}{
			{
				"name":        "data_query",
				"description": "查詢業務數據，如銷售、庫存、財務等",
				"examples": []string{
					"查詢本月銷售數據",
					"顯示庫存狀況",
					"查看財務報表",
				},
			},
			{
				"name":        "action_request",
				"description": "執行系統操作，如新增、修改、刪除等",
				"examples": []string{
					"如何新增產品",
					"建立銷售訂單",
					"新增客戶資料",
				},
			},
			{
				"name":        "navigation_help",
				"description": "系統導航和功能指引",
				"examples": []string{
					"產品管理在哪裡",
					"如何查看報表",
					"系統功能介紹",
				},
			},
			{
				"name":        "general_help",
				"description": "一般幫助和系統說明",
				"examples": []string{
					"系統有哪些功能",
					"如何使用系統",
					"操作說明",
				},
			},
		},
		"supported_modules": []string{
			"product_management",
			"sales_management",
			"inventory_management",
			"financial_management",
			"reports",
		},
		"features": []string{
			"自然語言查詢",
			"智慧意圖識別",
			"上下文理解",
			"操作指引",
			"數據查詢",
		},
		"limitations": []string{
			"查詢長度限制 1000 字符",
			"需要用戶身份驗證",
			"部分功能仍在開發中",
		},
	}

	c.JSON(http.StatusOK, gin.H{
		"capabilities": capabilities,
		"success":      true,
	})
}

// GetAIStatus returns AI service status and health
// @Summary Get AI service status
// @Description Get AI service health status and configuration
// @Tags AI
// @Produce json
// @Success 200 {object} map[string]interface{}
// @Router /api/ai/status [get]
func (h *AIHandler) GetAIStatus(c *gin.Context) {
	// 檢查 AI 服務狀態
	status := map[string]interface{}{
		"service":     "available",
		"version":     "1.0.0",
		"mode":        "mock", // 或 "production" 取決於使用的服務
		"features": map[string]bool{
			"intent_classification": true,
			"data_query":            true,
			"action_guidance":       true,
			"navigation_help":       true,
		},
		"last_updated": "2025-01-20",
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  status,
		"success": true,
	})
}