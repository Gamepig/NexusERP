-- Add multi-tenant support to accounts receivable and related tables
-- 業務重要性：⭐⭐⭐⭐
-- 影響範圍：財務報表、客戶管理、銷售收款
-- 風險等級：MEDIUM

-- 添加多租戶隔離欄位到 accounts_receivable 表
ALTER TABLE accounts_receivable 
ADD COLUMN company_id bigint,
ADD COLUMN created_by_user_id bigint;

-- 添加多租戶隔離欄位到 customer_payments 表
ALTER TABLE customer_payments 
ADD COLUMN company_id bigint;

-- 添加多租戶隔離欄位到 customer_payment_allocations 表
ALTER TABLE customer_payment_allocations 
ADD COLUMN company_id bigint;

-- 添加外鍵約束到 accounts_receivable 表
ALTER TABLE accounts_receivable 
ADD CONSTRAINT fk_accounts_receivable_company 
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;

ALTER TABLE accounts_receivable 
ADD CONSTRAINT fk_accounts_receivable_created_by_user 
    FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE SET NULL;

-- 添加外鍵約束到 customer_payments 表
ALTER TABLE customer_payments 
ADD CONSTRAINT fk_customer_payments_company 
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;

-- 添加外鍵約束到 customer_payment_allocations 表
ALTER TABLE customer_payment_allocations 
ADD CONSTRAINT fk_customer_payment_allocations_company 
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;

-- 建立索引 - accounts_receivable 表
CREATE INDEX idx_accounts_receivable_company ON accounts_receivable(company_id);
CREATE INDEX idx_accounts_receivable_company_status ON accounts_receivable(company_id, status);
CREATE INDEX idx_accounts_receivable_company_due_date ON accounts_receivable(company_id, due_date);
CREATE INDEX idx_accounts_receivable_company_overdue ON accounts_receivable(company_id, due_date) 
    WHERE status IN ('open', 'overdue') AND due_date < CURRENT_DATE;
CREATE INDEX idx_accounts_receivable_company_aging ON accounts_receivable(company_id, aging_bucket);

-- 建立索引 - customer_payments 表
CREATE INDEX idx_customer_payments_company ON customer_payments(company_id);
CREATE INDEX idx_customer_payments_company_date ON customer_payments(company_id, payment_date);
CREATE INDEX idx_customer_payments_company_status ON customer_payments(company_id, status);

-- 建立索引 - customer_payment_allocations 表
CREATE INDEX idx_customer_payment_allocations_company ON customer_payment_allocations(company_id);

-- 數據遷移：為現有應收帳款分配到第一個可用的公司（根據客戶的公司）
UPDATE accounts_receivable SET 
    company_id = (
        SELECT cust.company_id 
        FROM customers cust 
        WHERE cust.id = accounts_receivable.customer_id
    ),
    created_by_user_id = (
        SELECT id FROM users 
        WHERE email = 'gamepig1976@gmail.com' 
        LIMIT 1
    )
WHERE company_id IS NULL;

-- 數據遷移：為客戶付款記錄分配公司ID（根據客戶的公司）
UPDATE customer_payments SET 
    company_id = (
        SELECT cust.company_id 
        FROM customers cust 
        WHERE cust.id = customer_payments.customer_id
    )
WHERE company_id IS NULL;

-- 數據遷移：為客戶付款分配記錄分配公司ID（根據付款的公司）
UPDATE customer_payment_allocations SET 
    company_id = (
        SELECT cp.company_id 
        FROM customer_payments cp 
        WHERE cp.id = customer_payment_allocations.payment_id
    )
WHERE company_id IS NULL;

-- 確保數據一致性：檢查應收帳款與相關記錄的公司ID匹配
-- 更新應收帳款以匹配客戶的公司
UPDATE accounts_receivable 
SET company_id = customers.company_id
FROM customers
WHERE accounts_receivable.customer_id = customers.id 
    AND accounts_receivable.company_id != customers.company_id;

-- 更新客戶付款以匹配客戶的公司
UPDATE customer_payments 
SET company_id = customers.company_id
FROM customers
WHERE customer_payments.customer_id = customers.id 
    AND customer_payments.company_id != customers.company_id;

-- 確保付款分配記錄與付款記錄的公司ID一致
UPDATE customer_payment_allocations 
SET company_id = customer_payments.company_id
FROM customer_payments
WHERE customer_payment_allocations.payment_id = customer_payments.id 
    AND customer_payment_allocations.company_id != customer_payments.company_id;

-- 也確保付款分配記錄與應收帳款記錄的公司ID一致
UPDATE customer_payment_allocations 
SET company_id = accounts_receivable.company_id
FROM accounts_receivable
WHERE customer_payment_allocations.accounts_receivable_id = accounts_receivable.id 
    AND customer_payment_allocations.company_id != accounts_receivable.company_id;