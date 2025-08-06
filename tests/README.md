# NexusERP Playwright Testing Framework

## 🎯 Overview

這是為 NexusERP Laravel 應用程式設計的全面 Playwright 測試框架，提供端到端 (E2E) 功能測試，確保系統品質和可靠性。

## 📋 Features

### ✨ 核心功能
- 🔐 **完整認證測試** - 登入、登出、會話管理
- 👥 **客戶管理測試** - CRUD 操作、搜尋、驗證
- 📦 **產品管理測試** - 庫存、價格、分類管理
- 🏭 **供應商管理測試** - 聯絡人搜尋、資訊管理
- 🛒 **銷售訂單測試** - 訂單流程、計算邏輯

### 🛠️ 技術特色
- 🌐 **多瀏覽器支援** - Chrome、Firefox、Safari
- 📱 **響應式測試** - 桌面、平板、手機
- 🔄 **並行執行** - 快速測試執行
- 📊 **詳細報告** - HTML + JSON 格式
- 📸 **錯誤截圖** - 自動失敗診斷
- 🎥 **影片錄製** - 測試執行記錄

## 🚀 Quick Start

### 1. 環境準備

```bash
# 確保 Laravel 應用程式運行在 http://127.0.0.1:8000
php artisan serve --port=8000

# 安裝 Playwright (如果尚未安裝)
npm install @playwright/test
npx playwright install
```

### 2. 基本測試執行

```bash
# 執行所有測試
node run-comprehensive-tests.js

# 執行特定測試套件
node run-comprehensive-tests.js --suite=auth
node run-comprehensive-tests.js --suite=customers

# 在特定瀏覽器執行
node run-comprehensive-tests.js --browser=firefox

# 並行執行 (更快)
node run-comprehensive-tests.js --parallel
```

### 3. 除錯模式

```bash
# 顯示瀏覽器視窗
node run-comprehensive-tests.js --headed

# 除錯模式
node run-comprehensive-tests.js --debug

# 詳細輸出
node run-comprehensive-tests.js --verbose
```

## 📁 Directory Structure

```
tests/
├── setup/                          # 測試設置和工具
│   ├── test-setup.js               # 核心測試工具類
│   ├── global-setup.js             # 全局設置
│   └── global-teardown.js          # 全局清理
├── comprehensive/                   # 主要測試套件
│   ├── auth-tests.spec.js          # 認證測試
│   ├── customer-management-tests.spec.js  # 客戶管理測試
│   ├── product-management-tests.spec.js   # 產品管理測試
│   ├── supplier-management-tests.spec.js  # 供應商管理測試
│   └── sales-order-tests.spec.js   # 銷售訂單測試
└── README.md                       # 本文件

test-results/                       # 測試結果輸出
├── screenshots/                    # 失敗截圖
├── videos/                        # 測試錄影
├── html-report/                   # HTML 報告
├── comprehensive-test-report.html  # 主要 HTML 報告
└── *.json                         # JSON 格式結果
```

## 🧪 Test Suites

### 🔐 Authentication Tests (`auth-tests.spec.js`)

**涵蓋範圍:**
- ✅ 用戶登入流程
- ✅ 登出功能
- ✅ 無效認證處理
- ✅ 會話持久性
- ✅ 存取控制
- ✅ CSRF 保護
- ✅ 會話安全

**關鍵測試案例:**
```javascript
// 完整登入流程測試
test('Login Flow - Complete Authentication Process')

// 會話管理測試
test('Session Persistence - Browser Refresh')

// 安全測試
test('CSRF Protection - Token Validation')
```

### 👥 Customer Management Tests (`customer-management-tests.spec.js`)

**涵蓋範圍:**
- ✅ 客戶列表載入
- ✅ 客戶搜尋功能
- ✅ 新增客戶
- ✅ 表單驗證
- ✅ 分頁功能

**測試重點:**
- 電話號碼搜尋 (02-, 04- 等)
- 表單資料驗證
- CRUD 操作完整性

### 📦 Product Management Tests (`product-management-tests.spec.js`)

**涵蓋範圍:**
- ✅ 產品列表和搜尋
- ✅ 產品新增和編輯
- ✅ 庫存管理
- ✅ 價格計算
- ✅ 分類管理

**測試重點:**
- 價格和成本計算
- 庫存數量更新
- 產品代碼驗證

### 🏭 Supplier Management Tests (`supplier-management-tests.spec.js`)

**涵蓋範圍:**
- ✅ 供應商列表
- ✅ 聯絡人搜尋
- ✅ 供應商資訊管理
- ✅ 多重搜尋條件

**特色測試:**
- 聯絡人姓名搜尋 ("李先生", "John", "Manager")
- 公司類型搜尋 (Inc, Ltd, 有限公司)
- 電話和 Email 搜尋

### 🛒 Sales Order Tests (`sales-order-tests.spec.js`)

**涵蓋範圍:**
- ✅ 訂單列表和導航
- ✅ 訂單創建流程
- ✅ 價格計算邏輯
- ✅ 項目管理 (新增/刪除)
- ✅ 表單提交和驗證

**計算測試:**
```
數量(2) × 單價(85000) = 小計(170000) + 稅額(8500) = 總計(178500)
```

## 🛠️ Testing Utilities

