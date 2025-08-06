-- Create products table
CREATE TABLE IF NOT EXISTS products (
    id BIGSERIAL PRIMARY KEY,
    sku VARCHAR(128) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category_id BIGINT REFERENCES product_categories(id) ON DELETE SET NULL,
    unit_of_measure VARCHAR(32) DEFAULT 'pcs',
    weight DECIMAL(10,3),
    dimensions JSONB, -- {length: 0, width: 0, height: 0, unit: 'cm'}
    cost_price DECIMAL(12,2),
    selling_price DECIMAL(12,2),
    barcode VARCHAR(128),
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    attributes JSONB, -- Additional product attributes
    supplier_id BIGINT, -- Will be linked to suppliers table in future
    reorder_point INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for SKU lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_sku ON products(sku);

-- Create index for category lookups
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);

-- Create index for active products
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active) WHERE is_active = true;

-- Create index for name searches
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);

-- Create index for barcode lookups
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode) WHERE barcode IS NOT NULL;

-- Create index for supplier lookups
CREATE INDEX IF NOT EXISTS idx_products_supplier_id ON products(supplier_id) WHERE supplier_id IS NOT NULL;

-- Create trigger for updated_at
CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();