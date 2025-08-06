-- Rollback products table unit_of_measure modifications

-- Remove foreign key constraint and column
ALTER TABLE products DROP CONSTRAINT IF EXISTS fk_products_unit_of_measure_id;
ALTER TABLE products DROP COLUMN IF EXISTS unit_of_measure_id;