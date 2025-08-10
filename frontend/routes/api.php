<?php
// moved to web routes to reuse session auth and CSRF

/**
 * API Routes for NexusERP
 * RESTful API endpoints for frontend-backend communication
 */

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Schema;
use App\Http\Controllers\Api\SalesReportController;
use App\Http\Controllers\Api\PurchaseOrderController;
use App\Http\Controllers\Api\CompanyManagementController;
use App\Http\Controllers\SuperAdminController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

/*
|--------------------------------------------------------------------------
| Authentication API Routes
|--------------------------------------------------------------------------
*/
Route::prefix('auth')->middleware('web')->group(function () {
    
    // Generate JWT token from Laravel session
    Route::get('/token', function (Request $request) {
        if (!auth()->check()) {
            return response()->json(['error' => 'Unauthenticated'], 401);
        }
        
        $user = auth()->user();
        
        // Mock JWT token generation (in production, use proper JWT library)
        $payload = [
            'user_id' => $user->id,
            'email' => $user->email,
            'name' => $user->name,
            'exp' => time() + (24 * 60 * 60) // 24 hours
        ];
        
        // Simple base64 encoding for demo (use proper JWT in production)
        $token = base64_encode(json_encode($payload));
        
        return response()->json([
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email
            ],
            'expires_in' => 24 * 60 * 60
        ]);
    });
    
    // Simple Go JWT Integration Routes
    Route::post('/go-integrate', [\App\Http\Controllers\Auth\SimpleGoAuthController::class, 'integrateAuth']);
    Route::post('/go-refresh', [\App\Http\Controllers\Auth\SimpleGoAuthController::class, 'refreshToken']);
    Route::get('/go-verify-rls', [\App\Http\Controllers\Auth\SimpleGoAuthController::class, 'verifyRLS']);
    Route::get('/go-status', [\App\Http\Controllers\Auth\SimpleGoAuthController::class, 'status']);
    Route::post('/go-logout', [\App\Http\Controllers\Auth\SimpleGoAuthController::class, 'integrateLogout']);
});

/*
|--------------------------------------------------------------------------
| Core Business API Routes  
|--------------------------------------------------------------------------
*/

// 客戶管理 API - 使用 web 中間件支持 session 認證
Route::middleware(['web', 'auth', \App\Http\Middleware\SetCompanyContext::class, \App\Http\Middleware\EnsureCompanySetup::class])->group(function () {
    // 客戶列表 API
    Route::get('/customers', [\App\Http\Controllers\Api\CustomerController::class, 'index']);
    Route::get('/customers/{id}', [\App\Http\Controllers\Api\CustomerController::class, 'show']);
    
    // 產品列表 API  
    Route::get('/products', [\App\Http\Controllers\Api\ProductController::class, 'index']);
    
    // 產品搜尋 API - 必須在 {product} 路由之前，支援自動完成功能
    Route::get('/products/search', [\App\Http\Controllers\Api\ProductController::class, 'search']);
    
    Route::get('/products/{product}', [\App\Http\Controllers\Api\ProductController::class, 'show']);
    
    // 銷售訂單 API
    Route::get('/sales-orders', [\App\Http\Controllers\Api\SalesOrderController::class, 'index']);
    Route::get('/sales-orders/{id}', [\App\Http\Controllers\Api\SalesOrderController::class, 'show']);
    Route::post('/sales-orders', [\App\Http\Controllers\Api\SalesOrderController::class, 'store']);
    Route::put('/sales-orders/{id}', [\App\Http\Controllers\Api\SalesOrderController::class, 'update']);
    
    // 供應商 API (使用正確的模型綁定參數)
    Route::get('/suppliers', [\App\Http\Controllers\Api\SupplierController::class, 'index']);
    Route::get('/suppliers/{supplier}', [\App\Http\Controllers\Api\SupplierController::class, 'show']);
    Route::post('/suppliers', [\App\Http\Controllers\Api\SupplierController::class, 'store']);
    Route::put('/suppliers/{supplier}', [\App\Http\Controllers\Api\SupplierController::class, 'update']);
    Route::delete('/suppliers/{supplier}', [\App\Http\Controllers\Api\SupplierController::class, 'destroy']);
    
    // 採購訂單 API
    Route::get('/purchase-orders', [\App\Http\Controllers\Api\PurchaseOrderController::class, 'index']);
    Route::get('/purchase-orders/{purchaseOrder}', [\App\Http\Controllers\Api\PurchaseOrderController::class, 'show']);
    Route::post('/purchase-orders', [\App\Http\Controllers\Api\PurchaseOrderController::class, 'store']);
    Route::put('/purchase-orders/{purchaseOrder}', [\App\Http\Controllers\Api\PurchaseOrderController::class, 'update']);
    Route::delete('/purchase-orders/{purchaseOrder}', [\App\Http\Controllers\Api\PurchaseOrderController::class, 'destroy']);
    
    // 採購訂單狀態管理
    Route::post('/purchase-orders/{purchaseOrder}/submit', [\App\Http\Controllers\Api\PurchaseOrderController::class, 'submit']);
    Route::post('/purchase-orders/{purchaseOrder}/approve', [\App\Http\Controllers\Api\PurchaseOrderController::class, 'approve']);
    Route::post('/purchase-orders/{purchaseOrder}/cancel', [\App\Http\Controllers\Api\PurchaseOrderController::class, 'cancel']);
    
    // 產品分類 API (臨時實作)
    Route::get('/product-categories', function () {
        return response()->json([
            'success' => true,
            'data' => [
                ['id' => 1, 'name' => '電子產品'],
                ['id' => 2, 'name' => '辦公用品'], 
                ['id' => 3, 'name' => '家具家飾'],
                ['id' => 4, 'name' => '服飾配件'],
                ['id' => 5, 'name' => '食品飲料'],
            ]
        ]);
    });
    
    // 計量單位 API (臨時實作)
    Route::get('/units-of-measure', function () {
        return response()->json([
            'success' => true,
            'data' => [
                ['id' => 1, 'name' => '個', 'symbol' => 'pcs'],
                ['id' => 2, 'name' => '公斤', 'symbol' => 'kg'],
                ['id' => 3, 'name' => '公升', 'symbol' => 'L'],
                ['id' => 4, 'name' => '米', 'symbol' => 'm'],
                ['id' => 5, 'name' => '盒', 'symbol' => 'box'],
                ['id' => 6, 'name' => '包', 'symbol' => 'pack'],
            ]
        ]);
    });
    
    // 產品 API - 完整 CRUD 支援 (包含路由參數綁定)
    Route::post('/products', [\App\Http\Controllers\Api\ProductController::class, 'store']);
    Route::put('/products/{product}', [\App\Http\Controllers\Api\ProductController::class, 'update']);
    Route::delete('/products/{product}', [\App\Http\Controllers\Api\ProductController::class, 'destroy']);
    Route::get('/products/{product}/activity', [\App\Http\Controllers\Api\ProductController::class, 'activity']);
});

