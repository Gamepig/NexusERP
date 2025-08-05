<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * 權限模型
 * 
 * 管理系統中的權限定義，包含權限名稱、顯示名稱、群組分類等
 * 支援軟刪除，確保資料完整性
 */
class Permission extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * 資料表名稱
     */
    protected $table = 'permissions';

    /**
     * 可批量賦值的屬性
     */
    protected $fillable = [
        'name',
        'display_name',
        'description',
        'group',
        'is_system',
        'is_active',
        'settings',
    ];

    /**
     * 屬性轉換
     */
    protected $casts = [
        'is_system' => 'boolean',
        'is_active' => 'boolean',
        'settings' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    /**
     * 擁有此權限的角色 (多對多關聯)
     */
    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class, 'role_permissions')
            ->withTimestamps();
    }

    /**
     * 作用域：僅查詢活躍權限
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * 作用域：僅查詢非系統權限
     */
    public function scopeNonSystem($query)
    {
        return $query->where('is_system', false);
    }

    /**
     * 作用域：依名稱查詢
     */
    public function scopeByName($query, string $name)
    {
        return $query->where('name', $name);
    }

    /**
     * 作用域：依群組查詢
     */
    public function scopeByGroup($query, string $group)
    {
        return $query->where('group', $group);
    }

    /**
     * 檢查是否為系統權限（不可刪除）
     */
    public function isSystemPermission(): bool
    {
        return (bool) $this->is_system;
    }

    /**
     * 檢查權限是否為活躍狀態
     */
    public function isActive(): bool
    {
        return (bool) $this->is_active;
    }

    /**
     * 取得權限的設定值
     */
    public function getSetting(string $key, $default = null)
    {
        return data_get($this->settings, $key, $default);
    }

    /**
     * 設定權限的設定值
     */
    public function setSetting(string $key, $value): void
    {
        $settings = $this->settings ?? [];
        data_set($settings, $key, $value);
        $this->settings = $settings;
        $this->save();
    }

    /**
     * 取得所有權限群組列表
     */
    public static function getGroups(): array
    {
        return self::active()
            ->select('group')
            ->distinct()
            ->orderBy('group')
            ->pluck('group')
            ->filter()
            ->values()
            ->toArray();
    }

    /**
     * 依群組取得權限
     */
    public static function getByGroup(string $group): \Illuminate\Database\Eloquent\Collection
    {
        return self::active()
            ->byGroup($group)
            ->orderBy('name')
            ->get();
    }

    /**
     * 檢查權限名稱格式是否正確
     * 
     * 權限命名規範：module.action (例如：products.view, users.create)
     */
    public function isValidPermissionFormat(): bool
    {
        return preg_match('/^[a-z_]+\.[a-z_]+$/', $this->name) === 1;
    }

    /**
     * 取得權限的模組名稱
     */
    public function getModule(): ?string
    {
        if (!$this->isValidPermissionFormat()) {
            return null;
        }

        return explode('.', $this->name)[0];
    }

    /**
     * 取得權限的操作名稱
     */
    public function getAction(): ?string
    {
        if (!$this->isValidPermissionFormat()) {
            return null;
        }

        return explode('.', $this->name)[1];
    }

    /**
     * 常用權限操作
     */
    public const ACTIONS = [
        'view' => '檢視',
        'create' => '建立',
        'edit' => '編輯',
        'delete' => '刪除',
        'manage' => '管理',
        'export' => '匯出',
        'import' => '匯入',
        'approve' => '核准',
        'reject' => '拒絕',
    ];

    /**
     * 常用權限群組
     */
    public const GROUPS = [
        'products' => '產品管理',
        'suppliers' => '供應商管理',
        'customers' => '客戶管理',
        'orders' => '訂單管理',
        'inventory' => '庫存管理',
        'reports' => '報表管理',
        'settings' => '系統設定',
        'users' => '使用者管理',
        'permissions' => '權限管理',
        'system' => '系統管理',
    ];

    /**
     * 取得權限的本地化群組名稱
     */
    public function getLocalizedGroupName(): string
    {
        return self::GROUPS[$this->group] ?? $this->group;
    }

    /**
     * 取得權限的本地化操作名稱
     */
    public function getLocalizedActionName(): string
    {
        $action = $this->getAction();
        return $action ? (self::ACTIONS[$action] ?? $action) : '';
    }
}