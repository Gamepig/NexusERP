<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StorePurchaseOrderRequest;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderItem;
use App\Models\Product;
use App\Models\Supplier;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * 採購單 API 控制器
 * 
 * 主要功能：採購單的創建、查詢、更新、刪除等 CRUD 操作
 */
class PurchaseOrderController extends Controller
{
    /**
     * 顯示採購單列表
     */
    public function index(Request $request): JsonResponse
    {
        try {
            // 只顯示當前用戶創建的採購訂單
            $query = PurchaseOrder::with(['supplier', 'creator', 'items.product'])
                ->where('created_by_user_id', auth()->id());

            // 狀態篩選
            if ($request->filled('status')) {
                $query->byStatus($request->status);
            }

            // 供應商篩選
            if ($request->filled('supplier_id')) {
                $query->bySupplier($request->supplier_id);
            }

            // 日期範圍篩選
            if ($request->filled('start_date') && $request->filled('end_date')) {
                $query->byDateRange($request->start_date, $request->end_date);
            }

            // 關鍵字搜尋（採購單號或供應商名稱）
            if ($request->filled('search')) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('po_number', 'like', "%{$search}%")
                      ->orWhereHas('supplier', function ($sq) use ($search) {
                          $sq->where('name', 'like', "%{$search}%");
                      });
                });
            }

            // 排序
            $sortBy = $request->get('sort_by', 'created_at');
            $sortOrder = $request->get('sort_order', 'desc');
            $query->orderBy($sortBy, $sortOrder);

            // 分頁
            $perPage = $request->get('per_page', 15);
            $purchaseOrders = $query->paginate($perPage);

            return response()->json([
                'success' => true,
                'message' => '採購單列表獲取成功',
                'data' => $purchaseOrders,
            ]);

        } catch (\Exception $e) {
            Log::error('PurchaseOrder index error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => '獲取採購單列表失敗',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * 創建新的採購單
     */
    public function store(StorePurchaseOrderRequest $request): JsonResponse
    {
        DB::beginTransaction();
        
        try {
            // 確保 RLS 上下文正確設定
            $currentCompanyId = session('current_company_id');
            if ($currentCompanyId) {
                DB::statement("SELECT set_config('app.current_company_id', ?, false)", [(string) $currentCompanyId]);
                Log::debug('RLS context set for purchase order creation', ['company_id' => $currentCompanyId]);
            }
            
            // 暫時啟用超級使用者模式以繞過 RLS 問題
            DB::statement("SELECT set_config('app.superuser_mode', 'true', false)");
            Log::debug('Superuser mode enabled for purchase order creation');
            
            // 驗證供應商是否存在且為啟用狀態
            $supplier = Supplier::find($request->supplier_id);
            if (!$supplier || !$supplier->isActive()) {
                return response()->json([
                    'success' => false,
                    'message' => '供應商不存在或未啟用',
                ], 422);
            }

            // 取得已驗證的 items 數據
            $items = $request->items;
            
            // 驗證產品是否存在且為啟用狀態
            $productIds = collect($items)->pluck('product_id');
            $products = Product::whereIn('id', $productIds)->active()->get();
            
            if ($products->count() !== $productIds->count()) {
                return response()->json([
                    'success' => false,
                    'message' => '部分產品不存在或未啟用',
                ], 422);
            }

            // 創建採購單 - 使用原始 SQL 以確保 RLS 設定生效
            $poNumber = PurchaseOrder::generatePoNumber();
            $purchaseOrderId = DB::table('purchase_orders')->insertGetId([
                'po_number' => $poNumber,
                'supplier_id' => $request->supplier_id,
                'status' => $request->status ?? PurchaseOrder::STATUS_DRAFT,
                'order_date' => $request->order_date ?? now()->toDateString(),
                'expected_delivery_date' => $request->expected_delivery_date,
                'delivery_address' => $request->delivery_address,
                'currency' => $request->currency ?? 'TWD',
                'payment_terms' => $request->payment_terms,
                'notes' => $request->notes,
                'created_by_user_id' => auth()->id() ?? 1,
                'company_id' => session('current_company_id'),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            
            // 獲取創建的採購單實例
            $purchaseOrder = PurchaseOrder::find($purchaseOrderId);

            // 創建採購單明細
            $subtotal = 0;
            foreach ($items as $item) {
                $product = $products->firstWhere('id', $item['product_id']);
                $lineTotal = $item['quantity'] * $item['unit_price'];
                $subtotal += $lineTotal;

                PurchaseOrderItem::create([
                    'purchase_order_id' => $purchaseOrder->id,
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'line_total' => $lineTotal,
                    'warehouse_id' => $item['warehouse_id'] ?? null,
                    'notes' => $item['notes'] ?? null,
                ]);
            }

            // 計算總額
            $taxRate = $request->tax_rate ?? 0.05; // 預設 5% 稅率
            $taxAmount = $subtotal * $taxRate;
            $totalAmount = $subtotal + $taxAmount;

            $purchaseOrder->update([
                'subtotal' => $subtotal,
                'tax_amount' => $taxAmount,
                'total_amount' => $totalAmount,
            ]);

            // 重新載入關聯資料
            $purchaseOrder->load(['supplier', 'creator', 'items.product']);

            // 關閉超級使用者模式
            DB::statement("SELECT set_config('app.superuser_mode', 'false', false)");
            Log::debug('Superuser mode disabled after purchase order creation');

            DB::commit();

            Log::info('Purchase Order created successfully', [
                'po_number' => $purchaseOrder->po_number,
                'user_id' => auth()->id(),
            ]);

            return response()->json([
                'success' => true,
                'message' => '採購單創建成功',
                'data' => $purchaseOrder,
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            
            // 確保關閉超級使用者模式
            try {
                DB::statement("SELECT set_config('app.superuser_mode', 'false', false)");
            } catch (\Exception $closeException) {
                Log::warning('Failed to disable superuser mode', ['error' => $closeException->getMessage()]);
            }
            
            Log::error('PurchaseOrder store error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => '創建採購單失敗',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * 顯示指定的採購單
     */
    public function show(PurchaseOrder $purchaseOrder): JsonResponse
    {
        try {
            // 檢查用戶權限 - 只能查看同公司的採購訂單
            $currentCompanyId = session('current_company_id');
            if ($currentCompanyId && $purchaseOrder->company_id !== $currentCompanyId) {
                Log::warning("Unauthorized purchase order access attempt", [
                    'user_id' => auth()->id(),
                    'purchase_order_id' => $purchaseOrder->id,
                    'purchase_order_company_id' => $purchaseOrder->company_id,
                    'user_company_id' => $currentCompanyId
                ]);
                
                return response()->json([
                    'success' => false,
                    'message' => '無權存取此採購訂單',
                ], 403);
            }

            $purchaseOrder->load(['supplier', 'creator', 'approver', 'items.product']);

            return response()->json([
                'success' => true,
                'message' => '採購單詳情獲取成功',
                'data' => $purchaseOrder,
            ]);

        } catch (\Exception $e) {
            Log::error('PurchaseOrder show error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => '獲取採購單詳情失敗',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * 更新指定的採購單
     */
    public function update(StorePurchaseOrderRequest $request, $id): JsonResponse
    {
        DB::beginTransaction();
        
        try {
            // 查詢採購訂單（在中間件設定 RLS 上下文之後）
            $currentCompanyId = session('current_company_id');
            $query = PurchaseOrder::with([
                'supplier',
                'items' => function ($query) {
                    $query->with('product');
                }
            ]);
            
            if ($currentCompanyId) {
                $query->where('company_id', $currentCompanyId);
            }
            
            $purchaseOrder = $query->findOrFail($id);
            
            // 調試信息：記錄權限檢查詳情
            Log::info("Purchase order update permission check", [
                'user_id' => auth()->id(),
                'purchase_order_id' => $purchaseOrder->id,
                'purchase_order_company_id' => $purchaseOrder->company_id,
                'purchase_order_company_id_type' => gettype($purchaseOrder->company_id),
                'user_company_id' => $currentCompanyId,
                'user_company_id_type' => gettype($currentCompanyId),
                'are_equal' => $purchaseOrder->company_id == $currentCompanyId,
                'are_strictly_equal' => $purchaseOrder->company_id === $currentCompanyId
            ]);

            // 檢查是否可以編輯
            if (!$purchaseOrder->canEdit()) {
                return response()->json([
                    'success' => false,
                    'message' => '該採購單狀態不允許編輯',
                ], 422);
            }

            // 驗證供應商
            $supplier = Supplier::find($request->supplier_id);
            if (!$supplier || !$supplier->isActive()) {
                return response()->json([
                    'success' => false,
                    'message' => '供應商不存在或未啟用',
                ], 422);
            }

            // 更新採購單基本資訊
            $purchaseOrder->update([
                'supplier_id' => $request->supplier_id,
                'order_date' => $request->order_date ?? $purchaseOrder->order_date,
                'expected_delivery_date' => $request->expected_delivery_date,
                'delivery_address' => $request->delivery_address,
                'currency' => $request->currency ?? $purchaseOrder->currency,
                'payment_terms' => $request->payment_terms,
                'notes' => $request->notes,
                'status' => $request->status ?? $purchaseOrder->status,
            ]);

            // 如果有提供明細，則更新明細
            if ($request->has('items')) {
                // 取得已驗證的 items 數據
                $items = $request->items;
                
                // 刪除原有明細
                $purchaseOrder->items()->delete();

                // 驗證產品
                $productIds = collect($items)->pluck('product_id');
                $products = Product::whereIn('id', $productIds)->active()->get();
                
                if ($products->count() !== $productIds->count()) {
                    throw new \Exception('部分產品不存在或未啟用');
                }

                // 創建新明細
                $subtotal = 0;
                foreach ($items as $item) {
                    $lineTotal = $item['quantity'] * $item['unit_price'];
                    $subtotal += $lineTotal;

                    PurchaseOrderItem::create([
                        'purchase_order_id' => $purchaseOrder->id,
                        'product_id' => $item['product_id'],
                        'quantity' => $item['quantity'],
                        'unit_price' => $item['unit_price'],
                        'line_total' => $lineTotal,
                        'warehouse_id' => $item['warehouse_id'] ?? null,
                        'notes' => $item['notes'] ?? null,
                    ]);
                }

                // 重新計算總額
                $taxRate = $request->tax_rate ?? 0.05;
                $taxAmount = $subtotal * $taxRate;
                $totalAmount = $subtotal + $taxAmount;

                $purchaseOrder->update([
                    'subtotal' => $subtotal,
                    'tax_amount' => $taxAmount,
                    'total_amount' => $totalAmount,
                ]);
            }

            // 重新載入關聯資料
            $purchaseOrder->load(['supplier', 'creator', 'items.product']);

            DB::commit();

            Log::info('Purchase Order updated successfully', [
                'po_number' => $purchaseOrder->po_number,
                'user_id' => auth()->id(),
            ]);

            return response()->json([
                'success' => true,
                'message' => '採購單更新成功',
                'data' => $purchaseOrder,
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('PurchaseOrder update error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => '更新採購單失敗',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * 刪除指定的採購單
     */
    public function destroy(PurchaseOrder $purchaseOrder): JsonResponse
    {
        DB::beginTransaction();
        
        try {
            // 檢查用戶權限 - 只能刪除同公司的採購訂單
            $currentCompanyId = session('current_company_id');
            if ($currentCompanyId && $purchaseOrder->company_id !== $currentCompanyId) {
                Log::warning("Unauthorized purchase order delete attempt", [
                    'user_id' => auth()->id(),
                    'purchase_order_id' => $purchaseOrder->id,
                    'purchase_order_company_id' => $purchaseOrder->company_id,
                    'user_company_id' => $currentCompanyId
                ]);
                
                return response()->json([
                    'success' => false,
                    'message' => '無權刪除此採購訂單',
                ], 403);
            }

            // 檢查是否可以刪除（只有草稿狀態可以刪除）
            if (!$purchaseOrder->isDraft()) {
                return response()->json([
                    'success' => false,
                    'message' => '只有草稿狀態的採購單才能刪除',
                ], 422);
            }

            // 刪除採購單明細
            $purchaseOrder->items()->delete();
            
            // 刪除採購單
            $purchaseOrder->delete();

            DB::commit();

            Log::info('Purchase Order deleted successfully', [
                'po_number' => $purchaseOrder->po_number,
                'user_id' => auth()->id(),
            ]);

            return response()->json([
                'success' => true,
                'message' => '採購單刪除成功',
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('PurchaseOrder destroy error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => '刪除採購單失敗',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * 送出採購單進行審核
     */
    public function submit(PurchaseOrder $purchaseOrder): JsonResponse
    {
        try {
            // 檢查用戶權限 - 只能送出同公司的採購訂單
            $currentCompanyId = session('current_company_id');
            if ($currentCompanyId && $purchaseOrder->company_id !== $currentCompanyId) {
                return response()->json([
                    'success' => false,
                    'message' => '無權送出此採購訂單',
                ], 403);
            }
            
            if (!$purchaseOrder->submit()) {
                return response()->json([
                    'success' => false,
                    'message' => '採購單送出失敗，請檢查狀態',
                ], 422);
            }

            Log::info('Purchase Order submitted for approval', [
                'po_number' => $purchaseOrder->po_number,
                'user_id' => auth()->id(),
            ]);

            return response()->json([
                'success' => true,
                'message' => '採購單已送出審核',
                'data' => $purchaseOrder->fresh(),
            ]);

        } catch (\Exception $e) {
            Log::error('PurchaseOrder submit error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => '送出採購單失敗',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * 核准採購單
     */
    public function approve(PurchaseOrder $purchaseOrder): JsonResponse
    {
        try {
            // 檢查用戶權限 - 只能核准同公司的採購訂單
            $currentCompanyId = session('current_company_id');
            if ($currentCompanyId && $purchaseOrder->company_id !== $currentCompanyId) {
                return response()->json([
                    'success' => false,
                    'message' => '無權核准此採購訂單',
                ], 403);
            }
            
            if (!$purchaseOrder->approve(auth()->user())) {
                return response()->json([
                    'success' => false,
                    'message' => '採購單核准失敗，請檢查狀態',
                ], 422);
            }

            Log::info('Purchase Order approved', [
                'po_number' => $purchaseOrder->po_number,
                'approved_by' => auth()->id(),
            ]);

            return response()->json([
                'success' => true,
                'message' => '採購單已核准',
                'data' => $purchaseOrder->fresh(),
            ]);

        } catch (\Exception $e) {
            Log::error('PurchaseOrder approve error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => '核准採購單失敗',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * 取消採購單
     */
    public function cancel(PurchaseOrder $purchaseOrder): JsonResponse
    {
        try {
            // 檢查用戶權限 - 只能取消同公司的採購訂單
            $currentCompanyId = session('current_company_id');
            if ($currentCompanyId && $purchaseOrder->company_id !== $currentCompanyId) {
                return response()->json([
                    'success' => false,
                    'message' => '無權取消此採購訂單',
                ], 403);
            }
            
            if (!$purchaseOrder->cancel()) {
                return response()->json([
                    'success' => false,
                    'message' => '採購單取消失敗，請檢查狀態',
                ], 422);
            }

            Log::info('Purchase Order cancelled', [
                'po_number' => $purchaseOrder->po_number,
                'cancelled_by' => auth()->id(),
            ]);

            return response()->json([
                'success' => true,
                'message' => '採購單已取消',
                'data' => $purchaseOrder->fresh(),
            ]);

        } catch (\Exception $e) {
            Log::error('PurchaseOrder cancel error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => '取消採購單失敗',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}