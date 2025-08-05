-- 修復採購單 RLS 政策問題
-- 創建針對 nexus_app 用戶的專用政策

-- 先刪除可能存在的舊政策
DROP POLICY IF EXISTS company_isolation_purchase_orders_nexus_app ON purchase_orders;

-- 創建新的政策
CREATE POLICY company_isolation_purchase_orders_nexus_app 
ON purchase_orders 
FOR ALL 
TO nexus_app 
USING (company_id = (current_setting('app.current_company_id', true))::integer)
WITH CHECK (company_id = (current_setting('app.current_company_id', true))::integer);

-- 檢查政策創建結果
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'purchase_orders' AND policyname LIKE '%nexus_app%'
ORDER BY policyname;