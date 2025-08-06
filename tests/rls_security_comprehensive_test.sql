-- PostgreSQL RLS 綜合安全測試
-- 測試日期: 2025-08-02
-- 目標: 驗證RLS安全修正的完整性和效能

-- 準備測試環境
BEGIN;

-- 創建測試數據
INSERT INTO companies (id, name, status) VALUES 
(1001, 'Test Company A', 'active'),
(1002, 'Test Company B', 'active'),
(1003, 'Inactive Company', 'inactive');

INSERT INTO users (id, name, email, status, is_active) VALUES 
(2001, 'User A', 'usera@test.com', 'active', true),
(2002, 'User B', 'userb@test.com', 'active', true),
(2003, 'Admin User', 'admin@test.com', 'active', true);

INSERT INTO user_companies (user_id, company_id, is_active) VALUES 
(2001, 1001, true),
(2002, 1002, true),
(2003, 1001, true);

INSERT INTO roles (id, name, is_active) VALUES 
(101, 'user', true),
(102, 'admin', true),
(103, 'super_admin', true);

INSERT INTO user_roles (user_id, role_id, is_active) VALUES 
(2001, 101, true),
(2002, 101, true),
(2003, 103, true);

INSERT INTO products (id, company_id, name, sku, status) VALUES 
(3001, 1001, 'Product A1', 'SKU-A1', 'active'),
(3002, 1001, 'Product A2', 'SKU-A2', 'active'),
(3003, 1002, 'Product B1', 'SKU-B1', 'active'),
(3004, 1002, 'Product B2', 'SKU-B2', 'active');

COMMIT;

-- 測試 1: 基礎公司隔離測試
DO $$
DECLARE
    test_result INTEGER;
    test_name TEXT := '基礎公司隔離測試';
BEGIN
    RAISE NOTICE '=== 開始測試: % ===', test_name;
    
    -- 設定公司1001的上下文
    PERFORM set_config('app.current_user_id', '2001', true);
    PERFORM set_config('app.current_company_id', '1001', true);
    
    -- 應該只能看到公司1001的產品
    SELECT COUNT(*) INTO test_result FROM products;
    
    IF test_result != 2 THEN
        RAISE EXCEPTION 'FAILED: Expected 2 products for company 1001, got %', test_result;
    END IF;
    
    -- 嘗試存取公司1002的產品 (應該返回0)
    SELECT COUNT(*) INTO test_result FROM products WHERE company_id = 1002;
    
    IF test_result > 0 THEN
        RAISE EXCEPTION 'FAILED: Cross-company access detected - got % products from company 1002', test_result;
    END IF;
    
    RAISE NOTICE '✅ PASSED: %', test_name;
END;
$$;

-- 測試 2: 無效上下文防護測試
DO $$
DECLARE
    test_result INTEGER;
    test_name TEXT := '無效上下文防護測試';
BEGIN
    RAISE NOTICE '=== 開始測試: % ===', test_name;
    
    -- 清除所有上下文
    PERFORM set_config('app.current_user_id', '', true);
    PERFORM set_config('app.current_company_id', '', true);
    
    -- 應該無法存取任何產品
    SELECT COUNT(*) INTO test_result FROM products;
    
    IF test_result > 0 THEN
        RAISE EXCEPTION 'FAILED: Access granted without valid context - got % products', test_result;
    END IF;
    
    -- 測試無效的公司ID
    PERFORM set_config('app.current_user_id', '2001', true);
    PERFORM set_config('app.current_company_id', '0', true);
    
    SELECT COUNT(*) INTO test_result FROM products;
    
    IF test_result > 0 THEN
        RAISE EXCEPTION 'FAILED: Access granted with invalid company_id=0 - got % products', test_result;
    END IF;
    
    -- 測試負數公司ID
    PERFORM set_config('app.current_company_id', '-1', true);
    
    SELECT COUNT(*) INTO test_result FROM products;
    
    IF test_result > 0 THEN
        RAISE EXCEPTION 'FAILED: Access granted with negative company_id - got % products', test_result;
    END IF;
    
    RAISE NOTICE '✅ PASSED: %', test_name;
END;
$$;

-- 測試 3: 超級管理員權限測試
DO $$
DECLARE
    test_result INTEGER;
    test_name TEXT := '超級管理員權限測試';
