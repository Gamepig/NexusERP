-- 臨時修復 RLS 政策問題
-- 需要以 nexus 用戶身份執行

-- 1. 檢查目前政策
SELECT 'Current policies:' as info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'purchase_orders'
ORDER BY policyname;

-- 2. 刪除現有的針對 nexus_app_user 的政策並重新創建
DROP POLICY IF EXISTS company_isolation_purchase_orders ON purchase_orders;
DROP POLICY IF EXISTS superuser_bypass_purchase_orders ON purchase_orders;

-- 3. 創建新的政策，允許 nexus_app 用戶存取
CREATE POLICY company_isolation_purchase_orders 
ON purchase_orders 
FOR ALL 
TO nexus_app 
USING (company_id = (current_setting('app.current_company_id', true))::integer OR (current_setting('app.superuser_mode', true))::boolean = true)
WITH CHECK (company_id = (current_setting('app.current_company_id', true))::integer OR (current_setting('app.superuser_mode', true))::boolean = true);

-- 4. 檢查新政策
SELECT 'New policies:' as info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'purchase_orders'
ORDER BY policyname;