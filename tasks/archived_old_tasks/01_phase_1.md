# Phase 1: 核心營運與基礎

**相關規劃文件:** `documents/NexusERP_MajorDevelopmentSteps.md` (階段 2)

**核心目標：** 開發核心的庫存、採購、基礎製造/營運管理功能，實現初步的財務管理（應付帳款）、多點管理基礎，建立 Marketplace 的基本框架（會員/供應商），整合基礎 OCR 功能（進貨單/發票），並提供基本的匯出、語音、圖表功能。

*(重點: 建立物料、生產、基礎財務流程，為分店和 Marketplace 打下基礎)*

---

*   **Task 1.1: 庫存管理 (Inventory Management - Core)**
    *   **Task 1.1.1: Schema 設計與遷移**
        *   [ ] 1.1.1.1: (後端) 設計 `products` 表 Schema (欄位: id, name, sku, description, category_id, unit, specifications, is_trackable[批號/序號], business_unit_id, created_at, updated_at)。
        *   [ ] 1.1.1.2: (後端) 設計 `product_categories` 表 Schema (id, name)。
        *   [ ] 1.1.1.3: (後端) 設計 `warehouses` 表 Schema (id, name, location, business_unit_id)。
        *   [ ] 1.1.1.4: (後端) 設計 `inventory_levels` 表 Schema (id, product_id, warehouse_id, quantity, safety_stock, business_unit_id)。
        *   [ ] 1.1.1.5: (後端) [研究] 設計生物資產的表示方式 (可能用 `products` + 自訂屬性 或 獨立表)。
        *   [ ] 1.1.1.6: (後端) 設計 `inventory_transactions` 表 Schema (id, product_id, warehouse_id, type[in/out/adjust/transfer], quantity, lot_number, serial_number, related_order_id, related_order_type, business_unit_id, user_id, created_at)。
        *   [ ] 1.1.1.7: (後端) 創建庫存模組的 GORM 模型。
        *   [ ] 1.1.1.8: (後端) 創建庫存模組的資料庫遷移文件。
        *   [ ] 1.1.1.9: (後端) 執行庫存模組遷移。
    *   **Task 1.1.2: 商品管理 (Product CRUD)**
        *   [ ] 1.1.2.1: (後端) 實作創建商品 API (`POST /products`)。
        *   [ ] 1.1.2.2: (後端) 實作讀取商品列表 API (`GET /products`, 含分頁、分類/名稱篩選)。
        *   [ ] 1.1.2.3: (後端) 實作讀取單一商品 API (`GET /products/{id}`)。
        *   [ ] 1.1.2.4: (後端) 實作更新商品 API (`PUT /products/{id}`)。
        *   [ ] 1.1.2.5: (後端) 實作刪除商品 API (`DELETE /products/{id}`, 考慮軟刪除)。
        *   [ ] 1.1.2.6: (後端) 實作倉庫 CRUD API。
        *   [ ] 1.1.2.7: (後端) 實作商品分類 CRUD API。
    *   **Task 1.1.3: 庫存交易邏輯 (Inventory Transactions)**
        *   [ ] 1.1.3.1: (後端) 建立庫存服務層 (Service Layer) 處理業務邏輯。
        *   [ ] 1.1.3.2: (後端) 實作入庫 (Receive Stock) 邏輯 (增加 `inventory_levels`, 創建 `inventory_transactions`)。
        *   [ ] 1.1.3.3: (後端) 建立入庫 API 端點。
        *   [ ] 1.1.3.4: (後端) 實作出庫 (Dispatch Stock) 邏輯 (檢查庫存, 減少 `inventory_levels`, 創建 `inventory_transactions`)。
        *   [ ] 1.1.3.5: (後端) 建立出庫 API 端點。
        *   [ ] 1.1.3.6: (後端) 實作庫存調整 (Adjust Inventory) 邏輯 (更新 `inventory_levels`, 創建 `inventory_transactions`)。
        *   [ ] 1.1.3.7: (後端) 建立庫存調整 API 端點。
        *   [ ] 1.1.3.8: (後端) [基礎] 設計庫存盤點流程 (可能涉及鎖定庫存、記錄差異)。
        *   [ ] 1.1.3.9: (後端) 實作查詢庫存水平 API (`GET /inventory/levels`, 按商品/倉庫篩選)。
        *   [ ] 1.1.3.10: (後端) 實作查詢庫存交易記錄 API (`GET /inventory/transactions`)。
    *   **Task 1.1.4: 前端商品管理 UI**
        *   [ ] 1.1.4.1: (前端) 建立商品列表頁面 Blade 視圖 (`products/index.blade.php`)。
        *   [ ] 1.1.4.2: (前端) 建立商品列表頁面對應的 Controller 和路由。
        *   [ ] 1.1.4.3: (前端) 在 Controller 中調用後端 `GET /products` API 並傳遞數據到視圖。
        *   [ ] 1.1.4.4: (前端) 建立商品創建頁面 Blade 視圖 (`products/create.blade.php`) 及表單。
        *   [ ] 1.1.4.5: (前端) 建立商品創建頁面對應的 Controller (GET 顯示表單, POST 調用後端 `POST /products` API)。
        *   [ ] 1.1.4.6: (前端) 建立商品編輯頁面 Blade 視圖 (`products/edit.blade.php`) 及表單。
        *   [ ] 1.1.4.7: (前端) 建立商品編輯頁面對應的 Controller (GET 顯示表單含數據, PUT 調用後端 `PUT /products/{id}` API)。
        *   [ ] 1.1.4.8: (前端) 實現商品刪除功能 (可能通過列表頁的按鈕觸發 DELETE 請求)。
        *   [ ] 1.1.4.9: (前端) 建立倉庫管理 UI。
        *   [ ] 1.1.4.10: (前端) 建立商品分類管理 UI。
    *   **Task 1.1.5: 前端庫存操作 UI**
        *   [ ] 1.1.5.1: (前端) 建立庫存查詢頁面 Blade 視圖 (`inventory/index.blade.php`)，包含篩選條件。
        *   [ ] 1.1.5.2: (前端) 建立庫存查詢頁面對應的 Controller 和路由，調用後端 `GET /inventory/levels` API。
        *   [ ] 1.1.5.3: (前端) 建立入庫操作頁面/模態框 UI。
        *   [ ] 1.1.5.4: (前端) 建立入庫操作對應的 Controller/路由，調用後端入庫 API。
        *   [ ] 1.1.5.5: (前端) 建立出庫操作頁面/模態框 UI。
        *   [ ] 1.1.5.6: (前端) 建立出庫操作對應的 Controller/路由，調用後端出庫 API。
        *   [ ] 1.1.5.7: (前端) 建立庫存調整操作頁面/模態框 UI。
        *   [ ] 1.1.5.8: (前端) 建立庫存調整操作對應的 Controller/路由，調用後端調整 API。
        *   [ ] 1.1.5.9: (前端) 建立庫存交易記錄查詢 UI。
    *   **Task 1.1.6: 測試**
        *   [ ] 1.1.6.1: (測試) 撰寫商品 CRUD 後端 API 的單元/整合測試。
        *   [ ] 1.1.6.2: (測試) 撰寫庫存交易服務層邏輯的單元測試。
        *   [ ] 1.1.6.3: (測試) 撰寫庫存交易 API 的整合測試。
        *   [ ] 1.1.6.4: (測試) 撰寫前端商品管理 Controller 的單元測試 (PHPUnit)。
        *   [ ] 1.1.6.5: [可選] 編寫商品管理 E2E 測試案例。

