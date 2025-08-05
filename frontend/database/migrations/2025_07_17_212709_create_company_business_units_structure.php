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
        // 創建公司表
        Schema::create('companies', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('display_name');
            $table->string('code', 50)->unique()->nullable(); // 新增公司代碼
            $table->text('description')->nullable();
            $table->string('registration_number')->unique()->nullable();
            $table->string('tax_number')->unique()->nullable();
            $table->string('email')->nullable();
            $table->string('phone')->nullable();
            $table->string('website')->nullable();
            $table->json('address')->nullable();
            $table->string('industry')->nullable();
            $table->string('size')->nullable();
            $table->string('currency')->default('TWD'); // 改為台幣
            $table->string('timezone')->default('Asia/Taipei'); // 改為台北時區
            $table->string('locale')->default('zh_TW'); // 改為繁體中文
            $table->boolean('is_active')->default(true);
            $table->json('settings')->nullable();
            $table->json('metadata')->nullable();
            $table->unsignedBigInteger('created_by_user_id')->nullable(); // 新增建立者
            $table->timestamps();
            $table->softDeletes();
            
            // 索引
            $table->index(['name', 'deleted_at']);
            $table->index(['is_active', 'deleted_at']);
            $table->index('registration_number');
            $table->index('tax_number');
            $table->index('industry');
            $table->index('code');
            $table->index('created_by_user_id');
            
            // 外鍵約束
            $table->foreign('created_by_user_id')->references('id')->on('users')->onDelete('set null');
        });
        
        // 創建業務單位表
        Schema::create('business_units', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained('companies')->onDelete('cascade');
            $table->foreignId('parent_id')->nullable()->constrained('business_units')->onDelete('cascade');
            $table->string('name');
            $table->string('display_name');
            $table->text('description')->nullable();
            $table->string('type')->default('department');
            $table->string('code')->nullable();
            $table->string('email')->nullable();
            $table->string('phone')->nullable();
            $table->json('address')->nullable();
            $table->boolean('is_active')->default(true);
            $table->integer('sort_order')->default(0);
            $table->json('settings')->nullable();
            $table->json('metadata')->nullable();
            $table->unsignedBigInteger('created_by_user_id')->nullable(); // 新增建立者
            $table->timestamps();
            $table->softDeletes();
            
            // 唯一約束
            $table->unique(['company_id', 'name', 'deleted_at']);
            $table->unique(['company_id', 'code', 'deleted_at']);
            
            // 索引
            $table->index(['company_id', 'deleted_at']);
            $table->index(['parent_id', 'deleted_at']);
            $table->index(['is_active', 'deleted_at']);
            $table->index('type');
            $table->index('sort_order');
            $table->index('created_by_user_id');
            
            // 外鍵約束
            $table->foreign('created_by_user_id')->references('id')->on('users')->onDelete('set null');
        });
        
        // 創建用戶公司關聯表
        Schema::create('user_companies', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('company_id')->constrained('companies')->onDelete('cascade');
            $table->string('role')->default('member'); // 新增角色欄位
            $table->boolean('is_primary')->default(false);
            $table->boolean('is_active')->default(true);
            $table->timestamp('joined_at')->useCurrent();
            $table->timestamp('left_at')->nullable();
            $table->timestamps();
            
            // 唯一約束
            $table->unique(['user_id', 'company_id']);
            
            // 索引
            $table->index('user_id');
            $table->index('company_id');
            $table->index('is_primary');
            $table->index('is_active');
            $table->index('role');
        });
        
        // 創建用戶業務單位關聯表
        Schema::create('user_business_units', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('business_unit_id')->constrained('business_units')->onDelete('cascade');
            $table->string('role')->default('member'); // 新增角色欄位
            $table->boolean('is_primary')->default(false);
            $table->boolean('is_active')->default(true);
            $table->timestamp('joined_at')->useCurrent();
            $table->timestamp('left_at')->nullable();
            $table->timestamps();
            
            // 唯一約束
            $table->unique(['user_id', 'business_unit_id']);
            
            // 索引
            $table->index('user_id');
            $table->index('business_unit_id');
            $table->index('is_primary');
            $table->index('is_active');
            $table->index('role');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_business_units');
        Schema::dropIfExists('user_companies');
        Schema::dropIfExists('business_units');
        Schema::dropIfExists('companies');
    }
};
