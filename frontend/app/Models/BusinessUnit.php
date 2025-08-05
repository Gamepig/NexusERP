<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class BusinessUnit extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'company_id',
        'parent_id',
        'name',
        'display_name',
        'description',
        'type',
        'code',
        'email',
        'phone',
        'address',
        'is_active',
        'sort_order',
        'settings',
        'metadata',
        'created_by_user_id',
    ];

    protected $casts = [
        'address' => 'array',
        'settings' => 'array',
        'metadata' => 'array',
        'is_active' => 'boolean',
        'sort_order' => 'integer',
    ];

    /**
     * 所屬公司
     */
    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    /**
     * 上級業務單位
     */
    public function parent(): BelongsTo
    {
        return $this->belongsTo(BusinessUnit::class, 'parent_id');
    }

    /**
     * 下級業務單位
     */
    public function children(): HasMany
    {
        return $this->hasMany(BusinessUnit::class, 'parent_id');
    }

    /**
     * 業務單位的用戶
     */
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'user_business_units')
            ->withPivot(['is_primary', 'is_active', 'joined_at', 'left_at'])
            ->withTimestamps();
    }
}