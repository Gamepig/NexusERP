# Phase 1: 核心營運與基礎 (Core Operations & Foundation)

**核心目標：** 開發核心的庫存、採購、基礎製造/營運管理功能，實現初步的財務管理（應付帳款）、多點管理基礎，建立 Marketplace 的基本框架（會員/供應商），整合基礎 OCR 功能（進貨單/發票），並提供基本的匯出、語音、圖表功能。

---

## P1.1: 庫存管理 (Inventory Management)

### P1.1.1: 產品/物料主數據管理 (Product/Material Master Data Management)
*   **P1.1.1.1: 資料庫模型設計與遷移 (Golang/GORM)**
    *   P1.1.1.1.1: `products` 表 (ID, sku, name, description, category_id, unit_of_measure, weight, dimensions, supplier_id (optional FK), cost_price, selling_price, barcode, image_url, is_active, created_at, updated_at)
    *   P1.1.1.1.2: `product_categories` 表 (ID, name, parent_category_id (self-referencing FK), description)
    *   P1.1.1.1.3: `units_of_measure` 表 (ID, name, symbol)
*   **P1.1.1.2: 後端 API (Golang/Gin)**
    *   P1.1.1.2.1: CRUD API for Products (`/api/v1/products`)
    *   P1.1.1.2.2: CRUD API for Product Categories (`/api/v1/product-categories`)
    *   P1.1.1.2.3: CRUD API for Units of Measure (`/api/v1/units-of-measure`)
*   **P1.1.1.3: 前端介面 (Laravel/Blade)**
    *   P1.1.1.3.1: 產品列表與篩選頁面
    *   P1.1.1.3.2: 新增/編輯產品表單
    *   P1.1.1.3.3: 產品分類管理介面
    *   P1.1.1.3.4: 計量單位管理介面

### P1.1.2: 倉庫主數據管理 (Warehouse Master Data Management)
*   **P1.1.2.1: 資料庫模型設計與遷移 (Golang/GORM)**
    *   P1.1.2.1.1: `warehouses` 表 (ID, name, code, address, business_unit_id (FK), is_active, created_at, updated_at)
    *   P1.1.2.1.2: `storage_locations` 表 (ID, warehouse_id (FK), name, code, type (e.g., shelf, bin, zone), capacity, created_at, updated_at)
*   **P1.1.2.2: 後端 API (Golang/Gin)**
    *   P1.1.2.2.1: CRUD API for Warehouses (`/api/v1/warehouses`)
    *   P1.1.2.2.2: CRUD API for Storage Locations (`/api/v1/storage-locations`)
*   **P1.1.2.3: 前端介面 (Laravel/Blade)**
    *   P1.1.2.3.1: 倉庫列表與管理介面
    *   P1.1.2.3.2: 儲位列表與管理介面 (可按倉庫篩選)

### P1.1.3: 庫存水平追蹤 (Inventory Level Tracking)
*   **P1.1.3.1: 資料庫模型設計與遷移 (Golang/GORM)**
    *   P1.1.3.1.1: `inventory_levels` 表 (product_id (FK), warehouse_id (FK), storage_location_id (FK, optional), quantity_on_hand, quantity_available, quantity_reserved, quantity_on_order, reorder_point, last_updated_at) - Unique constraint on (product_id, warehouse_id, storage_location_id)
*   **P1.1.3.2: 後端 API (Golang/Gin)**
    *   P1.1.3.2.1: 查詢庫存水平 API (`GET /api/v1/inventory/levels` - 支持按產品、倉庫、儲位篩選)
    *   P1.1.3.2.2: (內部) 更新庫存水平的服務或函數 (由庫存交易觸發)
*   **P1.1.3.3: 前端介面 (Laravel/Blade)**
    *   P1.1.3.3.1: 庫存水平查詢與展示頁面
    *   P1.1.3.3.2: 低庫存預警列表 (基於 reorder_point)

### P1.1.4: 庫存交易記錄 (Inventory Transactions)
*   **P1.1.4.1: 資料庫模型設計與遷移 (Golang/GORM)**
    *   P1.1.4.1.1: `inventory_transactions` 表 (ID, transaction_type_id (FK), product_id (FK), warehouse_id (FK), storage_location_id (FK, optional), quantity_changed, new_quantity_on_hand, transaction_date, reference_document_type, reference_document_id, user_id (FK), notes, created_at)
    *   P1.1.4.1.2: `inventory_transaction_types` 表 (ID, name, description (e.g., Goods Receipt, Goods Issue, Stock Adjustment, Transfer In, Transfer Out))
