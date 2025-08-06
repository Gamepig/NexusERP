package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"nexus-erp/backend/internal/auth"
	"nexus-erp/backend/internal/config"
	"nexus-erp/backend/internal/database"
	"nexus-erp/backend/internal/handlers"
	"nexus-erp/backend/internal/middleware"
	"nexus-erp/backend/internal/services"

	"github.com/gin-gonic/gin"
)

func main() {
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

	// Initialize Redis service
	redisService, err := services.NewRedisService(cfg)
	if err != nil {
		log.Printf("Failed to connect to Redis: %v, continuing without Redis cache", err)
		redisService = nil
	} else {
		defer redisService.Close()
		log.Println("Redis cache service initialized successfully")
	}

	// Initialize cache service
	var cacheService *services.CacheService
	if redisService != nil {
		cacheService = services.NewCacheService(db.DB, redisService)
		// 預熱快取
		if err := cacheService.WarmUpCache(); err != nil {
			log.Printf("Failed to warm up cache: %v", err)
		}
	}

	// Initialize services
	var userService *services.UserService
	if cacheService != nil {
		userService = services.NewUserServiceWithCache(db.DB, cacheService)
	} else {
		userService = services.NewUserService(db.DB)
	}
	roleService := services.NewRoleService(db.DB)
	permissionService := services.NewPermissionService(db.DB)
	inventoryService := services.NewInventoryService(db.DB)
	productService := services.NewProductService(db.DB)
	stocktakingService := services.NewStocktakingService(db.DB)
	supplierService := services.NewSupplierService(db.DB)
	purchaseOrderService := services.NewPurchaseOrderService(db.DB, inventoryService)
	customerService := services.NewCustomerService(db.DB)
	salesOrderService := services.NewSalesOrderService(db.DB, inventoryService)
	quoteService := services.NewQuoteService(db.DB, salesOrderService)
	
	// Initialize accounts payable services
	invoiceService := services.NewInvoiceService(db.DB, supplierService, productService, purchaseOrderService)
	accountsPayableService := services.NewAccountsPayableService(db.DB)
	paymentService := services.NewPaymentService(db.DB, accountsPayableService)
	
	// Initialize customer payment service
	customerPaymentService := services.NewCustomerPaymentService(db.DB)
	
	// Initialize accounts receivable service
	accountsReceivableService := services.NewAccountsReceivableService(db.DB)
	
	// Initialize report service
	reportService := services.NewReportService(db.DB)
	
	// Initialize prediction services
	dataExtractionService := services.NewDataExtractionService(db.DB)
	forecastingService := services.NewForecastingService(db.DB, dataExtractionService)
	inventoryOptimizationService := services.NewInventoryOptimizationService(db.DB, dataExtractionService, forecastingService)
	
	// Initialize employee service
	employeeService := services.NewEmployeeService(db.DB)
	
	// Initialize marketplace supplier service
	marketplaceSupplierService := services.NewMarketplaceSupplierService(db.DB)
	
	// Initialize marketplace product service - Task 21.3
	marketplaceProductService := services.NewMarketplaceProductService(db.DB)
	
	// Initialize AI service (using mock for development)
	aiService := services.NewMockAIService()
	
	// Initialize OCR client and service
	var ocrService services.OCRService
	ocrClient, err := services.CreateOCRClientFromConfig(cfg)
	if err != nil {
		log.Printf("Failed to create OCR client: %v, using mock client", err)
		ocrService = services.NewOCRService(db.DB) // This will use mock client by default
	} else {
		ocrService = services.NewOCRServiceWithClient(db.DB, ocrClient)
	}
	
	// Initialize notification service
	emailConfig := services.EmailConfig{
		SMTPHost:     cfg.Email.SMTPHost,
		SMTPPort:     cfg.Email.SMTPPort,
		SMTPUsername: cfg.Email.SMTPUsername,
		SMTPPassword: cfg.Email.SMTPPassword,
		FromEmail:    cfg.Email.FromEmail,
		FromName:     cfg.Email.FromName,
	}
	notificationService := services.NewNotificationService(stocktakingService, userService, emailConfig)
	
	// Initialize scheduler service
	schedulerService := services.NewSchedulerService(cfg, stocktakingService, notificationService)

	// Initialize simple auth service for Laravel integration
	simpleAuthService := auth.NewSimpleAuthService(cfg.JWT.Secret, "nexus-erp", db.DB)

	// Initialize handlers
	authHandler := handlers.NewAuthHandler(userService, aiService, cfg)
	simpleAuthHandler := handlers.NewSimpleAuthHandler(simpleAuthService, userService, cfg)
	userHandler := handlers.NewUserHandler(userService)
	roleHandler := handlers.NewRoleHandler(roleService)
	permissionHandler := handlers.NewPermissionHandler(permissionService)
	rbacHandler := handlers.NewRBACHandler(userService)
	inventoryHandler := handlers.NewInventoryHandler(inventoryService)
	productHandler := handlers.NewProductHandler(productService)
	supplierHandler := handlers.NewSupplierHandler(supplierService)
	purchaseOrderHandler := handlers.NewPurchaseOrderHandler(purchaseOrderService)
	customerHandler := handlers.NewCustomerHandler(customerService)
	salesOrderHandler := handlers.NewSalesOrderHandler(salesOrderService)
	quoteHandler := handlers.NewQuoteHandler(quoteService)
	accountsPayableHandler := handlers.NewAccountsPayableHandler(invoiceService, accountsPayableService, paymentService)
	customerPaymentHandler := handlers.NewCustomerPaymentHandler(customerPaymentService)
	accountsReceivableHandler := handlers.NewAccountsReceivableHandler(accountsReceivableService, customerService)
	reportHandler := handlers.NewReportHandler(reportService)
	predictionHandler := handlers.NewPredictionHandler(forecastingService, inventoryOptimizationService)
	ocrHandler := handlers.NewOCRHandler(ocrService)
	aiHandler := handlers.NewAIHandler(aiService)
	employeeHandler := handlers.NewEmployeeHandler(employeeService)
	marketplaceSupplierHandler := handlers.NewMarketplaceSupplierHandler(marketplaceSupplierService)
	marketplaceProductHandler := handlers.NewMarketplaceProductHandler(marketplaceProductService, marketplaceSupplierService)

	// Initialize middleware
	authMiddleware := middleware.NewAuthMiddleware(userService, cfg)
	simpleAuthMiddleware := middleware.NewSimpleAuthMiddleware(simpleAuthService)
	tenantMiddleware := middleware.NewTenantContextMiddlewareWithDB(cfg.JWT.Secret, db.DB)

	// Set up Gin router
	if cfg.App.Environment == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	r := gin.Default()

	// Add CORS middleware
	r.Use(func(c *gin.Context) {
		origin := c.Request.Header.Get("Origin")
		// Allow specific origins for credentials
		if origin == "http://127.0.0.1:8000" || origin == "http://localhost:8000" {
			c.Header("Access-Control-Allow-Origin", origin)
			c.Header("Access-Control-Allow-Credentials", "true")
		} else {
			c.Header("Access-Control-Allow-Origin", "*")
		}
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-CSRF-TOKEN")
		
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		
		c.Next()
	})

	// Health check endpoint
	r.GET("/health", userHandler.Health)

	// API routes
	api := r.Group("/api")
	{
		// Authentication routes (public)
		auth := api.Group("/auth")
		{
			auth.POST("/register", authHandler.Register)
			auth.POST("/ai-register", authHandler.AIRegister)
			auth.POST("/login", authHandler.Login)
			auth.POST("/login-email", authHandler.LoginByEmail)
			auth.POST("/refresh", authHandler.RefreshToken)
			auth.POST("/forgot-password", authHandler.ForgotPassword)
			auth.POST("/reset-password", authHandler.ResetPassword)
			
			// Simple auth routes for Laravel integration
			auth.POST("/simple-login", simpleAuthHandler.SimpleLogin)
			auth.POST("/simple-refresh", simpleAuthHandler.RefreshToken)
			auth.POST("/simple-logout", simpleAuthHandler.SimpleLogout)
		}
		
		// Simple auth verification (protected)
		simpleAuth := api.Group("/auth")
		simpleAuth.Use(simpleAuthMiddleware.RequireAuth())
		{
			simpleAuth.GET("/verify-rls", simpleAuthHandler.VerifyRLS)
		}

		// User routes (protected)
		users := api.Group("/users")
		users.Use(authMiddleware.RequireAuth())
		{
			users.GET("/me", userHandler.GetProfile)
			
			// RBAC routes for user role management
			users.GET("/:user_id/roles", rbacHandler.GetUserRoles)
			users.GET("/:user_id/permissions", rbacHandler.GetUserPermissions)
			users.POST("/:user_id/roles", middleware.RequireAdmin(userService), rbacHandler.AssignRole)
			users.DELETE("/:user_id/roles/:role_id", middleware.RequireAdmin(userService), rbacHandler.RemoveRole)
			users.GET("/:user_id/permissions/check", rbacHandler.CheckPermission)
		}

		// Role management routes (admin only)
		roles := api.Group("/roles")
		roles.Use(authMiddleware.RequireAuth())
		{
			roles.GET("/", roleHandler.GetAllRoles)
			roles.GET("/:id", roleHandler.GetRoleByID)
			roles.POST("/", middleware.RequireAdmin(userService), roleHandler.CreateRole)
			roles.PUT("/:id", middleware.RequireAdmin(userService), roleHandler.UpdateRole)
			roles.DELETE("/:id", middleware.RequireAdmin(userService), roleHandler.DeleteRole)
			roles.GET("/:id/permissions", roleHandler.GetRolePermissions)
			roles.POST("/:id/permissions", middleware.RequireAdmin(userService), roleHandler.AssignPermission)
			roles.DELETE("/:id/permissions/:permission_id", middleware.RequireAdmin(userService), roleHandler.RemovePermission)
		}

		// Permission management routes (admin only)
		permissions := api.Group("/permissions")
		permissions.Use(authMiddleware.RequireAuth())
		permissions.Use(middleware.RequireAdmin(userService))
		{
			permissions.GET("/", permissionHandler.GetAllPermissions)
			permissions.GET("/:id", permissionHandler.GetPermissionByID)
			permissions.POST("/", permissionHandler.CreatePermission)
			permissions.PUT("/:id", permissionHandler.UpdatePermission)
			permissions.DELETE("/:id", permissionHandler.DeletePermission)
		}

		// Product management routes (protected)
		products := api.Group("/products")
		products.Use(authMiddleware.RequireAuth())
		{
			products.GET("/", productHandler.GetProducts)
			products.GET("/:id", productHandler.GetProduct)
			products.POST("/", productHandler.CreateProduct)
			products.PUT("/:id", productHandler.UpdateProduct)
			products.DELETE("/:id", productHandler.DeleteProduct)
			products.GET("/sku/:sku", productHandler.GetProductBySKU)
			products.GET("/:id/inventory", inventoryHandler.GetProductInventory)
		}

		// Product category management routes (protected)
		categories := api.Group("/product-categories")
		categories.Use(authMiddleware.RequireAuth())
		{
			categories.GET("/", productHandler.GetProductCategories)
			categories.GET("/:id", productHandler.GetProductCategory)
			categories.POST("/", productHandler.CreateProductCategory)
			categories.PUT("/:id", productHandler.UpdateProductCategory)
			categories.DELETE("/:id", productHandler.DeleteProductCategory)
		}

		// Inventory management routes (protected)
		inventory := api.Group("/inventory")
		inventory.Use(authMiddleware.RequireAuth())
		{
			inventory.GET("/levels", inventoryHandler.GetInventoryLevels)
			inventory.GET("/levels/:product_id/:warehouse_id", inventoryHandler.GetInventoryLevel)
			inventory.GET("/transactions", inventoryHandler.GetInventoryTransactions)
			inventory.POST("/transactions", inventoryHandler.CreateInventoryTransaction)
		}

		// Warehouse management routes (protected)
		warehouses := api.Group("/warehouses")
		warehouses.Use(authMiddleware.RequireAuth())
		{
			warehouses.GET("/", inventoryHandler.GetWarehouses)
			warehouses.GET("/:id", inventoryHandler.GetWarehouse)
			warehouses.POST("/", inventoryHandler.CreateWarehouse)
			warehouses.PUT("/:id", inventoryHandler.UpdateWarehouse)
			warehouses.DELETE("/:id", inventoryHandler.DeleteWarehouse)
			warehouses.GET("/:id/inventory", inventoryHandler.GetWarehouseInventory)
		}

		// Supplier management routes (protected)
		suppliers := api.Group("/suppliers")
		suppliers.Use(authMiddleware.RequireAuth())
		{
			suppliers.GET("/", supplierHandler.GetSuppliers)
			suppliers.GET("/:id", supplierHandler.GetSupplier)
			suppliers.POST("/", supplierHandler.CreateSupplier)
			suppliers.PUT("/:id", supplierHandler.UpdateSupplier)
			suppliers.DELETE("/:id", supplierHandler.DeleteSupplier)
			suppliers.GET("/code/:code", supplierHandler.GetSupplierByCode)
		}

		// Purchase Order management routes (temporarily unprotected for testing)
		purchaseOrders := api.Group("/purchase-orders")
		// purchaseOrders.Use(authMiddleware.RequireAuth()) // Temporarily commented for testing
		{
			purchaseOrders.GET("/", purchaseOrderHandler.GetPurchaseOrders)
			purchaseOrders.GET("/:id", purchaseOrderHandler.GetPurchaseOrder)
			purchaseOrders.POST("/", purchaseOrderHandler.CreatePurchaseOrder)
			purchaseOrders.PUT("/:id", purchaseOrderHandler.UpdatePurchaseOrder)
			purchaseOrders.POST("/:id/approve", purchaseOrderHandler.ApprovePurchaseOrder)
			purchaseOrders.POST("/:id/receive", purchaseOrderHandler.ReceivePurchaseOrder)
		}

		// Invoice management routes (protected)
		invoices := api.Group("/invoices")
		invoices.Use(authMiddleware.RequireAuth())
		{
			invoices.GET("/", accountsPayableHandler.GetInvoices)
			invoices.GET("/:id", accountsPayableHandler.GetInvoice)
			invoices.POST("/", accountsPayableHandler.CreateInvoice)
			invoices.PUT("/:id", accountsPayableHandler.UpdateInvoice)
			invoices.POST("/:id/approve", accountsPayableHandler.ApproveInvoice)
			invoices.POST("/generate-from-po/:po_id", accountsPayableHandler.GenerateInvoiceFromPO)
			// OCR upload endpoint specifically for invoices
			invoices.POST("/upload", ocrHandler.UploadInvoice)
		}

		// Accounts Payable management routes (protected)
		accountsPayable := api.Group("/accounts-payable")
		accountsPayable.Use(authMiddleware.RequireAuth())
		{
			accountsPayable.GET("/", accountsPayableHandler.GetAccountsPayable)
			accountsPayable.GET("/:id", accountsPayableHandler.GetAccountsPayableByID)
			accountsPayable.GET("/aging-report", accountsPayableHandler.GetAPAgingReport)
		}

		// Payment management routes (protected)
		payments := api.Group("/payments")
		payments.Use(authMiddleware.RequireAuth())
		{
			payments.GET("/", accountsPayableHandler.GetPayments)
			payments.GET("/:id", accountsPayableHandler.GetPayment)
			payments.POST("/", accountsPayableHandler.CreatePayment)
			payments.POST("/:id/process", accountsPayableHandler.ProcessPayment)
			payments.POST("/:id/cancel", accountsPayableHandler.CancelPayment)
			
			// Customer payment routes
			payments.POST("/customer", customerPaymentHandler.CreateCustomerPayment)
			payments.GET("/customer", customerPaymentHandler.GetCustomerPayments)
			payments.GET("/customer/:id", customerPaymentHandler.GetCustomerPayment)
			payments.PUT("/customer/:id", customerPaymentHandler.UpdateCustomerPayment)
			payments.DELETE("/customer/:id", customerPaymentHandler.DeleteCustomerPayment)
			payments.POST("/customer/:id/process", customerPaymentHandler.ProcessCustomerPayment)
			payments.POST("/customer/:id/cancel", customerPaymentHandler.CancelCustomerPayment)
			
			// Customer payment application routes
			payments.POST("/customer/:id/apply", customerPaymentHandler.ApplyCustomerPayment)
			payments.GET("/customer/:id/allocations", customerPaymentHandler.GetCustomerPaymentAllocations)
			payments.DELETE("/customer/allocations/:id", customerPaymentHandler.RemovePaymentAllocation)
		}

		// Currency routes (protected)
		currencies := api.Group("/currencies")
		currencies.Use(authMiddleware.RequireAuth())
		{
			currencies.GET("/", accountsPayableHandler.GetCurrencies)
		}

		// Accounts Receivable management routes (protected)
		accountsReceivable := api.Group("/accounts-receivable")
		accountsReceivable.Use(authMiddleware.RequireAuth())
		{
			accountsReceivable.GET("/", accountsReceivableHandler.GetAccountsReceivable)
			accountsReceivable.GET("/:id", accountsReceivableHandler.GetAccountsReceivableByID)
			accountsReceivable.GET("/aging-report", accountsReceivableHandler.GetARAgingReport)
			accountsReceivable.POST("/update-aging", accountsReceivableHandler.UpdateAgingBuckets)
		}

		// Customer management routes (protected)
		customers := api.Group("/customers")
		customers.Use(authMiddleware.RequireAuth())
		customers.Use(tenantMiddleware.SetTenantContext())
		{
			// Customer balance and AR routes
			customers.GET("/:id/balance", accountsReceivableHandler.GetCustomerBalance)
			customers.GET("/:id/outstanding-ar", accountsReceivableHandler.GetOutstandingAccountsReceivable)
			
			// Customer CRUD routes
			customers.GET("/", customerHandler.GetCustomers)
			customers.GET("/:id", customerHandler.GetCustomer)
			customers.POST("/", customerHandler.CreateCustomer)
			customers.PUT("/:id", customerHandler.UpdateCustomer)
			customers.DELETE("/:id", customerHandler.DeleteCustomer)
			customers.PUT("/:id/credit-limit", customerHandler.UpdateCreditLimit)
			customers.GET("/code/generate", customerHandler.GenerateCustomerCode)
			customers.GET("/code/validate", customerHandler.ValidateCustomerCode)
			customers.GET("/enums/types", customerHandler.GetCustomerTypes)
			customers.GET("/enums/segments", customerHandler.GetCustomerSegments)
			customers.GET("/enums/statuses", customerHandler.GetCustomerStatuses)
		}

		// Customer contacts routes (protected)
		customerContacts := api.Group("/customer-contacts")
		customerContacts.Use(authMiddleware.RequireAuth())
		customerContacts.Use(tenantMiddleware.SetTenantContext())
		{
			customerContacts.POST("/", customerHandler.CreateCustomerContact)
			customerContacts.GET("/enums/types", customerHandler.GetContactTypes)
		}

		// Customer activities routes (protected)
		customerActivities := api.Group("/customer-activities")
		customerActivities.Use(authMiddleware.RequireAuth())
		customerActivities.Use(tenantMiddleware.SetTenantContext())
		{
			customerActivities.POST("/", customerHandler.CreateCustomerActivity)
			customerActivities.GET("/enums/types", customerHandler.GetActivityTypes)
		}

		// Sales Order management routes (protected)
		salesOrders := api.Group("/sales-orders")
		salesOrders.Use(authMiddleware.RequireAuth())
		{
			salesOrders.GET("/", salesOrderHandler.ListSalesOrders)
			salesOrders.GET("/:id", salesOrderHandler.GetSalesOrder)
			salesOrders.POST("/", salesOrderHandler.CreateSalesOrder)
			salesOrders.PUT("/:id/status", salesOrderHandler.UpdateSalesOrderStatus)
			salesOrders.POST("/:id/ship", salesOrderHandler.ShipSalesOrder)
			salesOrders.DELETE("/:id", salesOrderHandler.DeleteSalesOrder)
		}

		// Quote management routes (protected) - PRD 3.5.3
		quotes := api.Group("/quotes")
		quotes.Use(authMiddleware.RequireAuth())
		{
			quotes.GET("/", quoteHandler.ListQuotes)
			quotes.GET("/:id", quoteHandler.GetQuote)
			quotes.POST("/", quoteHandler.CreateQuote)
			quotes.PUT("/:id", quoteHandler.UpdateQuote)
			quotes.DELETE("/:id", quoteHandler.DeleteQuote)
			quotes.POST("/:id/approve", quoteHandler.ApproveQuote)
			quotes.POST("/:id/reject", quoteHandler.RejectQuote)
			quotes.POST("/:id/convert", quoteHandler.ConvertQuoteToSalesOrder)
		}

		// Report management routes (protected) - PRD 6.3.2.3
		reports := api.Group("/reports")
		reports.Use(authMiddleware.RequireAuth())
		{
			reports.GET("/sales", reportHandler.GetSalesReport)
			reports.GET("/inventory", reportHandler.GetInventoryReport)
			reports.GET("/financial", reportHandler.GetFinancialReport)
			reports.POST("/cache/clear", reportHandler.ClearReportCache)
		}

		// Prediction and AI analytics routes (protected) - Task 19
		predictions := api.Group("/predictions")
		predictions.Use(authMiddleware.RequireAuth())
		{
			predictions.POST("/sales-forecast", predictionHandler.CreateSalesForecast)
			predictions.POST("/inventory-optimization", predictionHandler.CreateInventoryOptimization)
			predictions.GET("/accuracy", predictionHandler.GetPredictionAccuracy)
			predictions.GET("/history", predictionHandler.GetPredictionHistory)
			predictions.GET("/inventory-analysis", predictionHandler.GetInventoryAnalysisReport)
			predictions.POST("/models/:model_type/validate", predictionHandler.ValidateModelConfiguration)
		}

		// AI Assistant routes (protected) - PRD 4.1
		ai := api.Group("/ai")
		ai.Use(authMiddleware.RequireAuth())
		{
			ai.POST("/query", aiHandler.AIQuery)
			ai.GET("/capabilities", aiHandler.GetAICapabilities)
			ai.GET("/status", aiHandler.GetAIStatus)
		}

		// Employee management routes (protected) - PRD 3.7
		employees := api.Group("/employees")
		employees.Use(authMiddleware.RequireAuth())
		{
			employees.GET("/", employeeHandler.GetEmployees)
			employees.GET("/:id", employeeHandler.GetEmployee)
			employees.POST("/", employeeHandler.CreateEmployee)
			employees.PUT("/:id", employeeHandler.UpdateEmployee)
			employees.DELETE("/:id", employeeHandler.DeleteEmployee)
			employees.GET("/code/:code", employeeHandler.GetEmployeeByCode)
		}

		// Attendance management routes (protected) - PRD 3.7
		attendance := api.Group("/attendance")
		attendance.Use(authMiddleware.RequireAuth())
		{
			attendance.POST("/clock-in", employeeHandler.ClockIn)
			attendance.PUT("/clock-out", employeeHandler.ClockOut)
			attendance.GET("/", employeeHandler.GetAttendanceRecords)
			attendance.GET("/summary/:employee_id", employeeHandler.GetAttendanceSummary)
			attendance.GET("/active/:employee_id", employeeHandler.GetActiveClockIn)
			
			// Quick clock-in/out endpoints for easy access
			attendance.POST("/quick-clock-in/:code", employeeHandler.QuickClockIn)
			attendance.POST("/quick-clock-out/:code", employeeHandler.QuickClockOut)
		}

		// Marketplace routes (Task 21)
		marketplace := api.Group("/marketplace")
		{
			marketplaceSupplierHandler.SetupSupplierRoutes(marketplace, authMiddleware.RequireAuth())
			marketplaceProductHandler.SetupProductRoutes(marketplace, authMiddleware.RequireAuth())
		}

		// Dashboard route (protected)
		api.GET("/dashboard", authMiddleware.RequireAuth(), reportHandler.GetDashboardData)
	}

	// Create context for graceful shutdown
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// Start scheduler service
	if err := schedulerService.Start(ctx); err != nil {
		log.Printf("Failed to start scheduler: %v", err)
	}

	// Create HTTP server
	srv := &http.Server{
		Addr:    ":" + cfg.App.Port,
		Handler: r,
	}

	// Start server in a goroutine
	go func() {
		log.Printf("Server starting on port %s", cfg.App.Port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatal("Failed to start server:", err)
		}
	}()

	// Wait for interrupt signal to gracefully shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("Server shutting down...")

	// Create shutdown context with timeout
	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer shutdownCancel()

	// Shutdown scheduler
	if err := schedulerService.Stop(); err != nil {
		log.Printf("Error stopping scheduler: %v", err)
	}

	// Shutdown HTTP server
	if err := srv.Shutdown(shutdownCtx); err != nil {
		log.Printf("Server forced to shutdown: %v", err)
	}

	log.Println("Server exited")
}