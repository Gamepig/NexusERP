package main

import (
	"context"
	"database/sql"
	"flag"
	"fmt"
	"log"
	"os"
	"time"

	"nexus-erp/backend/internal/config"
	"nexus-erp/backend/internal/database"
	"nexus-erp/backend/internal/services"

	"github.com/jmoiron/sqlx"
)

func main() {
	var (
		dryRun    = flag.Bool("dry-run", false, "執行模擬運行，不實際加密數據")
		tableName = flag.String("table", "", "指定要加密的表名（可選，不指定則加密所有表）")
		batchSize = flag.Int("batch", 100, "批次處理大小")
		decrypt   = flag.Bool("decrypt", false, "解密數據而非加密")
	)
	flag.Parse()

	fmt.Println("NexusERP 敏感資料加密工具")
	fmt.Println("================================")

	if *decrypt {
		fmt.Println("⚠️  警告：此操作將解密所有敏感資料！")
	} else {
		fmt.Println("🔒 正在準備加密敏感資料...")
	}

	if *dryRun {
		fmt.Println("🔍 模擬運行模式 - 不會實際修改資料")
	}

	// 載入配置
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	// 初始化資料庫連接
	db, err := database.Connect(cfg.Database)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	// 獲取加密金鑰
	encryptionKey := os.Getenv("ENCRYPTION_MASTER_KEY")
	if encryptionKey == "" {
		log.Fatal("ENCRYPTION_MASTER_KEY environment variable is required")
	}

	// 初始化加密服務
	encryptionService, err := services.NewEncryptionService(encryptionKey)
	if err != nil {
		log.Fatalf("Failed to initialize encryption service: %v", err)
	}

	// 創建遷移器
	migrator := &EncryptionMigrator{
		db:                db,
		encryptionService: encryptionService,
		batchSize:         *batchSize,
		dryRun:            *dryRun,
		decrypt:           *decrypt,
	}

	// 執行遷移
	ctx := context.Background()
	if err := migrator.Migrate(ctx, *tableName); err != nil {
		log.Fatalf("Migration failed: %v", err)
	}

	if *decrypt {
		fmt.Println("✅ 解密完成！")
	} else {
		fmt.Println("✅ 加密完成！")
	}
}

// EncryptionMigrator 加密遷移器
type EncryptionMigrator struct {
	db                *sqlx.DB
	encryptionService *services.EncryptionService
	batchSize         int
	dryRun            bool
	decrypt           bool
}

// TableConfig 表配置
type TableConfig struct {
	Name         string
	EncryptedColumns []ColumnConfig
}

// ColumnConfig 欄位配置
type ColumnConfig struct {
	Name              string
	EncryptedFlag     string
	SearchHashColumn  string
	Required          bool
}

// Migrate 執行加密遷移
func (m *EncryptionMigrator) Migrate(ctx context.Context, specificTable string) error {
	tables := m.getTableConfigs()

	for _, table := range tables {
		if specificTable != "" && table.Name != specificTable {
			continue
		}

		fmt.Printf("\n📋 處理表: %s\n", table.Name)

		if err := m.migrateTable(ctx, table); err != nil {
			return fmt.Errorf("failed to migrate table %s: %w", table.Name, err)
		}
	}

	return nil
}

