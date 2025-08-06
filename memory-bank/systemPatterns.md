# System Patterns: NexusERP

**最後更新時間:** {{datetime}}

## 架構模式
*   **總體架構:** 模組化架構，核心業務邏輯在後端 (Go)，前端 (Laravel) 負責展現與使用者互動。Marketplace 部分可能考慮採用微服務架構以應對高流量和獨立迭代需求。
*   **前端架構:** PHP/Laravel (Blade 模板引擎)，利用 Vite 進行前端資源打包。考慮使用 Blade 元件化 UI 元素。
*   **後端架構:** Golang/Gin 框架，遵循 RESTful API 設計原則。考慮採用標準 Go 專案佈局。
*   **資料庫互動:** 後端使用 GORM (或其他 ORM) 與 PostgreSQL 互動。
*   **非同步處理:** 對於耗時操作（如 OCR 處理、報表生成、外部 API 調用），使用背景任務佇列 (如 Redis + Worker) 或 Go 的 Goroutines。
*   **即時通訊 (Marketplace):** 使用 WebSocket 或消息隊列 (RabbitMQ) 實現 Marketplace 中的即時訊息和訂單狀態更新。

## 數據管理模式
*   **主要數據庫:** PostgreSQL，用於存儲結構化業務數據 (用戶、公司、產品、訂單、庫存、財務記錄等)。
*   **多租戶數據隔離 (✅ 已實施):**
    *   **採用方案:** 共享資料庫，共享 Schema，行級隔離 + PostgreSQL Row-Level Security (RLS)
    *   **實施範圍:** 12 個核心表格已實現企業級多租戶隔離
    *   **安全機制:** 深度防禦架構 - 應用層中介軟體 + 資料庫層 RLS 政策
    *   **隔離欄位:** 所有多租戶表格包含 `company_id` 欄位實現公司層級隔離
*   **非結構化數據:** 使用 JSONB 欄位存儲彈性較大的數據（如產品自訂屬性、AI 模型輸出）。
*   **文件儲存:** 使用 AWS S3 或相容服務 (如 MinIO) 儲存上傳的文件（影像、合約等）。
*   **快取:** 使用 Redis 緩存常用數據、Session 資訊、API 回應、Marketplace 熱點數據（如推薦結果）。
*   **數據遷移:** 使用資料庫遷移工具 (如 GORM Migrations) 管理 Schema 變更。
*   **前後端資料庫一致性 (⚠️ 重要模式):**
    *   **問題模式:** Laravel 模型定義與 Go 後端遷移文件不一致 (如 2025-07-24 user_roles.expires_at 問題)
    *   **解決模式:** 
        1. 建立跨語言遷移同步檢查機制
        2. 前端模型變更必須同步更新後端遷移文件
        3. 使用結構化遷移文件命名 (如 000019_alter_user_roles_table.up.sql)
        4. 保持向後相容性，使用 ALTER TABLE 而非 DROP/CREATE

*   **API 權限設計反模式 (⚠️ 2025-07-27 發現):**
    *   **問題模式:** 過度限制的權限篩選導致功能性故障
        - ProductController 使用 `created_by_user_id` 篩選適用於產品管理，但不適用於銷售訂單選擇
        - 單一 API 端點服務多種使用場景但權限邏輯未分離
        - 結果：銷售訂單建立時產品下拉選單空白（僅顯示 3/94 個產品）
    *   **解決模式:**
        1. **權限分離原則:** 區分管理權限 (CRUD) 和使用權限 (READ)
        2. **場景特定的權限邏輯:** 根據 API 呼叫上下文應用不同的權限規則
        3. **功能測試覆蓋:** API 權限變更必須進行端對端功能測試

*   **API-Frontend 欄位不一致反模式 (⚠️ 2025-07-27 發現):**
    *   **問題模式:** API 回傳欄位名稱與前端期待不一致
        - API 回傳 `selling_price` 但前端期待 `unit_price`
        - 導致前端無法正確存取價格數據，功能失效
    *   **解決模式:**
        1. **欄位映射層:** 在 API 回傳前進行欄位名稱轉換
        2. **Contract-First API 設計:** 建立 API 規格文件確保一致性
        3. **自動化測試:** API 回傳格式必須符合前端期待的結構

