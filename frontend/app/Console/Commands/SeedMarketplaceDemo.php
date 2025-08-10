<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\DemoDataService;

class SeedMarketplaceDemo extends Command
{
    protected $signature = 'marketplace:seed {--reset : 重新產生 marketplace demo 檔案} {--count=80 : 產品數量}';
    protected $description = '建立/重置 Marketplace DEMO 假資料（方案 B，存於 storage/app/demo/marketplace/*.json）';

    public function handle(): int
    {
        /** @var DemoDataService $svc */
        $svc = app(DemoDataService::class);
        if ($this->option('reset')) {
            $svc->reset();
            $this->info('已重置 demo 基本資料');
        } else {
            $svc->ensureDemoData();
        }

        // 依 count 覆寫 marketplace/products.json（其餘檔案用預設）
        $count = (int) $this->option('count');
        if ($count > 0) {
            // 反射呼叫私有方法不合適，這裡直接透過公開 get/ensure 並覆蓋檔案
            // 重新組合產品資料（複製自 DemoDataService 的規則）
            $ref = new \ReflectionClass(DemoDataService::class);
            $method = $ref->getMethod('sampleMarketplaceProducts');
            $method->setAccessible(true);
            $products = $method->invoke($svc, $count);
            \Illuminate\Support\Facades\Storage::put('demo/marketplace/products.json', json_encode($products, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
            $this->info("products.json 生成完成（{$count} 筆）");
        }

        $this->info('Marketplace DEMO 假資料準備完成');
        return self::SUCCESS;
    }
}


