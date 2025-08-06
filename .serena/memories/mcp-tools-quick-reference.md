# MCP 工具快速參考

## 🔧 目前可用的 MCP 工具

### 1. Puppeteer MCP Server
**用途**: 瀏覽器自動化與網頁操作
**狀態**: ✅ 已安裝並配置
**命令**: `mcp-server-puppeteer`

**主要功能**:
- 網頁導航 (`puppeteer_navigate`)
- 截圖 (`puppeteer_screenshot`)
- 元素互動 (`puppeteer_click`, `puppeteer_fill`)
- JavaScript 執行 (`puppeteer_evaluate`)
- Chrome 連接 (`puppeteer_connect_active_tab`)

### 2. Graphiti MCP
**用途**: 知識圖譜與記憶管理
**狀態**: ✅ 已配置
**功能**: 資料存儲、搜尋、關係建立

### 3. Zen MCP Server 
**用途**: 本地 Ollama AI 模型整合
**狀態**: ✅ 已配置
**模型**: gemma3:4b

### 4. Serena MCP
**用途**: 程式碼分析與專案管理
**狀態**: ✅ 已配置
**功能**: 符號搜尋、程式碼操作、記憶管理

## 🚀 快速啟用指令

### Puppeteer 瀏覽器自動化
```bash
# 啟用 Chrome 遠端除錯 (可選)
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222
```

### 檢查 MCP 配置
```bash
# 檢視當前 MCP 配置
cat .mcp.json
```

## 📖 詳細文件參考

- `puppeteer-mcp-server-usage-guide` - Puppeteer 完整使用指南
- 各 MCP 伺服器的 README.md 檔案

---
*快速參考 - 包含所有已配置的 MCP 工具概覽*