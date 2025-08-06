# Phase 3: 進階製造、供應鏈與智能分析

**相關規劃文件:** `documents/NexusERP_MajorDevelopmentSteps.md` (階段 4)

**核心目標：** 深化製造與營運管理（MRP、產能規劃、排程），擴展品質管理，完善 HRM（薪資、休假），強化 CRM（銷售管道、機會），擴展 Marketplace（賣家入駐、評價、支付），建立供應鏈協同（供應商門戶、詢價），引入進階 BI 分析，並增強 OCR 能力。

*(重點: 優化生產效率，打通供應鏈協同，提升數據洞察力)*

---

*   **Task 3.1: 進階製造與營運 (Advanced Manufacturing & Operations)**
    *   **Task 3.1.1: 物料需求規劃 (MRP)**
        *   [ ] 3.1.1.1: (後端) 設計 MRP 運算邏輯：根據銷售訂單、生產計畫、預測、當前庫存、BOM、採購提前期計算淨需求。
        *   [ ] 3.1.1.2: (後端) 設計 `mrp_runs` 表 Schema (記錄每次 MRP 運算的結果)。
        *   [ ] 3.1.1.3: (後端) 設計 `mrp_recommendations` 表 Schema (記錄建議的採購訂單和工單)。
        *   [ ] 3.1.1.4: (後端) 創建 MRP 相關 GORM 模型與遷移。
        *   [ ] 3.1.1.5: (後端) 實作 MRP 運算觸發 API/背景任務。
        *   [ ] 3.1.1.6: (後端) 實作查詢 MRP 運算結果和建議的 API。
        *   [ ] 3.1.1.7: (後端) 實作從 MRP 建議生成採購訂單/工單草稿的邏輯。
    *   **Task 3.1.2: 產能規劃 (Capacity Planning)**
        *   [ ] 3.1.2.1: (後端) 在 `work_centers` 表 (Task 1.3) 中增加詳細產能數據 (e.g., 工作時間, 效率)。
        *   [ ] 3.1.2.2: (後端) 設計工單與工序 (Routing) 關聯表。
        *   [ ] 3.1.2.3: (後端) 設計工序所需資源 (工時、機器時間) 的數據結構。
        *   [ ] 3.1.2.4: (後端) 實作計算各工作中心負載的邏輯 (基於已排程工單)。
        *   [ ] 3.1.2.5: (後端) 建立查詢工作中心負載/利用率的 API。
    *   **Task 3.1.3: 生產排程 (Production Scheduling)**
        *   [ ] 3.1.3.1: (後端) 設計工單排程表 Schema (記錄工單在各工作中心的計劃開始/結束時間)。
        *   [ ] 3.1.3.2: (後端) 選擇或實作基礎的排程算法 (e.g., 有限產能排程)。
        *   [ ] 3.1.3.3: (後端) 實作工單排程 API/背景任務。
        *   [ ] 3.1.3.4: (後端) 實作查詢甘特圖所需數據的 API。
    *   **Task 3.1.4: 車間控制 (Shop Floor Control - Basic)**
        *   [ ] 3.1.4.1: (後端) 設計工單進度回報 API (`POST /production-orders/{id}/progress`)，允許記錄實際產出、工時、廢料等。
        *   [ ] 3.1.4.2: (後端) 更新工單狀態和實際產出數據。
    *   **Task 3.1.5: 前端 UI 整合**
        *   [ ] 3.1.5.1: (前端) 建立 MRP 運算觸發與結果查看頁面。
        *   [ ] 3.1.5.2: (前端) 建立從 MRP 建議生成採購/工單草稿的操作 UI。
        *   [ ] 3.1.5.3: (前端) 建立工作中心負載查看 UI (可能使用圖表)。
        *   [ ] 3.1.5.4: (前端) 建立生產排程甘特圖顯示 UI (可研究前端甘特圖庫, e.g., DHTMLX Gantt, Frappe Gantt)。
        *   [ ] 3.1.5.5: (前端) 建立工單進度回報輸入介面 (可能用於平板或終端)。
        *   [ ] 3.1.5.6: (前端) 整合進階製造相關 API。
    *   **Task 3.1.6: 測試**
        *   [ ] 3.1.6.1: (測試) 測試 MRP 運算邏輯的準確性 (使用不同場景數據)。
        *   [ ] 3.1.6.2: (測試) 測試產能負載計算邏輯。
        *   [ ] 3.1.6.3: (測試) 測試排程結果與甘特圖數據 API。
        *   [ ] 3.1.6.4: (測試) 測試工單進度回報對工單狀態的影響。

