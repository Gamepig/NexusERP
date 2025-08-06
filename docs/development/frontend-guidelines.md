# NexusERP 前端開發規範
## Laravel 原生架構開發指南

**版本**: 2.0  
**建立日期**: 2025-07-24  
**適用範圍**: 所有前端開發工作

---

## 🎯 **技術架構總覽**

### 核心技術棧
```yaml
前端框架: Laravel 11 + Blade 模板引擎
CSS 框架: Tailwind CSS 3 + Bootstrap 5
JavaScript: Alpine.js 3 (輕量級互動)
表格組件: Bootstrap DataTables
圖表庫: Chart.js 4
建置工具: Vite 5
包管理: npm
```

### 禁用技術清單
```yaml
❌ 嚴格禁止使用:
  - Vue.js / React / Angular (SPA 框架)
  - 自定義 nx- JavaScript 組件系統  
  - TypeScript (保持 JavaScript 簡潔)
  - jQuery (除非 Bootstrap 必要依賴)
  - 複雜的前端路由系統
  - 自定義 CSS 框架
```

---

## 📁 **專案目錄結構規範**

### 標準目錄結構
```
frontend/
├── resources/
│   ├── views/                          # Blade 模板
│   │   ├── layouts/
│   │   │   ├── app.blade.php          # 主應用佈局
│   │   │   ├── guest.blade.php        # 訪客佈局
│   │   │   └── components/            # 佈局組件
│   │   ├── components/                # 可重用 Blade 組件
│   │   │   ├── data-table.blade.php   # 標準資料表格
│   │   │   ├── modal.blade.php        # 標準彈窗
│   │   │   ├── form/                  # 表單組件
│   │   │   └── ui/                    # UI 組件
│   │   ├── products/                  # 商品模組視圖
│   │   │   ├── index.blade.php
│   │   │   ├── create.blade.php
│   │   │   ├── edit.blade.php
│   │   │   └── show.blade.php
│   │   ├── suppliers/                 # 供應商模組視圖
│   │   ├── customers/                 # 客戶模組視圖
│   │   └── orders/                    # 訂單模組視圖
│   ├── js/
│   │   ├── app.js                     # 主應用入口
│   │   ├── bootstrap.js               # Bootstrap + Alpine 初始化
│   │   └── modules/                   # 模組專用 JavaScript
│   │       ├── products.js
│   │       ├── suppliers.js
│   │       └── customers.js
│   ├── css/
│   │   ├── app.css                    # Tailwind 主檔案
│   │   └── components/                # 組件專用樣式
│   └── images/                        # 靜態圖片資源
├── routes/
│   ├── web.php                        # Web 路由 (Blade 頁面)
│   └── api.php                        # API 路由 (JSON 回應)
├── tailwind.config.js                 # Tailwind 配置
├── vite.config.js                     # Vite 建置配置
└── package.json                       # NPM 依賴管理
```

---

## 🔧 **開發規範與最佳實踐**

### Blade 模板開發規範

#### 1. 檔案命名規範
```php
// ✅ 正確命名
resources/views/products/index.blade.php
resources/views/components/data-table.blade.php
resources/views/layouts/app.blade.php

// ❌ 錯誤命名  
resources/views/productList.blade.php
resources/views/product_detail.blade.php
resources/views/ProductForm.blade.php
```

#### 2. 模板結構規範
```php
{{-- ✅ 標準頁面結構 --}}
@extends('layouts.app')

@section('title', '商品管理')

@section('content')
<div class="container-fluid px-4">
    {{-- 頁面標題 --}}
    <div class="d-flex justify-content-between align-items-center mb-4">
        <h1 class="h3 text-gray-800">商品管理</h1>
        <button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#createModal">
            新增商品
        </button>
    </div>
    
    {{-- 主要內容 --}}
    <div class="card shadow">
        <div class="card-body">
            {{-- 使用標準組件 --}}
            <x-data-table 
                :headers="['名稱', '分類', '價格', '庫存', '操作']"
                :data="$products"
                :actions="['edit' => '編輯', 'delete' => '刪除']"
            />
        </div>
    </div>
</div>
@endsection

@push('scripts')
<script src="{{ asset('js/modules/products.js') }}"></script>
@endpush
```

#### 3. 組件開發規範
```php
{{-- resources/views/components/data-table.blade.php --}}
@props([
    'headers' => [],
    'data' => [],
    'actions' => [],
    'searchable' => true,
    'sortable' => true,
    'pageable' => true
])

<div class="table-responsive">
    @if($searchable)
    <div class="mb-3">
        <input type="text" class="form-control" id="tableSearch" placeholder="搜尋...">
    </div>
    @endif
    
    <table class="table table-striped table-hover" 
           data-toggle="table"
           @if($searchable) data-search="true" @endif
           @if($sortable) data-sortable="true" @endif
           @if($pageable) data-pagination="true" @endif>
        <thead class="table-dark">
            <tr>
                @foreach($headers as $header)
                <th data-sortable="true">{{ $header }}</th>
                @endforeach
                @if(count($actions) > 0)
                <th>操作</th>
                @endif
            </tr>
        </thead>
        <tbody>
            {{ $slot }}
        </tbody>
    </table>
</div>
```

