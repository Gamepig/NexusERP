-- Rollback optimization indexes for Accounts Receivable queries
-- Migration: 000016_optimize_accounts_receivable_queries (DOWN)

-- Drop indexes created in the up migration
DROP INDEX IF EXISTS idx_accounts_receivable_customer_status;
DROP INDEX IF EXISTS idx_accounts_receivable_due_date_status;
DROP INDEX IF EXISTS idx_accounts_receivable_status_balance;
DROP INDEX IF EXISTS idx_accounts_receivable_aging_bucket;
DROP INDEX IF EXISTS idx_accounts_receivable_customer_balance;
DROP INDEX IF EXISTS idx_accounts_receivable_aging_report;
DROP INDEX IF EXISTS idx_accounts_receivable_date_range;
DROP INDEX IF EXISTS idx_accounts_receivable_outstanding;
DROP INDEX IF EXISTS idx_accounts_receivable_overdue;
DROP INDEX IF EXISTS idx_customer_payments_last_payment;