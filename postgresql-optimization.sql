-- PostgreSQL 多租戶效能優化配置
-- 針對 NexusERP 多租戶架構的 PostgreSQL 調優設定
-- 
-- 使用方式：
-- 1. 以 PostgreSQL 超級用戶身份執行
-- 2. 執行後重啟 PostgreSQL 服務
-- 3. 透過 SHOW 指令驗證設定是否生效

-- ============================================================================
-- 1. 連線與記憶體設定
-- ============================================================================

-- 連線數設定（根據應用程式需求調整）
-- ALTER SYSTEM SET max_connections = '200';

-- 共享緩衝區（建議設定為系統記憶體的 25%）
-- 對於 8GB 系統，設定為 2GB
-- ALTER SYSTEM SET shared_buffers = '2GB';

-- 工作記憶體（每個查詢可使用的記憶體）
-- ALTER SYSTEM SET work_mem = '16MB';

-- 維護工作記憶體（用於索引建立、VACUUM 等）
-- ALTER SYSTEM SET maintenance_work_mem = '256MB';

-- ============================================================================
-- 2. RLS 效能優化設定
-- ============================================================================

-- 啟用並行查詢（提升 RLS 策略檢查效能）
ALTER SYSTEM SET max_parallel_workers_per_gather = '4';
ALTER SYSTEM SET max_parallel_workers = '8';
ALTER SYSTEM SET parallel_tuple_cost = '0.1';
ALTER SYSTEM SET parallel_setup_cost = '1000';

-- 啟用 JIT 編譯（PostgreSQL 11+）
ALTER SYSTEM SET jit = 'on';
ALTER SYSTEM SET jit_above_cost = '100000';
ALTER SYSTEM SET jit_inline_above_cost = '500000';

-- ============================================================================
-- 3. 查詢規劃器優化
-- ============================================================================

-- 隨機頁面成本（SSD 環境建議降低）
ALTER SYSTEM SET random_page_cost = '1.1';

-- 有效快取大小（作業系統 + PostgreSQL 快取）
ALTER SYSTEM SET effective_cache_size = '6GB';

-- 統計資料目標（影響查詢計劃品質）
ALTER SYSTEM SET default_statistics_target = '100';

-- ============================================================================
-- 4. 檢查點與 WAL 設定
-- ============================================================================

-- WAL 緩衝區
ALTER SYSTEM SET wal_buffers = '16MB';

-- 檢查點設定
ALTER SYSTEM SET checkpoint_completion_target = '0.9';
ALTER SYSTEM SET checkpoint_timeout = '10min';
ALTER SYSTEM SET max_wal_size = '2GB';
ALTER SYSTEM SET min_wal_size = '512MB';

-- ============================================================================
-- 5. 自動清理（VACUUM）優化
-- ============================================================================

-- 啟用自動清理
ALTER SYSTEM SET autovacuum = 'on';
ALTER SYSTEM SET autovacuum_max_workers = '3';
ALTER SYSTEM SET autovacuum_work_mem = '256MB';

-- 自動清理觸發條件（適合多租戶環境）
ALTER SYSTEM SET autovacuum_vacuum_threshold = '50';
ALTER SYSTEM SET autovacuum_vacuum_scale_factor = '0.1';
ALTER SYSTEM SET autovacuum_analyze_threshold = '50';
ALTER SYSTEM SET autovacuum_analyze_scale_factor = '0.05';

-- ============================================================================
-- 6. 日誌與監控設定
-- ============================================================================

-- 啟用慢查詢日誌
ALTER SYSTEM SET log_min_duration_statement = '1000'; -- 記錄超過 1 秒的查詢
ALTER SYSTEM SET log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h ';
ALTER SYSTEM SET log_checkpoints = 'on';
ALTER SYSTEM SET log_connections = 'on';
ALTER SYSTEM SET log_disconnections = 'on';
ALTER SYSTEM SET log_lock_waits = 'on';

-- ============================================================================
-- 7. 多租戶專用設定
-- ============================================================================

-- 啟用行級安全性相關設定
ALTER SYSTEM SET row_security = 'on';

-- 加強安全性設定
ALTER SYSTEM SET ssl = 'on';
ALTER SYSTEM SET password_encryption = 'scram-sha-256';

-- ============================================================================
-- 8. 應用程式連線池設定建議
-- ============================================================================

/*
Go Backend 連線池建議設定：
```go
db.SetMaxOpenConns(25)                          // 最大連線數
db.SetMaxIdleConns(5)                           // 閒置連線數
db.SetConnMaxLifetime(15 * time.Minute)         // 連線最大存活時間
db.SetConnMaxIdleTime(5 * time.Minute)          // 閒置連線超時
```

Laravel 資料庫連線設定：
```php
'connections' => [
    'pgsql' => [
        'options' => [
            PDO::ATTR_PERSISTENT => false,
            PDO::ATTR_EMULATE_PREPARES => false,
        ],
        'pool' => [
            'max_connections' => 20,
            'min_connections' => 5,
        ]
    ]
]
```
*/

