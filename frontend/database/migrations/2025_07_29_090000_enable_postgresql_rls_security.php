<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

/**
 * 啟用 PostgreSQL Row Level Security (RLS) 多租戶隔離
 * 
 * 這個遷移的目的：
 * 1. 為所有業務表啟用 RLS
 * 2. 建立基於 company_id 的隔離策略
 * 3. 建立應用程式角色和權限
 * 4. 實現資料庫層級的多租戶安全
 * 
 * 安全等級：CRITICAL
 * 影響範圍：所有業務數據
 */
return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 只在 PostgreSQL 環境下執行
        if (DB::getDriverName() !== 'pgsql') {
            echo "⚠️  RLS 策略僅適用於 PostgreSQL，跳過此遷移。\n";
            return;
        }

        echo "🔒 開始設置 PostgreSQL Row Level Security...\n";

        // 1. 建立應用程式角色
        $this->createApplicationRole();

        // 2. 為核心業務表啟用 RLS
        $this->enableRLSForBusinessTables();

        // 3. 建立公司隔離策略
        $this->createCompanyIsolationPolicies();

        // 4. 建立關聯表的隔離策略
        $this->createRelatedTablePolicies();

        // 5. 建立管理員繞過策略（謹慎使用）
        $this->createAdminBypassPolicies();

        echo "✅ PostgreSQL RLS 設置完成！\n";
    }

    /**
     * 建立應用程式角色
     */
    private function createApplicationRole(): void
    {
        echo "📝 建立應用程式角色...\n";

        // 建立 nexus_app_user 角色
        DB::statement("
            DO \$\$
            BEGIN
                IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'nexus_app_user') THEN
                    CREATE ROLE nexus_app_user;
                END IF;
            END
            \$\$;
        ");

        // 授予基本權限
        DB::statement("GRANT CONNECT ON DATABASE " . DB::getDatabaseName() . " TO nexus_app_user");
        DB::statement("GRANT USAGE ON SCHEMA public TO nexus_app_user");
        
        // 授予表格權限
        $tables = [
            'companies', 'business_units', 'user_companies', 'user_business_units',
            'customers', 'products', 'suppliers',
            'sales_orders', 'sales_order_items',
            'purchase_orders', 'purchase_order_items'
        ];

        foreach ($tables as $table) {
            if ($this->tableExists($table)) {
                DB::statement("GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE {$table} TO nexus_app_user");
            }
        }

        echo "✅ 應用程式角色建立完成\n";
    }

    /**
     * 為核心業務表啟用 RLS
     */
    private function enableRLSForBusinessTables(): void
    {
        echo "🛡️ 啟用核心業務表的 RLS...\n";

        $businessTables = [
            'customers',
            'products', 
            'suppliers',
            'sales_orders',
            'purchase_orders'
        ];

        foreach ($businessTables as $table) {
            if ($this->tableExists($table)) {
                DB::statement("ALTER TABLE {$table} ENABLE ROW LEVEL SECURITY");
                echo "  ✓ {$table} RLS 已啟用\n";
            } else {
                echo "  ⚠️ 表 {$table} 不存在，跳過\n";
            }
        }
    }

    /**
     * 建立公司隔離策略
     */
    private function createCompanyIsolationPolicies(): void
    {
        echo "🏢 建立公司隔離策略...\n";

        // 客戶表隔離策略
        if ($this->tableExists('customers')) {
            DB::statement("
                CREATE POLICY company_isolation_customers ON customers
                    FOR ALL TO nexus_app_user
                    USING (company_id = current_setting('app.current_company_id', true)::int)
                    WITH CHECK (company_id = current_setting('app.current_company_id', true)::int)
            ");
            echo "  ✓ customers 隔離策略已建立\n";
        }

        // 產品表隔離策略
        if ($this->tableExists('products')) {
            DB::statement("
                CREATE POLICY company_isolation_products ON products
                    FOR ALL TO nexus_app_user
                    USING (company_id = current_setting('app.current_company_id', true)::int)
                    WITH CHECK (company_id = current_setting('app.current_company_id', true)::int)
            ");
            echo "  ✓ products 隔離策略已建立\n";
        }

        // 供應商表隔離策略
        if ($this->tableExists('suppliers')) {
            DB::statement("
                CREATE POLICY company_isolation_suppliers ON suppliers
                    FOR ALL TO nexus_app_user
                    USING (company_id = current_setting('app.current_company_id', true)::int)
                    WITH CHECK (company_id = current_setting('app.current_company_id', true)::int)
            ");
            echo "  ✓ suppliers 隔離策略已建立\n";
        }

        // 銷售訂單表隔離策略
        if ($this->tableExists('sales_orders')) {
            DB::statement("
                CREATE POLICY company_isolation_sales_orders ON sales_orders
                    FOR ALL TO nexus_app_user
                    USING (company_id = current_setting('app.current_company_id', true)::int)
                    WITH CHECK (company_id = current_setting('app.current_company_id', true)::int)
            ");
            echo "  ✓ sales_orders 隔離策略已建立\n";
        }

        // 採購訂單表隔離策略
        if ($this->tableExists('purchase_orders')) {
            DB::statement("
                CREATE POLICY company_isolation_purchase_orders ON purchase_orders
                    FOR ALL TO nexus_app_user
                    USING (company_id = current_setting('app.current_company_id', true)::int)
                    WITH CHECK (company_id = current_setting('app.current_company_id', true)::int)
            ");
            echo "  ✓ purchase_orders 隔離策略已建立\n";
        }
    }

    /**
     * 建立關聯表的隔離策略
     */
    private function createRelatedTablePolicies(): void
    {
        echo "🔗 建立關聯表隔離策略...\n";

        // 銷售訂單項目表 - 通過主表驗證
        if ($this->tableExists('sales_order_items')) {
            DB::statement("
                CREATE POLICY company_isolation_sales_order_items ON sales_order_items
                    FOR ALL TO nexus_app_user
                    USING (EXISTS (
                        SELECT 1 FROM sales_orders 
                        WHERE sales_orders.id = sales_order_items.sales_order_id 
                        AND sales_orders.company_id = current_setting('app.current_company_id', true)::int
                    ))
                    WITH CHECK (EXISTS (
                        SELECT 1 FROM sales_orders 
                        WHERE sales_orders.id = sales_order_items.sales_order_id 
                        AND sales_orders.company_id = current_setting('app.current_company_id', true)::int
                    ))
            ");
            
            // 為關聯表也啟用 RLS
            DB::statement("ALTER TABLE sales_order_items ENABLE ROW LEVEL SECURITY");
            echo "  ✓ sales_order_items 隔離策略已建立\n";
        }

        // 採購訂單項目表 - 通過主表驗證
        if ($this->tableExists('purchase_order_items')) {
            DB::statement("
                CREATE POLICY company_isolation_purchase_order_items ON purchase_order_items
                    FOR ALL TO nexus_app_user
                    USING (EXISTS (
                        SELECT 1 FROM purchase_orders 
                        WHERE purchase_orders.id = purchase_order_items.purchase_order_id 
                        AND purchase_orders.company_id = current_setting('app.current_company_id', true)::int
                    ))
                    WITH CHECK (EXISTS (
                        SELECT 1 FROM purchase_orders 
                        WHERE purchase_orders.id = purchase_order_items.purchase_order_id 
                        AND purchase_orders.company_id = current_setting('app.current_company_id', true)::int
                    ))
            ");
            
            // 為關聯表也啟用 RLS
            DB::statement("ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY");
            echo "  ✓ purchase_order_items 隔離策略已建立\n";
        }
    }

    /**
     * 建立管理員繞過策略（僅超級管理員）
     */
    private function createAdminBypassPolicies(): void
    {
        echo "👑 建立管理員繞過策略...\n";

        // 注意：這個策略允許超級管理員存取所有公司資料
        // 僅在必要時使用，例如系統維護或數據分析

        $tables = ['customers', 'products', 'suppliers', 'sales_orders', 'purchase_orders'];

        foreach ($tables as $table) {
            if ($this->tableExists($table)) {
                DB::statement("
                    CREATE POLICY superuser_bypass_{$table} ON {$table}
                        FOR ALL TO nexus_app_user
                        USING (current_setting('app.superuser_mode', true)::boolean = true)
                        WITH CHECK (current_setting('app.superuser_mode', true)::boolean = true)
                ");
                echo "  ✓ {$table} 管理員繞過策略已建立\n";
            }
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

        echo "🔓 移除 PostgreSQL RLS 設置...\n";

        // 移除所有策略
        $policies = [
            'company_isolation_customers',
            'company_isolation_products', 
            'company_isolation_suppliers',
            'company_isolation_sales_orders',
            'company_isolation_purchase_orders',
            'company_isolation_sales_order_items',
            'company_isolation_purchase_order_items'
        ];

        $tables = [
            'customers', 'products', 'suppliers', 
            'sales_orders', 'purchase_orders',
            'sales_order_items', 'purchase_order_items'
        ];

        // 移除策略
        foreach ($policies as $policy) {
            foreach ($tables as $table) {
                if ($this->tableExists($table)) {
                    try {
                        DB::statement("DROP POLICY IF EXISTS {$policy} ON {$table}");
                    } catch (\Exception $e) {
                        // 忽略策略不存在的錯誤
                    }
                }
            }
        }

        // 移除管理員繞過策略
        foreach ($tables as $table) {
            if ($this->tableExists($table)) {
                try {
                    DB::statement("DROP POLICY IF EXISTS superuser_bypass_{$table} ON {$table}");
                } catch (\Exception $e) {
                    // 忽略策略不存在的錯誤
                }
            }
        }

        // 停用 RLS
        foreach ($tables as $table) {
            if ($this->tableExists($table)) {
                DB::statement("ALTER TABLE {$table} DISABLE ROW LEVEL SECURITY");
            }
        }

        // 注意：不移除 nexus_app_user 角色，以免影響其他功能

        echo "✅ RLS 設置已移除\n";
    }
};