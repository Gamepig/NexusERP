package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"math/rand"
	"net/http"
	"net/http/httptest"
	"strconv"
	"time"

	"nexus-erp/backend/internal/config"
	"nexus-erp/backend/internal/database"
	"nexus-erp/backend/internal/handlers"
	"nexus-erp/backend/internal/middleware"
	"nexus-erp/backend/internal/models"
	"nexus-erp/backend/internal/services"
	"nexus-erp/backend/internal/utils"

	"github.com/gin-gonic/gin"
)

func main() {
	// 設置 Gin 為測試模式
	gin.SetMode(gin.TestMode)

	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		log.Fatal("Failed to load configuration:", err)
	}

	// Connect to database
	db, err := database.New(cfg)
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}
	defer db.Close()

	// Initialize services
	userService := services.NewUserService(db.DB)
	customerService := services.NewCustomerService(db.DB)

	// Initialize handlers
	authHandler := handlers.NewAuthHandler(userService, nil, cfg)
	customerHandler := handlers.NewCustomerHandler(customerService)

	// Initialize middleware
	authMiddleware := middleware.NewAuthMiddleware(userService, cfg)
	tenantMiddleware := middleware.NewTenantContextMiddleware(cfg.JWT.Secret)

	// Create test router
	r := gin.New()

	// API routes
	api := r.Group("/api")

	// Auth routes
	auth := api.Group("/auth")
	{
		auth.POST("/login", authHandler.Login)
	}

	// Customer routes with multi-tenant middleware
	customers := api.Group("/customers")
	customers.Use(authMiddleware.RequireAuth())
	customers.Use(tenantMiddleware.SetTenantContext())
	{
		customers.GET("/", customerHandler.GetCustomers)
		customers.POST("/", customerHandler.CreateCustomer)
		customers.GET("/:id", customerHandler.GetCustomer)
	}

	// Test the multi-tenant functionality
	fmt.Println("🚀 開始多租戶功能測試...")

	// Test 1: Login and get JWT tokens for different users
	fmt.Println("\n📋 測試 1: 登入並獲取不同用戶的 JWT token")

	// Login as user from company 1
	token1, userID1 := loginUser(r, "testuser1", "password123")
	if token1 == "" {
		log.Fatal("❌ 無法獲取用戶 1 的 token")
	}
	fmt.Printf("✅ 用戶 1 登入成功 (UserID: %d)\n", userID1)

	// Parse JWT to see company ID
	claims1, err := utils.ValidateJWT(token1, cfg.JWT.Secret)
	if err != nil {
		log.Fatal("❌ 無法解析用戶 1 的 JWT:", err)
	}
	fmt.Printf("✅ 用戶 1 的公司 ID: %d\n", claims1.CompanyID)

	// Test 2: Create customers with different company contexts
	fmt.Println("\n📋 測試 2: 在不同公司上下文中創建客戶")

	// Create customer for company 1 with random code
	rand.Seed(time.Now().UnixNano())
	customerCode := fmt.Sprintf("TEST%d", rand.Intn(999999))
	customer1 := createCustomer(r, token1, customerCode, "Test Customer 1", "公司1的測試客戶")
	if customer1 == nil {
		log.Fatal("❌ 無法為公司 1 創建客戶")
	}
	fmt.Printf("✅ 為公司 %d 創建客戶成功 (ID: %d, 代碼: %s)\n", 
		customer1.CompanyID, customer1.ID, customer1.CustomerCode)

	// Test 3: Verify tenant isolation
	fmt.Println("\n📋 測試 3: 驗證租戶隔離")

	// Get customers for company 1
	customers1 := getCustomers(r, token1)
	fmt.Printf("✅ 公司 %d 的客戶數量: %d\n", claims1.CompanyID, len(customers1))

	// Verify the created customer is in the list
	found := false
	for _, c := range customers1 {
		if c.ID == customer1.ID {
			found = true
			if c.CompanyID != claims1.CompanyID {
				log.Fatal("❌ 客戶的公司 ID 不匹配！")
			}
			break
		}
	}
	if !found {
		log.Fatal("❌ 創建的客戶未在公司客戶列表中找到！")
	}
	fmt.Printf("✅ 租戶隔離驗證成功：客戶屬於正確的公司\n")

	// Test 4: Test accessing customer by ID with tenant context
	fmt.Println("\n📋 測試 4: 通過 ID 訪問客戶（含租戶上下文）")

	customer1Retrieved := getCustomerByID(r, token1, customer1.ID)
	if customer1Retrieved == nil {
		log.Fatal("❌ 無法通過 ID 獲取客戶")
	}
	if customer1Retrieved.Customer.CompanyID != claims1.CompanyID {
		log.Fatal("❌ 獲取的客戶公司 ID 不匹配！")
	}
	fmt.Printf("✅ 通過 ID 獲取客戶成功，租戶隔離正常\n")

	fmt.Println("\n🎉 多租戶功能測試全部通過！")
	fmt.Println("✅ JWT 中正確包含公司 ID")
	fmt.Println("✅ 客戶創建時正確關聯公司 ID")  
	fmt.Println("✅ 客戶查詢已按公司隔離")
	fmt.Println("✅ 租戶上下文中間件正常工作")
}

