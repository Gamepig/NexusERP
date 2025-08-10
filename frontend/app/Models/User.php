<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'google_id',
        'line_id',
        'avatar',
        'email_verified_at',
        'business_type',
        'role',
        'api_token',
        'api_token_created_at',
        'api_token_expires_at',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
        'api_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'api_token_created_at' => 'datetime',
            'api_token_expires_at' => 'datetime',
        ];
    }

    /**
     * 用戶所屬的公司
     */
    public function companies(): BelongsToMany
    {
        return $this->belongsToMany(Company::class, 'user_companies')
            ->withPivot(['is_primary', 'is_active', 'joined_at', 'left_at', 'role'])
            ->withTimestamps()
            ->wherePivot('is_active', true);
    }

    /**
     * 用戶所屬的業務單位
     */
    public function businessUnits(): BelongsToMany
    {
        return $this->belongsToMany(BusinessUnit::class, 'user_business_units')
            ->withPivot(['is_primary', 'is_active', 'joined_at', 'left_at', 'role'])
            ->withTimestamps()
            ->wherePivot('is_active', true);
    }

    /**
     * 取得用戶的主要公司
     */
    public function currentCompany()
    {
        $companyId = session('current_company_id');
        if ($companyId) {
            return $this->companies()->where('companies.id', $companyId)->first();
        }
        
        return $this->companies()->wherePivot('is_primary', true)->first()
            ?? $this->companies()->first();
    }

    /**
     * 檢查用戶是否有公司關聯
     */
    public function hasCompany(): bool
    {
        // 使用原生查詢完全避開 RLS 政策問題
        return \Illuminate\Support\Facades\DB::table('user_companies')
            ->where('user_id', $this->id)
            ->where('is_active', true)
            ->exists();
    }

    /**
     * 用戶擁有的角色 (多對多關聯)
     */
    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class, 'user_roles')
            ->withTimestamps();
    }

    /**
     * 用戶直接擁有的權限 (透過角色)
     * 
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function permissions()
    {
        return Permission::whereIn('id', function ($query) {
            $query->select('permission_id')
                ->from('role_permissions')
                ->whereIn('role_id', $this->roles()->pluck('roles.id'));
        })->where('is_active', true);
    }

    /**
     * 檢查用戶是否擁有特定角色
     */
    public function hasRole(string $role): bool
    {
        return $this->roles()
            ->where('name', $role)
            ->exists();
    }

    /**
     * 檢查用戶是否擁有任一角色
     */
    public function hasAnyRole(array $roles): bool
    {
        return $this->roles()
            ->whereIn('name', $roles)
            ->where('is_active', true)
            ->exists();
    }

    /**
     * 檢查用戶是否擁有所有角色
     */
    public function hasAllRoles(array $roles): bool
    {
        $userRoles = $this->roles()
            ->whereIn('name', $roles)
            ->where('is_active', true)
            ->pluck('name')
            ->toArray();

        return count($roles) === count($userRoles);
    }

    /**
     * 檢查用戶是否擁有特定權限
     * 
     * 支援快取機制，提升權限檢查效能
     */
    public function hasPermission(string $permission): bool
    {
        $cacheKey = "user.{$this->id}.permission.{$permission}";
        
        return Cache::remember($cacheKey, now()->addMinutes(30), function () use ($permission) {
            return $this->permissions()
                ->where('name', $permission)
                ->exists();
        });
    }

    /**
     * 檢查用戶是否擁有任一權限
     */
    public function hasAnyPermission(array $permissions): bool
    {
        foreach ($permissions as $permission) {
            if ($this->hasPermission($permission)) {
                return true;
            }
        }
        return false;
    }

    /**
     * 檢查用戶是否擁有所有權限
     */
    public function hasAllPermissions(array $permissions): bool
    {
        foreach ($permissions as $permission) {
            if (!$this->hasPermission($permission)) {
                return false;
            }
        }
        return true;
    }

    /**
     * 賦予角色給用戶
     */
    public function assignRole(string|Role $role, ?\DateTime $expiresAt = null): void
    {
        if (is_string($role)) {
            $role = Role::where('name', $role)->first();
        }

        if ($role && !$this->hasRole($role->name)) {
            $this->roles()->attach($role->id, [
                'assigned_at' => now(),
                'expires_at' => $expiresAt,
            ]);
            
            $this->clearPermissionCache();
        }
    }

    /**
     * 撤銷用戶的角色
     */
    public function removeRole(string|Role $role): void
    {
        if (is_string($role)) {
            $role = Role::where('name', $role)->first();
        }

        if ($role) {
            $this->roles()->detach($role->id);
            $this->clearPermissionCache();
        }
    }

    /**
     * 同步用戶角色
     */
    public function syncRoles(array $roles): void
    {
        $roleIds = Role::whereIn('name', $roles)
            ->pluck('id')
            ->toArray();

        $syncData = [];
        foreach ($roleIds as $roleId) {
            $syncData[$roleId] = [
                'assigned_at' => now(),
                'expires_at' => null,
            ];
        }

        $this->roles()->sync($syncData);
        $this->clearPermissionCache();
    }

    /**
     * 取得用戶的所有權限名稱
     */
    public function getPermissionNames(): array
    {
        $cacheKey = "user.{$this->id}.permissions";
        
        return Cache::remember($cacheKey, now()->addMinutes(30), function () {
            return $this->permissions()
                ->pluck('name')
                ->toArray();
        });
    }

    /**
     * 取得用戶的所有角色名稱
     */
    public function getRoleNames(): array
    {
        return $this->roles()
            ->where('is_active', true)
            ->pluck('name')
            ->toArray();
    }

    /**
     * 檢查用戶是否為管理員
     */
    public function isAdmin(): bool
    {
        return $this->hasRole('admin') || $this->hasRole('super_admin');
    }

    /**
     * 檢查用戶是否為超級管理員
     */
    public function isSuperAdmin(): bool
    {
        return $this->hasRole('super_admin');
    }

    /**
     * 檢查用戶是否為經理
     */
    public function isManager(): bool
    {
        return $this->hasRole('manager') || $this->isAdmin();
    }

    /**
     * 清除用戶權限快取
     */
    public function clearPermissionCache(): void
    {
        $store = Cache::getStore();
        
        // 判斷快取驅動類型
        if (method_exists($store, 'connection') && method_exists($store->connection(), 'keys')) {
            // Redis cache store
            try {
                $patterns = [
                    "user.{$this->id}.permission.*",
                    "user.{$this->id}.permissions",
                ];
                
                foreach ($patterns as $pattern) {
                    $keys = $store->connection()->keys($pattern);
                    if (!empty($keys)) {
                        $store->connection()->del($keys);
                    }
                }
            } catch (\Exception $e) {
                // 如果 Redis 操作失敗，回退到逐個刪除
                $this->clearIndividualPermissionCache();
            }
        } else {
            // File cache store 或其他類型的快取 - 逐個刪除
            $this->clearIndividualPermissionCache();
        }
    }

    /**
     * 逐個清除權限快取（回退方法）
     */
    protected function clearIndividualPermissionCache(): void
    {
        // 清除總權限清單快取
        Cache::forget("user.{$this->id}.permissions");
        
        // 嘗試刪除所有權限快取
        try {
            $permissions = Permission::active()->pluck('name');
            foreach ($permissions as $permission) {
                Cache::forget("user.{$this->id}.permission.{$permission}");
            }
        } catch (\Exception $e) {
            // 如果查詢權限失敗（例如資料表不存在），忽略錯誤
            logger()->warning('Failed to clear individual permission cache', [
                'user_id' => $this->id,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * 檢查用戶在特定公司中的權限
     */
    public function hasPermissionInCompany(string $permission, ?int $companyId = null): bool
    {
        $companyId = $companyId ?? session('current_company_id');
        
        if (!$companyId) {
            return false;
        }

        // 檢查用戶是否屬於該公司
        if (!$this->companies()->where('companies.id', $companyId)->exists()) {
            return false;
        }

        return $this->hasPermission($permission);
    }

    /**
     * 檢查用戶對資源的權限（基於資源擁有者）
     */
    public function canAccessResource($resource, string $permission): bool
    {
        // 如果是超級管理員，允許所有操作
        if ($this->isSuperAdmin()) {
            return true;
        }

        // 檢查基本權限
        if (!$this->hasPermission($permission)) {
            return false;
        }

        // 如果資源有 company_id 屬性，檢查公司權限
        if (isset($resource->company_id)) {
            return $this->hasPermissionInCompany($permission, $resource->company_id);
        }

        return true;
    }

    /**
     * 生成新的 API Token
     */
    public function generateApiToken(int $expiresInDays = 30): string
    {
        $token = \Illuminate\Support\Str::random(80);
        
        $this->update([
            'api_token' => hash('sha256', $token),
            'api_token_created_at' => now(),
            'api_token_expires_at' => now()->addDays($expiresInDays),
        ]);

        return $token; // 返回明文token（只有一次機會獲取）
    }

    /**
     * 檢查 API Token 是否有效
     */
    public function hasValidApiToken(): bool
    {
        return $this->api_token && 
               $this->api_token_expires_at && 
               $this->api_token_expires_at->isFuture();
    }

    /**
     * 撤銷 API Token
     */
    public function revokeApiToken(): void
    {
        $this->update([
            'api_token' => null,
            'api_token_created_at' => null,
            'api_token_expires_at' => null,
        ]);
    }

    /**
     * 透過 API Token 查找用戶
     */
    public static function findByApiToken(string $token): ?self
    {
        $hashedToken = hash('sha256', $token);
        
        return static::where('api_token', $hashedToken)
            ->whereNotNull('api_token_expires_at')
            ->where('api_token_expires_at', '>', now())
            ->where('is_active', true)
            ->first();
    }

    /**
     * 自動為用戶生成 API Token（如果沒有或已過期）
     */
    public function ensureApiToken(): string
    {
        if (!$this->hasValidApiToken()) {
            return $this->generateApiToken();
        }

        // 如果已有有效token，返回提示訊息
        throw new \Exception('User already has a valid API token');
    }
}
