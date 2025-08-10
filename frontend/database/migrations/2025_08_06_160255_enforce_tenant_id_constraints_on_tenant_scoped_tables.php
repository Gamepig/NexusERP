<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * 需要強制執行租戶約束的資料表
     */
    private array $tenantScopedTables = [
        'customers',
        'suppliers', 
        'products',
        'sales_orders',
        'invoices',
    ];

    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 確保所有租戶範疇資料表的 company_id 欄位都有 NOT NULL 約束和外鍵約束
        
        foreach ($this->tenantScopedTables as $tableName) {
            if (Schema::hasTable($tableName)) {
                $this->enforceConstraintsOnTable($tableName);
            } else {
                // 記錄警告但不中斷遷移
                echo "Warning: Table '$tableName' does not exist, skipping...\n";
            }
        }
    }

    /**
     * 對單一資料表強制執行約束
     */
    private function enforceConstraintsOnTable(string $tableName): void
    {
        echo "Processing table: $tableName\n";

        Schema::table($tableName, function (Blueprint $table) use ($tableName) {
            // 檢查 company_id 欄位是否存在
            if (!Schema::hasColumn($tableName, 'company_id')) {
                echo "  Warning: Column 'company_id' does not exist in table '$tableName', skipping...\n";
                return;
            }

            // 檢查 company_id 是否已經是 NOT NULL
            $isNullable = $this->isColumnNullable($tableName, 'company_id');
            
            if ($isNullable) {
                echo "  Making company_id NOT NULL...\n";
                // 修改欄位為 NOT NULL
                $table->unsignedBigInteger('company_id')->nullable(false)->change();
            } else {
                echo "  company_id is already NOT NULL\n";
            }

            // 檢查是否已存在外鍵約束
            if (!$this->hasForeignKeyConstraint($tableName, 'company_id')) {
                echo "  Adding foreign key constraint...\n";
                // 建立外鍵約束
                $table->foreign('company_id')
                    ->references('id')
                    ->on('companies')
                    ->onDelete('restrict')
                    ->onUpdate('cascade');
            } else {
                echo "  Foreign key constraint already exists\n";
            }
        });

        echo "  ✓ Completed processing table: $tableName\n\n";
    }

    /**
     * 檢查欄位是否可為空值
     */
    private function isColumnNullable(string $tableName, string $columnName): bool
    {
        $result = DB::selectOne(
            "SELECT is_nullable FROM information_schema.columns 
             WHERE table_name = ? AND column_name = ? AND table_schema = 'public'",
            [$tableName, $columnName]
        );
        
        return $result && $result->is_nullable === 'YES';
    }

    /**
     * 檢查是否已存在外鍵約束
     */
    private function hasForeignKeyConstraint(string $tableName, string $columnName): bool
    {
        $result = DB::selectOne(
            "SELECT tc.constraint_name 
             FROM information_schema.table_constraints AS tc 
             JOIN information_schema.key_column_usage AS kcu
               ON tc.constraint_name = kcu.constraint_name
               AND tc.table_schema = kcu.table_schema
             WHERE tc.constraint_type = 'FOREIGN KEY'
               AND tc.table_schema = 'public'
               AND tc.table_name = ?
               AND kcu.column_name = ?",
            [$tableName, $columnName]
        );
        
        return $result !== null;
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // 移除外鍵約束並將 company_id 改回可為空值
        
        foreach (array_reverse($this->tenantScopedTables) as $tableName) {
            if (Schema::hasTable($tableName)) {
                $this->removeConstraintsFromTable($tableName);
            }
        }
    }

    /**
     * 從單一資料表移除約束
     */
    private function removeConstraintsFromTable(string $tableName): void
    {
        echo "Removing constraints from table: $tableName\n";

        Schema::table($tableName, function (Blueprint $table) use ($tableName) {
            if (!Schema::hasColumn($tableName, 'company_id')) {
                return;
            }

            // 移除外鍵約束
            if ($this->hasForeignKeyConstraint($tableName, 'company_id')) {
                echo "  Dropping foreign key constraint...\n";
                $table->dropForeign(['company_id']);
            }

            // 將欄位改回可為空值（除了 sales_orders，它原本就是 NOT NULL）
            if ($tableName !== 'sales_orders') {
                echo "  Making company_id nullable...\n";
                $table->unsignedBigInteger('company_id')->nullable(true)->change();
            }
        });

        echo "  ✓ Completed removing constraints from table: $tableName\n\n";
    }
};
