-- 刪除審計日誌表
DROP INDEX IF EXISTS idx_audit_logs_metadata;
DROP INDEX IF EXISTS idx_audit_logs_login_attempts;
DROP INDEX IF EXISTS idx_audit_logs_success;
DROP INDEX IF EXISTS idx_audit_logs_ip_address;
DROP INDEX IF EXISTS idx_audit_logs_timestamp;
DROP INDEX IF EXISTS idx_audit_logs_resource;
DROP INDEX IF EXISTS idx_audit_logs_action;
DROP INDEX IF EXISTS idx_audit_logs_user_id;

DROP TABLE IF EXISTS audit_logs;