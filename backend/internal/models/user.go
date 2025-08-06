package models

import (
	"time"
	"encoding/json"
)

type User struct {
	ID                     int64           `json:"id" db:"id"`
	Username               string          `json:"name" db:"name"`
	Email                  string          `json:"email" db:"email"`
	PasswordHash           string          `json:"-" db:"password"`
	FirstName              *string         `json:"first_name,omitempty" db:"first_name"`
	LastName               *string         `json:"last_name,omitempty" db:"last_name"`
	Status                 string          `json:"status" db:"status"`
	AIClassificationYAML   *json.RawMessage `json:"ai_classification_yaml,omitempty" db:"ai_classification_yaml"`
	RegistrationMethod     *string         `json:"registration_method,omitempty" db:"registration_method"`
	CreatedAt              time.Time       `json:"created_at" db:"created_at"`
	UpdatedAt              time.Time       `json:"updated_at" db:"updated_at"`
	DeletedAt              *time.Time      `json:"deleted_at,omitempty" db:"deleted_at"`
}

type Role struct {
	ID          int64     `json:"id" db:"id"`
	Name        string    `json:"name" db:"name"`
	Description *string   `json:"description,omitempty" db:"description"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time `json:"updated_at" db:"updated_at"`
}

type Permission struct {
	ID          int64     `json:"id" db:"id"`
	Name        string    `json:"name" db:"name"`
	Resource    *string   `json:"resource,omitempty" db:"resource"`
	Action      *string   `json:"action,omitempty" db:"action"`
	Description *string   `json:"description,omitempty" db:"description"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time `json:"updated_at" db:"updated_at"`
}

type UserRole struct {
	UserID int64 `json:"user_id" db:"user_id"`
	RoleID int64 `json:"role_id" db:"role_id"`
}

type RolePermission struct {
	RoleID       int64 `json:"role_id" db:"role_id"`
	PermissionID int64 `json:"permission_id" db:"permission_id"`
}

type PasswordResetToken struct {
	ID        int64      `json:"id" db:"id"`
	UserID    int64      `json:"user_id" db:"user_id"`
	Token     string     `json:"token" db:"token"`
	ExpiresAt time.Time  `json:"expires_at" db:"expires_at"`
	UsedAt    *time.Time `json:"used_at,omitempty" db:"used_at"`
	CreatedAt time.Time  `json:"created_at" db:"created_at"`
}

type RefreshToken struct {
	ID        int64      `json:"id" db:"id"`
	UserID    int64      `json:"user_id" db:"user_id"`
	Token     string     `json:"token" db:"token"`
	ExpiresAt time.Time  `json:"expires_at" db:"expires_at"`
	RevokedAt *time.Time `json:"revoked_at,omitempty" db:"revoked_at"`
	CreatedAt time.Time  `json:"created_at" db:"created_at"`
}

// UserWithRoles represents a user with their assigned roles
type UserWithRoles struct {
	User
	Roles []Role `json:"roles"`
}

// CreateUserRequest represents the request body for user registration
type CreateUserRequest struct {
	Name                   string          `json:"name" binding:"required"`
	Email                  string          `json:"email" binding:"required,email"`
	Password               string          `json:"password" binding:"required,min=6"`
	FirstName              *string         `json:"first_name,omitempty"`
	LastName               *string         `json:"last_name,omitempty"`
	AIClassificationYAML   *json.RawMessage `json:"ai_classification_yaml,omitempty"`
	RegistrationMethod     *string         `json:"registration_method,omitempty"`
}

// LoginRequest represents the request body for user login
type LoginRequest struct {
	Name string `json:"name" binding:"required"`
	Password string `json:"password" binding:"required"`
}

// LoginByEmailRequest represents the request body for user login by email
type LoginByEmailRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

// LoginResponse represents the response body for successful login
type LoginResponse struct {
	User         User   `json:"user"`
	Token        string `json:"token"`
	RefreshToken string `json:"refresh_token"`
}

// RefreshTokenRequest represents the request body for token refresh
type RefreshTokenRequest struct {
	RefreshToken string `json:"refresh_token" binding:"required"`
}

// ForgotPasswordRequest represents the request body for password reset
type ForgotPasswordRequest struct {
	Email string `json:"email" binding:"required,email"`
}

// ResetPasswordRequest represents the request body for password reset
type ResetPasswordRequest struct {
	Token       string `json:"token" binding:"required"`
	NewPassword string `json:"new_password" binding:"required,min=6"`
}

