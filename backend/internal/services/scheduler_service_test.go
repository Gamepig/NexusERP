package services

import (
	"context"
	"testing"
	"time"

	"nexus-erp/backend/internal/config"
	"nexus-erp/backend/internal/models"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// MockStocktakingService is a mock implementation of StocktakingService for testing
type MockStocktakingService struct {
	mock.Mock
}

func (m *MockStocktakingService) CheckInventoryLevels(ctx context.Context) error {
	args := m.Called(ctx)
	return args.Error(0)
}

func (m *MockStocktakingService) MarkAlertNotificationSent(ctx context.Context, alertID int64) error {
	args := m.Called(ctx, alertID)
	return args.Error(0)
}

// Add other required methods with mock implementations
func (m *MockStocktakingService) CreateStocktakingOrder(ctx context.Context, req *models.CreateStocktakingOrderRequest, userID int64) (*models.StocktakingOrderWithDetails, error) {
	args := m.Called(ctx, req, userID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.StocktakingOrderWithDetails), args.Error(1)
}

func (m *MockStocktakingService) GetStocktakingOrders(ctx context.Context, limit, offset int, warehouseID *int64, status string) ([]models.StocktakingOrderWithDetails, int, error) {
	args := m.Called(ctx, limit, offset, warehouseID, status)
	return args.Get(0).([]models.StocktakingOrderWithDetails), args.Int(1), args.Error(2)
}

func (m *MockStocktakingService) GetStocktakingOrderByID(ctx context.Context, id int64) (*models.StocktakingOrderWithDetails, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.StocktakingOrderWithDetails), args.Error(1)
}

func (m *MockStocktakingService) UpdateStocktakingOrder(ctx context.Context, id int64, req *models.UpdateStocktakingOrderRequest) (*models.StocktakingOrderWithDetails, error) {
	args := m.Called(ctx, id, req)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.StocktakingOrderWithDetails), args.Error(1)
}

func (m *MockStocktakingService) StartStocktakingOrder(ctx context.Context, id int64, req *models.StartStocktakingOrderRequest, userID int64) (*models.StocktakingOrderWithDetails, error) {
	args := m.Called(ctx, id, req, userID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.StocktakingOrderWithDetails), args.Error(1)
}

func (m *MockStocktakingService) ProcessStocktakingOrder(ctx context.Context, id int64, req *models.ProcessStocktakingOrderRequest, userID int64) (*models.StocktakingOrderWithDetails, error) {
	args := m.Called(ctx, id, req, userID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.StocktakingOrderWithDetails), args.Error(1)
}

func (m *MockStocktakingService) FinalizeStocktakingOrder(ctx context.Context, id int64, req *models.FinalizeStocktakingOrderRequest, userID int64) (*models.StocktakingOrderWithDetails, error) {
	args := m.Called(ctx, id, req, userID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.StocktakingOrderWithDetails), args.Error(1)
}

func (m *MockStocktakingService) ApproveStocktakingOrder(ctx context.Context, id int64, req *models.ApproveStocktakingOrderRequest, userID int64) (*models.StocktakingOrderWithDetails, error) {
	args := m.Called(ctx, id, req, userID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.StocktakingOrderWithDetails), args.Error(1)
}

func (m *MockStocktakingService) DeleteStocktakingOrder(ctx context.Context, id int64) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func (m *MockStocktakingService) GetStocktakingItems(ctx context.Context, orderID int64) ([]models.StocktakingItemWithDetails, error) {
	args := m.Called(ctx, orderID)
	return args.Get(0).([]models.StocktakingItemWithDetails), args.Error(1)
}

func (m *MockStocktakingService) CountStocktakingItem(ctx context.Context, orderID, productID int64, req *models.CountStocktakingItemRequest, userID int64) (*models.StocktakingItemWithDetails, error) {
	args := m.Called(ctx, orderID, productID, req, userID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.StocktakingItemWithDetails), args.Error(1)
}

