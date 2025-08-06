# Phase 3: 進階製造、供應鏈與智能分析 (Advanced Manufacturing, SCM & Analytics)

**核心目標：** 深化製造與營運管理（MRP、產能規劃、排程），擴展品質管理，完善 HRM（薪資、休假），強化 CRM（銷售管道、機會），擴展 Marketplace（賣家入駐、評價、支付），建立供應鏈協同（供應商門戶、詢價），引入進階 BI 分析，並增強 OCR 能力。

---

## P3.1: 進階製造與營運 (Advanced Manufacturing & Operations)

### P3.1.1: 物料需求規劃 (Material Requirements Planning - MRP I)
*   **P3.1.1.1: MRP 運算邏輯核心 (Golang)**
    *   P3.1.1.1.1: 讀取主生產排程 (MPS - Master Production Schedule, 可基於確認的銷售訂單和預測)
    *   P3.1.1.1.2: 讀取物料清單 (BOM - P1.3.1)
    *   P3.1.1.1.3: 讀取當前庫存水平 (Inventory Levels - P1.1.3) 和在途採購訂單 (Open POs - P1.2.3)
    *   P3.1.1.1.4: 計算毛需求 (Gross Requirements)
    *   P3.1.1.1.5: 計算淨需求 (Net Requirements) - 考慮現有庫存和預期到貨
    *   P3.1.1.1.6: 生成計劃訂單 (Planned Orders - 建議的採購訂單和生產訂單)
        *   P3.1.1.1.6.1: 考慮提前期 (Lead Times - 產品主數據或供應商數據中定義)
        *   P3.1.1.1.6.2: 考慮訂購策略 (如固定批量、EOQ - 基礎)
*   **P3.1.1.2: 主生產排程 (MPS) 管理 - 基礎**
    *   P3.1.1.2.1: 資料庫模型 (`master_production_schedules` 表 - ID, product_id, date, quantity_planned, source_type (e.g., SalesOrder, Forecast), source_id)
    *   P3.1.1.2.2: 後端 API 管理 MPS 條目
    *   P3.1.1.2.3: 前端介面手動輸入/調整 MPS，或從銷售訂單/預測生成基礎 MPS
*   **P3.1.1.3: MRP 運算結果展示與處理**
    *   P3.1.1.3.1: 資料庫模型 (`mrp_planned_orders` 表 - ID, product_id, order_type (Purchase/Production), quantity, required_date, planned_release_date, status (e.g., Suggested, Confirmed, Released))
    *   P3.1.1.3.2: 後端 API 執行 MRP 運算並儲存計劃訂單
    *   P3.1.1.3.3: 前端介面展示 MRP 運算結果 (建議的採購/生產計劃)
    *   P3.1.1.3.4: 功能：將建議的計劃訂單轉換為實際的採購訂單 (P1.2.3) 或生產訂單 (P1.3.3)

### P3.1.2: 產能規劃 (Capacity Planning - 基礎 Rough-Cut Capacity Planning - RCCP)
*   **P3.1.2.1: 工作中心 (Work Centers - P1.3.2) 產能數據完善**
    *   P3.1.2.1.1: 在 `work_centers` 表中增加詳細的可用工時 (如每日班次、每班時長、機器數量)。
    *   P3.1.2.1.2: 產品工藝路線 (Routings) - 基礎定義
        *   `routings` 表 (ID, product_id, operation_sequence, operation_description, work_center_id, setup_time, run_time_per_unit)
*   **P3.1.2.2: 產能需求計算邏輯 (Golang)**
    *   P3.1.2.2.1: 根據 MPS 或已確認的生產訂單和產品工藝路線，計算各工作中心的預計負載。
*   **P3.1.2.3: 產能負載報表**
    *   P3.1.2.3.1: 後端 API 提供各工作中心在未來一段時間內的產能負載數據。
    *   P3.1.2.3.2: 前端介面以圖表或表格展示產能負載情況，標示潛在瓶頸。

### P3.1.3: 生產排程 (Production Scheduling - 基礎有限產能排程 Finite Capacity Scheduling - FCS 簡化版)
*   **P3.1.3.1: 生產訂單 (P1.3.3) 增加排程相關欄位**
    *   P3.1.3.1.1: 擴展 `production_orders` 表，增加 `scheduled_start_datetime`, `scheduled_end_datetime`, `priority`。
