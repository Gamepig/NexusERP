-- PostgreSQL 多租戶安全審計腳本
-- 用於檢查 NexusERP 資料庫的安全配置和潛在風險
-- 
-- 使用方式：
-- psql -U nexus_app -d nexus_erp -f database-security-audit.sql

\echo '============================================================================'
\echo '                    NexusERP 資料庫安全審計報告'
\echo '============================================================================'
\echo ''

-- ============================================================================
-- 1. RLS 策略覆蓋率檢查
-- ============================================================================

\echo '1. Row Level Security (RLS) 策略覆蓋率檢查'
\echo '----------------------------------------'

SELECT 
    '總表數' as metric,
    COUNT(*) as value
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename NOT IN ('migrations', 'password_resets', 'personal_access_tokens', 'failed_jobs', 'jobs', 'cache', 'sessions')
UNION ALL
SELECT 
    '已啟用 RLS 的表' as metric,
    COUNT(*) as value
FROM pg_tables t
JOIN pg_class c ON c.relname = t.tablename
WHERE t.schemaname = 'public'
AND t.tablename NOT IN ('migrations', 'password_resets', 'personal_access_tokens', 'failed_jobs', 'jobs', 'cache', 'sessions')
AND c.relrowsecurity = true
UNION ALL
SELECT 
    '未啟用 RLS 的表 (風險)' as metric,
    COUNT(*) as value
FROM pg_tables t
LEFT JOIN pg_class c ON c.relname = t.tablename
WHERE t.schemaname = 'public'
AND t.tablename NOT IN ('migrations', 'password_resets', 'personal_access_tokens', 'failed_jobs', 'jobs', 'cache', 'sessions')
AND (c.relrowsecurity IS NULL OR c.relrowsecurity = false);

\echo ''
\echo '高風險表（未啟用 RLS 且包含 company_id）：'
SELECT 
    t.tablename as "表名",
    CASE WHEN c.relrowsecurity THEN '已保護' ELSE '🚨 高風險' END as "RLS 狀態",
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = t.tablename AND column_name = 'company_id'
    ) THEN '是' ELSE '否' END as "有 company_id"
FROM pg_tables t
LEFT JOIN pg_class c ON c.relname = t.tablename
WHERE t.schemaname = 'public'
AND t.tablename NOT IN ('migrations', 'password_resets', 'personal_access_tokens', 'failed_jobs', 'jobs', 'cache', 'sessions')
AND EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = t.tablename AND column_name = 'company_id'
)
AND (c.relrowsecurity IS NULL OR c.relrowsecurity = false)
ORDER BY t.tablename;

-- ============================================================================
-- 2. 孤立資料檢查（多租戶資料完整性）
-- ============================================================================

\echo ''
\echo '2. 孤立資料檢查（多租戶資料完整性）'
\echo '--------------------------------'

-- 檢查 users 表中沒有公司關聯的用戶
\echo '用戶公司關聯檢查：'
SELECT 
    'users 總數' as metric,
    COUNT(*) as count
FROM users
UNION ALL
SELECT 
    'users 有公司關聯' as metric,
    COUNT(DISTINCT u.id) as count
FROM users u
JOIN user_companies uc ON uc.user_id = u.id
UNION ALL
SELECT 
    '🚨 users 無公司關聯 (孤立)' as metric,
    COUNT(*) as count
FROM users u
LEFT JOIN user_companies uc ON uc.user_id = u.id
WHERE uc.user_id IS NULL;

-- 檢查產品表中的孤立記錄
\echo ''
\echo '產品資料完整性檢查：'
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'products') THEN
        PERFORM 1;
        -- 這裡可以添加產品孤立記錄檢查
    END IF;
END $$;

SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'products') 
        THEN (
            SELECT 
                CASE 
                    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'company_id')
                    THEN CONCAT('products 表存在，包含 company_id：', (SELECT COUNT(*) FROM products)::text, ' 筆記錄')
                    ELSE 'products 表存在但缺少 company_id 欄位 🚨'
                END
        )
        ELSE 'products 表不存在'
    END as status;

-- ============================================================================
-- 3. 權限與角色檢查
-- ============================================================================

\echo ''
\echo '3. 權限與角色檢查'
\echo '----------------'

\echo '資料庫角色清單：'
SELECT 
    rolname as "角色名稱",
    rolsuper as "超級用戶",
    rolcreaterole as "可建立角色",
    rolcreatedb as "可建立資料庫",
    rolcanlogin as "可登入",
    rolconnlimit as "連線限制"
FROM pg_roles 
WHERE rolname NOT LIKE 'pg_%'
ORDER BY rolname;

