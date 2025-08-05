# PostgreSQL Row Level Security (RLS) 完整指南

## 概述

Row Level Security (RLS) 是 PostgreSQL 的一項強大功能，允許在資料庫層級實施細粒度的行級存取控制。這對於多租戶應用程式特別有用，可以確保用戶只能存取其被授權的資料。

## 核心概念

### 1. 什麼是 RLS？
RLS 允許資料庫管理員定義策略來控制特定資料行如何對一個或多個用戶角色顯示和操作。它就像在查詢執行前自動添加的額外過濾器。

### 2. 工作原理
- RLS 策略是布林表達式，決定哪些行對用戶可見或可修改
- 策略在查詢執行時自動應用
- 可以針對不同的 SQL 命令（SELECT、INSERT、UPDATE、DELETE）定義不同的策略

## 基本語法

### 啟用 RLS
```sql
-- 啟用表的 RLS
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

-- 強制所有用戶（包括表擁有者）遵守 RLS
ALTER TABLE table_name FORCE ROW LEVEL SECURITY;
```

### 建立策略
```sql
CREATE POLICY policy_name ON table_name
    [AS { PERMISSIVE | RESTRICTIVE }]
    [FOR { ALL | SELECT | INSERT | UPDATE | DELETE }]
    [TO { role_name | PUBLIC | CURRENT_USER | SESSION_USER }]
    [USING (using_expression)]
    [WITH CHECK (check_expression)];
```

## 策略類型

### 1. Permissive Policies（寬鬆策略）
- 預設類型
- 使用 OR 邏輯組合
- 任一策略允許即可存取

```sql
CREATE POLICY view_own_data ON employees
    AS PERMISSIVE
    FOR SELECT
    USING (user_id = current_user);
```

### 2. Restrictive Policies（嚴格策略）
- 使用 AND 邏輯組合
- 所有策略都必須通過

```sql
CREATE POLICY restrict_sensitive ON employees
    AS RESTRICTIVE
    FOR ALL
    USING (NOT is_confidential);
```

## 策略子句

### USING 子句
- 控制哪些行可見（適用於 SELECT 和其他操作）
- 如果表達式返回 true，則行可見

### WITH CHECK 子句
- 控制哪些行可以被修改（INSERT 和 UPDATE）
- 如果省略，INSERT 和 UPDATE 會使用 USING 子句

## 實際應用範例

### 1. 基本多租戶隔離
```sql
-- 啟用 RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- 建立基於租戶的隔離策略
CREATE POLICY tenant_isolation ON customers
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant_id')::int);

-- 在應用程式中設置租戶 ID
SET app.current_tenant_id = '123';
```

### 2. 基於角色的存取控制
```sql
-- 經理可以看到所有員工，員工只能看到自己
CREATE POLICY employee_view ON employees
    FOR SELECT
    USING (
        current_user IN (SELECT manager_id FROM departments)
        OR user_id = current_user
    );
```

### 3. 時間基礎的存取控制
```sql
-- 只能存取最近 30 天的資料
CREATE POLICY recent_data_only ON transactions
    FOR SELECT
    USING (created_at > CURRENT_DATE - INTERVAL '30 days');
```

### 4. 複雜的多條件策略
```sql
-- 結合多個條件的策略
CREATE POLICY complex_access ON documents
    FOR ALL
    USING (
        -- 擁有者總是可以存取
        owner_id = current_user
        OR
        -- 或者是公開文件
        is_public = true
        OR
        -- 或者用戶在共享列表中
        EXISTS (
            SELECT 1 FROM document_shares
            WHERE document_id = documents.id
            AND user_id = current_user
        )
    );
```

## 效能優化

### 1. 使用索引
```sql
-- 為策略條件建立索引
CREATE INDEX idx_customers_tenant_id ON customers(tenant_id);
CREATE INDEX idx_employees_user_id ON employees(user_id);
```

### 2. 避免複雜子查詢
```sql
-- ❌ 避免
CREATE POLICY bad_performance ON orders
    USING (
        customer_id IN (
            SELECT id FROM customers
            WHERE region IN (
                SELECT region FROM user_regions
                WHERE user_id = current_user
            )
        )
    );

-- ✅ 較好的做法
CREATE POLICY good_performance ON orders
    USING (
        EXISTS (
            SELECT 1 
            FROM customers c
            JOIN user_regions ur ON c.region = ur.region
            WHERE c.id = orders.customer_id
            AND ur.user_id = current_user
        )
    );
```

