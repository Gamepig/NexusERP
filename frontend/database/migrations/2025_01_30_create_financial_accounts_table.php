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
        Schema::create('financial_accounts', function (Blueprint $table) {
            $table->id();
            $table->string('account_code')->unique();
            $table->string('account_name');
            $table->enum('account_type', ['cash', 'bank', 'receivable', 'payable', 'asset', 'liability', 'equity', 'revenue', 'expense']);
            $table->string('currency', 3)->default('TWD');
            $table->decimal('balance', 15, 2)->default(0);
            $table->date('date');
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->unsignedBigInteger('parent_id')->nullable();
            $table->text('description')->nullable();
            $table->timestamps();
            
            // Indexes
            $table->index('account_type');
            $table->index('status');
            $table->index('date');
            $table->foreign('parent_id')->references('id')->on('financial_accounts')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('financial_accounts');
    }
};