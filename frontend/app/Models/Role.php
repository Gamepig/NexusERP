<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

/**
 * 角色模型
 * 
 * 管理系統中的角色定義，包含角色名稱、顯示名稱、描述等
 * 支援軟刪除，確保資料完整性
 */
class Role extends Model
{
    use HasFactory;

    /**
     * 資料表名稱
     */
    protected $table = 'roles';

    /**
     * 可批量賦值的屬性
     */
    protected $fillable = [
        'name',
        'display_name',
        'description',
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
     * 角色擁有的權限 (多對多關聯)
     */
    public function permissions(): BelongsToMany
    {
        return $this->belongsToMany(Permission::class, 'role_permissions')
            ->withTimestamps();
    }

    /**
     * 擁有此角色的使用者 (多對多關聯)
     */
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'user_roles')
            ->withPivot(['assigned_at', 'expires_at'])
            ->withTimestamps();
    }

    /**
     * 檢查角色是否擁有特定權限
     */
    public function hasPermission(string $permission): bool
    {
        return $this->permissions()
            ->where('name', $permission)
            ->where('is_active', true)
            ->exists();
    }

    /**
     * 檢查角色是否擁有任一權限
     */
    public function hasAnyPermission(array $permissions): bool
    {
        return $this->permissions()
            ->whereIn('name', $permissions)
            ->where('is_active', true)
            ->exists();
    }

    /**
     * 檢查角色是否擁有所有權限
     */
    public function hasAllPermissions(array $permissions): bool
    {
        $rolePermissions = $this->permissions()
            ->whereIn('name', $permissions)
            ->where('is_active', true)
            ->pluck('name')
            ->toArray();

        return count($permissions) === count($rolePermissions);
    }

    /**
     * 賦予權限給角色
     */
    public function givePermissionTo(string|Permission $permission): void
    {
        if (is_string($permission)) {
            $permission = Permission::where('name', $permission)->first();
        }

        if ($permission && !$this->hasPermission($permission->name)) {
            $this->permissions()->attach($permission->id);
        }
    }

    /**
     * 撤銷角色的權限
     */
    public function revokePermissionTo(string|Permission $permission): void
    {
        if (is_string($permission)) {
            $permission = Permission::where('name', $permission)->first();
        }

        if ($permission) {
            $this->permissions()->detach($permission->id);
        }
    }

    /**
     * 同步角色權限
     */
    public function syncPermissions(array $permissions): void
    {
        $permissionIds = Permission::whereIn('name', $permissions)
            ->pluck('id')
            ->toArray();

        $this->permissions()->sync($permissionIds);
    }

    /**
     * 作用域：僅查詢活躍角色
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * 作用域：僅查詢非系統角色
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
     * 檢查是否為系統角色（不可刪除）
     */
    public function isSystemRole(): bool
    {
        return (bool) $this->is_system;
    }

    /**
     * 檢查角色是否為活躍狀態
     */
    public function isActive(): bool
    {
        return (bool) $this->is_active;
    }

    /**
     * 取得角色的權限列表（字串陣列）
     */
    public function getPermissionNames(): array
    {
        return $this->permissions()
            ->where('is_active', true)
            ->pluck('name')
            ->toArray();
    }

    /**
     * 取得角色的設定值
     */
    public function getSetting(string $key, $default = null)
    {
        return data_get($this->settings, $key, $default);
    }

    /**
     * 設定角色的設定值
     */
    public function setSetting(string $key, $value): void
    {
        $settings = $this->settings ?? [];
        data_set($settings, $key, $value);
        $this->settings = $settings;
        $this->save();
    }
}