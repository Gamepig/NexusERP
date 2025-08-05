<?php

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "🎯 Generating Complete Sales Data for Test Company (ID: 77)...\n\n";

try {
    $testCompanyId = 77;
    $testUserId = 1191; // test@example.com user ID
    
    // 1. 創建測試產品
    echo "1. Creating Products...\n";
    $existingProducts = DB::table('products')->where('company_id', $testCompanyId)->count();
    
    if ($existingProducts < 10) {
        $categories = DB::table('product_categories')->limit(5)->get();
        $unitOfMeasure = DB::table('units_of_measure')->where('name', '個')->first();
        $products = [];
        
        for ($i = 1; $i <= 15; $i++) {
            $category = $categories[($i - 1) % count($categories)];
            $costPrice = rand(50, 2000);
            $sellingPrice = $costPrice + rand(20, 500);
            
            $products[] = [
                'sku' => 'TEST-PROD-' . str_pad($i, 3, '0', STR_PAD_LEFT),
                'name' => '測試產品 ' . $i,
                'description' => '這是測試產品 ' . $i . ' 的描述',
                'category_id' => $category->id,
                'unit_of_measure' => '個',
                'unit_of_measure_id' => $unitOfMeasure->id,
                'cost_price' => $costPrice,
                'selling_price' => $sellingPrice,
                'company_id' => $testCompanyId,
                'created_by_user_id' => $testUserId,
                'is_active' => true,
                'reorder_point' => rand(5, 50),
                'created_at' => now(),
                'updated_at' => now()
            ];
        }
        
        DB::table('products')->insert($products);
        echo "   ✅ Created 15 test products\n";
    } else {
        echo "   ✅ Products already exist ($existingProducts)\n";
    }
    
    // 2. 創建測試客戶
    echo "2. Creating Customers...\n";
    $existingCustomers = DB::table('customers')->where('company_id', $testCompanyId)->count();
    
    if ($existingCustomers < 5) {
        $customers = [];
        
        for ($i = 1; $i <= 10; $i++) {
            $customers[] = [
                'customer_code' => 'CUST-' . str_pad($i, 3, '0', STR_PAD_LEFT),
                'name' => '測試客戶 ' . $i,
                'company_name' => '測試公司 ' . $i,
                'customer_type' => 'corporate',
                'status' => 'active',
                'primary_email' => 'customer' . $i . '@test.com',
                'primary_phone' => '0912-34567' . str_pad($i, 2, '0', STR_PAD_LEFT),
                'address_line1' => '台北市測試區測試路 ' . $i . ' 號',
                'city' => '台北市',
                'country' => '台灣',
                'credit_limit' => rand(100000, 1000000),
                'payment_terms' => 30,
                'company_id' => $testCompanyId,
                'created_by_user_id' => $testUserId,
                'created_at' => now(),
                'updated_at' => now()
            ];
        }
        
        DB::table('customers')->insert($customers);
        echo "   ✅ Created 10 test customers\n";
    } else {
        echo "   ✅ Customers already exist ($existingCustomers)\n";
    }
    
    // 3. 檢查銷售訂單表格結構
    echo "3. Checking Sales Orders structure...\n";
    $salesOrderColumns = DB::select("SELECT column_name FROM information_schema.columns WHERE table_name = 'sales_orders' ORDER BY ordinal_position");
    $columnNames = array_column($salesOrderColumns, 'column_name');
    
    $businessUnitField = in_array('business_unit_id', $columnNames) ? 'business_unit_id' : 'company_id';
    echo "   ✅ Using field: $businessUnitField\n";
    
    // 4. 創建銷售訂單
    echo "4. Creating Sales Orders...\n";
    $existingSalesOrders = DB::table('sales_orders')->where($businessUnitField, $testCompanyId)->count();
    
    if ($existingSalesOrders < 20) {
        $testProducts = DB::table('products')->where('company_id', $testCompanyId)->get();
        $testCustomers = DB::table('customers')->where('company_id', $testCompanyId)->get();
        
        if (count($testProducts) > 0 && count($testCustomers) > 0) {
            $salesOrders = [];
            $salesOrderItems = [];
            
            // 生成過去 3 個月的訂單
            $startDate = now()->subMonths(3);
            $endDate = now();
            
            for ($i = 1; $i <= 50; $i++) {
                $customer = $testCustomers[rand(0, count($testCustomers) - 1)];
                $orderDate = $startDate->copy()->addDays(rand(0, $startDate->diffInDays($endDate)));
                $orderNumber = 'SO-' . $orderDate->format('Ym') . '-' . str_pad($i, 4, '0', STR_PAD_LEFT);
                
                $statuses = ['draft', 'confirmed', 'processing', 'shipped', 'delivered', 'completed'];
                $status = $statuses[rand(0, count($statuses) - 1)];
                
                // 計算訂單總額
                $itemCount = rand(1, 5);
                $subtotal = 0;
                $orderItems = [];
                
                for ($j = 0; $j < $itemCount; $j++) {
                    $product = $testProducts[rand(0, count($testProducts) - 1)];
                    $quantity = rand(1, 10);
                    $unitPrice = $product->selling_price;
                    $totalPrice = $quantity * $unitPrice;
                    $subtotal += $totalPrice;
                    
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
                
                $tax = $subtotal * 0.05; // 5% tax
                $totalAmount = $subtotal + $tax;
                
                $salesOrder = [
                    'order_number' => $orderNumber,
                    'customer_id' => $customer->id,
                    'order_date' => $orderDate->format('Y-m-d'),
                    'status' => $status,
                    'subtotal' => $subtotal,
                    'tax_amount' => $tax,
                    'total_amount' => $totalAmount,
                    $businessUnitField => $testCompanyId,
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
            
            echo "   ✅ Created 50 sales orders with items\n";
        } else {
            echo "   ❌ Need products and customers first\n";
        }
    } else {
        echo "   ✅ Sales orders already exist ($existingSalesOrders)\n";
    }
    
    // 5. 統計生成的數據
    echo "\n📊 Data Summary:\n";
    $productCount = DB::table('products')->where('company_id', $testCompanyId)->count();
    $customerCount = DB::table('customers')->where('company_id', $testCompanyId)->count();
    $orderCount = DB::table('sales_orders')->where($businessUnitField, $testCompanyId)->count();
    $orderItemCount = DB::table('sales_order_items')
        ->join('sales_orders', 'sales_order_items.sales_order_id', '=', 'sales_orders.id')
        ->where('sales_orders.'.$businessUnitField, $testCompanyId)
        ->count();
    $totalSales = DB::table('sales_orders')->where($businessUnitField, $testCompanyId)->sum('total_amount');
    
    echo "   📦 Products: $productCount\n";
    echo "   👥 Customers: $customerCount\n";
    echo "   📋 Sales Orders: $orderCount\n";
    echo "   📄 Order Items: $orderItemCount\n";
    echo "   💰 Total Sales: " . number_format($totalSales, 2) . "\n";
    
    echo "\n🎉 Test data generation completed successfully!\n";
    echo "You can now test the sales reports at:\n";
    echo "   - Sales Overview: http://127.0.0.1:8000/reports/sales\n";
    echo "   - Product Analysis: http://127.0.0.1:8000/reports/sales/by-product\n";
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}