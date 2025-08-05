{{--
    增強型導航組件
    整合多層級導航、快速操作和使用者選單
--}}

@php
    use App\Services\NavigationService;
    
    $navigationService = app(NavigationService::class);
    $currentRoute = request()->route()->getName();
    
    // 獲取導航數據
    $mainNavigation = $navigationService->getMainNavigation($currentRoute);
    $quickActions = $navigationService->getQuickActions();
    $userMenu = $navigationService->getUserMenu();
@endphp

<nav x-data="enhancedNavigation()" 
     x-init="init()"
     class="relative overflow-visible transition-colors duration-300"
     role="navigation"
     aria-label="主要導航"
     style="min-height: 4rem; background-color: var(--nexus-nav-bg-primary); border-bottom: 1px solid var(--nexus-nav-border-primary); overflow: visible; position: relative; z-index: 1000;"
     
    <!-- 主導航容器 -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div class="flex justify-between items-center h-16 relative overflow-visible">
            
            <!-- 左側：Logo + 主導航 -->
            <div class="flex items-center">
                <!-- Logo -->
                <div class="shrink-0 flex items-center mr-8">
                    <a href="{{ route('dashboard') }}" class="flex items-center">
                        <x-application-logo class="block h-9 w-auto fill-current nx-text-primary" />
                        <span class="ml-3 text-xl font-bold nx-text-primary hidden lg:block">NexusERP</span>
                    </a>
                </div>

                <!-- 主導航 - 加寬容器確保下拉選單有充足空間 -->
                <div class="hidden lg:flex flex-1 justify-center items-center"> <!-- 改為居中，給下拉選單更多空間 -->
                    <div class="mr-8 px-4"> <!-- 增加內邊距和右邊距，確保充足空間 -->
                        <x-navigation.multi-level-nav 
                            :items="$mainNavigation"
                            orientation="horizontal"
                            size="default"
                            :show-icons="false"
                            :show-badges="true"
                            :active-route="$currentRoute"
                            id="main-navigation" />
                    </div>
                </div>
            </div>

            <!-- 右側：快速操作 + 主題切換 + 使用者選單 -->
            <div class="flex items-center justify-end space-x-2 md:space-x-3 lg:space-x-4 min-w-0 flex-shrink-0">
                


                <!-- 主題切換按鈕（水平排列） -->
                <div class="flex items-center space-x-2 flex-shrink-0">
                    <button data-theme-toggle 
                            class="nexus-theme-toggle flex items-center space-x-2 px-3 py-1.5 rounded-lg transition-colors"
                            aria-label="切換主題"
                            title="切換主題 (Ctrl+Shift+T)">
                        <!-- 太陽圖標（淺色主題） -->
                        <svg class="theme-toggle-sun w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path>
                        </svg>
                        <!-- 月亮圖標（暗色主題） -->
                        <svg class="theme-toggle-moon w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path>
                        </svg>
                        <span class="hidden lg:inline text-sm font-medium">主題</span>
                    </button>
                </div>

                <!-- 使用者下拉選單 -->
                <div class="relative flex-shrink-0 nexus-user-trigger-container" 
                     @mouseenter="showUserMenu && clearTimeout(userCloseTimeout)"
                     @mouseleave="showUserMenu && (console.log('Mouse leave on trigger container'), userCloseTimeout = setTimeout(() => { console.log('Mouse leave timeout triggered - closing menu'); showUserMenu = false; }, 300))">
                    <button @click.prevent.stop="toggleUserMenu()"
                            class="nexus-user-trigger-modern"
                            :aria-expanded="showUserMenu.toString()"
                            aria-haspopup="true"
                            aria-label="用戶選單"
                            id="user-menu-trigger"
                            title="{{ Auth::user() ? Auth::user()->name : '測試使用者' }}">
                        <!-- 使用者頭像 -->
                        <div class="nexus-user-avatar">
                            @if(Auth::user() && Auth::user()->avatar)
                                <img src="{{ Auth::user()->avatar }}" alt="使用者頭像" class="w-7 h-7 rounded-full object-cover">
                            @else
                                {{ Auth::user() ? strtoupper(substr(Auth::user()->name, 0, 1)) : 'G' }}
                            @endif
                        </div>
                        
                        <!-- 使用者資訊 (恢復顯示) -->
                        <div class="hidden sm:flex sm:flex-col">
                            <div class="text-sm font-medium nx-text-primary">{{ Auth::user() ? Auth::user()->name : '測試使用者' }}</div>
                            <div class="text-xs nx-text-secondary">{{ Auth::user() ? Auth::user()->email : 'test@example.com' }}</div>
                        </div>

                        <!-- 下拉箭頭 -->
                        <svg class="w-4 h-4 nx-text-secondary transition-transform duration-200" 
                             :class="{'rotate-180': showUserMenu}"
                             fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                        </svg>
                    </button>

                    <!-- 使用者選單下拉 -->
                    <div x-show="showUserMenu"
                         x-cloak
                         style="display: none;"
                         x-transition:enter="nexus-dropdown-enter"
                         x-transition:enter-start="nexus-dropdown-enter-start"
                         x-transition:enter-end="nexus-dropdown-enter-end"
                         x-transition:leave="nexus-dropdown-leave"
                         x-transition:leave-start="nexus-dropdown-leave-start"
                         x-transition:leave-end="nexus-dropdown-leave-end"
                         @click.outside="console.log('Click outside detected - closing menu'); showUserMenu = false"
                         @mouseenter="clearTimeout(userCloseTimeout)"
                         @mouseleave="console.log('Mouse leave on dropdown menu'); userCloseTimeout = setTimeout(() => { console.log('Dropdown mouse leave timeout - closing menu'); showUserMenu = false; }, 300)"
                         class="nexus-user-dropdown-modern"
                         id="user-dropdown-menu">
                        
                        <!-- 選單項目（簡化版） -->
                        <div class="nexus-menu-items-modern">
                            @foreach($userMenu as $item)
                                @if(isset($item['type']) && $item['type'] === 'divider')
                                    <div class="nexus-menu-divider-modern"></div>
                                @elseif(isset($item['type']) && $item['type'] === 'logout')
                                    <form method="POST" action="{{ route('logout') }}">
                                        @csrf
                                        <button type="submit" class="nexus-user-menu-item-modern nexus-logout-item-modern">
                                            {!! $item['icon'] !!}
                                            <span>{{ $item['title'] }}</span>
                                        </button>
                                    </form>
                                @else
                                    <a href="{{ $item['route'] }}" class="nexus-user-menu-item-modern">
                                        {!! $item['icon'] !!}
                                        <span>{{ $item['title'] }}</span>
                                    </a>
                                @endif
                            @endforeach
                        </div>
                    </div>
                </div>

                <!-- 行動版選單按鈕 -->
                <div class="lg:hidden flex-shrink-0 ml-2">
                    <button @click="toggleMobileMenu()" 
                            class="nexus-mobile-menu-trigger"
                            aria-expanded="false"
                            aria-label="開啟主選單">
                        <svg class="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                            <path :class="{'hidden': mobileMenuOpen, 'inline-flex': !mobileMenuOpen }" 
                                  class="inline-flex" 
                                  stroke-linecap="round" 
                                  stroke-linejoin="round" 
                                  stroke-width="2" 
                                  d="M4 6h16M4 12h16M4 18h16" />
                            <path :class="{'hidden': !mobileMenuOpen, 'inline-flex': mobileMenuOpen }" 
                                  class="hidden" 
                                  stroke-linecap="round" 
                                  stroke-linejoin="round" 
                                  stroke-width="2" 
                                  d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- 行動版導航選單 -->
    <div x-show="mobileMenuOpen" 
         x-transition:enter="transition ease-out duration-200"
         x-transition:enter-start="opacity-0 scale-95"
         x-transition:enter-end="opacity-1 scale-100"
         x-transition:leave="transition ease-in duration-100"
         x-transition:leave-start="opacity-1 scale-100"
         x-transition:leave-end="opacity-0 scale-95"
         class="lg:hidden nexus-mobile-menu">
        
        <!-- 主導航（行動版） - 改為水平排列 -->
        <div class="px-4 pt-2 pb-3">
            <x-navigation.multi-level-nav 
                :items="$mainNavigation"
                orientation="horizontal"
                size="compact"
                :show-icons="true"
                :show-badges="true"
                :active-route="$currentRoute"
                id="mobile-navigation" />
        </div>
        
        <!-- 快速操作（行動版） -->
        @if(!empty($quickActions))
        <div class="px-4 py-3 border-t nexus-border-secondary">
            <div class="text-xs font-semibold nx-text-muted uppercase tracking-wider mb-2">快速操作</div>
            <div class="space-y-1">
                @foreach($quickActions as $action)
                <a href="{{ $action['route'] }}" class="nexus-mobile-quick-action">
                    {!! $action['icon'] !!}
                    <span>{{ $action['title'] }}</span>
                </a>
                @endforeach
            </div>
        </div>
        @endif
    </div>
</nav>

