package services

import (
	"context"
	"fmt"
	"log"
	"time"

	"nexus-erp/backend/internal/config"
)

type SchedulerService interface {
	Start(ctx context.Context) error
	Stop() error
	IsRunning() bool
}

type schedulerService struct {
	config             *config.Config
	stocktakingService StocktakingService
	notificationService NotificationService
	stopChan          chan struct{}
	isRunning         bool
}

func NewSchedulerService(cfg *config.Config, stocktakingService StocktakingService, notificationService NotificationService) SchedulerService {
	return &schedulerService{
		config:             cfg,
		stocktakingService: stocktakingService,
		notificationService: notificationService,
		stopChan:          make(chan struct{}),
		isRunning:         false,
	}
}

func (s *schedulerService) Start(ctx context.Context) error {
	if !s.config.Scheduler.Enabled {
		log.Println("Scheduler is disabled by configuration")
		return nil
	}

	if s.isRunning {
		return fmt.Errorf("scheduler is already running")
	}

	s.isRunning = true
	log.Printf("Starting scheduler with inventory check interval: %v", s.config.Scheduler.InventoryCheckInterval)

	go s.runScheduler(ctx)

	return nil
}

func (s *schedulerService) Stop() error {
	if !s.isRunning {
		return nil
	}

	log.Println("Stopping scheduler...")
	close(s.stopChan)
	s.isRunning = false
	log.Println("Scheduler stopped")

	return nil
}

func (s *schedulerService) IsRunning() bool {
	return s.isRunning
}

func (s *schedulerService) runScheduler(ctx context.Context) {
	ticker := time.NewTicker(s.config.Scheduler.InventoryCheckInterval)
	defer ticker.Stop()

	// Run once immediately on startup
	s.runInventoryCheck(ctx)

	for {
		select {
		case <-ctx.Done():
			log.Println("Scheduler context cancelled")
			s.isRunning = false
			return
		case <-s.stopChan:
			log.Println("Scheduler stop signal received")
			s.isRunning = false
			return
		case <-ticker.C:
			s.runInventoryCheck(ctx)
		}
	}
}

func (s *schedulerService) runInventoryCheck(ctx context.Context) {
	log.Println("Running scheduled inventory level check...")
	
	start := time.Now()
	
	// Check inventory levels and generate alerts
	if err := s.stocktakingService.CheckInventoryLevels(ctx); err != nil {
		log.Printf("Error during inventory level check: %v", err)
		return
	}
	
	// Process pending notifications if notification service is available
	if s.notificationService != nil {
		if err := s.notificationService.ProcessPendingNotifications(ctx); err != nil {
			log.Printf("Error processing pending notifications: %v", err)
		}
	}
	
	duration := time.Since(start)
	log.Printf("Inventory level check completed in %v", duration)
}