package monitoring

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

// DatabaseNotificationChannel 資料庫通知通道
type DatabaseNotificationChannel struct {
	securityMonitor *SecurityMonitor
}

func NewDatabaseNotificationChannel(monitor *SecurityMonitor) *DatabaseNotificationChannel {
	return &DatabaseNotificationChannel{
		securityMonitor: monitor,
	}
}

func (d *DatabaseNotificationChannel) Send(ctx context.Context, alert *Alert) error {
	// 將告警記錄為安全事件
	event := SecurityEvent{
		EventType: "alert_notification",
		Details: map[string]interface{}{
			"alert_id":   alert.ID,
			"alert_type": alert.Type,
			"severity":   alert.Severity,
			"title":      alert.Title,
			"message":    alert.Message,
			"source":     alert.Source,
		},
		Severity:  string(alert.Severity),
		IPAddress: "127.0.0.1", // 系統內部
		UserAgent: "alert_system",
	}

	return d.securityMonitor.LogSecurityEvent(ctx, event)
}

func (d *DatabaseNotificationChannel) GetChannelType() AlertChannel {
	return AlertChannelDatabase
}

// SlackNotificationChannel Slack通知通道
type SlackNotificationChannel struct {
	webhookURL string
	httpClient *http.Client
}

func NewSlackNotificationChannel(webhookURL string) *SlackNotificationChannel {
	return &SlackNotificationChannel{
		webhookURL: webhookURL,
		httpClient: &http.Client{Timeout: 30 * time.Second},
	}
}

