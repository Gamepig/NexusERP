<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\{Company, Product, Warehouse, InventoryLevel};
use Illuminate\Support\Str;

class GenerateMockData extends Command
{
    protected $signature = 'mock:inventory {--company=} {--warehouses=2} {--products=40} {--low=10} {--reset}';
    protected $description = '產生庫存相關 Mock 資料（倉庫/產品/庫存水準），可控制低庫存比例';

    public function handle(): int
    {
        $companyId = $this->option('company') ?: Company::query()->value('id');
        if (!$companyId) { $this->error('找不到公司'); return self::FAILURE; }

        // 倉庫
        $warehouseCount = (int)$this->option('warehouses');
        $warehouses = collect();
        for ($i=0;$i<$warehouseCount;$i++) {
            $warehouses->push(
                Warehouse::firstOrCreate(['company_id'=>$companyId,'code'=>'WH-'.Str::upper(Str::random(4))], ['name'=>'示範倉 '.($i+1)])
            );
        }

        // 產品
        $productCount = (int)$this->option('products');
        $products = collect();
        for ($i=0;$i<$productCount;$i++) {
            $products->push(
                Product::firstOrCreate(['company_id'=>$companyId,'sku'=>'SKU-'.Str::upper(Str::random(6))], ['name'=>'庫存產品 '.Str::upper(Str::random(3)),'price'=>rand(300,3000)])
            );
        }

        if ($this->option('reset')) {
            InventoryLevel::whereIn('product_id',$products->pluck('id'))->delete();
        }

        $lowRatio = max(0,min(100,(int)$this->option('low')));
        $lowTarget = (int)round(($lowRatio/100) * $productCount);

        // 建立庫存水準
        $created = 0; $low = 0;
        foreach ($products as $p) {
            foreach ($warehouses as $w) {
                $max = rand(50,200);
                $reorder = rand(10,40);
                $available = rand(0,$max);
                if ($low < $lowTarget) { // 控制部分為低庫存
                    $available = rand(0, $reorder);
                    $low++;
                }
                InventoryLevel::updateOrCreate(
                    ['product_id'=>$p->id,'warehouse_id'=>$w->id],
                    [
                        'quantity_on_hand'=>$available,
                        'quantity_available'=>$available,
                        'quantity_reserved'=>0,
                        'quantity_on_order'=>0,
                        'reorder_point'=>$reorder,
                        'max_stock_level'=>$max,
                    ]
                );
                $created++;
            }
        }

        $this->info("Mock 庫存資料完成：倉庫 {$warehouses->count()}、產品 {$products->count()}、庫存紀錄 {$created}（低庫存比 {$lowRatio}%）");
        return self::SUCCESS;
    }
}