func (m *MockStocktakingService) CreateProductSafetyStock(ctx context.Context, req *models.CreateProductSafetyStockRequest) (*models.ProductSafetyStockWithDetails, error) {
	args := m.Called(ctx, req)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.ProductSafetyStockWithDetails), args.Error(1)
}

func (m *MockStocktakingService) GetProductSafetyStocks(ctx context.Context, limit, offset int, productID, warehouseID *int64) ([]models.ProductSafetyStockWithDetails, int, error) {
	args := m.Called(ctx, limit, offset, productID, warehouseID)
	return args.Get(0).([]models.ProductSafetyStockWithDetails), args.Int(1), args.Error(2)
}

func (m *MockStocktakingService) GetProductSafetyStockByID(ctx context.Context, id int64) (*models.ProductSafetyStockWithDetails, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.ProductSafetyStockWithDetails), args.Error(1)
}

func (m *MockStocktakingService) UpdateProductSafetyStock(ctx context.Context, id int64, req *models.UpdateProductSafetyStockRequest) (*models.ProductSafetyStockWithDetails, error) {
	args := m.Called(ctx, id, req)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.ProductSafetyStockWithDetails), args.Error(1)
}

func (m *MockStocktakingService) DeleteProductSafetyStock(ctx context.Context, id int64) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func (m *MockStocktakingService) GetInventoryAlerts(ctx context.Context, limit, offset int, status string, alertTypeID, productID, warehouseID *int64) ([]models.InventoryAlertWithDetails, int, error) {
	args := m.Called(ctx, limit, offset, status, alertTypeID, productID, warehouseID)
	return args.Get(0).([]models.InventoryAlertWithDetails), args.Int(1), args.Error(2)
}

func (m *MockStocktakingService) GetInventoryAlertByID(ctx context.Context, id int64) (*models.InventoryAlertWithDetails, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.InventoryAlertWithDetails), args.Error(1)
}

func (m *MockStocktakingService) ResolveInventoryAlert(ctx context.Context, id int64, req *models.ResolveInventoryAlertRequest, userID int64) (*models.InventoryAlertWithDetails, error) {
	args := m.Called(ctx, id, req, userID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.InventoryAlertWithDetails), args.Error(1)
}

func (m *MockStocktakingService) DismissInventoryAlert(ctx context.Context, id int64, req *models.DismissInventoryAlertRequest, userID int64) (*models.InventoryAlertWithDetails, error) {
	args := m.Called(ctx, id, req, userID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.InventoryAlertWithDetails), args.Error(1)
}

func (m *MockStocktakingService) GetStocktakingReport(ctx context.Context, req *models.StocktakingReportRequest) (*models.StocktakingReportResponse, error) {
	args := m.Called(ctx, req)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.StocktakingReportResponse), args.Error(1)
}

func (m *MockStocktakingService) GetInventoryAlertReport(ctx context.Context, req *models.InventoryAlertReportRequest) (*models.InventoryAlertReportResponse, error) {
	args := m.Called(ctx, req)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.InventoryAlertReportResponse), args.Error(1)
}

