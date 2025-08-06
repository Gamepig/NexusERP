-- Drop inventory_levels table
DROP TRIGGER IF EXISTS update_inventory_last_updated_trigger ON inventory_levels;
DROP FUNCTION IF EXISTS update_inventory_last_updated();
DROP TABLE IF EXISTS inventory_levels CASCADE;