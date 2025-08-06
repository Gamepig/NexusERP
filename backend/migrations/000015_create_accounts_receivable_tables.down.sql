-- Drop triggers
DROP TRIGGER IF EXISTS trigger_auto_generate_sales_invoice_on_shipment ON sales_orders;
DROP TRIGGER IF EXISTS trigger_update_customer_payment_unapplied_amount ON customer_payment_allocations;
DROP TRIGGER IF EXISTS trigger_update_ar_on_customer_payment_allocation ON customer_payment_allocations;
DROP TRIGGER IF EXISTS trigger_update_ar_aging_bucket ON accounts_receivable;
DROP TRIGGER IF EXISTS trigger_create_accounts_receivable_on_sales_invoice_approval ON invoices;
DROP TRIGGER IF EXISTS trigger_auto_generate_customer_payment_number ON customer_payments;
DROP TRIGGER IF EXISTS trigger_customer_payments_updated_at ON customer_payments;
DROP TRIGGER IF EXISTS trigger_accounts_receivable_updated_at ON accounts_receivable;

-- Drop functions
DROP FUNCTION IF EXISTS auto_generate_sales_invoice_on_shipment();
DROP FUNCTION IF EXISTS update_customer_payment_unapplied_amount();
DROP FUNCTION IF EXISTS update_ar_on_customer_payment_allocation();
DROP FUNCTION IF EXISTS update_ar_aging_bucket();
DROP FUNCTION IF EXISTS create_accounts_receivable_on_sales_invoice_approval();
DROP FUNCTION IF EXISTS auto_generate_customer_payment_number();
DROP FUNCTION IF EXISTS generate_customer_payment_number();
DROP FUNCTION IF EXISTS update_customer_payments_updated_at();
DROP FUNCTION IF EXISTS update_accounts_receivable_updated_at();

-- Drop indexes
DROP INDEX IF EXISTS idx_customer_payment_allocations_ar_id;
DROP INDEX IF EXISTS idx_customer_payment_allocations_payment_id;
DROP INDEX IF EXISTS idx_customer_payments_payment_number;
DROP INDEX IF EXISTS idx_customer_payments_status;
DROP INDEX IF EXISTS idx_customer_payments_payment_date;
DROP INDEX IF EXISTS idx_customer_payments_customer_id;
DROP INDEX IF EXISTS idx_accounts_receivable_aging_bucket;
DROP INDEX IF EXISTS idx_accounts_receivable_due_date;
DROP INDEX IF EXISTS idx_accounts_receivable_status;
DROP INDEX IF EXISTS idx_accounts_receivable_customer_id;
DROP INDEX IF EXISTS idx_accounts_receivable_invoice_id;
DROP INDEX IF EXISTS idx_invoices_sales_order_id;
DROP INDEX IF EXISTS idx_invoices_customer_id;
DROP INDEX IF EXISTS idx_invoices_invoice_type;

-- Drop tables
DROP TABLE IF EXISTS customer_payment_allocations;
DROP TABLE IF EXISTS customer_payments;
DROP TABLE IF EXISTS accounts_receivable;

-- Remove foreign key constraints from invoices table
ALTER TABLE invoices DROP CONSTRAINT IF EXISTS fk_invoices_sales_order_id;
ALTER TABLE invoices DROP CONSTRAINT IF EXISTS fk_invoices_customer_id;

-- Remove check constraints from invoices table
ALTER TABLE invoices DROP CONSTRAINT IF EXISTS check_invoice_entity;

-- Restore supplier_id NOT NULL constraint
ALTER TABLE invoices ALTER COLUMN supplier_id SET NOT NULL;

-- Remove columns from invoices table
ALTER TABLE invoices 
  DROP COLUMN IF EXISTS sales_order_id,
  DROP COLUMN IF EXISTS customer_id,
  DROP COLUMN IF EXISTS invoice_type;