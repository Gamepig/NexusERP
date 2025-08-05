# PostgreSQL Stored Procedures 完整指南

## 概述

PostgreSQL 支援兩種主要的儲存程式：
1. **函數 (Functions)** - 可以返回值，用於查詢
2. **程序 (Procedures)** - PostgreSQL 11+ 引入，主要用於資料操作，支援事務控制

本指南涵蓋兩者的使用方式和最佳實踐。

## 函數 (Functions) vs 程序 (Procedures)

### 主要差異

| 特性 | 函數 (Function) | 程序 (Procedure) |
|------|----------------|------------------|
| 返回值 | 必須有返回值 | 沒有返回值 |
| 調用方式 | SELECT function_name() | CALL procedure_name() |
| 事務控制 | 不能包含 COMMIT/ROLLBACK | 可以包含 COMMIT/ROLLBACK |
| 用途 | 計算、查詢、資料轉換 | 資料操作、批次處理 |
| 版本支援 | 所有版本 | PostgreSQL 11+ |

## 函數 (Functions)

### 基本語法

```sql
CREATE OR REPLACE FUNCTION function_name(parameter_list)
RETURNS return_type AS
$$
DECLARE
  -- 變數宣告
BEGIN
  -- 函數邏輯
  RETURN result;
END;
$$
LANGUAGE plpgsql;
```

### 參數類型

```sql
-- IN 參數（預設）
CREATE FUNCTION add_numbers(a integer, b integer)
RETURNS integer AS $$
BEGIN
  RETURN a + b;
END;
$$ LANGUAGE plpgsql;

-- OUT 參數
CREATE FUNCTION get_user_info(
  IN user_id integer,
  OUT username text,
  OUT email text
) AS $$
BEGIN
  SELECT u.username, u.email
  INTO username, email
  FROM users u
  WHERE u.id = user_id;
END;
$$ LANGUAGE plpgsql;

-- INOUT 參數
CREATE FUNCTION double_value(INOUT val integer) AS $$
BEGIN
  val := val * 2;
END;
$$ LANGUAGE plpgsql;
```

### 返回類型

#### 1. 返回單一值
```sql
CREATE FUNCTION get_user_count()
RETURNS integer AS $$
DECLARE
  user_count integer;
BEGIN
  SELECT COUNT(*) INTO user_count FROM users;
  RETURN user_count;
END;
$$ LANGUAGE plpgsql;
```

#### 2. 返回記錄 (RECORD)
```sql
CREATE FUNCTION get_user_by_id(user_id integer)
RETURNS RECORD AS $$
DECLARE
  result RECORD;
BEGIN
  SELECT * INTO result FROM users WHERE id = user_id;
  RETURN result;
END;
$$ LANGUAGE plpgsql;
```

#### 3. 返回表格 (TABLE)
```sql
CREATE FUNCTION get_active_users()
RETURNS TABLE(id integer, username text, email text) AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.username, u.email
  FROM users u
  WHERE u.is_active = true;
END;
$$ LANGUAGE plpgsql;
```

#### 4. 返回集合 (SETOF)
```sql
CREATE FUNCTION get_all_products()
RETURNS SETOF products AS $$
BEGIN
  RETURN QUERY SELECT * FROM products;
END;
$$ LANGUAGE plpgsql;
```

#### 5. 返回游標 (REFCURSOR)
```sql
CREATE FUNCTION get_users_cursor()
RETURNS refcursor AS $$
DECLARE
  ref refcursor;
BEGIN
  OPEN ref FOR SELECT * FROM users;
  RETURN ref;
END;
$$ LANGUAGE plpgsql;

-- 使用游標
BEGIN;
SELECT get_users_cursor();
FETCH ALL IN "<unnamed portal 1>";
COMMIT;
```

## 程序 (Procedures)

### 基本語法

```sql
CREATE OR REPLACE PROCEDURE procedure_name(parameter_list)
LANGUAGE plpgsql
AS $$
DECLARE
  -- 變數宣告
BEGIN
  -- 程序邏輯
END;
$$;
```

### 程序範例

