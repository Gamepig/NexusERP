package services

import (
	"fmt"

	"nexus-erp-fiber/internal/database"

	"golang.org/x/crypto/bcrypt"
)

// UserService provides user-related functionality
type UserService struct {
	db    *database.DB
	cache *CacheService
}

// NewUserService creates a new user service
func NewUserService(db *database.DB) *UserService {
	return &UserService{
		db: db,
	}
}

// NewUserServiceWithCache creates a new user service with cache
func NewUserServiceWithCache(db *database.DB, cache *CacheService) *UserService {
	return &UserService{
		db:    db,
		cache: cache,
	}
}

// GetUserByID retrieves a user by ID
func (s *UserService) GetUserByID(id int64) (*User, error) {
	var user User
	
	// Try cache first if available
	if s.cache != nil {
		cacheKey := fmt.Sprintf("user:%d", id)
		if cached, err := s.cache.Get(cacheKey); err == nil && cached != "" {
			// Parse cached user (simplified)
			// In real implementation, you'd properly unmarshal JSON
		}
	}
	
	// Query database
	query := `
		SELECT id, username, email, password_hash, status, created_at, updated_at
		FROM users 
		WHERE id = ? AND deleted_at IS NULL
	`
	
	err := s.db.Raw(query, id).Scan(&user).Error
	if err != nil {
		return nil, fmt.Errorf("failed to get user by ID: %w", err)
	}
	
	return &user, nil
}

// GetUserByUsername retrieves a user by username
func (s *UserService) GetUserByUsername(username string) (*User, error) {
	var user User
	
	query := `
		SELECT id, username, email, password_hash, status, created_at, updated_at
		FROM users 
		WHERE username = ? AND deleted_at IS NULL
	`
	
	err := s.db.Raw(query, username).Scan(&user).Error
	if err != nil {
		return nil, fmt.Errorf("failed to get user by username: %w", err)
	}
	
	return &user, nil
}

// GetUserByEmail retrieves a user by email
func (s *UserService) GetUserByEmail(email string) (*User, error) {
	var user User
	
	query := `
		SELECT id, username, email, password_hash, status, created_at, updated_at
		FROM users 
		WHERE email = ? AND deleted_at IS NULL
	`
	
	err := s.db.Raw(query, email).Scan(&user).Error
	if err != nil {
		return nil, fmt.Errorf("failed to get user by email: %w", err)
	}
	
	return &user, nil
}

// CreateUser creates a new user
func (s *UserService) CreateUser(user *User) error {
	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
	if err != nil {
		return fmt.Errorf("failed to hash password: %w", err)
	}
	
	user.Password = string(hashedPassword)
	
	// Insert user
	query := `
		INSERT INTO users (username, email, password_hash, status)
		VALUES (?, ?, ?, ?)
		RETURNING id, created_at, updated_at
	`
	
	err = s.db.Raw(query, user.Username, user.Email, user.Password, user.Status).Scan(user).Error
	if err != nil {
		return fmt.Errorf("failed to create user: %w", err)
	}
	
	return nil
}

// UpdateUser updates an existing user
func (s *UserService) UpdateUser(user *User) error {
	query := `
		UPDATE users 
		SET username = ?, email = ?, status = ?, updated_at = NOW()
		WHERE id = ? AND deleted_at IS NULL
	`
	
	err := s.db.Exec(query, user.Username, user.Email, user.Status, user.ID).Error
	if err != nil {
		return fmt.Errorf("failed to update user: %w", err)
	}
	
	// Clear cache if available
	if s.cache != nil {
		cacheKey := fmt.Sprintf("user:%d", user.ID)
		s.cache.Delete(cacheKey)
	}
	
	return nil
}

// DeleteUser soft deletes a user
func (s *UserService) DeleteUser(id int64) error {
	query := `
		UPDATE users 
		SET deleted_at = NOW(), updated_at = NOW()
		WHERE id = ? AND deleted_at IS NULL
	`
	
	err := s.db.Exec(query, id).Error
	if err != nil {
		return fmt.Errorf("failed to delete user: %w", err)
	}
	
	// Clear cache if available
	if s.cache != nil {
		cacheKey := fmt.Sprintf("user:%d", id)
		s.cache.Delete(cacheKey)
	}
	
	return nil
}

// ValidatePassword validates a user's password
func (s *UserService) ValidatePassword(user *User, password string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password))
	return err == nil
}

// HasPermission checks if a user has a specific permission
func (s *UserService) HasPermission(userID int64, resource, action string) (bool, error) {
	// This is a simplified implementation
	// In a real system, you'd check user roles and permissions
	
	query := `
		SELECT COUNT(*) > 0 as has_permission
		FROM user_roles ur
		JOIN role_permissions rp ON ur.role_id = rp.role_id
		JOIN permissions p ON rp.permission_id = p.id
		WHERE ur.user_id = ? 
		AND p.resource = ? 
		AND p.action = ?
		AND ur.is_active = true
	`
	
	var hasPermission bool
	err := s.db.Raw(query, userID, resource, action).Scan(&hasPermission).Error
	if err != nil {
		return false, fmt.Errorf("failed to check permission: %w", err)
	}
	
	return hasPermission, nil
}

// GetUserCompanies retrieves companies accessible by a user
func (s *UserService) GetUserCompanies(userID int64) ([]UserCompany, error) {
	var companies []UserCompany
	
	query := `
		SELECT uc.user_id, uc.company_id, uc.role, uc.is_active, uc.is_primary,
		       c.name as company_name
		FROM user_companies uc
		JOIN companies c ON uc.company_id = c.id
		WHERE uc.user_id = ? 
		AND uc.is_active = true 
		AND c.is_active = true
		ORDER BY uc.is_primary DESC, c.name ASC
	`
	
	err := s.db.Raw(query, userID).Scan(&companies).Error
	if err != nil {
		return nil, fmt.Errorf("failed to get user companies: %w", err)
	}
	
	return companies, nil
}

// Additional User struct fields
type User struct {
	ID        int64  `json:"id" db:"id"`
	Username  string `json:"username" db:"username"`
	Email     string `json:"email" db:"email"`
	Password  string `json:"-" db:"password_hash"` // Never expose password in JSON
	Status    string `json:"status" db:"status"`
	CreatedAt string `json:"created_at" db:"created_at"`
	UpdatedAt string `json:"updated_at" db:"updated_at"`
}

// UserCompany represents user-company relationship with extended info
type ExtendedUserCompany struct {
	UserCompany
	CompanyName string `json:"company_name" db:"company_name"`
}