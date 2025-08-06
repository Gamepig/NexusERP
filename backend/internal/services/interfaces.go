package services

import (
	"context"
	"nexus-erp/backend/internal/models"
)

// UserServiceInterface defines the interface for user service operations
type UserServiceInterface interface {
	GetUserByID(id int64) (*models.User, error)
	GetUserByUsername(username string) (*models.User, error)
	GetUserByEmail(email string) (*models.User, error)
	CreateUser(req *models.CreateUserRequest) (*models.User, error)
	ValidatePassword(user *models.User, password string) error
	GenerateJWT(user *models.User, jwtSecret string) (string, error)
	UserExists(email, username string) bool
	CreateRefreshToken(userID int64) (*models.RefreshToken, error)
	GetRefreshToken(token string) (*models.RefreshToken, error)
	RevokeRefreshToken(token string) error
	RevokeAllUserRefreshTokens(userID int64) error
	ValidateRefreshToken(token string) (*models.RefreshToken, error)
	
	// Password Reset methods
	CreatePasswordResetToken(userID int64) (*models.PasswordResetToken, error)
	GetPasswordResetToken(token string) (*models.PasswordResetToken, error)
	ValidatePasswordResetToken(token string) (*models.PasswordResetToken, error)
	UsePasswordResetToken(token string) error
	UpdateUserPassword(userID int64, newPassword string) error
	RevokeAllPasswordResetTokens(userID int64) error
	
	// RBAC methods
	GetUserRoles(userID int64) ([]models.Role, error)
	GetUserPermissions(userID int64) ([]models.Permission, error)
	HasPermission(userID int64, resource, action string) (bool, error)
	AssignRole(userID int64, roleID int64) error
	RemoveRole(userID int64, roleID int64) error
	
	// Laravel API Token validation
	ValidateLaravelAPIToken(token string) (*models.User, error)
}

// RoleServiceInterface defines the interface for role service operations
type RoleServiceInterface interface {
	GetAllRoles() ([]models.Role, error)
	GetRoleByID(id int64) (*models.Role, error)
	GetRoleByName(name string) (*models.Role, error)
	CreateRole(name, description string) (*models.Role, error)
	UpdateRole(id int64, name, description string) (*models.Role, error)
	DeleteRole(id int64) error
	GetRolePermissions(roleID int64) ([]models.Permission, error)
	AssignPermission(roleID int64, permissionID int64) error
	RemovePermission(roleID int64, permissionID int64) error
}

// PermissionServiceInterface defines the interface for permission service operations
type PermissionServiceInterface interface {
	GetAllPermissions() ([]models.Permission, error)
	GetPermissionByID(id int64) (*models.Permission, error)
	GetPermissionByName(name string) (*models.Permission, error)
	CreatePermission(name, resource, action, description string) (*models.Permission, error)
	UpdatePermission(id int64, name, resource, action, description string) (*models.Permission, error)
	DeletePermission(id int64) error
}

// ProductService defines the interface for product service operations
type ProductService interface {
	CreateProduct(ctx context.Context, req models.CreateProductRequest) (*models.Product, error)
	GetProducts(ctx context.Context, page, limit int, search string, categoryID *int64, isActive *bool) ([]models.Product, int, error)
	GetProduct(ctx context.Context, id int64) (*models.Product, error)
	GetProductByID(ctx context.Context, id int64) (*models.Product, error)
	UpdateProduct(ctx context.Context, id int64, req models.UpdateProductRequest) (*models.Product, error)
	DeleteProduct(ctx context.Context, id int64) error
	GetProductBySKU(ctx context.Context, sku string) (*models.Product, error)
	
	// Product Categories
	CreateProductCategory(ctx context.Context, req models.CreateProductCategoryRequest) (*models.ProductCategory, error)
	GetProductCategories(ctx context.Context) ([]models.ProductCategory, error)
	GetProductCategoryByID(ctx context.Context, id int64) (*models.ProductCategory, error)
	UpdateProductCategory(ctx context.Context, id int64, req models.UpdateProductCategoryRequest) (*models.ProductCategory, error)
	DeleteProductCategory(ctx context.Context, id int64) error
}

// SupplierService defines the interface for supplier service operations
type SupplierService interface {
	CreateSupplier(ctx context.Context, req models.CreateSupplierRequest) (*models.Supplier, error)
	GetSuppliers(ctx context.Context, page, limit int, search string, isActive *bool) ([]models.Supplier, int, error)
	GetSupplier(ctx context.Context, id int64) (*models.Supplier, error)
	UpdateSupplier(ctx context.Context, id int64, req models.UpdateSupplierRequest) (*models.Supplier, error)
	DeleteSupplier(ctx context.Context, id int64) error
	GetSupplierByCode(ctx context.Context, code string) (*models.Supplier, error)
}

