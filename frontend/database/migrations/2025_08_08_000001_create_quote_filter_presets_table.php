<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('quote_filter_presets', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('company_id')->nullable();
            $table->string('name');
            $table->json('filters');
            $table->timestamps();
            $table->index(['user_id','company_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('quote_filter_presets');
    }
};


