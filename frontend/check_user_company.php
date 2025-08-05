<?php

require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

// 檢查測試用戶的公司關聯
$user = \App\Models\User::where('email', 'test@example.com')->first();

if ($user) {
    echo "✅ 找到測試用戶: {$user->name} ({$user->email})" . PHP_EOL;
    echo "👤 用戶ID: {$user->id}" . PHP_EOL;
    
    // 檢查是否有公司關聯
    $hasCompany = $user->hasCompany();
    echo "🏢 有公司關聯: " . ($hasCompany ? '是' : '否') . PHP_EOL;
    
    if (!$hasCompany) {
        echo "❌ 用戶沒有公司關聯！" . PHP_EOL;
        
        // 檢查 user_companies 表
        $userCompanies = \Illuminate\Support\Facades\DB::table('user_companies')
            ->where('user_id', $user->id)
            ->get();
            
        echo "📊 user_companies 記錄數: {$userCompanies->count()}" . PHP_EOL;
        
        if ($userCompanies->count() > 0) {
            foreach ($userCompanies as $uc) {
                $active = $uc->is_active ? '是' : '否';
                echo "  - Company ID: {$uc->company_id}, Active: {$active}" . PHP_EOL;
            }
        }
        
        // 嘗試創建一個測試公司關聯
        echo PHP_EOL . "🔧 嘗試修復用戶公司關聯..." . PHP_EOL;
        
        // 檢查是否有可用的公司
        $companies = \Illuminate\Support\Facades\DB::table('companies')->get();
        echo "🏢 可用公司數: {$companies->count()}" . PHP_EOL;
        
        if ($companies->count() > 0) {
            $firstCompany = $companies->first();
            echo "使用公司: {$firstCompany->name} (ID: {$firstCompany->id})" . PHP_EOL;
            
            // 創建用戶公司關聯
            $existingAssociation = \Illuminate\Support\Facades\DB::table('user_companies')
                ->where('user_id', $user->id)
                ->where('company_id', $firstCompany->id)
                ->first();
                
            if (!$existingAssociation) {
                \Illuminate\Support\Facades\DB::table('user_companies')->insert([
                    'user_id' => $user->id,
                    'company_id' => $firstCompany->id,
                    'is_active' => true,
                    'is_primary' => true,
                    'joined_at' => now(),
                    'created_at' => now(),
                    'updated_at' => now()
                ]);
                echo "✅ 已創建用戶公司關聯" . PHP_EOL;
            } else {
                // 更新現有關聯為活躍狀態
                \Illuminate\Support\Facades\DB::table('user_companies')
                    ->where('user_id', $user->id)
                    ->where('company_id', $firstCompany->id)
                    ->update(['is_active' => true, 'updated_at' => now()]);
                echo "✅ 已更新用戶公司關聯為活躍狀態" . PHP_EOL;
            }
            
            // 重新檢查
            $hasCompanyAfter = $user->hasCompany();
            echo "🔄 修復後有公司關聯: " . ($hasCompanyAfter ? '是' : '否') . PHP_EOL;
            
        } else {
            echo "❌ 沒有可用的公司，嘗試創建測試公司" . PHP_EOL;
            
            // 創建測試公司
            $companyId = \Illuminate\Support\Facades\DB::table('companies')->insertGetId([
                'name' => 'Test Company',
                'display_name' => '測試公司',
                'code' => 'TEST',
                'email' => 'test@company.com',
                'phone' => '02-1234-5678',
                'address' => '台北市信義區',
                'business_type' => '科技業',
                'tax_id' => '12345678',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now()
            ]);
            
            echo "✅ 已創建測試公司 (ID: {$companyId})" . PHP_EOL;
            
            // 創建用戶公司關聯
            \Illuminate\Support\Facades\DB::table('user_companies')->insert([
                'user_id' => $user->id,
                'company_id' => $companyId,
                'is_active' => true,
                'is_primary' => true,
                'joined_at' => now(),
                'created_at' => now(),
                'updated_at' => now()
            ]);
            
            echo "✅ 已創建用戶公司關聯" . PHP_EOL;
        }
    } else {
        echo "✅ 用戶已有公司關聯" . PHP_EOL;
        
        // 顯示當前公司資訊
        $currentCompany = $user->currentCompany();
        if ($currentCompany) {
            echo "🏢 當前公司: {$currentCompany->name}" . PHP_EOL;
        }
    }
} else {
    echo "❌ 找不到測試用戶: test@example.com" . PHP_EOL;
    
    // 創建測試用戶
    echo "🔧 嘗試創建測試用戶..." . PHP_EOL;
    
    $user = \App\Models\User::create([
        'name' => '測試用戶',
        'email' => 'test@example.com',
        'password' => bcrypt('password123'),
        'email_verified_at' => now(),
    ]);
    
    echo "✅ 已創建測試用戶 (ID: {$user->id})" . PHP_EOL;
    
    // 檢查是否有公司
    $companies = \Illuminate\Support\Facades\DB::table('companies')->get();
    if ($companies->count() === 0) {
        // 創建測試公司
        $companyId = \Illuminate\Support\Facades\DB::table('companies')->insertGetId([
            'name' => 'Test Company',
            'display_name' => '測試公司',
            'code' => 'TEST',
            'email' => 'test@company.com',
            'phone' => '02-1234-5678',
            'address' => '台北市信義區',
            'business_type' => '科技業',
            'tax_id' => '12345678',
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now()
        ]);
        
        echo "✅ 已創建測試公司 (ID: {$companyId})" . PHP_EOL;
    } else {
        $companyId = $companies->first()->id;
        echo "✅ 使用現有公司 (ID: {$companyId})" . PHP_EOL;
    }
    
    // 創建用戶公司關聯
    \Illuminate\Support\Facades\DB::table('user_companies')->insert([
        'user_id' => $user->id,
        'company_id' => $companyId,
        'is_active' => true,
        'is_primary' => true,
        'joined_at' => now(),
        'created_at' => now(),
        'updated_at' => now()
    ]);
    
    echo "✅ 已創建用戶公司關聯" . PHP_EOL;
}

echo PHP_EOL . "🔍 最終檢查..." . PHP_EOL;

// 最終驗證
$user = \App\Models\User::where('email', 'test@example.com')->first();
if ($user && $user->hasCompany()) {
    echo "✅ 測試用戶公司設定完成！" . PHP_EOL;
} else {
    echo "❌ 測試用戶公司設定失敗！" . PHP_EOL;
}