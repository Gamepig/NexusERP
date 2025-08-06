package services

import (
	"testing"

	"nexus-erp/backend/internal/models"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestUserService_AssignAndRemoveRole(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()

	userService := NewUserService(db)
	roleService := NewRoleService(db)

	// Create a user
	req := &models.CreateUserRequest{
		Name:     "testuser",
		Email:    "test@example.com",
		Password: "password123",
	}
	user, err := userService.CreateUser(req)
	require.NoError(t, err)

	// Create a role
	role, err := roleService.CreateRole("test_role", "Test role")
	require.NoError(t, err)

	// Test assigning role to user
	err = userService.AssignRole(user.ID, role.ID)
	require.NoError(t, err)

	// Verify role is assigned
	roles, err := userService.GetUserRoles(user.ID)
	require.NoError(t, err)
	assert.Len(t, roles, 1)
	assert.Equal(t, role.ID, roles[0].ID)

	// Test removing role from user
	err = userService.RemoveRole(user.ID, role.ID)
	require.NoError(t, err)

	// Verify role is removed
	roles, err = userService.GetUserRoles(user.ID)
	require.NoError(t, err)
	assert.Len(t, roles, 0)
}

func TestUserService_GetUserPermissions(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()

	userService := NewUserService(db)
	roleService := NewRoleService(db)
	permissionService := NewPermissionService(db)

	// Create a user
	req := &models.CreateUserRequest{
		Name:     "testuser",
		Email:    "test@example.com",
		Password: "password123",
	}
	user, err := userService.CreateUser(req)
	require.NoError(t, err)

	// Create a role
	role, err := roleService.CreateRole("test_role", "Test role")
	require.NoError(t, err)

	// Create permissions
	permission1, err := permissionService.CreatePermission("permission1", "resource1", "read", "Permission 1")
	require.NoError(t, err)
	permission2, err := permissionService.CreatePermission("permission2", "resource2", "write", "Permission 2")
	require.NoError(t, err)

	// Assign permissions to role
	err = roleService.AssignPermission(role.ID, permission1.ID)
	require.NoError(t, err)
	err = roleService.AssignPermission(role.ID, permission2.ID)
	require.NoError(t, err)

	// Assign role to user
	err = userService.AssignRole(user.ID, role.ID)
	require.NoError(t, err)

	// Test getting user permissions
	permissions, err := userService.GetUserPermissions(user.ID)
	require.NoError(t, err)
	assert.Len(t, permissions, 2)

	// Verify permissions are correct
	permissionNames := make(map[string]bool)
	for _, p := range permissions {
		permissionNames[p.Name] = true
	}
	assert.True(t, permissionNames["permission1"])
	assert.True(t, permissionNames["permission2"])
}

func TestUserService_HasPermission(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()

	userService := NewUserService(db)
	roleService := NewRoleService(db)
	permissionService := NewPermissionService(db)

	// Create a user
	req := &models.CreateUserRequest{
		Name:     "testuser",
		Email:    "test@example.com",
		Password: "password123",
	}
	user, err := userService.CreateUser(req)
	require.NoError(t, err)

	// Create a role
	role, err := roleService.CreateRole("test_role", "Test role")
	require.NoError(t, err)

	// Create a permission
	permission, err := permissionService.CreatePermission("test_permission", "test_resource", "read", "Test permission")
	require.NoError(t, err)

	// Assign permission to role
	err = roleService.AssignPermission(role.ID, permission.ID)
	require.NoError(t, err)

	// Assign role to user
	err = userService.AssignRole(user.ID, role.ID)
	require.NoError(t, err)

	// Test user has permission
	hasPermission, err := userService.HasPermission(user.ID, "test_resource", "read")
	require.NoError(t, err)
	assert.True(t, hasPermission)

	// Test user doesn't have permission
	hasPermission, err = userService.HasPermission(user.ID, "other_resource", "write")
	require.NoError(t, err)
	assert.False(t, hasPermission)
}

func TestUserService_GetUserRoles(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()

	userService := NewUserService(db)
	roleService := NewRoleService(db)

	// Create a user
	req := &models.CreateUserRequest{
		Name:     "testuser",
		Email:    "test@example.com",
		Password: "password123",
	}
	user, err := userService.CreateUser(req)
	require.NoError(t, err)

	// Create roles
	role1, err := roleService.CreateRole("role1", "Role 1")
	require.NoError(t, err)
	role2, err := roleService.CreateRole("role2", "Role 2")
	require.NoError(t, err)

	// Assign roles to user
	err = userService.AssignRole(user.ID, role1.ID)
	require.NoError(t, err)
	err = userService.AssignRole(user.ID, role2.ID)
	require.NoError(t, err)

	// Test getting user roles
	roles, err := userService.GetUserRoles(user.ID)
	require.NoError(t, err)
	assert.Len(t, roles, 2)

	// Verify roles are correct
	roleNames := make(map[string]bool)
	for _, r := range roles {
		roleNames[r.Name] = true
	}
	assert.True(t, roleNames["role1"])
	assert.True(t, roleNames["role2"])
}

func TestUserService_AssignRole_Duplicate(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()

	userService := NewUserService(db)
	roleService := NewRoleService(db)

	// Create a user
	req := &models.CreateUserRequest{
		Name:     "testuser",
		Email:    "test@example.com",
		Password: "password123",
	}
	user, err := userService.CreateUser(req)
	require.NoError(t, err)

	// Create a role
	role, err := roleService.CreateRole("test_role", "Test role")
	require.NoError(t, err)

	// Assign role to user
	err = userService.AssignRole(user.ID, role.ID)
	require.NoError(t, err)

	// Try to assign same role again (should not error due to ON CONFLICT DO NOTHING)
	err = userService.AssignRole(user.ID, role.ID)
	require.NoError(t, err)

	// Verify user still has only one role
	roles, err := userService.GetUserRoles(user.ID)
	require.NoError(t, err)
	assert.Len(t, roles, 1)
}

func TestUserService_RemoveRole_NotFound(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()

	userService := NewUserService(db)
	roleService := NewRoleService(db)

	// Create a user
	req := &models.CreateUserRequest{
		Name:     "testuser",
		Email:    "test@example.com",
		Password: "password123",
	}
	user, err := userService.CreateUser(req)
	require.NoError(t, err)

	// Create a role
	role, err := roleService.CreateRole("test_role", "Test role")
	require.NoError(t, err)

	// Try to remove role that wasn't assigned
	err = userService.RemoveRole(user.ID, role.ID)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "role assignment not found")
}