*   **P3.1.3.2: 基礎排程算法 (Golang)**
    *   P3.1.3.2.1: 考慮訂單優先級、交貨日期、工作中心可用產能（基於 P3.1.2）、物料可用性（基於 MRP P3.1.1）。
    *   P3.1.3.2.2: 生成各生產訂單在各工作中心的建議開始/結束時間。
*   **P3.1.3.3: 生產排程甘特圖/列表展示**
    *   P3.1.3.3.1: 後端 API 提供排程結果數據。
    *   P3.1.3.3.2: 前端使用甘特圖組件 (如 DHTMLX Gantt, Frappe Gantt or similar JS library) 或列表展示生產排程。
    *   P3.1.3.3.3: 允許手動拖拽調整排程 (基礎，可能僅更新時間，不重新計算產能約束)。

### P3.1.4: 車間作業控制 (Shop Floor Control - 基礎)
*   **P3.1.4.1: 工序級生產回報**
    *   P3.1.4.1.1: 資料庫模型 (`production_order_operations` 表 - 關聯 `production_orders` 和 `routings`, 記錄各工序的計劃/實際開始結束時間、完成數量、合格/不合格數量)。
    *   P3.1.4.1.2: 後端 API 更新工序狀態和回報數據。
    *   P3.1.4.1.3: 前端介面 (可能簡化為平板或PC端) 供車間人員回報工序進度、產出、工時。
*   **P3.1.4.2: 生產訂單進度追蹤**
    *   P3.1.4.2.1: 前端介面實時或準實時展示生產訂單各工序的執行狀態。

---

## P3.2: 進階品質管理 (Advanced Quality Management)

### P3.2.1: 檢驗計畫與標準 (Inspection Plans & Standards)
*   **P3.2.1.1: 資料庫模型設計與遷移**
    *   P3.2.1.1.1: `quality_inspection_plans` 表 (ID, plan_name, product_id (FK, optional), inspection_type (e.g., Incoming, In-Process, Outgoing), description)
    *   P3.2.1.1.2: `quality_inspection_characteristics` 表 (ID, plan_id (FK), characteristic_name, inspection_method, target_value, upper_spec_limit, lower_spec_limit, unit_of_measure)
*   **P3.2.1.2: 後端 API 管理檢驗計畫與特性**
*   **P3.2.1.3: 前端介面定義檢驗計畫和檢驗特性**

### P3.2.2: 品質檢驗執行與記錄
*   **P3.2.2.1: 資料庫模型設計與遷移**
    *   P3.2.2.1.1: `quality_inspections` 表 (ID, inspection_lot_number, inspection_plan_id (FK), reference_type (e.g., GoodsReceipt, ProductionOrder), reference_id, inspection_date, inspector_user_id, overall_status (e.g., Pass, Fail, Pending))
    *   P3.2.2.1.2: `quality_inspection_results` 表 (ID, inspection_id (FK), characteristic_id (FK), actual_value, result_status (e.g., Pass, Fail), notes)
*   **P3.2.2.2: 後端 API 記錄檢驗結果**
    *   P3.2.2.2.1: 在收貨 (P1.2.4)、生產回報 (P1.3.4) 或出貨 (P2.1.4) 流程中觸發品質檢驗。
*   **P3.2.2.3: 前端介面記錄檢驗結果**
    *   P3.2.2.3.1: 檢驗任務列表。
    *   P3.2.2.3.2: 輸入檢驗特性實際值的介面。

### P3.2.3: 不合格品處理 (Non-Conformance Management - 基礎)
*   **P3.2.3.1: 資料庫模型 (`non_conformance_reports` - NCR)**
    *   P3.2.3.1.1: `non_conformance_reports` 表 (ID, ncr_number, product_id, detected_date, source (e.g., IncomingInspection, Production), description_of_defect, quantity_affected, status (e.g., Open, UnderReview, Closed), disposition (e.g., Rework, Scrap, ReturnToVendor), responsible_user_id)
*   **P3.2.3.2: 後端 API 管理 NCR**
*   **P3.2.3.3: 前端介面創建和追蹤 NCR**

### P3.2.4: 品質數據分析與報表 (基礎 SPC - Statistical Process Control)
*   **P3.2.4.1: 基礎控制圖 (Control Charts - e.g., X-bar & R chart for key characteristics)**
    *   P3.2.4.1.1: 後端 API 計算控制圖所需數據 (基於 `quality_inspection_results`)。
    *   P3.2.4.1.2: 前端使用 Chart.js 或類似庫展示基礎控制圖。
*   **P3.2.4.2: 合格率/缺陷率報表**