*   **Task 3.2: 進階品質管理 (Advanced Quality Management)**
    *   **Task 3.2.1: 品質檢查表與 SOP**
        *   [ ] 3.2.1.1: (後端) 設計 `quality_checklists` 表 Schema (關聯 `quality_checkpoints`, 包含具體檢查項、標準、允收範圍)。
        *   [ ] 3.2.1.2: (後端) 設計 `quality_sop` (標準作業程序) 表 Schema (關聯 `products` 或 `work_centers`)。
        *   [ ] 3.2.1.3: (後端) 創建相關 GORM 模型與遷移。
        *   [ ] 3.2.1.4: (後端) 實作 Checklist 和 SOP 的 CRUD API。
        *   [ ] 3.2.1.5: (後端) 修改品質記錄 API (Task 1.5)，允許關聯 Checklist 並記錄各項結果。
    *   **Task 3.2.2: 不合格品管理 (Non-Conformance Reporting - NCR)**
        *   [ ] 3.2.2.1: (後端) 設計 `ncr_reports` 表 Schema (id, report_number, product_id, lot_number, detected_stage[incoming/in-process/final], description, quantity, status[open/investigating/closed], resolution, business_unit_id)。
        *   [ ] 3.2.2.2: (後端) 創建 NCR GORM 模型與遷移。
        *   [ ] 3.2.2.3: (後端) 實作 NCR 報告 CRUD API。
        *   [ ] 3.2.2.4: (後端) 設計 NCR 與庫存隔離/處置流程的關聯。
    *   **Task 3.2.3: 前端 UI 整合**
        *   [ ] 3.2.3.1: (前端) 建立品質檢查表管理 UI。
        *   [ ] 3.2.3.2: (前端) 建立 SOP 管理 UI。
        *   [ ] 3.2.3.3: (前端) 在品質記錄輸入介面顯示對應的 Checklist。
        *   [ ] 3.2.3.4: (前端) 建立 NCR 報告列表與創建/編輯 UI。
    *   **Task 3.2.4: 測試**
        *   [ ] 3.2.4.1: (測試) 測試 Checklist/SOP 管理 API。
        *   [ ] 3.2.4.2: (測試) 測試 NCR 報告流程。

*   **Task 3.3: 人力資源管理擴展 (HRM Expansion)**
    *   **Task 3.3.1: 基礎薪資管理**
        *   [ ] 3.3.1.1: (後端) 設計 `employee_salaries` 表 Schema (id, employee_id, effective_date, amount, pay_frequency)。
        *   [ ] 3.3.1.2: (後端) 設計 `payrolls` 表 Schema (id, pay_period_start, pay_period_end, status[draft/processed/paid])。
        *   [ ] 3.3.1.3: (後端) 設計 `payroll_items` 表 Schema (id, payroll_id, employee_id, gross_pay, deductions, net_pay)。
        *   [ ] 3.3.1.4: (後端) 創建薪資相關 GORM 模型與遷移。
        *   [ ] 3.3.1.5: (後端) 實作員工薪資記錄 CRUD API。
        *   [ ] 3.3.1.6: (後端) 實作計算薪資單的基礎邏輯 (基於薪資記錄、考勤 - 若有)。
        *   [ ] 3.3.1.7: (後端) 實作薪資單處理與查詢 API。
    *   **Task 3.3.2: 休假管理**
        *   [ ] 3.3.2.1: (後端) 設計 `leave_types` 表 Schema (id, name, requires_approval)。
        *   [ ] 3.3.2.2: (後端) 設計 `leave_requests` 表 Schema (id, employee_id, leave_type_id, start_date, end_date, reason, status[pending/approved/rejected])。
        *   [ ] 3.3.2.3: (後端) 創建休假相關 GORM 模型與遷移。
        *   [ ] 3.3.2.4: (後端) 實作員工提交休假申請 API。
        *   [ ] 3.3.2.5: (後端) 實作主管審核休假申請 API。
        *   [ ] 3.3.2.6: (後端) 實作查詢休假記錄 API。
    *   **Task 3.3.3: 前端 UI 整合**
        *   [ ] 3.3.3.1: (前端) 建立員工薪資記錄管理 UI (HR/Admin)。
        *   [ ] 3.3.3.2: (前端) 建立薪資單計算與查看 UI (HR/Admin)。
        *   [ ] 3.3.3.3: (前端) 建立員工提交休假申請表單 UI。
        *   [ ] 3.3.3.4: (前端) 建立主管審核休假申請列表與操作 UI。
        *   [ ] 3.3.3.5: (前端) 建立員工查看個人休假記錄 UI。
    *   **Task 3.3.4: 測試**
        *   [ ] 3.3.4.1: (測試) 測試薪資計算邏輯。
        *   [ ] 3.3.4.2: (測試) 測試休假申請與審核流程。

