<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Supplier;
use App\Models\PurchaseOrder;
use App\Models\Product;
use App\Models\PurchaseOrderItem;

class TestPurchaseOrderSeeder extends Seeder
{
    /**
     * 建立測試採購訂單數據
     */
    public function run(): void
    {
        // 暫時禁用 RLS 策略
        \DB::statement('SET row_security = OFF');
        
        try {
        // 取得測試用戶
        $user = User::where('email', 'test@example.com')->first();
        if (!$user) {
            $this->command->error('Test user not found. Please create test@example.com first.');
            return;
        }

        // 模擬用戶登入
        auth()->login($user);
        
        // 取得用戶的公司 ID
        $userCompany = $user->companies()->first();
        if ($userCompany) {
            session(['current_company_id' => $userCompany->id]);
        }

        // 取得第一個供應商
        $supplier = Supplier::where('is_active', true)->first();
        if (!$supplier) {
            $this->command->error('No active supplier found.');
            return;
        }

        // 創建測試採購訂單
        $purchaseOrder = PurchaseOrder::create([
            'po_number' => 'PO202508010001',
            'supplier_id' => $supplier->id,
            'status' => 'draft',
            'order_date' => now(),
            'expected_delivery_date' => now()->addDays(7),
            'subtotal' => 1000.00,
            'tax_amount' => 50.00,
            'total_amount' => 1050.00,
            'currency' => 'TWD',
            'payment_terms' => 'Net 30',
            'notes' => '測試採購訂單 - 用於權限測試',
            'created_by_user_id' => $user->id,
            'company_id' => $userCompany ? $userCompany->id : 1,
        ]);

        // 取得一些產品來創建訂單項目
        $products = Product::where('is_active', true)->take(2)->get();
        
        foreach ($products as $index => $product) {
            PurchaseOrderItem::create([
                'purchase_order_id' => $purchaseOrder->id,
                'product_id' => $product->id,
                'quantity' => 10 + ($index * 5),
                'unit_price' => 50.00 + ($index * 10),
                'total_price' => (10 + ($index * 5)) * (50.00 + ($index * 10)),
            ]);
        }

        $this->command->info("Created test purchase order: {$purchaseOrder->po_number}");
        $this->command->info("Status: {$purchaseOrder->status}");
        $this->command->info("Can Edit: " . ($purchaseOrder->canEdit() ? 'YES' : 'NO'));
        
        } catch (\Exception $e) {
            $this->command->error("Error: " . $e->getMessage());
        } finally {
            // 重新啟用 RLS 策略
            \DB::statement('SET row_security = ON');
        }
    }
}