# TaskMaster 任務驗收標準

基於 2025-07-24 端到端測試報告建立的客觀驗收標準

## 🎯 總體驗收準則

### 基本功能驗收標準
- ✅ **路由可存取性**: 所有頁面路由返回 200 狀態碼，無 404 或 500 錯誤
- ✅ **API 端點正常**: 所有 API 端點正確回應，返回有效 JSON 資料
- ✅ **使用者介面完整**: 頁面顯示預期內容，無空白頁面或錯誤訊息
- ✅ **基本功能操作**: CRUD 操作（新增、讀取、更新、刪除）功能正常

### 品質標準門檻
- **最低通過標準**: 85% 功能完整度
- **效能要求**: 頁面載入時間 < 3 秒
- **相容性要求**: 支援桌面、平板、手機三種裝置

---

## 📋 各模組具體驗收標準

### 1. 🔐 使用者認證模組
**測試報告狀態**: 75% 通過 → **目標**: 95% 通過

#### 必須通過的測試項目：
- [x] 登入頁面正確載入和顯示
- [x] 無效登入顯示正確錯誤訊息
- [x] 有效登入成功重定向到儀表板
- [ ] **登出功能正常可見和點擊** ⚠️ 當前問題
- [x] 會話狀態正確維持

#### 驗收條件：
```bash
# 必須通過的測試指令
curl -X POST http://127.0.0.1:8000/login -d "email=test@example.com&password=password123"
# 預期: 成功重定向，返回 302 狀態碼

# 登出功能檢查
playwright test --grep "logout button visible and clickable"
# 預期: 測試通過，登出按鈕可見且功能正常
```

### 2. 📦 庫存管理模組  
**測試報告狀態**: 75% 完整度 → **目標**: 90% 完整度

#### 必須修復的問題：
- [ ] **API 端點配置**: 修復 `localhost:8080` → `127.0.0.1:8000`
- [ ] **資料載入功能**: 確保庫存水準資料正確顯示
- [x] 頁面結構和搜尋功能已正常

#### 驗收條件：
```bash
# API 端點測試
curl http://127.0.0.1:8000/api/inventory/levels
# 預期: 返回 200 狀態碼和有效的庫存資料 JSON

# 前端功能測試
playwright test --grep "inventory page loads data correctly"
# 預期: 頁面顯示庫存列表，無空白狀態
```

### 3. 👥 供應商管理模組
**測試報告狀態**: 60% 完整度 → **目標**: 90% 完整度

#### 必須修復的問題：
- [ ] **API 路由實作**: 實作 `GET /api/suppliers` 端點
- [ ] **伺服器錯誤修復**: 解決 500 錯誤
- [ ] **新增功能完善**: 實作新增供應商按鈕和表單

#### 驗收條件：
```bash
# API 端點測試
curl http://127.0.0.1:8000/api/suppliers
# 預期: 返回 200 狀態碼和供應商列表 JSON

# 完整功能測試
playwright test --grep "suppliers CRUD operations"
# 預期: 可以成功新增、查看、編輯、刪除供應商
```

### 4. 🏢 客戶管理模組
**測試報告狀態**: 70% 完整度 → **目標**: 90% 完整度

#### 必須修復的問題：
- [ ] **API 路由實作**: 實作 `GET /api/customers` 端點  
- [ ] **JSON 解析修復**: 修復前端資料處理邏輯
- [ ] **資料載入功能**: 確保客戶列表正確顯示

#### 驗收條件：
```bash
# API 端點測試
curl http://127.0.0.1:8000/api/customers
# 預期: 返回 200 狀態碼和客戶列表 JSON

# 資料顯示測試
playwright test --grep "customers list displays correctly"
# 預期: 頁面顯示客戶列表，無 JSON 解析錯誤
```

### 5. 📋 訂單管理模組
**測試報告狀態**: 40% 完整度 → **目標**: 90% 完整度

#### 必須重新實作的功能：
- [ ] **路由系統**: 修復 404 錯誤，實作完整路由
- [ ] **控制器邏輯**: 實作訂單控制器
- [ ] **視圖模板**: 建立訂單管理介面
- [ ] **API 端點**: 實作訂單相關 API

#### 驗收條件：
```bash
# 路由存取測試
curl http://127.0.0.1:8000/orders
# 預期: 返回 200 狀態碼，顯示訂單列表頁面

# 完整工作流程測試
playwright test --grep "order management workflow"
# 預期: 可以創建、查看、更新訂單狀態
```

### 6. 📊 報表模組
**測試報告狀態**: 45% 完整度 → **目標**: 85% 完整度

