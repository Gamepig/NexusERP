package services

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"nexus-erp/backend/internal/config"

	"github.com/redis/go-redis/v9"
)

// RedisService 提供 Redis 快取功能
type RedisService struct {
	client *redis.Client
	ctx    context.Context
}

// NewRedisService 創建新的 Redis 服務實例
func NewRedisService(cfg *config.Config) (*RedisService, error) {
	client := redis.NewClient(&redis.Options{
		Addr:     fmt.Sprintf("%s:%s", cfg.Redis.Host, cfg.Redis.Port),
		Password: cfg.Redis.Password,
		DB:       0, // 使用預設資料庫
	})

	// 測試連接
	ctx := context.Background()
	_, err := client.Ping(ctx).Result()
	if err != nil {
		return nil, fmt.Errorf("failed to connect to Redis: %w", err)
	}

	return &RedisService{
		client: client,
		ctx:    ctx,
	}, nil
}

// Set 設定快取值
func (r *RedisService) Set(key string, value interface{}, expiration time.Duration) error {
	// 序列化值
	data, err := json.Marshal(value)
	if err != nil {
		return fmt.Errorf("failed to marshal value: %w", err)
	}

	// 設定快取
	err = r.client.Set(r.ctx, key, data, expiration).Err()
	if err != nil {
		return fmt.Errorf("failed to set cache: %w", err)
	}

	return nil
}

// Get 獲取快取值
func (r *RedisService) Get(key string, dest interface{}) error {
	// 獲取快取
	data, err := r.client.Get(r.ctx, key).Result()
	if err != nil {
		if err == redis.Nil {
			return ErrCacheNotFound
		}
		return fmt.Errorf("failed to get cache: %w", err)
	}

	// 反序列化值
	err = json.Unmarshal([]byte(data), dest)
	if err != nil {
		return fmt.Errorf("failed to unmarshal value: %w", err)
	}

	return nil
}

// Delete 刪除快取值
func (r *RedisService) Delete(key string) error {
	err := r.client.Del(r.ctx, key).Err()
	if err != nil {
		return fmt.Errorf("failed to delete cache: %w", err)
	}
	return nil
}

// DeletePattern 根據模式刪除快取
func (r *RedisService) DeletePattern(pattern string) error {
	keys, err := r.client.Keys(r.ctx, pattern).Result()
	if err != nil {
		return fmt.Errorf("failed to get keys: %w", err)
	}

	if len(keys) > 0 {
		err = r.client.Del(r.ctx, keys...).Err()
		if err != nil {
			return fmt.Errorf("failed to delete keys: %w", err)
		}
	}

	return nil
}

// Exists 檢查快取是否存在
func (r *RedisService) Exists(key string) (bool, error) {
	result, err := r.client.Exists(r.ctx, key).Result()
	if err != nil {
		return false, fmt.Errorf("failed to check cache existence: %w", err)
	}
	return result > 0, nil
}

// SetTTL 設定快取過期時間
func (r *RedisService) SetTTL(key string, expiration time.Duration) error {
	err := r.client.Expire(r.ctx, key, expiration).Err()
	if err != nil {
		return fmt.Errorf("failed to set TTL: %w", err)
	}
	return nil
}

// GetTTL 獲取快取剩餘過期時間
func (r *RedisService) GetTTL(key string) (time.Duration, error) {
	duration, err := r.client.TTL(r.ctx, key).Result()
	if err != nil {
		return 0, fmt.Errorf("failed to get TTL: %w", err)
	}
	return duration, nil
}

// GetMultiple 批量獲取快取值
func (r *RedisService) GetMultiple(keys []string) (map[string]interface{}, error) {
	if len(keys) == 0 {
		return make(map[string]interface{}), nil
	}

	// 批量獲取
	results, err := r.client.MGet(r.ctx, keys...).Result()
	if err != nil {
		return nil, fmt.Errorf("failed to get multiple caches: %w", err)
	}

	// 構建結果映射
	resultMap := make(map[string]interface{})
	for i, key := range keys {
		if results[i] != nil {
			var value interface{}
			if data, ok := results[i].(string); ok {
				err := json.Unmarshal([]byte(data), &value)
				if err == nil {
					resultMap[key] = value
				}
			}
		}
	}

	return resultMap, nil
}

