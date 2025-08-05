# 技術脈絡記錄 - NexusERP Frontend

## Laravel + Blade + JavaScript 整合架構

### 數據流架構
```
PostgreSQL → Laravel Controller → Blade Template → JavaScript → DOM
     ↑              ↑                   ↑            ↑         ↑
  數據庫查詢     數據處理與驗證        服務端渲染    客戶端邏輯   用戶界面
```

### 關鍵技術組件

#### 1. 後端數據層
- **資料庫**: PostgreSQL 
- **ORM**: Laravel DB facade (非 Eloquent)
- **多租戶**: 基於 company_id 的數據隔離
- **認證**: Laravel Auth + user_companies 關聯表

#### 2. 前端渲染層
- **模板引擎**: Laravel Blade
- **CSS 框架**: TailwindCSS + DaisyUI
- **JavaScript**: Vanilla JS (無框架)
- **建構工具**: Vite

#### 3. 測試工具
- **端到端測試**: Playwright
- **後端測試**: Laravel Testing (可用但未充分利用)

## 已知技術債務和限制

### 1. 混合渲染模式的複雜性
**現狀**: 同時使用服務端渲染 (Blade) 和客戶端邏輯 (JavaScript)

**問題**:
- 數據同步時序複雜
- 狀態管理分散
- 調試困難

**改進方向**:
- 考慮遷移到 Laravel Livewire 統一服務端渲染
- 或採用 React/Vue 統一客戶端渲染

### 2. 數據預填邏輯的脆弱性
**問題**: 依賴 DOM 載入時序，易受異步操作影響

**當前解決方案**:
```javascript
// 輪詢等待選項載入
setTimeout(() => {
    if (selectElement.options.length > 1) {
        selectElement.value = dataValue;
    }
}, delay);
```

**建議改進**:
```javascript
// Promise 基礎的載入完成檢測
function waitForOptionsReady(selectElement) {
    return new Promise(resolve => {
        const check = () => {
            if (selectElement.options.length > 1) {
                resolve();
            } else {
                setTimeout(check, 10);
            }
        };
        check();
    });
}
```

### 3. 多公司數據隔離實作
**架構**: 
- `companies` 表: 公司主數據
- `user_companies` 表: 用戶公司關聯
- `customers`, `products` 等: 包含 `company_id` 外鍵

**注意事項**:
- Session 中的 `app.current_company_id` 可能為 null
- 需要多層級回退機制確保數據隔離
- RLS (Row Level Security) 在 PostgreSQL 層面可進一步加強

### 4. PostgreSQL Row Level Security (RLS) 實作指南
**概念**: RLS 允許在資料庫層級進行細粒度的行級存取控制

**基本實作步驟**:
```sql
-- 1. 啟用 RLS
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

-- 2. 建立策略
CREATE POLICY policy_name ON table_name
    USING (condition);
    
-- 3. 強制所有用戶（包括表擁有者）遵守 RLS
ALTER TABLE table_name FORCE ROW LEVEL SECURITY;
```

**多租戶實作範例**:
```sql
-- 啟用 RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- 建立基於 company_id 的策略
CREATE POLICY company_isolation ON customers
    FOR ALL TO application_user
    USING (company_id = current_setting('app.current_company_id')::int);
    
CREATE POLICY company_isolation ON products
    FOR ALL TO application_user  
    USING (company_id = current_setting('app.current_company_id')::int);
    
-- 設置當前公司 ID (在應用程式層設置)
SET LOCAL app.current_company_id = '1';
```

**策略類型**:
- **Permissive Policies** (預設): 使用 OR 邏輯組合，任一策略允許即可存取
- **Restrictive Policies**: 使用 AND 邏輯組合，所有策略都必須通過

**策略語法要素**:
- `USING` 子句: 控制哪些行可見（SELECT 和其他操作）
- `WITH CHECK` 子句: 控制哪些行可修改（INSERT/UPDATE）
- 可針對特定命令: SELECT, INSERT, UPDATE, DELETE

**效能優化建議**:
1. 優先使用當前行值作為條件
2. 避免複雜的子查詢
3. 謹慎處理跨表引用
4. 使用索引支援策略條件

