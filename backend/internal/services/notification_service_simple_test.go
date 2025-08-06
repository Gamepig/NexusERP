package services

import (
	"context"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestNotificationServiceBasic(t *testing.T) {
	t.Run("creates notification service successfully", func(t *testing.T) {
		mockStocktakingService := &MockStocktakingService{}
		mockUserService := &MockUserService{}
		emailConfig := EmailConfig{
			SMTPHost:     "smtp.test.com",
			SMTPPort:     "587",
			SMTPUsername: "test@example.com",
			SMTPPassword: "password",
			FromEmail:    "noreply@example.com",
			FromName:     "NexusERP",
		}

		notificationService := NewNotificationService(mockStocktakingService, mockUserService, emailConfig)
		assert.NotNil(t, notificationService)
	})

	t.Run("sends test email without SMTP configuration", func(t *testing.T) {
		mockStocktakingService := &MockStocktakingService{}
		mockUserService := &MockUserService{}
		emailConfig := EmailConfig{} // No SMTP configuration

		notificationService := NewNotificationService(mockStocktakingService, mockUserService, emailConfig)

		ctx := context.Background()
		err := notificationService.SendEmailNotification(ctx, "test@example.com", "Test Subject", "Test Body")

		// Should not fail when no SMTP config (just logs)
		assert.NoError(t, err)
	})
}