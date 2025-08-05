<?php

require_once __DIR__ . '/vendor/autoload.php';

// Bootstrap Laravel
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "🔍 檢查 Laravel 認證配置...\n\n";

try {
    // 檢查用戶
    $user = App\Models\User::where('email', 'test@example.com')->first();
    
    if (!$user) {
        echo "❌ 找不到用戶\n";
        exit(1);
    }
    
    echo "✅ 找到用戶: {$user->name} (ID: {$user->id})\n";
    echo "📧 郵箱: {$user->email}\n";
    echo "🔒 密碼哈希: " . substr($user->password, 0, 30) . "...\n";
    
    // 檢查密碼驗證
    $passwords = ['password123', 'password', '123456'];
    
    foreach ($passwords as $password) {
        $isCorrect = Hash::check($password, $user->password);
        echo ($isCorrect ? "✅" : "❌") . " 密碼 '{$password}': " . ($isCorrect ? "正確" : "錯誤") . "\n";
        
        if ($isCorrect) {
            echo "🎉 找到正確密碼: {$password}\n";
            break;
        }
    }
    
    // 檢查 Auth 配置
    echo "\n⚙️ Auth 配置檢查:\n";
    echo "  Auth Guard: " . config('auth.defaults.guard') . "\n";
    echo "  Auth Provider: " . config('auth.defaults.provider') . "\n";
    echo "  User Model: " . config('auth.providers.users.model') . "\n";
    
    // 測試手動認證
    echo "\n🔐 測試手動認證...\n";
    
    $credentials = ['email' => 'test@example.com', 'password' => 'password123'];
    
    if (Auth::attempt($credentials)) {
        echo "✅ 手動認證成功！\n";
        echo "👤 已登入用戶: " . Auth::user()->name . "\n";
    } else {
        echo "❌ 手動認證失敗\n";
        
        // 嘗試不同的密碼
        $testPasswords = ['password123', 'password', '123456', 'testpassword'];
        
        foreach ($testPasswords as $testPassword) {
            $testCredentials = ['email' => 'test@example.com', 'password' => $testPassword];
            
            if (Auth::attempt($testCredentials)) {
                echo "✅ 找到有效密碼: {$testPassword}\n";
                break;
            }
        }
    }
    
    // 檢查用戶是否活躍
    echo "\n👤 用戶詳細資訊:\n";
    echo "  狀態: " . ($user->is_active ?? 'unknown') . "\n";
    echo "  創建時間: {$user->created_at}\n";
    echo "  最後登入: " . ($user->last_login_at ?? 'never') . "\n";
    
} catch (Exception $e) {
    echo "❌ 檢查過程出錯: " . $e->getMessage() . "\n";
    echo "📚 堆疊跟蹤:\n" . $e->getTraceAsString() . "\n";
}