package auth

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"fmt"
	"time"

	"nexus-erp/backend/internal/monitoring"
	
	"github.com/jmoiron/sqlx"
	"github.com/pquerna/otp/totp"
)

// MFAMethod 多因子認證方法類型
type MFAMethod string

const (
	MFAMethodTOTP  MFAMethod = "totp"  // Time-based OTP
	MFAMethodSMS   MFAMethod = "sms"   // SMS驗證碼
	MFAMethodEmail MFAMethod = "email" // Email驗證碼
	MFAMethodBackup MFAMethod = "backup" // 備份代碼
)

// MFADevice 多因子認證設備
type MFADevice struct {
	ID           int64     `json:"id" db:"id"`
	UserID       int64     `json:"user_id" db:"user_id"`
	CompanyID    int64     `json:"company_id" db:"company_id"`
	DeviceName   string    `json:"device_name" db:"device_name"`
	Method       MFAMethod `json:"method" db:"method"`
	Secret       string    `json:"-" db:"secret"`               // 加密存儲，不返回給客戶端
	BackupCodes  string    `json:"-" db:"backup_codes"`         // 備份代碼，加密存儲
	IsActive     bool      `json:"is_active" db:"is_active"`
	IsVerified   bool      `json:"is_verified" db:"is_verified"`
	LastUsedAt   *time.Time `json:"last_used_at" db:"last_used_at"`
	CreatedAt    time.Time `json:"created_at" db:"created_at"`
	UpdatedAt    time.Time `json:"updated_at" db:"updated_at"`
}

// MFAChallenge MFA驗證挑戰
type MFAChallenge struct {
	ID         int64     `json:"id" db:"id"`
	UserID     int64     `json:"user_id" db:"user_id"`
	CompanyID  int64     `json:"company_id" db:"company_id"`
	DeviceID   int64     `json:"device_id" db:"device_id"`
	Challenge  string    `json:"challenge" db:"challenge"`
	ExpiresAt  time.Time `json:"expires_at" db:"expires_at"`
	IsVerified bool      `json:"is_verified" db:"is_verified"`
	CreatedAt  time.Time `json:"created_at" db:"created_at"`
}

// MFAService 多因子認證服務
type MFAService struct {
	db      *sqlx.DB
	monitor *monitoring.SecurityMonitor
	issuer  string
}

func NewMFAService(db *sqlx.DB, monitor *monitoring.SecurityMonitor, issuer string) *MFAService {
	return &MFAService{
		db:      db,
		monitor: monitor,
		issuer:  issuer,
	}
}

