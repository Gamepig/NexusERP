<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * 倉庫模型
 * 
 * 對應資料表：warehouses
 * 主要功能：管理倉庫資訊，包含地址、聯絡資訊等
 */
class Warehouse extends Model
{
    protected $table = 'warehouses';

    /**
     * 可大量賦值的欄位
     */
    protected $fillable = [
        'name',
        'code',
        'company_id',
        'address',
        'contact_info',
        'is_active',
        'created_by_user_id',
    ];

    /**
     * 欄位型別轉換
     */
    protected $casts = [
        'company_id' => 'integer',
        'address' => 'array',
        'contact_info' => 'array',
        'is_active' => 'boolean',
        'created_by_user_id' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * 公司關聯
     */
    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    /**
     * 庫存水準關聯
     */
    public function inventoryLevels(): HasMany
    {
        return $this->hasMany(InventoryLevel::class);
    }

    /**
     * 建立者關聯
     */
    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }

    /**
     * Scope: 啟用的倉庫
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope: 特定公司的倉庫
     */
    public function scopeForCompany($query, $companyId)
    {
        return $query->where('company_id', $companyId);
    }

    /**
     * 獲取倉庫的總庫存價值
     */
    public function getTotalInventoryValue(): float
    {
        return $this->inventoryLevels()
            ->join('products', 'products.id', '=', 'inventory_levels.product_id')
            ->sum(\DB::raw('inventory_levels.quantity_on_hand * products.cost_price'));
    }

    /**
     * 獲取倉庫的總產品數量
     */
    public function getTotalProductCount(): int
    {
        return $this->inventoryLevels()
            ->where('quantity_on_hand', '>', 0)
            ->count();
    }
}