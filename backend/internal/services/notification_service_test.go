package services

import (
	"context"
	"testing"
	"time"

	"nexus-erp/backend/internal/models"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// MockNotificationService is a mock implementation of NotificationService for testing
type MockNotificationService struct {
	mock.Mock
}

func (m *MockNotificationService) SendInventoryAlertNotification(ctx context.Context, alert *models.InventoryAlertWithDetails) error {
	args := m.Called(ctx, alert)
	return args.Error(0)
}

func (m *MockNotificationService) SendEmailNotification(ctx context.Context, to, subject, body string) error {
	args := m.Called(ctx, to, subject, body)
	return args.Error(0)
}

func (m *MockNotificationService) ProcessPendingNotifications(ctx context.Context) error {
	args := m.Called(ctx)
	return args.Error(0)
}

// MockUserService is a mock implementation of UserServiceInterface for testing
type MockUserService struct {
	mock.Mock
}

func (m *MockUserService) GetUserByID(id int64) (*models.User, error) {
	args := m.Called(id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.User), args.Error(1)
}

func (m *MockUserService) GetUserByUsername(username string) (*models.User, error) {
	args := m.Called(username)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.User), args.Error(1)
}

func (m *MockUserService) GetUserByEmail(email string) (*models.User, error) {
	args := m.Called(email)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.User), args.Error(1)
}

func (m *MockUserService) CreateUser(req *models.CreateUserRequest) (*models.User, error) {
	args := m.Called(req)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.User), args.Error(1)
}

func (m *MockUserService) ValidatePassword(user *models.User, password string) error {
	args := m.Called(user, password)
	return args.Error(0)
}

func (m *MockUserService) GenerateJWT(user *models.User, jwtSecret string) (string, error) {
	args := m.Called(user, jwtSecret)
	return args.String(0), args.Error(1)
}

func (m *MockUserService) UserExists(email, username string) bool {
	args := m.Called(email, username)
	return args.Bool(0)
}

func (m *MockUserService) CreateRefreshToken(userID int64) (*models.RefreshToken, error) {
	args := m.Called(userID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.RefreshToken), args.Error(1)
}

func (m *MockUserService) GetRefreshToken(token string) (*models.RefreshToken, error) {
	args := m.Called(token)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.RefreshToken), args.Error(1)
}

func (m *MockUserService) RevokeRefreshToken(token string) error {
	args := m.Called(token)
	return args.Error(0)
}

func (m *MockUserService) RevokeAllUserRefreshTokens(userID int64) error {
	args := m.Called(userID)
	return args.Error(0)
}

func (m *MockUserService) ValidateRefreshToken(token string) (*models.RefreshToken, error) {
	args := m.Called(token)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.RefreshToken), args.Error(1)
}

func (m *MockUserService) GetUserRoles(userID int64) ([]models.Role, error) {
	args := m.Called(userID)
	return args.Get(0).([]models.Role), args.Error(1)
}

func (m *MockUserService) GetUserPermissions(userID int64) ([]models.Permission, error) {
	args := m.Called(userID)
	return args.Get(0).([]models.Permission), args.Error(1)
}

func (m *MockUserService) HasPermission(userID int64, resource, action string) (bool, error) {
	args := m.Called(userID, resource, action)
	return args.Bool(0), args.Error(1)
}

func (m *MockUserService) AssignRole(userID int64, roleID int64) error {
	args := m.Called(userID, roleID)
	return args.Error(0)
}

func (m *MockUserService) RemoveRole(userID int64, roleID int64) error {
	args := m.Called(userID, roleID)
	return args.Error(0)
}

// Password Reset methods for MockUserService
func (m *MockUserService) CreatePasswordResetToken(userID int64) (*models.PasswordResetToken, error) {
	args := m.Called(userID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.PasswordResetToken), args.Error(1)
}

