package services

import (
	"context"
	"fmt"
	"strconv"
	"time"

	"github.com/redis/go-redis/v9"
)

// RateLimitService Redis 為基礎的速率限制服務
type RateLimitService struct {
	redis *redis.Client
}

// RateLimitConfig 速率限制配置
type RateLimitConfig struct {
	MaxRequests int           // 最大請求數
	Window      time.Duration // 時間窗口
	BurstLimit  int           // 突發限制（可選）
}

// RateLimitResult 速率限制結果
type RateLimitResult struct {
	Allowed      bool          // 是否允許請求
	Remaining    int           // 剩餘請求數
	ResetTime    time.Time     // 重設時間
	RetryAfter   time.Duration // 重試間隔
}

// NewRateLimitService 創建新的速率限制服務
func NewRateLimitService(redisClient *redis.Client) *RateLimitService {
	return &RateLimitService{
		redis: redisClient,
	}
}

// CheckRate 檢查速率限制
func (s *RateLimitService) CheckRate(ctx context.Context, key string, config RateLimitConfig) (*RateLimitResult, error) {
	now := time.Now()
	windowStart := now.Truncate(config.Window)
	redisKey := fmt.Sprintf("rate_limit:%s:%d", key, windowStart.Unix())

	// 使用 Lua 腳本確保原子性操作
	luaScript := redis.NewScript(`
		local key = KEYS[1]
		local max_requests = tonumber(ARGV[1])
		local window_seconds = tonumber(ARGV[2])
		local current_time = tonumber(ARGV[3])
		
		local current = redis.call('GET', key)
		if current == false then
			current = 0
		else
			current = tonumber(current)
		end
		
		if current >= max_requests then
			local ttl = redis.call('TTL', key)
			return {0, current, ttl}
		end
		
		current = redis.call('INCR', key)
		if current == 1 then
			redis.call('EXPIRE', key, window_seconds)
		end
		
		local ttl = redis.call('TTL', key)
		return {1, current, ttl}
	`)

	result, err := luaScript.Run(ctx, s.redis, []string{redisKey}, 
		config.MaxRequests, 
		int(config.Window.Seconds()), 
		now.Unix()).Result()

	if err != nil {
		return nil, fmt.Errorf("rate limit check failed: %w", err)
	}

	resultSlice, ok := result.([]interface{})
	if !ok || len(resultSlice) != 3 {
		return nil, fmt.Errorf("unexpected redis script result")
	}

	allowed := resultSlice[0].(int64) == 1
	current := int(resultSlice[1].(int64))
	ttl := int(resultSlice[2].(int64))

	remaining := config.MaxRequests - current
	if remaining < 0 {
		remaining = 0
	}

	resetTime := now.Add(time.Duration(ttl) * time.Second)
	retryAfter := time.Duration(ttl) * time.Second

	return &RateLimitResult{
		Allowed:    allowed,
		Remaining:  remaining,
		ResetTime:  resetTime,
		RetryAfter: retryAfter,
	}, nil
}

// CheckIPRate 檢查 IP 速率限制
func (s *RateLimitService) CheckIPRate(ctx context.Context, ip string, config RateLimitConfig) (*RateLimitResult, error) {
	return s.CheckRate(ctx, fmt.Sprintf("ip:%s", ip), config)
}

// CheckUserRate 檢查用戶速率限制
func (s *RateLimitService) CheckUserRate(ctx context.Context, userID int64, config RateLimitConfig) (*RateLimitResult, error) {
	return s.CheckRate(ctx, fmt.Sprintf("user:%d", userID), config)
}

// CheckLoginRate 檢查登入速率限制（結合 IP 和用戶）
func (s *RateLimitService) CheckLoginRate(ctx context.Context, ip string, userID *int64) (*RateLimitResult, error) {
	// IP 級別限制：每15分鐘5次嘗試
	ipConfig := RateLimitConfig{
		MaxRequests: 5,
		Window:      15 * time.Minute,
	}

	ipResult, err := s.CheckIPRate(ctx, ip, ipConfig)
	if err != nil {
		return nil, err
	}

	if !ipResult.Allowed {
		return ipResult, nil
	}

	// 如果有用戶ID，檢查用戶級別限制
	if userID != nil {
		userConfig := RateLimitConfig{
			MaxRequests: 3,
			Window:      10 * time.Minute,
		}

		userResult, err := s.CheckUserRate(ctx, *userID, userConfig)
		if err != nil {
			return nil, err
		}

		if !userResult.Allowed {
			return userResult, nil
		}

		// 返回更嚴格的限制
		if userResult.Remaining < ipResult.Remaining {
			return userResult, nil
		}
	}

	return ipResult, nil
}

