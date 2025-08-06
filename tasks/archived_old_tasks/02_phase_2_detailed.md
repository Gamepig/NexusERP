# Phase 2: 核心銷售與財務擴展 (Core Sales & Finance Expansion)

**核心目標：** 開發核心銷售流程（報價、訂單、出貨），擴展財務管理（應收帳款、基本總帳），深化庫存管理（批號/序號追蹤、庫存轉移），建立基礎 CRM（客戶、聯絡人、活動），擴展 Marketplace（商品列表、訂單），並完善基礎報表與儀表板。

---

## P2.1: 銷售管理 (Sales Management)

### P2.1.1: 客戶主數據管理 (Customer Master Data Management)
*   **P2.1.1.1: 資料庫模型設計與遷移 (Golang/GORM)**
    *   P2.1.1.1.1: `customers` 表 (ID, customer_number, name, type (e.g., Company, Individual), primary_contact_id (FK to `contacts` table, optional), email, phone, billing_address_id (FK to `addresses`), shipping_address_id (FK to `addresses`), payment_terms_id (FK), credit_limit, tax_id, sales_person_user_id (FK), is_active, created_at, updated_at)
    *   P2.1.1.1.2: `contacts` 表 (ID, customer_id (FK, if contact belongs to a customer), first_name, last_name, email, phone, job_title, is_primary_contact_for_customer, created_at, updated_at)
    *   P2.1.1.1.3: `addresses` 表 (ID, street, city, state, postal_code, country, address_type (e.g., Billing, Shipping, Mailing))
*   **P2.1.1.2: 後端 API (Golang/Gin)**
    *   P2.1.1.2.1: CRUD API for Customers (`/api/v1/customers`)
    *   P2.1.1.2.2: CRUD API for Contacts (`/api/v1/contacts` - can be standalone or nested under customers)
    *   P2.1.1.2.3: CRUD API for Addresses (`/api/v1/addresses`)
*   **P2.1.1.3: 前端介面 (Laravel/Blade)**
    *   P2.1.1.3.1: 客戶列表與篩選頁面
    *   P2.1.1.3.2: 新增/編輯客戶表單 (包含主要聯絡人、帳單/運送地址管理)
    *   P2.1.1.3.3: 聯絡人管理介面 (可關聯客戶)

### P2.1.2: 銷售報價 (Sales Quotations)
*   **P2.1.2.1: 資料庫模型設計與遷移 (Golang/GORM)**
    *   P2.1.2.1.1: `sales_quotations` 表 (ID, quotation_number, customer_id (FK), quotation_date, expiry_date, status (e.g., Draft, Sent, Accepted, Rejected, Expired), total_amount, notes, created_by_user_id (FK))
    *   P2.1.2.1.2: `sales_quotation_items` 表 (ID, quotation_id (FK), product_id (FK), quantity, unit_price, discount_percentage, tax_rate, total_price, notes)
*   **P2.1.2.2: 後端 API (Golang/Gin)**
    *   P2.1.2.2.1: CRUD API for Sales Quotations (`/api/v1/sales-quotations`)
    *   P2.1.2.2.2: 更新報價狀態 API (e.g., `/api/v1/sales-quotations/{id}/status`)
    *   P2.1.2.2.3: 報價單轉 PDF 功能
*   **P2.1.2.3: 前端介面 (Laravel/Blade)**
    *   P2.1.2.3.1: 銷售報價列表與篩選頁面
    *   P2.1.2.3.2: 新增/編輯銷售報價單表單
    *   P2.1.2.3.3: 銷售報價詳情頁面

### P2.1.3: 銷售訂單 (Sales Orders)
*   **P2.1.3.1: 資料庫模型設計與遷移 (Golang/GORM)**
    *   P2.1.3.1.1: `sales_orders` 表 (ID, order_number, customer_id (FK), quotation_id (FK, optional), order_date, requested_delivery_date, status (e.g., Draft, Confirmed, Partially Shipped, Fully Shipped, Invoiced, Cancelled), shipping_address_id (FK), billing_address_id (FK), payment_terms_id (FK), total_amount, notes, created_by_user_id (FK))
    *   P2.1.3.1.2: `sales_order_items` 表 (ID, order_id (FK), product_id (FK), quantity_ordered, quantity_shipped, quantity_to_ship, unit_price, discount_percentage, tax_rate, total_price, notes)
