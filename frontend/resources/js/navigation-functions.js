/**
 * NexusERP Navigation Functions
 * Global Alpine.js functions for navigation components
 */

// Enhanced Navigation Function
window.enhancedNavigation = function() {
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
            console.log('Enhanced navigation initialized');
            this.setupKeyboardShortcuts();
            this.setupGlobalListeners();
            this.initializeActivityIndicators();
            this.detectCurrentPage();
            this.setupAdvancedInteractions();
            this.initializeThemeToggle();
            this.setupUserMenuFallback();
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
            
            // 切換狀態
            self.showUserMenu = !self.showUserMenu;
            self.justOpened = self.showUserMenu;
            
            console.log('After toggle - showUserMenu:', self.showUserMenu);
            
            // 使用 Alpine.nextTick 確保 DOM 更新完成
            this.$nextTick(() => {
                console.log('Next tick - DOM updated, showUserMenu:', self.showUserMenu);
                
                if (self.showUserMenu) {
                    // 選單開啟時的處理
                    console.log('Menu opened - setting up event listeners');
                    
                    // 重置防止立即關閉的標記
                    setTimeout(() => {
                        self.justOpened = false;
                        console.log('justOpened reset to false');
                    }, 50);
                    
                    // 設置按鍵監聽
                    const handleEscape = (e) => {
                        if (e.key === 'Escape') {
                            console.log('Escape pressed - closing menu');
                            self.showUserMenu = false;
                            document.removeEventListener('keydown', handleEscape);
                        }
                    };
                    document.addEventListener('keydown', handleEscape);
                    
                    // 設置焦點管理
                    const menuElement = document.getElementById('user-dropdown-menu');
                    if (menuElement) {
                        const firstFocusable = menuElement.querySelector('a, button, [tabindex]');
                        if (firstFocusable) {
                            firstFocusable.focus();
                        }
                    }
                } else {
                    console.log('Menu closed');
                }
            });
        },

        // 關閉用戶選單
        closeUserMenu() {
            console.log('closeUserMenu called');
            if (this.justOpened) {
                console.log('Menu just opened - ignoring close request');
                return;
            }
            
            this.showUserMenu = false;
        },

        // 延遲關閉用戶選單 
        scheduleCloseUserMenu() {
            console.log('scheduleCloseUserMenu called');
            if (this.userCloseTimeout) {
                clearTimeout(this.userCloseTimeout);
            }
            
            this.userCloseTimeout = setTimeout(() => {
                console.log('Scheduled close executed');
                this.closeUserMenu();
            }, 200); // 200ms延遲
        },

        // 取消關閉用戶選單
        cancelCloseUserMenu() {
            console.log('cancelCloseUserMenu called');
            if (this.userCloseTimeout) {
                clearTimeout(this.userCloseTimeout);
                this.userCloseTimeout = null;
            }
        },

        // 切換行動裝置選單
        toggleMobileMenu() {
            this.mobileMenuOpen = !this.mobileMenuOpen;
        },

        // 設置鍵盤快捷鍵
        setupKeyboardShortcuts() {
            document.addEventListener('keydown', (e) => {
                // Alt + U = User Menu
                if (e.altKey && e.key === 'u') {
                    e.preventDefault();
                    this.toggleUserMenu();
                }
                
                // Alt + M = Mobile Menu
                if (e.altKey && e.key === 'm') {
                    e.preventDefault();
                    this.toggleMobileMenu();
                }
                
                // Escape = Close all menus
                if (e.key === 'Escape') {
                    this.showUserMenu = false;
                    this.mobileMenuOpen = false;
                }
            });
        },

        // 設置全域監聽器
        setupGlobalListeners() {
            // 點擊外部關閉選單
            document.addEventListener('click', (e) => {
                const navigation = e.target.closest('nav[role="navigation"]');
                if (!navigation) {
                    this.showUserMenu = false;
                    this.mobileMenuOpen = false;
                }
            });
        },

        // 其他方法的簡化版本（為了減少檔案大小）
        initializeActivityIndicators() {
            console.log('Activity indicators initialized');
        },

        detectCurrentPage() {
            console.log('Current page detected');
        },

        setupAdvancedInteractions() {
            console.log('Advanced interactions setup');
        },

        setupUserMenuFallback() {
            console.log('User menu fallback setup');
        }
    };
};

