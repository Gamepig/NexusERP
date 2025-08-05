<?php

require_once __DIR__ . '/vendor/autoload.php';

// Bootstrap Laravel
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "🔍 檢查 Go 後端用戶數據...\n\n";

try {
    // 直接查詢 PostgreSQL users 表
    $users = DB::select("SELECT id, name, email, created_at FROM users WHERE email = 'test@example.com'");
    
    if (!empty($users)) {
        $user = $users[0];
        echo "✅ 在 PostgreSQL 中找到用戶:\n";
        echo "  ID: {$user->id}\n";
        echo "  姓名: {$user->name}\n";
        echo "  郵箱: {$user->email}\n";
        echo "  創建時間: {$user->created_at}\n";
        
        // 檢查用戶的公司關聯
        $companies = DB::select("
            SELECT c.id, c.name 
            FROM companies c 
            JOIN user_companies uc ON c.id = uc.company_id 
            WHERE uc.user_id = ? AND uc.is_active = true
        ", [$user->id]);
        
        echo "\n🏢 用戶公司關聯:\n";
        foreach ($companies as $company) {
            echo "  - {$company->name} (ID: {$company->id})\n";
        }
        
    } else {
        echo "❌ 在 PostgreSQL 中找不到測試用戶\n";
        
        // 列出所有用戶
        $allUsers = DB::select("SELECT id, name, email FROM users LIMIT 5");
        echo "\n📋 資料庫中的其他用戶:\n";
        foreach ($allUsers as $user) {
            echo "  - {$user->name} ({$user->email})\n";
        }
    }
    
    // 測試 Go 後端 API 連接
    echo "\n🌐 測試 Go 後端 API 連接...\n";
    
    $baseUrl = 'http://127.0.0.1:8082/api';
    
    try {
        $response = Http::timeout(5)->get($baseUrl . '/health');
        echo "健康檢查狀態碼: " . $response->status() . "\n";
        echo "健康檢查回應: " . $response->body() . "\n";
    } catch (Exception $e) {
        echo "❌ Go 後端連接失敗: " . $e->getMessage() . "\n";
    }
    
    // 嘗試註冊/同步用戶
    echo "\n🔄 嘗試同步用戶到 Go 後端...\n";
    
    $user = App\Models\User::where('email', 'test@example.com')->first();
    if ($user) {
        $secret = config('app.key') ?? 'default-secret';
        $syncPassword = 'sync_' . hash('sha256', $user->email . $secret);
        
        $registerData = [
            'name' => $user->name,
            'email' => $user->email,
            'password' => $syncPassword,
            'first_name' => $user->first_name ?? null,
            'last_name' => $user->last_name ?? null,
            'registration_method' => 'laravel_sync'
        ];
        
        echo "註冊數據: " . json_encode($registerData, JSON_UNESCAPED_UNICODE) . "\n";
        
        try {
            $response = Http::withHeaders([
                'Accept' => 'application/json',
                'Content-Type' => 'application/json',
            ])
            ->timeout(10)
            ->post($baseUrl . '/auth/register', $registerData);
            
            echo "註冊回應狀態碼: " . $response->status() . "\n";
            echo "註冊回應: " . $response->body() . "\n";
            
            if ($response->successful()) {
                echo "✅ 用戶同步成功！\n";
                
                // 現在嘗試登入
                echo "\n🔐 嘗試登入 Go 後端...\n";
                
                $loginData = [
                    'name' => $user->name,
                    'password' => $syncPassword
                ];
                
                $loginResponse = Http::withHeaders([
                    'Accept' => 'application/json',
                    'Content-Type' => 'application/json',
                ])
                ->timeout(10)
                ->post($baseUrl . '/auth/login', $loginData);
                
                echo "登入回應狀態碼: " . $loginResponse->status() . "\n";
                echo "登入回應: " . $loginResponse->body() . "\n";
                
                if ($loginResponse->successful()) {
                    $loginResult = $loginResponse->json();
                    if (isset($loginResult['token'])) {
                        echo "✅ Go 後端登入成功！令牌: " . substr($loginResult['token'], 0, 20) . "...\n";
                    }
                }
            }
            
        } catch (Exception $e) {
            echo "❌ 用戶同步失敗: " . $e->getMessage() . "\n";
        }
    }
    
} catch (Exception $e) {
    echo "❌ 檢查過程出錯: " . $e->getMessage() . "\n";
    echo "📚 堆疊跟蹤:\n" . $e->getTraceAsString() . "\n";
}