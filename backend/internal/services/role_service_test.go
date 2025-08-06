package services

import (
	"database/sql"
	"testing"

	_ "github.com/lib/pq"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestRoleService_CreateRole(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()

	service := NewRoleService(db)

	// Test successful role creation
	role, err := service.CreateRole("test_role", "Test role description")
	require.NoError(t, err)
	assert.NotZero(t, role.ID)
	assert.Equal(t, "test_role", role.Name)
	assert.Equal(t, "Test role description", *role.Description)

	// Test duplicate role creation
	_, err = service.CreateRole("test_role", "Duplicate role")
	assert.Error(t, err)
}

func TestRoleService_GetRoleByID(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()

	service := NewRoleService(db)

	// Create a role first
	createdRole, err := service.CreateRole("test_role", "Test role description")
	require.NoError(t, err)

	// Test getting role by ID
	role, err := service.GetRoleByID(createdRole.ID)
	require.NoError(t, err)
	assert.Equal(t, createdRole.ID, role.ID)
	assert.Equal(t, "test_role", role.Name)

	// Test getting non-existent role
	_, err = service.GetRoleByID(99999)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "role not found")
}

func TestRoleService_GetRoleByName(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()

	service := NewRoleService(db)

	// Create a role first
	createdRole, err := service.CreateRole("test_role", "Test role description")
	require.NoError(t, err)

	// Test getting role by name
	role, err := service.GetRoleByName("test_role")
	require.NoError(t, err)
	assert.Equal(t, createdRole.ID, role.ID)
	assert.Equal(t, "test_role", role.Name)

	// Test getting non-existent role
	_, err = service.GetRoleByName("non_existent_role")
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "role not found")
}

func TestRoleService_UpdateRole(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()

	service := NewRoleService(db)

	// Create a role first
	createdRole, err := service.CreateRole("test_role", "Test role description")
	require.NoError(t, err)

	// Test updating role
	updatedRole, err := service.UpdateRole(createdRole.ID, "updated_role", "Updated description")
	require.NoError(t, err)
	assert.Equal(t, createdRole.ID, updatedRole.ID)
	assert.Equal(t, "updated_role", updatedRole.Name)
	assert.Equal(t, "Updated description", *updatedRole.Description)

	// Test updating non-existent role
	_, err = service.UpdateRole(99999, "updated_role", "Updated description")
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "role not found")
}

func TestRoleService_DeleteRole(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()

	service := NewRoleService(db)

	// Create a role first
	createdRole, err := service.CreateRole("test_role", "Test role description")
	require.NoError(t, err)

	// Test deleting role
	err = service.DeleteRole(createdRole.ID)
	require.NoError(t, err)

	// Verify role is deleted
	_, err = service.GetRoleByID(createdRole.ID)
	assert.Error(t, err)

	// Test deleting non-existent role
	err = service.DeleteRole(99999)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "role not found")
}

func TestRoleService_GetAllRoles(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()

	service := NewRoleService(db)

	// Create some roles
	_, err := service.CreateRole("role1", "Role 1 description")
	require.NoError(t, err)
	_, err = service.CreateRole("role2", "Role 2 description")
	require.NoError(t, err)

	// Test getting all roles
	roles, err := service.GetAllRoles()
	require.NoError(t, err)
	assert.GreaterOrEqual(t, len(roles), 2) // At least 2 roles we created plus any default roles
}

func TestRoleService_AssignAndRemovePermission(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()

	roleService := NewRoleService(db)
	permissionService := NewPermissionService(db)

	// Create a role and permission
	role, err := roleService.CreateRole("test_role", "Test role")
	require.NoError(t, err)

	permission, err := permissionService.CreatePermission("test_permission", "test_resource", "read", "Test permission")
	require.NoError(t, err)

	// Test assigning permission to role
	err = roleService.AssignPermission(role.ID, permission.ID)
	require.NoError(t, err)

	// Verify permission is assigned
	permissions, err := roleService.GetRolePermissions(role.ID)
	require.NoError(t, err)
	assert.Len(t, permissions, 1)
	assert.Equal(t, permission.ID, permissions[0].ID)

	// Test removing permission from role
	err = roleService.RemovePermission(role.ID, permission.ID)
	require.NoError(t, err)

	// Verify permission is removed
	permissions, err = roleService.GetRolePermissions(role.ID)
	require.NoError(t, err)
	assert.Len(t, permissions, 0)
}

// Helper function to setup test database
func setupTestDB(t *testing.T) *sql.DB {
	db, err := sql.Open("postgres", "postgres://test:test@localhost/nexus_erp_test?sslmode=disable")
	require.NoError(t, err)

	// Clean up tables before each test
	_, err = db.Exec("DELETE FROM role_permissions")
	require.NoError(t, err)
	_, err = db.Exec("DELETE FROM user_roles")
	require.NoError(t, err)
	_, err = db.Exec("DELETE FROM permissions WHERE name LIKE 'test_%'")
	require.NoError(t, err)
	_, err = db.Exec("DELETE FROM roles WHERE name LIKE 'test_%'")
	require.NoError(t, err)

	return db
}