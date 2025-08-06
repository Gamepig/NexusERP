-- Rollback quantity field standardization
-- Note: This rollback converts back to original types, potential data loss for decimal values

-- inventory_levels table - revert to original types
ALTER TABLE inventory_levels ALTER COLUMN quantity_on_hand TYPE INTEGER;
ALTER TABLE inventory_levels ALTER COLUMN quantity_available TYPE INTEGER;
ALTER TABLE inventory_levels ALTER COLUMN quantity_reserved TYPE INTEGER;
ALTER TABLE inventory_levels ALTER COLUMN quantity_on_order TYPE INTEGER;
ALTER TABLE inventory_levels ALTER COLUMN reorder_point TYPE INTEGER;

-- inventory_transactions table - revert to original types
ALTER TABLE inventory_transactions ALTER COLUMN quantity_changed TYPE INTEGER;
ALTER TABLE inventory_transactions ALTER COLUMN quantity_before TYPE INTEGER;
ALTER TABLE inventory_transactions ALTER COLUMN quantity_after TYPE INTEGER;

-- purchase_order_items table - revert to original types
ALTER TABLE purchase_order_items ALTER COLUMN quantity TYPE INTEGER;
ALTER TABLE purchase_order_items ALTER COLUMN quantity_received TYPE INTEGER;

-- sales_order_items table - revert to original types  
ALTER TABLE sales_order_items ALTER COLUMN quantity TYPE NUMERIC(12,2);

-- quote_items table - revert to original types
ALTER TABLE quote_items ALTER COLUMN quantity TYPE NUMERIC(12,2);

-- stocktaking_lines table - revert to original types
ALTER TABLE stocktaking_lines ALTER COLUMN system_quantity TYPE INTEGER;
ALTER TABLE stocktaking_lines ALTER COLUMN counted_quantity TYPE INTEGER;
ALTER TABLE stocktaking_lines ALTER COLUMN variance_quantity TYPE INTEGER;