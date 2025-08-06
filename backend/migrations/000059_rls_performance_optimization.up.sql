-- RLS Performance Optimization Indexes
-- Migration: 000059_rls_performance_optimization.up.sql

-- **核心業務表RLS效能優化索引**

-- 產品表 RLS 優化索引
CREATE INDEX IF NOT EXISTS idx_products_rls_company_status 
ON products (company_id, status, id) 
WHERE company_id > 0 AND status IN ('active', 'draft', 'discontinued');

CREATE INDEX IF NOT EXISTS idx_products_rls_company_sku 
ON products (company_id, sku) 
WHERE company_id > 0 AND sku IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_products_rls_company_category 
ON products (company_id, category_id, status) 
WHERE company_id > 0 AND status = 'active';

-- 客戶表 RLS 優化索引
CREATE INDEX IF NOT EXISTS idx_customers_rls_company_status 
ON customers (company_id, status, id) 
WHERE company_id > 0 AND status = 'active';

CREATE INDEX IF NOT EXISTS idx_customers_rls_company_email 
ON customers (company_id, email) 
WHERE company_id > 0 AND email IS NOT NULL;

-- 銷售訂單表 RLS 優化索引
CREATE INDEX IF NOT EXISTS idx_sales_orders_rls_company_status 
ON sales_orders (company_id, status, order_date DESC) 
WHERE company_id > 0 AND status IN ('pending', 'processing', 'completed', 'shipped');

CREATE INDEX IF NOT EXISTS idx_sales_orders_rls_company_customer 
ON sales_orders (company_id, customer_id, order_date DESC) 
WHERE company_id > 0;

CREATE INDEX IF NOT EXISTS idx_sales_orders_rls_company_total 
ON sales_orders (company_id, total_amount DESC, order_date DESC) 
WHERE company_id > 0 AND status != 'cancelled';

-- 採購訂單表 RLS 優化索引
CREATE INDEX IF NOT EXISTS idx_purchase_orders_rls_company_status 
ON purchase_orders (company_id, status, order_date DESC) 
WHERE company_id > 0 AND status IN ('pending', 'approved', 'received');

CREATE INDEX IF NOT EXISTS idx_purchase_orders_rls_company_supplier 
ON purchase_orders (company_id, supplier_id, order_date DESC) 
WHERE company_id > 0;

-- 庫存相關表 RLS 優化索引
CREATE INDEX IF NOT EXISTS idx_inventory_levels_rls_company_product 
ON inventory_levels (company_id, product_id, warehouse_id) 
WHERE company_id > 0;

CREATE INDEX IF NOT EXISTS idx_inventory_levels_rls_company_low_stock 
ON inventory_levels (company_id, quantity, reorder_level) 
WHERE company_id > 0 AND quantity <= reorder_level;

-- 供應商表 RLS 優化索引
CREATE INDEX IF NOT EXISTS idx_suppliers_rls_company_status 
ON suppliers (company_id, status, name) 
WHERE company_id > 0 AND status = 'active';

-- 倉庫表 RLS 優化索引
CREATE INDEX IF NOT EXISTS idx_warehouses_rls_company_active 
ON warehouses (company_id, name) 
WHERE company_id > 0 AND deleted_at IS NULL;

-- **用戶和公司關聯優化**

-- 用戶狀態索引（用於用戶驗證）
CREATE INDEX IF NOT EXISTS idx_users_status_active 
ON users (id, status) 
WHERE status = 'active' AND deleted_at IS NULL;

-- user_companies表關聯索引（RLS驗證核心）
CREATE INDEX IF NOT EXISTS idx_user_companies_active_primary 
ON user_companies (user_id, company_id, is_active) 
WHERE is_active = TRUE;

-- 公司狀態索引
CREATE INDEX IF NOT EXISTS idx_companies_rls_active 
ON companies (id, status) 
WHERE status = 'active' AND deleted_at IS NULL;

-- **報表和分析優化索引**

-- 銷售報表查詢優化
CREATE INDEX IF NOT EXISTS idx_sales_orders_rls_report_daily 
ON sales_orders (company_id, order_date, status, total_amount) 
WHERE company_id > 0 AND status IN ('completed', 'shipped');

