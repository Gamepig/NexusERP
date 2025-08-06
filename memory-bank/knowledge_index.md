# NexusERP 知識庫索引 (Knowledge Base Index)

**建立時間:** 2025-07-28  
**最後更新:** 2025-07-28  

## 📋 主要知識庫分類

### 🏗️ 系統架構與模式
- **`systemPatterns.md`** - 系統架構模式、反模式和最佳實踐
- **`techContext.md`** - 技術堆疊、開發環境和外部服務依賴
- **`vite_laravel_architecture_conflict_analysis.md`** - Vite-Laravel架構衝突深度分析

### 🚀 專案進度記錄
- **`progress.md`** - TaskMaster任務進度、完成記錄、重大問題發現
- **`activeContext.md`** - 當前開發上下文和活躍任務
- **`projectbrief.md`** - 專案概覽和核心目標

### 🔧 技術實作記錄
- **`development-patterns.md`** - 開發模式和程式碼規範
- **`technical-decisions.md`** - 技術決策記錄和架構選擇
- **`lessons-learned.md`** - 開發過程中的經驗教訓

### 📖 開發規範文件
- **`../CLAUDE_CODE_RULES.md`** - Claude Code 強制性開發規則（已合併整合）
- **`../documents/claude_code_rules.md`** - 原始開發規範文件

### 🐛 問題記錄與解決方案
- **`bug_records/`** - 詳細的Bug記錄、分析和修復方案
  - `bug_2025-08-05_nexus_erp_ui_theme_complete_failure.md` - 🚨 **新增** 全站UI主題系統完全失效
  - `bug_2025-07-28_reports_analysis_critical_error.md` - 🚨 報表分析嚴重錯誤記錄
  - `bug_2025-07-27_報表系統颜色主題修復未完成.md` - 報表系統主題問題
  - `bug_2025-07-27_product_edit_inventory_fields_complete_fix.md` - 產品庫存欄位修復
  - `bug_2025-07-27_sales_order_calculation_complete_fix.md` - 銷售訂單計算修復
  - `bug_20250726_purchase_order_status_constants.md` - 採購訂單狀態常數問題

### 🧪 測試與品質保證
- **`playwright-*` 系列文件** - Playwright測試框架知識庫
  - `playwright-knowledge-index.md` - Playwright知識索引
  - `playwright-core-concepts.md` - 核心概念和基礎
  - `playwright-test-patterns.md` - 測試模式和最佳實踐

### 🛡️ 安全性記錄
- **`SECURITY_IMPLEMENTATION_KNOWLEDGE_BASE.md`** - 安全實作知識庫

## 🔗 關鍵交叉引用主題

### 報表系統與深色主題
**核心問題:** Vite-Laravel架構衝突導致深色主題失效

**相關文件:**
- 🎯 **主要分析:** `memory-bank/vite_laravel_architecture_conflict_analysis.md`
- 📋 **系統模式:** `systemPatterns.md` (Line 161-195: Vite-Laravel 架構衝突問題模式)
- 🔧 **技術上下文:** `techContext.md` (Line 7-12: 前端樣式系統架構衝突)
- 📈 **進度記錄:** `progress.md` (Line 216-244: 重大架構問題發現記錄)
- 🐛 **相關Bug:** `bug_records/bug_2025-07-27_報表系統颜色主題修復未完成.md`

**解決方案分級:**
- 🔥 **緊急修復:** 3個財務報表頁面變數前綴統一
- ⚙️ **架構重構:** 統一使用Vite系統
- 📊 **功能完善:** Chart.js深色主題整合

### 多租戶安全架構
**核心實作:** PostgreSQL Row-Level Security + 應用層中介軟體

**相關文件:**
- 📋 **系統模式:** `systemPatterns.md` (Line 15-19: 多租戶數據隔離)
- 🛡️ **安全記錄:** `SECURITY_IMPLEMENTATION_KNOWLEDGE_BASE.md`
- 🐛 **修復記錄:** `bug_records/bug_2025-07-23_multi_tenant_security_critical_fixes.md`

### 前後端API整合模式
**核心挑戰:** 欄位映射、權限設計、資料庫同步

**相關文件:**
- 📋 **系統模式:** `systemPatterns.md` (Line 32-79: API權限設計和欄位映射模式)
- 🔧 **技術實作:** `development-patterns.md`
- 🐛 **相關修復:** `bug_records/bug_2025-07-27_*` 系列檔案

### JavaScript防禦式編程
**核心模式:** Null safety, 事件綁定完整性, 明確條件檢查

**相關文件:**
- 📋 **系統模式:** `systemPatterns.md` (Line 81-117: JavaScript防禦式編程模式)
- 🐛 **實際案例:** `bug_records/bug_2025-07-27_sales_order_calculation_complete_fix.md`