*   **Task 3.4: 客戶關係管理擴展 (CRM Expansion)**
    *   **Task 3.4.1: 銷售機會與管道管理**
        *   [ ] 3.4.1.1: (後端) 設計 `leads` 表 Schema (id, source, name, email, phone, company, status[new/contacted/qualified/lost])。
        *   [ ] 3.4.1.2: (後端) 設計 `opportunities` 表 Schema (id, lead_id[可選], customer_id, name, stage[prospecting/qualification/proposal/closing/won/lost], estimated_value, close_date, assigned_to_user_id)。
        *   [ ] 3.4.1.3: (後端) 創建 Leads/Opportunities GORM 模型與遷移。
        *   [ ] 3.4.1.4: (後端) 實作 Leads CRUD API。
        *   [ ] 3.4.1.5: (後端) 實作 Opportunities CRUD API。
        *   [ ] 3.4.1.6: (後端) 實作從 Lead 轉換為 Opportunity/Customer 的邏輯。
        *   [ ] 3.4.1.7: (後端) 實作更新 Opportunity 階段的 API。
        *   [ ] 3.4.1.8: (後端) 設計銷售管道數據 API (按階段匯總機會數量/金額)。
    *   **Task 3.4.2: 前端 UI 整合**
        *   [ ] 3.4.2.1: (前端) 建立 Leads 列表與管理 UI。
        *   [ ] 3.4.2.2: (前端) 建立 Opportunities 列表與管理 UI。
        *   [ ] 3.4.2.3: (前端) 建立銷售管道看板 (Kanban) 或列表視圖。
        *   [ ] 3.4.2.4: (前端) 在 Opportunity 詳情頁面關聯活動記錄 (Task 2.7)。
        *   [ ] 3.4.2.5: (前端) 整合 Leads/Opportunities API。
    *   **Task 3.4.3: 測試**
        *   [ ] 3.4.3.1: (測試) 測試 Leads/Opportunities CRUD API。
        *   [ ] 3.4.3.2: (測試) 測試銷售管道數據 API。

