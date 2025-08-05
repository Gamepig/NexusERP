<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\View\View;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * 銷售訂單 Web Controller
 * 
 * 處理銷售訂單的前端頁面渲染，包括列表、檢視、編輯等頁面
 * 與 API SalesOrderController 分離，專注於頁面展示
 */
class SalesOrderController extends Controller
{
    /**
     * 顯示銷售訂單列表頁面
     */
    public function index(): View
    {
        return view('orders.sales.index');
    }

    /**
     * 顯示新增銷售訂單頁面
     */
    public function create(): View
    {
        return view('orders.sales.form', ['mode' => 'create']);
    }

    /**
     * 顯示銷售訂單詳情頁面
     * 
     * @param int $id 銷售訂單 ID
     */
    public function show(int $id): View
    {
        return view('orders.sales.show', ['orderId' => $id]);
    }

    /**
     * 顯示編輯銷售訂單頁面
     * 
     * @param int $id 銷售訂單 ID
     */
    public function edit(int $id)
    {
        try {
            // 獲取銷售訂單數據
            $salesOrder = DB::table('sales_orders as so')
                ->leftJoin('customers as c', 'so.customer_id', '=', 'c.id')
                ->select([
                    'so.*',
                    'c.name as customer_name'
                ])
                ->where('so.id', $id)
                ->first();

            if (!$salesOrder) {
                abort(404, '銷售訂單不存在');
            }

            // 業務邏輯檢查：已出貨的訂單不能編輯
            if (in_array($salesOrder->status, ['shipped', 'completed', 'cancelled'])) {
                $statusText = [
                    'shipped' => '已出貨',
                    'completed' => '已完成', 
                    'cancelled' => '已取消'
                ][$salesOrder->status] ?? $salesOrder->status;
                
                return redirect()->route('orders.sales.show', $id)
                    ->with('error', "訂單狀態為「{$statusText}」，不允許編輯。");
            }

            // 從訂單的客戶獲取 company_id (更可靠的方式)
            $customer = DB::table('customers')->where('id', $salesOrder->customer_id)->first();
            $companyId = $customer ? $customer->company_id : null;
            
            // 如果沒有客戶或公司ID，嘗試從當前用戶獲取
            if (!$companyId) {
                $userCompany = DB::table('user_companies')
                    ->where('user_id', auth()->id())
                    ->first();
                $companyId = $userCompany ? $userCompany->company_id : null;
            }

            // 獲取訂單項目
            $items = DB::table('sales_order_items as soi')
                ->leftJoin('products as p', 'soi.product_id', '=', 'p.id')
                ->select([
                    'soi.*',
                    'p.name as product_name',
                    'p.sku as product_sku'
                ])
                ->where('soi.sales_order_id', $id)
                ->orderBy('soi.id')
                ->get();

            // 獲取該公司的客戶列表
            $customers = DB::table('customers')
                ->select('id', 'name')
                ->where('company_id', $companyId)
                ->orderBy('name')
                ->get();

            // 獲取該公司的產品列表
            $products = DB::table('products')
                ->select('id', 'name', 'sku', 'selling_price as unit_price')
                ->where('company_id', $companyId)
                ->where('is_active', true)
                ->orderBy('name')
                ->get();

            // 調試信息
            \Log::info('Sales Order Edit Data:', [
                'order_id' => $id,
                'company_id' => $companyId,
                'customers_count' => $customers->count(),
                'products_count' => $products->count(),
                'items_count' => $items->count(),
                'customer_id' => $salesOrder->customer_id
            ]);

            return view('orders.sales.form', [
                'mode' => 'edit',
                'orderId' => $id,
                'salesOrder' => $salesOrder,
                'orderItems' => $items,
                'customers' => $customers,
                'products' => $products,
                'companyId' => $companyId,
                'debugInfo' => 'SalesOrderController::edit called with company_id=' . $companyId . ', customers=' . $customers->count() . ', products=' . $products->count() . ', order_customer_id=' . $salesOrder->customer_id
            ]);

        } catch (\Exception $e) {
            Log::error('Sales order edit page error: ' . $e->getMessage());
            abort(500, '載入銷售訂單編輯頁面失敗');
        }
    }

    /**
     * 顯示銷售訂單出貨頁面
     * 
     * @param int $id 銷售訂單 ID
     */
    public function ship(int $id): View
    {
        return view('orders.sales.shipping', ['orderId' => $id]);
    }
}