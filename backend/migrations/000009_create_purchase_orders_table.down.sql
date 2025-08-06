-- Drop triggers
DROP TRIGGER IF EXISTS trigger_update_purchase_order_totals ON purchase_order_items;
DROP TRIGGER IF EXISTS trigger_auto_generate_po_number ON purchase_orders;
DROP TRIGGER IF EXISTS trigger_purchase_order_items_updated_at ON purchase_order_items;
DROP TRIGGER IF EXISTS trigger_purchase_orders_updated_at ON purchase_orders;

-- Drop functions
DROP FUNCTION IF EXISTS update_purchase_order_totals();
DROP FUNCTION IF EXISTS auto_generate_po_number();
DROP FUNCTION IF EXISTS generate_po_number();
DROP FUNCTION IF EXISTS update_purchase_order_items_updated_at();
DROP FUNCTION IF EXISTS update_purchase_orders_updated_at();

-- Drop indexes
DROP INDEX IF EXISTS idx_purchase_order_items_warehouse_id;
DROP INDEX IF EXISTS idx_purchase_order_items_product_id;
DROP INDEX IF EXISTS idx_purchase_order_items_purchase_order_id;

DROP INDEX IF EXISTS idx_purchase_orders_created_by_user_id;
DROP INDEX IF EXISTS idx_purchase_orders_order_date;
DROP INDEX IF EXISTS idx_purchase_orders_status;
DROP INDEX IF EXISTS idx_purchase_orders_supplier_id;
DROP INDEX IF EXISTS idx_purchase_orders_po_number;

-- Drop tables (foreign key constraints will be dropped automatically)
DROP TABLE IF EXISTS purchase_order_items;
DROP TABLE IF EXISTS purchase_orders;