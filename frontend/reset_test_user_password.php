<?php

require_once __DIR__ . '/vendor/autoload.php';

// Bootstrap Laravel
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

try {
    // 找到測試用戶
    $user = App\Models\User::where('email', 'test@example.com')->first();
    
    if (!$user) {
        echo "❌ 測試用戶不存在\n";
        exit(1);
    }
    
    echo "🔍 找到測試用戶: {$user->name} (ID: {$user->id})\n";
    echo "📧 當前郵箱: {$user->email}\n";
    echo "🔒 當前密碼哈希: " . substr($user->password, 0, 20) . "...\n";
    
    // 重置密碼
    $newPassword = 'password123';
    $hashedPassword = Hash::make($newPassword);
    
    $user->password = $hashedPassword;
    $user->save();
    
    echo "✅ 密碼已重置\n";
    echo "🔑 新密碼: {$newPassword}\n";
    echo "🔒 新哈希: " . substr($hashedPassword, 0, 20) . "...\n";
    
    // 驗證新密碼
    $passwordCheck = Hash::check($newPassword, $hashedPassword);
    echo ($passwordCheck ? "✅" : "❌") . " 密碼驗證: " . ($passwordCheck ? "成功" : "失敗") . "\n";
    
    echo "\n🎉 測試用戶密碼重置完成！\n";
    echo "現在可以使用以下憑證登入：\n";
    echo "郵箱: test@example.com\n";
    echo "密碼: password123\n";
    
} catch (Exception $e) {
    echo "❌ 重置過程出錯: " . $e->getMessage() . "\n";
    echo "📚 堆疊跟蹤:\n" . $e->getTraceAsString() . "\n";
}