package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"nexus-erp/backend/internal/models"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)


func TestRequirePermission_Success(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockUserService := &MockUserService{}
	mockUserService.On("HasPermission", int64(1), "test_resource", "read").Return(true, nil)

	router := gin.New()
	router.Use(func(c *gin.Context) {
		c.Set("user_id", int64(1))
		c.Next()
	})
	router.GET("/test", RequirePermission(mockUserService, "test_resource", "read"), func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "success"})
	})

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/test", nil)
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	mockUserService.AssertExpectations(t)
}

func TestRequirePermission_Forbidden(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockUserService := &MockUserService{}
	mockUserService.On("HasPermission", int64(1), "test_resource", "read").Return(false, nil)

	router := gin.New()
	router.Use(func(c *gin.Context) {
		c.Set("user_id", int64(1))
		c.Next()
	})
	router.GET("/test", RequirePermission(mockUserService, "test_resource", "read"), func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "success"})
	})

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/test", nil)
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusForbidden, w.Code)
	mockUserService.AssertExpectations(t)
}

func TestRequirePermission_NoUserID(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockUserService := &MockUserService{}

	router := gin.New()
	router.GET("/test", RequirePermission(mockUserService, "test_resource", "read"), func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "success"})
	})

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/test", nil)
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusUnauthorized, w.Code)
}

func TestRequireRole_Success(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockUserService := &MockUserService{}
	roles := []models.Role{{ID: 1, Name: "admin"}}
	mockUserService.On("GetUserRoles", int64(1)).Return(roles, nil)

	router := gin.New()
	router.Use(func(c *gin.Context) {
		c.Set("user_id", int64(1))
		c.Next()
	})
	router.GET("/test", RequireRole(mockUserService, "admin"), func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "success"})
	})

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/test", nil)
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	mockUserService.AssertExpectations(t)
}

func TestRequireRole_Forbidden(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockUserService := &MockUserService{}
	roles := []models.Role{{ID: 1, Name: "user"}}
	mockUserService.On("GetUserRoles", int64(1)).Return(roles, nil)

	router := gin.New()
	router.Use(func(c *gin.Context) {
		c.Set("user_id", int64(1))
		c.Next()
	})
	router.GET("/test", RequireRole(mockUserService, "admin"), func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "success"})
	})

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/test", nil)
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusForbidden, w.Code)
	mockUserService.AssertExpectations(t)
}

func TestRequireAdmin_Success(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockUserService := &MockUserService{}
	roles := []models.Role{{ID: 1, Name: "admin"}}
	mockUserService.On("GetUserRoles", int64(1)).Return(roles, nil)

	router := gin.New()
	router.Use(func(c *gin.Context) {
		c.Set("user_id", int64(1))
		c.Next()
	})
	router.GET("/test", RequireAdmin(mockUserService), func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "success"})
	})

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/test", nil)
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	mockUserService.AssertExpectations(t)
}

func TestRequireManagerOrAdmin_Manager(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockUserService := &MockUserService{}
	roles := []models.Role{{ID: 1, Name: "manager"}}
	mockUserService.On("GetUserRoles", int64(1)).Return(roles, nil)

	router := gin.New()
	router.Use(func(c *gin.Context) {
		c.Set("user_id", int64(1))
		c.Next()
	})
	router.GET("/test", RequireManagerOrAdmin(mockUserService), func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "success"})
	})

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/test", nil)
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	mockUserService.AssertExpectations(t)
}

func TestRequireManagerOrAdmin_Admin(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockUserService := &MockUserService{}
	roles := []models.Role{{ID: 1, Name: "admin"}}
	mockUserService.On("GetUserRoles", int64(1)).Return(roles, nil)

	router := gin.New()
	router.Use(func(c *gin.Context) {
		c.Set("user_id", int64(1))
		c.Next()
	})
	router.GET("/test", RequireManagerOrAdmin(mockUserService), func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "success"})
	})

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/test", nil)
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	mockUserService.AssertExpectations(t)
}

func TestRequireManagerOrAdmin_Forbidden(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockUserService := &MockUserService{}
	roles := []models.Role{{ID: 1, Name: "user"}}
	mockUserService.On("GetUserRoles", int64(1)).Return(roles, nil)

	router := gin.New()
	router.Use(func(c *gin.Context) {
		c.Set("user_id", int64(1))
		c.Next()
	})
	router.GET("/test", RequireManagerOrAdmin(mockUserService), func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "success"})
	})

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/test", nil)
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusForbidden, w.Code)
	mockUserService.AssertExpectations(t)
}