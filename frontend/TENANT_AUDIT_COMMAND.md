# 租戶資料關聯稽核指令文件

## 概要

`tenants:audit-data-associations` 指令用於稽核 `customers`、`suppliers` 和 `products` 資料表中的租戶資料關聯，識別擁有 NULL 或無效 `tenant_id` (即 `company_id`) 引用的記錄。

此指令為**唯讀操作**，不會修改任何資料，僅將稽核結果記錄到報告檔案中供檢閱。

## 使用方法

### 基本用法
```bash
php artisan tenants:audit-data-associations
```

### 參數選項

| 選項 | 說明 | 預設值 | 範例 |
|------|------|--------|------|
| `--output` | 自訂輸出檔案路徑 | `storage/logs/audit/tenant_data_audit_{timestamp}.{format}` | `--output=/path/to/report.json` |
| `--format` | 輸出格式 (text\|json\|csv) | `text` | `--format=json` |
| `-v, --verbose` | 顯示詳細資訊 | - | `-v` |

### 使用範例

#### 1. 基本稽核 (文字格式)
```bash
php artisan tenants:audit-data-associations
```

#### 2. JSON 格式輸出
```bash
php artisan tenants:audit-data-associations --format=json
```

#### 3. 自訂輸出路徑
```bash
php artisan tenants:audit-data-associations --output=/tmp/audit_report.json --format=json
```

#### 4. 詳細模式
```bash
php artisan tenants:audit-data-associations --format=json --verbose
```

## 稽核範圍

此指令會檢查以下資料表：

1. **customers** - 客戶資料表
   - 檢查欄位：`company_id`
   - 識別屬性：`id`, `name`

2. **suppliers** - 供應商資料表
   - 檢查欄位：`company_id`
   - 識別屬性：`id`, `name`

3. **products** - 產品資料表
   - 檢查欄位：`company_id`
   - 識別屬性：`id`, `name` (或 `sku`)

## 稽核結果

對於每個資料表，指令會檢查並報告：

- **總記錄數**：該資料表中的總記錄數量
- **NULL tenant_id 記錄**：`company_id` 欄位為 NULL 的記錄
- **無效 tenant_id 記錄**：`company_id` 欄位值不存在於 `companies` 資料表中的記錄
- **有效記錄數**：具有有效 `company_id` 的記錄數量

## 輸出格式

### 1. 文字格式 (text)
人類可讀的格式，包含：
- 稽核摘要統計
- 各資料表詳細結果
- 問題記錄詳細資訊
- 建議事項

### 2. JSON 格式 (json)
結構化資料格式，適合程式處理：
```json
{
  "audit_timestamp": "2025-07-30T19:35:45.898686Z",
  "audit_summary": {
    "total_records": 4457,
    "total_issues": 0,
    "issue_percentage": 0,
    "tables_summary": {...},
    "valid_companies_count": 226
  },
  "table_results": {...},
  "recommendations": [...]
}
```

### 3. CSV 格式 (csv)
表格式格式，便於在試算表軟體中開啟分析：
- 欄位：資料表、記錄ID、名稱、問題類型、tenant_id、建立時間、更新時間

## 報告檔案位置

預設報告檔案儲存在：
```
storage/logs/audit/tenant_data_audit_{YYYY-MM-DD_HH-mm-ss}.{format}
```

## 排程執行

此指令已設定自動排程，每月第一天凌晨 2 點執行：
```php
$schedule->command('tenants:audit-data-associations --format=json')
         ->monthlyOn(1, '02:00');
```

排程執行的輸出會記錄到：`storage/logs/scheduled-audit.log`

## 建議使用場景

1. **定期資料品質檢查**：每月執行以確保資料完整性
2. **RLS 實施前檢查**：在實施 PostgreSQL RLS 前確認資料關聯正確
3. **資料遷移後驗證**：在資料遷移或重構後驗證租戶關聯
4. **問題排查**：當遇到多租戶相關問題時進行診斷

## 故障排除

### 常見問題

1. **記憶體不足**
   - 症狀：指令執行時出現記憶體錯誤
   - 解決：增加 PHP 記憶體限制或分批處理大型資料表

2. **資料庫連接問題**
   - 症狀：無法連接到資料庫
   - 解決：檢查 `.env` 檔案中的資料庫設定

3. **權限問題**
   - 症狀：無法寫入報告檔案
   - 解決：確保 `storage/logs/audit/` 目錄存在且有寫入權限

### 日誌記錄

稽核過程中的錯誤會記錄到 Laravel 日誌中：
```
storage/logs/laravel.log
```

## 安全考量

- 此指令為唯讀操作，不會修改任何資料
- 報告可能包含敏感的業務資料，應妥善保管
- 建議定期清理舊的稽核報告檔案

## 開發者注意事項

稽核指令的實作檔案位於：
```
app/Console/Commands/AuditDataAssociations.php
app/Console/Kernel.php (指令註冊和排程)
```

如需擴充稽核範圍或修改報告格式，請修改對應的方法。