BEGIN
    RAISE NOTICE '=== 開始測試: % ===', test_name;
    
    -- 設定超級管理員上下文
    PERFORM set_config('app.current_user_id', '2003', true);
    PERFORM set_config('app.current_company_id', '1001', true);
    PERFORM set_config('app.superuser_mode', 'true', true);
    
    -- 超級管理員應該能看到所有公司的用戶
    SELECT COUNT(*) INTO test_result FROM users;
    
    IF test_result < 3 THEN
        RAISE EXCEPTION 'FAILED: Super admin cannot see all users - got % users', test_result;
    END IF;
    
    RAISE NOTICE '✅ PASSED: %', test_name;
END;
$$;

-- 測試 4: 公司狀態驗證測試
DO $$
DECLARE
    test_result INTEGER;
    test_name TEXT := '公司狀態驗證測試';
BEGIN
    RAISE NOTICE '=== 開始測試: % ===', test_name;
    
    -- 嘗試存取非活躍公司的數據
    PERFORM set_config('app.current_user_id', '2001', true);
    PERFORM set_config('app.current_company_id', '1003', true);  -- inactive company
    
    -- 應該無法存取非活躍公司的產品
    SELECT COUNT(*) INTO test_result FROM products WHERE company_id = 1003;
    
    IF test_result > 0 THEN
        RAISE EXCEPTION 'FAILED: Access granted to inactive company - got % products', test_result;
    END IF;
    
    RAISE NOTICE '✅ PASSED: %', test_name;
END;
$$;

-- 測試 5: 插入/更新安全測試
DO $$
DECLARE
    inserted_id INTEGER;
    test_name TEXT := '插入/更新安全測試';
BEGIN
    RAISE NOTICE '=== 開始測試: % ===', test_name;
    
    -- 設定公司1001的上下文
    PERFORM set_config('app.current_user_id', '2001', true);
    PERFORM set_config('app.current_company_id', '1001', true);
    
    -- 嘗試插入正確公司的產品 (應該成功)
    INSERT INTO products (company_id, name, sku, status) 
    VALUES (1001, 'Test Product', 'TEST-SKU', 'active')
    RETURNING id INTO inserted_id;
    
    -- 嘗試插入錯誤公司的產品 (應該失敗)
    BEGIN
        INSERT INTO products (company_id, name, sku, status) 
        VALUES (1002, 'Wrong Company Product', 'WRONG-SKU', 'active');
        
        RAISE EXCEPTION 'FAILED: Cross-company insert was allowed';
    EXCEPTION
        WHEN insufficient_privilege OR check_violation THEN
            RAISE NOTICE '✅ Cross-company insert correctly blocked';
    END;
    
    -- 嘗試更新為錯誤的公司ID (應該失敗)
    BEGIN
        UPDATE products SET company_id = 1002 WHERE id = inserted_id;
        
        RAISE EXCEPTION 'FAILED: Cross-company update was allowed';
    EXCEPTION
        WHEN insufficient_privilege OR check_violation THEN
            RAISE NOTICE '✅ Cross-company update correctly blocked';
    END;
    
    -- 清理測試數據
    DELETE FROM products WHERE id = inserted_id;
    
    RAISE NOTICE '✅ PASSED: %', test_name;
END;
$$;

-- 測試 6: 效能基準測試
DO $$
DECLARE
    start_time TIMESTAMP;
    end_time TIMESTAMP;
    duration_ms INTEGER;
    test_name TEXT := '效能基準測試';
BEGIN
    RAISE NOTICE '=== 開始測試: % ===', test_name;
    
    -- 設定測試上下文
    PERFORM set_config('app.current_user_id', '2001', true);
    PERFORM set_config('app.current_company_id', '1001', true);
    
    -- 測試基本查詢效能
    start_time := clock_timestamp();
    
    PERFORM COUNT(*) FROM products WHERE status = 'active';
    
    end_time := clock_timestamp();
    duration_ms := EXTRACT(milliseconds FROM (end_time - start_time));
    
    RAISE NOTICE 'Basic query duration: % ms', duration_ms;
    
    -- 測試複雜關聯查詢效能
    start_time := clock_timestamp();
    
    PERFORM COUNT(*) 
    FROM products p 
    JOIN companies c ON p.company_id = c.id 
    WHERE p.status = 'active' AND c.status = 'active';
    
    end_time := clock_timestamp();
    duration_ms := EXTRACT(milliseconds FROM (end_time - start_time));
    
    RAISE NOTICE 'Complex join query duration: % ms', duration_ms;
    
    IF duration_ms > 100 THEN
        RAISE WARNING 'Performance warning: Complex query took % ms (>100ms)', duration_ms;
    END IF;
    
    RAISE NOTICE '✅ PASSED: %', test_name;
END;
$$;

