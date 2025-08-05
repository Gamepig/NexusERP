-- 修復 PostgreSQL RLS 超級用戶問題
-- 
-- 問題：當前 Laravel 使用的 nexus 用戶是超級用戶，會繞過所有 RLS 政策
-- 解決方案：建立專用的應用用戶，並配置適當權限

-- 1. 建立專用的應用用戶（非超級用戶）
DO $$
BEGIN
    -- 檢查用戶是否已存在
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'nexus_app') THEN
        CREATE ROLE nexus_app WITH LOGIN PASSWORD 'your_secure_password_here';
        RAISE NOTICE '✅ 建立應用用戶: nexus_app';
    ELSE
        RAISE NOTICE '⚠️ 用戶 nexus_app 已存在';
    END IF;
END
$$;

-- 2. 授予基本資料庫權限
GRANT CONNECT ON DATABASE nexus_erp TO nexus_app;
GRANT USAGE ON SCHEMA public TO nexus_app;

-- 3. 授予所有表的權限
DO $$
DECLARE
    table_name TEXT;
BEGIN
    -- 為所有現有表授權
    FOR table_name IN 
        SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    LOOP
        EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE %I TO nexus_app', table_name);
        RAISE NOTICE '✅ 授權表 % 給 nexus_app', table_name;
    END LOOP;
END
$$;

-- 4. 授予序列權限（用於自動遞增ID）
DO $$
DECLARE
    seq_name TEXT;
BEGIN
    FOR seq_name IN 
        SELECT sequence_name FROM information_schema.sequences WHERE sequence_schema = 'public'
    LOOP
        EXECUTE format('GRANT USAGE, SELECT ON SEQUENCE %I TO nexus_app', seq_name);
        RAISE NOTICE '✅ 授權序列 % 給 nexus_app', seq_name;
    END LOOP;
END
$$;

-- 5. 修復現有 RLS 政策的角色權限
-- 確保政策適用於 nexus_app 用戶

-- 更新 customers 表政策
DROP POLICY IF EXISTS company_isolation_customers ON customers;
CREATE POLICY company_isolation_customers ON customers
    FOR ALL TO nexus_app
    USING (company_id = COALESCE(
        (NULLIF(current_setting('app.current_company_id', true), ''))::bigint,
        company_id
    ))
    WITH CHECK (company_id = COALESCE(
        (NULLIF(current_setting('app.current_company_id', true), ''))::bigint,
        company_id
    ));

-- 更新 products 表政策
DROP POLICY IF EXISTS company_isolation_products ON products;
CREATE POLICY company_isolation_products ON products
    FOR ALL TO nexus_app
    USING (company_id = COALESCE(
        (NULLIF(current_setting('app.current_company_id', true), ''))::bigint,
        company_id
    ))
    WITH CHECK (company_id = COALESCE(
        (NULLIF(current_setting('app.current_company_id', true), ''))::bigint,
        company_id
    ));

-- 更新 suppliers 表政策
DROP POLICY IF EXISTS company_isolation_suppliers ON suppliers;
CREATE POLICY company_isolation_suppliers ON suppliers
    FOR ALL TO nexus_app
    USING (company_id = COALESCE(
        (NULLIF(current_setting('app.current_company_id', true), ''))::bigint,
        company_id
    ))
    WITH CHECK (company_id = COALESCE(
        (NULLIF(current_setting('app.current_company_id', true), ''))::bigint,
        company_id
    ));

-- 更新 sales_orders 表政策
DROP POLICY IF EXISTS company_isolation_sales_orders ON sales_orders;
CREATE POLICY company_isolation_sales_orders ON sales_orders
    FOR ALL TO nexus_app
    USING (company_id = COALESCE(
        (NULLIF(current_setting('app.current_company_id', true), ''))::bigint,
        company_id
    ))
    WITH CHECK (company_id = COALESCE(
        (NULLIF(current_setting('app.current_company_id', true), ''))::bigint,
        company_id
    ));

-- 6. 建立超級管理員繞過政策（針對 nexus 超級用戶）
-- 這樣 nexus 用戶仍然可以進行管理工作

DO $$
DECLARE
    table_list TEXT[] := ARRAY['customers', 'products', 'suppliers', 'sales_orders', 'purchase_orders'];
    table_name TEXT;
BEGIN
    FOREACH table_name IN ARRAY table_list
    LOOP
        IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = table_name AND table_schema = 'public') THEN
            BEGIN
                EXECUTE format('CREATE POLICY superuser_access_%s ON %I
                    FOR ALL TO nexus
                    USING (true)
                    WITH CHECK (true)', 
                    table_name, table_name);
                RAISE NOTICE '✅ %: 超級用戶策略已建立', table_name;
            EXCEPTION
                WHEN duplicate_object THEN
                    RAISE NOTICE '⚠️ %: 超級用戶策略已存在', table_name;
            END;
        END IF;
    END LOOP;
END
$$;

-- 7. 驗證設置
SELECT 
    'nexus_app 用戶資訊' as info,
    rolname,
    rolsuper,
    rolcanlogin,
    CASE 
        WHEN rolsuper THEN '❌ 超級用戶（會繞過 RLS）'
        ELSE '✅ 一般用戶（會遵守 RLS）'
    END as rls_status
FROM pg_roles 
WHERE rolname IN ('nexus', 'nexus_app');

-- 8. 檢查政策狀態
SELECT 
    '政策狀態檢查' as info,
    tablename,
    policyname,
    roles
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('customers', 'products', 'suppliers', 'sales_orders', 'purchase_orders')
ORDER BY tablename, policyname;

RAISE NOTICE '🎯 RLS 超級用戶問題修復完成！';
RAISE NOTICE '📝 下一步：更新 Laravel .env 檔案中的資料庫用戶為 nexus_app';