*   **P2.1.3.2: 後端 API (Golang/Gin)**
    *   P2.1.3.2.1: CRUD API for Sales Orders (`/api/v1/sales-orders`)
    *   P2.1.3.2.2: 更新銷售訂單狀態 API
    *   P2.1.3.2.3: 銷售訂單確認時，檢查庫存可用性 (更新 `inventory_levels` 的 `quantity_reserved`)
*   **P2.1.3.3: 前端介面 (Laravel/Blade)**
    *   P2.1.3.3.1: 銷售訂單列表與篩選
    *   P2.1.3.3.2: 新增/編輯銷售訂單 (可從報價轉化)
    *   P2.1.3.3.3: 銷售訂單詳情

### P2.1.4: 出貨/交付 (Shipments/Deliveries)
*   **P2.1.4.1: 資料庫模型設計與遷移 (Golang/GORM)**
    *   P2.1.4.1.1: `shipments` 表 (ID, shipment_number, sales_order_id (FK), shipment_date, shipping_method_id (FK, optional), tracking_number, status (e.g., Picking, Packed, Shipped, Delivered, Cancelled), shipped_by_user_id (FK), notes)
    *   P2.1.4.1.2: `shipment_items` 表 (ID, shipment_id (FK), sales_order_item_id (FK), product_id (FK), quantity_shipped, notes)
    *   P2.1.4.1.3: `shipping_methods` 表 (ID, name, carrier_name (optional), service_level (optional))
*   **P2.1.4.2: 後端 API (Golang/Gin)**
    *   P2.1.4.2.1: 創建出貨記錄 API (`POST /api/v1/shipments`)
        *   P2.1.4.2.1.1: 出貨時，更新 `inventory_levels` (減少在手庫存和已預留庫存)
        *   P2.1.4.2.1.2: 記錄 `inventory_transactions` (類型: Goods Issue - Sales)
        *   P2.1.4.2.1.3: 更新對應 `sales_order_items` 的 `quantity_shipped` 和銷售訂單狀態
*   **P2.1.4.3: 前端介面 (Laravel/Blade)**
    *   P2.1.4.3.1: 出貨操作介面 (可基於銷售訂單創建出貨單)
    *   P2.1.4.3.2: 出貨記錄列表與詳情
    *   P2.1.4.3.3: 包裝清單 (Packing Slip) / 交付單 (Delivery Note) 生成 (PDF)

### P2.1.5: 定價與折扣規則 (Pricing & Discount Rules - 基礎)
*   **P2.1.5.1: 資料庫模型 (可擴展 `products` 或新建 `price_lists`, `discount_rules` 表)**
    *   P2.1.5.1.1: `price_lists` 表 (ID, name, currency_id, valid_from, valid_to)
    *   P2.1.5.1.2: `price_list_items` 表 (ID, price_list_id, product_id, unit_price)
    *   P2.1.5.1.3: 基礎折扣: 在報價單/訂單行項目直接輸入折扣百分比 (已在模型中)
*   **P2.1.5.2: 後端邏輯: 在創建報價/訂單時，根據客戶、產品等應用價格表或基礎折扣。**
*   **P2.1.5.3: 前端介面: 管理價格表 (可選)。**

---

## P2.2: 進階庫存管理 (Advanced Inventory Management)

### P2.2.1: 批號/序號追蹤 (Batch/Serial Number Tracking)
*   **P2.2.1.1: 資料庫模型擴展/設計 (Golang/GORM)**
    *   P2.2.1.1.1: 在 `products` 表增加 `tracking_type` 欄位 (e.g., None, Batch, Serial)
    *   P2.2.1.1.2: `inventory_batches` 表 (ID, product_id (FK), batch_number, manufacturing_date, expiry_date, supplier_batch_number (optional), created_at)
    *   P2.2.1.1.3: `inventory_serials` 表 (ID, product_id (FK), serial_number, status (e.g., InStock, Sold, InRepair), created_at)
    *   P2.2.1.1.4: 修改 `inventory_transactions` 和 `inventory_levels` (或新建明細表) 以包含 `batch_id` 或 `serial_id`，並記錄特定批號/序號的庫存數量。
        *   例如 `inventory_level_details` (product_id, warehouse_id, batch_id/serial_id, quantity)