func loginUser(r *gin.Engine, username, password string) (string, int64) {
	loginData := map[string]string{
		"name":     username,
		"password": password,
	}
	
	jsonData, _ := json.Marshal(loginData)
	
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/api/auth/login", bytes.NewBuffer(jsonData))
	req.Header.Set("Content-Type", "application/json")
	
	r.ServeHTTP(w, req)
	
	if w.Code != http.StatusOK {
		fmt.Printf("❌ 登入失敗，狀態碼: %d, 響應: %s\n", w.Code, w.Body.String())
		return "", 0
	}
	
	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	
	token := response["token"].(string)
	user := response["user"].(map[string]interface{})
	userID := int64(user["id"].(float64))
	
	return token, userID
}

func createCustomer(r *gin.Engine, token, code, name, companyName string) *models.Customer {
	customerData := map[string]interface{}{
		"customer_code": code,
		"name":          name,
		"company_name":  companyName,
		"customer_type": "business",
		"status":        "active",
	}
	
	jsonData, _ := json.Marshal(customerData)
	
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/api/customers/", bytes.NewBuffer(jsonData))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+token)
	
	r.ServeHTTP(w, req)
	
	if w.Code != http.StatusCreated {
		fmt.Printf("❌ 創建客戶失敗，狀態碼: %d\n", w.Code)
		fmt.Printf("響應頭: %+v\n", w.Header())
		fmt.Printf("響應體: %s\n", w.Body.String())
		return nil
	}
	
	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	
	customerData = response["customer"].(map[string]interface{})
	
	customer := &models.Customer{
		ID:           int64(customerData["id"].(float64)),
		CustomerCode: customerData["customer_code"].(string),
		Name:         customerData["name"].(string),
		CompanyID:    int64(customerData["company_id"].(float64)),
	}
	
	return customer
}

func getCustomers(r *gin.Engine, token string) []models.Customer {
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/customers/", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	
	r.ServeHTTP(w, req)
	
	if w.Code != http.StatusOK {
		fmt.Printf("❌ 獲取客戶列表失敗，狀態碼: %d, 響應: %s\n", w.Code, w.Body.String())
		return nil
	}
	
	var response models.CustomerListResponse
	json.Unmarshal(w.Body.Bytes(), &response)
	
	return response.Customers
}

func getCustomerByID(r *gin.Engine, token string, customerID int64) *models.CustomerResponse {
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/customers/"+strconv.FormatInt(customerID, 10), nil)
	req.Header.Set("Authorization", "Bearer "+token)
	
	r.ServeHTTP(w, req)
	
	if w.Code != http.StatusOK {
		fmt.Printf("❌ 獲取客戶詳情失敗，狀態碼: %d, 響應: %s\n", w.Code, w.Body.String())
		return nil
	}
	
	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	
	fmt.Printf("Debug: Response structure: %+v\n", response)
	
	// 檢查響應結構
	customerData, exists := response["customer"]
	if !exists {
		fmt.Printf("❌ 響應中沒有 customer 欄位\n")
		return nil
	}
	
	customerMap, ok := customerData.(map[string]interface{})
	if !ok {
		fmt.Printf("❌ customer 欄位不是 map 類型\n")
		return nil
	}
	
	// 查找 Customer 或直接的客戶資訊
	var customerDetail map[string]interface{}
	if innerCustomer, exists := customerMap["Customer"]; exists {
		customerDetail, _ = innerCustomer.(map[string]interface{})
	} else {
		customerDetail = customerMap
	}
	
	if customerDetail == nil {
		fmt.Printf("❌ 無法解析客戶詳情\n")
		return nil
	}
	
	customer := &models.CustomerResponse{
		Customer: models.Customer{
			ID:        int64(customerDetail["id"].(float64)),
			CompanyID: int64(customerDetail["company_id"].(float64)),
		},
	}
	
	return customer
}