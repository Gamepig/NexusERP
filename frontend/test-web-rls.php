<?php

/**
 * 測試 Web 應用的 RLS 狀況
 * 模擬 Web 請求中的資料庫連接
 */

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Http\Kernel::class)->bootstrap();

echo "🌐 測試 Web 應用 RLS 狀況\n";
echo "==============================\n\n";

// 模擬 Web 認證
use Illuminate\Support\Facades\DB;

try {
    // 檢查目前使用的資料庫用戶
    $dbUser = DB::selectOne("SELECT current_user as user")->user;
    echo "🔗 目前資料庫用戶: {$dbUser}\n";
    
    // 檢查是否有設定公司 ID
    $companyIdResult = DB::selectOne("SELECT current_setting('app.current_company_id', true) as company_id");
    echo "🏢 目前公司 ID: " . ($companyIdResult->company_id ?: 'not set') . "\n\n";
    
    // 設定公司 ID (模擬中間件行為)
    $testCompanyId = 77;
    DB::statement("SELECT set_config('app.current_company_id', ?, false)", [$testCompanyId]);
    echo "✅ 已設定公司 ID: {$testCompanyId}\n\n";
    
    // 測試各表的查詢結果
    $results = [
        'customers' => DB::table('customers')->count(),
        'products' => DB::table('products')->count(),
        'suppliers' => DB::table('suppliers')->count(),
        'sales_orders' => DB::table('sales_orders')->count()
    ];
    
    echo "📊 查詢結果:\n";
    foreach ($results as $table => $count) {
        echo "   - {$table}: {$count} 筆記錄\n";
    }
    
    echo "\n🎯 結論:\n";
    if ($results['customers'] <= 10 && $results['products'] <= 20) {
        echo "✅ RLS 正常運作 - 記錄數符合公司隔離預期\n";
    } else {
        echo "❌ RLS 可能異常 - 記錄數過多，建議檢查\n";
    }
    
} catch (Exception $e) {
    echo "❌ 錯誤: " . $e->getMessage() . "\n";
}

echo "\n✨ 測試完成\n";