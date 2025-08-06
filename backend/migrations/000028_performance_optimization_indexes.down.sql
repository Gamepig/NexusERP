-- Rollback performance optimization indexes
-- Task 22.1: Database Performance Analysis and Optimization

-- Drop all indexes created in the up migration
DROP INDEX IF EXISTS idx_sales_orders_customer_status_date;
DROP INDEX IF EXISTS idx_sales_order_items_product_status;
DROP INDEX IF EXISTS idx_inventory_transactions_product_warehouse_date;
DROP INDEX IF EXISTS idx_products_active;
DROP INDEX IF EXISTS idx_customers_active;
DROP INDEX IF EXISTS idx_sales_orders_date_status_total;
DROP INDEX IF EXISTS idx_inventory_levels_low_stock_optimized;
DROP INDEX IF EXISTS idx_purchase_orders_supplier_status;
DROP INDEX IF EXISTS idx_quote_items_quote_product;
DROP INDEX IF EXISTS idx_accounts_receivable_customer_status;
DROP INDEX IF EXISTS idx_inventory_transactions_date_type;
DROP INDEX IF EXISTS idx_sales_order_items_coverage;
DROP INDEX IF EXISTS idx_inventory_levels_coverage;
DROP INDEX IF EXISTS idx_products_fulltext;
DROP INDEX IF EXISTS idx_customers_fulltext;