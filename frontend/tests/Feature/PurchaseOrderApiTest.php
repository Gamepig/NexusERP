<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Supplier;
use App\Models\Product;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderItem;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;

/**
 * Purchase Order API 功能測試
 * 
 * 測試 Purchase Order API 的完整 CRUD 操作和業務流程
 */
class PurchaseOrderApiTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    protected User $user;
    protected Supplier $supplier;
    protected Product $product;

    protected function setUp(): void
    {
        parent::setUp();

        // 建立測試用戶
        $this->user = User::factory()->create();

        // 建立測試供應商
        $this->supplier = Supplier::create([
            'name' => '測試供應商',
            'code' => 'SUP00001',
            'contact_person' => '張經理',
            'email' => 'zhang@supplier-test.com',
            'phone' => '02-1234-5678',
            'status' => Supplier::STATUS_ACTIVE,
            'payment_terms' => '30天',
            'credit_limit' => 1000000.00,
        ]);

        // 建立測試產品
        $this->product = Product::create([
            'name' => '測試產品 A',
            'code' => 'PRD000001',
            'sku' => 'TEST001',
            'description' => '測試用產品',
            'category' => '電子產品',
            'unit' => '個',
            'unit_price' => 100.00,
            'cost_price' => 80.00,
            'stock_quantity' => 50,
            'minimum_stock' => 10,
            'maximum_stock' => 100,
            'status' => Product::STATUS_ACTIVE,
        ]);
    }

    /**
     * 測試取得採購單列表
     */
    public function test_can_get_purchase_orders_list(): void
    {
        // 建立測試採購單
        $purchaseOrder = PurchaseOrder::create([
            'po_number' => 'PO20250725001',
            'supplier_id' => $this->supplier->id,
            'status' => PurchaseOrder::STATUS_DRAFT,
            'order_date' => now()->toDateString(),
            'currency' => 'TWD',
            'created_by_user_id' => $this->user->id,
            'subtotal' => 1000.00,
            'tax_amount' => 50.00,
            'total_amount' => 1050.00,
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->getJson('/api/purchase-orders');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'data' => [
                        '*' => [
                            'id',
                            'po_number',
                            'supplier',
                            'status',
                            'order_date',
                            'total_amount',
                            'created_at',
                        ]
                    ],
                    'current_page',
                    'per_page',
                    'total',
                ]
            ])
            ->assertJson([
                'success' => true,
            ]);
    }

    /**
     * 測試創建採購單 - 成功案例
     */
    public function test_can_create_purchase_order_successfully(): void
    {
        $purchaseOrderData = [
            'supplier_id' => $this->supplier->id,
            'order_date' => now()->toDateString(),
            'expected_delivery_date' => now()->addDays(7)->toDateString(),
            'delivery_address' => [
                'street' => '台北市信義區信義路五段7號',
                'city' => '台北市',
                'postal_code' => '110',
                'country' => '台灣',
            ],
            'currency' => 'TWD',
            'payment_terms' => '30天',
            'notes' => '測試採購單',
            'items' => [
                [
                    'product_id' => $this->product->id,
                    'quantity' => 10,
                    'unit_price' => 100.00,
                    'notes' => '測試採購明細',
                ]
            ]
        ];

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/purchase-orders', $purchaseOrderData);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'id',
                    'po_number',
                    'supplier_id',
                    'status',
                    'order_date',
                    'subtotal',
                    'tax_amount',
                    'total_amount',
                    'created_by_user_id',
                    'items' => [
                        '*' => [
                            'id',
                            'product_id',
                            'quantity',
                            'unit_price',
                            'line_total',
                        ]
                    ]
                ]
            ])
            ->assertJson([
                'success' => true,
                'data' => [
                    'supplier_id' => $this->supplier->id,
                    'status' => PurchaseOrder::STATUS_DRAFT,
                    'created_by_user_id' => $this->user->id,
                    'subtotal' => 1000.00, // 10 * 100
                    'tax_amount' => 50.00,  // 1000 * 0.05
                    'total_amount' => 1050.00, // 1000 + 50
                ]
            ]);

        // 驗證資料庫中的記錄
        $this->assertDatabaseHas('purchase_orders', [
            'supplier_id' => $this->supplier->id,
            'status' => PurchaseOrder::STATUS_DRAFT,
            'created_by_user_id' => $this->user->id,
        ]);

        $this->assertDatabaseHas('purchase_order_items', [
            'product_id' => $this->product->id,
            'quantity' => 10,
            'unit_price' => 100.00,
            'line_total' => 1000.00,
        ]);
    }

    /**
     * 測試創建採購單 - 驗證失敗案例
     */
    public function test_cannot_create_purchase_order_with_invalid_data(): void
    {
        $invalidData = [
            'supplier_id' => 999, // 不存在的供應商
            'items' => [], // 空的明細
        ];

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/purchase-orders', $invalidData);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['supplier_id', 'items']);
    }

    /**
     * 測試創建採購單 - 停用供應商
     */
    public function test_cannot_create_purchase_order_with_inactive_supplier(): void
    {
        // 停用供應商
        $this->supplier->update(['status' => Supplier::STATUS_INACTIVE]);

        $purchaseOrderData = [
            'supplier_id' => $this->supplier->id,
            'items' => [
                [
                    'product_id' => $this->product->id,
                    'quantity' => 5,
                    'unit_price' => 100.00,
                ]
            ]
        ];

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/purchase-orders', $purchaseOrderData);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'message' => '供應商不存在或未啟用',
            ]);
    }

    /**
     * 測試創建採購單 - 停用產品
     */
    public function test_cannot_create_purchase_order_with_inactive_product(): void
    {
        // 停用產品
        $this->product->update(['status' => Product::STATUS_INACTIVE]);

        $purchaseOrderData = [
            'supplier_id' => $this->supplier->id,
            'items' => [
                [
                    'product_id' => $this->product->id,
                    'quantity' => 5,
                    'unit_price' => 100.00,
                ]
            ]
        ];

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/purchase-orders', $purchaseOrderData);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'message' => '部分產品不存在或未啟用',
            ]);
    }

    /**
     * 測試查看採購單詳情
     */
    public function test_can_show_purchase_order_details(): void
    {
        $purchaseOrder = PurchaseOrder::create([
            'po_number' => 'PO20250725001',
            'supplier_id' => $this->supplier->id,
            'status' => PurchaseOrder::STATUS_DRAFT,
            'order_date' => now()->toDateString(),
            'currency' => 'TWD',
            'created_by_user_id' => $this->user->id,
            'subtotal' => 1000.00,
            'tax_amount' => 50.00,
            'total_amount' => 1050.00,
        ]);

        PurchaseOrderItem::create([
            'purchase_order_id' => $purchaseOrder->id,
            'product_id' => $this->product->id,
            'quantity' => 10,
            'unit_price' => 100.00,
            'line_total' => 1000.00,
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->getJson("/api/purchase-orders/{$purchaseOrder->id}");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'id',
                    'po_number',
                    'supplier',
                    'creator',
                    'items' => [
                        '*' => [
                            'id',
                            'product',
                            'quantity',
                            'unit_price',
                            'line_total',
                        ]
                    ]
                ]
            ])
            ->assertJson([
                'success' => true,
                'data' => [
                    'id' => $purchaseOrder->id,
                    'po_number' => 'PO20250725001',
                ]
            ]);
    }

    /**
     * 測試更新採購單
     */
    public function test_can_update_purchase_order(): void
    {
        $purchaseOrder = PurchaseOrder::create([
            'po_number' => 'PO20250725001',
            'supplier_id' => $this->supplier->id,
            'status' => PurchaseOrder::STATUS_DRAFT,
            'order_date' => now()->toDateString(),
            'currency' => 'TWD',
            'created_by_user_id' => $this->user->id,
            'subtotal' => 1000.00,
            'tax_amount' => 50.00,
            'total_amount' => 1050.00,
        ]);

        $updateData = [
            'supplier_id' => $this->supplier->id,
            'notes' => '更新後的備註',
            'items' => [
                [
                    'product_id' => $this->product->id,
                    'quantity' => 20, // 更新數量
                    'unit_price' => 90.00, // 更新單價
                ]
            ]
        ];

        $response = $this->actingAs($this->user, 'sanctum')
            ->putJson("/api/purchase-orders/{$purchaseOrder->id}", $updateData);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'notes' => '更新後的備註',
                ]
            ]);

        // 驗證資料庫更新
        $this->assertDatabaseHas('purchase_orders', [
            'id' => $purchaseOrder->id,
            'notes' => '更新後的備註',
        ]);
    }

    /**
     * 測試刪除採購單
     */
    public function test_can_delete_draft_purchase_order(): void
    {
        $purchaseOrder = PurchaseOrder::create([
            'po_number' => 'PO20250725001',
            'supplier_id' => $this->supplier->id,
            'status' => PurchaseOrder::STATUS_DRAFT,
            'order_date' => now()->toDateString(),
            'currency' => 'TWD',
            'created_by_user_id' => $this->user->id,
            'subtotal' => 1000.00,
            'tax_amount' => 50.00,
            'total_amount' => 1050.00,
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->deleteJson("/api/purchase-orders/{$purchaseOrder->id}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => '採購單刪除成功',
            ]);

        // 驗證資料庫中的記錄已刪除
        $this->assertDatabaseMissing('purchase_orders', [
            'id' => $purchaseOrder->id,
        ]);
    }

    /**
     * 測試不能刪除非草稿狀態的採購單
     */
    public function test_cannot_delete_non_draft_purchase_order(): void
    {
        $purchaseOrder = PurchaseOrder::create([
            'po_number' => 'PO20250725001',
            'supplier_id' => $this->supplier->id,
            'status' => PurchaseOrder::STATUS_SUBMITTED, // 已送出狀態
            'order_date' => now()->toDateString(),
            'currency' => 'TWD',
            'created_by_user_id' => $this->user->id,
            'subtotal' => 1000.00,
            'tax_amount' => 50.00,
            'total_amount' => 1050.00,
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->deleteJson("/api/purchase-orders/{$purchaseOrder->id}");

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'message' => '只有草稿狀態的採購單才能刪除',
            ]);
    }

    /**
     * 測試送出採購單審核
     */
    public function test_can_submit_purchase_order_for_approval(): void
    {
        $purchaseOrder = PurchaseOrder::create([
            'po_number' => 'PO20250725001',
            'supplier_id' => $this->supplier->id,
            'status' => PurchaseOrder::STATUS_DRAFT,
            'order_date' => now()->toDateString(),
            'currency' => 'TWD',
            'created_by_user_id' => $this->user->id,
            'subtotal' => 1000.00,
            'tax_amount' => 50.00,
            'total_amount' => 1050.00,
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson("/api/purchase-orders/{$purchaseOrder->id}/submit");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => '採購單已送出審核',
                'data' => [
                    'status' => PurchaseOrder::STATUS_SUBMITTED,
                ]
            ]);
    }

    /**
     * 測試核准採購單
     */
    public function test_can_approve_purchase_order(): void
    {
        $purchaseOrder = PurchaseOrder::create([
            'po_number' => 'PO20250725001',
            'supplier_id' => $this->supplier->id,
            'status' => PurchaseOrder::STATUS_SUBMITTED,
            'order_date' => now()->toDateString(),
            'currency' => 'TWD',
            'created_by_user_id' => $this->user->id,
            'subtotal' => 1000.00,
            'tax_amount' => 50.00,
            'total_amount' => 1050.00,
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson("/api/purchase-orders/{$purchaseOrder->id}/approve");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => '採購單已核准',
                'data' => [
                    'status' => PurchaseOrder::STATUS_APPROVED,
                    'approved_by_user_id' => $this->user->id,
                ]
            ]);
    }

    /**
     * 測試取消採購單
     */
    public function test_can_cancel_purchase_order(): void
    {
        $purchaseOrder = PurchaseOrder::create([
            'po_number' => 'PO20250725001',
            'supplier_id' => $this->supplier->id,
            'status' => PurchaseOrder::STATUS_SUBMITTED,
            'order_date' => now()->toDateString(),
            'currency' => 'TWD',
            'created_by_user_id' => $this->user->id,
            'subtotal' => 1000.00,
            'tax_amount' => 50.00,
            'total_amount' => 1050.00,
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson("/api/purchase-orders/{$purchaseOrder->id}/cancel");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => '採購單已取消',
                'data' => [
                    'status' => PurchaseOrder::STATUS_CANCELLED,
                ]
            ]);
    }

    /**
     * 測試未登入用戶無法存取 API
     */
    public function test_unauthenticated_user_cannot_access_api(): void
    {
        $response = $this->getJson('/api/purchase-orders');

        $response->assertStatus(401);
    }

    /**
     * 測試 PO 編號自動產生的唯一性
     */
    public function test_po_number_generation_uniqueness(): void
    {
        $purchaseOrderData = [
            'supplier_id' => $this->supplier->id,
            'items' => [
                [
                    'product_id' => $this->product->id,
                    'quantity' => 5,
                    'unit_price' => 100.00,
                ]
            ]
        ];

        // 建立第一個採購單
        $response1 = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/purchase-orders', $purchaseOrderData);

        // 建立第二個採購單
        $response2 = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/purchase-orders', $purchaseOrderData);

        $response1->assertStatus(201);
        $response2->assertStatus(201);

        $po1 = $response1->json('data.po_number');
        $po2 = $response2->json('data.po_number');

        // 確保 PO 編號不相同
        $this->assertNotEquals($po1, $po2);
    }
}