*   **資料庫架構與表單欄位不匹配反模式 (✅ 2025-07-27 已修復):**
    *   **問題模式:** 前端表單欄位與實際資料庫架構不匹配導致數據無法保存
        - 前端表單包含 `initial_stock_quantity`, `low_stock_warning` 欄位
        - 實際庫存數據存儲在分離的 `inventory_levels` 資料表中
        - 缺少 InventoryLevel Model 和對應的 Controller 處理邏輯
        - 結果：庫存欄位值無法保存，庫存管理功能完全失效
    *   **解決模式:**
        1. **建立完整的 Model 關聯架構:**
           - 建立 InventoryLevel Model 對應 `inventory_levels` 資料表
           - Product Model 添加 `hasMany(InventoryLevel::class)` 關聯
           - 定義輔助方法：`defaultInventoryLevel()`, `getAvailableQuantityAttribute()`, `getReorderLevelAttribute()`
        2. **Controller 多表數據處理模式:**
           - store/update 方法同時處理 Product 和 InventoryLevel 數據
           - 使用 `updateOrCreate` 處理庫存記錄的新增/更新
           - API 回應包含完整的關聯數據 (`$product->load('inventoryLevels')`)
        3. **多倉庫支援架構:**
           - 預設倉庫 ID=1 機制
           - warehouse_id 欄位為未來多倉庫擴展預留
           - company_id 欄位支援多租戶隔離
        4. **欄位映射標準化:**
           - `initial_stock_quantity` → `inventory_levels.quantity_on_hand`
           - `low_stock_warning` → `inventory_levels.reorder_level`
           - show() 方法自動注入庫存欄位到 API 回應
    *   **實施結果:**
        - ✅ 100% 功能恢復：從「完全無效」到「正常運作」
        - ✅ Playwright 完整測試驗證：零錯誤檢測
        - ✅ 多倉庫架構基礎：可擴展的庫存管理系統
        - ✅ 程式碼品質提升：完整的 Model 關聯和防禦式編程
    *   **參考實作:** 詳見 `/Users/gamepig/projects/NexusERP/memory-bank/bug_records/bug_2025-07-27_product_edit_inventory_fields_complete_fix.md`

*   **JavaScript 防禦式編程不足反模式 (⚠️ 2025-07-27 發現):**
    *   **問題模式:** DOM 操作缺乏 null checking 導致運行時錯誤
        - `updateItemSubtotal` 函數在 DOM 元素載入前被調用
        - 直接存取 `querySelector` 結果而未檢查 null
        - 錯誤：`"Cannot read properties of null (reading 'value')"`
    *   **解決模式:**
        1. **Null Safety Pattern:** 所有 DOM 操作必須包含 null checking
        2. **Early Return Pattern:** 檢測到缺失元素時立即返回並記錄警告
        3. **函數防禦:** 驗證所有必要參數和元素存在性

*   **JavaScript 虛值條件檢查錯誤模式 (⚠️ 2025-07-27 發現):**
    *   **問題模式:** 使用簡單虛值檢查 `if (value)` 導致合法的 "0" 值被跳過
        - 銷售訂單計算中，價格為 "0" 時條件 `if (value)` 返回 false
        - 導致合法的 0 價格無法觸發重新計算，總額保持為 $0.00
        - 影響用戶體驗和數據準確性
    *   **解決模式:**
        1. **明確字串檢查:** 使用 `value !== ''` 而非 `if (value)`
        2. **數值有效性檢查:** 對於數值欄位使用 `!isNaN(value) && value !== ''`
        3. **類型特定驗證:** 根據欄位類型採用適當的驗證邏輯
    *   **預防措施:**
        - 對所有涉及數值計算的表單欄位使用明確的字串/數值檢查
        - 建立標準化的 validation helper 函數
        - 在 JavaScript linting 規則中強制要求明確比較

*   **事件監聽器不完整綁定模式 (⚠️ 2025-07-27 發現):**
    *   **問題模式:** 事件監聽器僅綁定到動態添加的元素，忽略現有元素
        - `setupEventListeners()` 只處理新增項目，未處理頁面載入時的現有項目
        - 導致編輯現有訂單時計算功能失效
        - 新增項目正常，編輯項目異常的不一致行為
    *   **解決模式:**
        1. **完整元素覆蓋:** 初始化時為所有現有元素添加事件監聽器
        2. **統一事件綁定函數:** 建立 `addRowEventListeners(row)` 函數供初始化和動態添加重複使用
        3. **元素狀態檢測:** 使用 `querySelectorAll('.order-item-row')` 確保覆蓋所有相關元素
    *   **預防措施:**
        - 建立標準的事件綁定初始化模式
        - 對新增和編輯功能進行完整的回歸測試
        - 使用自動化測試驗證事件綁定的完整性

*   **Go 後端搜尋查詢欄位遺漏模式 (⚠️ 2025-07-27 發現):**
    *   **問題模式:** 搜尋查詢未包含用戶期待的關鍵欄位
        - `customer_service.go` 搜尋不包含 `phone` 欄位
        - `supplier_service.go` 搜尋不包含 `contact_person` 欄位
        - 導致按這些欄位搜尋時返回空結果
    *   **解決模式:**
        1. **搜尋欄位完整性檢查:** 確保所有用戶可見欄位都包含在搜尋查詢中
        2. **統一搜尋模式:** 建立標準的多欄位搜尋模板
        3. **搜尋欄位對應:** 前端搜尋框功能必須與後端搜尋邏輯對應
    *   **預防措施:**
        - 建立搜尋欄位檢查清單
        - 對每個搜尋功能進行端對端測試
        - 建立搜尋欄位配置文件統一管理

