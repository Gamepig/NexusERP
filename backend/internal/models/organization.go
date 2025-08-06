package models

import (
	"time"
	"encoding/json"
)

// Company represents a company entity in the multi-company system
type Company struct {
	ID                 int64           `json:"id" db:"id"`
	Name               string          `json:"name" db:"name"`
	DisplayName        *string         `json:"display_name,omitempty" db:"display_name"`
	RegistrationNumber *string         `json:"registration_number,omitempty" db:"registration_number"`
	TaxNumber          *string         `json:"tax_number,omitempty" db:"tax_number"`
	Email              *string         `json:"email,omitempty" db:"email"`
	Phone              *string         `json:"phone,omitempty" db:"phone"`
	Website            *string         `json:"website,omitempty" db:"website"`
	Address            *json.RawMessage `json:"address,omitempty" db:"address"`
	Industry           *string         `json:"industry,omitempty" db:"industry"`
	Size               *string         `json:"size,omitempty" db:"size"`
	CurrencyCode       string          `json:"currency_code" db:"currency_code"`
	Timezone           string          `json:"timezone" db:"timezone"`
	Locale             string          `json:"locale" db:"locale"`
	IsActive           bool            `json:"is_active" db:"is_active"`
	Settings           *json.RawMessage `json:"settings,omitempty" db:"settings"`
	Metadata           *json.RawMessage `json:"metadata,omitempty" db:"metadata"`
	CreatedAt          time.Time       `json:"created_at" db:"created_at"`
	UpdatedAt          time.Time       `json:"updated_at" db:"updated_at"`
	DeletedAt          *time.Time      `json:"deleted_at,omitempty" db:"deleted_at"`
}

