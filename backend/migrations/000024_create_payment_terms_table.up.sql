-- Create payment_terms table for standardized payment terms management
CREATE TABLE IF NOT EXISTS payment_terms (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(32) UNIQUE NOT NULL,
    name VARCHAR(128) NOT NULL,
    description TEXT,
    days_due INTEGER NOT NULL,
    discount_percentage NUMERIC(5,2) DEFAULT 0.00,
    discount_days INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payment_terms_code ON payment_terms(code);
CREATE INDEX IF NOT EXISTS idx_payment_terms_active ON payment_terms(is_active) WHERE is_active = true;

-- Create trigger for updated_at
CREATE TRIGGER update_payment_terms_updated_at
    BEFORE UPDATE ON payment_terms
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default payment terms
INSERT INTO payment_terms (code, name, description, days_due, discount_percentage, discount_days) VALUES 
    ('COD', 'Cash on Delivery', 'Payment due upon delivery', 0, 0.00, 0),
    ('NET15', 'Net 15', 'Payment due within 15 days', 15, 0.00, 0),
    ('NET30', 'Net 30', 'Payment due within 30 days', 30, 0.00, 0),
    ('NET45', 'Net 45', 'Payment due within 45 days', 45, 0.00, 0),
    ('NET60', 'Net 60', 'Payment due within 60 days', 60, 0.00, 0),
    ('2/10NET30', '2/10 Net 30', '2% discount if paid within 10 days, otherwise due in 30', 30, 2.00, 10)
ON CONFLICT (code) DO NOTHING;

-- Add comments for documentation
COMMENT ON TABLE payment_terms IS 'Standardized payment terms for purchase orders and invoices';
COMMENT ON COLUMN payment_terms.discount_percentage IS 'Early payment discount percentage (0.00-100.00)';
COMMENT ON COLUMN payment_terms.discount_days IS 'Number of days within which discount applies';