CREATE INDEX IF NOT EXISTS idx_sales_orders_rls_report_monthly 
ON sales_orders (company_id, date_trunc('month', order_date), total_amount) 
WHERE company_id > 0 AND status IN ('completed', 'shipped');

-- 庫存報表查詢優化
CREATE INDEX IF NOT EXISTS idx_inventory_levels_rls_report_value 
ON inventory_levels (company_id, (quantity * cost_per_unit)) 
WHERE company_id > 0 AND quantity > 0;

-- 客戶分析優化
CREATE INDEX IF NOT EXISTS idx_sales_orders_rls_customer_analysis 
ON sales_orders (company_id, customer_id, order_date, total_amount) 
WHERE company_id > 0 AND status IN ('completed', 'shipped');

-- **審計和日誌優化**

-- 審計日誌 RLS 索引
CREATE INDEX IF NOT EXISTS idx_audit_logs_rls_company_time 
ON audit_logs (company_id, created_at DESC) 
WHERE company_id > 0;

CREATE INDEX IF NOT EXISTS idx_audit_logs_rls_company_table 
ON audit_logs (company_id, table_name, operation, created_at DESC) 
WHERE company_id > 0;

-- **複合查詢優化索引**

-- 產品-庫存聯合查詢
CREATE INDEX IF NOT EXISTS idx_products_inventory_rls_joint 
ON products (company_id, id, status, track_inventory) 
WHERE company_id > 0 AND status = 'active' AND track_inventory = true;

-- 訂單-項目聯合查詢
CREATE INDEX IF NOT EXISTS idx_sales_order_items_rls_company 
ON sales_order_items (company_id, sales_order_id, product_id) 
WHERE company_id > 0;

CREATE INDEX IF NOT EXISTS idx_purchase_order_items_rls_company 
ON purchase_order_items (company_id, purchase_order_id, product_id) 
WHERE company_id > 0;

-- **統計信息更新**
-- 確保 PostgreSQL 優化器有最新的統計信息
ANALYZE products;
ANALYZE customers;
ANALYZE sales_orders;
ANALYZE purchase_orders;
ANALYZE inventory_levels;
ANALYZE suppliers;
ANALYZE warehouses;
ANALYZE users;
ANALYZE companies;

-- **索引使用建議函數**
CREATE OR REPLACE FUNCTION get_rls_index_usage_stats()
RETURNS TABLE(
    index_name TEXT,
    table_name TEXT,
    size_mb NUMERIC,
    scans BIGINT,
    tuples_read BIGINT,
    tuples_fetched BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        i.indexrelname::TEXT as index_name,
        t.relname::TEXT as table_name,
        ROUND((pg_relation_size(i.indexrelid) / 1024 / 1024)::NUMERIC, 2) as size_mb,
        s.idx_scan as scans,
        s.idx_tup_read as tuples_read,
        s.idx_tup_fetch as tuples_fetched
    FROM pg_stat_user_indexes s
    JOIN pg_class i ON i.oid = s.indexrelid
    JOIN pg_class t ON t.oid = s.relid
    WHERE i.indexrelname LIKE '%rls%'
    ORDER BY s.idx_scan DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- **效能監控視圖**
CREATE OR REPLACE VIEW rls_performance_monitor AS
SELECT 
    schemaname,
    tablename,
    seq_scan,
    seq_tup_read,
    idx_scan,
    idx_tup_fetch,
    n_tup_ins,
    n_tup_upd,
    n_tup_del,
    ROUND((idx_tup_fetch::NUMERIC / NULLIF(idx_scan, 0))::NUMERIC, 2) as avg_tuples_per_scan
FROM pg_stat_user_tables
WHERE tablename IN (
    'products', 'customers', 'sales_orders', 'purchase_orders',
    'inventory_levels', 'suppliers', 'warehouses', 'users', 'companies'
)
ORDER BY idx_scan DESC;

COMMENT ON VIEW rls_performance_monitor IS 'Monitor RLS performance across core business tables';
COMMENT ON FUNCTION get_rls_index_usage_stats() IS 'Get usage statistics for RLS-related indexes';