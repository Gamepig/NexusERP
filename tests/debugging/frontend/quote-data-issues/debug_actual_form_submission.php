<?php

/**
 * 實際表單提交調試腳本 - 超級思考Phase 1
 * 模擬完整的表單提交流程以調試狀態寫入問題
 * 
 * 執行方式: php debug_actual_form_submission.php
 */

require_once __DIR__ . '/../../vendor/autoload.php';

// 載入Laravel環境
$app = require_once __DIR__ . '/../../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\Log;
use Illuminate\Http\Request;
use App\Http\Controllers\Web\QuoteController;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;

echo "=== 實際表單提交調試 - 超級思考分析 ===\n\n";

try {
    // Step 1: 設定測試環境
    $testUser = User::where('email', 'test@example.com')->first();
    if (!$testUser) {
        echo "❌ 找不到測試用戶\n";
        exit(1);
    }
    
    Auth::login($testUser);
    echo "✅ 測試用戶已登入: {$testUser->email}\n";
    
    // Step 2: 建立QuoteController實例
    $controller = new QuoteController();
    echo "✅ QuoteController 實例已建立\n";
    
    // Step 3: 模擬前端提交的完整表單資料（根據截圖）
    $formData = [
        'customer_id' => 429,  // 使用有效的客戶ID（謝雅婷 - 寶雅國際） 
        'quote_date' => '2025-08-07',
        'valid_until' => '2025-09-06',
        'contact_person' => 'Vic Huang',
        'notes' => 'TEST',
        'status' => 'sent',  // 🎯 關鍵：用戶選擇的狀態
        'currency' => 'TWD',
        'items' => [
            [
                'name' => '測試商品 1',
                'description' => '這是測試產品 1 的描述',
                'quantity' => 1,
                'unit_price' => 824.00,
                'product_id' => 832
            ]
        ]
    ];
    
    echo "\n--- Step 3: 表單數據準備 ---\n";
    echo "📋 原始Status: {$formData['status']}\n";
    echo "👤 Customer ID: {$formData['customer_id']}\n";
    echo "📦 Items Count: " . count($formData['items']) . "\n";
    
    // Step 4: 建立模擬Request並設定為JSON請求
    $request = new Request();
    $request->merge($formData);
    $request->headers->set('Content-Type', 'application/json');
    $request->headers->set('Accept', 'application/json');
    $request->headers->set('X-CSRF-TOKEN', 'test-token');
    
    // 設定當前請求到Laravel
    app()->instance('request', $request);
    
    echo "\n--- Step 4: Request 物件建立 ---\n";
    echo "📡 Method: {$request->method()}\n";
    echo "🎯 Content-Type: {$request->header('Content-Type')}\n";
    
    // Step 5: 開始詳細追蹤 - 攔截所有相關日誌
    Log::info('=== 開始表單提交調試 ===', [
        'timestamp' => now()->toISOString(),
        'user_id' => $testUser->id,
        'form_data' => $formData
    ]);
    
    echo "\n--- Step 5: 開始調試表單提交流程 ---\n";
    
    // Step 6: 模擬store方法執行（但先不調用，而是手動執行每個步驟）
    echo "\n🔍 **超級思考Phase 1: 驗證邏輯分析**\n";
    
    // 6.1: 驗證規則檢查
    try {
        $validated = $request->validate([
            'customer_id' => 'required|integer|min:1',
            'quote_date' => 'required|date',
            'valid_until' => 'required|date|after:quote_date', 
            'contact_person' => 'nullable|string|max:255',
            'notes' => 'nullable|string|max:1000',
            'status' => 'nullable|string|in:draft,sent,accepted,rejected,expired',
            'currency' => 'nullable|string|in:TWD,USD,EUR,JPY,CNY,HKD,SGD',
            'items' => 'required|array|min:1',
            'items.*.name' => 'required|string|max:255',
            'items.*.description' => 'nullable|string|max:500',
            'items.*.quantity' => 'required|numeric|min:0.01',
            'items.*.unit_price' => 'required|numeric|min:0',
        ]);
        
        echo "✅ 驗證通過\n";
        echo "🎯 驗證後的Status: " . ($validated['status'] ?? 'NULL') . "\n";
        
    } catch (Exception $e) {
        echo "❌ 驗證失敗: " . $e->getMessage() . "\n";
        exit(1);
    }
    
    // 6.2: QuoteData 組建檢查
    echo "\n🔍 **超級思考Phase 2: 數據組建分析**\n";
    
    $currencyMapping = [
        'TWD' => 251, 'USD' => 252, 'EUR' => 253, 'JPY' => 254, 
        'CNY' => 255, 'HKD' => 256, 'SGD' => 257
    ];
    
    $quoteData = [
        'customer_id' => (int)$validated['customer_id'],
        'quote_date' => \Carbon\Carbon::parse($validated['quote_date'])->toISOString(),
        'expiry_date' => \Carbon\Carbon::parse($validated['valid_until'])->toISOString(),
        'notes' => $validated['notes'] ?? '',
        'status' => $validated['status'] ?? 'draft',  // 🎯 關鍵檢查點
        'currency_id' => $currencyMapping[$validated['currency'] ?? 'TWD'] ?? 251,
        'items' => array_map(function($item) {
            $productId = isset($item['product_id']) && $item['product_id'] > 0 
                       ? (int)$item['product_id'] 
                       : 832;
            
            return [
                'product_id' => $productId,
                'description' => $item['description'] ?? '',
                'quantity' => (float)$item['quantity'],
                'unit_price' => (float)$item['unit_price'],
            ];
        }, $validated['items'])
    ];
    
    echo "🎯 Laravel組建的Status: {$quoteData['status']}\n";
    echo "💰 Currency ID: {$quoteData['currency_id']}\n";
    echo "📊 Quote Date: {$quoteData['quote_date']}\n";
    
    // Step 7: 實際調用Go API（這次真的調用）
    echo "\n🔍 **超級思考Phase 3: Go API 實際調用**\n";
    
    // 獲取Go API配置
    $goApiUrl = config('go_backend.api_url', 'http://localhost:8082');
    echo "📡 Go API URL: {$goApiUrl}\n";
    
    // 生成符合Go API期望的API Token (仿照QuoteController邏輯)
    $payload = [
        'user_id' => (int)$testUser->id,
        'email' => $testUser->email,
        'name' => $testUser->name ?? ($testUser->first_name . ' ' . $testUser->last_name),
        'exp' => time() + (24 * 60 * 60) // 24小時後過期
    ];
    
    $jsonPayload = json_encode($payload);
    $apiToken = base64_encode($jsonPayload);
    
    echo "🔑 生成API Token (user_id: {$testUser->id})\\n";
    
    // 實際調用Go API (仿照QuoteController的headers)
    $headers = [
        'Content-Type' => 'application/json',
        'Accept' => 'application/json',
        'Authorization' => 'Bearer ' . $apiToken,
        'X-User-ID' => (string)$testUser->id,  // 確保是字串格式
        'X-User-Email' => $testUser->email,
    ];
    
    echo "🚀 即將調用 POST /api/quotes\n";
    echo "📤 發送的Status: {$quoteData['status']}\n";
    
    $response = Http::withHeaders($headers)->timeout(30)->post($goApiUrl . '/api/quotes', $quoteData);
    
    echo "📊 HTTP Status: {$response->status()}\n";
    
    if ($response->successful()) {
        $responseData = $response->json();
        echo "✅ Go API 調用成功\n";
        
        // 檢查回應中的狀態
        if (isset($responseData['quote'])) {
            $returnedQuote = $responseData['quote'];
            echo "🎯 Go API 回傳的Status: " . ($returnedQuote['status'] ?? 'NULL') . "\n";
            echo "🔢 新建報價ID: " . ($returnedQuote['id'] ?? 'NULL') . "\n";
            echo "📝 報價編號: " . ($returnedQuote['quote_number'] ?? 'NULL') . "\n";
            
            // 立即查詢這個新建的報價來驗證狀態
            if (isset($returnedQuote['id'])) {
                echo "\n🔍 **超級思考Phase 4: 立即驗證檢查**\n";
                $newQuoteId = $returnedQuote['id'];
                
                $verifyResponse = Http::withHeaders($headers)->timeout(30)->get($goApiUrl . "/api/quotes/{$newQuoteId}");
                
                if ($verifyResponse->successful()) {
                    $verifyData = $verifyResponse->json();
                    if (isset($verifyData['quote'])) {
                        $verifiedQuote = $verifyData['quote'];
                        echo "🔍 資料庫中實際的Status: " . ($verifiedQuote['status'] ?? 'NULL') . "\n";
                        
                        // 關鍵比較
                        if ($verifiedQuote['status'] === $quoteData['status']) {
                            echo "✅ 狀態一致！問題不在於API調用\n";
                        } else {
                            echo "❌ 狀態不一致！發現問題：\n";
                            echo "   發送: {$quoteData['status']}\n";
                            echo "   儲存: {$verifiedQuote['status']}\n";
                            echo "   🎯 **關鍵發現**: Go API端可能有邏輯覆蓋狀態值\n";
                        }
                    }
                } else {
                    echo "❌ 驗證查詢失敗: {$verifyResponse->status()}\n";
                }
            }
        }
        
        echo "\n=== 完整Go API回應 ===\n";
        echo json_encode($responseData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n";
        
    } else {
        echo "❌ Go API 調用失敗\n";
        echo "錯誤內容: " . $response->body() . "\n";
    }
    
    // 記錄完整調試資訊
    Log::info('表單提交調試完成', [
        'original_status' => $formData['status'],
        'validated_status' => $validated['status'] ?? 'NULL',
        'quote_data_status' => $quoteData['status'],
        'api_response_status' => $response->status(),
        'timestamp' => now()->toISOString()
    ]);
    
} catch (Exception $e) {
    echo "💥 調試過程發生錯誤: " . $e->getMessage() . "\n";
    echo "堆疊追蹤:\n" . $e->getTraceAsString() . "\n";
}

echo "\n=== 超級思考調試完成 ===\n";