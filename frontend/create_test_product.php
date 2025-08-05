<?php

require_once 'vendor/autoload.php';

// Laravel Bootstrap
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Product;
use App\Models\InventoryLevel;

echo "=== 創建測試產品和庫存數據 ===\n";

// 檢查是否已有測試產品
$existingProduct = Product::where('name', 'LIKE', '%測試產品%')->first();

if (!$existingProduct) {
    // 創建測試產品
    $product = Product::create([
        'sku' => 'TEST-857',
        'name' => '測試產品 857',
        'description' => '庫存測試專用產品',
        'selling_price' => 100.00,
        'cost_price' => 60.00,
        'is_active' => true,
        'company_id' => 1,
        'created_by_user_id' => 1,
        'owned_by_user_id' => 1
    ]);
    
    echo "✅ 創建產品 ID: {$product->id}\n";
    echo "   名稱: {$product->name}\n";
    echo "   SKU: {$product->sku}\n";
    
    // 創建庫存記錄 - 假設倉庫 ID 為 1
    try {
        InventoryLevel::create([
            'product_id' => $product->id,
            'warehouse_id' => 1,
            'quantity_on_hand' => 230,
            'quantity_available' => 230,
            'quantity_reserved' => 0,
            'quantity_on_order' => 0,
            'reorder_point' => 10
        ]);
        echo "✅ 創建庫存記錄: 230 件\n";
    } catch (Exception $e) {
        echo "⚠️ 創建庫存記錄失敗: " . $e->getMessage() . "\n";
        echo "   嘗試不指定倉庫 ID...\n";
        
        // 嘗試不指定倉庫 ID
        try {
            InventoryLevel::create([
                'product_id' => $product->id,
                'warehouse_id' => null,
                'quantity_on_hand' => 230,
                'quantity_available' => 230,
                'quantity_reserved' => 0,
                'quantity_on_order' => 0,
                'reorder_point' => 10
            ]);
            echo "✅ 創建庫存記錄成功 (無倉庫 ID): 230 件\n";
        } catch (Exception $e2) {
            echo "❌ 創建庫存記錄失敗: " . $e2->getMessage() . "\n";
        }
    }
    
} else {
    echo "✅ 產品已存在 ID: {$existingProduct->id}\n";
    echo "   名稱: {$existingProduct->name}\n";
    
    // 檢查庫存
    $inventoryLevels = $existingProduct->inventoryLevels;
    $totalStock = $inventoryLevels->sum('quantity_on_hand');
    echo "   當前庫存: {$totalStock} 件\n";
    
    // 顯示詳細庫存信息
    foreach ($inventoryLevels as $level) {
        echo "   - 倉庫 {$level->warehouse_id}: {$level->quantity_on_hand} 件\n";
    }
}

// 列出所有產品
echo "\n=== 所有產品列表 ===\n";
$allProducts = Product::where('company_id', 1)->with('inventoryLevels')->get();
foreach ($allProducts as $product) {
    $totalStock = $product->inventoryLevels->sum('quantity_on_hand');
    echo "ID: {$product->id}, 名稱: {$product->name}, 庫存: {$totalStock} 件\n";
}

echo "\n=== 完成 ===\n";