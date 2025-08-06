-- Drop MFA Tables
-- Migration: 000061_create_mfa_tables.down.sql

-- Drop triggers
DROP TRIGGER IF EXISTS trigger_log_mfa_verification ON mfa_challenges;
DROP TRIGGER IF EXISTS trigger_update_mfa_devices_updated_at ON mfa_devices;

-- Drop functions
DROP FUNCTION IF EXISTS log_mfa_verification_attempt();
DROP FUNCTION IF EXISTS update_mfa_devices_updated_at();
DROP FUNCTION IF EXISTS cleanup_old_mfa_stats();
DROP FUNCTION IF EXISTS cleanup_expired_mfa_challenges();

-- Drop views
DROP VIEW IF EXISTS suspicious_mfa_activity;
DROP VIEW IF EXISTS mfa_usage_summary;

-- Drop RLS policies
DROP POLICY IF EXISTS mfa_stats_company_isolation ON mfa_usage_stats;
DROP POLICY IF EXISTS mfa_challenges_company_isolation ON mfa_challenges;
DROP POLICY IF EXISTS mfa_devices_company_isolation ON mfa_devices;

-- Drop indexes
DROP INDEX IF EXISTS idx_mfa_stats_event_time;
DROP INDEX IF EXISTS idx_mfa_stats_device;
DROP INDEX IF EXISTS idx_mfa_stats_user_company;
DROP INDEX IF EXISTS idx_mfa_challenges_expires;
DROP INDEX IF EXISTS idx_mfa_challenges_device;
DROP INDEX IF EXISTS idx_mfa_challenges_user_company;
DROP INDEX IF EXISTS idx_mfa_devices_method;
DROP INDEX IF EXISTS idx_mfa_devices_active;
DROP INDEX IF EXISTS idx_mfa_devices_user_company;

-- Drop tables (in reverse dependency order)
DROP TABLE IF EXISTS mfa_usage_stats;
DROP TABLE IF EXISTS mfa_challenges;
DROP TABLE IF EXISTS mfa_devices;