*   **P2.2.1.2: 後端 API (Golang/Gin)**
    *   P2.2.1.2.1: 收貨時記錄批號/序號的 API
    *   P2.2.1.2.2: 出貨時選擇/掃描批號/序號的 API
    *   P2.2.1.2.3: 查詢特定批號/序號庫存和追溯歷史的 API
*   **P2.2.1.3: 前端介面 (Laravel/Blade)**
    *   P2.2.1.3.1: 在產品主數據中配置批號/序號追蹤類型
    *   P2.2.1.3.2: 收貨/出貨/庫存調整等介面增加批號/序號輸入/選擇功能
    *   P2.2.1.3.3: 批號/序號追溯查詢頁面

### P2.2.2: 庫存轉移 (Stock Transfers - بين倉庫/儲位)
*   **P2.2.2.1: 資料庫模型設計與遷移 (Golang/GORM)**
    *   P2.2.2.1.1: `stock_transfers` 表 (ID, transfer_number, source_warehouse_id (FK), destination_warehouse_id (FK), source_location_id (FK, optional), destination_location_id (FK, optional), transfer_date, status (e.g., Planned, InTransit, Completed, Cancelled), notes, initiated_by_user_id)
    *   P2.2.2.1.2: `stock_transfer_items` 表 (ID, transfer_id (FK), product_id (FK), quantity, batch_id (FK, optional), serial_id (FK, optional))
*   **P2.2.2.2: 後端 API (Golang/Gin)**
    *   P2.2.2.2.1: CRUD API for Stock Transfers (`/api/v1/stock-transfers`)
    *   P2.2.2.2.2: 執行轉移時，更新來源和目標倉庫/儲位的 `inventory_levels`，並記錄 `inventory_transactions` (Transfer Out, Transfer In)
*   **P2.2.2.3: 前端介面 (Laravel/Blade)**
    *   P2.2.2.3.1: 庫存轉移單創建與管理介面
    *   P2.2.2.3.2: 庫存轉移歷史列表

### P2.2.3: 庫存盤點 (Stock Counting/Physical Inventory)
*   **P2.2.3.1: 資料庫模型設計與遷移**
    *   P2.2.3.1.1: `stock_counts` 表 (ID, count_number, warehouse_id (FK), count_date, status (e.g., Planned, InProgress, Completed, Posted), counted_by_user_id, notes)
    *   P2.2.3.1.2: `stock_count_items` 表 (ID, count_id (FK), product_id (FK), storage_location_id (FK, optional), batch_id/serial_id (optional), system_quantity, counted_quantity, variance_quantity)
*   **P2.2.3.2: 後端 API**
    *   P2.2.3.2.1: CRUD API for Stock Counts
    *   P2.2.3.2.2: 過帳盤點結果 API (產生庫存調整交易 P1.1.5)
*   **P2.2.3.3: 前端介面**
    *   P2.2.3.3.1: 創建盤點任務 (可按倉庫、產品分類等篩選範圍)
    *   P2.2.3.3.2: 輸入盤點數量介面 (可支持掃碼槍)
    *   P2.2.3.3.3: 查看盤點差異報告
    *   P2.2.3.3.4: 過帳盤點結果

---

## P2.3: 財務管理擴展 (Finance Management Expansion)

### P2.3.1: 應收帳款 (Accounts Receivable - AR)
*   **P2.3.1.1: 客戶發票記錄**
    *   P2.3.1.1.1: 資料庫模型 (`customer_invoices` 表 - ID, invoice_number, customer_id (FK), sales_order_id (FK, optional), shipment_id (FK, optional), invoice_date, due_date, total_amount, amount_paid, status (e.g., Draft, Sent, Partially Paid, Paid, Overdue), notes)
    *   P2.3.1.1.2: `customer_invoice_items` 表 (ID, invoice_id (FK), product_id (FK)/service_description, quantity, unit_price, total_price)
    *   P2.3.1.1.3: 後端 API for Customer Invoices (CRUD, 狀態更新)
    *   P2.3.1.1.4: 前端介面 (新增/查看客戶發票，可基於銷售訂單/出貨單生成)