@push('scripts')
<script>
function enhancedNavigation() {
    return {
        // 狀態管理
        showUserMenu: false,
        mobileMenuOpen: false,
        userCloseTimeout: null,
        justOpened: false, // 防止選單剛開啟就立即關閉
        
        // 新增狀態管理
        loadingActions: [],
        activeDropdown: null,
        navigationState: 'idle', // idle, loading, error
        interactionQueue: [],
        lastInteraction: null,
        
        // 活動指示器
        currentPageIndicator: null,
        breadcrumbPath: [],
        
        // 動畫狀態
        animationInProgress: false,
        pendingAnimations: [],
        
        
        // 初始化
        init() {
            this.setupKeyboardShortcuts();
            this.setupGlobalListeners();
            this.initializeActivityIndicators();
            this.detectCurrentPage();
            this.setupAdvancedInteractions();
            this.initializeThemeToggle();
            this.setupUserMenuFallback();
            
            // 強制應用導航樣式
            this.forceNavigationStyles();
        },
        
        // 強制應用導航樣式
        forceNavigationStyles() {
            console.log('開始強制應用導航樣式...');
            
            setTimeout(() => {
                const navElements = document.querySelectorAll('.nexus-nav-button, .nexus-nav-item-enhanced');
                console.log('找到導航元素:', navElements.length);
                
                navElements.forEach(element => {
                    // 強制添加視覺樣式
                    element.style.cssText += `
                        background: linear-gradient(135deg, rgba(139, 92, 246, 0.12) 0%, rgba(168, 85, 247, 0.08) 100%) !important;
                        border: 1px solid rgba(139, 92, 246, 0.2) !important;
                        border-radius: 0.75rem !important;
                        padding: 0.5rem 1.25rem !important;
                        margin: 0 0.25rem !important;
                        box-shadow: 0 2px 8px rgba(139, 92, 246, 0.1), 0 1px 3px rgba(139, 92, 246, 0.08) !important;
                        color: rgba(55, 65, 81, 0.9) !important;
                        font-weight: 600 !important;
                        transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1) !important;
                    `;
                    
                    // 添加懸停效果
                    element.addEventListener('mouseenter', function() {
                        this.style.cssText += `
                            background: linear-gradient(135deg, rgba(139, 92, 246, 0.18) 0%, rgba(168, 85, 247, 0.15) 100%) !important;
                            transform: translateY(-2px) scale(1.02) !important;
                            box-shadow: 0 8px 25px rgba(139, 92, 246, 0.25), 0 4px 12px rgba(139, 92, 246, 0.15) !important;
                            color: rgba(139, 92, 246, 1) !important;
                        `;
                    });
                    
                    element.addEventListener('mouseleave', function() {
                        this.style.cssText += `
                            background: linear-gradient(135deg, rgba(139, 92, 246, 0.12) 0%, rgba(168, 85, 247, 0.08) 100%) !important;
                            transform: translateY(0) scale(1) !important;
                            box-shadow: 0 2px 8px rgba(139, 92, 246, 0.1), 0 1px 3px rgba(139, 92, 246, 0.08) !important;
                            color: rgba(55, 65, 81, 0.9) !important;
                        `;
                    });
                });
                
                // 設置導航容器樣式
                const navContainer = document.querySelector('.nexus-multi-nav');
                if (navContainer) {
                    navContainer.style.cssText += `
                        background: rgba(30, 33, 57, 0.08) !important;
                        border-radius: 1rem !important;
                        backdrop-filter: blur(10px) !important;
                        border: 1px solid rgba(139, 92, 246, 0.1) !important;
                        box-shadow: 0 4px 20px rgba(139, 92, 246, 0.08) !important;
                        padding: 0.5rem !important;
                        display: inline-flex !important;
                        align-items: center !important;
                        gap: 0.5rem !important;
                    `;
                    console.log('導航容器樣式已應用');
                }
                
                // 強制修復下拉選單文字方向問題
                this.forceFixDropdownTextDirection();
                this.forceFixNavigationLayout();
                
                // 額外的延遲修復，確保 Alpine.js 完全初始化後再修復
                setTimeout(() => {
                    this.emergencyStyleFix();
                }, 500);
                
                if (document.querySelectorAll('.nexus-nav-dropdown').length > 0) {
                    console.log('下拉選單樣式已強制應用');
                }
            }, 100);
            
            // 延遲再次檢查，但避免無限遞歸
            setTimeout(() => {
                const navElements = document.querySelectorAll('.nexus-nav-button, .nexus-nav-item-enhanced');
                if (navElements.length === 0) {
                    console.log('導航元素尚未載入，延遲重試');
                    // 只重試一次
                    setTimeout(() => this.forceNavigationStyles(), 1000);
                }
            }, 1000);
            
            // 設置觀察器監聽動態創建的下拉選單
            this.setupDropdownObserver();
            
            // 啟動針對容器大小問題的持續修復機制
            this.startContinuousContainerFix();
        },
        
        // 強制修復下拉選單文字方向問題
        forceFixDropdownTextDirection() {
            console.log('開始修復下拉選單文字方向問題...');
            
            // 所有可能的下拉選單選擇器
            const selectors = [
                '.nexus-nav-dropdown',
                '.nexus-dropdown-list', 
                '.nexus-dropdown-item',
                '.nexus-dropdown-text',
                '.nexus-submenu-list',
                '.nexus-submenu-item', 
                '.nexus-submenu-text',
                '[role="menu"]',
                '[role="menuitem"]',
                '[class*="dropdown"]'
            ];
            
            selectors.forEach(selector => {
                const elements = document.querySelectorAll(selector);
                console.log(`找到 ${elements.length} 個 ${selector} 元素`);
                
                elements.forEach(element => {
                    // 強制設定文字方向樣式
                    element.style.cssText += `
                        writing-mode: initial !important;
                        text-orientation: initial !important;
                        direction: ltr !important;
                        transform: none !important;
                        display: flex !important;
                        flex-direction: row !important;
                        align-items: center !important;
                        white-space: nowrap !important;
                    `;
                    
                    // 修復所有子元素
                    const allChildren = element.querySelectorAll('*');
                    allChildren.forEach(child => {
                        child.style.cssText += `
                            writing-mode: initial !important;
                            text-orientation: initial !important;
                            direction: ltr !important;
                            transform: none !important;
                        `;
                    });
                });
            });
            
            // 特別處理包含特定文字的元素
            const problemTexts = ['財務會計', '庫存管理', '報價管理', '客戶關係管理', '產品與庫存'];
            problemTexts.forEach(text => {
                const elements = Array.from(document.querySelectorAll('*')).filter(el => el.textContent.trim() === text);
                console.log(`找到包含「${text}」的 ${elements.length} 個元素`);
                
                elements.forEach(element => {
                    element.style.cssText += `
                        writing-mode: initial !important;
                        text-orientation: initial !important;
                        direction: ltr !important;
                        transform: none !important;
                    `;
                    
                    // 也修復父容器
                    let parent = element.parentElement;
                    let level = 0;
                    while (parent && level < 5) {
                        parent.style.cssText += `
                            writing-mode: initial !important;
                            text-orientation: initial !important;
                            direction: ltr !important;
                            flex-direction: row !important;
                            align-items: center !important;
                        `;
                        parent = parent.parentElement;
                        level++;
                    }
                });
            });
        },
        
        // 設置下拉選單觀察器
        setupDropdownObserver() {
            // 使用 MutationObserver 監聽下拉選單的創建
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === 1) { // 元素節點
                            // 檢查是否是下拉選單
                            if (node.classList && node.classList.contains('nexus-nav-dropdown')) {
                                this.applyDropdownStyles(node);
                            }
                            
                            // 檢查子元素中是否有下拉選單
                            const dropdowns = node.querySelectorAll && node.querySelectorAll('.nexus-nav-dropdown');
                            if (dropdowns) {
                                dropdowns.forEach(dropdown => this.applyDropdownStyles(dropdown));
                            }
                        }
                    });
                });
            });
            
            // 開始觀察
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
            
            console.log('下拉選單觀察器已設置');
        },
        
        // 緊急修復函數 - 專門針對容器大小問題
        emergencyFixContainerSize() {
            console.log('執行容器大小緊急修復...');
            
            // 1. 強制修復滾動條問題 - 最高優先級
            const dropdowns = document.querySelectorAll('.nexus-nav-dropdown, [class*="nexus-dropdown"], [role="menu"]');
            dropdowns.forEach((dropdown, index) => {
                // 基礎修復
                dropdown.style.setProperty('max-height', 'none', 'important');
                dropdown.style.setProperty('height', 'auto', 'important');
                dropdown.style.setProperty('overflow', 'visible', 'important');
                dropdown.style.setProperty('overflow-x', 'visible', 'important');
                dropdown.style.setProperty('overflow-y', 'visible', 'important');
                dropdown.style.setProperty('scrollbar-width', 'none', 'important');
                dropdown.style.setProperty('-ms-overflow-style', 'none', 'important');
                
                // 針對最後兩個導航項目的特殊處理
                const navItems = document.querySelectorAll('.nexus-multi-nav li');
                if (navItems.length >= 2) {
                    const parentLi = dropdown.closest('li');
                    const isLastItem = parentLi === navItems[navItems.length - 1];
                    const isSecondLastItem = parentLi === navItems[navItems.length - 2];
                    
                    if (isLastItem || isSecondLastItem) {
                        console.log(`修復最後導航項目 ${isLastItem ? '(最後)' : '(倒數第二)'} 的下拉選單`);
                        
                        // 特殊定位策略
                        dropdown.style.setProperty('left', 'auto', 'important');
                        dropdown.style.setProperty('right', '0', 'important');
                        dropdown.style.setProperty('min-width', '200px', 'important');
                        dropdown.style.setProperty('max-width', '300px', 'important');
                        dropdown.style.setProperty('width', 'auto', 'important');
                        
                        // 確保完全沒有滾動條
                        dropdown.style.setProperty('overflow', 'visible', 'important');
                        dropdown.style.setProperty('max-height', 'none', 'important');
                    }
                }
            });
            
            // 2. 修復文字方向問題 - 確保水平排列
            const textElements = document.querySelectorAll('.nexus-dropdown-item, .nexus-dropdown-text, [role="menuitem"]');
            textElements.forEach(element => {
                element.style.setProperty('writing-mode', 'horizontal-tb', 'important');
                element.style.setProperty('text-orientation', 'initial', 'important');
                element.style.setProperty('direction', 'ltr', 'important');
                element.style.setProperty('display', 'flex', 'important');
                element.style.setProperty('flex-direction', 'row', 'important');
                element.style.setProperty('align-items', 'center', 'important');
                element.style.setProperty('white-space', 'nowrap', 'important');
                element.style.setProperty('transform', 'none', 'important');
            });
            
            // 3. 強制隱藏所有可能的滾動條
            const allScrollableElements = document.querySelectorAll('*');
            allScrollableElements.forEach(element => {
                if (element.classList.contains('nexus-nav-dropdown') || 
                    element.classList.contains('nexus-dropdown-list') ||
                    element.closest('.nexus-nav-dropdown')) {
                    element.style.setProperty('scrollbar-width', 'none', 'important');
                    element.style.setProperty('-ms-overflow-style', 'none', 'important');
                }
            });
            
            console.log(`容器大小緊急修復完成 - 處理了 ${dropdowns.length} 個下拉選單和 ${textElements.length} 個文字元素`);
        },
        
        // 啟動持續修復機制 - 專注於容器大小問題
        startContinuousContainerFix() {
            console.log('啟動容器大小持續修復機制...');
            
            // 立即執行一次修復
            this.emergencyFixContainerSize();
            
            // 每2秒執行一次修復，持續20秒（共10次）
            let fixCount = 0;
            const fixInterval = setInterval(() => {
                this.emergencyFixContainerSize();
                fixCount++;
                
                if (fixCount >= 10) {
                    clearInterval(fixInterval);
                    console.log('容器大小持續修復完成');
                }
            }, 2000);
            
            // 監聽導航項目的互動事件，立即觸發修復
            document.addEventListener('mouseenter', (e) => {
                const navElement = e.target.closest('.nexus-multi-nav li');
                if (navElement) {
                    console.log('檢測到導航懸停，執行修復');
                    setTimeout(() => this.emergencyFixContainerSize(), 50);
                }
            }, true);
            
            // 監聽點擊事件
            document.addEventListener('click', (e) => {
                const navElement = e.target.closest('.nexus-multi-nav');
                if (navElement) {
                    console.log('檢測到導航點擊，執行修復');
                    setTimeout(() => this.emergencyFixContainerSize(), 50);
                }
            });
            
            // 監聽滾動事件 - 防止滾動條出現
            document.addEventListener('scroll', (e) => {
                const isDropdown = e.target.closest('.nexus-nav-dropdown');
                if (isDropdown) {
                    console.log('檢測到下拉選單滾動，強制修復');
                    e.preventDefault();
                    e.stopPropagation();
                    this.emergencyFixContainerSize();
                }
            }, true);
        },
        
        // 應用下拉選單樣式
        applyDropdownStyles(dropdown) {
            console.log('應用下拉選單樣式到:', dropdown);
            
            // 容器樣式
            dropdown.style.cssText += `
                min-width: 280px !important;
                max-width: 400px !important;
                width: max-content !important;
                overflow: visible !important;
                background: rgba(255, 255, 255, 0.98) !important;
                border: 1px solid rgba(139, 92, 246, 0.2) !important;
                border-radius: 0.75rem !important;
                box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15), 0 4px 12px rgba(139, 92, 246, 0.1) !important;
                position: absolute !important;
                z-index: 9999 !important;
                writing-mode: initial !important;
                text-orientation: initial !important;
                direction: ltr !important;
            `;
            
            // 下拉選單項目樣式 - 強化文字方向修復
            const items = dropdown.querySelectorAll('.nexus-dropdown-item, a, li, span');
            console.log(`修復 ${items.length} 個下拉選單項目`);
            items.forEach(item => {
                item.style.cssText += `
                    display: flex !important;
                    align-items: center !important;
                    flex-direction: row !important;
                    white-space: nowrap !important;
                    writing-mode: initial !important;
                    text-orientation: initial !important;
                    direction: ltr !important;
                    transform: none !important;
                    width: 100% !important;
                    padding: 0.75rem 1rem !important;
                    font-size: 0.875rem !important;
                    color: rgba(55, 65, 81, 0.9) !important;
                `;
            });
            
            // 下拉選單文字樣式 - 強化修復
            const texts = dropdown.querySelectorAll('.nexus-dropdown-text, span, a');
            console.log(`修復 ${texts.length} 個文字元素`);
            texts.forEach(text => {
                text.style.cssText += `
                    writing-mode: initial !important;
                    text-orientation: initial !important;
                    white-space: nowrap !important;
                    direction: ltr !important;
                    transform: none !important;
                    flex: 1 !important;
                    text-align: left !important;
                `;
            });
            
            // 確保列表樣式正確
            const lists = dropdown.querySelectorAll('.nexus-dropdown-list, ul, ol');
            lists.forEach(list => {
                list.style.cssText += `
                    overflow: visible !important;
                    padding: 0.5rem !important;
                    writing-mode: initial !important;
                    text-orientation: initial !important;
                    direction: ltr !important;
                `;
            });
            
            // 修復所有子元素的文字方向
            const allChildren = dropdown.querySelectorAll('*');
            console.log(`修復 ${allChildren.length} 個所有子元素`);
            allChildren.forEach(child => {
                child.style.setProperty('writing-mode', 'initial', 'important');
                child.style.setProperty('text-orientation', 'initial', 'important');
                child.style.setProperty('direction', 'ltr', 'important');
                child.style.setProperty('transform', 'none', 'important');
            });
        },
        
        // 緊急樣式修復 - 最高優先級修復所有導航問題
        emergencyStyleFix() {
            console.log('執行緊急樣式修復...');
            
            // 修復所有下拉選單的滾動條問題
            const dropdowns = document.querySelectorAll('.nexus-nav-dropdown, .nexus-dropdown-list, [class*="nexus-dropdown"]');
            dropdowns.forEach(dropdown => {
                dropdown.style.setProperty('max-height', 'none', 'important');
                dropdown.style.setProperty('height', 'auto', 'important');
                dropdown.style.setProperty('overflow', 'visible', 'important');
                dropdown.style.setProperty('overflow-x', 'visible', 'important');
                dropdown.style.setProperty('overflow-y', 'visible', 'important');
                dropdown.style.setProperty('scrollbar-width', 'none', 'important');
            });
            
            // 修復所有導航文字的方向問題
            const textElements = document.querySelectorAll('.nexus-nav-text, .nexus-sidebar-text, .nexus-dropdown-text, .nexus-brand-name, .nexus-brand-tagline');
            textElements.forEach(element => {
                element.style.setProperty('writing-mode', 'horizontal-tb', 'important');
                element.style.setProperty('text-orientation', 'mixed', 'important');
                element.style.setProperty('direction', 'ltr', 'important');
                element.style.setProperty('text-align', 'left', 'important');
                element.style.setProperty('display', 'inline-block', 'important');
                element.style.setProperty('white-space', 'nowrap', 'important');
            });
            
            // 修復側邊導航的佈局問題
            const sidebarList = document.querySelector('.nexus-sidebar-list');
            if (sidebarList) {
                sidebarList.style.setProperty('flex-direction', 'column', 'important');
            }
            
            console.log('緊急樣式修復完成');
        },
        
        // 強制修復導航佈局
        forceFixNavigationLayout() {
            // 確保所有導航列表都是垂直排列
            const navLists = document.querySelectorAll('.nexus-sidebar-list, .nexus-nav-list-vertical');
            navLists.forEach(list => {
                list.style.setProperty('flex-direction', 'column', 'important');
                list.style.setProperty('writing-mode', 'horizontal-tb', 'important');
            });
        },

        // 初始化主題切換功能
        initializeThemeToggle() {
            // 確保主題管理器已載入
            if (window.NexusTheme) {
                // 更新導航樣式以反映當前主題
                this.updateNavigationTheme();
                
                // 監聽主題變更事件
                document.addEventListener('nexus-theme-changed', (e) => {
                    this.updateNavigationTheme();
                });
            } else {
                // 如果主題管理器未載入，延遲重試
                setTimeout(() => {
                    this.initializeThemeToggle();
                }, 100);
            }
        },

        // 更新導航主題
        updateNavigationTheme() {
            const navigation = document.querySelector('nav[x-data="enhancedNavigation()"]');
            if (navigation) {
                // 強制重新應用CSS變數
                navigation.style.cssText = navigation.style.cssText;
                
                // 更新背景色和邊框
                const currentTheme = window.NexusTheme ? window.NexusTheme.getCurrentTheme() : 'dark';
                if (currentTheme === 'light') {
                    navigation.style.backgroundColor = 'var(--nexus-nav-bg-primary)';
                    navigation.style.borderBottomColor = 'var(--nexus-nav-border-primary)';
                } else {
                    navigation.style.backgroundColor = 'var(--nexus-nav-bg-primary)';
                    navigation.style.borderBottomColor = 'var(--nexus-nav-border-primary)';
                }
            }
        },
        
        // 切換使用者選單
        toggleUserMenu() {
            console.log('toggleUserMenu called'); // Debug log
            
            // Debounce mechanism to prevent multiple rapid calls
            if (this._toggleDebounce) {
                console.log('toggleUserMenu debounced - ignoring rapid call');
                return;
            }
            
            this._toggleDebounce = true;
            setTimeout(() => {
                this._toggleDebounce = false;
            }, 100); // 100ms debounce
            
            // 清除任何掛起的timeout
            if (this.userCloseTimeout) {
                clearTimeout(this.userCloseTimeout);
                this.userCloseTimeout = null;
            }
            
            // Explicit context binding
            const self = this;
            
            console.log('Before toggle - showUserMenu:', self.showUserMenu);
            
            if (self.showUserMenu) {
                // 關閉選單
                console.log('Closing user menu');
                self.showUserMenu = false;
                self.activeDropdown = null;
            } else {
                // 關閉其他選單和timeout
                console.log('Opening user menu');
                self.closeOtherMenus();
                self.showUserMenu = true;
                self.activeDropdown = 'user';
                
                // 增強的保護期，防止立即關閉
                self.justOpened = true;
                setTimeout(() => {
                    self.justOpened = false;
                }, 300); // 增加到300ms
                
                // 用戶選單已打開
            }
            
            // Force Alpine.js reactivity update
            this.$nextTick(() => {
                console.log('Alpine nextTick completed, showUserMenu:', self.showUserMenu);
            });
        },
        
        // 關閉其他選單和清除timeout
        closeOtherMenus() {
            // Method kept for future menu additions
        },
        
        // 延遲關閉使用者選單 (防止立即關閉)
        closeUserMenuDelayed() {
            // 如果剛剛開啟，忽略關閉請求
            if (this.justOpened || this.activeDropdown !== 'user') {
                return;
            }
            
            // 清除任何現有的timeout
            if (this.userCloseTimeout) {
                clearTimeout(this.userCloseTimeout);
                this.userCloseTimeout = null;
            }
            
            // 設置較長的延遲來避免意外關閉
            this.userCloseTimeout = setTimeout(() => {
                if (!this.justOpened) { // 雙重檢查
                    this.showUserMenu = false;
                    this.activeDropdown = null;
                }
                this.userCloseTimeout = null;
            }, 500); // 增加到500ms延遲，更安全
        },
        
        // 設置使用者選單備用事件處理器
        setupUserMenuFallback() {
            // Simplified fallback - only setup global function for emergency use
            // The primary Alpine.js @click handler should handle all normal interactions
            const self = this;
            
            // 全域備用函數 (僅在 Alpine.js 完全失敗時使用)
            window.toggleUserMenuFallback = function() {
                console.log('Emergency fallback triggered');
                const dropdown = document.querySelector('[data-dropdown-menu="user-menu"]');
                if (dropdown) {
                    const isVisible = dropdown.style.display !== 'none' && dropdown.style.display !== '';
                    dropdown.style.display = isVisible ? 'none' : 'block';
                    console.log('Emergency fallback - dropdown toggled:', !isVisible);
                }
            };
        },
        
        // 切換行動版選單
        toggleMobileMenu() {
            this.mobileMenuOpen = !this.mobileMenuOpen;
            
            // 防止背景滾動
            if (this.mobileMenuOpen) {
                document.body.style.overflow = 'hidden';
            } else {
                document.body.style.overflow = '';
            }
        },
        
        // 開啟全域搜尋
        openGlobalSearch() {
            // 觸發全域搜尋事件
            window.dispatchEvent(new CustomEvent('open-global-search'));
        },
        
        // 設定鍵盤快捷鍵
        setupKeyboardShortcuts() {
            document.addEventListener('keydown', (e) => {
                // Ctrl+K 或 Cmd+K 開啟搜尋
                if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                    e.preventDefault();
                    this.openGlobalSearch();
                }
                
                // Ctrl+Shift+T 切換主題
                if (e.ctrlKey && e.shiftKey && e.key === 'T') {
                    e.preventDefault();
                    const themeToggle = document.querySelector('[data-theme-toggle]');
                    if (themeToggle) {
                        themeToggle.click();
                    }
                }
                
                // ESC 關閉所有選單
                if (e.key === 'Escape') {
                    this.closeAllDropdowns();
                    this.mobileMenuOpen = false;
                    document.body.style.overflow = '';
                }
            });
        },
        
        // 設定全域監聽器
        setupGlobalListeners() {
            // 視窗大小改變時關閉行動版選單
            window.addEventListener('resize', () => {
                if (window.innerWidth >= 1024) { // lg breakpoint
                    this.mobileMenuOpen = false;
                    document.body.style.overflow = '';
                }
            });
            
            // 路由變更時關閉選單
            if (window.navigation) {
                window.navigation.addEventListener('navigate', () => {
                    this.closeAllDropdowns();
                    this.mobileMenuOpen = false;
                    document.body.style.overflow = '';
                });
            }
        },
        
        // ========================= 
        // 新增高級狀態管理與互動功能
        // =========================
        
        // 初始化活動指示器
        initializeActivityIndicators() {
            // 設置頁面載入指示器
            this.navigationState = 'idle';
            
            // 監聽頁面載入事件
            if (document.readyState === 'loading') {
                this.navigationState = 'loading';
                document.addEventListener('DOMContentLoaded', () => {
                    this.navigationState = 'idle';
                });
            }
        },
        
        // 檢測當前頁面並設置指示器
        detectCurrentPage() {
            const currentPath = window.location.pathname;
            const currentRoute = window.location.pathname.split('/').filter(Boolean);
            
            this.currentPageIndicator = {
                path: currentPath,
                route: currentRoute,
                title: document.title,
                timestamp: new Date()
            };
            
            // 更新麵包屑路徑
            this.updateBreadcrumbPath(currentRoute);
        },
        
        // 更新麵包屑路徑
        updateBreadcrumbPath(route) {
            this.breadcrumbPath = route.map((segment, index) => ({
                name: this.formatSegmentName(segment),
                path: '/' + route.slice(0, index + 1).join('/'),
                isActive: index === route.length - 1
            }));
        },
        
        // 格式化路徑段落名稱
        formatSegmentName(segment) {
            const nameMap = {
                'dashboard': '儀表板',
                'inventory': '庫存管理',
                'products': '產品管理',
                'orders': '訂單管理',
                'users': '用戶管理',
                'settings': '系統設置',
                'reports': '報表中心'
            };
            
            return nameMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
        },
        
        // 設置高級互動功能
        setupAdvancedInteractions() {
            // 滑鼠懸停效果增強
            this.setupHoverEffects();
            
            // 鍵盤導航增強
            this.setupKeyboardNavigation();
            
            // 點擊外部關閉所有下拉選單
            this.setupOutsideClickHandler();
            
            // 性能監控
            this.setupPerformanceMonitoring();
        },
        
        // 設置懸停效果
        setupHoverEffects() {
            document.addEventListener('mouseover', (e) => {
                const navItem = e.target.closest('.nexus-nav-button, .nexus-quick-action, .nexus-user-trigger');
                if (navItem) {
                    this.handleNavItemHover(navItem, 'enter');
                }
            });
            
            document.addEventListener('mouseout', (e) => {
                const navItem = e.target.closest('.nexus-nav-button, .nexus-quick-action, .nexus-user-trigger');
                if (navItem) {
                    this.handleNavItemHover(navItem, 'leave');
                }
            });
        },
        
        // 處理導航項目懸停
        handleNavItemHover(element, action) {
            if (action === 'enter') {
                element.classList.add('nexus-hover-active');
                this.trackInteraction('hover_enter', element.getAttribute('title') || 'unknown');
            } else {
                element.classList.remove('nexus-hover-active');
                this.trackInteraction('hover_leave', element.getAttribute('title') || 'unknown');
            }
        },
        
        // 增強鍵盤導航
        setupKeyboardNavigation() {
            document.addEventListener('keydown', (e) => {
                switch(e.key) {
                    case 'Tab':
                        this.handleTabNavigation(e);
                        break;
                    case 'Enter':
                    case ' ':
                        this.handleActivation(e);
                        break;
                    case 'ArrowDown':
                    case 'ArrowUp':
                        this.handleArrowNavigation(e);
                        break;
                }
            });
        },
        
        // 處理Tab導航
        handleTabNavigation(e) {
            const focusableElements = document.querySelectorAll(
                'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
            );
            
            const currentIndex = Array.from(focusableElements).indexOf(document.activeElement);
            
            if (e.shiftKey) {
                // Shift+Tab - 前一個元素
                if (currentIndex > 0) {
                    focusableElements[currentIndex - 1].focus();
                }
            } else {
                // Tab - 下一個元素
                if (currentIndex < focusableElements.length - 1) {
                    focusableElements[currentIndex + 1].focus();
                }
            }
        },
        
        // 處理激活事件
        handleActivation(e) {
            const activeElement = document.activeElement;
            if (activeElement.matches('.nexus-nav-button, .nexus-quick-action, .nexus-user-trigger')) {
                e.preventDefault();
                activeElement.click();
            }
        },
        
        // 處理箭頭導航
        handleArrowNavigation(e) {
            if (this.showUserMenu) {
                e.preventDefault();
                this.navigateDropdownItems(e.key);
            }
        },
        
        // 導航下拉選單項目
        navigateDropdownItems(direction) {
            const activeDropdown = document.querySelector('.nexus-user-dropdown:not([style*="display: none"])');
            if (!activeDropdown) return;
            
            const items = activeDropdown.querySelectorAll('a, button');
            const currentIndex = Array.from(items).indexOf(document.activeElement);
            
            let nextIndex;
            if (direction === 'ArrowDown') {
                nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
            } else {
                nextIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
            }
            
            items[nextIndex].focus();
        },
        
        // 設置外部點擊處理器
        setupOutsideClickHandler() {
            document.addEventListener('click', (e) => {
                if (!e.target.closest('.nexus-multi-nav')) {
                    this.closeAllDropdowns();
                }
            });
        },
        
        // 關閉所有下拉選單
        closeAllDropdowns() {
            // 清除所有timeout
            if (this.userCloseTimeout) {
                clearTimeout(this.userCloseTimeout);
                this.userCloseTimeout = null;
            }
            
            this.showUserMenu = false;
            this.activeDropdown = null;
        },
        
        // 性能監控
        setupPerformanceMonitoring() {
            // 監控動畫性能
            let animationFrameId;
            const monitorAnimations = () => {
                if (this.animationInProgress) {
                    // 檢查動畫是否影響性能
                    const start = performance.now();
                    animationFrameId = requestAnimationFrame(() => {
                        const duration = performance.now() - start;
                        if (duration > 16.67) { // >60fps
                            console.warn('Navigation animation performance issue:', duration + 'ms');
                        }
                        monitorAnimations();
                    });
                } else if (animationFrameId) {
                    cancelAnimationFrame(animationFrameId);
                }
            };
            
            monitorAnimations();
        },
        
        // 追蹤互動事件
        trackInteraction(type, detail) {
            const interaction = {
                type,
                detail,
                timestamp: new Date(),
                userAgent: navigator.userAgent,
                viewport: {
                    width: window.innerWidth,
                    height: window.innerHeight
                }
            };
            
            this.interactionQueue.push(interaction);
            this.lastInteraction = interaction;
            
            // 限制隊列大小
            if (this.interactionQueue.length > 100) {
                this.interactionQueue.shift();
            }
            
            // 發送到分析服務（如果有的話）
            if (window.nexusAnalytics) {
                window.nexusAnalytics.track('navigation_interaction', interaction);
            }
        },
        
        // 獲取導航統計
        getNavigationStats() {
            return {
                totalInteractions: this.interactionQueue.length,
                lastInteraction: this.lastInteraction,
                currentPage: this.currentPageIndicator,
                breadcrumbPath: this.breadcrumbPath,
                activeState: {
                    userMenu: this.showUserMenu,
                    mobileMenu: this.mobileMenuOpen
                }
            };
        },
        
        // 重置導航狀態
        resetNavigationState() {
            // 清除所有timeout
            if (this.userCloseTimeout) {
                clearTimeout(this.userCloseTimeout);
                this.userCloseTimeout = null;
            }
            
            this.showUserMenu = false;
            this.mobileMenuOpen = false;
            this.activeDropdown = null;
            this.animationInProgress = false;
            this.pendingAnimations = [];
            this.loadingActions = [];
            
            console.log('Navigation state reset');
        },
        
        // ========================= 
        // 清理完成 - 動態定位已改為 CSS 實現
        // =========================
        
    };
}
</script>
@endpush

