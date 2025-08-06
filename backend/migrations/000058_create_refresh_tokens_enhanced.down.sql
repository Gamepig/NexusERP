-- Drop enhanced refresh tokens table
-- Migration: 000058_create_refresh_tokens_enhanced.down.sql

-- Drop function
DROP FUNCTION IF EXISTS cleanup_expired_refresh_tokens();

-- Drop RLS policy
DROP POLICY IF EXISTS secure_company_isolation_refresh_tokens ON refresh_tokens;

-- Drop indexes
DROP INDEX IF EXISTS idx_refresh_tokens_active;
DROP INDEX IF EXISTS idx_refresh_tokens_expires_at;
DROP INDEX IF EXISTS idx_refresh_tokens_token;
DROP INDEX IF EXISTS idx_refresh_tokens_user_company;

-- Drop table
DROP TABLE IF EXISTS refresh_tokens;