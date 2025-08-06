# NexusERP 風格指南使用說明

基於附件圖片分析的深色主題 ERP 系統風格指南，提供完整的設計規範和程式碼範例。

## 主要特色

### 🎨 設計風格
- **深色主題**：以深藍色為主色調的現代化設計
- **卡片式設計**：統一的卡片佈局和圓角設計
- **響應式設計**：支援手機、平板、桌面多種裝置
- **漸變效果**：精美的顏色漸變和陰影效果

### 🔧 技術特點
- **跨平台相容**：支援 PHP、HTML、JavaScript
- **模組化設計**：可獨立使用各種元件
- **動態載入**：支援程式動態讀取風格配置
- **CSS 變數**：現代化的 CSS 自定義屬性

## 快速開始

### 1. 基本使用

```php
<?php
// 載入風格指南
$style = json_decode(file_get_contents('style/style.json'), true);
$colors = $style['style_guide']['colors'];
?>
```

### 2. 建立基本頁面

```html
<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <title>NexusERP 系統</title>
    <style>
        body {
            background-color: <?php echo $colors['primary']['background']; ?>;
            color: <?php echo $colors['text']['primary']; ?>;
        }
    </style>
</head>
<body>
    <div class="nx-card">
        <h3>卡片標題</h3>
        <p>卡片內容</p>
    </div>
</body>
</html>
```

## 核心元件

### 1. 佈局元件

#### 側邊欄 (Sidebar)
```html
<div class="nx-sidebar">
    <div class="nx-nav-item active">
        <span class="nx-nav-icon">📊</span>
        儀表板
    </div>
</div>
```

#### 標頭 (Header)
```html
<div class="nx-header">
    <h1>系統標題</h1>
    <div>使用者資訊</div>
</div>
```

### 2. 卡片元件

#### 一般卡片
```html
<div class="nx-card">
    <h3>卡片標題</h3>
    <p>卡片內容</p>
</div>
```

#### 錢包卡片（紫色漸變）
```html
<div class="nx-card wallet-card">
    <h3>儲存金額</h3>
    <h2>IDR 4,509,063</h2>
</div>
```

### 3. 表格元件

```html
<div class="nx-table">
    <div class="nx-table-header">
        <div>欄位1</div>
        <div>欄位2</div>
    </div>
    <div class="nx-table-row">
        <div>資料1</div>
        <div>資料2</div>
    </div>
</div>
```

### 4. 按鈕元件

```html
<button class="nx-btn nx-btn-primary">主要按鈕</button>
<button class="nx-btn nx-btn-success">成功按鈕</button>
<button class="nx-btn nx-btn-danger">危險按鈕</button>
```

### 5. 表單元件

```html
<input type="text" class="nx-input" placeholder="請輸入...">
<select class="nx-select">
    <option>選項1</option>
    <option>選項2</option>
</select>
```

### 6. 狀態標籤

```html
<span class="nx-badge nx-badge-success">完成</span>
<span class="nx-badge nx-badge-warning">等待中</span>
<span class="nx-badge nx-badge-error">失敗</span>
```

## 顏色系統

### 主要顏色
- **主背景**：`#1a1d29`
- **次要背景**：`#252836`
- **卡片背景**：`#2d3142`
- **側邊欄背景**：`#1e2139`

### 強調顏色
- **紫色**：`#8b5cf6`
- **藍色**：`#3b82f6`
- **粉色**：`#ec4899`
- **青色**：`#06b6d4`
- **綠色**：`#10b981`
- **橙色**：`#f59e0b`
- **紅色**：`#ef4444`

### 文字顏色
- **主要文字**：`#ffffff`
- **次要文字**：`#94a3b8`
- **弱化文字**：`#64748b`
- **強調文字**：`#e2e8f0`

## JavaScript 整合

```javascript
// 載入風格指南
const style = await fetch('style/style.json').then(r => r.json());

// 動態建立元件
function createCard(title, value, type = 'default') {
    const card = document.createElement('div');
    card.className = type === 'wallet' ? 'nx-card wallet-card' : 'nx-card';
    card.innerHTML = `
        <h3>${title}</h3>
        <h2>${value}</h2>
    `;
    return card;
}

// 主題切換
function toggleTheme() {
    const colors = style.style_guide.colors;
    // 實現主題切換邏輯
}
```

## 響應式設計

### 斷點設定
- **手機**：`< 640px`
- **平板**：`640px - 1024px`
- **桌面**：`> 1024px`

### 響應式卡片佈局
```css
.nx-grid {
    display: grid;
    gap: 1.5rem;
}

@media (max-width: 640px) {
    .nx-grid {
        grid-template-columns: 1fr;
    }
}

@media (min-width: 641px) and (max-width: 1024px) {
    .nx-grid {
        grid-template-columns: repeat(2, 1fr);
    }
}

@media (min-width: 1025px) {
    .nx-grid {
        grid-template-columns: repeat(3, 1fr);
    }
}
```

## 進階用法

### 1. 自訂 CSS 變數

```css
:root {
    --primary-bg: #1a1d29;
    --accent-purple: #8b5cf6;
    --text-primary: #ffffff;
}

body {
    background-color: var(--primary-bg);
    color: var(--text-primary);
}
```

### 2. 動態樣式產生

```php
<?php
function generateThemeCSS($theme) {
    $css = '';
    foreach ($theme['colors'] as $category => $colors) {
        foreach ($colors as $name => $value) {
            $css .= "--{$category}-{$name}: {$value};\n";
        }
    }
    return $css;
}
?>
```

### 3. 元件工廠模式

```javascript
class NexusUIFactory {
    static createCard(options) {
        const card = document.createElement('div');
        card.className = 'nx-card';
        if (options.type === 'wallet') {
            card.classList.add('wallet-card');
        }
        return card;
    }
    
    static createButton(text, type = 'primary') {
        const button = document.createElement('button');
        button.className = `nx-btn nx-btn-${type}`;
        button.textContent = text;
        return button;
    }
}
```

## 最佳實踐

### 1. 命名規範
- 使用 `nx-` 前綴避免 CSS 衝突
- 組件名稱清晰描述功能
- 狀態類別使用語義化名稱

### 2. 效能優化
- 使用 CSS 變數減少重複程式碼
- 適當使用 CSS 快取
- 壓縮生產環境的 CSS

### 3. 維護性
- 集中管理所有設計規範
- 定期更新風格指南版本
- 建立組件庫文件

## 範例檔案

完整的使用範例請參考以下檔案：
- `style/style-example.php` - PHP 整合範例
- `style/landing-page.html` - 首頁範例
- `style/admin-dashboard.html` - 後台管理範例

## 支援與更新

### 瀏覽器支援
- Chrome 70+
- Firefox 65+
- Safari 12+
- Edge 79+

### 更新日誌
- v1.0.0 - 初始版本，包含基本設計規範和元件

## 問題回報

如果您在使用過程中遇到任何問題，請確保：
1. 正確載入 `style/style.json` 檔案
2. 確認 PHP 版本支援 JSON 解析
3. 檢查 CSS 語法是否正確
4. 驗證響應式設計斷點

---

這個風格指南系統讓您能夠快速建立一致且現代化的 ERP 系統界面，同時保持設計的一致性和可維護性。 