<?php

namespace App\Services;

use Illuminate\Support\Facades\Storage;

class DemoDataService
{
    private string $basePath = 'demo';

    public function ensureDemoData(): void
    {
        if (!Storage::exists($this->basePath)) {
            Storage::makeDirectory($this->basePath);
        }

        $files = [
            'inquiry.json' => fn () => $this->sampleInquiry(),
            'vip.json' => fn () => $this->sampleVip(),
            'inventory.json' => fn () => $this->sampleInventory(),
            'finance.json' => fn () => $this->sampleFinance(),
            'marketplace/categories.json' => fn () => $this->sampleMarketplaceCategories(),
            'marketplace/products.json' => fn () => $this->sampleMarketplaceProducts(80),
        ];

        foreach ($files as $name => $factory) {
            if (!Storage::exists($this->basePath . '/' . $name)) {
                Storage::put($this->basePath . '/' . $name, json_encode($factory(), JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
            }
        }
    }

    public function reset(): void
    {
        if (!Storage::exists($this->basePath)) {
            Storage::makeDirectory($this->basePath);
        }
        Storage::put($this->basePath . '/inquiry.json', json_encode($this->sampleInquiry(), JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
        Storage::put($this->basePath . '/vip.json', json_encode($this->sampleVip(), JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
        Storage::put($this->basePath . '/inventory.json', json_encode($this->sampleInventory(), JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
        Storage::put($this->basePath . '/finance.json', json_encode($this->sampleFinance(), JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
        Storage::put($this->basePath . '/marketplace/categories.json', json_encode($this->sampleMarketplaceCategories(), JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
        Storage::put($this->basePath . '/marketplace/products.json', json_encode($this->sampleMarketplaceProducts(80), JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
    }

    public function get(string $key): array
    {
        $this->ensureDemoData();
        $path = $this->basePath . '/' . $key . '.json';
        $raw = Storage::get($path);
        return json_decode($raw, true) ?: [];
    }

    private function sampleMarketplaceCategories(): array
    {
        return [
            ['id' => 1, 'name' => '電子產品', 'slug' => 'electronics', 'product_count' => 25],
            ['id' => 2, 'name' => '辦公用品', 'slug' => 'office-supplies', 'product_count' => 18],
            ['id' => 3, 'name' => '服裝配件', 'slug' => 'fashion', 'product_count' => 32],
            ['id' => 4, 'name' => '家居用品', 'slug' => 'home-goods', 'product_count' => 15],
        ];
    }

    private function sampleMarketplaceProducts(int $count = 80): array
    {
        $categories = [
            ['name' => '電子產品', 'slug' => 'electronics'],
            ['name' => '辦公用品', 'slug' => 'office-supplies'],
            ['name' => '服裝配件', 'slug' => 'fashion'],
            ['name' => '家居用品', 'slug' => 'home-goods']
        ];
        $names = [
            '無線藍牙耳機', '辦公桌椅組合', '商務背包', '智慧溫控水壺', 'USB-C 集線器',
            '人體工學鍵盤', '4K 螢幕', '降噪耳罩', '無線滑鼠', '藍光護目鏡',
        ];

        $products = [];
        for ($i = 0; $i < $count; $i++) {
            $cat = $categories[$i % count($categories)];
            $name = $names[$i % count($names)];
            $seed = urlencode($cat['slug'] . '-' . ($i + 1));
            $price = [2999, 8900, 1599, 799, 1290, 2490, 11990, 3590, 690, 980][($i + 3) % 10];
            $stockStatuses = ['in_stock', 'low_stock', 'out_of_stock'];
            $stock = $stockStatuses[$i % 3];
            $supplierId = ($i % 8) + 1;
            $products[] = [
                'id' => $i + 1,
                'name' => $name,
                'description' => $name . '，高品質嚴選，滿足日常與專業需求。',
                'price' => $price,
                'supplier_id' => $supplierId,
                'supplier' => ['company_name' => '供應商 ' . chr(65 + ($supplierId % 26))],
                'category' => $cat['name'],
                'images' => [
                    ['url' => "https://picsum.photos/seed/{$seed}-1/800/600"],
                    ['url' => "https://picsum.photos/seed/{$seed}-2/400/300"],
                ],
                'rating' => round(3.5 + ($i % 15) / 10, 1),
                'reviews_count' => 40 + ($i * 3 % 230),
                'in_stock' => $stock !== 'out_of_stock',
                'stock_status' => $stock,
                'is_featured' => $i % 7 === 0,
                'is_new_arrival' => $i % 5 === 0,
                'is_bestseller' => $i % 9 === 0,
                'minimum_order_quantity' => ($i % 3) + 1,
                'view_count' => 50 + ($i * 7 % 1000),
                'sku' => 'DEMO-' . str_pad((string)($i + 1), 4, '0', STR_PAD_LEFT),
                'brand' => '品牌 ' . chr(65 + ($i % 26)),
                'created_at' => time() - ($i * 86400)
            ];
        }
        return $products;
    }

    private function sampleInquiry(): array
    {
        return [
            'customer' => [
                'name' => '維克國際股份有限公司',
                'contact' => '王小明',
                'email' => 'buyer@example.com',
            ],
            'items' => [
                ['name' => '雲端訂閱A', 'quantity' => 10, 'unit_price' => 1200],
                ['name' => '技術支援(年)', 'quantity' => 1, 'unit_price' => 18000],
            ],
            'currency' => 'TWD',
            'notes' => '新客戶詢價示範，含年約折扣 5%',
        ];
    }

    private function sampleVip(): array
    {
        return [
            'customer' => ['name' => 'VIP 精品供應'],
            'tiers' => [
                ['level' => 'Gold', 'discount' => 0.15],
                ['level' => 'Silver', 'discount' => 0.1],
            ],
            'cart' => [
                ['name' => '高階方案', 'price' => 50000],
                ['name' => '延伸模組', 'price' => 12000],
            ],
            'currentTier' => 'Gold',
        ];
    }

    private function sampleInventory(): array
    {
        return [
            'low_stock' => [
                ['sku' => 'SKU-1001', 'product' => '智能感測器', 'available' => 8, 'reorder_point' => 15],
                ['sku' => 'SKU-2002', 'product' => '工業閘道器', 'available' => 5, 'reorder_point' => 10],
            ],
            'suggestion' => '以下項目建議建立採購單補貨。',
        ];
    }

    private function sampleFinance(): array
    {
        return [
            'kpis' => [
                ['label' => '本月營收', 'value' => 1245000],
                ['label' => '毛利率', 'value' => 0.43],
                ['label' => '逾期應收', 'value' => 182000],
            ],
            'trend' => [120, 132, 101, 134, 90, 230, 210],
        ];
    }
}


