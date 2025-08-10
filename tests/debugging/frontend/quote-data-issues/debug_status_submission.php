<?php

/**
 * Status Submission Debug Script
 * 模擬表單提交以調試狀態值處理問題
 * 
 * 執行方式: php debug_status_submission.php
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

echo "=== Status Submission Debug Script ===\n\n";

try {
    // 1. 設定測試用戶
    $testUser = User::where('email', 'test@example.com')->first();
    if (!$testUser) {
        echo "❌ 找不到測試用戶\n";
        exit(1);
    }
    
    Auth::login($testUser);
    echo "✅ 測試用戶: {$testUser->email}\n";
    
    // 2. 模擬表單提交資料
    $formData = [
        'customer_id' => 2244,  // 從API結果中獲得的客戶ID
        'quote_date' => '2025-08-07',
        'valid_until' => '2025-09-06',
        'contact_person' => 'Test Contact',
        'notes' => 'Test Notes for Status Debug',
        'status' => 'sent',  // 🎯 關鍵測試：用戶選擇的狀態
        'currency' => 'TWD',
        'items' => [
            [
                'name' => '測試商品',
                'description' => '狀態測試用商品',
                'quantity' => 1,
                'unit_price' => 1000.00,
                'product_id' => 832
            ]
        ]
    ];
    
    echo "\n--- 模擬表單數據 ---\n";
    echo "📋 Status值: {$formData['status']}\n";
    echo "👤 Customer ID: {$formData['customer_id']}\n";
    echo "🏷️ Currency: {$formData['currency']}\n";
    
    // 3. 建立模擬Request
    $request = new Request();
    $request->merge($formData);
    $request->headers->set('Content-Type', 'application/json');
    $request->headers->set('Accept', 'application/json');
    
    // 4. 測試驗證邏輯
    echo "\n--- 驗證規則測試 ---\n";
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
        echo "📊 驗證後的Status: " . ($validated['status'] ?? 'NULL') . "\n";
        
    } catch (Exception $e) {
        echo "❌ 驗證失敗: " . $e->getMessage() . "\n";
        exit(1);
    }
    
    // 5. 測試QuoteData組建邏輯
    echo "\n--- QuoteData 組建測試 ---\n";
    
    $currencyMapping = [
        'TWD' => 251, 'USD' => 252, 'EUR' => 253, 'JPY' => 254, 
        'CNY' => 255, 'HKD' => 256, 'SGD' => 257
    ];
    
    $quoteData = [
        'customer_id' => (int)$validated['customer_id'],
        'quote_date' => \Carbon\Carbon::parse($validated['quote_date'])->toISOString(),
        'expiry_date' => \Carbon\Carbon::parse($validated['valid_until'])->toISOString(),
        'notes' => $validated['notes'] ?? '',
        'status' => $validated['status'] ?? 'draft',  // 🎯 這裡是關鍵
        'currency_id' => $currencyMapping[$validated['currency'] ?? 'TWD'] ?? 1,
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
    
    echo "🎯 組建後的Status: {$quoteData['status']}\n";
    echo "💰 Currency ID: {$quoteData['currency_id']}\n";
    
    // 6. 顯示完整的QuoteData
    echo "\n--- 完整 QuoteData (將發送到Go API) ---\n";
    echo json_encode($quoteData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n";
    
    // 7. 模擬Go API調用（不實際發送）
    echo "\n--- Go API 調用模擬 ---\n";
    echo "📡 端點: POST /api/quotes\n";
    echo "📊 狀態欄位檢查: " . ($quoteData['status'] === 'sent' ? '✅ 正確 (sent)' : '❌ 錯誤 (' . $quoteData['status'] . ')') . "\n";
    
    // 8. 檢查日誌記錄
    Log::info('Status Debug Test', [
        'original_status' => $formData['status'],
        'validated_status' => $validated['status'] ?? 'NULL',
        'final_status' => $quoteData['status'],
        'currency_mapping' => $quoteData['currency_id']
    ]);
    
    echo "\n✅ 調試完成 - 檢查 laravel.log 獲取詳細記錄\n";
    
} catch (Exception $e) {
    echo "💥 發生錯誤: " . $e->getMessage() . "\n";
    echo "堆疊追蹤:\n" . $e->getTraceAsString() . "\n";
}

echo "\n=== 調試完成 ===\n";