*   **Task 3.5: Marketplace 擴展 (Marketplace Expansion)**
    *   **Task 3.5.1: 賣家入駐與審核**
        *   [ ] 3.5.1.1: (後端) 擴展 Task 1.8 的賣家申請流程，加入更詳細的資料提交與審核步驟。
        *   [ ] 3.5.1.2: (後端) 設計賣家資質文件上傳與管理 (可複用 Task 1.9 文件上傳)。
        *   [ ] 3.5.1.3: (後端) 實作管理員審核賣家申請的 API。
    *   **Task 3.5.2: 評價與評分系統**
        *   [ ] 3.5.2.1: (後端) 設計 `marketplace_reviews` 表 Schema (id, order_id, reviewer_member_id, seller_member_id, rating, comment, review_date)。
        *   [ ] 3.5.2.2: (後端) 創建 Review GORM 模型與遷移。
        *   [ ] 3.5.2.3: (後端) 實作買家提交評價 API (在訂單完成後)。
        *   [ ] 3.5.2.4: (後端) 實作查詢商品/賣家評價 API。
        *   [ ] 3.5.2.5: (後端) 實作計算賣家平均評分的邏輯。
    *   **Task 3.5.3: 基礎支付整合 (可選)**
        *   [ ] 3.5.3.1: (研究) 選擇支付閘道 (e.g., Stripe, PayPal)。
        *   [ ] 3.5.3.2: (後端) 實作支付閘道 API 客戶端。
        *   [ ] 3.5.3.3: (後端) 設計 Marketplace 訂單支付流程 API。
        *   [ ] 3.5.3.4: (後端) 處理支付回調/Webhook，更新訂單支付狀態。
    *   **Task 3.5.4: 前端 UI 整合**
        *   [ ] 3.5.4.1: (前端) 完善賣家申請入駐表單與流程。
        *   [ ] 3.5.4.2: (前端) 建立管理員審核賣家申請介面。
        *   [ ] 3.5.4.3: (前端) 在 Marketplace 訂單詳情頁加入提交評價功能。
        *   [ ] 3.5.4.4: (前端) 在 Marketplace 商品/賣家頁面顯示評價與評分。
        *   [ ] 3.5.4.5: (前端) [支付] 整合支付閘道前端組件/流程到結帳頁面。
    *   **Task 3.5.5: 測試**
        *   [ ] 3.5.5.1: (測試) 測試賣家入駐與審核流程。
        *   [ ] 3.5.5.2: (測試) 測試評價提交與顯示邏輯。
        *   [ ] 3.5.5.3: (測試) [支付] 測試支付流程與狀態更新。

*   **Task 3.6: 供應鏈協同擴展 (SCM Expansion)**
    *   **Task 3.6.1: 供應商門戶 (Supplier Portal - Basic)**
        *   [ ] 3.6.1.1: (後端) 設計供應商用戶登入機制 (可能關聯 `suppliers` 和 `users`)。
        *   [ ] 3.6.1.2: (後端) 建立 API 允許供應商查看分配給他們的採購訂單。
        *   [ ] 3.6.1.3: (後端) 建立 API 允許供應商確認訂單或提出變更請求 (基礎)。
        *   [ ] 3.6.1.4: (後端) 建立 API 允許供應商提交發貨通知 (ASN - Advanced Shipping Notice)。
    *   **Task 3.6.2: 詢價 (RFQ) 與投標**
        *   [ ] 3.6.2.1: (後端) 設計 `requests_for_quotation` (RFQ) 表 Schema (id, rfq_number, description, required_date, status[draft/open/closed])。
        *   [ ] 3.6.2.2: (後端) 設計 `rfq_items` 表 Schema (id, rfq_id, product_description, quantity)。
        *   [ ] 3.6.2.3: (後端) 設計 `rfq_suppliers` 表 Schema (rfq_id, supplier_id)。
        *   [ ] 3.6.2.4: (後端) 設計 `supplier_quotes` 表 Schema (id, rfq_id, supplier_id, quote_date, total_amount, status[submitted/awarded/rejected])。
        *   [ ] 3.6.2.5: (後端) 設計 `supplier_quote_items` 表 Schema (id, supplier_quote_id, rfq_item_id, unit_price, subtotal)。
        *   [ ] 3.6.2.6: (後端) 創建 RFQ 相關 GORM 模型與遷移。
        *   [ ] 3.6.2.7: (後端) 實作 RFQ CRUD API。
        *   [ ] 3.6.2.8: (後端) 實作邀請供應商參與 RFQ API。
        *   [ ] 3.6.2.9: (後端) 實作供應商提交報價 API (在供應商門戶)。
        *   [ ] 3.6.2.10: (後端) 實作比較和授予報價的 API。
    *   **Task 3.6.3: 前端 UI 整合**
        *   [ ] 3.6.3.1: (前端) 建立供應商門戶登入頁面。
        *   [ ] 3.6.3.2: (前端) 供應商門戶: 查看採購訂單列表與詳情。
        *   [ ] 3.6.3.3: (前端) 供應商門戶: 確認訂單/提交 ASN 功能。
        *   [ ] 3.6.3.4: (前端) 內部用戶: 建立 RFQ 列表與創建/編輯 UI。
        *   [ ] 3.6.3.5: (前端) 供應商門戶: 查看收到的 RFQ 列表與提交報價 UI。
        *   [ ] 3.6.3.6: (前端) 內部用戶: 查看 RFQ 收到的報價並進行授予操作 UI。
    *   **Task 3.6.4: 測試**
        *   [ ] 3.6.4.1: (測試) 測試供應商門戶查看訂單和提交 ASN。
        *   [ ] 3.6.4.2: (測試) 測試 RFQ 從創建到授予的完整流程。