func (m *MockUserService) GetPasswordResetToken(token string) (*models.PasswordResetToken, error) {
	args := m.Called(token)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.PasswordResetToken), args.Error(1)
}

func (m *MockUserService) ValidatePasswordResetToken(token string) (*models.PasswordResetToken, error) {
	args := m.Called(token)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.PasswordResetToken), args.Error(1)
}

func (m *MockUserService) UsePasswordResetToken(token string) error {
	args := m.Called(token)
	return args.Error(0)
}

func (m *MockUserService) UpdateUserPassword(userID int64, newPassword string) error {
	args := m.Called(userID, newPassword)
	return args.Error(0)
}

func (m *MockUserService) RevokeAllPasswordResetTokens(userID int64) error {
	args := m.Called(userID)
	return args.Error(0)
}

func TestNotificationService_SendInventoryAlertNotification(t *testing.T) {
	t.Run("successfully sends notification", func(t *testing.T) {
		mockStocktakingService := &MockStocktakingService{}
		mockUserService := &MockUserService{}
		emailConfig := EmailConfig{
			SMTPHost:     "smtp.example.com",
			SMTPPort:     "587",
			SMTPUsername: "test@example.com",
			SMTPPassword: "password",
			FromEmail:    "noreply@example.com",
			FromName:     "NexusERP",
		}

		notificationService := NewNotificationService(mockStocktakingService, mockUserService, emailConfig)

		// Create test alert
		alert := &models.InventoryAlertWithDetails{
			InventoryAlert: models.InventoryAlert{
				ID:           1,
				AlertTypeID:  1,
				ProductID:    1,
				WarehouseID:  1,
				CurrentLevel: 5,
				SafetyLevel:  &[]int{10}[0],
				TriggeredAt:  time.Now(),
				Status:       "ACTIVE",
				AlertMessage: &[]string{"Low stock alert: Test Product in Main Warehouse has 5 units (safety level: 10)"}[0],
				CreatedAt:    time.Now(),
				UpdatedAt:    time.Now(),
			},
			AlertType: &models.InventoryAlertType{
				ID:   1,
				Name: "LOW_STOCK",
			},
			Product: &models.Product{
				ID:   1,
				SKU:  "TEST-001",
				Name: "Test Product",
			},
			Warehouse: &models.Warehouse{
				ID:   1,
				Name: "Main Warehouse",
				Code: "MAIN",
			},
		}

		ctx := context.Background()
		err := notificationService.SendInventoryAlertNotification(ctx, alert)

		// Note: This test will fail if SMTP is not configured properly
		// In a real test environment, you would mock the SMTP client
		assert.NoError(t, err)
	})

	t.Run("handles empty recipients gracefully", func(t *testing.T) {
		mockStocktakingService := &MockStocktakingService{}
		mockUserService := &MockUserService{}
		emailConfig := EmailConfig{} // No SMTP configuration

		notificationService := NewNotificationService(mockStocktakingService, mockUserService, emailConfig)

		alert := &models.InventoryAlertWithDetails{
			InventoryAlert: models.InventoryAlert{
				ID:           1,
				AlertTypeID:  1,
				ProductID:    1,
				WarehouseID:  1,
				CurrentLevel: 5,
				SafetyLevel:  &[]int{10}[0],
				TriggeredAt:  time.Now(),
				Status:       "ACTIVE",
				CreatedAt:    time.Now(),
				UpdatedAt:    time.Now(),
			},
		}

		ctx := context.Background()
		err := notificationService.SendInventoryAlertNotification(ctx, alert)

		assert.NoError(t, err) // Should not fail when no SMTP config
	})
}

