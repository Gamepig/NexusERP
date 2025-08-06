-- 刪除報表相關資料表和視圖

-- 刪除索引
DROP INDEX IF EXISTS idx_ap_due_date;
DROP INDEX IF EXISTS idx_ar_due_date;
DROP INDEX IF EXISTS idx_inventory_levels_updated;
DROP INDEX IF EXISTS idx_sales_orders_status;
DROP INDEX IF EXISTS idx_sales_orders_date;
DROP INDEX IF EXISTS idx_report_cache_type_expires;
DROP INDEX IF EXISTS idx_report_cache_key;

-- 刪除視圖
DROP VIEW IF EXISTS ap_report_data;
DROP VIEW IF EXISTS ar_report_data;
DROP VIEW IF EXISTS inventory_report_data;
DROP VIEW IF EXISTS sales_report_data;

-- 刪除資料表
DROP TABLE IF EXISTS report_cache;
DROP TABLE IF EXISTS report_configurations;