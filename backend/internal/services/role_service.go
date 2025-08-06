package services

import (
	"database/sql"
	"fmt"
	"nexus-erp/backend/internal/models"

	"github.com/jmoiron/sqlx"
)

type RoleService struct {
	db *sqlx.DB
}

func NewRoleService(db *sqlx.DB) *RoleService {
	return &RoleService{db: db}
}

// GetAllRoles retrieves all roles from the database
func (s *RoleService) GetAllRoles() ([]models.Role, error) {
	query := `
		SELECT id, name, description, created_at, updated_at
		FROM roles
		ORDER BY name
	`
	
	rows, err := s.db.Query(query)
	if err != nil {
		return nil, fmt.Errorf("failed to query roles: %w", err)
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

// GetRoleByID retrieves a role by its ID
func (s *RoleService) GetRoleByID(id int64) (*models.Role, error) {
	query := `
		SELECT id, name, description, created_at, updated_at
		FROM roles
		WHERE id = $1
	`
	
	var role models.Role
	err := s.db.QueryRow(query, id).Scan(&role.ID, &role.Name, &role.Description, &role.CreatedAt, &role.UpdatedAt)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("role not found")
		}
		return nil, fmt.Errorf("failed to query role: %w", err)
	}

	return &role, nil
}

// GetRoleByName retrieves a role by its name
func (s *RoleService) GetRoleByName(name string) (*models.Role, error) {
	query := `
		SELECT id, name, description, created_at, updated_at
		FROM roles
		WHERE name = $1
	`
	
	var role models.Role
	err := s.db.QueryRow(query, name).Scan(&role.ID, &role.Name, &role.Description, &role.CreatedAt, &role.UpdatedAt)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("role not found")
		}
		return nil, fmt.Errorf("failed to query role: %w", err)
	}

	return &role, nil
}

// CreateRole creates a new role
func (s *RoleService) CreateRole(name, description string) (*models.Role, error) {
	query := `
		INSERT INTO roles (name, description)
		VALUES ($1, $2)
		RETURNING id, name, description, created_at, updated_at
	`
	
	var role models.Role
	err := s.db.QueryRow(query, name, description).Scan(&role.ID, &role.Name, &role.Description, &role.CreatedAt, &role.UpdatedAt)
	if err != nil {
		return nil, fmt.Errorf("failed to create role: %w", err)
	}

	return &role, nil
}

// UpdateRole updates an existing role
func (s *RoleService) UpdateRole(id int64, name, description string) (*models.Role, error) {
	query := `
		UPDATE roles
		SET name = $2, description = $3, updated_at = CURRENT_TIMESTAMP
		WHERE id = $1
		RETURNING id, name, description, created_at, updated_at
	`
	
	var role models.Role
	err := s.db.QueryRow(query, id, name, description).Scan(&role.ID, &role.Name, &role.Description, &role.CreatedAt, &role.UpdatedAt)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("role not found")
		}
		return nil, fmt.Errorf("failed to update role: %w", err)
	}

	return &role, nil
}

// DeleteRole deletes a role
func (s *RoleService) DeleteRole(id int64) error {
	query := `DELETE FROM roles WHERE id = $1`
	
	result, err := s.db.Exec(query, id)
	if err != nil {
		return fmt.Errorf("failed to delete role: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("role not found")
	}

	return nil
}

// GetRolePermissions retrieves all permissions for a role
func (s *RoleService) GetRolePermissions(roleID int64) ([]models.Permission, error) {
	query := `
		SELECT p.id, p.name, p.resource, p.action, p.description, p.created_at, p.updated_at
		FROM permissions p
		JOIN role_permissions rp ON p.id = rp.permission_id
		WHERE rp.role_id = $1
		ORDER BY p.name
	`
	
	rows, err := s.db.Query(query, roleID)
	if err != nil {
		return nil, fmt.Errorf("failed to query role permissions: %w", err)
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

// AssignPermission assigns a permission to a role
func (s *RoleService) AssignPermission(roleID int64, permissionID int64) error {
	query := `
		INSERT INTO role_permissions (role_id, permission_id)
		VALUES ($1, $2)
		ON CONFLICT (role_id, permission_id) DO NOTHING
	`
	
	_, err := s.db.Exec(query, roleID, permissionID)
	if err != nil {
		return fmt.Errorf("failed to assign permission to role: %w", err)
	}

	return nil
}

// RemovePermission removes a permission from a role
func (s *RoleService) RemovePermission(roleID int64, permissionID int64) error {
	query := `DELETE FROM role_permissions WHERE role_id = $1 AND permission_id = $2`
	
	result, err := s.db.Exec(query, roleID, permissionID)
	if err != nil {
		return fmt.Errorf("failed to remove permission from role: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("permission assignment not found")
	}

	return nil
}