*   **P1.1.4.2: 後端 API (Golang/Gin)**
    *   P1.1.4.2.1: 記錄庫存交易 API (內部調用為主, e.g., `POST /api/v1/inventory/transactions`)
    *   P1.1.4.2.2: 查詢庫存交易記錄 API (`GET /api/v1/inventory/transactions/history` - 支持篩選)
*   **P1.1.4.3: 前端介面 (Laravel/Blade)**
    *   P1.1.4.3.1: 庫存交易歷史查詢頁面

### P1.1.5: 庫存調整 (Stock Adjustments)
*   **P1.1.5.1: 後端 API (Golang/Gin)**
    *   P1.1.5.1.1: 創建庫存調整 API (`POST /api/v1/inventory/adjustments`) - 內部會記錄 `inventory_transactions` 並更新 `inventory_levels`
*   **P1.1.5.2: 前端介面 (Laravel/Blade)**
    *   P1.1.5.2.1: 庫存調整表單 (選擇產品、倉庫、調整數量、原因)
    *   P1.1.5.2.2: 庫存調整記錄列表

---

## P1.2: 採購管理 (Procurement Management)

### P1.2.1: 供應商主數據管理 (Supplier Master Data Management)
*   **P1.2.1.1: 資料庫模型設計與遷移 (Golang/GORM)**
    *   P1.2.1.1.1: `suppliers` 表 (ID, name, contact_person, email, phone, address, payment_terms_id (FK), tax_id, currency_id (FK), is_active, created_at, updated_at)
    *   P1.2.1.1.2: `payment_terms` 表 (ID, name, description, days_due)
*   **P1.2.1.2: 後端 API (Golang/Gin)**
    *   P1.2.1.2.1: CRUD API for Suppliers (`/api/v1/suppliers`)
    *   P1.2.1.2.2: CRUD API for Payment Terms (`/api/v1/payment-terms`)
*   **P1.2.1.3: 前端介面 (Laravel/Blade)**
    *   P1.2.1.3.1: 供應商列表與篩選頁面
    *   P1.2.1.3.2: 新增/編輯供應商表單
    *   P1.2.1.3.3: 付款條件管理介面

### P1.2.2: 採購請求 (Purchase Requisitions - PR) (可選，簡化版可跳過)
*   **P1.2.2.1: 資料庫模型設計與遷移**
    *   P1.2.2.1.1: `purchase_requisitions` 表 (ID, pr_number, user_id (requester), department_id (FK, optional), request_date, required_date, status (e.g., Draft, Submitted, Approved, Rejected, Closed), total_amount, notes)
    *   P1.2.2.1.2: `purchase_requisition_items` 表 (ID, pr_id (FK), product_id (FK), quantity, unit_price (estimated), total_price, notes)
*   **P1.2.2.2: 後端 API**
*   **P1.2.2.3: 前端介面**

### P1.2.3: 採購訂單 (Purchase Orders - PO)
*   **P1.2.3.1: 資料庫模型設計與遷移 (Golang/GORM)**
    *   P1.2.3.1.1: `purchase_orders` 表 (ID, po_number, supplier_id (FK), order_date, expected_delivery_date, status (e.g., Draft, Sent, Partially Received, Fully Received, Billed, Closed, Cancelled), shipping_address, billing_address, payment_terms_id (FK), total_amount, notes, created_by_user_id (FK))
    *   P1.2.3.1.2: `purchase_order_items` 表 (ID, po_id (FK), product_id (FK), quantity_ordered, quantity_received, unit_price, discount_percentage, tax_rate, total_price, notes)
*   **P1.2.3.2: 後端 API (Golang/Gin)**
    *   P1.2.3.2.1: CRUD API for Purchase Orders (`/api/v1/purchase-orders`)
    *   P1.2.3.2.2: 更新 PO 狀態 API (e.g., `/api/v1/purchase-orders/{id}/status`)
    *   P1.2.3.2.3: PO 轉 PDF 功能 (基礎)
*   **P1.2.3.3: 前端介面 (Laravel/Blade)**
    *   P1.2.3.3.1: 採購訂單列表與篩選頁面
    *   P1.2.3.3.2: 新增/編輯採購訂單表單 (可從 PR 轉化或手動創建)
    *   P1.2.3.3.3: 採購訂單詳情頁面

