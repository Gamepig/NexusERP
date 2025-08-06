-- 創建審計日誌表
CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource VARCHAR(100) NOT NULL,
    resource_id VARCHAR(255),
    ip_address VARCHAR(45) NOT NULL,
    user_agent TEXT,
    metadata JSONB,
    success BOOLEAN NOT NULL DEFAULT false,
    error_message TEXT,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 創建索引提升查詢效能
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX idx_audit_logs_ip_address ON audit_logs(ip_address);
CREATE INDEX idx_audit_logs_success ON audit_logs(success);

-- 組合索引用於常見查詢
CREATE INDEX idx_audit_logs_login_attempts ON audit_logs(action, ip_address, success, timestamp) 
WHERE action = 'login';

-- 為 JSONB metadata 創建 GIN 索引
CREATE INDEX idx_audit_logs_metadata ON audit_logs USING gin(metadata);

-- 添加表註解
COMMENT ON TABLE audit_logs IS '系統審計日誌表，記錄所有重要的安全事件和用戶操作';
COMMENT ON COLUMN audit_logs.user_id IS '執行操作的用戶ID，可為空（如匿名登入嘗試）';
COMMENT ON COLUMN audit_logs.action IS '執行的動作類型（如 login, logout, create, update, delete）';
COMMENT ON COLUMN audit_logs.resource IS '操作的資源類型（如 user, product, order）';
COMMENT ON COLUMN audit_logs.resource_id IS '具體資源的ID';
COMMENT ON COLUMN audit_logs.ip_address IS '客戶端IP地址';
COMMENT ON COLUMN audit_logs.user_agent IS '客戶端瀏覽器信息';
COMMENT ON COLUMN audit_logs.metadata IS '額外的事件元數據（JSON格式）';
COMMENT ON COLUMN audit_logs.success IS '操作是否成功';
COMMENT ON COLUMN audit_logs.error_message IS '如果操作失敗，記錄錯誤信息';