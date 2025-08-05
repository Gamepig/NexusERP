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
        // 創建角色表
        Schema::create('roles', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->string('display_name');
            $table->text('description')->nullable();
            $table->boolean('is_system')->default(false);
            $table->boolean('is_active')->default(true);
            $table->json('settings')->nullable();
            $table->timestamps();
            $table->softDeletes();
            
            // 索引
            $table->index(['name', 'deleted_at']);
            $table->index(['is_active', 'deleted_at']);
            $table->index('is_system');
        });
        
        // 創建權限表
        Schema::create('permissions', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->string('display_name');
            $table->text('description')->nullable();
            $table->string('group')->default('general');
            $table->boolean('is_system')->default(false);
            $table->boolean('is_active')->default(true);
            $table->json('settings')->nullable();
            $table->timestamps();
            $table->softDeletes();
            
            // 索引
            $table->index(['name', 'deleted_at']);
            $table->index(['group', 'deleted_at']);
            $table->index(['is_active', 'deleted_at']);
            $table->index('is_system');
        });
        
        // 創建角色權限關聯表
        Schema::create('role_permissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('role_id')->constrained('roles')->onDelete('cascade');
            $table->foreignId('permission_id')->constrained('permissions')->onDelete('cascade');
            $table->timestamps();
            
            // 唯一約束
            $table->unique(['role_id', 'permission_id']);
            
            // 索引
            $table->index('role_id');
            $table->index('permission_id');
        });
        
        // 創建用戶角色關聯表
        Schema::create('user_roles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('role_id')->constrained('roles')->onDelete('cascade');
            $table->timestamp('assigned_at')->useCurrent();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();
            
            // 唯一約束
            $table->unique(['user_id', 'role_id']);
            
            // 索引
            $table->index('user_id');
            $table->index('role_id');
            $table->index('expires_at');
        });
        
        // 創建用戶 OAuth 帳戶表
        Schema::create('user_oauth_accounts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('provider');
            $table->string('provider_id');
            $table->string('provider_email')->nullable();
            $table->string('provider_username')->nullable();
            $table->json('provider_data')->nullable();
            $table->timestamps();
            $table->softDeletes();
            
            // 唯一約束
            $table->unique(['provider', 'provider_id']);
            
            // 索引
            $table->index('user_id');
            $table->index(['provider', 'provider_id']);
            $table->index('provider_email');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_oauth_accounts');
        Schema::dropIfExists('user_roles');
        Schema::dropIfExists('role_permissions');
        Schema::dropIfExists('permissions');
        Schema::dropIfExists('roles');
    }
};
