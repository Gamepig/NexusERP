-- Add multi-tenant support to product_categories table
-- 業務重要性：⭐⭐⭐⭐
-- 影響範圍：產品管理、庫存、採購、銷售
-- 風險等級：MEDIUM

-- 添加多租戶隔離欄位
ALTER TABLE product_categories 
ADD COLUMN company_id bigint,
ADD COLUMN created_by_user_id bigint;

-- 添加外鍵約束
ALTER TABLE product_categories 
ADD CONSTRAINT fk_product_categories_company 
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;

ALTER TABLE product_categories 
ADD CONSTRAINT fk_product_categories_created_by_user 
    FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE SET NULL;

-- 建立索引
CREATE INDEX idx_product_categories_company ON product_categories(company_id);
CREATE INDEX idx_product_categories_created_by_user ON product_categories(created_by_user_id);
CREATE INDEX idx_product_categories_company_active ON product_categories(company_id, is_active) 
    WHERE is_active = true;

-- 數據遷移：為現有產品分類分配到第一個可用的公司
UPDATE product_categories SET 
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

-- 更新父子關係約束，確保所有相關分類都在同一公司
-- 建立遞迴查詢以確保整個分類樹結構的一致性
WITH RECURSIVE category_tree AS (
    -- 基礎查詢：獲取所有父分類
    SELECT id, parent_category_id, company_id
    FROM product_categories
    WHERE parent_category_id IS NULL
    
    UNION ALL
    
    -- 遞迴查詢：獲取子分類
    SELECT c.id, c.parent_category_id, p.company_id
    FROM product_categories c
    INNER JOIN category_tree p ON c.parent_category_id = p.id
)
UPDATE product_categories 
SET company_id = category_tree.company_id
FROM category_tree
WHERE product_categories.id = category_tree.id
    AND product_categories.company_id IS NULL;