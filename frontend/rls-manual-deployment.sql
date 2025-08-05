-- 手動部署 PostgreSQL RLS 策略
-- 這個腳本會安全地建立 RLS 策略，即使某些表不存在也不會出錯

-- 1. 建立應用程式角色
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'nexus_app_user') THEN
        CREATE ROLE nexus_app_user;
    END IF;
END
$$;

-- 授予基本權限
GRANT CONNECT ON DATABASE nexus_erp TO nexus_app_user;
GRANT USAGE ON SCHEMA public TO nexus_app_user;

-- 2. 為存在的表啟用 RLS
DO $$
DECLARE
    table_record RECORD;
    table_list TEXT[] := ARRAY['companies', 'customers', 'products', 'suppliers', 'sales_orders', 'purchase_orders'];
    table_name TEXT;
BEGIN
    FOREACH table_name IN ARRAY table_list
    LOOP
        -- 檢查表是否存在
        IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = table_name AND table_schema = 'public') THEN
            -- 啟用 RLS
            EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_name);
            RAISE NOTICE '✅ %: RLS 已啟用', table_name;
            
            -- 為有 company_id 的表建立隔離策略
            IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = table_name AND column_name = 'company_id' AND table_schema = 'public') THEN
                BEGIN
                    EXECUTE format('CREATE POLICY company_isolation_%s ON %I
                        FOR ALL TO nexus_app_user
                        USING (company_id = current_setting(''app.current_company_id'', true)::int)
                        WITH CHECK (company_id = current_setting(''app.current_company_id'', true)::int)', 
                        table_name, table_name);
                    RAISE NOTICE '✅ %: 公司隔離策略已建立', table_name;
                EXCEPTION
                    WHEN duplicate_object THEN
                        RAISE NOTICE '⚠️ %: 策略已存在，跳過', table_name;
                END;
            ELSE
                RAISE NOTICE '⚠️ %: 無 company_id 欄位，跳過策略建立', table_name;
            END IF;
            
            -- 授予表格權限
            EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE %I TO nexus_app_user', table_name);
            
        ELSE
            RAISE NOTICE '⚠️ %: 表不存在，跳過', table_name;
        END IF;
    END LOOP;
END
$$;

-- 3. 為關聯表建立策略
DO $$
DECLARE
    table_name TEXT;
    parent_table TEXT;
    parent_column TEXT;
BEGIN
    -- sales_order_items 通過 sales_orders 驗證
    table_name := 'sales_order_items';
    parent_table := 'sales_orders';
    parent_column := 'sales_order_id';
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = table_name AND table_schema = 'public') 
       AND EXISTS (SELECT FROM information_schema.tables WHERE table_name = parent_table AND table_schema = 'public') THEN
        
        ALTER TABLE sales_order_items ENABLE ROW LEVEL SECURITY;
        
        BEGIN
            EXECUTE format('CREATE POLICY company_isolation_%s ON %I
                FOR ALL TO nexus_app_user
                USING (EXISTS (
                    SELECT 1 FROM %I 
                    WHERE %I.id = %I.%I 
                    AND %I.company_id = current_setting(''app.current_company_id'', true)::int
                ))
                WITH CHECK (EXISTS (
                    SELECT 1 FROM %I 
                    WHERE %I.id = %I.%I 
                    AND %I.company_id = current_setting(''app.current_company_id'', true)::int
                ))', 
                table_name, table_name,
                parent_table, parent_table, table_name, parent_column, parent_table,
                parent_table, parent_table, table_name, parent_column, parent_table);
            RAISE NOTICE '✅ %: 關聯表隔離策略已建立', table_name;
            
            GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE sales_order_items TO nexus_app_user;
        EXCEPTION
            WHEN duplicate_object THEN
                RAISE NOTICE '⚠️ %: 策略已存在，跳過', table_name;
        END;
    END IF;

    -- purchase_order_items 通過 purchase_orders 驗證  
    table_name := 'purchase_order_items';
    parent_table := 'purchase_orders';
    parent_column := 'purchase_order_id';
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = table_name AND table_schema = 'public') 
       AND EXISTS (SELECT FROM information_schema.tables WHERE table_name = parent_table AND table_schema = 'public') THEN
        
        ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;
        
        BEGIN
            EXECUTE format('CREATE POLICY company_isolation_%s ON %I
                FOR ALL TO nexus_app_user
                USING (EXISTS (
                    SELECT 1 FROM %I 
                    WHERE %I.id = %I.%I 
                    AND %I.company_id = current_setting(''app.current_company_id'', true)::int
                ))
                WITH CHECK (EXISTS (
                    SELECT 1 FROM %I 
                    WHERE %I.id = %I.%I 
                    AND %I.company_id = current_setting(''app.current_company_id'', true)::int
                ))', 
                table_name, table_name,
                parent_table, parent_table, table_name, parent_column, parent_table,
                parent_table, parent_table, table_name, parent_column, parent_table);
            RAISE NOTICE '✅ %: 關聯表隔離策略已建立', table_name;
            
            GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE purchase_order_items TO nexus_app_user;
        EXCEPTION
            WHEN duplicate_object THEN
                RAISE NOTICE '⚠️ %: 策略已存在，跳過', table_name;
        END;
    END IF;
END
$$;

-- 4. 建立超級管理員繞過策略
DO $$
DECLARE
    table_list TEXT[] := ARRAY['customers', 'products', 'suppliers', 'sales_orders', 'purchase_orders'];
    table_name TEXT;
BEGIN
    FOREACH table_name IN ARRAY table_list
    LOOP
        IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = table_name AND table_schema = 'public') THEN
            BEGIN
                EXECUTE format('CREATE POLICY superuser_bypass_%s ON %I
                    FOR ALL TO nexus_app_user
                    USING (current_setting(''app.superuser_mode'', true)::boolean = true)
                    WITH CHECK (current_setting(''app.superuser_mode'', true)::boolean = true)', 
                    table_name, table_name);
                RAISE NOTICE '✅ %: 超級管理員繞過策略已建立', table_name;
            EXCEPTION
                WHEN duplicate_object THEN
                    RAISE NOTICE '⚠️ %: 超級管理員策略已存在，跳過', table_name;
            END;
        END IF;
    END LOOP;
END
$$;

-- 5. 驗證設置
DO $$
DECLARE
    rls_count INTEGER;
    policy_count INTEGER;
BEGIN
    -- 檢查啟用 RLS 的表數量
    SELECT COUNT(*) INTO rls_count
    FROM pg_class c
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE n.nspname = 'public' 
    AND c.relkind = 'r' 
    AND c.relrowsecurity = true;
    
    -- 檢查策略數量
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'public';
    
    RAISE NOTICE '📊 RLS 部署總結:';
    RAISE NOTICE '   - 啟用 RLS 的表: % 個', rls_count;
    RAISE NOTICE '   - 建立的策略: % 個', policy_count;
    RAISE NOTICE '✅ PostgreSQL RLS 策略部署完成！';
END
$$;