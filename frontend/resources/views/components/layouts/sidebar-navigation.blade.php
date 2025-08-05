{{--
    NexusERP 側邊導航組件
    提供左側固定導航欄，包含主要系統模組
--}}

@php
    use App\Services\NavigationService;
    
    $navigationService = app(NavigationService::class);
    $currentRoute = request()->route()->getName();
    
    // 定義側邊導航項目
    $sidebarItems = [
        [
            'title' => '首頁',
            'icon' => '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>',
            'route' => 'dashboard',
            'active' => request()->routeIs('dashboard'),
        ],
        [
            'title' => '數據分析',
            'icon' => '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>',
            'route' => 'reports.index',
            'active' => request()->routeIs('reports.*'),
        ],
        [
            'title' => '訂單',
            'icon' => '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>',
            'route' => 'orders.sales.index',
            'active' => request()->routeIs('orders.*'),
            'children' => [
                ['title' => '銷售訂單', 'route' => 'orders.sales.index'],
                ['title' => '採購訂單', 'route' => 'orders.purchase.index'],
            ]
        ],
        [
            'title' => '財務',
            'icon' => '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path></svg>',
            'route' => 'reports.financial.index',
            'active' => request()->routeIs('reports.financial.*'),
        ],
        [
            'title' => '報告',
            'icon' => '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>',
            'route' => 'reports.sales.index',
            'active' => request()->routeIs('reports.sales.*'),
        ],
    ];
@endphp

<aside x-data="sidebarNavigation()" 
       x-init="init()"
       class="nexus-sidebar"
       role="complementary"
       aria-label="側邊導航">
    
    <!-- 側邊導航容器 -->
    <div class="nexus-sidebar-container">
        <!-- 品牌標識區域 -->
        <div class="nexus-sidebar-header">
            <div class="nexus-brand-section">
                <div class="nexus-brand-logo">
                    <svg class="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                    </svg>
                </div>
                <div class="nexus-brand-text">
                    <div class="nexus-brand-name">NexusERP</div>
                    <div class="nexus-brand-tagline">企業管理系統</div>
                </div>
            </div>
        </div>
        
        <!-- 導航項目列表 -->
        <nav class="nexus-sidebar-nav">
            <ul class="nexus-sidebar-list">
                @foreach($sidebarItems as $item)
                    <li class="nexus-sidebar-item">
                        <a href="{{ route($item['route']) }}" 
                           class="nexus-sidebar-link {{ $item['active'] ? 'nexus-sidebar-link-active' : '' }}"
                           :class="{ 'nexus-sidebar-link-hover': hoveredItem === '{{ $item['route'] }}' }"
                           @mouseenter="hoveredItem = '{{ $item['route'] }}'"
                           @mouseleave="hoveredItem = null"
                           data-route="{{ $item['route'] }}">
                            
                            <!-- 圖示 -->
                            <span class="nexus-sidebar-icon">
                                {!! $item['icon'] !!}
                            </span>
                            
                            <!-- 標題 -->
                            <span class="nexus-sidebar-text">{{ $item['title'] }}</span>
                            
                            <!-- 活動指示器 -->
                            @if($item['active'])
                                <span class="nexus-sidebar-indicator"></span>
                            @endif
                        </a>
                        
                        <!-- 子選單（如果有） -->
                        @if(isset($item['children']) && $item['active'])
                            <ul class="nexus-sidebar-submenu">
                                @foreach($item['children'] as $child)
                                    <li>
                                        <a href="{{ route($child['route']) }}" 
                                           class="nexus-sidebar-sublink">
                                            {{ $child['title'] }}
                                        </a>
                                    </li>
                                @endforeach
                            </ul>
                        @endif
                    </li>
                @endforeach
            </ul>
        </nav>
        
        <!-- 底部區域 -->
        <div class="nexus-sidebar-footer">
            <div class="nexus-sidebar-user">
                <div class="nexus-sidebar-user-avatar">
                    @if(Auth::user() && Auth::user()->avatar)
                        <img src="{{ Auth::user()->avatar }}" alt="使用者頭像" class="w-8 h-8 rounded-full">
                    @else
                        <div class="w-8 h-8 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 flex items-center justify-center text-white text-sm font-medium">
                            {{ Auth::user() ? strtoupper(substr(Auth::user()->name, 0, 1)) : 'G' }}
                        </div>
                    @endif
                </div>
                <div class="nexus-sidebar-user-info">
                    <div class="nexus-sidebar-user-name">{{ Auth::user() ? Auth::user()->name : '測試使用者' }}</div>
                </div>
            </div>
        </div>
    </div>
</aside>

