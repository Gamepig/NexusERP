-- Create user_companies table for user-company relationships
CREATE TABLE IF NOT EXISTS user_companies (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    company_id BIGINT NOT NULL,
    is_primary BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    left_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    CONSTRAINT fk_user_companies_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_companies_company_id FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    
    -- Unique constraints
    CONSTRAINT uk_user_companies UNIQUE (user_id, company_id)
);

-- Create user_business_units table for user-business unit relationships
CREATE TABLE IF NOT EXISTS user_business_units (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    business_unit_id BIGINT NOT NULL,
    is_primary BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    left_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    CONSTRAINT fk_user_business_units_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_business_units_business_unit_id FOREIGN KEY (business_unit_id) REFERENCES business_units(id) ON DELETE CASCADE,
    
    -- Unique constraints
    CONSTRAINT uk_user_business_units UNIQUE (user_id, business_unit_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_companies_user_id ON user_companies(user_id);
CREATE INDEX IF NOT EXISTS idx_user_companies_company_id ON user_companies(company_id);
CREATE INDEX IF NOT EXISTS idx_user_companies_primary ON user_companies(is_primary) WHERE is_primary = true;

CREATE INDEX IF NOT EXISTS idx_user_business_units_user_id ON user_business_units(user_id);
CREATE INDEX IF NOT EXISTS idx_user_business_units_business_unit_id ON user_business_units(business_unit_id);
CREATE INDEX IF NOT EXISTS idx_user_business_units_primary ON user_business_units(is_primary) WHERE is_primary = true;

-- Create triggers for updated_at
CREATE TRIGGER update_user_companies_updated_at
    BEFORE UPDATE ON user_companies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_business_units_updated_at
    BEFORE UPDATE ON user_business_units
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE user_companies IS 'Many-to-many relationship between users and companies';
COMMENT ON TABLE user_business_units IS 'Many-to-many relationship between users and business units';