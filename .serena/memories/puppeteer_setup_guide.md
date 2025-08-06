# Puppeteer MCP Server 設定指南

## 問題描述
puppeteer-mcp-server 需要 Chrome 啟用遠端除錯功能才能正常運作，預設情況下會連接失敗。

## 解決方案

### 步驟 1: 完全關閉 Chrome
```bash
pkill -f "Google Chrome" && pkill -f "chrome" && pkill -f "Chromium" || true
```

### 步驟 2: 啟動 Chrome 除錯模式
```bash
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --remote-debugging-port=9222 \
  --no-first-run \
  --no-default-browser-check \
  --disable-default-apps \
  --disable-web-security \
  --user-data-dir=/tmp/chrome-debug-profile >/dev/null 2>&1 &
```

### 步驟 3: 驗證設定
```bash
# 檢查 Chrome 除錯 API
curl -s http://localhost:9222/json/version

# 檢查可用頁面
curl -s http://localhost:9222/json
```

### 步驟 4: 連接 Puppeteer
使用 `mcp__puppeteer-mcp-server__puppeteer_connect_active_tab` 連接到瀏覽器。

## 關鍵參數說明
- `--remote-debugging-port=9222`: 啟用遠端除錯，指定端口
- `--no-first-run`: 跳過首次執行設定
- `--no-default-browser-check`: 跳過預設瀏覽器檢查
- `--disable-default-apps`: 停用預設應用程式
- `--disable-web-security`: 停用網頁安全限制（測試用）
- `--user-data-dir=/tmp/chrome-debug-profile`: 使用臨時使用者資料目錄

## 常見錯誤
1. **"Failed to connect to Chrome debugging port 9222"**
   - 原因: Chrome 未正確啟動除錯模式
   - 解決: 按照步驟 1-2 重新設定

2. **"fetch failed"**
   - 原因: Chrome 進程存在但除錯端口未開啟
   - 解決: 完全關閉 Chrome 後重新啟動

## 驗證成功標誌
- `curl http://localhost:9222/json/version` 回傳 JSON 格式的瀏覽器資訊
- `ps aux | grep "remote-debugging-port=9222"` 顯示除錯模式的 Chrome 進程

## 適用環境
- macOS (已驗證)
- 可能需要調整 Chrome 路徑於其他作業系統