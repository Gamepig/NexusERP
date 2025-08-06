# Mock數據與DEMO策略詳細實作

**階段**: 第二階段 - UI先行開發  
**預估時間**: 1-2週  
**優先級**: 🎭 展示效果核心  

---

## 🎯 **實作目標**

### **核心目標**
- 建立真實感十足的Mock數據系統
- 設計完整的DEMO展示場景
- 確保數據邏輯一致性與合理性
- 提供豐富的業務案例展示

### **成功指標**
- ✅ Mock數據覆蓋所有主要功能模組
- ✅ 數據關聯性邏輯完整正確
- ✅ DEMO場景流程順暢自然
- ✅ 展示效果專業且吸引人

---

## 📋 **Mock數據架構設計**

### **數據分層架構**

#### **基礎參考數據 (Reference Data)**
```php
<?php
// 檔案: database/seeders/ReferenceDataSeeder.php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\{Category, Unit, Currency, PaymentTerm};

class ReferenceDataSeeder extends Seeder
{
    public function run(): void
    {
        // 商品分類數據
        $categories = [
            ['name' => '辦公設備', 'code' => 'OFFICE', 'description' => '電腦、印表機、辦公桌椅等'],
            ['name' => '電子產品', 'code' => 'ELECTRONICS', 'description' => '手機、平板、配件等'],
            ['name' => '文具用品', 'code' => 'STATIONERY', 'description' => '筆記本、原子筆、文件夾等'],
            ['name' => '清潔用品', 'code' => 'CLEANING', 'description' => '清潔劑、垃圾袋、清潔工具等'],
            ['name' => '辦公家具', 'code' => 'FURNITURE', 'description' => '桌子、椅子、櫃子等'],
            ['name' => '網路設備', 'code' => 'NETWORK', 'description' => '路由器、交換器、線材等'],
            ['name' => '音響設備', 'code' => 'AUDIO', 'description' => '喇叭、麥克風、音響系統等'],
            ['name' => '安全設備', 'code' => 'SECURITY', 'description' => '監控攝影機、門禁系統等'],
        ];

        foreach ($categories as $category) {
            Category::create($category);
        }

        // 計量單位
        $units = [
            ['name' => '個', 'code' => 'PCS', 'type' => 'piece'],
            ['name' => '組', 'code' => 'SET', 'type' => 'set'],
            ['name' => '盒', 'code' => 'BOX', 'type' => 'container'],
            ['name' => '包', 'code' => 'PACK', 'type' => 'container'],
            ['name' => '公斤', 'code' => 'KG', 'type' => 'weight'],
            ['name' => '公尺', 'code' => 'M', 'type' => 'length'],
            ['name' => '台', 'code' => 'UNIT', 'type' => 'machine'],
            ['name' => '套', 'code' => 'SUITE', 'type' => 'set'],
        ];

        foreach ($units as $unit) {
            Unit::create($unit);
        }

        // 幣別設定
        $currencies = [
            ['code' => 'TWD', 'name' => '台幣', 'symbol' => 'NT$', 'rate' => 1.0],
            ['code' => 'USD', 'name' => '美金', 'symbol' => '$', 'rate' => 0.032],
            ['code' => 'EUR', 'name' => '歐元', 'symbol' => '€', 'rate' => 0.029],
            ['code' => 'JPY', 'name' => '日圓', 'symbol' => '¥', 'rate' => 4.6],
        ];

        foreach ($currencies as $currency) {
            Currency::create($currency);
        }

        // 付款條件
        $paymentTerms = [
            ['code' => 'NET_30', 'name' => '淨30天', 'days' => 30],
            ['code' => 'NET_15', 'name' => '淨15天', 'days' => 15],
            ['code' => 'NET_7', 'name' => '淨7天', 'days' => 7],
            ['code' => 'CASH', 'name' => '現金', 'days' => 0],
            ['code' => 'ADVANCE', 'name' => '預付款', 'days' => -7],
        ];

        foreach ($paymentTerms as $term) {
            PaymentTerm::create($term);
        }
    }
}
```

