-- Create units_of_measure table for standardized unit management
CREATE TABLE IF NOT EXISTS units_of_measure (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(64) UNIQUE NOT NULL,
    symbol VARCHAR(16),
    type VARCHAR(32) DEFAULT 'quantity',
    base_unit_id BIGINT,
    conversion_factor NUMERIC(15,6) DEFAULT 1.0,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    CONSTRAINT fk_units_of_measure_base_unit FOREIGN KEY (base_unit_id) REFERENCES units_of_measure(id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_units_of_measure_name ON units_of_measure(name);
CREATE INDEX IF NOT EXISTS idx_units_of_measure_type ON units_of_measure(type);
CREATE INDEX IF NOT EXISTS idx_units_of_measure_active ON units_of_measure(is_active) WHERE is_active = true;

-- Create trigger for updated_at
CREATE TRIGGER update_units_of_measure_updated_at
    BEFORE UPDATE ON units_of_measure
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default units
INSERT INTO units_of_measure (name, symbol, type, description) VALUES 
    ('Pieces', 'pcs', 'quantity', 'Individual items'),
    ('Kilograms', 'kg', 'weight', 'Weight in kilograms'),
    ('Grams', 'g', 'weight', 'Weight in grams'),
    ('Liters', 'L', 'volume', 'Volume in liters'),
    ('Meters', 'm', 'length', 'Length in meters'),
    ('Hours', 'hr', 'time', 'Time in hours'),
    ('Sets', 'set', 'quantity', 'Set of items'),
    ('Boxes', 'box', 'package', 'Packaged boxes'),
    ('Cartons', 'ctn', 'package', 'Packaged cartons')
ON CONFLICT (name) DO NOTHING;

-- Add comments for documentation
COMMENT ON TABLE units_of_measure IS 'Standardized units of measure for products and transactions';
COMMENT ON COLUMN units_of_measure.type IS 'Unit type: quantity, weight, volume, length, time, package';