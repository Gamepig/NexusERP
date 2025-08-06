# Puppeteer MCP Server 使用指南

## 📦 安裝與配置

### 全域安裝 (推薦)
```bash
npm install -g puppeteer-mcp-server
```

### Claude Code MCP 配置
在專案的 `.mcp.json` 中添加：
```json
{
  "mcpServers": {
    "puppeteer-mcp-server": {
      "command": "mcp-server-puppeteer",
      "args": [],
      "env": {}
    }
  }
}
```

## 🛠️ 可用工具

### 1. puppeteer_connect_active_tab
連接到現有的 Chrome 實例 (需要啟用遠端除錯)

**啟用方式:**
```bash
# macOS
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222

# Windows
"C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222
```

**參數:**
- `targetUrl` (選擇性): 指定連接的頁面 URL
- `debugPort` (選擇性): Chrome 除錯端口 (預設: 9222)

### 2. puppeteer_navigate
導航到指定 URL
- **必要參數**: `url` - 要導航的網址

### 3. puppeteer_screenshot
截取頁面或元素截圖
- **必要參數**: `name` - 截圖檔案名稱
- **選擇性參數**:
  - `selector` - CSS 選擇器 (截取特定元素)
  - `width` - 寬度像素 (預設: 800)
  - `height` - 高度像素 (預設: 600)

### 4. puppeteer_click
點擊頁面元素
- **必要參數**: `selector` - CSS 選擇器

### 5. puppeteer_fill
填寫表單欄位
- **必要參數**:
  - `selector` - 輸入欄位的 CSS 選擇器
  - `value` - 要輸入的文字

### 6. puppeteer_select
選擇下拉式選單選項
- **必要參數**:
  - `selector` - 下拉選單的 CSS 選擇器
  - `value` - 要選擇的選項值

### 7. puppeteer_hover
滑鼠懸停在元素上
- **必要參數**: `selector` - CSS 選擇器

### 8. puppeteer_evaluate
執行 JavaScript 程式碼
- **必要參數**: `script` - 要執行的 JavaScript 程式碼

## 🔧 實用範例

### 基本網頁自動化
```javascript
// 導航到網站
puppeteer_navigate({ url: "https://example.com" })

// 截取整頁截圖
puppeteer_screenshot({ name: "homepage" })

// 填寫搜尋框
puppeteer_fill({ 
  selector: "#search-input", 
  value: "puppeteer automation" 
})

// 點擊搜尋按鈕
puppeteer_click({ selector: "#search-button" })
```

### 表單處理
```javascript
// 填寫登入表單
puppeteer_fill({ selector: "#username", value: "user@example.com" })
puppeteer_fill({ selector: "#password", value: "password123" })

// 選擇下拉選單
puppeteer_select({ selector: "#country", value: "TW" })

// 提交表單
puppeteer_click({ selector: "#login-button" })
```

### 與現有 Chrome 連接
```javascript
// 先啟動 Chrome (命令列)
// /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222

// 連接到特定頁面
puppeteer_connect_active_tab({ 
  targetUrl: "https://github.com",
  debugPort: 9222 
})
```

## 🚨 安全考量

1. **遠端除錯安全性**:
   - 僅在可信任網路中啟用
   - 不使用時關閉除錯端口
   - 不要將除錯端口暴露到公共網路

2. **資料保護**:
   - 避免在自動化腳本中硬編碼敏感資訊
   - 使用環境變數管理認證資料

## 📝 記錄與除錯

- **記錄位置**: `logs/mcp-puppeteer-YYYY-MM-DD.log`
- **記錄輪轉**: 每日輪轉，保留 14 天
- **記錄等級**: DEBUG, INFO, WARN, ERROR

## 🎯 適用場景

1. **網頁測試自動化**
2. **資料抓取與爬蟲**
3. **表單填寫自動化**
4. **網頁截圖產生**
5. **UI 測試與驗證**
6. **網頁內容監控**

## ⚠️ 使用限制

1. 需要 Chrome/Chromium 瀏覽器
2. 某些網站可能有反機器人機制
3. 大量使用時注意系統資源消耗
4. 遵守目標網站的服務條款和使用條件

## 🔗 官方資源

- **GitHub**: https://github.com/merajmehrabi/puppeteer-mcp-server
- **NPM**: https://www.npmjs.com/package/puppeteer-mcp-server
- **文件**: README.md 包含詳細配置說明

---
*最後更新: 2025-07-25*
*配置狀態: ✅ 已正確安裝並配置到 Claude Code*