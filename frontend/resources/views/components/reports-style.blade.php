<!-- NexusERP 報表統一樣式 -->
<?php
$style = json_decode(file_get_contents(public_path('style/style.json')), true);
$colors = $style['style_guide']['colors'];
$components = $style['style_guide']['components'];
?>

@push('styles')
<style id="nexus-reports-style">
/* NexusERP 深色主題報表樣式 - 統一使用 nx- 前綴 */
/* 注意：由於主系統已透過 nexus-theme.blade.php 載入基礎 CSS 變數，此處不重複定義 */

/* 確保報表頁面使用正確的背景和主題 */
body {
    background-color: var(--nexus-bg-primary) !important;
    color: var(--nexus-text-primary) !important;
    font-family: <?php echo $style['style_guide']['typography']['font_family']['primary']; ?>;
}

/* 報表卡片樣式 */
.nx-card {
    background: var(--nexus-card-bg) !important;
    border: 1px solid var(--nexus-border-primary) !important;
    border-radius: <?php echo $components['card']['default']['border_radius']; ?>;
    padding: <?php echo $components['card']['default']['padding']; ?>;
    box-shadow: <?php echo $components['card']['default']['box_shadow']; ?>;
    transition: all 0.3s ease;
}

/* 修復報表圖示變形問題 */
.report-icon {
    width: 4rem !important;
    height: 4rem !important;
    min-width: 4rem !important;
    min-height: 4rem !important;
    flex-shrink: 0 !important;
}

/* 報表卡片版面一致化：等高、按鈕置底 */
.nx-card.text-center {
    display: flex !important;
    flex-direction: column !important;
    align-items: center !important;
    min-height: 13rem !important;
}

.nx-card.text-center .nx-btn {
    margin-top: auto !important;
    width: 100% !important;
}

.nx-card:hover {
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
    transform: translateY(-2px);
}

/* 報表按鈕樣式 */
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

.nx-btn-secondary {
    background: <?php echo $components['button']['secondary']['background']; ?>;
    color: <?php echo $components['button']['secondary']['color']; ?>;
    border: <?php echo $components['button']['secondary']['border']; ?>;
}

