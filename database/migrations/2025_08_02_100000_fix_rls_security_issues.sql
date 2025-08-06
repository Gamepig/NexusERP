-- PostgreSQL RLS 安全修正 - 立即執行
-- 修正日期: 2025-08-02
-- 目標: 修復現有RLS策略的安全漏洞

-- 1. 修正所有現有RLS策略，加強安全檢查
DO $$
DECLARE
    table_record RECORD;
    policy_name TEXT;
BEGIN
    -- 取得所有已啟用RLS的業務表
    FOR table_record IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename IN (
            'companies', 'business_units', 'customers', 'suppliers', 'products',
            'sales_orders', 'sales_order_items', 'purchase_orders', 'purchase_order_items',
            'inventory_items', 'inventory_levels', 'inventory_transactions',
            'financial_accounts', 'financial_transactions', 'expenses',
            'user_companies', 'user_business_units', 'user_roles', 'company_invitations'
        )
    LOOP
        policy_name := 'company_isolation_' || table_record.tablename;
        
        -- 刪除現有策略
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', policy_name, table_record.tablename);
        
        -- 創建安全強化的策略
        EXECUTE format('
            CREATE POLICY %I ON %I
                FOR ALL TO nexus_app
                USING (
                    company_id = COALESCE(
                        nullif(current_setting(''app.current_company_id'', true), '''')::int, 
                        -1
                    )
                    AND company_id > 0
                    AND EXISTS (
                        SELECT 1 FROM companies c 
                        WHERE c.id = company_id 
                        AND c.status = ''active''
                    )
                )
                WITH CHECK (
                    company_id = COALESCE(
                        nullif(current_setting(''app.current_company_id'', true), '''')::int, 
                        -1
                    )
                    AND company_id > 0
                    AND EXISTS (
                        SELECT 1 FROM companies c 
                        WHERE c.id = company_id 
                        AND c.status = ''active''
                    )
                )', policy_name, table_record.tablename, table_record.tablename, table_record.tablename);
        
        RAISE NOTICE 'Updated RLS policy for table: %', table_record.tablename;
    END LOOP;
END;
$$;

-- 2. 特殊表的專用策略
-- 用戶表：更嚴格的權限控制
DROP POLICY IF EXISTS users_company_isolation ON users;
CREATE POLICY users_company_isolation ON users
    FOR ALL TO nexus_app
    USING (
        -- 用戶只能看到同公司的其他用戶
        EXISTS (
            SELECT 1 FROM user_companies uc 
            JOIN companies c ON uc.company_id = c.id
            WHERE uc.user_id = users.id 
            AND uc.company_id = COALESCE(
                nullif(current_setting('app.current_company_id', true), '')::int, 
                -1
            )
            AND uc.is_active = true
            AND c.status = 'active'
        )
        OR
        -- 用戶總是可以看到自己
        id = COALESCE(
            nullif(current_setting('app.current_user_id', true), '')::int, 
            -1
        )
        OR
        -- 系統管理員模式（需要額外驗證）
        (
            COALESCE(current_setting('app.superuser_mode', true)::boolean, false) = true
            AND EXISTS (
                SELECT 1 FROM user_roles ur
                JOIN roles r ON ur.role_id = r.id
                WHERE ur.user_id = COALESCE(
                    nullif(current_setting('app.current_user_id', true), '')::int, 
                    -1
                )
                AND r.name = 'super_admin'
                AND ur.is_active = true
            )
        )
    );

-- 3. 創建核心RLS索引（高優先級）
-- 為每個主要業務表創建高效的company_id索引
DO $$
DECLARE
    table_name TEXT;
BEGIN
    FOR table_name IN VALUES 
        ('products'), ('customers'), ('suppliers'), 
        ('sales_orders'), ('purchase_orders'), 
        ('inventory_items'), ('financial_transactions')
    LOOP
        -- 檢查索引是否已存在
        IF NOT EXISTS (
            SELECT 1 FROM pg_indexes 
            WHERE tablename = table_name 
            AND indexname = 'idx_' || table_name || '_company_id_rls'
        ) THEN
            EXECUTE format('
                CREATE INDEX CONCURRENTLY idx_%I_company_id_rls 
                ON %I (company_id) 
                WHERE company_id > 0
            ', table_name, table_name);
            
            RAISE NOTICE 'Created RLS index for table: %', table_name;
        END IF;
    END LOOP;
END;
$$;

-- 4. 創建安全函數：驗證公司狀態
CREATE OR REPLACE FUNCTION is_company_active(company_id_param INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM companies 
        WHERE id = company_id_param 
        AND status = 'active'
        AND deleted_at IS NULL
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 5. 創建安全函數：驗證用戶公司關係
CREATE OR REPLACE FUNCTION user_belongs_to_company(user_id_param INTEGER, company_id_param INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_companies uc
        JOIN companies c ON uc.company_id = c.id
        WHERE uc.user_id = user_id_param 
        AND uc.company_id = company_id_param
        AND uc.is_active = true
        AND c.status = 'active'
        AND c.deleted_at IS NULL
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 6. 創建上下文驗證函數
CREATE OR REPLACE FUNCTION validate_rls_context()
RETURNS BOOLEAN AS $$
DECLARE
    current_user_id INTEGER;
    current_company_id INTEGER;
BEGIN
    -- 獲取當前上下文
    current_user_id := COALESCE(
        nullif(current_setting('app.current_user_id', true), '')::int, 
        0
    );
    current_company_id := COALESCE(
        nullif(current_setting('app.current_company_id', true), '')::int, 
        0
    );
    
    -- 驗證上下文有效性
    IF current_user_id <= 0 OR current_company_id <= 0 THEN
        RETURN FALSE;
    END IF;
    
    -- 驗證用戶-公司關係
    RETURN user_belongs_to_company(current_user_id, current_company_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 7. 創建緊急安全檢查觸發器
CREATE OR REPLACE FUNCTION emergency_security_check()
RETURNS TRIGGER AS $$
BEGIN
    -- 在任何資料修改前驗證RLS上下文
    IF NOT validate_rls_context() THEN
        RAISE EXCEPTION 'Security violation: Invalid or missing RLS context'
            USING ERRCODE = 'insufficient_privilege';
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 為重要的業務表添加安全檢查觸發器
DO $$
DECLARE
    table_name TEXT;
BEGIN
    FOR table_name IN VALUES 
        ('financial_transactions'), ('sales_orders'), ('purchase_orders')
    LOOP
        EXECUTE format('
            DROP TRIGGER IF EXISTS emergency_security_check_%I ON %I;
            CREATE TRIGGER emergency_security_check_%I
                BEFORE INSERT OR UPDATE OR DELETE ON %I
                FOR EACH ROW EXECUTE FUNCTION emergency_security_check()
        ', table_name, table_name, table_name, table_name);
        
        RAISE NOTICE 'Added security trigger for table: %', table_name;
    END LOOP;
END;
$$;

-- 8. 記錄修正完成
INSERT INTO migration_logs (
    migration_name, 
    status, 
    description, 
    executed_at
) VALUES (
    '2025_08_02_100000_fix_rls_security_issues',
    'completed',
    'Fixed critical RLS security vulnerabilities and performance issues',
    CURRENT_TIMESTAMP
);

COMMENT ON FUNCTION validate_rls_context() IS 'Validates current RLS context for security compliance';
COMMENT ON FUNCTION is_company_active(INTEGER) IS 'Checks if a company is active and not deleted';
COMMENT ON FUNCTION user_belongs_to_company(INTEGER, INTEGER) IS 'Validates user-company relationship';