@push('styles')
<style>
/* 強制載入導航列現代化樣式 - 最高優先級 */
.nexus-multi-nav,
nav[class*="nexus-multi-nav"],
[class*="nexus-multi-nav"] {
    display: inline-flex !important;
    align-items: center !important;
    gap: 0.5rem !important;
    padding: 0.5rem !important;
    background: rgba(30, 33, 57, 0.08) !important;
    border-radius: 1rem !important;
    backdrop-filter: blur(10px) !important;
    border: 1px solid rgba(139, 92, 246, 0.1) !important;
    box-shadow: 0 4px 20px rgba(139, 92, 246, 0.08) !important;
    vertical-align: middle !important;
    margin: 0 !important;
}

/* 強制套用導航按鈕樣式 */
.nexus-multi-nav button,
.nexus-multi-nav a,
nav[class*="nexus-multi-nav"] button,
nav[class*="nexus-multi-nav"] a,
[class*="nexus-multi-nav"] button,
[class*="nexus-multi-nav"] a,
.nexus-nav-button,
.nexus-nav-item-enhanced {
    font-size: 1rem !important;
    font-weight: 600 !important;
    letter-spacing: -0.01em !important;
    background: linear-gradient(135deg, rgba(139, 92, 246, 0.12) 0%, rgba(168, 85, 247, 0.08) 100%) !important;
    border: 1px solid rgba(139, 92, 246, 0.2) !important;
    border-radius: 0.75rem !important;
    padding: 0.5rem 1.25rem !important;
    margin: 0 !important;
    transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1) !important;
    box-shadow: 
        0 2px 8px rgba(139, 92, 246, 0.1),
        0 1px 3px rgba(139, 92, 246, 0.08),
        inset 0 1px 0 rgba(255, 255, 255, 0.1) !important;
    position: relative !important;
    overflow: hidden !important;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1) !important;
    color: rgba(55, 65, 81, 0.9) !important;
    height: auto !important;
    line-height: 1.5 !important;
    display: inline-flex !important;
    align-items: center !important;
    text-decoration: none !important;
    cursor: pointer !important;
}

