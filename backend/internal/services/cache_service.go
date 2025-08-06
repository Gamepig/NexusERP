package services

import (
	"database/sql"
	"fmt"
	"time"

	"nexus-erp/backend/internal/models"

	"github.com/jmoiron/sqlx"
)

// CacheService 提供高階快取功能，整合 Redis 和資料庫
type CacheService struct {
	db    *sqlx.DB
	redis *RedisService
}

// NewCacheService 創建新的快取服務實例
func NewCacheService(db *sqlx.DB, redis *RedisService) *CacheService {
	return &CacheService{
		db:    db,
		redis: redis,
	}
}

// GetOrSetUser 獲取或設定用戶快取
func (c *CacheService) GetOrSetUser(userID int64) (*models.User, error) {
	cacheKey := UserCacheKey(userID)
	
	// 嘗試從快取獲取
	var user models.User
	err := c.redis.Get(cacheKey, &user)
	if err == nil {
		return &user, nil
	}
	
	// 快取未命中，從資料庫獲取
	err = c.db.Get(&user, "SELECT * FROM users WHERE id = $1", userID)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("user not found")
		}
		return nil, fmt.Errorf("failed to get user from database: %w", err)
	}
	
	// 設定快取
	_ = c.redis.Set(cacheKey, user, DefaultUserCacheTTL)
	
	return &user, nil
}

// GetOrSetUserPermissions 獲取或設定用戶權限快取
func (c *CacheService) GetOrSetUserPermissions(userID int64) ([]models.Permission, error) {
	cacheKey := UserPermissionsCacheKey(userID)
	
	// 嘗試從快取獲取
	var permissions []models.Permission
	err := c.redis.Get(cacheKey, &permissions)
	if err == nil {
		return permissions, nil
	}
	
	// 快取未命中，從資料庫獲取
	query := `
		SELECT DISTINCT p.id, p.name, p.description, p.resource, p.action, p.created_at
		FROM permissions p
		JOIN role_permissions rp ON p.id = rp.permission_id
		JOIN user_roles ur ON rp.role_id = ur.role_id
		WHERE ur.user_id = $1
	`
	
	err = c.db.Select(&permissions, query, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get user permissions from database: %w", err)
	}
	
	// 設定快取
	_ = c.redis.Set(cacheKey, permissions, DefaultPermissionsCacheTTL)
	
	return permissions, nil
}

// GetOrSetUserRoles 獲取或設定用戶角色快取
func (c *CacheService) GetOrSetUserRoles(userID int64) ([]models.Role, error) {
	cacheKey := UserRolesCacheKey(userID)
	
	// 嘗試從快取獲取
	var roles []models.Role
	err := c.redis.Get(cacheKey, &roles)
	if err == nil {
		return roles, nil
	}
	
	// 快取未命中，從資料庫獲取
	query := `
		SELECT r.id, r.name, r.description, r.created_at, r.updated_at
		FROM roles r
		JOIN user_roles ur ON r.id = ur.role_id
		WHERE ur.user_id = $1
	`
	
	err = c.db.Select(&roles, query, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get user roles from database: %w", err)
	}
	
	// 設定快取
	_ = c.redis.Set(cacheKey, roles, DefaultPermissionsCacheTTL)
	
	return roles, nil
}

// GetOrSetProduct 獲取或設定產品快取
func (c *CacheService) GetOrSetProduct(productID int64) (*models.Product, error) {
	cacheKey := ProductCacheKey(productID)
	
	// 嘗試從快取獲取
	var product models.Product
	err := c.redis.Get(cacheKey, &product)
	if err == nil {
		return &product, nil
	}
	
	// 快取未命中，從資料庫獲取
	err = c.db.Get(&product, "SELECT * FROM products WHERE id = $1 AND is_active = true", productID)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("product not found")
		}
		return nil, fmt.Errorf("failed to get product from database: %w", err)
	}
	
	// 設定快取
	_ = c.redis.Set(cacheKey, product, DefaultProductCacheTTL)
	
	return &product, nil
}

// GetOrSetProducts 批量獲取或設定產品快取
func (c *CacheService) GetOrSetProducts(productIDs []int64) (map[int64]*models.Product, error) {
	if len(productIDs) == 0 {
		return make(map[int64]*models.Product), nil
	}
	
	results := make(map[int64]*models.Product)
	missingIDs := make([]int64, 0)
	
	// 嘗試從快取獲取
	for _, id := range productIDs {
		cacheKey := ProductCacheKey(id)
		var product models.Product
		err := c.redis.Get(cacheKey, &product)
		if err == nil {
			results[id] = &product
		} else {
			missingIDs = append(missingIDs, id)
		}
	}
	
	// 從資料庫獲取快取未命中的產品
	if len(missingIDs) > 0 {
		// 建立 IN 查詢
		query, args, err := sqlx.In("SELECT * FROM products WHERE id IN (?) AND is_active = true", missingIDs)
		if err != nil {
			return nil, fmt.Errorf("failed to build query: %w", err)
		}
		
		var products []models.Product
		err = c.db.Select(&products, c.db.Rebind(query), args...)
		if err != nil {
			return nil, fmt.Errorf("failed to get products from database: %w", err)
		}
		
		// 設定快取並加入結果
		for _, product := range products {
			results[product.ID] = &product
			cacheKey := ProductCacheKey(product.ID)
			_ = c.redis.Set(cacheKey, product, DefaultProductCacheTTL)
		}
	}
	
	return results, nil
}