-- ============================================================================
-- 9. 效能監控擴展設定
-- ============================================================================

-- 啟用效能統計擴展
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
ALTER SYSTEM SET pg_stat_statements.max = '10000';
ALTER SYSTEM SET pg_stat_statements.track = 'all';
ALTER SYSTEM SET pg_stat_statements.track_utility = 'on';

-- 啟用查詢計劃統計
ALTER SYSTEM SET compute_query_id = 'on';

-- ============================================================================
-- 10. 多租戶資料庫最佳實踐設定
-- ============================================================================

-- 建立專用的資料庫角色與權限結構
DO $$ 
BEGIN
    -- 建立租戶管理員角色
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'tenant_admin') THEN
        CREATE ROLE tenant_admin;
    END IF;
    
    -- 建立應用程式使用者角色
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'app_user') THEN
        CREATE ROLE app_user;
    END IF;
    
    -- 建立唯讀角色
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'app_readonly') THEN
        CREATE ROLE app_readonly;
    END IF;
END $$;

-- 設定角色權限
GRANT CONNECT ON DATABASE nexus_erp TO tenant_admin, app_user, app_readonly;
GRANT USAGE ON SCHEMA public TO tenant_admin, app_user, app_readonly;

-- 設定表格權限
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO tenant_admin;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO app_user;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO app_readonly;

-- 設定序列權限
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO tenant_admin, app_user;

-- ============================================================================
-- 11. 安全強化設定
-- ============================================================================

-- 設定連線安全性
ALTER SYSTEM SET listen_addresses = 'localhost';  -- 只允許本地連線
-- ALTER SYSTEM SET port = '5432';                 -- 預設端口（可修改以增加安全性）

-- 設定認證方式
-- 編輯 pg_hba.conf：
-- local   nexus_erp    nexus_app                    scram-sha-256
-- host    nexus_erp    nexus_app    127.0.0.1/32    scram-sha-256

-- ============================================================================
-- 12. 應用設定載入與驗證
-- ============================================================================

-- 載入設定（需要重啟 PostgreSQL）
SELECT pg_reload_conf();

-- 驗證關鍵設定
SELECT name, setting, unit, source 
FROM pg_settings 
WHERE name IN (
    'shared_buffers',
    'work_mem', 
    'maintenance_work_mem',
    'max_connections',
    'effective_cache_size',
    'random_page_cost',
    'row_security'
) 
ORDER BY name;

-- ============================================================================
-- 13. 多租戶監控查詢
-- ============================================================================

-- 監控各租戶的資料量
CREATE OR REPLACE VIEW v_tenant_data_usage AS 
SELECT 
    c.id as company_id,
    c.name as company_name,
    (SELECT COUNT(*) FROM products p WHERE p.company_id = c.id) as product_count,
    (SELECT COUNT(*) FROM customers cu WHERE cu.company_id = c.id) as customer_count,
    (SELECT COUNT(*) FROM sales_orders so WHERE so.company_id = c.id) as order_count,
    pg_size_pretty(
        (SELECT SUM(pg_total_relation_size(c2.oid))
         FROM pg_class c2 
         WHERE c2.relname IN (
             SELECT tablename FROM pg_tables 
             WHERE schemaname = 'public' 
             AND tablename NOT LIKE 'pg_%'
         ))
    ) as estimated_size
FROM companies c
ORDER BY c.created_at DESC;

-- 監控 RLS 策略效能
CREATE OR REPLACE VIEW v_rls_performance AS
SELECT 
    schemaname,
    tablename,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes,
    seq_scan,
    seq_tup_read,
    idx_scan,
    idx_tup_fetch,
    CASE 
        WHEN seq_scan + idx_scan > 0 
        THEN round(100.0 * idx_scan / (seq_scan + idx_scan), 2) 
        ELSE 0 
    END as index_usage_percent
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY seq_scan DESC;

-- ============================================================================
-- 注意事項
-- ============================================================================

/*
1. 執行此腳本需要 PostgreSQL 超級用戶權限
2. 某些設定需要重啟 PostgreSQL 服務才能生效
3. 記憶體相關設定需要根據實際系統資源調整
4. 建議在測試環境先驗證效果
5. 定期監控系統效能並根據實際使用情況調整
6. 備份原始設定檔案，以便回滾

重啟 PostgreSQL 指令（取決於作業系統）：
- macOS: brew services restart postgresql
- Ubuntu: sudo systemctl restart postgresql
- CentOS: sudo systemctl restart postgresql-13

驗證設定指令：
SELECT name, setting, source FROM pg_settings WHERE source = 'configuration file';
*/