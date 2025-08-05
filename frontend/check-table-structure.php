<?php

/**
 * 檢查核心管理表格的 company_id 欄位狀況
 */

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "🔍 檢查核心管理表格結構\n";
echo "======================\n\n";

$tables = ['customers', 'products', 'suppliers', 'sales_orders', 'purchase_orders'];

foreach ($tables as $table) {
    echo "📋 表格: {$table}\n";
    echo str_repeat('-', strlen($table) + 10) . "\n";
    
    try {
        // 檢查欄位是否存在
        $columns = DB::select("
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_name = ? AND table_schema = 'public'
            ORDER BY ordinal_position
        ", [$table]);
        
        $hasCompanyId = false;
        foreach ($columns as $column) {
            if ($column->column_name === 'company_id') {
                $hasCompanyId = true;
                echo "   ✅ company_id 欄位存在\n";
                echo "      - 類型: {$column->data_type}\n";
                echo "      - 允許 NULL: {$column->is_nullable}\n";
                echo "      - 預設值: " . ($column->column_default ?: 'none') . "\n";
                break;
            }
        }
        
        if (!$hasCompanyId) {
            echo "   ❌ company_id 欄位不存在\n";
        }
        
        // 檢查 RLS 狀態
        $rlsStatus = DB::select("
            SELECT relname, relrowsecurity as rls_enabled, relforcerowsecurity as rls_forced
            FROM pg_class
            WHERE relname = ? AND relkind = 'r'
        ", [$table]);
        
        if (!empty($rlsStatus)) {
            $rls = $rlsStatus[0];
            echo "   📊 RLS 狀態: " . ($rls->rls_enabled ? "已啟用" : "未啟用") . "\n";
            echo "   🔒 強制 RLS: " . ($rls->rls_forced ? "是" : "否") . "\n";
        }
        
        // 檢查 RLS 政策
        $policies = DB::select("
            SELECT policyname, cmd, permissive, roles, qual 
            FROM pg_policies 
            WHERE tablename = ? AND schemaname = 'public'
        ", [$table]);
        
        if (!empty($policies)) {
            echo "   📜 RLS 政策數量: " . count($policies) . "\n";
            foreach ($policies as $policy) {
                echo "      - {$policy->policyname}: {$policy->cmd}\n";
            }
        } else {
            echo "   ❌ 沒有 RLS 政策\n";
        }
        
        // 檢查數據量
        if ($hasCompanyId) {
            $dataCount = DB::table($table)->count();
            echo "   📈 總記錄數: {$dataCount}\n";
            
            // 檢查每個公司的數據分佈
            $companyData = DB::table($table)
                ->select('company_id', DB::raw('COUNT(*) as count'))
                ->groupBy('company_id')
                ->get();
            
            echo "   🏢 公司數據分佈:\n";
            foreach ($companyData as $data) {
                echo "      公司 ID {$data->company_id}: {$data->count} 筆\n";
            }
        }
        
    } catch (Exception $e) {
        echo "   ❌ 檢查失敗: " . $e->getMessage() . "\n";
    }
    
    echo "\n";
}

// 檢查當前用戶上下文設定
echo "🔧 當前設定檢查\n";
echo "================\n";

try {
    $currentCompanyId = DB::select("SELECT current_setting('app.current_company_id', true) as company_id")[0]->company_id ?? 'not set';
    echo "   📍 當前公司 ID: {$currentCompanyId}\n";
    
    $currentUserId = DB::select("SELECT current_setting('app.current_user_id', true) as user_id")[0]->user_id ?? 'not set';
    echo "   👤 當前用戶 ID: {$currentUserId}\n";
    
    $bypassRls = DB::select("SELECT current_setting('app.bypass_rls', true) as bypass_rls")[0]->bypass_rls ?? 'false';
    echo "   🔓 繞過 RLS: {$bypassRls}\n";
    
} catch (Exception $e) {
    echo "   ❌ 設定檢查失敗: " . $e->getMessage() . "\n";
}

echo "\n✨ 表格結構檢查完成\n";