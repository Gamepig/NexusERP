package main

import (
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type Claims struct {
	UserID    int64  `json:"user_id"`
	Username  string `json:"username"`
	CompanyID int64  `json:"company_id"`
	jwt.RegisteredClaims
}

func GenerateJWT(userID int64, username string, companyID int64, secret string) (string, error) {
	claims := &Claims{
		UserID:    userID,
		Username:  username,
		CompanyID: companyID,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(15 * time.Minute)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(secret))
}

func main() {
	secret := "your-jwt-secret-key-here-make-it-long-and-secure"
	userID := int64(1075)
	username := "testuser"
	companyID := int64(1)
	
	token, err := GenerateJWT(userID, username, companyID, secret)
	if err != nil {
		fmt.Printf("Error: %v\n", err)
		return
	}
	
	fmt.Printf("%s\n", token)
}