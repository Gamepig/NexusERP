package utils

import (
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestGenerateJWT(t *testing.T) {
	userID := int64(123)
	username := "testuser"
	companyID := int64(1)
	secret := "test-secret"

	token, err := GenerateJWT(userID, username, companyID, secret)
	require.NoError(t, err)
	assert.NotEmpty(t, token)

	// Parse the token to verify it's valid
	parsedToken, err := jwt.ParseWithClaims(token, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		return []byte(secret), nil
	})
	require.NoError(t, err)
	require.True(t, parsedToken.Valid)

	// Verify claims
	claims, ok := parsedToken.Claims.(*Claims)
	require.True(t, ok)
	assert.Equal(t, userID, claims.UserID)
	assert.Equal(t, username, claims.Username)
	assert.Equal(t, companyID, claims.CompanyID)
	assert.True(t, claims.ExpiresAt.After(time.Now()))
}

func TestValidateJWT(t *testing.T) {
	userID := int64(123)
	username := "testuser"
	companyID := int64(1)
	secret := "test-secret"

	// Generate a token
	token, err := GenerateJWT(userID, username, companyID, secret)
	require.NoError(t, err)

	// Validate the token
	claims, err := ValidateJWT(token, secret)
	require.NoError(t, err)
	assert.Equal(t, userID, claims.UserID)
	assert.Equal(t, username, claims.Username)
	assert.Equal(t, companyID, claims.CompanyID)
}

func TestValidateJWT_InvalidToken(t *testing.T) {
	secret := "test-secret"
	invalidToken := "invalid.token.here"

	_, err := ValidateJWT(invalidToken, secret)
	assert.Error(t, err)
}

func TestValidateJWT_WrongSecret(t *testing.T) {
	userID := int64(123)
	username := "testuser"
	companyID := int64(1)
	secret := "test-secret"
	wrongSecret := "wrong-secret"

	// Generate a token with the correct secret
	token, err := GenerateJWT(userID, username, companyID, secret)
	require.NoError(t, err)

	// Try to validate with wrong secret
	_, err = ValidateJWT(token, wrongSecret)
	assert.Error(t, err)
}