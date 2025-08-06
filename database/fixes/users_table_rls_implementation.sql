-- =============================================================================
-- Users Table RLS Implementation for Multi-Tenant Security
-- =============================================================================
-- 
-- ISSUE: Users table has no RLS protection, allowing cross-company user access
-- RISK: Personal data exposure, privacy compliance violations, RBAC bypass
-- 
-- SOLUTION: Implement company-based RLS through user_companies junction table
-- =============================================================================

-- Check current status (for verification)
SELECT 
    'BEFORE CHANGES - Users Table Status' as status,
    tablename,
    rowsecurity as rls_enabled,
    (SELECT count(*) FROM pg_policies WHERE tablename = t.tablename) as policy_count
FROM pg_tables t 
WHERE tablename = 'users' AND schemaname = 'public';

-- Check user-company relationships
SELECT 
    'Current User-Company Distribution' as info,
    COUNT(u.id) as total_users,
    COUNT(uc.user_id) as users_with_companies,
    COUNT(u.id) - COUNT(uc.user_id) as orphaned_users
FROM users u
LEFT JOIN user_companies uc ON u.id = uc.user_id AND uc.is_active = true;

-- =============================================================================
-- Phase 1: Create Optimal Index for RLS Performance
-- =============================================================================

-- Create index for efficient company-user lookups during RLS policy evaluation
CREATE INDEX IF NOT EXISTS idx_user_companies_rls_lookup 
ON user_companies(company_id, user_id) 
WHERE is_active = true;

-- Create additional index for user-centric queries
CREATE INDEX IF NOT EXISTS idx_user_companies_user_active 
ON user_companies(user_id) 
WHERE is_active = true;

-- =============================================================================
-- Phase 2: Enable RLS on Users Table
-- =============================================================================

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create comprehensive company isolation policy
CREATE POLICY users_company_isolation ON users
    FOR ALL TO public
    USING (
        -- Allow access to users associated with current company
        EXISTS (
            SELECT 1 FROM user_companies uc 
            WHERE uc.user_id = users.id 
            AND uc.company_id = COALESCE(
                (current_setting('app.current_company_id', true))::bigint, 
                uc.company_id
            )
            AND uc.is_active = true
        )
        OR
        -- Allow superuser mode bypass (for admin operations)
        COALESCE(
            (current_setting('app.superuser_mode', true))::boolean, 
            false
        ) = true
        OR
        -- Allow access when no company context is set (system operations)
        current_setting('app.current_company_id', true) IS NULL
        OR current_setting('app.current_company_id', true) = ''
    );

-- =============================================================================
-- Phase 3: Protect Related RBAC Tables
-- =============================================================================

-- Protect user_roles table (if not already protected)
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS user_roles_company_isolation ON user_roles;

-- Create company isolation policy for user_roles
CREATE POLICY user_roles_company_isolation ON user_roles
    FOR ALL TO public
    USING (
        EXISTS (
            SELECT 1 FROM user_companies uc 
            WHERE uc.user_id = user_roles.user_id 
            AND uc.company_id = COALESCE(
                (current_setting('app.current_company_id', true))::bigint, 
                uc.company_id
            )
            AND uc.is_active = true
        )
        OR
        COALESCE(
            (current_setting('app.superuser_mode', true))::boolean, 
            false
        ) = true
        OR
        current_setting('app.current_company_id', true) IS NULL
        OR current_setting('app.current_company_id', true) = ''
    );

-- =============================================================================
-- Phase 4: Create Helper Functions for Testing
-- =============================================================================

-- Function to test user isolation by company
CREATE OR REPLACE FUNCTION test_user_isolation(test_company_id INTEGER)
RETURNS TABLE(
    company_id INTEGER,
    user_count BIGINT,
    sample_user_names TEXT[]
) AS $$
BEGIN
    -- Set company context
    PERFORM set_config('app.current_company_id', test_company_id::text, false);
    
    -- Return user count and sample names for this company
    RETURN QUERY
    SELECT 
        test_company_id as company_id,
        COUNT(u.id) as user_count,
        ARRAY_AGG(u.name ORDER BY u.id LIMIT 5) as sample_user_names
    FROM users u;
END;
$$ LANGUAGE plpgsql;

