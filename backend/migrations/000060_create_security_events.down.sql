-- Drop Security Events Table
-- Migration: 000060_create_security_events.down.sql

-- Drop trigger
DROP TRIGGER IF EXISTS trigger_detect_suspicious_activity ON security_events;

-- Drop functions
DROP FUNCTION IF EXISTS detect_suspicious_activity();
DROP FUNCTION IF EXISTS cleanup_old_security_events();

-- Drop views
DROP VIEW IF EXISTS suspicious_activity;
DROP VIEW IF EXISTS security_events_summary;

-- Drop RLS policies
DROP POLICY IF EXISTS company_security_events ON security_events;
DROP POLICY IF EXISTS admin_all_security_events ON security_events;

-- Drop indexes
DROP INDEX IF EXISTS idx_security_events_details_gin;
DROP INDEX IF EXISTS idx_security_events_type_severity;
DROP INDEX IF EXISTS idx_security_events_ip_address;
DROP INDEX IF EXISTS idx_security_events_company_id;
DROP INDEX IF EXISTS idx_security_events_user_id;
DROP INDEX IF EXISTS idx_security_events_severity;
DROP INDEX IF EXISTS idx_security_events_event_type;
DROP INDEX IF EXISTS idx_security_events_created_at;

-- Drop table
DROP TABLE IF EXISTS security_events;