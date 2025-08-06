package utils

import (
	"encoding/json"
	"net"
	"net/http"
	"strings"
)

// JSONResponse 發送 JSON 格式的 HTTP 回應
func JSONResponse(w http.ResponseWriter, data interface{}, statusCode int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	
	if err := json.NewEncoder(w).Encode(data); err != nil {
		// 如果編碼失敗，發送簡單的錯誤回應
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte(`{"error": "Failed to encode JSON response"}`))
	}
}

// GetClientIP 從 HTTP 請求中提取客戶端 IP 地址
func GetClientIP(r *http.Request) string {
	// 檢查 X-Forwarded-For header (代理伺服器常用)
	xForwardedFor := r.Header.Get("X-Forwarded-For")
	if xForwardedFor != "" {
		// X-Forwarded-For 可能包含多個 IP，取第一個
		ips := strings.Split(xForwardedFor, ",")
		if len(ips) > 0 {
			ip := strings.TrimSpace(ips[0])
			if ip != "" && ip != "unknown" {
				return ip
			}
		}
	}
	
	// 檢查 X-Real-IP header (Nginx 代理常用)
	xRealIP := r.Header.Get("X-Real-IP")
	if xRealIP != "" && xRealIP != "unknown" {
		return xRealIP
	}
	
	// 檢查 CF-Connecting-IP header (Cloudflare 常用)
	cfConnectingIP := r.Header.Get("CF-Connecting-IP")
	if cfConnectingIP != "" && cfConnectingIP != "unknown" {
		return cfConnectingIP
	}
	
	// 使用 RemoteAddr (直接連線)
	ip, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		return r.RemoteAddr
	}
	
	return ip
}