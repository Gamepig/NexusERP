-- Modify products table to use standardized units of measure

-- Step 1: Add new unit_of_measure_id column
ALTER TABLE products ADD COLUMN unit_of_measure_id BIGINT;
ALTER TABLE products ADD CONSTRAINT fk_products_unit_of_measure_id 
    FOREIGN KEY (unit_of_measure_id) REFERENCES units_of_measure(id);

-- Step 2: Migrate existing data
-- Map common unit values to standardized units
UPDATE products SET unit_of_measure_id = (
    SELECT id FROM units_of_measure WHERE name = 'Pieces'
) WHERE unit_of_measure = 'pcs' OR unit_of_measure = 'piece' OR unit_of_measure = 'pieces';

UPDATE products SET unit_of_measure_id = (
    SELECT id FROM units_of_measure WHERE name = 'Kilograms'  
) WHERE unit_of_measure = 'kg' OR unit_of_measure = 'kilogram' OR unit_of_measure = 'kilograms';

UPDATE products SET unit_of_measure_id = (
    SELECT id FROM units_of_measure WHERE name = 'Grams'  
) WHERE unit_of_measure = 'g' OR unit_of_measure = 'gram' OR unit_of_measure = 'grams';

UPDATE products SET unit_of_measure_id = (
    SELECT id FROM units_of_measure WHERE name = 'Liters'  
) WHERE unit_of_measure = 'L' OR unit_of_measure = 'l' OR unit_of_measure = 'liter' OR unit_of_measure = 'liters';

UPDATE products SET unit_of_measure_id = (
    SELECT id FROM units_of_measure WHERE name = 'Meters'  
) WHERE unit_of_measure = 'm' OR unit_of_measure = 'meter' OR unit_of_measure = 'meters';

UPDATE products SET unit_of_measure_id = (
    SELECT id FROM units_of_measure WHERE name = 'Hours'  
) WHERE unit_of_measure = 'hr' OR unit_of_measure = 'hour' OR unit_of_measure = 'hours';

UPDATE products SET unit_of_measure_id = (
    SELECT id FROM units_of_measure WHERE name = 'Sets'  
) WHERE unit_of_measure = 'set' OR unit_of_measure = 'sets';

UPDATE products SET unit_of_measure_id = (
    SELECT id FROM units_of_measure WHERE name = 'Boxes'  
) WHERE unit_of_measure = 'box' OR unit_of_measure = 'boxes';

UPDATE products SET unit_of_measure_id = (
    SELECT id FROM units_of_measure WHERE name = 'Cartons'  
) WHERE unit_of_measure = 'ctn' OR unit_of_measure = 'carton' OR unit_of_measure = 'cartons';

-- Set default value for any remaining null entries
UPDATE products SET unit_of_measure_id = (
    SELECT id FROM units_of_measure WHERE name = 'Pieces'
) WHERE unit_of_measure_id IS NULL;

-- Step 3: Set NOT NULL constraint
ALTER TABLE products ALTER COLUMN unit_of_measure_id SET NOT NULL;

-- Step 4: Keep old column for backward compatibility (optional)
-- Note: In production, you might want to remove this after migration is complete
-- ALTER TABLE products DROP COLUMN unit_of_measure;

-- Step 5: Create index for new foreign key
CREATE INDEX IF NOT EXISTS idx_products_unit_of_measure_id ON products(unit_of_measure_id);

-- Add comment for documentation
COMMENT ON COLUMN products.unit_of_measure_id IS 'Foreign key reference to standardized units of measure table';