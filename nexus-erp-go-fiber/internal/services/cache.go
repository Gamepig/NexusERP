package services

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"nexus-erp-fiber/internal/config"
	"nexus-erp-fiber/internal/database"

	"github.com/redis/go-redis/v9"
)

// CacheService provides Redis-based caching functionality
type CacheService struct {
	db    *database.DB
	redis *redis.Client
}

// RedisService wraps Redis client
type RedisService struct {
	client *redis.Client
}

// NewRedisService creates a new Redis service
func NewRedisService(cfg *config.Config) (*RedisService, error) {
	rdb := redis.NewClient(&redis.Options{
		Addr:         cfg.Redis.RedisAddr(),
		Password:     cfg.Redis.Password,
		DB:           cfg.Redis.DB,
		PoolSize:     cfg.Redis.PoolSize,
		MinIdleConns: cfg.Redis.MinIdleConns,
	})

	// Test connection
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := rdb.Ping(ctx).Err(); err != nil {
		return nil, fmt.Errorf("failed to connect to Redis: %w", err)
	}

	return &RedisService{client: rdb}, nil
}

// Close closes the Redis connection
func (r *RedisService) Close() error {
	return r.client.Close()
}

// NewCacheService creates a new cache service
func NewCacheService(db *database.DB, redisService *RedisService) *CacheService {
	return &CacheService{
		db:    db,
		redis: redisService.client,
	}
}

// Get retrieves a value from cache
func (c *CacheService) Get(key string) (string, error) {
	ctx := context.Background()
	return c.redis.Get(ctx, key).Result()
}

// Set stores a value in cache with TTL
func (c *CacheService) Set(key string, value interface{}, ttl time.Duration) error {
	ctx := context.Background()
	
	var data string
	switch v := value.(type) {
	case string:
		data = v
	default:
		jsonData, err := json.Marshal(value)
		if err != nil {
			return fmt.Errorf("failed to marshal value: %w", err)
		}
		data = string(jsonData)
	}
	
	return c.redis.Set(ctx, key, data, ttl).Err()
}

// Delete removes a key from cache
func (c *CacheService) Delete(key string) error {
	ctx := context.Background()
	return c.redis.Del(ctx, key).Err()
}

// Clear removes keys matching a pattern
func (c *CacheService) Clear(pattern string) error {
	ctx := context.Background()
	keys := c.redis.Keys(ctx, pattern).Val()
	
	if len(keys) > 0 {
		return c.redis.Del(ctx, keys...).Err()
	}
	
	return nil
}

// WarmUpCache preloads frequently accessed data
func (c *CacheService) WarmUpCache() error {
	// Warm up common data that's frequently accessed
	
	// 1. Load active companies
	if err := c.warmUpCompanies(); err != nil {
		return fmt.Errorf("failed to warm up companies cache: %w", err)
	}
	
	// 2. Load product categories
	if err := c.warmUpProductCategories(); err != nil {
		return fmt.Errorf("failed to warm up product categories cache: %w", err)
	}
	
	// 3. Load warehouses
	if err := c.warmUpWarehouses(); err != nil {
		return fmt.Errorf("failed to warm up warehouses cache: %w", err)
	}
	
	return nil
}

// warmUpCompanies caches active companies
func (c *CacheService) warmUpCompanies() error {
	query := "SELECT id, name, is_active FROM companies WHERE is_active = true"
	
	var companies []struct {
		ID       int    `json:"id"`
		Name     string `json:"name"`
		IsActive bool   `json:"is_active"`
	}
	
	if err := c.db.Raw(query).Scan(&companies).Error; err != nil {
		return err
	}
	
	// Cache each company individually
	for _, company := range companies {
		key := fmt.Sprintf("company:%d", company.ID)
		if err := c.Set(key, company, 1*time.Hour); err != nil {
			return err
		}
	}
	
	// Cache the list of all companies
	if err := c.Set("companies:active", companies, 30*time.Minute); err != nil {
		return err
	}
	
	return nil
}

// warmUpProductCategories caches product categories
func (c *CacheService) warmUpProductCategories() error {
	query := `
		SELECT pc.id, pc.name, pc.company_id, c.name as company_name
		FROM product_categories pc
		JOIN companies c ON pc.company_id = c.id
		WHERE pc.is_active = true AND c.is_active = true
	`
	
	var categories []struct {
		ID          int    `json:"id"`
		Name        string `json:"name"`
		CompanyID   int    `json:"company_id"`
		CompanyName string `json:"company_name"`
	}
	
	if err := c.db.Raw(query).Scan(&categories).Error; err != nil {
		return err
	}
	
	// Group by company
	companyCategoriesMap := make(map[int][]interface{})
	for _, category := range categories {
		companyCategoriesMap[category.CompanyID] = append(
			companyCategoriesMap[category.CompanyID], 
			category,
		)
	}
	
	// Cache categories by company
	for companyID, companyCategories := range companyCategoriesMap {
		key := fmt.Sprintf("product_categories:company:%d", companyID)
		if err := c.Set(key, companyCategories, 45*time.Minute); err != nil {
			return err
		}
	}
	
	return nil
}

