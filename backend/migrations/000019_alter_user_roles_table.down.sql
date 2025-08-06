-- 回滾 user_roles 表的修改

-- 刪除觸發器
DROP TRIGGER IF EXISTS update_user_roles_updated_at ON user_roles;

-- 刪除索引
DROP INDEX IF EXISTS idx_user_roles_expires_at;
DROP INDEX IF EXISTS idx_user_roles_role_id;
DROP INDEX IF EXISTS idx_user_roles_user_id;

-- 刪除新增的欄位
ALTER TABLE user_roles DROP COLUMN IF EXISTS updated_at;
ALTER TABLE user_roles DROP COLUMN IF EXISTS created_at;
ALTER TABLE user_roles DROP COLUMN IF EXISTS expires_at;
ALTER TABLE user_roles DROP COLUMN IF EXISTS assigned_at;

-- 恢復原有的主鍵結構
ALTER TABLE user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_role_id_unique;
ALTER TABLE user_roles DROP CONSTRAINT IF EXISTS user_roles_pkey;
ALTER TABLE user_roles DROP COLUMN IF EXISTS id;

-- 重新建立原有的複合主鍵
ALTER TABLE user_roles ADD CONSTRAINT user_roles_pkey PRIMARY KEY (user_id, role_id);