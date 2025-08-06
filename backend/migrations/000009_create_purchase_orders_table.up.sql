-- Create purchase_orders table
CREATE TABLE purchase_orders (
    id BIGSERIAL PRIMARY KEY,
    po_number VARCHAR(50) UNIQUE NOT NULL,
    supplier_id BIGINT NOT NULL,
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'pending_approval', 'approved', 'partially_received', 'received', 'cancelled')),
    order_date DATE NOT NULL,
    expected_delivery_date DATE,
    delivery_address JSONB,
    subtotal DECIMAL(15,2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    total_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'USD',
    payment_terms VARCHAR(255),
    notes TEXT,
    created_by_user_id BIGINT,
    approved_by_user_id BIGINT,
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    CONSTRAINT fk_purchase_orders_supplier_id FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
    CONSTRAINT fk_purchase_orders_created_by_user_id FOREIGN KEY (created_by_user_id) REFERENCES users(id),
    CONSTRAINT fk_purchase_orders_approved_by_user_id FOREIGN KEY (approved_by_user_id) REFERENCES users(id)
);

-- Create purchase_order_items table for line items
CREATE TABLE purchase_order_items (
    id BIGSERIAL PRIMARY KEY,
    purchase_order_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(15,2) NOT NULL,
    line_total DECIMAL(15,2) NOT NULL,
    quantity_received INTEGER DEFAULT 0 CHECK (quantity_received >= 0),
    warehouse_id BIGINT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    CONSTRAINT fk_purchase_order_items_purchase_order_id FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id) ON DELETE CASCADE,
    CONSTRAINT fk_purchase_order_items_product_id FOREIGN KEY (product_id) REFERENCES products(id),
    CONSTRAINT fk_purchase_order_items_warehouse_id FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
    
    -- Check that received quantity doesn't exceed ordered quantity
    CONSTRAINT check_quantity_received CHECK (quantity_received <= quantity)
);

-- Create indexes for better performance
CREATE INDEX idx_purchase_orders_po_number ON purchase_orders(po_number);
CREATE INDEX idx_purchase_orders_supplier_id ON purchase_orders(supplier_id);
CREATE INDEX idx_purchase_orders_status ON purchase_orders(status);
CREATE INDEX idx_purchase_orders_order_date ON purchase_orders(order_date);
CREATE INDEX idx_purchase_orders_created_by_user_id ON purchase_orders(created_by_user_id);

CREATE INDEX idx_purchase_order_items_purchase_order_id ON purchase_order_items(purchase_order_id);
CREATE INDEX idx_purchase_order_items_product_id ON purchase_order_items(product_id);
CREATE INDEX idx_purchase_order_items_warehouse_id ON purchase_order_items(warehouse_id);

-- Create trigger for updated_at on purchase_orders
CREATE OR REPLACE FUNCTION update_purchase_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_purchase_orders_updated_at
    BEFORE UPDATE ON purchase_orders
    FOR EACH ROW
    EXECUTE FUNCTION update_purchase_orders_updated_at();

-- Create trigger for updated_at on purchase_order_items
CREATE OR REPLACE FUNCTION update_purchase_order_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_purchase_order_items_updated_at
    BEFORE UPDATE ON purchase_order_items
    FOR EACH ROW
    EXECUTE FUNCTION update_purchase_order_items_updated_at();

-- Create function to generate unique PO numbers
CREATE OR REPLACE FUNCTION generate_po_number()
RETURNS VARCHAR(50) AS $$
DECLARE
    new_po_number VARCHAR(50);
    year_part VARCHAR(4);
    sequence_part VARCHAR(6);
BEGIN
    year_part := EXTRACT(YEAR FROM CURRENT_DATE)::VARCHAR;
    
    -- Get the next sequence number for this year
    SELECT COALESCE(MAX(CAST(SUBSTRING(po_number FROM 6) AS INTEGER)), 0) + 1
    INTO sequence_part
    FROM purchase_orders
    WHERE po_number LIKE 'PO' || year_part || '%';
    
    new_po_number := 'PO' || year_part || LPAD(sequence_part::VARCHAR, 6, '0');
    
    RETURN new_po_number;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate PO numbers
CREATE OR REPLACE FUNCTION auto_generate_po_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.po_number IS NULL OR NEW.po_number = '' THEN
        NEW.po_number := generate_po_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_generate_po_number
    BEFORE INSERT ON purchase_orders
    FOR EACH ROW
    EXECUTE FUNCTION auto_generate_po_number();

-- Create function to update purchase order totals when items change
CREATE OR REPLACE FUNCTION update_purchase_order_totals()
RETURNS TRIGGER AS $$
DECLARE
    new_subtotal DECIMAL(15,2);
    new_tax_amount DECIMAL(15,2);
    new_total_amount DECIMAL(15,2);
    po_id BIGINT;
BEGIN
    -- Get the purchase order ID
    IF TG_OP = 'DELETE' THEN
        po_id := OLD.purchase_order_id;
    ELSE
        po_id := NEW.purchase_order_id;
    END IF;
    
    -- Calculate new totals
    SELECT COALESCE(SUM(line_total), 0)
    INTO new_subtotal
    FROM purchase_order_items
    WHERE purchase_order_id = po_id;
    
    -- For now, assume 10% tax (this should be configurable)
    new_tax_amount := new_subtotal * 0.10;
    new_total_amount := new_subtotal + new_tax_amount;
    
    -- Update the purchase order
    UPDATE purchase_orders
    SET subtotal = new_subtotal,
        tax_amount = new_tax_amount,
        total_amount = new_total_amount
    WHERE id = po_id;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_purchase_order_totals
    AFTER INSERT OR UPDATE OR DELETE ON purchase_order_items
    FOR EACH ROW
    EXECUTE FUNCTION update_purchase_order_totals();

-- Insert sample data for testing
INSERT INTO purchase_orders (po_number, supplier_id, order_date, expected_delivery_date, delivery_address, payment_terms, created_by_user_id) VALUES
('PO2025000001', 1, CURRENT_DATE, CURRENT_DATE + INTERVAL '7 days', '{"street": "123 Main St", "city": "San Francisco", "state": "CA", "zip": "94105"}', 'Net 30', 1),
('PO2025000002', 2, CURRENT_DATE, CURRENT_DATE + INTERVAL '14 days', '{"street": "456 Business Ave", "city": "New York", "state": "NY", "zip": "10001"}', 'Net 15', 1),
('PO2025000003', 3, CURRENT_DATE, CURRENT_DATE + INTERVAL '21 days', '{"street": "789 Industrial Blvd", "city": "Chicago", "state": "IL", "zip": "60601"}', 'Net 45', 1);