// warmUpWarehouses caches warehouses
func (c *CacheService) warmUpWarehouses() error {
	query := `
		SELECT w.id, w.name, w.company_id, w.is_active, w.capacity,
		       c.name as company_name
		FROM warehouses w
		JOIN companies c ON w.company_id = c.id
		WHERE w.is_active = true AND c.is_active = true
	`
	
	var warehouses []struct {
		ID          int     `json:"id"`
		Name        string  `json:"name"`
		CompanyID   int     `json:"company_id"`
		CompanyName string  `json:"company_name"`
		IsActive    bool    `json:"is_active"`
		Capacity    float64 `json:"capacity"`
	}
	
	if err := c.db.Raw(query).Scan(&warehouses).Error; err != nil {
		return err
	}
	
	// Group by company
	companyWarehousesMap := make(map[int][]interface{})
	for _, warehouse := range warehouses {
		companyWarehousesMap[warehouse.CompanyID] = append(
			companyWarehousesMap[warehouse.CompanyID], 
			warehouse,
		)
	}
	
	// Cache warehouses by company
	for companyID, companyWarehouses := range companyWarehousesMap {
		key := fmt.Sprintf("warehouses:company:%d", companyID)
		if err := c.Set(key, companyWarehouses, 45*time.Minute); err != nil {
			return err
		}
	}
	
	return nil
}

// GetCompanyCache retrieves cached company data
func (c *CacheService) GetCompanyCache(companyID int) (map[string]interface{}, error) {
	key := fmt.Sprintf("company:%d", companyID)
	data, err := c.Get(key)
	if err != nil {
		return nil, err
	}
	
	var company map[string]interface{}
	if err := json.Unmarshal([]byte(data), &company); err != nil {
		return nil, err
	}
	
	return company, nil
}

// SetUserSession caches user session data
func (c *CacheService) SetUserSession(userID int, sessionData interface{}) error {
	key := fmt.Sprintf("user_session:%d", userID)
	return c.Set(key, sessionData, 24*time.Hour)
}

// GetUserSession retrieves user session data
func (c *CacheService) GetUserSession(userID int) (map[string]interface{}, error) {
	key := fmt.Sprintf("user_session:%d", userID)
	data, err := c.Get(key)
	if err != nil {
		return nil, err
	}
	
	var session map[string]interface{}
	if err := json.Unmarshal([]byte(data), &session); err != nil {
		return nil, err
	}
	
	return session, nil
}

// ClearUserSession removes user session data
func (c *CacheService) ClearUserSession(userID int) error {
	key := fmt.Sprintf("user_session:%d", userID)
	return c.Delete(key)
}

// SetReportCache caches report data
func (c *CacheService) SetReportCache(reportType string, tenantID int, filters string, data interface{}, ttl time.Duration) error {
	key := fmt.Sprintf("report:%s:%d:%s", reportType, tenantID, filters)
	return c.Set(key, data, ttl)
}

// GetReportCache retrieves cached report data
func (c *CacheService) GetReportCache(reportType string, tenantID int, filters string) (interface{}, error) {
	key := fmt.Sprintf("report:%s:%d:%s", reportType, tenantID, filters)
	data, err := c.Get(key)
	if err != nil {
		return nil, err
	}
	
	var report interface{}
	if err := json.Unmarshal([]byte(data), &report); err != nil {
		return nil, err
	}
	
	return report, nil
}

// ClearReportCache clears cached reports for a tenant
func (c *CacheService) ClearReportCache(tenantID int) error {
	pattern := fmt.Sprintf("report:*:%d:*", tenantID)
	return c.Clear(pattern)
}

// GetStats returns cache statistics
func (c *CacheService) GetStats() map[string]interface{} {
	ctx := context.Background()
	
	// Get Redis info
	info := c.redis.Info(ctx, "memory", "stats").Val()
	
	// Parse basic stats (simplified)
	stats := map[string]interface{}{
		"redis_info": info,
		"connected":  true,
	}
	
	// Test connection
	if err := c.redis.Ping(ctx).Err(); err != nil {
		stats["connected"] = false
		stats["error"] = err.Error()
	}
	
	return stats
}