package utils

import (
	"encoding/base64"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestGeneratePasswordResetToken(t *testing.T) {
	tests := []struct {
		name string
	}{
		{
			name: "generate password reset token",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			token1, err1 := GeneratePasswordResetToken()
			token2, err2 := GeneratePasswordResetToken()

			// Both should succeed
			assert.NoError(t, err1)
			assert.NoError(t, err2)

			// Tokens should not be empty
			assert.NotEmpty(t, token1)
			assert.NotEmpty(t, token2)

			// Tokens should be different (highly likely with crypto/rand)
			assert.NotEqual(t, token1, token2)

			// Tokens should be valid base64
			_, err := base64.URLEncoding.DecodeString(token1)
			assert.NoError(t, err)
			
			_, err = base64.URLEncoding.DecodeString(token2)
			assert.NoError(t, err)

			// Token length should be reasonable (32 bytes base64 encoded)
			// Base64 encoding of 32 bytes should be 44 characters (with padding)
			assert.Equal(t, 44, len(token1))
			assert.Equal(t, 44, len(token2))
		})
	}
}