*   **報表系統深色主題配置不完整模式 (⚠️ 2025-07-27 發現):**
    *   **問題模式:** 深色主題修復不完整導致視覺不一致
        - Chart.js 深色主題配置未完全應用到所有圖表實例
        - 多個樣式檔案相互覆蓋導致部分頁面仍顯示白色背景
        - 報表頁面內聯樣式覆蓋全局主題設定
        - 缺乏統一的主題管理系統
    *   **已完成修復:**
        1. **建立 Chart.js 深色主題配置檔案 (`chart-themes.js`)**
        2. **修改 `reports-style.blade.php` 增強表單元件主題**
        3. **建立 Laravel API 服務層連接 Go 後端**
        4. **修改報表控制器使用新的 API 服務**
    *   **殘留問題:**
        - 許多報表頁面仍有白色背景問題
        - 顏色主題錯誤未達到完全統一的深色主題
        - 需要更深入的樣式檔案檢查和修復
    *   **解決模式:**
        1. **主題系統重構:** 建立統一的主題管理系統
        2. **CSS 變數應用:** 使用 CSS 變數管理所有顏色設定
        3. **樣式優先級管理:** 建立清晰的樣式檔案層級規則
        4. **內聯樣式審查:** 消除覆蓋全局主題的內聯樣式
        5. **圖表主題統一:** 確保所有 Chart.js 實例使用統一主題配置
    *   **預防措施:**
        - 建立主題一致性自動化測試
        - 使用 CSS Linting 工具檢查樣式衝突
        - 建立樣式檔案變更審查機制
        - 定期進行視覺回歸測試
    *   **參考記錄:** 詳見 `/Users/gamepig/projects/NexusERP/memory-bank/bug_records/bug_2025-07-27_報表系統顏色主題修復未完成.md`

*   **🚨 Vite-Laravel 架構衝突問題模式 (⚠️ 2025-07-28 發現):**
    *   **問題核心:** 報表系統深色主題失效的根本原因 - **Vite編譯系統與Laravel Blade PHP動態CSS載入的架構衝突**
        - **CSS變數系統不一致:** `nexus-theme.css` 使用 `--nexus-*` 變數，`reports-style.blade.php` 使用 `--nx-*` 變數
        - **載入機制衝突:** `@vite()` 載入靜態CSS vs `@push('styles')` 動態生成CSS 互相覆蓋
        - **變數命名空間衝突:** CSS解析器找不到對應變數，回退到瀏覽器預設值
    *   **影響範圍評估:**
        - **嚴重問題:** 3個財務報表頁面完全沒有載入 `reports-style` 組件
        - **中等問題:** 12個其他報表頁面變數前綴衝突，部分樣式異常
        - **功能問題:** Chart.js完全未初始化，所有圖表顯示"載入中..."
    *   **技術根因分析:**
        ```php
        // layouts/app.blade.php - Vite系統
        @vite(['resources/css/nexus-theme.css']) // --nexus-* 變數
        
        // components/reports-style.blade.php - Blade系統  
        @push('styles')
        :root { --nx-primary-bg: <?php echo $colors['primary']['background']; ?>; }
        @endpush
        ```
    *   **解決方案A (推薦):** 統一使用Vite系統
        1. **整合樣式系統:** 將 `reports-style.blade.php` 遷移到 `nexus-theme.css`
        2. **統一變數前綴:** 全面使用 `--nexus-*` 命名空間
        3. **相容性對映:** 建立 `--nx-*` 到 `--nexus-*` 的CSS變數對映
        4. **Chart.js整合:** Vite系統中加入深色主題Chart.js配置
    *   **解決方案B:** 統一使用Laravel Blade系統 (不推薦，效能較差)
    *   **修復優先級:**
        - **第一階段:** 緊急修復3個財務報表頁面變數前綴問題
        - **第二階段:** 實施架構統一，採用Vite系統
        - **第三階段:** Chart.js深色主題支援和響應式最佳化
    *   **預防措施:**
        - **架構設計階段統一技術選型**，避免混用不同樣式管理系統
        - **CSS變數命名空間標準化**，防止衝突和維護問題
        - **現代前端建構工具優先原則**，提供更好的開發體驗和效能
        - **樣式系統變更影響範圍評估**，確保所有相關頁面同步更新
    *   **參考記錄:** 詳見 `/Users/gamepig/projects/NexusERP/memory-bank/vite_laravel_architecture_conflict_analysis.md`