/*
|--------------------------------------------------------------------------
| Inventory API Routes
|--------------------------------------------------------------------------
*/
Route::prefix('inventory')->group(function () {
    
    // Inventory Levels API - 從實際資料庫讀取
    Route::get('/levels', function (Request $request) {
        try {
            $query = DB::table('inventory_levels as il')
                ->join('products as p', 'il.product_id', '=', 'p.id')
                ->leftJoin('product_categories as pc', 'p.category_id', '=', 'pc.id')
                ->join('warehouses as w', 'il.warehouse_id', '=', 'w.id')
                ->select([
                    'il.product_id',
                    'p.name as product_name',
                    'p.sku',
                    DB::raw('COALESCE(pc.name, \'' . '未分類' . '\') as category_name'),
                    'p.cost_price as unit_cost',
                    // 動態處理單價欄位：優先 unit_price，其次 price，否則 0
                    DB::raw((Schema::hasColumn('products','unit_price') ? 'p.unit_price' : (Schema::hasColumn('products','price') ? 'p.price' : '0')) . ' as market_price'),
                    'il.warehouse_id', 
                    'w.name as warehouse_name',
                    'il.quantity_available',
                    'il.quantity_on_hand',
                    'il.quantity_reserved',
                    'il.quantity_on_order',
                    'il.reorder_point'
                ]);
            
            // 如果有指定 product_id，回傳該產品的總庫存（所有倉庫合計）
            if ($request->filled('product_id')) {
                $productId = $request->get('product_id');
                
                // 獲取該產品在所有倉庫的庫存匯總
                $inventorySummary = DB::table('inventory_levels as il')
                    ->join('products as p', 'il.product_id', '=', 'p.id')
                    ->where('il.product_id', $productId)
                    ->select([
                        'il.product_id',
                        'p.name as product_name',
                        'p.sku',
                        DB::raw('AVG(p.cost_price) as unit_cost'),
                        // 匯總時同樣動態處理單價欄位
                        DB::raw((Schema::hasColumn('products','unit_price') ? 'AVG(p.unit_price)' : (Schema::hasColumn('products','price') ? 'AVG(p.price)' : '0')) . ' as market_price'),
                        DB::raw('SUM(il.quantity_on_hand) as total_quantity_on_hand'),
                        DB::raw('SUM(il.quantity_reserved) as total_quantity_reserved'),  
                        DB::raw('SUM(il.quantity_available) as total_quantity_available'),
                        DB::raw('SUM(il.quantity_on_order) as total_quantity_on_order'),
                        DB::raw('MIN(il.reorder_point) as min_reorder_point'),
                        DB::raw('COUNT(il.warehouse_id) as warehouse_count')
                    ])
                    ->groupBy('il.product_id', 'p.name', 'p.sku')
                    ->first();
                
                if ($inventorySummary) {
                    return response()->json([
                        'success' => true,
                        'data' => [[
                            'id' => $inventorySummary->product_id,
                            'product_id' => $inventorySummary->product_id,
                            'sku' => $inventorySummary->sku ?? 'UNKNOWN',
                            'product_name' => $inventorySummary->product_name ?? '未知產品',
                            'warehouse_id' => 'ALL', // 表示所有倉庫合計
                            'warehouse_name' => "所有倉庫合計 ({$inventorySummary->warehouse_count} 個倉庫)",
                            'warehouse_location' => "所有倉庫合計 ({$inventorySummary->warehouse_count} 個倉庫)",
                            'current_quantity' => $inventorySummary->total_quantity_on_hand,
                            'reserved_quantity' => $inventorySummary->total_quantity_reserved,
                            'quantity_available' => $inventorySummary->total_quantity_available,
                            'available_quantity' => $inventorySummary->total_quantity_available,
                            'quantity_on_order' => $inventorySummary->total_quantity_on_order,
                            'reorder_point' => $inventorySummary->min_reorder_point,
                            'status' => $inventorySummary->total_quantity_available <= $inventorySummary->min_reorder_point ? 'low' : 'normal',
                            'unit_cost' => (float) ($inventorySummary->unit_cost ?? 0),
                            'market_price' => (float) ($inventorySummary->market_price ?? 0),
                            'notes' => '跨倉庫總庫存'
                        ]]
                    ]);
                } else {
                    return response()->json([
                        'success' => true,
                        'data' => []
                    ]);
                }
            }
            
            // 如果沒有指定產品，回傳所有庫存數據
            $allInventoryData = $query->get();

            return response()->json([
                'success' => true,
                'data' => $allInventoryData->map(function($item) {
                    return [
                        'id' => $item->product_id,
                        'product_id' => $item->product_id,
                        'sku' => $item->sku ?? 'UNKNOWN',
                        'product_name' => $item->product_name ?? '未知產品',
                        'category_name' => $item->category_name ?? '未分類',
                        'warehouse_id' => $item->warehouse_id,
                        'warehouse_name' => $item->warehouse_name ?? '未知倉庫',
                        'warehouse_location' => $item->warehouse_name ?? '未知倉庫',
                        'current_quantity' => $item->quantity_on_hand,
                        'reserved_quantity' => $item->quantity_reserved,
                        'available_quantity' => $item->quantity_available,
                        'quantity_available' => $item->quantity_available, // 兼容舊鍵名
                        'quantity_on_order' => $item->quantity_on_order,
                        'reorder_point' => $item->reorder_point,
                        'status' => $item->quantity_available <= $item->reorder_point ? 'low' : 'normal',
                        'unit_cost' => (float) ($item->unit_cost ?? 0),
                        'market_price' => (float) ($item->market_price ?? 0),
                        'notes' => ''
                    ];
                }),
                'total' => $allInventoryData->count(),
                'per_page' => 25,
                'current_page' => 1,
                'last_page' => 1
            ]);
            
        } catch (\Exception $e) {
            \Log::error('Inventory levels API error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => 'Failed to fetch inventory data',
                'message' => $e->getMessage()
            ], 500);
        }
    });

    // Single Inventory Level API
    Route::get('/levels/{id}', function ($id) {
        // Mock data for specific inventory item
        $items = [
            1 => [
                'id' => 1,
                'sku' => 'PROD-001',
                'product_name' => '測試產品 A',
                'category_name' => '電子產品',
                'warehouse_location' => '倉庫 A-01',
                'current_quantity' => 100,
                'reserved_quantity' => 20,
                'available_quantity' => 80,
                'status' => 'normal',
                'unit_cost' => 25.50,
                'notes' => ''
            ],
            2 => [
                'id' => 2,
                'sku' => 'PROD-002',
                'product_name' => '測試產品 B',
                'category_name' => '辦公用品',
                'warehouse_location' => '倉庫 B-02',
                'current_quantity' => 15,
                'reserved_quantity' => 5,
                'available_quantity' => 10,
                'status' => 'low',
                'unit_cost' => 12.99,
                'notes' => '需要補貨'
            ],
            3 => [
                'id' => 3,
                'sku' => 'PROD-003',
                'product_name' => '測試產品 C',
                'category_name' => '服裝',
                'warehouse_location' => '倉庫 C-01',
                'current_quantity' => 0,
                'reserved_quantity' => 0,
                'available_quantity' => 0,
                'status' => 'out',
                'unit_cost' => 45.00,
                'notes' => '缺貨中'
            ]
        ];

        $item = $items[$id] ?? null;
        
        if (!$item) {
            return response()->json(['error' => 'Inventory item not found'], 404);
        }

        return response()->json($item);
    });

    // Update Inventory Level API
    Route::put('/levels/{id}', function (Request $request, $id) {
        // Mock update response
        return response()->json([
            'success' => true,
            'message' => '庫存資料已更新',
            'data' => [
                'id' => $id,
                'current_quantity' => $request->input('current_quantity'),
                'reserved_quantity' => $request->input('reserved_quantity'),
                'warehouse_location' => $request->input('warehouse_location'),
                'notes' => $request->input('notes')
            ]
        ]);
    });

    // Transaction Statistics API (must come before generic /transactions route)
    Route::get('/transactions/statistics', function (Request $request) {
        // Mock statistics data
        return response()->json([
            'total_in' => 150,
            'total_out' => 85,
            'total_adjustment' => 5,
            'total_transactions' => 25
        ]);
    });

    // Inventory Transactions API
    Route::get('/transactions', function (Request $request) {
        // Mock transaction data
        return response()->json([
            'data' => [
                [
                    'id' => 1,
                    'transaction_number' => 'TXN-2025-001',
                    'transaction_date' => '2025-07-24',
                    'type' => 'in',
                    'sku' => 'PROD-001',
                    'product_name' => '測試產品 A',
                    'quantity_change' => 50,
                    'quantity_before' => 50,
                    'quantity_after' => 100,
                    'operator_name' => '張小明',
                    'notes' => '採購入庫',
                    'unit_cost' => 25.50,
                    'po_number' => 'PO-2025-001',
                    'so_number' => null
                ],
                [
                    'id' => 2,
                    'transaction_number' => 'TXN-2025-002',
                    'transaction_date' => '2025-07-23',
                    'type' => 'out',
                    'sku' => 'PROD-002',
                    'product_name' => '測試產品 B',
                    'quantity_change' => -10,
                    'quantity_before' => 25,
                    'quantity_after' => 15,
                    'operator_name' => '李小華',
                    'notes' => '銷售出庫',
                    'unit_cost' => 12.99,
                    'po_number' => null,
                    'so_number' => 'SO-2025-001'
                ],
                [
                    'id' => 3,
                    'transaction_number' => 'TXN-2025-003',
                    'transaction_date' => '2025-07-22',
                    'type' => 'adjustment',
                    'sku' => 'PROD-003',
                    'product_name' => '測試產品 C',
                    'quantity_change' => -5,
                    'quantity_before' => 5,
                    'quantity_after' => 0,
                    'operator_name' => '王小強',
                    'notes' => '損壞調整',
                    'unit_cost' => 45.00,
                    'po_number' => null,
                    'so_number' => null
                ]
            ],
            'total' => 3,
            'per_page' => 25,
            'current_page' => 1,
            'last_page' => 1
        ]);
    });

    // Single Transaction API
    Route::get('/transactions/{id}', function ($id) {
        $transactions = [
            1 => [
                'id' => 1,
                'transaction_number' => 'TXN-2025-001',
                'transaction_date' => '2025-07-24',
                'type' => 'in',
                'sku' => 'PROD-001',
                'product_name' => '測試產品 A',
                'quantity_change' => 50,
                'quantity_before' => 50,
                'quantity_after' => 100,
                'operator_name' => '張小明',
                'notes' => '採購入庫',
                'unit_cost' => 25.50,
                'po_number' => 'PO-2025-001',
                'so_number' => null
            ],
            2 => [
                'id' => 2,
                'transaction_number' => 'TXN-2025-002',
                'transaction_date' => '2025-07-23',
                'type' => 'out',
                'sku' => 'PROD-002',
                'product_name' => '測試產品 B',
                'quantity_change' => -10,
                'quantity_before' => 25,
                'quantity_after' => 15,
                'operator_name' => '李小華',
                'notes' => '銷售出庫',
                'unit_cost' => 12.99,
                'po_number' => null,
                'so_number' => 'SO-2025-001'
            ]
        ];

        $transaction = $transactions[$id] ?? null;
        
        if (!$transaction) {
            return response()->json(['error' => 'Transaction not found'], 404);
        }

        return response()->json($transaction);
    });

});