**安全注意事項**:
- 超級用戶和 BYPASSRLS 角色會繞過 RLS
- 策略表達式使用查詢用戶的權限執行
- 注意策略引用其他表時的潛在競爭條件
- 外鍵和唯一約束檢查會繞過 RLS

**測試策略**:
```sql
-- 測試不同用戶的資料可見性
SET ROLE user1;
SELECT * FROM customers; -- 應只看到該用戶公司的資料

SET ROLE user2;
SELECT * FROM customers; -- 應看到不同的資料集
```

**Laravel 整合考量**:
```php
// 在資料庫連接時設置公司 ID
DB::statement("SET app.current_company_id = ?", [session('app.current_company_id')]);

// 或使用中介層自動設置
class SetCompanyContext
{
    public function handle($request, $next)
    {
        if ($companyId = session('app.current_company_id')) {
            DB::statement("SET LOCAL app.current_company_id = ?", [$companyId]);
        }
        return $next($request);
    }
}
```

## 開發工具和流程

### 調試工具
1. **Laravel Log**: `storage/logs/laravel.log`
2. **Browser DevTools**: Console + Network
3. **Playwright Tests**: 端到端驗證
4. **Database CLI**: psql 直接查詢

### 常用調試指令
```bash
# 後端
tail -f storage/logs/laravel.log
php artisan route:clear
php artisan cache:clear

# 前端  
npx playwright test [test-file]
curl -b cookies.txt [url] # 模擬認證請求

# 資料庫
PGPASSWORD=securepassword psql -h localhost -U nexus -d nexus_erp
```

### 測試策略
1. **單元測試**: 控制器邏輯（目前缺乏）
2. **整合測試**: 資料庫查詢結果驗證
3. **端到端測試**: Playwright 完整用戶流程
4. **手動測試**: 瀏覽器真實場景驗證

## 效能考量

### 已知瓶頸
1. **N+1 查詢問題**: 訂單項目載入時可能存在
2. **前端資源載入**: 每頁重複載入 JavaScript
3. **資料庫連接**: 未使用連接池

### 優化機會
1. **資料庫查詢優化**: 使用 JOIN 減少查詢次數
2. **前端快取**: JavaScript 和 CSS 資源快取
3. **懶載入**: 大型下拉選單數據的按需載入

## PostgreSQL 進階功能

### 儲存程序與函數
PostgreSQL 支援兩種儲存程式：
- **函數 (Functions)**: 必須返回值，用於查詢和計算
- **程序 (Procedures)**: PostgreSQL 11+ 支援，可控制事務，用於批次處理

**範例：批次更新函數**
```sql
CREATE OR REPLACE FUNCTION batch_update_inventory(
  updates json[]
)
RETURNS integer AS $$
DECLARE
  v_count integer := 0;
  v_update json;
BEGIN
  FOREACH v_update IN ARRAY updates
  LOOP
    UPDATE products 
    SET quantity = (v_update->>'quantity')::integer
    WHERE id = (v_update->>'id')::integer
    AND company_id = current_setting('app.current_company_id')::int;
    
    v_count := v_count + 1;
  END LOOP;
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;
```

**Laravel 整合**
```php
// 調用儲存函數
$updatedCount = DB::selectOne(
    'SELECT batch_update_inventory(?::json[])', 
    [json_encode($updates)]
)->batch_update_inventory;

// 調用儲存程序
DB::statement('CALL process_monthly_reports(?, ?)', [$year, $month]);
```

詳細指南請參考：`memory-bank/postgresql-stored-procedures-guide.md`

## 前端互動組件架構

### Alpine.js + 傳統 JavaScript 混合模式

#### 1. Alpine.js 適用場景
- **簡單狀態管理**: 下拉選單開關、表單驗證
- **DOM 互動**: 點擊切換、懸停效果
- **小範圍響應式**: 組件內部狀態同步

```html
<!-- Alpine.js 適用範例 -->
<div x-data="{ open: false, loading: false }">
    <button @click="open = !open" :disabled="loading">
        切換選單
    </button>
    <div x-show="open" x-transition>
        <!-- 選單內容 -->
    </div>
</div>
```