### P1.2.4: 收貨 (Goods Receipt)
*   **P1.2.4.1: 資料庫模型設計與遷移 (Golang/GORM)**
    *   P1.2.4.1.1: `goods_receipts` 表 (ID, gr_number, po_id (FK, optional), supplier_id (FK, optional), received_date, received_by_user_id (FK), status (e.g., Received, Partially Returned, Fully Returned), warehouse_id (FK), notes)
    *   P1.2.4.1.2: `goods_receipt_items` 表 (ID, gr_id (FK), po_item_id (FK, optional), product_id (FK), quantity_received, quantity_accepted, quantity_rejected, rejection_reason, storage_location_id (FK, optional), notes)
*   **P1.2.4.2: 後端 API (Golang/Gin)**
    *   P1.2.4.2.1: 創建收貨記錄 API (`POST /api/v1/goods-receipts`)
        *   P1.2.4.2.1.1: 成功收貨後，更新 `inventory_levels` (增加在手庫存)
        *   P1.2.4.2.1.2: 記錄 `inventory_transactions` (類型: Goods Receipt)
        *   P1.2.4.2.1.3: 更新對應 `purchase_order_items` 的 `quantity_received` 和 PO 狀態
*   **P1.2.4.3: 前端介面 (Laravel/Blade)**
    *   P1.2.4.3.1: 收貨操作介面 (可基於 PO 進行收貨)
    *   P1.2.4.3.2: 收貨記錄列表與詳情

---

## P1.3: 製造與營運 (Manufacturing & Operations - 基礎)

### P1.3.1: 物料清單 (Bill of Materials - BOM) - 基礎
*   **P1.3.1.1: 資料庫模型設計與遷移 (Golang/GORM)**
    *   P1.3.1.1.1: `boms` 表 (ID, product_id (FK - 成品), bom_name, version, is_active, created_by_user_id (FK), created_at, updated_at)
    *   P1.3.1.1.2: `bom_items` 表 (ID, bom_id (FK), component_product_id (FK - 原料/半成品), quantity_per_assembly, unit_of_measure_id (FK), notes)
*   **P1.3.1.2: 後端 API (Golang/Gin)**
    *   P1.3.1.2.1: CRUD API for BOMs (`/api/v1/boms`)
*   **P1.3.1.3: 前端介面 (Laravel/Blade)**
    *   P1.3.1.3.1: BOM 列表與管理介面
    *   P1.3.1.3.2: 新增/編輯 BOM 表單 (定義成品及其組件)

### P1.3.2: 工作中心/資源 (Work Centers/Resources) - 基礎
*   **P1.3.2.1: 資料庫模型設計與遷移**
    *   P1.3.2.1.1: `work_centers` 表 (ID, name, code, department_id (FK, optional), capacity, efficiency, cost_rate, business_unit_id (FK))
*   **P1.3.2.2: 後端 API**
*   **P1.3.2.3: 前端介面**

### P1.3.3: 生產訂單 (Production Orders) - 基礎
*   **P1.3.3.1: 資料庫模型設計與遷移**
    *   P1.3.3.1.1: `production_orders` 表 (ID, prod_order_number, product_id (FK - 要生產的成品), bom_id (FK), quantity_to_produce, quantity_produced, status (e.g., Planned, Released, In Progress, Completed, Closed), planned_start_date, planned_end_date, actual_start_date, actual_end_date, notes)
*   **P1.3.3.2: 後端 API**
    *   P1.3.3.2.1: CRUD API for Production Orders (`/api/v1/production-orders`)
    *   P1.3.3.2.2: 生產訂單下達時，預扣BOM組件庫存 (更新 `inventory_levels` 的 `quantity_reserved`)
*   **P1.3.3.3: 前端介面**
    *   P1.3.3.3.1: 生產訂單列表與管理
    *   P1.3.3.3.2: 新增/編輯生產訂單

### P1.3.4: 生產回報/完工入庫 (Production Reporting/Goods Receipt from Production) - 基礎
*   **P1.3.4.1: 後端邏輯**
    *   P1.3.4.1.1: 更新生產訂單的 `quantity_produced` 和狀態
    *   P1.3.4.1.2: 消耗BOM組件 (更新 `inventory_levels` 的 `quantity_on_hand` 和 `quantity_reserved`，記錄 `inventory_transactions` - Goods Issue)
    *   P1.3.4.1.3: 成品入庫 (更新 `inventory_levels` 的 `quantity_on_hand`，記錄 `inventory_transactions` - Goods Receipt from Production)
