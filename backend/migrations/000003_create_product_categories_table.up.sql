-- Create product_categories table
CREATE TABLE IF NOT EXISTS product_categories (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    parent_category_id BIGINT REFERENCES product_categories(id) ON DELETE SET NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for parent category lookups
CREATE INDEX IF NOT EXISTS idx_product_categories_parent_id ON product_categories(parent_category_id);

-- Create index for active categories
CREATE INDEX IF NOT EXISTS idx_product_categories_active ON product_categories(is_active) WHERE is_active = true;

-- Create index for name searches
CREATE INDEX IF NOT EXISTS idx_product_categories_name ON product_categories(name);

-- Create trigger for updated_at
CREATE TRIGGER update_product_categories_updated_at
    BEFORE UPDATE ON product_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default categories
INSERT INTO product_categories (name, description) VALUES 
    ('General', 'General product category'),
    ('Electronics', 'Electronic products and components'),
    ('Office Supplies', 'Office and business supplies'),
    ('Raw Materials', 'Raw materials and components'),
    ('Finished Goods', 'Finished products ready for sale')
ON CONFLICT DO NOTHING;