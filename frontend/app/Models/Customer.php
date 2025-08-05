<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * 客戶模型
 */
class Customer extends Model
{
    use HasFactory;

    protected $fillable = [
        'customer_code',
        'name',
        'company_name',
        'customer_type',
        'status',
        'primary_email',
        'primary_phone',
        'address_line1',
        'address_line2',
        'city',
        'state',
        'postal_code',
        'country',
        'tax_id',
        'credit_limit',
        'payment_terms',
        'discount_percentage',
        'industry',
        'customer_segment',
        'lead_source',
        'assigned_sales_rep_id',
        'notes',
        'created_by_user_id',
        'company_id',
    ];

    protected $casts = [
        'credit_limit' => 'decimal:2',
        'discount_percentage' => 'decimal:2',
        'payment_terms' => 'integer',
        'assigned_sales_rep_id' => 'integer',
        'company_id' => 'integer',
    ];

    // 客戶類型
    const TYPE_INDIVIDUAL = 'individual';
    const TYPE_BUSINESS = 'business';
    const TYPE_ORGANIZATION = 'organization';

    // 客戶狀態
    const STATUS_ACTIVE = 'active';
    const STATUS_INACTIVE = 'inactive';
    const STATUS_BLACKLISTED = 'blacklisted';

    // 客戶分級
    const SEGMENT_PREMIUM = 'premium';
    const SEGMENT_STANDARD = 'standard';
    const SEGMENT_BUDGET = 'budget';
    const SEGMENT_VIP = 'vip';

    /**
     * 啟用狀態的客戶
     */
    public function scopeActive($query)
    {
        return $query->where('status', self::STATUS_ACTIVE);
    }

    /**
     * 非啟用狀態的客戶
     */
    public function scopeInactive($query)
    {
        return $query->where('status', '!=', self::STATUS_ACTIVE);
    }

    /**
     * 依類型篩選
     */
    public function scopeByType($query, $type)
    {
        return $query->where('customer_type', $type);
    }

    /**
     * 依分級篩選
     */
    public function scopeBySegment($query, $segment)
    {
        return $query->where('customer_segment', $segment);
    }

    /**
     * 關聯：所屬公司
     */
    public function company()
    {
        return $this->belongsTo(Company::class);
    }

    /**
     * 關聯：銷售訂單
     */
    public function salesOrders()
    {
        return $this->hasMany(SalesOrder::class);
    }
}