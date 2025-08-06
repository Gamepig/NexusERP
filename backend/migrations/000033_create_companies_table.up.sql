-- Create companies table according to database repair specification
CREATE TABLE IF NOT EXISTS companies (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    display_name VARCHAR(128),
    registration_number VARCHAR(64) UNIQUE,
    tax_number VARCHAR(64) UNIQUE,
    email VARCHAR(128),
    phone VARCHAR(32),
    website VARCHAR(256),
    address JSONB,
    industry VARCHAR(64),
    size VARCHAR(32),
    currency_code VARCHAR(8) DEFAULT 'USD',
    timezone VARCHAR(64) DEFAULT 'UTC',
    locale VARCHAR(16) DEFAULT 'en',
    is_active BOOLEAN DEFAULT true,
    settings JSONB,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_companies_name ON companies(name);
CREATE INDEX IF NOT EXISTS idx_companies_active ON companies(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_companies_registration_number ON companies(registration_number) WHERE registration_number IS NOT NULL;

-- Create trigger for updated_at
CREATE TRIGGER update_companies_updated_at
    BEFORE UPDATE ON companies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default company
INSERT INTO companies (name, display_name, registration_number) VALUES 
    ('Default Company', 'Default Company', 'DEFAULT001')
ON CONFLICT (registration_number) DO NOTHING;

-- Add comments for documentation
COMMENT ON TABLE companies IS 'Company entities for multi-company support';
COMMENT ON COLUMN companies.size IS 'Company size: small, medium, large, enterprise';
COMMENT ON COLUMN companies.currency_code IS 'Default currency code for the company';