#### 必須重新實作的功能：
- [ ] **後端邏輯**: 修復 500 錯誤，實作報表數據聚合
- [ ] **報表選項**: 添加缺失的報表類型選擇
- [ ] **圖表顯示**: 實作資料視覺化功能

#### 驗收條件：
```bash
# 報表頁面載入測試
curl http://127.0.0.1:8000/reports
# 預期: 返回 200 狀態碼，無 500 錯誤

# 報表功能測試
playwright test --grep "reports display with charts"
# 預期: 報表頁面顯示圖表和統計資料
```

---

## 🔍 架構一致性驗收標準

### Laravel 架構合規檢查
#### 必須使用的技術棧：
- ✅ **後端**: Go/Gin API 服務
- ✅ **前端**: PHP/Laravel + Blade 模板
- ✅ **樣式**: Tailwind CSS + Bootstrap 組件
- ✅ **互動**: Alpine.js（輕量級）+ 傳統 AJAX

#### 禁止使用的技術：
- ❌ Vue.js 單頁應用程式
- ❌ React 或其他 SPA 框架  
- ❌ 複雜的前端路由系統
- ❌ 自定義 JavaScript 組件框架

### 文件結構驗收標準
```
frontend/
├── resources/views/
│   ├── layouts/app.blade.php    ✅ 使用 @extends 語法
│   ├── products/index.blade.php ✅ 標準 Blade 模板
│   └── components/              ✅ Blade 組件
├── routes/web.php               ✅ Laravel 路由
└── app/Http/Controllers/        ✅ 標準控制器

❌ 不應存在:
├── src/router/                  ❌ SPA 路由
├── src/components/*.vue         ❌ Vue 組件  
└── resources/js/nx-*.js         ❌ 自定義組件框架
```

---

## 🧪 測試執行驗收流程

### 1. 自動化測試驗收
```bash
# 執行完整的端到端測試
npm run test:e2e

# 預期結果:
# - 所有路由返回 200 狀態碼
# - 所有 API 端點正常回應
# - 無 JavaScript 控制台錯誤
# - 總體通過率 > 85%
```

### 2. 手動驗收測試
```bash
# 登入測試帳號
Email: test@example.com
Password: password123

# 檢查清單:
□ 可以成功登入和登出
□ 各模組頁面正常載入
□ 資料列表正確顯示
□ 新增/編輯表單功能正常
□ 所有按鈕和連結可點擊
```

### 3. 效能驗收標準
- **頁面載入時間**: < 1 秒（優秀）, < 3 秒（可接受）
- **API 回應時間**: < 500ms  
- **前端互動響應**: < 100ms

### 4. 相容性驗收標準
- **桌面瀏覽器**: Chrome, Firefox, Safari
- **行動裝置**: iOS Safari, Android Chrome
- **螢幕解析度**: 1920×1080, 1024×768, 375×667

---

## 📝 任務完成驗收檢查表

### TaskMaster 狀態更新規則
```bash
# 開始任務時
task-master set-status --id=<task-id> --status=in-progress

# 完成任務前必須執行的檢查
1. 執行對應的自動化測試 ✅
2. 通過手動功能驗收 ✅  
3. 確認無架構違規 ✅
4. 更新任務實作記錄 ✅

# 只有在全部檢查通過後才能標記完成
task-master set-status --id=<task-id> --status=done
```

### 驗收失敗處理流程
```bash
# 如果驗收失敗
task-master set-status --id=<task-id> --status=pending
task-master update-subtask --id=<task-id> --prompt="驗收失敗原因和需要修復的具體問題"

# 記錄失敗原因到任務記錄
task-master update-task --id=<task-id> --prompt="根據驗收標準發現的問題和修復計劃"
```

---

## 🎯 專案整體驗收目標

### 短期目標 (1週內)
- **API 路由修復**: 所有 API 端點返回正確狀態碼
- **核心功能恢復**: 庫存、供應商、客戶模組基本功能正常
- **測試通過率**: 提升至 80%+

### 中期目標 (2週內)  
- **訂單模組重建**: 完整實作訂單管理功能
- **報表功能完善**: 修復後端邏輯，實作基本報表
- **測試通過率**: 提升至 85%+

### 長期目標 (1個月內)
- **功能完整性**: 所有模組達到 90%+ 完整度
- **架構一致性**: 完全符合 Laravel 技術架構
- **測試通過率**: 達到 90%+ 優秀級別

---

*最後更新: 2025-07-24*  
*基於: NexusERP E2E 測試報告 & TaskMaster 規劃分析*  
*目的: 建立客觀、可量化的任務驗收標準*