/*
|--------------------------------------------------------------------------
| Reports API Routes
|--------------------------------------------------------------------------
*/
Route::prefix('reports')->middleware(['web', 'auth', \App\Http\Middleware\SetCompanyContext::class])->group(function () {
    
    // Sales Reports API - with proper authentication
    Route::prefix('sales')->group(function () {
        // 銷售總覽報表
        Route::get('/', [SalesReportController::class, 'getSalesReport'])->name('api.reports.sales.index');
        
        // 產品銷售分析
        Route::get('/by-product', [SalesReportController::class, 'getProductSalesReport'])->name('api.reports.sales.by-product');
        
        // 客戶銷售分析  
        Route::get('/by-customer', [SalesReportController::class, 'getCustomerSalesReport'])->name('api.reports.sales.by-customer');
        
        // 銷售趨勢分析
        Route::get('/trends', [SalesReportController::class, 'getSalesTrendsReport'])->name('api.reports.sales.trends');
    });

    // Sales Report Export API
    Route::get('/sales/export', function (Request $request) {
        $format = $request->input('format', 'excel');
        
        // Mock export functionality
        if ($format === 'excel') {
            return response()->json([
                'message' => 'Excel export functionality will be implemented',
                'download_url' => '/downloads/sales-report.xlsx'
            ]);
        } elseif ($format === 'pdf') {
            return response()->json([
                'message' => 'PDF export functionality will be implemented', 
                'download_url' => '/downloads/sales-report.pdf'
            ]);
        }
        
        return response()->json(['error' => 'Unsupported format'], 400);
    });
});

