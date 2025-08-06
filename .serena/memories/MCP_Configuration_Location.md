# MCP 伺服器配置檔案位置

## 正確的 MCP 配置檔案位置

**主要配置檔案**: `/Users/gamepig/.claude.json`

這是 Claude Code 實際讀取的 MCP 伺服器配置檔案，而不是其他可能存在的配置檔案。

## 其他 MCP 配置檔案位置（參考用）

1. **Claude Desktop 配置**: `/Users/gamepig/Library/Application Support/Claude/claude_desktop_config.json`
2. **Claude Code 用戶配置**: `/Users/gamepig/.claude/claude_desktop_config.json`  
3. **專案特定配置**: `/Users/gamepig/projects/NexusERP/.mcp.json`

## 重要注意事項

- Claude Code 的 `/mcp` 命令會顯示來自 `/Users/gamepig/.claude.json` 的 MCP 伺服器
- 專案內的 `.mcp.json` 檔案是專案特定的配置，會與全域配置合併
- 修改 MCP 設定時必須確認修改正確的檔案

## 成功移除的 MCP 伺服器

已從 `/Users/gamepig/.claude.json` 中移除：
- `browser-tools-mcp`
- `graphiti-mcp` 
- `zen`

## 驗證配置方法

使用 `claude /mcp` 命令檢查目前的 MCP 伺服器清單。