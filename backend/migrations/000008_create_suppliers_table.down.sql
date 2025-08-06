-- Drop foreign key constraint from products table
ALTER TABLE products DROP CONSTRAINT IF EXISTS fk_products_supplier_id;

-- Drop trigger and function
DROP TRIGGER IF EXISTS trigger_suppliers_updated_at ON suppliers;
DROP FUNCTION IF EXISTS update_suppliers_updated_at();

-- Drop indexes
DROP INDEX IF EXISTS idx_suppliers_code;
DROP INDEX IF EXISTS idx_suppliers_name;
DROP INDEX IF EXISTS idx_suppliers_email;
DROP INDEX IF EXISTS idx_suppliers_is_active;

-- Drop suppliers table
DROP TABLE IF EXISTS suppliers;