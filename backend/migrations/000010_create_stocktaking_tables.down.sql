-- Drop triggers first
DROP TRIGGER IF EXISTS generate_stocktaking_reference_trigger ON stocktaking_orders;
DROP TRIGGER IF EXISTS calculate_stocktaking_adjustment_trigger ON stocktaking_items;
DROP TRIGGER IF EXISTS update_inventory_alerts_updated_at ON inventory_alerts;
DROP TRIGGER IF EXISTS update_product_safety_stocks_updated_at ON product_safety_stocks;
DROP TRIGGER IF EXISTS update_stocktaking_items_updated_at ON stocktaking_items;
DROP TRIGGER IF EXISTS update_stocktaking_orders_updated_at ON stocktaking_orders;

-- Drop functions
DROP FUNCTION IF EXISTS generate_stocktaking_reference();
DROP FUNCTION IF EXISTS calculate_stocktaking_adjustment();

-- Drop indexes
DROP INDEX IF EXISTS idx_inventory_alerts_active;
DROP INDEX IF EXISTS idx_inventory_alerts_triggered_at;
DROP INDEX IF EXISTS idx_inventory_alerts_status;
DROP INDEX IF EXISTS idx_inventory_alerts_warehouse_id;
DROP INDEX IF EXISTS idx_inventory_alerts_product_id;
DROP INDEX IF EXISTS idx_inventory_alerts_alert_type_id;

DROP INDEX IF EXISTS idx_product_safety_stocks_active;
DROP INDEX IF EXISTS idx_product_safety_stocks_warehouse_id;
DROP INDEX IF EXISTS idx_product_safety_stocks_product_id;

DROP INDEX IF EXISTS idx_stocktaking_items_expiry;
DROP INDEX IF EXISTS idx_stocktaking_items_batch;
DROP INDEX IF EXISTS idx_stocktaking_items_counted_by;
DROP INDEX IF EXISTS idx_stocktaking_items_product_id;
DROP INDEX IF EXISTS idx_stocktaking_items_order_id;

DROP INDEX IF EXISTS idx_stocktaking_orders_reference;
DROP INDEX IF EXISTS idx_stocktaking_orders_planned_date;
DROP INDEX IF EXISTS idx_stocktaking_orders_created_by;
DROP INDEX IF EXISTS idx_stocktaking_orders_status_id;
DROP INDEX IF EXISTS idx_stocktaking_orders_warehouse_id;

-- Drop tables in reverse order of creation
DROP TABLE IF EXISTS inventory_alerts;
DROP TABLE IF EXISTS inventory_alert_types;
DROP TABLE IF EXISTS product_safety_stocks;
DROP TABLE IF EXISTS stocktaking_items;
DROP TABLE IF EXISTS stocktaking_orders;
DROP TABLE IF EXISTS stocktaking_statuses;