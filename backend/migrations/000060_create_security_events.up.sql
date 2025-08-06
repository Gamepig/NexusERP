-- Create Security Events Table for Monitoring
-- Migration: 000060_create_security_events.up.sql

-- 建立安全事件記錄表
CREATE TABLE IF NOT EXISTS security_events (
    id BIGSERIAL PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL,           -- 事件類型: jwt_issue, jwt_validate, rls_context_set, login_attempt, etc.
    user_id BIGINT,                             -- 關聯的用戶ID (可選)
    company_id BIGINT,                          -- 關聯的公司ID (可選)
    ip_address INET NOT NULL,                   -- 客戶端IP地址
    user_agent TEXT,                            -- 客戶端User Agent
    details JSONB DEFAULT '{}'::jsonb,          -- 事件詳細資訊 (JSON格式)
    severity VARCHAR(20) NOT NULL DEFAULT 'info', -- 嚴重程度: info, warning, error, critical
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- 外鍵約束
    CONSTRAINT fk_security_events_user_id 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_security_events_company_id 
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL,
        
    -- 檢查約束
    CONSTRAINT chk_severity CHECK (severity IN ('info', 'warning', 'error', 'critical')),
    CONSTRAINT chk_event_type CHECK (LENGTH(event_type) > 0)
);

-- **索引優化**

-- 基本查詢索引
CREATE INDEX IF NOT EXISTS idx_security_events_created_at 
ON security_events (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_security_events_event_type 
ON security_events (event_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_security_events_severity 
ON security_events (severity, created_at DESC);

-- 用戶和公司關聯索引
CREATE INDEX IF NOT EXISTS idx_security_events_user_id 
ON security_events (user_id, created_at DESC) 
WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_security_events_company_id 
ON security_events (company_id, created_at DESC) 
WHERE company_id IS NOT NULL;

-- IP地址分析索引
CREATE INDEX IF NOT EXISTS idx_security_events_ip_address 
ON security_events (ip_address, created_at DESC);

-- 複合查詢索引
CREATE INDEX IF NOT EXISTS idx_security_events_type_severity 
ON security_events (event_type, severity, created_at DESC);

-- JSONB details 查詢索引 (GIN索引)
CREATE INDEX IF NOT EXISTS idx_security_events_details_gin 
ON security_events USING GIN (details);

-- **RLS (Row Level Security) 設定**

-- 啟用RLS
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;

-- 管理員可以查看所有事件
CREATE POLICY admin_all_security_events ON security_events
    FOR ALL TO public
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = current_setting('auth.user_id', true)::bigint 
            AND users.role = 'admin'
        )
    );

-- 公司用戶只能查看自己公司的事件
CREATE POLICY company_security_events ON security_events
    FOR SELECT TO public
    USING (
        company_id = current_setting('auth.company_id', true)::bigint
        OR company_id IS NULL  -- 系統事件對所有人可見
    );

-- **資料保留政策**

-- 建立自動清理函數 (保留90天的事件記錄)
CREATE OR REPLACE FUNCTION cleanup_old_security_events()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM security_events 
    WHERE created_at < NOW() - INTERVAL '90 days'
    AND severity NOT IN ('critical', 'error'); -- 保留重要事件更長時間
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- 記錄清理操作
    INSERT INTO security_events (event_type, details, severity, ip_address, user_agent)
    VALUES (
        'system_cleanup',
        jsonb_build_object(
            'deleted_events', deleted_count,
            'cleanup_date', NOW(),
            'retention_days', 90
        ),
        'info',
        '127.0.0.1',
        'system_cleanup_job'
    );
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- **監控和統計視圖**

-- 安全事件摘要視圖
CREATE OR REPLACE VIEW security_events_summary AS
SELECT 
    event_type,
    severity,
    COUNT(*) as event_count,
    COUNT(DISTINCT user_id) as affected_users,
    COUNT(DISTINCT company_id) as affected_companies,
    COUNT(DISTINCT ip_address) as unique_ips,
    MIN(created_at) as first_occurrence,
    MAX(created_at) as last_occurrence
FROM security_events
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY event_type, severity
ORDER BY event_count DESC;

-- 可疑活動檢測視圖
CREATE OR REPLACE VIEW suspicious_activity AS
SELECT 
    ip_address,
    user_id,
    company_id,
    COUNT(*) as event_count,
    COUNT(DISTINCT event_type) as event_types,
    STRING_AGG(DISTINCT event_type, ', ') as events,
    MIN(created_at) as first_event,
    MAX(created_at) as last_event
FROM security_events
WHERE created_at >= NOW() - INTERVAL '1 hour'
    AND severity IN ('error', 'critical')
GROUP BY ip_address, user_id, company_id
HAVING COUNT(*) >= 5  -- 1小時內5次以上錯誤事件
ORDER BY event_count DESC;

-- **觸發器設定**

-- 自動檢測異常活動的觸發器函數
CREATE OR REPLACE FUNCTION detect_suspicious_activity()
RETURNS TRIGGER AS $$
BEGIN
    -- 檢測短時間內的大量失敗事件
    IF NEW.severity IN ('error', 'critical') THEN
        -- 檢查同一IP在5分鐘內的錯誤次數
        IF (
            SELECT COUNT(*) 
            FROM security_events 
            WHERE ip_address = NEW.ip_address 
                AND severity IN ('error', 'critical')
                AND created_at >= NOW() - INTERVAL '5 minutes'
        ) >= 3 THEN
            -- 插入可疑活動警告
            INSERT INTO security_events (event_type, ip_address, user_agent, details, severity)
            VALUES (
                'suspicious_activity_detected',
                NEW.ip_address,
                NEW.user_agent,
                jsonb_build_object(
                    'trigger_event_id', NEW.id,
                    'detection_rule', 'multiple_errors_same_ip',
                    'time_window', '5_minutes',
                    'threshold', 3
                ),
                'critical'
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 建立觸發器
CREATE TRIGGER trigger_detect_suspicious_activity
    AFTER INSERT ON security_events
    FOR EACH ROW
    EXECUTE FUNCTION detect_suspicious_activity();

-- **統計資訊更新**
ANALYZE security_events;

-- **註解說明**
COMMENT ON TABLE security_events IS '安全事件記錄表 - 追蹤所有系統安全相關事件';
COMMENT ON COLUMN security_events.event_type IS '事件類型: jwt_issue, jwt_validate, login_attempt, rls_context_set 等';
COMMENT ON COLUMN security_events.details IS 'JSONB格式的事件詳細資訊，支援結構化查詢';
COMMENT ON COLUMN security_events.severity IS '事件嚴重程度: info(資訊), warning(警告), error(錯誤), critical(嚴重)';
COMMENT ON VIEW security_events_summary IS '24小時內安全事件統計摘要';
COMMENT ON VIEW suspicious_activity IS '1小時內可疑活動檢測視圖';
COMMENT ON FUNCTION cleanup_old_security_events() IS '清理90天前的舊事件記錄 (保留重要事件)';
COMMENT ON FUNCTION detect_suspicious_activity() IS '自動檢測異常活動模式的觸發器函數';