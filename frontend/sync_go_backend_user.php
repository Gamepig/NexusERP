<?php

require_once __DIR__ . '/vendor/autoload.php';

// Bootstrap Laravel
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "🔄 同步 Go 後端用戶密碼...\n\n";

try {
    $user = App\Models\User::where('email', 'test@example.com')->first();
    if (!$user) {
        echo "❌ 找不到 Laravel 用戶\n";
        exit(1);
    }
    
    echo "✅ Laravel 用戶: {$user->name} ({$user->email})\n";
    
    // 生成同步密碼
    $secret = config('app.key') ?? 'default-secret';
    $syncPassword = 'sync_' . hash('sha256', $user->email . $secret);
    
    echo "🔑 生成的同步密碼: {$syncPassword}\n";
    
    // 直接在 PostgreSQL 中更新 Go 後端用戶的密碼
    echo "\n🔧 直接更新 PostgreSQL 中的用戶密碼...\n";
    
    // 首先查看 Go 後端用戶表結構
    $columns = DB::select("
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        ORDER BY ordinal_position
    ");
    
    echo "📋 users 表結構:\n";
    foreach ($columns as $column) {
        echo "  {$column->column_name}: {$column->data_type}\n";
    }
    
    // 檢查當前用戶的密碼
    $currentUser = DB::select("SELECT id, name, email, password FROM users WHERE email = ?", [$user->email]);
    
    if (!empty($currentUser)) {
        $goUser = $currentUser[0];
        echo "\n👤 Go 後端用戶信息:\n";
        echo "  ID: {$goUser->id}\n";
        echo "  姓名: {$goUser->name}\n";
        echo "  郵箱: {$goUser->email}\n";
        echo "  當前密碼哈希: " . substr($goUser->password, 0, 20) . "...\n";
        
        // 在 Go 中，密碼通常使用 bcrypt 哈希
        // 我們需要使用 Go 相容的哈希方式
        
        // 嘗試使用 PHP 的 password_hash 函數（與 Go bcrypt 相容）
        $hashedPassword = password_hash($syncPassword, PASSWORD_BCRYPT);
        
        echo "🔒 新的 bcrypt 哈希: " . substr($hashedPassword, 0, 20) . "...\n";
        
        // 更新用戶密碼
        $updateResult = DB::update("UPDATE users SET password = ? WHERE id = ?", [$hashedPassword, $goUser->id]);
        
        if ($updateResult) {
            echo "✅ 密碼更新成功！\n";
            
            // 測試登入
            echo "\n🔐 測試 Go 後端登入...\n";
            
            $baseUrl = 'http://127.0.0.1:8082/api';
            $loginData = [
                'name' => $user->name,
                'password' => $syncPassword
            ];
            
            $response = Http::withHeaders([
                'Accept' => 'application/json',
                'Content-Type' => 'application/json',
            ])
            ->timeout(10)
            ->post($baseUrl . '/auth/login', $loginData);
            
            echo "登入回應狀態碼: " . $response->status() . "\n";
            echo "登入回應: " . $response->body() . "\n";
            
            if ($response->successful()) {
                $loginResult = $response->json();
                if (isset($loginResult['token'])) {
                    echo "🎉 Go 後端登入成功！令牌: " . substr($loginResult['token'], 0, 20) . "...\n";
                    
                    // 測試使用令牌請求客戶數據
                    echo "\n👥 測試客戶 API...\n";
                    
                    $customersResponse = Http::withHeaders([
                        'Accept' => 'application/json',
                        'Authorization' => 'Bearer ' . $loginResult['token'],
                    ])
                    ->timeout(10)
                    ->get($baseUrl . '/customers/');
                    
                    echo "客戶 API 狀態碼: " . $customersResponse->status() . "\n";
                    echo "客戶 API 回應: " . substr($customersResponse->body(), 0, 200) . "...\n";
                    
                    if ($customersResponse->successful()) {
                        $customersData = $customersResponse->json();
                        $customerCount = count($customersData['customers'] ?? []);
                        echo "✅ 客戶 API 請求成功！找到 {$customerCount} 個客戶\n";
                    }
                }
            } else {
                echo "❌ Go 後端登入仍然失敗\n";
            }
            
        } else {
            echo "❌ 密碼更新失敗\n";
        }
        
    } else {
        echo "❌ 在 Go 後端找不到用戶\n";
    }
    
} catch (Exception $e) {
    echo "❌ 同步過程出錯: " . $e->getMessage() . "\n";
    echo "📚 堆疊跟蹤:\n" . $e->getTraceAsString() . "\n";
}