```sql
-- 批量更新程序
CREATE OR REPLACE PROCEDURE update_product_prices(
  IN category_id integer,
  IN percentage numeric
)
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE products
  SET price = price * (1 + percentage / 100)
  WHERE category = category_id;
  
  -- 程序可以包含事務控制
  COMMIT;
END;
$$;

-- 調用程序
CALL update_product_prices(1, 10.5);
```

### 使用 INOUT 參數返回資料

```sql
CREATE OR REPLACE PROCEDURE get_user_data(
  IN user_id integer,
  INOUT username text,
  INOUT email text
)
LANGUAGE plpgsql
AS $$
BEGIN
  SELECT u.username, u.email
  INTO username, email
  FROM users u
  WHERE u.id = user_id;
END;
$$;

-- 調用並獲取結果
DO $$
DECLARE
  v_username text;
  v_email text;
BEGIN
  CALL get_user_data(1, v_username, v_email);
  RAISE NOTICE 'Username: %, Email: %', v_username, v_email;
END;
$$;
```

## PL/pgSQL 語言要素

### 變數宣告

```sql
DECLARE
  -- 基本類型
  v_count integer := 0;
  v_name text;
  v_price numeric(10,2);
  
  -- 記錄類型
  v_user users%ROWTYPE;
  
  -- 陣列
  v_ids integer[];
  
  -- 自定義類型
  TYPE user_info IS RECORD (
    id integer,
    name text
  );
  v_info user_info;
```

### 控制結構

#### IF 語句
```sql
IF condition THEN
  -- statements
ELSIF another_condition THEN
  -- statements
ELSE
  -- statements
END IF;
```

#### CASE 語句
```sql
CASE
  WHEN condition1 THEN
    -- statements
  WHEN condition2 THEN
    -- statements
  ELSE
    -- statements
END CASE;
```

#### 迴圈

```sql
-- FOR 迴圈
FOR i IN 1..10 LOOP
  -- statements
END LOOP;

-- FOR 迴圈遍歷查詢結果
FOR record IN SELECT * FROM users LOOP
  -- process record
END LOOP;

-- WHILE 迴圈
WHILE condition LOOP
  -- statements
END LOOP;

-- LOOP 迴圈
LOOP
  -- statements
  EXIT WHEN condition;
END LOOP;
```

### 異常處理

```sql
CREATE FUNCTION safe_divide(a numeric, b numeric)
RETURNS numeric AS $$
BEGIN
  RETURN a / b;
EXCEPTION
  WHEN division_by_zero THEN
    RAISE NOTICE 'Division by zero attempted';
    RETURN NULL;
  WHEN OTHERS THEN
    RAISE NOTICE 'Unexpected error: %', SQLERRM;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;
```

## 實用範例

### 1. 批量插入資料

```sql
CREATE OR REPLACE FUNCTION batch_insert_users(
  user_data json[]
)
RETURNS integer AS $$
DECLARE
  v_count integer := 0;
  v_user json;
BEGIN
  FOREACH v_user IN ARRAY user_data
  LOOP
    INSERT INTO users (username, email, created_at)
    VALUES (
      v_user->>'username',
      v_user->>'email',
      NOW()
    );
    v_count := v_count + 1;
  END LOOP;
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;
```

### 2. 複雜查詢與資料處理

```sql
CREATE OR REPLACE FUNCTION get_order_summary(
  IN start_date date,
  IN end_date date
)
RETURNS TABLE(
  order_date date,
  total_orders bigint,
  total_amount numeric
) AS $$
BEGIN
  RETURN QUERY
  WITH daily_orders AS (
    SELECT
      DATE(created_at) as order_date,
      COUNT(*) as order_count,
      SUM(total_amount) as daily_total
    FROM orders
    WHERE created_at BETWEEN start_date AND end_date
    GROUP BY DATE(created_at)
  )
  SELECT
    do.order_date,
    do.order_count,
    do.daily_total
  FROM daily_orders do
  ORDER BY do.order_date;
END;
$$ LANGUAGE plpgsql;
```

### 3. 動態 SQL

