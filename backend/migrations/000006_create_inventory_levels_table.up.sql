-- Create inventory_levels table
CREATE TABLE IF NOT EXISTS inventory_levels (
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    warehouse_id BIGINT NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
    quantity_on_hand INTEGER NOT NULL DEFAULT 0,
    quantity_available INTEGER NOT NULL DEFAULT 0,
    quantity_reserved INTEGER NOT NULL DEFAULT 0,
    quantity_on_order INTEGER NOT NULL DEFAULT 0,
    reorder_point INTEGER DEFAULT 0,
    max_stock_level INTEGER,
    last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (product_id, warehouse_id)
);

-- Create index for product lookups
CREATE INDEX IF NOT EXISTS idx_inventory_levels_product_id ON inventory_levels(product_id);

-- Create index for warehouse lookups
CREATE INDEX IF NOT EXISTS idx_inventory_levels_warehouse_id ON inventory_levels(warehouse_id);

-- Create index for low stock alerts
CREATE INDEX IF NOT EXISTS idx_inventory_levels_low_stock ON inventory_levels(product_id, warehouse_id) 
WHERE quantity_available <= reorder_point;

-- Create index for last updated tracking
CREATE INDEX IF NOT EXISTS idx_inventory_levels_last_updated ON inventory_levels(last_updated_at);

-- Create trigger for updated_at
CREATE TRIGGER update_inventory_levels_updated_at
    BEFORE UPDATE ON inventory_levels
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to automatically update last_updated_at when quantity changes
CREATE OR REPLACE FUNCTION update_inventory_last_updated()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for last_updated_at
CREATE TRIGGER update_inventory_last_updated_trigger
    BEFORE UPDATE ON inventory_levels
    FOR EACH ROW
    WHEN (OLD.quantity_on_hand != NEW.quantity_on_hand OR 
          OLD.quantity_available != NEW.quantity_available OR
          OLD.quantity_reserved != NEW.quantity_reserved OR
          OLD.quantity_on_order != NEW.quantity_on_order)
    EXECUTE FUNCTION update_inventory_last_updated();