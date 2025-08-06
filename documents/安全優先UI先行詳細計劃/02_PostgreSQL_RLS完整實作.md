# PostgreSQL RLS 快速實作計劃 - 修正版

**階段**: 第二階段 - 快速開發版RLS  
**預估時間**: 1週 (大幅縮減)  
**優先級**: 🚀 快速開發策略  

---

## 🚀 **快速開發核心原則**

### **MVP-First策略 (RLS版)**
- ✅ **簡化策略優先** - 使用最基本的RLS政策
- ✅ **必要隔離保證** - 確保基本的公司資料隔離  
- ✅ **避免過度設計** - 跳過複雜的安全機制
- ✅ **漸進式完善** - 基礎穩定後再增強

### **避免過度工程化**
- ❌ **複雜安全驗證** - 避免多層安全檢查和上下文驗證
- ❌ **效能過度優化** - 避免複雜的索引和查詢優化
- ❌ **監控告警** - 基礎功能穩定前不考慮監控
- ❌ **併發保護** - 避免分散式鎖和複雜的併發控制

### **實作目標重新定義**
**第一階段 (3天)**: 基本RLS策略 + 公司隔離
**第二階段 (2天)**: 基礎索引優化 + 簡單測試  
**第三階段 (選配)**: 安全增強特性

---

## 📋 **現況分析**

### **現有基礎評估** ✅

```sql
-- 當前狀態：基本RLS已部分實作
-- 主要業務表：products, customers, sales_orders, inventory_items

-- ✅ 現有簡單策略模式
CREATE POLICY company_isolation_[table] ON [table]
    FOR ALL TO nexus_app
    USING (company_id = current_setting('app.current_company_id', true)::int);
```

**快速開發評估**：現有基礎可用，只需要補強和簡化

---

## 🚀 **快速開發實作方案**

### **第一階段 (3天): 基本RLS策略**

#### **2.1 簡化的RLS策略建立 (1天)**

```sql
-- 簡化的RLS策略生成函數
CREATE OR REPLACE FUNCTION create_simple_company_policy(table_name TEXT)
RETURNS void AS $$
DECLARE
    policy_name TEXT := 'simple_company_isolation_' || table_name;
BEGIN
    -- 移除現有策略
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', policy_name, table_name);
    
    -- 建立簡單策略
    EXECUTE format('
        CREATE POLICY %I ON %I
            FOR ALL TO nexus_app
            USING (
                company_id = current_setting(''app.current_company_id'', true)::int
                AND current_setting(''app.current_company_id'', true) != ''''
                AND company_id > 0
            )
            WITH CHECK (
                company_id = current_setting(''app.current_company_id'', true)::int
                AND current_setting(''app.current_company_id'', true) != ''''
                AND company_id > 0
            )', policy_name, table_name);
    
    -- 啟用RLS
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_name);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', table_name);
END;
$$ LANGUAGE plpgsql;

-- 快速部署腳本
DO $$
DECLARE
    table_list TEXT[] := ARRAY['products', 'customers', 'sales_orders', 'inventory_items'];
    table_name TEXT;
BEGIN
    FOREACH table_name IN ARRAY table_list
    LOOP
        PERFORM create_simple_company_policy(table_name);
        RAISE NOTICE 'RLS policy created for: %', table_name;
    END LOOP;
END;
$$;
```

#### **2.2 簡化的上下文設定 (1天)**

```sql
-- 簡化的上下文設定函數
CREATE OR REPLACE FUNCTION set_simple_rls_context(user_id INT, company_id INT)
RETURNS void AS $$
BEGIN
    -- 基本輸入驗證
    IF user_id <= 0 OR company_id <= 0 THEN
        RAISE EXCEPTION 'Invalid user_id or company_id';
    END IF;
    
    -- 設定上下文
    PERFORM set_config('app.current_user_id', user_id::text, true);
    PERFORM set_config('app.current_company_id', company_id::text, true);
END;
$$ LANGUAGE plpgsql;
```

#### **2.3 基本測試驗證 (1天)**

```sql
-- 簡化的RLS測試
CREATE OR REPLACE FUNCTION test_simple_rls_isolation()
RETURNS boolean AS $$
DECLARE
    company1_count INTEGER;
    company2_count INTEGER;
BEGIN
    -- 測試公司1的隔離
    PERFORM set_simple_rls_context(1, 1);
    SELECT COUNT(*) INTO company1_count FROM products;
    
    -- 測試公司2的隔離  
    PERFORM set_simple_rls_context(2, 2);
    SELECT COUNT(*) INTO company2_count FROM products;
    
    -- 重置上下文
    PERFORM set_config('app.current_company_id', '', true);
    
    -- 返回測試結果
    RETURN company1_count != company2_count OR (company1_count = 0 AND company2_count = 0);
END;
$$ LANGUAGE plpgsql;
```