---

## P3.3: 人力資源管理擴展 (Human Resource Management Expansion)
*   (員工主數據已在 P2.4.1 中建立)

### P3.3.1: 薪資管理 (Payroll Management - 基礎)
*   **P3.3.1.1: 薪資結構/項目定義**
    *   P3.3.1.1.1: 資料庫模型 (`payroll_items` 表 - ID, item_name, item_type (e.g., Earning, Deduction, Statutory), calculation_type (e.g., Fixed, Percentage, Formula))
    *   P3.3.1.1.2: 員工薪資配置 (`employee_payroll_settings` 表 - employee_id, payroll_item_id, amount/rate)
*   **P3.3.1.2: 考勤數據接口 (基礎 - 可手動輸入或簡化導入)**
    *   P3.3.1.2.1: 資料庫模型 (`attendance_records` 表 - employee_id, date, hours_worked, overtime_hours, leave_hours)
*   **P3.3.1.3: 薪資計算邏輯 (Golang)**
    *   P3.3.1.3.1: 根據員工薪資配置和考勤數據計算應發/實發薪資。
*   **P3.3.1.4: 薪資單生成與發放**
    *   P3.3.1.4.1: 資料庫模型 (`payslips` 表 - ID, employee_id, pay_period_start, pay_period_end, gross_earning, total_deduction, net_pay, status (e.g., Draft, Calculated, Approved, Paid))
    *   P3.3.1.4.2: `payslip_details` 表 - payslip_id, payroll_item_id, amount
    *   P3.3.1.4.3: 後端 API 生成薪資單數據。
    *   P3.3.1.4.4: 前端介面查看/審核薪資單，生成薪資條 (PDF)。

### P3.3.2: 休假管理 (Leave Management)
*   **P3.3.2.1: 休假類型定義**
    *   P3.3.2.1.1: 資料庫模型 (`leave_types` 表 - ID, name, description, accrual_policy (optional))
*   **P3.3.2.2: 員工休假餘額管理**
    *   P3.3.2.2.1: 資料庫模型 (`employee_leave_balances` 表 - employee_id, leave_type_id, balance_hours/days)
*   **P3.3.2.3: 休假申請與審批流程**
    *   P3.3.2.3.1: 資料庫模型 (`leave_requests` 表 - ID, employee_id, leave_type_id, start_date, end_date, reason, status (e.g., Submitted, ApprovedByManager, ApprovedByHR, Rejected, Cancelled), approver_user_id)
    *   P3.3.2.3.2: 後端 API 提交/審批休假申請，更新餘額。
    *   P3.3.2.3.3: 前端介面供員工申請休假，供經理/HR審批。

---

## P3.4: 客戶關係管理擴展 (Customer Relationship Management Expansion)
*   (客戶、聯絡人、基礎活動已在 P2.1.1, P2.7.1 中建立)

### P3.4.1: 銷售機會管理 (Sales Opportunity Management)
*   **P3.4.1.1: 資料庫模型設計與遷移**
    *   P3.4.1.1.1: `opportunities` 表 (ID, opportunity_name, customer_id (FK), contact_id (FK, optional), sales_stage_id (FK), estimated_close_date, probability_percentage, estimated_amount, description, assigned_to_user_id, created_at, updated_at)
    *   P3.4.1.1.2: `sales_stages` 表 (ID, stage_name, sequence_order, probability_default)
*   **P3.4.1.2: 後端 API for Opportunities (CRUD, 階段更新)**
*   **P3.4.1.3: 前端介面**
    *   P3.4.1.3.1: 銷售機會列表與看板視圖 (按階段拖拽)。
    *   P3.4.1.3.2: 新增/編輯銷售機會表單。
    *   P3.4.1.3.3: 銷售機會與客戶/聯絡人/活動關聯。

### P3.4.2: 銷售管道分析 (Sales Pipeline Analytics)
*   **P3.4.2.1: 銷售管道報表**
    *   P3.4.2.1.1: 後端 API 提供按階段統計的機會數量、總金額、加權金額數據。
    *   P3.4.2.1.2: 前端以漏斗圖或表格展示銷售管道。
*   **P3.4.2.2: 銷售預測 (基於機會)**
    *   P3.4.2.2.1: 計算預期銷售額 (機會金額 * 概率)。

### P3.4.3: 客戶互動歷史增強**
*   P3.4.3.1.1: 在客戶/聯絡人詳情頁面，更全面地整合展示相關的銷售報價、訂單、發票、機會、活動等信息，形成 360 度客戶視圖的基礎。