/* 強制套用懸停效果 */
.nexus-multi-nav button:hover,
.nexus-multi-nav a:hover,
nav[class*="nexus-multi-nav"] button:hover,
nav[class*="nexus-multi-nav"] a:hover,
[class*="nexus-multi-nav"] button:hover,
[class*="nexus-multi-nav"] a:hover,
.nexus-nav-button:hover,
.nexus-nav-item-enhanced:hover {
    background: linear-gradient(135deg, rgba(139, 92, 246, 0.18) 0%, rgba(168, 85, 247, 0.15) 100%) !important;
    border-color: rgba(139, 92, 246, 0.4) !important;
    transform: translateY(-2px) scale(1.02) !important;
    box-shadow: 
        0 8px 25px rgba(139, 92, 246, 0.25),
        0 4px 12px rgba(139, 92, 246, 0.15),
        inset 0 1px 0 rgba(255, 255, 255, 0.2) !important;
    color: rgba(139, 92, 246, 1) !important;
    text-shadow: 0 2px 4px rgba(139, 92, 246, 0.3) !important;
}

/* 活動狀態強制套用 */
.nexus-multi-nav button.nexus-nav-active,
.nexus-multi-nav a.nexus-nav-active,
nav[class*="nexus-multi-nav"] button.nexus-nav-active,
nav[class*="nexus-multi-nav"] a.nexus-nav-active,
[class*="nexus-multi-nav"] button.nexus-nav-active,
[class*="nexus-multi-nav"] a.nexus-nav-active,
.nexus-nav-button.nexus-nav-active,
.nexus-nav-item-enhanced.nexus-nav-active {
    background: linear-gradient(135deg, rgba(139, 92, 246, 0.4) 0%, rgba(168, 85, 247, 0.35) 50%, rgba(147, 51, 234, 0.3) 100%) !important;
    border: 2px solid rgba(139, 92, 246, 0.8) !important;
    color: rgba(139, 92, 246, 1) !important;
    font-weight: 700 !important;
    transform: translateY(-1px) !important;
    box-shadow: 
        0 8px 25px rgba(139, 92, 246, 0.5),
        0 4px 15px rgba(139, 92, 246, 0.3),
        inset 0 1px 0 rgba(255, 255, 255, 0.4),
        inset 0 -1px 0 rgba(139, 92, 246, 0.3) !important;
    text-shadow: 0 2px 4px rgba(139, 92, 246, 0.5) !important;
}

