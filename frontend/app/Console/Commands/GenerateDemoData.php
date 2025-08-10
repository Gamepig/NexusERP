<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\{Company, Customer, Product, SalesOrder, SalesOrderItem, User};
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use App\Services\SimpleGoJWTService;

class GenerateDemoData extends Command
{
    protected $signature = 'demo:seed 
        {--company= : 目標公司ID（預設第一家公司）}
        {--reset : 重置示範資料（清除並重建）}
        {--orders=10 : 產生銷售訂單數量}
        {--products=20 : 產生產品數量}
        {--customers=10 : 產生客戶數量}
        {--quotes=0 : 產生報價單數量（呼叫 Go Backend）}
        {--with-inventory : 連同庫存 Mock 一併產生}
        {--warehouses=2 : 搭配 --with-inventory，倉庫數}
        {--low=20 : 搭配 --with-inventory，低庫存比例%}';

    protected $description = '產生高擬真 DEMO/Mock 資料（公司/客戶/產品/交易）';

    public function handle(): int
    {
        $companyId = $this->option('company');
        if (!$companyId) {
            $companyId = Company::query()->value('id');
        }
        if (!$companyId) {
            $this->error('找不到公司，請先建立公司資料');
            return self::FAILURE;
        }

        if ($this->option('reset')) {
            SalesOrderItem::whereHas('order', fn($q) => $q->where('company_id', $companyId))->delete();
            SalesOrder::where('company_id', $companyId)->delete();
            Product::where('company_id', $companyId)->delete();
            Customer::where('company_id', $companyId)->delete();
            $this->info('已清除原有 DEMO 資料');
        }

        // 產品
        $productCount = (int)$this->option('products');
        for ($i=0; $i<$productCount; $i++) {
            Product::firstOrCreate(
                ['company_id'=>$companyId,'sku'=>'SKU-'.Str::upper(Str::random(6))],
                ['name'=>'示範產品 '.Str::upper(Str::random(3)), 'price'=>rand(500,5000)]
            );
        }

        // 客戶
        $customerCount = (int)$this->option('customers');
        for ($i=0; $i<$customerCount; $i++) {
            Customer::firstOrCreate(
                ['company_id'=>$companyId, 'email'=>Str::lower(Str::random(8)).'@example.com'],
                ['name'=>'示範客戶 '.Str::upper(Str::random(4))]
            );
        }

        $products = Product::where('company_id',$companyId)->inRandomOrder()->take(50)->get();
        $customers = Customer::where('company_id',$companyId)->inRandomOrder()->take(10)->get();

        // 訂單
        $orderCount = (int)$this->option('orders');
        for ($i=0; $i<$orderCount; $i++) {
            $customer = $customers->random();
            $order = SalesOrder::create([
                'company_id'=>$companyId,
                'customer_id'=>$customer->id,
                'status'=>'confirmed',
            ]);
            $lines = rand(1,3);
            for ($l=0; $l<$lines; $l++) {
                $p = $products->random();
                SalesOrderItem::create([
                    'sales_order_id'=>$order->id,
                    'product_id'=>$p->id,
                    'quantity'=>rand(1,5),
                    'unit_price'=>$p->price,
                ]);
            }
        }

        $this->info("DEMO 資料產生完成：產品 {$productCount}，客戶 {$customerCount}，訂單 {$orderCount}");

        // 可選：生成庫存資料
        if ($this->option('with-inventory')) {
            Artisan::call('mock:inventory', [
                '--company' => $companyId,
                '--reset' => true,
                '--warehouses' => (int)$this->option('warehouses'),
                '--products' => max($productCount, 40),
                '--low' => (int)$this->option('low'),
            ]);
            $this->info('已生成庫存 Mock 資料');
        }

        // 可選：生成報價單（Go Backend）
        $quoteCount = (int)$this->option('quotes');
        if ($quoteCount > 0) {
            $this->generateQuotesViaGo($quoteCount, $companyId);
        }

        return self::SUCCESS;
    }

    private function generateQuotesViaGo(int $count, int $companyId): void
    {
        try {
            $goUrl = config('services.go_backend.url', 'http://localhost:8082');
            $user = User::query()->first();
            if (!$user) { $this->warn('無法建立 Quote：找不到使用者'); return; }

            $jwtService = new SimpleGoJWTService();
            $auth = $jwtService->authenticateUser($user);
            $token = $auth['access_token'] ?? null;
            if (!$token) { $this->warn('無法取得 Go JWT，跳過 Quote 生成'); return; }

            $http = Http::withHeaders([
                'Authorization' => 'Bearer '.$token,
                'Content-Type' => 'application/json',
                'Accept' => 'application/json',
            ])->timeout(15);

            $products = Product::query()->where('company_id', $companyId)->inRandomOrder()->take(10)->get();
            $customers = Customer::query()->where('company_id', $companyId)->inRandomOrder()->take(10)->get();

            for ($i=0; $i<$count; $i++) {
                $customer = $customers->random();
                $line = $products->random();
                $payload = [
                    'customer_id' => (int)$customer->id,
                    'quote_date' => now()->toISOString(),
                    'expiry_date' => now()->addDays(30)->toISOString(),
                    'notes' => 'DEMO Quote generated by demo:seed',
                    'status' => 'pending',
                    'currency_id' => 251, // TWD
                    'items' => [[
                        'product_id' => (int)$line->id,
                        'description' => $line->name,
                        'quantity' => rand(1,5),
                        'unit_price' => (float)$line->price,
                    ]],
                ];

                $resp = $http->post($goUrl.'/api/quotes', $payload);
                if (!$resp->successful()) {
                    Log::warning('Create demo quote failed', ['status'=>$resp->status(),'body'=>$resp->body()]);
                }
            }
            $this->info("已透過 Go Backend 生成 {$count} 筆報價單");
        } catch (\Throwable $e) {
            Log::error('Generate quotes via Go failed: '.$e->getMessage());
            $this->warn('建立 Quote 失敗（詳見日誌）');
        }
    }
}


