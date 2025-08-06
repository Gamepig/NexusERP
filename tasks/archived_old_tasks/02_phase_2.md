# Phase 2: 核心銷售與財務擴展

**相關規劃文件:** `documents/NexusERP_MajorDevelopmentSteps.md` (階段 3)

**核心目標：** 開發核心銷售流程（報價、訂單、出貨），擴展財務管理（應收帳款、基本總帳），深化庫存管理（批號/序號追蹤、庫存轉移），建立基礎 CRM（客戶、聯絡人、活動），擴展 Marketplace（商品列表、訂單），並完善基礎報表與儀表板。

*(重點: 打通銷售循環，建立應收帳款，深化庫存追蹤，為客戶關係管理奠基)*

---

*   **Task 2.1: 銷售管理 (Sales Management - Core)**
    *   **Task 2.1.1: Schema 設計與遷移**
        *   [ ] 2.1.1.1: (後端) 設計 `customers` 表 Schema (id, name, type[company/individual], contact_person, email, phone, address, sales_rep_user_id, business_unit_id)。
        *   [ ] 2.1.1.2: (後端) 設計 `sales_quotes` 表 Schema (id, quote_number, customer_id, quote_date, expiry_date, status[draft/sent/accepted/rejected], total_amount, notes, business_unit_id, created_by_user_id)。
        *   [ ] 2.1.1.3: (後端) 設計 `sales_quote_items` 表 Schema (id, sales_quote_id, product_id, quantity, unit_price, subtotal)。
        *   [ ] 2.1.1.4: (後端) 設計 `sales_orders` 表 Schema (id, order_number, customer_id, quote_id[可選], order_date, expected_ship_date, status[draft/confirmed/partially_shipped/shipped/invoiced/cancelled], total_amount, notes, business_unit_id, created_by_user_id)。
        *   [ ] 2.1.1.5: (後端) 設計 `sales_order_items` 表 Schema (id, sales_order_id, product_id, quantity_ordered, quantity_shipped, unit_price, subtotal)。
        *   [ ] 2.1.1.6: (後端) 設計 `shipments` (出貨單) 表 Schema (id, shipment_number, sales_order_id, customer_id, shipment_date, tracking_number, status[pending/shipped/delivered], business_unit_id)。
        *   [ ] 2.1.1.7: (後端) 設計 `shipment_items` 表 Schema (id, shipment_id, sales_order_item_id, product_id, quantity_shipped, lot_number, serial_number)。
        *   [ ] 2.1.1.8: (後端) 創建銷售模組的 GORM 模型。
        *   [ ] 2.1.1.9: (後端) 創建銷售模組的資料庫遷移文件並執行。
    *   **Task 2.1.2: 客戶管理 (Customer CRUD)**
        *   [ ] 2.1.2.1: (後端) 實作客戶 CRUD API。
        *   [ ] 2.1.2.2: (前端) 建立客戶列表頁面 UI。
        *   [ ] 2.1.2.3: (前端) 建立客戶創建/編輯頁面 UI。
        *   [ ] 2.1.2.4: (前端) 整合客戶 CRUD API。
        *   [ ] 2.1.2.5: (測試) 撰寫客戶 CRUD 測試。
    *   **Task 2.1.3: 銷售報價邏輯 (Sales Quote Logic)**
        *   [ ] 2.1.3.1: (後端) 實作銷售報價 CRUD API (含報價項)。
        *   [ ] 2.1.3.2: (後端) 實作更新報價狀態 API。
        *   [ ] 2.1.3.3: (後端) 實作從報價生成銷售訂單草稿的邏輯和 API。
        *   [ ] 2.1.3.4: (後端) [基礎] 設計報價單 PDF 生成邏輯 (可使用 Go PDF 庫)。
    *   **Task 2.1.4: 銷售訂單邏輯 (Sales Order Logic)**
        *   [ ] 2.1.4.1: (後端) 實作銷售訂單 CRUD API (含訂單項)。
        *   [ ] 2.1.4.2: (後端) 實作銷售訂單確認邏輯 (檢查庫存, 預留庫存 - 可選)。
        *   [ ] 2.1.4.3: (後端) 實作更新銷售訂單狀態 API。
        *   [ ] 2.1.4.4: (後端) 設計銷售訂單的可出貨數量計算邏輯。
    *   **Task 2.1.5: 出貨管理邏輯 (Shipment Logic)**
        *   [ ] 2.1.5.1: (後端) 實作根據銷售訂單創建出貨單草稿的 API。
        *   [ ] 2.1.5.2: (後端) 實作編輯/確認出貨單 API (包含選擇批號/序號 - 參考 Task 2.2)。
        *   [ ] 2.1.5.3: (後端) 實作出貨單確認邏輯：觸發 Task 1.1.3 的出庫操作，更新 `sales_order_items` 的 `quantity_shipped`。
        *   [ ] 2.1.5.4: (後端) 實作查詢出貨單 API。
    *   **Task 2.1.6: 前端銷售流程 UI**
        *   [ ] 2.1.6.1: (前端) 建立銷售報價列表與創建/編輯 UI。
        *   [ ] 2.1.6.2: (前端) 建立從報價生成訂單的按鈕/流程。
        *   [ ] 2.1.6.3: (前端) 建立銷售訂單列表與創建/編輯 UI。
        *   [ ] 2.1.6.4: (前端) 建立銷售訂單確認與狀態變更操作 UI。
        *   [ ] 2.1.6.5: (前端) 建立出貨單列表與創建/編輯 UI (包含選擇批號/序號)。
        *   [ ] 2.1.6.6: (前端) 建立出貨單確認操作 UI。
        *   [ ] 2.1.6.7: (前端) 整合所有銷售流程相關 API。
    *   **Task 2.1.7: 測試**
        *   [ ] 2.1.7.1: (測試) 撰寫銷售報價、訂單、出貨 CRUD API 測試。
        *   [ ] 2.1.7.2: (測試) 撰寫從報價生成訂單的邏輯測試。
        *   [ ] 2.1.7.3: (測試) 撰寫出貨確認觸發庫存扣減及訂單狀態更新的整合測試。