/* Alpine.js x-cloak 和 x-show 修復 */
[x-cloak] { 
    display: none !important; 
}

/* 強制覆蓋 x-show 的 display 屬性 */
#user-dropdown-menu[x-show="showUserMenu"] {
    display: block !important;
}

/* 調試用：強制顯示下拉選單 */
.nexus-user-dropdown.force-show {
    display: block !important;
    opacity: 1 !important;
    visibility: visible !important;
    transform: translateY(0) !important;
}

/* 確保 Alpine.js 響應式更新 */
[x-show] {
    transition: opacity 0.2s ease, transform 0.2s ease;
}
/* 快速操作按鈕 */
.nexus-quick-action {
    @apply inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200;
}

.nexus-quick-primary {
    @apply bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5;
}

/* 搜尋觸發器 */
.nexus-search-trigger {
    @apply flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200;
    @apply nx-text-secondary hover:nx-text-primary hover:nx-bg-tertiary;
    @apply border border-transparent hover:border-gray-300 dark:hover:border-gray-600;
    @apply min-w-0 max-w-none whitespace-nowrap;
}


/* 主題切換（水平排列） */
.nexus-theme-toggle {
    @apply px-3 py-1.5 rounded-lg transition-all duration-200;
    @apply nx-text-secondary hover:nx-text-primary hover:nx-bg-tertiary;
    @apply flex items-center justify-center space-x-2;
    @apply border border-transparent hover:border-gray-300 dark:hover:border-gray-600;
    @apply min-w-0 whitespace-nowrap;
}

/* 使用者選單 */
.nexus-user-trigger {
    @apply flex items-center p-2 rounded-lg transition-all duration-200;
    @apply nx-text-secondary hover:nx-text-primary hover:nx-bg-tertiary;
}

/* 確保用戶選單容器有正確的定位上下文 */
.nexus-user-trigger-container {
    position: relative !important;
    z-index: 1000;
}

.nexus-user-avatar {
    @apply flex-shrink-0;
}

/* ===== 現代化使用者選單設計 ===== */

/* 觸發器設計 */
.nexus-user-trigger-modern {
    @apply flex items-center p-2 rounded-lg transition-all duration-200;
    @apply nx-text-secondary hover:nx-text-primary hover:nx-bg-tertiary;
    @apply border border-transparent hover:border-gray-300 dark:hover:border-gray-600;
    @apply transform hover:-translate-y-0.5 hover:shadow-md;
}

.nexus-user-avatar-modern {
    @apply flex items-center;
}

