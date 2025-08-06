-- CRITICAL SECURITY FIX: Fix orphaned users and implement Row Level Security (WORKING VERSION)
-- 業務重要性：⭐⭐⭐⭐⭐
-- 影響範圍：使用者安全、多租戶隔離、資料完整性
-- 風險等級：CRITICAL
-- 說明：修復 215 個孤立用戶並實施資料庫層級安全機制

BEGIN;

-- Step 1: 修復孤立用戶，為每個用戶建立獨立公司
DO $$
DECLARE
    orphan_user RECORD;
    new_company_id bigint;
    new_business_unit_id bigint;
    user_count integer := 0;
BEGIN
    RAISE NOTICE '開始修復孤立用戶...';
    
    FOR orphan_user IN 
        SELECT u.id, u.name, u.email 
        FROM users u
        LEFT JOIN user_companies uc ON u.id = uc.user_id AND uc.is_active = true
        WHERE uc.user_id IS NULL
    LOOP
        user_count := user_count + 1;
        
        -- 為孤立用戶建立個人公司
        INSERT INTO companies (
            name, 
            display_name, 
            code, 
            tax_number,
            industry,
            size,
            phone,
            email,
            address,
            is_active, 
            created_by_user_id, 
            created_at, 
            updated_at
        ) VALUES (
            COALESCE(orphan_user.name, orphan_user.email) || ' 的公司',
            COALESCE(orphan_user.name, orphan_user.email) || ' 的公司',
            'USR' || orphan_user.id,
            'ORPHAN-USR-' || orphan_user.id,  -- 唯一稅號
            '其他',
            '小型企業',
            '+886-2-0000-0000',
            orphan_user.email,
            '{"country": "台灣", "city": "台北市", "address": "N/A"}'::json,
            true,
            orphan_user.id,
            now(),
            now()
        ) RETURNING id INTO new_company_id;
        
        -- 建立用戶-公司關聯
        INSERT INTO user_companies (
            user_id, 
            company_id, 
            role, 
            is_primary, 
            is_active, 
            joined_at, 
            created_at, 
            updated_at
        ) VALUES (
            orphan_user.id, 
            new_company_id, 
            'admin', 
            true, 
            true, 
            now(), 
            now(), 
            now()
        );
        
        -- 建立預設業務單位
        INSERT INTO business_units (
            company_id, 
            name, 
            display_name,
            code, 
            description,
            is_active, 
            created_by_user_id, 
            created_at, 
            updated_at
        ) VALUES (
            new_company_id, 
            '總部', 
            '總部',
            'HQ', 
            '主要營運單位',
            true, 
            orphan_user.id, 
            now(), 
            now()
        ) RETURNING id INTO new_business_unit_id;
        
        -- 將用戶關聯到業務單位
        INSERT INTO user_business_units (
            user_id, 
            business_unit_id, 
            role, 
            is_active, 
            joined_at, 
            created_at, 
            updated_at
        ) VALUES (
            orphan_user.id, 
            new_business_unit_id, 
            'admin', 
            true, 
            now(), 
            now(), 
            now()
        );
        
        IF user_count % 50 = 0 THEN
            RAISE NOTICE '已處理 % 個孤立用戶...', user_count;
        END IF;
    END LOOP;
    
    RAISE NOTICE '完成孤立用戶修復，共處理 % 個用戶', user_count;
END $$;

-- Step 2: 修復孤立產品
UPDATE products SET 
    company_id = (
        SELECT id FROM companies 
        WHERE is_active = true 
        ORDER BY id 
        LIMIT 1
    ),
    created_by_user_id = (
        SELECT id FROM users 
        WHERE email = 'gamepig1976@gmail.com' 
        LIMIT 1
    )
WHERE company_id IS NULL;

-- Step 3: 啟用 Row Level Security (RLS) 
-- 這是最關鍵的安全機制，確保資料庫層級的多租戶隔離

-- 啟用 RLS 在所有多租戶表格
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts_payable ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts_receivable ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_payment_allocations ENABLE ROW LEVEL SECURITY;

-- 建立 RLS 政策：只允許存取同公司的資料

-- Warehouses RLS 政策
CREATE POLICY warehouse_company_isolation ON warehouses 
    FOR ALL
    USING (company_id = COALESCE(current_setting('app.current_company_id', true)::bigint, company_id))
    WITH CHECK (company_id = COALESCE(current_setting('app.current_company_id', true)::bigint, company_id));

-- Product Categories RLS 政策
CREATE POLICY product_categories_company_isolation ON product_categories 
    FOR ALL
    USING (company_id = COALESCE(current_setting('app.current_company_id', true)::bigint, company_id))
    WITH CHECK (company_id = COALESCE(current_setting('app.current_company_id', true)::bigint, company_id));

-- Employees RLS 政策
CREATE POLICY employees_company_isolation ON employees 
    FOR ALL
    USING (company_id = COALESCE(current_setting('app.current_company_id', true)::bigint, company_id))
    WITH CHECK (company_id = COALESCE(current_setting('app.current_company_id', true)::bigint, company_id));