func TestNotificationService_ProcessPendingNotifications(t *testing.T) {
	t.Run("processes alerts without notification sent", func(t *testing.T) {
		mockStocktakingService := &MockStocktakingService{}
		mockUserService := &MockUserService{}
		emailConfig := EmailConfig{}

		notificationService := NewNotificationService(mockStocktakingService, mockUserService, emailConfig)

		// Create test alerts
		alerts := []models.InventoryAlertWithDetails{
			{
				InventoryAlert: models.InventoryAlert{
					ID:               1,
					AlertTypeID:      1,
					ProductID:        1,
					WarehouseID:      1,
					CurrentLevel:     5,
					SafetyLevel:      &[]int{10}[0],
					TriggeredAt:      time.Now(),
					NotificationSent: false,
					Status:           "ACTIVE",
					AlertMessage:     &[]string{"Low stock alert"}[0],
					CreatedAt:        time.Now(),
					UpdatedAt:        time.Now(),
				},
				AlertType: &models.InventoryAlertType{
					ID:   1,
					Name: "LOW_STOCK",
				},
				Product: &models.Product{
					ID:   1,
					SKU:  "TEST-001",
					Name: "Test Product",
				},
				Warehouse: &models.Warehouse{
					ID:   1,
					Name: "Main Warehouse",
					Code: "MAIN",
				},
			},
			{
				InventoryAlert: models.InventoryAlert{
					ID:               2,
					AlertTypeID:      1,
					ProductID:        1,
					WarehouseID:      1,
					CurrentLevel:     5,
					SafetyLevel:      &[]int{10}[0],
					TriggeredAt:      time.Now(),
					NotificationSent: true, // Already sent
					Status:           "ACTIVE",
					AlertMessage:     &[]string{"Low stock alert"}[0],
					CreatedAt:        time.Now(),
					UpdatedAt:        time.Now(),
				},
				AlertType: &models.InventoryAlertType{
					ID:   1,
					Name: "LOW_STOCK",
				},
				Product: &models.Product{
					ID:   1,
					SKU:  "TEST-001",
					Name: "Test Product",
				},
				Warehouse: &models.Warehouse{
					ID:   1,
					Name: "Main Warehouse",
					Code: "MAIN",
				},
			},
		}

		// Mock the stocktaking service
		mockStocktakingService.On("GetInventoryAlerts", mock.Anything, 100, 0, "ACTIVE", (*int64)(nil), (*int64)(nil), (*int64)(nil)).Return(alerts, 2, nil)
		mockStocktakingService.On("MarkAlertNotificationSent", mock.Anything, int64(1)).Return(nil)

		ctx := context.Background()
		err := notificationService.ProcessPendingNotifications(ctx)

		assert.NoError(t, err)
		// Verify that MarkAlertNotificationSent was called only for the first alert (ID 1)
		mockStocktakingService.AssertCalled(t, "MarkAlertNotificationSent", mock.Anything, int64(1))
		// Verify that MarkAlertNotificationSent was NOT called for the second alert (ID 2)
		mockStocktakingService.AssertNotCalled(t, "MarkAlertNotificationSent", mock.Anything, int64(2))
	})

	t.Run("handles GetInventoryAlerts error gracefully", func(t *testing.T) {
		mockStocktakingService := &MockStocktakingService{}
		mockUserService := &MockUserService{}
		emailConfig := EmailConfig{}

		notificationService := NewNotificationService(mockStocktakingService, mockUserService, emailConfig)

		// Mock the stocktaking service to return an error
		mockStocktakingService.On("GetInventoryAlerts", mock.Anything, 100, 0, "ACTIVE", (*int64)(nil), (*int64)(nil), (*int64)(nil)).Return([]models.InventoryAlertWithDetails{}, 0, assert.AnError)

		ctx := context.Background()
		err := notificationService.ProcessPendingNotifications(ctx)

		assert.Error(t, err)
		assert.Contains(t, err.Error(), "failed to get active alerts")
	})
}

