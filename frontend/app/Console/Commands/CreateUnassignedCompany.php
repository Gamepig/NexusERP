<?php

namespace App\Console\Commands;

use App\Models\Company;
use Illuminate\Console\Command;

/**
 * 建立系統預設租戶指令
 * 
 * 此指令建立一個系統級的「未指定」公司，用於收容孤立記錄
 */
class CreateUnassignedCompany extends Command
{
    /**
     * 指令簽名
     */
    protected $signature = 'tenants:create-unassigned';

    /**
     * 指令說明
     */
    protected $description = '建立系統級「未指定」公司，用於收容孤立記錄';

    /**
     * 執行指令
     */
    public function handle()
    {
        $this->info('🏢 建立系統預設租戶...');
        
        $unassigned = Company::where('name', 'SYSTEM_UNASSIGNED')->first();
        
        if (!$unassigned) {
            $unassigned = Company::create([
                'name' => 'SYSTEM_UNASSIGNED',
                'display_name' => '系統預設租戶',
                'description' => 'System tenant for orphaned records',
                'is_active' => true
            ]);
            
            $this->info("✅ 成功建立未指定公司，ID: {$unassigned->id}");
        } else {
            $this->info("✅ 未指定公司已存在，ID: {$unassigned->id}");
        }
        
        $this->info("🔖 未指定公司 ID: {$unassigned->id}");
        
        return 0;
    }
}