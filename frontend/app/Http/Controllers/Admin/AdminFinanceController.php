<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Session;
use Illuminate\View\View;

class AdminFinanceController extends Controller
{
    /**
     * 應收帳款管理
     */
    public function receivables(Request $request): View
    {
        $receivables = $this->getAccountsReceivable($request);
        
        return view('admin.finance.receivables', compact('receivables'));
    }

    /**
     * 應付帳款管理
     */
    public function payables(Request $request): View
    {
        $payables = $this->getAccountsPayable($request);
        
        return view('admin.finance.payables', compact('payables'));
    }

    /**
     * 發票管理
     */
    public function invoices(Request $request): View
    {
        $invoices = $this->getInvoices($request);
        
        return view('admin.finance.invoices', compact('invoices'));
    }

    /**
     * 付款記錄
     */
    public function payments(Request $request): View
    {
        $payments = $this->getPayments($request);
        
        return view('admin.finance.payments', compact('payments'));
    }

    /**
     * 獲取應收帳款資料 - 直接從 invoices 表取得銷售發票
     */
    private function getAccountsReceivable(Request $request = null)
    {
        try {
            $query = DB::table('invoices as i')
                ->leftJoin('customers as c', 'i.customer_id', '=', 'c.id')
                ->leftJoin('sales_orders as so', 'i.sales_order_id', '=', 'so.id')
                ->where('i.invoice_type', 'sales')  // 只取銷售發票
                ->where('i.status', '!=', 'cancelled');  // 排除已取消的發票

            // 搜尋功能
            if ($request) {
                if ($request->filled('invoice_number')) {
                    $query->where('i.invoice_number', 'ILIKE', '%' . $request->invoice_number . '%');
                }

                if ($request->filled('customer_name')) {
                    $query->where('c.name', 'ILIKE', '%' . $request->customer_name . '%');
                }

                if ($request->filled('status')) {
                    $query->where('i.status', $request->status);
                }
            }

            return $query->select([
                    'i.id',
                    'i.invoice_number',
                    'i.total_amount as amount',
                    'i.total_amount as outstanding_amount',  // 簡化處理，假設全額未付
                    'i.due_date',
                    'i.status',
                    'i.created_at',
                    'c.name as customer_name',
                    'c.primary_email as customer_email',
                    'so.order_number'
                ])
                ->orderBy('i.due_date', 'asc')
                ->paginate(20);
                
        } catch (\Exception $e) {
            \Log::error('Failed to fetch accounts receivable from invoices', ['error' => $e->getMessage()]);
            return collect([]);
        }
    }

    /**
     * 獲取應付帳款資料 - 直接從 invoices 表取得採購發票
     */
    private function getAccountsPayable(Request $request = null)
    {
        try {
            $query = DB::table('invoices as i')
                ->leftJoin('suppliers as s', 'i.supplier_id', '=', 's.id')
                ->leftJoin('purchase_orders as po', 'i.purchase_order_id', '=', 'po.id')
                ->where('i.invoice_type', 'purchase')  // 只取採購發票
                ->where('i.status', '!=', 'cancelled');  // 排除已取消的發票

            // 搜尋功能
            if ($request) {
                if ($request->filled('invoice_number')) {
                    $query->where('i.invoice_number', 'ILIKE', '%' . $request->invoice_number . '%');
                }

                if ($request->filled('supplier_name')) {
                    $query->where('s.name', 'ILIKE', '%' . $request->supplier_name . '%');
                }

                if ($request->filled('status')) {
                    $query->where('i.status', $request->status);
                }
            }

            return $query->select([
                    'i.id',
                    'i.invoice_number',
                    'i.total_amount as amount',
                    'i.total_amount as outstanding_amount',  // 簡化處理，假設全額未付
                    'i.due_date',
                    'i.status',
                    'i.created_at',
                    's.name as supplier_name',
                    's.email as supplier_email',
                    'po.po_number as order_number'
                ])
                ->orderBy('i.due_date', 'asc')
                ->paginate(20);
                
        } catch (\Exception $e) {
            \Log::error('Failed to fetch accounts payable from invoices', ['error' => $e->getMessage()]);
            return collect([]);
        }
    }