@push('scripts')
<script>
function sidebarNavigation() {
    return {
        // 狀態管理
        hoveredItem: null,
        activeItem: '{{ $currentRoute }}',
        isCollapsed: false,
        
        // 初始化
        init() {
            this.setupEventListeners();
            this.detectCurrentPage();
            console.log('Sidebar navigation initialized');
        },
        
        // 設定事件監聽器
        setupEventListeners() {
            // 鍵盤導航支援
            document.addEventListener('keydown', (e) => {
                if (e.altKey && e.key >= '1' && e.key <= '5') {
                    e.preventDefault();
                    const index = parseInt(e.key) - 1;
                    const links = document.querySelectorAll('.nexus-sidebar-link');
                    if (links[index]) {
                        links[index].click();
                    }
                }
            });
        },
        
        // 檢測當前頁面
        detectCurrentPage() {
            const currentPath = window.location.pathname;
            const activeLink = document.querySelector('.nexus-sidebar-link-active');
            if (activeLink) {
                this.activeItem = activeLink.getAttribute('data-route');
            }
        },
        
        // 切換摺疊狀態
        toggleCollapse() {
            this.isCollapsed = !this.isCollapsed;
            document.querySelector('.nexus-sidebar').classList.toggle('nexus-sidebar-collapsed', this.isCollapsed);
        }
    };
}
</script>
@endpush

@push('styles')
<style>
/* ===== Sempoa.id 風格的側邊導航樣式 ===== */
.nexus-sidebar {
    position: fixed;
    top: 0; /* 從頂部開始，全高度設計 */
    left: 0;
    width: 280px;
    height: 100vh; /* 全高度 */
    background: linear-gradient(145deg, #3c3d4c 0%, #2d2e3f 100%); /* Sempoa.id 深色漸層 */
    border-right: 1px solid rgba(139, 92, 246, 0.1);
    z-index: 1000;
    overflow-y: auto;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 4px 0 20px rgba(0, 0, 0, 0.15);
}

.nexus-sidebar-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: 0;
}

/* ===== 品牌標識區域 ===== */
.nexus-sidebar-header {
    padding: 1.5rem 1rem;
    border-bottom: 1px solid rgba(139, 92, 246, 0.2);
    background: rgba(139, 92, 246, 0.05);
}

.nexus-brand-section {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.nexus-brand-logo {
    width: 2.5rem;
    height: 2.5rem;
    background: linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
}

.nexus-brand-text {
    flex: 1;
    min-width: 0;
}

.nexus-brand-name {
    font-size: 1.125rem;
    font-weight: 700;
    color: #ffffff;
    line-height: 1.2;
    text-align: left; /* 確保文字水平對齊 */
    writing-mode: horizontal-tb; /* 強制水平書寫模式 */
}

.nexus-brand-tagline {
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.7);
    margin-top: 0.125rem;
    text-align: left; /* 確保文字水平對齊 */
    writing-mode: horizontal-tb; /* 強制水平書寫模式 */
}

/* ===== 導航區域 ===== */
.nexus-sidebar-nav {
    flex: 1;
    padding: 1rem 0;
}

.nexus-sidebar-list {
    list-style: none;
    margin: 0;
    padding: 0 0.5rem;
    display: flex;
    flex-direction: column; /* 修復：改為垂直排列 */
    gap: 0.25rem;
}

.nexus-sidebar-item {
    position: relative;
}

.nexus-sidebar-link {
    display: flex;
    align-items: center;
    padding: 0.875rem 1rem;
    color: rgba(255, 255, 255, 0.8);
    text-decoration: none;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    border-radius: 8px;
    position: relative;
    font-weight: 500;
    writing-mode: horizontal-tb; /* 強制水平書寫模式 */
    text-align: left; /* 確保文字水平對齊 */
}

.nexus-sidebar-link:hover,
.nexus-sidebar-link-hover {
    color: #ffffff;
    background: rgba(139, 92, 246, 0.15);
    transform: translateX(4px);
    box-shadow: 0 4px 12px rgba(139, 92, 246, 0.2);
}

.nexus-sidebar-link-active {
    color: #ffffff;
    background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
    box-shadow: 0 4px 16px rgba(139, 92, 246, 0.4);
    transform: translateX(4px);
}

.nexus-sidebar-link-active::before {
    content: '';
    position: absolute;
    left: -0.5rem;
    top: 50%;
    transform: translateY(-50%);
    width: 4px;
    height: 20px;
    background: #8b5cf6;
    border-radius: 2px;
}

.nexus-sidebar-icon {
    margin-right: 0.875rem;
    flex-shrink: 0;
    width: 1.25rem;
    height: 1.25rem;
    display: flex;
    align-items: center;
    justify-content: center;
}

.nexus-sidebar-text {
    font-size: 0.875rem;
    font-weight: 500;
    line-height: 1.4;
    writing-mode: horizontal-tb; /* 強制水平書寫模式 */
    text-align: left; /* 確保文字水平對齊 */
}

/* ===== 子選單系統 ===== */
.nexus-sidebar-submenu {
    list-style: none;
    margin: 0.25rem 0 0 0;
    padding: 0.5rem 0;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 6px;
    border-left: 2px solid rgba(139, 92, 246, 0.4);
}

