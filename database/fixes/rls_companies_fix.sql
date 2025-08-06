-- =============================================================================
-- RLS Companies Table Security Fix
-- =============================================================================
-- 
-- ISSUE: companies table has RLS enabled but no policies defined
-- RISK: Data access inconsistency and potential security vulnerability
-- 
-- SOLUTION: Add appropriate RLS policy for company isolation
-- =============================================================================

-- Check current RLS status (for verification)
SELECT 
    schemaname,
    tablename,
    rowsecurity,
    (SELECT count(*) FROM pg_policies WHERE tablename = 'companies') as policy_count
FROM pg_tables 
WHERE tablename = 'companies';

-- Option 1: Add company isolation policy (recommended for multi-tenant)
-- This allows users to only see their own company data
CREATE POLICY company_isolation_companies ON companies
    FOR ALL TO public
    USING (id = COALESCE((current_setting('app.current_company_id'::text, true))::bigint, id));

-- Option 2: Add superuser bypass policy (if needed for admin operations)
-- Uncomment if superuser access is required
-- CREATE POLICY superuser_bypass_companies ON companies
--     FOR ALL TO nexus_app_user
--     USING ((current_setting('app.superuser_mode'::text, true))::boolean = true);

-- Verify policies were created
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    roles,
    qual
FROM pg_policies 
WHERE tablename = 'companies'
ORDER BY policyname;

-- Test the policy effectiveness
-- (This should be run after setting app.current_company_id)
-- SELECT set_config('app.current_company_id', '1', false);
-- SELECT count(*), array_agg(DISTINCT id) as company_ids FROM companies;

-- =============================================================================
-- NOTES:
-- 1. This policy uses the same pattern as other tables in the system
-- 2. The COALESCE ensures fallback behavior for missing session variables
-- 3. Test thoroughly before deploying to production
-- =============================================================================