---

## P3.5: Marketplace 擴展 (營運) (Marketplace Expansion - Operations)
*   (基礎商品上架、買家訂單已在 P1.8, P2.5 中建立)

### P3.5.1: 賣家入駐流程完善 (Seller Onboarding Enhancement)
*   **P3.5.1.1: 賣家資質審核流程**
    *   P3.5.1.1.1: 擴展賣家/供應商模型 (P1.8.1)，增加資質文件上傳字段 (如營業執照掃描件)。
    *   P3.5.1.1.2: 後台管理員審核賣家資質的介面和流程。
*   **P3.5.1.2: 賣家店舖配置**
    *   P3.5.1.2.1: 允許賣家配置其店舖基本信息 (logo, 介紹, 聯繫方式)。

### P3.5.2: 商品評價與評分系統 (Product Review & Rating System)
*   **P3.5.2.1: 資料庫模型設計與遷移**
    *   P3.5.2.1.1: `product_reviews` 表 (ID, product_id (or marketplace_listing_id), buyer_user_id, rating_score (1-5), review_title, review_text, review_date, status (e.g., PendingApproval, Approved, Rejected))
*   **P3.5.2.2: 後端 API 提交/管理評價**
*   **P3.5.2.3: 前端介面**
    *   P3.5.2.3.1: 買家在已完成訂單的商品下提交評價和評分。
    *   P3.5.2.3.2: 商品詳情頁展示平均評分和評價列表。
    *   P3.5.2.3.3: 後台管理員審核評價。

### P3.5.3: 基礎支付整合 (Payment Gateway Integration - 簡化/模擬)
*   **P3.5.3.1: 選擇支付閘道並研究 API (如 Stripe, PayPal - 此階段可能為模擬)**
*   **P3.5.3.2: 買家結帳時 (P2.5.2.2) 導向支付閘道 (或模擬支付成功/失敗頁面)**
*   **P3.5.3.3: 處理支付回調通知，更新 Marketplace 訂單支付狀態**
    *   P3.5.3.3.1: 後端 API 接收支付閘道的回調。

### P3.5.4: 賣家佣金/結算 (基礎概念)**
*   P3.5.4.1.1: 設計佣金規則 (如按銷售額百分比)。
*   P3.5.4.1.2: 記錄每筆 Marketplace 訂單的應付賣家款項和平台佣金 (可能需要擴展 `marketplace_orders` 或新建結算相關表)。
*   P3.5.4.1.3: (此階段不一定實現自動結算，但需有數據記錄基礎)。

---

## P3.6: 供應鏈協同擴展 (Supply Chain Collaboration Expansion)

### P3.6.1: 供應商門戶 (Supplier Portal - 基礎)
*   **P3.6.1.1: 供應商用戶登入與權限**
    *   P3.6.1.1.1: 允許供應商的聯絡人 (特定角色的 User) 登入系統的特定區域。
*   **P3.6.1.2: 供應商查看採購訂單 (POs)**
    *   P3.6.1.2.1: 前端介面供已登入供應商查看發送給他們的 POs (P1.2.3) 列表和詳情。
*   **P3.6.1.3: 供應商確認/回覆 PO (基礎)**
    *   P3.6.1.3.1: 允許供應商線上確認 PO，或回覆預計交期、可供數量等。
    *   P3.6.1.3.2: 後端 API 更新 PO 相關信息。
*   **P3.6.1.4: 供應商查看付款狀態 (可選)**
    *   P3.6.1.4.1: 允許供應商查看其發票 (P1.6.1.1) 的付款進度。

### P3.6.2: 線上詢價 (Request for Quotation - RFQ) - 基礎
*   **P3.6.2.1: 資料庫模型設計與遷移**
    *   P3.6.2.1.1: `rfqs` 表 (ID, rfq_number, rfq_date, due_date, description, status (e.g., Draft, SentToSuppliers, QuotesReceived, Awarded, Closed))
    *   P3.6.2.1.2: `rfq_items` 表 (ID, rfq_id, product_description, quantity, unit_of_measure)
    *   P3.6.2.1.3: `rfq_suppliers` 表 (ID, rfq_id, supplier_id, sent_date)
    *   P3.6.2.1.4: `supplier_quotations_for_rfq` 表 (ID, rfq_id, supplier_id, quotation_details (JSONB or link to supplier uploaded file), quoted_price, validity_date, status (e.g., Received, Accepted, Rejected))