*   **P1.3.4.2: 前端介面**
    *   P1.3.4.2.1: 生產回報輸入介面

---

## P1.4: 生產計畫 (Production Planning - 非常基礎)
*   (此階段僅為後續MRP等打下基礎，可能只包含基於銷售訂單或預測手動創建生產訂單的能力)
*   **P1.4.1: 手動生產計畫輸入**
    *   P1.4.1.1: 允許用戶根據預期需求手動創建生產訂單 (已包含在 P1.3.3 中)

---

## P1.5: 自動化品質管理 (Automated Quality Management - 基礎)
*   (此階段可能僅限於在收貨或生產回報時記錄簡單的合格/不合格數量)
*   **P1.5.1: 基礎品質記錄**
    *   P1.5.1.1: 在 `goods_receipt_items` 中已有 `quantity_accepted`, `quantity_rejected` 欄位
    *   P1.5.1.2: 在生產回報時可記錄合格品、次品數量 (可擴展 `production_orders` 或新建表)

---

## P1.6: 財務管理 (基礎) (Financial Management - Basic)

### P1.6.1: 應付帳款 (Accounts Payable - AP) - 基礎
*   **P1.6.1.1: 供應商發票記錄**
    *   P1.6.1.1.1: 資料庫模型 (`supplier_invoices` 表 - ID, invoice_number, supplier_id (FK), po_id (FK, optional), gr_id (FK, optional), invoice_date, due_date, total_amount, amount_paid, status (e.g., Draft, Submitted, Approved, Partially Paid, Paid), notes)
    *   P1.6.1.1.2: 後端 API for Supplier Invoices
    *   P1.6.1.1.3: 前端介面 (新增/查看供應商發票，可關聯 PO/GR)
*   **P1.6.1.2: 付款記錄**
    *   P1.6.1.2.1: 資料庫模型 (`payments_made` 表 - ID, payment_date, supplier_invoice_id (FK), amount_paid, payment_method_id (FK), reference_number, notes)
    *   P1.6.1.2.2: 後端 API for Payments Made
    *   P1.6.1.2.3: 前端介面 (記錄對供應商發票的付款)

### P1.6.2: 基礎會計科目表 (Chart of Accounts - COA) - 非常基礎
*   **P1.6.2.1: 資料庫模型 (`accounts` 表 - ID, account_code, account_name, account_type (e.g., Asset, Liability, Equity, Revenue, Expense), description, is_active)**
*   **P1.6.2.2: 後端 API for Accounts**
*   **P1.6.2.3: 前端介面 (管理會計科目)**

### P1.6.3: 基礎總帳分錄 (General Ledger Entries - GL) - 非常基礎手動或簡化
*   (此階段可能不實現完整的自動過帳，而是允許手動記錄關鍵分錄，或簡化某些業務流程的過帳邏輯)
*   **P1.6.3.1: 資料庫模型 (`gl_entries` 表 - ID, entry_date, description, reference_document; `gl_entry_details` 表 - ID, gl_entry_id, account_id, debit_amount, credit_amount)**
*   **P1.6.3.2: 基礎的後端服務，在特定事件 (如確認供應商發票、付款) 時產生簡化的 GL 分錄。**

---

## P1.7: 分店管理 (基礎) (Branch Management - Basic)
*   (已在 Phase 0 `BusinessUnits` 模型中打下基礎)
*   **P1.7.1: 業務單位數據隔離與關聯**
    *   P1.7.1.1: 確保核心模組 (庫存、採購等) 的數據能與 `business_units` 關聯。
        *   P1.7.1.1.1: 例如，庫存可以按倉庫區分，倉庫屬於特定業務單位。
        *   P1.7.1.1.2: 用戶可以被授權訪問特定業務單位的數據。
    *   P1.7.1.2: 前端介面支持按業務單位篩選數據 (如適用)。

---

## P1.8: Marketplace 與供應鏈串連 (基礎) (Marketplace & Supply Chain Integration - Basic)

### P1.8.1: 會員/供應商註冊與管理 (基礎)
*   (供應商管理已在 P1.2.1 實現)
*   **P1.8.1.1: (Marketplace 會員) 擴展 `users` 表或新建 `marketplace_members` 表，包含額外信息 (如公司名稱、店舖名稱等)。**
*   **P1.8.1.2: 前端提供 Marketplace 會員註冊入口 (簡化版，可能與普通用戶註冊合併，通過角色區分)。**
*   **P1.8.1.3: 後台管理 Marketplace 會員/供應商的審核與激活。**

