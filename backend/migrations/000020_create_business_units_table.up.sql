-- Create business_units table according to database repair specification
CREATE TABLE IF NOT EXISTS business_units (
    id BIGSERIAL PRIMARY KEY,
    company_id BIGINT NOT NULL,
    parent_id BIGINT,
    name VARCHAR(128) NOT NULL,
    display_name VARCHAR(128),
    description TEXT,
    type VARCHAR(32) DEFAULT 'department',
    code VARCHAR(32),
    email VARCHAR(128),
    phone VARCHAR(32),
    address JSONB,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    settings JSONB,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    -- Foreign key constraints
    CONSTRAINT fk_business_units_company_id FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    CONSTRAINT fk_business_units_parent_id FOREIGN KEY (parent_id) REFERENCES business_units(id) ON DELETE SET NULL,
    
    -- Unique constraints
    CONSTRAINT uk_business_units_company_name UNIQUE (company_id, name, deleted_at),
    CONSTRAINT uk_business_units_company_code UNIQUE (company_id, code, deleted_at)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_business_units_company_id ON business_units(company_id);
CREATE INDEX IF NOT EXISTS idx_business_units_parent_id ON business_units(parent_id);
CREATE INDEX IF NOT EXISTS idx_business_units_active ON business_units(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_business_units_type ON business_units(type);

-- Create trigger for updated_at
CREATE TRIGGER update_business_units_updated_at
    BEFORE UPDATE ON business_units
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default business unit
INSERT INTO business_units (company_id, name, display_name, type) VALUES 
    (1, 'Default Unit', 'Default Business Unit', 'headquarters')
ON CONFLICT DO NOTHING;

-- Add comments for documentation
COMMENT ON TABLE business_units IS 'Business units within companies for organizational structure';
COMMENT ON COLUMN business_units.type IS 'Business unit type: department, division, branch, headquarters, subsidiary';