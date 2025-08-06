-- Create OAuth Tables for Social Authentication
-- Migration: 000062_create_oauth_tables.up.sql

-- **OAuth狀態表** (用於CSRF防護)
CREATE TABLE IF NOT EXISTS oauth_states (
    id BIGSERIAL PRIMARY KEY,
    state VARCHAR(255) UNIQUE NOT NULL,     -- 隨機生成的狀態碼
    provider VARCHAR(50) NOT NULL CHECK (provider IN ('google', 'line', 'github', 'microsoft')),
    redirect_url TEXT,                      -- 認證完成後的重定向URL
    company_id BIGINT,                      -- 關聯的公司ID (可選)
    ip_address INET NOT NULL,               -- 發起認證的IP地址
    user_agent TEXT,                        -- 用戶代理
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- 外鍵約束 (可選的company_id)
    CONSTRAINT fk_oauth_states_company_id 
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL
);

-- **OAuth帳戶關聯表** (用戶與OAuth提供者的關聯)
CREATE TABLE IF NOT EXISTS oauth_accounts (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    company_id BIGINT NOT NULL,
    provider VARCHAR(50) NOT NULL CHECK (provider IN ('google', 'line', 'github', 'microsoft')),
    provider_user_id VARCHAR(255) NOT NULL, -- OAuth提供者的用戶ID
    provider_email VARCHAR(255),            -- OAuth提供者的email
    provider_name VARCHAR(255),             -- OAuth提供者的顯示名稱
    provider_avatar VARCHAR(500),           -- OAuth提供者的頭像URL
    access_token TEXT,                      -- 加密存儲的access token (可選)
    refresh_token TEXT,                     -- 加密存儲的refresh token (可選)
    token_expires_at TIMESTAMP WITH TIME ZONE,
    is_primary BOOLEAN DEFAULT FALSE,       -- 是否為主要OAuth帳戶
    is_verified BOOLEAN DEFAULT TRUE,       -- OAuth帳戶是否已驗證
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- 外鍵約束
    CONSTRAINT fk_oauth_accounts_user_id 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_oauth_accounts_company_id 
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    
    -- 確保用戶屬於公司
    CONSTRAINT fk_oauth_accounts_user_company
        FOREIGN KEY (user_id, company_id) REFERENCES user_companies(user_id, company_id) ON DELETE CASCADE,
        
    -- 每個用戶每個提供者只能有一個帳戶
    CONSTRAINT unique_user_provider UNIQUE (user_id, company_id, provider),
    
    -- 每個提供者的用戶ID只能關聯一個系統帳戶
    CONSTRAINT unique_provider_user UNIQUE (provider, provider_user_id)
);

-- **OAuth登入日誌表** (安全審計)
CREATE TABLE IF NOT EXISTS oauth_login_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT,
    company_id BIGINT,
    provider VARCHAR(50) NOT NULL,
    provider_user_id VARCHAR(255),
    login_status VARCHAR(20) NOT NULL CHECK (login_status IN ('success', 'failed', 'blocked')),
    failure_reason TEXT,                    -- 失敗原因
    ip_address INET NOT NULL,
    user_agent TEXT,
    session_id VARCHAR(255),                -- 關聯的session ID
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- 外鍵約束 (可選的user_id和company_id，因為失敗的登入可能沒有有效用戶)
    CONSTRAINT fk_oauth_logs_user_id 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_oauth_logs_company_id 
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL
);

-- **索引優化**

-- OAuth狀態索引
CREATE INDEX IF NOT EXISTS idx_oauth_states_state 
ON oauth_states (state);

CREATE INDEX IF NOT EXISTS idx_oauth_states_expires 
ON oauth_states (expires_at);

CREATE INDEX IF NOT EXISTS idx_oauth_states_provider_company 
ON oauth_states (provider, company_id, created_at DESC);

-- OAuth帳戶索引
CREATE INDEX IF NOT EXISTS idx_oauth_accounts_user_company 
ON oauth_accounts (user_id, company_id);

CREATE INDEX IF NOT EXISTS idx_oauth_accounts_provider 
ON oauth_accounts (provider, provider_user_id);

CREATE INDEX IF NOT EXISTS idx_oauth_accounts_email 
ON oauth_accounts (provider_email) 
WHERE provider_email IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_oauth_accounts_primary 
ON oauth_accounts (user_id, is_primary) 
WHERE is_primary = TRUE;

CREATE INDEX IF NOT EXISTS idx_oauth_accounts_last_login 
ON oauth_accounts (last_login_at DESC);

