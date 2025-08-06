package handlers

import (
	"context"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"nexus-erp/backend/internal/models"
	"nexus-erp/backend/internal/services"
)

// MarketplaceProductHandler handles marketplace product operations
type MarketplaceProductHandler struct {
	productService  *services.MarketplaceProductService
	supplierService *services.MarketplaceSupplierService
}

// NewMarketplaceProductHandler creates a new marketplace product handler
func NewMarketplaceProductHandler(productService *services.MarketplaceProductService, supplierService *services.MarketplaceSupplierService) *MarketplaceProductHandler {
	return &MarketplaceProductHandler{
		productService:  productService,
		supplierService: supplierService,
	}
}

// CreateProduct godoc
// @Summary Create a new marketplace product
// @Description Create a new product in the marketplace
// @Tags Marketplace Products
// @Accept json
// @Produce json
// @Param product body services.ProductCreateRequest true "Product creation data"
// @Success 201 {object} models.MarketplaceProduct
// @Failure 400 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /marketplace/products [post]
// @Security BearerAuth
func (h *MarketplaceProductHandler) CreateProduct(c *gin.Context) {
	// Validate content length to prevent large payload attacks
	if c.Request.ContentLength > 10*1024*1024 { // 10MB limit
		c.JSON(http.StatusBadRequest, gin.H{"error": "Request payload too large"})
		return
	}

	var req services.ProductCreateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request format", "details": err.Error()})
		return
	}

	// Basic input validation
	if len(req.Name) == 0 || len(req.Name) > 255 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Product name must be between 1 and 255 characters"})
		return
	}
	if req.Price < 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Price must be non-negative"})
		return
	}
	if req.MinimumOrderQuantity < 1 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Minimum order quantity must be at least 1"})
		return
	}

	// Get user ID from JWT claims for authentication
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	uid, ok := userID.(int64)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid user ID"})
		return
	}

	// Get the supplier associated with this user
	supplier, err := h.supplierService.GetSupplierByUserID(c.Request.Context(), uid)
	if err != nil {
		if err.Error() == "sql: no rows in result set" {
			c.JSON(http.StatusForbidden, gin.H{"error": "No supplier profile found for this user"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get supplier profile", "details": err.Error()})
		return
	}

	// Check if supplier is approved
	if supplier.Status != models.SupplierStatusApproved {
		c.JSON(http.StatusForbidden, gin.H{"error": "Supplier must be approved to create products"})
		return
	}

	// Override the supplier ID from the request with the authenticated user's supplier
	req.SupplierID = supplier.ID

	product, err := h.productService.CreateProduct(c.Request.Context(), &req)
	if err != nil {
		if strings.Contains(err.Error(), "supplier not found") || 
		   strings.Contains(err.Error(), "supplier must be approved") ||
		   strings.Contains(err.Error(), "SKU already exists") {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create product", "details": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, product)
}

// GetProduct godoc
// @Summary Get a marketplace product by ID
// @Description Retrieve a specific product by its ID
// @Tags Marketplace Products
// @Produce json
// @Param id path int true "Product ID"
// @Success 200 {object} models.MarketplaceProduct
// @Failure 404 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /marketplace/products/{id} [get]
func (h *MarketplaceProductHandler) GetProduct(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid product ID"})
		return
	}

	product, err := h.productService.GetProductByID(c.Request.Context(), id)
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			c.JSON(http.StatusNotFound, gin.H{"error": "Product not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get product", "details": err.Error()})
		return
	}

	// Increment view count for public access (use background context to avoid cancellation)
	go func() {
		ctx := context.Background()
		if err := h.productService.UpdateProductViewCount(ctx, id); err != nil {
			// Log error but don't block response
			// In production, consider using a proper logging framework
		}
	}()

	c.JSON(http.StatusOK, product)
}

// UpdateProduct godoc
// @Summary Update a marketplace product
// @Description Update an existing product (supplier only)
// @Tags Marketplace Products
// @Accept json
// @Produce json
// @Param id path int true "Product ID"
// @Param product body services.ProductUpdateRequest true "Product update data"
// @Success 200 {object} models.MarketplaceProduct
// @Failure 400 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Failure 403 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /marketplace/products/{id} [put]
// @Security BearerAuth
func (h *MarketplaceProductHandler) UpdateProduct(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid product ID"})
		return
	}

	var req services.ProductUpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request format", "details": err.Error()})
		return
	}

	// Get user ID from JWT claims for authentication
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	uid, ok := userID.(int64)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid user ID"})
		return
	}

	// Get the supplier associated with this user
	supplier, err := h.supplierService.GetSupplierByUserID(c.Request.Context(), uid)
	if err != nil {
		if err.Error() == "sql: no rows in result set" {
			c.JSON(http.StatusForbidden, gin.H{"error": "No supplier profile found for this user"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get supplier profile", "details": err.Error()})
		return
	}

	supplierID := supplier.ID

	product, err := h.productService.UpdateProduct(c.Request.Context(), id, supplierID, &req)
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			c.JSON(http.StatusNotFound, gin.H{"error": "Product not found"})
			return
		}
		if strings.Contains(err.Error(), "does not belong to supplier") {
			c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
			return
		}
		if strings.Contains(err.Error(), "SKU already exists") {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update product", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, product)
}

// DeleteProduct godoc
// @Summary Delete a marketplace product
// @Description Soft delete a product (supplier only)
// @Tags Marketplace Products
// @Param id path int true "Product ID"
// @Success 204
// @Failure 400 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Failure 403 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /marketplace/products/{id} [delete]
// @Security BearerAuth
func (h *MarketplaceProductHandler) DeleteProduct(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid product ID"})
		return
	}

	// Get user ID from JWT claims for authentication
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	uid, ok := userID.(int64)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid user ID"})
		return
	}

	// Get the supplier associated with this user
	supplier, err := h.supplierService.GetSupplierByUserID(c.Request.Context(), uid)
	if err != nil {
		if err.Error() == "sql: no rows in result set" {
			c.JSON(http.StatusForbidden, gin.H{"error": "No supplier profile found for this user"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get supplier profile", "details": err.Error()})
		return
	}

	supplierID := supplier.ID

	err = h.productService.DeleteProduct(c.Request.Context(), id, supplierID)
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			c.JSON(http.StatusNotFound, gin.H{"error": "Product not found"})
			return
		}
		if strings.Contains(err.Error(), "does not belong to supplier") {
			c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete product", "details": err.Error()})
		return
	}

	c.Status(http.StatusNoContent)
}

// SearchProducts godoc
// @Summary Search marketplace products
// @Description Search and filter marketplace products
// @Tags Marketplace Products
// @Produce json
// @Param supplier_id query string false "Supplier IDs (comma-separated)"
// @Param category_id query string false "Category IDs (comma-separated)"
// @Param status query string false "Product statuses (comma-separated)"
// @Param stock_status query string false "Stock statuses (comma-separated)"
// @Param brand query string false "Brands (comma-separated)"
// @Param price_min query number false "Minimum price"
// @Param price_max query number false "Maximum price"
// @Param is_featured query boolean false "Is featured"
// @Param is_new_arrival query boolean false "Is new arrival"
// @Param is_bestseller query boolean false "Is bestseller"
// @Param search query string false "Search term"
// @Param sort_by query string false "Sort field (name, price, created_at, view_count)"
// @Param sort_order query string false "Sort order (asc, desc)"
// @Param page query int false "Page number"
// @Param page_size query int false "Page size"
// @Success 200 {object} services.ProductSearchResult
// @Failure 400 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /marketplace/products [get]
func (h *MarketplaceProductHandler) SearchProducts(c *gin.Context) {
	filters := &services.ProductSearchFilters{}

	// Parse supplier IDs
	if supplierIDsStr := c.Query("supplier_id"); supplierIDsStr != "" {
		supplierIDs := []int64{}
		for _, idStr := range strings.Split(supplierIDsStr, ",") {
			if id, err := strconv.ParseInt(strings.TrimSpace(idStr), 10, 64); err == nil {
				supplierIDs = append(supplierIDs, id)
			}
		}
		filters.SupplierID = supplierIDs
	}

	// Parse category IDs
	if categoryIDsStr := c.Query("category_id"); categoryIDsStr != "" {
		categoryIDs := []int64{}
		for _, idStr := range strings.Split(categoryIDsStr, ",") {
			if id, err := strconv.ParseInt(strings.TrimSpace(idStr), 10, 64); err == nil {
				categoryIDs = append(categoryIDs, id)
			}
		}
		filters.CategoryID = categoryIDs
	}

	// Parse statuses
	if statusesStr := c.Query("status"); statusesStr != "" {
		statuses := []models.ProductStatus{}
		for _, statusStr := range strings.Split(statusesStr, ",") {
			statuses = append(statuses, models.ProductStatus(strings.TrimSpace(statusStr)))
		}
		filters.Status = statuses
	}

	// Parse stock statuses
	if stockStatusesStr := c.Query("stock_status"); stockStatusesStr != "" {
		stockStatuses := []models.StockStatus{}
		for _, statusStr := range strings.Split(stockStatusesStr, ",") {
			stockStatuses = append(stockStatuses, models.StockStatus(strings.TrimSpace(statusStr)))
		}
		filters.StockStatus = stockStatuses
	}

	// Parse brands
	if brandsStr := c.Query("brand"); brandsStr != "" {
		brands := []string{}
		for _, brand := range strings.Split(brandsStr, ",") {
			brands = append(brands, strings.TrimSpace(brand))
		}
		filters.Brand = brands
	}

	// Parse price range
	if priceMinStr := c.Query("price_min"); priceMinStr != "" {
		if priceMin, err := strconv.ParseFloat(priceMinStr, 64); err == nil {
			filters.PriceMin = &priceMin
		}
	}

	if priceMaxStr := c.Query("price_max"); priceMaxStr != "" {
		if priceMax, err := strconv.ParseFloat(priceMaxStr, 64); err == nil {
			filters.PriceMax = &priceMax
		}
	}

	// Parse boolean flags
	if isFeaturedStr := c.Query("is_featured"); isFeaturedStr != "" {
		if isFeatured, err := strconv.ParseBool(isFeaturedStr); err == nil {
			filters.IsFeatured = &isFeatured
		}
	}

	if isNewArrivalStr := c.Query("is_new_arrival"); isNewArrivalStr != "" {
		if isNewArrival, err := strconv.ParseBool(isNewArrivalStr); err == nil {
			filters.IsNewArrival = &isNewArrival
		}
	}

	if isBestsellerStr := c.Query("is_bestseller"); isBestsellerStr != "" {
		if isBestseller, err := strconv.ParseBool(isBestsellerStr); err == nil {
			filters.IsBestseller = &isBestseller
		}
	}

	// Parse search and sorting
	filters.Search = c.Query("search")
	filters.SortBy = c.Query("sort_by")
	filters.SortOrder = c.Query("sort_order")

	// Parse pagination
	filters.Page = 1
	if pageStr := c.Query("page"); pageStr != "" {
		if page, err := strconv.Atoi(pageStr); err == nil && page > 0 {
			filters.Page = page
		}
	}

	filters.PageSize = 20
	if pageSizeStr := c.Query("page_size"); pageSizeStr != "" {
		if pageSize, err := strconv.Atoi(pageSizeStr); err == nil && pageSize > 0 && pageSize <= 100 {
			filters.PageSize = pageSize
		}
	}

	result, err := h.productService.SearchProducts(c.Request.Context(), filters)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to search products", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, result)
}

// GetMyProducts godoc
// @Summary Get supplier's products
// @Description Get products for the authenticated supplier
// @Tags Marketplace Products
// @Produce json
// @Param status query string false "Product statuses (comma-separated)"
// @Param stock_status query string false "Stock statuses (comma-separated)"
// @Param search query string false "Search term"
// @Param sort_by query string false "Sort field (name, price, created_at, view_count)"
// @Param sort_order query string false "Sort order (asc, desc)"
// @Param page query int false "Page number"
// @Param page_size query int false "Page size"
// @Success 200 {object} services.ProductSearchResult
// @Failure 400 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /marketplace/products/my [get]
// @Security BearerAuth
func (h *MarketplaceProductHandler) GetMyProducts(c *gin.Context) {
	// Get user ID from JWT claims for authentication
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	uid, ok := userID.(int64)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid user ID"})
		return
	}

	// Get the supplier associated with this user
	supplier, err := h.supplierService.GetSupplierByUserID(c.Request.Context(), uid)
	if err != nil {
		if err.Error() == "sql: no rows in result set" {
			c.JSON(http.StatusForbidden, gin.H{"error": "No supplier profile found for this user"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get supplier profile", "details": err.Error()})
		return
	}

	supplierID := supplier.ID

	filters := &services.ProductSearchFilters{}

	// Parse statuses
	if statusesStr := c.Query("status"); statusesStr != "" {
		statuses := []models.ProductStatus{}
		for _, statusStr := range strings.Split(statusesStr, ",") {
			statuses = append(statuses, models.ProductStatus(strings.TrimSpace(statusStr)))
		}
		filters.Status = statuses
	}

	// Parse stock statuses
	if stockStatusesStr := c.Query("stock_status"); stockStatusesStr != "" {
		stockStatuses := []models.StockStatus{}
		for _, statusStr := range strings.Split(stockStatusesStr, ",") {
			stockStatuses = append(stockStatuses, models.StockStatus(strings.TrimSpace(statusStr)))
		}
		filters.StockStatus = stockStatuses
	}

	// Parse search and sorting
	filters.Search = c.Query("search")
	filters.SortBy = c.Query("sort_by")
	filters.SortOrder = c.Query("sort_order")

	// Parse pagination
	filters.Page = 1
	if pageStr := c.Query("page"); pageStr != "" {
		if page, err := strconv.Atoi(pageStr); err == nil && page > 0 {
			filters.Page = page
		}
	}

	filters.PageSize = 20
	if pageSizeStr := c.Query("page_size"); pageSizeStr != "" {
		if pageSize, err := strconv.Atoi(pageSizeStr); err == nil && pageSize > 0 && pageSize <= 100 {
			filters.PageSize = pageSize
		}
	}

	result, err := h.productService.GetProductsBySupplier(c.Request.Context(), supplierID, filters)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get products", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, result)
}

// ApproveProduct godoc
// @Summary Approve or reject a product (Admin only)
// @Description Approve or reject a marketplace product
// @Tags Marketplace Admin
// @Accept json
// @Produce json
// @Param id path int true "Product ID"
// @Param approval body services.ProductApprovalRequest true "Approval data"
// @Success 200 {object} models.MarketplaceProduct
// @Failure 400 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Failure 403 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /marketplace/admin/products/{id}/approve [put]
// @Security BearerAuth
func (h *MarketplaceProductHandler) ApproveProduct(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid product ID"})
		return
	}

	var req services.ProductApprovalRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request format", "details": err.Error()})
		return
	}

	// Get admin user ID from JWT
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	uid, ok := userID.(int64)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid user ID"})
		return
	}

	req.ApprovedBy = uid

	product, err := h.productService.ApproveProduct(c.Request.Context(), id, &req)
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			c.JSON(http.StatusNotFound, gin.H{"error": "Product not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to approve product", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, product)
}

// GetProductImages godoc
// @Summary Get product images
// @Description Get all images for a specific product
// @Tags Marketplace Products
// @Produce json
// @Param id path int true "Product ID"
// @Success 200 {array} models.MarketplaceProductImage
// @Failure 400 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /marketplace/products/{id}/images [get]
func (h *MarketplaceProductHandler) GetProductImages(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid product ID"})
		return
	}

	images, err := h.productService.GetProductImages(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get product images", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, images)
}

// SetupProductRoutes sets up the product routes
func (h *MarketplaceProductHandler) SetupProductRoutes(router *gin.RouterGroup, authMiddleware gin.HandlerFunc) {
	// Public routes
	router.GET("/products", h.SearchProducts)
	router.GET("/products/:id", h.GetProduct)
	router.GET("/products/:id/images", h.GetProductImages)

	// Authenticated supplier routes
	authenticated := router.Group("")
	authenticated.Use(authMiddleware)
	{
		authenticated.POST("/products", h.CreateProduct)
		authenticated.GET("/products/my", h.GetMyProducts)
		authenticated.PUT("/products/:id", h.UpdateProduct)
		authenticated.DELETE("/products/:id", h.DeleteProduct)
	}

	// Admin routes
	admin := router.Group("/admin")
	admin.Use(authMiddleware)
	// TODO: Add admin role middleware
	{
		admin.PUT("/products/:id/approve", h.ApproveProduct)
	}
}