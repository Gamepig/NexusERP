-- Create suppliers table
CREATE TABLE suppliers (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    address JSONB,
    tax_number VARCHAR(50),
    payment_terms VARCHAR(255),
    credit_limit DECIMAL(15,2),
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster lookups
CREATE INDEX idx_suppliers_code ON suppliers(code);
CREATE INDEX idx_suppliers_name ON suppliers(name);
CREATE INDEX idx_suppliers_email ON suppliers(email);
CREATE INDEX idx_suppliers_is_active ON suppliers(is_active);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_suppliers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_suppliers_updated_at
    BEFORE UPDATE ON suppliers
    FOR EACH ROW
    EXECUTE FUNCTION update_suppliers_updated_at();

-- Insert default suppliers for testing
INSERT INTO suppliers (code, name, contact_person, email, phone, address, payment_terms, is_active) VALUES
('SUP001', 'TechCorp Industries', 'John Smith', 'john@techcorp.com', '+1-555-0101', '{"street": "123 Tech St", "city": "San Francisco", "state": "CA", "zip": "94105"}', 'Net 30', TRUE),
('SUP002', 'Office Supplies Co.', 'Jane Doe', 'jane@officesupplies.com', '+1-555-0102', '{"street": "456 Business Ave", "city": "New York", "state": "NY", "zip": "10001"}', 'Net 15', TRUE),
('SUP003', 'Global Manufacturing', 'Bob Johnson', 'bob@globalmanuf.com', '+1-555-0103', '{"street": "789 Industrial Blvd", "city": "Chicago", "state": "IL", "zip": "60601"}', 'Net 45', TRUE);

-- Add foreign key constraint to products table if it doesn't exist
-- This will ensure referential integrity between products and suppliers
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_products_supplier_id'
    ) THEN
        ALTER TABLE products 
        ADD CONSTRAINT fk_products_supplier_id 
        FOREIGN KEY (supplier_id) REFERENCES suppliers(id);
    END IF;
END $$;