*   **🚨 分析方法論嚴重錯誤模式 (🔴 2025-07-28 緊急):**
    *   **錯誤核心:** 僅憑程式碼推測功能狀態，脫離實際使用者體驗的分析錯誤
        - **錯誤行為1:** 看到 Chart.js 相關程式碼就認為圖表正常運作
        - **錯誤行為2:** 將多個報表頁面標記為"🟢 正常顯示"，實際上全部圖表空白
        - **錯誤行為3:** 完全脫離實際測試，僅基於程式碼存在性做出功能判斷
    *   **實際災難性影響:**
        ```yaml
        用戶真實狀況:
          - 所有報表頁面圖表顯示「圖表載入中...」
          - Canvas 元素數量為 0，圖表完全無法渲染
          - 核心報表功能完全失效，嚴重影響業務使用
        
        錯誤分析結果:
          - 銷售總覽: 🟢 正常顯示 (實際: ❌ 空白)
          - 銷售趨勢: 🟢 正常顯示 (實際: ❌ 空白)
          - 客戶分析: 🟢 正常顯示 (實際: ❌ 空白)
          - 產品分析: 🟢 正常顯示 (實際: ❌ 空白)
          - 完全誤導開發方向和資源分配
        ```
    *   **方法論災難模式分析:**
        1. **程式碼存在謬誤:** 程式碼存在 ≠ 功能正常，這是最基本的邏輯錯誤
        2. **脫離實際驗證:** 任何功能判斷都必須基於實際測試和使用者體驗
        3. **工具認知不足:** 專案已配置 MCP Playwright 工具，卻嘗試安裝 Python Playwright
        4. **分析範圍不全:** 基於局部程式碼就做出整體系統功能判斷
        5. **固執錯誤判斷:** 在明顯錯誤時未能及時接受糾正和調整
    *   **關鍵教訓與預防模式:**
        ```yaml
        強制性驗證原則:
          - [ ] 任何功能狀態分析都必須包含實際測試驗證
          - [ ] 優先使用專案已配置的 MCP 工具
          - [ ] 從使用者角度檢查功能實際狀態
          - [ ] 系統性檢查所有相關頁面，不能遺漏
          - [ ] 接受並學習來自用戶的實際體驗糾正
        
        分析方法論標準:
          - 實際測試優於程式碼推測
          - 使用者體驗是最終判斷標準
          - 善用現有工具和測試基礎設施
          - 進行全面而系統性的功能檢查
          - 保持謙遜，接受糾正和學習
        
        災難預防機制:
          - 建立強制性功能驗證清單
          - 使用自動化工具進行實際功能測試
          - 建立分析結果與實際狀況對比機制
          - 設立分析錯誤的懲罰性學習機制
        ```
    *   **此模式的嚴重性評級:** 🔴 最高級別 - 直接影響專案開發方向和決策
    *   **適用範圍:** 所有功能分析、系統狀態評估、問題診斷場景
    *   **強制執行:** 任何功能分析報告都必須包含實際測試驗證證據
    *   **參考記錄:** 詳見 `/Users/gamepig/projects/NexusERP/memory-bank/bug_records/bug_2025-07-28_reports_analysis_critical_error.md`

## AI/ML 整合模式
*   **外部服務整合:**
    *   **OCR:** 調用外部 OCR 服務 API 處理文件影像。
    *   **MCP SERVER TOOLS:** 調用其 API 獲取外部數據（新聞、天氣、法規、市場價格等）或執行瀏覽器交互操作。
    *   **RAG/CAG:** 調用外部模型 API 實現 AI 知識庫的檢索與生成。
    *   **LLM (用於助手/NLP):** 可能調用外部 LLM API (如 OpenRouter) 進行意圖識別、報表解釋、自然語言填單。
*   **內部模型 (潛在):**
    *   **預測/推薦模型:** 可能在後端自行開發或整合預訓練模型 (Python/Go)，用於銷售預測、庫存預測、供應商推薦、促銷建議。
    *   **模型部署:** 若有內部模型，需考慮部署方式 (嵌入後端服務或獨立部署)。
*   **數據流:** 業務數據 (庫存、銷售) -> AI 模型 -> 生成預測/推薦 -> 寫回資料庫或展示於前端。
*   **模型維護:** 規劃模型監控、評估與重新訓練的流程 (參考 Task C.2)。

## 使用者互動模式
*   **主要介面:** Web 應用程式 (PHP/Laravel Blade)，**遵循 Mobile-First 響應式網頁設計 (RWD) 原則。**
*   **自然語言互動:**
    *   語音輸入 (Web Speech API) 用於搜尋或 AI 助手。
    *   AI 助手 (**初期建議 UI 為：懸浮按鈕 (FAB) + 彈出式聊天視窗**) 接收文字/語音指令，執行查詢、導航、簡單操作。
    *   自然語言填單 (AI 解析語義填充表單)。
*   **視覺化:** 使用 Chart.js 等庫展示報表與儀表板數據。
*   **離線支援 (潛在):** 使用 Service Workers 快取核心資源和數據，提供基礎離線功能。