/*
|--------------------------------------------------------------------------
| Products Management API Routes - MERGED with multi-tenant middleware
|--------------------------------------------------------------------------
| This section has been merged with the products routes above (lines 79-82)
| to avoid conflicts and ensure proper multi-tenant isolation.
| All product routes now use the complete middleware stack including:
| - SetCompanyContext: Ensures proper company context
| - EnsureCompanySetup: Validates company setup
*/
// DISABLED: Merged with multi-tenant routes above to prevent conflicts
// Route::prefix('products')->middleware(['web', 'auth'])->group(function () {
//     Route::get('/', [App\Http\Controllers\Api\ProductController::class, 'index']);
//     Route::post('/', [App\Http\Controllers\Api\ProductController::class, 'store']);
//     Route::get('/{product}', [App\Http\Controllers\Api\ProductController::class, 'show']);
//     Route::put('/{product}', [App\Http\Controllers\Api\ProductController::class, 'update']);
//     Route::delete('/{product}', [App\Http\Controllers\Api\ProductController::class, 'destroy']);
//     Route::get('/{product}/activity', [App\Http\Controllers\Api\ProductController::class, 'activity']);
// });

/*
|--------------------------------------------------------------------------
| Product Categories API Routes
|--------------------------------------------------------------------------
*/
Route::prefix('product-categories')->group(function () {
    Route::get('/', function (Request $request) {
        try {
            // 從實際資料庫查詢產品分類
            $categories = DB::table('product_categories')
                ->select('id', 'name', 'description')
                ->where('is_active', true)
                ->orderBy('name')
                ->get();
            
            return response()->json([
                'success' => true,
                'data' => $categories
            ]);
        } catch (\Exception $e) {
            Log::error('Product categories API error: ' . $e->getMessage());
            
            // 如果資料庫查詢失敗，回退到基本數據
            return response()->json([
                'success' => true,
                'data' => [
                    ['id' => 468, 'name' => '電子產品', 'description' => '各類電子設備與配件'],
                    ['id' => 473, 'name' => '服飾用品', 'description' => '服飾與配件用品'],
                    ['id' => 479, 'name' => '食品飲料', 'description' => '各類食品與飲品'],
                    ['id' => 490, 'name' => '辦公用品', 'description' => '辦公室必需品與文具'],
                    ['id' => 505, 'name' => '家居生活', 'description' => '家庭生活必需品']
                ]
            ]);
        }
    });
});

/*
|--------------------------------------------------------------------------
| Units of Measure API Routes
|--------------------------------------------------------------------------
*/
Route::prefix('units-of-measure')->group(function () {
    Route::get('/', function (Request $request) {
        try {
            // 從實際資料庫查詢測量單位
            $units = DB::table('units_of_measure')
                ->select('id', 'name', 'symbol', 'type')
                ->where('is_active', true)
                ->orderBy('name')
                ->get();
            
            return response()->json([
                'success' => true,
                'data' => $units
            ]);
        } catch (\Exception $e) {
            Log::error('Units of measure API error: ' . $e->getMessage());
            
            // 如果資料庫查詢失敗，回退到基本數據
            return response()->json([
                'success' => true,
                'data' => [
                    ['id' => 610, 'name' => '個', 'symbol' => '個', 'type' => 'count'],
                    ['id' => 611, 'name' => '包', 'symbol' => '包', 'type' => 'package'],
                    ['id' => 612, 'name' => '箱', 'symbol' => '箱', 'type' => 'package'],
                    ['id' => 613, 'name' => '公斤', 'symbol' => 'kg', 'type' => 'weight'],
                    ['id' => 616, 'name' => '公升', 'symbol' => 'L', 'type' => 'volume'],
                    ['id' => 618, 'name' => '公尺', 'symbol' => 'm', 'type' => 'length'],
                    ['id' => 632, 'name' => '盒', 'symbol' => '盒', 'type' => 'box'],
                    ['id' => 623, 'name' => '組', 'symbol' => '組', 'type' => 'set']
                ]
            ]);
        }
    });
});