// PurchaseOrderService defines the interface for purchase order service operations
type PurchaseOrderService interface {
	CreatePurchaseOrder(ctx context.Context, req models.CreatePurchaseOrderRequest, userID int64) (*models.PurchaseOrderWithDetails, error)
	GetPurchaseOrders(ctx context.Context, page, limit int, search string, status string, supplierID *int64) ([]models.PurchaseOrderWithDetails, int, error)
	GetPurchaseOrder(ctx context.Context, id int64) (*models.PurchaseOrderWithDetails, error)
	UpdatePurchaseOrder(ctx context.Context, id int64, req models.UpdatePurchaseOrderRequest, userID int64) (*models.PurchaseOrderWithDetails, error)
	DeletePurchaseOrder(ctx context.Context, id int64) error
	ApprovePurchaseOrder(ctx context.Context, id int64, req models.ApprovePurchaseOrderRequest, userID int64) (*models.PurchaseOrderWithDetails, error)
	ReceivePurchaseOrder(ctx context.Context, id int64, req models.ReceivePurchaseOrderRequest, userID int64) (*models.PurchaseOrderWithDetails, error)
	GetPurchaseOrderByPONumber(ctx context.Context, poNumber string) (*models.PurchaseOrderWithDetails, error)
}

// InventoryService defines the interface for inventory service operations
type InventoryService interface {
	CreateInventoryTransaction(ctx context.Context, req models.CreateInventoryTransactionRequest, userID int64) (*models.InventoryTransactionWithDetails, error)
	GetInventoryTransactions(ctx context.Context, page, limit int, productID *int64, warehouseID *int64, transactionTypeID *int64) ([]models.InventoryTransactionWithDetails, int, error)
	GetInventoryTransaction(ctx context.Context, id int64) (*models.InventoryTransactionWithDetails, error)
	GetInventoryLevels(ctx context.Context, page, limit int, productID *int64, warehouseID *int64, lowStock *bool) ([]models.InventoryLevelWithDetails, int, error)
	GetInventoryLevel(ctx context.Context, productID, warehouseID int64) (*models.InventoryLevelWithDetails, error)
	UpdateInventoryLevel(ctx context.Context, productID, warehouseID int64, quantityChange int, unitCost *float64, referenceDocumentType *string, referenceDocumentID *int64, userID int64, notes *string) error
	GetInventoryTransactionTypes(ctx context.Context) ([]models.InventoryTransactionType, error)
	
	// Product inventory methods
	GetProductInventoryAcrossWarehouses(ctx context.Context, productID int64) ([]models.InventoryLevelWithDetails, error)
	GetWarehouseInventory(ctx context.Context, warehouseID int64) ([]models.InventoryLevelWithDetails, error)
	
	// Warehouse management methods
	CreateWarehouse(ctx context.Context, req models.CreateWarehouseRequest) (*models.Warehouse, error)
	GetWarehouses(ctx context.Context) ([]models.Warehouse, error)
	GetWarehouseByID(ctx context.Context, id int64) (*models.Warehouse, error)
	UpdateWarehouse(ctx context.Context, id int64, req models.UpdateWarehouseRequest) (*models.Warehouse, error)
	DeleteWarehouse(ctx context.Context, id int64) error
}