\echo ''
\echo '目前使用者權限：'
SELECT 
    current_user as "目前用戶",
    session_user as "會話用戶",
    current_database() as "目前資料庫";

-- ============================================================================
-- 4. 索引與效能檢查
-- ============================================================================

\echo ''
\echo '4. 索引與效能檢查'
\echo '----------------'

\echo '多租戶相關索引檢查：'
SELECT 
    schemaname as "結構描述",
    tablename as "表名",
    indexname as "索引名稱",
    indexdef as "索引定義"
FROM pg_indexes 
WHERE schemaname = 'public'
AND indexdef LIKE '%company_id%'
ORDER BY tablename, indexname;

\echo ''
\echo '缺少 company_id 索引的表：'
SELECT 
    t.tablename as "表名",
    '🚨 缺少 company_id 索引' as "狀態"
FROM pg_tables t
WHERE t.schemaname = 'public'
AND EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = t.tablename AND column_name = 'company_id'
)
AND NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND tablename = t.tablename 
    AND indexdef LIKE '%company_id%'
)
ORDER BY t.tablename;

-- ============================================================================
-- 5. 連線與會話檢查
-- ============================================================================

\echo ''
\echo '5. 連線與會話檢查'
\echo '----------------'

SELECT 
    application_name as "應用程式",
    state as "狀態",
    COUNT(*) as "連線數"
FROM pg_stat_activity 
WHERE state IS NOT NULL
GROUP BY application_name, state
ORDER BY COUNT(*) DESC;

-- ============================================================================
-- 6. RLS 策略詳細檢查
-- ============================================================================

\echo ''
\echo '6. RLS 策略詳細檢查'
\echo '------------------'

SELECT 
    schemaname as "結構描述",
    tablename as "表名",
    policyname as "策略名稱",
    permissive as "許可型",
    roles as "適用角色",
    cmd as "指令類型",
    qual as "使用條件",
    with_check as "檢查條件"
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================================================
-- 7. 安全設定檢查
-- ============================================================================

\echo ''
\echo '7. 安全設定檢查'
\echo '--------------'

SELECT 
    name as "設定項目",
    setting as "設定值",
    source as "來源"
FROM pg_settings 
WHERE name IN (
    'row_security',
    'ssl',
    'password_encryption',
    'log_connections',
    'log_disconnections',
    'log_statement'
)
ORDER BY name;

-- ============================================================================
-- 8. 資料量統計
-- ============================================================================

\echo ''
\echo '8. 多租戶資料量統計'
\echo '------------------'

-- 檢查公司數量
SELECT 
    '總公司數' as metric,
    COUNT(*) as value
FROM companies;

-- 檢查各公司的基本資料量（如果表存在）
DO $$
DECLARE
    table_exists boolean;
BEGIN
    -- 檢查 products 表是否存在
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'products'
    ) INTO table_exists;
    
    IF table_exists THEN
        RAISE NOTICE 'Products 表存在，可以進行統計';
    ELSE
        RAISE NOTICE 'Products 表不存在';
    END IF;
END $$;

-- ============================================================================
-- 9. 建議修復腳本
-- ============================================================================

\echo ''
\echo '9. 安全風險修復建議'
\echo '------------------'

\echo '請執行以下修復步驟：'
\echo ''
\echo '1. 立即執行 RLS 完整實現遷移：'
\echo '   php artisan migrate --path=database/migrations/2025_07_30_100000_complete_rls_implementation.php'
\echo ''
\echo '2. 執行效能優化遷移：'
\echo '   php artisan migrate --path=database/migrations/2025_07_30_101000_add_performance_optimization.php'
\echo ''
\echo '3. 啟用租戶上下文中介軟體：'
\echo '   在 app/Http/Kernel.php 中添加 SetTenantContext 中介軟體'
\echo ''
\echo '4. 執行資料清理：'
\echo '   清理孤立的用戶和產品記錄'
\echo ''
\echo '5. 定期監控：'
\echo '   設定自動化安全審計定期執行'

-- ============================================================================
-- 10. 結果摘要
-- ============================================================================

\echo ''
\echo '============================================================================'
\echo '                              審計結果摘要'
\echo '============================================================================'

SELECT 
    '審計完成時間' as "項目",
    CURRENT_TIMESTAMP as "值"
UNION ALL
SELECT 
    '資料庫版本' as "項目",
    version() as "值"
UNION ALL
SELECT 
    '審計者' as "項目",
    current_user as "值";

\echo ''
\echo '⚠️  請仔細檢視上述結果，特別注意標記為 🚨 的高風險項目'
\echo '📋 建議將此報告儲存並定期執行以監控安全狀態'
\echo '🔒 所有多租戶相關的表都應該啟用 RLS 並設定適當的策略'
\echo ''
\echo '============================================================================'