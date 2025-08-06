-- 為敏感資料加密遷移
-- 注意：這個遷移需要在應用程式層面執行，因為需要使用加密服務
-- 這個 SQL 檔案主要用於記錄遷移結構

-- 創建備份表來保存原始數據（僅在開發環境）
-- DO NOT RUN IN PRODUCTION WITHOUT PROPER BACKUP

-- 為用戶表添加加密標記欄位
ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name_encrypted BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name_encrypted BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_encrypted BOOLEAN DEFAULT FALSE;

-- 為客戶表添加加密標記欄位
ALTER TABLE customers ADD COLUMN IF NOT EXISTS name_encrypted BOOLEAN DEFAULT FALSE;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS email_encrypted BOOLEAN DEFAULT FALSE;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS phone_encrypted BOOLEAN DEFAULT FALSE;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS address_encrypted BOOLEAN DEFAULT FALSE;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS tax_id_encrypted BOOLEAN DEFAULT FALSE;

-- 為供應商表添加加密標記欄位
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS name_encrypted BOOLEAN DEFAULT FALSE;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS contact_person_encrypted BOOLEAN DEFAULT FALSE;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS email_encrypted BOOLEAN DEFAULT FALSE;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS phone_encrypted BOOLEAN DEFAULT FALSE;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS address_encrypted BOOLEAN DEFAULT FALSE;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS tax_id_encrypted BOOLEAN DEFAULT FALSE;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS bank_account_encrypted BOOLEAN DEFAULT FALSE;

-- 為員工表添加加密標記欄位（如果存在）
ALTER TABLE employees ADD COLUMN IF NOT EXISTS first_name_encrypted BOOLEAN DEFAULT FALSE;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS last_name_encrypted BOOLEAN DEFAULT FALSE;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS email_encrypted BOOLEAN DEFAULT FALSE;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS phone_encrypted BOOLEAN DEFAULT FALSE;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS address_encrypted BOOLEAN DEFAULT FALSE;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS bank_account_encrypted BOOLEAN DEFAULT FALSE;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS tax_id_encrypted BOOLEAN DEFAULT FALSE;

-- 為財務相關表添加加密標記
-- 發票表
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS customer_details_encrypted BOOLEAN DEFAULT FALSE;

-- 應收帳款表 (暫時跳過，表不存在)
-- ALTER TABLE ar_invoices ADD COLUMN IF NOT EXISTS customer_details_encrypted BOOLEAN DEFAULT FALSE;

-- 應付帳款表 (暫時跳過，表不存在)
-- ALTER TABLE ap_invoices ADD COLUMN IF NOT EXISTS supplier_details_encrypted BOOLEAN DEFAULT FALSE;

-- 創建搜索雜湊欄位用於加密數據搜索
-- 用戶表搜索欄位
ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name_search_hash VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name_search_hash VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_search_hash VARCHAR(255);

-- 客戶表搜索欄位
ALTER TABLE customers ADD COLUMN IF NOT EXISTS name_search_hash VARCHAR(255);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS email_search_hash VARCHAR(255);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS phone_search_hash VARCHAR(255);

-- 供應商表搜索欄位
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS name_search_hash VARCHAR(255);
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS email_search_hash VARCHAR(255);
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS phone_search_hash VARCHAR(255);

-- 員工表搜索欄位
ALTER TABLE employees ADD COLUMN IF NOT EXISTS first_name_search_hash VARCHAR(255);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS last_name_search_hash VARCHAR(255);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS email_search_hash VARCHAR(255);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS phone_search_hash VARCHAR(255);

-- 為搜索雜湊欄位創建索引
CREATE INDEX IF NOT EXISTS idx_users_first_name_search_hash ON users(first_name_search_hash);
CREATE INDEX IF NOT EXISTS idx_users_last_name_search_hash ON users(last_name_search_hash);
CREATE INDEX IF NOT EXISTS idx_users_email_search_hash ON users(email_search_hash);

CREATE INDEX IF NOT EXISTS idx_customers_name_search_hash ON customers(name_search_hash);
CREATE INDEX IF NOT EXISTS idx_customers_email_search_hash ON customers(email_search_hash);
CREATE INDEX IF NOT EXISTS idx_customers_phone_search_hash ON customers(phone_search_hash);

CREATE INDEX IF NOT EXISTS idx_suppliers_name_search_hash ON suppliers(name_search_hash);
CREATE INDEX IF NOT EXISTS idx_suppliers_email_search_hash ON suppliers(email_search_hash);
CREATE INDEX IF NOT EXISTS idx_suppliers_phone_search_hash ON suppliers(phone_search_hash);

CREATE INDEX IF NOT EXISTS idx_employees_first_name_search_hash ON employees(first_name_search_hash);
CREATE INDEX IF NOT EXISTS idx_employees_last_name_search_hash ON employees(last_name_search_hash);
CREATE INDEX IF NOT EXISTS idx_employees_email_search_hash ON employees(email_search_hash);
CREATE INDEX IF NOT EXISTS idx_employees_phone_search_hash ON employees(phone_search_hash);

-- 創建加密設定表
CREATE TABLE IF NOT EXISTS encryption_settings (
    id SERIAL PRIMARY KEY,
    table_name VARCHAR(100) NOT NULL,
    column_name VARCHAR(100) NOT NULL,
    encryption_enabled BOOLEAN DEFAULT TRUE,
    encryption_algorithm VARCHAR(50) DEFAULT 'AES-256-GCM',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(table_name, column_name)
);

-- 插入加密設定記錄
INSERT INTO encryption_settings (table_name, column_name) VALUES
-- 用戶表
('users', 'first_name'),
('users', 'last_name'),
('users', 'email'),

-- 客戶表
('customers', 'name'),
('customers', 'email'),
('customers', 'phone'),
('customers', 'address'),
('customers', 'tax_id'),

-- 供應商表
('suppliers', 'name'),
('suppliers', 'contact_person'),
('suppliers', 'email'),
('suppliers', 'phone'),
('suppliers', 'address'),
('suppliers', 'tax_id'),
('suppliers', 'bank_account'),

-- 員工表
('employees', 'first_name'),
('employees', 'last_name'),
('employees', 'email'),
('employees', 'phone'),
('employees', 'address'),
('employees', 'bank_account'),
('employees', 'tax_id')

ON CONFLICT (table_name, column_name) DO NOTHING;

-- 創建加密遷移日誌表
CREATE TABLE IF NOT EXISTS encryption_migration_log (
    id SERIAL PRIMARY KEY,
    table_name VARCHAR(100) NOT NULL,
    total_records INTEGER NOT NULL,
    encrypted_records INTEGER DEFAULT 0,
    failed_records INTEGER DEFAULT 0,
    migration_status VARCHAR(20) DEFAULT 'pending', -- pending, in_progress, completed, failed
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 添加表註解
COMMENT ON TABLE encryption_settings IS '敏感資料加密設定表';
COMMENT ON TABLE encryption_migration_log IS '敏感資料加密遷移日誌表';

COMMENT ON COLUMN encryption_settings.table_name IS '需要加密的表名';
COMMENT ON COLUMN encryption_settings.column_name IS '需要加密的欄位名';
COMMENT ON COLUMN encryption_settings.encryption_enabled IS '是否啟用加密';
COMMENT ON COLUMN encryption_settings.encryption_algorithm IS '使用的加密算法';

COMMENT ON COLUMN encryption_migration_log.migration_status IS '遷移狀態：pending, in_progress, completed, failed';