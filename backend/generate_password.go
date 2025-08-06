package main

import (
	"fmt"
	"log"
	
	"golang.org/x/crypto/bcrypt"
)

func main() {
	password := "password123"
	
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		log.Fatal("Failed to hash password:", err)
	}
	
	fmt.Printf("Password: %s\n", password)
	fmt.Printf("Hashed: %s\n", string(hashedPassword))
	
	// Test verification
	err = bcrypt.CompareHashAndPassword(hashedPassword, []byte(password))
	if err != nil {
		log.Fatal("Password verification failed:", err)
	} else {
		fmt.Println("Password verification successful!")
	}
}