// IsBlocked 檢查 IP 是否被封鎖
func (s *RateLimitService) IsBlocked(ctx context.Context, ip string) (bool, error) {
	blockedKey := fmt.Sprintf("blocked_ip:%s", ip)
	exists, err := s.redis.Exists(ctx, blockedKey).Result()
	return exists > 0, err
}

// BlockIP 封鎖 IP 地址
func (s *RateLimitService) BlockIP(ctx context.Context, ip string, duration time.Duration) error {
	blockedKey := fmt.Sprintf("blocked_ip:%s", ip)
	return s.redis.Set(ctx, blockedKey, "blocked", duration).Err()
}

// UnblockIP 解除 IP 封鎖
func (s *RateLimitService) UnblockIP(ctx context.Context, ip string) error {
	blockedKey := fmt.Sprintf("blocked_ip:%s", ip)
	return s.redis.Del(ctx, blockedKey).Err()
}

// RecordSuspiciousActivity 記錄可疑活動
func (s *RateLimitService) RecordSuspiciousActivity(ctx context.Context, ip string, activity string) error {
	suspiciousKey := fmt.Sprintf("suspicious:%s", ip)
	
	// 記錄活動
	activityData := fmt.Sprintf("%d:%s", time.Now().Unix(), activity)
	
	// 使用列表存儲，保留最近100條記錄
	pipe := s.redis.Pipeline()
	pipe.LPush(ctx, suspiciousKey, activityData)
	pipe.LTrim(ctx, suspiciousKey, 0, 99) // 保留最近100條
	pipe.Expire(ctx, suspiciousKey, 24*time.Hour) // 24小時過期
	
	_, err := pipe.Exec(ctx)
	return err
}

// GetSuspiciousActivity 獲取可疑活動記錄
func (s *RateLimitService) GetSuspiciousActivity(ctx context.Context, ip string) ([]string, error) {
	suspiciousKey := fmt.Sprintf("suspicious:%s", ip)
	return s.redis.LRange(ctx, suspiciousKey, 0, -1).Result()
}

// CheckBruteForceProtection 檢查暴力攻擊防護
func (s *RateLimitService) CheckBruteForceProtection(ctx context.Context, ip string) (*RateLimitResult, error) {
	// 檢查是否已被封鎖
	blocked, err := s.IsBlocked(ctx, ip)
	if err != nil {
		return nil, err
	}

	if blocked {
		return &RateLimitResult{
			Allowed:    false,
			Remaining:  0,
			ResetTime:  time.Now().Add(time.Hour),
			RetryAfter: time.Hour,
		}, nil
	}

	// 檢查失敗嘗試次數
	failureKey := fmt.Sprintf("login_failures:%s", ip)
	failures, err := s.redis.Get(ctx, failureKey).Result()
	if err == redis.Nil {
		failures = "0"
	} else if err != nil {
		return nil, err
	}

	failureCount, _ := strconv.Atoi(failures)

	// 如果失敗次數超過10次，自動封鎖1小時
	if failureCount >= 10 {
		err = s.BlockIP(ctx, ip, time.Hour)
		if err != nil {
			return nil, err
		}

		// 記錄可疑活動
		_ = s.RecordSuspiciousActivity(ctx, ip, fmt.Sprintf("auto_blocked_after_%d_failures", failureCount))

		return &RateLimitResult{
			Allowed:    false,
			Remaining:  0,
			ResetTime:  time.Now().Add(time.Hour),
			RetryAfter: time.Hour,
		}, nil
	}

	return &RateLimitResult{
		Allowed:   true,
		Remaining: 10 - failureCount,
		ResetTime: time.Now().Add(time.Hour),
	}, nil
}

// RecordLoginFailure 記錄登入失敗
func (s *RateLimitService) RecordLoginFailure(ctx context.Context, ip string) error {
	failureKey := fmt.Sprintf("login_failures:%s", ip)
	
	pipe := s.redis.Pipeline()
	pipe.Incr(ctx, failureKey)
	pipe.Expire(ctx, failureKey, time.Hour) // 1小時過期
	
	_, err := pipe.Exec(ctx)
	return err
}

// ClearLoginFailures 清除登入失敗記錄（成功登入後）
func (s *RateLimitService) ClearLoginFailures(ctx context.Context, ip string) error {
	failureKey := fmt.Sprintf("login_failures:%s", ip)
	return s.redis.Del(ctx, failureKey).Err()
}