/* 下拉選單容器 */
.nexus-user-dropdown-modern {
    position: absolute !important;
    top: calc(100% + 0.5rem) !important;
    right: 0 !important;
    width: 11rem;
    max-width: 90vw;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    z-index: 9999 !important;
    overflow: hidden;
    transform-origin: top right;
}

.dark .nexus-user-dropdown-modern {
    background: #1f2937;
    border-color: #374151;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.25), 0 10px 10px -5px rgba(0, 0, 0, 0.1);
}

/* 選單項目容器 */
.nexus-menu-items-modern {
    @apply py-1;
}

/* 選單項目樣式 */
.nexus-user-menu-item-modern {
    display: flex;
    align-items: center;
    width: 100%;
    padding: 0.625rem 1rem;
    color: #374151;
    text-decoration: none;
    font-size: 0.875rem;
    font-weight: 500;
    transition: all 0.15s ease;
    border: none;
    background: transparent;
    text-align: left;
    cursor: pointer;
}

.dark .nexus-user-menu-item-modern {
    color: #d1d5db;
}

.nexus-user-menu-item-modern:hover {
    color: #111827;
    background: #f8fafc;
    transform: translateX(2px);
}

.dark .nexus-user-menu-item-modern:hover {
    color: #f9fafb;
    background: #374151;
}

.nexus-user-menu-item-modern svg {
    width: 1rem;
    height: 1rem;
    margin-right: 0.75rem;
    flex-shrink: 0;
    opacity: 0.7;
}

.nexus-user-menu-item-modern:hover svg {
    opacity: 1;
}

/* 登出項目特殊樣式 */
.nexus-logout-item-modern {
    color: #dc2626 !important;
}

.dark .nexus-logout-item-modern {
    color: #f87171 !important;
}

.nexus-logout-item-modern:hover {
    color: #991b1b !important;
    background: #fef2f2 !important;
}

.dark .nexus-logout-item-modern:hover {
    color: #fca5a5 !important;
    background: #7f1d1d !important;
}

.nexus-logout-item-modern svg {
    color: inherit !important;
}

/* 分隔線 */
.nexus-menu-divider-modern {
    border-top: 1px solid #f1f5f9;
    margin: 0.25rem 0;
}

.dark .nexus-menu-divider-modern {
    border-top-color: #334155;
}

/* 行動版選單 */
.nexus-mobile-menu-trigger {
    @apply p-2 rounded-lg transition-all duration-200;
    @apply nx-text-secondary hover:nx-text-primary hover:nx-bg-tertiary;
}

.nexus-mobile-menu {
    @apply bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700;
}

.nexus-mobile-quick-action {
    @apply flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200;
    @apply nx-text-secondary hover:nx-text-primary hover:nx-bg-tertiary;
}

.nexus-mobile-quick-action svg {
    @apply w-4 h-4 mr-3 flex-shrink-0;
}

/* ========================= */
/* 高級互動狀態樣式 */
/* ========================= */

/* 懸停活動狀態 */
.nexus-hover-active {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(139, 92, 246, 0.15);
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 活動指示器 */
.nexus-activity-indicator {
    position: absolute;
    top: -2px;
    right: -2px;
    width: 8px;
    height: 8px;
    background: linear-gradient(45deg, #f59e0b, #eab308);
    border-radius: 50%;
    box-shadow: 0 0 0 2px var(--nexus-nav-bg-primary);
    animation: pulse-indicator 2s infinite;
}

@keyframes pulse-indicator {
    0%, 100% { 
        opacity: 1; 
        transform: scale(1); 
    }
    50% { 
        opacity: 0.7; 
        transform: scale(1.1); 
    }
}

/* 載入狀態樣式 */
.nexus-action-loading {
    position: absolute;
    top: 50%;
    right: 8px;
    transform: translateY(-50%);
    z-index: 10;
}

.nexus-loading-state {
    position: relative;
    overflow: hidden;
}

.nexus-loading-state::after {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg,
        transparent,
        rgba(139, 92, 246, 0.1),
        transparent
    );
    animation: loading-shimmer 1.5s infinite;
}

@keyframes loading-shimmer {
    0% { left: -100%; }
    100% { left: 100%; }
}

/* 導航狀態指示器 */
.nexus-nav-state-indicator {
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 20px;
    height: 2px;
    border-radius: 1px;
    transition: all 0.3s ease;
}

.nexus-nav-state-idle .nexus-nav-state-indicator {
    background: transparent;
}

.nexus-nav-state-loading .nexus-nav-state-indicator {
    background: linear-gradient(90deg, #3b82f6, #8b5cf6);
    animation: state-loading 1s infinite;
}

.nexus-nav-state-error .nexus-nav-state-indicator {
    background: #ef4444;
    animation: state-error 0.5s infinite alternate;
}

@keyframes state-loading {
    0%, 100% { opacity: 0.3; }
    50% { opacity: 1; }
}

@keyframes state-error {
    0% { opacity: 1; }
    100% { opacity: 0.5; }
}

/* 麵包屑活動路徑指示器 */
.nexus-breadcrumb-indicator {
    position: relative;
    display: inline-flex;
    align-items: center;
    padding: 0.25rem 0.5rem;
    border-radius: 0.375rem;
    font-size: 0.75rem;
    background: rgba(139, 92, 246, 0.1);
    color: var(--nexus-accent-purple);
    border: 1px solid rgba(139, 92, 246, 0.2);
}

.nexus-breadcrumb-indicator::before {
    content: '';
    position: absolute;
    left: -1px;
    top: 50%;
    transform: translateY(-50%);
    width: 2px;
    height: 60%;
    background: var(--nexus-accent-purple);
    border-radius: 1px;
}

/* 增強的聚焦樣式 */
.nexus-nav-button:focus-visible,
.nexus-quick-action:focus-visible,
.nexus-user-trigger:focus-visible {
    outline: 2px solid var(--nexus-accent-purple);
    outline-offset: 2px;
    box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.1);
}

/* 鍵盤導航指示器 */
.nexus-keyboard-navigation-active {
    position: relative;
}

.nexus-keyboard-navigation-active::after {
    content: '';
    position: absolute;
    top: -2px;
    right: -2px;
    bottom: -2px;
    left: -2px;
    border: 2px solid var(--nexus-accent-purple);
    border-radius: calc(var(--nexus-nav-item-border-radius) + 2px);
    pointer-events: none;
    animation: keyboard-focus-pulse 1.5s infinite;
}

@keyframes keyboard-focus-pulse {
    0%, 100% { opacity: 0.6; }
    50% { opacity: 1; }
}

/* 動畫進行中狀態 */
.nexus-animation-in-progress {
    pointer-events: none;
    opacity: 0.8;
}

/* 互動熱點指示器 */
.nexus-interaction-hotspot {
    position: relative;
}

.nexus-interaction-hotspot::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 0;
    height: 0;
    background: radial-gradient(circle, rgba(139, 92, 246, 0.2) 0%, transparent 70%);
    border-radius: 50%;
    pointer-events: none;
    transition: all 0.3s ease;
}

.nexus-interaction-hotspot:hover::before {
    width: 120%;
    height: 120%;
}

/* 性能監控指示器 */
.nexus-performance-indicator {
    position: fixed;
    top: 10px;
    right: 10px;
    padding: 0.25rem 0.5rem;
    background: rgba(0, 0, 0, 0.8);
    color: #00ff00;
    font-family: monospace;
    font-size: 0.75rem;
    border-radius: 0.25rem;
    z-index: 10000;
    opacity: 0;
    transition: opacity 0.3s ease;
}

.nexus-performance-indicator.active {
    opacity: 1;
}

/* 響應式增強 */
@media (max-width: 768px) {
    .nexus-hover-active {
        transform: none;
        box-shadow: none;
    }
    
    .nexus-activity-indicator {
        width: 6px;
        height: 6px;
    }
    
    .nexus-nav-state-indicator {
        width: 16px;
        height: 1px;
    }
    
    /* 行動版導航優化 */
    .nexus-search-trigger span {
        display: none !important;
    }
    
    .nexus-search-trigger kbd {
        display: none !important;
    }
    
    .nexus-user-trigger {
        min-width: auto;
        max-width: 200px;
    }
    
    /* 確保右側導航元素不會溢出 */
    .flex.items-center.justify-end {
        gap: 0.5rem;
        flex-wrap: nowrap;
        overflow: hidden;
    }
}

/* 大螢幕優化 */
@media (min-width: 1024px) {
    .nexus-search-trigger {
        min-width: 180px;
    }
    
    .nexus-user-trigger {
        max-width: 240px;
    }
}

/* 高對比度模式增強 */
@media (prefers-contrast: high) {
    .nexus-activity-indicator {
        background: #ffff00;
        box-shadow: 0 0 0 2px #000000;
    }
    
    .nexus-nav-state-indicator {
        border: 1px solid currentColor;
    }
    
    .nexus-breadcrumb-indicator {
        border-width: 2px;
        background: transparent;
    }
}

/* 動畫禁用支援 */
@media (prefers-reduced-motion: reduce) {
    .nexus-hover-active,
    .nexus-activity-indicator,
    .nexus-loading-state::after,
    .nexus-nav-state-indicator,
    .nexus-keyboard-navigation-active::after,
    .nexus-interaction-hotspot::before {
        animation: none;
        transition: none;
        transform: none;
    }
}

/* 隱藏所有麵包屑和路徑導航 */
nav[aria-label*="麵包屑"],
nav[aria-label*="breadcrumb"],
.breadcrumb,
.breadcrumbs,
.nexus-breadcrumb,
.nexus-breadcrumb-container,
.nexus-breadcrumb-list,
.nexus-breadcrumb-indicator,
*[class*="breadcrumb"] {
    display: none !important;
    visibility: hidden !important;
}

