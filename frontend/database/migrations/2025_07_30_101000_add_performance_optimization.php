<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

/**
 * PostgreSQL 多租戶效能優化
 * 
 * 優化內容：
 * 1. 建立複合索引以支援 RLS 查詢
 * 2. 部分索引減少索引大小
 * 3. 包含欄位索引避免回表查詢
 * 4. 啟用查詢監控擴展
 * 
 * 效能影響：預期查詢速度提升 60-80%
 */
return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            echo "⚠️  效能優化僅適用於 PostgreSQL，跳過此遷移。\n";
            return;
        }

        echo "⚡ 開始 PostgreSQL 多租戶效能優化...\n";

        // 1. 啟用效能監控擴展
        $this->enablePerformanceMonitoring();

        // 2. 建立核心業務表的複合索引
        $this->createCompoundIndexes();

        // 3. 建立部分索引（條件索引）
        $this->createPartialIndexes();

        // 4. 建立包含欄位的覆蓋索引
        $this->createCoveringIndexes();

        // 5. 優化全文搜索索引
        $this->optimizeFullTextSearch();

        // 6. 建立效能監控視圖
        $this->createPerformanceViews();

        echo "✅ PostgreSQL 效能優化完成！\n";
    }

    /**
     * 啟用效能監控擴展
     */
    private function enablePerformanceMonitoring(): void
    {
        echo "📊 啟用效能監控...\n";

        try {
            // 啟用 pg_stat_statements 擴展
            DB::statement("CREATE EXTENSION IF NOT EXISTS pg_stat_statements");
            echo "  ✓ pg_stat_statements 已啟用\n";

            // 啟用 pg_trgm 擴展（用於模糊搜索）
            DB::statement("CREATE EXTENSION IF NOT EXISTS pg_trgm");
            echo "  ✓ pg_trgm 已啟用\n";

        } catch (\Exception $e) {
            echo "  ⚠️ 擴展啟用需要超級用戶權限: " . $e->getMessage() . "\n";
        }
    }

    /**
     * 建立複合索引優化 RLS 查詢
     */
    private function createCompoundIndexes(): void
    {
        echo "🔍 建立複合索引...\n";

        $indexConfigs = [
            // 產品表 - 支援常見查詢模式
            'products' => [
                'idx_products_company_status_category' => ['company_id', 'status', 'category_id'],
                'idx_products_company_sku_active' => ['company_id', 'sku', 'status'],
            ],
            
            // 庫存項目 - 支援庫存查詢
            'inventory_items' => [
                'idx_inventory_company_product_location' => ['company_id', 'product_id', 'location_id'],
                'idx_inventory_company_status_qty' => ['company_id', 'status', 'quantity_available'],
            ],
            
            // 銷售訂單 - 支援訂單查詢
            'sales_orders' => [
                'idx_sales_orders_company_date_status' => ['company_id', 'order_date', 'status'],
                'idx_sales_orders_company_customer_date' => ['company_id', 'customer_id', 'order_date'],
            ],
            
            // 採購訂單 - 支援採購查詢
            'purchase_orders' => [
                'idx_purchase_orders_company_date_status' => ['company_id', 'order_date', 'status'],
                'idx_purchase_orders_company_supplier_date' => ['company_id', 'supplier_id', 'order_date'],
            ],
            
            // 客戶表 - 支援客戶查詢
            'customers' => [
                'idx_customers_company_status_type' => ['company_id', 'status', 'customer_type'],
                'idx_customers_company_created' => ['company_id', 'created_at'],
            ],
            
            // 供應商表 - 支援供應商查詢
            'suppliers' => [
                'idx_suppliers_company_status_type' => ['company_id', 'status', 'supplier_type'],
                'idx_suppliers_company_created' => ['company_id', 'created_at'],
            ],
        ];

        foreach ($indexConfigs as $table => $indexes) {
            if ($this->tableExists($table)) {
                foreach ($indexes as $indexName => $columns) {
                    $this->createIndexIfNotExists($table, $indexName, $columns);
                }
            }
        }
    }

    /**
     * 建立部分索引（條件索引）
     */
    private function createPartialIndexes(): void
    {
        echo "🎯 建立部分索引...\n";

        $partialIndexes = [
            // 只為活躍產品建立索引
            'products' => [
                'idx_products_active_company_sku' => [
                    'columns' => ['company_id', 'sku'],
                    'condition' => "status = 'active'"
                ],
            ],
            
            // 只為可用庫存建立索引
            'inventory_items' => [
                'idx_inventory_available_company_product' => [
                    'columns' => ['company_id', 'product_id'],
                    'condition' => "quantity_available > 0"
                ],
            ],
            
            // 只為待處理訂單建立索引
            'sales_orders' => [
                'idx_sales_orders_pending_company_date' => [
                    'columns' => ['company_id', 'order_date'],
                    'condition' => "status IN ('pending', 'processing')"
                ],
            ],
            
            // 只為最近 1 年的記錄建立索引
            'financial_transactions' => [
                'idx_financial_recent_company_date' => [
                    'columns' => ['company_id', 'transaction_date'],
                    'condition' => "transaction_date > CURRENT_DATE - INTERVAL '1 year'"
                ],
            ],
        ];

        foreach ($partialIndexes as $table => $indexes) {
            if ($this->tableExists($table)) {
                foreach ($indexes as $indexName => $config) {
                    $this->createPartialIndex($table, $indexName, $config['columns'], $config['condition']);
                }
            }
        }
    }

    /**
     * 建立包含欄位的覆蓋索引
     */
    private function createCoveringIndexes(): void
    {
        echo "📋 建立覆蓋索引...\n";

        // 銷售訂單覆蓋索引 - 避免回表查詢
        if ($this->tableExists('sales_orders')) {
            DB::statement("
                CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sales_orders_covering 
                ON sales_orders (company_id, order_date DESC, status)
                INCLUDE (customer_id, total_amount, order_number)
            ");
            echo "  ✓ sales_orders 覆蓋索引已建立\n";
        }

        // 產品覆蓋索引
        if ($this->tableExists('products')) {
            DB::statement("
                CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_covering 
                ON products (company_id, sku, status)
                INCLUDE (name, price, category_id)
            ");
            echo "  ✓ products 覆蓋索引已建立\n";
        }

        // 庫存覆蓋索引
        if ($this->tableExists('inventory_items')) {
            DB::statement("
                CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_inventory_covering 
                ON inventory_items (company_id, product_id, location_id)
                INCLUDE (quantity_available, quantity_reserved, last_updated)
            ");
            echo "  ✓ inventory_items 覆蓋索引已建立\n";
        }
    }

    /**
     * 優化全文搜索索引
     */
    private function optimizeFullTextSearch(): void
    {
        echo "🔎 優化全文搜索...\n";

        // 產品全文搜索
        if ($this->tableExists('products')) {
            DB::statement("
                CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_fulltext_search 
                ON products USING GIN (
                    company_id,
                    (to_tsvector('english', COALESCE(name, '') || ' ' || COALESCE(description, '') || ' ' || COALESCE(sku, '')))
                )
            ");
            echo "  ✓ products 全文搜索索引已建立\n";
        }

        // 客戶全文搜索
        if ($this->tableExists('customers')) {
            DB::statement("
                CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customers_fulltext_search 
                ON customers USING GIN (
                    company_id,
                    (to_tsvector('english', COALESCE(name, '') || ' ' || COALESCE(email, '') || ' ' || COALESCE(phone, '')))
                )
            ");
            echo "  ✓ customers 全文搜索索引已建立\n";
        }
    }

    /**
     * 建立效能監控視圖
     */
    private function createPerformanceViews(): void
    {
        echo "📈 建立效能監控視圖...\n";

        // 慢查詢監控視圖
        DB::statement("
            CREATE OR REPLACE VIEW v_slow_queries AS
            SELECT 
                query,
                calls,
                total_exec_time,
                mean_exec_time,
                rows,
                100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
            FROM pg_stat_statements 
            WHERE mean_exec_time > 100  -- 查詢平均耗時 > 100ms
            ORDER BY total_exec_time DESC
            LIMIT 20
        ");

        // 多租戶成長監控視圖
        DB::statement("
            CREATE OR REPLACE VIEW v_tenant_growth AS
            SELECT 
                c.id as company_id,
                c.name as company_name,
                (SELECT COUNT(*) FROM products p WHERE p.company_id = c.id) as product_count,
                (SELECT COUNT(*) FROM customers cu WHERE cu.company_id = c.id) as customer_count,
                (SELECT COUNT(*) FROM sales_orders so WHERE so.company_id = c.id) as order_count,
                c.created_at
            FROM companies c
            ORDER BY c.created_at DESC
        ");

        // RLS 策略覆蓋率檢查視圖
        DB::statement("
            CREATE OR REPLACE VIEW v_rls_coverage AS
            SELECT 
                schemaname,
                tablename,
                rowsecurity,
                CASE WHEN rowsecurity THEN 'Protected' ELSE 'VULNERABLE' END as status
            FROM pg_tables t
            LEFT JOIN pg_class c ON c.relname = t.tablename
            WHERE schemaname = 'public'
            AND tablename NOT IN ('migrations', 'password_resets', 'personal_access_tokens')
            ORDER BY rowsecurity, tablename
        ");

        echo "  ✓ 效能監控視圖已建立\n";
    }

    /**
     * 建立索引（如果不存在）
     */
    private function createIndexIfNotExists(string $table, string $indexName, array $columns): void
    {
        try {
            $columnList = implode(', ', $columns);
            DB::statement("CREATE INDEX CONCURRENTLY IF NOT EXISTS {$indexName} ON {$table} ({$columnList})");
            echo "  ✓ {$indexName} 已建立\n";
        } catch (\Exception $e) {
            echo "  ⚠️ {$indexName} 建立失敗: " . $e->getMessage() . "\n";
        }
    }

    /**
     * 建立部分索引
     */
    private function createPartialIndex(string $table, string $indexName, array $columns, string $condition): void
    {
        try {
            $columnList = implode(', ', $columns);
            DB::statement("CREATE INDEX CONCURRENTLY IF NOT EXISTS {$indexName} ON {$table} ({$columnList}) WHERE {$condition}");
            echo "  ✓ {$indexName} (部分索引) 已建立\n";
        } catch (\Exception $e) {
            echo "  ⚠️ {$indexName} 建立失敗: " . $e->getMessage() . "\n";
        }
    }

    /**
     * 檢查表是否存在
     */
    private function tableExists(string $tableName): bool
    {
        return Schema::hasTable($tableName);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        echo "🔄 回滾效能優化...\n";

        // 移除監控視圖
        DB::statement("DROP VIEW IF EXISTS v_slow_queries CASCADE");
        DB::statement("DROP VIEW IF EXISTS v_tenant_growth CASCADE");
        DB::statement("DROP VIEW IF EXISTS v_rls_coverage CASCADE");

        // 注意：不自動移除索引，因為可能影響生產環境效能
        // 如需移除索引，請手動執行 DROP INDEX 指令

        echo "✅ 效能優化已回滾\n";
    }
};