### 🚨 分析方法論嚴重錯誤
**核心問題:** 僅憑程式碼推測功能狀態，完全脫離實際使用者體驗

**災難性影響:**
- 所有報表頁面被錯誤標記為"🟢 正常顯示"
- 實際上圖表完全無法渲染，用戶看到的全是"載入中..."
- 誤導開發方向，浪費時間和資源

**相關文件:**
- 🚨 **詳細記錄:** `bug_records/bug_2025-07-28_reports_analysis_critical_error.md`
- 📋 **系統模式:** `systemPatterns.md` (Line 197-247: 分析方法論嚴重錯誤模式)
- 🎓 **關鍵教訓:** `lessons-learned.md` (Line 493-560: 教訓 #13)

**強制性預防措施:**
- ✅ 任何功能分析都必須包含實際測試驗證
- ✅ 優先使用專案已配置的 MCP 工具  
- ✅ 從使用者角度檢查功能實際狀態
- ✅ 接受並學習來自用戶的實際體驗糾正

### 🎨 全站UI主題系統完全失效
**核心問題:** NexusERP 系統出現嚴重的全站 UI 顏色配置完全丟失

**視覺災難影響:**
- 所有頁面變成純白背景，完全失去暗色主題和色彩設計
- 主題切換按鈕無法正常工作，暗色模式完全失效
- 整個系統的視覺識別度完全喪失，用戶體驗極差
- 只有報表中心保持正常的藍色風格（唯一例外）

**相關文件:**
- 🚨 **詳細記錄:** `bug_records/bug_2025-08-05_nexus_erp_ui_theme_complete_failure.md`
- 📋 **系統模式:** `systemPatterns.md` (Line 581-664: 全站UI主題系統完全失效模式)
- 📈 **進度記錄:** `progress.md` (Line 108-119: 最新發現問題記錄)
- 🎯 **TaskMaster任務:** #67 - 緊急修復：恢復全域 UI 主題與暗色模式

**可能根本原因:**
- CSS 編譯系統問題 (Tailwind CSS/Vite 編譯異常)
- 配置檔案損壞 (tailwind.config.js/vite.config.js)
- 主題切換邏輯失效 (JavaScript/localStorage)
- 資產載入問題 (主佈局檔案 CSS 引用異常)

**修復策略階段:**
1. **緊急診斷:** 瀏覽器開發工具檢查 CSS 載入狀況
2. **配置修復:** 檢查核心配置檔案和顏色定義
3. **邏輯修復:** 修復 JavaScript 主題切換邏輯
4. **資產重建:** 清除快取並重新建置前端資產

**優先級:** 中等（等所有 DEMO 頁面完成後處理）

## 📊 問題嚴重程度分級

### 🚨 嚴重級 (Critical)
- **🔴 分析方法論嚴重錯誤** - 僅憑程式碼推測功能狀態，完全脱離實際測試 
- **Vite-Laravel架構衝突** - 影響用戶體驗的視覺問題
- **多租戶安全漏洞** - 資料洩露風險 (已修復)
- **API權限設計缺陷** - 功能性故障

### ⚠️ 重要級 (Important)
- **🎨 全站UI主題系統完全失效** - 視覺識別度完全喪失，用戶體驗極差 (待修復)
- **前後端資料庫同步** - 資料一致性問題
- **JavaScript防禦式編程** - 運行時錯誤
- **搜尋功能遺漏欄位** - 用戶功能期待不符

### 💡 改善級 (Enhancement)
- **Chart.js主題統一** - 視覺一致性
- **測試覆蓋率提升** - 品質保證
- **程式碼重構最佳化** - 維護性改善

## 🔄 知識庫維護流程

### 新問題記錄流程
1. **問題發現** → 建立 `bug_records/bug_YYYY-MM-DD_簡要描述.md`
2. **根因分析** → 更新 `systemPatterns.md` 添加新的反模式
3. **技術決策** → 更新 `techContext.md` 記錄技術選擇
4. **進度記錄** → 更新 `progress.md` 追蹤解決進度
5. **知識索引** → 更新本文件建立交叉引用

### 文件更新檢查點
- [ ] 每個主要Bug修復後更新相關系統模式
- [ ] 每個技術決策後更新技術上下文
- [ ] 每週更新進度記錄和知識索引
- [ ] 每月檢視經驗教訓和最佳實踐

### 品質控制機制
- **一致性檢查:** 確保多個文件間資訊一致
- **完整性驗證:** 重要問題必須有完整的記錄鏈
- **可追溯性:** 每個決策和修復都能追溯到原始問題
- **交叉引用維護:** 定期檢查和更新文件間的引用關係

---

**知識庫維護負責:** Claude Code + TaskMaster AI  
**更新頻率:** 每個重大問題發現或解決後立即更新  
**審核週期:** 每週檢視，每月深度審核  