#### 2. 傳統 JavaScript 適用場景
- **複雜業務邏輯**: 產品自動完成、表單數據預填
- **跨組件通信**: 全域事件系統、狀態同步
- **第三方整合**: 圖表庫、日期選擇器

```javascript
// 傳統 JavaScript 適用範例
class ProductAutocomplete {
    constructor(element, options) {
        this.element = element;
        this.options = options;
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.loadInitialData();
    }
}
```

#### 3. 導航下拉選單系統架構 (2025-08-04)
**技術棧整合範例**: Alpine.js + 全域 JavaScript 函數

**核心架構特點**:
```javascript
// 全域函數註冊解決作用域問題
window.navigationFunctions = {
    // 智能顯示：排他性行為 + 取消排程隱藏
    smartShowDropdown: function(itemId, trigger) {
        this.hideAllDropdownsExcept(itemId);
        this.cancelHideDropdown(itemId);
        this.showDropdown(itemId);
    },
    
    // 排程隱藏：300ms 延遲 + 雙重懸停檢查
    scheduleHideDropdown: function(itemId) {
        if (this.hideTimeouts.has(itemId)) {
            clearTimeout(this.hideTimeouts.get(itemId));
        }
        
        const timeoutId = setTimeout(() => {
            this.performDelayedHide(itemId);
        }, 300);
        
        this.hideTimeouts.set(itemId, timeoutId);
    },
    
    // 懸停檢測：區域容錯機制
    isHoveringOverElement: function(element) {
        if (!element) return false;
        
        const rect = element.getBoundingClientRect();
        const tolerance = 10; // 10px 容錯區域
        
        return (
            this.mouseX >= rect.left - tolerance &&
            this.mouseX <= rect.right + tolerance &&
            this.mouseY >= rect.top - tolerance &&
            this.mouseY <= rect.bottom + tolerance
        );
    }
};
```

**Alpine.js 模板整合**:
```html
<nav x-data="{}">
    <li @mouseenter="window.navigationFunctions.smartShowDropdown('products', $event.target)"
        @mouseleave="window.navigationFunctions.scheduleHideDropdown('products')">
        <a href="#">產品與庫存</a>
        <div data-dropdown-menu="products"
             @mouseenter="window.navigationFunctions.cancelHideDropdown('products')"
             @mouseleave="window.navigationFunctions.scheduleHideDropdown('products')">
            <!-- 下拉選單內容 -->
        </div>
    </li>
</nav>
```

**關鍵設計決策**:
1. **全域函數註冊**: 解決 Alpine.js 作用域限制，允許跨組件函數存取
2. **智能時機控制**: 300ms 延遲平衡使用者體驗和系統響應性
3. **雙重懸停檢查**: 防止滑鼠快速移動導致的意外關閉
4. **記憶體管理**: 使用 Map 管理延遲物件，防止記憶體洩漏
   
**效能特性**:
- **滑鼠追蹤**: 即時更新滑鼠位置，支援精確懸停檢測
- **事件最佳化**: 最小化 DOM 查詢，快取關鍵元素引用
- **狀態管理**: 清晰的狀態機模式，可預測的行為

### 混合架構最佳實踐

#### 1. 作用域管理
```javascript
// ✅ 正確：全域註冊供 Alpine.js 使用
window.appFunctions = {
    navigate: function(url) { /* ... */ },
    showModal: function(id) { /* ... */ }
};

// ❌ 錯誤：Alpine.js 無法存取模組作用域
const appFunctions = {
    navigate: function(url) { /* ... */ }
};
```

#### 2. 狀態同步
```javascript
// ✅ 正確：使用事件橋接 Alpine.js 和傳統 JS
document.addEventListener('alpine:init', () => {
    Alpine.data('productSearch', () => ({
        results: [],
        updateResults(data) {
            this.results = data;
            // 觸發全域事件
            window.dispatchEvent(new CustomEvent('search:updated', { detail: data }));
        }
    }));
});
```