*   **P2.3.1.2: 收款記錄**
    *   P2.3.1.2.1: 資料庫模型 (`receipts_received` 表 - ID, receipt_date, customer_invoice_id (FK), amount_received, payment_method_id (FK), reference_number, notes)
    *   P2.3.1.2.2: 後端 API for Receipts Received
    *   P2.3.1.2.3: 前端介面 (記錄客戶付款)
*   **P2.3.1.3: 客戶對帳單 (Customer Statements)**
    *   P2.3.1.3.1: 後端 API 生成對帳單數據
    *   P2.3.1.3.2: 前端介面展示/匯出對帳單

### P2.3.2: 總帳 (General Ledger - GL) 功能完善
*   **P2.3.2.1: 自動過帳邏輯增強**
    *   P2.3.2.1.1: 設計並實現更多業務事件 (如客戶發票確認、收款、銷貨成本結轉) 到 GL 的自動過帳規則。
    *   P2.3.2.1.2: 配置各業務交易所對應的借貸方會計科目。
*   **P2.3.2.2: 總帳查詢與試算平衡表**
    *   P2.3.2.2.1: 後端 API 提供總帳明細查詢、科目餘額查詢
    *   P2.3.2.2.2: 前端介面展示總帳明細、科目餘額表、試算平衡表 (Trial Balance)

### P2.3.3: 貨幣管理 (Currency Management - 基礎)
*   **P2.3.3.1: 資料庫模型 (`currencies` 表 - ID, code, name, symbol, exchange_rate_to_base_currency (手動維護))**
*   **P2.3.3.2: 後端 API for Currencies (CRUD, 匯率更新)**
*   **P2.3.3.3: 前端介面管理貨幣和基礎匯率**
*   **P2.3.3.4: 在交易中 (如 PO, SO, Invoices) 允許選擇交易貨幣，並記錄外幣金額和本位幣金額。**

---

## P2.4: 人力資源管理 (基礎) (Human Resource Management - Basic)
*   (此階段目標是建立員工基本資料，為後續薪資、休假等打基礎)
*   **P2.4.1: 員工主數據 (Employee Master Data)**
    *   P2.4.1.1: 資料庫模型設計與遷移
        *   P2.4.1.1.1: `employees` 表 (ID, employee_number, user_id (FK, 關聯系統用戶), first_name, last_name, gender, date_of_birth, hire_date, job_title_id (FK), department_id (FK), manager_employee_id (self-referencing FK), work_email, work_phone, status (e.g., Active, Terminated), photo_url)
        *   P2.4.1.1.2: `departments` 表 (ID, name, description, manager_employee_id (FK))
        *   P2.4.1.1.3: `job_titles` 表 (ID, title_name, description)
    *   **P2.4.1.2: 後端 API**
        *   P2.4.1.2.1: CRUD API for Employees
        *   P2.4.1.2.2: CRUD API for Departments
        *   P2.4.1.2.3: CRUD API for Job Titles
    *   **P2.4.1.3: 前端介面**
        *   P2.4.1.3.1: 員工列表與管理
        *   P2.4.1.3.2: 部門管理
        *   P2.4.1.3.3: 職位管理

---

## P2.5: Marketplace 擴展 (Marketplace Expansion)

### P2.5.1: 商品列表優化 (Product Listings Enhancement)
*   **P2.5.1.1: 擴展 `marketplace_product_listings` 表，增加更多屬性 (如詳細規格、多圖、品牌、標籤)。**
*   **P2.5.1.2: 前端賣家商品上架介面功能增強。**
*   **P2.5.1.3: 前端買家商品展示頁面信息豐富化，支持多圖瀏覽。**

### P2.5.2: 買家訂單流程 (Buyer Order Process)
*   **P2.5.2.1: 購物車功能**
    *   P2.5.2.1.1: 資料庫模型 (`shopping_carts`, `shopping_cart_items`) 或使用 Redis/Session 存儲。
    *   P2.5.2.1.2: 後端 API 管理購物車 (添加、移除、更新商品)。
    *   P2.5.2.1.3: 前端介面展示購物車。
