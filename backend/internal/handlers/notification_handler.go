package handlers

import (
	"net/http"
	"strconv"

	"nexus-erp/backend/internal/services"

	"github.com/gin-gonic/gin"
)

type NotificationHandler struct {
	notificationService services.NotificationService
}

func NewNotificationHandler(notificationService services.NotificationService) *NotificationHandler {
	return &NotificationHandler{
		notificationService: notificationService,
	}
}

// ProcessPendingNotifications manually triggers processing of pending notifications
// @Summary Process pending notifications
// @Description Manually process all pending inventory alert notifications
// @Tags Notifications
// @Accept json
// @Produce json
// @Success 200 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /notifications/process [post]
func (h *NotificationHandler) ProcessPendingNotifications(c *gin.Context) {
	if err := h.notificationService.ProcessPendingNotifications(c.Request.Context()); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to process pending notifications",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Pending notifications processed successfully",
	})
}

// SendTestNotification sends a test notification to verify email configuration
// @Summary Send test notification
// @Description Send a test email notification to verify email configuration
// @Tags Notifications
// @Accept json
// @Produce json
// @Param request body SendTestNotificationRequest true "Test notification request"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /notifications/test [post]
func (h *NotificationHandler) SendTestNotification(c *gin.Context) {
	var req SendTestNotificationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request body",
			"details": err.Error(),
		})
		return
	}

	subject := "NexusERP Test Notification"
	body := `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .test-message { background-color: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 5px; }
    </style>
</head>
<body>
    <h2>Test Notification</h2>
    <div class="test-message">
        <p>This is a test notification from NexusERP to verify email configuration.</p>
        <p><strong>Test Message:</strong> ` + req.Message + `</p>
    </div>
    <p><em>If you received this email, your notification system is working correctly.</em></p>
</body>
</html>
	`

	if err := h.notificationService.SendEmailNotification(c.Request.Context(), req.Email, subject, body); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to send test notification",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Test notification sent successfully",
		"email":   req.Email,
	})
}

// SendInventoryAlertNotification sends a notification for a specific inventory alert
// @Summary Send inventory alert notification
// @Description Send a notification for a specific inventory alert by ID
// @Tags Notifications
// @Accept json
// @Produce json
// @Param id path int true "Alert ID"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /notifications/alerts/{id} [post]
func (h *NotificationHandler) SendInventoryAlertNotification(c *gin.Context) {
	idStr := c.Param("id")
	_, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid alert ID",
			"details": err.Error(),
		})
		return
	}

	// This would require access to the stocktaking service to get the alert details
	// For now, we'll return a placeholder response
	c.JSON(http.StatusNotImplemented, gin.H{
		"error": "This endpoint requires integration with stocktaking service",
		"message": "Please use the process-pending endpoint instead",
	})
}

// RegisterNotificationRoutes registers notification routes
func (h *NotificationHandler) RegisterNotificationRoutes(r *gin.RouterGroup) {
	notifications := r.Group("/notifications")
	{
		notifications.POST("/process", h.ProcessPendingNotifications)
		notifications.POST("/test", h.SendTestNotification)
		notifications.POST("/alerts/:id", h.SendInventoryAlertNotification)
	}
}

// Request/Response models
type SendTestNotificationRequest struct {
	Email   string `json:"email" binding:"required,email"`
	Message string `json:"message" binding:"required"`
}