```sql
CREATE OR REPLACE FUNCTION dynamic_query(
  table_name text,
  where_clause text DEFAULT NULL
)
RETURNS SETOF record AS $$
DECLARE
  query text;
BEGIN
  query := 'SELECT * FROM ' || quote_ident(table_name);
  
  IF where_clause IS NOT NULL THEN
    query := query || ' WHERE ' || where_clause;
  END IF;
  
  RETURN QUERY EXECUTE query;
END;
$$ LANGUAGE plpgsql;
```

### 4. 遊標處理多個結果集

```sql
CREATE OR REPLACE FUNCTION get_multiple_result_sets()
RETURNS SETOF refcursor AS $$
DECLARE
  ref1 refcursor;
  ref2 refcursor;
BEGIN
  -- 第一個結果集
  OPEN ref1 FOR SELECT * FROM users WHERE is_active = true;
  RETURN NEXT ref1;
  
  -- 第二個結果集
  OPEN ref2 FOR SELECT * FROM orders WHERE status = 'pending';
  RETURN NEXT ref2;
END;
$$ LANGUAGE plpgsql;

-- 使用
BEGIN;
SELECT * FROM get_multiple_result_sets();
FETCH ALL IN "<unnamed portal 1>";
FETCH ALL IN "<unnamed portal 2>";
COMMIT;
```

## 效能優化

### 1. 使用正確的語言

```sql
-- 簡單查詢使用 SQL 語言
CREATE FUNCTION get_user_name(user_id integer)
RETURNS text AS $$
  SELECT username FROM users WHERE id = user_id;
$$ LANGUAGE sql STABLE;

-- 複雜邏輯使用 PL/pgSQL
CREATE FUNCTION complex_calculation(...)
RETURNS ... AS $$
BEGIN
  -- 複雜的程序邏輯
END;
$$ LANGUAGE plpgsql;
```

### 2. 函數穩定性標記

```sql
-- IMMUTABLE: 相同輸入總是返回相同輸出
CREATE FUNCTION add_numbers(a int, b int)
RETURNS int AS $$
  SELECT a + b;
$$ LANGUAGE sql IMMUTABLE;

-- STABLE: 在單一查詢中相同輸入返回相同輸出
CREATE FUNCTION get_user_name(user_id int)
RETURNS text AS $$
  SELECT username FROM users WHERE id = user_id;
$$ LANGUAGE sql STABLE;

-- VOLATILE: 可能返回不同結果（預設）
CREATE FUNCTION generate_random()
RETURNS float AS $$
  SELECT random();
$$ LANGUAGE sql VOLATILE;
```

### 3. 避免 N+1 查詢

```sql
-- ❌ 不好的做法
CREATE FUNCTION get_orders_with_items()
RETURNS TABLE(...) AS $$
DECLARE
  order_rec RECORD;
BEGIN
  FOR order_rec IN SELECT * FROM orders LOOP
    -- 對每個訂單單獨查詢項目（N+1 問題）
    FOR item_rec IN SELECT * FROM order_items WHERE order_id = order_rec.id LOOP
      -- ...
    END LOOP;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ✅ 好的做法
CREATE FUNCTION get_orders_with_items()
RETURNS TABLE(...) AS $$
BEGIN
  RETURN QUERY
  SELECT o.*, oi.*
  FROM orders o
  JOIN order_items oi ON o.id = oi.order_id;
END;
$$ LANGUAGE plpgsql;
```

## 與應用程式整合

### PHP/Laravel 整合

```php
// 調用函數
$result = DB::select('SELECT * FROM get_active_users()');

// 調用程序
DB::statement('CALL update_product_prices(?, ?)', [1, 10.5]);

// 使用游標
DB::transaction(function () {
    $cursor = DB::select('SELECT get_users_cursor()')[0]->get_users_cursor;
    $results = DB::select("FETCH ALL IN \"$cursor\"");
});
```

### Node.js 整合

```javascript
// 調用函數
const result = await client.query('SELECT * FROM get_active_users()');

// 調用程序
await client.query('CALL update_product_prices($1, $2)', [1, 10.5]);

// 處理游標
await client.query('BEGIN');
const cursorResult = await client.query('SELECT get_users_cursor()');
const cursor = cursorResult.rows[0].get_users_cursor;
const data = await client.query(`FETCH ALL IN "${cursor}"`);
await client.query('COMMIT');
```

