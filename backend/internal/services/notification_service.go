package services

import (
	"context"
	"fmt"
	"log"
	"net/smtp"
	"strings"

	"nexus-erp/backend/internal/models"
)

type NotificationService interface {
	SendInventoryAlertNotification(ctx context.Context, alert *models.InventoryAlertWithDetails) error
	SendEmailNotification(ctx context.Context, to, subject, body string) error
	ProcessPendingNotifications(ctx context.Context) error
}

type notificationService struct {
	stocktakingService StocktakingService
	userService        UserServiceInterface
	emailConfig        EmailConfig
}

type EmailConfig struct {
	SMTPHost     string
	SMTPPort     string
	SMTPUsername string
	SMTPPassword string
	FromEmail    string
	FromName     string
}

func NewNotificationService(stocktakingService StocktakingService, userService UserServiceInterface, emailConfig EmailConfig) NotificationService {
	return &notificationService{
		stocktakingService: stocktakingService,
		userService:        userService,
		emailConfig:        emailConfig,
	}
}

func (s *notificationService) SendInventoryAlertNotification(ctx context.Context, alert *models.InventoryAlertWithDetails) error {
	// Get users who should receive inventory alerts (could be filtered by roles/permissions)
	recipients, err := s.getInventoryAlertRecipients(ctx)
	if err != nil {
		return fmt.Errorf("failed to get alert recipients: %v", err)
	}

	if len(recipients) == 0 {
		log.Printf("No recipients found for inventory alert %d", alert.ID)
		return nil
	}

	// Generate email subject and body
	subject := s.generateAlertSubject(alert)
	body := s.generateAlertEmailBody(alert)

	// Send email to all recipients
	for _, recipient := range recipients {
		if err := s.SendEmailNotification(ctx, recipient, subject, body); err != nil {
			log.Printf("Failed to send notification to %s: %v", recipient, err)
			continue
		}
	}

	log.Printf("Inventory alert notification sent for alert ID %d to %d recipients", alert.ID, len(recipients))
	return nil
}

func (s *notificationService) SendEmailNotification(ctx context.Context, to, subject, body string) error {
	if s.emailConfig.SMTPHost == "" {
		log.Printf("Email configuration not set, skipping notification to %s", to)
		return nil
	}

	// Create email message
	msg := []byte(fmt.Sprintf("To: %s\r\n"+
		"Subject: %s\r\n"+
		"Content-Type: text/html; charset=UTF-8\r\n"+
		"\r\n"+
		"%s\r\n", to, subject, body))

	// SMTP configuration
	auth := smtp.PlainAuth("", s.emailConfig.SMTPUsername, s.emailConfig.SMTPPassword, s.emailConfig.SMTPHost)
	addr := fmt.Sprintf("%s:%s", s.emailConfig.SMTPHost, s.emailConfig.SMTPPort)

	// Send email
	err := smtp.SendMail(addr, auth, s.emailConfig.FromEmail, []string{to}, msg)
	if err != nil {
		return fmt.Errorf("failed to send email: %v", err)
	}

	log.Printf("Email sent successfully to %s", to)
	return nil
}

func (s *notificationService) ProcessPendingNotifications(ctx context.Context) error {
	// Get all active alerts that haven't been notified yet
	alerts, _, err := s.stocktakingService.GetInventoryAlerts(ctx, 100, 0, "ACTIVE", nil, nil, nil)
	if err != nil {
		return fmt.Errorf("failed to get active alerts: %v", err)
	}

	log.Printf("Processing %d active alerts for notifications", len(alerts))

	for _, alert := range alerts {
		// Check if notification has already been sent
		if alert.NotificationSent {
			continue
		}

		// Send notification
		if err := s.SendInventoryAlertNotification(ctx, &alert); err != nil {
			log.Printf("Failed to send notification for alert %d: %v", alert.ID, err)
			continue
		}

		// Mark notification as sent
		if err := s.stocktakingService.MarkAlertNotificationSent(ctx, alert.ID); err != nil {
			log.Printf("Failed to mark notification as sent for alert %d: %v", alert.ID, err)
		}
	}

	return nil
}

func (s *notificationService) getInventoryAlertRecipients(ctx context.Context) ([]string, error) {
	// This is a simplified implementation
	// In a real system, you'd want to:
	// 1. Query users with specific roles (e.g., "inventory_manager", "warehouse_manager")
	// 2. Check user notification preferences
	// 3. Filter based on warehouse assignments
	
	// For now, return a hardcoded list or get from configuration
	// In production, this should be configurable
	return []string{
		"inventory@company.com",
		"warehouse@company.com",
	}, nil
}

func (s *notificationService) generateAlertSubject(alert *models.InventoryAlertWithDetails) string {
	alertType := "Inventory Alert"
	if alert.AlertType != nil {
		alertType = strings.ReplaceAll(alert.AlertType.Name, "_", " ")
	}

	productName := "Unknown Product"
	if alert.Product != nil {
		productName = fmt.Sprintf("%s (%s)", alert.Product.Name, alert.Product.SKU)
	}

	return fmt.Sprintf("[%s] %s - %s", alertType, productName, "Action Required")
}

func (s *notificationService) generateAlertEmailBody(alert *models.InventoryAlertWithDetails) string {
	productInfo := "Unknown Product"
	if alert.Product != nil {
		productInfo = fmt.Sprintf("%s (%s)", alert.Product.Name, alert.Product.SKU)
	}

	warehouseInfo := "Unknown Warehouse"
	if alert.Warehouse != nil {
		warehouseInfo = fmt.Sprintf("%s (%s)", alert.Warehouse.Name, alert.Warehouse.Code)
	}

	alertType := "Unknown Alert"
	if alert.AlertType != nil {
		alertType = strings.ReplaceAll(alert.AlertType.Name, "_", " ")
	}

	body := fmt.Sprintf(`
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .alert { background-color: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
        .info { background-color: #d4edda; border: 1px solid #c3e6cb; padding: 10px; border-radius: 5px; }
        .details { margin-top: 15px; }
        .details th { text-align: left; padding-right: 10px; }
    </style>
</head>
<body>
    <h2>Inventory Alert Notification</h2>
    
    <div class="alert">
        <strong>Alert Type:</strong> %s<br>
        <strong>Triggered:</strong> %s
    </div>
    
    <div class="details">
        <h3>Product Information</h3>
        <table>
            <tr><th>Product:</th><td>%s</td></tr>
            <tr><th>Warehouse:</th><td>%s</td></tr>
            <tr><th>Current Stock:</th><td>%d units</td></tr>
            <tr><th>Safety Level:</th><td>%d units</td></tr>
        </table>
    </div>
    
    <div class="details">
        <h3>Message</h3>
        <p>%s</p>
    </div>
    
    <div class="info">
        <p><strong>Action Required:</strong> Please review inventory levels and take appropriate action to replenish stock if necessary.</p>
    </div>
    
    <p><em>This is an automated notification from the NexusERP system.</em></p>
</body>
</html>
`, alertType, alert.TriggeredAt.Format("2006-01-02 15:04:05"), productInfo, warehouseInfo, alert.CurrentLevel, *alert.SafetyLevel, *alert.AlertMessage)

	return body
}