-- Drop triggers
DROP TRIGGER IF EXISTS trigger_update_sales_order_totals ON sales_order_items;
DROP TRIGGER IF EXISTS trigger_auto_generate_so_number ON sales_orders;
DROP TRIGGER IF EXISTS update_sales_order_items_updated_at ON sales_order_items;
DROP TRIGGER IF EXISTS update_sales_orders_updated_at ON sales_orders;

-- Drop functions
DROP FUNCTION IF EXISTS update_sales_order_totals();
DROP FUNCTION IF EXISTS auto_generate_so_number();
DROP FUNCTION IF EXISTS generate_so_number();

-- Drop indexes
DROP INDEX IF EXISTS idx_sales_order_items_status;
DROP INDEX IF EXISTS idx_sales_order_items_product_id;
DROP INDEX IF EXISTS idx_sales_order_items_sales_order_id;

DROP INDEX IF EXISTS idx_sales_orders_currency_id;
DROP INDEX IF EXISTS idx_sales_orders_business_unit_id;
DROP INDEX IF EXISTS idx_sales_orders_user_id;
DROP INDEX IF EXISTS idx_sales_orders_order_date;
DROP INDEX IF EXISTS idx_sales_orders_status;
DROP INDEX IF EXISTS idx_sales_orders_customer_id;
DROP INDEX IF EXISTS idx_sales_orders_order_number;

-- Drop tables (in reverse order due to foreign key constraints)
DROP TABLE IF EXISTS sales_order_items;
DROP TABLE IF EXISTS sales_orders;