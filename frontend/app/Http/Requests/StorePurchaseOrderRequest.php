<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * 採購單創建/更新請求驗證
 * 
 * 驗證採購單的所有必要欄位和業務規則
 */
class StorePurchaseOrderRequest extends FormRequest
{
    /**
     * 判斷用戶是否有權執行此請求
     */
    public function authorize(): bool
    {
        return true; // 暫時允許所有請求以進行測試
    }

    /**
     * 取得驗證規則
     */
    public function rules(): array
    {
        $rules = [
            // 採購單基本資訊
            'supplier_id' => [
                'required',  
                'integer',
                Rule::exists('suppliers', 'id')->where('is_active', true),
            ],
            'order_date' => [
                'nullable',
                'date',
                'after_or_equal:' . now()->subDays(30)->toDateString(),
                'before_or_equal:' . now()->addDays(365)->toDateString(),
            ],
            'expected_delivery_date' => [
                'nullable',
                'date',
                'after:order_date',
            ],
            'delivery_address' => [
                'nullable',
                'array',
            ],
            'delivery_address.street' => [
                'nullable',
                'string',
                'max:255',
            ],
            'delivery_address.city' => [
                'nullable',
                'string',
                'max:100',
            ],
            'delivery_address.postal_code' => [
                'nullable',
                'string',
                'max:20',
            ],
            'delivery_address.country' => [
                'nullable',
                'string',
                'max:100',
            ],
            'currency' => [
                'nullable',
                'string',
                'in:TWD,USD,EUR,JPY,CNY',
            ],
            'payment_terms' => [
                'nullable',
                'string',
                'max:500',
            ],
            'notes' => [
                'nullable',
                'string',
                'max:1000',
            ],
            'status' => [
                'nullable',
                'string',
                'in:draft,pending_approval,approved,partially_received,received,cancelled',
            ],
            'tax_rate' => [
                'nullable',
                'numeric',
                'min:0',
                'max:1',
            ],

            // 採購單明細
            'items' => [
                'required',
                'array',
                'min:1',
                'max:100', // 限制最多100項明細
            ],
            'items.*.product_id' => [
                'required',
                'integer', 
                Rule::exists('products', 'id')->where('is_active', true),
            ],
            'items.*.quantity' => [
                'required',
                'integer',
                'min:1',
                'max:999999',
            ],
            'items.*.unit_price' => [
                'required',
                'numeric',
                'min:0.01',
                'max:999999.99',
            ],
            'items.*.warehouse_id' => [
                'nullable',
                'integer',
                'exists:warehouses,id',
            ],
            'items.*.notes' => [
                'nullable',
                'string',
                'max:500',
            ],
        ];

        return $rules;
    }

    /**
     * 取得自訂驗證訊息
     */
    public function messages(): array
    {
        return [
            // 採購單基本資訊
            'supplier_id.required' => '請選擇供應商',
            'supplier_id.exists' => '選擇的供應商不存在或已停用',
            'order_date.after_or_equal' => '訂單日期不能早於30天前',
            'order_date.before_or_equal' => '訂單日期不能晚於一年後',
            'expected_delivery_date.after' => '預期交貨日期必須晚於訂單日期',
            'currency.in' => '幣別必須為 TWD, USD, EUR, JPY, CNY 其中之一',
            'payment_terms.max' => '付款條件不能超過500個字元',
            'notes.max' => '備註不能超過1000個字元',
            'status.in' => '狀態必須為 draft, pending_approval, approved, partially_received, received, cancelled 其中之一',
            'tax_rate.min' => '稅率不能小於0',
            'tax_rate.max' => '稅率不能大於100%',

            // 採購單明細
            'items.required' => '至少需要一項採購明細',
            'items.min' => '至少需要一項採購明細',
            'items.max' => '採購明細不能超過100項',
            'items.*.product_id.required' => '請選擇產品',
            'items.*.product_id.exists' => '選擇的產品不存在或已停用',
            'items.*.quantity.required' => '請輸入數量',
            'items.*.quantity.min' => '數量至少為1',
            'items.*.quantity.max' => '數量不能超過999999',
            'items.*.unit_price.required' => '請輸入單價',
            'items.*.unit_price.min' => '單價必須大於0',
            'items.*.unit_price.max' => '單價不能超過999999.99',
            'items.*.warehouse_id.exists' => '選擇的倉庫不存在',
            'items.*.notes.max' => '明細備註不能超過500個字元',

            // 地址相關
            'delivery_address.street.max' => '街道地址不能超過255個字元',
            'delivery_address.city.max' => '城市不能超過100個字元',
            'delivery_address.postal_code.max' => '郵遞區號不能超過20個字元',
            'delivery_address.country.max' => '國家不能超過100個字元',
        ];
    }