## 安全模式
*   **認證:** 後端 (Go) 處理密碼驗證 (bcrypt) 和 JWT/Session 生成。前端 (Laravel) 管理 Session，並在需要時向後端發送 Token/Session ID。
*   **授權:** 基於角色的訪問控制 (RBAC)。後端 API 設計授權檢查中介軟體。
*   **數據傳輸:** 全站使用 HTTPS 加密。
*   **敏感數據:** 靜態加密（如資料庫加密），避免在日誌中記錄敏感資訊。
*   **輸入驗證:** 前後端均進行嚴格的輸入驗證，防止 XSS、SQL Injection 等攻擊 (遵循 OWASP Top 10)。
*   **API 安全:** API 端點進行速率限制、身份驗證和授權檢查。
*   **Marketplace 安全:** 交易數據加密、會員身份驗證、防止詐欺性評價/交易的機制。
*   **外部 API 金鑰管理:** 使用環境變數或 Secret Management 服務管理外部 API 金鑰。

### 🚨 已知安全問題模式

#### 已修復 - 多租戶安全漏洞 (2025-07-23) ✅
*   **多租戶資料隔離失效:** ✅ 已實施 PostgreSQL Row Level Security (RLS) 解決
*   **孤立用戶問題:** ✅ 215 個孤立用戶已修復，建立完整公司關聯
*   **跨公司資料洩露:** ✅ 實施深度防禦架構，12 個表格完成隔離
*   **公司上下文缺失:** ✅ 建立 SetCompanyContext 中介軟體
*   **強制公司設定:** ✅ EnsureCompanySetup 中介軟體已應用
*   **詳細修復方案:** 詳見 `/Users/gamepig/projects/NexusERP/memory-bank/bug_records/bug_2025-07-23_multi_tenant_security_critical_fixes.md`

#### 待修復 - 前端安全問題 (2025-07-21)
*   **前端 XSS 防護缺失:** JavaScript 組件中直接使用 `innerHTML` 插入未轉義的使用者輸入，存在 XSS 風險
*   **Token 儲存安全:** JWT token 儲存在 localStorage 而非 httpOnly cookies，易被 XSS 攻擊竊取
*   **CSRF 保護不完整:** 部分路由和 API 呼叫缺少 CSRF token 驗證
*   **CSP 缺失:** 前端頁面未設置 Content Security Policy 防護
*   **身份驗證中介軟體遺漏:** 部分敏感路由（如 supplier dashboard）缺少驗證中介軟體
*   **錯誤訊息洩漏:** 開發模式下可能透過 console.error 洩漏敏感資訊
*   **參考修復方案:** 詳見 `/Users/gamepig/projects/NexusERP/memory-bank/bug_records/bug_2025-07-21_marketplace_security_issues.md`

## 🔥 新增重要開發規則
1. **資料庫設計參考規則：** 所有跟資料庫相關的設計，都必須參考文件 `/Users/gamepig/projects/NexusERP/documents/database_spec.md`
2. **重複程式碼檢查：** 在寫新函數或變數前，先檢查專案文件，是否已有寫過，不要重複程式碼
3. **命名規範遵循：** 嚴格遵循專案中的命名規範文件

## 📂 關鍵規範文件位置
- **API 命名規範：** `/Users/gamepig/projects/NexusERP/documents/API_Planning_Document.md#命名慣例與版本控制建議`
- **後端檔案結構：** `/Users/gamepig/projects/NexusERP/documents/backend_file_structure_spec.md`
- **資料庫規格：** `/Users/gamepig/projects/NexusERP/documents/database_spec.md`
- **Go/Gin 最佳實踐：** `/Users/gamepig/projects/NexusERP/documents/Go_Gin_API_Best_Practices.md`
- **開發規範：** `/Users/gamepig/projects/NexusERP/documents/claude_code_rules.md`
- **CSS 命名：** `/Users/gamepig/projects/NexusERP/style/style-guide.md`
- **台灣用語：** `/Users/gamepig/projects/NexusERP/documents/reference/CS_TW_CN_TERMS.md`

## Laravel 模型常數一致性模式 (⚠️ 重要模式)
*   **問題模式:** Laravel 模型中方法引用不存在的常數，導致狀態管理功能異常
*   **常見症狀:**
    *   前端顯示操作成功但資料庫未實際更新
    *   狀態相關方法（如 `isSubmitted()`, `isCompleted()`）發生錯誤
    *   狀態轉換邏輯失效
*   **解決模式:**
    1. **常數定義檢查:** 確保所有模型方法引用的常數都已正確定義
    2. **狀態映射一致性:** 前後端狀態值必須完全一致
    3. **方法重構:** 將引用不存在常數的方法修正為引用正確常數
    4. **預防措施:** 使用 PHPStan 等工具檢查未定義常數引用
*   **典型案例 (2025-07-26):** 
    *   PurchaseOrder 模型 `isSubmitted()` 引用不存在的 `STATUS_SUBMITTED`
    *   應修正為引用 `STATUS_PENDING_APPROVAL`
    *   類似問題出現在 `isCompleted()`, `submit()`, `updateReceiveStatus()`, `canCancel()` 方法
