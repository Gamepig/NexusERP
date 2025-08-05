<?php

/**
 * 測試核心管理頁面的 RLS 套用狀況
 * 驗證客戶管理、商品管理、供應商管理、採購訂單、銷售訂單的資料隔離
 */

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "🔐 NexusERP 核心管理頁面 RLS 測試\n";
echo "==================================\n\n";

try {
    $testCompanyId = 77; // Test Company ID
    
    // 設定公司上下文 (模擬 Laravel 中間件行為)
    DB::statement("SELECT set_config('app.current_company_id', ?, false)", [$testCompanyId]);
    
    // 驗證設定是否生效
    $currentCompanyId = DB::selectOne("SELECT current_setting('app.current_company_id', true) as company_id")->company_id;
    echo "🔧 目前設定的公司 ID: " . ($currentCompanyId ?: 'not set') . "\n";
    
    echo "📊 測試公司 ID: {$testCompanyId}\n\n";
    
    // 1. 客戶管理測試
    echo "1. 客戶管理 (Customers)\n";
    echo "----------------------\n";
    
    $customersTotal = DB::table('customers')->count();
    $customersCompany = DB::table('customers')->where('company_id', $testCompanyId)->count();
    
    echo "   - 資料庫總客戶數: {$customersTotal}\n";
    echo "   - 當前公司客戶數: {$customersCompany}\n";
    
    // 測試 RLS 查詢
    $customersRLS = DB::table('customers')->count();
    echo "   - RLS 查詢結果: {$customersRLS}\n";
    echo "   - RLS 狀態: " . ($customersRLS == $customersCompany ? "✅ 正常" : "❌ 異常") . "\n\n";
    
    // 2. 商品管理測試
    echo "2. 商品管理 (Products)\n";
    echo "--------------------\n";
    
    $productsTotal = DB::table('products')->count();
    $productsCompany = DB::table('products')->where('company_id', $testCompanyId)->count();
    
    echo "   - 資料庫總商品數: {$productsTotal}\n";
    echo "   - 當前公司商品數: {$productsCompany}\n";
    
    $productsRLS = DB::table('products')->count();
    echo "   - RLS 查詢結果: {$productsRLS}\n";
    echo "   - RLS 狀態: " . ($productsRLS == $productsCompany ? "✅ 正常" : "❌ 異常") . "\n\n";
    
    // 3. 供應商管理測試
    echo "3. 供應商管理 (Suppliers)\n";
    echo "-----------------------\n";
    
    $suppliersTotal = DB::table('suppliers')->count();
    $suppliersCompany = DB::table('suppliers')->where('company_id', $testCompanyId)->count();
    
    echo "   - 資料庫總供應商數: {$suppliersTotal}\n";
    echo "   - 當前公司供應商數: {$suppliersCompany}\n";
    
    $suppliersRLS = DB::table('suppliers')->count();
    echo "   - RLS 查詢結果: {$suppliersRLS}\n";
    echo "   - RLS 狀態: " . ($suppliersRLS == $suppliersCompany ? "✅ 正常" : "❌ 異常") . "\n\n";
    
    // 4. 採購訂單測試
    echo "4. 採購訂單 (Purchase Orders)\n";
    echo "---------------------------\n";
    
    $purchaseOrdersTotal = DB::table('purchase_orders')->count();
    $purchaseOrdersCompany = DB::table('purchase_orders')->where('company_id', $testCompanyId)->count();
    
    echo "   - 資料庫總採購訂單數: {$purchaseOrdersTotal}\n";
    echo "   - 當前公司採購訂單數: {$purchaseOrdersCompany}\n";
    
    $purchaseOrdersRLS = DB::table('purchase_orders')->count();
    echo "   - RLS 查詢結果: {$purchaseOrdersRLS}\n";
    echo "   - RLS 狀態: " . ($purchaseOrdersRLS == $purchaseOrdersCompany ? "✅ 正常" : "❌ 異常") . "\n\n";
    
    // 5. 銷售訂單測試
    echo "5. 銷售訂單 (Sales Orders)\n";
    echo "------------------------\n";
    
    $salesOrdersTotal = DB::table('sales_orders')->count();
    $salesOrdersCompany = DB::table('sales_orders')->where('company_id', $testCompanyId)->count();
    
    echo "   - 資料庫總銷售訂單數: {$salesOrdersTotal}\n";
    echo "   - 當前公司銷售訂單數: {$salesOrdersCompany}\n";
    
    $salesOrdersRLS = DB::table('sales_orders')->count();
    echo "   - RLS 查詢結果: {$salesOrdersRLS}\n";
    echo "   - RLS 狀態: " . ($salesOrdersRLS == $salesOrdersCompany ? "✅ 正常" : "❌ 異常") . "\n\n";
    
    // 6. 搜尋功能測試 (模擬搜尋邏輯)
    echo "6. 搜尋功能測試\n";
    echo "--------------\n";
    
    // 客戶搜尋測試 - 模擬搜尋包含 "Test" 的客戶
    $customerSearchRLS = DB::table('customers')
        ->where('name', 'like', '%Test%')
        ->count();
    $customerSearchDirect = DB::table('customers')
        ->where('company_id', $testCompanyId)
        ->where('name', 'like', '%Test%')
        ->count();
    
    echo "   - 客戶搜尋 RLS 結果: {$customerSearchRLS}\n";
    echo "   - 客戶搜尋直接結果: {$customerSearchDirect}\n";
    echo "   - 客戶搜尋狀態: " . ($customerSearchRLS == $customerSearchDirect ? "✅ 正常" : "❌ 異常") . "\n";
    
    // 產品搜尋測試
    $productSearchRLS = DB::table('products')
        ->where('name', 'like', '%測試%')
        ->count();
    $productSearchDirect = DB::table('products')
        ->where('company_id', $testCompanyId)
        ->where('name', 'like', '%測試%')
        ->count();
    
    echo "   - 產品搜尋 RLS 結果: {$productSearchRLS}\n";
    echo "   - 產品搜尋直接結果: {$productSearchDirect}\n";
    echo "   - 產品搜尋狀態: " . ($productSearchRLS == $productSearchDirect ? "✅ 正常" : "❌ 異常") . "\n\n";
    
    // 7. 總結
    echo "📋 RLS 測試總結\n";
    echo "==============\n";
    
    $tests = [
        '客戶管理' => $customersRLS == $customersCompany,
        '商品管理' => $productsRLS == $productsCompany, 
        '供應商管理' => $suppliersRLS == $suppliersCompany,
        '採購訂單' => $purchaseOrdersRLS == $purchaseOrdersCompany,
        '銷售訂單' => $salesOrdersRLS == $salesOrdersCompany,
        '客戶搜尋' => $customerSearchRLS == $customerSearchDirect,
        '產品搜尋' => $productSearchRLS == $productSearchDirect
    ];
    
    $passedTests = array_filter($tests);
    $totalTests = count($tests);
    $passedCount = count($passedTests);
    
    echo "✅ 通過測試: {$passedCount}/{$totalTests}\n";
    
    if ($passedCount == $totalTests) {
        echo "🎉 所有 RLS 測試通過！資料隔離運作正常。\n";
    } else {
        echo "⚠️  部分 RLS 測試失敗，需要檢查以下項目：\n";
        foreach ($tests as $testName => $result) {
            if (!$result) {
                echo "   ❌ {$testName}\n";
            }
        }
    }
    
} catch (Exception $e) {
    echo "❌ 測試執行錯誤: " . $e->getMessage() . "\n";
    echo "Stack trace: " . $e->getTraceAsString() . "\n";
}

echo "\n✨ RLS 測試完成\n";