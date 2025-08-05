<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Company extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'display_name',
        'code',
        'description',
        'registration_number',
        'tax_number',
        'email',
        'phone',
        'website',
        'address',
        'industry',
        'size',
        'currency',
        'timezone',
        'locale',
        'is_active',
        'settings',
        'metadata',
        'created_by_user_id',
    ];

    protected $casts = [
        'address' => 'array',
        'settings' => 'array',
        'metadata' => 'array',
        'is_active' => 'boolean',
    ];

    /**
     * 公司的業務單位
     */
    public function businessUnits(): HasMany
    {
        return $this->hasMany(BusinessUnit::class);
    }

    /**
     * 公司的用戶
     */
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'user_companies')
            ->withPivot(['is_primary', 'is_active', 'joined_at', 'left_at', 'role'])
            ->withTimestamps();
    }

    /**
     * 公司的客戶
     */
    public function customers(): HasMany
    {
        return $this->hasMany(Customer::class);
    }

    /**
     * 公司的產品
     */
    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }

    /**
     * 公司的供應商
     */
    public function suppliers(): HasMany
    {
        return $this->hasMany(Supplier::class);
    }

    /**
     * 公司的邀請記錄
     */
    public function invitations(): HasMany
    {
        return $this->hasMany(CompanyInvitation::class);
    }

    /**
     * 取得公司的主要業務單位
     */
    public function primaryBusinessUnit()
    {
        return $this->businessUnits()->where('is_active', true)->first();
    }

    /**
     * 產生公司代碼
     */
    public static function generateCode(string $name): string
    {
        $code = strtoupper(substr($name, 0, 5));
        
        // 確保代碼唯一
        $counter = 1;
        $originalCode = $code;
        while (self::where('code', $code)->exists()) {
            $code = $originalCode . $counter;
            $counter++;
        }
        
        return $code;
    }
}