-- Create currencies table for standardized currency management
CREATE TABLE IF NOT EXISTS currencies (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(8) UNIQUE NOT NULL,
    name VARCHAR(64) NOT NULL,
    symbol VARCHAR(8),
    decimal_places INTEGER DEFAULT 2,
    exchange_rate NUMERIC(12,6) DEFAULT 1.000000,
    is_base BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_currencies_code ON currencies(code);
CREATE INDEX IF NOT EXISTS idx_currencies_active ON currencies(is_active) WHERE is_active = true;
CREATE UNIQUE INDEX IF NOT EXISTS idx_currencies_base ON currencies(is_base) WHERE is_base = true;

-- Create trigger for updated_at
CREATE TRIGGER update_currencies_updated_at
    BEFORE UPDATE ON currencies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default currencies
INSERT INTO currencies (code, name, symbol, decimal_places, is_base, is_active) VALUES 
    ('USD', 'US Dollar', '$', 2, true, true),
    ('EUR', 'Euro', '€', 2, false, true),
    ('TWD', 'Taiwan Dollar', 'NT$', 0, false, true),
    ('JPY', 'Japanese Yen', '¥', 0, false, true),
    ('CNY', 'Chinese Yuan', '¥', 2, false, true),
    ('GBP', 'British Pound', '£', 2, false, true)
ON CONFLICT (code) DO NOTHING;

-- Add comments for documentation
COMMENT ON TABLE currencies IS 'Standardized currency definitions with exchange rates';
COMMENT ON COLUMN currencies.is_base IS 'Indicates if this is the base currency for exchange rate calculations';
COMMENT ON COLUMN currencies.exchange_rate IS 'Exchange rate relative to base currency';
COMMENT ON COLUMN currencies.decimal_places IS 'Number of decimal places for this currency';