// Multi-Level Navigation Function
window.multiLevelNav = function(items, currentRoute) {
    return {
        navigationItems: [],
        openDropdowns: [],
        currentRoute: currentRoute,
        hideTimeouts: {},
        activeDropdown: null,
        lastClickTime: 0,
        
        init() {
            console.log('Multi-level nav initialized with', items?.length || 0, 'items');
            this.navigationItems = this.processNavigationItems(items || []);
            this.setActiveStates();
            
            // 立即應用修復樣式
            this.applyDropdownFixes();
            
            // 設置全域點擊監聽器
            document.addEventListener('click', (e) => {
                if (!e.target.closest('.nexus-multi-nav')) {
                    this.hideAllDropdowns();
                }
            });
            
            // ESC 鍵監聽
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    this.hideAllDropdowns();
                }
            });
            
            // 全局點擊監聽器 - 強制關閉所有下拉選單
            document.addEventListener('click', (e) => {
                const clickedElement = e.target;
                const isNavigation = clickedElement.closest('nav') || 
                                   clickedElement.closest('.nexus-nav-dropdown') ||
                                   clickedElement.closest('.relative[x-data*="multiLevelNav"]');
                
                // 如果點擊在導航區域外，關閉所有下拉選單
                if (!isNavigation) {
                    this.hideAllDropdowns();
                }
            });
        },

        processNavigationItems(items) {
            return items.map(item => ({
                ...item,
                id: item.id || this.generateId(),
                hasChildren: item.children && item.children.length > 0,
                isActive: this.isItemActive(item),
                children: item.children ? item.children.map(child => ({
                    ...child,
                    id: child.id || this.generateId(),
                    isActive: this.isItemActive(child)
                })) : []
            }));
        },
        
        generateId() {
            return 'nav-' + Math.random().toString(36).substr(2, 9);
        },

        isActiveItem(item) {
            if (!item.route) return false;
            
            // 精確匹配
            if (item.route === this.currentRoute) return true;
            
            // 模式匹配
            if (item.activePattern) {
                const pattern = new RegExp(item.activePattern);
                return pattern.test(this.currentRoute);
            }
            
            // 子項目匹配
            if (item.children) {
                return item.children.some(child => this.isItemActive(child));
            }
            
            return false;
        },
        
        isItemActive(item) {
            return this.isActiveItem(item);
        },

        setActiveStates() {
            this.navigationItems.forEach(item => {
                item.isActive = this.isActiveItem(item);
                
                if (item.children) {
                    item.children.forEach(child => {
                        child.isActive = this.isItemActive(child);
                    });
                }
            });
        },

        // 水平導航下拉選單管理 - 優化版
        showDropdown(itemId, force = false) {
            // 清除所有現有的超時
            this.clearAllTimeouts();
            
            // 實施排他行為：關閉所有其他下拉選單
            this.hideAllDropdownsExcept(itemId);
            
            // 顯示指定的下拉選單
            if (!this.openDropdowns.includes(itemId)) {
                this.openDropdowns = [itemId]; // 確保只有一個開啟
            }
            
            // 記錄活動下拉選單
            this.activeDropdown = itemId;
        },
        
        hideDropdown(itemId) {
            const index = this.openDropdowns.indexOf(itemId);
            if (index > -1) {
                this.openDropdowns.splice(index, 1);
            }
            
            // 如果關閉的是活動下拉選單，清除活動狀態
            if (this.activeDropdown === itemId) {
                this.activeDropdown = null;
            }
        },
        
        scheduleHideDropdown(itemId) {
            // 清除現有的超時，避免重複設定
            if (this.hideTimeouts[itemId]) {
                clearTimeout(this.hideTimeouts[itemId]);
            }
            
            // 增加延遲時間，確保用戶有足夠時間從導航項目移動到下拉選單
            this.hideTimeouts[itemId] = setTimeout(() => {
                // 再次檢查滑鼠是否仍在導航區域內
                const navItem = document.getElementById('nav-item-' + itemId);
                const dropdown = document.getElementById('dropdown-' + itemId);
                
                if (navItem && dropdown) {
                    const isNavHovered = navItem.matches(':hover') || navItem.closest('li').matches(':hover');
                    const isDropdownHovered = dropdown.matches(':hover');
                    
                    // 只有當滑鼠既不在導航項目也不在下拉選單時才關閉
                    if (!isNavHovered && !isDropdownHovered) {
                        this.hideDropdown(itemId);
                        delete this.hideTimeouts[itemId];
                    } else {
                        // 如果滑鼠仍在相關區域，取消這次的關閉操作
                        delete this.hideTimeouts[itemId];
                    }
                } else {
                    // 如果找不到元素，直接關閉
                    this.hideDropdown(itemId);
                    delete this.hideTimeouts[itemId];
                }
            }, 300); // 增加到300ms，提供更寬裕的移動時間
        },
        
        cancelHideDropdown(itemId) {
            if (this.hideTimeouts[itemId]) {
                clearTimeout(this.hideTimeouts[itemId]);
                delete this.hideTimeouts[itemId];
            }
        },

        toggleDropdown(itemId) {
            if (this.openDropdowns.includes(itemId)) {
                this.hideDropdown(itemId);
            } else {
                // 實施排他行為
                this.showDropdown(itemId);
            }
        },
        
        // 新增排他性輔助方法
        hideAllDropdownsExcept(exceptId) {
            this.openDropdowns.forEach(id => {
                if (id !== exceptId) {
                    this.hideDropdown(id);
                }
            });
        },
        
        clearAllTimeouts() {
            Object.values(this.hideTimeouts).forEach(timeout => clearTimeout(timeout));
            this.hideTimeouts = {};
        },
        
        // 智能顯示下拉選單（結合點擊和懸停）
        smartShowDropdown(itemId, trigger = 'hover') {
            // 立即關閉其他所有下拉選單
            this.hideAllDropdownsExcept(itemId);
            
            // 取消所有排程的關閉操作
            this.clearAllTimeouts();
            
            // 顯示目標下拉選單
            this.showDropdown(itemId);
            
            // 如果是點擊觸發，設置標記以防止立即關閉
            if (trigger === 'click') {
                this.lastClickTime = Date.now();
            }
        },

        hideAllDropdowns() {
            this.openDropdowns = [];
            Object.values(this.hideTimeouts).forEach(timeout => clearTimeout(timeout));
            this.hideTimeouts = {};
        },

        // 樣式計算
        getNavItemClasses(item) {
            const baseClasses = [
                'nexus-nav-btn',
                'flex', 'items-center', 'gap-2',
                'px-3', 'py-2', 'rounded-lg',
                'text-sm', 'font-medium',
                'transition-all', 'duration-200',
                'focus:outline-none', 'focus:ring-2', 'focus:ring-purple-500'
            ];
            
            if (item.isActive) {
                baseClasses.push(
                    'bg-gradient-to-r', 'from-purple-600', 'to-blue-600',
                    'text-white', 'shadow-lg'
                );
            } else {
                baseClasses.push(
                    'text-gray-600', 'dark:text-gray-300',
                    'hover:bg-gray-100', 'dark:hover:bg-gray-700',
                    'hover:text-gray-900', 'dark:hover:text-white'
                );
            }
            
            return baseClasses.join(' ');
        },

        // 新增排他性方法（保持向後兼容）
        showDropdownExclusive(itemId) {
            this.smartShowDropdown(itemId, 'exclusive');
        },

        // 智能下拉選單管理（保持向後兼容）
        smartToggleDropdown(itemId, trigger = 'click') {
            const isCurrentlyOpen = this.openDropdowns.includes(itemId);
            
            if (isCurrentlyOpen) {
                // 如果目前開啟，則關閉
                this.hideAllDropdowns();
            } else {
                // 如果目前關閉，則開啟（並關閉其他）
                this.smartShowDropdown(itemId, trigger);
            }
        },

        // 應用下拉選單修復樣式
        applyDropdownFixes() {
            console.log('應用下拉選單修復樣式...');
            
            // 立即修復現有下拉選單
            this.fixExistingDropdowns();
            
            // 設置觀察器監聽新創建的下拉選單
            this.setupDropdownObserver();
            
            // 定期檢查和修復
            setInterval(() => {
                this.fixExistingDropdowns();
            }, 1000);
        },

        // 修復現有下拉選單
        fixExistingDropdowns() {
            const dropdowns = document.querySelectorAll('.nexus-nav-dropdown');
            dropdowns.forEach(dropdown => {
                this.applyDropdownStyles(dropdown);
            });
        },

        // 設置下拉選單觀察器
        setupDropdownObserver() {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === 1) {
                            // 檢查是否是下拉選單
                            if (node.matches && node.matches('.nexus-nav-dropdown')) {
                                this.applyDropdownStyles(node);
                            }
                            
                            // 檢查子元素
                            const childDropdowns = node.querySelectorAll && node.querySelectorAll('.nexus-nav-dropdown');
                            if (childDropdowns) {
                                childDropdowns.forEach(dropdown => this.applyDropdownStyles(dropdown));
                            }
                        }
                    });
                });
            });
            
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        },

        // 應用下拉選單樣式
        applyDropdownStyles(dropdown) {
            if (!dropdown) return;
            
            // 修復容器樣式
            dropdown.style.setProperty('max-height', 'none', 'important');
            dropdown.style.setProperty('height', 'auto', 'important');
            dropdown.style.setProperty('overflow', 'visible', 'important');
            dropdown.style.setProperty('overflow-x', 'visible', 'important');
            dropdown.style.setProperty('overflow-y', 'visible', 'important');
            dropdown.style.setProperty('scrollbar-width', 'none', 'important');
            
            // 修復所有子元素的文字方向
            const allElements = dropdown.querySelectorAll('*');
            allElements.forEach(element => {
                element.style.setProperty('writing-mode', 'horizontal-tb', 'important');
                element.style.setProperty('text-orientation', 'mixed', 'important');
                element.style.setProperty('direction', 'ltr', 'important');
                element.style.setProperty('transform', 'none', 'important');
            });
            
            // 特別修復下拉選單項目
            const items = dropdown.querySelectorAll('.nexus-dropdown-item');
            items.forEach(item => {
                item.style.setProperty('display', 'flex', 'important');
                item.style.setProperty('flex-direction', 'row', 'important');
                item.style.setProperty('align-items', 'center', 'important');
                item.style.setProperty('white-space', 'nowrap', 'important');
            });
        }
    };
};

