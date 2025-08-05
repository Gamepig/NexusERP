<!-- NexusERP 統一主題系統 - Laravel Blade 組件版本 -->
<?php
$style = json_decode(file_get_contents(public_path('style/style.json')), true);
$colors = $style['style_guide']['colors'];
$components = $style['style_guide']['components'];
$typography = $style['style_guide']['typography'];
$spacing = $style['style_guide']['spacing'];
$border_radius = $style['style_guide']['border_radius'];
?>

<style id="nexus-unified-theme">
/* NexusERP 統一主題系統 - 支援暗色和淺色主題 */

/* ========================= */
/* CSS 變數定義 (統一使用 --nexus- 前綴) */
/* ========================= */

/* 預設主題（暗色） */
:root {
  /* 主要背景色 */
  --nexus-bg-primary: <?php echo $colors['primary']['background']; ?>;
  --nexus-bg-secondary: <?php echo $colors['primary']['secondary_background']; ?>;
  --nexus-bg-tertiary: <?php echo $colors['primary']['card_background']; ?>;
  --nexus-bg-sidebar: <?php echo $colors['primary']['sidebar_background']; ?>;
  --nexus-card-bg: <?php echo $colors['primary']['card_background']; ?>;
  --nexus-primary-bg: <?php echo $colors['primary']['background']; ?>;
  --nexus-secondary-bg: <?php echo $colors['primary']['secondary_background']; ?>;
  
  /* 文字顏色 */
  --nexus-text-primary: <?php echo $colors['text']['primary']; ?>;
  --nexus-text-secondary: <?php echo $colors['text']['secondary']; ?>;
  --nexus-text-muted: <?php echo $colors['text']['muted']; ?>;
  --nexus-text-accent: <?php echo $colors['text']['accent']; ?>;
  
  /* 邊框顏色 */
  --nexus-border-primary: <?php echo $colors['border']['primary']; ?>;
  --nexus-border-secondary: <?php echo $colors['border']['secondary']; ?>;
  --nexus-border-accent: <?php echo $colors['border']['accent']; ?>;
  
  /* 強調色 */
  --nexus-accent-purple: <?php echo $colors['accent']['purple']; ?>;
  --nexus-accent-blue: <?php echo $colors['accent']['blue']; ?>;
  --nexus-accent-pink: <?php echo $colors['accent']['pink']; ?>;
  --nexus-accent-cyan: <?php echo $colors['accent']['cyan']; ?>;
  --nexus-accent-green: <?php echo $colors['accent']['green']; ?>;
  --nexus-accent-orange: <?php echo $colors['accent']['orange']; ?>;
  --nexus-accent-red: <?php echo $colors['accent']['red']; ?>;
  
  /* 陰影 */
  --nexus-shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --nexus-shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  --nexus-shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  --nexus-shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  
  /* 漸層 */
  --nexus-gradient-primary: <?php echo $components['button']['primary']['background']; ?>;
  --nexus-gradient-secondary: <?php echo $components['card']['wallet']['background']; ?>;
  
  /* 主題識別 */
  --nexus-theme-name: 'dark';
}