/* 追加：Info/Warning 變體（報表中心按鈕用） */
.nx-btn-info {
    background: linear-gradient(135deg, var(--nexus-accent-blue), #2563eb);
    color: #ffffff;
    border: none;
}

.nx-btn-warning {
    background: linear-gradient(135deg, var(--nexus-accent-orange), #ea580c);
    color: #111827;
    border: none;
}

/* 報表表格樣式 */
.nx-table {
    background: var(--nexus-card-bg) !important;
    border: 1px solid var(--nexus-border-primary) !important;
    border-radius: <?php echo $components['table']['container']['border_radius']; ?>;
    overflow: hidden;
}

.nx-table thead {
    background: var(--nexus-border-primary) !important;
}

.nx-table th {
    background: var(--nexus-border-primary) !important;
    color: var(--nexus-text-primary) !important;
    padding: 1rem;
    font-weight: 600;
}

.nx-table td {
    color: getComputedStyle(document.documentElement).getPropertyValue('--nexus-text-secondary') !important;
    border-color: var(--nexus-border-primary) !important;
}

.nx-table tbody tr {
    background: var(--nexus-card-bg) !important;
    border-color: var(--nexus-border-primary) !important;
}

.nx-table tbody tr:hover {
    background: var(--nexus-bg-secondary) !important;
}

/* 報表輸入框樣式 */
.nx-input {
    background: <?php echo $components['input']['default']['background']; ?> !important;
    border: <?php echo $components['input']['default']['border']; ?> !important;
    border-radius: <?php echo $components['input']['default']['border_radius']; ?>;
    padding: <?php echo $components['input']['default']['padding']; ?>;
    color: <?php echo $components['input']['default']['color']; ?> !important;
    font-size: <?php echo $components['input']['default']['font_size']; ?>;
}

.nx-input:focus {
    border-color: <?php echo $components['input']['focus']['border_color']; ?> !important;
    box-shadow: <?php echo $components['input']['focus']['box_shadow']; ?> !important;
    outline: none;
}

.nx-input::placeholder {
    color: var(--nexus-text-muted) !important;
}

/* 報表選擇框樣式 */
.nx-select {
    background: var(--nexus-bg-secondary) !important;
    border: 1px solid var(--nexus-border-primary) !important;
    border-radius: 0.5rem;
    padding: 0.75rem 1rem;
    color: var(--nexus-text-primary) !important;
    font-size: 1rem;
}

.nx-select:focus {
    border-color: var(--nexus-accent-purple) !important;
    box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1) !important;
    outline: none;
}

/* 報表文字樣式 */
.nx-text-primary { color: var(--nexus-text-primary) !important; }
.nx-text-secondary { color: getComputedStyle(document.documentElement).getPropertyValue('--nexus-text-secondary') !important; }
.nx-text-muted { color: var(--nexus-text-muted) !important; }
.nx-text-accent { color: var(--nexus-text-accent) !important; }

/* 報表錯誤訊息樣式 */
.nx-error {
    background: rgba(239, 68, 68, 0.2) !important;
    border: 1px solid rgba(239, 68, 68, 0.4) !important;
    color: var(--nexus-accent-red) !important;
    border-radius: <?php echo $style['style_guide']['border_radius']['md']; ?>;
}

/* 報表載入樣式 */
.nx-loading {
    color: getComputedStyle(document.documentElement).getPropertyValue('--nexus-text-secondary') !important;
}

/* 報表標籤樣式 */
.nx-badge-success {
    background: var(--nexus-accent-green) !important;
    color: #ffffff !important;
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    font-size: 0.875rem;
    font-weight: 500;
}

.nx-badge-warning {
    background: var(--nexus-accent-orange) !important;
    color: #ffffff !important;
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    font-size: 0.875rem;
    font-weight: 500;
}

.nx-badge-error {
    background: var(--nexus-accent-red) !important;
    color: #ffffff !important;
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    font-size: 0.875rem;
    font-weight: 500;
}

.nx-badge-info {
    background: var(--nexus-accent-blue) !important;
    color: #ffffff !important;
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    font-size: 0.875rem;
    font-weight: 500;
}

/* 修復白色背景 */
.bg-white {
    background-color: var(--nexus-card-bg) !important;
}

/* 修復特定顏色背景主題問題 */
.bg-green-50 {
    background-color: rgba(16, 185, 129, 0.1) !important;
    border-color: rgba(16, 185, 129, 0.2) !important;
}

.bg-red-50 {
    background-color: rgba(239, 68, 68, 0.1) !important;
    border-color: rgba(239, 68, 68, 0.2) !important;
}

.bg-blue-50 {
    background-color: rgba(59, 130, 246, 0.1) !important;
    border-color: rgba(59, 130, 246, 0.2) !important;
}

.bg-orange-50 {
    background-color: rgba(245, 158, 11, 0.1) !important;
    border-color: rgba(245, 158, 11, 0.2) !important;
}

.bg-purple-50 {
    background-color: rgba(139, 92, 246, 0.1) !important;
    border-color: rgba(139, 92, 246, 0.2) !important;
}

.bg-yellow-50 {
    background-color: rgba(245, 158, 11, 0.1) !important;
    border-color: rgba(245, 158, 11, 0.2) !important;
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
    color: getComputedStyle(document.documentElement).getPropertyValue('--nexus-text-secondary') !important;
}

.text-gray-600 {
    color: getComputedStyle(document.documentElement).getPropertyValue('--nexus-text-secondary') !important;
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

/* 報表特定色彩背景 */
.nx-bg-green-50 {
    background-color: rgba(16, 185, 129, 0.1) !important;
    border-color: rgba(16, 185, 129, 0.2) !important;
}

.nx-bg-blue-50 {
    background-color: rgba(59, 130, 246, 0.1) !important;
    border-color: rgba(59, 130, 246, 0.2) !important;
}

.nx-bg-purple-50 {
    background-color: rgba(139, 92, 246, 0.1) !important;
    border-color: rgba(139, 92, 246, 0.2) !important;
}

.nx-bg-orange-50 {
    background-color: rgba(245, 158, 11, 0.1) !important;
    border-color: rgba(245, 158, 11, 0.2) !important;
}

.nx-bg-red-50 {
    background-color: rgba(239, 68, 68, 0.1) !important;
    border-color: rgba(239, 68, 68, 0.2) !important;
}

.nx-bg-yellow-50 {
    background-color: rgba(245, 158, 11, 0.1) !important;
    border-color: rgba(245, 158, 11, 0.2) !important;
}

/* 麵包屑導航樣式 */
.breadcrumbs a {
    color: var(--nexus-accent-blue) !important;
}

.breadcrumbs a:hover {
    color: var(--nexus-accent-cyan) !important;
}

/* 確保圖表容器也使用深色背景 */
.h-64, .h-80 {
    background-color: var(--nexus-bg-secondary) !important;
    border-radius: 0.5rem;
}

/* 表單元件深度修復 */
.form-control,
.form-select,
.form-check-input,
input[type="text"],
input[type="email"], 
input[type="password"],
input[type="number"],
input[type="date"],
input[type="datetime-local"],
input[type="search"],
textarea,
select {
    background-color: var(--nexus-bg-secondary) !important;
    color: var(--nexus-text-primary) !important;
    border-color: var(--nexus-border-primary) !important;
    border-width: 1px !important;
}

.form-control:focus,
.form-select:focus,
.form-check-input:focus,
input:focus,
textarea:focus,
select:focus {
    background-color: var(--nexus-bg-secondary) !important;
    color: var(--nexus-text-primary) !important;
    border-color: var(--nexus-accent-purple) !important;
    box-shadow: 0 0 0 0.2rem rgba(139, 92, 246, 0.25) !important;
    outline: none !important;
}

.form-control::placeholder,
input::placeholder,
textarea::placeholder {
    color: var(--nexus-text-muted) !important;
    opacity: 0.7 !important;
}

/* 下拉選單深度修復 */
.dropdown-menu {
    background-color: var(--nexus-card-bg) !important;
    border-color: var(--nexus-border-primary) !important;
    border-radius: 0.5rem !important;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3) !important;
}

.dropdown-item {
    color: var(--nexus-text-primary) !important;
    padding: 0.5rem 1rem !important;
}

.dropdown-item:hover,
.dropdown-item:focus {
    background-color: var(--nexus-bg-secondary) !important;
    color: var(--nexus-text-primary) !important;
}

.dropdown-item.active,
.dropdown-item:active {
    background-color: var(--nexus-accent-purple) !important;
    color: white !important;
}

.dropdown-divider {
    border-color: var(--nexus-border-primary) !important;
}

/* 模態視窗深度修復 */
.modal-content {
    background-color: var(--nexus-card-bg) !important;
    border-color: var(--nexus-border-primary) !important;
    border-radius: 0.75rem !important;
}

.modal-header {
    border-bottom-color: var(--nexus-border-primary) !important;
    background-color: var(--nexus-bg-secondary) !important;
}

.modal-header .modal-title {
    color: var(--nexus-text-primary) !important;
}

.modal-header .btn-close {
    filter: invert(1) brightness(0.8) !important;
    opacity: 0.8 !important;
}

.modal-header .btn-close:hover {
    opacity: 1 !important;
}

.modal-body {
    color: var(--nexus-text-primary) !important;
    background-color: var(--nexus-card-bg) !important;
}

.modal-footer {
    border-top-color: var(--nexus-border-primary) !important;
    background-color: var(--nexus-bg-secondary) !important;
}

/* 提示工具深度修復 */
.tooltip .tooltip-inner {
    background-color: var(--nexus-card-bg) !important;
    color: var(--nexus-text-primary) !important;
    border: 1px solid var(--nexus-border-primary) !important;
    border-radius: 0.5rem !important;
    font-size: 0.875rem !important;
    padding: 0.5rem 0.75rem !important;
}

.tooltip.bs-tooltip-top .tooltip-arrow::before {
    border-top-color: var(--nexus-card-bg) !important;
}

.tooltip.bs-tooltip-bottom .tooltip-arrow::before {
    border-bottom-color: var(--nexus-card-bg) !important;
}

.tooltip.bs-tooltip-start .tooltip-arrow::before {
    border-left-color: var(--nexus-card-bg) !important;
}

.tooltip.bs-tooltip-end .tooltip-arrow::before {
    border-right-color: var(--nexus-card-bg) !important;
}

/* 彈出選單深度修復 */
.popover {
    background-color: var(--nexus-card-bg) !important;
    border-color: var(--nexus-border-primary) !important;
}

.popover-header {
    background-color: var(--nexus-bg-secondary) !important;
    color: var(--nexus-text-primary) !important;
    border-bottom-color: var(--nexus-border-primary) !important;
}

.popover-body {
    color: var(--nexus-text-primary) !important;
}

/* 分頁元件深度修復 */
.pagination .page-link {
    background-color: var(--nexus-card-bg) !important;
    color: var(--nexus-text-primary) !important;
    border-color: var(--nexus-border-primary) !important;
    padding: 0.5rem 0.75rem !important;
}

.pagination .page-link:hover {
    background-color: var(--nexus-bg-secondary) !important;
    color: var(--nexus-text-primary) !important;
    border-color: var(--nexus-accent-purple) !important;
}

.pagination .page-item.active .page-link {
    background-color: var(--nexus-accent-purple) !important;
    border-color: var(--nexus-accent-purple) !important;
    color: white !important;
}

.pagination .page-item.disabled .page-link {
    background-color: var(--nexus-bg-secondary) !important;
    color: var(--nexus-text-muted) !important;
    border-color: var(--nexus-border-primary) !important;
}

/* 警告框深度修復 */
.alert {
    border-radius: 0.5rem !important;
    border-width: 1px !important;
}

.alert-success {
    background-color: rgba(16, 185, 129, 0.15) !important;
    border-color: rgba(16, 185, 129, 0.3) !important;
    color: var(--nexus-accent-green) !important;
}

.alert-warning {
    background-color: rgba(245, 158, 11, 0.15) !important;
    border-color: rgba(245, 158, 11, 0.3) !important;
    color: var(--nexus-accent-orange) !important;
}

.alert-danger {
    background-color: rgba(239, 68, 68, 0.15) !important;
    border-color: rgba(239, 68, 68, 0.3) !important;
    color: var(--nexus-accent-red) !important;
}

.alert-info {
    background-color: rgba(59, 130, 246, 0.15) !important;
    border-color: rgba(59, 130, 246, 0.3) !important;
    color: var(--nexus-accent-blue) !important;
}

/* 進度條深度修復 */
.progress {
    background-color: var(--nexus-bg-secondary) !important;
    border-radius: 0.5rem !important;
    height: 0.75rem !important;
}

.progress-bar {
    background-color: var(--nexus-accent-purple) !important;
    border-radius: 0.5rem !important;
}

/* 卡片群組深度修復 */
.card-group .card {
    background-color: var(--nexus-card-bg) !important;
    border-color: var(--nexus-border-primary) !important;
}

.card-header {
    background-color: var(--nexus-bg-secondary) !important;
    border-bottom-color: var(--nexus-border-primary) !important;
    color: var(--nexus-text-primary) !important;
}

.card-footer {
    background-color: var(--nexus-bg-secondary) !important;
    border-top-color: var(--nexus-border-primary) !important;
    color: getComputedStyle(document.documentElement).getPropertyValue('--nexus-text-secondary') !important;
}

/* 清單群組深度修復 */
.list-group-item {
    background-color: var(--nexus-card-bg) !important;
    border-color: var(--nexus-border-primary) !important;
    color: var(--nexus-text-primary) !important;
}

.list-group-item:hover {
    background-color: var(--nexus-bg-secondary) !important;
}

.list-group-item.active {
    background-color: var(--nexus-accent-purple) !important;
    border-color: var(--nexus-accent-purple) !important;
    color: white !important;
}

/* 導航標籤深度修復 */
.nav-tabs .nav-link {
    background-color: var(--nexus-bg-secondary) !important;
    border-color: var(--nexus-border-primary) !important;
    color: getComputedStyle(document.documentElement).getPropertyValue('--nexus-text-secondary') !important;
}

.nav-tabs .nav-link:hover {
    border-color: var(--nexus-border-primary) !important;
    color: var(--nexus-text-primary) !important;
}

.nav-tabs .nav-link.active {
    background-color: var(--nexus-card-bg) !important;
    border-color: var(--nexus-border-primary) var(--nexus-border-primary) var(--nexus-card-bg) !important;
    color: var(--nexus-text-primary) !important;
}

.tab-content {
    background-color: var(--nexus-card-bg) !important;
    border: 1px solid var(--nexus-border-primary) !important;
    border-top: none !important;
    padding: 1rem !important;
}

/* 麵包屑深度修復 */
.breadcrumb {
    background-color: var(--nexus-bg-secondary) !important;
    border-radius: 0.5rem !important;
    padding: 0.75rem 1rem !important;
}

.breadcrumb-item a {
    color: var(--nexus-accent-blue) !important;
    text-decoration: none !important;
}

.breadcrumb-item a:hover {
    color: var(--nexus-accent-cyan) !important;
    text-decoration: underline !important;
}

.breadcrumb-item.active {
    color: getComputedStyle(document.documentElement).getPropertyValue('--nexus-text-secondary') !important;
}

.breadcrumb-item + .breadcrumb-item::before {
    color: var(--nexus-text-muted) !important;
}

/* 響應式設計優化 */
@media (max-width: 768px) {
    .nx-card {
        padding: 1rem;
    }
    
    .nx-btn {
        padding: 0.5rem 1rem;
        font-size: 0.875rem;
    }
    
    .modal-dialog {
        margin: 1rem !important;
    }
    
    .dropdown-menu {
        width: 100% !important;
    }
}
</style>
@endpush

@push('head-scripts')
<!-- Chart.js CDN -->
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
@endpush

@push('scripts')
<!-- 確保 Chart.js 正確載入 -->
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.js"></script>
<script src="{{ asset('js/chart-themes.js') }}"></script>

<script>
// 等待 Chart.js 載入完成
document.addEventListener('DOMContentLoaded', function() {
    // 驗證 Chart.js 是否載入成功
    if (typeof Chart === 'undefined') {
        console.error('❌ Chart.js 載入失敗');
        return;
    }
    
    console.log('✅ Chart.js 載入成功');
    
    // Chart.js 深色主題配置
    Chart.defaults.color = getComputedStyle(document.documentElement).getPropertyValue('--nexus-text-secondary').trim();
    Chart.defaults.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--nexus-card-bg').trim();
    Chart.defaults.borderColor = getComputedStyle(document.documentElement).getPropertyValue('--nexus-border-primary').trim();

    // 初始化所有圖表
    initializeReportCharts();
});

function initializeReportCharts() {
    // 應付帳款帳齡分佈圖
    const payableAgeChart = document.getElementById('payable-age-chart');
    if (payableAgeChart) {
        new Chart(payableAgeChart, {
            type: 'doughnut',
            data: {
                labels: ['30天內', '31-60天', '60天以上'],
                datasets: [{
                    data: [620000, 280000, 95000],
                    backgroundColor: [
                        'rgba(34, 197, 94, 0.8)',
                        'rgba(251, 191, 36, 0.8)', 
                        'rgba(239, 68, 68, 0.8)'
                    ],
                    borderColor: [
                        'rgba(34, 197, 94, 1)',
                        'rgba(251, 191, 36, 1)',
                        'rgba(239, 68, 68, 1)'
                    ],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--nexus-text-secondary').trim(),
                            padding: 20,
                            font: {
                                size: 12
                            }
                        }
                    },
                    title: {
                        display: false
                    }
                }
            }
        });
    }
    
    // 應收帳款帳齡分佈圖
    const receivableAgeChart = document.getElementById('receivable-age-chart');
    if (receivableAgeChart) {
        new Chart(receivableAgeChart, {
            type: 'doughnut',
            data: {
                labels: ['30天內', '31-60天', '60天以上'],
                datasets: [{
                    data: [890000, 340000, 125000],
                    backgroundColor: [
                        'rgba(34, 197, 94, 0.8)',
                        'rgba(234, 179, 8, 0.8)',
                        'rgba(239, 68, 68, 0.8)'
                    ],
                    borderColor: [
                        'rgba(34, 197, 94, 1)',
                        'rgba(234, 179, 8, 1)',
                        'rgba(239, 68, 68, 1)'
                    ],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--nexus-text-secondary').trim(),
                            padding: 20,
                            font: {
                                size: 12
                            }
                        }
                    },
                    title: {
                        display: false
                    }
                }
            }
        });
    }

    // 損益表月度獲利趨勢圖
    const profitTrendChart = document.getElementById('profit-trend-chart');
    if (profitTrendChart) {
        new Chart(profitTrendChart, {
            type: 'line',
            data: {
                labels: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
                datasets: [{
                    label: '月度淨利',
                    data: [180000, 220000, 195000, 245000, 280000, 310000, 275000, 295000, 320000, 285000, 305000, 300000],
                    borderColor: 'rgba(139, 92, 246, 1)',
                    backgroundColor: 'rgba(139, 92, 246, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--nexus-text-muted').trim(),
                            callback: function(value) {
                                return '$' + value.toLocaleString();
                            }
                        },
                        grid: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--nexus-border-primary').trim()
                        }
                    },
                    x: {
                        ticks: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--nexus-text-muted').trim()
                        },
                        grid: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--nexus-border-primary').trim()
                        }
                    }
                },
                plugins: {
                    legend: {
                        labels: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--nexus-text-secondary').trim()
                        }
                    }
                }
            }
        });
    }
}
</script>
@endpush