/*
|--------------------------------------------------------------------------
| Employee Management API Routes
|--------------------------------------------------------------------------
*/
Route::prefix('employees')->group(function () {
    
    // Employee List API
    Route::get('/', function (Request $request) {
        // Mock employee data
        return response()->json([
            'data' => [
                [
                    'id' => 1,
                    'employee_id' => 'EMP-001',
                    'name' => '張小明',
                    'email' => 'zhang@nexuserp.com',
                    'department' => '業務部',
                    'position' => '業務經理',
                    'hire_date' => '2023-01-15',
                    'status' => 'active',
                    'phone' => '0912-345-678',
                    'avatar' => null
                ],
                [
                    'id' => 2,
                    'employee_id' => 'EMP-002',
                    'name' => '李小華',
                    'email' => 'li@nexuserp.com',
                    'department' => '技術部',
                    'position' => '軟體工程師',
                    'hire_date' => '2023-03-20',
                    'status' => 'active',
                    'phone' => '0923-456-789',
                    'avatar' => null
                ],
                [
                    'id' => 3,
                    'employee_id' => 'EMP-003',
                    'name' => '王小強',
                    'email' => 'wang@nexuserp.com',
                    'department' => '財務部',
                    'position' => '會計師',
                    'hire_date' => '2022-11-10',
                    'status' => 'active',
                    'phone' => '0934-567-890',
                    'avatar' => null
                ],
                [
                    'id' => 4,
                    'employee_id' => 'EMP-004',
                    'name' => '陳小美',
                    'email' => 'chen@nexuserp.com',
                    'department' => '人事部',
                    'position' => '人事專員',
                    'hire_date' => '2023-06-01',
                    'status' => 'vacation',
                    'phone' => '0945-678-901',
                    'avatar' => null
                ]
            ],
            'statistics' => [
                'total_employees' => 4,
                'active_employees' => 3,
                'on_vacation' => 1,
                'departments' => 4
            ],
            'generated_at' => now()->toISOString()
        ]);
    });
});