// GetOrSetCustomer 獲取或設定客戶快取
func (c *CacheService) GetOrSetCustomer(customerID int64) (*models.Customer, error) {
	cacheKey := CustomerCacheKey(customerID)
	
	// 嘗試從快取獲取
	var customer models.Customer
	err := c.redis.Get(cacheKey, &customer)
	if err == nil {
		return &customer, nil
	}
	
	// 快取未命中，從資料庫獲取
	err = c.db.Get(&customer, "SELECT * FROM customers WHERE id = $1 AND deleted_at IS NULL", customerID)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("customer not found")
		}
		return nil, fmt.Errorf("failed to get customer from database: %w", err)
	}
	
	// 設定快取
	_ = c.redis.Set(cacheKey, customer, DefaultUserCacheTTL)
	
	return &customer, nil
}

// GetOrSetInventoryLevel 獲取或設定庫存水準快取
func (c *CacheService) GetOrSetInventoryLevel(productID, warehouseID int64) (*models.InventoryLevel, error) {
	cacheKey := InventoryLevelCacheKey(productID, warehouseID)
	
	// 嘗試從快取獲取
	var level models.InventoryLevel
	err := c.redis.Get(cacheKey, &level)
	if err == nil {
		return &level, nil
	}
	
	// 快取未命中，從資料庫獲取
	err = c.db.Get(&level, "SELECT * FROM inventory_levels WHERE product_id = $1 AND warehouse_id = $2", productID, warehouseID)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("inventory level not found")
		}
		return nil, fmt.Errorf("failed to get inventory level from database: %w", err)
	}
	
	// 設定快取（庫存快取時間較短）
	_ = c.redis.Set(cacheKey, level, DefaultInventoryCacheTTL)
	
	return &level, nil
}

// InvalidateUserCache 失效用戶相關快取
func (c *CacheService) InvalidateUserCache(userID int64) error {
	patterns := []string{
		UserCacheKey(userID),
		UserPermissionsCacheKey(userID),
		UserRolesCacheKey(userID),
	}
	
	for _, pattern := range patterns {
		_ = c.redis.Delete(pattern)
	}
	
	return nil
}

// InvalidateProductCache 失效產品快取
func (c *CacheService) InvalidateProductCache(productID int64) error {
	patterns := []string{
		ProductCacheKey(productID),
		"products:list:*", // 失效產品列表快取
	}
	
	for _, pattern := range patterns {
		if pattern == "products:list:*" {
			_ = c.redis.DeletePattern(pattern)
		} else {
			_ = c.redis.Delete(pattern)
		}
	}
	
	return nil
}

// InvalidateInventoryCache 失效庫存快取
func (c *CacheService) InvalidateInventoryCache(productID, warehouseID int64) error {
	patterns := []string{
		InventoryLevelCacheKey(productID, warehouseID),
		fmt.Sprintf("inventory:%d:*", productID), // 該產品在所有倉庫的庫存
	}
	
	for _, pattern := range patterns {
		if pattern[len(pattern)-1] == '*' {
			_ = c.redis.DeletePattern(pattern)
		} else {
			_ = c.redis.Delete(pattern)
		}
	}
	
	return nil
}

// WarmUpCache 預熱快取
func (c *CacheService) WarmUpCache() error {
	// 預熱活躍產品快取
	var products []models.Product
	err := c.db.Select(&products, "SELECT * FROM products WHERE is_active = true LIMIT 100")
	if err == nil {
		for _, product := range products {
			cacheKey := ProductCacheKey(product.ID)
			_ = c.redis.Set(cacheKey, product, DefaultProductCacheTTL)
		}
	}
	
	// 預熱系統配置快取
	// 這裡可以添加系統配置的預熱邏輯
	
	return nil
}

// GetCacheStats 獲取快取統計資訊
func (c *CacheService) GetCacheStats() (map[string]interface{}, error) {
	info, err := c.redis.GetInfo()
	if err != nil {
		return nil, err
	}
	
	stats := map[string]interface{}{
		"redis_info": info,
		"timestamp":  time.Now(),
	}
	
	return stats, nil
}