*   **Task 1.2: 採購管理 (Procurement Management - Core)**
    *   **Task 1.2.1: Schema 設計與遷移**
        *   [ ] 1.2.1.1: (後端) 設計 `suppliers` 表 Schema (id, name, contact_person, email, phone, address, business_unit_id)。
        *   [ ] 1.2.1.2: (後端) 設計 `purchase_orders` 表 Schema (id, po_number, supplier_id, order_date, expected_delivery_date, status[draft/approved/partially_received/received/cancelled], total_amount, notes, business_unit_id, created_by_user_id)。
        *   [ ] 1.2.1.3: (後端) 設計 `purchase_order_items` 表 Schema (id, purchase_order_id, product_id, quantity, unit_price, subtotal)。
        *   [ ] 1.2.1.4: (後端) 創建採購模組的 GORM 模型。
        *   [ ] 1.2.1.5: (後端) 創建採購模組的資料庫遷移文件並執行。
    *   **Task 1.2.2: 供應商管理 (Supplier CRUD)**
        *   [ ] 1.2.2.1: (後端) 實作供應商 CRUD API。
        *   [ ] 1.2.2.2: (前端) 建立供應商列表頁面 UI。
        *   [ ] 1.2.2.3: (前端) 建立供應商創建/編輯頁面 UI。
        *   [ ] 1.2.2.4: (前端) 整合供應商 CRUD API。
        *   [ ] 1.2.2.5: (測試) 撰寫供應商 CRUD 測試。
    *   **Task 1.2.3: 採購訂單邏輯 (Purchase Order Logic)**
        *   [ ] 1.2.3.1: (後端) 實作創建採購訂單 API (`POST /purchase-orders`)，包含訂單項。
        *   [ ] 1.2.3.2: (後端) 實作查詢採購訂單列表 API (`GET /purchase-orders`, 含篩選、分頁)。
        *   [ ] 1.2.3.3: (後端) 實作查詢單一採購訂單 API (`GET /purchase-orders/{id}`)。
        *   [ ] 1.2.3.4: (後端) 實作更新採購訂單 API (`PUT /purchase-orders/{id}`)，可能限制僅更新草稿狀態訂單。
        *   [ ] 1.2.3.5: (後端) 實作更新採購訂單狀態 API (`PATCH /purchase-orders/{id}/status`)。
        *   [ ] 1.2.3.6: (後端) 實作採購訂單到貨邏輯：觸發 Task 1.1.3 的入庫操作。
        *   [ ] 1.2.3.7: (後端) 建立採購單到貨確認 API (`POST /purchase-orders/{id}/receive`)。
    *   **Task 1.2.4: 前端採購訂單 UI**
        *   [ ] 1.2.4.1: (前端) 建立採購訂單列表頁面 UI。
        *   [ ] 1.2.4.2: (前端) 建立採購訂單創建頁面 UI (含供應商、商品選擇)。
        *   [ ] 1.2.4.3: (前端) 建立採購訂單詳情頁面 UI。
        *   [ ] 1.2.4.4: (前端) 建立採購訂單編輯頁面 UI (可能僅限草稿)。
        *   [ ] 1.2.4.5: (前端) 整合採購訂單 CRUD 和狀態更新 API。
        *   [ ] 1.2.4.6: (前端) 建立採購訂單到貨確認操作 UI。
    *   **Task 1.2.5: 測試**
        *   [ ] 1.2.5.1: (測試) 撰寫採購訂單 CRUD 與狀態變更 API 測試。
        *   [ ] 1.2.5.2: (測試) 撰寫採購訂單到貨觸發入庫的整合測試。

