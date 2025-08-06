package services

import (
	"crypto/sha256"
	"database/sql"
	"encoding/hex"
	"errors"
	"fmt"
	"time"

	"nexus-erp/backend/internal/models"
	"nexus-erp/backend/internal/utils"

	"github.com/jmoiron/sqlx"
	"golang.org/x/crypto/bcrypt"
)

type UserService struct {
	db           *sqlx.DB
	cacheService *CacheService
}

func NewUserService(db *sqlx.DB) *UserService {
	return &UserService{db: db}
}

// NewUserServiceWithCache 創建帶快取的用戶服務
func NewUserServiceWithCache(db *sqlx.DB, cacheService *CacheService) *UserService {
	return &UserService{
		db:           db,
		cacheService: cacheService,
	}
}

func (s *UserService) CreateUser(req *models.CreateUserRequest) (*models.User, error) {
	// Hash the password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("failed to hash password: %w", err)
	}

	// Check if user already exists
	var exists bool
	err = s.db.QueryRow("SELECT EXISTS(SELECT 1 FROM users WHERE email = $1 OR name = $2)", req.Email, req.Name).Scan(&exists)
	if err != nil {
		return nil, fmt.Errorf("failed to check user existence: %w", err)
	}
	if exists {
		return nil, errors.New("user with this email or username already exists")
	}

	// Set default registration method if not provided
	registrationMethod := "traditional"
	if req.RegistrationMethod != nil {
		registrationMethod = *req.RegistrationMethod
	}

	// Insert new user
	user := &models.User{}
	query := `
		INSERT INTO users (name, email, password, first_name, last_name, status, ai_classification_yaml, registration_method)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING id, name, email, first_name, last_name, status, ai_classification_yaml, registration_method, created_at, updated_at
	`

	err = s.db.QueryRow(
		query,
		req.Name,
		req.Email,
		string(hashedPassword),
		req.FirstName,
		req.LastName,
		"active",
		req.AIClassificationYAML,
		registrationMethod,
	).Scan(
		&user.ID,
		&user.Username,
		&user.Email,
		&user.FirstName,
		&user.LastName,
		&user.Status,
		&user.AIClassificationYAML,
		&user.RegistrationMethod,
		&user.CreatedAt,
		&user.UpdatedAt,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to create user: %w", err)
	}

	return user, nil
}

func (s *UserService) GetUserByUsername(username string) (*models.User, error) {
	user := &models.User{}
	query := `
		SELECT id, name, email, password, first_name, last_name, status, ai_classification_yaml, registration_method, created_at, updated_at, deleted_at
		FROM users
		WHERE name = $1 AND deleted_at IS NULL
	`

	err := s.db.QueryRow(query, username).Scan(
		&user.ID,
		&user.Username,
		&user.Email,
		&user.PasswordHash,
		&user.FirstName,
		&user.LastName,
		&user.Status,
		&user.AIClassificationYAML,
		&user.RegistrationMethod,
		&user.CreatedAt,
		&user.UpdatedAt,
		&user.DeletedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, errors.New("user not found")
		}
		return nil, fmt.Errorf("failed to get user: %w", err)
	}

	return user, nil
}

func (s *UserService) GetUserByEmail(email string) (*models.User, error) {
	user := &models.User{}
	query := `
		SELECT id, name, email, password, first_name, last_name, status, ai_classification_yaml, registration_method, created_at, updated_at, deleted_at
		FROM users
		WHERE email = $1 AND deleted_at IS NULL
	`

	err := s.db.QueryRow(query, email).Scan(
		&user.ID,
		&user.Username,
		&user.Email,
		&user.PasswordHash,
		&user.FirstName,
		&user.LastName,
		&user.Status,
		&user.AIClassificationYAML,
		&user.RegistrationMethod,
		&user.CreatedAt,
		&user.UpdatedAt,
		&user.DeletedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, errors.New("user not found")
		}
		return nil, fmt.Errorf("failed to get user: %w", err)
	}

	return user, nil
}

func (s *UserService) GetUserByID(id int64) (*models.User, error) {
	// 如果有快取服務，嘗試從快取獲取
	if s.cacheService != nil {
		user, err := s.cacheService.GetOrSetUser(id)
		if err == nil {
			return user, nil
		}
		// 快取失敗，繼續從資料庫獲取
	}

	user := &models.User{}
	query := `
		SELECT id, name, email, password, first_name, last_name, status, ai_classification_yaml, registration_method, created_at, updated_at, deleted_at
		FROM users
		WHERE id = $1 AND deleted_at IS NULL
	`

	err := s.db.QueryRow(query, id).Scan(
		&user.ID,
		&user.Username,
		&user.Email,
		&user.PasswordHash,
		&user.FirstName,
		&user.LastName,
		&user.Status,
		&user.AIClassificationYAML,
		&user.RegistrationMethod,
		&user.CreatedAt,
		&user.UpdatedAt,
		&user.DeletedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, errors.New("user not found")
		}
		return nil, fmt.Errorf("failed to get user: %w", err)
	}

	return user, nil
}

