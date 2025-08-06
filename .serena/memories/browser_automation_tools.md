# 瀏覽器自動化工具清單

## 可用的瀏覽器自動化 MCP 工具

### 1. playwright-mcp
- **狀態**: ✅ 完全正常運作
- **描述**: 基於 Playwright 的瀏覽器自動化工具
- **優點**: 
  - 無需特殊設定，開箱即用
  - 功能完整且穩定
  - 支援多種瀏覽器引擎
- **功能**: 導航、截圖、點擊、輸入、執行 JavaScript 等
- **建議**: 作為主要的瀏覽器自動化工具使用

### 2. puppeteer-mcp-server  
- **狀態**: ✅ 完全正常運作（需要正確設定）
- **描述**: 基於 Puppeteer 的瀏覽器自動化工具
- **設定需求**: 需要啟動帶有遠端除錯功能的 Chrome
- **Chrome 啟動指令**:
```bash
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --remote-debugging-port=9222 \
  --no-first-run \
  --no-default-browser-check \
  --disable-default-apps \
  --disable-web-security \
  --user-data-dir=/tmp/chrome-debug-profile &
```

#### 可用功能列表:
- `puppeteer_connect_active_tab` - 連接到活動分頁
- `puppeteer_navigate` - 頁面導航
- `puppeteer_screenshot` - 截取螢幕截圖
- `puppeteer_click` - 點擊元素
- `puppeteer_fill` - 填入文字
- `puppeteer_evaluate` - 執行 JavaScript
- `puppeteer_hover` - 滑鼠懸停
- `puppeteer_select` - 選擇下拉選項

## 使用建議

1. **日常使用**: 優先使用 `playwright-mcp`，設定簡單且穩定
2. **特殊需求**: 如需 Puppeteer 特有功能，可使用 `puppeteer-mcp-server`
3. **設定順序**: 使用 puppeteer 前必須先正確啟動 Chrome 除錯模式

## 測試驗證日期
- 最後測試: 2025-07-25
- 測試環境: macOS (Darwin 24.5.0)
- 測試結果: 兩個工具都完全正常運作