*   **Task 2.2: 進階庫存管理 (Advanced Inventory)**
    *   **Task 2.2.1: 批號/序號追蹤**
        *   [ ] 2.2.1.1: (後端) 設計 `inventory_batches` 表 Schema (id, product_id, batch_number, expiry_date[可選], manufacturing_date[可選])。
        *   [ ] 2.2.1.2: (後端) 設計 `inventory_serials` 表 Schema (id, product_id, serial_number, status[available/sold/scrapped])。
        *   [ ] 2.2.1.3: (後端) 設計 `inventory_batch_levels` 表 (id, batch_id, warehouse_id, quantity)。
        *   [ ] 2.2.1.4: (後端) 設計 `inventory_serial_locations` 表 (id, serial_id, warehouse_id, location_bin)。
        *   [ ] 2.2.1.5: (後端) 創建批號/序號相關 GORM 模型與遷移。
        *   [ ] 2.2.1.6: (後端) 修改入庫邏輯 (Task 1.1.3)，允許記錄批號/序號，更新對應的 level/location 表。
        *   [ ] 2.2.1.7: (後端) 修改出庫邏輯 (Task 1.1.3)，允許指定批號/序號，檢查並更新對應的 level/location 表。
        *   [ ] 2.2.1.8: (後端) 修改出貨單確認邏輯 (Task 2.1.5)，確保傳入的批號/序號被正確記錄和扣減。
        *   [ ] 2.2.1.9: (後端) 建立查詢特定批號/序號庫存的 API。
    *   **Task 2.2.2: 庫存轉移 (Inventory Transfers)**
        *   [ ] 2.2.2.1: (後端) 設計 `inventory_transfers` 表 Schema (id, transfer_number, from_warehouse_id, to_warehouse_id, status[draft/in_transit/completed], planned_ship_date, actual_ship_date, planned_receive_date, actual_receive_date, business_unit_id)。
        *   [ ] 2.2.2.2: (後端) 設計 `inventory_transfer_items` 表 Schema (id, transfer_id, product_id, quantity, lot_number, serial_number)。
        *   [ ] 2.2.2.3: (後端) 創建庫存轉移 GORM 模型與遷移。
        *   [ ] 2.2.2.4: (後端) 實作庫存轉移單 CRUD API。
        *   [ ] 2.2.2.5: (後端) 實作發貨確認 API (`POST /inventory-transfers/{id}/ship`)：觸發來源倉庫的出庫交易。
        *   [ ] 2.2.2.6: (後端) 實作收貨確認 API (`POST /inventory-transfers/{id}/receive`)：觸發目標倉庫的入庫交易。
    *   **Task 2.2.3: 前端 UI 整合**
        *   [ ] 2.2.3.1: (前端) 在入庫、出庫、調整、出貨等操作介面加入批號/序號輸入/選擇欄位 (根據商品 `is_trackable` 屬性)。
        *   [ ] 2.2.3.2: (前端) 建立批號/序號庫存查詢 UI。
        *   [ ] 2.2.3.3: (前端) 建立庫存轉移單列表與創建/編輯 UI。
        *   [ ] 2.2.3.4: (前端) 建立庫存轉移發貨與收貨操作 UI。
        *   [ ] 2.2.3.5: (前端) 整合批號/序號與庫存轉移相關 API。
    *   **Task 2.2.4: 測試**
        *   [ ] 2.2.4.1: (測試) 測試批號/序號在入庫、出庫、出貨流程中的正確性。
        *   [ ] 2.2.4.2: (測試) 測試庫存轉移發貨和收貨對庫存水平的影響。

