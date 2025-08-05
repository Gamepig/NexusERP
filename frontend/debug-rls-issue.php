<?php
/**
 * PostgreSQL RLS 問題診斷腳本
 * 
 * 用途：診斷為什麼 RLS 政策沒有正確過濾記錄
 */

require_once __DIR__ . '/vendor/autoload.php';

use Illuminate\Support\Facades\DB;

// 設定 Laravel 環境
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "🔍 PostgreSQL RLS 問題診斷開始...\n\n";

try {
    // 1. 檢查當前資料庫連線用戶
    echo "=== 1. 資料庫連線資訊 ===\n";
    $connectionInfo = DB::select("
        SELECT 
            current_user as current_user,
            session_user as session_user,
            current_database() as database_name,
            version() as postgres_version
    ");
    
    foreach ($connectionInfo[0] as $key => $value) {
        echo "  {$key}: {$value}\n";
    }
    echo "\n";

    // 2. 檢查 RLS 啟用狀態
    echo "=== 2. RLS 啟用狀態檢查 ===\n";
    $rlsStatus = DB::select("
        SELECT 
            schemaname,
            tablename,
            rowsecurity as rls_enabled,
            CASE 
                WHEN rowsecurity THEN '✅ 已啟用'
                ELSE '❌ 未啟用'
            END as status
        FROM pg_tables pt
        LEFT JOIN pg_class pc ON pc.relname = pt.tablename
        WHERE pt.schemaname = 'public'
        AND pt.tablename IN ('customers', 'products', 'suppliers', 'sales_orders', 'purchase_orders')
        ORDER BY pt.tablename
    ");
    
    foreach ($rlsStatus as $table) {
        echo "  {$table->tablename}: {$table->status}\n";
    }
    echo "\n";

    // 3. 檢查 RLS 政策
    echo "=== 3. RLS 政策檢查 ===\n";
    $policies = DB::select("
        SELECT 
            tablename,
            policyname,
            permissive,
            roles,
            cmd,
            qual as policy_condition
        FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename IN ('customers', 'products', 'suppliers', 'sales_orders', 'purchase_orders')
        ORDER BY tablename, policyname
    ");
    
    if (empty($policies)) {
        echo "  ❌ 沒有找到任何 RLS 政策！\n";
    } else {
        foreach ($policies as $policy) {
            echo "  表: {$policy->tablename}\n";
            echo "    政策名稱: {$policy->policyname}\n";
            echo "    角色: {$policy->roles}\n";
            echo "    指令: {$policy->cmd}\n";
            echo "    條件: {$policy->policy_condition}\n";
            echo "\n";
        }
    }
    echo "\n";

    // 4. 測試會話變數設定
    echo "=== 4. 會談變數測試 ===\n";
    
    // 設定公司 ID
    $testCompanyId = 77;
    DB::statement("SELECT set_config('app.current_company_id', ?, false)", [$testCompanyId]);
    
    // 驗證設定
    $currentSetting = DB::select("SELECT current_setting('app.current_company_id', true) as company_id")[0];
    echo "  設定的公司 ID: {$currentSetting->company_id}\n";
    
    // 測試不同的設定方式
    echo "\n  測試不同的設定方式:\n";
    
    // 方式1: set_config with false
    DB::statement("SELECT set_config('app.current_company_id', ?, false)", [$testCompanyId]);
    $result1 = DB::select("SELECT current_setting('app.current_company_id', true) as value")[0];
    echo "    方式1 (set_config false): {$result1->value}\n";
    
    // 方式2: set_config with true
    DB::statement("SELECT set_config('app.current_company_id', ?, true)", [$testCompanyId]);
    $result2 = DB::select("SELECT current_setting('app.current_company_id', true) as value")[0];
    echo "    方式2 (set_config true): {$result2->value}\n";
    
    // 方式3: SET 指令
    DB::statement("SET app.current_company_id = {$testCompanyId}");
    $result3 = DB::select("SELECT current_setting('app.current_company_id', true) as value")[0];
    echo "    方式3 (SET): {$result3->value}\n";
    
    echo "\n";

    // 5. 測試政策條件
    echo "=== 5. 政策條件測試 ===\n";
    
    // 重新設定公司 ID
    DB::statement("SELECT set_config('app.current_company_id', ?, false)", [$testCompanyId]);
    
    $tables = ['customers', 'products', 'suppliers'];
    
    foreach ($tables as $table) {
        echo "  測試表: {$table}\n";
        
        try {
            // 總記錄數
            $totalCount = DB::table($table)->count();
            echo "    總記錄數: {$totalCount}\n";
            
            // 公司 77 的記錄數（手動過濾）
            $companyCount = DB::table($table)->where('company_id', $testCompanyId)->count();
            echo "    公司 {$testCompanyId} 記錄數（手動過濾）: {$companyCount}\n";
            
            // RLS 過濾後的記錄數
            $rlsCount = DB::select("SELECT COUNT(*) as count FROM {$table}")[0]->count;
            echo "    RLS 過濾後記錄數: {$rlsCount}\n";
            
            // 測試政策條件
            $policyTest = DB::select("
                SELECT 
                    COUNT(*) as total_records,
                    COUNT(CASE WHEN company_id = current_setting('app.current_company_id', true)::int THEN 1 END) as policy_match_records,
                    current_setting('app.current_company_id', true)::int as current_company_id
                FROM {$table}
            ")[0];
            
            echo "    政策條件匹配記錄數: {$policyTest->policy_match_records}\n";
            echo "    當前設定的公司 ID: {$policyTest->current_company_id}\n";
            
            // 檢查是否有問題
            if ($rlsCount != $companyCount) {
                echo "    ❌ RLS 過濾有問題！期望: {$companyCount}，實際: {$rlsCount}\n";
            } else {
                echo "    ✅ RLS 過濾正常\n";
            }
            
        } catch (Exception $e) {
            echo "    ❌ 錯誤: " . $e->getMessage() . "\n";
        }
        
        echo "\n";
    }

    // 6. 檢查 Laravel 連線配置
    echo "=== 6. Laravel 資料庫配置檢查 ===\n";
    $config = config('database.connections.pgsql');
    echo "  資料庫用戶: " . ($config['username'] ?? 'undefined') . "\n";
    echo "  資料庫名稱: " . ($config['database'] ?? 'undefined') . "\n";
    echo "  資料庫主機: " . ($config['host'] ?? 'undefined') . "\n";
    echo "  資料庫端口: " . ($config['port'] ?? 'undefined') . "\n";
    echo "\n";

    // 7. 檢查資料庫用戶權限
    echo "=== 7. 資料庫用戶權限檢查 ===\n";
    
    $userInfo = DB::select("
        SELECT 
            rolname,
            rolsuper,
            rolinherit,
            rolcreaterole,
            rolcreatedb,
            rolcanlogin,
            rolconnlimit,
            CASE 
                WHEN rolsuper THEN '⚠️ 超級用戶（會繞過 RLS）'
                ELSE '✅ 一般用戶'
            END as rls_status
        FROM pg_roles 
        WHERE rolname = current_user
    ");
    
    foreach ($userInfo as $user) {
        echo "  用戶名稱: {$user->rolname}\n";
        echo "  超級用戶: " . ($user->rolsuper ? '是' : '否') . "\n";
        echo "  RLS 狀態: {$user->rls_status}\n";
    }
    echo "\n";

    // 8. 測試具體的 RLS 政策語法
    echo "=== 8. RLS 政策語法測試 ===\n";
    
    // 重新設定公司 ID
    DB::statement("SELECT set_config('app.current_company_id', ?, false)", [$testCompanyId]);
    
    $syntaxTests = [
        "current_setting('app.current_company_id', true)::int" => "轉換為整數",
        "current_setting('app.current_company_id', true)" => "字串比較",
        "COALESCE(NULLIF(current_setting('app.current_company_id', true), ''), '0')::int" => "複雜轉換"
    ];
    
    foreach ($syntaxTests as $expression => $description) {
        try {
            $result = DB::select("SELECT {$expression} as result")[0];
            echo "  {$description}: {$result->result}\n";
        } catch (Exception $e) {
            echo "  {$description}: ❌ 錯誤 - " . $e->getMessage() . "\n";
        }
    }

} catch (Exception $e) {
    echo "❌ 診斷過程中發生錯誤: " . $e->getMessage() . "\n";
    echo "堆疊追蹤:\n" . $e->getTraceAsString() . "\n";
}

echo "\n🏁 PostgreSQL RLS 問題診斷完成！\n";