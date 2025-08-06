-- Enable Row Level Security (RLS) for Multi-Tenant Architecture
-- 業務重要性：⭐⭐⭐⭐⭐
-- 影響範圍：全系統多租戶安全隔離
-- 風險等級：CRITICAL

-- 建立應用程式角色
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'nexus_app_user') THEN
        CREATE ROLE nexus_app_user;
    END IF;
END
$$;

GRANT CONNECT ON DATABASE nexus_erp TO nexus_app_user;
GRANT USAGE ON SCHEMA public TO nexus_app_user;

-- 建立 RLS 輔助函數
CREATE OR REPLACE FUNCTION get_current_tenant_id() 
RETURNS integer AS $$
BEGIN
    RETURN COALESCE(current_setting('app.current_tenant_id', true)::integer, 0);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION set_tenant_context(tenant_id integer) 
RETURNS void AS $$
BEGIN
    PERFORM set_config('app.current_tenant_id', tenant_id::text, true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION bypass_rls() 
RETURNS boolean AS $$
BEGIN
    RETURN COALESCE(current_setting('app.bypass_rls', true)::boolean, false);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 為主要業務表啟用 RLS
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;

-- 公司表策略 - 用戶只能看到自己所屬的公司
CREATE POLICY company_access_policy ON companies
    FOR ALL TO nexus_app_user
    USING (
        bypass_rls() OR 
        id IN (
            SELECT uc.company_id 
            FROM user_companies uc 
            WHERE uc.user_id = current_setting('app.current_user_id', true)::integer
            AND uc.is_active = true
        )
    );

-- 用戶表策略 - 用戶只能看到同公司的用戶
CREATE POLICY user_company_isolation ON users
    FOR ALL TO nexus_app_user
    USING (
        bypass_rls() OR 
        id IN (
            SELECT DISTINCT u.id
            FROM users u
            JOIN user_companies uc1 ON u.id = uc1.user_id
            JOIN user_companies uc2 ON uc1.company_id = uc2.company_id
            WHERE uc2.user_id = current_setting('app.current_user_id', true)::integer
            AND uc1.is_active = true
            AND uc2.is_active = true
        )
    );

-- 客戶表策略 - 基於 company_id 隔離
CREATE POLICY customer_tenant_isolation ON customers
    FOR ALL TO nexus_app_user
    USING (
        bypass_rls() OR 
        company_id = get_current_tenant_id()
    );

-- 供應商表策略 - 基於 company_id 隔離
CREATE POLICY supplier_tenant_isolation ON suppliers
    FOR ALL TO nexus_app_user
    USING (
        bypass_rls() OR 
        company_id = get_current_tenant_id()
    );

-- 產品表策略 - 基於 company_id 隔離
CREATE POLICY product_tenant_isolation ON products
    FOR ALL TO nexus_app_user
    USING (
        bypass_rls() OR 
        company_id = get_current_tenant_id()
    );

-- 產品分類表策略 - 基於 company_id 隔離
CREATE POLICY product_category_tenant_isolation ON product_categories
    FOR ALL TO nexus_app_user
    USING (
        bypass_rls() OR 
        company_id = get_current_tenant_id()
    );

-- 倉庫表策略 - 基於 company_id 隔離
CREATE POLICY warehouse_tenant_isolation ON warehouses
    FOR ALL TO nexus_app_user
    USING (
        bypass_rls() OR 
        company_id = get_current_tenant_id()
    );

-- 庫存水準表策略 - 通過倉庫關聯驗證
CREATE POLICY inventory_level_tenant_isolation ON inventory_levels
    FOR ALL TO nexus_app_user
    USING (
        bypass_rls() OR 
        EXISTS (
            SELECT 1 FROM products p 
            WHERE p.id = inventory_levels.product_id 
            AND p.company_id = get_current_tenant_id()
        )
        AND
        EXISTS (
            SELECT 1 FROM warehouses w 
            WHERE w.id = inventory_levels.warehouse_id 
            AND w.company_id = get_current_tenant_id()
        )
    );

-- 庫存交易表策略 - 通過產品關聯驗證
CREATE POLICY inventory_transaction_tenant_isolation ON inventory_transactions
    FOR ALL TO nexus_app_user
    USING (
        bypass_rls() OR 
        EXISTS (
            SELECT 1 FROM products p 
            WHERE p.id = inventory_transactions.product_id 
            AND p.company_id = get_current_tenant_id()
        )
    );

-- 銷售訂單表策略 - 基於 company_id 隔離
CREATE POLICY sales_order_tenant_isolation ON sales_orders
    FOR ALL TO nexus_app_user
    USING (
        bypass_rls() OR 
        company_id = get_current_tenant_id()
    );

-- 銷售訂單項目表策略 - 通過銷售訂單關聯驗證
CREATE POLICY sales_order_item_tenant_isolation ON sales_order_items
    FOR ALL TO nexus_app_user
    USING (
        bypass_rls() OR 
        EXISTS (
            SELECT 1 FROM sales_orders so 
            WHERE so.id = sales_order_items.sales_order_id 
            AND so.company_id = get_current_tenant_id()
        )
    );

-- 採購訂單表策略 - 基於 company_id 隔離
CREATE POLICY purchase_order_tenant_isolation ON purchase_orders
    FOR ALL TO nexus_app_user
    USING (
        bypass_rls() OR 
        company_id = get_current_tenant_id()
    );

-- 採購訂單項目表策略 - 通過採購訂單關聯驗證
CREATE POLICY purchase_order_item_tenant_isolation ON purchase_order_items
    FOR ALL TO nexus_app_user
    USING (
        bypass_rls() OR 
        EXISTS (
            SELECT 1 FROM purchase_orders po 
            WHERE po.id = purchase_order_items.purchase_order_id 
            AND po.company_id = get_current_tenant_id()
        )
    );

-- 員工表策略 - 基於 company_id 隔離
CREATE POLICY employee_tenant_isolation ON employees
    FOR ALL TO nexus_app_user
    USING (
        bypass_rls() OR 
        company_id = get_current_tenant_id()
    );

-- 出勤記錄表策略 - 通過員工關聯驗證
CREATE POLICY attendance_record_tenant_isolation ON attendance_records
    FOR ALL TO nexus_app_user
    USING (
        bypass_rls() OR 
        EXISTS (
            SELECT 1 FROM employees e 
            WHERE e.id = attendance_records.employee_id 
            AND e.company_id = get_current_tenant_id()
        )
    );

-- 為應用程式角色授予基本權限
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO nexus_app_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO nexus_app_user;

-- 建立性能索引
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customers_company_id ON customers(company_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_suppliers_company_id ON suppliers(company_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_company_id ON products(company_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_product_categories_company_id ON product_categories(company_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_warehouses_company_id ON warehouses(company_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sales_orders_company_id ON sales_orders(company_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_purchase_orders_company_id ON purchase_orders(company_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_employees_company_id ON employees(company_id);

-- 建立組合索引以提高查詢性能
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_companies_active_lookup 
    ON user_companies(user_id, company_id, is_active) 
    WHERE is_active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_inventory_levels_company_lookup 
    ON inventory_levels(product_id, warehouse_id);

-- 記錄 RLS 啟用狀態
INSERT INTO schema_migrations (version, dirty) 
VALUES ('001_enable_rls_policies', false) 
ON CONFLICT (version) DO NOTHING;

-- 驗證 RLS 策略
DO $$
DECLARE
    policy_count integer;
BEGIN
    SELECT COUNT(*) INTO policy_count 
    FROM pg_policies 
    WHERE schemaname = 'public';
    
    IF policy_count < 10 THEN
        RAISE EXCEPTION 'RLS policies not properly created. Expected at least 10 policies, found %', policy_count;
    END IF;
    
    RAISE NOTICE '✅ RLS policies successfully created. Total policies: %', policy_count;
END
$$;