// StocktakingService defines the interface for stocktaking service operations
type StocktakingService interface {
	// Stocktaking Orders
	CreateStocktakingOrder(ctx context.Context, req *models.CreateStocktakingOrderRequest, userID int64) (*models.StocktakingOrderWithDetails, error)
	GetStocktakingOrders(ctx context.Context, limit, offset int, warehouseID *int64, status string) ([]models.StocktakingOrderWithDetails, int, error)
	GetStocktakingOrderByID(ctx context.Context, id int64) (*models.StocktakingOrderWithDetails, error)
	UpdateStocktakingOrder(ctx context.Context, id int64, req *models.UpdateStocktakingOrderRequest) (*models.StocktakingOrderWithDetails, error)
	StartStocktakingOrder(ctx context.Context, id int64, req *models.StartStocktakingOrderRequest, userID int64) (*models.StocktakingOrderWithDetails, error)
	ProcessStocktakingOrder(ctx context.Context, id int64, req *models.ProcessStocktakingOrderRequest, userID int64) (*models.StocktakingOrderWithDetails, error)
	FinalizeStocktakingOrder(ctx context.Context, id int64, req *models.FinalizeStocktakingOrderRequest, userID int64) (*models.StocktakingOrderWithDetails, error)
	ApproveStocktakingOrder(ctx context.Context, id int64, req *models.ApproveStocktakingOrderRequest, userID int64) (*models.StocktakingOrderWithDetails, error)
	DeleteStocktakingOrder(ctx context.Context, id int64) error

	// Stocktaking Items
	GetStocktakingItems(ctx context.Context, orderID int64) ([]models.StocktakingItemWithDetails, error)
	CountStocktakingItem(ctx context.Context, orderID, productID int64, req *models.CountStocktakingItemRequest, userID int64) (*models.StocktakingItemWithDetails, error)

	// Safety Stock Management
	CreateProductSafetyStock(ctx context.Context, req *models.CreateProductSafetyStockRequest) (*models.ProductSafetyStockWithDetails, error)
	GetProductSafetyStocks(ctx context.Context, limit, offset int, productID, warehouseID *int64) ([]models.ProductSafetyStockWithDetails, int, error)
	GetProductSafetyStockByID(ctx context.Context, id int64) (*models.ProductSafetyStockWithDetails, error)
	UpdateProductSafetyStock(ctx context.Context, id int64, req *models.UpdateProductSafetyStockRequest) (*models.ProductSafetyStockWithDetails, error)
	DeleteProductSafetyStock(ctx context.Context, id int64) error

	// Inventory Alerts
	GetInventoryAlerts(ctx context.Context, limit, offset int, status string, alertTypeID, productID, warehouseID *int64) ([]models.InventoryAlertWithDetails, int, error)
	GetInventoryAlertByID(ctx context.Context, id int64) (*models.InventoryAlertWithDetails, error)
	ResolveInventoryAlert(ctx context.Context, id int64, req *models.ResolveInventoryAlertRequest, userID int64) (*models.InventoryAlertWithDetails, error)
	DismissInventoryAlert(ctx context.Context, id int64, req *models.DismissInventoryAlertRequest, userID int64) (*models.InventoryAlertWithDetails, error)
	CheckInventoryLevels(ctx context.Context) error // Background job to check inventory levels
	MarkAlertNotificationSent(ctx context.Context, alertID int64) error // Mark alert notification as sent

	// Reporting
	GetStocktakingReport(ctx context.Context, req *models.StocktakingReportRequest) (*models.StocktakingReportResponse, error)
	GetInventoryAlertReport(ctx context.Context, req *models.InventoryAlertReportRequest) (*models.InventoryAlertReportResponse, error)
}

// InvoiceService defines the interface for invoice service operations
type InvoiceService interface {
	// Invoice CRUD operations
	CreateInvoice(ctx context.Context, req *models.CreateInvoiceRequest, userID int64) (*models.InvoiceWithDetails, error)
	GetInvoices(ctx context.Context, page, limit int, search string, status string, supplierID *int64) ([]models.InvoiceWithDetails, int, error)
	GetInvoice(ctx context.Context, id int64) (*models.InvoiceWithDetails, error)
	UpdateInvoice(ctx context.Context, id int64, req *models.UpdateInvoiceRequest, userID int64) (*models.InvoiceWithDetails, error)
	DeleteInvoice(ctx context.Context, id int64) error
	ApproveInvoice(ctx context.Context, id int64, req *models.ApproveInvoiceRequest, userID int64) (*models.InvoiceWithDetails, error)
	
	// Invoice generation
	GenerateInvoiceFromPO(ctx context.Context, poID int64, req *models.GenerateInvoiceFromPORequest, userID int64) (*models.InvoiceWithDetails, error)
	
	// Currency operations
	GetCurrencies(ctx context.Context) ([]models.Currency, error)
	GetCurrencyByID(ctx context.Context, id int64) (*models.Currency, error)
	GetCurrencyByCode(ctx context.Context, code string) (*models.Currency, error)
	
	// Helper methods
	CalculateInvoiceTotals(items []models.CreateInvoiceItemRequest) (subtotal, taxAmount, totalAmount float64)
	ValidateInvoiceData(req *models.CreateInvoiceRequest) error
}

// AccountsPayableService defines the interface for accounts payable service operations
type AccountsPayableService interface {
	// AP CRUD operations
	GetAccountsPayable(ctx context.Context, page, limit int, supplierID *int64, status string) ([]models.AccountsPayableWithDetails, int, error)
	GetAccountsPayableByID(ctx context.Context, id int64) (*models.AccountsPayableWithDetails, error)
	GetAccountsPayableByInvoiceID(ctx context.Context, invoiceID int64) (*models.AccountsPayableWithDetails, error)
	
	// Payment allocation
	AllocatePayment(ctx context.Context, apID int64, paymentAmount float64, paymentID int64) error
	UpdateOutstandingAmount(ctx context.Context, apID int64) error
	
	// Aging reports
	GetAPAgingReport(ctx context.Context) (*models.APAgingReport, error)
	UpdateAgingBuckets(ctx context.Context) error
	
	// Status management
	UpdateAPStatus(ctx context.Context, apID int64, status string) error
}

