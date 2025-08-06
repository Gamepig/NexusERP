package services

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestPermissionService_CreatePermission(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()

	service := NewPermissionService(db)

	// Test successful permission creation
	permission, err := service.CreatePermission("test_permission", "test_resource", "read", "Test permission description")
	require.NoError(t, err)
	assert.NotZero(t, permission.ID)
	assert.Equal(t, "test_permission", permission.Name)
	assert.Equal(t, "test_resource", *permission.Resource)
	assert.Equal(t, "read", *permission.Action)
	assert.Equal(t, "Test permission description", *permission.Description)

	// Test duplicate permission creation
	_, err = service.CreatePermission("test_permission", "test_resource", "read", "Duplicate permission")
	assert.Error(t, err)
}

func TestPermissionService_GetPermissionByID(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()

	service := NewPermissionService(db)

	// Create a permission first
	createdPermission, err := service.CreatePermission("test_permission", "test_resource", "read", "Test permission description")
	require.NoError(t, err)

	// Test getting permission by ID
	permission, err := service.GetPermissionByID(createdPermission.ID)
	require.NoError(t, err)
	assert.Equal(t, createdPermission.ID, permission.ID)
	assert.Equal(t, "test_permission", permission.Name)

	// Test getting non-existent permission
	_, err = service.GetPermissionByID(99999)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "permission not found")
}

func TestPermissionService_GetPermissionByName(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()

	service := NewPermissionService(db)

	// Create a permission first
	createdPermission, err := service.CreatePermission("test_permission", "test_resource", "read", "Test permission description")
	require.NoError(t, err)

	// Test getting permission by name
	permission, err := service.GetPermissionByName("test_permission")
	require.NoError(t, err)
	assert.Equal(t, createdPermission.ID, permission.ID)
	assert.Equal(t, "test_permission", permission.Name)

	// Test getting non-existent permission
	_, err = service.GetPermissionByName("non_existent_permission")
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "permission not found")
}

func TestPermissionService_UpdatePermission(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()

	service := NewPermissionService(db)

	// Create a permission first
	createdPermission, err := service.CreatePermission("test_permission", "test_resource", "read", "Test permission description")
	require.NoError(t, err)

	// Test updating permission
	updatedPermission, err := service.UpdatePermission(createdPermission.ID, "updated_permission", "updated_resource", "write", "Updated description")
	require.NoError(t, err)
	assert.Equal(t, createdPermission.ID, updatedPermission.ID)
	assert.Equal(t, "updated_permission", updatedPermission.Name)
	assert.Equal(t, "updated_resource", *updatedPermission.Resource)
	assert.Equal(t, "write", *updatedPermission.Action)
	assert.Equal(t, "Updated description", *updatedPermission.Description)

	// Test updating non-existent permission
	_, err = service.UpdatePermission(99999, "updated_permission", "updated_resource", "write", "Updated description")
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "permission not found")
}

func TestPermissionService_DeletePermission(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()

	service := NewPermissionService(db)

	// Create a permission first
	createdPermission, err := service.CreatePermission("test_permission", "test_resource", "read", "Test permission description")
	require.NoError(t, err)

	// Test deleting permission
	err = service.DeletePermission(createdPermission.ID)
	require.NoError(t, err)

	// Verify permission is deleted
	_, err = service.GetPermissionByID(createdPermission.ID)
	assert.Error(t, err)

	// Test deleting non-existent permission
	err = service.DeletePermission(99999)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "permission not found")
}

func TestPermissionService_GetAllPermissions(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()

	service := NewPermissionService(db)

	// Create some permissions
	_, err := service.CreatePermission("permission1", "resource1", "read", "Permission 1 description")
	require.NoError(t, err)
	_, err = service.CreatePermission("permission2", "resource2", "write", "Permission 2 description")
	require.NoError(t, err)

	// Test getting all permissions
	permissions, err := service.GetAllPermissions()
	require.NoError(t, err)
	assert.GreaterOrEqual(t, len(permissions), 2) // At least 2 permissions we created
}