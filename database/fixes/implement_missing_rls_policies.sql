-- =============================================================================
-- Implement Missing RLS Policies for Multi-Tenant Data Isolation
-- =============================================================================
-- 
-- PURPOSE: Add RLS policies to tables that have company_id but no RLS protection
-- TABLES: business_units, currencies, user_companies
-- 
-- PREREQUISITES: 
-- 1. This script should be run AFTER implementing application-specific users
-- 2. Test thoroughly in development before applying to production
-- =============================================================================

-- Check current RLS status before changes
SELECT 
    'BEFORE CHANGES' as status,
    tablename,
    rowsecurity as rls_enabled,
    (SELECT count(*) FROM pg_policies WHERE tablename = t.tablename) as policy_count
FROM pg_tables t 
WHERE tablename IN ('business_units', 'currencies', 'user_companies')
AND schemaname = 'public'
ORDER BY tablename;

-- =============================================================================
-- 1. BUSINESS_UNITS TABLE
-- =============================================================================

-- Enable RLS on business_units table
ALTER TABLE business_units ENABLE ROW LEVEL SECURITY;

-- Create company isolation policy for business_units
CREATE POLICY business_units_company_isolation ON business_units
    FOR ALL TO public
    USING (
        company_id = COALESCE(
            NULLIF(current_setting('app.current_company_id', true), '')::integer, 
            company_id
        )
    );

-- =============================================================================
-- 2. CURRENCIES TABLE  
-- =============================================================================

-- Enable RLS on currencies table
ALTER TABLE currencies ENABLE ROW LEVEL SECURITY;

-- Create company isolation policy for currencies
CREATE POLICY currencies_company_isolation ON currencies
    FOR ALL TO public
    USING (
        company_id = COALESCE(
            NULLIF(current_setting('app.current_company_id', true), '')::integer, 
            company_id
        )
    );

-- =============================================================================
-- 3. USER_COMPANIES TABLE
-- =============================================================================

-- Enable RLS on user_companies table
ALTER TABLE user_companies ENABLE ROW LEVEL SECURITY;

-- Create company isolation policy for user_companies
CREATE POLICY user_companies_company_isolation ON user_companies
    FOR ALL TO public
    USING (
        company_id = COALESCE(
            NULLIF(current_setting('app.current_company_id', true), '')::integer, 
            company_id
        )
    );

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- Check RLS status after changes
SELECT 
    'AFTER CHANGES' as status,
    tablename,
    rowsecurity as rls_enabled,
    (SELECT count(*) FROM pg_policies WHERE tablename = t.tablename) as policy_count
FROM pg_tables t 
WHERE tablename IN ('business_units', 'currencies', 'user_companies')
AND schemaname = 'public'
ORDER BY tablename;

-- List all policies created
SELECT 
    'NEW POLICIES' as status,
    schemaname,
    tablename,
    policyname,
    cmd as operation,
    roles,
    qual as policy_condition
FROM pg_policies 
WHERE tablename IN ('business_units', 'currencies', 'user_companies')
AND schemaname = 'public'
ORDER BY tablename, policyname;

-- =============================================================================
-- TEST QUERIES (Run with non-superuser account)
-- =============================================================================

-- Test business_units isolation
-- SELECT set_config('app.current_company_id', '66', false);
-- SELECT COUNT(*) as business_units_company_66 FROM business_units;
-- 
-- SELECT set_config('app.current_company_id', '67', false);
-- SELECT COUNT(*) as business_units_company_67 FROM business_units;

-- Test currencies isolation  
-- SELECT set_config('app.current_company_id', '66', false);
-- SELECT COUNT(*) as currencies_company_66 FROM currencies;
-- 
-- SELECT set_config('app.current_company_id', '67', false);
-- SELECT COUNT(*) as currencies_company_67 FROM currencies;

-- Test user_companies isolation
-- SELECT set_config('app.current_company_id', '66', false);
-- SELECT COUNT(*) as user_companies_company_66 FROM user_companies;
-- 
-- SELECT set_config('app.current_company_id', '67', false);
-- SELECT COUNT(*) as user_companies_company_67 FROM user_companies;

-- =============================================================================
-- ROLLBACK PLAN (if needed)
-- =============================================================================

-- To rollback these changes:
-- DROP POLICY IF EXISTS business_units_company_isolation ON business_units;
-- ALTER TABLE business_units DISABLE ROW LEVEL SECURITY;
-- 
-- DROP POLICY IF EXISTS currencies_company_isolation ON currencies;
-- ALTER TABLE currencies DISABLE ROW LEVEL SECURITY;
-- 
-- DROP POLICY IF EXISTS user_companies_company_isolation ON user_companies;
-- ALTER TABLE user_companies DISABLE ROW LEVEL SECURITY;

-- =============================================================================
-- NOTES:
-- =============================================================================
-- 
-- 1. COALESCE Pattern: Uses same pattern as existing policies for consistency
-- 2. NULLIF Handling: Prevents errors when app.current_company_id is empty string
-- 3. Fallback Behavior: Returns all records when no company context is set
-- 4. Public Role: Allows access to all application users (Laravel, Go, etc.)
-- 5. Testing Required: Must test with application-specific database users
-- 
-- IMPORTANT: This script assumes the existence of company_id columns in these tables.
-- Verify the column exists and has appropriate constraints before running.
-- =============================================================================