### **第二階段 (2天): 基礎優化**

#### **2.4 基本索引優化 (1天)**

```sql
-- 為RLS查詢建立專用索引
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_company_rls 
ON products (company_id, status) WHERE company_id > 0;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customers_company_rls 
ON customers (company_id, status) WHERE company_id > 0;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sales_orders_company_rls 
ON sales_orders (company_id, order_date DESC) WHERE company_id > 0;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_inventory_items_company_rls 
ON inventory_items (company_id, product_id) WHERE company_id > 0;
```

#### **2.5 Laravel整合 (1天)**

```php
<?php
// app/Services/SimpleRLSService.php

namespace App\Services;

use Illuminate\Support\Facades\{DB, Log};

class SimpleRLSService
{
    /**
     * 設定RLS上下文
     */
    public function setContext(int $userId, int $companyId): bool
    {
        try {
            DB::select('SELECT set_simple_rls_context(?, ?)', [$userId, $companyId]);
            return true;
        } catch (\Exception $e) {
            Log::error('RLS上下文設定失敗', [
                'user_id' => $userId,
                'company_id' => $companyId,
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }
    
    /**
     * 測試RLS隔離
     */
    public function testIsolation(): bool
    {
        try {
            $result = DB::select('SELECT test_simple_rls_isolation() as result');
            return $result[0]->result ?? false;
        } catch (\Exception $e) {
            Log::error('RLS隔離測試失敗', ['error' => $e->getMessage()]);
            return false;
        }
    }
    
    /**
     * 清除RLS上下文
     */
    public function clearContext(): void
    {
        try {
            DB::statement("SET app.current_company_id = ''");
            DB::statement("SET app.current_user_id = ''");
        } catch (\Exception $e) {
            Log::error('清除RLS上下文失敗', ['error' => $e->getMessage()]);
        }
    }
}
```

---

## ✅ **快速開發版驗收標準**

### **第一階段驗收 (3天完成)**
- [ ] 主要業務表 (products, customers, sales_orders, inventory_items) 啟用RLS
- [ ] 公司間資料完全隔離，無交叉存取
- [ ] RLS上下文設定函數正常工作
- [ ] 基本的隔離測試通過

### **第二階段驗收 (2天完成)**
- [ ] RLS專用索引建立完成
- [ ] Laravel RLS服務整合正常
- [ ] 查詢效能在可接受範圍內 (<200ms)
- [ ] 所有測試案例通過

### **效能要求**
- [ ] RLS查詢延遲增加 < 50ms
- [ ] 資料隔離正確率 100%
- [ ] 基本查詢效能可接受

### **安全底線**
- [ ] 不同公司資料完全隔離
- [ ] 基本的上下文驗證
- [ ] 錯誤處理和日誌記錄

---

## 🚀 **第三階段規劃 (選配)**

### **進階功能 (選配)**
1. **效能監控** - 監控RLS查詢效能
2. **安全審計** - 記錄資料存取日誌
3. **動態策略** - 支援更複雜的隔離規則
4. **快取優化** - 查詢結果快取

### **成功關鍵**
- ✅ **保持簡單** - 避免過度複雜的安全機制
- ✅ **測試優先** - 每個功能都有驗證
- ✅ **效能平衡** - 安全性與效能的平衡
- ✅ **漸進增強** - 基礎穩定後再添加功能

**🎯 總結**: 快速開發版RLS將實作時間從2-3週縮短到1週，同時保證基本的多租戶資料隔離要求，避免過度工程化的陷阱！ 
ON inventory_items (company_id, product_id, warehouse_id) 
WHERE status IN ('available', 'reserved') AND quantity > 0;

-- 3. 表達式索引 (常用計算)
CREATE INDEX CONCURRENTLY idx_orders_company_month 
ON sales_orders (company_id, date_trunc('month', order_date));

-- 4. GIN索引 (JSON數據搜尋)
CREATE INDEX CONCURRENTLY idx_products_company_metadata 
ON products USING GIN (company_id, metadata) 
WHERE metadata IS NOT NULL;

-- 5. 覆蓋索引 (避免回表查詢)
CREATE INDEX CONCURRENTLY idx_customers_company_summary 
ON customers (company_id) 
INCLUDE (name, email, phone, total_orders, last_order_date) 
WHERE status = 'active';
```

#### **RLS策略優化**
```sql
-- 檔案: 2025_08_03_100002_optimize_rls_policies.sql

