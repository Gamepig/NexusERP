-- Create stocktaking_statuses table first
CREATE TABLE IF NOT EXISTS stocktaking_statuses (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(32) UNIQUE NOT NULL,
    description VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default stocktaking statuses
INSERT INTO stocktaking_statuses (name, description) VALUES 
    ('PLANNED', 'Stocktaking has been planned but not started'),
    ('IN_PROGRESS', 'Stocktaking is currently in progress'),
    ('COMPLETED', 'Stocktaking has been completed'),
    ('CANCELLED', 'Stocktaking has been cancelled'),
    ('APPROVED', 'Stocktaking results have been approved'),
    ('FINALIZED', 'Stocktaking has been finalized and adjustments applied')
ON CONFLICT (name) DO NOTHING;

-- Create stocktaking_orders table
CREATE TABLE IF NOT EXISTS stocktaking_orders (
    id BIGSERIAL PRIMARY KEY,
    reference_number VARCHAR(64) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    warehouse_id BIGINT NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
    status_id BIGINT NOT NULL REFERENCES stocktaking_statuses(id),
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    planned_date TIMESTAMP WITH TIME ZONE,
    created_by_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    approved_by_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    finalized_by_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMP WITH TIME ZONE,
    finalized_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create stocktaking_items table
CREATE TABLE IF NOT EXISTS stocktaking_items (
    id BIGSERIAL PRIMARY KEY,
    stocktaking_order_id BIGINT NOT NULL REFERENCES stocktaking_orders(id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    system_quantity INTEGER NOT NULL DEFAULT 0, -- Quantity according to system
    counted_quantity INTEGER, -- Quantity actually counted (NULL if not counted yet)
    adjustment_quantity INTEGER DEFAULT 0, -- Difference (counted - system)
    unit_cost DECIMAL(12,2), -- Cost per unit at time of stocktaking
    total_cost_impact DECIMAL(12,2), -- Total cost impact of adjustment
    batch_number VARCHAR(128), -- For batch tracking
    expiry_date DATE, -- For perishable goods
    notes TEXT,
    counted_by_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    counted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(stocktaking_order_id, product_id, batch_number)
);

-- Create product_safety_stocks table for inventory alerts
CREATE TABLE IF NOT EXISTS product_safety_stocks (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    warehouse_id BIGINT NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
    safety_stock_level INTEGER NOT NULL DEFAULT 0,
    reorder_quantity INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(product_id, warehouse_id)
);

-- Create inventory_alert_types table
CREATE TABLE IF NOT EXISTS inventory_alert_types (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(32) UNIQUE NOT NULL,
    description VARCHAR(255),
    severity_level INTEGER DEFAULT 1, -- 1=Low, 2=Medium, 3=High, 4=Critical
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default alert types
INSERT INTO inventory_alert_types (name, description, severity_level) VALUES 
    ('LOW_STOCK', 'Product quantity is below safety stock level', 3),
    ('OUT_OF_STOCK', 'Product is completely out of stock', 4),
    ('OVERSTOCK', 'Product quantity is above maximum stock level', 2),
    ('EXPIRED_STOCK', 'Product has expired or is about to expire', 3),
    ('SLOW_MOVING', 'Product has not moved for extended period', 1)
ON CONFLICT (name) DO NOTHING;

-- Create inventory_alerts table
CREATE TABLE IF NOT EXISTS inventory_alerts (
    id BIGSERIAL PRIMARY KEY,
    alert_type_id BIGINT NOT NULL REFERENCES inventory_alert_types(id),
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    warehouse_id BIGINT NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
    current_level INTEGER NOT NULL,
    safety_level INTEGER,
    max_level INTEGER,
    alert_message TEXT,
    triggered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(16) DEFAULT 'ACTIVE', -- 'ACTIVE', 'RESOLVED', 'DISMISSED'
    notification_sent BOOLEAN DEFAULT false,
    notification_sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for stocktaking_orders
CREATE INDEX IF NOT EXISTS idx_stocktaking_orders_warehouse_id ON stocktaking_orders(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_stocktaking_orders_status_id ON stocktaking_orders(status_id);
CREATE INDEX IF NOT EXISTS idx_stocktaking_orders_created_by ON stocktaking_orders(created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_stocktaking_orders_planned_date ON stocktaking_orders(planned_date);
CREATE INDEX IF NOT EXISTS idx_stocktaking_orders_reference ON stocktaking_orders(reference_number);

-- Create indexes for stocktaking_items
CREATE INDEX IF NOT EXISTS idx_stocktaking_items_order_id ON stocktaking_items(stocktaking_order_id);
CREATE INDEX IF NOT EXISTS idx_stocktaking_items_product_id ON stocktaking_items(product_id);
CREATE INDEX IF NOT EXISTS idx_stocktaking_items_counted_by ON stocktaking_items(counted_by_user_id);
CREATE INDEX IF NOT EXISTS idx_stocktaking_items_batch ON stocktaking_items(batch_number) WHERE batch_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_stocktaking_items_expiry ON stocktaking_items(expiry_date) WHERE expiry_date IS NOT NULL;

-- Create indexes for product_safety_stocks
CREATE INDEX IF NOT EXISTS idx_product_safety_stocks_product_id ON product_safety_stocks(product_id);
CREATE INDEX IF NOT EXISTS idx_product_safety_stocks_warehouse_id ON product_safety_stocks(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_product_safety_stocks_active ON product_safety_stocks(is_active) WHERE is_active = true;

-- Create indexes for inventory_alerts
CREATE INDEX IF NOT EXISTS idx_inventory_alerts_alert_type_id ON inventory_alerts(alert_type_id);
CREATE INDEX IF NOT EXISTS idx_inventory_alerts_product_id ON inventory_alerts(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_alerts_warehouse_id ON inventory_alerts(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_inventory_alerts_status ON inventory_alerts(status);
CREATE INDEX IF NOT EXISTS idx_inventory_alerts_triggered_at ON inventory_alerts(triggered_at);
CREATE INDEX IF NOT EXISTS idx_inventory_alerts_active ON inventory_alerts(status, triggered_at) WHERE status = 'ACTIVE';

-- Create triggers for updated_at columns
CREATE TRIGGER update_stocktaking_orders_updated_at
    BEFORE UPDATE ON stocktaking_orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stocktaking_items_updated_at
    BEFORE UPDATE ON stocktaking_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_safety_stocks_updated_at
    BEFORE UPDATE ON product_safety_stocks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_alerts_updated_at
    BEFORE UPDATE ON inventory_alerts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to automatically calculate adjustment quantity
CREATE OR REPLACE FUNCTION calculate_stocktaking_adjustment()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.counted_quantity IS NOT NULL THEN
        NEW.adjustment_quantity = NEW.counted_quantity - NEW.system_quantity;
        
        -- Calculate total cost impact if unit_cost is available
        IF NEW.unit_cost IS NOT NULL THEN
            NEW.total_cost_impact = NEW.adjustment_quantity * NEW.unit_cost;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for automatic adjustment calculation
CREATE TRIGGER calculate_stocktaking_adjustment_trigger
    BEFORE INSERT OR UPDATE ON stocktaking_items
    FOR EACH ROW
    EXECUTE FUNCTION calculate_stocktaking_adjustment();

-- Create function to generate reference number for stocktaking orders
CREATE OR REPLACE FUNCTION generate_stocktaking_reference()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.reference_number IS NULL OR NEW.reference_number = '' THEN
        NEW.reference_number = 'ST-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(NEXTVAL('stocktaking_orders_id_seq')::text, 6, '0');
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for automatic reference number generation
CREATE TRIGGER generate_stocktaking_reference_trigger
    BEFORE INSERT ON stocktaking_orders
    FOR EACH ROW
    EXECUTE FUNCTION generate_stocktaking_reference();