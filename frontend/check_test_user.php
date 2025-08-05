<?php

require_once __DIR__ . '/vendor/autoload.php';

// Bootstrap Laravel
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

try {
    // 檢查測試用戶
    $user = App\Models\User::where('email', 'test@example.com')->first();
    
    if ($user) {
        echo "✅ 用戶存在: {$user->name} (ID: {$user->id})\n";
        echo "📧 郵箱: {$user->email}\n";
        
        // 檢查公司關聯
        try {
            $companyCount = $user->companies()->count();
            echo "🏢 關聯公司數量: {$companyCount}\n";
            
            if ($companyCount > 0) {
                $companies = $user->companies()->get();
                foreach ($companies as $company) {
                    echo "  - 公司: {$company->name} (ID: {$company->id})\n";
                }
            } else {
                echo "⚠️ 用戶沒有關聯任何公司\n";
                
                // 檢查是否存在 user_companies 表
                try {
                    $tableExists = Schema::hasTable('user_companies');
                    echo "📊 user_companies 表存在: " . ($tableExists ? '是' : '否') . "\n";
                } catch (Exception $e) {
                    echo "❌ 檢查表存在性時出錯: " . $e->getMessage() . "\n";
                }
            }
        } catch (Exception $e) {
            echo "❌ 檢查公司關聯時出錯: " . $e->getMessage() . "\n";
        }
        
    } else {
        echo "❌ 測試用戶不存在\n";
        
        // 列出現有用戶
        $users = App\Models\User::limit(5)->get();
        echo "📋 現有用戶:\n";
        foreach ($users as $u) {
            echo "  - {$u->name} ({$u->email})\n";
        }
    }
    
} catch (Exception $e) {
    echo "❌ 執行時出錯: " . $e->getMessage() . "\n";
    echo "📚 堆疊跟蹤:\n" . $e->getTraceAsString() . "\n";
}