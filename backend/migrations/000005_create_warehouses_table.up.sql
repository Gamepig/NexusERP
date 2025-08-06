-- Create warehouses table
CREATE TABLE IF NOT EXISTS warehouses (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(32) UNIQUE NOT NULL,
    address JSONB, -- {street: '', city: '', state: '', postal_code: '', country: ''}
    contact_info JSONB, -- {phone: '', email: '', manager: ''}
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for warehouse code lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_warehouses_code ON warehouses(code);

-- Create index for active warehouses
CREATE INDEX IF NOT EXISTS idx_warehouses_active ON warehouses(is_active) WHERE is_active = true;

-- Create index for name searches
CREATE INDEX IF NOT EXISTS idx_warehouses_name ON warehouses(name);

-- Create trigger for updated_at
CREATE TRIGGER update_warehouses_updated_at
    BEFORE UPDATE ON warehouses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default warehouse
INSERT INTO warehouses (name, code, address, contact_info) VALUES 
    ('Main Warehouse', 'MAIN', 
     '{"street": "123 Main St", "city": "Business City", "state": "State", "postal_code": "12345", "country": "Country"}',
     '{"phone": "+1-555-0123", "email": "warehouse@company.com", "manager": "Warehouse Manager"}'
    )
ON CONFLICT (code) DO NOTHING;