*   **Task 1.3: 製造與營運 (Manufacturing & Operations - Core)** (若目標行業初期包含製造業)
    *   **Task 1.3.1: Schema 設計與遷移**
        *   [ ] 1.3.1.1: (後端) 設計 `bill_of_materials` (BOM) 表 Schema (id, product_id[成品], name, description)。
        *   [ ] 1.3.1.2: (後端) 設計 `bom_items` 表 Schema (id, bom_id, product_id[原料], quantity, unit)。
        *   [ ] 1.3.1.3: (後端) 設計 `production_orders` 表 Schema (id, order_number, product_id, bom_id, quantity_planned, quantity_produced, status[planned/in_progress/completed/cancelled], start_date, end_date, business_unit_id)。
        *   [ ] 1.3.1.4: (後端) 設計 `work_centers` 表 Schema (id, name, capacity, business_unit_id)。
        *   [ ] 1.3.1.5: (後端) 創建製造模組 GORM 模型與遷移文件並執行。
    *   **Task 1.3.2: BOM 與工單邏輯**
        *   [ ] 1.3.2.1: (後端) 實作 BOM CRUD API (含物料項)。
        *   [ ] 1.3.2.2: (後端) 實作工單 CRUD API。
        *   [ ] 1.3.2.3: (後端) 實作工單確認/開始生產邏輯 (預扣原料庫存)。
        *   [ ] 1.3.2.4: (後端) 實作工單完成邏輯 (實際消耗原料庫存, 增加成品庫存)。
        *   [ ] 1.3.2.5: (後端) 建立工單完成 API (`POST /production-orders/{id}/complete`)。
    *   **Task 1.3.3: 前端製造 UI**
        *   [ ] 1.3.3.1: (前端) 建立 BOM 管理 UI (創建、查看、編輯)。
        *   [ ] 1.3.3.2: (前端) 建立工單列表與詳情頁面 UI。
        *   [ ] 1.3.3.3: (前端) 建立工單創建/編輯頁面 UI。
        *   [ ] 1.3.3.4: (前端) 整合製造相關 API。
        *   [ ] 1.3.3.5: (前端) 建立工單完成操作 UI。
    *   **Task 1.3.4: 測試**
        *   [ ] 1.3.4.1: (測試) 撰寫 BOM 管理 API 測試。
        *   [ ] 1.3.4.2: (測試) 撰寫工單流程與庫存變動的整合測試。