/* Fix dropdown visibility issues */
[x-cloak] {
    display: none !important;
}

.nexus-user-dropdown[x-cloak] {
    display: none !important;
}

/* Ensure proper dropdown display when x-show is true */
.nexus-user-dropdown {
    display: none;
}

.nexus-user-dropdown[style*="display: block"] {
    display: block !important;
}

/* Fix Alpine.js x-show conflicts */
.nexus-user-dropdown[x-show][style*="display: none"] {
    display: none !important;
}

/* ===== 增強型導航列樣式 - 參考現代化設計 ===== */

/* 導航容器整體調整 - 確保正確對齊 */
.nexus-multi-nav {
    display: inline-flex !important; /* 使用inline-flex讓容器不占滿寬度 */
    align-items: center !important;
    gap: 0.5rem !important;
    padding: 0.5rem !important;
    background: rgba(30, 33, 57, 0.08) !important; /* 深色背景提升對比 */
    border-radius: 1rem !important;
    backdrop-filter: blur(10px) !important;
    border: 1px solid rgba(139, 92, 246, 0.1) !important;
    box-shadow: 0 4px 20px rgba(139, 92, 246, 0.08) !important;
    /* 確保與右側功能區垂直對齊 */
    vertical-align: middle !important;
    margin-top: 0 !important;
    margin-bottom: 0 !important;
}

/* 導航項目基礎樣式 - 使用更具體的選擇器 */
.nexus-multi-nav button.nexus-nav-button,
.nexus-multi-nav a.nexus-nav-button,
.nexus-multi-nav .nexus-nav-item-enhanced,
.nexus-nav-button,
.nexus-nav-item-enhanced {
    font-size: 1rem !important;
    font-weight: 600 !important;
    letter-spacing: -0.01em !important;
    background: linear-gradient(135deg, rgba(139, 92, 246, 0.12) 0%, rgba(168, 85, 247, 0.08) 100%) !important;
    border: 1px solid rgba(139, 92, 246, 0.2) !important;
    border-radius: 0.75rem !important;
    padding: 0.5rem 1.25rem !important;
    margin: 0 0.25rem !important; /* 添加項目間距 */
    transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1) !important;
    box-shadow: 
        0 2px 8px rgba(139, 92, 246, 0.1),
        0 1px 3px rgba(139, 92, 246, 0.08),
        inset 0 1px 0 rgba(255, 255, 255, 0.1) !important;
    position: relative !important;
    overflow: hidden !important;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1) !important;
    color: rgba(55, 65, 81, 0.9) !important;
    /* 覆蓋Tailwind樣式 */
    height: auto !important;
    line-height: 1.5 !important;
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    text-decoration: none !important;
}

/* 大螢幕優化 */
@media (min-width: 1024px) {
    .nexus-multi-nav button.nexus-nav-button,
    .nexus-multi-nav a.nexus-nav-button,
    .nexus-multi-nav .nexus-nav-item-enhanced,
    .nexus-nav-button,
    .nexus-nav-item-enhanced {
        font-size: 1.125rem !important;
        padding: 0.625rem 1.5rem !important;
    }
    
    .nexus-multi-nav {
        gap: 0.75rem;
        padding: 0.5rem;
    }
}

/* 現代化懸停效果 */
.nexus-multi-nav button.nexus-nav-button:hover,
.nexus-multi-nav a.nexus-nav-button:hover,
.nexus-multi-nav .nexus-nav-item-enhanced:hover,
.nexus-nav-button:hover,
.nexus-nav-item-enhanced:hover {
    background: linear-gradient(135deg, rgba(139, 92, 246, 0.18) 0%, rgba(168, 85, 247, 0.15) 100%) !important;
    border-color: rgba(139, 92, 246, 0.4) !important;
    transform: translateY(-2px) scale(1.02) !important;
    box-shadow: 
        0 8px 25px rgba(139, 92, 246, 0.25),
        0 4px 12px rgba(139, 92, 246, 0.15),
        inset 0 1px 0 rgba(255, 255, 255, 0.2) !important;
    color: var(--nexus-accent-purple) !important;
    text-shadow: 0 2px 4px rgba(139, 92, 246, 0.3) !important;
}

/* 懸停時的光暈效果 */
.nexus-multi-nav button.nexus-nav-button:hover::before,
.nexus-multi-nav a.nexus-nav-button:hover::before,
.nexus-nav-button:hover::before,
.nexus-nav-item-enhanced:hover::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(168, 85, 247, 0.05) 100%);
    border-radius: inherit;
    opacity: 1;
    z-index: -1;
    animation: glow-pulse 2s ease-in-out infinite alternate;
}

@keyframes glow-pulse {
    0% { opacity: 0.5; transform: scale(1); }
    100% { opacity: 1; transform: scale(1.05); }
}

/* 活動狀態 - 更強烈的效果 */
.nexus-multi-nav button.nexus-nav-active,
.nexus-multi-nav a.nexus-nav-active,
.nexus-nav-button.nexus-nav-active,
.nexus-nav-item-enhanced.nexus-nav-active {
    background: linear-gradient(135deg, rgba(139, 92, 246, 0.4) 0%, rgba(168, 85, 247, 0.35) 50%, rgba(147, 51, 234, 0.3) 100%) !important;
    border: 2px solid rgba(139, 92, 246, 0.8) !important;
    color: rgba(139, 92, 246, 1) !important;
    font-weight: 700 !important;
    transform: translateY(-1px) !important;
    box-shadow: 
        0 8px 25px rgba(139, 92, 246, 0.5),
        0 4px 15px rgba(139, 92, 246, 0.3),
        inset 0 1px 0 rgba(255, 255, 255, 0.4),
        inset 0 -1px 0 rgba(139, 92, 246, 0.3) !important;
    text-shadow: 0 2px 4px rgba(139, 92, 246, 0.5) !important;
}

/* 活動狀態的內部光效 */
.nexus-multi-nav button.nexus-nav-active::after,
.nexus-multi-nav a.nexus-nav-active::after {
    content: '';
    position: absolute;
    top: 2px;
    left: 2px;
    right: 2px;
    bottom: 2px;
    background: linear-gradient(135deg, transparent 0%, rgba(255, 255, 255, 0.1) 50%, transparent 100%);
    border-radius: calc(0.75rem - 2px);
    pointer-events: none;
    opacity: 0.7;
}

/* 響應式調整 */
@media (max-width: 1023px) {
    .nexus-multi-nav {
        gap: 0.375rem;
        padding: 0.5rem;
        border-radius: 0.75rem;
    }
    
    .nexus-multi-nav button,
    .nexus-multi-nav a {
        font-size: 0.9375rem !important;
        padding: 0.75rem 1.25rem !important;
        border-radius: 0.625rem !important;
    }
    
    /* 減少行動版的動畫效果 */
    .nexus-multi-nav button:hover,
    .nexus-multi-nav a:hover {
        transform: translateY(-1px) scale(1.01) !important;
        box-shadow: 
            0 4px 15px rgba(139, 92, 246, 0.2),
            0 2px 8px rgba(139, 92, 246, 0.1) !important;
    }
}

/* 超小螢幕優化 */
@media (max-width: 640px) {
    .nexus-multi-nav {
        gap: 0.25rem;
        padding: 0.375rem;
    }
    
    .nexus-multi-nav button,
    .nexus-multi-nav a {
        font-size: 0.875rem !important;
        padding: 0.625rem 1rem !important;
        font-weight: 500 !important;
    }
}

/* 深色主題適配 */
.dark .nexus-multi-nav {
    background: rgba(30, 33, 57, 0.15) !important;
    border-color: rgba(139, 92, 246, 0.15) !important;
}

.dark .nexus-multi-nav button,
.dark .nexus-multi-nav a {
    background: linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(168, 85, 247, 0.1) 100%) !important;
    border-color: rgba(139, 92, 246, 0.25) !important;
    color: rgba(255, 255, 255, 0.9) !important;
}

.dark .nexus-multi-nav button:hover,
.dark .nexus-multi-nav a:hover {
    background: linear-gradient(135deg, rgba(139, 92, 246, 0.22) 0%, rgba(168, 85, 247, 0.18) 100%) !important;
    color: rgba(139, 92, 246, 1) !important;
}

.dark .nexus-multi-nav button.nexus-nav-active,
.dark .nexus-multi-nav a.nexus-nav-active {
    background: linear-gradient(135deg, rgba(139, 92, 246, 0.3) 0%, rgba(168, 85, 247, 0.25) 50%, rgba(147, 51, 234, 0.2) 100%) !important;
    color: rgba(139, 92, 246, 1) !important;
}

/* ===== 下拉選單修復樣式 ===== */

/* 下拉選單容器修復 - 智能寬度與無滾動條設計 */
.nexus-nav-dropdown {
    position: absolute !important;
    top: 100% !important;
    left: 0 !important;
    z-index: 9999 !important;
    /* 智能寬度策略 - 根據內容自動調整 */
    min-width: 240px !important; /* 減少最小寬度，防止擠壓 */
    max-width: 380px !important; /* 適中的最大寬度 */
    width: auto !important; /* 自動寬度，不強制max-content */
    /* 完全消除滾動條的高度設置 */
    height: auto !important; 
    max-height: none !important; 
    overflow: visible !important; 
    overflow-x: visible !important; 
    overflow-y: visible !important; 
    /* 視覺美化 */
    margin-top: 0.5rem !important;
    background: rgba(255, 255, 255, 0.98) !important;
    backdrop-filter: blur(10px) !important;
    border: 1px solid rgba(139, 92, 246, 0.2) !important;
    border-radius: 0.75rem !important;
    box-shadow: 
        0 10px 25px rgba(0, 0, 0, 0.15),
        0 4px 12px rgba(139, 92, 246, 0.1) !important;
    padding: 0 !important;
}

