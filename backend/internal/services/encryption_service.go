package services

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"fmt"
	"io"
	"strings"

	"golang.org/x/crypto/pbkdf2"
)

// EncryptionService 提供數據庫敏感資料加密服務
type EncryptionService struct {
	masterKey []byte
	gcm       cipher.AEAD
}

// NewEncryptionService 創建新的加密服務
func NewEncryptionService(masterKeyString string) (*EncryptionService, error) {
	if len(masterKeyString) < 32 {
		return nil, fmt.Errorf("master key must be at least 32 characters long")
	}

	// 使用 PBKDF2 從主密鑰派生加密密鑰
	salt := []byte("nexus-erp-encryption-salt-2025") // 在生產環境中應該從環境變數獲取
	masterKey := pbkdf2.Key([]byte(masterKeyString), salt, 10000, 32, sha256.New)

	// 創建 AES-256-GCM 加密器
	block, err := aes.NewCipher(masterKey)
	if err != nil {
		return nil, fmt.Errorf("failed to create AES cipher: %w", err)
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return nil, fmt.Errorf("failed to create GCM: %w", err)
	}

	return &EncryptionService{
		masterKey: masterKey,
		gcm:       gcm,
	}, nil
}

// Encrypt 加密明文數據
func (e *EncryptionService) Encrypt(plaintext string) (string, error) {
	if plaintext == "" {
		return "", nil
	}

	// 生成隨機 nonce
	nonce := make([]byte, e.gcm.NonceSize())
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return "", fmt.Errorf("failed to generate nonce: %w", err)
	}

	// 加密數據
	ciphertext := e.gcm.Seal(nonce, nonce, []byte(plaintext), nil)

	// 使用 base64 編碼
	return base64.StdEncoding.EncodeToString(ciphertext), nil
}

// Decrypt 解密密文數據
func (e *EncryptionService) Decrypt(ciphertext string) (string, error) {
	if ciphertext == "" {
		return "", nil
	}

	// Base64 解碼
	data, err := base64.StdEncoding.DecodeString(ciphertext)
	if err != nil {
		return "", fmt.Errorf("failed to decode base64: %w", err)
	}

	nonceSize := e.gcm.NonceSize()
	if len(data) < nonceSize {
		return "", fmt.Errorf("ciphertext too short")
	}

	// 分離 nonce 和加密數據
	nonce, cipherBytes := data[:nonceSize], data[nonceSize:]

	// 解密
	plaintext, err := e.gcm.Open(nil, nonce, cipherBytes, nil)
	if err != nil {
		return "", fmt.Errorf("failed to decrypt: %w", err)
	}

	return string(plaintext), nil
}

// EncryptSensitiveData 加密敏感數據結構
func (e *EncryptionService) EncryptSensitiveData(data *SensitiveData) error {
	var err error

	// 加密個人識別資訊
	if data.FirstName != nil && *data.FirstName != "" {
		*data.FirstName, err = e.Encrypt(*data.FirstName)
		if err != nil {
			return fmt.Errorf("failed to encrypt first name: %w", err)
		}
	}

	if data.LastName != nil && *data.LastName != "" {
		*data.LastName, err = e.Encrypt(*data.LastName)
		if err != nil {
			return fmt.Errorf("failed to encrypt last name: %w", err)
		}
	}

	if data.Email != nil && *data.Email != "" {
		*data.Email, err = e.Encrypt(*data.Email)
		if err != nil {
			return fmt.Errorf("failed to encrypt email: %w", err)
		}
	}

	if data.Phone != nil && *data.Phone != "" {
		*data.Phone, err = e.Encrypt(*data.Phone)
		if err != nil {
			return fmt.Errorf("failed to encrypt phone: %w", err)
		}
	}

	if data.Address != nil && *data.Address != "" {
		*data.Address, err = e.Encrypt(*data.Address)
		if err != nil {
			return fmt.Errorf("failed to encrypt address: %w", err)
		}
	}

	// 加密財務資訊
	if data.BankAccount != nil && *data.BankAccount != "" {
		*data.BankAccount, err = e.Encrypt(*data.BankAccount)
		if err != nil {
			return fmt.Errorf("failed to encrypt bank account: %w", err)
		}
	}

	if data.TaxID != nil && *data.TaxID != "" {
		*data.TaxID, err = e.Encrypt(*data.TaxID)
		if err != nil {
			return fmt.Errorf("failed to encrypt tax ID: %w", err)
		}
	}

	// 加密註釋或備註
	if data.Notes != nil && *data.Notes != "" {
		*data.Notes, err = e.Encrypt(*data.Notes)
		if err != nil {
			return fmt.Errorf("failed to encrypt notes: %w", err)
		}
	}

	return nil
}