-- Function to test superuser mode bypass
CREATE OR REPLACE FUNCTION test_superuser_bypass()
RETURNS TABLE(
    mode TEXT,
    user_count BIGINT
) AS $$
BEGIN
    -- Test normal mode
    PERFORM set_config('app.superuser_mode', 'false', false);
    PERFORM set_config('app.current_company_id', '1', false);
    
    RETURN QUERY
    SELECT 
        'normal_mode' as mode,
        COUNT(*)::BIGINT as user_count
    FROM users;
    
    -- Test superuser mode
    PERFORM set_config('app.superuser_mode', 'true', false);
    
    RETURN QUERY
    SELECT 
        'superuser_mode' as mode,
        COUNT(*)::BIGINT as user_count
    FROM users;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- Phase 5: Verification and Testing
-- =============================================================================

-- Check final status
SELECT 
    'AFTER CHANGES - Users Table Status' as status,
    tablename,
    rowsecurity as rls_enabled,
    (SELECT count(*) FROM pg_policies WHERE tablename = t.tablename) as policy_count
FROM pg_tables t 
WHERE tablename = 'users' AND schemaname = 'public';

-- List all policies created
SELECT 
    'Created Policies' as info,
    schemaname,
    tablename,
    policyname,
    cmd,
    roles
FROM pg_policies 
WHERE tablename IN ('users', 'user_roles')
ORDER BY tablename, policyname;

-- =============================================================================
-- Phase 6: Test Scenarios
-- =============================================================================

-- Test 1: Verify user isolation works
SELECT 'TEST 1: User Isolation by Company' as test_name;
SELECT * FROM test_user_isolation(66);  -- Should show users for company 66 only
SELECT * FROM test_user_isolation(67);  -- Should show users for company 67 only

-- Test 2: Verify superuser bypass works  
SELECT 'TEST 2: Superuser Mode Bypass' as test_name;
SELECT * FROM test_superuser_bypass();  -- Should show normal vs superuser counts

-- Test 3: Test cross-table joins still work properly
SELECT 'TEST 3: Cross-Table Join Test' as test_name;
-- Set specific company context
SELECT set_config('app.current_company_id', '66', false);

-- This should only return products for company 66 with their associated users
SELECT 
    p.name as product_name,
    u.name as created_by_user,
    p.company_id
FROM products p
JOIN users u ON p.created_by_user_id = u.id
LIMIT 5;

-- =============================================================================
-- Phase 7: Performance Analysis
-- =============================================================================

-- Check index usage
SELECT 'INDEX USAGE ANALYSIS' as info;
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes 
WHERE tablename IN ('users', 'user_companies')
ORDER BY tablename, indexname;

-- =============================================================================
-- Rollback Instructions (if needed)
-- =============================================================================

/*
-- To rollback these changes if issues occur:

-- Disable RLS on users table
-- ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Disable RLS on user_roles table  
-- ALTER TABLE user_roles DISABLE ROW LEVEL SECURITY;

-- Drop the helper functions
-- DROP FUNCTION IF EXISTS test_user_isolation(INTEGER);
-- DROP FUNCTION IF EXISTS test_superuser_bypass();

-- Drop the indexes (optional, they don't hurt to keep)
-- DROP INDEX IF EXISTS idx_user_companies_rls_lookup;
-- DROP INDEX IF EXISTS idx_user_companies_user_active;
*/

-- =============================================================================
-- DEPLOYMENT CHECKLIST:
-- =============================================================================
-- 
-- PRE-DEPLOYMENT:
-- [ ] Test in sandbox environment first
-- [ ] Verify all authentication flows work
-- [ ] Check admin user management operations
-- [ ] Ensure app.current_company_id is set properly in applications
-- [ ] Test superuser mode for admin operations
-- 
-- DEPLOYMENT:
-- [ ] Execute during maintenance window
-- [ ] Monitor application logs for errors
-- [ ] Test user login and profile access
-- [ ] Verify cross-table queries still work
-- [ ] Check performance impact on user-related queries
-- 
-- POST-DEPLOYMENT:
-- [ ] Run verification tests
-- [ ] Monitor database performance metrics
-- [ ] Check audit logs for access patterns
-- [ ] Validate privacy compliance improvements
-- 
-- =============================================================================