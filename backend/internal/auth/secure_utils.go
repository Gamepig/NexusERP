package auth

import (
	"crypto/rand"
	"encoding/base64"
	"fmt"
)

// generateSecureRandomString 生成安全的隨機字符串
func generateSecureRandomString(length int) (string, error) {
	bytes := make([]byte, length)
	_, err := rand.Read(bytes)
	if err != nil {
		return "", fmt.Errorf("failed to generate random bytes: %w", err)
	}
	return base64.URLEncoding.EncodeToString(bytes), nil
}