*   **Task 2.3: 財務管理擴展 (Finance Expansion)**
    *   **Task 2.3.1: 應收帳款 (Accounts Receivable)**
        *   [ ] 2.3.1.1: (後端) 設計 `accounts_receivable` (應收帳款) 表 Schema (id, sales_order_id, customer_id, invoice_number, invoice_date, due_date, amount, paid_amount, status[open/paid/overdue], business_unit_id)。
        *   [ ] 2.3.1.2: (後端) 創建應收帳款 GORM 模型與遷移。
        *   [ ] 2.3.1.3: (後端) 設計銷售發票生成邏輯：基於已出貨的銷售訂單創建應收帳款記錄。
        *   [ ] 2.3.1.4: (後端) 建立銷售發票生成 API (`POST /sales-orders/{id}/invoice`)。
        *   [ ] 2.3.1.5: (後端) 實作查詢應收帳款 API (`GET /accounts-receivable`)。
        *   [ ] 2.3.1.6: (後端) 實作記錄收款 API (`POST /accounts-receivable/{id}/payment`)，更新應收帳款狀態和餘額。
        *   [ ] 2.3.1.7: (後端) [基礎] 設計發票 PDF 生成邏輯。
    *   **Task 2.3.2: 基礎總帳 (General Ledger - Basic)**
        *   [ ] 2.3.2.1: (後端) 設計 `general_ledger_transactions` 表 Schema (id, transaction_date, description, business_unit_id)。
        *   [ ] 2.3.2.2: (後端) 設計 `gl_transaction_entries` 表 Schema (id, gl_transaction_id, account_code, debit_amount, credit_amount)。
        *   [ ] 2.3.2.3: (後端) 創建總帳相關 GORM 模型與遷移。
        *   [ ] 2.3.2.4: (後端) 設計觸發總帳分錄的機制 (e.g., 應付帳款創建、應收帳款創建、付款、收款時)。
        *   [ ] 2.3.2.5: (後端) 確定各業務事件對應的標準會計分錄模板 (e.g., 收到採購發票: Dr. Inventory/Expense, Cr. Accounts Payable)。
        *   [ ] 2.3.2.6: (後端) 實作自動生成總帳分錄的服務或函數。
        *   [ ] 2.3.2.7: (後端) 實作查詢總帳分錄 API (`GET /general-ledger/transactions`)。
        *   [ ] 2.3.2.8: (後端) 實作手動錄入總帳分錄 API (`POST /general-ledger/transactions`)。
    *   **Task 2.3.3: 前端 UI 整合**
        *   [ ] 2.3.3.1: (前端) 建立應收帳款列表與詳情頁面 UI。
        *   [ ] 2.3.3.2: (前端) 在銷售訂單頁面加入「生成發票」按鈕。
        *   [ ] 2.3.3.3: (前端) 建立記錄收款操作 UI。
        *   [ ] 2.3.3.4: (前端) 建立總帳分錄查詢 UI。
        *   [ ] 2.3.3.5: (前端) 建立手動錄入總帳分錄 UI。
        *   [ ] 2.3.3.6: (前端) 整合應收帳款與總帳相關 API。
    *   **Task 2.3.4: 測試**
        *   [ ] 2.3.4.1: (測試) 測試發票生成與應收帳款創建邏輯。
        *   [ ] 2.3.4.2: (測試) 測試收款對應收帳款狀態的影響。
        *   [ ] 2.3.4.3: (測試) 測試關鍵業務事件 (發票、付款、收款) 觸發總帳分錄的正確性。

