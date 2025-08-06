-- Drop triggers
DROP TRIGGER IF EXISTS trigger_update_quote_totals ON quote_items;
DROP TRIGGER IF EXISTS trigger_auto_generate_quote_number ON quotes;
DROP TRIGGER IF EXISTS update_quote_items_updated_at ON quote_items;
DROP TRIGGER IF EXISTS update_quotes_updated_at ON quotes;

-- Drop functions
DROP FUNCTION IF EXISTS update_quote_totals();
DROP FUNCTION IF EXISTS auto_generate_quote_number();
DROP FUNCTION IF EXISTS generate_quote_number();

-- Drop indexes
DROP INDEX IF EXISTS idx_quote_items_product_id;
DROP INDEX IF EXISTS idx_quote_items_quote_id;
DROP INDEX IF EXISTS idx_quotes_currency_id;
DROP INDEX IF EXISTS idx_quotes_business_unit_id;
DROP INDEX IF EXISTS idx_quotes_user_id;
DROP INDEX IF EXISTS idx_quotes_expiry_date;
DROP INDEX IF EXISTS idx_quotes_quote_date;
DROP INDEX IF EXISTS idx_quotes_status;
DROP INDEX IF EXISTS idx_quotes_customer_id;
DROP INDEX IF EXISTS idx_quotes_quote_number;

-- Drop tables
DROP TABLE IF EXISTS quote_items;
DROP TABLE IF EXISTS quotes;