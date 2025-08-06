-- Performance optimization indexes for better query performance
-- Task 22.1: Database Performance Analysis and Optimization

-- 1. 複合索引優化

-- Sales orders: 常見查詢組合 (customer_id, status, order_date)
CREATE INDEX IF NOT EXISTS idx_sales_orders_customer_status_date 
ON sales_orders(customer_id, status, order_date)
WHERE deleted_at IS NULL;

-- Sales order items: 產品狀態查詢 (product_id, status)  
CREATE INDEX IF NOT EXISTS idx_sales_order_items_product_status 
ON sales_order_items(product_id, status);

-- Inventory transactions: 庫存歷史查詢 (product_id, warehouse_id, transaction_date)
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_product_warehouse_date 
ON inventory_transactions(product_id, warehouse_id, transaction_date);

-- 2. 部分索引 (針對活躍記錄)

-- Products: 只索引活躍產品
CREATE INDEX IF NOT EXISTS idx_products_active 
ON products(id, name) 
WHERE is_active = true;

-- Customers: 只索引未刪除客戶
CREATE INDEX IF NOT EXISTS idx_customers_active 
ON customers(id, name) 
WHERE deleted_at IS NULL;

-- 3. 報表和聚合查詢優化

-- Sales orders: 按日期範圍和狀態的報表查詢
CREATE INDEX IF NOT EXISTS idx_sales_orders_date_status_total 
ON sales_orders(order_date, status, total_amount)
WHERE deleted_at IS NULL;

-- Inventory levels: 低庫存警報查詢優化
CREATE INDEX IF NOT EXISTS idx_inventory_levels_low_stock_optimized 
ON inventory_levels(warehouse_id, quantity_available, reorder_point) 
WHERE quantity_available > 0 AND reorder_point > 0;

-- Purchase orders: 供應商和狀態查詢
CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier_status 
ON purchase_orders(supplier_id, status, order_date);

-- 4. 外鍵查詢優化

-- Quote items: 報價項目查詢
CREATE INDEX IF NOT EXISTS idx_quote_items_quote_product 
ON quote_items(quote_id, product_id);

-- Accounts receivable: 客戶應收帳款查詢
CREATE INDEX IF NOT EXISTS idx_accounts_receivable_customer_status 
ON accounts_receivable(customer_id, status, due_date);

-- 5. 時間序列查詢優化

-- Inventory transactions: 按時間範圍查詢交易歷史
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_date_type 
ON inventory_transactions(transaction_date, transaction_type_id, product_id);

-- 6. 覆蓋索引 (包含常用查詢欄位)

-- Sales order items: 包含數量和價格的覆蓋索引
CREATE INDEX IF NOT EXISTS idx_sales_order_items_coverage 
ON sales_order_items(sales_order_id, product_id, quantity, unit_price, total_price);

-- Inventory levels: 包含所有庫存數量的覆蓋索引
CREATE INDEX IF NOT EXISTS idx_inventory_levels_coverage 
ON inventory_levels(product_id, warehouse_id, quantity_on_hand, quantity_available, quantity_reserved);

-- 7. 文字搜尋優化 (使用 PostgreSQL 全文搜索)

-- Products: 產品名稱和描述的全文搜索索引
CREATE INDEX IF NOT EXISTS idx_products_fulltext 
ON products USING gin(to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, '')))
WHERE is_active = true;

-- Customers: 客戶名稱和聯絡資訊的全文搜索索引
CREATE INDEX IF NOT EXISTS idx_customers_fulltext 
ON customers USING gin(to_tsvector('english', coalesce(name, '') || ' ' || coalesce(email, '') || ' ' || coalesce(phone, '')))
WHERE deleted_at IS NULL;

-- Add comments for documentation
COMMENT ON INDEX idx_sales_orders_customer_status_date IS 'Composite index for common sales order queries by customer, status and date';
COMMENT ON INDEX idx_inventory_transactions_product_warehouse_date IS 'Composite index for inventory history queries';
COMMENT ON INDEX idx_products_active IS 'Partial index for active products only';
COMMENT ON INDEX idx_customers_active IS 'Partial index for non-deleted customers only';
COMMENT ON INDEX idx_products_fulltext IS 'Full-text search index for product names and descriptions';
COMMENT ON INDEX idx_customers_fulltext IS 'Full-text search index for customer information';