#### **公司與用戶數據**
```php
<?php
// 檔案: database/seeders/CompanyUserSeeder.php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\{Company, User};
use Illuminate\Support\Facades\Hash;

class CompanyUserSeeder extends Seeder
{
    public function run(): void
    {
        // 主要公司 (DEMO用)
        $mainCompany = Company::create([
            'name' => '科技創新有限公司',
            'name_en' => 'Tech Innovation Ltd.',
            'registration_number' => '12345678',
            'tax_id' => '12345678',
            'address' => '台北市信義區信義路五段7號35樓',
            'phone' => '+886-2-2345-6789',
            'email' => 'info@techinnovation.com.tw',
            'website' => 'https://techinnovation.com.tw',
            'established_date' => '2020-01-15',
            'capital' => 10000000,
            'employee_count' => 85,
            'industry' => '資訊軟體業',
            'description' => '專注於企業軟體解決方案的科技公司，提供ERP、CRM等系統服務。',
            'logo_url' => '/demo-assets/companies/tech-innovation-logo.png',
            'is_active' => true,
        ]);

        // 其他合作公司
        $companies = [
            [
                'name' => '智慧辦公用品股份有限公司',
                'name_en' => 'Smart Office Supplies Inc.',
                'registration_number' => '87654321',
                'tax_id' => '87654321',
                'address' => '新北市板橋區文化路一段188號12樓',
                'phone' => '+886-2-8951-2468',
                'email' => 'contact@smartoffice.com.tw',
                'industry' => '辦公用品批發業',
                'employee_count' => 156,
            ],
            [
                'name' => '綠色環保企業社',
                'name_en' => 'Green Eco Enterprise',
                'registration_number' => '13579246',
                'tax_id' => '13579246',
                'address' => '台中市南屯區惠中路三段99號8樓',
                'phone' => '+886-4-2315-7890',
                'email' => 'hello@greeneco.com.tw',
                'industry' => '環保服務業',
                'employee_count' => 42,
            ],
        ];

        foreach ($companies as $companyData) {
            Company::create($companyData);
        }

        // 系統管理員
        User::create([
            'name' => '系統管理員',
            'email' => 'admin@techinnovation.com.tw',
            'password' => Hash::make('admin123'),
            'company_id' => $mainCompany->id,
            'role' => 'admin',
            'department' => '資訊部',
            'position' => '系統管理員',
            'phone' => '+886-912-345-678',
            'is_active' => true,
            'email_verified_at' => now(),
        ]);

        // DEMO用戶角色
        $demoUsers = [
            [
                'name' => '王大明',
                'email' => 'sales.manager@techinnovation.com.tw',
                'role' => 'sales_manager',
                'department' => '業務部',
                'position' => '業務經理',
                'phone' => '+886-912-123-456',
            ],
            [
                'name' => '李小華',
                'email' => 'inventory.staff@techinnovation.com.tw',
                'role' => 'inventory_staff',
                'department' => '倉儲部',
                'position' => '庫存管理員',
                'phone' => '+886-912-234-567',
            ],
            [
                'name' => '張美玲',
                'email' => 'finance.officer@techinnovation.com.tw',
                'role' => 'finance_officer',
                'department' => '財務部',
                'position' => '財務專員',
                'phone' => '+886-912-345-678',
            ],
            [
                'name' => '陳志豪',
                'email' => 'purchase.manager@techinnovation.com.tw',
                'role' => 'purchase_manager',
                'department' => '採購部',
                'position' => '採購經理',
                'phone' => '+886-912-456-789',
            ],
        ];

        foreach ($demoUsers as $userData) {
            User::create(array_merge($userData, [
                'company_id' => $mainCompany->id,
                'password' => Hash::make('demo123'),
                'is_active' => true,
                'email_verified_at' => now(),
            ]));
        }
    }
}
```

#### **客戶數據生成**
```php
<?php
// 檔案: database/seeders/CustomerSeeder.php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Customer;
use Faker\Factory as Faker;

class CustomerSeeder extends Seeder
{
    public function run(): void
    {
        $faker = Faker::create('zh_TW');
        
        // 重點客戶 (DEMO用)
        $vipCustomers = [
            [
                'company_name' => '統一企業股份有限公司',
                'contact_name' => '林執行長',
                'email' => 'ceo@uni-president.com.tw',
                'phone' => '+886-6-243-3456',
                'address' => '台南市永康區鹽行里中正路301號',
                'customer_type' => 'corporate',
                'credit_limit' => 5000000,
                'payment_terms' => 'NET_30',
                'industry' => '食品製造業',
                'annual_revenue' => 150000000,
                'employee_count' => 2800,
                'is_vip' => true,
            ],
            [
                'company_name' => '台積電股份有限公司',
                'contact_name' => '張副總經理',
                'email' => 'procurement@tsmc.com',
                'phone' => '+886-3-568-2888',
                'address' => '新竹市東區力行六路8號',
                'customer_type' => 'corporate',
                'credit_limit' => 10000000,
                'payment_terms' => 'NET_15',
                'industry' => '半導體業',
                'annual_revenue' => 800000000,
                'employee_count' => 5600,
                'is_vip' => true,
            ],
            [
                'company_name' => '中華電信股份有限公司',
                'contact_name' => '趙採購主管',
                'email' => 'purchase@cht.com.tw',
                'phone' => '+886-2-2344-4123',
                'address' => '台北市中正區信義路一段21-3號',
                'customer_type' => 'corporate',
                'credit_limit' => 3000000,
                'payment_terms' => 'NET_30',
                'industry' => '電信業',
                'annual_revenue' => 220000000,
                'employee_count' => 2650,
                'is_vip' => true,
            ],
        ];

        foreach ($vipCustomers as $customer) {
            Customer::create(array_merge($customer, [
                'customer_code' => 'VIP' . str_pad(Customer::count() + 1, 4, '0', STR_PAD_LEFT),
                'created_at' => $faker->dateTimeBetween('-2 years', '-6 months'),
                'status' => 'active',
            ]));
        }

        // 一般企業客戶
        $corporateNames = [
            '永豐銀行', '玉山銀行', '國泰世華銀行', '中國信託', '富邦金控',
            '遠東集團', '新光集團', '宏碁電腦', '華碩電腦', '微星科技',
            '聯發科技', '瑞昱半導體', '日月光', '矽品精密', '京元電子',
            '統一超商', '全家便利商店', '家樂福', '大潤發', '愛買',
            '中華航空', '長榮航空', '台灣高鐵', '桃園機場', '台北101',
        ];

        foreach ($corporateNames as $name) {
            Customer::create([
                'customer_code' => 'COR' . str_pad(Customer::count() + 1, 4, '0', STR_PAD_LEFT),
                'company_name' => $name . ($faker->randomElement(['股份有限公司', '有限公司', '企業股份有限公司'])),
                'contact_name' => $faker->name,
                'email' => $faker->companyEmail,
                'phone' => '+886-' . $faker->randomElement(['2', '3', '4', '6', '7']) . '-' . $faker->numerify('####-####'),
                'address' => $faker->address,
                'customer_type' => 'corporate',
                'credit_limit' => $faker->randomFloat(0, 100000, 2000000),
                'payment_terms' => $faker->randomElement(['NET_30', 'NET_15', 'NET_7']),
                'industry' => $faker->randomElement([
                    '金融業', '科技業', '製造業', '零售業', '服務業', 
                    '建築業', '運輸業', '醫療業', '教育業', '餐飲業'
                ]),
                'annual_revenue' => $faker->randomFloat(0, 1000000, 50000000),
                'employee_count' => $faker->numberBetween(10, 500),
                'status' => $faker->randomElement(['active', 'active', 'active', 'inactive']),
                'created_at' => $faker->dateTimeBetween('-3 years', 'now'),
                'is_vip' => false,
            ]);
        }

        // 個人客戶
        for ($i = 0; $i < 30; $i++) {
            Customer::create([
                'customer_code' => 'IND' . str_pad(Customer::count() + 1, 4, '0', STR_PAD_LEFT),
                'company_name' => null,
                'contact_name' => $faker->name,
                'email' => $faker->email,
                'phone' => '+886-9' . $faker->numerify('##-###-###'),
                'address' => $faker->address,
                'customer_type' => 'individual',
                'credit_limit' => $faker->randomFloat(0, 10000, 100000),
                'payment_terms' => $faker->randomElement(['CASH', 'NET_7', 'NET_15']),
                'status' => 'active',
                'created_at' => $faker->dateTimeBetween('-2 years', 'now'),
                'is_vip' => false,
            ]);
        }
    }
}
```

