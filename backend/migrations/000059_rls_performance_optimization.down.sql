-- Drop RLS Performance Optimization Indexes
-- Migration: 000059_rls_performance_optimization.down.sql

-- Drop views and functions
DROP VIEW IF EXISTS rls_performance_monitor;
DROP FUNCTION IF EXISTS get_rls_index_usage_stats();

-- Drop all RLS optimization indexes
DROP INDEX IF EXISTS idx_products_rls_company_status;
DROP INDEX IF EXISTS idx_products_rls_company_sku;
DROP INDEX IF EXISTS idx_products_rls_company_category;
DROP INDEX IF EXISTS idx_customers_rls_company_status;
DROP INDEX IF EXISTS idx_customers_rls_company_email;
DROP INDEX IF EXISTS idx_sales_orders_rls_company_status;
DROP INDEX IF EXISTS idx_sales_orders_rls_company_customer;
DROP INDEX IF EXISTS idx_sales_orders_rls_company_total;
DROP INDEX IF EXISTS idx_purchase_orders_rls_company_status;
DROP INDEX IF EXISTS idx_purchase_orders_rls_company_supplier;
DROP INDEX IF EXISTS idx_inventory_levels_rls_company_product;
DROP INDEX IF EXISTS idx_inventory_levels_rls_company_low_stock;
DROP INDEX IF EXISTS idx_suppliers_rls_company_status;
DROP INDEX IF EXISTS idx_warehouses_rls_company_active;
DROP INDEX IF EXISTS idx_users_status_active;
DROP INDEX IF EXISTS idx_user_companies_active_primary;
DROP INDEX IF EXISTS idx_companies_rls_active;
DROP INDEX IF EXISTS idx_sales_orders_rls_report_daily;
DROP INDEX IF EXISTS idx_sales_orders_rls_report_monthly;
DROP INDEX IF EXISTS idx_inventory_levels_rls_report_value;
DROP INDEX IF EXISTS idx_sales_orders_rls_customer_analysis;
DROP INDEX IF EXISTS idx_audit_logs_rls_company_time;
DROP INDEX IF EXISTS idx_audit_logs_rls_company_table;
DROP INDEX IF EXISTS idx_products_inventory_rls_joint;
DROP INDEX IF EXISTS idx_sales_order_items_rls_company;
DROP INDEX IF EXISTS idx_purchase_order_items_rls_company;