-- Create marketplace suppliers table
CREATE TABLE IF NOT EXISTS marketplace_suppliers (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT,
    company_name VARCHAR(255) NOT NULL,
    business_registration_number VARCHAR(100) UNIQUE,
    tax_id VARCHAR(50),
    contact_person_name VARCHAR(100) NOT NULL,
    contact_email VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(20),
    business_address TEXT,
    billing_address TEXT,
    website_url VARCHAR(500),
    business_type VARCHAR(50), -- manufacturer, distributor, retailer, service_provider
    business_category VARCHAR(100),
    description TEXT,
    established_year INTEGER,
    employee_count_range VARCHAR(20), -- 1-10, 11-50, 51-200, 200+
    annual_revenue_range VARCHAR(20), -- <1M, 1M-10M, 10M-100M, 100M+
    payment_terms TEXT,
    delivery_capabilities TEXT,
    certifications TEXT, -- JSON array of certifications
    profile_image_url VARCHAR(500),
    cover_image_url VARCHAR(500),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'suspended', 'inactive')),
    approval_date TIMESTAMP WITH TIME ZONE,
    approved_by BIGINT, -- admin user who approved
    rejection_reason TEXT,
    last_activity_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT fk_marketplace_suppliers_user_id 
        FOREIGN KEY (user_id) 
        REFERENCES users(id) 
        ON DELETE SET NULL,
        
    CONSTRAINT fk_marketplace_suppliers_approved_by 
        FOREIGN KEY (approved_by) 
        REFERENCES users(id) 
        ON DELETE SET NULL
);

-- Create marketplace categories table
CREATE TABLE IF NOT EXISTS marketplace_categories (
    id BIGSERIAL PRIMARY KEY,
    parent_id BIGINT,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    icon_url VARCHAR(500),
    banner_url VARCHAR(500),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    meta_title VARCHAR(200),
    meta_description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    CONSTRAINT fk_marketplace_categories_parent_id 
        FOREIGN KEY (parent_id) 
        REFERENCES marketplace_categories(id) 
        ON DELETE SET NULL
);

