<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\DemoDataService;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use App\Services\SimpleGoJWTService;
use App\Models\{Customer, Product, SalesOrder, SalesOrderItem, InventoryLevel};

class DemoController extends Controller
{
    public function __construct(private DemoDataService $demo)
    {
        $this->demo->ensureDemoData();
    }

    public function index()
    {
        return view('demo.index');
    }

    public function inquiry()
    {
        $data = $this->demo->get('inquiry');
        return view('demo.inquiry', compact('data'));
    }

    public function vipProcurement()
    {
        $data = $this->demo->get('vip');
        return view('demo.vip-procurement', compact('data'));
    }

    public function inventoryAlert()
    {
        $data = $this->demo->get('inventory');
        return view('demo.inventory-alert', compact('data'));
    }

    public function financeAnalysis()
    {
        $data = $this->demo->get('finance');
        return view('demo.finance-analysis', compact('data'));
    }

    // 本機開發用：重置 DEMO 假資料
    public function reset()
    {
        $this->demo->reset();
        // 觸發一鍵重置與種子資料（含 Quotes/Inventory）
        $summary = null;
        try {
            Artisan::call('demo:seed', [
                '--reset' => true,
                '--orders' => 15,
                '--products' => 30,
                '--quotes' => 10,
                '--customers' => 12,
                '--with-inventory' => true,
                '--warehouses' => 2,
                '--low' => 20,
            ]);
            $summary = [
                'customers' => Customer::count(),
                'products' => Product::count(),
                'orders' => SalesOrder::count(),
                'order_items' => SalesOrderItem::count(),
                'inventory' => InventoryLevel::count(),
                'low_stock' => InventoryLevel::lowStock()->count(),
            ];
        } catch (\Throwable $e) {
            // 忽略錯誤，仍回到頁面顯示重置成功（前端假資料已重置）
        }
        $msg = 'DEMO 資料已重置並重新生成';
        if ($summary) {
            $msg .= "｜Customers {$summary['customers']}、Products {$summary['products']}、Orders {$summary['orders']}（Items {$summary['order_items']}）、Inventory {$summary['inventory']}（Low {$summary['low_stock']}）";
        }
        return redirect()->route('demo.index')->with('success', $msg);
    }

    // 提供 /demo/summary JSON 統計，供前端動態刷新卡片
    public function summary()
    {
        try {
            $companyId = $this->getCurrentCompanyId();
            $summary = $this->buildSummary($companyId);
            return response()->json($summary);
        } catch (\Throwable $e) {
            return response()->json(['error' => 'summary_unavailable'], 503);
        }
    }

    private function getCurrentCompanyId(): ?int
    {
        $user = Auth::user();
        if (!$user) return null;
        $currentCompanyId = $user->current_company_id ?? null;
        if (!$currentCompanyId) {
            $primaryCompany = $user->companies()->wherePivot('is_primary', true)->first();
            if ($primaryCompany) {
                $currentCompanyId = $primaryCompany->id;
            } else {
                $firstCompany = $user->companies()->first();
                $currentCompanyId = $firstCompany ? $firstCompany->id : null;
            }
        }
        return $currentCompanyId;
    }

    private function buildSummary(?int $companyId): array
    {
        // 基本統計（依公司）
        $customers = $companyId ? Customer::where('company_id', $companyId)->count() : Customer::count();
        $products = $companyId ? Product::where('company_id', $companyId)->count() : Product::count();
        $orders = $companyId ? SalesOrder::where('company_id', $companyId)->count() : SalesOrder::count();
        $orderItems = $companyId
            ? SalesOrderItem::whereIn('sales_order_id', SalesOrder::where('company_id', $companyId)->pluck('id'))
                ->count()
            : SalesOrderItem::count();

        if ($companyId) {
            $productIds = Product::where('company_id', $companyId)->pluck('id');
            $inventory = InventoryLevel::whereIn('product_id', $productIds)->count();
            $lowStock = InventoryLevel::whereIn('product_id', $productIds)->lowStock()->count();
        } else {
            $inventory = InventoryLevel::count();
            $lowStock = InventoryLevel::lowStock()->count();
        }

        // 透過 Go Backend 取得報價總數（若可用）
        $quotes = null;
        try {
            if ($companyId) {
                $goUrl = config('services.go_backend.url', 'http://localhost:8082');
                $jwtService = new SimpleGoJWTService();
                $user = Auth::user();
                $auth = $jwtService->authenticateUser($user);
                $token = $auth['access_token'] ?? null;
                if ($token) {
                    $resp = Http::withHeaders([
                        'Authorization' => 'Bearer '.$token,
                        'Accept' => 'application/json',
                    ])->timeout(10)->get($goUrl.'/api/quotes', [
                        'company_id' => $companyId,
                        'page' => 1,
                        'page_size' => 1,
                    ]);
                    if ($resp->successful()) {
                        $json = $resp->json();
                        $quotes = $json['total'] ?? $json['total_count'] ?? null;
                    }
                }
            }
        } catch (\Throwable $t) {
            Log::warning('Fetch Go quotes total failed', ['error' => $t->getMessage()]);
        }

        return [
            'customers' => $customers,
            'products' => $products,
            'orders' => $orders,
            'order_items' => $orderItems,
            'inventory' => $inventory,
            'low_stock' => $lowStock,
            'quotes' => $quotes,
        ];
    }
}


