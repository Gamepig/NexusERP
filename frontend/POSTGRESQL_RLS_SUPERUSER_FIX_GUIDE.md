# PostgreSQL RLS 超級用戶問題修復指南

## 🎯 問題總結

**根本原因**：Laravel 使用的資料庫用戶 `nexus` 是 PostgreSQL 超級用戶，會自動繞過所有 RLS 政策。

**診斷結果**：
- ✅ RLS 已正確啟用在所有表上
- ✅ RLS 政策語法正確且已建立
- ✅ Laravel 中間件正確設定會話變數
- ❌ 超級用戶權限繞過了所有 RLS 政策

**影響範圍**：
- `customers` 表：應顯示 8 筆公司 77 記錄，實際顯示 1800 筆全部記錄
- `products` 表：應顯示 18 筆公司 77 記錄，實際顯示 2705 筆全部記錄  
- `suppliers` 表：應顯示 0 筆公司 77 記錄，實際顯示 35 筆全部記錄

## 🔧 解決方案選擇

### 選擇 1：建立專用應用用戶（**推薦**）

**優點**：
- ✅ 符合 PostgreSQL 安全最佳實踐
- ✅ 保持超級用戶管理能力
- ✅ RLS 政策正常運作
- ✅ 最小權限原則

**缺點**：
- ⚠️ 需要更新 Laravel 配置
- ⚠️ 需要重新授權資料庫權限

### 選擇 2：強制超級用戶遵守 RLS

**優點**：
- ✅ 無需修改 Laravel 配置
- ✅ 立即生效

**缺點**：
- ❌ 影響資料庫管理操作
- ❌ 可能造成意外的管理問題
- ❌ 不符合 PostgreSQL 安全設計原則

## 🚀 推薦修復步驟（選擇 1）

### 步驟 1：執行資料庫修復腳本

```bash
# 在 PostgreSQL 中執行修復腳本
psql -U nexus -d nexus_erp -f fix-rls-superuser-issue.sql
```

### 步驟 2：更新 Laravel 資料庫配置

編輯 `.env` 檔案：

```env
# 原始配置（超級用戶）
# DB_USERNAME=nexus
# DB_PASSWORD=your_current_password

# 新配置（應用用戶）
DB_USERNAME=nexus_app
DB_PASSWORD=your_secure_password_here
```

### 步驟 3：測試 RLS 功能

```bash
# 執行 RLS 測試腳本
php debug-rls-issue.php

# 或使用 Laravel Tinker 測試
php artisan tinker
```

```php
// 在 Tinker 中測試
DB::statement("SELECT set_config('app.current_company_id', '77', false)");
$customers = DB::table('customers')->count();
echo "Customer count: $customers"; // 應該顯示 8 而不是 1800
```

### 步驟 4：驗證應用功能

1. **登入測試**：確保 Laravel 應用仍能正常登入
2. **資料存取測試**：驗證只能看到當前公司的資料
3. **CRUD 操作測試**：確保建立、讀取、更新、刪除功能正常

## 🛡️ 安全加強措施

### 建立資料庫角色權限管理

```sql
-- 建立專用角色用於不同功能
CREATE ROLE nexus_read_only;
CREATE ROLE nexus_app_admin;

-- 授予基本讀取權限
GRANT SELECT ON ALL TABLES IN SCHEMA public TO nexus_read_only;

-- 授予管理權限
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO nexus_app_admin;

-- 將角色分配給用戶
GRANT nexus_app_admin TO nexus_app;
```

### Laravel 中間件增強

更新 `SetCompanyContext` 中間件，添加額外驗證：

```php
// 在 handle 方法中添加
if ($companyId) {
    // 設定 PostgreSQL 會話變數
    DB::statement("SELECT set_config('app.current_company_id', ?, false)", [$companyId]);
    
    // 驗證 RLS 是否生效（開發環境）
    if (config('app.debug')) {
        $testCount = DB::table('customers')->count();
        $expectedCount = DB::table('customers')->where('company_id', $companyId)->count();
        
        if ($testCount !== $expectedCount) {
            Log::warning("RLS not working properly", [
                'expected' => $expectedCount,
                'actual' => $testCount,
                'company_id' => $companyId
            ]);
        }
    }
}
```