    /**
     * 取得自訂驗證屬性名稱
     */
    public function attributes(): array
    {
        return [
            'supplier_id' => '供應商',
            'order_date' => '訂單日期',
            'expected_delivery_date' => '預期交貨日期',
            'delivery_address' => '送貨地址',
            'currency' => '幣別',
            'payment_terms' => '付款條件',
            'notes' => '備註',
            'status' => '狀態',
            'tax_rate' => '稅率',
            'items' => '採購明細',
            'items.*.product_id' => '產品',
            'items.*.quantity' => '數量',
            'items.*.unit_price' => '單價',
            'items.*.warehouse_id' => '倉庫',
            'items.*.notes' => '明細備註',
        ];
    }

    /**
     * 配置驗證器實例
     */
    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            // 檢查重複的產品
            $productIds = collect($this->items ?? [])->pluck('product_id');
            if ($productIds->count() !== $productIds->unique()->count()) {
                $validator->errors()->add('items', '採購明細中不能有重複的產品');
            }

            // 檢查總金額是否合理
            $totalAmount = 0;
            foreach ($this->items ?? [] as $index => $item) {
                if (isset($item['quantity']) && isset($item['unit_price'])) {
                    $lineTotal = $item['quantity'] * $item['unit_price'];
                    $totalAmount += $lineTotal;

                    // 檢查單行金額是否過大
                    if ($lineTotal > 10000000) { // 1000萬
                        $validator->errors()->add(
                            "items.{$index}.unit_price",
                            "該項目總金額過大，請檢查數量和單價"
                        );
                    }
                }
            }

            // 檢查採購單總金額
            if ($totalAmount > 50000000) { // 5000萬
                $validator->errors()->add('items', '採購單總金額過大，請分批處理');
            }

            // 檢查預期交貨日期的業務邏輯
            if ($this->filled('expected_delivery_date') && $this->filled('order_date')) {
                $orderDate = \Carbon\Carbon::parse($this->order_date);
                $deliveryDate = \Carbon\Carbon::parse($this->expected_delivery_date);
                
                // 交貨日期不能超過訂單日期後2年
                if ($deliveryDate->diffInDays($orderDate) > 730) {
                    $validator->errors()->add(
                        'expected_delivery_date',
                        '預期交貨日期不能超過訂單日期後2年'
                    );
                }
            }
        });
    }

    /**
     * 準備驗證的資料
     */
    protected function prepareForValidation(): void
    {
        // 如果沒有提供訂單日期，使用今天
        if (!$this->filled('order_date')) {
            $this->merge([
                'order_date' => now()->toDateString(),
            ]);
        }

        // 如果沒有提供幣別，使用台幣
        if (!$this->filled('currency')) {
            $this->merge([
                'currency' => 'TWD',
            ]);
        }

        // 處理 items 數據 - 支援 JSON 陣列格式
        if ($this->has('items') && is_array($this->items)) {
            $items = [];
            foreach ($this->items as $item) {
                if (isset($item['product_id'], $item['quantity'], $item['unit_price'])) {
                    $items[] = [
                        'product_id' => (int) $item['product_id'],
                        'quantity' => (int) $item['quantity'],
                        'unit_price' => (float) $item['unit_price'],
                        'warehouse_id' => isset($item['warehouse_id']) ? (int) $item['warehouse_id'] : null,
                        'notes' => $item['notes'] ?? null,
                    ];
                }
            }
            
            $this->merge([
                'items' => $items,
            ]);
        }

        // 清理並格式化地址資料
        if ($this->has('delivery_address') && is_array($this->delivery_address)) {
            $address = array_filter($this->delivery_address, function ($value) {
                return !is_null($value) && $value !== '';
            });
            
            $this->merge([
                'delivery_address' => $address ?: null,
            ]);
        }
    }
}