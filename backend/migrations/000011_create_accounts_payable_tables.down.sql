-- Drop triggers first
DROP TRIGGER IF EXISTS trigger_update_ap_on_payment_allocation ON payment_allocations;
DROP TRIGGER IF EXISTS trigger_update_aging_bucket ON accounts_payable;
DROP TRIGGER IF EXISTS trigger_create_accounts_payable_on_approval ON invoices;
DROP TRIGGER IF EXISTS trigger_update_invoice_totals ON invoice_items;
DROP TRIGGER IF EXISTS trigger_auto_generate_payment_number ON payments;
DROP TRIGGER IF EXISTS trigger_auto_generate_invoice_number ON invoices;
DROP TRIGGER IF EXISTS trigger_payments_updated_at ON payments;
DROP TRIGGER IF EXISTS trigger_accounts_payable_updated_at ON accounts_payable;
DROP TRIGGER IF EXISTS trigger_invoice_items_updated_at ON invoice_items;
DROP TRIGGER IF EXISTS trigger_invoices_updated_at ON invoices;
DROP TRIGGER IF EXISTS trigger_currencies_updated_at ON currencies;

-- Drop functions
DROP FUNCTION IF EXISTS update_ap_on_payment_allocation();
DROP FUNCTION IF EXISTS update_aging_bucket();
DROP FUNCTION IF EXISTS create_accounts_payable_on_approval();
DROP FUNCTION IF EXISTS update_invoice_totals();
DROP FUNCTION IF EXISTS generate_payment_number();
DROP FUNCTION IF EXISTS auto_generate_payment_number();
DROP FUNCTION IF EXISTS generate_invoice_number();
DROP FUNCTION IF EXISTS auto_generate_invoice_number();
DROP FUNCTION IF EXISTS update_payments_updated_at();
DROP FUNCTION IF EXISTS update_accounts_payable_updated_at();
DROP FUNCTION IF EXISTS update_invoice_items_updated_at();
DROP FUNCTION IF EXISTS update_invoices_updated_at();
DROP FUNCTION IF EXISTS update_currencies_updated_at();

-- Drop tables in reverse order of dependencies
DROP TABLE IF EXISTS payment_allocations;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS accounts_payable;
DROP TABLE IF EXISTS invoice_items;
DROP TABLE IF EXISTS invoices;
DROP TABLE IF EXISTS currencies;