### JavaScript 開發規範

#### 1. Alpine.js 使用規範
```javascript
// ✅ 正確的 Alpine.js 使用方式
<div x-data="productManager()">
    <button @click="openCreateModal()" class="btn btn-primary">
        新增商品
    </button>
    
    <div x-show="showModal" class="modal">
        <form @submit.prevent="saveProduct()">
            <input x-model="form.name" type="text" class="form-control">
            <button type="submit" :disabled="loading">
                <span x-show="loading">儲存中...</span>
                <span x-show="!loading">儲存</span>
            </button>
        </form>
    </div>
</div>

<script>
function productManager() {
    return {
        showModal: false,
        loading: false,
        form: { name: '', price: '' },
        
        openCreateModal() {
            this.showModal = true;
            this.form = { name: '', price: '' };
        },
        
        async saveProduct() {
            this.loading = true;
            try {
                const response = await fetch('/api/products', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
                    },
                    body: JSON.stringify(this.form)
                });
                
                if (response.ok) {
                    window.location.reload();
                }
            } catch (error) {
                console.error('儲存失敗:', error);
            } finally {
                this.loading = false;
            }
        }
    }
}
</script>
```

#### 2. 模組化 JavaScript 結構
```javascript
// resources/js/modules/products.js
window.ProductsModule = (function() {
    'use strict';
    
    // 私有變數
    let dataTable;
    let currentProduct = null;
    
    // 私有方法
    function initDataTable() {
        dataTable = $('#productsTable').DataTable({
            processing: true,
            serverSide: true,
            ajax: '/api/products',
            columns: [
                { data: 'name', name: 'name' },
                { data: 'category', name: 'category' },
                { data: 'price', name: 'price' },
                { data: 'stock', name: 'stock' },
                { data: 'actions', name: 'actions', orderable: false }
            ],
            language: {
                url: '/js/datatable-zh-TW.json'
            }
        });
    }
    
    function bindEvents() {
        // 新增商品事件
        $(document).on('click', '.btn-create-product', function() {
            openCreateModal();
        });
        
        // 編輯商品事件
        $(document).on('click', '.btn-edit-product', function() {
            const productId = $(this).data('id');
            editProduct(productId);
        });
        
        // 刪除商品事件
        $(document).on('click', '.btn-delete-product', function() {
            const productId = $(this).data('id');
            deleteProduct(productId);
        });
    }
    
    // 公開方法
    function init() {
        initDataTable();
        bindEvents();
    }
    
    function openCreateModal() {
        $('#productModal').modal('show');
        $('#productForm')[0].reset();
        currentProduct = null;
    }
    
    function editProduct(productId) {
        fetch(`/api/products/${productId}`)
            .then(response => response.json())
            .then(product => {
                currentProduct = product;
                fillForm(product);
                $('#productModal').modal('show');
            });
    }
    
    function deleteProduct(productId) {
        if (confirm('確定要刪除此商品？')) {
            fetch(`/api/products/${productId}`, {
                method: 'DELETE',
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
                }
            })
            .then(response => {
                if (response.ok) {
                    dataTable.ajax.reload();
                    showNotification('商品已刪除', 'success');
                }
            });
        }
    }
    
    // 返回公開介面
    return {
        init: init,
        openCreateModal: openCreateModal,
        editProduct: editProduct,
        deleteProduct: deleteProduct
    };
})();

// 頁面載入完成後初始化
document.addEventListener('DOMContentLoaded', function() {
    if (typeof ProductsModule !== 'undefined') {
        ProductsModule.init();
    }
});
```

### CSS 開發規範

#### 1. Tailwind CSS 使用規範
```css
/* ✅ 正確的 Tailwind 使用方式 */
.product-card {
    @apply bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow;
}

.btn-primary-custom {
    @apply bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition-colors;
}

/* ❌ 避免大量重複的 utility classes */
```

#### 2. 組件樣式結構
```css
/* resources/css/components/data-table.css */
.nx-data-table {
    @apply w-full bg-white rounded-lg shadow;
}

.nx-data-table th {
    @apply bg-gray-50 text-gray-700 font-semibold text-sm uppercase tracking-wider px-6 py-3;
}

.nx-data-table td {
    @apply px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-b border-gray-200;
}

.nx-data-table tbody tr:hover {
    @apply bg-gray-50;
}
```

---

## 🧩 **標準組件庫**

### 1. 資料表格組件 (data-table.blade.php)
```php
{{-- 使用方式 --}}
<x-data-table 
    :url="route('api.products.index')"
    :columns="[
        ['data' => 'name', 'title' => '商品名稱', 'sortable' => true],
        ['data' => 'price', 'title' => '價格', 'sortable' => true],
        ['data' => 'actions', 'title' => '操作', 'orderable' => false]
    ]"
    search-placeholder="搜尋商品..."
    :actions="['edit', 'delete']"
/>
```

