package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"nexus-erp/backend/internal/models"

	"gopkg.in/yaml.v3"
)

type AIService struct {
	apiKey   string
	apiURL   string
	model    string
	client   *http.Client
}

func NewAIService(apiKey, apiURL, model string) *AIService {
	return &AIService{
		apiKey: apiKey,
		apiURL: apiURL,
		model:  model,
		client: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

// OpenAI API request/response structures
type openAIRequest struct {
	Model       string    `json:"model"`
	Messages    []message `json:"messages"`
	Temperature float64   `json:"temperature"`
	MaxTokens   int       `json:"max_tokens"`
}

type message struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type openAIResponse struct {
	Choices []choice `json:"choices"`
	Error   *apiError `json:"error,omitempty"`
}

type choice struct {
	Message message `json:"message"`
}

type apiError struct {
	Message string `json:"message"`
	Type    string `json:"type"`
}

func (s *AIService) ClassifyBusiness(businessDescription string) (*models.BusinessClassification, error) {
	prompt := s.buildClassificationPrompt(businessDescription)
	
	reqBody := openAIRequest{
		Model:       s.model,
		Temperature: 0.3,
		MaxTokens:   1000,
		Messages: []message{
			{
				Role:    "system",
				Content: "You are a business classification expert. Analyze business descriptions and return structured data in JSON format only. Do not include any explanation or additional text.",
			},
			{
				Role:    "user",
				Content: prompt,
			},
		},
	}

	jsonData, err := json.Marshal(reqBody)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	req, err := http.NewRequest("POST", s.apiURL, bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+s.apiKey)

	resp, err := s.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to make API request: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	var openAIResp openAIResponse
	if err := json.Unmarshal(body, &openAIResp); err != nil {
		return nil, fmt.Errorf("failed to unmarshal response: %w", err)
	}

	if openAIResp.Error != nil {
		return nil, fmt.Errorf("OpenAI API error: %s", openAIResp.Error.Message)
	}

	if len(openAIResp.Choices) == 0 {
		return nil, fmt.Errorf("no choices returned from AI")
	}

	content := openAIResp.Choices[0].Message.Content
	content = strings.TrimSpace(content)

	// Parse the JSON response
	var classification models.BusinessClassification
	if err := json.Unmarshal([]byte(content), &classification); err != nil {
		return nil, fmt.Errorf("failed to parse classification JSON: %w", err)
	}

	// Set default confidence if not provided
	if classification.Confidence == 0 {
		classification.Confidence = 0.8
	}

	return &classification, nil
}

func (s *AIService) buildClassificationPrompt(businessDescription string) string {
	return fmt.Sprintf(`Analyze the following business description and classify it according to the ERP system requirements. Return only a JSON object with the following structure:

{
  "industry": "primary industry category (e.g., Manufacturing, Retail, Agriculture, Services, Technology)",
  "business_type": "specific business type (e.g., Restaurant, Farm, Software Company, Retail Store)",
  "business_units": ["list of business units/departments"],
  "primary_activities": ["list of main business activities"],
  "scale": "business scale (Small, Medium, Large, Enterprise)",
  "complexity": "operational complexity (Simple, Moderate, Complex, Very Complex)",
  "confidence": 0.95
}

Business Description: %s

Return only the JSON object, no additional text or explanation.`, businessDescription)
}

func (s *AIService) GenerateYAML(classification *models.BusinessClassification) (string, error) {
	yamlData, err := yaml.Marshal(classification)
	if err != nil {
		return "", fmt.Errorf("failed to generate YAML: %w", err)
	}
	return string(yamlData), nil
}

// Mock AI Service for testing and development
type MockAIService struct{}

func NewMockAIService() *MockAIService {
	return &MockAIService{}
}

func (s *MockAIService) ClassifyBusiness(businessDescription string) (*models.BusinessClassification, error) {
	// Simple keyword-based classification for testing
	desc := strings.ToLower(businessDescription)
	
	var industry, businessType, scale, complexity string
	var businessUnits, primaryActivities []string
	
	// Industry classification
	switch {
	case contains(desc, []string{"restaurant", "food", "cafe", "dining"}):
		industry = "Food Service"
		businessType = "Restaurant"
		businessUnits = []string{"Kitchen", "Service", "Management"}
		primaryActivities = []string{"Food Preparation", "Customer Service", "Inventory Management"}
	case contains(desc, []string{"farm", "agriculture", "crop", "livestock"}):
		industry = "Agriculture"
		businessType = "Farm"
		businessUnits = []string{"Production", "Sales", "Operations"}
		primaryActivities = []string{"Crop/Livestock Production", "Sales", "Equipment Management"}
	case contains(desc, []string{"retail", "store", "shop", "selling"}):
		industry = "Retail"
		businessType = "Retail Store"
		businessUnits = []string{"Sales", "Inventory", "Customer Service"}
		primaryActivities = []string{"Product Sales", "Inventory Management", "Customer Service"}
	case contains(desc, []string{"manufacturing", "production", "factory"}):
		industry = "Manufacturing"
		businessType = "Manufacturing Company"
		businessUnits = []string{"Production", "Quality Control", "Sales", "Logistics"}
		primaryActivities = []string{"Production", "Quality Assurance", "Supply Chain Management"}
	default:
		industry = "Services"
		businessType = "Service Company"
		businessUnits = []string{"Operations", "Sales", "Administration"}
		primaryActivities = []string{"Service Delivery", "Customer Management", "Administration"}
	}
	
	// Scale classification
	switch {
	case contains(desc, []string{"small", "startup", "local"}):
		scale = "Small"
		complexity = "Simple"
	case contains(desc, []string{"medium", "growing", "regional"}):
		scale = "Medium"
		complexity = "Moderate"
	case contains(desc, []string{"large", "enterprise", "corporate", "multiple locations"}):
		scale = "Large"
		complexity = "Complex"
	default:
		scale = "Small"
		complexity = "Simple"
	}
	
	return &models.BusinessClassification{
		Industry:         industry,
		BusinessType:     businessType,
		BusinessUnits:    businessUnits,
		PrimaryActivities: primaryActivities,
		Scale:            scale,
		Complexity:       complexity,
		Confidence:       0.85,
	}, nil
}

func (s *MockAIService) GenerateYAML(classification *models.BusinessClassification) (string, error) {
	yamlData, err := yaml.Marshal(classification)
	if err != nil {
		return "", fmt.Errorf("failed to generate YAML: %w", err)
	}
	return string(yamlData), nil
}

// ProcessQuery mock implementation for development and testing
func (s *MockAIService) ProcessQuery(req *AIQueryRequest) (*AIQueryResponse, error) {
	query := strings.ToLower(req.Query)
	
	// 簡單的關鍵字匹配邏輯
	if contains(query, []string{"銷售", "業績", "營收", "sales"}) {
		return &AIQueryResponse{
			Response: "根據模擬數據，本月銷售額為 $50,000，較上月成長 15%。\n\n詳細數據請查看銷售報表。",
			Intent:   "data_query",
			Data: map[string]interface{}{
				"suggested_action": "view_sales_report",
				"api_endpoint":     "/api/reports/sales",
				"mock_data":        true,
			},
			Suggestions: []string{
				"查看詳細銷售報表",
				"分析銷售趨勢",
				"查詢客戶銷售排名",
			},
			Success: true,
		}, nil
	}
	
	if contains(query, []string{"庫存", "存貨", "inventory"}) {
		return &AIQueryResponse{
			Response: "目前庫存狀況良好，共有 150 種產品。其中 5 種產品庫存偏低，建議及時補貨。\n\n請查看庫存管理模組了解詳情。",
			Intent:   "data_query",
			Data: map[string]interface{}{
				"suggested_action": "view_inventory",
				"api_endpoint":     "/api/inventory/levels",
				"mock_data":        true,
			},
			Suggestions: []string{
				"查看低庫存商品",
				"庫存補貨建議",
				"庫存異動記錄",
			},
			Success: true,
		}, nil
	}
	
	if contains(query, []string{"財務", "財報", "financial"}) {
		return &AIQueryResponse{
			Response: "財務狀況概覽：\n• 應收帳款：$25,000\n• 應付帳款：$18,000\n• 現金流：正向\n\n建議查看財務報表了解詳細資訊。",
			Intent:   "data_query",
			Data: map[string]interface{}{
				"suggested_action": "view_financial_report",
				"api_endpoint":     "/api/reports/financial",
				"mock_data":        true,
			},
			Suggestions: []string{
				"應收帳款詳情",
				"應付帳款詳情",
				"現金流分析",
			},
			Success: true,
		}, nil
	}
	
	if contains(query, []string{"新增", "建立", "創建", "create", "add"}) {
		if contains(query, []string{"產品", "商品", "product"}) {
			return &AIQueryResponse{
				Response: "要新增產品，請按照以下步驟：\n1. 點選產品管理\n2. 點選新增產品按鈕\n3. 填寫產品資訊\n4. 設定庫存和價格\n5. 儲存產品",
				Intent:   "action_request",
				Data: map[string]interface{}{
					"suggested_action": "create_product",
					"navigation_path":  "/products",
				},
				Suggestions: []string{
					"產品分類管理",
					"批量匯入產品",
					"產品價格設定",
				},
				Success: true,
			}, nil
		}
		
		return &AIQueryResponse{
			Response: "我可以協助您新增各種資料，如產品、客戶、供應商等。請告訴我您想新增什麼？",
			Intent:   "action_request",
			Suggestions: []string{
				"新增產品",
				"新增客戶",
				"新增供應商",
				"建立銷售訂單",
			},
			Success: true,
		}, nil
	}
	
	if contains(query, []string{"如何", "怎麼", "help", "操作", "使用"}) {
		return &AIQueryResponse{
			Response: "我可以協助您了解系統操作。主要功能包括：\n• 產品管理\n• 銷售管理\n• 庫存管理\n• 財務管理\n• 報表分析\n\n請告訴我您想了解哪個功能？",
			Intent:   "navigation_help",
			Suggestions: []string{
				"產品管理說明",
				"銷售流程指導",
				"庫存操作說明",
				"報表使用方法",
			},
			Success: true,
		}, nil
	}
	
	// 預設回應
	return &AIQueryResponse{
		Response: "歡迎使用 NexusERP 智慧助手！我可以協助您查詢數據、操作指導和系統說明。請告訴我您需要什麼協助？",
		Intent:   "general_help",
		Suggestions: []string{
			"查詢銷售數據",
			"查看庫存狀況",
			"如何新增產品",
			"系統功能介紹",
		},
		Success: true,
	}, nil
}

func contains(text string, keywords []string) bool {
	for _, keyword := range keywords {
		if strings.Contains(text, keyword) {
			return true
		}
	}
	return false
}

// AI Query structures for chat interface
type AIQueryRequest struct {
	Query   string `json:"query"`
	Context string `json:"context,omitempty"`
	UserID  int    `json:"user_id"`
}

type AIQueryResponse struct {
	Response    string      `json:"response"`
	Intent      string      `json:"intent"`
	Data        interface{} `json:"data,omitempty"`
	Suggestions []string    `json:"suggestions,omitempty"`
	Success     bool        `json:"success"`
}

type IntentClassification struct {
	Intent     string  `json:"intent"`
	Confidence float64 `json:"confidence"`
	Entities   map[string]string `json:"entities,omitempty"`
	Action     string  `json:"action,omitempty"`
}

// ProcessQuery handles natural language queries and returns AI responses
func (s *AIService) ProcessQuery(req *AIQueryRequest) (*AIQueryResponse, error) {
	// 步驟 1: 分類用戶意圖
	intent, err := s.classifyIntent(req.Query)
	if err != nil {
		return &AIQueryResponse{
			Response: "抱歉，我無法理解您的問題。請試著重新表達您的需求。",
			Intent:   "error",
			Success:  false,
		}, err
	}

	// 步驟 2: 根據意圖處理查詢
	switch intent.Intent {
	case "data_query":
		return s.handleDataQuery(req, intent)
	case "action_request":
		return s.handleActionRequest(req, intent)
	case "navigation_help":
		return s.handleNavigationHelp(req, intent)
	case "general_help":
		return s.handleGeneralHelp(req, intent)
	default:
		return &AIQueryResponse{
			Response: "我還在學習中，暫時無法處理這類問題。請嘗試詢問庫存、銷售數據或系統操作相關問題。",
			Intent:   intent.Intent,
			Success:  true,
			Suggestions: []string{
				"查詢本月銷售數據",
				"顯示庫存狀況",
				"如何新增產品",
				"查看財務報表",
			},
		}, nil
	}
}

// classifyIntent 使用 AI 模型分類用戶意圖
func (s *AIService) classifyIntent(query string) (*IntentClassification, error) {
	prompt := s.buildIntentClassificationPrompt(query)
	
	reqBody := openAIRequest{
		Model:       s.model,
		Temperature: 0.1, // 低溫度確保穩定分類
		MaxTokens:   300,
		Messages: []message{
			{
				Role:    "system",
				Content: "您是一個專業的 ERP 系統助手，專門分析用戶意圖。請分析用戶查詢並返回 JSON 格式的意圖分類。",
			},
			{
				Role:    "user",
				Content: prompt,
			},
		},
	}

	jsonData, err := json.Marshal(reqBody)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal intent request: %w", err)
	}

	req, err := http.NewRequest("POST", s.apiURL, bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, fmt.Errorf("failed to create intent request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+s.apiKey)

	resp, err := s.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to make intent API request: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read intent response: %w", err)
	}

	var openAIResp openAIResponse
	if err := json.Unmarshal(body, &openAIResp); err != nil {
		return nil, fmt.Errorf("failed to unmarshal intent response: %w", err)
	}

	if openAIResp.Error != nil {
		return nil, fmt.Errorf("OpenAI API error: %s", openAIResp.Error.Message)
	}

	if len(openAIResp.Choices) == 0 {
		return nil, fmt.Errorf("no choices returned from intent AI")
	}

	content := strings.TrimSpace(openAIResp.Choices[0].Message.Content)
	
	var intent IntentClassification
	if err := json.Unmarshal([]byte(content), &intent); err != nil {
		// 如果解析失敗，使用關鍵字匹配作為後備方案
		return s.fallbackIntentClassification(strings.ToLower(content)), nil
	}

	return &intent, nil
}

// buildIntentClassificationPrompt 建立意圖分類的提示詞
func (s *AIService) buildIntentClassificationPrompt(query string) string {
	return fmt.Sprintf(`分析以下 ERP 系統用戶查詢，並返回 JSON 格式的意圖分類：

用戶查詢: "%s"

請返回以下格式的 JSON：
{
  "intent": "意圖類別 (data_query|action_request|navigation_help|general_help)",
  "confidence": 0.95,
  "entities": {
    "timeframe": "時間範圍（如適用）",
    "module": "相關模組（如適用）",
    "action": "具體動作（如適用）"
  },
  "action": "建議的系統動作"
}

意圖類別說明：
- data_query: 查詢數據（銷售、庫存、財務等）
- action_request: 執行操作（新增、修改、刪除等）
- navigation_help: 系統導航協助
- general_help: 一般幫助和說明

只返回 JSON，不要其他解釋。`, query)
}

// fallbackIntentClassification 關鍵字匹配後備方案
func (s *AIService) fallbackIntentClassification(query string) *IntentClassification {
	query = strings.ToLower(query)
	
	// 數據查詢關鍵字
	dataKeywords := []string{"查詢", "顯示", "報表", "數據", "統計", "分析", "多少", "幾個", "狀況", "情況"}
	// 操作請求關鍵字
	actionKeywords := []string{"新增", "建立", "創建", "修改", "更新", "刪除", "執行", "處理", "產生"}
	// 導航幫助關鍵字
	navKeywords := []string{"如何", "怎麼", "在哪", "怎樣", "步驟", "操作", "功能"}
	// 一般幫助關鍵字
	helpKeywords := []string{"幫助", "說明", "解釋", "什麼是", "介紹"}

	if contains(query, dataKeywords) {
		return &IntentClassification{
			Intent:     "data_query",
			Confidence: 0.7,
			Action:     "query_data",
		}
	}
	
	if contains(query, actionKeywords) {
		return &IntentClassification{
			Intent:     "action_request",
			Confidence: 0.7,
			Action:     "perform_action",
		}
	}
	
	if contains(query, navKeywords) {
		return &IntentClassification{
			Intent:     "navigation_help",
			Confidence: 0.7,
			Action:     "provide_guidance",
		}
	}
	
	if contains(query, helpKeywords) {
		return &IntentClassification{
			Intent:     "general_help",
			Confidence: 0.7,
			Action:     "provide_help",
		}
	}

	// 預設為一般幫助
	return &IntentClassification{
		Intent:     "general_help",
		Confidence: 0.5,
		Action:     "provide_help",
	}
}

// handleDataQuery 處理數據查詢請求
func (s *AIService) handleDataQuery(req *AIQueryRequest, intent *IntentClassification) (*AIQueryResponse, error) {
	query := strings.ToLower(req.Query)
	
	// 分析查詢類型
	if contains(query, []string{"銷售", "業績", "營收"}) {
		return &AIQueryResponse{
			Response: "正在為您查詢銷售數據...\n\n建議您查看銷售報表以獲得詳細資訊。您可以透過導航選單 > 報表 > 銷售報表來查看完整的銷售分析。",
			Intent:   intent.Intent,
			Data: map[string]interface{}{
				"suggested_action": "view_sales_report",
				"api_endpoint":     "/api/reports/sales",
			},
			Suggestions: []string{
				"查看本月銷售報表",
				"查詢特定客戶銷售",
				"分析銷售趨勢",
			},
			Success: true,
		}, nil
	}
	
	if contains(query, []string{"庫存", "存貨", "庫存量"}) {
		return &AIQueryResponse{
			Response: "正在為您查詢庫存資訊...\n\n您可以透過庫存管理模組查看詳細的庫存狀況，包括庫存水平、庫存異動等資訊。",
			Intent:   intent.Intent,
			Data: map[string]interface{}{
				"suggested_action": "view_inventory",
				"api_endpoint":     "/api/inventory/levels",
			},
			Suggestions: []string{
				"查看庫存報表",
				"檢查低庫存商品",
				"查詢特定產品庫存",
			},
			Success: true,
		}, nil
	}
	
	if contains(query, []string{"財務", "財報", "帳務"}) {
		return &AIQueryResponse{
			Response: "正在為您準備財務資訊...\n\n財務報表包含應收帳款、應付帳款等重要財務數據。您可以透過報表模組查看詳細的財務分析。",
			Intent:   intent.Intent,
			Data: map[string]interface{}{
				"suggested_action": "view_financial_report",
				"api_endpoint":     "/api/reports/financial",
			},
			Suggestions: []string{
				"查看財務報表",
				"查詢應收帳款",
				"查詢應付帳款",
			},
			Success: true,
		}, nil
	}

	// 通用數據查詢回應
	return &AIQueryResponse{
		Response: "我理解您想要查詢數據。系統提供多種報表功能，包括銷售、庫存、財務等各類數據分析。請告訴我您具體想查詢哪方面的資訊？",
		Intent:   intent.Intent,
		Suggestions: []string{
			"查詢銷售數據",
			"查看庫存狀況", 
			"查看財務報表",
			"查詢客戶資訊",
		},
		Success: true,
	}, nil
}

// handleActionRequest 處理操作請求
func (s *AIService) handleActionRequest(req *AIQueryRequest, intent *IntentClassification) (*AIQueryResponse, error) {
	query := strings.ToLower(req.Query)
	
	if contains(query, []string{"新增", "建立", "創建"}) {
		if contains(query, []string{"產品", "商品"}) {
			return &AIQueryResponse{
				Response: "我可以協助您新增產品。請透過產品管理模組新增產品資訊。\n\n步驟：\n1. 點選導航選單中的「產品管理」\n2. 點選「新增產品」按鈕\n3. 填寫產品基本資訊\n4. 設定庫存和價格資訊\n5. 儲存產品",
				Intent:   intent.Intent,
				Data: map[string]interface{}{
					"suggested_action": "create_product",
					"navigation_path":  "/products",
				},
				Suggestions: []string{
					"產品管理操作說明",
					"如何設定產品分類",
					"批量匯入產品",
				},
				Success: true,
			}, nil
		}
		
		if contains(query, []string{"訂單", "銷售單"}) {
			return &AIQueryResponse{
				Response: "我可以協助您建立銷售訂單。\n\n步驟：\n1. 進入銷售管理模組\n2. 選擇「新增銷售訂單」\n3. 選擇客戶\n4. 新增訂單項目\n5. 確認並儲存訂單",
				Intent:   intent.Intent,
				Data: map[string]interface{}{
					"suggested_action": "create_sales_order",
					"navigation_path":  "/sales-orders",
				},
				Suggestions: []string{
					"如何管理客戶資訊",
					"訂單狀態說明",
					"如何修改訂單",
				},
				Success: true,
			}, nil
		}
	}

	return &AIQueryResponse{
		Response: "我理解您想要執行某項操作。請告訴我具體想要執行什麼動作？系統支援產品管理、訂單處理、庫存管理等各種操作。",
		Intent:   intent.Intent,
		Suggestions: []string{
			"新增產品",
			"建立銷售訂單",
			"新增客戶",
			"庫存異動",
		},
		Success: true,
	}, nil
}

// handleNavigationHelp 處理導航幫助
func (s *AIService) handleNavigationHelp(req *AIQueryRequest, intent *IntentClassification) (*AIQueryResponse, error) {
	query := strings.ToLower(req.Query)
	
	if contains(query, []string{"產品", "商品"}) {
		return &AIQueryResponse{
			Response: "產品管理功能位於主選單的「產品管理」區塊。\n\n主要功能包括：\n• 產品清單：查看所有產品\n• 新增產品：建立新產品資料\n• 產品分類：管理產品分類\n• 庫存查詢：查看產品庫存狀況",
			Intent:   intent.Intent,
			Data: map[string]interface{}{
				"navigation_path": "/products",
				"module":          "product_management",
			},
			Suggestions: []string{
				"如何新增產品",
				"如何設定產品分類",
				"如何查看庫存",
			},
			Success: true,
		}, nil
	}
	
	if contains(query, []string{"報表", "數據", "分析"}) {
		return &AIQueryResponse{
			Response: "報表功能位於主選單的「報表分析」區塊。\n\n可用報表：\n• 銷售報表：銷售數據分析\n• 庫存報表：庫存狀況統計\n• 財務報表：財務數據分析\n• 儀表板：綜合數據概覽",
			Intent:   intent.Intent,
			Data: map[string]interface{}{
				"navigation_path": "/reports",
				"module":          "reports",
			},
			Suggestions: []string{
				"如何查看銷售報表",
				"如何匯出報表",
				"如何設定報表篩選",
			},
			Success: true,
		}, nil
	}

	return &AIQueryResponse{
		Response: "我可以協助您導航到系統的各個功能模組。\n\n主要功能區塊：\n• 儀表板：系統概覽\n• 產品管理：產品和庫存\n• 銷售管理：客戶和訂單\n• 採購管理：供應商和採購\n• 財務管理：應收應付帳款\n• 報表分析：各類數據報表\n\n請告訴我您想了解哪個功能？",
		Intent:   intent.Intent,
		Suggestions: []string{
			"產品管理功能",
			"銷售管理功能",
			"報表功能位置",
			"系統設定",
		},
		Success: true,
	}, nil
}

// handleGeneralHelp 處理一般幫助
func (s *AIService) handleGeneralHelp(req *AIQueryRequest, intent *IntentClassification) (*AIQueryResponse, error) {
	return &AIQueryResponse{
		Response: "歡迎使用 NexusERP 智慧助手！\n\n我可以協助您：\n• 查詢各類業務數據\n• 指導系統操作步驟\n• 提供功能使用說明\n• 解答系統相關問題\n\n請告訴我您需要什麼協助？",
		Intent:   intent.Intent,
		Suggestions: []string{
			"查詢銷售數據",
			"如何新增產品",
			"系統功能介紹",
			"操作說明",
		},
		Success: true,
	}, nil
}

// AIClassifier interface for dependency injection
type AIClassifier interface {
	ClassifyBusiness(businessDescription string) (*models.BusinessClassification, error)
	GenerateYAML(classification *models.BusinessClassification) (string, error)
	ProcessQuery(req *AIQueryRequest) (*AIQueryResponse, error)
}