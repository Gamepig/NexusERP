-- =============================================================================
-- RLS Architecture Security Improvement Plan
-- =============================================================================
-- 
-- CURRENT ISSUE: All applications use superuser (nexus) which bypasses RLS
-- GOAL: Implement proper database user separation and RLS effectiveness
-- 
-- PHASES:
-- 1. Create application-specific database users
-- 2. Grant appropriate permissions
-- 3. Update application connection configurations
-- 4. Test RLS policy effectiveness
-- =============================================================================

-- Phase 1: Create Application-Specific Users
-- =============================================================================

-- Create Laravel application user
CREATE ROLE nexus_laravel_user WITH LOGIN PASSWORD 'secure_laravel_password_2024';

-- Create Go backend user  
CREATE ROLE nexus_go_user WITH LOGIN PASSWORD 'secure_go_password_2024';

-- Create read-only reporting user
CREATE ROLE nexus_report_user WITH LOGIN PASSWORD 'secure_report_password_2024';

-- Phase 2: Grant Database Access
-- =============================================================================

-- Grant database connection permissions
GRANT CONNECT ON DATABASE nexus_erp TO nexus_laravel_user;
GRANT CONNECT ON DATABASE nexus_erp TO nexus_go_user;
GRANT CONNECT ON DATABASE nexus_erp TO nexus_report_user;

-- Grant schema usage
GRANT USAGE ON SCHEMA public TO nexus_laravel_user;
GRANT USAGE ON SCHEMA public TO nexus_go_user;
GRANT USAGE ON SCHEMA public TO nexus_report_user;

-- Phase 3: Table-Level Permissions
-- =============================================================================

-- Core business tables (full CRUD for Laravel)
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO nexus_laravel_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO nexus_laravel_user;

-- Backend API tables (selective access for Go)
GRANT SELECT, INSERT, UPDATE ON 
    products, inventory_levels, inventory_transactions,
    customers, sales_orders, sales_order_items,
    suppliers, purchase_orders, purchase_order_items
TO nexus_go_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO nexus_go_user;

-- Reporting user (read-only)
GRANT SELECT ON ALL TABLES IN SCHEMA public TO nexus_report_user;

-- Phase 4: RLS Context Functions
-- =============================================================================

-- Function to set company context (for application use)
CREATE OR REPLACE FUNCTION set_current_company(company_id_param INTEGER)
RETURNS void AS $$
BEGIN
    PERFORM set_config('app.current_company_id', company_id_param::text, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to set superuser mode (for admin operations)
CREATE OR REPLACE FUNCTION set_superuser_mode(enabled BOOLEAN DEFAULT true)
RETURNS void AS $$
BEGIN
    PERFORM set_config('app.superuser_mode', enabled::text, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution permissions
GRANT EXECUTE ON FUNCTION set_current_company(INTEGER) TO nexus_laravel_user, nexus_go_user;
GRANT EXECUTE ON FUNCTION set_superuser_mode(BOOLEAN) TO nexus_laravel_user;

-- Phase 5: Enhanced RLS Policies
-- =============================================================================

-- Update companies table policy to work with app users
DROP POLICY IF EXISTS company_isolation_companies ON companies;

CREATE POLICY company_isolation_companies ON companies
    FOR ALL TO nexus_laravel_user, nexus_go_user, nexus_report_user
    USING (
        -- Allow access to user's company
        id = COALESCE((current_setting('app.current_company_id'::text, true))::bigint, id)
        OR
        -- Allow superuser mode bypass (admin operations)
        COALESCE((current_setting('app.superuser_mode'::text, true))::boolean, false) = true
    );

-- Phase 6: Users Table RLS (Optional Enhancement)
-- =============================================================================

-- Enable RLS on users table for company isolation
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policy for users table
-- CREATE POLICY company_isolation_users ON users
--     FOR ALL TO nexus_laravel_user, nexus_go_user
--     USING (
--         EXISTS (
--             SELECT 1 FROM user_companies uc 
--             WHERE uc.user_id = users.id 
--             AND uc.company_id = (current_setting('app.current_company_id'::text, true))::bigint
--         )
--         OR
--         COALESCE((current_setting('app.superuser_mode'::text, true))::boolean, false) = true
--     );

-- Phase 7: Audit and Monitoring
-- =============================================================================

-- Create audit trigger for company context tracking
CREATE OR REPLACE FUNCTION audit_company_context()
RETURNS trigger AS $$
BEGIN
    INSERT INTO audit_logs (
        table_name,
        operation,
        old_values,
        new_values,
        user_id,
        company_id,
        created_at
    ) VALUES (
        TG_TABLE_NAME,
        TG_OP,
        CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE NULL END,
        CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW) ELSE NULL END,
        COALESCE((current_setting('app.user_id'::text, true))::bigint, 0),
        COALESCE((current_setting('app.current_company_id'::text, true))::bigint, 0),
        NOW()
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- DEPLOYMENT CHECKLIST:
-- =============================================================================
-- 
-- 1. [ ] Execute Phase 1-2 (create users and basic permissions)
-- 2. [ ] Update Laravel .env with nexus_laravel_user credentials
-- 3. [ ] Update Go backend config with nexus_go_user credentials  
-- 4. [ ] Test application connectivity with new users
-- 5. [ ] Execute Phase 3-4 (table permissions and context functions)
-- 6. [ ] Execute Phase 5 (enhanced RLS policies)
-- 7. [ ] Test RLS effectiveness with set_current_company() function
-- 8. [ ] Optional: Execute Phase 6 (users table RLS)
-- 9. [ ] Execute Phase 7 (audit enhancements)
-- 10. [ ] Monitor application logs for access issues
-- 
-- ROLLBACK PLAN:
-- - Keep nexus superuser as backup
-- - Test all features thoroughly before decommissioning superuser access
-- - Document all configuration changes
-- 
-- =============================================================================