func (s *UserService) ValidatePassword(user *models.User, password string) error {
	return bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password))
}

func (s *UserService) GenerateJWT(user *models.User, jwtSecret string) (string, error) {
	// 獲取用戶的主要公司 ID
	companyID, err := s.getUserPrimaryCompanyID(user.ID)
	if err != nil {
		// 如果無法獲取公司 ID，使用預設值 1（第一個公司）
		companyID = 1
	}
	
	return utils.GenerateJWT(user.ID, user.Username, companyID, jwtSecret)
}

// getUserPrimaryCompanyID 獲取用戶的主要公司 ID
func (s *UserService) getUserPrimaryCompanyID(userID int64) (int64, error) {
	var companyID int64
	
	// 查詢用戶的主要公司
	query := `
		SELECT uc.company_id 
		FROM user_companies uc
		INNER JOIN companies c ON c.id = uc.company_id
		WHERE uc.user_id = $1 
		AND uc.is_active = true 
		AND c.is_active = true
		AND (uc.is_primary = true OR uc.id = (
			SELECT MIN(id) FROM user_companies 
			WHERE user_id = $1 AND is_active = true
		))
		LIMIT 1
	`
	
	err := s.db.QueryRow(query, userID).Scan(&companyID)
	if err != nil {
		// 如果找不到，嘗試獲取任何一個有效的公司
		fallbackQuery := `
			SELECT c.id 
			FROM companies c 
			WHERE c.is_active = true 
			ORDER BY c.id 
			LIMIT 1
		`
		fallbackErr := s.db.QueryRow(fallbackQuery).Scan(&companyID)
		if fallbackErr != nil {
			return 0, fmt.Errorf("no active company found for user %d: %w", userID, err)
		}
	}
	
	return companyID, nil
}

func (s *UserService) UserExists(email, username string) bool {
	var exists bool
	err := s.db.QueryRow("SELECT EXISTS(SELECT 1 FROM users WHERE email = $1 OR name = $2)", email, username).Scan(&exists)
	if err != nil {
		return false
	}
	return exists
}

func (s *UserService) CreateRefreshToken(userID int64) (*models.RefreshToken, error) {
	tokenString, err := utils.GenerateRefreshToken()
	if err != nil {
		return nil, fmt.Errorf("failed to generate refresh token: %w", err)
	}

	refreshToken := &models.RefreshToken{
		UserID:    userID,
		Token:     tokenString,
		ExpiresAt: time.Now().Add(7 * 24 * time.Hour), // 7 days
	}

	query := `
		INSERT INTO refresh_tokens (user_id, token, expires_at)
		VALUES ($1, $2, $3)
		RETURNING id, created_at
	`

	err = s.db.QueryRow(query, refreshToken.UserID, refreshToken.Token, refreshToken.ExpiresAt).Scan(
		&refreshToken.ID,
		&refreshToken.CreatedAt,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to create refresh token: %w", err)
	}

	return refreshToken, nil
}

func (s *UserService) GetRefreshToken(token string) (*models.RefreshToken, error) {
	refreshToken := &models.RefreshToken{}
	query := `
		SELECT id, user_id, token, expires_at, revoked_at, created_at
		FROM refresh_tokens
		WHERE token = $1 AND revoked_at IS NULL
	`

	err := s.db.QueryRow(query, token).Scan(
		&refreshToken.ID,
		&refreshToken.UserID,
		&refreshToken.Token,
		&refreshToken.ExpiresAt,
		&refreshToken.RevokedAt,
		&refreshToken.CreatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, errors.New("refresh token not found")
		}
		return nil, fmt.Errorf("failed to get refresh token: %w", err)
	}

	return refreshToken, nil
}