#### **豐富的商品庫存數據**
```php
<?php
// 檔案: database/seeders/ProductInventorySeeder.php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\{Product, Category, Unit};
use Faker\Factory as Faker;

class ProductInventorySeeder extends Seeder
{
    public function run(): void
    {
        $faker = Faker::create('zh_TW');
        
        // 辦公設備類商品
        $officeProducts = [
            [
                'name' => 'MacBook Pro 14吋 M3晶片',
                'description' => '配備M3晶片的14吋MacBook Pro，8核心CPU，10核心GPU，16GB統一記憶體，512GB SSD儲存空間',
                'sku' => 'MBP-M3-14-512',
                'unit_price' => 72900,
                'cost_price' => 65000,
                'stock_quantity' => 15,
                'min_stock_level' => 5,
                'max_stock_level' => 50,
                'weight' => 1.6,
                'dimensions' => '31.26 x 22.12 x 1.55 cm',
                'warranty_period' => 12,
                'supplier_info' => 'Apple授權經銷商',
            ],
            [
                'name' => 'Dell OptiPlex 7000商用桌機',
                'description' => '第13代Intel Core i7處理器，16GB DDR4記憶體，512GB NVMe SSD，內建WiFi 6E',
                'sku' => 'DELL-OPT-7000-I7',
                'unit_price' => 45800,
                'cost_price' => 38000,
                'stock_quantity' => 8,
                'min_stock_level' => 3,
                'max_stock_level' => 20,
                'weight' => 5.2,
                'warranty_period' => 24,
            ],
            [
                'name' => 'HP LaserJet Pro M404dn雷射印表機',
                'description' => '黑白雷射印表機，列印速度每分鐘38頁，雙面列印，網路連接',
                'sku' => 'HP-LJ-M404DN',
                'unit_price' => 8900,
                'cost_price' => 7200,
                'stock_quantity' => 12,
                'min_stock_level' => 5,
                'max_stock_level' => 30,
                'weight' => 8.9,
            ],
            [
                'name' => 'Samsung 27吋 4K顯示器',
                'description' => '27吋 4K UHD (3840x2160) 解析度，IPS面板，HDR10支援，USB-C連接',
                'sku' => 'SAM-MON-27-4K',
                'unit_price' => 15800,
                'cost_price' => 12500,
                'stock_quantity' => 20,
                'min_stock_level' => 8,
                'max_stock_level' => 40,
                'weight' => 6.8,
            ],
        ];

        $officeCategory = Category::where('code', 'OFFICE')->first();
        $unitPcs = Unit::where('code', 'PCS')->first();

        foreach ($officeProducts as $productData) {
            Product::create(array_merge($productData, [
                'category_id' => $officeCategory->id,
                'unit_id' => $unitPcs->id,
                'status' => 'active',
                'is_featured' => true,
                'barcode' => $faker->ean13,
                'location' => 'A-' . $faker->numberBetween(1, 10) . '-' . $faker->numberBetween(1, 20),
                'created_at' => $faker->dateTimeBetween('-1 year', 'now'),
            ]));
        }

        // 電子產品類
        $electronicProducts = [
            [
                'name' => 'iPhone 15 Pro 256GB',
                'description' => '6.1吋Super Retina XDR顯示器，A17 Pro晶片，Pro級相機系統，鈦金屬設計',
                'sku' => 'IPH-15P-256-BL',
                'unit_price' => 39900,
                'cost_price' => 32000,
                'stock_quantity' => 25,
                'min_stock_level' => 10,
            ],
            [
                'name' => 'iPad Air 第5代 64GB WiFi',
                'description' => '10.9吋Liquid Retina顯示器，M1晶片，Touch ID，支援Apple Pencil第2代',
                'sku' => 'IPAD-AIR5-64-GY',
                'unit_price' => 18900,
                'cost_price' => 15500,
                'stock_quantity' => 18,
                'min_stock_level' => 8,
            ],
            [
                'name' => 'AirPods Pro 第2代',
                'description' => '主動式降噪，空間音訊，MagSafe充電盒，最長可播放6小時',
                'sku' => 'APP-PRO2-WH',
                'unit_price' => 7490,
                'cost_price' => 6200,
                'stock_quantity' => 35,
                'min_stock_level' => 15,
            ],
        ];

        $electronicsCategory = Category::where('code', 'ELECTRONICS')->first();
        
        foreach ($electronicProducts as $productData) {
            Product::create(array_merge($productData, [
                'category_id' => $electronicsCategory->id,
                'unit_id' => $unitPcs->id,
                'status' => 'active',
                'is_featured' => true,
                'barcode' => $faker->ean13,
                'location' => 'B-' . $faker->numberBetween(1, 8) . '-' . $faker->numberBetween(1, 15),
                'weight' => $faker->randomFloat(2, 0.1, 2.0),
                'warranty_period' => 12,
                'created_at' => $faker->dateTimeBetween('-8 months', 'now'),
            ]));
        }

        // 文具用品類 (大量商品)
        $stationeryProducts = [
            '原子筆', '鉛筆', '橡皮擦', '尺規', '剪刀', '膠帶', '訂書機', '釘書針',
            'A4影印紙', '文件夾', '資料夾', '便利貼', '筆記本', '日曆', '計算機', '白板筆',
            '簽字筆', '螢光筆', '修正液', '長尾夾', '迴紋針', '橡皮筋', '膠水', '美工刀',
        ];

        $stationeryCategory = Category::where('code', 'STATIONERY')->first();
        $unitBox = Unit::where('code', 'BOX')->first();
        $unitPack = Unit::where('code', 'PACK')->first();

        foreach ($stationeryProducts as $productName) {
            $brand = $faker->randomElement(['3M', 'PILOT', 'UNI', 'ZEBRA', 'STAEDTLER', '雄獅', '利百代']);
            $unit = $faker->randomElement([$unitPcs, $unitBox, $unitPack]);
            
            Product::create([
                'name' => $brand . ' ' . $productName,
                'description' => '高品質' . $productName . '，適合辦公室及學校使用',
                'sku' => strtoupper($brand) . '-' . str_pad(Product::count() + 1, 4, '0', STR_PAD_LEFT),
                'category_id' => $stationeryCategory->id,
                'unit_id' => $unit->id,
                'unit_price' => $faker->randomFloat(0, 15, 500),
                'cost_price' => function($price) { return $price * 0.7; },
                'stock_quantity' => $faker->numberBetween(20, 200),
                'min_stock_level' => $faker->numberBetween(5, 20),
                'max_stock_level' => $faker->numberBetween(100, 300),
                'weight' => $faker->randomFloat(2, 0.01, 1.0),
                'barcode' => $faker->ean13,
                'location' => 'C-' . $faker->numberBetween(1, 15) . '-' . $faker->numberBetween(1, 30),
                'status' => 'active',
                'created_at' => $faker->dateTimeBetween('-6 months', 'now'),
            ]);
        }

        // 模擬一些低庫存和缺貨商品
        $lowStockProducts = Product::inRandomOrder()->limit(8)->get();
        foreach ($lowStockProducts as $product) {
            $product->update([
                'stock_quantity' => $faker->numberBetween(0, $product->min_stock_level - 1)
            ]);
        }
    }
}
```

