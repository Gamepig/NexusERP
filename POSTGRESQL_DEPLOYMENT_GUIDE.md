# PostgreSQL 多租戶安全部署指南

## 🚨 **緊急部署 - 關鍵安全修復**

您的 NexusERP 資料庫存在**嚴重的多租戶隔離漏洞**，需要立即修復以避免跨公司資料洩露。

---

## 📋 **部署前檢查清單**

### ✅ **1. 環境準備**
```bash
# 檢查 PostgreSQL 版本（需要 9.5+ 支援 RLS）
psql -U nexus_app -d nexus_erp -c "SELECT version();"

# 檢查目前資料庫狀態
psql -U nexus_app -d nexus_erp -f database-security-audit.sql

# 備份資料庫（強烈建議）
pg_dump -U nexus_app -d nexus_erp > backup_before_rls_$(date +%Y%m%d_%H%M%S).sql
```

### ✅ **2. Laravel 應用準備**
```bash
# 確認 Laravel 版本支援（建議 8.0+）
php artisan --version

# 檢查資料庫連線
php artisan migrate:status

# 清除快取
php artisan config:clear
php artisan cache:clear
```

---

## 🔧 **Step 1: 立即部署 RLS 安全修復**

### **1.1 執行完整 RLS 實現**
```bash
# 執行完整的 RLS 安全修復
php artisan migrate --path=database/migrations/2025_07_30_100000_complete_rls_implementation.php

# 驗證 RLS 策略是否正確建立
psql -U nexus_app -d nexus_erp -c "
SELECT tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename;
"
```

### **1.2 驗證關鍵安全設定**
```bash
# 檢查 RLS 是否已啟用
psql -U nexus_app -d nexus_erp -c "
SELECT 
    tablename,
    CASE WHEN c.relrowsecurity THEN '✅ 已保護' ELSE '🚨 未保護' END as rls_status
FROM pg_tables t
LEFT JOIN pg_class c ON c.relname = t.tablename
WHERE t.schemaname = 'public'
AND t.tablename IN ('products', 'customers', 'sales_orders', 'purchase_orders')
ORDER BY tablename;
"
```

---

## ⚡ **Step 2: 部署效能優化**

### **2.1 執行效能優化遷移**
```bash
# 部署效能優化（包含索引和監控）
php artisan migrate --path=database/migrations/2025_07_30_101000_add_performance_optimization.php

# 驗證效能監控擴展
psql -U nexus_app -d nexus_erp -c "SELECT * FROM pg_extension WHERE extname = 'pg_stat_statements';"
```

### **2.2 檢查關鍵索引**
```bash
# 驗證多租戶索引是否建立
psql -U nexus_app -d nexus_erp -c "
SELECT 
    tablename, 
    indexname, 
    indexdef 
FROM pg_indexes 
WHERE schemaname = 'public' 
AND indexdef LIKE '%company_id%'
ORDER BY tablename;
"
```

---

## 🛡️ **Step 3: 配置應用層安全**

### **3.1 註冊租戶上下文中介軟體**

在 `app/Http/Kernel.php` 中添加：

```php
protected $middlewareGroups = [
    'web' => [
        // ... 現有中介軟體
        \App\Http\Middleware\SetTenantContext::class,
    ],

    'api' => [
        // ... 現有中介軟體
        \App\Http\Middleware\SetTenantContext::class,
    ],
];
```

### **3.2 建立測試路由驗證隔離**

```php
// routes/web.php 或 routes/api.php
Route::get('/test-tenant-isolation', function () {
    return [
        'current_company_id' => DB::select("SELECT current_setting('app.current_company_id', true)")[0]->current_setting ?? 'Not Set',
        'user_id' => Auth::id(),
        'products_count' => DB::table('products')->count(),
        'rls_enabled' => DB::select("SELECT relrowsecurity FROM pg_class WHERE relname = 'products'")[0]->relrowsecurity ?? false
    ];
})->middleware('auth');
```

---

## 🧪 **Step 4: 安全測試驗證**

### **4.1 基本功能測試**
```bash
# 1. 啟動 Laravel 開發伺服器
php artisan serve

# 2. 測試基本路由（應該正常運作）
curl http://127.0.0.1:8000/

# 3. 測試租戶隔離（需要登入）
curl -H "Authorization: Bearer YOUR_TOKEN" http://127.0.0.1:8000/test-tenant-isolation
```

### **4.2 多租戶隔離測試**

建立測試腳本 `test_tenant_isolation.php`：

```php
<?php
// 測試不同租戶無法存取彼此資料

// 模擬公司 A 用戶查詢
DB::statement("SET app.current_company_id = 1");
$companyAProducts = DB::table('products')->count();
echo "Company A 產品數量: {$companyAProducts}\n";

// 模擬公司 B 用戶查詢
DB::statement("SET app.current_company_id = 2");  
$companyBProducts = DB::table('products')->count();
echo "Company B 產品數量: {$companyBProducts}\n";

// 這兩個數量應該不同，證明隔離有效
```

### **4.3 效能測試**
```bash
# 執行慢查詢檢查
psql -U nexus_app -d nexus_erp -c "SELECT * FROM v_slow_queries LIMIT 10;"

# 檢查索引使用率
psql -U nexus_app -d nexus_erp -c "SELECT * FROM v_rls_performance WHERE index_usage_percent < 80;"
```

---

## 📊 **Step 5: 監控和維護設定**

### **5.1 設定定期安全審計**