/* 淺色主題 */
:root.light-theme {
  /* 主要背景色 */
  --nexus-bg-primary: #ffffff;
  --nexus-bg-secondary: #f8fafc;
  --nexus-bg-tertiary: #f1f5f9;
  --nexus-bg-sidebar: #f8fafc;
  --nexus-card-bg: #ffffff;
  --nexus-primary-bg: #ffffff;
  --nexus-secondary-bg: #f8fafc;
  
  /* 文字顏色 */
  --nexus-text-primary: #1e293b;
  --nexus-text-secondary: #475569;
  --nexus-text-muted: #64748b;
  --nexus-text-accent: #334155;
  
  /* 邊框顏色 */
  --nexus-border-primary: #e2e8f0;
  --nexus-border-secondary: #cbd5e1;
  --nexus-border-accent: #94a3b8;
  
  /* 強調色（保持一致） */
  --nexus-accent-purple: <?php echo $colors['accent']['purple']; ?>;
  --nexus-accent-blue: <?php echo $colors['accent']['blue']; ?>;
  --nexus-accent-pink: <?php echo $colors['accent']['pink']; ?>;
  --nexus-accent-cyan: <?php echo $colors['accent']['cyan']; ?>;
  --nexus-accent-green: <?php echo $colors['accent']['green']; ?>;
  --nexus-accent-orange: <?php echo $colors['accent']['orange']; ?>;
  --nexus-accent-red: <?php echo $colors['accent']['red']; ?>;
  
  /* 陰影 */
  --nexus-shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --nexus-shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  --nexus-shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  --nexus-shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  
  /* 漸層 */
  --nexus-gradient-primary: <?php echo $components['button']['primary']['background']; ?>;
  --nexus-gradient-secondary: <?php echo $components['card']['wallet']['background']; ?>;
  
  /* 主題識別 */
  --nexus-theme-name: 'light';
}

/* ========================= */
/* 基礎樣式應用 */
/* ========================= */

/* 全域背景和文字 */
body {
  background-color: var(--nexus-bg-primary);
  color: var(--nexus-text-primary);
  transition: background-color 0.3s ease, color 0.3s ease;
  font-family: <?php echo $typography['font_family']['primary']; ?>;
}

/* ========================= */
/* 組件樣式 */
/* ========================= */

/* 卡片樣式 */
.nx-card {
  background-color: var(--nexus-card-bg);
  border: 1px solid var(--nexus-border-primary);
  border-radius: <?php echo $components['card']['default']['border_radius']; ?>;
  padding: <?php echo $components['card']['default']['padding']; ?>;
  box-shadow: <?php echo $components['card']['default']['box_shadow']; ?>;
  transition: all 0.3s ease;
}

.nx-card:hover {
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
  transform: translateY(-2px);
}

.nx-card-secondary {
  background-color: var(--nexus-bg-secondary);
  border: 1px solid var(--nexus-border-primary);
}