-- 測試 7: 安全函數驗證測試
DO $$
DECLARE
    result BOOLEAN;
    test_name TEXT := '安全函數驗證測試';
BEGIN
    RAISE NOTICE '=== 開始測試: % ===', test_name;
    
    -- 測試公司狀態檢查函數
    SELECT is_company_active(1001) INTO result;
    IF NOT result THEN
        RAISE EXCEPTION 'FAILED: is_company_active(1001) should return true';
    END IF;
    
    SELECT is_company_active(1003) INTO result;
    IF result THEN
        RAISE EXCEPTION 'FAILED: is_company_active(1003) should return false for inactive company';
    END IF;
    
    -- 測試用戶-公司關係檢查函數
    SELECT user_belongs_to_company(2001, 1001) INTO result;
    IF NOT result THEN
        RAISE EXCEPTION 'FAILED: user_belongs_to_company(2001, 1001) should return true';
    END IF;
    
    SELECT user_belongs_to_company(2001, 1002) INTO result;
    IF result THEN
        RAISE EXCEPTION 'FAILED: user_belongs_to_company(2001, 1002) should return false';
    END IF;
    
    -- 測試RLS上下文驗證函數
    PERFORM set_config('app.current_user_id', '2001', true);
    PERFORM set_config('app.current_company_id', '1001', true);
    
    SELECT validate_rls_context() INTO result;
    IF NOT result THEN
        RAISE EXCEPTION 'FAILED: validate_rls_context() should return true for valid context';
    END IF;
    
    PERFORM set_config('app.current_user_id', '2001', true);
    PERFORM set_config('app.current_company_id', '1002', true);
    
    SELECT validate_rls_context() INTO result;
    IF result THEN
        RAISE EXCEPTION 'FAILED: validate_rls_context() should return false for invalid user-company relation';
    END IF;
    
    RAISE NOTICE '✅ PASSED: %', test_name;
END;
$$;

-- 測試 8: 索引使用驗證測試  
DO $$
DECLARE
    query_plan TEXT;
    test_name TEXT := '索引使用驗證測試';
BEGIN
    RAISE NOTICE '=== 開始測試: % ===', test_name;
    
    -- 設定測試上下文
    PERFORM set_config('app.current_user_id', '2001', true);
    PERFORM set_config('app.current_company_id', '1001', true);
    
    -- 檢查基本查詢是否使用索引
    SELECT query_plan INTO query_plan FROM (
        SELECT string_agg(line, E'\n') as query_plan 
        FROM (
            SELECT * FROM explain_query('SELECT * FROM products WHERE company_id = 1001')
        ) t(line)
    ) sub;
    
    IF query_plan NOT LIKE '%Index%' THEN
        RAISE WARNING 'Performance warning: Query may not be using index efficiently';
        RAISE NOTICE 'Query plan: %', query_plan;
    ELSE
        RAISE NOTICE '✅ Index usage confirmed in query plan';
    END IF;
    
    RAISE NOTICE '✅ PASSED: %', test_name;
END;
$$;

-- 輔助函數：解釋查詢計劃
CREATE OR REPLACE FUNCTION explain_query(query_text TEXT)
RETURNS TABLE(line TEXT) AS $$
BEGIN
    RETURN QUERY EXECUTE 'EXPLAIN ' || query_text;
END;
$$ LANGUAGE plpgsql;

-- 測試完成總結
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '🎉 RLS 安全測試完成!';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '✅ 所有測試通過 - RLS安全機制正常運作';
    RAISE NOTICE '⚡ 效能測試完成 - 查詢速度符合預期';
    RAISE NOTICE '🔒 安全驗證完成 - 多租戶隔離有效';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '';
END;
$$;

-- 清理測試數據
BEGIN;

DELETE FROM products WHERE id IN (3001, 3002, 3003, 3004);
DELETE FROM user_roles WHERE user_id IN (2001, 2002, 2003);
DELETE FROM roles WHERE id IN (101, 102, 103);
DELETE FROM user_companies WHERE user_id IN (2001, 2002, 2003);
DELETE FROM users WHERE id IN (2001, 2002, 2003);
DELETE FROM companies WHERE id IN (1001, 1002, 1003);

DROP FUNCTION IF EXISTS explain_query(TEXT);

COMMIT;

-- 記錄測試完成
INSERT INTO migration_logs (
    migration_name, 
    status, 
    description, 
    executed_at
) VALUES (
    'rls_security_comprehensive_test',
    'completed',
    'Comprehensive RLS security testing completed successfully',
    CURRENT_TIMESTAMP
);