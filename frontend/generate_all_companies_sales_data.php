<?php

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "🏢 Generating Sales Data for ALL Active Companies...\n\n";

try {
    // 獲取所有有業務單位的活躍公司
    $companies = DB::table('companies as c')
        ->join('business_units as bu', 'c.id', '=', 'bu.company_id')
        ->where('c.is_active', true)
        ->select('c.id', 'c.name', 'bu.id as business_unit_id')
        ->groupBy('c.id', 'c.name', 'bu.id')
        ->get();
    
    echo "Found " . count($companies) . " active companies:\n";
    foreach ($companies as $company) {
        echo "   - ID: {$company->id}, Name: {$company->name}\n";
    }
    echo "\n";
    
    // 獲取計量單位和產品分類
    $unitOfMeasure = DB::table('units_of_measure')->where('name', '個')->first();
    $categories = DB::table('product_categories')->limit(10)->get();
    
    foreach ($companies as $company) {
        echo "🏢 Processing Company: {$company->name} (ID: {$company->id})\n";
        
        // 獲取公司的第一個用戶作為創建者
        $companyUser = DB::table('user_companies')
            ->join('users', 'user_companies.user_id', '=', 'users.id')
            ->where('user_companies.company_id', $company->id)
            ->where('user_companies.is_active', true)
            ->select('users.id')
            ->first();
        
        if (!$companyUser) {
            echo "   ⚠️ No active user found for this company, skipping...\n\n";
            continue;
        }
        $createdByUserId = $companyUser->id;
        
        // 1. 創建產品
        $existingProducts = DB::table('products')->where('company_id', $company->id)->count();
        
        if ($existingProducts < 5) {
            $products = [];
            
            for ($i = 1; $i <= 12; $i++) {
                $category = $categories[rand(0, count($categories) - 1)];
                $costPrice = rand(100, 3000);
                $sellingPrice = $costPrice + rand(50, 1000);
                
                $products[] = [
                    'sku' => 'COMP' . $company->id . '-PROD-' . str_pad($i, 3, '0', STR_PAD_LEFT),
                    'name' => $company->name . ' 產品 ' . $i,
                    'description' => $company->name . ' 的產品 ' . $i . ' 描述',
                    'category_id' => $category->id,
                    'unit_of_measure' => '個',
                    'unit_of_measure_id' => $unitOfMeasure->id,
                    'cost_price' => $costPrice,
                    'selling_price' => $sellingPrice,
                    'company_id' => $company->id,
                    'created_by_user_id' => $createdByUserId,
                    'is_active' => true,
                    'reorder_point' => rand(5, 50),
                    'created_at' => now(),
                    'updated_at' => now()
                ];
            }
            
            DB::table('products')->insert($products);
            echo "   ✅ Created 12 products\n";
        } else {
            echo "   ✅ Products already exist ($existingProducts)\n";
        }
        
        // 2. 創建客戶
        $existingCustomers = DB::table('customers')->where('company_id', $company->id)->count();
        
        if ($existingCustomers < 3) {
            $customers = [];
            
            for ($i = 1; $i <= 8; $i++) {
                $customers[] = [
                    'customer_code' => 'COMP' . $company->id . '-CUST-' . str_pad($i, 3, '0', STR_PAD_LEFT),
                    'name' => $company->name . ' 客戶 ' . $i,
                    'company_name' => $company->name . ' 客戶公司 ' . $i,
                    'customer_type' => rand(0, 1) ? 'corporate' : 'individual',
                    'status' => 'active',
                    'primary_email' => 'comp' . $company->id . 'customer' . $i . '@test.com',
                    'primary_phone' => '0912-' . str_pad($company->id, 3, '0', STR_PAD_LEFT) . str_pad($i, 3, '0', STR_PAD_LEFT),
                    'address_line1' => $company->name . ' 測試地址 ' . $i . ' 號',
                    'city' => ['台北市', '新北市', '桃園市', '台中市', '高雄市'][rand(0, 4)],
                    'country' => '台灣',
                    'credit_limit' => rand(50000, 2000000),
                    'payment_terms' => [15, 30, 45, 60][rand(0, 3)],
                    'company_id' => $company->id,
                    'created_by_user_id' => $createdByUserId,
                    'created_at' => now(),
                    'updated_at' => now()
                ];
            }
            
            DB::table('customers')->insert($customers);
            echo "   ✅ Created 8 customers\n";
        } else {
            echo "   ✅ Customers already exist ($existingCustomers)\n";
        }
        
        // 3. 檢查銷售訂單表格結構
        static $businessUnitField = null;
        if ($businessUnitField === null) {
            $salesOrderColumns = DB::select("SELECT column_name FROM information_schema.columns WHERE table_name = 'sales_orders' ORDER BY ordinal_position");
            $columnNames = array_column($salesOrderColumns, 'column_name');
            $businessUnitField = in_array('business_unit_id', $columnNames) ? 'business_unit_id' : 'company_id';
        }
        
        // 4. 創建銷售訂單
        $existingSalesOrders = DB::table('sales_orders')->where('business_unit_id', $company->business_unit_id)->count();
        
        if ($existingSalesOrders < 10) {
            $companyProducts = DB::table('products')->where('company_id', $company->id)->get();
            $companyCustomers = DB::table('customers')->where('company_id', $company->id)->get();
            
            if (count($companyProducts) > 0 && count($companyCustomers) > 0) {
                // 生成過去 4 個月的訂單
                $startDate = now()->subMonths(4);
                $endDate = now();
                $orderCount = rand(15, 35); // 每個公司15-35個訂單
                
                for ($i = 1; $i <= $orderCount; $i++) {
                    $customer = $companyCustomers[rand(0, count($companyCustomers) - 1)];
                    $orderDate = $startDate->copy()->addDays(rand(0, $startDate->diffInDays($endDate)));
                    $orderNumber = 'SO-' . $company->id . '-' . $orderDate->format('Ym') . '-' . str_pad($i, 4, '0', STR_PAD_LEFT);
                    
                    $statuses = ['draft', 'processing', 'shipped', 'completed', 'cancelled'];
                    $weights = [0.1, 0.25, 0.25, 0.35, 0.05]; // 權重分配
                    $status = $statuses[weightedRandom($weights)];
                    
                    // 計算訂單總額
                    $itemCount = rand(1, 6);
                    $subtotal = 0;
                    $orderItems = [];
                    
                    for ($j = 0; $j < $itemCount; $j++) {
                        $product = $companyProducts[rand(0, count($companyProducts) - 1)];
                        $quantity = rand(1, 15);
                        $unitPrice = $product->selling_price * (1 + rand(-10, 20) / 100); // 價格浮動 ±10% 到 +20%
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
                        'total_amount' => round($totalAmount, 2),
                        'business_unit_id' => $company->business_unit_id,
                        'created_at' => $orderDate,
                        'updated_at' => $orderDate
                    ];
                    
                    // 插入銷售訂單並獲取ID
                    $orderId = DB::table('sales_orders')->insertGetId($salesOrder);
                    
                    // 更新訂單項目的 sales_order_id 並插入
                    foreach ($orderItems as &$item) {
                        $item['sales_order_id'] = $orderId;
                    }
                    
                    DB::table('sales_order_items')->insert($orderItems);
                }
                
                echo "   ✅ Created $orderCount sales orders with items\n";
            } else {
                echo "   ⚠️ Skipping sales orders (no products or customers)\n";
            }
        } else {
            echo "   ✅ Sales orders already exist ($existingSalesOrders)\n";
        }
        
        echo "\n";
    }
    
    // 最終統計
    echo "📊 Final Statistics:\n\n";
    
    foreach ($companies as $company) {
        $productCount = DB::table('products')->where('company_id', $company->id)->count();
        $customerCount = DB::table('customers')->where('company_id', $company->id)->count();
        $orderCount = DB::table('sales_orders')->where('business_unit_id', $company->business_unit_id)->count();
        $totalSales = DB::table('sales_orders')->where('business_unit_id', $company->business_unit_id)->sum('total_amount');
        
        echo "🏢 {$company->name} (ID: {$company->id}):\n";
        echo "   📦 Products: $productCount\n";
        echo "   👥 Customers: $customerCount\n";
        echo "   📋 Sales Orders: $orderCount\n";
        echo "   💰 Total Sales: " . number_format($totalSales, 2) . " TWD\n\n";
    }
    
    $totalCompanies = count($companies);
    $totalProducts = DB::table('products')->count();
    $totalCustomers = DB::table('customers')->count();
    $totalOrders = DB::table('sales_orders')->count();
    $grandTotalSales = DB::table('sales_orders')->sum('total_amount');
    
    echo "🎯 Grand Totals:\n";
    echo "   🏢 Companies: $totalCompanies\n";
    echo "   📦 Products: $totalProducts\n";
    echo "   👥 Customers: $totalCustomers\n";
    echo "   📋 Sales Orders: $totalOrders\n";
    echo "   💰 Grand Total Sales: " . number_format($grandTotalSales, 2) . " TWD\n";
    
    echo "\n🎉 All companies sales data generation completed successfully!\n";
    echo "You can now test the sales reports for any company:\n";
    echo "   - Sales Overview: http://127.0.0.1:8000/reports/sales\n";
    echo "   - Product Analysis: http://127.0.0.1:8000/reports/sales/by-product\n";
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}

/**
 * 加權隨機選擇
 */
function weightedRandom($weights) {
    $totalWeight = array_sum($weights);
    $random = mt_rand() / mt_getrandmax() * $totalWeight;
    
    $currentWeight = 0;
    foreach ($weights as $index => $weight) {
        $currentWeight += $weight;
        if ($random <= $currentWeight) {
            return $index;
        }
    }
    
    return count($weights) - 1; // fallback
}