/* 針對最後兩個導航項目的特殊定位 */
.nexus-multi-nav li:nth-last-child(1) .nexus-nav-dropdown,
.nexus-multi-nav li:nth-last-child(2) .nexus-nav-dropdown {
    /* 最後兩個下拉選單向左對齊，防止超出容器 */
    left: auto !important;
    right: 0 !important;
    min-width: 200px !important; /* 更小的寬度，確保不會擠壓 */
    max-width: 300px !important;
}

/* 下拉選單列表 - 完全消除滾動條 */
.nexus-dropdown-list {
    list-style: none !important;
    margin: 0 !important;
    padding: 0.5rem !important;
    height: auto !important; /* 自動高度 */
    max-height: none !important; /* 移除高度限制 */
    overflow: visible !important; /* 確保沒有內部滾動 */
    overflow-x: visible !important; /* 水平不滾動 */
    overflow-y: visible !important; /* 垂直不滾動 */
}

/* 下拉選單項目 - 確保水平佈局 */
.nexus-dropdown-item {
    display: flex !important;
    align-items: center !important;
    justify-content: flex-start !important;
    width: 100% !important;
    padding: 0.75rem 1rem !important;
    margin: 0 !important;
    border: none !important;
    border-radius: 0.5rem !important;
    background: transparent !important;
    color: rgba(55, 65, 81, 0.9) !important;
    text-decoration: none !important;
    font-size: 0.875rem !important;
    font-weight: 500 !important;
    line-height: 1.25 !important;
    white-space: nowrap !important; /* 防止文字換行 */
    overflow: visible !important;
    transition: all 0.2s ease !important;
    /* 強制水平佈局 */
    flex-direction: row !important;
    writing-mode: initial !important;
    text-orientation: initial !important;
}

/* 下拉選單項目懸停效果 */
.nexus-dropdown-item:hover {
    background: rgba(139, 92, 246, 0.08) !important;
    color: var(--nexus-accent-purple) !important;
    transform: translateX(4px) !important;
}

/* 下拉選單圖示 */
.nexus-dropdown-icon {
    width: 1rem !important;
    height: 1rem !important;
    margin-right: 0.75rem !important;
    flex-shrink: 0 !important;
    opacity: 0.7 !important;
}

/* 下拉選單文字 - 確保水平顯示 */
.nexus-dropdown-text {
    flex: 1 !important;
    font-weight: 500 !important;
    line-height: 1.25 !important;
    text-align: left !important;
    white-space: nowrap !important; /* 關鍵：防止文字換行 */
    overflow: visible !important;
    writing-mode: initial !important; /* 確保水平書寫模式 */
    text-orientation: initial !important;
    direction: ltr !important; /* 強制從左到右 */
}

/* 下拉選單描述 */
.nexus-dropdown-description {
    display: block !important;
    font-size: 0.75rem !important;
    color: rgba(107, 114, 128, 0.8) !important;
    margin-top: 0.25rem !important;
    line-height: 1.3 !important;
    white-space: normal !important; /* 描述可以換行 */
}

/* 下拉選單徽章 */
.nexus-dropdown-badge {
    padding: 0.125rem 0.375rem !important;
    border-radius: 0.25rem !important;
    font-size: 0.6875rem !important;
    font-weight: 600 !important;
    background: rgba(139, 92, 246, 0.1) !important;
    color: var(--nexus-accent-purple) !important;
    margin-left: 0.5rem !important;
    white-space: nowrap !important;
}

/* 活動狀態 */
.nexus-dropdown-item[aria-current="page"] {
    background: rgba(139, 92, 246, 0.12) !important;
    color: var(--nexus-accent-purple) !important;
    border-left: 3px solid var(--nexus-accent-purple) !important;
    padding-left: calc(1rem - 3px) !important;
}

/* 深色主題適配 */
.dark .nexus-nav-dropdown {
    background: rgba(31, 41, 55, 0.98) !important;
    border-color: rgba(139, 92, 246, 0.3) !important;
}

.dark .nexus-dropdown-item {
    color: rgba(255, 255, 255, 0.9) !important;
}

.dark .nexus-dropdown-item:hover {
    background: rgba(139, 92, 246, 0.15) !important;
    color: rgba(139, 92, 246, 1) !important;
}

.dark .nexus-dropdown-description {
    color: rgba(156, 163, 175, 0.8) !important;
}

/* 響應式調整 */
@media (max-width: 1023px) {
    .nexus-nav-dropdown {
        min-width: 250px !important;
        max-width: calc(100vw - 2rem) !important;
    }
}

/* 確保下拉選單在正確位置 */
.nexus-multi-nav li {
    position: relative !important;
}

/* 修復可能的佈局衝突 */
.nexus-dropdown-item * {
    writing-mode: initial !important;
    text-orientation: initial !important;
}

/* 徹底消除所有下拉選單滾動條 */
.nexus-nav-dropdown,
.nexus-nav-dropdown *,
.nexus-dropdown-list,
.nexus-dropdown-list *,
[class*="nexus-dropdown"],
[class*="nexus-dropdown"] * {
    overflow: visible !important;
    overflow-x: visible !important;
    overflow-y: visible !important;
    max-height: none !important;
    height: auto !important;
    scrollbar-width: none !important; /* Firefox */
    -ms-overflow-style: none !important; /* IE */
}

/* Webkit 瀏覽器滾動條隱藏 */
.nexus-nav-dropdown::-webkit-scrollbar,
.nexus-dropdown-list::-webkit-scrollbar,
[class*="nexus-dropdown"]::-webkit-scrollbar {
    display: none !important;
    width: 0 !important;
    height: 0 !important;
}

/* 最高優先級修復 - 針對 Alpine.js 動態生成的下拉選單 */
nav[x-data*="multiLevelNav"] .nexus-nav-dropdown,
nav[role="navigation"] .nexus-nav-dropdown,
.nexus-multi-nav .nexus-nav-dropdown,
.relative[x-data*="multiLevelNav"] .nexus-nav-dropdown {
    max-height: none !important;
    height: auto !important;
    overflow: visible !important;
    overflow-x: visible !important;
    overflow-y: visible !important;
    min-height: auto !important;
    flex-shrink: 0 !important;
    contain: none !important;
}

/* 強制文字水平排列 - 針對導航文字 */
.nexus-nav-dropdown .nexus-dropdown-text,
.nexus-nav-dropdown .nexus-dropdown-item,
.nexus-dropdown-list .nexus-dropdown-text,
.nexus-dropdown-list .nexus-dropdown-item,
nav .nexus-nav-text,
nav .nexus-sidebar-text {
    writing-mode: horizontal-tb !important;
    text-orientation: mixed !important;
    direction: ltr !important;
    unicode-bidi: normal !important;
    text-align: left !important;
    display: inline-block !important;
    white-space: nowrap !important;
}

/* 確保導航容器不會被下拉選單影響定位 */
.nexus-multi-nav {
    position: relative !important;
    z-index: 50 !important; /* 降低 z-index，避免影響其他元素 */
}

/* 修復可能導致位置偏移的問題 */
nav[role="navigation"] {
    position: static !important;
    margin: 0 !important;
    padding: 0 !important;
}

/* 確保導航樣式不會影響其他頁面元素 */
.nexus-enhanced-navigation {
    contain: layout style !important; /* CSS 包含，隔離影響 */
}

/* 最高優先級修復 - 強制覆蓋所有可能的樣式 */
html body nav[role="navigation"] .nexus-nav-dropdown,
html body nav[role="navigation"] .nexus-nav-dropdown *,
html body nav[role="navigation"] [class*="nexus-dropdown"],
html body nav[role="navigation"] [class*="nexus-dropdown"] *,
html body nav[x-data*="multiLevelNav"] .nexus-nav-dropdown,
html body nav[x-data*="multiLevelNav"] [class*="nexus-dropdown"],
html body div[x-show] div[class*="nexus-nav-dropdown"],
html body div[x-show] div[class*="nexus-dropdown"] {
    max-height: none !important;
    height: auto !important;
    overflow: visible !important;
    overflow-x: visible !important;
    overflow-y: visible !important;
    scrollbar-width: none !important;
    -ms-overflow-style: none !important;
    writing-mode: horizontal-tb !important;
    text-orientation: initial !important;
    direction: ltr !important;
    transform: none !important;
}

/* 強制隱藏滾動條 */
html body nav[role="navigation"] .nexus-nav-dropdown::-webkit-scrollbar,
html body nav[role="navigation"] [class*="nexus-dropdown"]::-webkit-scrollbar,
html body nav[x-data*="multiLevelNav"] .nexus-nav-dropdown::-webkit-scrollbar,
html body nav[x-data*="multiLevelNav"] [class*="nexus-dropdown"]::-webkit-scrollbar {
    display: none !important;
    width: 0 !important;
    height: 0 !important;
    background: transparent !important;
}

/* 強制下拉選單項目水平排列 */
html body nav[role="navigation"] .nexus-dropdown-item,
html body nav[role="navigation"] .nexus-dropdown-text,
html body nav[x-data*="multiLevelNav"] .nexus-dropdown-item,
html body nav[x-data*="multiLevelNav"] .nexus-dropdown-text {
    display: flex !important;
    flex-direction: row !important;
    align-items: center !important;
    writing-mode: horizontal-tb !important;
    text-orientation: initial !important;
    direction: ltr !important;
    white-space: nowrap !important;
    transform: none !important;
}
</style>

@endpush