*   **參考修復方案:** 詳見 `/Users/gamepig/projects/NexusERP/memory-bank/bug_records/bug_20250726_purchase_order_status_constants.md`

## 部署模式
*   **容器化:** 使用 Docker 將前端、後端、資料庫等服務容器化。
*   **編排:** 使用 Docker Compose 進行本地開發和測試環境的服務編排。
*   **雲端部署 (潛在):** 考慮使用 Kubernetes (EKS/GKE)、AWS ECS 或 Serverless (如 AWS App Runner) 部署容器化的應用程式。
*   **CI/CD:** 使用 GitHub Actions (或其他工具) 自動化建置、測試和部署流程。

## 跨行業模式
*   **核心模組 + 行業標籤:** 設計通用的核心模組（庫存、銷售、財務），透過 `business_unit_id` 和行業標籤（存儲在 `business_units` 表）區分不同業務。
*   **彈性設定:** 提供配置選項，讓使用者根據行業特性調整某些功能（如農業的生物資產追蹤開關）。
*   **條件邏輯:** 在程式碼中根據業務單位的行業標籤，啟用或調整特定邏輯（如零售業顯示 POS 相關選項）。
*   **附加模組 (未來):** 對於極其專業的行業需求，考慮開發可選的附加模組。
*   **Marketplace 角色:** Marketplace 可作為連接不同行業需求的橋樑（如農業供應商服務零售業）。

## 🧠 Sequential Thinking 思考模式整合 (2025-07-25 新增)

### 系統性思考架構
**Sequential Thinking MCP 工具** (`mcp__sequential-thinking__sequentialthinking`) 為專案提供結構化的問題分析和決策制定能力。

#### 核心思考模式

##### 1. 層次化問題分解
```text
主問題 (Problem Level 0)
├── 子問題 A (Problem Level 1)
│   ├── 技術面 (Level 2)
│   ├── 業務面 (Level 2)
│   └── 風險面 (Level 2)
├── 子問題 B (Problem Level 1)
└── 子問題 C (Problem Level 1)
```

##### 2. MECE 原則應用
*   **相互獨立 (Mutually Exclusive):** 每個思考步驟解決不同面向的問題
*   **完全窮盡 (Collectively Exhaustive):** 涵蓋問題的所有重要面向
*   **邏輯一致:** 保持思考邏輯的前後一致性

##### 3. 假設驗證循環
```text
假設提出 → 證據收集 → 分析驗證 → 結論確認 → 新假設/修正
```

### 在 NexusERP 開發中的應用模式

#### 架構設計思考模式
```text
Phase 1: 需求理解
├── 業務需求分析
├── 技術限制識別  
└── 使用者體驗需求

Phase 2: 方案設計
├── 多個技術方案比較
├── 效能影響評估
└── 維護成本分析

Phase 3: 風險評估
├── 技術風險識別
├── 業務風險評估
└── 緩解策略制定

Phase 4: 實施規劃
├── 開發階段劃分
├── 測試策略制定
└── 部署計劃確認
```

#### 問題診斷思考模式
```text
Phase 1: 問題界定
├── 症狀描述與重現
├── 影響範圍評估
└── 緊急程度評級

Phase 2: 根本原因分析
├── 系統層級分析 (前端/後端/資料庫)
├── 時間線分析 (何時開始/變化點)
└── 環境因素分析 (配置/相依性)

Phase 3: 解決方案設計
├── 短期修復方案
├── 長期改善方案
└── 預防機制設計

Phase 4: 驗證與監控
├── 修復效果驗證
├── 副作用監控
└── 知識庫更新
```

### 複雜度分級思考策略

#### 低複雜度問題 (1-3 思考步驟)
*   直接的功能實作
*   明確的錯誤修復
*   標準的 CRUD 操作

#### 中複雜度問題 (4-7 思考步驟)
*   跨模組整合
*   效能最佳化
*   安全性改善

#### 高複雜度問題 (8-15 思考步驟)
*   系統架構重構
*   多租戶架構設計
*   複雜業務邏輯實作

#### 極高複雜度問題 (15+ 思考步驟)
*   整體系統升級
*   跨平台整合
*   企業級安全架構設計

### 決策品質控制機制

#### 思考品質檢核點
1. **完整性檢查:** 是否涵蓋問題的所有重要面向
2. **邏輯一致性:** 前後思考是否存在矛盾
3. **可行性評估:** 解決方案是否在技術和資源限制內
4. **風險識別:** 是否充分識別和評估風險
5. **可驗證性:** 結論是否可以透過測試或實證驗證

#### 思考修正機制
*   **回溯修正:** 當發現前面思考有誤時，標記並修正
*   **分支探索:** 對於不確定的問題，可以開啟多個思考分支
*   **深度調整:** 根據問題複雜度動態調整思考深度

