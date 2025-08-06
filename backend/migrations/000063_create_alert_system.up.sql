-- Create Alert System Tables
-- Migration: 000063_create_alert_system.up.sql

-- **告警記錄表**
CREATE TABLE IF NOT EXISTS alerts (
    id BIGSERIAL PRIMARY KEY,
    type VARCHAR(50) NOT NULL CHECK (type IN ('security_breach', 'performance', 'system_health', 'business_metrics', 'data_integrity', 'resource_exhaustion')),
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('info', 'warning', 'error', 'critical')),
    title VARCHAR(500) NOT NULL,
    message TEXT NOT NULL,
    source VARCHAR(255) NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    is_resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by BIGINT,
    resolution TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- 外鍵約束 (可選的resolved_by)
    CONSTRAINT fk_alerts_resolved_by 
        FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL
);

-- **告警規則表**
CREATE TABLE IF NOT EXISTS alert_rules (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('security_breach', 'performance', 'system_health', 'business_metrics', 'data_integrity', 'resource_exhaustion')),
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('info', 'warning', 'error', 'critical')),
    condition TEXT NOT NULL,                    -- SQL條件或表達式
    threshold NUMERIC(15,2) NOT NULL,
    time_window_minutes INTEGER NOT NULL DEFAULT 5,
    is_enabled BOOLEAN DEFAULT TRUE,
    channels JSONB DEFAULT '[]'::jsonb,         -- 通知通道JSON數組
    cooldown_minutes INTEGER DEFAULT 15,       -- 冷卻期（分鐘）
    last_triggered TIMESTAMP WITH TIME ZONE,
    trigger_count BIGINT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- **告警通知記錄表**
CREATE TABLE IF NOT EXISTS alert_notifications (
    id BIGSERIAL PRIMARY KEY,
    alert_id BIGINT NOT NULL,
    channel VARCHAR(50) NOT NULL CHECK (channel IN ('email', 'slack', 'webhook', 'database', 'sms')),
    status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'sent', 'failed', 'retry')) DEFAULT 'pending',
    recipient TEXT,                             -- 接收者信息
    error_message TEXT,                         -- 失敗時的錯誤信息
    retry_count INTEGER DEFAULT 0,
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- 外鍵約束
    CONSTRAINT fk_alert_notifications_alert_id 
        FOREIGN KEY (alert_id) REFERENCES alerts(id) ON DELETE CASCADE
);