-- Create marketplace products table
CREATE TABLE IF NOT EXISTS marketplace_products (
    id BIGSERIAL PRIMARY KEY,
    supplier_id BIGINT NOT NULL,
    category_id BIGINT,
    internal_product_id BIGINT, -- Link to internal products table if applicable
    sku VARCHAR(100),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    short_description TEXT,
    description TEXT,
    specifications TEXT, -- JSON format for structured specs
    brand VARCHAR(100),
    model VARCHAR(100),
    unit_of_measure VARCHAR(20),
    minimum_order_quantity INTEGER DEFAULT 1,
    maximum_order_quantity INTEGER,
    lead_time_days INTEGER,
    weight_kg DECIMAL(10,3),
    dimensions_cm VARCHAR(50), -- "L x W x H" format
    origin_country VARCHAR(2), -- ISO country code
    certifications TEXT, -- JSON array
    warranty_info TEXT,
    
    -- Pricing
    price DECIMAL(12,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'TWD',
    discount_percentage DECIMAL(5,2) DEFAULT 0,
    price_tier_1_qty INTEGER, -- Bulk pricing tiers
    price_tier_1_price DECIMAL(12,2),
    price_tier_2_qty INTEGER,
    price_tier_2_price DECIMAL(12,2),
    price_tier_3_qty INTEGER,
    price_tier_3_price DECIMAL(12,2),
    
    -- Stock
    stock_quantity INTEGER DEFAULT 0,
    low_stock_threshold INTEGER DEFAULT 10,
    stock_status VARCHAR(20) DEFAULT 'in_stock' CHECK (stock_status IN ('in_stock', 'low_stock', 'out_of_stock', 'discontinued')),
    
    -- SEO and metadata
    meta_title VARCHAR(200),
    meta_description TEXT,
    keywords TEXT,
    
    -- Status and flags
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_review', 'approved', 'rejected', 'inactive')),
    is_featured BOOLEAN DEFAULT false,
    is_new_arrival BOOLEAN DEFAULT false,
    is_bestseller BOOLEAN DEFAULT false,
    featured_until TIMESTAMP WITH TIME ZONE,
    
    -- Analytics
    view_count INTEGER DEFAULT 0,
    inquiry_count INTEGER DEFAULT 0,
    order_count INTEGER DEFAULT 0,
    last_viewed_at TIMESTAMP WITH TIME ZONE,
    
    -- Approval workflow
    approved_date TIMESTAMP WITH TIME ZONE,
    approved_by BIGINT,
    rejection_reason TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT fk_marketplace_products_supplier_id 
        FOREIGN KEY (supplier_id) 
        REFERENCES marketplace_suppliers(id) 
        ON DELETE CASCADE,
        
    CONSTRAINT fk_marketplace_products_category_id 
        FOREIGN KEY (category_id) 
        REFERENCES marketplace_categories(id) 
        ON DELETE SET NULL,
        
    CONSTRAINT fk_marketplace_products_internal_product_id 
        FOREIGN KEY (internal_product_id) 
        REFERENCES products(id) 
        ON DELETE SET NULL,
        
    CONSTRAINT fk_marketplace_products_approved_by 
        FOREIGN KEY (approved_by) 
        REFERENCES users(id) 
        ON DELETE SET NULL
);

-- Create marketplace product images table
CREATE TABLE IF NOT EXISTS marketplace_product_images (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    alt_text VARCHAR(255),
    sort_order INTEGER DEFAULT 0,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    CONSTRAINT fk_marketplace_product_images_product_id 
        FOREIGN KEY (product_id) 
        REFERENCES marketplace_products(id) 
        ON DELETE CASCADE
);

-- Create marketplace inquiries table (for buyer inquiries to suppliers)
CREATE TABLE IF NOT EXISTS marketplace_inquiries (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL,
    supplier_id BIGINT NOT NULL,
    buyer_user_id BIGINT,
    buyer_name VARCHAR(100) NOT NULL,
    buyer_email VARCHAR(255) NOT NULL,
    buyer_phone VARCHAR(20),
    buyer_company VARCHAR(255),
    message TEXT NOT NULL,
    quantity INTEGER,
    target_price DECIMAL(12,2),
    delivery_date DATE,
    status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new', 'responded', 'quoted', 'converted', 'closed')),
    supplier_response TEXT,
    responded_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    CONSTRAINT fk_marketplace_inquiries_product_id 
        FOREIGN KEY (product_id) 
        REFERENCES marketplace_products(id) 
        ON DELETE CASCADE,
        
    CONSTRAINT fk_marketplace_inquiries_supplier_id 
        FOREIGN KEY (supplier_id) 
        REFERENCES marketplace_suppliers(id) 
        ON DELETE CASCADE,
        
    CONSTRAINT fk_marketplace_inquiries_buyer_user_id 
        FOREIGN KEY (buyer_user_id) 
        REFERENCES users(id) 
        ON DELETE SET NULL
);

-- Create marketplace reviews table
CREATE TABLE IF NOT EXISTS marketplace_reviews (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL,
    supplier_id BIGINT NOT NULL,
    reviewer_user_id BIGINT,
    reviewer_name VARCHAR(100) NOT NULL,
    reviewer_email VARCHAR(255),
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    title VARCHAR(255),
    review_text TEXT,
    is_verified_purchase BOOLEAN DEFAULT false,
    order_id BIGINT, -- Reference to actual order if available
    helpful_count INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'hidden')),
    moderated_by BIGINT,
    moderated_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    CONSTRAINT fk_marketplace_reviews_product_id 
        FOREIGN KEY (product_id) 
        REFERENCES marketplace_products(id) 
        ON DELETE CASCADE,
        
    CONSTRAINT fk_marketplace_reviews_supplier_id 
        FOREIGN KEY (supplier_id) 
        REFERENCES marketplace_suppliers(id) 
        ON DELETE CASCADE,
        
    CONSTRAINT fk_marketplace_reviews_reviewer_user_id 
        FOREIGN KEY (reviewer_user_id) 
        REFERENCES users(id) 
        ON DELETE SET NULL,
        
    CONSTRAINT fk_marketplace_reviews_moderated_by 
        FOREIGN KEY (moderated_by) 
        REFERENCES users(id) 
        ON DELETE SET NULL
);

