-- Create MFA (Multi-Factor Authentication) Tables
-- Migration: 000061_create_mfa_tables.up.sql

-- **MFA設備表**
CREATE TABLE IF NOT EXISTS mfa_devices (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    company_id BIGINT NOT NULL,
    device_name VARCHAR(255) NOT NULL,
    method VARCHAR(50) NOT NULL CHECK (method IN ('totp', 'sms', 'email', 'backup')),
    secret TEXT NOT NULL,                    -- 加密的密鑰或配置
    backup_codes TEXT,                       -- 加密的備份代碼
    is_active BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- 外鍵約束
    CONSTRAINT fk_mfa_devices_user_id 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_mfa_devices_company_id 
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    
    -- 確保用戶屬於公司
    CONSTRAINT fk_mfa_devices_user_company
        FOREIGN KEY (user_id, company_id) REFERENCES user_companies(user_id, company_id) ON DELETE CASCADE,
        
    -- 每個用戶每種方法只能有一個活躍設備
    CONSTRAINT unique_active_device_per_method 
        UNIQUE (user_id, company_id, method) DEFERRABLE INITIALLY DEFERRED
);

-- **MFA驗證挑戰表**
CREATE TABLE IF NOT EXISTS mfa_challenges (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    company_id BIGINT NOT NULL,
    device_id BIGINT NOT NULL,
    challenge VARCHAR(255) NOT NULL,         -- 挑戰代碼或標識
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- 外鍵約束
    CONSTRAINT fk_mfa_challenges_user_id 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_mfa_challenges_company_id 
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    CONSTRAINT fk_mfa_challenges_device_id 
        FOREIGN KEY (device_id) REFERENCES mfa_devices(id) ON DELETE CASCADE
);

-- **MFA使用統計表** (用於監控和審計)
CREATE TABLE IF NOT EXISTS mfa_usage_stats (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    company_id BIGINT NOT NULL,
    device_id BIGINT NOT NULL,
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('verification_success', 'verification_failed', 'backup_code_used')),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- 外鍵約束
    CONSTRAINT fk_mfa_stats_user_id 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_mfa_stats_company_id 
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    CONSTRAINT fk_mfa_stats_device_id 
        FOREIGN KEY (device_id) REFERENCES mfa_devices(id) ON DELETE CASCADE
);

-- **索引優化**

-- MFA設備索引
CREATE INDEX IF NOT EXISTS idx_mfa_devices_user_company 
ON mfa_devices (user_id, company_id);

CREATE INDEX IF NOT EXISTS idx_mfa_devices_active 
ON mfa_devices (user_id, is_active, is_verified) 
WHERE is_active = TRUE AND is_verified = TRUE;

CREATE INDEX IF NOT EXISTS idx_mfa_devices_method 
ON mfa_devices (method, is_active);

-- MFA挑戰索引
CREATE INDEX IF NOT EXISTS idx_mfa_challenges_user_company 
ON mfa_challenges (user_id, company_id);