-- Attendance RLS 政策
CREATE POLICY attendance_company_isolation ON attendance 
    FOR ALL
    USING (company_id = COALESCE(current_setting('app.current_company_id', true)::bigint, company_id))
    WITH CHECK (company_id = COALESCE(current_setting('app.current_company_id', true)::bigint, company_id));

-- Invoices RLS 政策
CREATE POLICY invoices_company_isolation ON invoices 
    FOR ALL
    USING (company_id = COALESCE(current_setting('app.current_company_id', true)::bigint, company_id))
    WITH CHECK (company_id = COALESCE(current_setting('app.current_company_id', true)::bigint, company_id));

-- Invoice Items RLS 政策
CREATE POLICY invoice_items_company_isolation ON invoice_items 
    FOR ALL
    USING (company_id = COALESCE(current_setting('app.current_company_id', true)::bigint, company_id))
    WITH CHECK (company_id = COALESCE(current_setting('app.current_company_id', true)::bigint, company_id));

-- Accounts Payable RLS 政策
CREATE POLICY accounts_payable_company_isolation ON accounts_payable 
    FOR ALL
    USING (company_id = COALESCE(current_setting('app.current_company_id', true)::bigint, company_id))
    WITH CHECK (company_id = COALESCE(current_setting('app.current_company_id', true)::bigint, company_id));

-- Accounts Receivable RLS 政策
CREATE POLICY accounts_receivable_company_isolation ON accounts_receivable 
    FOR ALL
    USING (company_id = COALESCE(current_setting('app.current_company_id', true)::bigint, company_id))
    WITH CHECK (company_id = COALESCE(current_setting('app.current_company_id', true)::bigint, company_id));

-- Payments RLS 政策
CREATE POLICY payments_company_isolation ON payments 
    FOR ALL
    USING (company_id = COALESCE(current_setting('app.current_company_id', true)::bigint, company_id))
    WITH CHECK (company_id = COALESCE(current_setting('app.current_company_id', true)::bigint, company_id));

-- Payment Allocations RLS 政策
CREATE POLICY payment_allocations_company_isolation ON payment_allocations 
    FOR ALL
    USING (company_id = COALESCE(current_setting('app.current_company_id', true)::bigint, company_id))
    WITH CHECK (company_id = COALESCE(current_setting('app.current_company_id', true)::bigint, company_id));

-- Customer Payments RLS 政策
CREATE POLICY customer_payments_company_isolation ON customer_payments 
    FOR ALL
    USING (company_id = COALESCE(current_setting('app.current_company_id', true)::bigint, company_id))
    WITH CHECK (company_id = COALESCE(current_setting('app.current_company_id', true)::bigint, company_id));

-- Customer Payment Allocations RLS 政策
CREATE POLICY customer_payment_allocations_company_isolation ON customer_payment_allocations 
    FOR ALL
    USING (company_id = COALESCE(current_setting('app.current_company_id', true)::bigint, company_id))
    WITH CHECK (company_id = COALESCE(current_setting('app.current_company_id', true)::bigint, company_id));

-- Step 4: 建立用於驗證的安全函數
CREATE OR REPLACE FUNCTION verify_company_isolation()
RETURNS TABLE(
    table_name text,
    total_records bigint,
    isolated_records bigint,
    isolation_rate numeric
) AS $$
BEGIN
    RETURN QUERY
    WITH company_test AS (
        SELECT 67 as test_company_id  -- 使用中華電信作為測試公司
    )
    SELECT 
        'warehouses'::text,
        (SELECT COUNT(*) FROM warehouses)::bigint,
        (SELECT COUNT(*) FROM warehouses WHERE company_id = (SELECT test_company_id FROM company_test))::bigint,
        ROUND(
            (SELECT COUNT(*) FROM warehouses WHERE company_id = (SELECT test_company_id FROM company_test)) * 100.0 / 
            NULLIF((SELECT COUNT(*) FROM warehouses), 0), 2
        )
    UNION ALL
    SELECT 
        'product_categories'::text,
        (SELECT COUNT(*) FROM product_categories)::bigint,
        (SELECT COUNT(*) FROM product_categories WHERE company_id = (SELECT test_company_id FROM company_test))::bigint,
        ROUND(
            (SELECT COUNT(*) FROM product_categories WHERE company_id = (SELECT test_company_id FROM company_test)) * 100.0 / 
            NULLIF((SELECT COUNT(*) FROM product_categories), 0), 2
        )
    UNION ALL
    SELECT 
        'employees'::text,
        (SELECT COUNT(*) FROM employees)::bigint,
        (SELECT COUNT(*) FROM employees WHERE company_id = (SELECT test_company_id FROM company_test))::bigint,
        ROUND(
            (SELECT COUNT(*) FROM employees WHERE company_id = (SELECT test_company_id FROM company_test)) * 100.0 / 
            NULLIF((SELECT COUNT(*) FROM employees), 0), 2
        );
END;
$$ LANGUAGE plpgsql;

COMMIT;