/* 按鈕樣式 */
.nx-btn {
  border-radius: <?php echo $components['button']['primary']['border_radius']; ?>;
  padding: <?php echo $components['button']['primary']['padding']; ?>;
  font-weight: <?php echo $components['button']['primary']['font_weight']; ?>;
  transition: <?php echo $components['button']['primary']['transition']; ?>;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.nx-btn-primary {
  background: <?php echo $components['button']['primary']['background']; ?>;
  color: <?php echo $components['button']['primary']['color']; ?>;
  border: none;
  box-shadow: <?php echo $components['button']['primary']['box_shadow']; ?>;
}

.nx-btn-secondary {
  background-color: <?php echo $components['button']['secondary']['background']; ?>;
  color: <?php echo $components['button']['secondary']['color']; ?>;
  border: <?php echo $components['button']['secondary']['border']; ?>;
}

.nx-btn-secondary:hover {
  background-color: var(--nexus-bg-tertiary);
}

.nx-btn-success {
  background: <?php echo $components['button']['success']['background']; ?>;
  color: <?php echo $components['button']['success']['color']; ?>;
  border: none;
}

.nx-btn-danger {
  background: <?php echo $components['button']['danger']['background']; ?>;
  color: <?php echo $components['button']['danger']['color']; ?>;
  border: none;
}

.nx-btn-info {
  background: var(--nexus-accent-blue);
  color: #ffffff;
  border: none;
}

.nx-btn-warning {
  background: var(--nexus-accent-orange);
  color: #ffffff;
  border: none;
}

/* 輸入框樣式 */
.nx-input {
  background-color: <?php echo $components['input']['default']['background']; ?>;
  border: <?php echo $components['input']['default']['border']; ?>;
  border-radius: <?php echo $components['input']['default']['border_radius']; ?>;
  padding: <?php echo $components['input']['default']['padding']; ?>;
  color: <?php echo $components['input']['default']['color']; ?>;
  font-size: <?php echo $components['input']['default']['font_size']; ?>;
  transition: all 0.2s ease;
}

.nx-input:focus {
  border-color: <?php echo $components['input']['focus']['border_color']; ?>;
  box-shadow: <?php echo $components['input']['focus']['box_shadow']; ?>;
  outline: none;
}

.nx-input::placeholder {
  color: var(--nexus-text-muted);
}

/* 選擇框樣式 */
.nx-select {
  background: var(--nexus-bg-secondary);
  border: 1px solid var(--nexus-border-primary);
  border-radius: 0.5rem;
  padding: 0.75rem 1rem;
  color: var(--nexus-text-primary);
  font-size: 1rem;
}

.nx-select:focus {
  border-color: var(--nexus-accent-purple);
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
  outline: none;
}

/* 導航樣式 */
.nx-sidebar {
  background-color: var(--nexus-bg-sidebar);
  border-right: 1px solid var(--nexus-border-primary);
  transition: background-color 0.3s ease;
}

.nx-nav-item {
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  color: var(--nexus-text-secondary);
  transition: all 0.2s ease;
}

.nx-nav-item:hover {
  background-color: var(--nexus-bg-tertiary);
  color: var(--nexus-text-primary);
}

.nx-nav-item.active {
  background: var(--nexus-gradient-primary);
  color: #ffffff;
}

/* 表格樣式 */
.nx-table {
  background: var(--nexus-card-bg);
  border: 1px solid var(--nexus-border-primary);
  border-radius: <?php echo $components['table']['container']['border_radius']; ?>;
  overflow: hidden;
}

.nx-table thead {
  background: var(--nexus-border-primary);
}

.nx-table th {
  background: var(--nexus-border-primary);
  color: var(--nexus-text-primary);
  padding: 1rem;
  font-weight: 600;
}

.nx-table td {
  color: var(--nexus-text-secondary);
  border-color: var(--nexus-border-primary);
}

.nx-table tbody tr {
  background: var(--nexus-card-bg);
  border-color: var(--nexus-border-primary);
}

.nx-table tbody tr:hover {
  background: var(--nexus-bg-secondary);
}

/* 徽章樣式 */
.nx-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 500;
}

.nx-badge-success {
  background-color: var(--nexus-accent-green);
  color: #ffffff;
}

.nx-badge-warning {
  background-color: var(--nexus-accent-orange);
  color: #ffffff;
}

.nx-badge-error {
  background-color: var(--nexus-accent-red);
  color: #ffffff;
}

.nx-badge-info {
  background-color: var(--nexus-accent-blue);
  color: #ffffff;
}

/* 修復白色背景 */
.bg-white {
  background-color: var(--nexus-card-bg) !important;
}

.bg-gray-50 {
  background-color: var(--nexus-bg-secondary) !important;
}

.bg-gray-100 {
  background-color: var(--nexus-border-primary) !important;
}

/* 修復文字顏色 */
.text-gray-900 {
  color: var(--nexus-text-primary) !important;
}

.text-gray-700 {
  color: var(--nexus-text-secondary) !important;
}

.text-gray-600 {
  color: var(--nexus-text-secondary) !important;
}

.text-gray-500 {
  color: var(--nexus-text-muted) !important;
}

/* 修復邊框顏色 */
.border-gray-200 {
  border-color: var(--nexus-border-primary) !important;
}

.border-gray-300 {
  border-color: var(--nexus-border-secondary) !important;
}

.divide-gray-200 > :not([hidden]) ~ :not([hidden]) {
  border-color: var(--nexus-border-primary) !important;
}

/* ========================= */
/* 主題切換按鈕樣式 */
/* ========================= */

