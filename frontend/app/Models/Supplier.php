<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * 供應商模型
 * 
 * 對應資料表：suppliers
 * 主要功能：供應商基本資訊管理、採購單關聯
 */
class Supplier extends Model
{
    use HasFactory;

    protected $table = 'suppliers';

    /**
     * 可大量賦值的欄位
     */
    protected $fillable = [
        'name',
        'code',
        'contact_person',
        'email',
        'phone',
        'address',
        'tax_id',
        'payment_terms',
        'credit_limit',
        'is_active',
        'notes',
        'company_id',
    ];

    /**
     * 欄位型別轉換
     */
    protected $casts = [
        'address' => 'array',
        'credit_limit' => 'decimal:2',
        'is_active' => 'boolean',
        'company_id' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * 檢查是否為啟用狀態 (使用 is_active 欄位)
     */
    public function getStatusAttribute(): string
    {
        return $this->is_active ? 'active' : 'inactive';
    }
    
    /**
     * 取得狀態顯示文字
     */
    public function getStatusTextAttribute(): string
    {
        return $this->is_active ? '啟用' : '停用';
    }

    /**
     * 關聯：所屬公司
     */
    public function company()
    {
        return $this->belongsTo(Company::class);
    }

    /**
     * 採購單關聯
     */
    public function purchaseOrders(): HasMany
    {
        return $this->hasMany(PurchaseOrder::class);
    }

    /**
     * 檢查是否為啟用狀態
     */
    public function isActive(): bool
    {
        return (bool) $this->is_active;
    }

    /**
     * 檢查是否為停用狀態
     */
    public function isInactive(): bool
    {
        return !$this->is_active;
    }

    /**
     * Scope: 依狀態篩選
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope: 依狀態篩選
     */
    public function scopeInactive($query)
    {
        return $query->where('is_active', false);
    }

    /**
     * 產生供應商代碼（基於當前公司）
     */
    public static function generateCode(): string
    {
        $prefix = 'SUP';
        $companyId = session('current_company_id');
        
        if ($companyId) {
            // 基於公司的供應商計數
            $count = static::where('company_id', $companyId)->count() + 1;
        } else {
            // 回退到全域計數
            $count = static::count() + 1;
        }
        
        return $prefix . str_pad($count, 5, '0', STR_PAD_LEFT);
    }
}