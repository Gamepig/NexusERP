<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * 客戶 API 控制器
 * 
 * 主要功能：客戶的查詢、創建、更新、刪除等 CRUD 操作
 */
class CustomerController extends Controller
{
    /**
     * 顯示客戶列表
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = Customer::query();
            
            // 只顯示屬於當前公司的客戶 - 多租戶篩選
            $companyId = session('current_company_id') ?? session('app.current_company_id');
            if ($companyId) {
                $query->where('company_id', $companyId);
            }

            // 狀態篩選
            if ($request->filled('status')) {
                if ($request->status === 'active') {
                    $query->active();
                } else {
                    $query->where('status', $request->status);
                }
            }

            // 類型篩選
            if ($request->filled('type')) {
                $query->byType($request->type);
            }

            // 分級篩選
            if ($request->filled('segment')) {
                $query->bySegment($request->segment);
            }

            // 關鍵字搜尋（名稱、公司名稱、電話、郵箱）
            if ($request->filled('search')) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'ILIKE', "%{$search}%")
                      ->orWhere('company_name', 'ILIKE', "%{$search}%")
                      ->orWhere('primary_email', 'ILIKE', "%{$search}%")
                      ->orWhere('primary_phone', 'ILIKE', "%{$search}%")
                      ->orWhere('customer_code', 'ILIKE', "%{$search}%")
                      // 電話搜尋加強：移除特殊字符進行搜尋
                      ->orWhereRaw("REGEXP_REPLACE(primary_phone, '[^0-9]', '', 'g') ILIKE ?", ["%".preg_replace('/[^0-9]/', '', $search)."%"]);
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
                $customers = $query->get();
                return response()->json([
                    'success' => true,
                    'data' => $customers,
                    'pagination' => [
                        'total' => $customers->count(),
                        'per_page' => $customers->count(),
                        'current_page' => 1,
                        'last_page' => 1
                    ]
                ]);
            } else {
                // 分頁資料
                $customers = $query->paginate($perPage);
                return response()->json([
                    'success' => true,
                    'data' => $customers->items(),
                    'pagination' => [
                        'total' => $customers->total(),
                        'per_page' => $customers->perPage(),
                        'current_page' => $customers->currentPage(),
                        'last_page' => $customers->lastPage()
                    ]
                ]);
            }

        } catch (\Exception $e) {
            Log::error('Customer index error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => '獲取客戶列表失敗',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * 創建新的客戶
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validatedData = $request->validate([
                'customer_code' => 'nullable|string|max:32|unique:customers,customer_code',
                'name' => 'required|string|max:255',
                'company_name' => 'nullable|string|max:255',
                'customer_type' => 'required|in:individual,business,organization',
                'status' => 'nullable|in:active,inactive,blacklisted',
                'primary_email' => 'nullable|email|max:128',
                'primary_phone' => 'nullable|string|max:32',
                'address_line1' => 'nullable|string|max:255',
                'address_line2' => 'nullable|string|max:255',
                'city' => 'nullable|string|max:128',
                'state' => 'nullable|string|max:128',
                'postal_code' => 'nullable|string|max:32',
                'country' => 'nullable|string|max:64',
                'tax_id' => 'nullable|string|max:32',
                'credit_limit' => 'nullable|numeric|min:0',
                'payment_terms' => 'nullable|integer|min:0',
                'discount_percentage' => 'nullable|numeric|min:0|max:100',
                'industry' => 'nullable|string|max:128',
                'customer_segment' => 'nullable|in:premium,standard,budget,vip',
                'lead_source' => 'nullable|string|max:64',
                'assigned_sales_rep_id' => 'nullable|integer',
                'notes' => 'nullable|string',
            ]);

            // 設定預設值
            $validatedData['status'] = $validatedData['status'] ?? Customer::STATUS_ACTIVE;
            $validatedData['credit_limit'] = $validatedData['credit_limit'] ?? 0.00;
            $validatedData['payment_terms'] = $validatedData['payment_terms'] ?? 30;
            $validatedData['discount_percentage'] = $validatedData['discount_percentage'] ?? 0.00;
            $validatedData['country'] = $validatedData['country'] ?? 'Taiwan';

            // 如果沒有提供客戶代碼，自動產生
            if (empty($validatedData['customer_code'])) {
                $validatedData['customer_code'] = 'CUS' . str_pad(Customer::count() + 1, 6, '0', STR_PAD_LEFT);
            }

            // 設定客戶歸屬於當前用戶
            $validatedData['created_by_user_id'] = auth()->id();

            $customer = Customer::create($validatedData);

            Log::info('Customer created successfully', [
                'customer_id' => $customer->id,
                'customer_code' => $customer->customer_code,
            ]);

            return response()->json([
                'success' => true,
                'message' => '客戶創建成功',
                'data' => $customer,
            ], 201);

        } catch (\Exception $e) {
            Log::error('Customer store error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => '創建客戶失敗',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * 顯示指定的客戶
     */
    public function show(Customer $customer): JsonResponse
    {
        try {
            $customer->load(['salesOrders']);

            return response()->json([
                'success' => true,
                'message' => '客戶詳情獲取成功',
                'data' => $customer,
            ]);

        } catch (\Exception $e) {
            Log::error('Customer show error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => '獲取客戶詳情失敗',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * 更新指定的客戶
     */
    public function update(Request $request, Customer $customer): JsonResponse
    {
        try {
            $validatedData = $request->validate([
                'name' => 'sometimes|required|string|max:255',
                'company_name' => 'nullable|string|max:255',
                'customer_type' => 'sometimes|in:individual,business,organization',
                'status' => 'sometimes|in:active,inactive,blacklisted',
                'primary_email' => 'nullable|email|max:128',
                'primary_phone' => 'nullable|string|max:32',
                'address_line1' => 'nullable|string|max:255',
                'address_line2' => 'nullable|string|max:255',
                'city' => 'nullable|string|max:128',
                'state' => 'nullable|string|max:128',
                'postal_code' => 'nullable|string|max:32',
                'country' => 'nullable|string|max:64',
                'tax_id' => 'nullable|string|max:32',
                'credit_limit' => 'nullable|numeric|min:0',
                'payment_terms' => 'nullable|integer|min:0',
                'discount_percentage' => 'nullable|numeric|min:0|max:100',
                'industry' => 'nullable|string|max:128',
                'customer_segment' => 'nullable|in:premium,standard,budget,vip',
                'lead_source' => 'nullable|string|max:64',
                'assigned_sales_rep_id' => 'nullable|integer',
                'notes' => 'nullable|string',
            ]);

            $customer->update($validatedData);

            Log::info('Customer updated successfully', [
                'customer_id' => $customer->id,
                'customer_code' => $customer->customer_code,
            ]);

            return response()->json([
                'success' => true,
                'message' => '客戶更新成功',
                'data' => $customer->fresh(),
            ]);

        } catch (\Exception $e) {
            Log::error('Customer update error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => '更新客戶失敗',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * 刪除指定的客戶
     */
    public function destroy(Customer $customer): JsonResponse
    {
        try {
            // 檢查是否有相關聯的銷售訂單
            if ($customer->salesOrders()->exists()) {
                return response()->json([
                    'success' => false,
                    'message' => '無法刪除：該客戶有相關聯的銷售訂單',
                ], 422);
            }

            $customer->delete();

            Log::info('Customer deleted successfully', [
                'customer_id' => $customer->id,
                'customer_code' => $customer->customer_code,
            ]);

            return response()->json([
                'success' => true,
                'message' => '客戶刪除成功',
            ]);

        } catch (\Exception $e) {
            Log::error('Customer destroy error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => '刪除客戶失敗',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}