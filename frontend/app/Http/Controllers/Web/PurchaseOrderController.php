<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\PurchaseOrder;
use App\Models\Supplier;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\View\View;

/**
 * 採購訂單 Web Controller
 * 
 * 處理採購訂單的前端頁面渲染，包括列表、檢視、編輯等頁面
 * 與 API PurchaseOrderController 分離，專注於頁面展示
 */
class PurchaseOrderController extends Controller
{
    /**
     * 顯示採購訂單列表頁面
     */
    public function index(): View
    {
        // 只顯示當前用戶創建的採購訂單，包含關聯資料
        $purchaseOrders = PurchaseOrder::with(['supplier', 'creator'])
            ->where('created_by_user_id', auth()->id())
            ->orderBy('created_at', 'desc')
            ->paginate(15);
        
        return view('orders.purchase.index', compact('purchaseOrders'));
    }

    /**
     * 顯示新增採購訂單頁面
     */
    public function create(): View
    {
        // 取得所有供應商和產品供選擇
        $suppliers = Supplier::where('is_active', true)
            ->orderBy('name')
            ->get();
        
        $products = Product::where('is_active', true)
            ->orderBy('name')
            ->get();
        
        return view('orders.purchase.form', [
            'mode' => 'create',
            'suppliers' => $suppliers,
            'products' => $products
        ]);
    }

    /**
     * 顯示採購訂單詳情頁面
     * 
     * @param int $id 採購訂單 ID
     */
    public function show(int $id): View
    {
        // 取得採購訂單及其完整關聯資料，確保只能查看同公司的訂單
        $currentCompanyId = session('current_company_id');
        $query = PurchaseOrder::with([
            'supplier',
            'creator',
            'approver',
            'items' => function ($query) {
                $query->with('product');
            }
        ]);
        
        if ($currentCompanyId) {
            $query->where('company_id', $currentCompanyId);
        }
        
        $purchaseOrder = $query->findOrFail($id);

        return view('orders.purchase.show', [
            'purchaseOrder' => $purchaseOrder,
            'orderId' => $id
        ]);
    }

    /**
     * 顯示編輯採購訂單頁面
     * 
     * @param int $id 採購訂單 ID
     */
    public function edit(int $id): View
    {
        // 取得採購訂單及其詳細資料，確保只能編輯同公司的訂單
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

        // 檢查是否可以編輯
        if (!$purchaseOrder->canEdit()) {
            abort(403, '此採購訂單狀態無法進行編輯');
        }

        // 取得所有供應商和產品供選擇
        $suppliers = Supplier::where('is_active', true)
            ->orderBy('name')
            ->get();
        
        $products = Product::where('is_active', true)
            ->orderBy('name')
            ->get();

        return view('orders.purchase.form', [
            'mode' => 'edit',
            'purchaseOrder' => $purchaseOrder,
            'orderId' => $id,
            'suppliers' => $suppliers,
            'products' => $products
        ]);
    }

    /**
     * 顯示採購訂單收貨頁面
     * 
     * @param int $id 採購訂單 ID
     */
    public function receive(int $id): View
    {
        // 取得採購訂單及其明細
        $purchaseOrder = PurchaseOrder::with([
            'supplier',
            'items' => function ($query) {
                $query->with('product');
            }
        ])->findOrFail($id);

        // 檢查狀態是否允許收貨
        if (!$purchaseOrder->isApproved() && $purchaseOrder->status !== PurchaseOrder::STATUS_PARTIALLY_RECEIVED) {
            abort(403, '此採購訂單尚未核准，無法進行收貨作業');
        }

        return view('orders.purchase.receiving', [
            'purchaseOrder' => $purchaseOrder,
            'orderId' => $id
        ]);
    }

    /**
     * 刪除採購訂單
     * 
     * @param int $id 採購訂單 ID
     */
    public function destroy(int $id)
    {
        // 取得採購訂單，確保只能刪除自己創建的訂單
        $purchaseOrder = PurchaseOrder::where('created_by_user_id', auth()->id())
            ->findOrFail($id);

        // 檢查是否可以刪除
        if (!$purchaseOrder->canDelete()) {
            return redirect()->back()->withErrors(['error' => '此採購訂單狀態無法進行刪除']);
        }

        try {
            // 刪除採購訂單項目
            $purchaseOrder->items()->delete();
            
            // 刪除採購訂單
            $purchaseOrder->delete();

            return redirect()->route('orders.purchase.index')
                ->with('success', '採購訂單已成功刪除');
        } catch (\Exception $e) {
            return redirect()->back()->withErrors(['error' => '刪除採購訂單時發生錯誤：' . $e->getMessage()]);
        }
    }
}