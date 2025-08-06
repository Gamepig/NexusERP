-- 建立報表相關資料表

-- 報表設定表
CREATE TABLE report_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    report_type VARCHAR(50) NOT NULL, -- 'sales', 'inventory', 'financial'
    parameters JSONB,
    refresh_interval_minutes INTEGER DEFAULT 60,
    is_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 報表快取表
CREATE TABLE report_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_key VARCHAR(255) UNIQUE NOT NULL,
    report_type VARCHAR(50) NOT NULL,
    data JSONB NOT NULL,
    parameters JSONB,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 銷售報表視圖
CREATE OR REPLACE VIEW sales_report_data AS
SELECT 
    so.id as order_id,
    so.order_number,
    so.customer_id,
    c.name as customer_name,
    so.total_amount,
    so.status,
    so.order_date,
    DATE_TRUNC('month', so.order_date) as order_month,
    DATE_TRUNC('quarter', so.order_date) as order_quarter,
    DATE_TRUNC('year', so.order_date) as order_year,
    so.created_at,
    so.updated_at
FROM sales_orders so
LEFT JOIN customers c ON so.customer_id = c.id;

-- 庫存報表視圖
CREATE OR REPLACE VIEW inventory_report_data AS
SELECT 
    p.id as product_id,
    p.name as product_name,
    p.sku,
    pc.name as category_name,
    il.warehouse_id,
    w.name as warehouse_name,
    il.quantity_on_hand,
    il.quantity_reserved,
    il.quantity_available,
    il.reorder_point,
    CASE 
        WHEN il.quantity_available <= il.reorder_point THEN 'low_stock'
        WHEN il.quantity_available = 0 THEN 'out_of_stock'
        ELSE 'normal'
    END as stock_status,
    p.selling_price as unit_price,
    il.quantity_available * p.selling_price as inventory_value,
    il.updated_at as last_updated
FROM inventory_levels il
JOIN products p ON il.product_id = p.id
LEFT JOIN product_categories pc ON p.category_id = pc.id
JOIN warehouses w ON il.warehouse_id = w.id
WHERE p.is_active = true;

-- 財務報表視圖 - 應收帳款
CREATE OR REPLACE VIEW ar_report_data AS
SELECT 
    ar.id as ar_id,
    ar.invoice_id,
    inv.invoice_number,
    ar.customer_id,
    c.name as customer_name,
    ar.amount_due as original_amount,
    ar.balance_due as outstanding_amount,
    ar.amount_due - ar.balance_due as paid_amount,
    ar.due_date,
    CASE 
        WHEN ar.balance_due = 0 THEN 'paid'
        WHEN ar.due_date < NOW() THEN 'overdue'
        WHEN ar.due_date <= NOW() + INTERVAL '7 days' THEN 'due_soon'
        ELSE 'current'
    END as status,
    CASE 
        WHEN ar.due_date < NOW() THEN 
            EXTRACT(DAY FROM NOW() - ar.due_date)
        ELSE 0
    END as days_overdue,
    ar.created_at,
    ar.updated_at
FROM accounts_receivable ar
JOIN invoices inv ON ar.invoice_id = inv.id
JOIN customers c ON ar.customer_id = c.id;

-- 財務報表視圖 - 應付帳款
CREATE OR REPLACE VIEW ap_report_data AS
SELECT 
    ap.id as ap_id,
    ap.invoice_id,
    inv.invoice_number,
    inv.supplier_id,
    s.name as supplier_name,
    ap.amount as original_amount,
    ap.outstanding_amount,
    ap.amount - ap.outstanding_amount as paid_amount,
    ap.due_date,
    CASE 
        WHEN ap.outstanding_amount = 0 THEN 'paid'
        WHEN ap.due_date < NOW() THEN 'overdue'
        WHEN ap.due_date <= NOW() + INTERVAL '7 days' THEN 'due_soon'
        ELSE 'current'
    END as status,
    CASE 
        WHEN ap.due_date < NOW() THEN 
            EXTRACT(DAY FROM NOW() - ap.due_date)
        ELSE 0
    END as days_overdue,
    ap.created_at,
    ap.updated_at
FROM accounts_payable ap
JOIN invoices inv ON ap.invoice_id = inv.id
JOIN suppliers s ON inv.supplier_id = s.id;

-- 建立索引以優化報表查詢
CREATE INDEX IF NOT EXISTS idx_report_cache_key ON report_cache(report_key);
CREATE INDEX IF NOT EXISTS idx_report_cache_type_expires ON report_cache(report_type, expires_at);
CREATE INDEX IF NOT EXISTS idx_sales_orders_date_reports ON sales_orders(order_date);
CREATE INDEX IF NOT EXISTS idx_inventory_levels_updated ON inventory_levels(updated_at);
CREATE INDEX IF NOT EXISTS idx_ar_due_date ON accounts_receivable(due_date);
CREATE INDEX IF NOT EXISTS idx_ap_due_date ON accounts_payable(due_date);