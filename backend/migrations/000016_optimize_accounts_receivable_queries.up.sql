-- Optimize Accounts Receivable query performance
-- Migration: 000016_optimize_accounts_receivable_queries

-- Create indexes for common AR query patterns
CREATE INDEX IF NOT EXISTS idx_accounts_receivable_customer_status 
ON accounts_receivable(customer_id, status);

CREATE INDEX IF NOT EXISTS idx_accounts_receivable_due_date_status 
ON accounts_receivable(due_date, status);

CREATE INDEX IF NOT EXISTS idx_accounts_receivable_status_balance 
ON accounts_receivable(status, balance_due) 
WHERE balance_due > 0;

CREATE INDEX IF NOT EXISTS idx_accounts_receivable_aging_bucket 
ON accounts_receivable(aging_bucket, customer_id);

-- Create index for customer balance calculations
CREATE INDEX IF NOT EXISTS idx_accounts_receivable_customer_balance 
ON accounts_receivable(customer_id, balance_due, status) 
WHERE status IN ('open', 'partially_paid', 'overdue');

-- Create index for aging report queries
CREATE INDEX IF NOT EXISTS idx_accounts_receivable_aging_report 
ON accounts_receivable(customer_id, due_date, balance_due) 
WHERE balance_due > 0;

-- Create composite index for date range queries
CREATE INDEX IF NOT EXISTS idx_accounts_receivable_date_range 
ON accounts_receivable(due_date, customer_id, status);

-- Create index for outstanding AR queries (used by payment application)
CREATE INDEX IF NOT EXISTS idx_accounts_receivable_outstanding 
ON accounts_receivable(customer_id, due_date, balance_due) 
WHERE status IN ('open', 'partially_paid', 'overdue') AND balance_due > 0;

-- Create partial index for overdue records
CREATE INDEX IF NOT EXISTS idx_accounts_receivable_overdue 
ON accounts_receivable(customer_id, due_date, balance_due) 
WHERE status IN ('open', 'partially_paid', 'overdue');

-- Add index for customer payments to improve last payment lookup
CREATE INDEX IF NOT EXISTS idx_customer_payments_last_payment 
ON customer_payments(customer_id, payment_date DESC, created_at DESC) 
WHERE status = 'completed';

-- Update statistics to help query planner
ANALYZE accounts_receivable;
ANALYZE customer_payments;