-- 1. 優化的公司隔離策略 (使用索引友善的方式)
DROP POLICY IF EXISTS company_isolation_products ON products;
CREATE POLICY company_isolation_products ON products
    FOR ALL TO nexus_app
    USING (company_id = COALESCE(current_setting('app.current_company_id', true)::int, -1))
    WITH CHECK (company_id = COALESCE(current_setting('app.current_company_id', true)::int, -1));

-- 為大表啟用更高效的策略
DROP POLICY IF EXISTS company_isolation_sales_orders ON sales_orders;
CREATE POLICY company_isolation_sales_orders ON sales_orders
    FOR ALL TO nexus_app
    USING (
        company_id = COALESCE(current_setting('app.current_company_id', true)::int, -1)
        AND status != 'deleted' -- 避免查詢已刪除數據
    )
    WITH CHECK (
        company_id = COALESCE(current_setting('app.current_company_id', true)::int, -1)
        AND status != 'deleted'
    );

-- 2. 特殊表的優化策略
-- 用戶表：支援超級管理員模式
DROP POLICY IF EXISTS users_company_isolation ON users;
CREATE POLICY users_company_isolation ON users
    FOR ALL TO nexus_app
    USING (
        -- 一般用戶：只能看到同公司用戶
        EXISTS (
            SELECT 1 FROM user_companies uc 
            WHERE uc.user_id = users.id 
            AND uc.company_id = COALESCE(current_setting('app.current_company_id', true)::int, -1)
            AND uc.is_active = true
        )
        OR
        -- 超級管理員模式：可以看到所有用戶
        COALESCE(current_setting('app.superuser_mode', true)::boolean, false) = true
        OR
        -- 用戶自己：總是可以看到自己
        id = COALESCE(current_setting('app.current_user_id', true)::int, -1)
    );

-- 3. 關聯表的高效能策略
DROP POLICY IF EXISTS user_roles_company_isolation ON user_roles;
CREATE POLICY user_roles_company_isolation ON user_roles
    FOR ALL TO nexus_app
    USING (
        -- 使用EXISTS子查詢，並利用索引
        EXISTS (
            SELECT 1 FROM user_companies uc 
            WHERE uc.user_id = user_roles.user_id 
            AND uc.company_id = COALESCE(current_setting('app.current_company_id', true)::int, -1)
            AND uc.is_active = true
        )
    );

-- 4. 分層安全策略
-- Level 1: 公司隔離
CREATE POLICY L1_inventory_company_isolation ON inventory_items
    FOR ALL TO nexus_app
    USING (company_id = COALESCE(current_setting('app.current_company_id', true)::int, -1));

-- Level 2: 部門權限 (在應用層控制)
CREATE POLICY L2_inventory_department_access ON inventory_items
    FOR SELECT TO nexus_app
    USING (
        -- 檢查用戶是否有該倉庫的存取權限
        warehouse_id = ANY(
            string_to_array(
                COALESCE(current_setting('app.accessible_warehouses', true), ''), 
                ','
            )::int[]
        )
        OR 
        -- 倉庫管理員可以存取所有倉庫
        COALESCE(current_setting('app.user_role', true), '') = 'warehouse_admin'
    );
```

### **階段 2.2: 進階安全機制 (4天)**

#### **動態RLS上下文管理**
```go
// 檔案: internal/middleware/rls_context_middleware.go
package middleware

import (
    "database/sql"
    "fmt"
    "nexus-erp/backend/internal/database"
    "strconv"
    "strings"
    
    "github.com/gin-gonic/gin"
)

type RLSContextMiddleware struct {
    db *sql.DB
}

func NewRLSContextMiddleware() *RLSContextMiddleware {
    return &RLSContextMiddleware{
        db: database.GetDB(),
    }
}

func (m *RLSContextMiddleware) SetRLSContext() gin.HandlerFunc {
    return func(c *gin.Context) {
        // 從JWT Claims中獲取用戶資訊
        userID := c.GetInt64("user_id")
        companyID := c.GetInt64("company_id")
        userRoles := c.GetStringSlice("user_roles")
        
        if userID == 0 || companyID == 0 {
            c.JSON(401, gin.H{"error": "invalid_user_context"})
            c.Abort()
            return
        }
        
        // 設定PostgreSQL會話變數
        if err := m.setDatabaseContext(userID, companyID, userRoles); err != nil {
            c.JSON(500, gin.H{"error": "failed_to_set_db_context"})
            c.Abort()
            return
        }
        
        // 設定用戶可存取的資源清單
        if err := m.setAccessibleResources(userID, companyID); err != nil {
            // 記錄警告但不阻斷請求
            fmt.Printf("Warning: Failed to set accessible resources: %v\n", err)
        }
        
        c.Next()
        
        // 請求結束後清理上下文 (可選)
        m.clearDatabaseContext()
    }
}

