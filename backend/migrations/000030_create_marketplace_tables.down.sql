-- Drop marketplace tables and functions (reverse of up migration)

-- Drop triggers first
DROP TRIGGER IF EXISTS trigger_marketplace_suppliers_updated_at ON marketplace_suppliers;
DROP TRIGGER IF EXISTS trigger_marketplace_categories_updated_at ON marketplace_categories;
DROP TRIGGER IF EXISTS trigger_marketplace_products_updated_at ON marketplace_products;
DROP TRIGGER IF EXISTS trigger_marketplace_inquiries_updated_at ON marketplace_inquiries;
DROP TRIGGER IF EXISTS trigger_marketplace_reviews_updated_at ON marketplace_reviews;
DROP TRIGGER IF EXISTS trigger_marketplace_supplier_documents_updated_at ON marketplace_supplier_documents;

-- Drop functions
DROP FUNCTION IF EXISTS update_marketplace_updated_at();
DROP FUNCTION IF EXISTS update_product_view_count();

-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS marketplace_supplier_documents;
DROP TABLE IF EXISTS marketplace_reviews;
DROP TABLE IF EXISTS marketplace_inquiries;
DROP TABLE IF EXISTS marketplace_product_images;
DROP TABLE IF EXISTS marketplace_products;
DROP TABLE IF EXISTS marketplace_categories;
DROP TABLE IF EXISTS marketplace_suppliers;