.nexus-sidebar-sublink {
    display: block;
    padding: 0.5rem 1rem 0.5rem 2.5rem;
    color: rgba(255, 255, 255, 0.6);
    text-decoration: none;
    font-size: 0.8125rem;
    transition: all 0.2s ease;
    border-radius: 4px;
    margin: 0 0.5rem;
    writing-mode: horizontal-tb; /* 強制水平書寫模式 */
    text-align: left; /* 確保文字水平對齊 */
}

.nexus-sidebar-sublink:hover {
    color: rgba(255, 255, 255, 0.9);
    background: rgba(139, 92, 246, 0.1);
    transform: translateX(2px);
}

/* ===== 使用者資訊區域 ===== */
.nexus-sidebar-footer {
    border-top: 1px solid rgba(139, 92, 246, 0.2);
    padding: 1rem;
    background: rgba(139, 92, 246, 0.05);
}

.nexus-sidebar-user {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    background: rgba(0, 0, 0, 0.1);
    border-radius: 8px;
    transition: all 0.2s ease;
}

.nexus-sidebar-user:hover {
    background: rgba(139, 92, 246, 0.1);
    transform: translateY(-1px);
}

.nexus-sidebar-user-avatar {
    flex-shrink: 0;
    position: relative;
}

.nexus-sidebar-user-avatar::after {
    content: '';
    position: absolute;
    bottom: 0;
    right: 0;
    width: 12px;
    height: 12px;
    background: #10b981;
    border: 2px solid #2d2e3f;
    border-radius: 50%;
}

.nexus-sidebar-user-info {
    min-width: 0;
    flex: 1;
}

.nexus-sidebar-user-name {
    font-size: 0.875rem;
    font-weight: 600;
    color: #ffffff;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    writing-mode: horizontal-tb; /* 強制水平書寫模式 */
    text-align: left; /* 確保文字水平對齊 */
}

/* ===== 摺疊狀態 ===== */
.nexus-sidebar-collapsed {
    width: 4rem;
}

.nexus-sidebar-collapsed .nexus-brand-text,
.nexus-sidebar-collapsed .nexus-sidebar-text,
.nexus-sidebar-collapsed .nexus-sidebar-user-info {
    display: none;
}

.nexus-sidebar-collapsed .nexus-sidebar-link {
    justify-content: center;
    padding: 0.875rem;
}

.nexus-sidebar-collapsed .nexus-sidebar-icon {
    margin-right: 0;
}

.nexus-sidebar-collapsed .nexus-brand-section {
    justify-content: center;
}

.nexus-sidebar-collapsed .nexus-sidebar-user {
    justify-content: center;
}

/* ===== 響應式設計 ===== */
@media (max-width: 1024px) {
    .nexus-sidebar {
        transform: translateX(-100%);
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        z-index: 1050; /* 確保在手機版時顯示在最上層 */
    }
    
    .nexus-sidebar.nexus-sidebar-open {
        transform: translateX(0);
    }
    
    /* 手機版時添加遮罩 */
    .nexus-sidebar-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        z-index: 1040;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.3s ease;
    }
    
    .nexus-sidebar-overlay.active {
        opacity: 1;
        pointer-events: all;
    }
}

/* ===== 主佈局區域調整 ===== */
.nexus-main-layout {
    margin-left: 280px; /* 為側邊導航留出空間 */
    min-height: 100vh;
    background-color: var(--nexus-bg-primary);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

@media (max-width: 1024px) {
    .nexus-main-layout {
        margin-left: 0; /* 手機版時移除左邊距 */
    }
}

.nexus-main-content {
    padding: 1.5rem;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

@media (max-width: 1024px) {
    .nexus-main-content {
        padding: 1rem;
    }
}

/* ===== 滾動條樣式 ===== */
.nexus-sidebar::-webkit-scrollbar {
    width: 6px;
}

.nexus-sidebar::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.1);
}

.nexus-sidebar::-webkit-scrollbar-thumb {
    background: rgba(139, 92, 246, 0.3);
    border-radius: 3px;
}

.nexus-sidebar::-webkit-scrollbar-thumb:hover {
    background: rgba(139, 92, 246, 0.5);
}

/* ===== 無障礙支援 ===== */
.nexus-sidebar-link:focus {
    outline: 2px solid #8b5cf6;
    outline-offset: -2px;
    box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.2);
}

.nexus-sidebar-sublink:focus {
    outline: 2px solid #8b5cf6;
    outline-offset: -2px;
}

/* ===== 動畫減少支援 ===== */
@media (prefers-reduced-motion: reduce) {
    .nexus-sidebar,
    .nexus-sidebar-link,
    .nexus-sidebar-user,
    .nexus-main-content {
        transition: none !important;
    }
    
    .nexus-sidebar-link:hover,
    .nexus-sidebar-link-active {
        transform: none !important;
    }
}

/* ===== 高對比度支援 ===== */
@media (prefers-contrast: high) {
    .nexus-sidebar {
        border-right-width: 2px;
        border-right-color: #8b5cf6;
    }
    
    .nexus-sidebar-link-active {
        border: 2px solid #8b5cf6;
    }
}
</style>
@endpush