-- Create marketplace supplier documents table
CREATE TABLE IF NOT EXISTS marketplace_supplier_documents (
    id BIGSERIAL PRIMARY KEY,
    supplier_id BIGINT NOT NULL,
    document_type VARCHAR(50) NOT NULL, -- business_license, tax_certificate, bank_statement, etc.
    document_name VARCHAR(255) NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    is_verified BOOLEAN DEFAULT false,
    verified_by BIGINT,
    verified_at TIMESTAMP WITH TIME ZONE,
    expiry_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    CONSTRAINT fk_marketplace_supplier_documents_supplier_id 
        FOREIGN KEY (supplier_id) 
        REFERENCES marketplace_suppliers(id) 
        ON DELETE CASCADE,
        
    CONSTRAINT fk_marketplace_supplier_documents_verified_by 
        FOREIGN KEY (verified_by) 
        REFERENCES users(id) 
        ON DELETE SET NULL
);

-- Create indexes for performance
CREATE INDEX idx_marketplace_suppliers_status ON marketplace_suppliers(status);
CREATE INDEX idx_marketplace_suppliers_user_id ON marketplace_suppliers(user_id);
CREATE INDEX idx_marketplace_suppliers_business_type ON marketplace_suppliers(business_type);
CREATE INDEX idx_marketplace_suppliers_business_category ON marketplace_suppliers(business_category);
CREATE INDEX idx_marketplace_suppliers_approval_date ON marketplace_suppliers(approval_date);
CREATE INDEX idx_marketplace_suppliers_last_activity ON marketplace_suppliers(last_activity_date);
CREATE INDEX idx_marketplace_suppliers_deleted_at ON marketplace_suppliers(deleted_at);

CREATE INDEX idx_marketplace_categories_parent_id ON marketplace_categories(parent_id);
CREATE INDEX idx_marketplace_categories_slug ON marketplace_categories(slug);
CREATE INDEX idx_marketplace_categories_is_active ON marketplace_categories(is_active);
CREATE INDEX idx_marketplace_categories_sort_order ON marketplace_categories(sort_order);

CREATE INDEX idx_marketplace_products_supplier_id ON marketplace_products(supplier_id);
CREATE INDEX idx_marketplace_products_category_id ON marketplace_products(category_id);
CREATE INDEX idx_marketplace_products_status ON marketplace_products(status);
CREATE INDEX idx_marketplace_products_stock_status ON marketplace_products(stock_status);
CREATE INDEX idx_marketplace_products_is_featured ON marketplace_products(is_featured);
CREATE INDEX idx_marketplace_products_price ON marketplace_products(price);
CREATE INDEX idx_marketplace_products_created_at ON marketplace_products(created_at);
CREATE INDEX idx_marketplace_products_slug ON marketplace_products(slug);
CREATE INDEX idx_marketplace_products_sku ON marketplace_products(sku);
CREATE INDEX idx_marketplace_products_deleted_at ON marketplace_products(deleted_at);

-- Composite indexes for common queries
CREATE INDEX idx_marketplace_products_status_featured ON marketplace_products(status, is_featured, created_at);
CREATE INDEX idx_marketplace_products_supplier_status ON marketplace_products(supplier_id, status);
CREATE INDEX idx_marketplace_products_category_status ON marketplace_products(category_id, status, created_at);

CREATE INDEX idx_marketplace_product_images_product_id ON marketplace_product_images(product_id);
CREATE INDEX idx_marketplace_product_images_sort_order ON marketplace_product_images(product_id, sort_order);
CREATE INDEX idx_marketplace_product_images_primary ON marketplace_product_images(product_id, is_primary);

CREATE INDEX idx_marketplace_inquiries_product_id ON marketplace_inquiries(product_id);
CREATE INDEX idx_marketplace_inquiries_supplier_id ON marketplace_inquiries(supplier_id);
CREATE INDEX idx_marketplace_inquiries_buyer_user_id ON marketplace_inquiries(buyer_user_id);
CREATE INDEX idx_marketplace_inquiries_status ON marketplace_inquiries(status);
CREATE INDEX idx_marketplace_inquiries_created_at ON marketplace_inquiries(created_at);