// SetMultiple 批量設定快取值
func (r *RedisService) SetMultiple(data map[string]interface{}, expiration time.Duration) error {
	if len(data) == 0 {
		return nil
	}

	// 使用 pipeline 進行批量操作
	pipe := r.client.Pipeline()

	for key, value := range data {
		// 序列化值
		serialized, err := json.Marshal(value)
		if err != nil {
			return fmt.Errorf("failed to marshal value for key %s: %w", key, err)
		}

		pipe.Set(r.ctx, key, serialized, expiration)
	}

	// 執行 pipeline
	_, err := pipe.Exec(r.ctx)
	if err != nil {
		return fmt.Errorf("failed to execute pipeline: %w", err)
	}

	return nil
}

// Increment 原子遞增
func (r *RedisService) Increment(key string) (int64, error) {
	result, err := r.client.Incr(r.ctx, key).Result()
	if err != nil {
		return 0, fmt.Errorf("failed to increment: %w", err)
	}
	return result, nil
}

// IncrementBy 原子遞增指定值
func (r *RedisService) IncrementBy(key string, value int64) (int64, error) {
	result, err := r.client.IncrBy(r.ctx, key, value).Result()
	if err != nil {
		return 0, fmt.Errorf("failed to increment by: %w", err)
	}
	return result, nil
}

// FlushAll 清空所有快取 (僅用於開發/測試)
func (r *RedisService) FlushAll() error {
	err := r.client.FlushAll(r.ctx).Err()
	if err != nil {
		return fmt.Errorf("failed to flush all: %w", err)
	}
	return nil
}

// Close 關閉 Redis 連接
func (r *RedisService) Close() error {
	return r.client.Close()
}

// GetInfo 獲取 Redis 資訊
func (r *RedisService) GetInfo() (string, error) {
	info, err := r.client.Info(r.ctx).Result()
	if err != nil {
		return "", fmt.Errorf("failed to get Redis info: %w", err)
	}
	return info, nil
}

// 快取鍵生成助手函數

// UserCacheKey 生成用戶快取鍵
func UserCacheKey(userID int64) string {
	return fmt.Sprintf("user:%d", userID)
}

// UserPermissionsCacheKey 生成用戶權限快取鍵
func UserPermissionsCacheKey(userID int64) string {
	return fmt.Sprintf("user:%d:permissions", userID)
}

// UserRolesCacheKey 生成用戶角色快取鍵
func UserRolesCacheKey(userID int64) string {
	return fmt.Sprintf("user:%d:roles", userID)
}

// ProductCacheKey 生成產品快取鍵
func ProductCacheKey(productID int64) string {
	return fmt.Sprintf("product:%d", productID)
}

// ProductListCacheKey 生成產品列表快取鍵
func ProductListCacheKey(page, limit int, filter string) string {
	return fmt.Sprintf("products:list:%d:%d:%s", page, limit, filter)
}

// CustomerCacheKey 生成客戶快取鍵
func CustomerCacheKey(customerID int64) string {
	return fmt.Sprintf("customer:%d", customerID)
}

// InventoryLevelCacheKey 生成庫存水準快取鍵
func InventoryLevelCacheKey(productID, warehouseID int64) string {
	return fmt.Sprintf("inventory:%d:%d", productID, warehouseID)
}

// ReportCacheKey 生成報表快取鍵
func ReportCacheKey(reportType string, params map[string]interface{}) string {
	paramHash := ""
	if len(params) > 0 {
		data, _ := json.Marshal(params)
		paramHash = fmt.Sprintf("%x", data)
	}
	return fmt.Sprintf("report:%s:%s", reportType, paramHash)
}

// 常見錯誤
var (
	ErrCacheNotFound = fmt.Errorf("cache not found")
)

// 預設過期時間
const (
	DefaultUserCacheTTL         = 15 * time.Minute  // 用戶資訊快取
	DefaultPermissionsCacheTTL  = 30 * time.Minute  // 權限快取
	DefaultProductCacheTTL      = 1 * time.Hour     // 產品資訊快取
	DefaultInventoryCacheTTL    = 5 * time.Minute   // 庫存快取
	DefaultReportCacheTTL       = 10 * time.Minute  // 報表快取
	DefaultConfigCacheTTL       = 24 * time.Hour    // 配置快取
)