*   **Task 2.4: 人力資源管理 (HRM - Basic)**
    *   **Task 2.4.1: Schema 設計與遷移**
        *   [ ] 2.4.1.1: (後端) 設計 `employees` 表 Schema (id, user_id[可選], first_name, last_name, employee_id, job_title, department, hire_date, email, phone, address, business_unit_id)。
        *   [ ] 2.4.1.2: (後端) 創建員工 GORM 模型與遷移。
    *   **Task 2.4.2: 員工管理邏輯**
        *   [ ] 2.4.2.1: (後端) 實作員工 CRUD API。
    *   **Task 2.4.3: 前端 UI**
        *   [ ] 2.4.3.1: (前端) 建立員工列表頁面 UI。
        *   [ ] 2.4.3.2: (前端) 建立員工創建/編輯頁面 UI。
        *   [ ] 2.4.3.3: (前端) 整合員工 CRUD API。
    *   **Task 2.4.4: 測試**
        *   [ ] 2.4.4.1: (測試) 撰寫員工 CRUD API 測試。

*   **Task 2.5: Marketplace 擴展**
    *   **Task 2.5.1: 商品列表與管理**
        *   [ ] 2.5.1.1: (後端) 在 `products` 表增加 `is_listed_on_marketplace`, `marketplace_price` 等欄位。
        *   [ ] 2.5.1.2: (後端) 實作 API 允許 Marketplace Seller 更新其商品的列表狀態和價格。
        *   [ ] 2.5.1.3: (後端) 實作 Marketplace 商品搜索 API (`GET /marketplace/products`)，只返回已上架商品。
    *   **Task 2.5.2: Marketplace 訂單**
        *   [ ] 2.5.2.1: (後端) 設計 `marketplace_orders` 表 Schema (類似 `sales_orders`, 但買家是 `marketplace_members`, 賣家是 `suppliers/members`)。
        *   [ ] 2.5.2.2: (後端) 創建 Marketplace 訂單 GORM 模型與遷移。
        *   [ ] 2.5.2.3: (後端) 實作 Marketplace 買家下單 API (`POST /marketplace/orders`)。
        *   [ ] 2.5.2.4: (後端) 實作 Marketplace 賣家查詢/管理訂單 API。
        *   [ ] 2.5.2.5: (後端) 思考 Marketplace 訂單如何觸發賣家的內部銷售/出貨流程 (可能通過 webhook 或狀態同步)。
    *   **Task 2.5.3: 前端 UI**
        *   [ ] 2.5.3.1: (前端) Marketplace Seller: 建立管理商品列表狀態/價格的 UI。
        *   [ ] 2.5.3.2: (前端) Marketplace Buyer: 建立瀏覽/搜索 Marketplace 商品的 UI。
        *   [ ] 2.5.3.3: (前端) Marketplace Buyer: 建立下單結帳流程 UI。
        *   [ ] 2.5.3.4: (前端) Marketplace Seller: 建立查看/管理收到的 Marketplace 訂單 UI。
        *   [ ] 2.5.3.5: (前端) Marketplace Buyer: 建立查看已下訂單狀態的 UI。
    *   **Task 2.5.4: 測試**
        *   [ ] 2.5.4.1: (測試) 測試 Marketplace 商品列表 API。
        *   [ ] 2.5.4.2: (測試) 測試 Marketplace 買家下單流程。
        *   [ ] 2.5.4.3: (測試) 測試 Marketplace 賣家訂單管理 API。

