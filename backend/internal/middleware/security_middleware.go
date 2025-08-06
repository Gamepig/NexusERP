package middleware

import (
	"time"

	"github.com/gin-gonic/gin"
)

// SecurityHeaders 添加安全標頭中介軟體
func SecurityHeaders() gin.HandlerFunc {
	return gin.HandlerFunc(func(c *gin.Context) {
		// 防止點擊劫持攻擊
		c.Header("X-Frame-Options", "DENY")
		
		// 防止 MIME 類型混淆攻擊
		c.Header("X-Content-Type-Options", "nosniff")
		
		// 啟用 XSS 過濾器
		c.Header("X-XSS-Protection", "1; mode=block")
		
		// 強制 HTTPS（生產環境）
		if gin.Mode() == gin.ReleaseMode {
			c.Header("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
		}
		
		// Content Security Policy
		csp := "default-src 'self'; " +
			"script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; " +
			"style-src 'self' 'unsafe-inline' https://fonts.bunny.net; " +
			"font-src 'self' https://fonts.bunny.net; " +
			"img-src 'self' data: https:; " +
			"connect-src 'self'"
		c.Header("Content-Security-Policy", csp)
		
		// 移除伺服器資訊洩漏
		c.Header("Server", "")
		
		c.Next()
	})
}

// RateLimitMemory 記憶體為基礎的簡易速率限制（生產環境建議使用 Redis）
var requestCounts = make(map[string][]time.Time)

// RateLimit 實施速率限制
func RateLimit(maxRequests int, window time.Duration) gin.HandlerFunc {
	return gin.HandlerFunc(func(c *gin.Context) {
		clientIP := c.ClientIP()
		now := time.Now()
		
		// 清理過期的請求記錄
		if times, exists := requestCounts[clientIP]; exists {
			validTimes := []time.Time{}
			for _, reqTime := range times {
				if now.Sub(reqTime) < window {
					validTimes = append(validTimes, reqTime)
				}
			}
			requestCounts[clientIP] = validTimes
		}
		
		// 檢查是否超過限制
		if len(requestCounts[clientIP]) >= maxRequests {
			c.JSON(429, gin.H{
				"error": "Rate limit exceeded. Too many requests.",
				"retry_after": int(window.Seconds()),
			})
			c.Abort()
			return
		}
		
		// 記錄這次請求
		requestCounts[clientIP] = append(requestCounts[clientIP], now)
		
		c.Next()
	})
}

// LoginRateLimit 專門用於登入端點的嚴格速率限制
func LoginRateLimit() gin.HandlerFunc {
	return RateLimit(5, 15*time.Minute) // 15分鐘內最多5次嘗試
}