// PaymentService defines the interface for payment service operations
type PaymentService interface {
	// Payment CRUD operations
	CreatePayment(ctx context.Context, req *models.CreatePaymentRequest, userID int64) (*models.PaymentWithDetails, error)
	GetPayments(ctx context.Context, page, limit int, supplierID *int64, status string) ([]models.PaymentWithDetails, int, error)
	GetPayment(ctx context.Context, id int64) (*models.PaymentWithDetails, error)
	UpdatePayment(ctx context.Context, id int64, req *models.UpdatePaymentRequest, userID int64) (*models.PaymentWithDetails, error)
	DeletePayment(ctx context.Context, id int64) error
	
	// Payment processing
	ProcessPayment(ctx context.Context, id int64, userID int64) (*models.PaymentWithDetails, error)
	CancelPayment(ctx context.Context, id int64, userID int64) (*models.PaymentWithDetails, error)
	
	// Payment allocation management
	ValidatePaymentAllocations(allocations []models.CreatePaymentAllocationRequest, supplierID int64) error
	GetPaymentAllocations(ctx context.Context, paymentID int64) ([]models.PaymentAllocationWithDetails, error)
}

// CustomerPaymentService defines the interface for customer payment service operations  
type CustomerPaymentService interface {
	// Customer Payment CRUD operations
	CreateCustomerPayment(ctx context.Context, req *models.CreateCustomerPaymentRequest, userID int64) (*models.CustomerPaymentWithDetails, error)
	GetCustomerPayments(ctx context.Context, page, limit int, customerID *int64, status string) ([]models.CustomerPaymentWithDetails, int, error)
	GetCustomerPayment(ctx context.Context, id int64) (*models.CustomerPaymentWithDetails, error)
	UpdateCustomerPayment(ctx context.Context, id int64, req *models.UpdateCustomerPaymentRequest, userID int64) (*models.CustomerPaymentWithDetails, error)
	DeleteCustomerPayment(ctx context.Context, id int64) error
	
	// Customer Payment processing
	ProcessCustomerPayment(ctx context.Context, id int64, req *models.ProcessCustomerPaymentRequest, userID int64) (*models.CustomerPaymentWithDetails, error)
	CancelCustomerPayment(ctx context.Context, id int64, req *models.CancelCustomerPaymentRequest, userID int64) (*models.CustomerPaymentWithDetails, error)
	
	// Payment application and allocation
	ApplyCustomerPayment(ctx context.Context, paymentID int64, req *models.ApplyCustomerPaymentRequest, userID int64) (*models.CustomerPaymentWithDetails, error)
	GetOutstandingAccountsReceivable(ctx context.Context, customerID int64) ([]models.AccountsReceivableWithDetails, error)
	GetCustomerPaymentAllocations(ctx context.Context, paymentID int64) ([]models.CustomerPaymentAllocationWithDetails, error)
	RemovePaymentAllocation(ctx context.Context, allocationID int64, userID int64) error
}

// AccountsReceivableService defines the interface for accounts receivable service operations
type AccountsReceivableService interface {
	// AR inquiry operations
	GetAccountsReceivable(ctx context.Context, page, limit int, customerID *int64, status string, startDate, endDate *string) ([]models.AccountsReceivableWithDetails, int, error)
	GetAccountsReceivableByID(ctx context.Context, id int64) (*models.AccountsReceivableWithDetails, error)
	
	// Customer balance operations
	GetCustomerBalance(ctx context.Context, customerID int64) (*models.CustomerBalanceInfo, error)
	GetCustomerBalanceSummary(ctx context.Context, customerID int64) (*models.CustomerBalanceSummary, error)
	
	// Aging and reporting
	GetARAgingReport(ctx context.Context, customerID *int64) (*models.ARAgingReport, error)
	UpdateAgingBuckets(ctx context.Context) error
}

// InvoiceDataParser defines the interface for parsing OCR data into standardized invoice models
type InvoiceDataParser interface {
	// ParseOCRResponse parses OCR structured data into internal invoice data model
	ParseOCRResponse(ctx context.Context, ocrResponse *OCRResponse) (*ParsedInvoiceData, error)
	
	// ValidateInvoiceData validates parsed invoice data and returns validation results
	ValidateInvoiceData(ctx context.Context, data *ParsedInvoiceData) (*ValidationResult, error)
	
	// ParseAndValidate combines parsing and validation in one step
	ParseAndValidate(ctx context.Context, ocrResponse *OCRResponse) (*ParsedInvoiceData, *ValidationResult, error)
}