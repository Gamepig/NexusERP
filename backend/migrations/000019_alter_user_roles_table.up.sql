-- 為 user_roles 表添加缺失的欄位
-- 這個遷移修復了前後端資料庫結構不一致的問題

-- 添加 id 主鍵欄位（如果不存在）
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'user_roles' 
        AND column_name = 'id'
    ) THEN
        -- 先刪除現有的主鍵約束
        ALTER TABLE user_roles DROP CONSTRAINT IF EXISTS user_roles_pkey;
        
        -- 添加 id 欄位
        ALTER TABLE user_roles ADD COLUMN id BIGSERIAL;
        
        -- 設定新的主鍵
        ALTER TABLE user_roles ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);
        
        -- 添加唯一約束來維持原有的邏輯
        ALTER TABLE user_roles ADD CONSTRAINT user_roles_user_id_role_id_unique UNIQUE (user_id, role_id);
    END IF;
END $$;

-- 添加 assigned_at 欄位
ALTER TABLE user_roles ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- 添加 expires_at 欄位
ALTER TABLE user_roles ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

-- 添加 created_at 欄位
ALTER TABLE user_roles ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- 添加 updated_at 欄位
ALTER TABLE user_roles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- 為現有記錄設定預設值
UPDATE user_roles 
SET 
    assigned_at = COALESCE(assigned_at, CURRENT_TIMESTAMP),
    created_at = COALESCE(created_at, CURRENT_TIMESTAMP),
    updated_at = COALESCE(updated_at, CURRENT_TIMESTAMP)
WHERE assigned_at IS NULL OR created_at IS NULL OR updated_at IS NULL;

-- 建立索引
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_expires_at ON user_roles(expires_at);

-- 添加觸發器來自動更新 updated_at 欄位
CREATE TRIGGER update_user_roles_updated_at
    BEFORE UPDATE ON user_roles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();