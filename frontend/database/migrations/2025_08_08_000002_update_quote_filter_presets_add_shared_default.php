<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('quote_filter_presets', function (Blueprint $table) {
            $table->boolean('shared')->default(true)->after('filters');
            $table->boolean('is_default')->default(false)->after('shared');
            $table->index(['company_id','is_default']);
        });
    }

    public function down(): void
    {
        Schema::table('quote_filter_presets', function (Blueprint $table) {
            $table->dropIndex(['company_id','is_default']);
            $table->dropColumn(['shared','is_default']);
        });
    }
};


