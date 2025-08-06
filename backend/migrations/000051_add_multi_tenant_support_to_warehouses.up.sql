-- Add multi-tenant support to warehouses table
-- 業務重要性：⭐⭐⭐⭐⭐
-- 影響範圍：庫存管理、採購、銷售、報表
-- 風險等級：HIGH

-- 添加多租戶隔離欄位
ALTER TABLE warehouses 
ADD COLUMN company_id bigint,
ADD COLUMN created_by_user_id bigint;

-- 添加外鍵約束
ALTER TABLE warehouses 
ADD CONSTRAINT fk_warehouses_company 
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;

ALTER TABLE warehouses 
ADD CONSTRAINT fk_warehouses_created_by_user 
    FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE SET NULL;

-- 建立索引
CREATE INDEX idx_warehouses_company ON warehouses(company_id);
CREATE INDEX idx_warehouses_created_by_user ON warehouses(created_by_user_id);
CREATE INDEX idx_warehouses_company_active ON warehouses(company_id, is_active) 
    WHERE is_active = true;

-- 數據遷移：為現有倉庫分配到第一個可用的公司
-- 使用中華電信公司 (ID: 67) 或第一個可用公司
UPDATE warehouses SET 
    company_id = (
        SELECT id FROM companies 
        WHERE is_active = true 
        ORDER BY id 
        LIMIT 1
    ),
    created_by_user_id = (
        SELECT id FROM users 
        WHERE email = 'gamepig1976@gmail.com' 
        LIMIT 1
    )
WHERE company_id IS NULL;