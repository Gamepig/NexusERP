<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            // 添加用戶關聯欄位（用於數據隔離）
            $table->unsignedBigInteger('created_by_user_id')->nullable()->after('id');
            $table->foreign('created_by_user_id')->references('id')->on('users')->onDelete('set null');
            
            // 添加啟用狀態欄位
            $table->boolean('is_active')->default(true)->after('status');
            
            // 添加產品物理屬性欄位
            $table->decimal('weight', 8, 3)->nullable()->after('maximum_stock')->comment('重量(kg)');
            $table->string('dimensions', 100)->nullable()->after('weight')->comment('尺寸(長x寬x高)');
            
            // 添加索引
            $table->index(['created_by_user_id']);
            $table->index(['is_active']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            // 移除索引
            $table->dropIndex(['created_by_user_id']);
            $table->dropIndex(['is_active']);
            
            // 移除外鍵約束
            $table->dropForeign(['created_by_user_id']);
            
            // 移除欄位
            $table->dropColumn([
                'created_by_user_id',
                'is_active',
                'weight',
                'dimensions'
            ]);
        });
    }
};