func TestNotificationService_GenerateAlertSubject(t *testing.T) {
	mockStocktakingService := &MockStocktakingService{}
	mockUserService := &MockUserService{}
	emailConfig := EmailConfig{}

	notificationService := NewNotificationService(mockStocktakingService, mockUserService, emailConfig)

	t.Run("generates subject with alert type and product", func(t *testing.T) {
		alert := &models.InventoryAlertWithDetails{
			AlertType: &models.InventoryAlertType{
				Name: "LOW_STOCK",
			},
			Product: &models.Product{
				Name: "Test Product",
				SKU:  "TEST-001",
			},
		}

		// Test functionality indirectly through SendInventoryAlertNotification
		// Since generateAlertSubject is private, we test it by triggering notification
		err := notificationService.SendInventoryAlertNotification(context.Background(), alert)
		assert.NoError(t, err) // Should not fail with no SMTP config
		
		// For testing purposes, we'll create a new notification service to access the method
		ns := notificationService.(*notificationService)
		subject := ns.generateAlertSubject(alert)
		
		assert.Contains(t, subject, "LOW STOCK")
		assert.Contains(t, subject, "Test Product")
		assert.Contains(t, subject, "TEST-001")
		assert.Contains(t, subject, "Action Required")
	})

	t.Run("handles nil alert type gracefully", func(t *testing.T) {
		alert := &models.InventoryAlertWithDetails{
			AlertType: nil,
			Product: &models.Product{
				Name: "Test Product",
				SKU:  "TEST-001",
			},
		}

		ns := notificationService.(*notificationService)
		subject := ns.generateAlertSubject(alert)
		
		assert.Contains(t, subject, "Inventory Alert")
		assert.Contains(t, subject, "Test Product")
	})
}

func TestNotificationService_GenerateAlertEmailBody(t *testing.T) {
	mockStocktakingService := &MockStocktakingService{}
	mockUserService := &MockUserService{}
	emailConfig := EmailConfig{}

	notificationService := NewNotificationService(mockStocktakingService, mockUserService, emailConfig)

	t.Run("generates HTML email body with alert details", func(t *testing.T) {
		alert := &models.InventoryAlertWithDetails{
			InventoryAlert: models.InventoryAlert{
				CurrentLevel: 5,
				SafetyLevel:  &[]int{10}[0],
				TriggeredAt:  time.Now(),
				AlertMessage: &[]string{"Low stock alert: Test Product in Main Warehouse has 5 units (safety level: 10)"}[0],
			},
			AlertType: &models.InventoryAlertType{
				Name: "LOW_STOCK",
			},
			Product: &models.Product{
				Name: "Test Product",
				SKU:  "TEST-001",
			},
			Warehouse: &models.Warehouse{
				Name: "Main Warehouse",
				Code: "MAIN",
			},
		}

		ns := notificationService.(*notificationService)
		body := ns.generateAlertEmailBody(alert)
		
		assert.Contains(t, body, "<!DOCTYPE html>")
		assert.Contains(t, body, "LOW STOCK")
		assert.Contains(t, body, "Test Product")
		assert.Contains(t, body, "TEST-001")
		assert.Contains(t, body, "Main Warehouse")
		assert.Contains(t, body, "5 units")
		assert.Contains(t, body, "10 units")
		assert.Contains(t, body, "Low stock alert")
	})

	t.Run("handles nil values gracefully", func(t *testing.T) {
		alert := &models.InventoryAlertWithDetails{
			InventoryAlert: models.InventoryAlert{
				CurrentLevel: 5,
				SafetyLevel:  &[]int{10}[0],
				TriggeredAt:  time.Now(),
				AlertMessage: &[]string{"Generic alert message"}[0],
			},
			AlertType: nil,
			Product:   nil,
			Warehouse: nil,
		}

		ns := notificationService.(*notificationService)
		body := ns.generateAlertEmailBody(alert)
		
		assert.Contains(t, body, "<!DOCTYPE html>")
		assert.Contains(t, body, "Unknown Product")
		assert.Contains(t, body, "Unknown Warehouse")
		assert.Contains(t, body, "Unknown Alert")
		assert.Contains(t, body, "Generic alert message")
	})
}