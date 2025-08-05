<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * 採購單明細模型
 * 
 * 對應資料表：purchase_order_items
 * 主要功能：採購單明細管理、收貨記錄、倉庫管理
 */
class PurchaseOrderItem extends Model
{
    use HasFactory;

    protected $table = 'purchase_order_items';

    /**
     * 可大量賦值的欄位
     */
    protected $fillable = [
        'purchase_order_id',
        'product_id',
        'quantity',
        'unit_price',
        'line_total',
        'quantity_received',
        'warehouse_id',
        'notes',
    ];

    /**
     * 欄位型別轉換
     */
    protected $casts = [
        'quantity' => 'integer',
        'unit_price' => 'decimal:2',
        'line_total' => 'decimal:2',
        'quantity_received' => 'integer',
        'warehouse_id' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * 採購單關聯
     */
    public function purchaseOrder(): BelongsTo
    {
        return $this->belongsTo(PurchaseOrder::class);
    }

    /**
     * 產品關聯
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * 倉庫關聯（暫時註解，等倉庫模組完成後再啟用）
     */
    // public function warehouse(): BelongsTo
    // {
    //     return $this->belongsTo(Warehouse::class);
    // }

    /**
     * 計算行總額
     */
    public function calculateLineTotal(): void
    {
        $this->line_total = $this->quantity * $this->unit_price;
    }

    /**
     * 檢查是否完全收貨
     */
    public function isFullyReceived(): bool
    {
        return $this->quantity_received >= $this->quantity;
    }

    /**
     * 檢查是否部分收貨
     */
    public function isPartiallyReceived(): bool
    {
        return $this->quantity_received > 0 && $this->quantity_received < $this->quantity;
    }

    /**
     * 檢查是否未收貨
     */
    public function isNotReceived(): bool
    {
        return $this->quantity_received == 0;
    }

    /**
     * 取得待收貨數量
     */
    public function getPendingQuantityAttribute(): int
    {
        return $this->quantity - $this->quantity_received;
    }

    /**
     * 取得收貨進度百分比
     */
    public function getReceiveProgressAttribute(): float
    {
        if ($this->quantity == 0) {
            return 0;
        }
        return ($this->quantity_received / $this->quantity) * 100;
    }

    /**
     * 記錄收貨
     */
    public function receiveGoods(int $receivedQuantity, ?int $warehouseId = null): bool
    {
        if ($receivedQuantity <= 0) {
            return false;
        }

        if ($this->quantity_received + $receivedQuantity > $this->quantity) {
            return false; // 不能超過原訂數量
        }

        $this->quantity_received += $receivedQuantity;
        
        if ($warehouseId) {
            $this->warehouse_id = $warehouseId;
        }

        return $this->save();
    }

    /**
     * 取消部分收貨記錄
     */
    public function cancelReceive(int $cancelQuantity): bool
    {
        if ($cancelQuantity <= 0 || $cancelQuantity > $this->quantity_received) {
            return false;
        }

        $this->quantity_received -= $cancelQuantity;
        return $this->save();
    }

    /**
     * Scope: 依採購單篩選
     */
    public function scopeByPurchaseOrder($query, int $purchaseOrderId)
    {
        return $query->where('purchase_order_id', $purchaseOrderId);
    }

    /**
     * Scope: 依產品篩選
     */
    public function scopeByProduct($query, int $productId)
    {
        return $query->where('product_id', $productId);
    }

    /**
     * Scope: 未完全收貨的明細
     */
    public function scopeNotFullyReceived($query)
    {
        return $query->whereRaw('quantity_received < quantity');
    }

    /**
     * Scope: 已完全收貨的明細
     */
    public function scopeFullyReceived($query)
    {
        return $query->whereRaw('quantity_received >= quantity');
    }

    /**
     * 自動觸發器：儲存前計算行總額
     */
    protected static function boot()
    {
        parent::boot();

        static::saving(function ($item) {
            $item->calculateLineTotal();
        });
    }
}