### 知識積累與學習模式

#### 模式識別與復用
*   **問題模式庫:** 記錄常見問題的分析模式
*   **解決方案模板:** 建立可重複使用的思考框架
*   **決策樹模型:** 針對特定領域建立決策邏輯

#### 團隊學習機制
*   **思考過程分享:** 重要思考過程記錄到 memory-bank
*   **最佳實踐萃取:** 從成功案例中萃取可復用的思考模式
*   **錯誤學習:** 從失敗案例中學習避免重複錯誤

### 與現有系統整合

#### 與 TaskMaster 整合
*   複雜任務開始前使用 Sequential Thinking 進行深度分析
*   將思考過程摘要記錄到任務詳情中
*   為任務風險評估提供結構化分析

#### 與測試框架整合
*   使用 Sequential Thinking 設計複雜的測試場景
*   分析測試失敗的根本原因
*   制定測試策略和覆蓋率改善計劃

#### 與知識庫整合
*   重要思考過程自動整理到 memory-bank
*   建立跨專案的知識模式庫
*   為新專案成員提供學習參考

**Sequential Thinking 思考模式為 NexusERP 專案建立了系統性的問題分析和決策制定能力，確保在面對複雜技術挑戰時能夠進行深入、全面的思考，提升決策品質和專案成功率。**

*   **🚨 JavaScript JSON 對象顯示問題模式 (⚠️ 2025-08-02 發現):**
    *   **問題核心:** 前端 JavaScript 直接將 JSON 對象賦值給 HTML 表單元素導致顯示異常
        - **顯示問題:** 地址欄位顯示 `"[object Object]"` 而非實際內容
        - **提交錯誤:** 後端收到無效字串格式，無法解析為合法 JSON
        - **資料類型衝突:** 資料庫 JSONB 格式 vs 前端字串處理不匹配
        - **API 端點錯誤:** 前端請求錯誤的 API 端點 (Laravel vs Go 後端)
    *   **典型案例 - 供應商地址編輯:**
        ```javascript
        // 錯誤模式
        document.getElementById('address').value = supplier.address || '';
        // 當 supplier.address 是 {"street": "123 St", "city": "SF"} 時
        // 結果顯示: "[object Object]"
        
        // API 端點配置錯誤
        const API_BASE_URL = 'http://127.0.0.1:8000'; // Laravel (錯誤)
        // 應為: 'http://127.0.0.1:8082'; // Go 後端 (正確)
        ```
    *   **解決模式:**
        1. **智能資料類型處理:**
           ```javascript
           // 正確模式：檢查資料類型並適當轉換
           let addressValue = '';
           if (supplier.address) {
               if (typeof supplier.address === 'string') {
                   addressValue = supplier.address;
               } else if (typeof supplier.address === 'object') {
                   // 轉換為可讀格式
                   const parts = [];
                   if (supplier.address.street) parts.push(supplier.address.street);
                   if (supplier.address.city) parts.push(supplier.address.city);
                   if (supplier.address.state) parts.push(supplier.address.state);
                   addressValue = parts.join(', ');
               }
           }
           document.getElementById('address').value = addressValue;
           ```
        2. **表單提交資料格式化:**
           ```javascript
           // 智能轉換提交資料
           const addressText = document.getElementById('address').value;
           let addressData = null;
           if (addressText.trim()) {
               try {
                   if (addressText.trim().startsWith('{')) {
                       addressData = JSON.parse(addressText);
                   } else {
                       addressData = { address: addressText };
                   }
               } catch (e) {
                   addressData = { address: addressText };
               }
           }
           ```
        3. **API 端點統一管理:**
           ```javascript
           // 建立統一的 API 配置
           const API_ENDPOINTS = {
               LARAVEL_BASE: 'http://127.0.0.1:8000',
               GO_BACKEND: 'http://127.0.0.1:8082'
           };
           // 根據功能選擇正確端點
           const API_BASE_URL = API_ENDPOINTS.GO_BACKEND; // 供應商 API
           ```
    *   **預防措施:**
        1. **類型安全賦值函數:**
           ```javascript
           function safeAssignValue(element, value, fallback = '') {
               if (typeof value === 'string') {
                   element.value = value;
               } else if (typeof value === 'object' && value !== null) {
                   element.value = JSON.stringify(value, null, 2);
               } else {
                   element.value = fallback;
               }
           }
           ```
        2. **統一 JSON 資料處理模式:**
           - 建立標準化的 JSON 對象到字串轉換函數
           - 建立反向的字串到 JSON 對象解析函數
           - 在所有表單處理中應用一致的資料類型檢查
        3. **API 端點配置管理:**
           - 建立統一的 API 端點配置文件
           - 根據功能模組自動選擇正確的後端服務
           - 實施 API 端點一致性檢查機制
    *   **影響範圍評估:**
        - **已知問題:** 供應商地址編輯功能
        - **潛在風險:** 客戶管理、產品管理等其他包含 JSON 欄位的表單
        - **系統性問題:** 所有前後端 JSON 資料交換場景
    *   **檢查清單:**
        - [ ] 所有 JSON 欄位的表單處理邏輯
        - [ ] API 端點配置的一致性
        - [ ] 資料類型轉換的安全性
        - [ ] 錯誤處理機制的完整性
    *   **參考修復記錄:** 詳見 `/Users/gamepig/projects/NexusERP/memory-bank/supplier_address_object_issue_fix.md`