// DecryptSensitiveData 解密敏感數據結構
func (e *EncryptionService) DecryptSensitiveData(data *SensitiveData) error {
	var err error

	// 解密個人識別資訊
	if data.FirstName != nil && *data.FirstName != "" {
		*data.FirstName, err = e.Decrypt(*data.FirstName)
		if err != nil {
			return fmt.Errorf("failed to decrypt first name: %w", err)
		}
	}

	if data.LastName != nil && *data.LastName != "" {
		*data.LastName, err = e.Decrypt(*data.LastName)
		if err != nil {
			return fmt.Errorf("failed to decrypt last name: %w", err)
		}
	}

	if data.Email != nil && *data.Email != "" {
		*data.Email, err = e.Decrypt(*data.Email)
		if err != nil {
			return fmt.Errorf("failed to decrypt email: %w", err)
		}
	}

	if data.Phone != nil && *data.Phone != "" {
		*data.Phone, err = e.Decrypt(*data.Phone)
		if err != nil {
			return fmt.Errorf("failed to decrypt phone: %w", err)
		}
	}

	if data.Address != nil && *data.Address != "" {
		*data.Address, err = e.Decrypt(*data.Address)
		if err != nil {
			return fmt.Errorf("failed to decrypt address: %w", err)
		}
	}

	// 解密財務資訊
	if data.BankAccount != nil && *data.BankAccount != "" {
		*data.BankAccount, err = e.Decrypt(*data.BankAccount)
		if err != nil {
			return fmt.Errorf("failed to decrypt bank account: %w", err)
		}
	}

	if data.TaxID != nil && *data.TaxID != "" {
		*data.TaxID, err = e.Decrypt(*data.TaxID)
		if err != nil {
			return fmt.Errorf("failed to decrypt tax ID: %w", err)
		}
	}

	// 解密註釋或備註
	if data.Notes != nil && *data.Notes != "" {
		*data.Notes, err = e.Decrypt(*data.Notes)
		if err != nil {
			return fmt.Errorf("failed to decrypt notes: %w", err)
		}
	}

	return nil
}

// HashForSearch 為搜索創建單向雜湊
func (e *EncryptionService) HashForSearch(plaintext string) string {
	if plaintext == "" {
		return ""
	}

	// 使用 PBKDF2 創建一致的雜湊，用於搜索
	salt := []byte("nexus-erp-search-salt-2025")
	hash := pbkdf2.Key([]byte(strings.ToLower(plaintext)), salt, 1000, 32, sha256.New)
	return base64.StdEncoding.EncodeToString(hash)
}

// MaskSensitiveData 遮罩敏感資料用於日誌
func (e *EncryptionService) MaskSensitiveData(data string) string {
	if len(data) <= 4 {
		return strings.Repeat("*", len(data))
	}

	if len(data) <= 8 {
		return data[:2] + strings.Repeat("*", len(data)-4) + data[len(data)-2:]
	}

	return data[:3] + strings.Repeat("*", len(data)-6) + data[len(data)-3:]
}

// IsEncrypted 檢查字符串是否已加密
func (e *EncryptionService) IsEncrypted(data string) bool {
	// 檢查是否是有效的 base64 編碼且長度合理
	if _, err := base64.StdEncoding.DecodeString(data); err != nil {
		return false
	}

	// 嘗試解密以確認
	_, err := e.Decrypt(data)
	return err == nil
}

// SensitiveData 敏感數據結構
type SensitiveData struct {
	FirstName   *string `json:"first_name,omitempty"`
	LastName    *string `json:"last_name,omitempty"`
	Email       *string `json:"email,omitempty"`
	Phone       *string `json:"phone,omitempty"`
	Address     *string `json:"address,omitempty"`
	BankAccount *string `json:"bank_account,omitempty"`
	TaxID       *string `json:"tax_id,omitempty"`
	Notes       *string `json:"notes,omitempty"`
}

// EncryptedField 加密欄位標記介面
type EncryptedField interface {
	Encrypt(service *EncryptionService) error
	Decrypt(service *EncryptionService) error
	IsEncrypted() bool
}

// EncryptedString 可加密的字符串類型
type EncryptedString struct {
	Value     string
	encrypted bool
}

// NewEncryptedString 創建新的加密字符串
func NewEncryptedString(value string) *EncryptedString {
	return &EncryptedString{
		Value:     value,
		encrypted: false,
	}
}

// Encrypt 加密字符串
func (es *EncryptedString) Encrypt(service *EncryptionService) error {
	if es.encrypted || es.Value == "" {
		return nil
	}

	encrypted, err := service.Encrypt(es.Value)
	if err != nil {
		return err
	}

	es.Value = encrypted
	es.encrypted = true
	return nil
}

// Decrypt 解密字符串
func (es *EncryptedString) Decrypt(service *EncryptionService) error {
	if !es.encrypted || es.Value == "" {
		return nil
	}

	decrypted, err := service.Decrypt(es.Value)
	if err != nil {
		return err
	}

	es.Value = decrypted
	es.encrypted = false
	return nil
}

// IsEncrypted 檢查是否已加密
func (es *EncryptedString) IsEncrypted() bool {
	return es.encrypted
}

// String 返回字符串值
func (es *EncryptedString) String() string {
	return es.Value
}

// MarshalJSON JSON 序列化
func (es *EncryptedString) MarshalJSON() ([]byte, error) {
	return []byte(`"` + es.Value + `"`), nil
}

// UnmarshalJSON JSON 反序列化
func (es *EncryptedString) UnmarshalJSON(data []byte) error {
	// 去除引號
	if len(data) >= 2 && data[0] == '"' && data[len(data)-1] == '"' {
		es.Value = string(data[1 : len(data)-1])
	} else {
		es.Value = string(data)
	}
	
	// 假設從資料庫讀取的數據已加密
	es.encrypted = true
	return nil
}