#### 3. 資源載入順序
```html
<!-- ✅ 正確載入順序 -->
<script src="/js/app-globals.js"></script>    <!-- 全域函數定義 -->
<script defer src="/js/alpine.min.js"></script> <!-- Alpine.js -->
<script src="/js/page-specific.js"></script>   <!-- 頁面特定邏輯 -->
```

## Laravel Blade 模板與 CSS 整合架構

### UI 組件開發模式

#### 1. CSS 類別管理系統
**現狀**: 使用 TailwindCSS + 自定義 CSS 類別混合模式

**關鍵檔案結構**:
```
resources/
├── css/
│   ├── app.css                    # 主要樣式入口
│   └── nexus-theme.css           # 自定義主題樣式
└── views/
    └── components/
        └── layouts/
            └── enhanced-navigation.blade.php  # 導航組件
```

**自定義類別命名規範**:
```css
/* 組件類別命名模式 */
.nexus-user-trigger-modern     /* 觸發器容器 */
.nexus-user-dropdown-modern    /* 下拉選單容器 */
.nexus-user-avatar            /* 頭像顯示 */

/* 響應式設計整合 */
.hidden sm:flex sm:flex-col    /* Tailwind 響應式類別 */
```

#### 2. 資源編譯與快取管理
**編譯流程**:
```bash
# ✅ 標準資源更新流程 (必須按順序執行)
npm run build                 # Vite 編譯 CSS/JS 資源
php artisan view:clear       # 清除 Blade 模板快取
php artisan config:clear     # 清除應用配置快取  
php artisan cache:clear      # 清除應用快取
```

**常見問題與解決方案**:
```javascript
// ❌ 問題：CSS 修改後樣式未生效
// 原因：Laravel 快取機制保留了舊的編譯結果

// ✅ 解決：完整的快取清除流程
// 1. 重新編譯資源 (npm run build)
// 2. 清除所有 Laravel 快取
// 3. 重新整理瀏覽器 (Ctrl+F5 硬重新整理)
```

#### 3. Blade 模板最佳實踐
**用戶資訊顯示模式**:
```blade
<!-- ✅ 響應式用戶資訊顯示 -->
<button class="nexus-user-trigger-modern flex items-center space-x-3 p-2">
    <!-- 頭像：使用正確的 CSS 類別 -->
    <div class="nexus-user-avatar">
        {{ strtoupper(substr(Auth::user()->name, 0, 1)) }}
    </div>
    
    <!-- 用戶資訊：響應式顯示 (小螢幕隱藏) -->
    <div class="hidden sm:flex sm:flex-col text-right">
        <span class="text-sm font-medium text-gray-900 dark:text-white">
            {{ Auth::user()->name }}
        </span>
        <span class="text-xs text-gray-600 dark:text-gray-300">
            {{ Auth::user()->email }}
        </span>
    </div>
</button>
```

**下拉選單內容管理**:
```blade
<!-- ✅ 簡化的下拉選單結構 -->
<div class="nexus-user-dropdown-modern">
    <!-- 個人資料連結 -->
    <a href="{{ route('profile.edit') }}" class="dropdown-item">
        <i class="fas fa-user mr-2"></i>個人資料
    </a>
    
    <!-- 登出表單 -->
    <form method="POST" action="{{ route('logout') }}">
        @csrf
        <button type="submit" class="dropdown-item">
            <i class="fas fa-sign-out-alt mr-2"></i>登出
        </button>
    </form>
</div>
```

#### 4. UI 修改標準流程
**階段一：準備與測試**
```markdown
1. **CSS 類別驗證**：在測試頁面驗證新的 CSS 類別是否正確定義
2. **HTML 結構分析**：確認修改範圍，避免意外移除必要元素
3. **備份機制**：重要修改前建立 Git 分支或備份檔案
```

**階段二：漸進式修改**
```markdown
1. **小幅修改**：一次只修改一個組件或功能
2. **即時編譯**：每次修改後立即執行資源編譯流程
3. **功能驗證**：使用 Playwright MCP 或手動測試驗證功能
```

