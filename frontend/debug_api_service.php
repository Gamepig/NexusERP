<?php

require_once __DIR__ . '/vendor/autoload.php';

// Bootstrap Laravel
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "🔍 調試 API 服務認證...\n\n";

try {
    // 模擬登入用戶
    $user = App\Models\User::where('email', 'test@example.com')->first();
    if (!$user) {
        echo "❌ 找不到測試用戶\n";
        exit(1);
    }
    
    Auth::login($user);
    echo "✅ 模擬登入成功: {$user->name}\n";
    
    // 創建 API 服務實例
    $apiService = app(App\Services\ApiService::class);
    
    // 使用反射來訪問 protected 方法
    $reflection = new ReflectionClass($apiService);
    
    // 測試密碼生成
    $passwordMethod = $reflection->getMethod('getGoBackendPasswordForUser');
    $passwordMethod->setAccessible(true);
    $generatedPassword = $passwordMethod->invoke($apiService, $user);
    
    echo "🔑 生成的 Go 後端密碼: {$generatedPassword}\n";
    
    // 測試標頭生成
    $headersMethod = $reflection->getMethod('getHeaders');
    $headersMethod->setAccessible(true);
    $headers = $headersMethod->invoke($apiService);
    
    echo "📋 API 請求標頭:\n";
    foreach ($headers as $key => $value) {
        if ($key === 'Authorization') {
            echo "  {$key}: " . substr($value, 0, 20) . "...\n";
        } else {
            echo "  {$key}: {$value}\n";
        }
    }
    
    // 測試 Go 後端登入
    echo "\n🔐 測試 Go 後端登入...\n";
    
    $baseUrl = config('app.backend_api_url', 'http://127.0.0.1:8082') . '/api';
    $loginData = [
        'name' => $user->name,
        'password' => $generatedPassword
    ];
    
    echo "📤 登入資料: 用戶名={$loginData['name']}, 密碼長度=" . strlen($loginData['password']) . "\n";
    
    $response = Http::withHeaders([
        'Accept' => 'application/json',
        'Content-Type' => 'application/json',
    ])
    ->withOptions(['verify' => false])
    ->timeout(10)
    ->post($baseUrl . '/auth/login', $loginData);
    
    echo "📍 Go 後端登入回應:\n";
    echo "  狀態碼: {$response->status()}\n";
    echo "  成功: " . ($response->successful() ? '是' : '否') . "\n";
    
    if ($response->successful()) {
        $data = $response->json();
        $token = $data['token'] ?? null;
        if ($token) {
            echo "  令牌: " . substr($token, 0, 20) . "...\n";
            echo "✅ Go 後端認證成功！\n";
        } else {
            echo "  ❌ 回應中沒有令牌\n";
            echo "  回應內容: " . $response->body() . "\n";
        }
    } else {
        echo "  ❌ Go 後端認證失敗\n";
        echo "  回應內容: " . $response->body() . "\n";
    }
    
    // 測試完整的 API 請求
    echo "\n🌐 測試客戶 API 請求...\n";
    
    try {
        $customersResponse = $apiService->get('/customers/');
        echo "客戶 API 回應:\n";
        echo "  成功: " . ($customersResponse['success'] ? '是' : '否') . "\n";
        if ($customersResponse['success']) {
            $customerCount = count($customersResponse['data']['customers'] ?? []);
            echo "  客戶數量: {$customerCount}\n";
            echo "✅ 客戶 API 請求成功！\n";
        } else {
            echo "  錯誤: " . ($customersResponse['error'] ?? '未知錯誤') . "\n";
        }
    } catch (Exception $e) {
        echo "❌ 客戶 API 請求錯誤: " . $e->getMessage() . "\n";
    }
    
} catch (Exception $e) {
    echo "❌ 調試過程出錯: " . $e->getMessage() . "\n";
    echo "📚 堆疊跟蹤:\n" . $e->getTraceAsString() . "\n";
}