---

## 🎭 **DEMO展示場景設計**

### **場景1：新客戶詢價流程**

#### **場景腳本**
```php
<?php
// 檔案: app/Services/DemoScenarioService.php

namespace App\Services;

use App\Models\{Customer, Product, Quote, QuoteItem};
use Illuminate\Support\Collection;

class DemoScenarioService
{
    /**
     * 場景1：新客戶詢價完整流程
     */
    public function newCustomerInquiryScenario(): array
    {
        // 1. 新客戶資料
        $newCustomer = [
            'company_name' => '創新科技新創公司',
            'contact_name' => '林創辦人',
            'email' => 'founder@innovatetech.com.tw',
            'phone' => '+886-987-654-321',
            'address' => '台北市內湖區瑞光路100號5樓',
            'customer_type' => 'corporate',
            'industry' => '軟體開發業',
            'employee_count' => 25,
            'inquiry_source' => '官網聯絡表單',
            'requirements' => '新辦公室設備採購，預算約150萬元',
        ];

        // 2. 詢價商品清單 (新創公司典型需求)
        $inquiryItems = [
            [
                'product_name' => 'MacBook Pro 14吋 M3晶片',
                'quantity' => 8,
                'requirement' => '開發團隊使用',
                'priority' => 'high',
            ],
            [
                'product_name' => 'Dell OptiPlex 7000商用桌機',
                'quantity' => 5,
                'requirement' => '行政、業務人員使用',
                'priority' => 'high',
            ],
            [
                'product_name' => 'Samsung 27吋 4K顯示器',
                'quantity' => 13,
                'requirement' => '所有員工雙螢幕配置',
                'priority' => 'high',
            ],
            [
                'product_name' => 'HP LaserJet Pro M404dn雷射印表機',
                'quantity' => 2,
                'requirement' => '辦公室文件列印',
                'priority' => 'medium',
            ],
            [
                'product_name' => 'TP-LINK Archer AX6000 WiFi 6路由器',
                'quantity' => 1,
                'requirement' => '辦公室無線網路',
                'priority' => 'high',
            ],
            [
                'product_name' => '升降辦公桌',
                'quantity' => 13,
                'requirement' => '員工健康工作環境',
                'priority' => 'medium',
            ],
            [
                'product_name' => '人體工學辦公椅',
                'quantity' => 13,
                'requirement' => '舒適的工作座椅',
                'priority' => 'medium',
            ],
        ];

        // 3. 報價策略
        $quotingStrategy = [
            'discount_approach' => 'volume_based',
            'payment_terms' => 'NET_30',
            'delivery_schedule' => '分批交貨：設備優先，家具次之',
            'warranty_terms' => '標準保固 + 免費到府安裝',
            'special_offers' => [
                '新客戶首次採購9折優惠',
                '訂單滿100萬免運費',
                '免費提供3個月技術支援',
            ],
        ];

        return [
            'customer' => $newCustomer,
            'inquiry_items' => $inquiryItems,
            'strategy' => $quotingStrategy,
            'estimated_total' => 1456780,
            'expected_margin' => 0.25,
            'follow_up_actions' => [
                '24小時內電話聯繫',
                '安排現場勘查',
                '提供客製化解決方案',
            ],
        ];
    }

    /**
     * 場景2：VIP客戶大宗採購
     */
    public function vipBulkPurchaseScenario(): array
    {
        $vipCustomer = Customer::where('company_name', '台積電股份有限公司')->first();

        $bulkItems = [
            [
                'category' => '辦公設備',
                'items' => [
                    ['name' => 'MacBook Pro 16吋 M3 Max', 'quantity' => 50, 'unit_price' => 98900],
                    ['name' => 'iPhone 15 Pro Max 512GB', 'quantity' => 100, 'unit_price' => 49900],
                    ['name' => 'iPad Pro 12.9吋 256GB', 'quantity' => 30, 'unit_price' => 32900],
                ],
            ],
            [
                'category' => '網路設備',
                'items' => [
                    ['name' => 'Cisco Catalyst 9300交換器', 'quantity' => 20, 'unit_price' => 185000],
                    ['name' => 'Fortinet FortiGate防火牆', 'quantity' => 5, 'unit_price' => 320000],
                ],
            ],
        ];

        return [
            'customer' => $vipCustomer,
            'project_name' => '新竹廠區辦公設備更新專案',
            'budget_range' => '2000-2500萬',
            'decision_timeline' => '2個月',
            'bulk_items' => $bulkItems,
            'special_requirements' => [
                '分期付款（3期）',
                '專案管理服務',
                '現場技術支援',
                '設備回收處理',
            ],
            'competitive_advantages' => [
                '長期合作優惠價格',
                '專屬客戶經理',
                '優先交貨保證',
                '24/7技術支援',
            ],
        ];
    }

    /**
     * 場景3：庫存警示處理
     */
    public function inventoryAlertScenario(): array
    {
        // 獲取低庫存商品
        $lowStockProducts = Product::where('stock_quantity', '<=', \DB::raw('min_stock_level'))
                                 ->with(['category', 'unit'])
                                 ->orderBy('stock_quantity', 'asc')
                                 ->limit(10)
                                 ->get();

        // 缺貨商品
        $outOfStockProducts = Product::where('stock_quantity', 0)
                                   ->with(['category', 'unit'])
                                   ->limit(5)
                                   ->get();

        // 建議採購清單
        $purchaseRecommendations = $lowStockProducts->map(function ($product) {
            $avgMonthlyUsage = $this->calculateAverageMonthlyUsage($product->id);
            $recommendedQuantity = max(
                $product->max_stock_level - $product->stock_quantity,
                $avgMonthlyUsage * 3 // 3個月安全庫存
            );

            return [
                'product' => $product,
                'current_stock' => $product->stock_quantity,
                'min_level' => $product->min_stock_level,
                'max_level' => $product->max_stock_level,
                'recommended_quantity' => $recommendedQuantity,
                'estimated_cost' => $recommendedQuantity * $product->cost_price,
                'avg_monthly_usage' => $avgMonthlyUsage,
                'urgency_level' => $product->stock_quantity == 0 ? 'critical' : 
                                 ($product->stock_quantity < ($product->min_stock_level * 0.5) ? 'high' : 'medium'),
            ];
        });

        return [
            'alert_summary' => [
                'total_low_stock' => $lowStockProducts->count(),
                'total_out_of_stock' => $outOfStockProducts->count(),
                'estimated_revenue_impact' => $this->calculateRevenueImpact($outOfStockProducts),
            ],
            'low_stock_products' => $lowStockProducts,
            'out_of_stock_products' => $outOfStockProducts,
            'purchase_recommendations' => $purchaseRecommendations,
            'automated_actions' => [
                'email_alerts_sent' => true,
                'supplier_notifications' => true,
                'alternative_products_suggested' => true,
            ],
        ];
    }

    /**
     * 計算月平均使用量
     */
    private function calculateAverageMonthlyUsage(int $productId): int
    {
        // 模擬計算邏輯 (實際應從銷售/出庫記錄計算)
        return rand(5, 25);
    }

    /**
     * 計算缺貨影響收入
     */
    private function calculateRevenueImpact(Collection $outOfStockProducts): float
    {
        return $outOfStockProducts->sum(function ($product) {
            $avgMonthlySales = $this->calculateAverageMonthlyUsage($product->id);
            return $avgMonthlySales * $product->unit_price;
        });
    }
}
```

