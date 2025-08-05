<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * 庫存水準模型
 * 
 * 對應資料表：inventory_levels
 * 主要功能：管理產品在各倉庫的庫存水準，包含現有數量、可用數量、保留數量等
 */
class InventoryLevel extends Model
{
    protected $table = 'inventory_levels';

    /**
     * 複合主鍵：(product_id, warehouse_id)
     */
    protected $primaryKey = ['product_id', 'warehouse_id'];
    public $incrementing = false;

    /**
     * 可大量賦值的欄位
     */
    protected $fillable = [
        'product_id',
        'warehouse_id',
        'quantity_on_hand',
        'quantity_available',
        'quantity_reserved',
        'quantity_on_order',
        'reorder_point',
        'max_stock_level',
        'last_updated_at',
    ];

    /**
     * 欄位型別轉換
     */
    protected $casts = [
        'product_id' => 'integer',
        'warehouse_id' => 'integer',
        'quantity_on_hand' => 'integer',
        'quantity_available' => 'integer',
        'quantity_reserved' => 'integer',
        'quantity_on_order' => 'integer',
        'reorder_point' => 'integer',
        'max_stock_level' => 'integer',
        'last_updated_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * 產品關聯
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * 倉庫關聯
     */
    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class);
    }

    /**
     * 檢查是否低庫存
     */
    public function isLowStock(): bool
    {
        return $this->quantity_available <= $this->reorder_point;
    }

    /**
     * 檢查是否缺貨
     */
    public function isOutOfStock(): bool
    {
        return $this->quantity_available <= 0;
    }

    /**
     * 獲取可用庫存百分比
     */
    public function getAvailablePercentage(): float
    {
        if ($this->max_stock_level <= 0) {
            return 0.0;
        }
        return ($this->quantity_available / $this->max_stock_level) * 100;
    }

    /**
     * Scope: 低庫存產品
     */
    public function scopeLowStock($query)
    {
        return $query->whereColumn('quantity_available', '<=', 'reorder_point');
    }

    /**
     * Scope: 缺貨產品
     */
    public function scopeOutOfStock($query)
    {
        return $query->where('quantity_available', '<=', 0);
    }

    /**
     * Scope: 特定產品
     */
    public function scopeForProduct($query, $productId)
    {
        return $query->where('product_id', $productId);
    }

    /**
     * Scope: 特定倉庫
     */
    public function scopeForWarehouse($query, $warehouseId)
    {
        return $query->where('warehouse_id', $warehouseId);
    }

    /**
     * 支援複合主鍵的 getKeyForSaveQuery 方法
     */
    protected function getKeyForSaveQuery()
    {
        if (is_array($this->primaryKey)) {
            $keys = [];
            foreach ($this->primaryKey as $key) {
                $keys[$key] = $this->getAttribute($key);
            }
            return $keys;
        }
        return parent::getKeyForSaveQuery();
    }

    /**
     * 支援複合主鍵的 setKeysForSaveQuery 方法
     */
    protected function setKeysForSaveQuery($query)
    {
        if (is_array($this->primaryKey)) {
            foreach ($this->primaryKey as $key) {
                $query->where($key, '=', $this->getAttribute($key));
            }
            return $query;
        }
        return parent::setKeysForSaveQuery($query);
    }

    /**
     * 支援複合主鍵的 getQueueableId 方法
     */
    public function getQueueableId()
    {
        if (is_array($this->primaryKey)) {
            $values = [];
            foreach ($this->primaryKey as $key) {
                $values[] = $this->getAttribute($key);
            }
            return implode('|', $values);
        }
        return parent::getQueueableId();
    }
}