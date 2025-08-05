-- 強制超級用戶遵守 RLS 政策（選擇方案 2）
-- 
-- 警告：這會影響超級用戶的管理能力，僅在必要時使用
-- 推薦使用選擇方案 1（建立專用應用用戶）

-- 1. 強制所有表的 RLS 政策適用於超級用戶
DO $$
DECLARE
    table_list TEXT[] := ARRAY['customers', 'products', 'suppliers', 'sales_orders', 'purchase_orders'];
    table_name TEXT;
BEGIN
    FOREACH table_name IN ARRAY table_list
    LOOP
        IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = table_name AND table_schema = 'public') THEN
            -- 強制 RLS 適用於所有用戶（包括超級用戶）
            EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', table_name);
            RAISE NOTICE '✅ %: 強制 RLS 已啟用（包括超級用戶）', table_name;
        END IF;
    END LOOP;
END
$$;

-- 2. 建立超級管理員繞過模式（可選）
-- 設定特殊會話變數來暫時繞過 RLS

DO $$
DECLARE
    table_list TEXT[] := ARRAY['customers', 'products', 'suppliers', 'sales_orders', 'purchase_orders'];
    table_name TEXT;
BEGIN
    FOREACH table_name IN ARRAY table_list
    LOOP
        IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = table_name AND table_schema = 'public') THEN
            BEGIN
                -- 建立管理員繞過策略
                EXECUTE format('CREATE POLICY admin_bypass_%s ON %I
                    FOR ALL
                    USING (
                        current_setting(''app.admin_mode'', true)::boolean = true
                        OR (
                            current_setting(''app.current_company_id'', true) != ''''
                            AND company_id = COALESCE(
                                (NULLIF(current_setting(''app.current_company_id'', true), ''''))::bigint,
                                company_id
                            )
                        )
                    )
                    WITH CHECK (
                        current_setting(''app.admin_mode'', true)::boolean = true
                        OR (
                            current_setting(''app.current_company_id'', true) != ''''
                            AND company_id = COALESCE(
                                (NULLIF(current_setting(''app.current_company_id'', true), ''''))::bigint,
                                company_id
                            )
                        )
                    )', 
                    table_name, table_name);
                RAISE NOTICE '✅ %: 管理員繞過策略已建立', table_name;
            EXCEPTION
                WHEN duplicate_object THEN
                    RAISE NOTICE '⚠️ %: 管理員繞過策略已存在', table_name;
            END;
        END IF;
    END LOOP;
END
$$;

-- 3. 驗證強制 RLS 設置
SELECT 
    '強制 RLS 狀態檢查' as info,
    schemaname,
    tablename,
    CASE 
        WHEN rowsecurity AND NOT hasrls THEN '❌ RLS 啟用但無強制'
        WHEN rowsecurity AND hasrls THEN '✅ RLS 強制啟用'
        ELSE '❌ RLS 未啟用'
    END as force_rls_status
FROM pg_tables pt
LEFT JOIN (
    SELECT 
        relname,
        relrowsecurity as rowsecurity,
        relforcerowsecurity as hasrls
    FROM pg_class 
    WHERE relkind = 'r'
) pc ON pc.relname = pt.tablename
WHERE pt.schemaname = 'public'
AND pt.tablename IN ('customers', 'products', 'suppliers', 'sales_orders', 'purchase_orders')
ORDER BY pt.tablename;

-- 4. 提供管理員模式的使用說明
DO $$
BEGIN
    RAISE NOTICE '📋 管理員模式使用說明：';
    RAISE NOTICE '   啟用管理員模式（繞過 RLS）：';
    RAISE NOTICE '   SELECT set_config(''app.admin_mode'', ''true'', false);';
    RAISE NOTICE '   ';
    RAISE NOTICE '   停用管理員模式（遵守 RLS）：';
    RAISE NOTICE '   SELECT set_config(''app.admin_mode'', ''false'', false);';
    RAISE NOTICE '   ';
    RAISE NOTICE '   檢查當前模式：';
    RAISE NOTICE '   SELECT current_setting(''app.admin_mode'', true);';
END
$$;

RAISE NOTICE '⚠️ 強制 RLS 已啟用，超級用戶現在會遵守 RLS 政策！';
RAISE NOTICE '🔧 如果需要進行管理工作，請先啟用管理員模式';