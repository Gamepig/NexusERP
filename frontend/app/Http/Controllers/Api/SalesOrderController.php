<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;

/**
 * 銷售訂單 API 控制器
 * 
 * 主要功能：銷售訂單的創建、查詢、更新、刪除等 CRUD 操作
 * 特殊功能：出貨處理、庫存整合
 */
class SalesOrderController extends Controller
{
    /**
     * 顯示銷售訂單列表
     */
    public function index(Request $request): JsonResponse
    {
        try {
            // 構建查詢，包含關聯數據
            $query = DB::table('sales_orders as so')
                ->leftJoin('customers as c', 'so.customer_id', '=', 'c.id')
                ->leftJoin('users as u', 'so.user_id', '=', 'u.id')
                ->select([
                    'so.id',
                    'so.order_number',
                    'so.status',
                    'so.order_date',
                    'so.total_amount',
                    'so.created_at',
                    'so.updated_at',
                    'c.name as customer_name',
                    'c.primary_email as customer_email',
                    'u.name as created_by'
                ]);

            // 狀態篩選
            if ($request->filled('status')) {
                $query->where('so.status', $request->status);
            }

            // 客戶篩選
            if ($request->filled('customer_id')) {
                $query->where('so.customer_id', $request->customer_id);
            }

            // 日期範圍篩選
            if ($request->filled('start_date')) {
                $query->where('so.order_date', '>=', $request->start_date);
            }
            if ($request->filled('end_date')) {
                $query->where('so.order_date', '<=', $request->end_date);
            }

            // 關鍵字搜尋（訂單號或客戶名稱）
            if ($request->filled('search')) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('so.order_number', 'ILIKE', "%{$search}%")
                      ->orWhere('c.name', 'ILIKE', "%{$search}%");
                });
            }

            // 排序
            $sortBy = $request->get('sort_by', 'so.created_at');
            $sortOrder = $request->get('sort_order', 'desc');
            $query->orderBy($sortBy, $sortOrder);

            // 分頁
            $perPage = $request->get('per_page', 15);
            $total = $query->count();
            $salesOrders = $query->limit($perPage)
                ->offset(($request->get('page', 1) - 1) * $perPage)
                ->get();

            return response()->json([
                'success' => true,
                'message' => '銷售訂單列表獲取成功',
                'data' => $salesOrders,
                'meta' => [
                    'total' => $total,
                    'per_page' => $perPage,
                    'current_page' => $request->get('page', 1),
                    'last_page' => ceil($total / $perPage)
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('SalesOrder index error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => '獲取銷售訂單列表失敗',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * 創建新的銷售訂單
     */
    public function store(Request $request): JsonResponse
    {
        // 驗證請求資料
        $validated = $request->validate([
            'customer_id' => 'required|exists:customers,id',
            'order_date' => 'required|date',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|numeric|min:0.01',
            'items.*.unit_price' => 'required|numeric|min:0',
            'notes' => 'nullable|string|max:1000',
        ]);

        DB::beginTransaction();
        
        try {
            // 驗證客戶是否存在
            $customer = DB::table('customers')->where('id', $validated['customer_id'])->first();
            if (!$customer) {
                return response()->json([
                    'success' => false,
                    'message' => '客戶不存在',
                ], 422);
            }

            // 計算訂單總額
            $subtotal = 0;
            foreach ($validated['items'] as $item) {
                $subtotal += $item['quantity'] * $item['unit_price'];
            }
            $taxAmount = $subtotal * 0.05; // 5% 稅率
            $totalAmount = $subtotal + $taxAmount;

            // 創建銷售訂單
            $salesOrderId = DB::table('sales_orders')->insertGetId([
                'customer_id' => $validated['customer_id'],
                'company_id' => session('company_id', auth()->user()->company_id ?? 77),
                'status' => 'draft',
                'user_id' => auth()->id() ?? 1059, // 臨時使用測試用戶 ID
                'order_date' => $validated['order_date'],
                'total_amount' => $totalAmount,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // 創建訂單項目
            foreach ($validated['items'] as $item) {
                $lineTotal = $item['quantity'] * $item['unit_price'];
                
                DB::table('sales_order_items')->insert([
                    'sales_order_id' => $salesOrderId,
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'total_price' => $lineTotal,
                    'status' => 'draft',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            // 獲取完整的訂單資料（包含關聯）
            $salesOrder = DB::table('sales_orders as so')
                ->leftJoin('customers as c', 'so.customer_id', '=', 'c.id')
                ->select([
                    'so.*',
                    'c.name as customer_name',
                    'c.primary_email as customer_email'
                ])
                ->where('so.id', $salesOrderId)
                ->first();

            // 獲取訂單項目
            $items = DB::table('sales_order_items as soi')
                ->leftJoin('products as p', 'soi.product_id', '=', 'p.id')
                ->select([
                    'soi.*',
                    'p.name as product_name',
                    'p.sku as product_sku'
                ])
                ->where('soi.sales_order_id', $salesOrderId)
                ->get();

            $salesOrder->items = $items;

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => '銷售訂單創建成功',
                'data' => $salesOrder,
            ], 201);

        } catch (\Exception $e) {
            DB::rollback();
            Log::error('SalesOrder store error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => '創建銷售訂單失敗',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * 顯示指定的銷售訂單
     */
    public function show($id): JsonResponse
    {
        try {
            // 獲取銷售訂單主數據
            $salesOrder = DB::table('sales_orders as so')
                ->leftJoin('customers as c', 'so.customer_id', '=', 'c.id')
                ->leftJoin('users as u', 'so.user_id', '=', 'u.id')
                ->select([
                    'so.*',
                    'c.name as customer_name',
                    'c.primary_email as customer_email',
                    'c.primary_phone as customer_phone',
                    'c.address_line1 as customer_address',
                    'u.name as created_by'
                ])
                ->where('so.id', $id)
                ->first();

            if (!$salesOrder) {
                return response()->json([
                    'success' => false,
                    'message' => '銷售訂單不存在',
                ], 404);
            }

            // 獲取訂單項目
            $items = DB::table('sales_order_items as soi')
                ->leftJoin('products as p', 'soi.product_id', '=', 'p.id')
                ->select([
                    'soi.*',
                    'p.name as product_name',
                    'p.sku as product_sku',
                    'p.category_id as product_category_id'
                ])
                ->where('soi.sales_order_id', $id)
                ->get();

            $salesOrder->items = $items;

            return response()->json([
                'success' => true,
                'message' => '銷售訂單詳情獲取成功',
                'data' => $salesOrder,
            ]);

        } catch (\Exception $e) {
            Log::error('SalesOrder show error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => '獲取銷售訂單詳情失敗',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * 更新指定的銷售訂單
     */
    public function update(Request $request, $id): JsonResponse
    {
        // 驗證請求資料（支援完整更新）
        $validated = $request->validate([
            'customer_id' => 'sometimes|exists:customers,id',
            'order_date' => 'sometimes|date',
            'status' => ['sometimes', Rule::in(['draft', 'processing', 'shipped', 'completed', 'cancelled'])],
            'items' => 'sometimes|array|min:1',
            'items.*.product_id' => 'required_with:items|exists:products,id',
            'items.*.quantity' => 'required_with:items|numeric|min:0.01',
            'items.*.unit_price' => 'required_with:items|numeric|min:0',
            'notes' => 'nullable|string|max:1000',
        ]);

        DB::beginTransaction();
        
        try {
            // 檢查訂單是否存在
            $salesOrder = DB::table('sales_orders')->where('id', $id)->first();
            if (!$salesOrder) {
                return response()->json([
                    'success' => false,
                    'message' => '銷售訂單不存在',
                ], 404);
            }

            // 業務邏輯檢查：已出貨的訂單不能修改
            if (in_array($salesOrder->status, ['shipped', 'completed', 'cancelled'])) {
                // 只允許修改備註，其他都不允許
                $allowedFields = ['notes'];
                $forbiddenFields = array_diff(array_keys($validated), $allowedFields);
                
                if (!empty($forbiddenFields)) {
                    $statusText = [
                        'shipped' => '已出貨',
                        'completed' => '已完成', 
                        'cancelled' => '已取消'
                    ][$salesOrder->status] ?? $salesOrder->status;
                    
                    return response()->json([
                        'success' => false,
                        'message' => "訂單狀態為「{$statusText}」，不允許修改。只能修改備註欄位。",
                        'forbidden_fields' => $forbiddenFields,
                    ], 422);
                }
            }

            // 準備主訂單更新資料
            $orderUpdateData = [];
            
            if (isset($validated['customer_id'])) {
                $orderUpdateData['customer_id'] = $validated['customer_id'];
            }
            if (isset($validated['order_date'])) {
                $orderUpdateData['order_date'] = $validated['order_date'];
            }
            if (isset($validated['status'])) {
                $orderUpdateData['status'] = $validated['status'];
            }
            if (isset($validated['notes'])) {
                $orderUpdateData['notes'] = $validated['notes'];
            }

            // 如果有項目更新，重新計算總額
            if (isset($validated['items'])) {
                $subtotal = 0;
                foreach ($validated['items'] as $item) {
                    $subtotal += $item['quantity'] * $item['unit_price'];
                }
                $taxAmount = $subtotal * 0.05; // 5% 稅率
                $totalAmount = $subtotal + $taxAmount;
                $orderUpdateData['total_amount'] = $totalAmount;
            }

            $orderUpdateData['updated_at'] = now();

            // 更新銷售訂單主數據
            if (!empty($orderUpdateData)) {
                DB::table('sales_orders')
                    ->where('id', $id)
                    ->update($orderUpdateData);
            }

            // 如果有項目更新，先刪除舊項目再創建新項目
            if (isset($validated['items'])) {
                // 刪除現有項目
                DB::table('sales_order_items')->where('sales_order_id', $id)->delete();

                // 創建新的訂單項目
                foreach ($validated['items'] as $item) {
                    $lineTotal = $item['quantity'] * $item['unit_price'];
                    
                    DB::table('sales_order_items')->insert([
                        'sales_order_id' => $id,
                        'product_id' => $item['product_id'],
                        'quantity' => $item['quantity'],
                        'unit_price' => $item['unit_price'],
                        'total_price' => $lineTotal,
                        'status' => 'draft',
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }

            // 獲取更新後的完整訂單資料（包含關聯）
            $updatedOrder = DB::table('sales_orders as so')
                ->leftJoin('customers as c', 'so.customer_id', '=', 'c.id')
                ->select([
                    'so.*',
                    'c.name as customer_name',
                    'c.primary_email as customer_email'
                ])
                ->where('so.id', $id)
                ->first();

            // 獲取更新後的訂單項目
            $items = DB::table('sales_order_items as soi')
                ->leftJoin('products as p', 'soi.product_id', '=', 'p.id')
                ->select([
                    'soi.*',
                    'p.name as product_name',
                    'p.sku as product_sku'
                ])
                ->where('soi.sales_order_id', $id)
                ->get();

            $updatedOrder->items = $items;

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => '銷售訂單更新成功',
                'data' => $updatedOrder,
            ]);

        } catch (\Exception $e) {
            DB::rollback();
            Log::error('SalesOrder update error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => '更新銷售訂單失敗',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * 刪除指定的銷售訂單
     */
    public function destroy($id): JsonResponse
    {
        DB::beginTransaction();
        
        try {
            // 檢查訂單是否存在
            $salesOrder = DB::table('sales_orders')->where('id', $id)->first();
            if (!$salesOrder) {
                return response()->json([
                    'success' => false,
                    'message' => '銷售訂單不存在',
                ], 404);
            }

            // 檢查是否可以刪除（只有草稿狀態可以刪除）
            if ($salesOrder->status !== 'draft') {
                return response()->json([
                    'success' => false,
                    'message' => '只有草稿狀態的訂單可以刪除',
                ], 422);
            }

            // 刪除訂單項目（由於設定了 CASCADE，會自動刪除）
            DB::table('sales_order_items')->where('sales_order_id', $id)->delete();
            
            // 刪除訂單
            DB::table('sales_orders')->where('id', $id)->delete();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => '銷售訂單刪除成功',
            ]);

        } catch (\Exception $e) {
            DB::rollback();
            Log::error('SalesOrder destroy error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => '刪除銷售訂單失敗',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * 處理銷售訂單出貨
     */
    public function ship(Request $request, $id): JsonResponse
    {
        $validated = $request->validate([
            'shipping_items' => 'required|array|min:1',
            'shipping_items.*.item_id' => 'required|exists:sales_order_items,id',
            'shipping_items.*.quantity_shipped' => 'required|numeric|min:0.01',
            'notes' => 'nullable|string|max:1000',
        ]);

        DB::beginTransaction();
        
        try {
            // 檢查訂單是否存在且可出貨
            $salesOrder = DB::table('sales_orders')->where('id', $id)->first();
            if (!$salesOrder) {
                return response()->json([
                    'success' => false,
                    'message' => '銷售訂單不存在',
                ], 404);
            }

            if (!in_array($salesOrder->status, ['processing', 'confirmed'])) {
                return response()->json([
                    'success' => false,
                    'message' => '訂單狀態不允許出貨',
                ], 422);
            }

            // 處理每個出貨項目
            foreach ($validated['shipping_items'] as $shippingItem) {
                $item = DB::table('sales_order_items')->where('id', $shippingItem['item_id'])->first();
                if (!$item) {
                    continue;
                }

                // 檢查所有倉庫的總庫存是否足夠
                $totalAvailableStock = DB::table('inventory_levels')
                    ->where('product_id', $item->product_id)
                    ->sum('quantity_available');

                if ($totalAvailableStock < $shippingItem['quantity_shipped']) {
                    $product = DB::table('products')->where('id', $item->product_id)->first();
                    return response()->json([
                        'success' => false,
                        'message' => "商品 {$product->name} 庫存不足，無法出貨（可用庫存：{$totalAvailableStock}，需要：{$shippingItem['quantity_shipped']}）",
                    ], 422);
                }

                // 獲取該產品有庫存的倉庫（按庫存數量降序排列）
                $availableWarehouses = DB::table('inventory_levels')
                    ->where('product_id', $item->product_id)
                    ->where('quantity_available', '>', 0)
                    ->orderBy('quantity_available', 'desc')
                    ->get();

                // 從多個倉庫中扣除庫存（按庫存數量從多到少的順序）
                $remainingToShip = $shippingItem['quantity_shipped'];
                
                foreach ($availableWarehouses as $warehouse) {
                    if ($remainingToShip <= 0) {
                        break;
                    }
                    
                    $quantityToDeduct = min($remainingToShip, $warehouse->quantity_available);
                    $quantityBefore = $warehouse->quantity_available;
                    $quantityAfter = $quantityBefore - $quantityToDeduct;
                    
                    // 更新該倉庫的庫存數量
                    DB::table('inventory_levels')
                        ->where('product_id', $item->product_id)
                        ->where('warehouse_id', $warehouse->warehouse_id)
                        ->update([
                            'quantity_available' => $quantityAfter,
                            'quantity_on_hand' => DB::raw('quantity_on_hand - ' . $quantityToDeduct),
                            'updated_at' => now(),
                        ]);

                    // 記錄該倉庫的庫存交易
                    DB::table('inventory_transactions')->insert([
                        'transaction_type_id' => 7, // SALE 交易類型
                        'product_id' => $item->product_id,
                        'warehouse_id' => $warehouse->warehouse_id,
                        'quantity_changed' => -$quantityToDeduct,
                        'quantity_before' => $quantityBefore,
                        'quantity_after' => $quantityAfter,
                        'reference_document_type' => 'sales_order',
                        'reference_document_id' => $id,
                        'user_id' => auth()->id() ?? 1059,
                        'notes' => '銷售訂單出貨：' . $salesOrder->order_number . " (從倉庫 {$warehouse->warehouse_id} 扣除 {$quantityToDeduct})",
                        'transaction_date' => now(),
                        'created_at' => now(),
                    ]);
                    
                    $remainingToShip -= $quantityToDeduct;
                }
            }

            // 更新訂單狀態為已出貨
            DB::table('sales_orders')
                ->where('id', $id)
                ->update([
                    'status' => 'shipped',
                    'updated_at' => now(),
                ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => '銷售訂單出貨處理成功',
                'data' => [
                    'order_id' => $id,
                    'status' => 'shipped',
                    'shipped_at' => now()->toISOString(),
                ]
            ]);

        } catch (\Exception $e) {
            DB::rollback();
            Log::error('SalesOrder ship error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => '銷售訂單出貨處理失敗',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}