// Global navigation styling functions
window.getNavItemClasses = function(item) {
    const baseClasses = [
        'nexus-nav-btn',
        'flex', 'items-center', 'gap-2',
        'px-3', 'py-2', 'rounded-lg',
        'text-sm', 'font-medium',
        'transition-all', 'duration-200',
        'focus:outline-none', 'focus:ring-2', 'focus:ring-purple-500'
    ];
    
    if (item && item.isActive) {
        baseClasses.push(
            'bg-gradient-to-r', 'from-purple-600', 'to-blue-600',
            'text-white', 'shadow-lg'
        );
    } else {
        baseClasses.push(
            'text-gray-600', 'dark:text-gray-300',
            'hover:bg-gray-100', 'dark:hover:bg-gray-700',
            'hover:text-gray-900', 'dark:hover:text-white'
        );
    }
    
    return baseClasses.join(' ');
};

window.getSubItemClasses = function(item) {
    const baseClasses = [
        'nexus-dropdown-btn',
        'flex', 'items-center', 'justify-between',
        'w-full', 'px-4', 'py-3', 'text-left',
        'text-sm', 'rounded-lg',
        'transition-all', 'duration-150',
        'focus:outline-none', 'focus:ring-2', 'focus:ring-purple-500'
    ];
    
    if (item && item.isActive) {
        baseClasses.push(
            'bg-purple-50', 'dark:bg-purple-900/30',
            'text-purple-700', 'dark:text-purple-300',
            'border-l-4', 'border-purple-500'
        );
    } else {
        baseClasses.push(
            'text-gray-700', 'dark:text-gray-200',
            'hover:bg-gray-50', 'dark:hover:bg-gray-700/50',
            'hover:text-gray-900', 'dark:hover:text-white'
        );
    }
    
    return baseClasses.join(' ');
};

console.log('Navigation functions loaded');