*   **Task 2.6: 報表與儀表板 (Reporting & Dashboard - Basic)**
    *   **Task 2.6.1: 後端數據準備**
        *   [ ] 2.6.1.1: (後端) 設計儀表板數據 API (`GET /dashboard/summary`)，返回關鍵指標 (e.g., 總銷售額, 總採購額, 應收/應付餘額, 庫存總值)。
        *   [ ] 2.6.1.2: (後端) 設計銷售報表數據 API (`GET /reports/sales`, 按時間、客戶、商品匯總)。
        *   [ ] 2.6.1.3: (後端) 設計庫存報表數據 API (`GET /reports/inventory`, 當前庫存水平、低庫存警告)。
        *   [ ] 2.6.1.4: (後端) 設計財務報表數據 API (`GET /reports/financial`, 基礎損益表/資產負債表數據 - 基於 GL)。
    *   **Task 2.6.2: 前端儀表板**
        *   [ ] 2.6.2.1: (前端) 建立儀表板頁面 Blade 視圖 (`dashboard.blade.php`)。
        *   [ ] 2.6.2.2: (前端) 調用儀表板數據 API。
        *   [ ] 2.6.2.3: (前端) 使用卡片 (Card) 元件顯示關鍵指標。
        *   [ ] 2.6.2.4: (前端) 使用 Task 1.10.3 的圖表元件顯示趨勢圖 (e.g., 月銷售額)。
    *   **Task 2.6.3: 前端報表頁面**
        *   [ ] 2.6.3.1: (前端) 建立銷售報表頁面 UI，包含篩選條件和數據表格。
        *   [ ] 2.6.3.2: (前端) 建立庫存報表頁面 UI。
        *   [ ] 2.6.3.3: (前端) 建立基礎財務報表頁面 UI。
        *   [ ] 2.6.3.4: (前端) 整合報表數據 API。
        *   [ ] 2.6.3.5: (前端) 在報表頁面加入匯出功能 (使用 Task 1.10.1 基礎)。
    *   **Task 2.6.4: 測試**
        *   [ ] 2.6.4.1: (測試) 測試儀表板和報表數據 API 的準確性。

*   **Task 2.7: 客戶關係管理 (CRM - Foundation)**
    *   **Task 2.7.1: Schema 設計與遷移**
        *   [ ] 2.7.1.1: (後端) 設計 `contacts` 表 Schema (id, customer_id, first_name, last_name, email, phone, job_title)。
        *   [ ] 2.7.1.2: (後端) 設計 `activities` 表 Schema (id, customer_id, contact_id[可選], user_id, type[call/email/meeting], subject, description, activity_date, related_entity_id[e.g., quote_id], related_entity_type)。
        *   [ ] 2.7.1.3: (後端) 創建 CRM 相關 GORM 模型與遷移。
    *   **Task 2.7.2: 核心邏輯**
        *   [ ] 2.7.2.1: (後端) 實作聯絡人 CRUD API (與客戶關聯)。
        *   [ ] 2.7.2.2: (後端) 實作活動記錄 CRUD API。
        *   [ ] 2.7.2.3: (後端) 實作查詢特定客戶下的聯絡人與活動 API。
    *   **Task 2.7.3: 前端 UI**
        *   [ ] 2.7.3.1: (前端) 在客戶詳情頁面加入聯絡人列表與管理 UI。
        *   [ ] 2.7.3.2: (前端) 在客戶詳情頁面加入活動記錄列表與創建 UI。
        *   [ ] 2.7.3.3: (前端) [可選] 建立獨立的活動管理頁面。
        *   [ ] 2.7.3.4: (前端) 整合聯絡人與活動 API。
    *   **Task 2.7.4: 測試**
        *   [ ] 2.7.4.1: (測試) 測試聯絡人與活動 CRUD API。 