// SetupTOTP 設置TOTP多因子認證
func (m *MFAService) SetupTOTP(ctx context.Context, userID, companyID int64, deviceName, accountName string) (*MFADevice, string, error) {
	// 生成TOTP密鑰
	key, err := totp.Generate(totp.GenerateOpts{
		Issuer:      m.issuer,
		AccountName: accountName,
		SecretSize:  32,
	})
	if err != nil {
		return nil, "", fmt.Errorf("failed to generate TOTP key: %w", err)
	}

	// 生成備份代碼
	backupCodes, err := m.generateBackupCodes()
	if err != nil {
		return nil, "", fmt.Errorf("failed to generate backup codes: %w", err)
	}

	// 創建MFA設備記錄
	device := &MFADevice{
		UserID:      userID,
		CompanyID:   companyID,
		DeviceName:  deviceName,
		Method:      MFAMethodTOTP,
		Secret:      key.Secret(),
		BackupCodes: backupCodes,
		IsActive:    false, // 需要驗證後才啟用
		IsVerified:  false,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	// 插入資料庫
	query := `
		INSERT INTO mfa_devices (user_id, company_id, device_name, method, secret, backup_codes, is_active, is_verified, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
		RETURNING id
	`
	err = m.db.QueryRowContext(ctx, query,
		device.UserID, device.CompanyID, device.DeviceName, device.Method,
		device.Secret, device.BackupCodes, device.IsActive, device.IsVerified,
		device.CreatedAt, device.UpdatedAt,
	).Scan(&device.ID)

	if err != nil {
		return nil, "", fmt.Errorf("failed to save MFA device: %w", err)
	}

	// 記錄安全事件
	m.monitor.LogSecurityEvent(ctx, monitoring.SecurityEvent{
		EventType: "mfa_setup_started",
		UserID:    &userID,
		CompanyID: &companyID,
		Details: map[string]interface{}{
			"device_name": deviceName,
			"method":      string(MFAMethodTOTP),
		},
		Severity: "info",
	})

	return device, key.URL(), nil
}

// VerifyTOTPSetup 驗證TOTP設置
func (m *MFAService) VerifyTOTPSetup(ctx context.Context, deviceID int64, code string, ipAddress, userAgent string) error {
	// 獲取設備信息
	device, err := m.getMFADevice(ctx, deviceID)
	if err != nil {
		return err
	}

	// 驗證TOTP代碼
	valid := totp.Validate(code, device.Secret)
	if !valid {
		// 記錄失敗事件
		m.monitor.LogSecurityEvent(ctx, monitoring.SecurityEvent{
			EventType: "mfa_setup_verification_failed",
			UserID:    &device.UserID,
			CompanyID: &device.CompanyID,
			IPAddress: ipAddress,
			UserAgent: userAgent,
			Details: map[string]interface{}{
				"device_id": deviceID,
				"method":    string(device.Method),
			},
			Severity: "warning",
		})
		return fmt.Errorf("invalid TOTP code")
	}

	// 啟用設備
	query := `
		UPDATE mfa_devices 
		SET is_active = true, is_verified = true, updated_at = NOW()
		WHERE id = $1
	`
	_, err = m.db.ExecContext(ctx, query, deviceID)
	if err != nil {
		return fmt.Errorf("failed to activate MFA device: %w", err)
	}

	// 記錄成功事件
	m.monitor.LogSecurityEvent(ctx, monitoring.SecurityEvent{
		EventType: "mfa_setup_completed",
		UserID:    &device.UserID,
		CompanyID: &device.CompanyID,
		IPAddress: ipAddress,
		UserAgent: userAgent,
		Details: map[string]interface{}{
			"device_id":   deviceID,
			"device_name": device.DeviceName,
			"method":      string(device.Method),
		},
		Severity: "info",
	})

	return nil
}

// CreateMFAChallenge 創建MFA驗證挑戰
func (m *MFAService) CreateMFAChallenge(ctx context.Context, userID, companyID int64) (*MFAChallenge, error) {
	// 獲取用戶的有效MFA設備
	devices, err := m.GetUserMFADevices(ctx, userID, companyID)
	if err != nil {
		return nil, err
	}

	if len(devices) == 0 {
		return nil, fmt.Errorf("no MFA devices configured for user")
	}

	// 使用第一個活躍設備
	var activeDevice *MFADevice
	for _, device := range devices {
		if device.IsActive && device.IsVerified {
			activeDevice = &device
			break
		}
	}

	if activeDevice == nil {
		return nil, fmt.Errorf("no active MFA devices found")
	}

	// 生成挑戰代碼
	challengeBytes := make([]byte, 32)
	_, err = rand.Read(challengeBytes)
	if err != nil {
		return nil, fmt.Errorf("failed to generate challenge: %w", err)
	}
	challengeCode := base64.URLEncoding.EncodeToString(challengeBytes)

	// 創建挑戰記錄
	challenge := &MFAChallenge{
		UserID:     userID,
		CompanyID:  companyID,
		DeviceID:   activeDevice.ID,
		Challenge:  challengeCode,
		ExpiresAt:  time.Now().Add(5 * time.Minute), // 5分鐘過期
		IsVerified: false,
		CreatedAt:  time.Now(),
	}

	query := `
		INSERT INTO mfa_challenges (user_id, company_id, device_id, challenge, expires_at, is_verified, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id
	`
	err = m.db.QueryRowContext(ctx, query,
		challenge.UserID, challenge.CompanyID, challenge.DeviceID,
		challenge.Challenge, challenge.ExpiresAt, challenge.IsVerified,
		challenge.CreatedAt,
	).Scan(&challenge.ID)

	if err != nil {
		return nil, fmt.Errorf("failed to save MFA challenge: %w", err)
	}

	return challenge, nil
}

// VerifyMFAChallenge 驗證MFA挑戰
func (m *MFAService) VerifyMFAChallenge(ctx context.Context, challengeID int64, code string, ipAddress, userAgent string) error {
	// 獲取挑戰信息
	var challenge MFAChallenge
	query := `
		SELECT id, user_id, company_id, device_id, challenge, expires_at, is_verified, created_at
		FROM mfa_challenges
		WHERE id = $1 AND expires_at > NOW() AND is_verified = false
	`
	err := m.db.GetContext(ctx, &challenge, query, challengeID)
	if err != nil {
		return fmt.Errorf("invalid or expired challenge: %w", err)
	}

	// 獲取設備信息
	device, err := m.getMFADevice(ctx, challenge.DeviceID)
	if err != nil {
		return err
	}

	var valid bool

	switch device.Method {
	case MFAMethodTOTP:
		// 驗證TOTP代碼
		valid = totp.Validate(code, device.Secret)
		
		// 也檢查備份代碼
		if !valid {
			valid = m.validateBackupCode(device.BackupCodes, code)
			if valid {
				// 使用後移除備份代碼
				err = m.removeUsedBackupCode(ctx, device.ID, code)
				if err != nil {
					return fmt.Errorf("failed to update backup codes: %w", err)
				}
			}
		}
	default:
		return fmt.Errorf("unsupported MFA method: %s", device.Method)
	}

	if !valid {
		// 記錄失敗事件
		m.monitor.LogSecurityEvent(ctx, monitoring.SecurityEvent{
			EventType: "mfa_verification_failed",
			UserID:    &challenge.UserID,
			CompanyID: &challenge.CompanyID,
			IPAddress: ipAddress,
			UserAgent: userAgent,
			Details: map[string]interface{}{
				"challenge_id": challengeID,
				"device_id":    device.ID,
				"method":       string(device.Method),
			},
			Severity: "warning",
		})
		return fmt.Errorf("invalid MFA code")
	}

	// 標記挑戰為已驗證
	updateQuery := `
		UPDATE mfa_challenges 
		SET is_verified = true 
		WHERE id = $1
	`
	_, err = m.db.ExecContext(ctx, updateQuery, challengeID)
	if err != nil {
		return fmt.Errorf("failed to update challenge: %w", err)
	}

	// 更新設備最後使用時間
	now := time.Now()
	deviceUpdateQuery := `
		UPDATE mfa_devices 
		SET last_used_at = $1, updated_at = $1
		WHERE id = $2
	`
	_, err = m.db.ExecContext(ctx, deviceUpdateQuery, now, device.ID)
	if err != nil {
		return fmt.Errorf("failed to update device: %w", err)
	}

	// 記錄成功事件
	m.monitor.LogSecurityEvent(ctx, monitoring.SecurityEvent{
		EventType: "mfa_verification_success",
		UserID:    &challenge.UserID,
		CompanyID: &challenge.CompanyID,
		IPAddress: ipAddress,
		UserAgent: userAgent,
		Details: map[string]interface{}{
			"challenge_id": challengeID,
			"device_id":    device.ID,
			"method":       string(device.Method),
		},
		Severity: "info",
	})

	return nil
}

// GetUserMFADevices 獲取用戶的MFA設備列表
func (m *MFAService) GetUserMFADevices(ctx context.Context, userID, companyID int64) ([]MFADevice, error) {
	query := `
		SELECT id, user_id, company_id, device_name, method, is_active, is_verified, last_used_at, created_at, updated_at
		FROM mfa_devices
		WHERE user_id = $1 AND company_id = $2
		ORDER BY created_at DESC
	`
	
	var devices []MFADevice
	err := m.db.SelectContext(ctx, &devices, query, userID, companyID)
	if err != nil {
		return nil, fmt.Errorf("failed to get MFA devices: %w", err)
	}

	return devices, nil
}

// DisableMFADevice 禁用MFA設備
func (m *MFAService) DisableMFADevice(ctx context.Context, deviceID int64, ipAddress, userAgent string) error {
	device, err := m.getMFADevice(ctx, deviceID)
	if err != nil {
		return err
	}

	query := `
		UPDATE mfa_devices 
		SET is_active = false, updated_at = NOW()
		WHERE id = $1
	`
	_, err = m.db.ExecContext(ctx, query, deviceID)
	if err != nil {
		return fmt.Errorf("failed to disable MFA device: %w", err)
	}

	// 記錄安全事件
	m.monitor.LogSecurityEvent(ctx, monitoring.SecurityEvent{
		EventType: "mfa_device_disabled",
		UserID:    &device.UserID,
		CompanyID: &device.CompanyID,
		IPAddress: ipAddress,
		UserAgent: userAgent,
		Details: map[string]interface{}{
			"device_id":   deviceID,
			"device_name": device.DeviceName,
			"method":      string(device.Method),
		},
		Severity: "warning",
	})

	return nil
}

// 輔助方法

func (m *MFAService) getMFADevice(ctx context.Context, deviceID int64) (*MFADevice, error) {
	var device MFADevice
	query := `
		SELECT id, user_id, company_id, device_name, method, secret, backup_codes, 
		       is_active, is_verified, last_used_at, created_at, updated_at
		FROM mfa_devices
		WHERE id = $1
	`
	err := m.db.GetContext(ctx, &device, query, deviceID)
	if err != nil {
		return nil, fmt.Errorf("MFA device not found: %w", err)
	}
	return &device, nil
}

func (m *MFAService) generateBackupCodes() (string, error) {
	codes := make([]string, 8) // 生成8個備份代碼
	for i := 0; i < 8; i++ {
		codeBytes := make([]byte, 8)
		_, err := rand.Read(codeBytes)
		if err != nil {
			return "", err
		}
		codes[i] = base64.URLEncoding.EncodeToString(codeBytes)[:12] // 12字符的代碼
	}
	
	// 這裡應該加密存儲，簡化版本直接用逗號分隔
	return fmt.Sprintf("%s", codes), nil
}

func (m *MFAService) validateBackupCode(backupCodes, code string) bool {
	// 簡化版本：檢查代碼是否在備份代碼列表中
	// 實際應用中應該加密比較
	return false // 暫時返回false，需要實作加密存儲和驗證
}

func (m *MFAService) removeUsedBackupCode(ctx context.Context, deviceID int64, usedCode string) error {
	// 簡化版本：暫不實作
	// 實際應用中需要從加密的備份代碼列表中移除已使用的代碼
	return nil
}