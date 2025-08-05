# OAuth 社交登入設定指南

## 概述

NexusERP 已完整實作 Google 和 LINE OAuth 社交登入功能。本文件說明如何配置這些功能。

## 已完成的後端實作

✅ **Laravel Socialite** - 已安裝和配置
✅ **LINE Provider** - 已安裝 SocialiteProviders/Line
✅ **數據庫遷移** - User 表已包含 google_id, line_id, avatar 欄位
✅ **路由配置** - OAuth 路由已設定
✅ **控制器實作** - SocialAuthController 已完整實作
✅ **服務配置** - config/services.php 已設定

## 環境配置

### 1. Google OAuth 設定

1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 創建新專案或選擇現有專案
3. 啟用 Google+ API
4. 創建 OAuth 2.0 憑證
5. 設定授權重定向 URI: `http://your-domain.com/auth/google/callback`

在 `.env` 文件中添加：

```bash
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://your-domain.com/auth/google/callback
```

### 2. LINE OAuth 設定

1. 前往 [LINE Developers Console](https://developers.line.biz/)
2. 創建 LINE Login Channel
3. 設定 Callback URL: `http://your-domain.com/auth/line/callback`
4. 取得 Channel ID 和 Channel Secret

在 `.env` 文件中添加：

```bash
LINE_CHANNEL_ID=your_line_channel_id
LINE_CHANNEL_SECRET=your_line_channel_secret
LINE_REDIRECT_URI=http://your-domain.com/auth/line/callback
```

## 測試確認

### 當前測試結果

1. **Google OAuth**:
   - ✅ 路由功能正常
   - ✅ 成功重定向到 Google OAuth
   - ✅ 錯誤處理正確（缺少憑證時顯示適當錯誤）

2. **LINE OAuth**:
   - ✅ 後端實作完整
   - ⚠️ 需要配置 LINE 憑證進行測試

### 功能特點

- **自動用戶創建**: OAuth 用戶會自動在系統中創建帳戶
- **現有用戶連結**: 如果郵件地址已存在，會連結到現有帳戶
- **頭像同步**: 從 OAuth 提供者同步用戶頭像
- **錯誤處理**: 完整的錯誤處理和用戶友好的錯誤訊息

## 使用方式

用戶可以透過以下方式使用 OAuth 登入：

1. 訪問登入頁面 `/login`
2. 點擊 "使用 Google 帳號登入" 或 "使用 LINE 帳號登入"
3. 完成 OAuth 授權流程
4. 自動登入並重定向到 Dashboard

## 安全考慮

- OAuth 用戶的密碼是隨機生成的，確保安全
- Email 驗證狀態自動設為已驗證
- 支持用戶透過郵件地址連結多個 OAuth 帳戶

## 故障排除

### 常見問題

1. **"Missing required parameter: client_id"**
   - 檢查 `.env` 文件中的 `GOOGLE_CLIENT_ID` 是否設定

2. **"The redirect URI in the request does not match"**
   - 確保 OAuth 應用中的重定向 URI 與 `.env` 設定一致

3. **LINE 登入失敗**
   - 確認 LINE Channel 已正確配置
   - 檢查 Callback URL 設定

## 參考連結

- [Laravel Socialite 文檔](https://laravel.com/docs/10.x/socialite)
- [Google OAuth 文檔](https://developers.google.com/identity/protocols/oauth2)
- [LINE Login 文檔](https://developers.line.biz/en/docs/line-login/)