    /**
     * 獲取發票資料 - 直接從 invoices 表取得所有發票
     */
    private function getInvoices(Request $request = null)
    {
        try {
            $query = DB::table('invoices as i')
                ->leftJoin('customers as c', 'i.customer_id', '=', 'c.id')
                ->leftJoin('suppliers as s', 'i.supplier_id', '=', 's.id')
                ->where('i.status', '!=', 'cancelled');  // 排除已取消的發票

            // 搜尋功能
            if ($request) {
                if ($request->filled('invoice_number')) {
                    $query->where('i.invoice_number', 'ILIKE', '%' . $request->invoice_number . '%');
                }

                if ($request->filled('party_name')) {
                    $query->where(function($q) use ($request) {
                        $q->where('c.name', 'ILIKE', '%' . $request->party_name . '%')
                          ->orWhere('s.name', 'ILIKE', '%' . $request->party_name . '%');
                    });
                }

                if ($request->filled('invoice_type')) {
                    $query->where('i.invoice_type', $request->invoice_type);
                }

                if ($request->filled('status')) {
                    $query->where('i.status', $request->status);
                }
            }

            return $query->select([
                    'i.id',
                    'i.invoice_number',
                    'i.total_amount as amount',
                    'i.total_amount as outstanding_amount',
                    'i.due_date',
                    'i.status',
                    'i.created_at',
                    DB::raw('COALESCE(c.name, s.name) as party_name'),
                    DB::raw('COALESCE(c.primary_email, s.email) as party_email'),
                    'i.invoice_type as type'
                ])
                ->orderBy('i.created_at', 'desc')
                ->paginate(20);
                
        } catch (\Exception $e) {
            \Log::error('Failed to fetch invoices', ['error' => $e->getMessage()]);
            return collect([]);
        }
    }

    /**
     * 獲取付款記錄 - 從 payments 表取得供應商付款記錄
     */
    private function getPayments(Request $request = null)
    {
        try {
            $query = DB::table('payments as p')
                ->leftJoin('suppliers as s', 'p.supplier_id', '=', 's.id');

            // 搜尋功能
            if ($request) {
                if ($request->filled('payment_number')) {
                    $query->where('p.payment_number', 'ILIKE', '%' . $request->payment_number . '%');
                }

                if ($request->filled('supplier_name')) {
                    $query->where('s.name', 'ILIKE', '%' . $request->supplier_name . '%');
                }

                if ($request->filled('payment_method')) {
                    $query->where('p.payment_method', $request->payment_method);
                }

                if ($request->filled('reference_number')) {
                    $query->where('p.reference_number', 'ILIKE', '%' . $request->reference_number . '%');
                }
            }

            return $query->select([
                    'p.id',
                    'p.total_amount as payment_amount',
                    'p.payment_date',
                    'p.payment_method',
                    'p.reference_number',
                    'p.created_at',
                    's.name as party_name',
                    'p.payment_number as invoice_number',  // 使用付款號碼代替發票號碼
                    DB::raw("'supplier' as payment_type")
                ])
                ->orderBy('p.payment_date', 'desc')
                ->paginate(20);
                
        } catch (\Exception $e) {
            \Log::error('Failed to fetch payments from payments table', ['error' => $e->getMessage()]);
            return collect([]);
        }
    }

    /**
     * 應收帳款詳細頁面
     */
    public function showReceivable(string $id): View
    {
        $receivable = $this->getReceivableDetail($id);
        
        if (!$receivable) {
            abort(404, '找不到該應收帳款記錄');
        }
        
        return view('admin.finance.receivables.show', compact('receivable'));
    }

    /**
     * 應付帳款詳細頁面
     */
    public function showPayable(string $id): View
    {
        $payable = $this->getPayableDetail($id);
        
        if (!$payable) {
            abort(404, '找不到該應付帳款記錄');
        }
        
        return view('admin.finance.payables.show', compact('payable'));
    }

