package main

import (
	"context"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"nexus-erp-fiber/internal/config"
	"nexus-erp-fiber/internal/database"
	"nexus-erp-fiber/internal/handlers"
	"nexus-erp-fiber/internal/middleware"
	"nexus-erp-fiber/internal/services"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
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

	// Initialize Redis service
	redisService, err := services.NewRedisService(cfg)
	if err != nil {
		log.Printf("Failed to connect to Redis: %v, continuing without Redis cache", err)
		redisService = nil
	} else {
		defer redisService.Close()
		log.Println("🔴 Redis cache service initialized successfully")
	}

	// Initialize cache service
	var cacheService *services.CacheService
	if redisService != nil {
		cacheService = services.NewCacheService(db, redisService)
		if err := cacheService.WarmUpCache(); err != nil {
			log.Printf("Failed to warm up cache: %v", err)
		}
	}

	// Initialize services with enhanced multi-tenant support
	userService := services.NewUserServiceWithCache(db, cacheService)
	reportService := services.NewReportService(db, cacheService)
	companyService := services.NewCompanyService(db)
	inventoryReportService := services.NewInventoryReportService(db, cacheService)
	financialReportService := services.NewFinancialReportService(db, cacheService)
	
	// Initialize handlers
	authHandler := handlers.NewAuthHandler(userService, companyService, cfg)
	reportHandler := handlers.NewReportHandler(reportService, inventoryReportService, financialReportService)
	companyHandler := handlers.NewCompanyHandler(companyService, userService)

	// Initialize middleware
	authMiddleware := middleware.NewAuthMiddleware(userService, cfg)
	tenantMiddleware := middleware.NewTenantMiddleware(db)

	// Create Fiber app with optimized config
	app := fiber.New(fiber.Config{
		Prefork:               false, // Enable for production
		CaseSensitive:         true,
		StrictRouting:         false,
		DisableStartupMessage: false,
		ServerHeader:          "NexusERP-API",
		AppName:               "NexusERP API v2.0",
		ReduceMemoryUsage:     true,
		EnableTrustedProxyCheck: true,
		TrustedProxies:        []string{"127.0.0.1", "::1"},
		ErrorHandler: func(c *fiber.Ctx, err error) error {
			code := fiber.StatusInternalServerError
			if e, ok := err.(*fiber.Error); ok {
				code = e.Code
			}
			return c.Status(code).JSON(fiber.Map{
				"error":   true,
				"message": err.Error(),
				"code":    code,
			})
		},
	})

	// Global middleware
	app.Use(recover.New())
	app.Use(logger.New(logger.Config{
		Format: "${time} | ${status} | ${latency} | ${ip} | ${method} ${path} | ${error}\n",
		TimeFormat: "2006-01-02 15:04:05",
	}))
	
	// CORS middleware with multi-tenant support
	app.Use(cors.New(cors.Config{
		AllowOrigins:     "http://127.0.0.1:8000,http://localhost:8000,http://127.0.0.1:3000,http://localhost:3000",
		AllowHeaders:     "Origin, Content-Type, Accept, Authorization, X-Company-ID",
		AllowMethods:     "GET,POST,HEAD,PUT,DELETE,PATCH,OPTIONS",
		AllowCredentials: true,
	}))

	// Health check endpoint
	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"status":  "ok",
			"message": "NexusERP API is running",
			"time":    time.Now().Unix(),
			"version": "2.0.0",
		})
	})

	// API routes
	api := app.Group("/api/v2")

	// Authentication routes (public)
	auth := api.Group("/auth")
	{
		auth.Post("/login", authHandler.Login)
		auth.Post("/register", authHandler.Register)
		auth.Post("/refresh", authHandler.RefreshToken)
		auth.Post("/forgot-password", authHandler.ForgotPassword)
		auth.Post("/reset-password", authHandler.ResetPassword)
	}

	// Multi-tenant company management (protected)
	companies := api.Group("/companies")
	companies.Use(authMiddleware.RequireAuth())
	{
		companies.Get("/", companyHandler.GetUserCompanies)
		companies.Post("/switch", companyHandler.SwitchCompany)
		companies.Post("/:id/invite", companyHandler.InviteUser)
		companies.Get("/:id/users", companyHandler.GetCompanyUsers)
		companies.Put("/:id/users/:user_id/role", companyHandler.UpdateUserRole)
	}

	// High-performance report endpoints (protected + tenant isolated)
	reports := api.Group("/reports")
	reports.Use(authMiddleware.RequireAuth())
	reports.Use(tenantMiddleware.SetTenantContext())
	{
		// Inventory reports
		reports.Get("/inventory/overview", reportHandler.GetInventoryOverview)
		reports.Get("/inventory/levels", reportHandler.GetInventoryLevels)
		reports.Get("/inventory/movements", reportHandler.GetInventoryMovements)
		reports.Get("/inventory/aging", reportHandler.GetInventoryAging)
		reports.Get("/inventory/turnover", reportHandler.GetInventoryTurnover)
		
		// Financial reports
		reports.Get("/financial/profit-loss", reportHandler.GetProfitLossReport)
		reports.Get("/financial/cash-flow", reportHandler.GetCashFlowReport)
		reports.Get("/financial/balance-sheet", reportHandler.GetBalanceSheetReport)
		reports.Get("/financial/ratios", reportHandler.GetFinancialRatios)
		
		// Sales and purchase analytics
		reports.Get("/sales/overview", reportHandler.GetSalesOverview)
		reports.Get("/sales/trends", reportHandler.GetSalesTrends)
		reports.Get("/sales/by-customer", reportHandler.GetSalesByCustomer)
		reports.Get("/sales/by-product", reportHandler.GetSalesByProduct)
		
		reports.Get("/purchase/overview", reportHandler.GetPurchaseOverview)
		reports.Get("/purchase/by-supplier", reportHandler.GetPurchaseBySupplier)
		reports.Get("/purchase/by-product", reportHandler.GetPurchaseByProduct)
		
		// Employee reports
		reports.Get("/employees/attendance", reportHandler.GetEmployeeAttendance)
		reports.Get("/employees/performance", reportHandler.GetEmployeePerformance)
		
		// Report utilities
		reports.Post("/cache/clear", reportHandler.ClearReportCache)
		reports.Get("/export/:type/:format", reportHandler.ExportReport)
	}

	// Real-time dashboard data (WebSocket support planned)
	dashboard := api.Group("/dashboard")
	dashboard.Use(authMiddleware.RequireAuth())
	dashboard.Use(tenantMiddleware.SetTenantContext())
	{
		dashboard.Get("/stats", reportHandler.GetDashboardStats)
		dashboard.Get("/charts", reportHandler.GetDashboardCharts)
		dashboard.Get("/alerts", reportHandler.GetDashboardAlerts)
	}

	// Graceful shutdown
	c := make(chan os.Signal, 1)
	signal.Notify(c, os.Interrupt, syscall.SIGTERM)

	go func() {
		<-c
		log.Println("🔄 Gracefully shutting down...")
		app.Shutdown()
	}()

	// Start server
	port := cfg.App.Port
	if port == "" {
		port = "8080"
	}
	
	log.Printf("🚀 NexusERP Fiber API Server starting on port %s", port)
	log.Printf("📊 Enhanced with multi-tenant reports and high-performance architecture")
	log.Printf("🔐 PostgreSQL RLS enabled, Redis caching active")
	
	if err := app.Listen(":" + port); err != nil {
		log.Printf("❌ Server startup error: %v", err)
	}

	log.Println("🛑 NexusERP API Server stopped")
}