func (m *RLSContextMiddleware) setDatabaseContext(userID, companyID int64, roles []string) error {
    // 基礎上下文設定
    queries := []string{
        fmt.Sprintf("SET app.current_user_id = %d", userID),
        fmt.Sprintf("SET app.current_company_id = %d", companyID),
        fmt.Sprintf("SET app.user_role = '%s'", strings.Join(roles, ",")),
    }
    
    // 判斷是否為超級管理員
    isSuperUser := m.checkSuperUserStatus(userID, roles)
    queries = append(queries, fmt.Sprintf("SET app.superuser_mode = %t", isSuperUser))
    
    // 批次執行設定
    for _, query := range queries {
        if _, err := m.db.Exec(query); err != nil {
            return fmt.Errorf("failed to execute context query %s: %w", query, err)
        }
    }
    
    return nil
}

func (m *RLSContextMiddleware) setAccessibleResources(userID, companyID int64) error {
    // 獲取用戶可存取的倉庫清單
    warehouses, err := m.getUserAccessibleWarehouses(userID, companyID)
    if err != nil {
        return err
    }
    
    warehouseIDs := make([]string, len(warehouses))
    for i, wh := range warehouses {
        warehouseIDs[i] = strconv.FormatInt(wh, 10)
    }
    
    // 設定可存取倉庫清單
    warehouseList := strings.Join(warehouseIDs, ",")
    _, err = m.db.Exec("SET app.accessible_warehouses = $1", warehouseList)
    
    return err
}

func (m *RLSContextMiddleware) getUserAccessibleWarehouses(userID, companyID int64) ([]int64, error) {
    query := `
        SELECT DISTINCT w.id 
        FROM warehouses w
        LEFT JOIN user_warehouse_permissions uwp ON w.id = uwp.warehouse_id
        WHERE w.company_id = $1 
        AND (
            uwp.user_id = $2 
            OR EXISTS (
                SELECT 1 FROM user_roles ur 
                JOIN roles r ON ur.role_id = r.id 
                WHERE ur.user_id = $2 
                AND r.name IN ('admin', 'warehouse_admin')
            )
        )
    `
    
    rows, err := m.db.Query(query, companyID, userID)
    if err != nil {
        return nil, err
    }
    defer rows.Close()
    
    var warehouses []int64
    for rows.Next() {
        var warehouseID int64
        if err := rows.Scan(&warehouseID); err != nil {
            return nil, err
        }
        warehouses = append(warehouses, warehouseID)
    }
    
    return warehouses, nil
}

func (m *RLSContextMiddleware) checkSuperUserStatus(userID int64, roles []string) bool {
    // 檢查是否為系統管理員
    for _, role := range roles {
        if role == "super_admin" || role == "system_admin" {
            return true
        }
    }
    return false
}

func (m *RLSContextMiddleware) clearDatabaseContext() {
    // 清理會話變數 (可選，連接池會自動處理)
    clearQueries := []string{
        "SET app.current_user_id = DEFAULT",
        "SET app.current_company_id = DEFAULT",
        "SET app.user_role = DEFAULT",
        "SET app.superuser_mode = DEFAULT",
        "SET app.accessible_warehouses = DEFAULT",
    }
    
    for _, query := range clearQueries {
        m.db.Exec(query) // 忽略錯誤
    }
}
```

#### **安全審計與監控系統**
```sql
-- 檔案: 2025_08_03_100003_enhanced_security_audit.sql

-- 1. 增強的安全審計表
CREATE TABLE IF NOT EXISTS security_audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- 基礎資訊
    company_id INTEGER,
    user_id INTEGER,
    session_id VARCHAR(255),
    
    -- 操作資訊
    action VARCHAR(50) NOT NULL, -- SELECT, INSERT, UPDATE, DELETE
    table_name VARCHAR(100) NOT NULL,
    record_id TEXT, -- 支援UUID和INTEGER
    
    -- 安全上下文
    ip_address INET,
    user_agent TEXT,
    request_path TEXT,
    
    -- 資料變更
    old_values JSONB,
    new_values JSONB,
    affected_columns TEXT[], -- 受影響的欄位
    
    -- 查詢資訊
    query_text TEXT,
    query_duration_ms INTEGER,
    rows_affected INTEGER,
    
    -- 安全標記
    security_level VARCHAR(20) DEFAULT 'normal', -- normal, sensitive, critical
    access_granted BOOLEAN DEFAULT true,
    failure_reason TEXT,
    
    -- 時間戳記
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- 分區鍵
    audit_date DATE DEFAULT CURRENT_DATE
) PARTITION BY RANGE (audit_date);

