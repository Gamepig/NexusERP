<?php

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "🎯 Generating Simple Sales Data for Test Company (ID: 77)...\n\n";

try {
    $testCompanyId = 77;
    $testUserId = 1191; // test@example.com user ID
    
    // 獲取正確的 business_unit_id
    $businessUnit = DB::table('business_units')->where('company_id', $testCompanyId)->first();
    if (!$businessUnit) {
        echo "❌ No business unit found for company ID: $testCompanyId\n";
        exit(1);
    }
    $businessUnitId = $businessUnit->id;
    
    // 1. 獲取現有的測試產品和客戶
    echo "1. Checking existing data...\n";
    $testProducts = DB::table('products')->where('company_id', $testCompanyId)->get();
    $testCustomers = DB::table('customers')->where('company_id', $testCompanyId)->get();
    
    echo "   📦 Products: " . count($testProducts) . "\n";
    echo "   👥 Customers: " . count($testCustomers) . "\n";
    
    if (count($testProducts) == 0 || count($testCustomers) == 0) {
        echo "   ❌ Need products and customers first. Run generate_test_sales_data.php to create them.\n";
        exit(1);
    }
    
    // 2. 清除現有的銷售訂單和項目（測試數據）
    echo "2. Clearing existing test sales data...\n";
    DB::table('sales_order_items')
        ->whereIn('sales_order_id', function($query) use ($businessUnitId) {
            $query->select('id')
                  ->from('sales_orders')
                  ->where('business_unit_id', $businessUnitId);
        })
        ->delete();
    
    DB::table('sales_orders')->where('business_unit_id', $businessUnitId)->delete();
    echo "   ✅ Cleared existing test data\n";
    
    // 3. 創建簡化的銷售訂單（匹配實際表結構）
    echo "3. Creating simplified sales orders...\n";
    
    $currencyId = DB::table('currencies')->where('code', 'TWD')->first()?->id ?? 1;
    
    $salesOrders = [];
    $salesOrderItems = [];
    
    // 生成過去 3 個月的訂單
    $startDate = now()->subMonths(3);
    $endDate = now();
    
    for ($i = 1; $i <= 30; $i++) {
        $customer = $testCustomers[rand(0, count($testCustomers) - 1)];
        $orderDate = $startDate->copy()->addDays(rand(0, $startDate->diffInDays($endDate)));
        $orderNumber = 'SO-' . $orderDate->format('Ym') . '-' . str_pad($i, 4, '0', STR_PAD_LEFT);
        
        $statuses = ['draft', 'processing', 'shipped', 'completed', 'cancelled'];
        $status = $statuses[rand(0, count($statuses) - 1)];
        
        // 計算訂單總額
        $itemCount = rand(1, 4);
        $totalAmount = 0;
        $orderItems = [];
        
        for ($j = 0; $j < $itemCount; $j++) {
            $product = $testProducts[rand(0, count($testProducts) - 1)];
            $quantity = rand(1, 8);
            $unitPrice = $product->selling_price;
            $totalPrice = $quantity * $unitPrice;
            $totalAmount += $totalPrice;
            
            $orderItems[] = [
                'sales_order_id' => null, // Will be updated after insert
                'product_id' => $product->id,
                'quantity' => $quantity,
                'unit_price' => $unitPrice,
                'total_price' => $totalPrice,
                'created_at' => $orderDate,
                'updated_at' => $orderDate
            ];
        }
        
        // 只使用實際存在的欄位
        $salesOrder = [
            'order_number' => $orderNumber,
            'customer_id' => $customer->id,
            'business_unit_id' => $businessUnitId,
            'status' => $status,
            'user_id' => $testUserId,
            'order_date' => $orderDate->format('Y-m-d'),
            'total_amount' => $totalAmount,
            'currency_id' => $currencyId,
            'created_at' => $orderDate,
            'updated_at' => $orderDate,
            'items' => $orderItems
        ];
        
        $salesOrders[] = $salesOrder;
    }
    
    // 插入銷售訂單並獲取ID，然後插入訂單項目
    foreach ($salesOrders as $order) {
        $items = $order['items'];
        unset($order['items']);
        
        $orderId = DB::table('sales_orders')->insertGetId($order);
        
        // 更新訂單項目的 sales_order_id
        foreach ($items as &$item) {
            $item['sales_order_id'] = $orderId;
        }
        
        DB::table('sales_order_items')->insert($items);
    }
    
    echo "   ✅ Created 30 sales orders with items\n";
    
    // 4. 統計生成的數據
    echo "\n📊 Data Summary:\n";
    $orderCount = DB::table('sales_orders')->where('business_unit_id', $businessUnitId)->count();
    $orderItemCount = DB::table('sales_order_items')
        ->join('sales_orders', 'sales_order_items.sales_order_id', '=', 'sales_orders.id')
        ->where('sales_orders.business_unit_id', $businessUnitId)
        ->count();
    $totalSales = DB::table('sales_orders')->where('business_unit_id', $businessUnitId)->sum('total_amount');
    
    echo "   📋 Sales Orders: $orderCount\n";
    echo "   📄 Order Items: $orderItemCount\n";
    echo "   💰 Total Sales: " . number_format($totalSales, 2) . "\n";
    
    echo "\n🎉 Simple test data generation completed successfully!\n";
    echo "You can now test the sales reports at: http://127.0.0.1:8000/reports/sales\n";
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}