### P1.8.2: 基礎商品上架 (由供應商/賣家)
*   **P1.8.2.1: 允許認證後的供應商/賣家（特定角色的 User）透過前端介面上架其產品信息 (使用 P1.1.1 的產品模型，但可能需要增加 `marketplace_product_listings` 表來管理上架狀態、價格等)。**
    *   P1.8.2.1.1: `marketplace_product_listings` (ID, product_id, seller_user_id, listing_price, stock_quantity (由賣家提報或與其自身系統同步), status (e.g., Draft, Active, Inactive, SoldOut))
*   **P1.8.2.2: 後端 API 支持供應商/賣家管理其商品列表。**
*   **P1.8.2.3: 前端介面供供應商/賣家管理其上架商品。**

### P1.8.3: 基礎商品瀏覽 (由買家)
*   **P1.8.3.1: 前端提供公開的 Marketplace 頁面，展示已激活的 `marketplace_product_listings`。**
*   **P1.8.3.2: 基礎的商品搜索與分類瀏覽。**

---

## P1.9: 圖片辨識管理 (採購) (Image Recognition Management - Procurement)

### P1.9.1: OCR 服務選型與 API 對接準備
*   **P1.9.1.1: 研究並選擇 OCR 服務 (如 Google Cloud Vision AI, Azure Computer Vision, 或其他第三方 API)。**
*   **P1.9.1.2: 獲取 OCR 服務的 API Key 和 SDK/Client Library。**
*   **P1.9.1.3: 在後端 (Golang) 建立 OCR 服務的抽象接口和實現。**

### P1.9.2: 採購發票/進貨單 OCR 功能
*   **P1.9.2.1: 前端介面允許上傳採購發票/進貨單圖片或 PDF。**
    *   P1.9.2.1.1: 文件上傳至 MinIO。
*   **P1.9.2.2: 後端 API 接收文件，調用 OCR 服務進行文字識別。**
    *   P1.9.2.2.1: 設計 API (`POST /api/v1/ocr/process-invoice`)。
*   **P1.9.2.3: 解析 OCR 結果，提取關鍵欄位 (供應商名稱、發票號、日期、品項、金額等)。**
    *   P1.9.2.3.1: 可能需要預定義模板或使用 ML/規則進行欄位匹配。
*   **P1.9.2.4: 前端介面展示 OCR 識別結果，並允許用戶校驗和修正。**
*   **P1.9.2.5: 將校驗後的數據用於輔助創建供應商發票記錄 (P1.6.1.1)。**

---

## P1.10: 基礎功能 (Basic Features)

### P1.10.1: 數據匯出功能 (基礎 CSV/Excel)
*   **P1.10.1.1: 後端 API 支持將列表數據 (如產品列表、訂單列表) 匯出為 CSV 格式。**
    *   P1.10.1.1.1: 為核心列表 API 增加匯出參數 (e.g., `?export=csv`)。
*   **P1.10.1.2: 前端在相關列表頁面提供「匯出 CSV」按鈕。**

### P1.10.2: 語音輸入介面 (基礎 Web Speech API 整合)
*   **P1.10.2.1: 在前端 (Laravel/JavaScript) 的部分表單欄位旁，嘗試加入語音輸入按鈕。**
    *   P1.10.2.1.1: 使用瀏覽器原生的 Web Speech API (`SpeechRecognition`)。
    *   P1.10.2.1.2: 將識別的文本填充到對應輸入框。
*   **P1.10.2.2: (此階段不涉及複雜的 NLU，僅為基礎的語音轉文字輸入)。**

### P1.10.3: 圖表視覺化 (基礎 Chart.js 整合)
*   **P1.10.3.1: 選擇幾個核心指標 (如月度採購總額、庫存產品分類佔比)。**
*   **P1.10.3.2: 後端提供對應的聚合數據 API。**
*   **P1.10.3.3: 前端 (Laravel/Blade + JavaScript) 使用 Chart.js 在儀表板或特定頁面展示這些基礎圖表 (如長條圖、圓餅圖)。**

### P1.10.4: 基礎 UI/UX 框架與組件
*   **P1.10.4.1: 確定並應用一致的前端 UI 風格 (e.g., Bootstrap, Tailwind CSS, or custom CSS framework)。**
*   **P1.10.4.2: 開發或選用通用的前端組件 (如表格、表單、模態框、分頁器)。**
*   **P1.10.4.3: 確保基礎的響應式設計。**

--- 