    /**
     * 發票詳細頁面
     */
    public function showInvoice(string $id): View
    {
        $invoice = $this->getInvoiceDetail($id);
        
        if (!$invoice) {
            abort(404, '找不到該發票記錄');
        }
        
        return view('admin.finance.invoices.show', compact('invoice'));
    }

    /**
     * 付款記錄詳細頁面
     */
    public function showPayment(string $id): View
    {
        $payment = $this->getPaymentDetail($id);
        
        if (!$payment) {
            abort(404, '找不到該付款記錄');
        }
        
        return view('admin.finance.payments.show', compact('payment'));
    }

    /**
     * 獲取應收帳款詳細資料
     */
    private function getReceivableDetail(string $id)
    {
        try {
            return DB::table('invoices as i')
                ->leftJoin('customers as c', 'i.customer_id', '=', 'c.id')
                ->leftJoin('sales_orders as so', 'i.sales_order_id', '=', 'so.id')
                ->where('i.id', $id)
                ->where('i.invoice_type', 'sales')
                ->select([
                    'i.*',
                    'c.name as customer_name',
                    'c.primary_email as customer_email',
                    'so.order_number',
                    'so.order_date'
                ])
                ->first();
        } catch (\Exception $e) {
            \Log::error('Failed to fetch receivable detail', ['id' => $id, 'error' => $e->getMessage()]);
            return null;
        }
    }

    /**
     * 獲取應付帳款詳細資料
     */
    private function getPayableDetail(string $id)
    {
        try {
            return DB::table('invoices as i')
                ->leftJoin('suppliers as s', 'i.supplier_id', '=', 's.id')
                ->leftJoin('purchase_orders as po', 'i.purchase_order_id', '=', 'po.id')
                ->where('i.id', $id)
                ->where('i.invoice_type', 'purchase')
                ->select([
                    'i.*',
                    's.name as supplier_name',
                    's.email as supplier_email',
                    'po.po_number as order_number',
                    'po.order_date'
                ])
                ->first();
        } catch (\Exception $e) {
            \Log::error('Failed to fetch payable detail', ['id' => $id, 'error' => $e->getMessage()]);
            return null;
        }
    }

    /**
     * 獲取發票詳細資料
     */
    private function getInvoiceDetail(string $id)
    {
        try {
            return DB::table('invoices as i')
                ->leftJoin('customers as c', 'i.customer_id', '=', 'c.id')
                ->leftJoin('suppliers as s', 'i.supplier_id', '=', 's.id')
                ->leftJoin('sales_orders as so', 'i.sales_order_id', '=', 'so.id')
                ->leftJoin('purchase_orders as po', 'i.purchase_order_id', '=', 'po.id')
                ->where('i.id', $id)
                ->select([
                    'i.*',
                    'c.name as customer_name',
                    'c.primary_email as customer_email',
                    's.name as supplier_name',
                    's.email as supplier_email',
                    'so.order_number as sales_order_number',
                    'so.order_date as sales_order_date',
                    'po.po_number as purchase_order_number',
                    'po.order_date as purchase_order_date'
                ])
                ->first();
        } catch (\Exception $e) {
            \Log::error('Failed to fetch invoice detail', ['id' => $id, 'error' => $e->getMessage()]);
            return null;
        }
    }

    /**
     * 獲取付款記錄詳細資料
     */
    private function getPaymentDetail(string $id)
    {
        try {
            return DB::table('payments as p')
                ->leftJoin('suppliers as s', 'p.supplier_id', '=', 's.id')
                ->where('p.id', $id)
                ->select([
                    'p.*',
                    's.name as supplier_name',
                    's.email as supplier_email'
                ])
                ->first();
        } catch (\Exception $e) {
            \Log::error('Failed to fetch payment detail', ['id' => $id, 'error' => $e->getMessage()]);
            return null;
        }
    }

    /**
     * 檢查是否為 DEMO 帳號
     */
    private function isDemoAccount(): bool
    {
        return Session::get('admin_user') === 'DEMO';
    }
}