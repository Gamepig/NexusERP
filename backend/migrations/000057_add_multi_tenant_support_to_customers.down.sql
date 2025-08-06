-- Rollback multi-tenant support from customers and related tables
-- WARNING: This will remove company isolation and may cause data loss

-- Drop indexes first
DROP INDEX IF EXISTS idx_customers_company_search;
DROP INDEX IF EXISTS idx_customers_company_active_only;
DROP INDEX IF EXISTS idx_customers_company_status;
DROP INDEX IF EXISTS idx_customers_company_email;
DROP INDEX IF EXISTS idx_customers_company_name_search;
DROP INDEX IF EXISTS idx_customers_company_code;
DROP INDEX IF EXISTS idx_customers_company_active;
DROP INDEX IF EXISTS idx_customers_created_by_user;
DROP INDEX IF EXISTS idx_customers_company;
DROP INDEX IF EXISTS idx_customers_company_new;

-- Drop related table indexes and columns
DROP INDEX IF EXISTS idx_customer_credit_history_company;
ALTER TABLE customer_credit_history DROP CONSTRAINT IF EXISTS fk_customer_credit_history_company;
ALTER TABLE customer_credit_history DROP COLUMN IF EXISTS company_id;

DROP INDEX IF EXISTS idx_customer_activities_company;
ALTER TABLE customer_activities DROP CONSTRAINT IF EXISTS fk_customer_activities_company;
ALTER TABLE customer_activities DROP COLUMN IF EXISTS company_id;

DROP INDEX IF EXISTS idx_customer_contacts_company;
ALTER TABLE customer_contacts DROP CONSTRAINT IF EXISTS fk_customer_contacts_company;
ALTER TABLE customer_contacts DROP COLUMN IF EXISTS company_id;

-- Drop foreign key constraints from customers table
ALTER TABLE customers DROP CONSTRAINT IF EXISTS fk_customers_created_by_user;
ALTER TABLE customers DROP CONSTRAINT IF EXISTS fk_customers_company;

-- Drop columns from customers table
ALTER TABLE customers DROP COLUMN IF EXISTS created_by_user_id;
ALTER TABLE customers DROP COLUMN IF EXISTS company_id;