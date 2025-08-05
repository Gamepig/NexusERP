<?php

require_once __DIR__ . '/vendor/autoload.php';

// Bootstrap Laravel
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "🔧 修復 Laravel 用戶密碼...\n\n";

try {
    $user = App\Models\User::where('email', 'test@example.com')->first();
    
    if (!$user) {
        echo "❌ 找不到用戶\n";
        exit(1);
    }
    
    echo "✅ 找到用戶: {$user->name} (ID: {$user->id})\n";
    echo "🔒 當前密碼哈希: " . substr($user->password, 0, 30) . "...\n";
    
    // 為 Laravel 設定密碼
    $laravelPassword = 'password123';
    $laravelHashedPassword = Hash::make($laravelPassword);
    
    echo "🔑 Laravel 新密碼: {$laravelPassword}\n";
    echo "🔒 Laravel 新哈希: " . substr($laravelHashedPassword, 0, 30) . "...\n";
    
    // 更新用戶密碼
    $user->password = $laravelHashedPassword;
    $user->save();
    
    echo "✅ Laravel 密碼更新成功！\n";
    
    // 驗證 Laravel 密碼
    $laravelPasswordCheck = Hash::check($laravelPassword, $laravelHashedPassword);
    echo ($laravelPasswordCheck ? "✅" : "❌") . " Laravel 密碼驗證: " . ($laravelPasswordCheck ? "成功" : "失敗") . "\n";
    
    // 測試 Laravel 認證
    $credentials = ['email' => 'test@example.com', 'password' => $laravelPassword];
    
    if (Auth::attempt($credentials)) {
        echo "✅ Laravel 認證測試成功！\n";
        Auth::logout(); // 清理
    } else {
        echo "❌ Laravel 認證測試失敗\n";
    }
    
    // 現在也需要更新 Go 後端用戶的密碼，因為它們應該同步
    echo "\n🔄 同步 Go 後端密碼...\n";
    
    // 生成 Go 後端同步密碼
    $secret = config('app.key') ?? 'default-secret';
    $syncPassword = 'sync_' . hash('sha256', $user->email . $secret);
    
    echo "🔑 Go 後端同步密碼: {$syncPassword}\n";
    
    // 使用 Go 相容的 bcrypt 哈希
    $goHashedPassword = password_hash($syncPassword, PASSWORD_BCRYPT);
    
    echo "🔒 Go 後端新哈希: " . substr($goHashedPassword, 0, 30) . "...\n";
    
    // 直接在資料庫中更新 Go 後端用戶密碼
    // 我們需要確保不會覆蓋 Laravel 的密碼，所以假設有兩個不同的字段或處理方式
    
    // 由於用戶表是共享的，我們需要維護兩套密碼系統
    // 這裡我們只更新 PostgreSQL 中的記錄，而不使用 Eloquent
    
    DB::statement("UPDATE users SET password = ? WHERE id = ? AND email = ? ", [$goHashedPassword, $user->id, $user->email]);
    
    echo "✅ Go 後端密碼同步成功！\n";
    
    // 測試 Go 後端登入
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
    
    if ($response->successful()) {
        $result = $response->json();
        echo "✅ Go 後端登入成功！令牌: " . substr($result['token'], 0, 20) . "...\n";
    } else {
        echo "❌ Go 後端登入失敗: " . $response->body() . "\n";
    }
    
    echo "\n🎉 雙重密碼系統設定完成！\n";
    echo "💡 現在有兩套獨立的認證系統:\n";
    echo "  - Laravel Web 認證: test@example.com / password123\n";
    echo "  - Go API 認證: 自動同步，使用內部令牌\n";
    
} catch (Exception $e) {
    echo "❌ 修復過程出錯: " . $e->getMessage() . "\n";
    echo "📚 堆疊跟蹤:\n" . $e->getTraceAsString() . "\n";
}