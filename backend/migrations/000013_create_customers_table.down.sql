-- Drop customer-related tables in reverse order
DROP TABLE IF EXISTS customer_credit_history;
DROP TABLE IF EXISTS customer_activities;
DROP TABLE IF EXISTS customer_contacts;
DROP TABLE IF EXISTS customers;

-- Remove customer-related roles
DELETE FROM roles WHERE name IN ('customer_manager', 'sales_rep');