*   **P2.5.2.2: 結帳流程 (Checkout Process)**
    *   P2.5.2.2.1: 前端引導用戶確認收貨地址、選擇運送方式 (基礎)、選擇支付方式 (基礎，此階段可能僅為「線下支付」或記錄支付意向)。
    *   P2.5.2.2.2: 後端 API 創建 Marketplace 訂單 (`marketplace_orders`, `marketplace_order_items`)，類似於銷售訂單但來源於 Marketplace。
        *   `marketplace_orders` (ID, order_number, buyer_user_id, seller_user_id, order_date, status (e.g., PendingPayment, Paid, Shipped, Delivered, Cancelled), total_amount, shipping_address, billing_address, notes)
*   **P2.5.2.3: 買家訂單查詢**
    *   P2.5.2.3.1: 前端提供買家查看其 Marketplace 訂單歷史和狀態的介面。

### P2.5.3: 賣家訂單管理 (Seller Order Management)
*   **P2.5.3.1: 前端提供賣家查看和管理其收到的 Marketplace 訂單的介面。**
*   **P2.5.3.2: 賣家更新訂單狀態 (如確認訂單、標記已發貨並填寫物流信息)。**
*   **P2.5.3.3: 後端 API 支持賣家更新訂單狀態。**

---

## P2.6: 報表與儀表板 (基礎) (Reporting & Dashboards - Basic)

### P2.6.1: 核心業務報表設計與實現
*   **P2.6.1.1: 銷售報表 (按客戶、產品、時間段統計銷售額、數量、利潤 - 基礎利潤計算)**
    *   P2.6.1.1.1: 後端 API 提供報表數據。
    *   P2.6.1.1.2: 前端以表格或基礎圖表展示。
*   **P2.6.1.2: 採購報表 (按供應商、產品、時間段統計採購額、數量)**
*   **P2.6.1.3: 庫存報表 (庫存周轉率 - 基礎計算, 庫存價值報表, 呆滯料報表 - 基礎)**
*   **P2.6.1.4: 應收/應付帳齡分析報表 (AR/AP Aging Report)**

### P2.6.2: 基礎儀表板 (Dashboard) 設計
*   **P2.6.2.1: 確定儀表板展示的關鍵績效指標 (KPIs) (如總銷售額、活躍客戶數、平均訂單價值、庫存總量等)。**
*   **P2.6.2.2: 後端 API 提供儀表板所需的聚合數據。**
*   **P2.6.2.3: 前端使用 Chart.js 或類似庫，將 KPI 以卡片、趨勢圖、儀表盤等形式展示在主儀表板頁面。**
*   **P2.6.2.4: 允許按業務單位篩選儀表板數據 (如適用)。**

---

## P2.7: 客戶關係管理 (基礎) (Customer Relationship Management - CRM - Basic)
*   (客戶和聯絡人主數據已在 P2.1.1 中建立)
*   **P2.7.1: 活動記錄 (Activity Logging)**
    *   P2.7.1.1: 資料庫模型設計與遷移
        *   P2.7.1.1.1: `activities` 表 (ID, related_to_type (e.g., Customer, Contact, Lead, Opportunity), related_to_id, activity_type_id (FK), subject, description, start_datetime, end_datetime, status (e.g., Planned, Held, Cancelled), assigned_to_user_id (FK), created_by_user_id (FK))
        *   P2.7.1.1.2: `activity_types` 表 (ID, name (e.g., Call, Email, Meeting, Task))
    *   **P2.7.1.2: 後端 API for Activities**
    *   **P2.7.1.3: 前端介面**
        *   P2.7.1.3.1: 在客戶/聯絡人詳情頁面展示相關活動時間線。
        *   P2.7.1.3.2: 手動新增/編輯活動記錄。
*   **P2.7.2: 潛在客戶 (Leads) 管理 (非常基礎)**
    *   P2.7.2.1: 資料庫模型 (`leads` 表 - ID, first_name, last_name, company_name, email, phone, source, status (e.g., New, Contacted, Qualified, Disqualified), assigned_to_user_id)
    *   **P2.7.2.2: 後端 API for Leads**
    *   **P2.7.2.3: 前端介面** (潛在客戶列表、新增/編輯、狀態轉換 - 如轉化為客戶/聯絡人)

--- 