-- 建立月度分區
CREATE TABLE security_audit_logs_2025_08 PARTITION OF security_audit_logs
    FOR VALUES FROM ('2025-08-01') TO ('2025-09-01');
CREATE TABLE security_audit_logs_2025_09 PARTITION OF security_audit_logs
    FOR VALUES FROM ('2025-09-01') TO ('2025-10-01');
-- 繼續建立未來月份...

-- 索引優化
CREATE INDEX idx_audit_company_time ON security_audit_logs (company_id, created_at DESC);
CREATE INDEX idx_audit_user_action ON security_audit_logs (user_id, action, created_at DESC);
CREATE INDEX idx_audit_table_security ON security_audit_logs (table_name, security_level, created_at DESC);
CREATE INDEX idx_audit_session ON security_audit_logs (session_id, created_at DESC);

-- 2. 智慧審計觸發器函數
CREATE OR REPLACE FUNCTION intelligent_security_audit()
RETURNS TRIGGER AS $$
DECLARE
    current_user_id INTEGER;
    current_company_id INTEGER;
    current_session_id TEXT;
    security_classification TEXT := 'normal';
    query_start_time TIMESTAMP;
    query_duration INTEGER;
    affected_cols TEXT[];
BEGIN
    -- 獲取當前上下文
    current_user_id := COALESCE(current_setting('app.current_user_id', true)::integer, 0);
    current_company_id := COALESCE(current_setting('app.current_company_id', true)::integer, 0);
    current_session_id := COALESCE(current_setting('app.session_id', true), '');
    
    -- 獲取查詢開始時間 (如果可用)
    query_start_time := COALESCE(current_setting('app.query_start_time', true)::timestamp, CURRENT_TIMESTAMP);
    query_duration := EXTRACT(epoch FROM (CURRENT_TIMESTAMP - query_start_time)) * 1000;
    
    -- 判斷安全等級
    security_classification := classify_table_security(TG_TABLE_NAME);
    
    -- 識別受影響的欄位 (UPDATE操作)
    IF TG_OP = 'UPDATE' THEN
        affected_cols := get_changed_columns(OLD, NEW);
    END IF;
    
    -- 記錄審計日誌
    INSERT INTO security_audit_logs (
        company_id, user_id, session_id,
        action, table_name, record_id,
        ip_address, user_agent,
        old_values, new_values, affected_columns,
        query_duration_ms, rows_affected,
        security_level, access_granted
    ) VALUES (
        current_company_id, current_user_id, current_session_id,
        TG_OP, TG_TABLE_NAME, 
        COALESCE(NEW.id::text, OLD.id::text),
        COALESCE(current_setting('app.client_ip', true)::inet, '127.0.0.1'::inet),
        COALESCE(current_setting('app.user_agent', true), ''),
        CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN row_to_json(OLD) ELSE NULL END,
        CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW) ELSE NULL END,
        affected_cols,
        query_duration, 1,
        security_classification, true
    );
    
    -- 敏感資料額外檢查
    IF security_classification IN ('sensitive', 'critical') THEN
        PERFORM notify_security_team(TG_TABLE_NAME, TG_OP, current_user_id);
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. 輔助函數
CREATE OR REPLACE FUNCTION classify_table_security(table_name TEXT)
RETURNS TEXT AS $$
BEGIN
    CASE table_name
        WHEN 'users', 'user_sessions', 'user_roles' THEN
            RETURN 'critical';
        WHEN 'financial_transactions', 'financial_accounts', 'expenses' THEN
            RETURN 'sensitive';
        WHEN 'customers', 'suppliers', 'products' THEN
            RETURN 'sensitive';
        ELSE
            RETURN 'normal';
    END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION get_changed_columns(old_record RECORD, new_record RECORD)
RETURNS TEXT[] AS $$
DECLARE
    changed_cols TEXT[] := '{}';
    col_name TEXT;
    old_val TEXT;
    new_val TEXT;
BEGIN
    -- 動態比較所有欄位 (簡化版本)
    FOR col_name IN 
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = TG_TABLE_NAME 
        AND table_schema = 'public'
    LOOP
        -- 這裡需要動態SQL來比較欄位值
        -- 實際實作會更複雜，這裡提供概念
        old_val := (old_record::json ->> col_name);
        new_val := (new_record::json ->> col_name);
        
        IF COALESCE(old_val, '') != COALESCE(new_val, '') THEN
            changed_cols := array_append(changed_cols, col_name);
        END IF;
    END LOOP;
    
    RETURN changed_cols;
END;
$$ LANGUAGE plpgsql;

-- 4. 為重要表啟用審計
CREATE TRIGGER audit_users 
    AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW EXECUTE FUNCTION intelligent_security_audit();

