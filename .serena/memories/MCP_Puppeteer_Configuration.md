# Puppeteer MCP Server 配置

## 配置完成狀態

✅ **已成功配置 puppeteer-mcp-server 到全域 MCP 設定**

## 配置詳情

**配置檔案**: `/Users/gamepig/.claude.json`

**配置內容**:
```json
"mcpServers": {
  "puppeteer-mcp-server": {
    "type": "stdio",
    "command": "mcp-server-puppeteer",
    "args": [],
    "env": {}
  }
}
```

## 安裝狀態

- **全域安裝路徑**: `/Users/gamepig/.npm-global/bin/mcp-server-puppeteer`
- **安裝狀態**: ✅ 已全域安裝

## 功能說明

Puppeteer MCP Server 提供瀏覽器自動化功能，可用於：
- 網頁截圖
- 網頁導航和操作
- 表單填寫和提交
- 頁面內容抓取
- JavaScript 執行

## 使用方法

配置完成後，重啟 Claude Code 即可在 `/mcp` 命令中看到 puppeteer-mcp-server，並可使用相關的 MCP 工具進行瀏覽器自動化操作。

## 相關資源

- GitHub: https://github.com/merajmehrabi/puppeteer-mcp-server
- 專案配置: `/Users/gamepig/projects/NexusERP/.mcp.json` (也有相同配置)