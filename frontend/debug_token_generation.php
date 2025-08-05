<?php

require_once 'vendor/autoload.php';

use Illuminate\Foundation\Application;
use Illuminate\Http\Request;

// 建立 Laravel 應用實例
$app = require_once 'bootstrap/app.php';
$kernel = $app->make('Illuminate\Contracts\Http\Kernel');

// 建立一個模擬請求來啟動 Laravel
$request = Request::create('/test', 'GET');
$kernel->handle($request);

use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Session;
use App\Services\ApiService;
use App\Models\User;

echo "🔍 詳細調試 API Token 生成過程...\n\n";

// 模擬登入測試用戶
$testUser = User::where('email', 'test@example.com')->first();
Auth::login($testUser);

echo "👤 當前用戶: {$testUser->name} ({$testUser->email})\n";
echo "🔑 Laravel API Token: {$testUser->api_token}\n\n";

// 測試 ApiService
$apiService = new ApiService();

// 使用 reflection 來存取 protected 方法進行調試
$reflection = new ReflectionClass($apiService);

// 測試 getOrGenerateApiToken 方法
$getTokenMethod = $reflection->getMethod('getOrGenerateApiToken');
$getTokenMethod->setAccessible(true);

echo "🚀 呼叫 getOrGenerateApiToken()...\n";

try {
    $token = $getTokenMethod->invoke($apiService);
    
    if ($token) {
        echo "✅ Token 生成成功: " . substr($token, 0, 20) . "...\n";
    } else {
        echo "❌ Token 生成失敗\n";
    }
    
    // 檢查 Session 狀態
    echo "\n📋 Session 狀態 (after token generation):\n";
    echo "   api_token: " . (Session::get('api_token') ? '已設定' : '未設定') . "\n";
    echo "   token_expiry: " . (Session::get('api_token_expiry') ? date('Y-m-d H:i:s', Session::get('api_token_expiry')) : '未設定') . "\n";
    
} catch (Exception $e) {
    echo "❌ Token 生成拋出例外: " . $e->getMessage() . "\n";
    echo "📍 檔案: " . $e->getFile() . ":" . $e->getLine() . "\n";
    echo "📝 Stack trace:\n" . $e->getTraceAsString() . "\n";
}

// 測試 Go backend 連線
echo "\n🌐 測試 Go Backend 連線...\n";

try {
    $getPasswordMethod = $reflection->getMethod('getGoBackendPasswordForUser');
    $getPasswordMethod->setAccessible(true);
    $password = $getPasswordMethod->invoke($apiService, $testUser);
    
    echo "🔐 Go Backend 密碼: " . substr($password, 0, 10) . "...\n";
    
    // 嘗試直接登入 Go backend
    $loginData = [
        'name' => $testUser->name,
        'password' => $password
    ];
    
    echo "📤 嘗試登入 Go Backend...\n";
    echo "   Username: {$testUser->name}\n";
    echo "   Password: " . substr($password, 0, 10) . "...\n";
    
    $response = \Illuminate\Support\Facades\Http::withHeaders([
        'Accept' => 'application/json',
        'Content-Type' => 'application/json',
    ])
    ->withOptions(['verify' => false])
    ->timeout(10)
    ->post('http://127.0.0.1:8082/api/auth/login', $loginData);
    
    echo "📥 Go Backend 回應:\n";
    echo "   Status: {$response->status()}\n";
    echo "   Body: " . $response->body() . "\n";
    
} catch (Exception $e) {
    echo "❌ Go Backend 測試失敗: " . $e->getMessage() . "\n";
}

echo "\n🏁 調試完成\n";

?>