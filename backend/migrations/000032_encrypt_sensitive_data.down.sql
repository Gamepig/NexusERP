-- 回滾敏感資料加密遷移
-- 警告：這將移除所有加密相關的欄位和設定，請確保資料已解密

-- 移除加密設定和日誌表
DROP TABLE IF EXISTS encryption_migration_log;
DROP TABLE IF EXISTS encryption_settings;

-- 移除搜索雜湊索引
DROP INDEX IF EXISTS idx_employees_phone_search_hash;
DROP INDEX IF EXISTS idx_employees_email_search_hash;
DROP INDEX IF EXISTS idx_employees_last_name_search_hash;
DROP INDEX IF EXISTS idx_employees_first_name_search_hash;

DROP INDEX IF EXISTS idx_suppliers_phone_search_hash;
DROP INDEX IF EXISTS idx_suppliers_email_search_hash;
DROP INDEX IF EXISTS idx_suppliers_name_search_hash;

DROP INDEX IF EXISTS idx_customers_phone_search_hash;
DROP INDEX IF EXISTS idx_customers_email_search_hash;
DROP INDEX IF EXISTS idx_customers_name_search_hash;

DROP INDEX IF EXISTS idx_users_email_search_hash;
DROP INDEX IF EXISTS idx_users_last_name_search_hash;
DROP INDEX IF EXISTS idx_users_first_name_search_hash;

-- 移除用戶表的加密相關欄位
ALTER TABLE users DROP COLUMN IF EXISTS first_name_encrypted;
ALTER TABLE users DROP COLUMN IF EXISTS last_name_encrypted;
ALTER TABLE users DROP COLUMN IF EXISTS email_encrypted;
ALTER TABLE users DROP COLUMN IF EXISTS first_name_search_hash;
ALTER TABLE users DROP COLUMN IF EXISTS last_name_search_hash;
ALTER TABLE users DROP COLUMN IF EXISTS email_search_hash;

-- 移除客戶表的加密相關欄位
ALTER TABLE customers DROP COLUMN IF EXISTS name_encrypted;
ALTER TABLE customers DROP COLUMN IF EXISTS email_encrypted;
ALTER TABLE customers DROP COLUMN IF EXISTS phone_encrypted;
ALTER TABLE customers DROP COLUMN IF EXISTS address_encrypted;
ALTER TABLE customers DROP COLUMN IF EXISTS tax_id_encrypted;
ALTER TABLE customers DROP COLUMN IF EXISTS name_search_hash;
ALTER TABLE customers DROP COLUMN IF EXISTS email_search_hash;
ALTER TABLE customers DROP COLUMN IF EXISTS phone_search_hash;

-- 移除供應商表的加密相關欄位
ALTER TABLE suppliers DROP COLUMN IF EXISTS name_encrypted;
ALTER TABLE suppliers DROP COLUMN IF EXISTS contact_person_encrypted;
ALTER TABLE suppliers DROP COLUMN IF EXISTS email_encrypted;
ALTER TABLE suppliers DROP COLUMN IF EXISTS phone_encrypted;
ALTER TABLE suppliers DROP COLUMN IF EXISTS address_encrypted;
ALTER TABLE suppliers DROP COLUMN IF EXISTS tax_id_encrypted;
ALTER TABLE suppliers DROP COLUMN IF EXISTS bank_account_encrypted;
ALTER TABLE suppliers DROP COLUMN IF EXISTS name_search_hash;
ALTER TABLE suppliers DROP COLUMN IF EXISTS email_search_hash;
ALTER TABLE suppliers DROP COLUMN IF EXISTS phone_search_hash;

-- 移除員工表的加密相關欄位
ALTER TABLE employees DROP COLUMN IF EXISTS first_name_encrypted;
ALTER TABLE employees DROP COLUMN IF EXISTS last_name_encrypted;
ALTER TABLE employees DROP COLUMN IF EXISTS email_encrypted;
ALTER TABLE employees DROP COLUMN IF EXISTS phone_encrypted;
ALTER TABLE employees DROP COLUMN IF EXISTS address_encrypted;
ALTER TABLE employees DROP COLUMN IF EXISTS bank_account_encrypted;
ALTER TABLE employees DROP COLUMN IF EXISTS tax_id_encrypted;
ALTER TABLE employees DROP COLUMN IF EXISTS first_name_search_hash;
ALTER TABLE employees DROP COLUMN IF EXISTS last_name_search_hash;
ALTER TABLE employees DROP COLUMN IF EXISTS email_search_hash;
ALTER TABLE employees DROP COLUMN IF EXISTS phone_search_hash;

-- 移除財務表的加密相關欄位
ALTER TABLE invoices DROP COLUMN IF EXISTS customer_details_encrypted;
ALTER TABLE ar_invoices DROP COLUMN IF EXISTS customer_details_encrypted;
ALTER TABLE ap_invoices DROP COLUMN IF EXISTS supplier_details_encrypted;