*   **Task 3.7: BI 與分析 (BI & Analytics)**
    *   **Task 3.7.1: 進階報表**
        *   [ ] 3.7.1.1: (後端) 設計更多維度的報表 API (e.g., 按銷售員/區域的銷售分析, 庫存周轉率, 供應商績效)。
        *   [ ] 3.7.1.2: (後端) 考慮引入數據匯總表或 Materialized View 以提高複雜報表性能。
    *   **Task 3.7.2: 可自訂儀表板**
        *   [ ] 3.7.2.1: (後端) 設計用戶可自訂儀表板佈局和組件的數據結構。
        *   [ ] 3.7.2.2: (後端) 創建保存/加載用戶儀表板配置的 API。
        *   [ ] 3.7.2.3: (前端) 研究並選擇可拖拽佈局庫 (e.g., Gridstack.js, Vue Grid Layout)。
        *   [ ] 3.7.2.4: (前端) 開發儀表板編輯模式，允許用戶添加/移除/配置圖表或指標卡片。
        *   [ ] 3.7.2.5: (前端) 整合後端 API 保存和加載配置。
    *   **Task 3.7.3: 測試**
        *   [ ] 3.7.3.1: (測試) 測試進階報表 API 的數據準確性。
        *   [ ] 3.7.3.2: (測試) 測試自訂儀表板的保存和加載功能。

*   **Task 3.8: 進階圖片辨識管理 (Advanced OCR)**
    *   **Task 3.8.1: 合約分析 (基礎)**
        *   [ ] 3.8.1.1: (後端) 調整 OCR 處理流程 (Task 1.9)，增加對合約文件類型的處理。
        *   [ ] 3.8.1.2: (後端) 研究或選擇用於提取合約關鍵信息 (e.g., 甲方乙方, 金額, 日期, 關鍵條款) 的 NLP 模型/服務。
        *   [ ] 3.8.1.3: (後端) 設計 `contracts` 表 Schema 存儲提取的關鍵信息。
        *   [ ] 3.8.1.4: (後端) 實作將提取的合約信息存儲到數據庫的邏輯。
    *   **Task 3.8.2: 多文件關聯**
        *   [ ] 3.8.2.1: (後端) 設計文件關聯表 Schema (e.g., `document_relations`, 記錄 PO -> Invoice, Invoice -> Payment Voucher 等)。
        *   [ ] 3.8.2.2: (後端) 在 OCR 結果處理或手動核對時，建立文件間的關聯。
        *   [ ] 3.8.2.3: (後端) 建立查詢關聯文件的 API。
    *   **Task 3.8.3: 前端 UI 整合**
        *   [ ] 3.8.3.1: (前端) 在文件上傳/管理介面支持合約類型。
        *   [ ] 3.8.3.2: (前端) 建立合約信息查看 UI (顯示提取的關鍵字段)。
        *   [ ] 3.8.3.3: (前端) 在文件詳情頁顯示關聯的其他文件鏈接。
    *   **Task 3.8.4: 測試**
        *   [ ] 3.8.4.1: (測試) 測試合約關鍵信息提取的準確性 (使用樣本文件)。
        *   [ ] 3.8.4.2: (測試) 測試文件關聯的創建和查詢。 