*   **Task 1.4: 生產計畫 (Production Planning - Basic)** (若 Task 1.3 執行)
    *   **Task 1.4.1: Schema 設計與邏輯**
        *   [ ] 1.4.1.1: (後端) 設計 `production_plans` 表 Schema (id, plan_period, product_id, planned_quantity, business_unit_id)。
        *   [ ] 1.4.1.2: (後端) 創建生產計畫 GORM 模型與遷移文件並執行。
        *   [ ] 1.4.1.3: (後端) 實作生產計畫 CRUD API。
        *   [ ] 1.4.1.4: (後端) 實作根據生產計畫生成工單草稿的邏輯。
    *   **Task 1.4.2: 前端生產計畫 UI**
        *   [ ] 1.4.2.1: (前端) 建立生產計畫列表與編輯 UI。
        *   [ ] 1.4.2.2: (前端) 整合生產計畫 API。
        *   [ ] 1.4.2.3: (前端) 加入從計畫生成工單草稿的按鈕。
    *   **Task 1.4.3: 測試**
        *   [ ] 1.4.3.1: (測試) 撰寫生產計畫 CRUD 測試。
        *   [ ] 1.4.3.2: (測試) 測試從計畫生成工單草稿的邏輯。

*   **Task 1.5: 自動化品質管理 (Automated Quality Management - Basic)**
    *   **Task 1.5.1: Schema 設計與邏輯**
        *   [ ] 1.5.1.1: (後端) 設計 `quality_checkpoints` 表 Schema (id, name, description, check_type[e.g., incoming, in-process, final])。
        *   [ ] 1.5.1.2: (後端) 設計 `quality_records` 表 Schema (id, checkpoint_id, product_id, lot_number, production_order_id, purchase_order_id, result[pass/fail], remarks, checked_by_user_id, checked_at)。
        *   [ ] 1.5.1.3: (後端) 創建品質管理 GORM 模型與遷移文件並執行。
        *   [ ] 1.5.1.4: (後端) 實作記錄品質檢查結果 API (`POST /quality-records`)。
        *   [ ] 1.5.1.5: (後端) 實作查詢品質記錄 API (`GET /quality-records`)。
    *   **Task 1.5.2: 前端品質管理 UI**
        *   [ ] 1.5.2.1: (前端) 建立品質檢查點管理 UI (可選，或預設)。
        *   [ ] 1.5.2.2: (前端) 在相關流程節點 (如入庫確認、工單完成) 嵌入品質記錄輸入介面。
        *   [ ] 1.5.2.3: (前端) 建立品質記錄查詢頁面 UI。
        *   [ ] 1.5.2.4: (前端) 整合品質記錄 API。
    *   **Task 1.5.3: 測試**
        *   [ ] 1.5.3.1: (測試) 撰寫品質記錄 API 測試。

*   **Task 1.6: 財務管理 (Finance - Basic)**
    *   **Task 1.6.1: Schema 設計與遷移**
        *   [ ] 1.6.1.1: (後端) 設計 `accounts_payable` (應付帳款) 表 Schema (id, purchase_order_id, supplier_id, invoice_number, invoice_date, due_date, amount, paid_amount, status[open/paid/overdue], business_unit_id)。
        *   [ ] 1.6.1.2: (後端) 設計基礎 `chart_of_accounts` (會計科目) 表 Schema (id, code, name, type[asset/liability/equity/revenue/expense])。
        *   [ ] 1.6.1.3: (後端) 創建基礎財務模組 GORM 模型與遷移文件並執行。
        *   [ ] 1.6.1.4: (後端) 創建基礎會計科目 Seeder。
    *   **Task 1.6.2: 應付帳款邏輯**
        *   [ ] 1.6.2.1: (後端) 實作根據採購訂單到貨/發票創建應付帳款的邏輯 (或 API)。
        *   [ ] 1.6.2.2: (後端) 實作查詢應付帳款 API (`GET /accounts-payable`)。
        *   [ ] 1.6.2.3: (後端) 實作更新應付帳款狀態/支付金額 API (`PATCH /accounts-payable/{id}`)。
    *   **Task 1.6.3: 前端應付帳款 UI**
        *   [ ] 1.6.3.1: (前端) 建立應付帳款列表與詳情頁面 UI。
        *   [ ] 1.6.3.2: (前端) 建立手動創建/編輯應付帳款 UI。
        *   [ ] 1.6.3.3: (前端) 建立記錄付款操作 UI。
        *   [ ] 1.6.3.4: (前端) 整合應付帳款 API。
    *   **Task 1.6.4: 測試**
        *   [ ] 1.6.4.1: (測試) 撰寫應付帳款創建與更新邏輯測試。

