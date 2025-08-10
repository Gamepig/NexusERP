-- ================================================
-- 超級管理員角色建立腳本
-- 功能：建立具有 BYPASSRLS 屬性的特權資料庫角色
-- 安全等級：CRITICAL - 僅限系統管理使用
-- ================================================

-- 1. 建立超級管理員角色
DO $$
BEGIN
    -- 檢查角色是否已存在
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'nexus_superadmin') THEN
        -- 建立具有 BYPASSRLS 權限的角色
        CREATE ROLE nexus_superadmin WITH
            LOGIN                    -- 允許登入
            PASSWORD 'superadmin_secure_password_2025'  -- 強密碼
            BYPASSRLS               -- 繞過行級安全性
            NOSUPERUSER             -- 不是 PostgreSQL 超級用戶（安全考量）
            NOCREATEDB              -- 不允許建立資料庫
            NOCREATEROLE            -- 不允許建立角色
            NOREPLICATION           -- 不允許複製
            CONNECTION LIMIT 5;     -- 限制連接數量
        
        RAISE NOTICE '超級管理員角色 nexus_superadmin 建立成功';
    ELSE
        RAISE NOTICE '超級管理員角色 nexus_superadmin 已存在';
    END IF;
END $$;

-- 2. 授予基本權限（僅限必要權限）
GRANT CONNECT ON DATABASE nexus_erp TO nexus_superadmin;
GRANT USAGE ON SCHEMA public TO nexus_superadmin;

-- 3. 授予表格存取權限（所有表格的完整權限）
DO $$
DECLARE
    table_name TEXT;
BEGIN
    -- 對所有現有表格授權
    FOR table_name IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE %I TO nexus_superadmin', table_name);
    END LOOP;
    
    RAISE NOTICE '已對所有現有表格授予權限給 nexus_superadmin';
END $$;

-- 4. 授予序列權限
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO nexus_superadmin;

-- 5. 設定預設權限（對未來建立的物件）
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO nexus_superadmin;
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
    GRANT USAGE, SELECT ON SEQUENCES TO nexus_superadmin;

-- 6. 建立超級管理員專用的資料庫連接配置函數
CREATE OR REPLACE FUNCTION set_superadmin_context(admin_user_id INT, reason TEXT DEFAULT '')
RETURNS void AS $$
BEGIN
    -- 設定超級管理員模式
    PERFORM set_config('app.superuser_mode', 'true', true);
    
    -- 設定管理員用戶 ID
    PERFORM set_config('app.current_user_id', admin_user_id::text, true);
    
    -- 清除公司限制（超級管理員可見所有公司資料）
    PERFORM set_config('app.current_company_id', '', true);
    
    -- 記錄存取原因
    PERFORM set_config('app.admin_access_reason', reason, true);
    
    -- 設定時間戳
    PERFORM set_config('app.context_set_time', extract(epoch from now())::text, true);
    
    -- 記錄超級管理員存取
    INSERT INTO security_logs (
        level, event, user_id, details, created_at
    ) VALUES (
        'CRITICAL',
        'SUPERADMIN_ACCESS_ENABLED',
        admin_user_id,
        jsonb_build_object(
            'reason', reason,
            'timestamp', now(),
            'database_role', current_user
        ),
        now()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. 建立安全日誌表（如果不存在）
CREATE TABLE IF NOT EXISTS security_logs (
    id BIGSERIAL PRIMARY KEY,
    level VARCHAR(20) NOT NULL DEFAULT 'INFO',
    event VARCHAR(100) NOT NULL,
    user_id BIGINT,
    company_id BIGINT,
    ip_address INET,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 建立索引
CREATE INDEX IF NOT EXISTS idx_security_logs_level ON security_logs (level);
CREATE INDEX IF NOT EXISTS idx_security_logs_event ON security_logs (event);
CREATE INDEX IF NOT EXISTS idx_security_logs_user ON security_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_security_logs_created ON security_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_logs_details ON security_logs USING GIN (details);

-- 8. 建立超級管理員存取監控視圖
CREATE OR REPLACE VIEW superadmin_access_monitor AS
SELECT 
    sl.id,
    sl.event,
    sl.user_id,
    u.name as admin_name,
    u.email as admin_email,
    sl.details->>'reason' as access_reason,
    sl.details->>'database_role' as database_role,
    sl.created_at,
    sl.ip_address
FROM security_logs sl
LEFT JOIN users u ON sl.user_id = u.id
WHERE sl.event = 'SUPERADMIN_ACCESS_ENABLED'
ORDER BY sl.created_at DESC;

-- 9. 建立清理函數（移除過期的存取記錄）
CREATE OR REPLACE FUNCTION cleanup_superadmin_logs(retention_days INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM security_logs 
    WHERE event = 'SUPERADMIN_ACCESS_ENABLED' 
    AND created_at < NOW() - INTERVAL '1 day' * retention_days;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    INSERT INTO security_logs (level, event, details)
    VALUES (
        'INFO',
        'SUPERADMIN_LOGS_CLEANUP',
        jsonb_build_object(
            'deleted_count', deleted_count,
            'retention_days', retention_days
        )
    );
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. 安全提醒註釋
COMMENT ON ROLE nexus_superadmin IS '
超級管理員角色 - 具有 BYPASSRLS 權限
⚠️  安全警告：
1. 此角色可以繞過所有 RLS 策略
2. 僅限緊急情況和系統維護使用
3. 所有存取都會被記錄和監控
4. 定期檢查存取日誌
5. 密碼應定期更換
';

COMMENT ON FUNCTION set_superadmin_context IS '
設定超級管理員上下文
⚠️  此函數會啟用超級管理員模式並記錄所有存取
';

-- 11. 驗證腳本執行結果
DO $$
BEGIN
    -- 檢查角色建立
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'nexus_superadmin') THEN
        RAISE NOTICE '✅ 超級管理員角色驗證成功';
    ELSE
        RAISE EXCEPTION '❌ 超級管理員角色建立失敗';
    END IF;
    
    -- 檢查 BYPASSRLS 權限
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'nexus_superadmin' AND rolbypassrls = true) THEN
        RAISE NOTICE '✅ BYPASSRLS 權限驗證成功';
    ELSE
        RAISE EXCEPTION '❌ BYPASSRLS 權限設定失敗';
    END IF;
    
    -- 檢查函數建立
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'set_superadmin_context') THEN
        RAISE NOTICE '✅ 超級管理員上下文函數建立成功';
    ELSE
        RAISE EXCEPTION '❌ 超級管理員上下文函數建立失敗';
    END IF;
    
    RAISE NOTICE '🎉 超級管理員角色建立腳本執行完成';
END $$;