<?php
// 直接資料庫測試出貨功能
require_once __DIR__ . '/frontend/vendor/autoload.php';

// 初始化 Laravel 環境
$app = require_once __DIR__ . '/frontend/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

echo "=== 直接資料庫測試出貨功能 ===\n\n";

try {
    // 1. 檢查初始庫存
    echo "1. 檢查產品 843 的初始庫存:\n";
    $inventory = DB::table('inventory_levels as il')
        ->join('products as p', 'il.product_id', '=', 'p.id')
        ->join('warehouses as w', 'il.warehouse_id', '=', 'w.id')
        ->where('il.product_id', 843)
        ->select('il.*', 'p.name as product_name', 'w.name as warehouse_name')
        ->get();
    
    foreach ($inventory as $item) {
        echo "產品: {$item->product_name}\n";
        echo "倉庫: {$item->warehouse_name}\n";
        echo "實際庫存: {$item->quantity_on_hand}\n";
        echo "可用庫存: {$item->quantity_available}\n";
        echo "保留庫存: {$item->quantity_reserved}\n\n";
    }
    
    // 2. 建立測試訂單
    echo "2. 建立測試訂單:\n";
    DB::beginTransaction();
    
    $orderId = DB::table('sales_orders')->insertGetId([
        'order_number' => 'TEST-' . time(),
        'customer_id' => 1,
        'status' => 'confirmed',
        'order_date' => now(),
        'total_amount' => 1000.00,
        'created_at' => now(),
        'updated_at' => now(),
    ]);
    
    echo "訂單 ID: $orderId\n";
    
    // 建立訂單項目
    $itemId = DB::table('sales_order_items')->insertGetId([
        'sales_order_id' => $orderId,
        'product_id' => 843,
        'quantity' => 10,
        'unit_price' => 100.00,
        'line_total' => 1000.00,
        'created_at' => now(),
        'updated_at' => now(),
    ]);
    
    echo "訂單項目 ID: $itemId\n\n";
    
    // 3. 執行出貨邏輯（手動實現）
    echo "3. 執行出貨處理:\n";
    
    // 檢查庫存
    $inventoryLevel = DB::table('inventory_levels')
        ->where('product_id', 843)
        ->where('warehouse_id', 53)
        ->first();
    
    if (!$inventoryLevel) {
        echo "錯誤: 找不到庫存記錄\n";
        DB::rollback();
        exit;
    }
    
    $shippedQuantity = 10;
    if ($inventoryLevel->quantity_available < $shippedQuantity) {
        echo "錯誤: 庫存不足，可用: {$inventoryLevel->quantity_available}, 需要: $shippedQuantity\n";
        DB::rollback();
        exit;
    }
    
    echo "庫存檢查通過，可用庫存: {$inventoryLevel->quantity_available}\n";
    
    // 更新庫存
    $quantityBefore = $inventoryLevel->quantity_available;
    $quantityAfter = $quantityBefore - $shippedQuantity;
    
    DB::table('inventory_levels')
        ->where('product_id', 843)
        ->where('warehouse_id', 53)
        ->update([
            'quantity_available' => $quantityAfter,
            'quantity_on_hand' => DB::raw('quantity_on_hand - ' . $shippedQuantity),
            'updated_at' => now(),
        ]);
    
    echo "庫存已更新：$quantityBefore -> $quantityAfter\n";
    
    // 記錄庫存交易
    DB::table('inventory_transactions')->insert([
        'transaction_type_id' => 7, // SALE 交易類型
        'product_id' => 843,
        'warehouse_id' => 53,
        'quantity_changed' => -$shippedQuantity,
        'quantity_before' => $quantityBefore,
        'quantity_after' => $quantityAfter,
        'reference_document_type' => 'sales_order',
        'reference_document_id' => $orderId,
        'user_id' => 1059,
        'notes' => '測試出貨：TEST-' . time(),
        'transaction_date' => now(),
        'created_at' => now(),
    ]);
    
    echo "庫存交易記錄已建立\n";
    
    // 更新訂單狀態
    DB::table('sales_orders')
        ->where('id', $orderId)
        ->update([
            'status' => 'shipped',
            'updated_at' => now(),
        ]);
    
    echo "訂單狀態已更新為已出貨\n\n";
    
    DB::commit();
    
    // 4. 檢查出貨後的庫存
    echo "4. 檢查出貨後的庫存:\n";
    $inventoryAfter = DB::table('inventory_levels as il')
        ->join('products as p', 'il.product_id', '=', 'p.id')
        ->join('warehouses as w', 'il.warehouse_id', '=', 'w.id')
        ->where('il.product_id', 843)
        ->select('il.*', 'p.name as product_name', 'w.name as warehouse_name')
        ->get();
    
    foreach ($inventoryAfter as $item) {
        echo "產品: {$item->product_name}\n";
        echo "倉庫: {$item->warehouse_name}\n";
        echo "實際庫存: {$item->quantity_on_hand}\n";
        echo "可用庫存: {$item->quantity_available}\n";
        echo "保留庫存: {$item->quantity_reserved}\n\n";
    }
    
    // 5. 檢查庫存交易記錄
    echo "5. 檢查庫存交易記錄:\n";
    $transactions = DB::table('inventory_transactions as it')
        ->join('products as p', 'it.product_id', '=', 'p.id')
        ->join('warehouses as w', 'it.warehouse_id', '=', 'w.id')
        ->where('it.product_id', 843)
        ->where('it.reference_document_id', $orderId)
        ->select('it.*', 'p.name as product_name', 'w.name as warehouse_name')
        ->orderBy('it.created_at', 'desc')
        ->limit(1)
        ->get();
    
    foreach ($transactions as $transaction) {
        echo "產品: {$transaction->product_name}\n";
        echo "倉庫: {$transaction->warehouse_name}\n";
        echo "變更數量: {$transaction->quantity_changed}\n";
        echo "變更前: {$transaction->quantity_before}\n";
        echo "變更後: {$transaction->quantity_after}\n";
        echo "備註: {$transaction->notes}\n";
        echo "交易時間: {$transaction->transaction_date}\n\n";
    }
    
    echo "=== 測試完成 ===\n";
    echo "訂單 $orderId 出貨成功，庫存已從 $quantityBefore 更新為 $quantityAfter\n";
    
} catch (Exception $e) {
    DB::rollback();
    echo "錯誤: " . $e->getMessage() . "\n";
    echo "檔案: " . $e->getFile() . ":" . $e->getLine() . "\n";
}