### 3. 使用會話變數
```sql
-- 設置會話變數
SET LOCAL app.user_region = 'US';

-- 在策略中使用
CREATE POLICY region_access ON sales
    USING (region = current_setting('app.user_region'));
```

## 測試和調試

### 1. 測試不同角色的存取
```sql
-- 設置測試環境
SET ROLE user1;
SELECT * FROM sensitive_data; -- 應該只看到 user1 的資料

SET ROLE user2;
SELECT * FROM sensitive_data; -- 應該看到不同的資料集
```

### 2. 檢查策略定義
```sql
-- 查看表的所有策略
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'your_table';
```

### 3. 解釋查詢計劃
```sql
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM customers WHERE active = true;
```

## 安全注意事項

### 1. 繞過機制
- 超級用戶預設繞過 RLS
- 具有 BYPASSRLS 屬性的角色可以繞過
- 表擁有者預設繞過（除非使用 FORCE ROW LEVEL SECURITY）

### 2. 潛在漏洞
```sql
-- 外鍵約束檢查會繞過 RLS
-- 唯一約束檢查也會繞過 RLS
-- 需要在應用層進行額外驗證
```

### 3. 防止資訊洩漏
```sql
-- 使用 security_barrier 檢視
CREATE VIEW secure_view WITH (security_barrier) AS
SELECT * FROM sensitive_table
WHERE department = current_user_department();
```

## 與應用程式整合

### Laravel 整合範例
```php
// 中介層設置公司上下文
namespace App\Http\Middleware;

class SetCompanyContext
{
    public function handle($request, $next)
    {
        if ($companyId = session('company_id')) {
            DB::statement('SET LOCAL app.company_id = ?', [$companyId]);
        }
        
        return $next($request);
    }
}

// 在 AppServiceProvider 中全域設置
public function boot()
{
    DB::listen(function ($query) {
        if (Auth::check() && $companyId = Auth::user()->company_id) {
            DB::unprepared("SET LOCAL app.company_id = {$companyId}");
        }
    });
}
```

### Node.js 整合範例
```javascript
// 設置連接池
const pool = new Pool({
    user: 'app_user',
    host: 'localhost',
    database: 'myapp',
    password: 'password',
    port: 5432,
});

// 執行查詢時設置上下文
async function queryWithContext(userId, query, params) {
    const client = await pool.connect();
    try {
        await client.query('SET LOCAL app.user_id = $1', [userId]);
        return await client.query(query, params);
    } finally {
        client.release();
    }
}
```

## 常見問題解決

### 1. 策略不生效
```sql
-- 檢查 RLS 是否啟用
SELECT relname, relrowsecurity, relforcerowsecurity
FROM pg_class
WHERE relname = 'your_table';

-- 檢查當前用戶角色
SELECT current_user, session_user;
```

### 2. 效能問題
```sql
-- 分析策略執行
SET auto_explain.log_min_duration = 0;
SET auto_explain.log_analyze = true;

-- 查看執行計劃
EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM your_table;
```

### 3. 遷移和維護
```sql
-- 暫時停用 RLS 進行維護
ALTER TABLE your_table DISABLE ROW LEVEL SECURITY;

-- 執行維護操作
-- ...

-- 重新啟用 RLS
ALTER TABLE your_table ENABLE ROW LEVEL SECURITY;
```

## 最佳實踐總結

1. **保持策略簡單**：複雜的策略會影響效能和可維護性
2. **使用適當的索引**：為策略條件中使用的欄位建立索引
3. **謹慎使用子查詢**：盡量使用 EXISTS 而不是 IN
4. **定期測試**：確保策略按預期工作
5. **文件化**：詳細記錄每個策略的目的和邏輯
6. **監控效能**：定期檢查查詢效能
7. **安全第一**：始終考慮潛在的安全漏洞

## 參考資源

- [PostgreSQL 官方文檔 - Row Security Policies](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [PostgreSQL 中文文檔 - 資料列安全策略](https://docs.postgresql.tw/the-sql-language/ddl/row-security-policies)
- [Satori Cyber - PostgreSQL Row Level Security Guide](https://satoricyber.com/postgres-security/postgres-row-level-security/)
- [Neon - PostgreSQL Row Level Security](https://neon.com/postgresql/postgresql-administration/postgresql-row-level-security)

---
*最後更新: 2025-07-29*