// getTableConfigs 獲取表配置
func (m *EncryptionMigrator) getTableConfigs() []TableConfig {
	return []TableConfig{
		{
			Name: "users",
			EncryptedColumns: []ColumnConfig{
				{"first_name", "first_name_encrypted", "first_name_search_hash", false},
				{"last_name", "last_name_encrypted", "last_name_search_hash", false},
				{"email", "email_encrypted", "email_search_hash", true},
			},
		},
		{
			Name: "customers",
			EncryptedColumns: []ColumnConfig{
				{"name", "name_encrypted", "name_search_hash", true},
				{"email", "email_encrypted", "email_search_hash", false},
				{"phone", "phone_encrypted", "phone_search_hash", false},
				{"address", "address_encrypted", "", false},
				{"tax_id", "tax_id_encrypted", "", false},
			},
		},
		{
			Name: "suppliers",
			EncryptedColumns: []ColumnConfig{
				{"name", "name_encrypted", "name_search_hash", true},
				{"contact_person", "contact_person_encrypted", "", false},
				{"email", "email_encrypted", "email_search_hash", false},
				{"phone", "phone_encrypted", "phone_search_hash", false},
				{"address", "address_encrypted", "", false},
				{"tax_id", "tax_id_encrypted", "", false},
				{"bank_account", "bank_account_encrypted", "", false},
			},
		},
		{
			Name: "employees",
			EncryptedColumns: []ColumnConfig{
				{"first_name", "first_name_encrypted", "first_name_search_hash", false},
				{"last_name", "last_name_encrypted", "last_name_search_hash", false},
				{"email", "email_encrypted", "email_search_hash", false},
				{"phone", "phone_encrypted", "phone_search_hash", false},
				{"address", "address_encrypted", "", false},
				{"bank_account", "bank_account_encrypted", "", false},
				{"tax_id", "tax_id_encrypted", "", false},
			},
		},
	}
}

// migrateTable 遷移單個表
func (m *EncryptionMigrator) migrateTable(ctx context.Context, table TableConfig) error {
	// 檢查表是否存在
	var exists bool
	err := m.db.QueryRow("SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = $1)", table.Name).Scan(&exists)
	if err != nil {
		return fmt.Errorf("failed to check table existence: %w", err)
	}

	if !exists {
		fmt.Printf("⚠️  表 %s 不存在，跳過\n", table.Name)
		return nil
	}

	// 記錄遷移開始
	if err := m.logMigrationStart(table.Name); err != nil {
		return fmt.Errorf("failed to log migration start: %w", err)
	}

	// 獲取總記錄數
	var totalRecords int
	err = m.db.QueryRow(fmt.Sprintf("SELECT COUNT(*) FROM %s", table.Name)).Scan(&totalRecords)
	if err != nil {
		return fmt.Errorf("failed to count records: %w", err)
	}

	fmt.Printf("📊 總記錄數: %d\n", totalRecords)

	if totalRecords == 0 {
		fmt.Printf("ℹ️  表 %s 無資料，跳過\n", table.Name)
		return m.logMigrationComplete(table.Name, 0, 0)
	}

	// 分批處理
	encrypted := 0
	failed := 0

	for offset := 0; offset < totalRecords; offset += m.batchSize {
		batchEncrypted, batchFailed, err := m.processBatch(ctx, table, offset, m.batchSize)
		if err != nil {
			return fmt.Errorf("failed to process batch at offset %d: %w", offset, err)
		}

		encrypted += batchEncrypted
		failed += batchFailed

		progress := float64(offset+m.batchSize) / float64(totalRecords) * 100
		if progress > 100 {
			progress = 100
		}

		fmt.Printf("🔄 進度: %.1f%% (%d/%d) - 成功: %d, 失敗: %d\n", 
			progress, offset+m.batchSize, totalRecords, encrypted, failed)
	}

	// 記錄遷移完成
	return m.logMigrationComplete(table.Name, encrypted, failed)
}

// processBatch 處理批次
func (m *EncryptionMigrator) processBatch(ctx context.Context, table TableConfig, offset, limit int) (encrypted, failed int, err error) {
	// 構建查詢
	query := fmt.Sprintf("SELECT id, %s FROM %s ORDER BY id LIMIT %d OFFSET %d",
		m.getColumnList(table.EncryptedColumns), table.Name, limit, offset)

	rows, err := m.db.Query(query)
	if err != nil {
		return 0, 0, fmt.Errorf("failed to query batch: %w", err)
	}
	defer rows.Close()

	for rows.Next() {
		if err := m.processRow(ctx, table, rows); err != nil {
			fmt.Printf("❌ 處理記錄失敗: %v\n", err)
			failed++
		} else {
			encrypted++
		}
	}

	return encrypted, failed, rows.Err()
}

// getColumnList 獲取欄位列表
func (m *EncryptionMigrator) getColumnList(columns []ColumnConfig) string {
	var result string
	for i, col := range columns {
		if i > 0 {
			result += ", "
		}
		result += col.Name
		if col.EncryptedFlag != "" {
			result += ", " + col.EncryptedFlag
		}
	}
	return result
}