### **場景4：財務報表分析DEMO**

#### **動態數據生成**
```php
<?php
// 檔案: app/Services/DemoFinancialService.php

namespace App\Services;

use Carbon\Carbon;
use Illuminate\Support\Collection;

class DemoFinancialService
{
    /**
     * 生成銷售趨勢數據
     */
    public function generateSalesTrendData(int $months = 12): array
    {
        $data = [];
        $baseRevenue = 2500000; // 基礎月收入250萬
        
        for ($i = $months - 1; $i >= 0; $i--) {
            $date = Carbon::now()->subMonths($i);
            
            // 模擬季節性變化
            $seasonalFactor = 1 + sin(($date->month - 1) * M_PI / 6) * 0.3;
            
            // 模擬成長趨勢
            $growthFactor = 1 + ($months - $i) * 0.02;
            
            // 添加隨機波動
            $randomFactor = 0.8 + (mt_rand() / mt_getrandmax()) * 0.4;
            
            $revenue = $baseRevenue * $seasonalFactor * $growthFactor * $randomFactor;
            
            $data[] = [
                'month' => $date->format('Y-m'),
                'month_name' => $date->format('Y年m月'),
                'revenue' => round($revenue, 0),
                'orders' => round($revenue / 45000), // 平均訂單金額4.5萬
                'new_customers' => round(($revenue / 45000) * 0.3), // 30%新客戶
                'profit_margin' => 0.22 + (mt_rand() / mt_getrandmax()) * 0.08, // 22-30%毛利率
            ];
        }
        
        return $data;
    }

    /**
     * 生成客戶分佈數據
     */
    public function generateCustomerDistributionData(): array
    {
        return [
            'by_type' => [
                ['type' => '企業客戶', 'count' => 156, 'revenue' => 18500000, 'percentage' => 75.2],
                ['type' => '個人客戶', 'count' => 328, 'revenue' => 6100000, 'percentage' => 24.8],
            ],
            'by_industry' => [
                ['industry' => '科技業', 'count' => 45, 'revenue' => 8200000, 'percentage' => 33.3],
                ['industry' => '製造業', 'count' => 38, 'revenue' => 6800000, 'percentage' => 27.6],
                ['industry' => '金融業', 'count' => 25, 'revenue' => 4500000, 'percentage' => 18.3],
                ['industry' => '服務業', 'count' => 32, 'revenue' => 3200000, 'percentage' => 13.0],
                ['industry' => '其他', 'count' => 16, 'revenue' => 1900000, 'percentage' => 7.8],
            ],
            'by_region' => [
                ['region' => '台北市', 'count' => 98, 'revenue' => 12500000, 'percentage' => 50.8],
                ['region' => '新北市', 'count' => 67, 'revenue' => 7200000, 'percentage' => 29.3],
                ['region' => '桃園市', 'count' => 28, 'revenue' => 2800000, 'percentage' => 11.4],
                ['region' => '台中市', 'count' => 15, 'revenue' => 1400000, 'percentage' => 5.7],
                ['region' => '其他縣市', 'count' => 12, 'revenue' => 700000, 'percentage' => 2.8],
            ],
        ];
    }

    /**
     * 生成商品績效數據
     */
    public function generateProductPerformanceData(): array
    {
        $topProducts = [
            ['name' => 'MacBook Pro 14吋 M3晶片', 'sales' => 45, 'revenue' => 3280500, 'margin' => 0.18],
            ['name' => 'iPhone 15 Pro 256GB', 'sales' => 78, 'revenue' => 3112200, 'margin' => 0.22],
            ['name' => 'Dell OptiPlex 7000商用桌機', 'sales' => 52, 'revenue' => 2381600, 'margin' => 0.24],
            ['name' => 'Samsung 27吋 4K顯示器', 'sales' => 125, 'revenue' => 1975000, 'margin' => 0.28],
            ['name' => 'HP LaserJet Pro M404dn', 'sales' => 89, 'revenue' => 792100, 'margin' => 0.32],
        ];

        $categoryPerformance = [
            ['category' => '辦公設備', 'revenue' => 15800000, 'margin' => 0.25, 'growth' => 0.15],
            ['category' => '電子產品', 'revenue' => 6200000, 'margin' => 0.20, 'growth' => 0.08],
            ['category' => '網路設備', 'revenue' => 1800000, 'margin' => 0.35, 'growth' => 0.22],
            ['category' => '辦公家具', 'revenue' => 800000, 'margin' => 0.40, 'growth' => -0.05],
        ];

        return [
            'top_products' => $topProducts,
            'category_performance' => $categoryPerformance,
            'inventory_turnover' => [
                'fast_moving' => 35, // 商品數量
                'slow_moving' => 12,
                'dead_stock' => 3,
                'average_turnover_days' => 45,
            ],
        ];
    }
}
```

