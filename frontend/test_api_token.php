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

// 現在可以使用 Laravel 的服務
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Session;
use App\Services\ApiService;
use App\Models\User;

echo "🧪 測試 API Token 生成過程...\n\n";

// 模擬登入測試用戶
$testUser = User::where('email', 'test@example.com')->first();

if (!$testUser) {
    echo "❌ 找不到測試用戶 test@example.com\n";
    exit(1);
}

echo "✅ 找到測試用戶: {$testUser->name} ({$testUser->email})\n";
echo "📱 API Token: " . ($testUser->api_token ? '已設定' : '未設定') . "\n\n";

// 模擬登入
Auth::login($testUser);

if (Auth::check()) {
    echo "✅ 用戶已成功登入\n";
} else {
    echo "❌ 用戶登入失敗\n";
    exit(1);
}

// 測試 ApiService
$apiService = new ApiService();

echo "🔧 測試 ApiService...\n";

// 使用 reflection 來存取 protected 方法
$reflection = new ReflectionClass($apiService);
$getHeadersMethod = $reflection->getMethod('getHeaders');
$getHeadersMethod->setAccessible(true);

$headers = $getHeadersMethod->invoke($apiService);

echo "📋 API Headers:\n";
foreach ($headers as $key => $value) {
    if ($key === 'Authorization') {
        echo "   {$key}: " . (str_starts_with($value, 'Bearer ') ? '✅ Bearer token 已設定' : '❌ 無效的 token 格式') . "\n";
    } else {
        echo "   {$key}: {$value}\n";
    }
}

// 檢查 Session 中的 token
$sessionToken = Session::get('api_token');
$tokenExpiry = Session::get('api_token_expiry');

echo "\n🗂️  Session 資料:\n";
echo "   api_token: " . ($sessionToken ? '已設定' : '未設定') . "\n";
echo "   token_expiry: " . ($tokenExpiry ? date('Y-m-d H:i:s', $tokenExpiry) : '未設定') . "\n";

// 測試實際 API 呼叫
echo "\n🌐 測試 API 呼叫...\n";

try {
    $response = $apiService->get('/customers/', ['page_size' => 5]);
    
    if ($response['success']) {
        echo "✅ API 呼叫成功\n";
        echo "📊 回應資料:\n";
        echo "   客戶數量: " . (count($response['data']['customers'] ?? [])) . "\n";
        echo "   總數: " . ($response['data']['total'] ?? 0) . "\n";
    } else {
        echo "❌ API 呼叫失敗\n";
        echo "📝 錯誤訊息: " . ($response['message'] ?? '未知錯誤') . "\n";
        echo "📋 回應資料: " . json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n";
    }
} catch (Exception $e) {
    echo "❌ API 呼叫拋出例外: " . $e->getMessage() . "\n";
}

echo "\n🏁 測試完成\n";

?>