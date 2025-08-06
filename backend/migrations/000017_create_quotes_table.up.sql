-- Create quotes table according to PRD 3.5.3
CREATE TABLE quotes (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    quote_number VARCHAR(32) UNIQUE NOT NULL,
    customer_id BIGINT NOT NULL,
    business_unit_id BIGINT,
    status VARCHAR(16) DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'approved', 'rejected', 'expired', 'converted')),
    user_id BIGINT,
    quote_date DATE NOT NULL,
    expiry_date DATE,
    total_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
    currency_id BIGINT,
    notes TEXT,
    terms_and_conditions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    CONSTRAINT fk_quotes_customer_id FOREIGN KEY (customer_id) REFERENCES customers(id),
    CONSTRAINT fk_quotes_business_unit_id FOREIGN KEY (business_unit_id) REFERENCES business_units(id),
    CONSTRAINT fk_quotes_user_id FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_quotes_currency_id FOREIGN KEY (currency_id) REFERENCES currencies(id)
);

-- Create quote_items table
CREATE TABLE quote_items (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    quote_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    quantity NUMERIC(12,2) NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(12,2) NOT NULL,
    total_price NUMERIC(14,2) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    CONSTRAINT fk_quote_items_quote_id FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE,
    CONSTRAINT fk_quote_items_product_id FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Create indexes for better performance
CREATE INDEX idx_quotes_quote_number ON quotes(quote_number);
CREATE INDEX idx_quotes_customer_id ON quotes(customer_id);
CREATE INDEX idx_quotes_status ON quotes(status);
CREATE INDEX idx_quotes_quote_date ON quotes(quote_date);
CREATE INDEX idx_quotes_expiry_date ON quotes(expiry_date);
CREATE INDEX idx_quotes_user_id ON quotes(user_id);
CREATE INDEX idx_quotes_business_unit_id ON quotes(business_unit_id);
CREATE INDEX idx_quotes_currency_id ON quotes(currency_id);

CREATE INDEX idx_quote_items_quote_id ON quote_items(quote_id);
CREATE INDEX idx_quote_items_product_id ON quote_items(product_id);

-- Create trigger for updated_at on quotes
CREATE TRIGGER update_quotes_updated_at
    BEFORE UPDATE ON quotes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for updated_at on quote_items  
CREATE TRIGGER update_quote_items_updated_at
    BEFORE UPDATE ON quote_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to generate unique quote numbers
CREATE OR REPLACE FUNCTION generate_quote_number()
RETURNS VARCHAR(32) AS $$
DECLARE
    new_quote_number VARCHAR(32);
    year_part VARCHAR(4);
    sequence_part VARCHAR(6);
BEGIN
    year_part := EXTRACT(YEAR FROM CURRENT_DATE)::VARCHAR;
    
    -- Get the next sequence number for this year
    SELECT COALESCE(MAX(CAST(SUBSTRING(quote_number FROM 6) AS INTEGER)), 0) + 1
    INTO sequence_part
    FROM quotes
    WHERE quote_number LIKE 'QT' || year_part || '%';
    
    new_quote_number := 'QT' || year_part || LPAD(sequence_part::VARCHAR, 6, '0');
    
    RETURN new_quote_number;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate quote numbers
CREATE OR REPLACE FUNCTION auto_generate_quote_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.quote_number IS NULL OR NEW.quote_number = '' THEN
        NEW.quote_number := generate_quote_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_generate_quote_number
    BEFORE INSERT ON quotes
    FOR EACH ROW
    EXECUTE FUNCTION auto_generate_quote_number();

-- Create function to update quote totals when items change
CREATE OR REPLACE FUNCTION update_quote_totals()
RETURNS TRIGGER AS $$
DECLARE
    new_total_amount DECIMAL(14,2);
    quote_id_val BIGINT;
BEGIN
    -- Get the quote ID
    IF TG_OP = 'DELETE' THEN
        quote_id_val := OLD.quote_id;
    ELSE
        quote_id_val := NEW.quote_id;
    END IF;
    
    -- Calculate new total amount
    SELECT COALESCE(SUM(total_price), 0)
    INTO new_total_amount
    FROM quote_items
    WHERE quote_id = quote_id_val;
    
    -- Update the quote
    UPDATE quotes
    SET total_amount = new_total_amount
    WHERE id = quote_id_val;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_quote_totals
    AFTER INSERT OR UPDATE OR DELETE ON quote_items
    FOR EACH ROW
    EXECUTE FUNCTION update_quote_totals();

-- Add comments for documentation
COMMENT ON TABLE quotes IS 'Sales quotes that can be converted to sales orders according to PRD 3.5.3';
COMMENT ON TABLE quote_items IS 'Line items for quotes according to PRD 3.5.3';

COMMENT ON COLUMN quotes.status IS 'Quote status: draft, pending, approved, rejected, expired, converted';