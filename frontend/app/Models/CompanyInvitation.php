<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * 公司邀請模型
 * 
 * 管理用戶邀請加入公司的邀請記錄
 * 
 * @property int $id
 * @property int $company_id
 * @property string $email
 * @property string $role
 * @property int $invited_by_user_id
 * @property string $token
 * @property \Carbon\Carbon $expires_at
 * @property \Carbon\Carbon|null $accepted_at
 * @property int|null $accepted_by_user_id
 * @property array|null $business_unit_ids
 * @property string|null $message
 * @property \Carbon\Carbon $created_at
 * @property \Carbon\Carbon $updated_at
 */
class CompanyInvitation extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'company_id',
        'email',
        'role',
        'invited_by_user_id',
        'token',
        'expires_at',
        'accepted_at',
        'accepted_by_user_id',
        'business_unit_ids',
        'message',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'expires_at' => 'datetime',
        'accepted_at' => 'datetime',
        'business_unit_ids' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * 關聯到公司
     */
    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    /**
     * 關聯到邀請者
     */
    public function invitedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'invited_by_user_id');
    }

    /**
     * 關聯到接受邀請的用戶
     */
    public function acceptedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'accepted_by_user_id');
    }

    /**
     * 檢查邀請是否已過期
     */
    public function isExpired(): bool
    {
        return $this->expires_at->isPast();
    }

    /**
     * 檢查邀請是否已被接受
     */
    public function isAccepted(): bool
    {
        return !is_null($this->accepted_at);
    }

    /**
     * 檢查邀請是否仍然有效
     */
    public function isValid(): bool
    {
        return !$this->isExpired() && !$this->isAccepted();
    }

    /**
     * 獲取邀請的狀態
     */
    public function getStatus(): string
    {
        if ($this->isAccepted()) {
            return 'accepted';
        }
        
        if ($this->isExpired()) {
            return 'expired';
        }
        
        return 'pending';
    }

    /**
     * 生成邀請連結
     */
    public function getInvitationUrl(): string
    {
        return route('company.invitation.accept', $this->token);
    }

    /**
     * Scope: 獲取有效的邀請
     */
    public function scopeValid($query)
    {
        return $query->where('expires_at', '>', now())
                    ->whereNull('accepted_at');
    }

    /**
     * Scope: 獲取已過期的邀請
     */
    public function scopeExpired($query)
    {
        return $query->where('expires_at', '<=', now())
                    ->whereNull('accepted_at');
    }

    /**
     * Scope: 獲取已接受的邀請
     */
    public function scopeAccepted($query)
    {
        return $query->whereNotNull('accepted_at');
    }

    /**
     * Scope: 依據公司篩選
     */
    public function scopeForCompany($query, int $companyId)
    {
        return $query->where('company_id', $companyId);
    }

    /**
     * Scope: 依據邀請者篩選
     */
    public function scopeByInviter($query, int $userId)
    {
        return $query->where('invited_by_user_id', $userId);
    }
}