CREATE TRIGGER audit_financial_transactions 
    AFTER INSERT OR UPDATE OR DELETE ON financial_transactions
    FOR EACH ROW EXECUTE FUNCTION intelligent_security_audit();

CREATE TRIGGER audit_customers 
    AFTER INSERT OR UPDATE OR DELETE ON customers
    FOR EACH ROW EXECUTE FUNCTION intelligent_security_audit();

-- 更多表的審計觸發器...
```

### **階段 2.3: 效能監控與告警 (3天)**

#### **RLS效能監控系統**
```sql
-- 檔案: 2025_08_03_100004_rls_performance_monitoring.sql

-- 1. RLS效能統計表
CREATE TABLE rls_performance_stats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- 查詢資訊
    table_name VARCHAR(100) NOT NULL,
    query_type VARCHAR(20) NOT NULL, -- SELECT, INSERT, UPDATE, DELETE
    
    -- 效能指標
    avg_execution_time_ms DECIMAL(10,3),
    max_execution_time_ms DECIMAL(10,3),
    min_execution_time_ms DECIMAL(10,3),
    total_queries INTEGER,
    
    -- RLS特定指標
    rls_policy_evaluation_time_ms DECIMAL(10,3),
    index_usage_ratio DECIMAL(5,4), -- 索引使用率
    seq_scan_ratio DECIMAL(5,4), -- 順序掃描率
    
    -- 上下文資訊
    company_id INTEGER,
    user_role VARCHAR(50),
    
    -- 時間窗口
    stats_date DATE DEFAULT CURRENT_DATE,
    hour_of_day INTEGER DEFAULT EXTRACT(hour FROM CURRENT_TIMESTAMP),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX idx_rls_stats_table_date ON rls_performance_stats (table_name, stats_date);
CREATE INDEX idx_rls_stats_performance ON rls_performance_stats (avg_execution_time_ms DESC, total_queries DESC);

-- 2. 自動效能數據收集函數
CREATE OR REPLACE FUNCTION collect_rls_performance_stats()
RETURNS void AS $$
DECLARE
    stat_record RECORD;
BEGIN
    -- 從 pg_stat_statements 收集數據 (需要啟用該擴展)
    FOR stat_record IN
        SELECT 
            regexp_replace(query, '.*FROM\s+(\w+).*', '\1') as table_name,
            CASE 
                WHEN query ILIKE 'SELECT%' THEN 'SELECT'
                WHEN query ILIKE 'INSERT%' THEN 'INSERT'
                WHEN query ILIKE 'UPDATE%' THEN 'UPDATE'
                WHEN query ILIKE 'DELETE%' THEN 'DELETE'
                ELSE 'OTHER'
            END as query_type,
            mean_exec_time as avg_time,
            max_exec_time as max_time,
            min_exec_time as min_time,
            calls as total_calls
        FROM pg_stat_statements 
        WHERE query LIKE '%company_id%' -- RLS相關查詢
        AND calls > 10 -- 過濾低頻查詢
    LOOP
        -- 更新或插入統計數據
        INSERT INTO rls_performance_stats (
            table_name, query_type, 
            avg_execution_time_ms, max_execution_time_ms, min_execution_time_ms,
            total_queries
        ) VALUES (
            stat_record.table_name, stat_record.query_type,
            stat_record.avg_time, stat_record.max_time, stat_record.min_time,
            stat_record.total_calls
        )
        ON CONFLICT (table_name, query_type, stats_date, hour_of_day) 
        DO UPDATE SET
            avg_execution_time_ms = EXCLUDED.avg_execution_time_ms,
            max_execution_time_ms = EXCLUDED.max_execution_time_ms,
            min_execution_time_ms = EXCLUDED.min_execution_time_ms,
            total_queries = EXCLUDED.total_queries,
            updated_at = CURRENT_TIMESTAMP;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 3. 效能告警函數
CREATE OR REPLACE FUNCTION check_rls_performance_alerts()
RETURNS void AS $$
DECLARE
    alert_record RECORD;
    alert_message TEXT;
