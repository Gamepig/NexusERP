<?php

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\User;
use App\Models\Supplier;
use App\Models\PurchaseOrder;

// 取得測試用戶
$user = User::where('email', 'test@example.com')->first();
if (!$user) {
    echo "Test user not found\n";
    exit(1);
}

// 暫時禁用 RLS 策略來創建測試數據
DB::statement('SET row_security = OFF');

// 模擬用戶登入和公司環境
auth()->login($user);
$userCompany = $user->companies()->first();
if ($userCompany) {
    session(['current_company_id' => $userCompany->id]);
}

// 創建測試採購訂單
try {
    $supplier = Supplier::where('is_active', true)->first();
    if (!$supplier) {
        echo "No active supplier found\n";
        exit(1);
    }

    $po = PurchaseOrder::create([
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
        'company_id' => $user->companies()->first()->id ?? 1,
    ]);

    echo "Created PO: {$po->po_number}\n";
    echo "Status: {$po->status}\n";
    echo "Can Edit: " . ($po->canEdit() ? 'YES' : 'NO') . "\n";
    echo "Created by user: {$po->created_by_user_id}\n";
    echo "Company ID: {$po->company_id}\n";

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
} finally {
    // 重新啟用 RLS 策略
    DB::statement('SET row_security = ON');
}