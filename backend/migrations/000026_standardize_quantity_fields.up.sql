-- Standardize quantity fields to NUMERIC(15,3) across all tables

-- inventory_levels table - standardize quantity fields
ALTER TABLE inventory_levels ALTER COLUMN quantity_on_hand TYPE NUMERIC(15,3);
ALTER TABLE inventory_levels ALTER COLUMN quantity_available TYPE NUMERIC(15,3);
ALTER TABLE inventory_levels ALTER COLUMN quantity_reserved TYPE NUMERIC(15,3);
ALTER TABLE inventory_levels ALTER COLUMN quantity_on_order TYPE NUMERIC(15,3);
ALTER TABLE inventory_levels ALTER COLUMN reorder_point TYPE NUMERIC(15,3);

-- inventory_transactions table - standardize quantity fields
ALTER TABLE inventory_transactions ALTER COLUMN quantity_changed TYPE NUMERIC(15,3);
ALTER TABLE inventory_transactions ALTER COLUMN quantity_before TYPE NUMERIC(15,3);
ALTER TABLE inventory_transactions ALTER COLUMN quantity_after TYPE NUMERIC(15,3);

-- purchase_order_items table - standardize quantity fields
ALTER TABLE purchase_order_items ALTER COLUMN quantity TYPE NUMERIC(15,3);
ALTER TABLE purchase_order_items ALTER COLUMN quantity_received TYPE NUMERIC(15,3);

-- sales_order_items table - standardize quantity fields  
ALTER TABLE sales_order_items ALTER COLUMN quantity TYPE NUMERIC(15,3);

-- quote_items table - standardize quantity fields
ALTER TABLE quote_items ALTER COLUMN quantity TYPE NUMERIC(15,3);

-- stocktaking_lines table - standardize quantity fields
ALTER TABLE stocktaking_lines ALTER COLUMN system_quantity TYPE NUMERIC(15,3);
ALTER TABLE stocktaking_lines ALTER COLUMN counted_quantity TYPE NUMERIC(15,3);
ALTER TABLE stocktaking_lines ALTER COLUMN variance_quantity TYPE NUMERIC(15,3);

-- Add comments for documentation
COMMENT ON COLUMN inventory_levels.quantity_on_hand IS 'Physical quantity available (supports decimals)';
COMMENT ON COLUMN inventory_levels.quantity_available IS 'Available quantity for sale (supports decimals)';
COMMENT ON COLUMN inventory_levels.quantity_reserved IS 'Reserved quantity for orders (supports decimals)';
COMMENT ON COLUMN inventory_levels.quantity_on_order IS 'Quantity on purchase orders (supports decimals)';
COMMENT ON COLUMN inventory_levels.reorder_point IS 'Minimum stock level trigger (supports decimals)';

COMMENT ON COLUMN inventory_transactions.quantity_changed IS 'Quantity change amount (supports decimals)';
COMMENT ON COLUMN inventory_transactions.quantity_before IS 'Quantity before transaction (supports decimals)';
COMMENT ON COLUMN inventory_transactions.quantity_after IS 'Quantity after transaction (supports decimals)';

COMMENT ON COLUMN purchase_order_items.quantity IS 'Ordered quantity (supports decimals)';
COMMENT ON COLUMN purchase_order_items.quantity_received IS 'Received quantity (supports decimals)';

COMMENT ON COLUMN sales_order_items.quantity IS 'Ordered quantity (supports decimals)';
COMMENT ON COLUMN quote_items.quantity IS 'Quoted quantity (supports decimals)';