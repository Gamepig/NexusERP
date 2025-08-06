-- CRITICAL SECURITY FIX: Fix orphaned users only (without transaction)
-- 業務重要性：⭐⭐⭐⭐⭐
-- 影響範圍：使用者安全、多租戶隔離、資料完整性
-- 風險等級：CRITICAL
-- 說明：修復 215 個孤立用戶，為每個用戶建立獨立公司

-- Step 1: 修復孤立用戶，為每個用戶建立獨立公司
DO $$
DECLARE
    orphan_user RECORD;
    new_company_id bigint;
    new_business_unit_id bigint;
    user_count integer := 0;
BEGIN
    RAISE NOTICE '開始修復孤立用戶...';
    
    FOR orphan_user IN 
        SELECT u.id, u.name, u.email 
        FROM users u
        LEFT JOIN user_companies uc ON u.id = uc.user_id AND uc.is_active = true
        WHERE uc.user_id IS NULL
    LOOP
        user_count := user_count + 1;
        
        -- 為孤立用戶建立個人公司
        INSERT INTO companies (
            name, 
            display_name, 
            code, 
            tax_number,
            industry,
            size,
            phone,
            email,
            address,
            is_active, 
            created_by_user_id, 
            created_at, 
            updated_at
        ) VALUES (
            COALESCE(orphan_user.name, orphan_user.email) || ' 的公司',
            COALESCE(orphan_user.name, orphan_user.email) || ' 的公司',
            'USR' || orphan_user.id,
            'ORPHAN-USR-' || orphan_user.id,  -- 唯一稅號
            '其他',
            '小型企業',
            '+886-2-0000-0000',
            orphan_user.email,
            '{"country": "台灣", "city": "台北市", "address": "N/A"}'::json,
            true,
            orphan_user.id,
            now(),
            now()
        ) RETURNING id INTO new_company_id;
        
        -- 建立用戶-公司關聯
        INSERT INTO user_companies (
            user_id, 
            company_id, 
            role, 
            is_primary, 
            is_active, 
            joined_at, 
            created_at, 
            updated_at
        ) VALUES (
            orphan_user.id, 
            new_company_id, 
            'admin', 
            true, 
            true, 
            now(), 
            now(), 
            now()
        );
        
        -- 建立預設業務單位
        INSERT INTO business_units (
            company_id, 
            name, 
            display_name,
            code, 
            description,
            is_active, 
            created_by_user_id, 
            created_at, 
            updated_at
        ) VALUES (
            new_company_id, 
            '總部', 
            '總部',
            'HQ', 
            '主要營運單位',
            true, 
            orphan_user.id, 
            now(), 
            now()
        ) RETURNING id INTO new_business_unit_id;
        
        -- 將用戶關聯到業務單位
        INSERT INTO user_business_units (
            user_id, 
            business_unit_id, 
            role, 
            is_active, 
            joined_at, 
            created_at, 
            updated_at
        ) VALUES (
            orphan_user.id, 
            new_business_unit_id, 
            'admin', 
            true, 
            now(), 
            now(), 
            now()
        );
        
        IF user_count % 50 = 0 THEN
            RAISE NOTICE '已處理 % 個孤立用戶...', user_count;
        END IF;
    END LOOP;
    
    RAISE NOTICE '完成孤立用戶修復，共處理 % 個用戶', user_count;
END $$;

-- Step 2: 修復孤立產品
UPDATE products SET 
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