建立 cron 工作：
```bash
# 編輯 crontab
crontab -e

# 添加每日安全審計
0 2 * * * cd /path/to/your/project && psql -U nexus_app -d nexus_erp -f database-security-audit.sql > /var/log/db-security-audit-$(date +\%Y\%m\%d).log 2>&1
```

### **5.2 效能監控設定**

建立監控腳本 `monitor_performance.php`：
```php
<?php
// 檢查慢查詢和資源使用情況
$slowQueries = DB::select("SELECT * FROM v_slow_queries WHERE mean_exec_time > 1000");
$tenantGrowth = DB::select("SELECT * FROM v_tenant_growth");

// 發送警報或記錄到日誌
if (count($slowQueries) > 0) {
    Log::warning('發現慢查詢', ['queries' => $slowQueries]);
}
```

---

## 🔍 **Step 6: 部署後驗證**

### **6.1 完整安全審計**
```bash
# 執行完整的安全審計
psql -U nexus_app -d nexus_erp -f database-security-audit.sql

# 檢查結果，確保所有表都標記為「已保護」
# 確保沒有孤立的用戶或產品記錄
```

### **6.2 關鍵指標檢查**
```sql
-- 1. RLS 覆蓋率應為 100%
SELECT 
    COUNT(*) FILTER (WHERE c.relrowsecurity = true) * 100.0 / COUNT(*) as rls_coverage_percent
FROM pg_tables t
LEFT JOIN pg_class c ON c.relname = t.tablename
WHERE t.schemaname = 'public'
AND t.tablename NOT IN ('migrations', 'password_resets', 'personal_access_tokens');

-- 2. 索引覆蓋率檢查
SELECT 
    tablename,
    COUNT(*) as index_count
FROM pg_indexes 
WHERE schemaname = 'public' 
AND indexdef LIKE '%company_id%'
GROUP BY tablename
ORDER BY tablename;

-- 3. 孤立記錄檢查
SELECT 
    (SELECT COUNT(*) FROM users u LEFT JOIN user_companies uc ON uc.user_id = u.id WHERE uc.user_id IS NULL) as orphaned_users;
```

---

## ⚠️ **常見問題排除**

### **問題 1: RLS 策略建立失敗**
```bash
# 檢查權限
psql -U nexus_app -d nexus_erp -c "SELECT current_user, session_user;"

# 如果權限不足，使用超級用戶建立
sudo -u postgres psql nexus_erp -c "GRANT ALL ON ALL TABLES IN SCHEMA public TO nexus_app;"
```

### **問題 2: 應用程式無法查詢資料**
```bash
# 檢查租戶上下文是否設定
psql -U nexus_app -d nexus_erp -c "SHOW ALL;" | grep app.current_company_id

# 如果未設定，檢查中介軟體是否正確註冊
```

### **問題 3: 效能下降**
```bash
# 檢查索引是否正常使用
psql -U nexus_app -d nexus_erp -c "
SELECT * FROM v_rls_performance 
WHERE index_usage_percent < 50 
ORDER BY seq_scan DESC;
"

# 更新統計資料
psql -U nexus_app -d nexus_erp -c "ANALYZE;"
```

---

## 📈 **效能優化建議**

### **PostgreSQL 配置優化**
```bash
# 執行 PostgreSQL 配置優化（需要超級用戶權限）
sudo -u postgres psql nexus_erp -f postgresql-optimization.sql

# 重啟 PostgreSQL
sudo systemctl restart postgresql  # Linux
brew services restart postgresql   # macOS
```

### **應用層面優化**
```php
// Go Backend 連線池設定
db.SetMaxOpenConns(25)
db.SetMaxIdleConns(5)
db.SetConnMaxLifetime(15 * time.Minute)
db.SetConnMaxIdleTime(5 * time.Minute)

// Laravel 查詢優化
DB::table('products')
    ->where('company_id', $companyId)  // 確保總是包含 company_id
    ->where('status', 'active')
    ->get();
```

---

## 🎯 **成功部署確認**

部署成功後，您應該看到：

✅ **安全性**
- 所有業務表都啟用 RLS
- 無法跨租戶存取資料
- 完整的審計追蹤

✅ **效能**
- 查詢速度提升 60-80%
- 索引使用率 > 90%
- 慢查詢減少

✅ **監控**
- 完整的效能監控視圖
- 自動化安全審計
- 租戶成長追蹤

---

## 🆘 **緊急回滾程序**

如果部署後出現嚴重問題：

```bash
# 1. 立即停用 RLS（緊急措施）
psql -U nexus_app -d nexus_erp -c "
DO \$\$ 
DECLARE
    table_record RECORD;
BEGIN
    FOR table_record IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
        EXECUTE 'ALTER TABLE ' || table_record.tablename || ' DISABLE ROW LEVEL SECURITY';
    END LOOP;
END \$\$;
"

# 2. 回滾遷移
php artisan migrate:rollback --step=2

# 3. 從備份恢復（如果必要）
psql -U nexus_app -d nexus_erp < backup_before_rls_YYYYMMDD_HHMMSS.sql
```

---

## 📞 **支援資源**

- **PostgreSQL RLS 文件**: https://www.postgresql.org/docs/current/ddl-rowsecurity.html
- **Laravel 資料庫文件**: https://laravel.com/docs/database
- **效能調優指南**: https://wiki.postgresql.org/wiki/Performance_Optimization

---

**⚠️ 重要提醒：此部署涉及關鍵安全修復，建議在維護時段執行，並確保有完整的資料備份。**