*   **Task 1.7: 分店管理 (Branch Management - Foundation)**
    *   **Task 1.7.1: 後端基礎**
        *   [ ] 1.7.1.1: (後端) 確認 `business_units` 表已正確設計並遷移。
        *   [ ] 1.7.1.2: (後端) 確保 Task 1.1 - 1.6 的相關表中已加入 `business_unit_id`。
        *   [ ] 1.7.1.3: (後端) 實作應用層數據過濾邏輯：在查詢時根據用戶權限自動加入 `business_unit_id` 條件。
        *   [ ] 1.7.1.4: (後端) 建立業務單位 CRUD API。
    *   **Task 1.7.2: 前端整合**
        *   [ ] 1.7.2.1: (前端) 在佈局或用戶菜單中加入當前選擇的業務單位顯示/切換器。
        *   [ ] 1.7.2.2: (前端) 在所有涉及多業務單位的列表頁面加入業務單位篩選器。
        *   [ ] 1.7.2.3: (前端) 在創建/編輯表單中，根據權限決定是否顯示/允許選擇業務單位。
        *   [ ] 1.7.2.4: (前端) 建立業務單位管理 UI。

*   **Task 1.8: Marketplace 與供應鏈串連 (Marketplace & SCM Link - Foundation)**
    *   **Task 1.8.1: Schema 設計**
        *   [ ] 1.8.1.1: (後端) 設計 `marketplace_members` 表 Schema (id, user_id, company_id, role[buyer/seller/both], status[active/inactive])。
        *   [ ] 1.8.1.2: (後端) 在 `suppliers` 表 Schema 中添加 `is_marketplace_member`, `marketplace_rating` 等欄位。
        *   [ ] 1.8.1.3: (後端) 創建 Marketplace 相關 GORM 模型與遷移。
    *   **Task 1.8.2: 核心邏輯**
        *   [ ] 1.8.2.1: (後端) 設計並實作供應商加入 Marketplace 的申請/審核流程 API。
        *   [ ] 1.8.2.2: (後端) 設計基礎的 Marketplace 供應商/商品搜索 API。
    *   **Task 1.8.3: 前端 UI**
        *   [ ] 1.8.3.1: (前端) 建立 Marketplace 基礎入口/儀表板頁面。
        *   [ ] 1.8.3.2: (前端) 建立供應商申請加入 Marketplace 的表單。
        *   [ ] 1.8.3.3: (前端) 建立基礎的 Marketplace 供應商搜索 UI。

