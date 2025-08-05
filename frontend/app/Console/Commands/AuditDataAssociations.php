<?php

namespace App\Console\Commands;

use App\Models\Company;
use App\Models\Customer;
use App\Models\Product;
use App\Models\Supplier;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * 資料關聯稽核指令
 * 
 * 此指令掃描 customers、suppliers 和 products 資料表，
 * 識別擁有 NULL 或無效 tenant_id (company_id) 引用的記錄。
 * 指令執行只讀操作，將結果記錄到報告檔案中供檢閱。
 */
class AuditDataAssociations extends Command
{
    /**
     * 指令簽名
     */
    protected $signature = 'tenants:audit-data-associations 
                           {--output= : 自訂輸出檔案路徑} 
                           {--format=text : 輸出格式 (text|json|csv)}';

    /**
     * 指令說明
     */
    protected $description = '稽核 customers、suppliers 和 products 資料表中的租戶資料關聯，識別 NULL 或無效的 tenant_id 引用';

    /**
     * 稽核結果
     */
    private array $auditResults = [];

    /**
     * 有效公司 ID 清單
     */
    private array $validCompanyIds = [];

    /**
     * 執行指令
     */
    public function handle()
    {
        $this->info('🔍 開始資料關聯稽核作業...');
        $this->info('==================================');

        // 載入有效公司 ID
        $this->loadValidCompanyIds();

        // 稽核各資料表
        $this->auditCustomers();
        $this->auditSuppliers();
        $this->auditProducts();

        // 產生報告
        $this->generateReport();

        $this->info('✅ 稽核作業完成');
        
        return 0;
    }

    /**
     * 載入有效公司 ID
     */
    private function loadValidCompanyIds(): void
    {
        $this->info('📋 載入有效公司清單...');
        
        $this->validCompanyIds = Company::pluck('id')->toArray();
        
        $this->info("✓ 找到 " . count($this->validCompanyIds) . " 個有效公司");
        
        if ($this->getOutput()->isVerbose()) {
            $this->line("有效公司 ID: " . implode(', ', $this->validCompanyIds));
        }
    }

    /**
     * 稽核客戶資料表
     */
    private function auditCustomers(): void
    {
        $this->info('👥 稽核客戶資料表 (customers)...');
        
        $this->auditResults['customers'] = $this->auditTable(
            'customers',
            Customer::class,
            'company_id'
        );
    }

    /**
     * 稽核供應商資料表
     */
    private function auditSuppliers(): void
    {
        $this->info('🏭 稽核供應商資料表 (suppliers)...');
        
        $this->auditResults['suppliers'] = $this->auditTable(
            'suppliers',
            Supplier::class,
            'company_id'
        );
    }

    /**
     * 稽核產品資料表
     */
    private function auditProducts(): void
    {
        $this->info('📦 稽核產品資料表 (products)...');
        
        $this->auditResults['products'] = $this->auditTable(
            'products',
            Product::class,
            'company_id'
        );
    }

