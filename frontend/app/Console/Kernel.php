<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
    /**
     * 定義 Artisan 指令
     */
    protected $commands = [
        Commands\AuditDataAssociations::class,
    ];

    /**
     * 定義指令排程
     */
    protected function schedule(Schedule $schedule): void
    {
        // 每月第一天的凌晨 2 點執行租戶資料稽核
        $schedule->command('tenants:audit-data-associations --format=json')
                 ->monthlyOn(1, '02:00')
                 ->withoutOverlapping()
                 ->onOneServer()
                 ->appendOutputTo(storage_path('logs/scheduled-audit.log'));
    }

    /**
     * 註冊 Closure 基礎指令
     */
    protected function commands(): void
    {
        $this->load(__DIR__.'/Commands');

        require base_path('routes/console.php');
    }
}