-- **告警統計表** (用於快速查詢統計數據)
CREATE TABLE IF NOT EXISTS alert_statistics (
    id BIGSERIAL PRIMARY KEY,
    date DATE NOT NULL,
    alert_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    total_count BIGINT DEFAULT 0,
    resolved_count BIGINT DEFAULT 0,
    avg_resolution_time_minutes NUMERIC(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- 唯一約束：每天每種類型每個嚴重程度只有一條記錄
    CONSTRAINT unique_daily_stats UNIQUE (date, alert_type, severity)
);

-- **索引優化**

-- 告警記錄索引
CREATE INDEX IF NOT EXISTS idx_alerts_type_severity 
ON alerts (type, severity, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_alerts_severity_unresolved 
ON alerts (severity, created_at DESC) 
WHERE is_resolved = FALSE;

CREATE INDEX IF NOT EXISTS idx_alerts_created_at 
ON alerts (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_alerts_resolved 
ON alerts (is_resolved, resolved_at);

CREATE INDEX IF NOT EXISTS idx_alerts_source 
ON alerts (source, created_at DESC);

-- JSONB metadata索引
CREATE INDEX IF NOT EXISTS idx_alerts_metadata_gin 
ON alerts USING GIN (metadata);

-- 告警規則索引
CREATE INDEX IF NOT EXISTS idx_alert_rules_enabled 
ON alert_rules (is_enabled, type, severity) 
WHERE is_enabled = TRUE;

CREATE INDEX IF NOT EXISTS idx_alert_rules_last_triggered 
ON alert_rules (last_triggered) 
WHERE is_enabled = TRUE;

-- 通知記錄索引
CREATE INDEX IF NOT EXISTS idx_alert_notifications_alert_id 
ON alert_notifications (alert_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_alert_notifications_status 
ON alert_notifications (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_alert_notifications_channel 
ON alert_notifications (channel, status, created_at DESC);

-- 統計表索引
CREATE INDEX IF NOT EXISTS idx_alert_statistics_date_type 
ON alert_statistics (date DESC, alert_type, severity);

CREATE INDEX IF NOT EXISTS idx_alert_statistics_summary 
ON alert_statistics (date DESC, total_count DESC);

-- **觸發器設定**

-- 更新告警updated_at欄位
CREATE OR REPLACE FUNCTION update_alerts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_alerts_updated_at
    BEFORE UPDATE ON alerts
    FOR EACH ROW
    EXECUTE FUNCTION update_alerts_updated_at();

-- 更新告警規則updated_at欄位
CREATE OR REPLACE FUNCTION update_alert_rules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_alert_rules_updated_at
    BEFORE UPDATE ON alert_rules
    FOR EACH ROW
    EXECUTE FUNCTION update_alert_rules_updated_at();

-- 更新統計表updated_at欄位
CREATE OR REPLACE FUNCTION update_alert_statistics_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_alert_statistics_updated_at
    BEFORE UPDATE ON alert_statistics
    FOR EACH ROW
    EXECUTE FUNCTION update_alert_statistics_updated_at();

-- **自動統計更新觸發器**
CREATE OR REPLACE FUNCTION update_alert_statistics()
RETURNS TRIGGER AS $$
DECLARE
    stat_date DATE;
    alert_type TEXT;
    alert_severity TEXT;
BEGIN
    -- 新增告警時更新統計
    IF TG_OP = 'INSERT' THEN
        stat_date := NEW.created_at::DATE;
        alert_type := NEW.type;
        alert_severity := NEW.severity;
        
        INSERT INTO alert_statistics (date, alert_type, severity, total_count)
        VALUES (stat_date, alert_type, alert_severity, 1)
        ON CONFLICT (date, alert_type, severity)
        DO UPDATE SET 
            total_count = alert_statistics.total_count + 1,
            updated_at = NOW();
            
    -- 告警解決時更新統計
    ELSIF TG_OP = 'UPDATE' AND NEW.is_resolved = TRUE AND OLD.is_resolved = FALSE THEN
        stat_date := NEW.created_at::DATE;
        alert_type := NEW.type;
        alert_severity := NEW.severity;
        
        UPDATE alert_statistics 
        SET 
            resolved_count = resolved_count + 1,
            avg_resolution_time_minutes = (
                CASE 
                    WHEN resolved_count = 0 THEN EXTRACT(EPOCH FROM (NEW.resolved_at - NEW.created_at)) / 60
                    ELSE (
                        (avg_resolution_time_minutes * resolved_count + 
                         EXTRACT(EPOCH FROM (NEW.resolved_at - NEW.created_at)) / 60) / 
                        (resolved_count + 1)
                    )
                END
            ),
            updated_at = NOW()
        WHERE date = stat_date 
            AND alert_type = NEW.type 
            AND severity = NEW.severity;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_alert_statistics
    AFTER INSERT OR UPDATE ON alerts
    FOR EACH ROW
    EXECUTE FUNCTION update_alert_statistics();

-- **清理和維護函數**

-- 清理舊的告警記錄 (保留90天)
CREATE OR REPLACE FUNCTION cleanup_old_alerts()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM alerts 
    WHERE created_at < NOW() - INTERVAL '90 days'
    AND is_resolved = TRUE
    AND severity NOT IN ('critical', 'error'); -- 保留重要告警更長時間
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RAISE INFO 'ALERT_CLEANUP: deleted % old resolved alerts at %', deleted_count, NOW();
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 清理舊的通知記錄 (保留30天)
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM alert_notifications 
    WHERE created_at < NOW() - INTERVAL '30 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RAISE INFO 'NOTIFICATION_CLEANUP: deleted % old notifications at %', deleted_count, NOW();
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- **監控視圖**

-- 告警儀表板視圖
CREATE OR REPLACE VIEW alert_dashboard AS
SELECT 
    COUNT(*) as total_alerts,
    COUNT(CASE WHEN is_resolved = FALSE THEN 1 END) as unresolved_alerts,
    COUNT(CASE WHEN severity = 'critical' AND is_resolved = FALSE THEN 1 END) as critical_unresolved,
    COUNT(CASE WHEN severity = 'error' AND is_resolved = FALSE THEN 1 END) as error_unresolved,
    COUNT(CASE WHEN created_at >= NOW() - INTERVAL '24 hours' THEN 1 END) as alerts_last_24h,
    COUNT(CASE WHEN created_at >= NOW() - INTERVAL '1 hour' THEN 1 END) as alerts_last_hour,
    MAX(created_at) as last_alert_time,
    AVG(CASE 
        WHEN is_resolved = TRUE AND resolved_at IS NOT NULL 
        THEN EXTRACT(EPOCH FROM (resolved_at - created_at)) / 60 
    END)::NUMERIC(10,2) as avg_resolution_time_minutes
FROM alerts;

-- 告警趨勢視圖
CREATE OR REPLACE VIEW alert_trends AS
SELECT 
    date_trunc('hour', created_at) as hour,
    type,
    severity,
    COUNT(*) as alert_count,
    COUNT(CASE WHEN is_resolved = TRUE THEN 1 END) as resolved_count
FROM alerts
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY date_trunc('hour', created_at), type, severity
ORDER BY hour DESC;

-- 規則觸發統計視圖
CREATE OR REPLACE VIEW alert_rule_stats AS
SELECT 
    ar.id,
    ar.name,
    ar.type,
    ar.severity,
    ar.trigger_count,
    ar.last_triggered,
    ar.is_enabled,
    COUNT(a.id) as generated_alerts,
    COUNT(CASE WHEN a.is_resolved = TRUE THEN 1 END) as resolved_alerts
FROM alert_rules ar
LEFT JOIN alerts a ON a.metadata->>'rule_id' = ar.id::TEXT
GROUP BY ar.id, ar.name, ar.type, ar.severity, ar.trigger_count, ar.last_triggered, ar.is_enabled
ORDER BY ar.trigger_count DESC;

-- 通知失敗統計視圖
CREATE OR REPLACE VIEW notification_failure_stats AS
SELECT 
    channel,
    COUNT(*) as total_notifications,
    COUNT(CASE WHEN status = 'sent' THEN 1 END) as successful_notifications,
    COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_notifications,
    ROUND(
        (COUNT(CASE WHEN status = 'sent' THEN 1 END)::NUMERIC / NULLIF(COUNT(*), 0)) * 100, 
        2
    ) as success_rate_pct,
    MAX(created_at) as last_notification_time
FROM alert_notifications
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY channel
ORDER BY success_rate_pct DESC;

-- **預設告警規則插入**
INSERT INTO alert_rules (name, type, severity, condition, threshold, time_window_minutes, channels, cooldown_minutes) VALUES
('High Failed Login Rate', 'security_breach', 'warning', 'failed_login_count_5min', 10, 5, '["slack", "database"]'::jsonb, 15),
('Critical Security Threat', 'security_breach', 'critical', 'critical_security_events_1min', 1, 1, '["email", "slack", "sms"]'::jsonb, 5),
('System Performance Degradation', 'performance', 'warning', 'avg_response_time_10min', 500, 10, '["slack"]'::jsonb, 30),
('Database Connection Issues', 'system_health', 'error', 'db_connection_failures_5min', 5, 5, '["email", "slack"]'::jsonb, 10),
('High Error Rate', 'system_health', 'error', 'error_rate_15min', 5, 15, '["slack"]'::jsonb, 20)
ON CONFLICT (name) DO NOTHING;

-- **統計資訊更新**
ANALYZE alerts;
ANALYZE alert_rules;
ANALYZE alert_notifications;
ANALYZE alert_statistics;

-- **註解說明**
COMMENT ON TABLE alerts IS '告警記錄表 - 存儲所有系統告警事件';
COMMENT ON TABLE alert_rules IS '告警規則表 - 定義告警觸發條件和通知設置';
COMMENT ON TABLE alert_notifications IS '告警通知記錄表 - 追蹤通知發送狀態';
COMMENT ON TABLE alert_statistics IS '告警統計表 - 預計算的統計數據用於快速查詢';
COMMENT ON VIEW alert_dashboard IS '告警儀表板 - 實時告警統計概覽';
COMMENT ON VIEW alert_trends IS '告警趨勢 - 按時間分組的告警趨勢分析';
COMMENT ON VIEW alert_rule_stats IS '規則統計 - 告警規則觸發和效果統計';
COMMENT ON VIEW notification_failure_stats IS '通知統計 - 各通道通知成功率統計';
COMMENT ON FUNCTION cleanup_old_alerts() IS '清理舊的已解決告警記錄';
COMMENT ON FUNCTION cleanup_old_notifications() IS '清理舊的通知記錄';