/*
|--------------------------------------------------------------------------
| Marketplace API Routes  
|--------------------------------------------------------------------------
*/
Route::prefix('marketplace')->group(function () {
    
    // Product Categories API（方案 B：從 DemoDataService 讀取）
    Route::get('/categories', function (Request $request) {
        $svc = app(\App\Services\DemoDataService::class);
        return response()->json([
            'data' => $svc->get('marketplace/categories')
        ]);
    });
    
    // Products API - 方案 B：由 DemoDataService 提供原始資料，再執行篩選/排序/分頁
    Route::get('/products', function (Request $request) {
        $page = max(1, (int) $request->get('page', 1));
        $pageSize = max(1, min(50, (int) $request->get('page_size', 20)));
        $sortBy = $request->get('sort_by', 'created_at');
        $sortOrder = strtolower($request->get('sort_order', 'desc')) === 'asc' ? 'asc' : 'desc';
        $svc = app(\App\Services\DemoDataService::class);
        $all = $svc->get('marketplace/products');

        // 篩選
        $filtered = array_filter($all, function ($p) use ($request) {
            if ($q = $request->get('search')) {
                if (mb_stripos($p['name'], $q) === false && mb_stripos($p['description'], $q) === false) return false;
            }
            if ($catId = $request->get('category_id')) {
                $map = [1 => '電子產品', 2 => '辦公用品', 3 => '服裝配件', 4 => '家居用品'];
                if (isset($map[(int)$catId]) && $p['category'] !== $map[(int)$catId]) return false;
            }
            if ($request->get('is_featured') && !$p['is_featured']) return false;
            if ($request->get('is_new_arrival') && !$p['is_new_arrival']) return false;
            if ($request->get('is_bestseller') && !$p['is_bestseller']) return false;
            if ($status = $request->get('stock_status')) {
                $arr = array_filter(explode(',', $status));
                if (!in_array($p['stock_status'], $arr)) return false;
            }
            if ($min = $request->get('price_min')) { if ($p['price'] < (int)$min) return false; }
            if ($max = $request->get('price_max')) { if ($p['price'] > (int)$max) return false; }
            if ($brand = $request->get('brand')) { if (mb_stripos($p['brand'], $brand) === false) return false; }
            return true;
        });

        // 排序
        usort($filtered, function ($a, $b) use ($sortBy, $sortOrder) {
            $av = $a[$sortBy] ?? ($sortBy === 'price' ? $a['price'] : $a['created_at']);
            $bv = $b[$sortBy] ?? ($sortBy === 'price' ? $b['price'] : $b['created_at']);
            if ($av == $bv) return 0;
            $res = ($av < $bv) ? -1 : 1;
            return $sortOrder === 'asc' ? $res : -$res;
        });

        // 分頁
        $total = count($filtered);
        $offset = ($page - 1) * $pageSize;
        $paged = array_slice(array_values($filtered), $offset, $pageSize);
        $lastPage = (int) ceil($total / $pageSize);

        return response()->json([
            'data' => $paged,
            'total' => $total,
            'per_page' => $pageSize,
            'current_page' => $page,
            'last_page' => $lastPage
        ]);
    });
    
    // Products Suggestions API (picsum 生成，與列表一致，避免破圖)
    Route::get('/products/suggestions', function (Request $request) {
        $excludeId = (int) $request->get('exclude_id', 0);
        $category = $request->get('category');

        $categories = [
            ['name' => '電子產品', 'slug' => 'electronics'],
            ['name' => '辦公用品', 'slug' => 'office-supplies'],
            ['name' => '服裝配件', 'slug' => 'fashion'],
            ['name' => '家居用品', 'slug' => 'home-goods']
        ];
        $names = [
            '無線藍牙耳機', '辦公桌椅組合', '商務背包', '智慧溫控水壺', 'USB-C 集線器',
            '人體工學鍵盤', '4K 螢幕', '降噪耳罩', '無線滑鼠', '藍光護目鏡',
        ];

        $all = [];
        for ($i = 0; $i < 80; $i++) {
            $cat = $categories[$i % count($categories)];
            $name = $names[$i % count($names)];
            $seed = urlencode($cat['slug'] . '-' . ($i + 1));
            $price = [2999, 8900, 1599, 799, 1290, 2490, 11990, 3590, 690, 980][($i + 3) % 10];
            $stockStatuses = ['in_stock', 'low_stock', 'out_of_stock'];
            $stock = $stockStatuses[$i % 3];
            $supplierId = ($i % 8) + 1;
            $all[] = [
                'id' => $i + 1,
                'name' => $name,
                'description' => $name . '，高品質嚴選，滿足日常與專業需求。',
                'price' => $price,
                'supplier_id' => $supplierId,
                'supplier' => ['company_name' => '供應商 ' . chr(65 + ($supplierId % 26))],
                'category' => $cat['name'],
                'images' => [
                    ['url' => "https://picsum.photos/seed/{$seed}-1/400/300"],
                ],
                'rating' => round(3.5 + ($i % 15) / 10, 1),
                'reviews_count' => 40 + ($i * 3 % 230),
                'in_stock' => $stock !== 'out_of_stock',
                'stock_status' => $stock,
                'is_featured' => $i % 7 === 0,
                'is_new_arrival' => $i % 5 === 0,
                'is_bestseller' => $i % 9 === 0,
                'minimum_order_quantity' => ($i % 3) + 1,
                'view_count' => 50 + ($i * 7 % 1000),
                'sku' => 'DEMO-' . str_pad((string)($i + 1), 4, '0', STR_PAD_LEFT),
                'brand' => '品牌 ' . chr(65 + ($i % 26)),
            ];
        }

        // 過濾：排除同一商品、依類別（名稱或 slug）比對
        $filtered = array_values(array_filter($all, function ($item) use ($excludeId, $category) {
            if ($excludeId && (int)$item['id'] === $excludeId) return false;
            if ($category) {
                $target = mb_strtolower($category);
                $nameMatch = mb_strpos(mb_strtolower($item['category']), $target) !== false;
                if ($nameMatch) return true;
                $map = [
                    '電子產品' => 'electronics',
                    '辦公用品' => 'office-supplies',
                    '服裝配件' => 'fashion',
                    '家居用品' => 'home-goods',
                ];
                $slug = $map[$item['category']] ?? '';
                return $slug && mb_strpos($target, $slug) !== false;
            }
            return true;
        }));

        if (count($filtered) > 4) {
            shuffle($filtered);
            $filtered = array_slice($filtered, 0, 4);
        }

        return response()->json([
            'data' => $filtered,
            'meta' => [
                'page' => 1,
                'page_size' => count($filtered),
                'total' => count($filtered)
            ]
        ]);
    });

    // Supplier Profile API (DEMO)
    Route::get('/suppliers/{id}', function ($id) {
        $id = (int) $id;
        $seed = urlencode('supplier-' . $id);
        $names = [
            '新星科技股份有限公司', '宏展家具有限公司', '遠創箱包企業', '家適電器有限公司',
            '未來電子股份有限公司', '鍵達科技', '視界顯示器', '寧靜降噪有限公司'
        ];
        $name = $names[$id % count($names)];
        return response()->json([
            'id' => $id,
            'company_name' => $name,
            'logo_url' => "https://picsum.photos/seed/{$seed}/160/160",
            'banner_url' => "https://picsum.photos/seed/{$seed}-banner/1200/320",
            'description' => $name . '，提供高品質商品與專業服務，致力於成為您最可信賴的供應夥伴。',
            'contact_person' => '張經理',
            'email' => 'sales@example.com',
            'phone' => '02-1234-5678',
            'address' => '台北市信義區市府路 1 號',
            'statistics' => [
                'product_count' => 48,
                'rating' => 4.6,
                'reviews_count' => 320
            ]
        ]);
    });

    // Supplier Products API (DEMO) - 與列表生成規則一致
    Route::get('/suppliers/{id}/products', function (Request $request, $id) {
        $page = max(1, (int) $request->get('page', 1));
        $pageSize = max(1, min(50, (int) $request->get('page_size', 20)));
        $sortBy = $request->get('sort_by', 'created_at');
        $sortOrder = strtolower($request->get('sort_order', 'desc')) === 'asc' ? 'asc' : 'desc';

        $categories = [
            ['name' => '電子產品', 'slug' => 'electronics'],
            ['name' => '辦公用品', 'slug' => 'office-supplies'],
            ['name' => '服裝配件', 'slug' => 'fashion'],
            ['name' => '家居用品', 'slug' => 'home-goods']
        ];
        $names = [
            '無線藍牙耳機', '辦公桌椅組合', '商務背包', '智慧溫控水壺', 'USB-C 集線器',
            '人體工學鍵盤', '4K 螢幕', '降噪耳罩', '無線滑鼠', '藍光護目鏡',
        ];

        $all = [];
        for ($i = 0; $i < 36; $i++) {
            $cat = $categories[$i % count($categories)];
            $name = $names[$i % count($names)];
            $seed = urlencode('supplier-' . $id . '-' . ($i + 1));
            $price = [2999, 8900, 1599, 799, 1290, 2490, 11990, 3590, 690, 980][($i + 3) % 10];
            $stockStatuses = ['in_stock', 'low_stock', 'out_of_stock'];
            $stock = $stockStatuses[$i % 3];
            $all[] = [
                'id' => ($id * 1000) + $i + 1,
                'supplier_id' => (int) $id,
                'name' => $name,
                'description' => $name . '（商家商品），嚴選品質。',
                'price' => $price,
                'supplier' => ['company_name' => '供應商 ' . chr(65 + ($id % 26))],
                'category' => $cat['name'],
                'images' => [
                    ['url' => "https://picsum.photos/seed/{$seed}-1/800/600"],
                    ['url' => "https://picsum.photos/seed/{$seed}-2/400/300"],
                ],
                'rating' => round(3.5 + ($i % 15) / 10, 1),
                'reviews_count' => 20 + ($i * 5 % 200),
                'in_stock' => $stock !== 'out_of_stock',
                'stock_status' => $stock,
                'minimum_order_quantity' => ($i % 3) + 1,
                'view_count' => 10 + ($i * 9 % 500),
                'sku' => 'SUP-' . str_pad((string)($id) , 3, '0', STR_PAD_LEFT) . '-' . str_pad((string)($i + 1), 4, '0', STR_PAD_LEFT),
                'brand' => '品牌 ' . chr(65 + ($i % 26)),
                'created_at' => time() - ($i * 43200)
            ];
        }

        // 排序
        usort($all, function ($a, $b) use ($sortBy, $sortOrder) {
            $av = $a[$sortBy] ?? ($sortBy === 'price' ? $a['price'] : $a['created_at']);
            $bv = $b[$sortBy] ?? ($sortBy === 'price' ? $b['price'] : $b['created_at']);
            if ($av == $bv) return 0;
            $res = ($av < $bv) ? -1 : 1;
            return $sortOrder === 'asc' ? $res : -$res;
        });

        // 分頁
        $total = count($all);
        $offset = ($page - 1) * $pageSize;
        $paged = array_slice(array_values($all), $offset, $pageSize);
        $lastPage = (int) ceil($total / $pageSize);

        return response()->json([
            'data' => $paged,
            'total' => $total,
            'per_page' => $pageSize,
            'current_page' => $page,
            'last_page' => $lastPage
        ]);
    });

    // Single Product API - 方案 B：由 DemoDataService 資料推導
    Route::get('/products/{id}', function ($id) {
        // 保留舊靜態表以避免 404
        $products = [
            1 => [
                'id' => 1,
                'name' => '無線藍牙耳機',
                'description' => '高品質無線藍牙耳機，支援降噪功能，提供清晰的音質體驗。採用先進的主動降噪技術，有效阻隔外界噪音，讓您專注於音樂世界。配備長效電池，續航時間長達30小時。',
                'price' => 2999,
                'supplier' => [
                    'company_name' => '科技供應商 A',
                    'contact_person' => '張經理',
                    'business_type' => 'manufacturer'
                ],
                'category' => ['name' => '電子產品'],
                'images' => [
                    ['url' => '/images/products/bluetooth-headphones.jpg'],
                    ['url' => '/images/products/bluetooth-headphones-2.jpg'],
                    ['url' => '/images/products/bluetooth-headphones-3.jpg']
                ],
                'rating' => 4.5,
                'reviews_count' => 128,
                'in_stock' => true,
                'stock_status' => 'in_stock',
                'is_featured' => true,
                'is_new_arrival' => false,
                'is_bestseller' => false,
                'minimum_order_quantity' => 1,
                'view_count' => 256,
                'sku' => 'BT-HEAD-001',
                'brand' => '科技品牌'
            ],
            2 => [
                'id' => 2,
                'name' => '辦公桌椅組合',
                'description' => '人體工學設計辦公桌椅，提升工作效率。採用優質材料製作，提供舒適的工作體驗。可調節高度，適合不同身高的使用者。',
                'price' => 8900,
                'supplier' => [
                    'company_name' => '家具供應商 B',
                    'contact_person' => '李經理',
                    'business_type' => 'distributor'
                ],
                'category' => ['name' => '辦公用品'],
                'images' => [
                    ['url' => '/images/products/office-chair.jpg']
                ],
                'rating' => 4.2,
                'reviews_count' => 89,
                'in_stock' => true,
                'stock_status' => 'in_stock',
                'is_featured' => false,
                'is_new_arrival' => true,
                'is_bestseller' => false,
                'minimum_order_quantity' => 1,
                'view_count' => 184,
                'sku' => 'OFF-CHAIR-002',
                'brand' => '家具品牌'
            ],
            3 => [
                'id' => 3,
                'name' => '商務背包',
                'description' => '多功能商務背包，適合出差和日常使用。配備多個收納空間，可容納筆記型電腦、文件和個人物品。採用防水材質，保護內容物不受潮濕影響。',
                'price' => 1599,
                'supplier' => [
                    'company_name' => '箱包供應商 C',
                    'contact_person' => '王經理',
                    'business_type' => 'retailer'
                ],
                'category' => ['name' => '服裝配件'],
                'images' => [
                    ['url' => '/images/products/business-backpack.jpg']
                ],
                'rating' => 4.7,
                'reviews_count' => 203,
                'in_stock' => false,
                'stock_status' => 'out_of_stock',
                'is_featured' => false,
                'is_new_arrival' => false,
                'is_bestseller' => true,
                'minimum_order_quantity' => 1,
                'view_count' => 312,
                'sku' => 'BAG-BUS-003',
                'brand' => '箱包品牌'
            ],
            4 => [
                'id' => 4,
                'name' => '智慧溫控水壺',
                'description' => '可調節溫度的智慧保溫水壺，配備數位顯示螢幕，可精確控制水溫。內建保溫功能，長時間保持理想溫度。',
                'price' => 799,
                'supplier' => [
                    'company_name' => '家電供應商 D',
                    'contact_person' => '陳經理',
                    'business_type' => 'service_provider'
                ],
                'category' => ['name' => '家居用品'],
                'images' => [
                    ['url' => '/images/products/smart-bottle.jpg']
                ],
                'rating' => 4.3,
                'reviews_count' => 156,
                'in_stock' => true,
                'stock_status' => 'low_stock',
                'is_featured' => false,
                'is_new_arrival' => false,
                'is_bestseller' => false,
                'minimum_order_quantity' => 2,
                'view_count' => 95,
                'sku' => 'BOT-SMART-004',
                'brand' => '家電品牌'
            ]
        ];

        // 新：動態生成
        $svc = app(\App\Services\DemoDataService::class);
        $list = $svc->get('marketplace/products');
        $found = collect($list)->firstWhere('id', (int)$id);
        if ($found) {
            // 轉成詳情格式（類別物件）
            $found['category'] = ['name' => $found['category']];
            // 保證圖片為 800x600 主圖
            if (!empty($found['images'][0]['url'])) {
                $found['images'][0]['url'] = preg_replace('/\/\d{3,4}\/\d{3,4}$/', '/800/600', $found['images'][0]['url']);
            }
            return response()->json($found);
        }

        // 回退到舊靜態資料
        $product = $products[$id] ?? null;
        if ($product) return response()->json($product);
        return response()->json(['error' => 'Product not found'], 404);
    });
});

