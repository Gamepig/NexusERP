<?php

require_once __DIR__ . '/vendor/autoload.php';

// Bootstrap Laravel
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "🔍 調試登入流程...\n\n";

try {
    // 1. 檢查測試用戶
    $user = App\Models\User::where('email', 'test@example.com')->first();
    
    if (!$user) {
        echo "❌ 測試用戶不存在\n";
        exit(1);
    }
    
    echo "✅ 1. 測試用戶存在: {$user->name}\n";
    
    // 2. 檢查密碼
    $passwordCorrect = Hash::check('password123', $user->password);
    echo ($passwordCorrect ? "✅" : "❌") . " 2. 密碼驗證: " . ($passwordCorrect ? "正確" : "錯誤") . "\n";
    
    // 3. 模擬登入
    Auth::login($user);
    echo "✅ 3. 模擬登入成功\n";
    
    // 4. 檢查認證狀態
    $isAuthenticated = Auth::check();
    echo ($isAuthenticated ? "✅" : "❌") . " 4. 認證狀態: " . ($isAuthenticated ? "已認證" : "未認證") . "\n";
    
    // 5. 測試公司關聯
    try {
        $companyCount = $user->companies()->count();
        echo "✅ 5. 公司關聯: {$companyCount} 個\n";
        
        if ($companyCount > 0) {
            $primaryCompany = $user->companies()
                ->wherePivot('is_primary', true)
                ->wherePivot('is_active', true)
                ->first();
                
            if ($primaryCompany) {
                echo "✅ 6. 主要公司: {$primaryCompany->name} (ID: {$primaryCompany->id})\n";
            } else {
                echo "⚠️ 6. 找不到主要公司\n";
            }
        }
        
    } catch (Exception $e) {
        echo "❌ 5. 公司關聯檢查錯誤: " . $e->getMessage() . "\n";
    }
    
    // 6. 測試 PostgreSQL 設定
    try {
        DB::statement("SELECT set_config('app.current_company_id', ?, false)", [77]);
        echo "✅ 7. PostgreSQL 會話變數設定成功\n";
        
        $result = DB::select("SELECT current_setting('app.current_company_id') as company_id");
        echo "✅ 8. 會話變數讀取: " . $result[0]->company_id . "\n";
        
    } catch (Exception $e) {
        echo "❌ 7. PostgreSQL 會話變數錯誤: " . $e->getMessage() . "\n";
    }
    
    // 7. 測試路由
    try {
        $dashboardRoute = route('dashboard');
        echo "✅ 9. Dashboard 路由: {$dashboardRoute}\n";
    } catch (Exception $e) {
        echo "❌ 9. Dashboard 路由錯誤: " . $e->getMessage() . "\n";
    }
    
    echo "\n🎉 登入流程調試完成\n";
    
} catch (Exception $e) {
    echo "❌ 調試過程出錯: " . $e->getMessage() . "\n";
    echo "📚 堆疊跟蹤:\n" . $e->getTraceAsString() . "\n";
}