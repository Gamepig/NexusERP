<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Session;
use Illuminate\View\View;
use Illuminate\Http\RedirectResponse;

class AdminOrderController extends Controller
{
    /**
     * 顯示訂單列表
     */
    public function index(Request $request): View
    {
        // 獲取銷售訂單資料 (從 Go 後端 API 或直接查詢資料庫)
        $orders = $this->getSalesOrders($request);
        
        return view('admin.orders.index', compact('orders'));
    }

    /**
     * 顯示訂單詳細資訊
     */
    public function show(string $id): View
    {
        $order = $this->getSalesOrderById($id);
        
        if (!$order) {
            abort(404, '訂單不存在');
        }
        
        return view('admin.orders.show', compact('order'));
    }

    /**
     * 顯示編輯訂單表單
     */
    public function edit(string $id): View
    {
        $order = $this->getSalesOrderById($id);
        
        if (!$order) {
            abort(404, '訂單不存在');
        }
        
        return view('admin.orders.edit', compact('order'));
    }

    /**
     * 更新訂單資訊
     */
    public function update(Request $request, string $id): RedirectResponse
    {
        // 檢查 DEMO 帳號權限
        if ($this->isDemoAccount()) {
            return $this->demoAccountDenied('編輯訂單');
        }

        $request->validate([
            'status' => 'required|string|in:pending,confirmed,processing,shipped,delivered,cancelled',
            'total_amount' => 'required|numeric|min:0',
            'notes' => 'nullable|string|max:1000',
        ]);

        try {
            // 更新訂單資訊 (透過 Go 後端 API 或直接更新資料庫)
            $this->updateSalesOrder($id, [
                'status' => $request->status,
                'total_amount' => $request->total_amount,
                'notes' => $request->notes,
                'updated_at' => now(),
            ]);

            return redirect()->route('admin.orders.index')
                ->with('success', '訂單資訊已成功更新');
                
        } catch (\Exception $e) {
            return back()->with('error', '更新訂單時發生錯誤: ' . $e->getMessage())
                ->withInput();
        }
    }

    /**
     * 刪除訂單
     */
    public function destroy(string $id): RedirectResponse
    {
        // 檢查 DEMO 帳號權限
        if ($this->isDemoAccount()) {
            return $this->demoAccountDenied('刪除訂單');
        }

        try {
            $order = $this->getSalesOrderById($id);
            
            if (!$order) {
                return redirect()->route('admin.orders.index')
                    ->with('error', '訂單不存在');
            }

            // 刪除訂單 (透過 Go 後端 API 或直接刪除資料庫記錄)
            $this->deleteSalesOrder($id);

            return redirect()->route('admin.orders.index')
                ->with('success', "訂單 #{$order->order_number} 已成功刪除");
                
        } catch (\Exception $e) {
            return back()->with('error', '刪除訂單時發生錯誤: ' . $e->getMessage());
        }
    }

    /**
     * 獲取銷售訂單列表
     */
    private function getSalesOrders(Request $request = null)
    {
        try {
            // 從資料庫直接查詢 (後續可改為呼叫 Go 後端 API)
            $query = DB::table('sales_orders as so')
                ->leftJoin('customers as c', 'so.customer_id', '=', 'c.id');

            // 搜尋功能
            if ($request) {
                if ($request->filled('order_number')) {
                    $query->where('so.order_number', 'ILIKE', '%' . $request->order_number . '%');
                }

                if ($request->filled('customer_name')) {
                    $query->where('c.name', 'ILIKE', '%' . $request->customer_name . '%');
                }

                if ($request->filled('status')) {
                    $query->where('so.status', $request->status);
                }

                if ($request->filled('date_from')) {
                    $query->where('so.order_date', '>=', $request->date_from);
                }

                if ($request->filled('date_to')) {
                    $query->where('so.order_date', '<=', $request->date_to);
                }
            }

            return $query->select([
                    'so.id',
                    'so.order_number',
                    'so.status',
                    'so.total_amount',
                    'so.order_date',
                    'so.created_at',
                    'so.updated_at',
                    'c.name as customer_name',
                    'c.primary_email as customer_email'
                ])
                ->orderBy('so.created_at', 'desc')
                ->paginate(20);
                
        } catch (\Exception $e) {
            \Log::error('Failed to fetch sales orders', ['error' => $e->getMessage()]);
            return collect([]); // 返回空集合
        }
    }

    /**
     * 根據 ID 獲取銷售訂單
     */
    private function getSalesOrderById(string $id)
    {
        try {
            return DB::table('sales_orders as so')
                ->leftJoin('customers as c', 'so.customer_id', '=', 'c.id')
                ->select([
                    'so.*',
                    'c.name as customer_name',
                    'c.primary_email as customer_email',
                    'c.primary_phone as customer_phone'
                ])
                ->where('so.id', $id)
                ->first();
                
        } catch (\Exception $e) {
            \Log::error('Failed to fetch sales order', ['id' => $id, 'error' => $e->getMessage()]);
            return null;
        }
    }

    /**
     * 更新銷售訂單
     */
    private function updateSalesOrder(string $id, array $data): bool
    {
        try {
            return DB::table('sales_orders')
                ->where('id', $id)
                ->update($data) > 0;
                
        } catch (\Exception $e) {
            \Log::error('Failed to update sales order', ['id' => $id, 'error' => $e->getMessage()]);
            throw $e;
        }
    }

    /**
     * 刪除銷售訂單
     */
    private function deleteSalesOrder(string $id): bool
    {
        try {
            return DB::table('sales_orders')
                ->where('id', $id)
                ->delete() > 0;
                
        } catch (\Exception $e) {
            \Log::error('Failed to delete sales order', ['id' => $id, 'error' => $e->getMessage()]);
            throw $e;
        }
    }

    /**
     * 檢查是否為 DEMO 帳號
     */
    private function isDemoAccount(): bool
    {
        return Session::get('admin_user') === 'DEMO';
    }

    /**
     * DEMO 帳號權限不足時的回應
     */
    private function demoAccountDenied(string $action): RedirectResponse
    {
        return back()->with('error', "DEMO 帳號沒有「{$action}」的權限，此功能僅供展示");
    }
}