    /**
     * 稽核單一資料表
     */
    private function auditTable(string $tableName, string $modelClass, string $tenantColumn): array
    {
        $results = [
            'table' => $tableName,
            'total_records' => 0,
            'null_tenant_ids' => [],
            'invalid_tenant_ids' => [],
            'valid_records' => 0,
            'issues_count' => 0
        ];

        try {
            // 總記錄數
            $results['total_records'] = $modelClass::count();

            // 查找 NULL tenant_id 的記錄
            $nullTenantRecords = $modelClass::whereNull($tenantColumn)
                ->select('id', 'name', $tenantColumn, 'created_at', 'updated_at')
                ->get();

            foreach ($nullTenantRecords as $record) {
                $results['null_tenant_ids'][] = [
                    'id' => $record->id,
                    'name' => $record->name ?? $record->sku ?? 'N/A',
                    'tenant_id' => null,
                    'created_at' => $record->created_at?->toISOString(),
                    'updated_at' => $record->updated_at?->toISOString(),
                ];
            }

            // 查找無效 tenant_id 的記錄
            $invalidTenantRecords = $modelClass::whereNotNull($tenantColumn)
                ->whereNotIn($tenantColumn, $this->validCompanyIds)
                ->select('id', 'name', $tenantColumn, 'created_at', 'updated_at')
                ->get();

            foreach ($invalidTenantRecords as $record) {
                $results['invalid_tenant_ids'][] = [
                    'id' => $record->id,
                    'name' => $record->name ?? $record->sku ?? 'N/A',
                    'tenant_id' => $record->{$tenantColumn},
                    'created_at' => $record->created_at?->toISOString(),
                    'updated_at' => $record->updated_at?->toISOString(),
                ];
            }

            // 計算有效記錄數
            $results['valid_records'] = $results['total_records'] - count($results['null_tenant_ids']) - count($results['invalid_tenant_ids']);
            $results['issues_count'] = count($results['null_tenant_ids']) + count($results['invalid_tenant_ids']);

            // 顯示統計資訊
            $this->displayTableStats($results);

        } catch (\Exception $e) {
            $this->error("稽核 {$tableName} 時發生錯誤: " . $e->getMessage());
            Log::error("資料關聯稽核錯誤", [
                'table' => $tableName,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
        }

        return $results;
    }

    /**
     * 顯示資料表統計資訊
     */
    private function displayTableStats(array $results): void
    {
        $this->line("  📊 統計結果:");
        $this->line("     總記錄數: {$results['total_records']}");
        $this->line("     有效記錄: {$results['valid_records']}");
        $this->line("     NULL tenant_id: " . count($results['null_tenant_ids']));
        $this->line("     無效 tenant_id: " . count($results['invalid_tenant_ids']));
        
        if ($results['issues_count'] > 0) {
            $this->warn("  ⚠️  發現 {$results['issues_count']} 個問題記錄");
        } else {
            $this->info("  ✅ 所有記錄的租戶關聯都是有效的");
        }
        
        $this->line('');
    }

    /**
     * 產生稽核報告
     */
    private function generateReport(): void
    {
        $this->info('📄 產生稽核報告...');
        
        $format = $this->option('format') ?? 'text';
        $outputPath = $this->option('output') ?? $this->getDefaultOutputPath($format);
        
        // 準備報告資料
        $reportData = [
            'audit_timestamp' => now()->toISOString(),
            'audit_summary' => $this->generateSummary(),
            'table_results' => $this->auditResults,
            'recommendations' => $this->generateRecommendations()
        ];

        // 根據格式產生報告
        switch ($format) {
            case 'json':
                $this->generateJsonReport($reportData, $outputPath);
                break;
            case 'csv':
                $this->generateCsvReport($reportData, $outputPath);
                break;
            default:
                $this->generateTextReport($reportData, $outputPath);
        }

        $this->info("📁 報告已儲存至: {$outputPath}");
    }

    /**
     * 產生摘要統計
     */
    private function generateSummary(): array
    {
        $totalRecords = 0;
        $totalIssues = 0;
        $tablesSummary = [];

        foreach ($this->auditResults as $tableName => $result) {
            $totalRecords += $result['total_records'];
            $totalIssues += $result['issues_count'];
            
            $tablesSummary[$tableName] = [
                'total' => $result['total_records'],
                'issues' => $result['issues_count'],
                'null_tenant_ids' => count($result['null_tenant_ids']),
                'invalid_tenant_ids' => count($result['invalid_tenant_ids'])
            ];
        }

        return [
            'total_records' => $totalRecords,
            'total_issues' => $totalIssues,
            'issue_percentage' => $totalRecords > 0 ? round(($totalIssues / $totalRecords) * 100, 2) : 0,
            'tables_summary' => $tablesSummary,
            'valid_companies_count' => count($this->validCompanyIds)
        ];
    }

    /**
     * 產生建議
     */
    private function generateRecommendations(): array
    {
        $recommendations = [];
        $totalIssues = $this->generateSummary()['total_issues'];

        if ($totalIssues > 0) {
            $recommendations[] = "發現 {$totalIssues} 個租戶關聯問題需要修復";
            $recommendations[] = "建議在維護時段執行修復腳本，將孤立記錄指派給系統預設租戶";
            $recommendations[] = "考慮實施 PostgreSQL RLS (Row Level Security) 以加強資料隔離";
            $recommendations[] = "建議定期執行此稽核指令以監控資料完整性";
        } else {
            $recommendations[] = "所有租戶關聯都是有效的，資料完整性良好";
            $recommendations[] = "建議每月執行一次稽核以維持資料品質";
        }

        return $recommendations;
    }

    /**
     * 取得預設輸出路徑
     */
    private function getDefaultOutputPath(string $format): string
    {
        $timestamp = now()->format('Y-m-d_H-i-s');
        $filename = "tenant_data_audit_{$timestamp}.{$format}";
        
        $directory = storage_path('logs/audit');
        
        // 確保目錄存在
        if (!is_dir($directory)) {
            mkdir($directory, 0755, true);
        }
        
        return $directory . DIRECTORY_SEPARATOR . $filename;
    }

    /**
     * 產生文字格式報告
     */
    private function generateTextReport(array $data, string $path): void
    {
        $content  = "=== NexusERP 租戶資料關聯稽核報告 ===\n";
        $content .= "稽核時間: {$data['audit_timestamp']}\n";
        $content .= "========================================\n\n";

        // 摘要
        $summary = $data['audit_summary'];
        $content .= "📊 稽核摘要\n";
        $content .= "----------\n";
        $content .= "總記錄數: {$summary['total_records']}\n";
        $content .= "問題記錄數: {$summary['total_issues']}\n";
        $content .= "問題比例: {$summary['issue_percentage']}%\n";
        $content .= "有效公司數: {$summary['valid_companies_count']}\n\n";

        // 各資料表詳細結果
        foreach ($data['table_results'] as $tableName => $result) {
            $content .= "📋 {$tableName} 資料表\n";
            $content .= str_repeat('-', strlen($tableName) + 8) . "\n";
            $content .= "總記錄數: {$result['total_records']}\n";
            $content .= "有效記錄: {$result['valid_records']}\n";
            $content .= "NULL tenant_id 記錄: " . count($result['null_tenant_ids']) . "\n";
            $content .= "無效 tenant_id 記錄: " . count($result['invalid_tenant_ids']) . "\n\n";

            // NULL tenant_id 詳細資料
            if (!empty($result['null_tenant_ids'])) {
                $content .= "  🔍 NULL tenant_id 記錄詳細:\n";
                foreach ($result['null_tenant_ids'] as $record) {
                    $content .= "    - ID: {$record['id']}, 名稱: {$record['name']}, 建立時間: {$record['created_at']}\n";
                }
                $content .= "\n";
            }

            // 無效 tenant_id 詳細資料
            if (!empty($result['invalid_tenant_ids'])) {
                $content .= "  🔍 無效 tenant_id 記錄詳細:\n";
                foreach ($result['invalid_tenant_ids'] as $record) {
                    $content .= "    - ID: {$record['id']}, 名稱: {$record['name']}, tenant_id: {$record['tenant_id']}, 建立時間: {$record['created_at']}\n";
                }
                $content .= "\n";
            }
        }

        // 建議
        $content .= "💡 建議事項\n";
        $content .= "----------\n";
        foreach ($data['recommendations'] as $recommendation) {
            $content .= "• {$recommendation}\n";
        }

        file_put_contents($path, $content);
    }

    /**
     * 產生 JSON 格式報告
     */
    private function generateJsonReport(array $data, string $path): void
    {
        file_put_contents($path, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    }

    /**
     * 產生 CSV 格式報告
     */
    private function generateCsvReport(array $data, string $path): void
    {
        $handle = fopen($path, 'w');
        
        // 寫入標題行
        fputcsv($handle, ['資料表', '記錄ID', '名稱', '問題類型', 'tenant_id', '建立時間', '更新時間']);
        
        // 寫入資料
        foreach ($data['table_results'] as $tableName => $result) {
            // NULL tenant_id 記錄
            foreach ($result['null_tenant_ids'] as $record) {
                fputcsv($handle, [
                    $tableName,
                    $record['id'],
                    $record['name'],
                    'NULL tenant_id',
                    'NULL',
                    $record['created_at'],
                    $record['updated_at']
                ]);
            }
            
            // 無效 tenant_id 記錄
            foreach ($result['invalid_tenant_ids'] as $record) {
                fputcsv($handle, [
                    $tableName,
                    $record['id'],
                    $record['name'],
                    '無效 tenant_id',
                    $record['tenant_id'],
                    $record['created_at'],
                    $record['updated_at']
                ]);
            }
        }
        
        fclose($handle);
    }
}