func (s *UserService) RevokeRefreshToken(token string) error {
	query := `
		UPDATE refresh_tokens
		SET revoked_at = CURRENT_TIMESTAMP
		WHERE token = $1 AND revoked_at IS NULL
	`

	result, err := s.db.Exec(query, token)
	if err != nil {
		return fmt.Errorf("failed to revoke refresh token: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return errors.New("refresh token not found or already revoked")
	}

	return nil
}

func (s *UserService) RevokeAllUserRefreshTokens(userID int64) error {
	query := `
		UPDATE refresh_tokens
		SET revoked_at = CURRENT_TIMESTAMP
		WHERE user_id = $1 AND revoked_at IS NULL
	`

	_, err := s.db.Exec(query, userID)
	if err != nil {
		return fmt.Errorf("failed to revoke user refresh tokens: %w", err)
	}

	return nil
}

func (s *UserService) ValidateRefreshToken(token string) (*models.RefreshToken, error) {
	refreshToken, err := s.GetRefreshToken(token)
	if err != nil {
		return nil, err
	}

	if time.Now().After(refreshToken.ExpiresAt) {
		return nil, errors.New("refresh token expired")
	}

	return refreshToken, nil
}

// RBAC Methods

// GetUserRoles retrieves all roles assigned to a user
func (s *UserService) GetUserRoles(userID int64) ([]models.Role, error) {
	query := `
		SELECT r.id, r.name, r.description, r.created_at, r.updated_at
		FROM roles r
		JOIN user_roles ur ON r.id = ur.role_id
		WHERE ur.user_id = $1
		ORDER BY r.name
	`
	
	rows, err := s.db.Query(query, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to query user roles: %w", err)
	}
	defer rows.Close()

	var roles []models.Role
	for rows.Next() {
		var role models.Role
		err := rows.Scan(&role.ID, &role.Name, &role.Description, &role.CreatedAt, &role.UpdatedAt)
		if err != nil {
			return nil, fmt.Errorf("failed to scan role: %w", err)
		}
		roles = append(roles, role)
	}

	return roles, nil
}

// GetUserPermissions retrieves all permissions for a user through their roles
func (s *UserService) GetUserPermissions(userID int64) ([]models.Permission, error) {
	query := `
		SELECT DISTINCT p.id, p.name, p.resource, p.action, p.description, p.created_at, p.updated_at
		FROM permissions p
		JOIN role_permissions rp ON p.id = rp.permission_id
		JOIN user_roles ur ON rp.role_id = ur.role_id
		WHERE ur.user_id = $1
		ORDER BY p.name
	`
	
	rows, err := s.db.Query(query, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to query user permissions: %w", err)
	}
	defer rows.Close()

	var permissions []models.Permission
	for rows.Next() {
		var permission models.Permission
		err := rows.Scan(&permission.ID, &permission.Name, &permission.Resource, &permission.Action, &permission.Description, &permission.CreatedAt, &permission.UpdatedAt)
		if err != nil {
			return nil, fmt.Errorf("failed to scan permission: %w", err)
		}
		permissions = append(permissions, permission)
	}

	return permissions, nil
}

// HasPermission checks if a user has a specific permission
func (s *UserService) HasPermission(userID int64, resource, action string) (bool, error) {
	query := `
		SELECT EXISTS(
			SELECT 1
			FROM permissions p
			JOIN role_permissions rp ON p.id = rp.permission_id
			JOIN user_roles ur ON rp.role_id = ur.role_id
			WHERE ur.user_id = $1 AND p.resource = $2 AND p.action = $3
		)
	`
	
	var hasPermission bool
	err := s.db.QueryRow(query, userID, resource, action).Scan(&hasPermission)
	if err != nil {
		return false, fmt.Errorf("failed to check user permission: %w", err)
	}

	return hasPermission, nil
}

// Password Reset Methods

// CreatePasswordResetToken creates a new password reset token for a user
func (s *UserService) CreatePasswordResetToken(userID int64) (*models.PasswordResetToken, error) {
	tokenString, err := utils.GeneratePasswordResetToken()
	if err != nil {
		return nil, fmt.Errorf("failed to generate password reset token: %w", err)
	}

	resetToken := &models.PasswordResetToken{
		UserID:    userID,
		Token:     tokenString,
		ExpiresAt: time.Now().Add(1 * time.Hour), // 1 hour expiration
	}

	query := `
		INSERT INTO password_reset_tokens (user_id, token, expires_at)
		VALUES ($1, $2, $3)
		RETURNING id, created_at
	`

	err = s.db.QueryRow(query, resetToken.UserID, resetToken.Token, resetToken.ExpiresAt).Scan(
		&resetToken.ID,
		&resetToken.CreatedAt,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to create password reset token: %w", err)
	}

	return resetToken, nil
}

// GetPasswordResetToken retrieves a password reset token by token string
func (s *UserService) GetPasswordResetToken(token string) (*models.PasswordResetToken, error) {
	resetToken := &models.PasswordResetToken{}
	query := `
		SELECT id, user_id, token, expires_at, used_at, created_at
		FROM password_reset_tokens
		WHERE token = $1 AND used_at IS NULL
	`

	err := s.db.QueryRow(query, token).Scan(
		&resetToken.ID,
		&resetToken.UserID,
		&resetToken.Token,
		&resetToken.ExpiresAt,
		&resetToken.UsedAt,
		&resetToken.CreatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, errors.New("password reset token not found")
		}
		return nil, fmt.Errorf("failed to get password reset token: %w", err)
	}

	return resetToken, nil
}