*   **P3.6.2.2: 後端 API 管理 RFQ 及供應商報價**
*   **P3.6.2.3: 前端介面**
    *   P3.6.2.3.1: 創建 RFQ 並選擇邀請的供應商。
    *   P3.6.2.3.2: (供應商門戶) 供應商查看 RFQ 並提交報價。
    *   P3.6.2.3.3: 內部用戶比較供應商報價並決定中標者。
    *   P3.6.2.3.4: 從中標報價生成採購訂單 (P1.2.3)。

---

## P3.7: BI 與分析 (BI & Analytics - 引入進階)
*   (基礎報表與儀表板已在 P2.6 中建立)

### P3.7.1: 數據倉庫/數據集市 (Data Warehouse/Mart - 概念引入與準備)
*   **P3.7.1.1: 評估是否需要獨立的數據倉庫方案 (如 ETL 到專用分析數據庫)**
    *   P3.7.1.1.1: 若數據量大或分析複雜，考慮使用 PostgreSQL 的分析特性或引入外部工具。
    *   P3.7.1.1.2: (此階段可能僅為設計層面，或簡化為在操作型數據庫上創建優化的查詢視圖 (Views))。
*   **P3.7.1.2: 設計核心分析維度與度量 (Dimensions & Measures)**
    *   P3.7.1.2.1: 例如時間維度、產品維度、客戶維度、地理維度等。
    *   P3.7.1.2.2: 銷售額、利潤、成本、數量、周轉天數等度量。

### P3.7.2: 進階報表與可視化工具集成探索**
*   **P3.7.2.1: 研究/選擇嵌入式 BI 工具或進階圖表庫 (如 Metabase, Superset, Apache ECharts, Plotly Dash)**
    *   P3.7.2.1.1: 評估開源或商業工具的集成可行性。
*   **P3.7.2.2: 開發更複雜的分析報表**
    *   P3.7.2.2.1: 多維度交叉分析報表 (OLAP 概念)。
    *   P3.7.2.2.2: 趨勢分析、同期比較、占比分析等。
    *   P3.7.2.2.3: 例如，客戶利潤貢獻分析、產品銷售趨勢預測 (統計模型基礎)。
*   **P3.7.2.3: 用戶自定義報表功能 (非常基礎)**
    *   P3.7.2.3.1: 允許用戶選擇欄位、篩選條件、排序方式生成簡單表格報表 (可能基於現有列表頁面擴展)。

### P3.7.3: 整合外部數據進行分析 (基礎實現 - 參考 P1.9 OCR 和 AI 規劃書中的外部數據整合部分)
*   **P3.7.3.1: 天氣數據、網路新聞數據 API 對接 (若未在 AI 部分完全實現)**
*   **P3.7.3.2: 將外部數據與內部 ERP 數據關聯，進行初步的相關性分析**
    *   P3.7.3.2.1: 例如，分析特定新聞事件期間的銷售波動。

---

## P3.8: 進階圖片辨識管理 (Advanced Image Recognition Management)
*   (基礎 OCR 已在 P1.9 中建立)

### P3.8.1: OCR 功能擴展至更多文檔類型
*   **P3.8.1.1: 研究並支持新的文檔模板 (如送貨單、銀行對帳單、特定行業表單)**
    *   P3.8.1.1.1: 調整 OCR 解析邏輯或訓練自定義 OCR 模型 (若所選服務支持)。
*   **P3.8.1.2: 提高複雜版面和手寫內容的識別準確率**
    *   P3.8.1.2.1: 引入圖像預處理步驟 (去噪、校正)。
    *   P3.8.1.2.2: 結合人工校驗反饋優化 OCR 模型或規則。

### P3.8.2: OCR 與其他模組的深度整合
*   **P3.8.2.1: 例如，從客戶提供的帶有產品圖片的詢價單中自動識別產品信息。**
*   **P3.8.2.2: 倉庫管理中，透過掃描產品包裝上的文字/條碼圖片進行快速識別入庫/出庫。**

### P3.8.3: 圖像內容分析 (基礎 - 非文字)
*   **P3.8.3.1: 產品圖片質量檢測 (可選)**
    *   P3.8.3.1.1: 分析上傳的產品圖片是否清晰、符合規範。
*   **P3.8.3.2: 視覺搜索/以圖搜圖 (概念探索)**
    *   P3.8.3.2.1: 研究整合圖像相似性比較服務，允許用戶上傳圖片搜索相似產品。

--- 