BEGIN
    -- 檢查慢查詢
    FOR alert_record IN
        SELECT table_name, query_type, avg_execution_time_ms, total_queries
        FROM rls_performance_stats 
        WHERE stats_date = CURRENT_DATE
        AND avg_execution_time_ms > 1000 -- 超過1秒的查詢
        AND total_queries > 100 -- 高頻查詢
    LOOP
        alert_message := format(
            'RLS Performance Alert: Table %s %s queries averaging %s ms (%s total queries)',
            alert_record.table_name,
            alert_record.query_type,
            alert_record.avg_execution_time_ms,
            alert_record.total_queries
        );
        
        -- 發送告警 (實際環境可以整合外部告警系統)
        INSERT INTO system_alerts (
            alert_type, severity, message, 
            metadata, created_at
        ) VALUES (
            'rls_performance', 'warning', alert_message,
            jsonb_build_object(
                'table_name', alert_record.table_name,
                'query_type', alert_record.query_type,
                'avg_time_ms', alert_record.avg_execution_time_ms
            ),
            CURRENT_TIMESTAMP
        );
    END LOOP;
    
    -- 檢查索引使用率低的情況
    FOR alert_record IN
        SELECT table_name, seq_scan_ratio
        FROM rls_performance_stats 
        WHERE stats_date = CURRENT_DATE
        AND seq_scan_ratio > 0.3 -- 順序掃描超過30%
        AND total_queries > 50
    LOOP
        alert_message := format(
            'RLS Index Alert: Table %s has high sequential scan ratio: %s%%',
            alert_record.table_name,
            (alert_record.seq_scan_ratio * 100)::integer
        );
        
        INSERT INTO system_alerts (
            alert_type, severity, message, 
            metadata, created_at
        ) VALUES (
            'rls_index_optimization', 'info', alert_message,
            jsonb_build_object(
                'table_name', alert_record.table_name,
                'seq_scan_ratio', alert_record.seq_scan_ratio
            ),
            CURRENT_TIMESTAMP
        );
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 4. 自動化任務調度 (需要 pg_cron 擴展)
-- 每小時收集效能統計
SELECT cron.schedule('collect-rls-stats', '0 * * * *', 'SELECT collect_rls_performance_stats();');

-- 每日效能告警檢查
SELECT cron.schedule('rls-performance-alerts', '0 9 * * *', 'SELECT check_rls_performance_alerts();');
```

#### **Go Backend效能監控整合**
```go
// 檔案: internal/middleware/rls_performance_middleware.go
package middleware

import (
    "context"
    "database/sql"
    "fmt"
    "time"
    
    "github.com/gin-gonic/gin"
)

type RLSPerformanceMiddleware struct {
    db *sql.DB
}

func NewRLSPerformanceMiddleware(db *sql.DB) *RLSPerformanceMiddleware {
    return &RLSPerformanceMiddleware{db: db}
}

func (m *RLSPerformanceMiddleware) TrackPerformance() gin.HandlerFunc {
    return func(c *gin.Context) {
        // 記錄查詢開始時間
        startTime := time.Now()
        
        // 設定查詢開始時間到資料庫上下文
        m.db.ExecContext(c.Request.Context(), 
            "SET app.query_start_time = $1", startTime)
        
        // 設定客戶端資訊
        m.db.ExecContext(c.Request.Context(),
            "SET app.client_ip = $1", c.ClientIP())
        m.db.ExecContext(c.Request.Context(),
            "SET app.user_agent = $1", c.GetHeader("User-Agent"))
        
        c.Next()
        
        // 計算總處理時間
        duration := time.Since(startTime)
        
        // 記錄效能指標
        go m.recordPerformanceMetrics(c, duration)
    }
}

func (m *RLSPerformanceMiddleware) recordPerformanceMetrics(c *gin.Context, duration time.Duration) {
    // 異步記錄效能指標，避免影響主請求
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()
    
    userID := c.GetInt64("user_id")
    companyID := c.GetInt64("company_id")
    path := c.Request.URL.Path
    method := c.Request.Method
    
    query := `
        INSERT INTO api_performance_logs (
            user_id, company_id, 
            request_path, request_method,
            response_time_ms, status_code,
            created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    `
    
    _, err := m.db.ExecContext(ctx, query,
        userID, companyID,
        path, method,
        duration.Milliseconds(), c.Writer.Status(),
        time.Now(),
    )
    
    if err != nil {
        fmt.Printf("Failed to record performance metrics: %v\n", err)
    }
    
    // 如果響應時間過長，記錄警告
    if duration > 2*time.Second {
        m.logSlowRequest(ctx, c, duration)
    }
}

func (m *RLSPerformanceMiddleware) logSlowRequest(ctx context.Context, c *gin.Context, duration time.Duration) {
    query := `
        INSERT INTO slow_request_logs (
            user_id, company_id, request_path,
            response_time_ms, user_agent, 
            query_params, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    `
    
    m.db.ExecContext(ctx, query,
        c.GetInt64("user_id"),
        c.GetInt64("company_id"),
        c.Request.URL.Path,
        duration.Milliseconds(),
        c.GetHeader("User-Agent"),
        c.Request.URL.RawQuery,
        time.Now(),
    )
}
```

---

## 🧪 **測試策略**

### **安全性測試**
```sql
-- 檔案: tests/rls_security_test.sql