.theme-toggle {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 1.5rem;
  background-color: var(--nexus-bg-secondary);
  border: 1px solid var(--nexus-border-primary);
  border-radius: 9999px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.theme-toggle:hover {
  background-color: var(--nexus-bg-tertiary);
}

.theme-toggle-icon {
  position: absolute;
  transition: all 0.3s ease;
  width: 1rem;
  height: 1rem;
  color: var(--nexus-text-secondary);
}

.theme-toggle-sun {
  opacity: 0;
  transform: rotate(90deg);
}

.theme-toggle-moon {
  opacity: 1;
  transform: rotate(0deg);
}

/* 淺色主題時的圖標切換 */
:root.light-theme .theme-toggle-sun {
  opacity: 1;
  transform: rotate(0deg);
}

:root.light-theme .theme-toggle-moon {
  opacity: 0;
  transform: rotate(-90deg);
}

/* ========================= */
/* 實用工具類 */
/* ========================= */

.nx-text-primary { color: var(--nexus-text-primary) !important; }
.nx-text-secondary { color: var(--nexus-text-secondary) !important; }
.nx-text-muted { color: var(--nexus-text-muted) !important; }
.nx-text-accent { color: var(--nexus-text-accent) !important; }

.nx-bg-primary { background-color: var(--nexus-bg-primary) !important; }
.nx-bg-secondary { background-color: var(--nexus-bg-secondary) !important; }
.nx-bg-tertiary { background-color: var(--nexus-bg-tertiary) !important; }

.nx-border-primary { border-color: var(--nexus-border-primary) !important; }
.nx-border-secondary { border-color: var(--nexus-border-secondary) !important; }

.nx-shadow-sm { box-shadow: var(--nexus-shadow-sm) !important; }
.nx-shadow-md { box-shadow: var(--nexus-shadow-md) !important; }
.nx-shadow-lg { box-shadow: var(--nexus-shadow-lg) !important; }
.nx-shadow-xl { box-shadow: var(--nexus-shadow-xl) !important; }

/* ========================= */
/* 響應式設計 */
/* ========================= */

@media (max-width: 768px) {
  .nx-card {
    padding: 1rem;
  }
  
  .nx-btn {
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
  }
  
  .nx-sidebar {
    width: 100%;
    position: fixed;
    top: 0;
    left: -100%;
    z-index: 1000;
    transition: left 0.3s ease, background-color 0.3s ease;
  }
  
  .nx-sidebar.open {
    left: 0;
  }
}

/* ========================= */
/* 動畫效果 */
/* ========================= */

.nx-fade-in {
  opacity: 0;
  animation: nxFadeIn 0.3s ease-in-out forwards;
}

@keyframes nxFadeIn {
  to {
    opacity: 1;
  }
}

.nx-slide-in {
  transform: translateY(20px);
  opacity: 0;
  animation: nxSlideIn 0.2s ease-out forwards;
}

@keyframes nxSlideIn {
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* ========================= */
/* 可訪問性支援 */
/* ========================= */

/* 減少動畫偏好設置 */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* 高對比度模式 */
@media (prefers-contrast: high) {
  :root {
    --nexus-border-primary: #000000;
    --nexus-text-primary: #000000;
  }
  
  :root.light-theme {
    --nexus-border-primary: #000000;
    --nexus-text-primary: #000000;
  }
}
</style>

<!-- 基礎 JavaScript 功能 -->
<script>
// 主題切換功能
document.addEventListener('DOMContentLoaded', function() {
    // 初始化主題
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.className = savedTheme === 'light' ? 'light-theme' : '';
    
    // 主題切換事件監聽
    document.addEventListener('click', function(e) {
        if (e.target.closest('.theme-toggle')) {
            toggleTheme();
        }
    });
    
    function toggleTheme() {
        const currentTheme = document.documentElement.classList.contains('light-theme') ? 'light' : 'dark';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        if (newTheme === 'light') {
            document.documentElement.classList.add('light-theme');
        } else {
            document.documentElement.classList.remove('light-theme');
        }
        
        localStorage.setItem('theme', newTheme);
    }
});
</script>