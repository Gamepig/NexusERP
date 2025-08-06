package services

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/jmoiron/sqlx"
)

// AuditEvent 審計事件結構
type AuditEvent struct {
	ID          int64                  `json:"id" db:"id"`
	UserID      *int64                 `json:"user_id,omitempty" db:"user_id"`
	Action      string                 `json:"action" db:"action"`
	Resource    string                 `json:"resource" db:"resource"`
	ResourceID  *string                `json:"resource_id,omitempty" db:"resource_id"`
	IPAddress   string                 `json:"ip_address" db:"ip_address"`
	UserAgent   string                 `json:"user_agent" db:"user_agent"`
	Metadata    map[string]interface{} `json:"metadata,omitempty" db:"metadata"`
	Success     bool                   `json:"success" db:"success"`
	ErrorMessage *string               `json:"error_message,omitempty" db:"error_message"`
	Timestamp   time.Time              `json:"timestamp" db:"timestamp"`
}

// AuditService 審計服務
type AuditService struct {
	db *sqlx.DB
}

// NewAuditService 創建新的審計服務
func NewAuditService(db *sqlx.DB) *AuditService {
	return &AuditService{db: db}
}

// LogEvent 記錄審計事件
func (s *AuditService) LogEvent(event *AuditEvent) error {
	if event.Timestamp.IsZero() {
		event.Timestamp = time.Now()
	}

	metadataJSON, err := json.Marshal(event.Metadata)
	if err != nil {
		return fmt.Errorf("failed to marshal metadata: %w", err)
	}

	query := `
		INSERT INTO audit_logs (user_id, action, resource, resource_id, ip_address, user_agent, metadata, success, error_message, timestamp)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
		RETURNING id
	`

	err = s.db.QueryRow(
		query,
		event.UserID,
		event.Action,
		event.Resource,
		event.ResourceID,
		event.IPAddress,
		event.UserAgent,
		string(metadataJSON),
		event.Success,
		event.ErrorMessage,
		event.Timestamp,
	).Scan(&event.ID)

	if err != nil {
		return fmt.Errorf("failed to insert audit log: %w", err)
	}

	return nil
}

// LogLoginAttempt 記錄登入嘗試
func (s *AuditService) LogLoginAttempt(userID *int64, username, ipAddress, userAgent string, success bool, errorMsg *string) error {
	metadata := map[string]interface{}{
		"username": username,
	}

	event := &AuditEvent{
		UserID:       userID,
		Action:       "login",
		Resource:     "auth",
		IPAddress:    ipAddress,
		UserAgent:    userAgent,
		Metadata:     metadata,
		Success:      success,
		ErrorMessage: errorMsg,
	}

	return s.LogEvent(event)
}

// LogPasswordReset 記錄密碼重設事件
func (s *AuditService) LogPasswordReset(userID int64, ipAddress, userAgent string, success bool, errorMsg *string) error {
	event := &AuditEvent{
		UserID:       &userID,
		Action:       "password_reset",
		Resource:     "auth",
		IPAddress:    ipAddress,
		UserAgent:    userAgent,
		Success:      success,
		ErrorMessage: errorMsg,
	}

	return s.LogEvent(event)
}

// LogResourceAccess 記錄資源存取事件
func (s *AuditService) LogResourceAccess(userID int64, action, resource, resourceID, ipAddress, userAgent string, success bool, errorMsg *string) error {
	event := &AuditEvent{
		UserID:       &userID,
		Action:       action,
		Resource:     resource,
		ResourceID:   &resourceID,
		IPAddress:    ipAddress,
		UserAgent:    userAgent,
		Success:      success,
		ErrorMessage: errorMsg,
	}

	return s.LogEvent(event)
}

// GetAuditLogs 獲取審計日誌
func (s *AuditService) GetAuditLogs(userID *int64, action, resource string, limit, offset int) ([]AuditEvent, error) {
	query := `
		SELECT id, user_id, action, resource, resource_id, ip_address, user_agent, metadata, success, error_message, timestamp
		FROM audit_logs
		WHERE ($1::bigint IS NULL OR user_id = $1)
		  AND ($2::text IS NULL OR action = $2)
		  AND ($3::text IS NULL OR resource = $3)
		ORDER BY timestamp DESC
		LIMIT $4 OFFSET $5
	`

	rows, err := s.db.Query(query, userID, action, resource, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to query audit logs: %w", err)
	}
	defer rows.Close()

	var events []AuditEvent
	for rows.Next() {
		var event AuditEvent
		var metadataJSON string

		err := rows.Scan(
			&event.ID,
			&event.UserID,
			&event.Action,
			&event.Resource,
			&event.ResourceID,
			&event.IPAddress,
			&event.UserAgent,
			&metadataJSON,
			&event.Success,
			&event.ErrorMessage,
			&event.Timestamp,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan audit log: %w", err)
		}

		if metadataJSON != "" {
			err = json.Unmarshal([]byte(metadataJSON), &event.Metadata)
			if err != nil {
				// 如果解析失敗，設置為空，不讓錯誤阻斷整個查詢
				event.Metadata = make(map[string]interface{})
			}
		}

		events = append(events, event)
	}

	return events, nil
}

// GetFailedLoginAttempts 獲取失敗的登入嘗試
func (s *AuditService) GetFailedLoginAttempts(ipAddress string, since time.Time) (int, error) {
	query := `
		SELECT COUNT(*)
		FROM audit_logs
		WHERE action = 'login'
		  AND ip_address = $1
		  AND success = false
		  AND timestamp > $2
	`

	var count int
	err := s.db.QueryRow(query, ipAddress, since).Scan(&count)
	if err != nil {
		return 0, fmt.Errorf("failed to query failed login attempts: %w", err)
	}

	return count, nil
}