-- OAuth登入日誌索引
CREATE INDEX IF NOT EXISTS idx_oauth_logs_user_company 
ON oauth_login_logs (user_id, company_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_oauth_logs_status 
ON oauth_login_logs (login_status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_oauth_logs_provider 
ON oauth_login_logs (provider, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_oauth_logs_ip_time 
ON oauth_login_logs (ip_address, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_oauth_logs_failed_attempts 
ON oauth_login_logs (ip_address, login_status, created_at DESC) 
WHERE login_status = 'failed';

-- **RLS (Row Level Security) 設定**

-- 啟用RLS
ALTER TABLE oauth_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE oauth_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE oauth_login_logs ENABLE ROW LEVEL SECURITY;

-- OAuth狀態RLS政策 (較寬鬆，因為用於認證前)
CREATE POLICY oauth_states_access ON oauth_states
    FOR ALL TO nexus_app
    USING (TRUE)  -- 認證前的狀態檢查不限制
    WITH CHECK (TRUE);

-- OAuth帳戶RLS政策
CREATE POLICY oauth_accounts_company_isolation ON oauth_accounts
    FOR ALL TO nexus_app
    USING (
        current_setting('app.current_company_id', true)::bigint > 0
        AND company_id = current_setting('app.current_company_id', true)::bigint
        AND EXISTS (
            SELECT 1 FROM user_companies uc 
            WHERE uc.user_id = oauth_accounts.user_id 
            AND uc.company_id = oauth_accounts.company_id
            AND uc.is_active = TRUE
        )
    )
    WITH CHECK (
        current_setting('app.current_company_id', true)::bigint > 0
        AND company_id = current_setting('app.current_company_id', true)::bigint
        AND EXISTS (
            SELECT 1 FROM user_companies uc 
            WHERE uc.user_id = oauth_accounts.user_id 
            AND uc.company_id = oauth_accounts.company_id
            AND uc.is_active = TRUE
        )
    );

-- OAuth登入日誌RLS政策
CREATE POLICY oauth_logs_company_isolation ON oauth_login_logs
    FOR ALL TO nexus_app
    USING (
        company_id IS NULL  -- 無公司關聯的日誌對所有人可見 (失敗登入)
        OR (
            current_setting('app.current_company_id', true)::bigint > 0
            AND company_id = current_setting('app.current_company_id', true)::bigint
        )
    )
    WITH CHECK (
        company_id IS NULL
        OR (
            current_setting('app.current_company_id', true)::bigint > 0
            AND company_id = current_setting('app.current_company_id', true)::bigint
        )
    );

-- **清理和維護函數**

-- 清理過期的OAuth狀態
CREATE OR REPLACE FUNCTION cleanup_expired_oauth_states()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM oauth_states 
    WHERE expires_at < NOW() - INTERVAL '1 hour'; -- 清理1小時前過期的狀態
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RAISE INFO 'OAUTH_STATE_CLEANUP: deleted % expired states at %', deleted_count, NOW();
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 清理舊的OAuth登入日誌 (保留1年)
CREATE OR REPLACE FUNCTION cleanup_old_oauth_logs()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM oauth_login_logs 
    WHERE created_at < NOW() - INTERVAL '1 year'
    AND login_status = 'success'; -- 只清理成功的登入記錄，保留失敗記錄更長時間
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RAISE INFO 'OAUTH_LOGS_CLEANUP: deleted % old success logs at %', deleted_count, NOW();
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- **監控視圖**

-- OAuth使用摘要視圖
CREATE OR REPLACE VIEW oauth_usage_summary AS
SELECT 
    oa.provider,
    COUNT(DISTINCT oa.user_id) as total_users,
    COUNT(DISTINCT oa.company_id) as total_companies,
    COUNT(*) as total_accounts,
    COUNT(CASE WHEN oa.is_primary THEN 1 END) as primary_accounts,
    COUNT(CASE WHEN oa.last_login_at >= NOW() - INTERVAL '30 days' THEN 1 END) as active_30d,
    COUNT(CASE WHEN oa.last_login_at >= NOW() - INTERVAL '7 days' THEN 1 END) as active_7d,
    AVG(EXTRACT(EPOCH FROM (NOW() - oa.created_at))/86400)::NUMERIC(10,2) as avg_account_age_days
FROM oauth_accounts oa
WHERE oa.is_verified = TRUE
GROUP BY oa.provider
ORDER BY total_users DESC;

-- 可疑OAuth活動視圖
CREATE OR REPLACE VIEW suspicious_oauth_activity AS
SELECT 
    oll.ip_address,
    oll.provider,
    oll.user_agent,
    COUNT(*) as failed_attempts,
    COUNT(DISTINCT oll.provider_user_id) as unique_provider_users,
    MIN(oll.created_at) as first_failure,
    MAX(oll.created_at) as last_failure,
    STRING_AGG(DISTINCT oll.failure_reason, '; ') as failure_reasons
FROM oauth_login_logs oll
WHERE oll.login_status = 'failed'
    AND oll.created_at >= NOW() - INTERVAL '1 hour'
GROUP BY oll.ip_address, oll.provider, oll.user_agent
HAVING COUNT(*) >= 3  -- 1小時內3次以上失敗
ORDER BY failed_attempts DESC, last_failure DESC;

-- OAuth提供者統計視圖
CREATE OR REPLACE VIEW oauth_provider_stats AS
SELECT 
    provider,
    COUNT(DISTINCT user_id) as unique_users,
    COUNT(*) as total_logins,
    COUNT(CASE WHEN login_status = 'success' THEN 1 END) as successful_logins,
    COUNT(CASE WHEN login_status = 'failed' THEN 1 END) as failed_logins,
    ROUND(
        (COUNT(CASE WHEN login_status = 'success' THEN 1 END)::NUMERIC / NULLIF(COUNT(*), 0)) * 100, 
        2
    ) as success_rate_pct,
    COUNT(CASE WHEN created_at >= NOW() - INTERVAL '24 hours' THEN 1 END) as logins_24h,
    COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as logins_7d
FROM oauth_login_logs
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY provider
ORDER BY successful_logins DESC;

-- **觸發器設定**

-- 更新oauth_accounts的updated_at欄位
CREATE OR REPLACE FUNCTION update_oauth_accounts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_oauth_accounts_updated_at
    BEFORE UPDATE ON oauth_accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_oauth_accounts_updated_at();

-- 自動記錄OAuth登入嘗試
CREATE OR REPLACE FUNCTION log_oauth_login_attempt()
RETURNS TRIGGER AS $$
BEGIN
    -- 當OAuth帳戶的last_login_at被更新時，記錄成功登入
    IF NEW.last_login_at IS NOT NULL AND (OLD.last_login_at IS NULL OR NEW.last_login_at > OLD.last_login_at) THEN
        INSERT INTO oauth_login_logs (
            user_id, company_id, provider, provider_user_id, 
            login_status, ip_address, user_agent
        ) VALUES (
            NEW.user_id, NEW.company_id, NEW.provider, NEW.provider_user_id,
            'success', '127.0.0.1', 'system_trigger'
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_oauth_login
    AFTER UPDATE ON oauth_accounts
    FOR EACH ROW
    EXECUTE FUNCTION log_oauth_login_attempt();

-- **安全約束**

-- 確保每個用戶至少有一個主要OAuth帳戶 (如果有OAuth帳戶的話)
CREATE OR REPLACE FUNCTION check_primary_oauth_account()
RETURNS TRIGGER AS $$
BEGIN
    -- 如果沒有主要帳戶，將第一個設為主要
    IF NOT EXISTS (
        SELECT 1 FROM oauth_accounts 
        WHERE user_id = NEW.user_id AND company_id = NEW.company_id AND is_primary = TRUE
    ) THEN
        NEW.is_primary = TRUE;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_primary_oauth
    BEFORE INSERT ON oauth_accounts
    FOR EACH ROW
    EXECUTE FUNCTION check_primary_oauth_account();

-- **統計資訊更新**
ANALYZE oauth_states;
ANALYZE oauth_accounts;
ANALYZE oauth_login_logs;

-- **註解說明**
COMMENT ON TABLE oauth_states IS 'OAuth狀態表 - 存儲CSRF防護狀態和認證流程信息';
COMMENT ON TABLE oauth_accounts IS 'OAuth帳戶關聯表 - 用戶與OAuth提供者的綁定關係';
COMMENT ON TABLE oauth_login_logs IS 'OAuth登入日誌表 - 安全審計和監控';
COMMENT ON VIEW oauth_usage_summary IS 'OAuth使用摘要 - 各提供者的使用統計';
COMMENT ON VIEW suspicious_oauth_activity IS '可疑OAuth活動檢測 - 識別異常登入模式';
COMMENT ON VIEW oauth_provider_stats IS 'OAuth提供者統計 - 成功率和使用量分析';
COMMENT ON FUNCTION cleanup_expired_oauth_states() IS '清理過期的OAuth狀態記錄';
COMMENT ON FUNCTION cleanup_old_oauth_logs() IS '清理舊的OAuth登入日誌';