---

## 🎨 **視覺化DEMO組件**

### **互動式儀表板組件**
```php
<?php
// 檔案: resources/views/components/demo/interactive-dashboard.blade.php

@props(['demoData'])

<div class="demo-dashboard" x-data="demoDashboard()" x-init="initializeDemo()">
    <!-- DEMO控制面板 -->
    <div class="demo-controls bg-blue-50 border-l-4 border-blue-400 p-4 mb-6 rounded-lg">
        <div class="flex items-center justify-between">
            <div class="demo-info">
                <h3 class="text-lg font-semibold text-blue-900">🎭 DEMO展示模式</h3>
                <p class="text-blue-700 text-sm">
                    當前場景：<span x-text="currentScenario.name" class="font-medium"></span>
                </p>
            </div>
            <div class="demo-actions space-x-2">
                <select x-model="selectedScenario" @change="changeScenario()" 
                        class="px-3 py-1 border border-blue-300 rounded text-sm">
                    <option value="overview">系統概覽</option>
                    <option value="new_customer">新客戶詢價</option>
                    <option value="vip_bulk">VIP大宗採購</option>
                    <option value="inventory_alert">庫存警示</option>
                </select>
                <button @click="startAutoDemo()" 
                        class="px-4 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600">
                    自動展示
                </button>
                <button @click="resetDemo()" 
                        class="px-4 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600">
                    重置
                </button>
            </div>
        </div>
    </div>

    <!-- 場景化數據展示 -->
    <div class="scenario-content">
        <!-- 概覽場景 -->
        <div x-show="selectedScenario === 'overview'" class="overview-scenario">
            <div class="stats-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <x-demo.animated-stat-card
                    title="本月營收"
                    :value="$demoData['monthly_revenue']"
                    :change="15.8"
                    format="currency"
                    icon="currency-dollar"
                    color="green"
                />
                <x-demo.animated-stat-card
                    title="活躍客戶"
                    :value="$demoData['active_customers']"
                    :change="8.2"
                    format="number"
                    icon="users"
                    color="blue"
                />
                <x-demo.animated-stat-card
                    title="庫存商品"
                    :value="$demoData['inventory_count']"
                    :change="-2.1"
                    format="number"
                    icon="cube"
                    color="purple"
                />
                <x-demo.animated-stat-card
                    title="待處理報價"
                    :value="$demoData['pending_quotes']"
                    :change="23.5"
                    format="number"
                    icon="document-text"
                    color="yellow"
                />
            </div>

            <!-- 銷售趨勢圖表 -->
            <div class="charts-section grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div class="chart-container bg-white p-6 rounded-lg shadow-sm">
                    <h3 class="text-lg font-semibold mb-4">銷售趨勢</h3>
                    <canvas id="salesTrendChart" width="400" height="200"></canvas>
                </div>
                <div class="chart-container bg-white p-6 rounded-lg shadow-sm">
                    <h3 class="text-lg font-semibold mb-4">客戶分佈</h3>
                    <canvas id="customerDistributionChart" width="400" height="200"></canvas>
                </div>
            </div>
        </div>

        <!-- 新客戶詢價場景 -->
        <div x-show="selectedScenario === 'new_customer'" class="new-customer-scenario">
            <div class="scenario-header mb-6">
                <h2 class="text-xl font-bold text-gray-900">新客戶詢價處理流程</h2>
                <p class="text-gray-600">展示從客戶詢價到報價產出的完整流程</p>
            </div>

            <!-- 進度條 -->
            <div class="process-steps mb-8">
                <x-demo.process-timeline 
                    :steps="['客戶詢價', '需求分析', '商品匹配', '價格計算', '報價產出']"
                    :current="demoStep"
                />
            </div>

            <!-- 步驟內容 -->
            <div class="step-content bg-white rounded-lg shadow-sm p-6">
                <div x-show="demoStep === 1">
                    <h3 class="text-lg font-semibold mb-4">📧 客戶詢價資訊</h3>
                    <x-demo.customer-inquiry :data="$demoData['new_customer_inquiry']" />
                </div>

                <div x-show="demoStep === 2">
                    <h3 class="text-lg font-semibold mb-4">🔍 需求分析結果</h3>
                    <x-demo.requirement-analysis :data="$demoData['requirement_analysis']" />
                </div>

                <div x-show="demoStep === 3">
                    <h3 class="text-lg font-semibold mb-4">🎯 智慧商品匹配</h3>
                    <x-demo.product-matching :data="$demoData['product_matching']" />
                </div>

                <div x-show="demoStep === 4">
                    <h3 class="text-lg font-semibold mb-4">💰 動態價格計算</h3>
                    <x-demo.pricing-calculation :data="$demoData['pricing_calculation']" />
                </div>

                <div x-show="demoStep === 5">
                    <h3 class="text-lg font-semibold mb-4">📄 報價單產出</h3>
                    <x-demo.quote-output :data="$demoData['quote_output']" />
                </div>
            </div>

            <!-- 控制按鈕 -->
            <div class="demo-nav flex justify-between mt-6">
                <button @click="previousStep()" 
                        :disabled="demoStep <= 1"
                        class="px-4 py-2 bg-gray-500 text-white rounded disabled:opacity-50">
                    上一步
                </button>
                <button @click="nextStep()" 
                        :disabled="demoStep >= 5"
                        class="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50">
                    下一步
                </button>
            </div>
        </div>
    </div>
</div>

@push('scripts')
<script>
function demoDashboard() {
    return {
        selectedScenario: 'overview',
        demoStep: 1,
        autoDemo: false,
        currentScenario: {
            name: '系統概覽',
            description: '整體系統功能展示'
        },
        
        initializeDemo() {
            this.loadScenarioData();
            this.initializeCharts();
        },
        
        changeScenario() {
            this.demoStep = 1;
            this.loadScenarioData();
            
            // 更新場景資訊
            const scenarios = {
                'overview': { name: '系統概覽', description: '整體系統功能展示' },
                'new_customer': { name: '新客戶詢價', description: '完整詢價處理流程' },
                'vip_bulk': { name: 'VIP大宗採購', description: '大客戶專案處理' },
                'inventory_alert': { name: '庫存警示', description: '智慧庫存管理' }
            };
            
            this.currentScenario = scenarios[this.selectedScenario];
        },
        
        loadScenarioData() {
            // 根據選擇的場景載入對應數據
            fetch(`/demo/scenario/${this.selectedScenario}`)
                .then(response => response.json())
                .then(data => {
                    this.updateDemoData(data);
                });
        },
        
        startAutoDemo() {
            this.autoDemo = true;
            this.runAutoDemo();
        },
        
        runAutoDemo() {
            if (!this.autoDemo) return;
            
            setTimeout(() => {
                if (this.demoStep < 5) {
                    this.nextStep();
                    this.runAutoDemo();
                } else {
                    this.autoDemo = false;
                }
            }, 3000); // 每3秒自動下一步
        },
        
        nextStep() {
            if (this.demoStep < 5) {
                this.demoStep++;
                this.animateStepTransition();
            }
        },
        
        previousStep() {
            if (this.demoStep > 1) {
                this.demoStep--;
                this.animateStepTransition();
            }
        },
        
        animateStepTransition() {
            // 添加步驟切換動畫效果
            const content = document.querySelector('.step-content');
            content.style.opacity = '0';
            content.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                content.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                content.style.opacity = '1';
                content.style.transform = 'translateY(0)';
            }, 100);
        },
        
        resetDemo() {
            this.selectedScenario = 'overview';
            this.demoStep = 1;
            this.autoDemo = false;
            this.changeScenario();
        },
        
        initializeCharts() {
            // 初始化 Chart.js 圖表
            this.initSalesTrendChart();
            this.initCustomerDistributionChart();
        },
        
        initSalesTrendChart() {
            const ctx = document.getElementById('salesTrendChart').getContext('2d');
            new Chart(ctx, {
                type: 'line',
                data: {
                    labels: @json($demoData['sales_trend']['labels']),
                    datasets: [{
                        label: '銷售額',
                        data: @json($demoData['sales_trend']['data']),
                        borderColor: 'rgb(59, 130, 246)',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: function(value) {
                                    return 'NT$' + (value / 1000000).toFixed(1) + 'M';
                                }
                            }
                        }
                    }
                }
            });
        },
        
        initCustomerDistributionChart() {
            const ctx = document.getElementById('customerDistributionChart').getContext('2d');
            new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: @json($demoData['customer_distribution']['labels']),
                    datasets: [{
                        data: @json($demoData['customer_distribution']['data']),
                        backgroundColor: [
                            'rgb(59, 130, 246)',
                            'rgb(16, 185, 129)',
                            'rgb(245, 158, 11)',
                            'rgb(239, 68, 68)',
                            'rgb(139, 92, 246)'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false
                }
            });
        }
    }
}
</script>
@endpush
```