// UserResponse represents the response body for user operations
type UserResponse struct {
	ID                   int64           `json:"id"`
	Username             string          `json:"name"`
	Email                string          `json:"email"`
	FirstName            *string         `json:"first_name,omitempty"`
	LastName             *string         `json:"last_name,omitempty"`
	Status               string          `json:"status"`
	AIClassificationYAML *json.RawMessage `json:"ai_classification_yaml,omitempty"`
	RegistrationMethod   *string         `json:"registration_method,omitempty"`
	CreatedAt            time.Time       `json:"created_at"`
	UpdatedAt            time.Time       `json:"updated_at"`
}

// AIRegistrationRequest represents the request body for AI-guided registration
type AIRegistrationRequest struct {
	Name                 string  `json:"name" binding:"required"`
	Email                string  `json:"email" binding:"required,email"`
	Password             string  `json:"password" binding:"required,min=6"`
	BusinessDescription  string  `json:"business_description" binding:"required,min=10"`
	FirstName            *string `json:"first_name,omitempty"`
	LastName             *string `json:"last_name,omitempty"`
}

// BusinessClassification represents the AI-classified business structure
type BusinessClassification struct {
	Industry         string   `json:"industry" yaml:"industry"`
	BusinessType     string   `json:"business_type" yaml:"business_type"`
	BusinessUnits    []string `json:"business_units" yaml:"business_units"`
	PrimaryActivities []string `json:"primary_activities" yaml:"primary_activities"`
	Scale            string   `json:"scale" yaml:"scale"`
	Complexity       string   `json:"complexity" yaml:"complexity"`
	Confidence       float64  `json:"confidence" yaml:"confidence"`
}

// AIRegistrationResponse represents the response body for AI registration
type AIRegistrationResponse struct {
	Message               string                 `json:"message"`
	User                  UserResponse           `json:"user"`
	Classification        BusinessClassification `json:"classification"`
	ClassificationYAML    string                 `json:"classification_yaml"`
	RequiresConfirmation  bool                   `json:"requires_confirmation"`
}

// ToUserResponse converts a User to UserResponse (removes sensitive fields)
func (u *User) ToUserResponse() UserResponse {
	return UserResponse{
		ID:                   u.ID,
		Username:             u.Username,
		Email:                u.Email,
		FirstName:            u.FirstName,
		LastName:             u.LastName,
		Status:               u.Status,
		AIClassificationYAML: u.AIClassificationYAML,
		RegistrationMethod:   u.RegistrationMethod,
		CreatedAt:            u.CreatedAt,
		UpdatedAt:            u.UpdatedAt,
	}
}

// RBAC Request/Response Models

// CreateRoleRequest represents the request body for creating a role
type CreateRoleRequest struct {
	Name        string `json:"name" binding:"required"`
	Description string `json:"description"`
}

// UpdateRoleRequest represents the request body for updating a role
type UpdateRoleRequest struct {
	Name        string `json:"name" binding:"required"`
	Description string `json:"description"`
}

// CreatePermissionRequest represents the request body for creating a permission
type CreatePermissionRequest struct {
	Name        string `json:"name" binding:"required"`
	Resource    string `json:"resource"`
	Action      string `json:"action"`
	Description string `json:"description"`
}

// UpdatePermissionRequest represents the request body for updating a permission
type UpdatePermissionRequest struct {
	Name        string `json:"name" binding:"required"`
	Resource    string `json:"resource"`
	Action      string `json:"action"`
	Description string `json:"description"`
}

// AssignRoleRequest represents the request body for assigning a role to a user
type AssignRoleRequest struct {
	UserID int64 `json:"user_id" binding:"required"`
	RoleID int64 `json:"role_id" binding:"required"`
}

// AssignPermissionRequest represents the request body for assigning a permission to a role
type AssignPermissionRequest struct {
	RoleID       int64 `json:"role_id" binding:"required"`
	PermissionID int64 `json:"permission_id" binding:"required"`
}

// UserRolesResponse represents the response body for user roles
type UserRolesResponse struct {
	UserID int64  `json:"user_id"`
	Roles  []Role `json:"roles"`
}

// UserPermissionsResponse represents the response body for user permissions
type UserPermissionsResponse struct {
	UserID      int64        `json:"user_id"`
	Permissions []Permission `json:"permissions"`
}

// RolePermissionsResponse represents the response body for role permissions
type RolePermissionsResponse struct {
	RoleID      int64        `json:"role_id"`
	Permissions []Permission `json:"permissions"`
}