/*
|--------------------------------------------------------------------------
| Purchase Orders API Routes - MERGED WITH MAIN API ROUTES
|--------------------------------------------------------------------------
| These routes have been merged with the main API routes above (lines 96-100)
| to avoid conflicts and ensure proper route resolution.
| Additional status management routes moved to main routes section.
*/

// 移除重複的供應商路由定義 - 已整合到主要 API 路由組

/*
|--------------------------------------------------------------------------
| Customers API Routes (CRM Module) - DISABLED
|--------------------------------------------------------------------------
| These routes are disabled to avoid conflicts with the main CustomerController
| which uses the Go backend API. All customer operations should go through
| the web routes that use CustomerController with proper multi-tenant isolation.
|
| TODO: Remove this section entirely once multi-tenant setup is confirmed working
*/
// Route::prefix('customers')->middleware(['web', 'auth'])->group(function () {
//     Route::get('/', [App\Http\Controllers\Api\CustomerController::class, 'index']);
//     Route::post('/', [App\Http\Controllers\Api\CustomerController::class, 'store']);
//     Route::get('/{customer}', [App\Http\Controllers\Api\CustomerController::class, 'show']);
//     Route::put('/{customer}', [App\Http\Controllers\Api\CustomerController::class, 'update']);
//     Route::delete('/{customer}', [App\Http\Controllers\Api\CustomerController::class, 'destroy']);
// });