func (s *SlackNotificationChannel) Send(ctx context.Context, alert *Alert) error {
	if s.webhookURL == "" {
		return fmt.Errorf("Slack webhook URL not configured")
	}

	// 構建Slack消息
	message := s.buildSlackMessage(alert)

	// 發送到Slack
	payload, err := json.Marshal(message)
	if err != nil {
		return fmt.Errorf("failed to marshal Slack message: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, "POST", s.webhookURL, bytes.NewBuffer(payload))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("failed to send Slack notification: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("Slack API returned status %d: %s", resp.StatusCode, string(body))
	}

	return nil
}

func (s *SlackNotificationChannel) buildSlackMessage(alert *Alert) map[string]interface{} {
	// 根據嚴重程度選擇顏色
	color := s.getSeverityColor(alert.Severity)
	
	// 構建附件
	attachment := map[string]interface{}{
		"color":     color,
		"title":     alert.Title,
		"text":      alert.Message,
		"timestamp": alert.CreatedAt.Unix(),
		"fields": []map[string]interface{}{
			{
				"title": "Type",
				"value": string(alert.Type),
				"short": true,
			},
			{
				"title": "Severity",
				"value": string(alert.Severity),
				"short": true,
			},
			{
				"title": "Source",
				"value": alert.Source,
				"short": true,
			},
		},
	}

	// 添加metadata字段
	if len(alert.Metadata) > 0 {
		metadataStr := ""
		for key, value := range alert.Metadata {
			metadataStr += fmt.Sprintf("*%s:* %v\n", key, value)
		}
		attachment["fields"] = append(attachment["fields"].([]map[string]interface{}), map[string]interface{}{
			"title": "Metadata",
			"value": metadataStr,
			"short": false,
		})
	}

	return map[string]interface{}{
		"text":        fmt.Sprintf("🚨 NexusERP Alert - %s", alert.Severity),
		"attachments": []map[string]interface{}{attachment},
	}
}

func (s *SlackNotificationChannel) getSeverityColor(severity AlertSeverity) string {
	switch severity {
	case AlertSeverityCritical:
		return "danger"
	case AlertSeverityError:
		return "warning"
	case AlertSeverityWarning:
		return "#ff9900"
	case AlertSeverityInfo:
		return "good"
	default:
		return "#999999"
	}
}

func (s *SlackNotificationChannel) GetChannelType() AlertChannel {
	return AlertChannelSlack
}

// EmailNotificationChannel Email通知通道
type EmailNotificationChannel struct {
	smtpHost     string
	smtpPort     int
	smtpUsername string
	smtpPassword string
	fromEmail    string
	toEmails     []string
}

func NewEmailNotificationChannel(smtpHost string, smtpPort int, username, password, fromEmail string, toEmails []string) *EmailNotificationChannel {
	return &EmailNotificationChannel{
		smtpHost:     smtpHost,
		smtpPort:     smtpPort,
		smtpUsername: username,
		smtpPassword: password,
		fromEmail:    fromEmail,
		toEmails:     toEmails,
	}
}

func (e *EmailNotificationChannel) Send(ctx context.Context, alert *Alert) error {
	// 簡化版本：打印到日誌而不是實際發送郵件
	// 實際應用中應該使用SMTP庫發送郵件
	
	subject := fmt.Sprintf("[NexusERP Alert] %s - %s", alert.Severity, alert.Title)
	body := e.buildEmailBody(alert)

	// 模擬發送郵件
	fmt.Printf("EMAIL NOTIFICATION:\n")
	fmt.Printf("To: %v\n", e.toEmails)
	fmt.Printf("Subject: %s\n", subject)
	fmt.Printf("Body:\n%s\n", body)
	fmt.Printf("---\n")

	return nil
}

func (e *EmailNotificationChannel) buildEmailBody(alert *Alert) string {
	body := fmt.Sprintf(`
NexusERP Security Alert

Alert Details:
- ID: %d
- Type: %s
- Severity: %s
- Title: %s
- Message: %s
- Source: %s
- Created: %s

`, alert.ID, alert.Type, alert.Severity, alert.Title, alert.Message, alert.Source, alert.CreatedAt.Format("2006-01-02 15:04:05"))

	if len(alert.Metadata) > 0 {
		body += "Additional Information:\n"
		for key, value := range alert.Metadata {
			body += fmt.Sprintf("- %s: %v\n", key, value)
		}
		body += "\n"
	}

	body += `
Please review this alert and take appropriate action if necessary.

This is an automated message from NexusERP Alert System.
`

	return body
}

func (e *EmailNotificationChannel) GetChannelType() AlertChannel {
	return AlertChannelEmail
}

// WebhookNotificationChannel Webhook通知通道
type WebhookNotificationChannel struct {
	webhookURL string
	httpClient *http.Client
	headers    map[string]string
}

func NewWebhookNotificationChannel(webhookURL string, headers map[string]string) *WebhookNotificationChannel {
	return &WebhookNotificationChannel{
		webhookURL: webhookURL,
		httpClient: &http.Client{Timeout: 30 * time.Second},
		headers:    headers,
	}
}

func (w *WebhookNotificationChannel) Send(ctx context.Context, alert *Alert) error {
	if w.webhookURL == "" {
		return fmt.Errorf("webhook URL not configured")
	}

	// 構建webhook payload
	payload := map[string]interface{}{
		"alert_id":    alert.ID,
		"type":        alert.Type,
		"severity":    alert.Severity,
		"title":       alert.Title,
		"message":     alert.Message,
		"source":      alert.Source,
		"metadata":    alert.Metadata,
		"is_resolved": alert.IsResolved,
		"created_at":  alert.CreatedAt.Format(time.RFC3339),
		"updated_at":  alert.UpdatedAt.Format(time.RFC3339),
	}

	jsonPayload, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("failed to marshal webhook payload: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, "POST", w.webhookURL, bytes.NewBuffer(jsonPayload))
	if err != nil {
		return fmt.Errorf("failed to create webhook request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("User-Agent", "NexusERP-AlertSystem/1.0")

	// 添加自定義headers
	for key, value := range w.headers {
		req.Header.Set(key, value)
	}

	resp, err := w.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("failed to send webhook: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("webhook returned status %d: %s", resp.StatusCode, string(body))
	}

	return nil
}

func (w *WebhookNotificationChannel) GetChannelType() AlertChannel {
	return AlertChannelWebhook
}

// SMSNotificationChannel SMS通知通道
type SMSNotificationChannel struct {
	apiKey      string
	apiURL      string
	phoneNumbers []string
	httpClient  *http.Client
}

func NewSMSNotificationChannel(apiKey, apiURL string, phoneNumbers []string) *SMSNotificationChannel {
	return &SMSNotificationChannel{
		apiKey:      apiKey,
		apiURL:      apiURL,
		phoneNumbers: phoneNumbers,
		httpClient:  &http.Client{Timeout: 30 * time.Second},
	}
}

func (s *SMSNotificationChannel) Send(ctx context.Context, alert *Alert) error {
	// 只為關鍵告警發送SMS
	if alert.Severity != AlertSeverityCritical {
		return nil
	}

	message := fmt.Sprintf("NexusERP CRITICAL ALERT: %s - %s", alert.Title, alert.Message)
	
	// 簡化版本：打印到日誌而不是實際發送SMS
	// 實際應用中應該整合SMS API（如Twilio、AWS SNS等）
	
	fmt.Printf("SMS NOTIFICATION:\n")
	fmt.Printf("To: %v\n", s.phoneNumbers)
	fmt.Printf("Message: %s\n", message)
	fmt.Printf("---\n")

	return nil
}

func (s *SMSNotificationChannel) GetChannelType() AlertChannel {
	return AlertChannelSMS
}

// NotificationChannelFactory 通知通道工廠
type NotificationChannelFactory struct {
	config map[string]interface{}
}

func NewNotificationChannelFactory(config map[string]interface{}) *NotificationChannelFactory {
	return &NotificationChannelFactory{config: config}
}

func (f *NotificationChannelFactory) CreateChannel(channelType AlertChannel, monitor *SecurityMonitor) (NotificationChannel, error) {
	switch channelType {
	case AlertChannelDatabase:
		return NewDatabaseNotificationChannel(monitor), nil

	case AlertChannelSlack:
		if webhookURL, ok := f.config["slack_webhook_url"].(string); ok {
			return NewSlackNotificationChannel(webhookURL), nil
		}
		return nil, fmt.Errorf("slack_webhook_url not configured")

	case AlertChannelEmail:
		// 從配置中獲取SMTP設置
		smtpHost, _ := f.config["smtp_host"].(string)
		smtpPort, _ := f.config["smtp_port"].(int)
		username, _ := f.config["smtp_username"].(string)
		password, _ := f.config["smtp_password"].(string)
		fromEmail, _ := f.config["from_email"].(string)
		toEmails, _ := f.config["to_emails"].([]string)

		return NewEmailNotificationChannel(smtpHost, smtpPort, username, password, fromEmail, toEmails), nil

	case AlertChannelWebhook:
		if webhookURL, ok := f.config["webhook_url"].(string); ok {
			headers, _ := f.config["webhook_headers"].(map[string]string)
			return NewWebhookNotificationChannel(webhookURL, headers), nil
		}
		return nil, fmt.Errorf("webhook_url not configured")

	case AlertChannelSMS:
		apiKey, _ := f.config["sms_api_key"].(string)
		apiURL, _ := f.config["sms_api_url"].(string)
		phoneNumbers, _ := f.config["phone_numbers"].([]string)

		return NewSMSNotificationChannel(apiKey, apiURL, phoneNumbers), nil

	default:
		return nil, fmt.Errorf("unsupported notification channel type: %s", channelType)
	}
}