CREATE INDEX idx_marketplace_reviews_product_id ON marketplace_reviews(product_id);
CREATE INDEX idx_marketplace_reviews_supplier_id ON marketplace_reviews(supplier_id);
CREATE INDEX idx_marketplace_reviews_status ON marketplace_reviews(status);
CREATE INDEX idx_marketplace_reviews_rating ON marketplace_reviews(rating);
CREATE INDEX idx_marketplace_reviews_created_at ON marketplace_reviews(created_at);

CREATE INDEX idx_marketplace_supplier_documents_supplier_id ON marketplace_supplier_documents(supplier_id);
CREATE INDEX idx_marketplace_supplier_documents_type ON marketplace_supplier_documents(document_type);
CREATE INDEX idx_marketplace_supplier_documents_verified ON marketplace_supplier_documents(is_verified);
CREATE INDEX idx_marketplace_supplier_documents_expiry ON marketplace_supplier_documents(expiry_date);

-- Create function to update updated_at timestamp for marketplace tables
CREATE OR REPLACE FUNCTION update_marketplace_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update updated_at
CREATE TRIGGER trigger_marketplace_suppliers_updated_at
    BEFORE UPDATE ON marketplace_suppliers
    FOR EACH ROW
    EXECUTE FUNCTION update_marketplace_updated_at();

CREATE TRIGGER trigger_marketplace_categories_updated_at
    BEFORE UPDATE ON marketplace_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_marketplace_updated_at();

CREATE TRIGGER trigger_marketplace_products_updated_at
    BEFORE UPDATE ON marketplace_products
    FOR EACH ROW
    EXECUTE FUNCTION update_marketplace_updated_at();

CREATE TRIGGER trigger_marketplace_inquiries_updated_at
    BEFORE UPDATE ON marketplace_inquiries
    FOR EACH ROW
    EXECUTE FUNCTION update_marketplace_updated_at();

CREATE TRIGGER trigger_marketplace_reviews_updated_at
    BEFORE UPDATE ON marketplace_reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_marketplace_updated_at();

CREATE TRIGGER trigger_marketplace_supplier_documents_updated_at
    BEFORE UPDATE ON marketplace_supplier_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_marketplace_updated_at();

-- Create function to update product view count
CREATE OR REPLACE FUNCTION update_product_view_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE marketplace_products 
    SET view_count = view_count + 1, 
        last_viewed_at = NOW()
    WHERE id = NEW.product_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Insert default marketplace categories
INSERT INTO marketplace_categories (name, slug, description, sort_order) VALUES
('電子產品', 'electronics', '電子設備、元件及相關產品', 1),
('機械設備', 'machinery', '工業機械、設備及零件', 2),
('化工材料', 'chemicals', '化學原料、添加劑及相關材料', 3),
('紡織服裝', 'textiles', '紡織品、服裝及配件', 4),
('食品飲料', 'food-beverages', '食品、飲料及相關產品', 5),
('建築材料', 'construction', '建築、裝修及相關材料', 6),
('汽車配件', 'automotive', '汽車、摩托車及相關配件', 7),
('家居用品', 'home-garden', '家具、家居裝飾及園藝用品', 8),
('辦公用品', 'office-supplies', '辦公設備、文具及相關用品', 9),
('醫療保健', 'healthcare', '醫療設備、保健品及相關產品', 10)
ON CONFLICT (slug) DO NOTHING;

-- Add comments for documentation
COMMENT ON TABLE marketplace_suppliers IS 'Marketplace supplier profiles and company information';
COMMENT ON TABLE marketplace_categories IS 'Product categories for marketplace organization';
COMMENT ON TABLE marketplace_products IS 'Products listed by suppliers on the marketplace';
COMMENT ON TABLE marketplace_product_images IS 'Product images with ordering and primary flag';
COMMENT ON TABLE marketplace_inquiries IS 'Buyer inquiries and supplier responses';
COMMENT ON TABLE marketplace_reviews IS 'Product and supplier reviews by buyers';
COMMENT ON TABLE marketplace_supplier_documents IS 'Supplier verification documents and certificates';