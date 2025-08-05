<?php
/**
 * PostgreSQL RLS 修復驗證腳本
 * 
 * 用途：全面測試 RLS 多租戶隔離是否正常運作
 */

require_once __DIR__ . '/vendor/autoload.php';

use Illuminate\Support\Facades\DB;

// 設定 Laravel 環境
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "✅ PostgreSQL RLS 修復驗證開始...\n\n";

try {
    // 1. 驗證資料庫連線和用戶
    echo "=== 1. 資料庫連線驗證 ===\n";
    $dbInfo = DB::select("
        SELECT 
            current_user,
            CASE 
                WHEN current_user = 'nexus_app' THEN '✅ 使用正確的應用用戶'
                WHEN current_user = 'nexus' THEN '❌ 仍在使用超級用戶'
                ELSE '⚠️ 使用未知用戶'
            END as user_status,
            current_database() as database
        FROM (SELECT 1) as dummy
    ")[0];
    
    echo "  當前用戶: {$dbInfo->current_user}\n";
    echo "  用戶狀態: {$dbInfo->user_status}\n";
    echo "  資料庫: {$dbInfo->database}\n\n";
    
    if ($dbInfo->current_user !== 'nexus_app') {
        throw new Exception("錯誤：仍在使用超級用戶，請檢查 .env 配置");
    }

    // 2. 測試不同公司的隔離效果
    echo "=== 2. 多租戶隔離測試 ===\n";
    
    $testCompanies = [77, 1, 2, 999];
    $tables = ['customers', 'products', 'suppliers'];
    
    foreach ($testCompanies as $companyId) {
        echo "  測試公司 ID: {$companyId}\n";
        
        // 設定公司上下文
        DB::statement("SELECT set_config('app.current_company_id', ?, false)", [$companyId]);
        
        foreach ($tables as $table) {
            try {
                $count = DB::table($table)->count();
                echo "    {$table}: {$count} 筆記錄\n";
            } catch (Exception $e) {
                echo "    {$table}: ❌ 錯誤 - " . $e->getMessage() . "\n";
            }
        }
        echo "\n";
    }

    // 3. 測試未設定公司 ID 的情況
    echo "=== 3. 未設定公司 ID 測試 ===\n";
    
    // 清除公司 ID 設定
    DB::statement("SELECT set_config('app.current_company_id', '', false)");
    
    foreach ($tables as $table) {
        try {
            $count = DB::table($table)->count();
            echo "  {$table}: {$count} 筆記錄（未設定公司 ID）\n";
        } catch (Exception $e) {
            echo "  {$table}: ❌ 錯誤 - " . $e->getMessage() . "\n";
        }
    }
    echo "\n";

    // 4. 測試 Laravel 中間件整合
    echo "=== 4. Laravel 中間件整合測試 ===\n";
    
    // 模擬中間件行為
    $testCompanyId = 77;
    DB::statement("SELECT set_config('app.current_company_id', ?, false)", [$testCompanyId]);
    
    // 使用 Laravel Eloquent 測試
    try {
        // 測試是否有 Customer 模型
        if (class_exists('App\Models\Customer')) {
            $customerCount = \App\Models\Customer::count();
            echo "  Customer Eloquent 查詢: {$customerCount} 筆\n";
        } else {
            echo "  Customer 模型不存在，跳過 Eloquent 測試\n";
        }
        
        // 使用查詢建構器測試
        $rawCount = DB::table('customers')->count();
        echo "  Query Builder 查詢: {$rawCount} 筆\n";
        
        // 驗證是否相同
        if (class_exists('App\Models\Customer')) {
            if ($customerCount === $rawCount) {
                echo "  ✅ Eloquent 和 Query Builder 結果一致\n";
            } else {
                echo "  ⚠️ Eloquent 和 Query Builder 結果不一致\n";
            }
        }
        
    } catch (Exception $e) {
        echo "  ❌ Laravel 整合測試失敗: " . $e->getMessage() . "\n";
    }
    echo "\n";

    // 5. 測試 CRUD 操作
    echo "=== 5. CRUD 操作測試 ===\n";
    
    DB::statement("SELECT set_config('app.current_company_id', '77', false)");
    
    try {
        // 測試插入
        DB::table('customers')->insert([
            'name' => 'RLS Test Customer',
            'email' => 'rls-test@example.com',
            'company_id' => 77,
            'created_at' => now(),
            'updated_at' => now()
        ]);
        echo "  ✅ INSERT 操作成功\n";
        
        // 測試查詢
        $testCustomer = DB::table('customers')
            ->where('email', 'rls-test@example.com')
            ->first();
            
        if ($testCustomer) {
            echo "  ✅ SELECT 操作成功\n";
            
            // 測試更新
            DB::table('customers')
                ->where('id', $testCustomer->id)
                ->update(['name' => 'RLS Test Customer Updated']);
            echo "  ✅ UPDATE 操作成功\n";
            
            // 測試刪除
            DB::table('customers')
                ->where('id', $testCustomer->id)
                ->delete();
            echo "  ✅ DELETE 操作成功\n";
        } else {
            echo "  ❌ 無法找到插入的測試資料\n";
        }
        
    } catch (Exception $e) {
        echo "  ❌ CRUD 操作失敗: " . $e->getMessage() . "\n";
    }
    echo "\n";

    // 6. 測試跨公司資料隔離
    echo "=== 6. 跨公司資料隔離驗證 ===\n";
    
    // 建立兩個不同公司的測試資料
    try {
        // 公司 77 的資料
        DB::statement("SELECT set_config('app.current_company_id', '77', false)");
        DB::table('customers')->insert([
            'name' => 'Company 77 Customer',
            'email' => 'company77@example.com',
            'company_id' => 77,
            'created_at' => now(),
            'updated_at' => now()
        ]);
        
        // 公司 1 的資料  
        DB::statement("SELECT set_config('app.current_company_id', '1', false)");
        DB::table('customers')->insert([
            'name' => 'Company 1 Customer',
            'email' => 'company1@example.com',
            'company_id' => 1,
            'created_at' => now(),
            'updated_at' => now()
        ]);
        
        // 測試公司 77 用戶只能看到自己的資料
        DB::statement("SELECT set_config('app.current_company_id', '77', false)");
        $company77Count = DB::table('customers')
            ->where('email', 'like', 'company%@example.com')
            ->count();
            
        // 測試公司 1 用戶只能看到自己的資料
        DB::statement("SELECT set_config('app.current_company_id', '1', false)");
        $company1Count = DB::table('customers')
            ->where('email', 'like', 'company%@example.com')
            ->count();
            
        echo "  公司 77 看到的測試資料: {$company77Count} 筆\n";
        echo "  公司 1 看到的測試資料: {$company1Count} 筆\n";
        
        if ($company77Count === 1 && $company1Count === 1) {
            echo "  ✅ 跨公司資料隔離正常\n";
        } else {
            echo "  ❌ 跨公司資料隔離有問題\n";
        }
        
        // 清理測試資料
        DB::statement("SELECT set_config('app.current_company_id', '', false)");
        DB::table('customers')->where('email', 'company77@example.com')->delete();
        DB::table('customers')->where('email', 'company1@example.com')->delete();
        
    } catch (Exception $e) {
        echo "  ❌ 跨公司隔離測試失敗: " . $e->getMessage() . "\n";
    }
    echo "\n";

    // 7. 總結報告
    echo "=== 7. 總結報告 ===\n";
    
    DB::statement("SELECT set_config('app.current_company_id', '77', false)");
    
    $summary = [];
    foreach ($tables as $table) {
        $count = DB::table($table)->count();
        $summary[$table] = $count;
    }
    
    echo "  🎯 RLS 修復結果摘要：\n";
    echo "  ----------------------\n";
    foreach ($summary as $table => $count) {
        echo "  📊 {$table}: {$count} 筆記錄（公司 77）\n";
    }
    
    // 預期結果比較
    $expected = [
        'customers' => 8,
        'products' => 18,
        'suppliers' => 0
    ];
    
    echo "\n  📋 預期結果比較：\n";
    echo "  ----------------------\n";
    $allMatch = true;
    foreach ($expected as $table => $expectedCount) {
        $actualCount = $summary[$table];
        $status = ($actualCount === $expectedCount) ? '✅' : '❌';
        echo "  {$status} {$table}: 預期 {$expectedCount}, 實際 {$actualCount}\n";
        if ($actualCount !== $expectedCount) {
            $allMatch = false;
        }
    }
    
    echo "\n";
    if ($allMatch) {
        echo "  🎉 RLS 修復完全成功！多租戶隔離正常運作！\n";
    } else {
        echo "  ⚠️ RLS 修復部分成功，但仍有問題需要解決\n";
    }

} catch (Exception $e) {
    echo "❌ 驗證過程中發生錯誤: " . $e->getMessage() . "\n";
    echo "堆疊追蹤:\n" . $e->getTraceAsString() . "\n";
}

echo "\n🏁 PostgreSQL RLS 修復驗證完成！\n";