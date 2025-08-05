<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 為 sales_orders 添加 company_id
        Schema::table('sales_orders', function (Blueprint $table) {
            $table->unsignedBigInteger('company_id')->nullable()->after('customer_id');
            $table->foreign('company_id')->references('id')->on('companies')->onDelete('cascade');
            $table->index('company_id');
        });

        // 為 purchase_orders 添加 company_id
        Schema::table('purchase_orders', function (Blueprint $table) {
            $table->unsignedBigInteger('company_id')->nullable()->after('supplier_id');
            $table->foreign('company_id')->references('id')->on('companies')->onDelete('cascade');
            $table->index('company_id');
        });

        // 更新現有記錄的 company_id（假設存在預設公司 ID 為 1）
        // 這需要根據實際的業務邏輯來設定
        DB::statement('UPDATE sales_orders SET company_id = 77 WHERE company_id IS NULL');
        DB::statement('UPDATE purchase_orders SET company_id = 77 WHERE company_id IS NULL');

        // 將欄位設為 NOT NULL
        Schema::table('sales_orders', function (Blueprint $table) {
            $table->unsignedBigInteger('company_id')->nullable(false)->change();
        });

        Schema::table('purchase_orders', function (Blueprint $table) {
            $table->unsignedBigInteger('company_id')->nullable(false)->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sales_orders', function (Blueprint $table) {
            $table->dropForeign(['company_id']);
            $table->dropIndex(['company_id']);
            $table->dropColumn('company_id');
        });

        Schema::table('purchase_orders', function (Blueprint $table) {
            $table->dropForeign(['company_id']);
            $table->dropIndex(['company_id']);
            $table->dropColumn('company_id');
        });
    }
};