// BusinessUnit represents a business unit within a company
type BusinessUnit struct {
	ID          int64           `json:"id" db:"id"`
	CompanyID   int64           `json:"company_id" db:"company_id"`
	ParentID    *int64          `json:"parent_id,omitempty" db:"parent_id"`
	Name        string          `json:"name" db:"name"`
	DisplayName *string         `json:"display_name,omitempty" db:"display_name"`
	Description *string         `json:"description,omitempty" db:"description"`
	Type        string          `json:"type" db:"type"`
	Code        *string         `json:"code,omitempty" db:"code"`
	Email       *string         `json:"email,omitempty" db:"email"`
	Phone       *string         `json:"phone,omitempty" db:"phone"`
	Address     *json.RawMessage `json:"address,omitempty" db:"address"`
	IsActive    bool            `json:"is_active" db:"is_active"`
	SortOrder   int             `json:"sort_order" db:"sort_order"`
	Settings    *json.RawMessage `json:"settings,omitempty" db:"settings"`
	Metadata    *json.RawMessage `json:"metadata,omitempty" db:"metadata"`
	CreatedAt   time.Time       `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time       `json:"updated_at" db:"updated_at"`
	DeletedAt   *time.Time      `json:"deleted_at,omitempty" db:"deleted_at"`
}

// UserCompany represents the many-to-many relationship between users and companies
type UserCompany struct {
	ID        int64      `json:"id" db:"id"`
	UserID    int64      `json:"user_id" db:"user_id"`
	CompanyID int64      `json:"company_id" db:"company_id"`
	IsPrimary bool       `json:"is_primary" db:"is_primary"`
	IsActive  bool       `json:"is_active" db:"is_active"`
	JoinedAt  time.Time  `json:"joined_at" db:"joined_at"`
	LeftAt    *time.Time `json:"left_at,omitempty" db:"left_at"`
	CreatedAt time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt time.Time  `json:"updated_at" db:"updated_at"`
}

// UserBusinessUnit represents the many-to-many relationship between users and business units
type UserBusinessUnit struct {
	ID             int64      `json:"id" db:"id"`
	UserID         int64      `json:"user_id" db:"user_id"`
	BusinessUnitID int64      `json:"business_unit_id" db:"business_unit_id"`
	IsPrimary      bool       `json:"is_primary" db:"is_primary"`
	IsActive       bool       `json:"is_active" db:"is_active"`
	JoinedAt       time.Time  `json:"joined_at" db:"joined_at"`
	LeftAt         *time.Time `json:"left_at,omitempty" db:"left_at"`
	CreatedAt      time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt      time.Time  `json:"updated_at" db:"updated_at"`
}

// Request/Response Models

// CreateCompanyRequest represents the request structure for creating a company
type CreateCompanyRequest struct {
	Name               string          `json:"name" binding:"required"`
	DisplayName        string          `json:"display_name"`
	RegistrationNumber string          `json:"registration_number"`
	TaxNumber          string          `json:"tax_number"`
	Email              string          `json:"email"`
	Phone              string          `json:"phone"`
	Website            string          `json:"website"`
	Address            *json.RawMessage `json:"address,omitempty"`
	Industry           string          `json:"industry"`
	Size               string          `json:"size"`
	CurrencyCode       string          `json:"currency_code"`
	Timezone           string          `json:"timezone"`
	Locale             string          `json:"locale"`
}

// UpdateCompanyRequest represents the request structure for updating a company
type UpdateCompanyRequest struct {
	Name               *string         `json:"name,omitempty"`
	DisplayName        *string         `json:"display_name,omitempty"`
	RegistrationNumber *string         `json:"registration_number,omitempty"`
	TaxNumber          *string         `json:"tax_number,omitempty"`
	Email              *string         `json:"email,omitempty"`
	Phone              *string         `json:"phone,omitempty"`
	Website            *string         `json:"website,omitempty"`
	Address            *json.RawMessage `json:"address,omitempty"`
	Industry           *string         `json:"industry,omitempty"`
	Size               *string         `json:"size,omitempty"`
	CurrencyCode       *string         `json:"currency_code,omitempty"`
	Timezone           *string         `json:"timezone,omitempty"`
	Locale             *string         `json:"locale,omitempty"`
	IsActive           *bool           `json:"is_active,omitempty"`
}

// CreateBusinessUnitRequest represents the request structure for creating a business unit
type CreateBusinessUnitRequest struct {
	CompanyID   int64           `json:"company_id" binding:"required"`
	ParentID    *int64          `json:"parent_id,omitempty"`
	Name        string          `json:"name" binding:"required"`
	DisplayName string          `json:"display_name"`
	Description string          `json:"description"`
	Type        string          `json:"type"`
	Code        string          `json:"code"`
	Email       string          `json:"email"`
	Phone       string          `json:"phone"`
	Address     *json.RawMessage `json:"address,omitempty"`
}

// UpdateBusinessUnitRequest represents the request structure for updating a business unit
type UpdateBusinessUnitRequest struct {
	ParentID    *int64          `json:"parent_id,omitempty"`
	Name        *string         `json:"name,omitempty"`
	DisplayName *string         `json:"display_name,omitempty"`
	Description *string         `json:"description,omitempty"`
	Type        *string         `json:"type,omitempty"`
	Code        *string         `json:"code,omitempty"`
	Email       *string         `json:"email,omitempty"`
	Phone       *string         `json:"phone,omitempty"`
	Address     *json.RawMessage `json:"address,omitempty"`
	IsActive    *bool           `json:"is_active,omitempty"`
	SortOrder   *int            `json:"sort_order,omitempty"`
}

// AssignUserToCompanyRequest represents the request structure for assigning a user to a company
type AssignUserToCompanyRequest struct {
	UserID    int64 `json:"user_id" binding:"required"`
	CompanyID int64 `json:"company_id" binding:"required"`
	IsPrimary bool  `json:"is_primary"`
}

// AssignUserToBusinessUnitRequest represents the request structure for assigning a user to a business unit
type AssignUserToBusinessUnitRequest struct {
	UserID         int64 `json:"user_id" binding:"required"`
	BusinessUnitID int64 `json:"business_unit_id" binding:"required"`
	IsPrimary      bool  `json:"is_primary"`
}