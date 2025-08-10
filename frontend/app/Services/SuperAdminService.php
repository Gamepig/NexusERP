<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Config;
use App\Models\User;

/**
 * 超級管理員服務
 * 
 * 功能：
 * 1. 管理超級管理員存取權限
 * 2. 啟用/停用 RLS 繞過模式
 * 3. 記錄和監控所有超級管理員操作
 * 4. 提供安全的系統級資料存取
 * 
 * 安全等級：CRITICAL
 * 使用原則：僅限緊急情況和系統維護
 */
class SuperAdminService
{
    private const SUPERADMIN_CACHE_KEY = 'superadmin_access_';
    private const ACCESS_DURATION = 30; // 30分鐘
    
    /**
     * 啟用超級管理員模式
     */
    public function enableSuperAdminMode(User $user, string $reason = '', string $clientIp = null): bool
    {
        try {
            // 1. 驗證用戶是否有超級管理員權限
            if (!$this->isSuperAdmin($user)) {
                Log::warning('未授權的超級管理員模式啟用嘗試', [
                    'user_id' => $user->id,
                    'user_email' => $user->email,
                    'ip' => $clientIp,
                    'reason' => $reason
                ]);
                return false;
            }
            
            // 2. 建立專用的超級管理員資料庫連接
            $superAdminConnection = $this->createSuperAdminConnection();
            
            // 3. 設定超級管理員上下文
            DB::connection($superAdminConnection)->select(
                'SELECT set_superadmin_context(?, ?)', 
                [$user->id, $reason]
            );
            
            // 4. 在快取中記錄啟用狀態（用於追蹤）
            $cacheKey = self::SUPERADMIN_CACHE_KEY . $user->id;
            Cache::put($cacheKey, [
                'enabled_at' => now(),
                'reason' => $reason,
                'ip_address' => $clientIp,
                'session_id' => session()->getId()
            ], self::ACCESS_DURATION * 60); // 轉換為秒
            
            // 5. 記錄啟用日誌
            Log::critical('超級管理員模式已啟用', [
                'user_id' => $user->id,
                'user_name' => $user->name,
                'user_email' => $user->email,
                'reason' => $reason,
                'ip' => $clientIp,
                'connection' => $superAdminConnection
            ]);
            
            return true;
            
        } catch (\Exception $e) {
            Log::error('超級管理員模式啟用失敗', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return false;
        }
    }
    
    /**
     * 停用超級管理員模式
     */
    public function disableSuperAdminMode(User $user): bool
    {
        try {
            // 1. 清除快取狀態
            $cacheKey = self::SUPERADMIN_CACHE_KEY . $user->id;
            $accessInfo = Cache::get($cacheKey);
            Cache::forget($cacheKey);
            
            // 2. 重置資料庫上下文為一般模式
            DB::statement("SET LOCAL app.superuser_mode = 'false'");
            DB::statement("SET LOCAL app.current_company_id = ''");
            
            // 3. 記錄停用日誌
            Log::info('超級管理員模式已停用', [
                'user_id' => $user->id,
                'user_name' => $user->name,
                'access_duration' => $accessInfo ? now()->diffInMinutes($accessInfo['enabled_at']) : null
            ]);
            
            return true;
            
        } catch (\Exception $e) {
            Log::error('超級管理員模式停用失敗', [
                'user_id' => $user->id,
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }
    
    /**
     * 檢查用戶是否為超級管理員
     */
    public function isSuperAdmin(User $user): bool
    {
        // 檢查用戶角色
        if (method_exists($user, 'hasRole')) {
            if ($user->hasRole('super_admin') || $user->hasRole('system_admin')) {
                return true;
            }
        }
        
        // 檢查用戶表的 is_admin 欄位
        if (isset($user->is_admin) && $user->is_admin) {
            return true;
        }
        
        // 從資料庫檢查角色（快取結果）
        $cacheKey = 'user_superadmin_' . $user->id;
        return Cache::remember($cacheKey, 300, function () use ($user) {
            return DB::table('user_roles')
                ->join('roles', 'roles.id', '=', 'user_roles.role_id')
                ->where('user_roles.user_id', $user->id)
                ->whereIn('roles.name', ['super_admin', 'system_admin', 'super_admin_role', '系統管理員'])
                ->exists();
        });
    }
    
    /**
     * 檢查超級管理員模式是否啟用
     */
    public function isSuperAdminModeEnabled(User $user): bool
    {
        $cacheKey = self::SUPERADMIN_CACHE_KEY . $user->id;
        $accessInfo = Cache::get($cacheKey);
        
        if (!$accessInfo) {
            return false;
        }
        
        // 檢查是否已過期
        if (now()->diffInMinutes($accessInfo['enabled_at']) > self::ACCESS_DURATION) {
            Cache::forget($cacheKey);
            return false;
        }
        
        return true;
    }
    
    /**
     * 建立超級管理員專用資料庫連接
     */
    private function createSuperAdminConnection(): string
    {
        $connectionName = 'superadmin';
        
        // 設定超級管理員連接配置
        Config::set("database.connections.{$connectionName}", [
            'driver' => 'pgsql',
            'host' => config('database.connections.pgsql.host'),
            'port' => config('database.connections.pgsql.port'),
            'database' => config('database.connections.pgsql.database'),
            'username' => 'nexus_superadmin', // 使用超級管理員角色
            'password' => 'superadmin_secure_password_2025',
            'charset' => 'utf8',
            'prefix' => '',
            'prefix_indexes' => true,
            'search_path' => 'public',
            'sslmode' => 'prefer',
        ]);
        
        return $connectionName;
    }
    
    /**
     * 使用超級管理員權限執行查詢
     */
    public function executeAsSuperAdmin(User $user, callable $callback, string $reason = '')
    {
        // 驗證超級管理員權限
        if (!$this->isSuperAdmin($user)) {
            throw new \UnauthorizedHttpException('無超級管理員權限');
        }
        
        // 臨時啟用超級管理員模式
        $wasEnabled = $this->isSuperAdminModeEnabled($user);
        
        if (!$wasEnabled) {
            $this->enableSuperAdminMode($user, $reason);
        }
        
        try {
            // 執行回調函數
            return $callback();
            
        } finally {
            // 如果原本沒啟用，執行後停用
            if (!$wasEnabled) {
                $this->disableSuperAdminMode($user);
            }
        }
    }
    
    /**
     * 獲取超級管理員存取監控資料
     */
    public function getAccessMonitor(int $limit = 50): array
    {
        try {
            $superAdminConnection = $this->createSuperAdminConnection();
            
            return DB::connection($superAdminConnection)
                ->table('superadmin_access_monitor')
                ->orderBy('created_at', 'desc')
                ->limit($limit)
                ->get()
                ->toArray();
                
        } catch (\Exception $e) {
            Log::error('獲取超級管理員存取監控資料失敗', [
                'error' => $e->getMessage()
            ]);
            return [];
        }
    }
    
    /**
     * 清理過期的存取日誌
     */
    public function cleanupAccessLogs(int $retentionDays = 90): int
    {
        try {
            $superAdminConnection = $this->createSuperAdminConnection();
            
            $result = DB::connection($superAdminConnection)
                ->select('SELECT cleanup_superadmin_logs(?) as deleted_count', [$retentionDays]);
            
            return $result[0]->deleted_count ?? 0;
            
        } catch (\Exception $e) {
            Log::error('清理超級管理員存取日誌失敗', [
                'retention_days' => $retentionDays,
                'error' => $e->getMessage()
            ]);
            return 0;
        }
    }
    
    /**
     * 獲取目前的超級管理員存取統計
     */
    public function getAccessStatistics(): array
    {
        try {
            $superAdminConnection = $this->createSuperAdminConnection();
            
            // 今日存取次數
            $todayCount = DB::connection($superAdminConnection)
                ->table('security_logs')
                ->where('event', 'SUPERADMIN_ACCESS_ENABLED')
                ->whereDate('created_at', today())
                ->count();
            
            // 本週存取次數
            $weekCount = DB::connection($superAdminConnection)
                ->table('security_logs')
                ->where('event', 'SUPERADMIN_ACCESS_ENABLED')
                ->where('created_at', '>=', now()->startOfWeek())
                ->count();
            
            // 最常存取的管理員
            $topAdmins = DB::connection($superAdminConnection)
                ->table('security_logs as sl')
                ->leftJoin('users as u', 'sl.user_id', '=', 'u.id')
                ->select('sl.user_id', 'u.name', 'u.email', DB::raw('COUNT(*) as access_count'))
                ->where('sl.event', 'SUPERADMIN_ACCESS_ENABLED')
                ->where('sl.created_at', '>=', now()->subMonth())
                ->groupBy('sl.user_id', 'u.name', 'u.email')
                ->orderBy('access_count', 'desc')
                ->limit(5)
                ->get();
            
            return [
                'today_access_count' => $todayCount,
                'week_access_count' => $weekCount,
                'top_admins' => $topAdmins->toArray(),
                'generated_at' => now()->toISOString()
            ];
            
        } catch (\Exception $e) {
            Log::error('獲取超級管理員存取統計失敗', [
                'error' => $e->getMessage()
            ]);
            return [
                'today_access_count' => 0,
                'week_access_count' => 0,
                'top_admins' => [],
                'error' => $e->getMessage()
            ];
        }
    }
}