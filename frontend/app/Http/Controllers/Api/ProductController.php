<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\InventoryLevel;
use App\Services\ProductImageService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * 產品 API 控制器
 * 
 * 主要功能：產品的查詢、創建、更新、刪除等 CRUD 操作
 */
class ProductController extends Controller
{
    protected $imageService;
    
    public function __construct(ProductImageService $imageService)
    {
        $this->imageService = $imageService;
    }
    /**
     * 顯示產品列表
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = Product::query();
            
            // 只顯示屬於當前公司的產品 - 多租戶篩選
            $companyId = session('current_company_id') ?? session('app.current_company_id');
            if ($companyId) {
                $query->where('company_id', $companyId);
            }

            // 狀態篩選
            if ($request->filled('status')) {
                if ($request->status === 'active') {
                    $query->active();
                } elseif ($request->status === 'inactive') {
                    $query->inactive();
                }
            }

            // 分類篩選
            if ($request->filled('category')) {
                $query->byCategory($request->category);
            }

            // 關鍵字搜尋（名稱、SKU或條碼）
            if ($request->filled('search')) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'ILIKE', "%{$search}%")
                      ->orWhere('sku', 'ILIKE', "%{$search}%")
                      ->orWhere('barcode', 'ILIKE', "%{$search}%");
                });
            }

            // 低庫存篩選
            if ($request->filled('low_stock') && $request->low_stock) {
                $query->lowStock();
            }

            // 排序
            $sortBy = $request->get('sort_by', 'created_at');
            $sortOrder = $request->get('sort_order', 'desc');
            $query->orderBy($sortBy, $sortOrder);

            // 分頁
            $perPage = $request->get('per_page', 25);
            
            if ($request->has('paginate') && $request->paginate === 'false') {
                // 不分頁，返回所有資料
                $products = $query->get();
                // 添加欄位映射以支援前端列表顯示
                $transformedProducts = $products->map(function ($product) {
                    Log::debug('Processing product in API', [
                        'product_id' => $product->id,
                        'product_name' => $product->name,
                        'product_company_id' => $product->company_id,
                        'product_company_id_type' => gettype($product->company_id)
                    ]);

                    $product->price = $product->selling_price ?? $product->cost_price ?? 0;
                    $product->unit_price = $product->price; // 向後相容
                    $product->category_name = $product->category_id; // 前端期待 category_name
                    
                    // 安全地計算庫存數據
                    try {
                        $product->stock_quantity = $product->getTotalStockQuantity();
                        Log::debug('Stock quantity calculated', [
                            'product_id' => $product->id,
                            'stock_quantity' => $product->stock_quantity
                        ]);
                    } catch (\Exception $e) {
                        Log::error('Error calculating stock quantity', [
                            'product_id' => $product->id,
                            'error' => $e->getMessage()
                        ]);
                        $product->stock_quantity = 0;
                    }

                    try {
                        $product->low_stock_threshold = $product->getMinimumReorderPoint();
                        $product->minimum_stock = $product->getMinimumReorderPoint(); // 向後相容
                    } catch (\Exception $e) {
                        Log::error('Error calculating reorder point', [
                            'product_id' => $product->id,
                            'error' => $e->getMessage()
                        ]);
                        $product->low_stock_threshold = 0;
                        $product->minimum_stock = 0;
                    }
                    
                    // 處理產品圖片，列表頁使用快速模式
                    $product->image = $this->imageService->getProductImageUrl($product, true);
                    $product->image_url = $product->image; // 向後相容
                    
                    return $product;
                });
                return response()->json([
                    'success' => true,
                    'data' => $transformedProducts,
                    'pagination' => [
                        'total' => $products->count(),
                        'per_page' => $products->count(),
                        'current_page' => 1,
                        'last_page' => 1
                    ]
                ]);
            } else {
                // 分頁資料
                $products = $query->paginate($perPage);
                // 添加欄位映射以支援前端列表顯示
                $transformedItems = collect($products->items())->map(function ($product) {
                    // DEBUG: 添加產品處理的詳細日誌
                    Log::debug("Processing product in API", [
                        'product_id' => $product->id,
                        'product_name' => $product->name,
                        'product_company_id' => $product->company_id,
                        'product_company_id_type' => gettype($product->company_id)
                    ]);
                    
                    $product->price = $product->selling_price ?? $product->cost_price ?? 0;
                    $product->unit_price = $product->price; // 向後相容
                    $product->category_name = $product->category_id; // 前端期待 category_name
                    
                    // 從 inventory_levels 資料表讀取庫存數據，與詳細頁面保持一致
                    try {
                        $product->stock_quantity = $product->getTotalStockQuantity();
                        Log::debug("Stock quantity calculated", [
                            'product_id' => $product->id,
                            'stock_quantity' => $product->stock_quantity
                        ]);
                    } catch (\Exception $e) {
                        Log::error("Error calculating stock quantity", [
                            'product_id' => $product->id,
                            'error' => $e->getMessage()
                        ]);
                        $product->stock_quantity = 0;
                    }
                    
                    // 暫時使用 try-catch 處理 reorder point 的問題
                    try {
                        $product->low_stock_threshold = $product->getMinimumReorderPoint(); // 前端期待 low_stock_threshold
                        $product->minimum_stock = $product->low_stock_threshold; // 向後相容
                    } catch (\Exception $e) {
                        Log::error("Error calculating reorder point", [
                            'product_id' => $product->id,
                            'error' => $e->getMessage()
                        ]);
                        $product->low_stock_threshold = 0;
                        $product->minimum_stock = 0;
                    }
                    
                    // 處理產品圖片，列表頁使用快速模式
                    $product->image = $this->imageService->getProductImageUrl($product, true);
                    $product->image_url = $product->image; // 向後相容
                    
                    return $product;
                });
                return response()->json([
                    'success' => true,
                    'data' => $transformedItems->toArray(),
                    'pagination' => [
                        'total' => $products->total(),
                        'per_page' => $products->perPage(),
                        'current_page' => $products->currentPage(),
                        'last_page' => $products->lastPage()
                    ]
                ]);
            }

        } catch (\Exception $e) {
            Log::error('Product index error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => '獲取產品列表失敗',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * 創建新的產品
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validatedData = $request->validate([
                'name' => 'required|string|max:255',
                'sku' => 'required|string|max:100|unique:products,sku',
                'description' => 'nullable|string',
                'category_id' => 'nullable|integer',
                'unit_of_measure_id' => 'required|integer',
                'price' => 'nullable|numeric|min:0',
                'cost_price' => 'nullable|numeric|min:0',
                'minimum_stock' => 'nullable|integer|min:0',
                'weight' => 'nullable|numeric|min:0',
                'dimensions' => 'nullable|array',
                'barcode' => 'nullable|string',
            ]);

            // 映射表單欄位到實際資料庫欄位
            if (isset($validatedData['price'])) {
                $validatedData['selling_price'] = $validatedData['price'];
                unset($validatedData['price']);
            }
            
            if (isset($validatedData['minimum_stock'])) {
                $validatedData['reorder_point'] = $validatedData['minimum_stock'];
                unset($validatedData['minimum_stock']);
            }

            // 設定預設值
            $validatedData['is_active'] = true;
            $validatedData['created_by_user_id'] = auth()->id();

            $product = Product::create($validatedData);

            Log::info('Product created successfully', [
                'product_id' => $product->id,
                'sku' => $product->sku,
            ]);

            return response()->json([
                'success' => true,
                'message' => '產品創建成功',
                'data' => $product,
            ], 201);

        } catch (\Exception $e) {
            Log::error('Product store error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => '創建產品失敗',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * 顯示指定的產品
     */
    public function show(Product $product): JsonResponse
    {
        try {
            // 驗證用戶是否有權限存取此產品
            $currentCompanyId = session('current_company_id');
            if ($currentCompanyId && $product->company_id !== $currentCompanyId) {
                Log::warning("Unauthorized product access attempt", [
                    'user_id' => auth()->id(),
                    'product_id' => $product->id,
                    'product_company_id' => $product->company_id,
                    'user_company_id' => $currentCompanyId
                ]);
                
                return response()->json([
                    'success' => false,
                    'message' => '無權限存取此產品',
                ], 403);
            }
            
            // 轉換欄位名稱以配合前端表單期待
            $productData = $product->toArray();
            
            // 映射實際資料庫欄位到表單欄位
            if (isset($productData['selling_price'])) {
                $productData['price'] = $productData['selling_price'];
            }
            
            // 從 inventory_levels 資料表讀取庫存數據
            $totalStockQuantity = $product->getTotalStockQuantity();
            $minimumReorderPoint = $product->getMinimumReorderPoint();
            
            // 映射庫存欄位到前端期待的欄位名稱
            $productData['stock_quantity'] = $totalStockQuantity;
            $productData['low_stock_threshold'] = $minimumReorderPoint;
            
            // 處理產品圖片，詳情頁使用完整模式
            $productData['image'] = $this->imageService->getProductImageUrl($product, false);
            $productData['image_url'] = $productData['image']; // 向後相容

            return response()->json([
                'success' => true,
                'message' => '產品詳情獲取成功',
                'data' => $productData,
            ]);

        } catch (\Exception $e) {
            Log::error('Product show error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => '獲取產品詳情失敗',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * 更新指定的產品
     */
    public function update(Request $request, Product $product): JsonResponse
    {
        try {
            $validatedData = $request->validate([
                'name' => 'sometimes|required|string|max:255',
                'sku' => 'sometimes|required|string|max:100|unique:products,sku,' . $product->id,
                'description' => 'nullable|string',
                'category_id' => 'nullable|integer',
                'unit_of_measure_id' => 'nullable|integer',
                'price' => 'nullable|numeric|min:0',
                'cost_price' => 'nullable|numeric|min:0',
                'stock_quantity' => 'nullable|integer|min:0',
                'low_stock_threshold' => 'nullable|integer|min:0',
                'weight' => 'nullable|numeric|min:0',
                'dimensions' => 'nullable|string',
                'barcode' => 'nullable|string',
                'is_active' => 'sometimes|boolean',
                'status' => 'nullable|string',
                'is_featured' => 'nullable|boolean',
                'track_inventory' => 'nullable|boolean',
            ]);

            // 映射表單欄位到實際資料庫欄位
            if (isset($validatedData['price'])) {
                $validatedData['selling_price'] = $validatedData['price'];
                unset($validatedData['price']);
            }
            
            // 庫存相關欄位處理 - 分離庫存數據到 inventory_levels 資料表
            $stockQuantity = null;
            $lowStockThreshold = null;
            
            if (isset($validatedData['stock_quantity'])) {
                $stockQuantity = $validatedData['stock_quantity'];
                unset($validatedData['stock_quantity']); // 從產品更新中移除
            }
            
            if (isset($validatedData['low_stock_threshold'])) {
                $lowStockThreshold = $validatedData['low_stock_threshold'];
                unset($validatedData['low_stock_threshold']); // 從產品更新中移除
            }
            
            // 處理其他表單特定欄位
            if (isset($validatedData['dimensions']) && is_string($validatedData['dimensions'])) {
                // 如果 dimensions 是字符串，轉換為適當格式或保持原樣
                // 根據資料庫 schema，這可能需要特殊處理
            }

            DB::transaction(function () use ($product, $validatedData, $stockQuantity, $lowStockThreshold) {
                // 確保事務中的公司上下文設置
                $currentCompanyId = session('current_company_id');
                if ($currentCompanyId) {
                    DB::statement("SELECT set_config('app.current_company_id', ?, false)", [(string) $currentCompanyId]);
                }
                
                // 更新產品基本資訊
                $product->update($validatedData);
                
                // 處理庫存數據更新 - 支援總庫存設定
                if ($stockQuantity !== null || $lowStockThreshold !== null) {
                    Log::debug('Processing inventory update', [
                        'product_id' => $product->id,
                        'stock_quantity' => $stockQuantity,
                        'low_stock_threshold' => $lowStockThreshold
                    ]);
                    
                    if ($stockQuantity !== null) {
                        // 新邏輯：設定總庫存量，優先使用預設倉庫
                        $this->setTotalInventoryQuantity($product, $stockQuantity);
                    }
                    
                    if ($lowStockThreshold !== null) {
                        // 更新所有倉庫的低庫存閾值
                        $this->updateReorderPointForAllWarehouses($product, $lowStockThreshold);
                    }
                    
                    Log::debug('Inventory update completed successfully');
                }
            });

            Log::info('Product updated successfully', [
                'product_id' => $product->id,
                'sku' => $product->sku,
                'stock_quantity' => $stockQuantity,
                'low_stock_threshold' => $lowStockThreshold,
            ]);

            return response()->json([
                'success' => true,
                'message' => '產品更新成功',
                'data' => $product->fresh(),
            ]);

        } catch (\Exception $e) {
            Log::error('Product update error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => '更新產品失敗',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * 獲取產品活動記錄
     */
    public function activity(Product $product): JsonResponse
    {
        try {
            // 模擬活動記錄數據（實際應該從活動記錄表查詢）
            $activities = [
                [
                    'id' => 1,
                    'description' => '產品已創建',
                    'type' => 'created',
                    'created_at' => $product->created_at,
                    'user' => $product->created_by_user_id ? '系統管理員' : '系統'
                ],
                [
                    'id' => 2,
                    'description' => '產品資訊已更新',
                    'type' => 'updated',
                    'created_at' => $product->updated_at,
                    'user' => '系統管理員'
                ]
            ];
            
            // 如果產品最近有更新且更新時間與創建時間不同，添加更新記錄
            if ($product->updated_at && $product->updated_at != $product->created_at) {
                $activities[] = [
                    'id' => 3,
                    'description' => '最後一次修改產品資訊',
                    'type' => 'modified',
                    'created_at' => $product->updated_at,
                    'user' => '系統管理員'
                ];
            }

            return response()->json([
                'success' => true,
                'message' => '活動記錄獲取成功',
                'data' => array_reverse($activities) // 最新的在前面
            ]);

        } catch (\Exception $e) {
            Log::error('Product activity error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => '獲取活動記錄失敗',
                'error' => $e->getMessage(),
                'data' => []
            ], 500);
        }
    }

    /**
     * 刪除指定的產品
     */
    public function destroy(Product $product): JsonResponse
    {
        try {
            // 檢查是否有相關聯的採購單明細
            if ($product->purchaseOrderItems()->exists()) {
                return response()->json([
                    'success' => false,
                    'message' => '無法刪除：該產品有相關聯的採購單',
                ], 422);
            }

            $product->delete();

            Log::info('Product deleted successfully', [
                'product_id' => $product->id,
                'sku' => $product->sku,
            ]);

            return response()->json([
                'success' => true,
                'message' => '產品刪除成功',
            ]);

        } catch (\Exception $e) {
            Log::error('Product destroy error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => '刪除產品失敗',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * 設定產品的總庫存量
     * 邏輯：清除所有倉庫的庫存，然後將全部庫存設定到預設倉庫
     */
    private function setTotalInventoryQuantity(Product $product, int $totalQuantity): void
    {
        // 獲取預設倉庫
        $defaultWarehouseId = DB::table('warehouses')
            ->where('is_active', 1)
            ->orderBy('id')
            ->value('id');

        if (!$defaultWarehouseId) {
            Log::warning('No active warehouse found for inventory update');
            return;
        }

        Log::debug('Setting total inventory quantity', [
            'product_id' => $product->id,
            'total_quantity' => $totalQuantity,
            'default_warehouse_id' => $defaultWarehouseId
        ]);

        // 清除所有現有庫存記錄
        DB::table('inventory_levels')
            ->where('product_id', $product->id)
            ->delete();

        // 在預設倉庫設定全部庫存
        DB::table('inventory_levels')->insert([
            'product_id' => $product->id,
            'warehouse_id' => $defaultWarehouseId,
            'quantity_on_hand' => $totalQuantity,
            'quantity_available' => $totalQuantity,
            'quantity_reserved' => 0,
            'quantity_on_order' => 0,
            'reorder_point' => 0, // 將由 updateReorderPointForAllWarehouses 更新
            'max_stock_level' => null,
            'last_updated_at' => now(),
            'created_at' => now(),
            'updated_at' => now()
        ]);

        Log::debug('Total inventory quantity set successfully', [
            'product_id' => $product->id,
            'warehouse_id' => $defaultWarehouseId,
            'quantity' => $totalQuantity
        ]);
    }

    /**
     * 更新產品在所有倉庫的低庫存閾值
     */
    private function updateReorderPointForAllWarehouses(Product $product, int $reorderPoint): void
    {
        Log::debug('Updating reorder point for all warehouses', [
            'product_id' => $product->id,
            'reorder_point' => $reorderPoint
        ]);

        $updatedCount = DB::table('inventory_levels')
            ->where('product_id', $product->id)
            ->update([
                'reorder_point' => $reorderPoint,
                'updated_at' => now()
            ]);

        Log::debug('Reorder point updated', [
            'product_id' => $product->id,
            'updated_records' => $updatedCount,
            'reorder_point' => $reorderPoint
        ]);
    }

    /**
     * 產品搜尋 API - 支援自動完成功能
     */
    public function search(Request $request): JsonResponse
    {
        try {
            // 驗證搜尋參數
            $request->validate([
                'q' => 'required|string|min:2|max:100',
                'limit' => 'nullable|integer|min:1|max:50'
            ]);

            $query = $request->get('q');
            $limit = $request->get('limit', 10);

            // 建立查詢
            $products = Product::query()
                ->where(function ($q) use ($query) {
                    $q->where('name', 'ILIKE', "%{$query}%")
                      ->orWhere('sku', 'ILIKE', "%{$query}%")
                      ->orWhere('description', 'ILIKE', "%{$query}%");
                })
                ->where('is_active', true); // 只搜尋啟用的產品

            // 多租戶篩選 - 只搜尋當前公司的產品
            $companyId = session('current_company_id') ?? session('app.current_company_id');
            if ($companyId) {
                $products->where('company_id', $companyId);
            }

            // 排序：優先顯示名稱匹配度高的產品
            $products = $products
                ->orderByRaw("
                    CASE 
                        WHEN name ILIKE ? THEN 1
                        WHEN name ILIKE ? THEN 2  
                        WHEN sku ILIKE ? THEN 3
                        ELSE 4
                    END
                ", ["{$query}%", "%{$query}%", "{$query}%"])
                ->orderBy('name')
                ->limit($limit)
                ->get();

            // 轉換資料格式以符合前端期待
            $searchResults = $products->map(function ($product) {
                // 計算庫存數量
                $stockQuantity = 0;
                try {
                    $stockQuantity = $product->getTotalStockQuantity();
                } catch (\Exception $e) {
                    Log::warning('Failed to get stock quantity for product search', [
                        'product_id' => $product->id,
                        'error' => $e->getMessage()
                    ]);
                }

                return [
                    'id' => $product->id,
                    'name' => $product->name,
                    'sku' => $product->sku,
                    'description' => $product->description,
                    'unit_price' => (float) ($product->selling_price ?? $product->cost_price ?? 0),
                    'stock_quantity' => $stockQuantity,
                    'category_id' => $product->category_id,
                    'is_active' => $product->is_active,
                    'unit_of_measure' => $product->unit_of_measure,
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $searchResults,
                'total' => $searchResults->count(),
                'query' => $query
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => '搜尋參數錯誤',
                'errors' => $e->errors()
            ], 422);
            
        } catch (\Exception $e) {
            Log::error('Product search error: ' . $e->getMessage(), [
                'query' => $request->get('q'),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => '產品搜尋失敗',
                'error' => $e->getMessage(),
                'data' => []
            ], 500);
        }
    }
}