CREATE INDEX IF NOT EXISTS idx_mfa_challenges_device 
ON mfa_challenges (device_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_mfa_challenges_expires 
ON mfa_challenges (expires_at) 
WHERE is_verified = FALSE;

-- MFA統計索引
CREATE INDEX IF NOT EXISTS idx_mfa_stats_user_company 
ON mfa_usage_stats (user_id, company_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_mfa_stats_device 
ON mfa_usage_stats (device_id, event_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_mfa_stats_event_time 
ON mfa_usage_stats (event_type, created_at DESC);

-- **RLS (Row Level Security) 設定**

-- 啟用RLS
ALTER TABLE mfa_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE mfa_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE mfa_usage_stats ENABLE ROW LEVEL SECURITY;

-- MFA設備RLS政策
CREATE POLICY mfa_devices_company_isolation ON mfa_devices
    FOR ALL TO nexus_app
    USING (
        current_setting('app.current_company_id', true)::bigint > 0
        AND company_id = current_setting('app.current_company_id', true)::bigint
        AND EXISTS (
            SELECT 1 FROM user_companies uc 
            WHERE uc.user_id = mfa_devices.user_id 
            AND uc.company_id = mfa_devices.company_id
            AND uc.is_active = TRUE
        )
    )
    WITH CHECK (
        current_setting('app.current_company_id', true)::bigint > 0
        AND company_id = current_setting('app.current_company_id', true)::bigint
        AND EXISTS (
            SELECT 1 FROM user_companies uc 
            WHERE uc.user_id = mfa_devices.user_id 
            AND uc.company_id = mfa_devices.company_id
            AND uc.is_active = TRUE
        )
    );

-- MFA挑戰RLS政策
CREATE POLICY mfa_challenges_company_isolation ON mfa_challenges
    FOR ALL TO nexus_app
    USING (
        current_setting('app.current_company_id', true)::bigint > 0
        AND company_id = current_setting('app.current_company_id', true)::bigint
    )
    WITH CHECK (
        current_setting('app.current_company_id', true)::bigint > 0
        AND company_id = current_setting('app.current_company_id', true)::bigint
    );

-- MFA統計RLS政策
CREATE POLICY mfa_stats_company_isolation ON mfa_usage_stats
    FOR ALL TO nexus_app
    USING (
        current_setting('app.current_company_id', true)::bigint > 0
        AND company_id = current_setting('app.current_company_id', true)::bigint
    )
    WITH CHECK (
        current_setting('app.current_company_id', true)::bigint > 0
        AND company_id = current_setting('app.current_company_id', true)::bigint
    );

-- **清理和維護函數**

-- 清理過期的MFA挑戰
CREATE OR REPLACE FUNCTION cleanup_expired_mfa_challenges()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM mfa_challenges 
    WHERE expires_at < NOW() - INTERVAL '1 hour'; -- 清理1小時前過期的挑戰
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RAISE INFO 'MFA_CHALLENGE_CLEANUP: deleted % expired challenges at %', deleted_count, NOW();
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 清理舊的MFA使用統計 (保留6個月)
CREATE OR REPLACE FUNCTION cleanup_old_mfa_stats()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM mfa_usage_stats 
    WHERE created_at < NOW() - INTERVAL '6 months';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RAISE INFO 'MFA_STATS_CLEANUP: deleted % old statistics at %', deleted_count, NOW();
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- **監控視圖**

-- MFA使用摘要視圖
CREATE OR REPLACE VIEW mfa_usage_summary AS
SELECT 
    u.id as user_id,
    u.email,
    c.id as company_id,
    c.name as company_name,
    COUNT(md.id) as total_devices,
    COUNT(CASE WHEN md.is_active AND md.is_verified THEN 1 END) as active_devices,
    COUNT(CASE WHEN md.method = 'totp' AND md.is_active THEN 1 END) as totp_devices,
    MAX(md.last_used_at) as last_mfa_used,
    COUNT(CASE WHEN ms.event_type = 'verification_success' AND ms.created_at >= NOW() - INTERVAL '24 hours' THEN 1 END) as daily_verifications,
    COUNT(CASE WHEN ms.event_type = 'verification_failed' AND ms.created_at >= NOW() - INTERVAL '24 hours' THEN 1 END) as daily_failures
FROM users u
JOIN user_companies uc ON u.id = uc.user_id AND uc.is_active = TRUE
JOIN companies c ON uc.company_id = c.id
LEFT JOIN mfa_devices md ON u.id = md.user_id AND uc.company_id = md.company_id
LEFT JOIN mfa_usage_stats ms ON md.id = ms.device_id AND ms.created_at >= NOW() - INTERVAL '24 hours'
GROUP BY u.id, u.email, c.id, c.name
ORDER BY u.email;

-- 可疑MFA活動視圖
CREATE OR REPLACE VIEW suspicious_mfa_activity AS
SELECT 
    ms.user_id,
    ms.company_id,
    ms.device_id,
    md.device_name,
    ms.ip_address,
    COUNT(*) as failed_attempts,
    MIN(ms.created_at) as first_failure,
    MAX(ms.created_at) as last_failure,
    COUNT(DISTINCT ms.ip_address) as unique_ips
FROM mfa_usage_stats ms
JOIN mfa_devices md ON ms.device_id = md.id
WHERE ms.event_type = 'verification_failed'
    AND ms.created_at >= NOW() - INTERVAL '1 hour'
GROUP BY ms.user_id, ms.company_id, ms.device_id, md.device_name, ms.ip_address
HAVING COUNT(*) >= 3  -- 1小時內3次以上失敗
ORDER BY failed_attempts DESC, last_failure DESC;

-- **觸發器設定**

-- 更新mfa_devices的updated_at欄位
CREATE OR REPLACE FUNCTION update_mfa_devices_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_mfa_devices_updated_at
    BEFORE UPDATE ON mfa_devices
    FOR EACH ROW
    EXECUTE FUNCTION update_mfa_devices_updated_at();

-- 自動記錄MFA使用統計
CREATE OR REPLACE FUNCTION log_mfa_verification_attempt()
RETURNS TRIGGER AS $$
BEGIN
    -- 當MFA挑戰被驗證時，記錄統計
    IF NEW.is_verified = TRUE AND OLD.is_verified = FALSE THEN
        INSERT INTO mfa_usage_stats (user_id, company_id, device_id, event_type)
        VALUES (NEW.user_id, NEW.company_id, NEW.device_id, 'verification_success');
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_mfa_verification
    AFTER UPDATE ON mfa_challenges
    FOR EACH ROW
    EXECUTE FUNCTION log_mfa_verification_attempt();

-- **統計資訊更新**
ANALYZE mfa_devices;
ANALYZE mfa_challenges;
ANALYZE mfa_usage_stats;

-- **註解說明**
COMMENT ON TABLE mfa_devices IS 'MFA設備註冊表 - 存儲用戶的多因子認證設備';
COMMENT ON TABLE mfa_challenges IS 'MFA驗證挑戰表 - 臨時驗證挑戰';
COMMENT ON TABLE mfa_usage_stats IS 'MFA使用統計表 - 追蹤MFA驗證活動';
COMMENT ON VIEW mfa_usage_summary IS '用戶MFA使用摘要 - 顯示每個用戶的MFA設備和使用情況';
COMMENT ON VIEW suspicious_mfa_activity IS '可疑MFA活動檢測 - 識別異常的驗證失敗模式';
COMMENT ON FUNCTION cleanup_expired_mfa_challenges() IS '清理過期的MFA驗證挑戰';
COMMENT ON FUNCTION cleanup_old_mfa_stats() IS '清理舊的MFA使用統計記錄';