## 🧪 測試檢查清單

### 資料庫連線測試
- [ ] 使用新用戶 `nexus_app` 可以成功連線
- [ ] 可以執行基本的 SELECT、INSERT、UPDATE、DELETE 操作
- [ ] 序列（自動遞增ID）正常工作

### RLS 功能測試
- [ ] 設定公司 ID 後，查詢結果只包含該公司的資料
- [ ] 不同公司 ID 返回不同的資料集
- [ ] 未設定公司 ID 時的行為符合預期

### Laravel 應用測試
- [ ] 使用者登入功能正常
- [ ] 儀表板顯示正確的公司資料
- [ ] CRUD 操作限制在當前公司範圍內
- [ ] 報表和統計數據正確過濾

### 效能測試
- [ ] 查詢效能沒有顯著降低
- [ ] 複雜查詢的執行計劃合理
- [ ] 沒有出現意外的全表掃描

## 🔄 回退計劃

如果新配置出現問題，可以快速回退：

### 緊急回退步驟

1. **恢復原始 .env 配置**：
   ```env
   DB_USERNAME=nexus
   DB_PASSWORD=your_original_password
   ```

2. **暫時停用 RLS**（緊急情況）：
   ```sql
   ALTER TABLE customers DISABLE ROW LEVEL SECURITY;
   ALTER TABLE products DISABLE ROW LEVEL SECURITY;
   ALTER TABLE suppliers DISABLE ROW LEVEL SECURITY;
   ```

3. **重新啟動 Laravel 應用**：
   ```bash
   php artisan config:cache
   php artisan cache:clear
   ```

## 📊 監控和維護

### 定期檢查項目

1. **RLS 政策狀態**：
   ```sql
   SELECT tablename, policyname, roles, cmd 
   FROM pg_policies 
   WHERE schemaname = 'public';
   ```

2. **用戶權限檢查**：
   ```sql
   SELECT rolname, rolsuper, rolcanlogin 
   FROM pg_roles 
   WHERE rolname IN ('nexus', 'nexus_app');
   ```

3. **效能監控**：
   ```sql
   SELECT query, calls, total_time, mean_time 
   FROM pg_stat_statements 
   WHERE query LIKE '%customers%' 
   ORDER BY total_time DESC;
   ```

## 🎯 預期結果

修復完成後，應該達到以下效果：

- ✅ `customers` 表查詢返回 8 筆記錄（公司 77）
- ✅ `products` 表查詢返回 18 筆記錄（公司 77）
- ✅ `suppliers` 表查詢返回 0 筆記錄（公司 77）
- ✅ 不同公司用戶看到完全隔離的資料
- ✅ Laravel 應用功能正常運作
- ✅ 資料庫管理功能（使用 nexus 超級用戶）仍然可用

## 📞 支援和疑難排解

### 常見問題

**Q: 新用戶無法連線到資料庫**
A: 檢查密碼是否正確設定，確認用戶具有 LOGIN 權限

**Q: 出現權限不足錯誤**
A: 檢查是否已授予必要的表格和序列權限

**Q: RLS 仍然不生效**
A: 確認用戶不是超級用戶，檢查政策是否正確套用

**Q: 應用效能變慢**
A: 檢查是否需要為 company_id 欄位建立索引

### 診斷工具

使用提供的診斷腳本：
```bash
php debug-rls-issue.php
```

該腳本會檢查：
- 資料庫連線資訊
- RLS 啟用狀態
- 政策配置
- 用戶權限
- 實際資料過濾效果

---

**最後更新**：2025-07-29  
**狀態**：待執行  
**風險等級**：中等（涉及資料庫用戶變更）  
**預估時間**：30-60 分鐘