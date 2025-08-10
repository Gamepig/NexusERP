<?php

/**
 * Go API Response Debug Script
 * 用於檢查Go API是否正確回傳產品名稱和狀態信息
 * 
 * 執行方式: php debug_go_api_response.php
 */

require_once __DIR__ . '/../../vendor/autoload.php';

// 載入Laravel環境
$app = require_once __DIR__ . '/../../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use App\Models\User;

echo "=== Go API Response Debug Script ===\n\n";

try {
    // 1. 模擬登入用戶（使用測試用戶）
    $testUser = User::where('email', 'test@example.com')->first();
    if (!$testUser) {
        echo "❌ 找不到測試用戶 test@example.com\n";
        echo "請先建立測試用戶或使用其他用戶email\n";
        exit(1);
    }
    
    echo "✅ 找到測試用戶: {$testUser->email}\n";
    Auth::login($testUser);
    
    // 2. 生成API Token (使用與QuoteController相同的格式)
    $payload = [
        'user_id' => (int)$testUser->id,
        'email' => $testUser->email,
        'name' => $testUser->name ?? ($testUser->first_name . ' ' . $testUser->last_name),
        'exp' => time() + (24 * 60 * 60) // 24小時後過期
    ];
    $apiToken = base64_encode(json_encode($payload));
    
    echo "✅ API Token 已生成\n";
    
    // 3. 設定Go API URL
    $goApiUrl = config('go_backend.api_url', 'http://localhost:8082');
    echo "🔗 Go API URL: {$goApiUrl}\n";
    
    // 4. 測試Quote詳細API
    $quoteId = 19; // 根據用戶截圖使用的Quote ID
    $endpoint = "/api/quotes/{$quoteId}";
    
    echo "\n--- 測試Quote詳細API ---\n";
    echo "📡 調用: GET {$goApiUrl}{$endpoint}\n";
    
    $headers = [
        'Content-Type' => 'application/json',
        'Accept' => 'application/json',
        'Authorization' => 'Bearer ' . $apiToken,
        'X-User-ID' => $testUser->id,
        'X-User-Email' => $testUser->email,
    ];
    
    $response = Http::withHeaders($headers)->timeout(30)->get($goApiUrl . $endpoint);
    
    echo "📊 HTTP狀態: {$response->status()}\n";
    
    if ($response->successful()) {
        $data = $response->json();
        
        echo "\n=== API 回應分析 ===\n";
        
        // 檢查基本資料結構
        if (isset($data['quote'])) {
            $quote = $data['quote'];
            
            echo "🔢 Quote ID: " . ($quote['id'] ?? 'N/A') . "\n";
            echo "📝 Quote Number: " . ($quote['quote_number'] ?? 'N/A') . "\n";
            echo "📋 Status: " . ($quote['status'] ?? 'N/A') . "\n";
            echo "💰 Total Amount: " . ($quote['total_amount'] ?? 'N/A') . "\n";
            
            // 檢查Items資料
            if (isset($quote['items']) && is_array($quote['items'])) {
                echo "\n--- Quote Items 分析 ---\n";
                echo "📦 Items 數量: " . count($quote['items']) . "\n";
                
                foreach ($quote['items'] as $index => $item) {
                    $itemNumber = $index + 1;
                    echo "\n🎯 Item #{$itemNumber}:\n";
                    echo "  📍 Product ID: " . ($item['product_id'] ?? 'N/A') . "\n";
                    echo "  📛 Product Name: " . ($item['name'] ?? ($item['product_name'] ?? 'N/A')) . "\n";
                    echo "  📄 Description: " . ($item['description'] ?? 'N/A') . "\n";
                    echo "  🔢 Quantity: " . ($item['quantity'] ?? 'N/A') . "\n";
                    echo "  💵 Unit Price: " . ($item['unit_price'] ?? 'N/A') . "\n";
                    
                    // 檢查是否有產品關聯資訊
                    if (isset($item['product'])) {
                        echo "  🔗 Product Info: " . json_encode($item['product']) . "\n";
                    } else {
                        echo "  ❌ 缺少Product關聯資訊\n";
                    }
                }
            } else {
                echo "❌ 沒有找到Quote Items\n";
            }
            
            // 檢查Customer資料
            if (isset($quote['customer'])) {
                echo "\n--- Customer 資料 ---\n";
                echo "👤 Customer: " . ($quote['customer']['name'] ?? 'N/A') . "\n";
            } else {
                echo "❌ 沒有找到Customer資料\n";
            }
            
        } else {
            echo "❌ 回應中沒有找到 'quote' 欄位\n";
        }
        
        echo "\n=== 完整API回應 ===\n";
        echo json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n";
        
    } else {
        echo "❌ API調用失敗\n";
        echo "錯誤內容: " . $response->body() . "\n";
    }
    
    // 5. 額外測試：直接查詢產品資料
    echo "\n--- 額外測試：產品API ---\n";
    $productId = 832; // 根據截圖的產品ID
    $productEndpoint = "/api/products/{$productId}";
    echo "📡 調用: GET {$goApiUrl}{$productEndpoint}\n";
    
    $productResponse = Http::withHeaders($headers)->timeout(30)->get($goApiUrl . $productEndpoint);
    echo "📊 產品API狀態: {$productResponse->status()}\n";
    
    if ($productResponse->successful()) {
        $productData = $productResponse->json();
        echo "✅ 產品資料: " . json_encode($productData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n";
    } else {
        echo "❌ 產品API失敗: " . $productResponse->body() . "\n";
    }
    
} catch (Exception $e) {
    echo "💥 發生錯誤: " . $e->getMessage() . "\n";
    echo "堆疊追蹤: " . $e->getTraceAsString() . "\n";
}

echo "\n=== 調試完成 ===\n";