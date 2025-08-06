# 技術背景與架構資訊

## 🏗️ NexusERP 前端專案架構

### 核心技術棧
- **框架**：Laravel 10+ with Blade 模板引擎
- **前端**：原生 JavaScript + Tailwind CSS + DaisyUI 組件庫
- **資料庫**：PostgreSQL
- **API 架構**：RESTful API (Laravel API 控制器)
- **本地化**：繁體中文 (zh-TW)

### 專案目錄結構
```
frontend/
├── app/Http/Controllers/Api/          # API 控制器
│   ├── PurchaseOrderController.php    # 採購單 API
│   ├── SupplierController.php         # 供應商 API  
│   └── ProductController.php          # 產品 API
├── resources/views/orders/purchase/   # 採購單頁面模板
│   ├── index.blade.php               # 列表頁面
│   ├── form.blade.php                # 創建/編輯表單
│   └── show.blade.php                # 檢視頁面
├── routes/
│   ├── api.php                       # API 路由定義
│   └── modules/orders.php            # Web 路由定義
```

## 🔄 採購單系統架構

### 數據流向
1. **Web 路由** → Blade 模板 → JavaScript → API 路由 → 控制器 → 資料庫
2. **回應路徑**：資料庫 → 控制器 → JSON 回應 → JavaScript → DOM 更新

### API 端點設計
```php
// 主要 API 端點
GET    /api/purchase-orders        # 列表 (分頁)
POST   /api/purchase-orders        # 創建
GET    /api/purchase-orders/{id}   # 檢視
PUT    /api/purchase-orders/{id}   # 更新  
DELETE /api/purchase-orders/{id}   # 刪除

// 支援 API
GET    /api/suppliers              # 供應商列表
GET    /api/products               # 產品列表
```

### 前端頁面架構
- **列表頁面** (`index.blade.php`)：動態 JavaScript 載入，已修復模擬數據問題
- **表單頁面** (`form.blade.php`)：原生表單提交，支援創建/編輯模式
- **檢視頁面** (`show.blade.php`)：**問題位置** - 可能仍使用模擬數據

## 🎨 UI/UX 設計規範

### 響應式設計
- 使用 Tailwind CSS 響應式類別
- 支援 dark mode (`dark:` 類別)
- 行動裝置優先設計原則

### 繁體中文本地化
- 所有狀態標籤：草稿、已送出、已核准、部分收貨、已完成、已取消
- 日期格式：`toLocaleDateString('zh-TW')`
- 金額格式：`$XXX.XX` 格式

### 狀態管理模式
```javascript
// 標準載入狀態處理
function loadData() {
    // 1. 顯示載入中狀態
    showLoadingState();
    
    // 2. API 請求
    fetch('/api/endpoint')
        .then(response => response.json())
        .then(data => {
            if (data.success && data.data.length > 0) {
                displayData(data.data);
            } else {
                showEmptyState();
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showErrorState();
        });
}
```

## 🔧 關鍵技術解決方案

### 分頁 API 數據處理
```javascript
// 處理 Laravel 分頁回應格式
const orders = data.data && data.data.data ? data.data.data : (data.data || []);
```

### CSRF Token 處理
```javascript
// 獲取 CSRF token
const token = document.querySelector('meta[name="csrf-token"]').getAttribute('content');

// 在請求中包含 token
fetch('/api/endpoint', {
    method: 'POST',
    headers: {
        'X-CSRF-TOKEN': token,
        'Content-Type': 'application/json',
    },
    body: JSON.stringify(data)
});
```

### 表單提交機制
- 採用原生 HTML 表單提交（非 AJAX）
- 使用 Laravel FormRequest 驗證
- 支援檔案上傳和複雜數據結構

## 🚨 已知問題與解決方案

### 已解決問題
1. ✅ **採購單列表模擬數據**：已改為動態 JavaScript 載入
2. ✅ **供應商 API 模擬數據**：已建立真實 SupplierController
3. ✅ **產品 API 模擬數據**：已建立真實 ProductController
4. ✅ **CSRF token 問題**：已修復 API 路由中間件配置

### 待解決問題
1. 🔲 **採購單檢視頁面模擬數據**：需要分析 show.blade.php 數據來源
2. 🔲 **JavaScript 新增項目按鈕本地化**：移除按鈕英文問題

## 📋 開發規範

### 程式碼品質要求
- 避免巢狀迴圈
- 使用正體中文註解和變數命名
- 嚴格禁用模擬數據，必須使用真實資料庫
- 完整的錯誤處理和用戶反饋機制

### 測試標準
- 完整 CRUD 功能測試
- 繁體中文界面驗證
- 響應式設計測試
- 數據一致性驗證