/*
|--------------------------------------------------------------------------
| Dashboard API Routes - MOVED TO WEB.PHP
|--------------------------------------------------------------------------
| These routes have been moved to web.php to ensure proper session and 
| CSRF token handling for authentication.
*/

/*
|--------------------------------------------------------------------------
| Sales Orders API Routes
|--------------------------------------------------------------------------
*/
Route::prefix('sales-orders')->middleware(['web', 'auth'])->group(function () {
    
    // Sales Orders CRUD Operations
    Route::get('/', [App\Http\Controllers\Api\SalesOrderController::class, 'index']);
    Route::post('/', [App\Http\Controllers\Api\SalesOrderController::class, 'store']);
    Route::get('/{salesOrder}', [App\Http\Controllers\Api\SalesOrderController::class, 'show']);
    Route::put('/{salesOrder}', [App\Http\Controllers\Api\SalesOrderController::class, 'update']);
    Route::delete('/{salesOrder}', [App\Http\Controllers\Api\SalesOrderController::class, 'destroy']);
    
    // Sales Order Shipping Management
    Route::post('/{salesOrder}/ship', [App\Http\Controllers\Api\SalesOrderController::class, 'ship']);
});

/*
|--------------------------------------------------------------------------
| Company Management API Routes (Multi-Tenant)
|--------------------------------------------------------------------------
*/
Route::prefix('company-management')->middleware(['web', 'auth', \App\Http\Middleware\SetCompanyContext::class])->group(function () {
    
    // Company Operations
    Route::get('/companies', [CompanyManagementController::class, 'getUserCompanies']);
    Route::post('/switch-company', [CompanyManagementController::class, 'switchCompany']);
    
    // User Invitation Management
    Route::post('/invite-user', [CompanyManagementController::class, 'inviteUser']);
    Route::get('/users', [CompanyManagementController::class, 'getCompanyUsers']);
    Route::put('/users/{userId}/role', [CompanyManagementController::class, 'updateUserRole']);
    
    // Invitation Information (for displaying invitation details)
    Route::get('/invitation/{token}', [CompanyManagementController::class, 'getInvitation']);
});

/*
|--------------------------------------------------------------------------
| Public Invitation Routes (No Authentication Required)
|--------------------------------------------------------------------------
*/
Route::prefix('invitations')->group(function () {
    // Accept invitation endpoint
    Route::post('/accept/{token}', [CompanyManagementController::class, 'acceptInvitation'])->name('company.invitation.accept');
    
    // Get invitation info for display
    Route::get('/{token}', [CompanyManagementController::class, 'getInvitation'])->name('company.invitation.show');
});

/*
|--------------------------------------------------------------------------
| Quote Draft API Routes
|--------------------------------------------------------------------------
*/
Route::prefix('quotations')->middleware(['web', 'auth'])->group(function () {
    // Draft management endpoints
    Route::post('/draft', [\App\Http\Controllers\Api\QuoteDraftController::class, 'store'])->name('api.quote.draft.store');
    Route::get('/drafts', [\App\Http\Controllers\Api\QuoteDraftController::class, 'index'])->name('api.quote.draft.index');
    Route::get('/draft/{draftId?}', [\App\Http\Controllers\Api\QuoteDraftController::class, 'show'])->name('api.quote.draft.show');
    Route::delete('/draft/{draftId}', [\App\Http\Controllers\Api\QuoteDraftController::class, 'destroy'])->name('api.quote.draft.destroy');
    
    // Draft validation endpoint
    Route::post('/draft/validate', [\App\Http\Controllers\Api\QuoteDraftController::class, 'validateDraft'])->name('api.quote.draft.validate');
});

/*
|--------------------------------------------------------------------------
| Super Admin API Routes (CRITICAL SECURITY)
|--------------------------------------------------------------------------
*/
Route::prefix('superadmin')->middleware(['web', 'auth'])->group(function () {
    // 超級管理員控制面板
    Route::get('/dashboard', [SuperAdminController::class, 'dashboard']);
    
    // 啟用/停用超級管理員模式
    Route::post('/enable', [SuperAdminController::class, 'enableMode']);
    Route::post('/disable', [SuperAdminController::class, 'disableMode']);
    
    // 存取監控和統計
    Route::get('/access-monitor', [SuperAdminController::class, 'getAccessMonitor']);
    Route::get('/statistics', [SuperAdminController::class, 'getStatistics']);
    
    // 系統級資料存取
    Route::get('/system-data', [SuperAdminController::class, 'viewSystemData']);
});