-- Demo Data for user gamepig1976@gmail.com (Final Version)
-- This script creates comprehensive demo data for demonstration purposes
-- All data is realistic but simulated

DO $$
DECLARE
    v_user_id BIGINT;
    v_warehouse_id BIGINT;
    v_tw_currency_id BIGINT;
    v_supplier_ids BIGINT[];
    v_customer_ids BIGINT[];
    v_product_ids BIGINT[];
    v_category_ids BIGINT[];
BEGIN
    -- Get user ID
    SELECT id INTO v_user_id FROM users WHERE email = 'gamepig1976@gmail.com';
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User gamepig1976@gmail.com not found';
    END IF;
    
    RAISE NOTICE 'Found user ID: %', v_user_id;

    -- Get TWD currency or create it
    SELECT id INTO v_tw_currency_id FROM currencies WHERE code = 'TWD';
    IF v_tw_currency_id IS NULL THEN
        INSERT INTO currencies (code, name, symbol, exchange_rate, is_base_currency, is_active)
        VALUES ('TWD', '新台幣', 'NT$', 1.0, true, true)
        RETURNING id INTO v_tw_currency_id;
    ELSE
        UPDATE currencies SET is_base_currency = true WHERE code = 'TWD';
    END IF;

    -- Update USD to not base currency if exists
    UPDATE currencies SET is_base_currency = false WHERE code = 'USD' AND code != 'TWD';

    -- Create enhanced product categories for Taiwan market (remove existing ones first)
    DELETE FROM product_categories WHERE name IN ('電子產品', '辦公用品', '電腦週邊', '生活家電', '食品飲料', '清潔用品', '工業原料', '包裝材料', '五金工具', '安全設備');
    
    INSERT INTO product_categories (name, description, is_active) VALUES
    ('電子產品', 'Electronics and technology products', true),
    ('辦公用品', 'Office supplies and stationery', true),
    ('電腦週邊', 'Computer peripherals and accessories', true),
    ('生活家電', 'Home appliances', true),
    ('食品飲料', 'Food and beverages', true),
    ('清潔用品', 'Cleaning supplies', true),
    ('工業原料', 'Industrial raw materials', true),
    ('包裝材料', 'Packaging materials', true),
    ('五金工具', 'Hardware and tools', true),
    ('安全設備', 'Safety equipment', true);

    -- Get category IDs
    SELECT ARRAY_AGG(id) INTO v_category_ids FROM product_categories WHERE name IN 
    ('電子產品', '辦公用品', '電腦週邊', '生活家電', '食品飲料', '清潔用品', '工業原料', '包裝材料', '五金工具', '安全設備');

    -- Create Taiwanese suppliers
    INSERT INTO suppliers (code, name, contact_person, email, phone, payment_terms, credit_limit, is_active) VALUES
    ('SUP-TW-001', '台灣電子科技股份有限公司', '陳建國', 'sales@taiwan-electronics.com.tw', '02-2345-6789', 'Net 30', 1000000.00, true),
    ('SUP-TW-002', '宏達辦公用品有限公司', '林淑芬', 'order@hongda-office.com.tw', '02-8765-4321', 'Net 60', 500000.00, true),
    ('SUP-TW-003', '精密工業原料股份有限公司', '王志明', 'info@precision-materials.com.tw', '03-456-7890', 'Net 45', 2000000.00, true),
    ('SUP-TW-004', '統一包裝材料企業', '張美玲', 'service@uni-packaging.com.tw', '04-2234-5678', 'Net 30', 800000.00, true),
    ('SUP-TW-005', '安全第一設備有限公司', '李文華', 'sales@safety-first.com.tw', '07-345-6789', 'Net 30', 600000.00, true),
    ('SUP-TW-006', '綠能生活家電股份有限公司', '黃志豪', 'contact@green-life.com.tw', '02-2987-6543', 'Net 45', 1500000.00, true),
    ('SUP-TW-007', '新竹五金工具行', '劉明德', 'order@hsinchu-hardware.com.tw', '03-578-9012', 'Net 30', 400000.00, true),
    ('SUP-TW-008', '優質食品供應商', '楊素華', 'info@quality-foods.com.tw', '02-2678-9012', 'Net 15', 300000.00, true)
    ON CONFLICT (code) DO NOTHING;

    -- Get supplier IDs
    SELECT ARRAY_AGG(id) INTO v_supplier_ids FROM suppliers WHERE code LIKE 'SUP-TW-%';

    -- Create comprehensive products with Taiwan market focus
    INSERT INTO products (sku, name, description, category_id, unit_of_measure, weight, cost_price, selling_price, barcode, supplier_id, reorder_point, is_active) VALUES
    -- 電子產品
    ('ELEC-MON-001', 'ASUS ProArt 27吋專業顯示器', '4K UHD專業色彩顯示器，100% sRGB', v_category_ids[1], 'pcs', 6.5, 18000.00, 24990.00, '4712900123456', v_supplier_ids[1], 10, true),
    ('ELEC-KBD-001', 'Logitech MX Keys 無線鍵盤', '多裝置藍牙鍵盤，背光設計', v_category_ids[1], 'pcs', 0.81, 2800.00, 3990.00, '4943765123789', v_supplier_ids[1], 20, true),
    ('ELEC-MOU-001', 'Logitech MX Master 3 滑鼠', '高精度無線滑鼠，磁力滾輪', v_category_ids[1], 'pcs', 0.141, 2500.00, 3490.00, '4943765123790', v_supplier_ids[1], 25, true),
    ('ELEC-HDS-001', 'Sony WH-1000XM5 降噪耳機', '頂級主動降噪無線耳機', v_category_ids[1], 'pcs', 0.25, 8500.00, 11900.00, '4548736123456', v_supplier_ids[1], 15, true),
    
    -- 辦公用品
    ('OFF-PEN-001', 'Pilot 百樂鋼珠筆 0.5mm (12支裝)', '黑色墨水，書寫流暢', v_category_ids[2], 'box', 0.15, 180.00, 280.00, '4902505123456', v_supplier_ids[2], 50, true),
    ('OFF-PAP-001', 'Double A A4影印紙 80磅 (500張)', '高品質影印紙，不卡紙', v_category_ids[2], 'ream', 2.5, 95.00, 135.00, '8851125123456', v_supplier_ids[2], 100, true),
    ('OFF-STP-001', '光南釘書機 No.10', '省力型釘書機，可釘25張', v_category_ids[2], 'pcs', 0.25, 120.00, 180.00, '4710961123456', v_supplier_ids[2], 30, true),
    ('OFF-FLD-001', '立強檔案夾 2吋 (藍色)', 'PP材質，耐用環保', v_category_ids[2], 'pcs', 0.3, 35.00, 55.00, '4711234567890', v_supplier_ids[2], 60, true),
    
    -- 電腦週邊
    ('COMP-SSD-001', 'Samsung 980 PRO 1TB NVMe SSD', 'PCIe 4.0 高速固態硬碟', v_category_ids[3], 'pcs', 0.08, 2800.00, 3990.00, '8806090123456', v_supplier_ids[1], 15, true),
    ('COMP-RAM-001', 'Kingston DDR4 3200 16GB記憶體', '桌上型電腦記憶體', v_category_ids[3], 'pcs', 0.03, 1200.00, 1790.00, '7406172123456', v_supplier_ids[1], 20, true),
    ('COMP-HUB-001', 'UGREEN USB-C 7合1擴充座', 'HDMI 4K、USB 3.0、SD讀卡機', v_category_ids[3], 'pcs', 0.15, 800.00, 1290.00, '6957303123456', v_supplier_ids[1], 25, true),
    
    -- 生活家電
    ('HOME-FAN-001', '大同14吋DC直流電風扇', '節能靜音，7段風速', v_category_ids[4], 'pcs', 4.5, 1800.00, 2690.00, '4710543123456', v_supplier_ids[6], 20, true),
    ('HOME-AIR-001', '日立6坪變頻冷氣', '一級能效，PM2.5過濾', v_category_ids[4], 'pcs', 28.0, 18000.00, 26900.00, '4902530123456', v_supplier_ids[6], 5, true),
    ('HOME-VAC-001', 'Dyson V15 無線吸塵器', '雷射偵測微塵，60分鐘續航', v_category_ids[4], 'pcs', 2.68, 16000.00, 22900.00, '5025155123456', v_supplier_ids[6], 10, true),
    
    -- 食品飲料
    ('FOOD-COF-001', '西雅圖極品咖啡豆 1磅裝', '中深焙阿拉比卡豆', v_category_ids[5], 'bag', 0.454, 380.00, 580.00, '4710012123456', v_supplier_ids[8], 30, true),
    ('FOOD-TEA-001', '阿里山高山烏龍茶 300g', '海拔1500公尺，清香回甘', v_category_ids[5], 'box', 0.3, 800.00, 1200.00, '4710023123456', v_supplier_ids[8], 20, true),
    ('FOOD-SNK-001', '旺旺仙貝綜合包 (20包入)', '經典台灣零食', v_category_ids[5], 'box', 0.52, 120.00, 189.00, '4710543212345', v_supplier_ids[8], 40, true),
    
    -- 清潔用品
    ('CLEAN-DET-001', '白鴿防蟎洗衣精 2.8L', '天然抗菌配方', v_category_ids[6], 'bottle', 2.8, 145.00, 220.00, '4710345123456', v_supplier_ids[2], 40, true),
    ('CLEAN-SPR-001', '威猛先生廚房清潔劑 500ml', '強效去油污', v_category_ids[6], 'bottle', 0.5, 65.00, 99.00, '4902430123456', v_supplier_ids[2], 50, true),
    
    -- 工業原料
    ('RAW-STL-001', '不鏽鋼板 304 2mm厚', '1000x2000mm 標準規格', v_category_ids[7], 'sheet', 31.4, 2800.00, 3600.00, NULL, v_supplier_ids[3], 10, true),
    ('RAW-ALU-001', '鋁合金棒材 6061-T6 直徑25mm', '長度3000mm', v_category_ids[7], 'pcs', 4.0, 450.00, 650.00, NULL, v_supplier_ids[3], 20, true),
    
    -- 包裝材料
    ('PACK-BOX-001', '瓦楞紙箱 30x20x20cm', '五層AB楞，承重25kg', v_category_ids[8], 'pcs', 0.3, 18.00, 28.00, '4710678123456', v_supplier_ids[4], 200, true),
    ('PACK-BUB-001', '氣泡布 寬100cm (每米)', '雙層氣泡，防震保護', v_category_ids[8], 'meter', 0.1, 25.00, 40.00, '4710679123456', v_supplier_ids[4], 100, true),
    
    -- 五金工具
    ('TOOL-DRL-001', 'Makita 牧田 18V充電電鑽', '雙電池組，扭力450N·m', v_category_ids[9], 'set', 2.5, 3500.00, 4990.00, '0885693123456', v_supplier_ids[7], 10, true),
    ('TOOL-WRN-001', 'KINGTONY 金統立 棘輪扳手組', '8-19mm 12件組', v_category_ids[9], 'set', 1.8, 1200.00, 1680.00, '4712755123456', v_supplier_ids[7], 15, true),
    
    -- 安全設備
    ('SAFE-HLM-001', '3M 工程安全帽', 'ABS材質，通風設計', v_category_ids[10], 'pcs', 0.35, 280.00, 420.00, '4710910123456', v_supplier_ids[5], 30, true),
    ('SAFE-GLV-001', '3M 防切割手套 Level 5', '高強度纖維，靈活耐用', v_category_ids[10], 'pair', 0.1, 350.00, 520.00, '4710911123456', v_supplier_ids[5], 40, true)
    ON CONFLICT (sku) DO NOTHING;

    -- Get product IDs
    SELECT ARRAY_AGG(id) INTO v_product_ids FROM products WHERE sku LIKE 'ELEC-%' OR sku LIKE 'OFF-%' OR sku LIKE 'COMP-%' OR sku LIKE 'HOME-%' OR sku LIKE 'FOOD-%' OR sku LIKE 'CLEAN-%' OR sku LIKE 'RAW-%' OR sku LIKE 'PACK-%' OR sku LIKE 'TOOL-%' OR sku LIKE 'SAFE-%';

    -- Create warehouse
    INSERT INTO warehouses (code, name, address, city, postal_code, country, phone, email, manager_name, is_active)
    VALUES ('WH-TPE-001', '台北總倉', '內湖區瑞光路188號', '台北市', '114', '台灣', '02-8797-8888', 'warehouse.taipei@nexuserp.tw', '王大明', true)
    ON CONFLICT (code) DO NOTHING;

    -- Get warehouse ID
    SELECT id INTO v_warehouse_id FROM warehouses WHERE code = 'WH-TPE-001';

    -- Initialize inventory levels for all products
    INSERT INTO inventory_levels (product_id, warehouse_id, quantity_on_hand, quantity_reserved, reorder_point, reorder_quantity)
    SELECT 
        p.id,
        v_warehouse_id,
        CASE 
            WHEN p.sku LIKE 'ELEC-%' THEN floor(random() * 50 + 20)::INTEGER
            WHEN p.sku LIKE 'OFF-%' THEN floor(random() * 200 + 100)::INTEGER
            WHEN p.sku LIKE 'COMP-%' THEN floor(random() * 30 + 15)::INTEGER
            WHEN p.sku LIKE 'HOME-%' THEN floor(random() * 20 + 10)::INTEGER
            WHEN p.sku LIKE 'FOOD-%' THEN floor(random() * 100 + 50)::INTEGER
            WHEN p.sku LIKE 'CLEAN-%' THEN floor(random() * 80 + 40)::INTEGER
            WHEN p.sku LIKE 'RAW-%' THEN floor(random() * 50 + 20)::INTEGER
            WHEN p.sku LIKE 'PACK-%' THEN floor(random() * 300 + 200)::INTEGER
            WHEN p.sku LIKE 'TOOL-%' THEN floor(random() * 25 + 10)::INTEGER
            WHEN p.sku LIKE 'SAFE-%' THEN floor(random() * 60 + 30)::INTEGER
            ELSE floor(random() * 50 + 25)::INTEGER
        END,
        0,  -- quantity_reserved
        p.reorder_point,
        CASE 
            WHEN p.sku LIKE 'OFF-%' OR p.sku LIKE 'PACK-%' THEN p.reorder_point * 5
            WHEN p.sku LIKE 'FOOD-%' OR p.sku LIKE 'CLEAN-%' THEN p.reorder_point * 3
            ELSE p.reorder_point * 2
        END
    FROM products p
    WHERE p.id = ANY(v_product_ids)
    ON CONFLICT (product_id, warehouse_id) DO UPDATE
    SET quantity_on_hand = EXCLUDED.quantity_on_hand,
        reorder_point = EXCLUDED.reorder_point,
        reorder_quantity = EXCLUDED.reorder_quantity;

    -- Create customers
    INSERT INTO customers (customer_code, name, company_name, customer_type, email, phone, billing_address, shipping_address, credit_limit, payment_terms, tax_id, contact_person, customer_segment, is_active) VALUES
    ('CUST-001', '台積電股份有限公司', '台積電股份有限公司', 'business', 'purchase@tsmc.com', '03-563-6688',
     '{"street": "科學園區力行六路8號", "city": "新竹市", "postal_code": "300", "country": "台灣", "is_default": true}',
     '[{"street": "科學園區力行六路8號", "city": "新竹市", "postal_code": "300", "country": "台灣", "is_default": true}]',
     5000000.00, 30, '12345678', '採購部 林經理', 'vip', true),
    
    ('CUST-002', '鴻海精密工業', '鴻海精密工業股份有限公司', 'business', 'sourcing@foxconn.com', '02-2268-3466',
     '{"street": "土城區自由街2號", "city": "新北市", "postal_code": "236", "country": "台灣", "is_default": true}',
     '[{"street": "土城區自由街2號", "city": "新北市", "postal_code": "236", "country": "台灣", "is_default": true}]',
     3000000.00, 45, '23456789', '供應鏈管理部 陳協理', 'vip', true),
    
    ('CUST-003', '聯發科技', '聯發科技股份有限公司', 'business', 'procurement@mediatek.com', '03-567-0766',
     '{"street": "篤行一路1號", "city": "新竹市", "postal_code": "300", "country": "台灣", "is_default": true}',
     '[{"street": "篤行一路1號", "city": "新竹市", "postal_code": "300", "country": "台灣", "is_default": true}]',
     2000000.00, 30, '34567890', '總務部 黃主任', 'premium', true),
    
    ('CUST-004', '誠品書店', '誠品股份有限公司', 'business', 'order@eslite.com', '02-8789-8880',
     '{"street": "松德路196號", "city": "台北市", "postal_code": "110", "country": "台灣", "is_default": true}',
     '[{"street": "松德路196號", "city": "台北市", "postal_code": "110", "country": "台灣", "is_default": true}, {"street": "中港路一段229號", "city": "台中市", "postal_code": "403", "country": "台灣", "is_default": false}]',
     800000.00, 30, '45678901', '採購部 張小姐', 'premium', true),
    
    ('CUST-005', '全家便利商店', '全家便利商店股份有限公司', 'business', 'supply@family.com.tw', '02-2523-9588',
     '{"street": "中山北路二段61號", "city": "台北市", "postal_code": "104", "country": "台灣", "is_default": true}',
     '[{"street": "中山北路二段61號", "city": "台北市", "postal_code": "104", "country": "台灣", "is_default": true}]',
     1500000.00, 15, '56789012', '商品部 李經理', 'premium', true),
    
    ('CUST-006', '王小明', '個人客戶', 'individual', 'wang.xiaoming@gmail.com', '0912-345-678',
     '{"street": "忠孝東路四段100號5樓", "city": "台北市", "postal_code": "106", "country": "台灣", "is_default": true}',
     '[{"street": "忠孝東路四段100號5樓", "city": "台北市", "postal_code": "106", "country": "台灣", "is_default": true}]',
     50000.00, 0, NULL, '王小明', 'standard', true),
    
    ('CUST-007', '李美華', '個人客戶', 'individual', 'mei.hua.lee@hotmail.com', '0922-456-789',
     '{"street": "中正路200號12樓", "city": "台中市", "postal_code": "400", "country": "台灣", "is_default": true}',
     '[{"street": "中正路200號12樓", "city": "台中市", "postal_code": "400", "country": "台灣", "is_default": true}]',
     30000.00, 0, NULL, '李美華', 'standard', true),
    
    ('CUST-008', '新光三越百貨', '新光三越百貨股份有限公司', 'business', 'purchase@skm.com.tw', '02-2371-4399',
     '{"street": "忠孝西路一段66號", "city": "台北市", "postal_code": "100", "country": "台灣", "is_default": true}',
     '[{"street": "忠孝西路一段66號", "city": "台北市", "postal_code": "100", "country": "台灣", "is_default": true}, {"street": "中港路二段111號", "city": "台中市", "postal_code": "407", "country": "台灣", "is_default": false}]',
     1200000.00, 30, '67890123', '採購中心 趙副理', 'premium', true),
    
    ('CUST-009', '中小企業協會', '台灣中小企業協會', 'organization', 'admin@sme.org.tw', '02-2366-0812',
     '{"street": "羅斯福路二段95號4樓", "city": "台北市", "postal_code": "106", "country": "台灣", "is_default": true}',
     '[{"street": "羅斯福路二段95號4樓", "city": "台北市", "postal_code": "106", "country": "台灣", "is_default": true}]',
     200000.00, 30, '78901234', '總務組 吳組長', 'standard', true),
    
    ('CUST-010', '陳建國', '個人客戶', 'individual', 'jianguo.chen@yahoo.com.tw', '0933-567-890',
     '{"street": "民生東路五段200號", "city": "台北市", "postal_code": "105", "country": "台灣", "is_default": true}',
     '[{"street": "民生東路五段200號", "city": "台北市", "postal_code": "105", "country": "台灣", "is_default": true}]',
     40000.00, 0, NULL, '陳建國', 'budget', true)
    ON CONFLICT (customer_code) DO NOTHING;

    -- Get customer IDs
    SELECT ARRAY_AGG(id) INTO v_customer_ids FROM customers WHERE customer_code LIKE 'CUST-%';

    RAISE NOTICE 'Demo data creation in progress...';
    RAISE NOTICE 'Created % suppliers, % products, % customers', array_length(v_supplier_ids, 1), array_length(v_product_ids, 1), array_length(v_customer_ids, 1);

    -- Generate some basic sales orders
    DECLARE
        v_order_id BIGINT;
        v_customer_id BIGINT;
        v_product_id BIGINT;
        v_unit_price DECIMAL(12,2);
        v_quantity INTEGER;
        v_total DECIMAL(12,2);
        i INTEGER;
    BEGIN
        FOR i IN 1..50 LOOP
            -- Select random customer and product
            v_customer_id := v_customer_ids[1 + floor(random() * array_length(v_customer_ids, 1))::INTEGER];
            v_product_id := v_product_ids[1 + floor(random() * array_length(v_product_ids, 1))::INTEGER];
            
            -- Get product price and calculate order
            SELECT selling_price INTO v_unit_price FROM products WHERE id = v_product_id;
            v_quantity := 1 + floor(random() * 10)::INTEGER;
            v_total := v_unit_price * v_quantity;
            
            -- Create sales order
            INSERT INTO sales_orders (customer_id, order_date, status, currency_id, user_id, notes, total_amount)
            VALUES (
                v_customer_id, 
                CURRENT_DATE - INTERVAL '1 day' * floor(random() * 180)::INTEGER,
                CASE floor(random() * 4)::INTEGER
                    WHEN 0 THEN 'pending'
                    WHEN 1 THEN 'processing'
                    WHEN 2 THEN 'shipped'
                    ELSE 'completed'
                END,
                v_tw_currency_id, 
                v_user_id, 
                '測試訂單 #' || i,
                v_total
            ) RETURNING id INTO v_order_id;
            
            -- Add order item
            INSERT INTO sales_order_items (sales_order_id, product_id, quantity, unit_price, discount_percentage, tax_rate, subtotal, tax_amount, total)
            VALUES (
                v_order_id,
                v_product_id,
                v_quantity,
                v_unit_price,
                0,
                5.0,
                v_total,
                v_total * 0.05,
                v_total * 1.05
            );
        END LOOP;
    END;

    -- Generate some purchase orders
    DECLARE
        v_order_id BIGINT;
        v_supplier_id BIGINT;
        v_product_id BIGINT;
        v_cost_price DECIMAL(12,2);
        v_quantity INTEGER;
        v_total DECIMAL(12,2);
        i INTEGER;
    BEGIN
        FOR i IN 1..30 LOOP
            -- Select random supplier and product
            v_supplier_id := v_supplier_ids[1 + floor(random() * array_length(v_supplier_ids, 1))::INTEGER];
            v_product_id := v_product_ids[1 + floor(random() * array_length(v_product_ids, 1))::INTEGER];
            
            -- Get product cost and calculate order
            SELECT cost_price INTO v_cost_price FROM products WHERE id = v_product_id;
            v_quantity := 10 + floor(random() * 100)::INTEGER;
            v_total := v_cost_price * v_quantity;
            
            -- Create purchase order
            INSERT INTO purchase_orders (supplier_id, order_date, expected_delivery_date, status, user_id, currency_id, total_amount)
            VALUES (
                v_supplier_id, 
                CURRENT_DATE - INTERVAL '1 day' * floor(random() * 120)::INTEGER,
                CURRENT_DATE + INTERVAL '1 day' * (7 + floor(random() * 14)::INTEGER),
                CASE floor(random() * 4)::INTEGER
                    WHEN 0 THEN 'pending'
                    WHEN 1 THEN 'approved'
                    WHEN 2 THEN 'shipped'
                    ELSE 'received'
                END,
                v_user_id,
                v_tw_currency_id,
                v_total
            ) RETURNING id INTO v_order_id;
            
            -- Add order item
            INSERT INTO purchase_order_items (purchase_order_id, product_id, quantity, unit_price, tax_rate, total)
            VALUES (
                v_order_id,
                v_product_id,
                v_quantity,
                v_cost_price,
                5.0,
                v_total * 1.05
            );
        END LOOP;
    END;

    RAISE NOTICE 'Demo data created successfully for user: gamepig1976@gmail.com';
    RAISE NOTICE 'Generated 50 sales orders and 30 purchase orders with full item details';

END $$;