### AuthHelper
```javascript
import { AuthHelper } from '../setup/test-setup.js';

// 登入
const result = await AuthHelper.login(page);

// 檢查認證狀態
const isAuth = await AuthHelper.isAuthenticated(page);

// 登出
await AuthHelper.logout(page);
```

### NavigationHelper
```javascript
import { NavigationHelper } from '../setup/test-setup.js';

// 安全頁面導航
const result = await NavigationHelper.goToPage(page, '/customers');

// 錯誤檢查
const errorInfo = await NavigationHelper.checkForErrors(page);
```

### FormHelper
```javascript
import { FormHelper } from '../setup/test-setup.js';

// 填寫表單
await FormHelper.fillForm(page, {
  name: '測試客戶',
  email: 'test@example.com'
});

// 提交表單
await FormHelper.submitForm(page);
```

### TestUtils
```javascript
import { TestUtils } from '../setup/test-setup.js';

// 截圖
await TestUtils.takeScreenshot(page, 'test-result');

// 等待元素
const element = await TestUtils.waitForElement(page, '.btn-submit');

// 生成測試資料
const testData = TestUtils.generateTestData('customer');
```

## ⚙️ Configuration

### Test Configuration (`TEST_CONFIG`)
```javascript
export const TEST_CONFIG = {
  baseURL: 'http://127.0.0.1:8000',
  credentials: {
    email: 'test@example.com',
    password: 'password123'
  },
  timeouts: {
    page: 30000,
    action: 15000,
    api: 10000
  }
};
```

### Browser Projects
- `chromium-desktop`: 桌面 Chrome (1920x1080)
- `firefox-desktop`: 桌面 Firefox (1920x1080)  
- `webkit-desktop`: 桌面 Safari (1920x1080)
- `tablet-chrome`: 平板 (iPad Pro)
- `mobile-chrome`: 手機 (iPhone 13)

## 📊 Reporting

### HTML Report
自動生成的互動式 HTML 報告：
- 📊 測試統計摘要
- 📋 詳細測試結果
- 📸 失敗截圖連結
- ⏱️ 執行時間分析

### JSON Report
結構化資料報告：
```json
{
  "summary": {
    "total": 25,
    "passed": 23,
    "failed": 2,
    "passRate": 92,
    "executionTime": "45s"
  },
  "results": [...],
  "environment": {...}
}
```

## 🐛 Debug & Troubleshooting

### 常見問題

#### 1. Laravel 應用程式未運行
```bash
# 啟動 Laravel
php artisan serve --port=8000
```

#### 2. 測試帳號不存在
確保資料庫有測試帳號：
- Email: `test@example.com`
- Password: `password123`

#### 3. 權限問題
```bash
# 檢查檔案權限
chmod +x run-comprehensive-tests.js
```

#### 4. 埠口衝突
確保埠口 8000 可用：
```bash
lsof -i :8000
```

### Debug 技巧

#### 1. 視覺化除錯
```bash
# 顯示瀏覽器視窗
node run-comprehensive-tests.js --headed --debug
```

#### 2. 單一測試執行
```bash
# 只執行認證測試
node run-comprehensive-tests.js --suite=auth --verbose
```

#### 3. 截圖分析
檢查 `test-results/screenshots/` 目錄中的失敗截圖

#### 4. 日誌分析
查看詳細的控制台輸出：
```bash
node run-comprehensive-tests.js --verbose 2>&1 | tee test-execution.log
```

## 🚀 Advanced Usage

### Custom Test Data
```javascript
// 自訂測試資料
const customData = {
  customer: {
    name: 'Custom Customer',
    email: 'custom@test.com',
    phone: '02-12345678'
  }
};

await FormHelper.fillForm(page, customData.customer);
```

### API Testing Integration
```javascript
// 結合 API 測試
const apiResult = await APIHelper.authenticatedRequest(page, 'GET', '/customers');
expect(apiResult.success).toBe(true);
```

### Performance Monitoring
```javascript
// 效能監控
const startTime = Date.now();
await NavigationHelper.goToPage(page, '/dashboard');
const loadTime = Date.now() - startTime;
console.log(`頁面載入時間: ${loadTime}ms`);
```

## 📈 Best Practices

### 1. 測試結構
- 🎯 每個測試專注單一功能
- 📝 清楚的測試描述和步驟
- 🔄 適當的清理和恢復

### 2. 錯誤處理
- 📸 失敗時自動截圖
- 🧹 適當的資源清理
- 📋 詳細的錯誤資訊

### 3. 維護性
- 🔧 使用通用工具函數
- 📚 文件化測試案例
- 🔄 定期更新和維護

### 4. 執行效率
- ⚡ 並行執行非相依測試
- 🎯 選擇性執行相關測試
- 📊 監控執行時間

## 🤝 Contributing

### 新增測試
1. 建立新的 `.spec.js` 檔案
2. 使用現有工具類別
3. 遵循命名規範
4. 新增適當文件

### 修改現有測試
1. 確保向後相容
2. 更新相關文件
3. 執行完整測試確保無迴歸

## 📞 Support

如需協助或有問題，請：
1. 檢查本文件的疑難排解章節
2. 查看測試執行日誌和截圖
3. 檢查 Laravel 應用程式狀態
4. 確認測試環境配置

---

**版本**: 1.0.0  
**最後更新**: 2025-01-30  
**相容性**: NexusERP Laravel Application  
**建立者**: Claude Code Assistant