### 2. 彈窗組件 (modal.blade.php)
```php
{{-- 使用方式 --}}
<x-modal 
    id="productModal" 
    title="新增商品"
    size="lg"
    :show-footer="true">
    
    <x-slot name="body">
        <form id="productForm">
            <!-- 表單內容 -->
        </form>
    </x-slot>
    
    <x-slot name="footer">
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
        <button type="submit" class="btn btn-primary" form="productForm">儲存</button>
    </x-slot>
</x-modal>
```

### 3. 表單組件 (form/input.blade.php)
```php
{{-- 使用方式 --}}
<x-form.input 
    name="product_name"
    label="商品名稱"
    :value="old('product_name', $product->name ?? '')"
    placeholder="請輸入商品名稱"
    required
    :error="$errors->first('product_name')"
/>
```

---

## ✅ **程式碼品質檢查**

### 1. 必要檢查項目
```bash
# Blade 模板檢查
- [ ] 使用正確的 @extends 語法
- [ ] 正確的 @section 結構
- [ ] 適當的註解說明
- [ ] 正確的元件使用方式

# JavaScript 檢查  
- [ ] 遵循模組化結構
- [ ] 正確的錯誤處理
- [ ] 適當的註解說明
- [ ] 符合 ES6+ 標準

# CSS 檢查
- [ ] 使用 Tailwind utility classes
- [ ] 適當的組件抽象
- [ ] 響應式設計考量
- [ ] 無重複樣式
```

### 2. 效能檢查項目
```bash
# 載入效能
- [ ] 圖片經過壓縮優化
- [ ] JavaScript 檔案已分割載入
- [ ] CSS 經過 PurgeCSS 優化
- [ ] 使用適當的快取策略

# 執行效能
- [ ] DOM 操作已優化
- [ ] 事件監聽器適當綁定/解綁
- [ ] AJAX 請求包含適當的載入狀態
- [ ] 無記憶體洩漏問題
```

---

## 🔧 **開發工具配置**

### 1. Vite 配置 (vite.config.js)
```javascript
import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';

export default defineConfig({
    plugins: [
        laravel({
            input: [
                'resources/css/app.css',
                'resources/js/app.js'
            ],
            refresh: true,
        }),
    ],
    resolve: {
        alias: {
            '@': '/resources/js',
            '@css': '/resources/css',
            '@components': '/resources/views/components'
        }
    }
});
```

### 2. Tailwind 配置 (tailwind.config.js)
```javascript
module.exports = {
    content: [
        "./resources/**/*.blade.php",
        "./resources/**/*.js",
        "./resources/**/*.vue",
    ],
    theme: {
        extend: {
            colors: {
                'nexus-blue': '#3B82F6',
                'nexus-green': '#10B981',
                'nexus-red': '#EF4444',
                'nexus-gray': '#6B7280'
            },
            fontFamily: {
                'sans': ['Inter', 'ui-sans-serif', 'system-ui']
            }
        },
    },
    plugins: [
        require('@tailwindcss/forms'),
        require('@tailwindcss/typography'),
    ],
}
```

---

## 📋 **程式碼審查清單**

### 提交前檢查
```markdown
- [ ] 程式碼符合專案風格指南
- [ ] 所有 console.log 已移除
- [ ] 錯誤處理適當完整
- [ ] 無硬編碼的 URL 或設定值
- [ ] 適當的註解和文件
- [ ] 響應式設計已測試
- [ ] 無障礙性基本要求符合
- [ ] 瀏覽器相容性已確認
```

### 安全檢查
```markdown
- [ ] 所有 AJAX 請求包含 CSRF Token
- [ ] 使用者輸入經過適當驗證
- [ ] 敏感資訊不在前端暴露
- [ ] XSS 防護已實作
- [ ] 適當的權限檢查
```

---

## 🚀 **部署與優化**

### 生產環境優化
```bash
# 建置優化
npm run build

# 資源優化檢查
- [ ] JavaScript 檔案已壓縮
- [ ] CSS 檔案已壓縮
- [ ] 圖片檔案已壓縮
- [ ] 無未使用的程式碼
- [ ] 適當的快取頭設定
```

### 效能監控
```javascript
// 效能監控腳本
function trackPageLoad() {
    window.addEventListener('load', function() {
        const perfData = performance.getEntriesByType('navigation')[0];
        const loadTime = perfData.loadEventEnd - perfData.loadEventStart;
        
        if (loadTime > 3000) {
            console.warn(`頁面載入時間過長: ${loadTime}ms`);
        }
    });
}
```

---

**文件維護**: 本文件隨專案發展持續更新  
**適用版本**: Laravel 11+, PHP 8.2+, Node.js 18+  
**最後更新**: 2025-07-24