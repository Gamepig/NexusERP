<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * 建立公司邀請表
 * 
 * 用於管理用戶加入公司的邀請流程
 */
return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('company_invitations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained('companies')->onDelete('cascade');
            $table->string('email');
            $table->string('role')->default('member'); // admin, manager, member
            $table->foreignId('invited_by_user_id')->constrained('users');
            $table->string('token')->unique();
            $table->timestamp('expires_at');
            $table->timestamp('accepted_at')->nullable();
            $table->foreignId('accepted_by_user_id')->nullable()->constrained('users');
            $table->json('business_unit_ids')->nullable();
            $table->text('message')->nullable();
            $table->timestamps();
            
            // 索引
            $table->index(['token', 'expires_at']);
            $table->index(['company_id', 'email']);
            $table->index('expires_at');
            $table->index('accepted_at');
            $table->index('invited_by_user_id');
            
            // 複合索引
            $table->index(['company_id', 'expires_at', 'accepted_at']);
        });

        echo "✅ company_invitations 表建立完成\n";
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('company_invitations');
    }
};