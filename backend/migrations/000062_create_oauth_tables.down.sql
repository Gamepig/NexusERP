-- Drop OAuth Tables
-- Migration: 000062_create_oauth_tables.down.sql

-- Drop triggers
DROP TRIGGER IF EXISTS trigger_check_primary_oauth ON oauth_accounts;
DROP TRIGGER IF EXISTS trigger_log_oauth_login ON oauth_accounts;
DROP TRIGGER IF EXISTS trigger_update_oauth_accounts_updated_at ON oauth_accounts;

-- Drop functions
DROP FUNCTION IF EXISTS check_primary_oauth_account();
DROP FUNCTION IF EXISTS log_oauth_login_attempt();
DROP FUNCTION IF EXISTS update_oauth_accounts_updated_at();
DROP FUNCTION IF EXISTS cleanup_old_oauth_logs();
DROP FUNCTION IF EXISTS cleanup_expired_oauth_states();

-- Drop views
DROP VIEW IF EXISTS oauth_provider_stats;
DROP VIEW IF EXISTS suspicious_oauth_activity;
DROP VIEW IF EXISTS oauth_usage_summary;

-- Drop RLS policies
DROP POLICY IF EXISTS oauth_logs_company_isolation ON oauth_login_logs;
DROP POLICY IF EXISTS oauth_accounts_company_isolation ON oauth_accounts;
DROP POLICY IF EXISTS oauth_states_access ON oauth_states;

-- Drop indexes
DROP INDEX IF EXISTS idx_oauth_logs_failed_attempts;
DROP INDEX IF EXISTS idx_oauth_logs_ip_time;
DROP INDEX IF EXISTS idx_oauth_logs_provider;
DROP INDEX IF EXISTS idx_oauth_logs_status;
DROP INDEX IF EXISTS idx_oauth_logs_user_company;
DROP INDEX IF EXISTS idx_oauth_accounts_last_login;
DROP INDEX IF EXISTS idx_oauth_accounts_primary;
DROP INDEX IF EXISTS idx_oauth_accounts_email;
DROP INDEX IF EXISTS idx_oauth_accounts_provider;
DROP INDEX IF EXISTS idx_oauth_accounts_user_company;
DROP INDEX IF EXISTS idx_oauth_states_provider_company;
DROP INDEX IF EXISTS idx_oauth_states_expires;
DROP INDEX IF EXISTS idx_oauth_states_state;

-- Drop tables (in reverse dependency order)
DROP TABLE IF EXISTS oauth_login_logs;
DROP TABLE IF EXISTS oauth_accounts;
DROP TABLE IF EXISTS oauth_states;