# LINE 開發者應用設置指南

## 概述
本指南將協助您設置 LINE Login 功能所需的開發者應用程式和 OAuth 憑證。

## 前置需求
- 有效的 LINE 帳號
- NexusERP 應用程式的生產環境或測試環境 URL

## 設置步驟

### 1. 訪問 LINE Developers Console
1. 前往 [LINE Developers Console](https://developers.line.biz/)
2. 使用您的 LINE 帳號登入

### 2. 建立 Provider（如果您還沒有）
1. 點選 "Create a new provider"
2. 輸入 Provider 名稱（例如：NexusERP）
3. 填寫相關資訊並送出

### 3. 建立 Channel
1. 在您的 Provider 下，點選 "Create a new channel"
2. 選擇 "LINE Login"
3. 填寫以下資訊：
   - **Channel name**: NexusERP Login
   - **Channel description**: LINE Login for NexusERP business management system
   - **App type**: Web app
   - **Email address**: 您的聯絡電子郵件

### 4. 配置 Channel 設定
1. 在 "Basic settings" 標籤中：
   - 記錄 **Channel ID**
   - 記錄 **Channel Secret**

2. 在 "LINE Login" 標籤中：
   - **Callback URL**: 添加您的回調 URL
     - 開發環境：`http://localhost:8000/auth/line/callback`
     - 測試環境：`https://your-test-domain.com/auth/line/callback`
     - 生產環境：`https://your-domain.com/auth/line/callback`

3. 在 "Permissions" 部分：
   - 勾選 `profile`
   - 勾選 `openid`
   - 勾選 `email`（如果需要）

### 5. 應用程式配置

將獲得的憑證添加到您的 `.env` 檔案中：

```env
# LINE OAuth Configuration
LINE_CHANNEL_ID=your_channel_id_here
LINE_CHANNEL_SECRET=your_channel_secret_here
LINE_REDIRECT_URI=http://localhost:8000/auth/line/callback
```

### 6. 安裝必要套件

確保已安裝 Laravel Socialite 和 LINE provider：

```bash
# 安裝 Laravel Socialite
composer require laravel/socialite

# 安裝 LINE provider
composer require socialiteproviders/line
```

### 7. 設定 Service Provider

在 `config/app.php` 中加入 LINE service provider：

```php
'providers' => [
    // ... 其他 providers
    \SocialiteProviders\Line\LineExtendSocialite::class,
],
```

### 8. 設定事件監聽器

在 `app/Providers/EventServiceProvider.php` 中：

```php
protected $listen = [
    \SocialiteProviders\Manager\SocialiteWasCalled::class => [
        'SocialiteProviders\Line\LineExtendSocialite@handle',
    ],
];
```

## 測試配置

1. 啟動您的 Laravel 應用程式
2. 訪問註冊頁面 (`/register`)
3. 點選 "使用 LINE 帳號註冊" 按鈕
4. 確認重導向到 LINE 授權頁面
5. 完成授權後確認重導向回應用程式

## 疑難排解

### 常見問題

1. **"invalid_request" 錯誤**
   - 檢查 Callback URL 是否正確設置
   - 確認 Channel ID 和 Channel Secret 是否正確

2. **"unauthorized_client" 錯誤**
   - 檢查 LINE Login Channel 是否已啟用
   - 確認請求的權限範圍是否已在 Channel 中設置

3. **SSL 相關錯誤**
   - 生產環境必須使用 HTTPS
   - 確認 SSL 證書有效

### 除錯模式

在開發過程中，您可以啟用 Laravel 的除錯模式來查看詳細錯誤：

```env
APP_DEBUG=true
LOG_LEVEL=debug
```

## 安全注意事項

1. **保護敏感資訊**：
   - 絕不要將 Channel Secret 提交到版本控制系統
   - 使用環境變數管理敏感配置

2. **Callback URL 安全**：
   - 僅設置信任的 Callback URL
   - 在生產環境中使用 HTTPS

3. **權限範圍**：
   - 僅請求應用程式需要的最小權限
   - 定期檢查和更新權限設置

## 支援資源

- [LINE Login Documentation](https://developers.line.biz/en/docs/line-login/)
- [LINE Developers FAQ](https://developers.line.biz/en/faq/)
- [Laravel Socialite Documentation](https://laravel.com/docs/socialite)
- [SocialiteProviders LINE Documentation](https://socialiteproviders.com/Line/)