*   **Task 1.9: 圖片辨識管理 (OCR - Procurement Focus)**
    *   **Task 1.9.1: 文件上傳基礎**
        *   [ ] 1.9.1.1: (後端) 設計文件上傳 API 端點 (`POST /documents/upload`)。
        *   [ ] 1.9.1.2: (後端) 實作文件驗證 (大小、類型)。
        *   [ ] 1.9.1.3: (後端) 調用 Task 0.5.1.7 將文件上傳至 S3 (MinIO)。
        *   [ ] 1.9.1.4: (後端) 設計 `uploaded_documents` 表 Schema (id, user_id, file_name, s3_key, mime_type, size, status[uploaded/processing/processed/error], document_type[invoice/po/contract/etc.], related_entity_id, related_entity_type)。
        *   [ ] 1.9.1.5: (後端) 創建文件上傳 GORM 模型與遷移。
        *   [ ] 1.9.1.6: (後端) 實作文件上傳後創建 `uploaded_documents` 記錄的邏輯。
    *   **Task 1.9.2: OCR 整合與處理**
        *   [ ] 1.9.2.1: (後端) 選擇外部 OCR 服務 API。
        *   [ ] 1.9.2.2: (後端) 獲取 OCR 服務 API Key 並配置到 .env。
        *   [ ] 1.9.2.3: (後端) 實作 OCR API Client。
        *   [ ] 1.9.2.4: (後端) 設計 OCR 任務結構 (包含 document_id, s3_key)。
        *   [ ] 1.9.2.5: (後端) 選擇並設定背景任務佇列 (e.g., Redis + Asynq/Machinery)。
        *   [ ] 1.9.2.6: (後端) 實作將 OCR 任務推送到佇列的邏輯 (文件上傳成功後觸發)。
        *   [ ] 1.9.2.7: (後端) 實作 OCR Worker：從佇列獲取任務 -> 調用 OCR API -> 處理返回結果 -> 更新 `uploaded_documents` 狀態和結果。
        *   [ ] 1.9.2.8: (後端) 設計/選擇 NLP 庫或服務用於從 OCR 結果中提取結構化數據 (e.g., 發票號碼、供應商名稱、金額、品項)。
        *   [ ] 1.9.2.9: (後端) 針對進貨單/發票設計提取規則/模板。
    *   **Task 1.9.3: 業務流程整合**
        *   [ ] 1.9.3.1: (後端) 實作根據進貨單 OCR 結果創建採購訂單草稿的邏輯。
        *   [ ] 1.9.3.2: (後端) 實作根據發票 OCR 結果創建應付帳款草稿的邏輯。
        *   [ ] 1.9.3.3: (後端) 設計 OCR 結果與現有訂單/帳款的匹配與核對邏輯。
    *   **Task 1.9.4: 前端 UI**
        *   [ ] 1.9.4.1: (前端) 建立文件上傳表單 UI。
        *   [ ] 1.9.4.2: (前端) 建立已上傳文件列表及處理狀態顯示 UI。
        *   [ ] 1.9.4.3: (前端) 建立 OCR 提取結果的預覽與核對確認 UI。
        *   [ ] 1.9.4.4: (前端) 將文件上傳功能整合到採購/應付帳款流程中。
    *   **Task 1.9.5: 測試**
        *   [ ] 1.9.5.1: (測試) 測試文件上傳 API 與 S3 整合。
        *   [ ] 1.9.5.2: (測試) 測試 OCR API 調用與結果處理。
        *   [ ] 1.9.5.3: (測試) 測試背景任務佇列與 Worker。
        *   [ ] 1.9.5.4: (測試) 測試 OCR 結果生成採購單/應付帳款草稿的流程。

*   **Task 1.10: 基礎功能 (Basic Utilities)**
    *   **Task 1.10.1: 列表匯出**
        *   [ ] 1.10.1.1: (後端) 選擇 Excel/CSV 生成庫 (e.g., `excelize`, `encoding/csv`)。
        *   [ ] 1.10.1.2: (後端) 實作通用的列表數據匯出 API (`GET /.../export`)，接收篩選條件，返回文件流。
        *   [ ] 1.10.1.3: (前端) 在主要列表頁面 (商品、庫存、採購單等) 添加匯出按鈕，觸發後端 API。
    *   **Task 1.10.2: 語音輸入**
        *   [ ] 1.10.2.1: (前端) 研究瀏覽器 Web Speech API (SpeechRecognition)。
        *   [ ] 1.10.2.2: (前端) 在主要搜尋框旁邊添加麥克風圖標按鈕。
        *   [ ] 1.10.2.3: (前端) 實現點擊按鈕觸發語音識別，並將結果填入搜尋框的 JavaScript 邏輯。
        *   [ ] 1.10.2.4: (前端) 處理瀏覽器兼容性和權限請求。
    *   **Task 1.10.3: 圖表顯示**
        *   [ ] 1.10.3.1: (前端) 引入 Chart.js 庫 (`npm install chart.js`)。
        *   [ ] 1.10.3.2: (前端) 創建一個基礎的圖表 Blade 元件 (`<x-chart type="bar" :data="$data"/>`)。
        *   [ ] 1.10.3.3: (後端) 準備一個基礎的圖表數據 API (e.g., 按月的採購金額)。
        *   [ ] 1.10.3.4: (前端) 在某個頁面 (e.g., 儀表板雛形) 調用 API 並使用圖表元件顯示。 