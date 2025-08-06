-- Create sales_orders table according to database_spec.md
CREATE TABLE sales_orders (
    id BIGSERIAL PRIMARY KEY,
    order_number VARCHAR(32) UNIQUE NOT NULL,
    customer_id BIGINT NOT NULL,
    business_unit_id BIGINT,
    status VARCHAR(16) DEFAULT 'draft' CHECK (status IN ('draft', 'processing', 'shipped', 'completed', 'cancelled')),
    user_id BIGINT,
    order_date DATE NOT NULL,
    total_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
    currency_id BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    CONSTRAINT fk_sales_orders_customer_id FOREIGN KEY (customer_id) REFERENCES customers(id),
    CONSTRAINT fk_sales_orders_business_unit_id FOREIGN KEY (business_unit_id) REFERENCES business_units(id),
    CONSTRAINT fk_sales_orders_user_id FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_sales_orders_currency_id FOREIGN KEY (currency_id) REFERENCES currencies(id)
);

-- Create sales_order_items table according to database_spec.md
CREATE TABLE sales_order_items (
    id BIGSERIAL PRIMARY KEY,
    sales_order_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    quantity NUMERIC(12,2) NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(12,2) NOT NULL,
    total_price NUMERIC(14,2) NOT NULL,
    status VARCHAR(16) DEFAULT 'draft' CHECK (status IN ('draft', 'processing', 'shipped', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    CONSTRAINT fk_sales_order_items_sales_order_id FOREIGN KEY (sales_order_id) REFERENCES sales_orders(id) ON DELETE CASCADE,
    CONSTRAINT fk_sales_order_items_product_id FOREIGN KEY (product_id) REFERENCES products(id)
);


-- Create indexes for better performance
CREATE INDEX idx_sales_orders_order_number ON sales_orders(order_number);
CREATE INDEX idx_sales_orders_customer_id ON sales_orders(customer_id);
CREATE INDEX idx_sales_orders_status ON sales_orders(status);
CREATE INDEX idx_sales_orders_order_date ON sales_orders(order_date);
CREATE INDEX idx_sales_orders_user_id ON sales_orders(user_id);
CREATE INDEX idx_sales_orders_business_unit_id ON sales_orders(business_unit_id);
CREATE INDEX idx_sales_orders_currency_id ON sales_orders(currency_id);

CREATE INDEX idx_sales_order_items_sales_order_id ON sales_order_items(sales_order_id);
CREATE INDEX idx_sales_order_items_product_id ON sales_order_items(product_id);
CREATE INDEX idx_sales_order_items_status ON sales_order_items(status);

-- Create trigger for updated_at on sales_orders
CREATE TRIGGER update_sales_orders_updated_at
    BEFORE UPDATE ON sales_orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for updated_at on sales_order_items  
CREATE TRIGGER update_sales_order_items_updated_at
    BEFORE UPDATE ON sales_order_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to generate unique SO numbers
CREATE OR REPLACE FUNCTION generate_so_number()
RETURNS VARCHAR(32) AS $$
DECLARE
    new_so_number VARCHAR(32);
    year_part VARCHAR(4);
    sequence_part VARCHAR(6);
BEGIN
    year_part := EXTRACT(YEAR FROM CURRENT_DATE)::VARCHAR;
    
    -- Get the next sequence number for this year
    SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM 6) AS INTEGER)), 0) + 1
    INTO sequence_part
    FROM sales_orders
    WHERE order_number LIKE 'SO' || year_part || '%';
    
    new_so_number := 'SO' || year_part || LPAD(sequence_part::VARCHAR, 6, '0');
    
    RETURN new_so_number;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate SO numbers
CREATE OR REPLACE FUNCTION auto_generate_so_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
        NEW.order_number := generate_so_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_generate_so_number
    BEFORE INSERT ON sales_orders
    FOR EACH ROW
    EXECUTE FUNCTION auto_generate_so_number();


-- Create function to update sales order totals when items change
CREATE OR REPLACE FUNCTION update_sales_order_totals()
RETURNS TRIGGER AS $$
DECLARE
    new_total_amount DECIMAL(14,2);
    so_id BIGINT;
BEGIN
    -- Get the sales order ID
    IF TG_OP = 'DELETE' THEN
        so_id := OLD.sales_order_id;
    ELSE
        so_id := NEW.sales_order_id;
    END IF;
    
    -- Calculate new total amount
    SELECT COALESCE(SUM(total_price), 0)
    INTO new_total_amount
    FROM sales_order_items
    WHERE sales_order_id = so_id;
    
    -- Update the sales order
    UPDATE sales_orders
    SET total_amount = new_total_amount
    WHERE id = so_id;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_sales_order_totals
    AFTER INSERT OR UPDATE OR DELETE ON sales_order_items
    FOR EACH ROW
    EXECUTE FUNCTION update_sales_order_totals();


-- Sample data insertion removed - will be added via application or seeder scripts

-- Add comments for documentation
COMMENT ON TABLE sales_orders IS 'Sales orders from customers according to database_spec.md';
COMMENT ON TABLE sales_order_items IS 'Line items for sales orders according to database_spec.md';

COMMENT ON COLUMN sales_orders.status IS 'Order status: draft, processing, shipped, completed, cancelled';
COMMENT ON COLUMN sales_order_items.status IS 'Item status: draft, processing, shipped, completed, cancelled';