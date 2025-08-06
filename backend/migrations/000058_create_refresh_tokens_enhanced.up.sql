-- Enhanced refresh tokens table for JWT token management
-- Migration: 000058_create_refresh_tokens_enhanced.up.sql

-- Create enhanced refresh tokens table
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    company_id BIGINT NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_revoked BOOLEAN DEFAULT FALSE,
    
    -- Foreign key constraints
    CONSTRAINT fk_refresh_tokens_user_id 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_refresh_tokens_company_id 
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX idx_refresh_tokens_user_company ON refresh_tokens(user_id, company_id);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);
CREATE INDEX idx_refresh_tokens_active ON refresh_tokens(expires_at, is_revoked) 
    WHERE is_revoked = FALSE;

-- Create RLS policy for multi-tenant isolation
ALTER TABLE refresh_tokens ENABLE ROW LEVEL SECURITY;

-- Create secure RLS policy
CREATE POLICY secure_company_isolation_refresh_tokens ON refresh_tokens
    FOR ALL TO nexus_app
    USING (
        -- Validate RLS context
        current_setting('app.current_company_id', true)::bigint > 0
        AND company_id = current_setting('app.current_company_id', true)::bigint
        AND current_setting('app.current_user_id', true)::bigint > 0
        
        -- Additional security: verify user belongs to company
        AND EXISTS (
            SELECT 1 FROM user_companies uc 
            WHERE uc.user_id = refresh_tokens.user_id 
            AND uc.company_id = refresh_tokens.company_id
            AND uc.is_active = TRUE
        )
    )
    WITH CHECK (
        -- Same validation for INSERT/UPDATE
        current_setting('app.current_company_id', true)::bigint > 0
        AND company_id = current_setting('app.current_company_id', true)::bigint
        AND current_setting('app.current_user_id', true)::bigint > 0
        AND EXISTS (
            SELECT 1 FROM user_companies uc 
            WHERE uc.user_id = refresh_tokens.user_id 
            AND uc.company_id = refresh_tokens.company_id
            AND uc.is_active = TRUE
        )
    );

-- Create function to cleanup expired tokens
CREATE OR REPLACE FUNCTION cleanup_expired_refresh_tokens()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM refresh_tokens 
    WHERE expires_at < NOW() - INTERVAL '1 day' 
    OR is_revoked = TRUE;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Log cleanup activity to PostgreSQL log
    RAISE INFO 'REFRESH_TOKEN_CLEANUP: deleted % tokens at %', deleted_count, NOW();
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule automatic cleanup (requires pg_cron extension in production)
-- This is a placeholder for manual execution or cron job setup
-- SELECT cron.schedule('cleanup-refresh-tokens', '0 2 * * *', 'SELECT cleanup_expired_refresh_tokens();');

COMMENT ON TABLE refresh_tokens IS 'Enhanced refresh tokens for JWT authentication system';
COMMENT ON FUNCTION cleanup_expired_refresh_tokens() IS 'Cleanup expired and revoked refresh tokens';