---

## 🚀 **DEMO部署與優化**

### **Demo環境配置**
```bash
# 檔案: scripts/setup-demo-environment.sh

#!/bin/bash

echo "🎭 設定NexusERP DEMO展示環境..."

# 1. 載入Demo數據
echo "📊 載入Demo數據..."
php artisan migrate:fresh --seed --seeder=DemoSeeder

# 2. 生成Demo資源
echo "🖼️ 生成Demo圖片資源..."
php artisan demo:generate-images

# 3. 建立Demo用戶帳號
echo "👥 建立Demo用戶帳號..."
php artisan demo:create-users

# 4. 設定Demo模式
echo "🔧 啟用Demo模式..."
php artisan config:set demo.mode=true
php artisan config:set demo.auto_reset=true

# 5. 優化效能
echo "⚡ 優化Demo效能..."
php artisan route:cache
php artisan view:cache
php artisan config:cache

# 6. 啟動Demo監控
echo "📈 啟動Demo使用監控..."
php artisan demo:start-monitoring

echo "✅ Demo環境設定完成！"
echo "🌐 存取網址: http://localhost:8000/demo"
echo "📧 Demo帳號: demo@nexuserp.com | 密碼: demo123"
```

### **自動重置機制**
```php
<?php
// 檔案: app/Console/Commands/ResetDemoData.php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\DemoResetService;

class ResetDemoData extends Command
{
    protected $signature = 'demo:reset {--force : 強制重置不詢問}';
    protected $description = '重置Demo數據到初始狀態';

    public function handle(DemoResetService $resetService): int
    {
        if (!config('demo.mode')) {
            $this->error('系統未處於Demo模式');
            return 1;
        }

        if (!$this->option('force') && !$this->confirm('確定要重置所有Demo數據嗎？')) {
            $this->info('操作已取消');
            return 0;
        }

        $this->info('開始重置Demo數據...');
        
        $progressBar = $this->output->createProgressBar(6);
        
        // 1. 清除暫存數據
        $progressBar->setMessage('清除暫存數據...');
        $resetService->clearTempData();
        $progressBar->advance();
        
        // 2. 重置數據庫
        $progressBar->setMessage('重置數據庫...');
        $resetService->resetDatabase();
        $progressBar->advance();
        
        // 3. 重新載入種子數據
        $progressBar->setMessage('載入種子數據...');
        $resetService->seedDemoData();
        $progressBar->advance();
        
        // 4. 重新生成圖片
        $progressBar->setMessage('重新生成圖片...');
        $resetService->regenerateImages();
        $progressBar->advance();
        
        // 5. 清除快取
        $progressBar->setMessage('清除快取...');
        $resetService->clearCaches();
        $progressBar->advance();
        
        // 6. 重新建立索引
        $progressBar->setMessage('重建搜尋索引...');
        $resetService->rebuildSearchIndex();
        $progressBar->advance();
        
        $progressBar->finish();
        
        $this->newLine(2);
        $this->info('✅ Demo數據重置完成！');
        
        return 0;
    }
}
```

---

## 🎯 **驗收標準**

### **功能驗收**
- [ ] Mock數據覆蓋所有主要功能模組
- [ ] 數據邏輯關聯性正確完整
- [ ] DEMO場景流程順暢自然
- [ ] 視覺化效果專業美觀

### **效果驗收**
- [ ] 展示數據真實感十足
- [ ] 業務場景貼近實際需求
- [ ] 互動體驗流暢直觀
- [ ] 技術展示突出系統優勢

### **技術驗收**
- [ ] 數據生成效率高
- [ ] Demo重置機制可靠
- [ ] 效能表現穩定
- [ ] 錯誤處理完善

---

**下一階段**: [07_後端邏輯補完計劃.md](./07_後端邏輯補完計劃.md)