*   **🚨 全站 UI 主題系統完全失效模式 (⚠️ 2025-08-05 發現):**
    *   **問題核心:** NexusERP 系統出現嚴重的全站 UI 顏色配置完全丟失問題
        - **視覺災難:** 所有頁面變成純白背景，完全失去暗色主題和色彩設計
        - **功能失效:** 主題切換按鈕無法正常工作，暗色模式完全失效
        - **品牌損失:** 整個系統的視覺識別度完全喪失
        - **例外情況:** 只有報表中心保持正常的藍色風格
    *   **典型症狀:**
        ```yaml
        影響範圍:
          - Dashboard: ❌ 純白背景
          - 庫存管理: ❌ 純白背景  
          - 員工管理: ❌ 純白背景
          - 市集功能: ❌ 純白背景
          - 使用者設定: ❌ 純白背景
          - 報表中心: ✅ 正常藍色風格 (唯一例外)
        
        功能狀態:
          - 主題切換按鈕: ❌ 無效
          - 暗色模式: ❌ 完全失效
          - CSS 載入: ❌ 可能異常
          - JavaScript 主題邏輯: ❌ 可能失效
        ```
    *   **可能根本原因分析:**
        1. **CSS 編譯系統問題:**
           - Tailwind CSS 編譯過程出現錯誤
           - Vite 建置配置異常
           - 編譯後的 CSS 檔案內容缺失或載入失敗
        2. **配置檔案損壞:**
           - `tailwind.config.js` 配置異常
           - `vite.config.js` 設定錯誤
           - 顏色變數定義被意外刪除或覆蓋
        3. **主題切換邏輯問題:**
           - JavaScript 程式碼失效
           - `localStorage` 主題偏好設定異常
           - `<html>` 標籤的 `dark` class 綁定失效
        4. **資產載入問題:**
           - 主佈局檔案 CSS 引用異常
           - 編譯後的 CSS 檔案路徑錯誤
           - 快取問題導致舊版本 CSS 載入
    *   **診斷與修復策略:**
        ```yaml
        第一階段 - 緊急診斷:
          - 瀏覽器開發者工具檢查 CSS 載入狀況
          - 檢查控制台是否有相關錯誤訊息
          - 驗證編譯後的 CSS 檔案內容完整性
          - 確認 Network 面板中 CSS 檔案的載入狀態
        
        第二階段 - 配置修復:
          - 檢查 tailwind.config.js 的 darkMode 配置
          - 驗證 theme.extend.colors 顏色定義
          - 確認 resources/css/app.css 的 Tailwind 指令
          - 審查主佈局檔案的 CSS 引用
        
        第三階段 - 邏輯修復:
          - 修復 JavaScript 主題切換邏輯
          - 確保 localStorage 主題偏好正常運作
          - 驗證 HTML 根元素的主題 class 綁定
        
        第四階段 - 資產重建:
          - 清除所有快取 (伺服器 + 瀏覽器)
          - 重新建置前端資產 (npm run build)
          - 確保最新資產正確部署
        ```
    *   **報表中心例外分析:**
        - **獨立樣式系統:** 可能使用了與全站不同的 CSS 載入方式
        - **隔離實現:** 可能有獨立的主題配置或內聯樣式
        - **線索價值:** 這個例外提供了重要的診斷參考
        - **未來整合:** 長期應將報表中心統一到全域主題系統
    *   **預防機制建立:**
        1. **CSS 監控機制:**
           - CI/CD 流程加入前端資產驗證
           - 定期檢查編譯後 CSS 檔案完整性
           - 建立主題功能自動化測試
        2. **配置保護措施:**
           - 核心配置檔案變更審查流程
           - 重要檔案修改前自動備份
           - 版本控制中標記關鍵配置文件
        3. **測試自動化:**
           - 建立主題切換功能 E2E 測試
           - 定期驗證各頁面色彩配置
           - 跨瀏覽器主題一致性測試
    *   **修復優先級:** 中等（等所有 DEMO 頁面完成後處理）
    *   **TaskMaster 任務:** #67 - 緊急修復：恢復全域 UI 主題與暗色模式
    *   **參考記錄:** 詳見 `/Users/gamepig/projects/NexusERP/memory-bank/bug_records/bug_2025-08-05_nexus_erp_ui_theme_complete_failure.md` 