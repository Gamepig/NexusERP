-- Add multi-tenant support to accounts payable and related tables
-- 業務重要性：⭐⭐⭐⭐
-- 影響範圍：財務報表、現金流管理、供應商付款
-- 風險等級：MEDIUM

-- 添加多租戶隔離欄位到 invoices 表
ALTER TABLE invoices 
ADD COLUMN company_id bigint,
ADD COLUMN created_by_user_id bigint;

-- 添加多租戶隔離欄位到 invoice_items 表
ALTER TABLE invoice_items 
ADD COLUMN company_id bigint;

-- 添加多租戶隔離欄位到 accounts_payable 表
ALTER TABLE accounts_payable 
ADD COLUMN company_id bigint,
ADD COLUMN created_by_user_id bigint;

-- 添加多租戶隔離欄位到 payments 表
ALTER TABLE payments 
ADD COLUMN company_id bigint;

-- 添加多租戶隔離欄位到 payment_allocations 表
ALTER TABLE payment_allocations 
ADD COLUMN company_id bigint;

-- 添加多租戶隔離欄位到 currencies 表（如果需要公司特定匯率）
ALTER TABLE currencies 
ADD COLUMN company_id bigint,
ADD COLUMN is_global boolean DEFAULT true;

-- 添加外鍵約束到 invoices 表
ALTER TABLE invoices 
ADD CONSTRAINT fk_invoices_company 
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;

ALTER TABLE invoices 
ADD CONSTRAINT fk_invoices_created_by_user_new 
    FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE SET NULL;

-- 添加外鍵約束到 invoice_items 表
ALTER TABLE invoice_items 
ADD CONSTRAINT fk_invoice_items_company 
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;

-- 添加外鍵約束到 accounts_payable 表
ALTER TABLE accounts_payable 
ADD CONSTRAINT fk_accounts_payable_company 
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;

ALTER TABLE accounts_payable 
ADD CONSTRAINT fk_accounts_payable_created_by_user 
    FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE SET NULL;

-- 添加外鍵約束到 payments 表
ALTER TABLE payments 
ADD CONSTRAINT fk_payments_company 
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;

-- 添加外鍵約束到 payment_allocations 表
ALTER TABLE payment_allocations 
ADD CONSTRAINT fk_payment_allocations_company 
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;

-- 添加外鍵約束到 currencies 表
ALTER TABLE currencies 
ADD CONSTRAINT fk_currencies_company 
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;

-- 建立索引 - invoices 表
CREATE INDEX idx_invoices_company ON invoices(company_id);
CREATE INDEX idx_invoices_company_status ON invoices(company_id, status);
CREATE INDEX idx_invoices_company_due_date ON invoices(company_id, due_date);
CREATE INDEX idx_invoices_company_type ON invoices(company_id, invoice_type);

-- 建立索引 - invoice_items 表
CREATE INDEX idx_invoice_items_company ON invoice_items(company_id);

-- 建立索引 - accounts_payable 表
CREATE INDEX idx_accounts_payable_company ON accounts_payable(company_id);
CREATE INDEX idx_accounts_payable_company_status ON accounts_payable(company_id, status);
CREATE INDEX idx_accounts_payable_company_due_date ON accounts_payable(company_id, due_date);
CREATE INDEX idx_accounts_payable_company_overdue ON accounts_payable(company_id, due_date) 
    WHERE status IN ('pending', 'overdue') AND due_date < CURRENT_DATE;

-- 建立索引 - payments 表
CREATE INDEX idx_payments_company ON payments(company_id);
CREATE INDEX idx_payments_company_date ON payments(company_id, payment_date);
CREATE INDEX idx_payments_company_status ON payments(company_id, status);

-- 建立索引 - payment_allocations 表
CREATE INDEX idx_payment_allocations_company ON payment_allocations(company_id);

-- 建立索引 - currencies 表
CREATE INDEX idx_currencies_company ON currencies(company_id);
CREATE INDEX idx_currencies_global ON currencies(is_global);

-- 數據遷移：為現有發票分配到第一個可用的公司
UPDATE invoices SET 
    company_id = (
        SELECT id FROM companies 
        WHERE is_active = true 
        ORDER BY id 
        LIMIT 1
    ),
    created_by_user_id = COALESCE(
        created_by_user_id,
        (SELECT id FROM users WHERE email = 'gamepig1976@gmail.com' LIMIT 1)
    )
WHERE company_id IS NULL;

-- 數據遷移：為發票項目分配公司ID（根據發票的公司）
UPDATE invoice_items SET 
    company_id = (
        SELECT i.company_id 
        FROM invoices i 
        WHERE i.id = invoice_items.invoice_id
    )
WHERE company_id IS NULL;

-- 數據遷移：為應付帳款分配公司ID（根據發票的公司）
UPDATE accounts_payable SET 
    company_id = (
        SELECT i.company_id 
        FROM invoices i 
        WHERE i.id = accounts_payable.invoice_id
    ),
    created_by_user_id = (
        SELECT id FROM users 
        WHERE email = 'gamepig1976@gmail.com' 
        LIMIT 1
    )
WHERE company_id IS NULL;

-- 數據遷移：為付款記錄分配公司ID（根據供應商的公司）
UPDATE payments SET 
    company_id = (
        SELECT s.company_id 
        FROM suppliers s 
        WHERE s.id = payments.supplier_id
    )
WHERE company_id IS NULL;

-- 數據遷移：為付款分配記錄分配公司ID（根據付款的公司）
UPDATE payment_allocations SET 
    company_id = (
        SELECT p.company_id 
        FROM payments p 
        WHERE p.id = payment_allocations.payment_id
    )
WHERE company_id IS NULL;

-- 數據遷移：保持全球通用的貨幣設定
UPDATE currencies SET 
    company_id = NULL,
    is_global = true
WHERE company_id IS NULL;

-- 確保數據一致性：檢查發票與相關記錄的公司ID匹配
-- 更新發票項目以匹配發票的公司
UPDATE invoice_items 
SET company_id = invoices.company_id
FROM invoices
WHERE invoice_items.invoice_id = invoices.id 
    AND invoice_items.company_id != invoices.company_id;

-- 更新應付帳款以匹配發票的公司
UPDATE accounts_payable 
SET company_id = invoices.company_id
FROM invoices
WHERE accounts_payable.invoice_id = invoices.id 
    AND accounts_payable.company_id != invoices.company_id;