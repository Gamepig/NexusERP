package services

import (
	"database/sql"
	"fmt"
	"nexus-erp/backend/internal/models"

	"github.com/jmoiron/sqlx"
)

type PermissionService struct {
	db *sqlx.DB
}

func NewPermissionService(db *sqlx.DB) *PermissionService {
	return &PermissionService{db: db}
}

// GetAllPermissions retrieves all permissions from the database
func (s *PermissionService) GetAllPermissions() ([]models.Permission, error) {
	query := `
		SELECT id, name, resource, action, description, created_at, updated_at
		FROM permissions
		ORDER BY name
	`
	
	rows, err := s.db.Query(query)
	if err != nil {
		return nil, fmt.Errorf("failed to query permissions: %w", err)
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

// GetPermissionByID retrieves a permission by its ID
func (s *PermissionService) GetPermissionByID(id int64) (*models.Permission, error) {
	query := `
		SELECT id, name, resource, action, description, created_at, updated_at
		FROM permissions
		WHERE id = $1
	`
	
	var permission models.Permission
	err := s.db.QueryRow(query, id).Scan(&permission.ID, &permission.Name, &permission.Resource, &permission.Action, &permission.Description, &permission.CreatedAt, &permission.UpdatedAt)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("permission not found")
		}
		return nil, fmt.Errorf("failed to query permission: %w", err)
	}

	return &permission, nil
}

// GetPermissionByName retrieves a permission by its name
func (s *PermissionService) GetPermissionByName(name string) (*models.Permission, error) {
	query := `
		SELECT id, name, resource, action, description, created_at, updated_at
		FROM permissions
		WHERE name = $1
	`
	
	var permission models.Permission
	err := s.db.QueryRow(query, name).Scan(&permission.ID, &permission.Name, &permission.Resource, &permission.Action, &permission.Description, &permission.CreatedAt, &permission.UpdatedAt)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("permission not found")
		}
		return nil, fmt.Errorf("failed to query permission: %w", err)
	}

	return &permission, nil
}

// CreatePermission creates a new permission
func (s *PermissionService) CreatePermission(name, resource, action, description string) (*models.Permission, error) {
	query := `
		INSERT INTO permissions (name, resource, action, description)
		VALUES ($1, $2, $3, $4)
		RETURNING id, name, resource, action, description, created_at, updated_at
	`
	
	var permission models.Permission
	err := s.db.QueryRow(query, name, resource, action, description).Scan(&permission.ID, &permission.Name, &permission.Resource, &permission.Action, &permission.Description, &permission.CreatedAt, &permission.UpdatedAt)
	if err != nil {
		return nil, fmt.Errorf("failed to create permission: %w", err)
	}

	return &permission, nil
}

// UpdatePermission updates an existing permission
func (s *PermissionService) UpdatePermission(id int64, name, resource, action, description string) (*models.Permission, error) {
	query := `
		UPDATE permissions
		SET name = $2, resource = $3, action = $4, description = $5, updated_at = CURRENT_TIMESTAMP
		WHERE id = $1
		RETURNING id, name, resource, action, description, created_at, updated_at
	`
	
	var permission models.Permission
	err := s.db.QueryRow(query, id, name, resource, action, description).Scan(&permission.ID, &permission.Name, &permission.Resource, &permission.Action, &permission.Description, &permission.CreatedAt, &permission.UpdatedAt)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("permission not found")
		}
		return nil, fmt.Errorf("failed to update permission: %w", err)
	}

	return &permission, nil
}

// DeletePermission deletes a permission
func (s *PermissionService) DeletePermission(id int64) error {
	query := `DELETE FROM permissions WHERE id = $1`
	
	result, err := s.db.Exec(query, id)
	if err != nil {
		return fmt.Errorf("failed to delete permission: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("permission not found")
	}

	return nil
}