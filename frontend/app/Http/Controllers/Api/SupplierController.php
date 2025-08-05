<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Supplier;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * 供應商 API 控制器
 * 
 * 主要功能：供應商的查詢、創建、更新、刪除等 CRUD 操作
 */
class SupplierController extends Controller
{
    /**
     * 顯示供應商列表
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = Supplier::query();
            
            // 只顯示屬於當前公司的供應商 - 多租戶篩選
            $companyId = session('current_company_id');
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

            // 關鍵字搜尋（名稱、代碼或聯絡人）
            if ($request->filled('search')) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'ILIKE', "%{$search}%")
                      ->orWhere('code', 'ILIKE', "%{$search}%")
                      ->orWhere('contact_person', 'ILIKE', "%{$search}%");
                });
            }

            // 排序
            $sortBy = $request->get('sort_by', 'created_at');
            $sortOrder = $request->get('sort_order', 'desc');
            $query->orderBy($sortBy, $sortOrder);

            // 分頁
            $perPage = $request->get('per_page', 25);
            
            if ($request->has('paginate') && $request->paginate === 'false') {
                // 不分頁，返回所有資料
                $suppliers = $query->get();
                return response()->json([
                    'success' => true,
                    'data' => $suppliers,
                    'pagination' => [
                        'total' => $suppliers->count(),
                        'per_page' => $suppliers->count(),
                        'current_page' => 1,
                        'last_page' => 1
                    ]
                ]);
            } else {
                // 分頁資料
                $suppliers = $query->paginate($perPage);
                return response()->json([
                    'success' => true,
                    'data' => $suppliers->items(),
                    'pagination' => [
                        'total' => $suppliers->total(),
                        'per_page' => $suppliers->perPage(),
                        'current_page' => $suppliers->currentPage(),
                        'last_page' => $suppliers->lastPage()
                    ]
                ]);
            }

        } catch (\Exception $e) {
            Log::error('Supplier index error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => '獲取供應商列表失敗',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * 創建新的供應商
     */
    public function store(Request $request): JsonResponse
    {
        try {
            // 設定 RLS 上下文 
            $currentCompanyId = session('current_company_id');
            if ($currentCompanyId) {
                DB::statement("SELECT set_config('app.current_company_id', ?, false)", [(string) $currentCompanyId]);
                Log::debug('RLS context set for supplier creation', ['company_id' => $currentCompanyId]);
            }
            
            $validatedData = $request->validate([
                'name' => 'required|string|max:255',
                'code' => 'nullable|string|max:50|unique:suppliers,code',
                'contact_person' => 'nullable|string|max:255',
                'email' => 'nullable|email|max:255',
                'phone' => 'nullable|string|max:50',
                'address' => 'nullable|array',
                'tax_id' => 'nullable|string|max:50',
                'payment_terms' => 'nullable|string|max:255',
                'credit_limit' => 'nullable|numeric|min:0',
                'notes' => 'nullable|string',
            ]);

            // 如果沒有提供代碼，自動產生
            if (empty($validatedData['code'])) {
                $validatedData['code'] = Supplier::generateCode();
            }

            // 預設為啟用狀態
            $validatedData['is_active'] = true;
            
            // 設定當前公司 ID
            $validatedData['company_id'] = session('current_company_id');

            $supplier = Supplier::create($validatedData);

            Log::info('Supplier created successfully', [
                'supplier_id' => $supplier->id,
                'code' => $supplier->code,
            ]);

            return response()->json([
                'success' => true,
                'message' => '供應商創建成功',
                'data' => $supplier,
            ], 201);

        } catch (\Exception $e) {
            Log::error('Supplier store error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => '創建供應商失敗',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * 顯示指定的供應商
     */
    public function show(Supplier $supplier): JsonResponse
    {
        try {
            // 驗證用戶是否有權限存取此供應商
            $currentCompanyId = session('current_company_id');
            if ($currentCompanyId && $supplier->company_id !== $currentCompanyId) {
                Log::warning("Unauthorized supplier access attempt", [
                    'user_id' => auth()->id(),
                    'supplier_id' => $supplier->id,
                    'supplier_company_id' => $supplier->company_id,
                    'user_company_id' => $currentCompanyId
                ]);
                
                return response()->json([
                    'success' => false,
                    'message' => '無權限存取此供應商',
                ], 403);
            }
            
            $supplier->load(['purchaseOrders']);

            return response()->json([
                'success' => true,
                'message' => '供應商詳情獲取成功',
                'data' => $supplier,
            ]);

        } catch (\Exception $e) {
            Log::error('Supplier show error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => '獲取供應商詳情失敗',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * 更新指定的供應商
     */
    public function update(Request $request, Supplier $supplier): JsonResponse
    {
        try {
            $validatedData = $request->validate([
                'name' => 'sometimes|required|string|max:255',
                'code' => 'sometimes|required|string|max:50|unique:suppliers,code,' . $supplier->id,
                'contact_person' => 'nullable|string|max:255',
                'email' => 'nullable|email|max:255',
                'phone' => 'nullable|string|max:50',
                'address' => 'nullable|array',
                'tax_id' => 'nullable|string|max:50',
                'payment_terms' => 'nullable|string|max:255',
                'credit_limit' => 'nullable|numeric|min:0',
                'notes' => 'nullable|string',
                'is_active' => 'sometimes|boolean',
            ]);

            $supplier->update($validatedData);

            Log::info('Supplier updated successfully', [
                'supplier_id' => $supplier->id,
                'code' => $supplier->code,
            ]);

            return response()->json([
                'success' => true,
                'message' => '供應商更新成功',
                'data' => $supplier->fresh(),
            ]);

        } catch (\Exception $e) {
            Log::error('Supplier update error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => '更新供應商失敗',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * 刪除指定的供應商
     */
    public function destroy(Supplier $supplier): JsonResponse
    {
        try {
            // 檢查是否有相關聯的採購單
            if ($supplier->purchaseOrders()->exists()) {
                return response()->json([
                    'success' => false,
                    'message' => '無法刪除：該供應商有相關聯的採購單',
                ], 422);
            }

            $supplier->delete();

            Log::info('Supplier deleted successfully', [
                'supplier_id' => $supplier->id,
                'code' => $supplier->code,
            ]);

            return response()->json([
                'success' => true,
                'message' => '供應商刪除成功',
            ]);

        } catch (\Exception $e) {
            Log::error('Supplier destroy error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => '刪除供應商失敗',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}