-- 1. 基礎隔離測試
DO $$
DECLARE
    company1_id INTEGER := 1;
    company2_id INTEGER := 2;
    test_result INTEGER;
BEGIN
    -- 設定公司1上下文
    PERFORM set_config('app.current_company_id', company1_id::text, true);
    
    -- 嘗試存取公司2的數據 (應該返回0筆)
    SELECT COUNT(*) INTO test_result 
    FROM products 
    WHERE company_id = company2_id;
    
    IF test_result > 0 THEN
        RAISE EXCEPTION 'RLS Isolation Test Failed: Cross-company data access detected';
    END IF;
    
    RAISE NOTICE 'RLS Basic Isolation Test: PASSED';
END;
$$;

-- 2. 權限提升測試
DO $$
DECLARE
    test_result INTEGER;
BEGIN
    -- 設定一般用戶上下文
    PERFORM set_config('app.current_company_id', '1', true);
    PERFORM set_config('app.superuser_mode', 'false', true);
    
    -- 嘗試存取所有公司的數據 (應該只能看到自己公司的)
    SELECT COUNT(DISTINCT company_id) INTO test_result FROM products;
    
    IF test_result > 1 THEN
        RAISE EXCEPTION 'RLS Privilege Escalation Test Failed: Multi-company access without permission';
    END IF;
    
    RAISE NOTICE 'RLS Privilege Escalation Test: PASSED';
END;
$$;

-- 3. 效能基準測試
EXPLAIN (ANALYZE, BUFFERS) 
SELECT p.*, c.name as customer_name 
FROM products p 
JOIN customers c ON p.company_id = c.company_id 
WHERE p.status = 'active' 
AND p.company_id = current_setting('app.current_company_id')::int;
```

### **整合測試**
```go
// 檔案: internal/tests/rls_integration_test.go
func TestRLSIntegration(t *testing.T) {
    // 建立測試資料庫連線
    db := setupTestDB()
    defer db.Close()
    
    // 建立兩個不同公司的測試數據
    company1 := createTestCompany(db, "Company 1")
    company2 := createTestCompany(db, "Company 2")
    
    // 建立測試產品
    product1 := createTestProduct(db, company1.ID, "Product 1")
    product2 := createTestProduct(db, company2.ID, "Product 2")
    
    // 測試公司1用戶只能看到自己公司的產品
    t.Run("Company Isolation", func(t *testing.T) {
        // 設定公司1上下文
        _, err := db.Exec("SET app.current_company_id = $1", company1.ID)
        require.NoError(t, err)
        
        // 查詢產品
        var products []Product
        err = db.Select(&products, "SELECT * FROM products")
        require.NoError(t, err)
        
        // 驗證只能看到公司1的產品
        assert.Len(t, products, 1)
        assert.Equal(t, product1.ID, products[0].ID)
        assert.Equal(t, company1.ID, products[0].CompanyID)
    })
    
    // 測試超級管理員可以看到所有數據
    t.Run("Super Admin Access", func(t *testing.T) {
        // 設定超級管理員模式
        _, err := db.Exec("SET app.superuser_mode = true")
        require.NoError(t, err)
        
        // 查詢產品
        var products []Product
        err = db.Select(&products, "SELECT * FROM products")
        require.NoError(t, err)
        
        // 驗證可以看到所有公司的產品
        assert.Len(t, products, 2)
    })
}
```

---

## 🎯 **驗收標準**

### **安全驗收**
- [ ] 所有業務表已啟用RLS保護
- [ ] 多租戶資料完全隔離，無交叉存取
- [ ] 超級管理員模式正確運作
- [ ] 安全審計日誌完整記錄
- [ ] 通過安全滲透測試

### **效能驗收**
- [ ] RLS查詢效能影響 < 15%
- [ ] 大表查詢響應時間 < 2秒
- [ ] 索引使用率 > 85%
- [ ] 並發查詢處理正常
- [ ] 分區表查詢效能符合預期

### **監控驗收**
- [ ] 效能監控系統正常運作
- [ ] 慢查詢告警正確觸發
- [ ] 審計日誌查詢功能完整
- [ ] Dashboard顯示正確的效能指標

---

## 📅 **實作時程**

| 階段 | 任務 | 時間 | 負責人 |
|------|------|------|--------|
| 2.1 | RLS效能最佳化 | 3天 | 資料庫工程師 |
| 2.2 | 進階安全機制 | 4天 | 資深後端工程師 |
| 2.3 | 效能監控系統 | 3天 | DevOps工程師 |
| 2.4 | 整合測試與驗收 | 2天 | QA工程師 |

**總計**: 12個工作天 (約2.5週)

---

**下一階段**: [03_API安全強化方案.md](./03_API安全強化方案.md)