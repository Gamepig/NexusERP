<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use App\Services\SuperAdminService;
use App\Models\User;

/**
 * 超級管理員管理指令
 * 
 * 功能：
 * 1. 測試超級管理員 RLS 繞過功能
 * 2. 查看存取監控資料
 * 3. 清理存取日誌
 * 4. 獲取存取統計
 * 
 * 使用方式：
 * php artisan superadmin:manage [action] [options]
 */
class ManageSuperAdmin extends Command
{
    protected $signature = 'superadmin:manage 
                           {action : 動作 (test|monitor|cleanup|stats)}
                           {--user-id= : 用戶 ID（用於測試）}
                           {--reason= : 存取原因}
                           {--retention-days=90 : 日誌保留天數}';

    protected $description = '管理超級管理員功能：測試、監控、清理';

    private SuperAdminService $superAdminService;

    public function __construct(SuperAdminService $superAdminService)
    {
        parent::__construct();
        $this->superAdminService = $superAdminService;
    }

    public function handle(): int
    {
        $action = $this->argument('action');

        match ($action) {
            'test' => $this->testSuperAdminAccess(),
            'monitor' => $this->showAccessMonitor(),
            'cleanup' => $this->cleanupLogs(),
            'stats' => $this->showStatistics(),
            default => $this->showHelp()
        };

        return 0;
    }

    /**
     * 測試超級管理員 RLS 繞過功能
     */
    private function testSuperAdminAccess(): void
    {
        $this->info('🔍 測試超級管理員 RLS 繞過功能');
        $this->newLine();

        $userId = $this->option('user-id');
        if (!$userId) {
            $this->error('請提供用戶 ID：--user-id=1');
            return;
        }

        $user = User::find($userId);
        if (!$user) {
            $this->error("找不到用戶 ID：{$userId}");
            return;
        }

        // 檢查是否為超級管理員
        if (!$this->superAdminService->isSuperAdmin($user)) {
            $this->error("用戶 {$user->name} ({$user->email}) 不是超級管理員");
            return;
        }

        $reason = $this->option('reason') ?: '測試 RLS 繞過功能';

        try {
            $this->info("測試用戶：{$user->name} ({$user->email})");
            $this->info("測試原因：{$reason}");
            $this->newLine();

            // 測試超級管理員存取
            $result = $this->superAdminService->executeAsSuperAdmin($user, function () {
                $this->line('🔓 超級管理員模式已啟用');
                
                // 測試：獲取所有公司的資料（應該能繞過 RLS）
                $companyCount = DB::table('companies')->count();
                $this->info("✅ 可存取所有公司數量：{$companyCount}");
                
                // 測試：獲取所有產品（應該能繞過 RLS）
                $productCount = DB::table('products')->count();
                $this->info("✅ 可存取所有產品數量：{$productCount}");
                
                // 測試：獲取所有用戶（應該能繞過 RLS）
                $userCount = DB::table('users')->count();
                $this->info("✅ 可存取所有用戶數量：{$userCount}");
                
                // 測試：驗證 RLS 設定
                $rlsStatus = DB::select("
                    SELECT 
                        current_setting('app.superuser_mode', true) as superuser_mode,
                        current_setting('app.current_user_id', true) as current_user_id,
                        current_setting('app.current_company_id', true) as current_company_id
                ");
                
                if ($rlsStatus) {
                    $status = $rlsStatus[0];
                    $this->table(['設定項目', '值'], [
                        ['超級管理員模式', $status->superuser_mode],
                        ['當前用戶 ID', $status->current_user_id],
                        ['當前公司 ID', $status->current_company_id]
                    ]);
                }
                
                return 'success';
            }, $reason);

            if ($result === 'success') {
                $this->newLine();
                $this->info('🎉 超級管理員 RLS 繞過功能測試成功！');
            }

        } catch (\Exception $e) {
            $this->error("測試失敗：{$e->getMessage()}");
        }
    }

    /**
     * 顯示存取監控資料
     */
    private function showAccessMonitor(): void
    {
        $this->info('📊 超級管理員存取監控');
        $this->newLine();

        $monitors = $this->superAdminService->getAccessMonitor(20);

        if (empty($monitors)) {
            $this->warn('目前沒有超級管理員存取記錄');
            return;
        }

        $tableData = [];
        foreach ($monitors as $monitor) {
            $tableData[] = [
                'ID' => $monitor->id,
                '管理員' => $monitor->admin_name ?: '未知',
                '信箱' => $monitor->admin_email ?: '未知',
                '存取原因' => $monitor->access_reason ?: '未提供',
                '存取時間' => $monitor->created_at,
                'IP 位址' => $monitor->ip_address ?: '未記錄'
            ];
        }

        $this->table([
            'ID', '管理員', '信箱', '存取原因', '存取時間', 'IP 位址'
        ], $tableData);
    }

    /**
     * 清理存取日誌
     */
    private function cleanupLogs(): void
    {
        $retentionDays = (int) $this->option('retention-days');
        
        $this->info("🧹 清理超級管理員存取日誌（保留 {$retentionDays} 天）");
        
        if (!$this->confirm('確定要清理過期的存取日誌嗎？')) {
            $this->info('操作已取消');
            return;
        }

        $deletedCount = $this->superAdminService->cleanupAccessLogs($retentionDays);
        
        $this->info("✅ 已清理 {$deletedCount} 筆過期記錄");
    }

    /**
     * 顯示存取統計
     */
    private function showStatistics(): void
    {
        $this->info('📈 超級管理員存取統計');
        $this->newLine();

        $stats = $this->superAdminService->getAccessStatistics();

        if (isset($stats['error'])) {
            $this->error("獲取統計資料失敗：{$stats['error']}");
            return;
        }

        // 基本統計
        $this->table(['統計項目', '數值'], [
            ['今日存取次數', $stats['today_access_count']],
            ['本週存取次數', $stats['week_access_count']],
            ['統計生成時間', $stats['generated_at']]
        ]);

        // 最常存取的管理員
        if (!empty($stats['top_admins'])) {
            $this->newLine();
            $this->info('🏆 本月最常存取的管理員');
            
            $adminData = [];
            foreach ($stats['top_admins'] as $admin) {
                $adminData[] = [
                    '用戶 ID' => $admin->user_id,
                    '姓名' => $admin->name ?: '未知',
                    '信箱' => $admin->email ?: '未知',
                    '存取次數' => $admin->access_count
                ];
            }

            $this->table(['用戶 ID', '姓名', '信箱', '存取次數'], $adminData);
        }
    }

    /**
     * 顯示幫助資訊
     */
    private function showHelp(): void
    {
        $this->error('無效的動作');
        $this->newLine();
        
        $this->info('可用動作：');
        $this->line('  test    - 測試超級管理員 RLS 繞過功能');
        $this->line('  monitor - 顯示存取監控資料');
        $this->line('  cleanup - 清理存取日誌');
        $this->line('  stats   - 顯示存取統計');
        $this->newLine();
        
        $this->info('範例：');
        $this->line('  php artisan superadmin:manage test --user-id=1 --reason="系統維護"');
        $this->line('  php artisan superadmin:manage monitor');
        $this->line('  php artisan superadmin:manage cleanup --retention-days=30');
        $this->line('  php artisan superadmin:manage stats');
    }
}