// processRow 處理單行
func (m *EncryptionMigrator) processRow(ctx context.Context, table TableConfig, rows *sql.Rows) error {
	// 準備掃描目標
	var id int64
	values := make([]interface{}, len(table.EncryptedColumns)*2) // 每個欄位可能有加密標記
	scanTargets := make([]interface{}, len(values)+1)            // +1 for id
	scanTargets[0] = &id

	for i := range values {
		var s sql.NullString
		values[i] = &s
		scanTargets[i+1] = &s
	}

	if err := rows.Scan(scanTargets...); err != nil {
		return fmt.Errorf("failed to scan row: %w", err)
	}

	if m.dryRun {
		return nil // 模擬運行，不實際處理
	}

	// 處理每個欄位
	updates := make(map[string]interface{})
	for i, col := range table.EncryptedColumns {
		valueIdx := i * 2
		flagIdx := i*2 + 1

		value := values[valueIdx].(*sql.NullString)
		var isEncrypted bool

		if col.EncryptedFlag != "" && flagIdx < len(values) {
			flag := values[flagIdx].(*sql.NullString)
			isEncrypted = flag.Valid && flag.String == "true"
		}

		if !value.Valid || value.String == "" {
			continue
		}

		var newValue string
		var err error

		if m.decrypt {
			if isEncrypted {
				newValue, err = m.encryptionService.Decrypt(value.String)
				if err != nil {
					return fmt.Errorf("failed to decrypt %s: %w", col.Name, err)
				}
				updates[col.EncryptedFlag] = false
			} else {
				continue // 已經是明文
			}
		} else {
			if !isEncrypted {
				newValue, err = m.encryptionService.Encrypt(value.String)
				if err != nil {
					return fmt.Errorf("failed to encrypt %s: %w", col.Name, err)
				}
				updates[col.EncryptedFlag] = true
				
				// 生成搜索雜湊
				if col.SearchHashColumn != "" {
					searchHash := m.encryptionService.HashForSearch(value.String)
					updates[col.SearchHashColumn] = searchHash
				}
			} else {
				continue // 已經加密
			}
		}

		updates[col.Name] = newValue
	}

	if len(updates) == 0 {
		return nil // 無需更新
	}

	// 執行更新
	return m.updateRow(table.Name, id, updates)
}

// updateRow 更新行
func (m *EncryptionMigrator) updateRow(tableName string, id int64, updates map[string]interface{}) error {
	if len(updates) == 0 {
		return nil
	}

	var setParts []string
	var args []interface{}
	argIndex := 1

	for column, value := range updates {
		setParts = append(setParts, fmt.Sprintf("%s = $%d", column, argIndex))
		args = append(args, value)
		argIndex++
	}

	query := fmt.Sprintf("UPDATE %s SET %s WHERE id = $%d",
		tableName, fmt.Sprintf("%s", setParts), argIndex)
	args = append(args, id)

	_, err := m.db.Exec(query, args...)
	return err
}

// logMigrationStart 記錄遷移開始
func (m *EncryptionMigrator) logMigrationStart(tableName string) error {
	if m.dryRun {
		return nil
	}

	query := `
		INSERT INTO encryption_migration_log (table_name, total_records, migration_status, started_at)
		SELECT $1, COUNT(*), 'in_progress', CURRENT_TIMESTAMP
		FROM ` + tableName + `
		ON CONFLICT (table_name) DO UPDATE SET
			migration_status = 'in_progress',
			started_at = CURRENT_TIMESTAMP,
			completed_at = NULL,
			error_message = NULL
	`

	_, err := m.db.Exec(query, tableName)
	return err
}

// logMigrationComplete 記錄遷移完成
func (m *EncryptionMigrator) logMigrationComplete(tableName string, encrypted, failed int) error {
	if m.dryRun {
		return nil
	}

	status := "completed"
	if failed > 0 {
		status = "completed_with_errors"
	}

	query := `
		UPDATE encryption_migration_log
		SET encrypted_records = $2,
			failed_records = $3,
			migration_status = $4,
			completed_at = CURRENT_TIMESTAMP
		WHERE table_name = $1
	`

	_, err := m.db.Exec(query, tableName, encrypted, failed, status)
	return err
}