**階段三：全面測試**
```markdown
1. **功能測試**：驗證所有互動功能正常運作
2. **視覺測試**：確認樣式符合設計要求
3. **響應式測試**：檢查不同螢幕尺寸的表現
4. **跨瀏覽器測試**：確保主要瀏覽器相容性
```

#### 5. CSS 類別衝突預防機制
**命名一致性檢查**:
```bash
# ✅ 檢查 HTML 中使用的 CSS 類別
grep -r "nexus-user-" resources/views/

# ✅ 檢查 CSS 中定義的類別
grep -r "\.nexus-user-" resources/css/

# ✅ 確保定義和使用一致
diff <(grep -ro "nexus-user-[a-zA-Z-]*" resources/views/ | cut -d: -f2 | sort | uniq) \
     <(grep -ro "\.nexus-user-[a-zA-Z-]*" resources/css/ | sed 's/\.//' | cut -d: -f2 | sort | uniq)
```

**類別使用追蹤**:
```javascript
// ✅ JavaScript 中的類別引用檢查
const usedClasses = [
    'nexus-user-trigger-modern',
    'nexus-user-dropdown-modern', 
    'nexus-user-avatar'
];

// 驗證所有引用的類別都已定義
usedClasses.forEach(className => {
    const element = document.querySelector(`.${className}`);
    if (!element) {
        console.warn(`未找到 CSS 類別: ${className}`);
    }
});
```

#### 6. 常見 UI 修改陷阱與解決方案

**陷阱 1：CSS 類別命名不一致**
```bash
# ❌ 問題：定義與使用不匹配
# HTML: class="nexus-user-avatar"
# CSS:  .nexus-user-avatar-modern { ... }

# ✅ 解決：使用一致的命名
# HTML: class="nexus-user-avatar" 
# CSS:  .nexus-user-avatar { ... }
```

**陷阱 2：HTML 結構過度修改**
```blade
{{-- ❌ 問題：移除必要的用戶資訊顯示 --}}
<button class="user-trigger">
    <div class="avatar">A</div>
    {{-- 用戶名稱和 email 被錯誤移除 --}}
</button>

{{-- ✅ 解決：保留必要資訊，只移除不需要的選項 --}}
<button class="user-trigger">
    <div class="avatar">A</div>
    <div class="user-info">
        <span>{{ Auth::user()->name }}</span>
        <span>{{ Auth::user()->email }}</span>
    </div>
</button>
```

**陷阱 3：資源編譯遺漏**
```bash
# ❌ 問題：只修改 CSS 檔案，未重新編譯
nano resources/css/nexus-theme.css  # 修改樣式
# 瀏覽器仍顯示舊樣式

# ✅ 解決：完整編譯流程
nano resources/css/nexus-theme.css  # 修改樣式
npm run build                       # 重新編譯
php artisan view:clear             # 清除快取
```

#### 7. Playwright MCP 自動化測試整合
**UI 修改驗證測試**:
```javascript
// ✅ 用戶下拉選單功能測試
test('用戶下拉選單修復驗證', async ({ page }) => {
    // 登入並導航到測試頁面
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // 驗證觸發器顯示用戶資訊
    const userInfo = page.locator('.nexus-user-trigger-modern .hidden.sm\\:flex');
    await expect(userInfo).toBeVisible();
    
    // 驗證頭像顯示首字母
    const avatar = page.locator('.nexus-user-avatar');
    await expect(avatar).toContainText('T'); // 測試用戶首字母
    
    // 驗證下拉選單樣式
    await page.click('.nexus-user-trigger-modern');
    const dropdown = page.locator('.nexus-user-dropdown-modern');
    await expect(dropdown).toBeVisible();
    await expect(dropdown).toHaveCSS('background-color', 'rgb(255, 255, 255)'); // 白色背景
    
    // 驗證選單內容
    await expect(dropdown.locator('a:has-text("個人資料")')).toBeVisible();
    await expect(dropdown.locator('button:has-text("登出")')).toBeVisible();
    await expect(dropdown.locator('a:has-text("設定")')).not.toBeVisible(); // 已移除
});
```

---
*最後更新: 2025-08-04*