// ValidatePasswordResetToken validates a password reset token
func (s *UserService) ValidatePasswordResetToken(token string) (*models.PasswordResetToken, error) {
	resetToken, err := s.GetPasswordResetToken(token)
	if err != nil {
		return nil, err
	}

	if time.Now().After(resetToken.ExpiresAt) {
		return nil, errors.New("password reset token expired")
	}

	return resetToken, nil
}

// UsePasswordResetToken marks a password reset token as used
func (s *UserService) UsePasswordResetToken(token string) error {
	query := `
		UPDATE password_reset_tokens
		SET used_at = CURRENT_TIMESTAMP
		WHERE token = $1 AND used_at IS NULL
	`

	result, err := s.db.Exec(query, token)
	if err != nil {
		return fmt.Errorf("failed to mark password reset token as used: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return errors.New("password reset token not found or already used")
	}

	return nil
}

// UpdateUserPassword updates a user's password
func (s *UserService) UpdateUserPassword(userID int64, newPassword string) error {
	// Hash the new password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return fmt.Errorf("failed to hash password: %w", err)
	}

	query := `
		UPDATE users
		SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
		WHERE id = $2 AND deleted_at IS NULL
	`

	result, err := s.db.Exec(query, string(hashedPassword), userID)
	if err != nil {
		return fmt.Errorf("failed to update user password: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return errors.New("user not found")
	}

	return nil
}

// RevokeAllPasswordResetTokens revokes all password reset tokens for a user
func (s *UserService) RevokeAllPasswordResetTokens(userID int64) error {
	query := `
		UPDATE password_reset_tokens
		SET used_at = CURRENT_TIMESTAMP
		WHERE user_id = $1 AND used_at IS NULL
	`

	_, err := s.db.Exec(query, userID)
	if err != nil {
		return fmt.Errorf("failed to revoke password reset tokens: %w", err)
	}

	return nil
}

// ValidateLaravelAPIToken validates a Laravel API token and returns the user
func (s *UserService) ValidateLaravelAPIToken(token string) (*models.User, error) {
	// Hash the token using SHA256 to match Laravel's storage format
	hasher := sha256.New()
	hasher.Write([]byte(token))
	hashedToken := hex.EncodeToString(hasher.Sum(nil))

	user := &models.User{}
	query := `
		SELECT id, name, email, password, first_name, last_name, status, ai_classification_yaml, registration_method, created_at, updated_at, deleted_at
		FROM users
		WHERE api_token = $1 
		AND api_token_expires_at > CURRENT_TIMESTAMP 
		AND deleted_at IS NULL
	`

	err := s.db.QueryRow(query, hashedToken).Scan(
		&user.ID,
		&user.Username,
		&user.Email,
		&user.PasswordHash,
		&user.FirstName,
		&user.LastName,
		&user.Status,
		&user.AIClassificationYAML,
		&user.RegistrationMethod,
		&user.CreatedAt,
		&user.UpdatedAt,
		&user.DeletedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, errors.New("invalid or expired API token")
		}
		return nil, fmt.Errorf("failed to validate API token: %w", err)
	}

	return user, nil
}

// AssignRole assigns a role to a user
func (s *UserService) AssignRole(userID int64, roleID int64) error {
	query := `
		INSERT INTO user_roles (user_id, role_id)
		VALUES ($1, $2)
		ON CONFLICT (user_id, role_id) DO NOTHING
	`
	
	_, err := s.db.Exec(query, userID, roleID)
	if err != nil {
		return fmt.Errorf("failed to assign role to user: %w", err)
	}

	return nil
}

// RemoveRole removes a role from a user
func (s *UserService) RemoveRole(userID int64, roleID int64) error {
	query := `DELETE FROM user_roles WHERE user_id = $1 AND role_id = $2`
	
	result, err := s.db.Exec(query, userID, roleID)
	if err != nil {
		return fmt.Errorf("failed to remove role from user: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("role assignment not found")
	}

	return nil
}