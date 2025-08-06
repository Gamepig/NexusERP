# Playwright MCP 測試要求

## 🚨 **強制性規則：Playwright MCP 測試驗證**

### **適用於所有任務類型**
無論任務大小、複雜度或類型，**所有任務**在標記為 "done" 前都必須通過 Playwright MCP 測試驗證。

### **Playwright MCP 優勢**
- **真實瀏覽器環境**：在實際瀏覽器中運行測試
- **Claude Code 整合**：無需額外安裝或配置
- **即時互動**：可以在對話中直接執行和調試
- **視覺化驗證**：可以截圖和檢視頁面狀態
- **全功能覆蓋**：支援所有瀏覽器操作

### **核心測試工具**

#### **導航工具**
- `mcp__playwright-mcp__browser_navigate` - 導航到指定 URL
- `mcp__playwright-mcp__browser_navigate_back` - 瀏覽器後退
- `mcp__playwright-mcp__browser_navigate_forward` - 瀏覽器前進

#### **頁面互動工具**
- `mcp__playwright-mcp__browser_click` - 點擊元素
- `mcp__playwright-mcp__browser_type` - 輸入文字
- `mcp__playwright-mcp__browser_select_option` - 選擇下拉選項
- `mcp__playwright-mcp__browser_hover` - 懸停元素
- `mcp__playwright-mcp__browser_drag` - 拖放操作

#### **頁面檢查工具**
- `mcp__playwright-mcp__browser_snapshot` - 獲取頁面狀態和元素
- `mcp__playwright-mcp__browser_take_screenshot` - 截取頁面截圖
- `mcp__playwright-mcp__browser_console_messages` - 檢查控制台訊息
- `mcp__playwright-mcp__browser_network_requests` - 查看網路請求

#### **標籤頁管理**
- `mcp__playwright-mcp__browser_tab_new` - 開啟新標籤頁
- `mcp__playwright-mcp__browser_tab_select` - 切換標籤頁
- `mcp__playwright-mcp__browser_tab_close` - 關閉標籤頁

### **測試流程標準**

#### **1. 測試準備**
- 確保前端和後端服務正在運行
- 確認測試帳號存在且可用
- 記錄測試開始時間

#### **2. 基本功能測試**
- 頁面導航和載入
- 用戶登錄和認證
- 主要功能操作流程

#### **3. CRUD 操作測試**
- Create：新增資料功能
- Read：資料顯示和查詢功能
- Update：編輯和更新功能
- Delete：刪除功能

#### **4. 錯誤處理測試**
- 輸入驗證
- 權限控制
- 網路錯誤處理
- 異常情況恢復

#### **5. 用戶體驗測試**
- 頁面響應速度
- UI 元素正確顯示
- 互動反饋
- 數據一致性

### **測試記錄要求**
- 每個測試步驟的截圖
- 控制台錯誤訊息（如有）
- 網路請求記錄
- 測試執行時間
- 發現問題的詳細描述
- 最終驗證確認

### **失敗處理流程**
1. **記錄問題詳情**
2. **分析根本原因**
3. **實施修復措施**
4. **重新執行測試**
5. **確認問題解決**

這個標準確保每個任務都經過真實瀏覽器環境的完整驗證，保證交付品質達到生產環境要求。