### Java/JDBC 整合

```java
// 調用函數
PreparedStatement stmt = conn.prepareStatement("SELECT * FROM get_active_users()");
ResultSet rs = stmt.executeQuery();

// 調用程序
CallableStatement call = conn.prepareCall("{CALL update_product_prices(?, ?)}");
call.setInt(1, 1);
call.setBigDecimal(2, new BigDecimal("10.5"));
call.execute();

// 處理游標
conn.setAutoCommit(false);
CallableStatement cursorCall = conn.prepareCall("{? = CALL get_users_cursor()}");
cursorCall.registerOutParameter(1, Types.REF_CURSOR);
cursorCall.execute();
ResultSet cursorRs = (ResultSet) cursorCall.getObject(1);
```

## 調試技巧

### 1. 使用 RAISE 語句

```sql
CREATE FUNCTION debug_example(value integer)
RETURNS void AS $$
BEGIN
  RAISE NOTICE 'Input value: %', value;
  RAISE INFO 'Processing started';
  
  IF value < 0 THEN
    RAISE WARNING 'Negative value detected: %', value;
  END IF;
  
  RAISE LOG 'Function completed';
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error occurred: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;
```

### 2. 查看函數定義

```sql
-- 查看函數原始碼
SELECT prosrc FROM pg_proc WHERE proname = 'function_name';

-- 使用 \df+ 在 psql 中查看
\df+ function_name

-- 查看所有函數
SELECT 
  n.nspname as schema,
  p.proname as name,
  pg_catalog.pg_get_function_result(p.oid) as result_type,
  pg_catalog.pg_get_function_arguments(p.oid) as arguments
FROM pg_catalog.pg_proc p
JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname NOT IN ('pg_catalog', 'information_schema');
```

## 最佳實踐

1. **選擇正確的工具**
   - 簡單查詢：使用視圖 (VIEW)
   - 資料轉換：使用函數 (FUNCTION)
   - 批次處理：使用程序 (PROCEDURE)

2. **參數驗證**
   ```sql
   CREATE FUNCTION safe_function(param integer)
   RETURNS void AS $$
   BEGIN
     IF param IS NULL THEN
       RAISE EXCEPTION 'Parameter cannot be null';
     END IF;
     
     IF param < 0 THEN
       RAISE EXCEPTION 'Parameter must be positive';
     END IF;
     
     -- 主要邏輯
   END;
   $$ LANGUAGE plpgsql;
   ```

3. **事務管理**
   - 函數總是在調用者的事務中執行
   - 程序可以控制自己的事務（COMMIT/ROLLBACK）

4. **錯誤處理**
   - 總是包含異常處理區塊
   - 記錄足夠的調試資訊
   - 提供有意義的錯誤訊息

5. **效能考量**
   - 適當使用穩定性標記
   - 避免在迴圈中執行查詢
   - 使用批次操作而非逐行處理

## 常見問題

### Q: 何時使用函數 vs 程序？
A: 函數用於查詢和計算，程序用於資料操作和需要事務控制的場景。

### Q: 如何返回多個結果集？
A: 使用 SETOF refcursor 返回多個游標，或考慮使用多個 OUT 參數。

### Q: 如何提高儲存程序效能？
A: 使用適當的索引、避免 N+1 查詢、使用批次操作、正確設置函數穩定性。

### Q: 如何調試儲存程序？
A: 使用 RAISE 語句輸出調試資訊、查看 PostgreSQL 日誌、使用 pgAdmin 或其他工具的調試功能。

## 參考資源

- [PostgreSQL 官方文檔 - PL/pgSQL](https://www.postgresql.org/docs/current/plpgsql.html)
- [PostgreSQL 官方文檔 - CREATE FUNCTION](https://www.postgresql.org/docs/current/sql-createfunction.html)
- [PostgreSQL 官方文檔 - CREATE PROCEDURE](https://www.postgresql.org/docs/current/sql-createprocedure.html)

---
*最後更新: 2025-07-29*