func TestSchedulerService_Start(t *testing.T) {
	t.Run("starts scheduler when enabled", func(t *testing.T) {
		mockStocktakingService := &MockStocktakingService{}
		cfg := &config.Config{
			Scheduler: config.SchedulerConfig{
				Enabled:               true,
				InventoryCheckInterval: 100 * time.Millisecond,
			},
		}

		scheduler := NewSchedulerService(cfg, mockStocktakingService, nil)
		ctx := context.Background()

		// Mock the inventory check to be called
		mockStocktakingService.On("CheckInventoryLevels", mock.Anything).Return(nil)

		err := scheduler.Start(ctx)
		assert.NoError(t, err)
		assert.True(t, scheduler.IsRunning())

		// Give it a moment to run
		time.Sleep(200 * time.Millisecond)

		// Stop the scheduler
		err = scheduler.Stop()
		assert.NoError(t, err)
		assert.False(t, scheduler.IsRunning())

		// Verify that CheckInventoryLevels was called at least once
		mockStocktakingService.AssertCalled(t, "CheckInventoryLevels", mock.Anything)
	})

	t.Run("does not start when disabled", func(t *testing.T) {
		mockStocktakingService := &MockStocktakingService{}
		cfg := &config.Config{
			Scheduler: config.SchedulerConfig{
				Enabled:               false,
				InventoryCheckInterval: 100 * time.Millisecond,
			},
		}

		scheduler := NewSchedulerService(cfg, mockStocktakingService, nil)
		ctx := context.Background()

		err := scheduler.Start(ctx)
		assert.NoError(t, err)
		assert.False(t, scheduler.IsRunning())

		// Verify that CheckInventoryLevels was not called
		mockStocktakingService.AssertNotCalled(t, "CheckInventoryLevels", mock.Anything)
	})

	t.Run("returns error when already running", func(t *testing.T) {
		mockStocktakingService := &MockStocktakingService{}
		cfg := &config.Config{
			Scheduler: config.SchedulerConfig{
				Enabled:               true,
				InventoryCheckInterval: 100 * time.Millisecond,
			},
		}

		scheduler := NewSchedulerService(cfg, mockStocktakingService, nil)
		ctx := context.Background()

		// Mock the inventory check
		mockStocktakingService.On("CheckInventoryLevels", mock.Anything).Return(nil)

		// Start the scheduler
		err := scheduler.Start(ctx)
		assert.NoError(t, err)
		assert.True(t, scheduler.IsRunning())

		// Try to start again
		err = scheduler.Start(ctx)
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "already running")

		// Stop the scheduler
		err = scheduler.Stop()
		assert.NoError(t, err)
	})
}

func TestSchedulerService_Stop(t *testing.T) {
	t.Run("stops running scheduler", func(t *testing.T) {
		mockStocktakingService := &MockStocktakingService{}
		cfg := &config.Config{
			Scheduler: config.SchedulerConfig{
				Enabled:               true,
				InventoryCheckInterval: 100 * time.Millisecond,
			},
		}

		scheduler := NewSchedulerService(cfg, mockStocktakingService, nil)
		ctx := context.Background()

		// Mock the inventory check
		mockStocktakingService.On("CheckInventoryLevels", mock.Anything).Return(nil)

		// Start the scheduler
		err := scheduler.Start(ctx)
		assert.NoError(t, err)
		assert.True(t, scheduler.IsRunning())

		// Stop the scheduler
		err = scheduler.Stop()
		assert.NoError(t, err)
		assert.False(t, scheduler.IsRunning())
	})

	t.Run("does nothing when not running", func(t *testing.T) {
		mockStocktakingService := &MockStocktakingService{}
		cfg := &config.Config{
			Scheduler: config.SchedulerConfig{
				Enabled:               true,
				InventoryCheckInterval: 100 * time.Millisecond,
			},
		}

		scheduler := NewSchedulerService(cfg, mockStocktakingService, nil)

		// Stop without starting
		err := scheduler.Stop()
		assert.NoError(t, err)
		assert.False(t, scheduler.IsRunning())
	})
}

func TestSchedulerService_IsRunning(t *testing.T) {
	t.Run("returns correct running state", func(t *testing.T) {
		mockStocktakingService := &MockStocktakingService{}
		cfg := &config.Config{
			Scheduler: config.SchedulerConfig{
				Enabled:               true,
				InventoryCheckInterval: 100 * time.Millisecond,
			},
		}

		scheduler := NewSchedulerService(cfg, mockStocktakingService, nil)
		ctx := context.Background()

		// Initially not running
		assert.False(t, scheduler.IsRunning())

		// Mock the inventory check
		mockStocktakingService.On("CheckInventoryLevels", mock.Anything).Return(nil)

		// Start the scheduler
		err := scheduler.Start(ctx)
		assert.NoError(t, err)
		assert.True(t, scheduler.IsRunning())

		// Stop the scheduler
		err = scheduler.Stop()
		assert.NoError(t, err)
		assert.False(t, scheduler.IsRunning())
	})
}