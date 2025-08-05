<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * 為缺少 company_id 的表添加多租戶隔離欄位
 * 
 * 確保所有業務相關表都有 company_id 欄位，以支援 RLS 策略
 */
return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 檢查並添加 company_id 到 customers 表
        if (Schema::hasTable('customers') && !Schema::hasColumn('customers', 'company_id')) {
            Schema::table('customers', function (Blueprint $table) {
                $table->foreignId('company_id')->constrained('companies')->onDelete('cascade');
                $table->index('company_id');
            });
            echo "✅ customers 表已添加 company_id\n";
        }

        // 檢查並添加 company_id 到 suppliers 表
        if (Schema::hasTable('suppliers') && !Schema::hasColumn('suppliers', 'company_id')) {
            Schema::table('suppliers', function (Blueprint $table) {
                $table->foreignId('company_id')->constrained('companies')->onDelete('cascade');
                $table->index('company_id');
            });
            echo "✅ suppliers 表已添加 company_id\n";
        }

        // 檢查並添加 company_id 到 products 表（如果還沒有）
        if (Schema::hasTable('products') && !Schema::hasColumn('products', 'company_id')) {
            Schema::table('products', function (Blueprint $table) {
                $table->foreignId('company_id')->constrained('companies')->onDelete('cascade');
                $table->index('company_id');
            });
            echo "✅ products 表已添加 company_id\n";
        }

        // 檢查並添加 company_id 到 sales_orders 表
        if (Schema::hasTable('sales_orders') && !Schema::hasColumn('sales_orders', 'company_id')) {
            Schema::table('sales_orders', function (Blueprint $table) {
                $table->foreignId('company_id')->constrained('companies')->onDelete('cascade');
                $table->index('company_id');
            });
            echo "✅ sales_orders 表已添加 company_id\n";
        }

        // 檢查並添加 company_id 到 purchase_orders 表
        if (Schema::hasTable('purchase_orders') && !Schema::hasColumn('purchase_orders', 'company_id')) {
            Schema::table('purchase_orders', function (Blueprint $table) {
                $table->foreignId('company_id')->constrained('companies')->onDelete('cascade');
                $table->index('company_id');
            });
            echo "✅ purchase_orders 表已添加 company_id\n";
        }

        // 如果存在庫存相關表，也添加 company_id
        if (Schema::hasTable('inventory_levels') && !Schema::hasColumn('inventory_levels', 'company_id')) {
            Schema::table('inventory_levels', function (Blueprint $table) {
                $table->foreignId('company_id')->constrained('companies')->onDelete('cascade');
                $table->index('company_id');
            });
            echo "✅ inventory_levels 表已添加 company_id\n";
        }

        // 如果存在財務相關表，也添加 company_id
        if (Schema::hasTable('expenses') && !Schema::hasColumn('expenses', 'company_id')) {
            Schema::table('expenses', function (Blueprint $table) {
                $table->foreignId('company_id')->constrained('companies')->onDelete('cascade');
                $table->index('company_id');
            });
            echo "✅ expenses 表已添加 company_id\n";
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // 移除 company_id 欄位
        $tables = ['customers', 'suppliers', 'products', 'sales_orders', 'purchase_orders', 'inventory_levels', 'expenses'];

        foreach ($tables as $table) {
            if (Schema::hasTable($table) && Schema::hasColumn($table, 'company_id')) {
                Schema::table($table, function (Blueprint $table) {
                    $table->dropForeign(['company_id']);
                    $table->dropColumn('company_id');
                });
            }
        }
    }
};