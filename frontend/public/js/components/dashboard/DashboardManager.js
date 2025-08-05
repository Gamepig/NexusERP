/**
 * NexusERP Dashboard Manager - P1.3 儀表板數據管理器
 * 
 * 負責儀表板數據載入、自動刷新、錯誤處理和實時更新
 */
class DashboardManager {
    constructor(options = {}) {
        // 配置選項
        this.apiEndpoint = options.apiEndpoint || '/api/dashboard';
        this.realtimeEndpoint = options.realtimeEndpoint || '/api/dashboard/realtime';
        this.refreshInterval = options.refreshInterval || 30000; // 30秒
        this.maxRetryAttempts = options.maxRetryAttempts || 3;
        this.retryDelay = options.retryDelay || 1000;
        
        // 狀態管理
        this.statistics = new Map();
        this.charts = new Map();
        this.quickActions = [];
        this.isAutoRefresh = true;
        this.isLoading = false;
        this.lastUpdate = null;
        this.refreshTimer = null;
        this.retryCount = 0;
        
        // 事件監聽器
        this.eventListeners = new Map();
        
        // 初始化
        this.init();
    }
    
    /**
     * 初始化儀表板管理器
     */
    async init() {
        try {
            console.log('[DashboardManager] 正在初始化...');
            
            // 設定事件監聽器
            this.setupEventListeners();
            
            // 載入初始數據
            await this.loadDashboardData();
            
            // 啟動自動刷新
            this.startAutoRefresh();
            
            console.log('[DashboardManager] 初始化完成');
            
        } catch (error) {
            console.error('[DashboardManager] 初始化失敗:', error);
            this.handleError(error, 'init');
        }
    }
    
    /**
     * 載入儀表板數據
     */
    async loadDashboardData() {
        if (this.isLoading) {
            console.log('[DashboardManager] 數據載入中，跳過重複請求');
            return;
        }
        
        this.isLoading = true;
        this.showLoadingState();
        
        try {
            console.log('[DashboardManager] 載入儀表板數據...');
            
            const response = await fetch(this.apiEndpoint, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': this.getCSRFToken(),
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (data.success) {
                await this.updateDashboardData(data);
                this.lastUpdate = new Date();
                this.retryCount = 0; // 重置重試計數
                this.updateLastRefreshTime();
                
                console.log('[DashboardManager] 數據載入成功');
                this.dispatchEvent('dashboard-loaded', { data });
                
                // 直接操作 DOM 元素作為備用方案，確保載入狀態正確切換
                setTimeout(() => {
                    console.log('[DashboardManager] 執行 DOM 直接操作作為備用方案');
                    const loadingEl = document.getElementById('dashboardLoading');
                    const statsEl = document.getElementById('dashboardStats');
                    const errorEl = document.getElementById('dashboardError');
                    
                    console.log('[DashboardManager] DOM 元素狀態:', {
                        loading: loadingEl ? (loadingEl.classList.contains('hidden') ? '隱藏' : '顯示') : '不存在',
                        stats: statsEl ? (statsEl.classList.contains('hidden') ? '隱藏' : '顯示') : '不存在',
                        error: errorEl ? (errorEl.classList.contains('hidden') ? '隱藏' : '顯示') : '不存在'
                    });
                    
                    if (loadingEl && statsEl) {
                        loadingEl.classList.add('hidden');
                        statsEl.classList.remove('hidden');
                        if (errorEl) errorEl.classList.add('hidden');
                        console.log('[DashboardManager] DOM 狀態切換完成');
                        
                        // 檢查統計卡片是否存在
                        const statCards = document.querySelectorAll('[data-stat]');
                        console.log(`[DashboardManager] 找到 ${statCards.length} 個統計卡片:`, Array.from(statCards).map(el => el.getAttribute('data-stat')));
                    }
                }, 200);
                
            } else {
                throw new Error(data.message || '載入儀表板數據失敗');
            }
            
        } catch (error) {
            console.error('[DashboardManager] 載入數據錯誤:', error);
            await this.handleLoadError(error);
            
        } finally {
            this.isLoading = false;
            this.hideLoadingState();
        }
    }
    
    /**
     * 更新儀表板數據
     */
    async updateDashboardData(data) {
        // 更新統計數據
        if (data.statistics) {
            await this.updateStatistics(data.statistics);
        }
        
        // 更新圖表數據
        if (data.charts) {
            await this.updateCharts(data.charts);
        }
        
        // 更新快速操作
        if (data.quickActions) {
            this.updateQuickActions(data.quickActions);
        }
    }
    
    /**
     * 更新統計數據
     */
    async updateStatistics(statistics) {
        console.log('[DashboardManager] 更新統計數據:', Object.keys(statistics));
        
        // 統計卡片配置映射
        const statConfigs = {
            'totalRevenue': {
                title: '總營收',
                icon: 'currency-dollar',
                prefix: '$',
                selector: '[data-stat="totalRevenue"]'
            },
            'totalOrders': {
                title: '總訂單數',
                icon: 'shopping-cart',
                selector: '[data-stat="totalOrders"]'
            },
            'totalCustomers': {
                title: '總客戶數',
                icon: 'users',
                selector: '[data-stat="totalCustomers"]'
            },
            'pendingQuotes': {
                title: '待處理報價',
                icon: 'document-text',
                selector: '[data-stat="pendingQuotes"]'
            },
            'lowStockAlerts': {
                title: '低庫存警報',
                icon: 'exclamation-triangle',
                selector: '[data-stat="lowStockAlerts"]'
            },
            'conversionRate': {
                title: '轉換率',
                icon: 'chart-line',
                suffix: '%',
                selector: '[data-stat="conversionRate"]'
            }
        };
        
        // 更新每個統計卡片
        for (const [key, data] of Object.entries(statistics)) {
            const config = statConfigs[key];
            if (!config) {
                console.warn(`[DashboardManager] 未找到統計配置: ${key}`);
                continue;
            }
            
            const cardElement = document.querySelector(config.selector);
            console.log(`[DashboardManager] 查找卡片 ${key}:`, config.selector, cardElement ? '找到' : '未找到');
            
            if (cardElement) {
                console.log(`[DashboardManager] 更新卡片 ${key}:`, data);
                await this.updateStatCard(cardElement, {
                    ...config,
                    key: key,
                    value: data.value,
                    change: data.change,
                    trend: data.trend,
                    description: data.description
                });
            } else {
                console.error(`[DashboardManager] 找不到統計卡片元素: ${config.selector}`);
                // 列出所有可用的 data-stat 元素
                const allStatElements = document.querySelectorAll('[data-stat]');
                console.log('[DashboardManager] 可用的統計元素:', Array.from(allStatElements).map(el => el.getAttribute('data-stat')));
            }
            
            // 更新內部狀態
            this.statistics.set(key, data);
        }
        
        // 觸發統計更新事件
        this.dispatchEvent('statistics-updated', { statistics });
    }
    
    /**
     * 更新單個統計卡片
     */
    async updateStatCard(element, config) {
        console.log(`[DashboardManager] 開始更新統計卡片 ${config.key}:`, config);
        
        // 移除載入狀態
        element.classList.remove('stat-card-loading');
        
        // 更新數值
        const valueElement = element.querySelector('.stat-value');
        if (valueElement) {
            const formattedValue = this.formatStatValue(config.value, config.prefix, config.suffix);
            console.log(`[DashboardManager] 更新數值 ${config.key}:`, valueElement.textContent, '->', formattedValue);
            
            // 如果數值有變化，添加動畫效果
            if (valueElement.textContent !== formattedValue) {
                this.animateValueChange(valueElement, formattedValue);
            } else {
                // 即使沒有變化也要設置數值
                valueElement.textContent = formattedValue;
            }
        } else {
            console.warn(`[DashboardManager] 找不到數值元素 .stat-value 在卡片 ${config.key}`);
        }
        
        // 更新變化百分比
        const changeElement = element.querySelector('.stat-change');
        if (changeElement && config.change !== undefined) {
            console.log(`[DashboardManager] 更新變化指示器 ${config.key}:`, config.change, config.trend);
            this.updateChangeIndicator(changeElement, config.change, config.trend);
        } else if (config.change !== undefined) {
            console.warn(`[DashboardManager] 找不到變化元素 .stat-change 在卡片 ${config.key}`);
        }
        
        // 更新描述
        const descElement = element.querySelector('.stat-description');
        if (descElement && config.description) {
            console.log(`[DashboardManager] 更新描述 ${config.key}:`, config.description);
            descElement.textContent = config.description;
        }
        
        // 觸發更新動畫
        element.dispatchEvent(new CustomEvent('stat-updated', {
            detail: { key: config.key, value: config.value, change: config.change }
        }));
        
        console.log(`[DashboardManager] 完成更新統計卡片 ${config.key}`);
    }
    
    /**
     * 數值變化動畫
     */
    animateValueChange(element, newValue) {
        // 縮放動畫
        element.style.transform = 'scale(1.1)';
        element.style.transition = 'transform 0.2s ease';
        
        setTimeout(() => {
            element.textContent = newValue;
            element.style.transform = 'scale(1)';
        }, 100);
        
        setTimeout(() => {
            element.style.transition = '';
        }, 300);
    }
    
    /**
     * 更新變化指示器
     */
    updateChangeIndicator(element, change, trend) {
        const changeText = (change > 0 ? '+' : '') + change.toFixed(1) + '%';
        element.textContent = changeText;
        
        // 更新樣式類別
        element.className = element.className.replace(/(text-\w+-\d+|bg-\w+-\d+|border-\w+-\d+)/g, '');
        
        const changeType = change > 0 ? 'positive' : (change < 0 ? 'negative' : 'neutral');
        const changeClasses = {
            'positive': 'text-green-600 bg-green-100 border-green-200',
            'negative': 'text-red-600 bg-red-100 border-red-200',
            'neutral': 'text-gray-600 bg-gray-100 border-gray-200'
        };
        
        element.classList.add('inline-flex', 'items-center', 'px-2', 'py-0.5', 'rounded-full', 'text-xs', 'font-medium', 'stat-change', 'border');
        element.classList.add(...changeClasses[changeType].split(' '));
    }
    
    /**
     * 格式化統計數值
     */
    formatStatValue(value, prefix = '', suffix = '') {
        if (typeof value !== 'number') return value;
        
        let formattedValue = value;
        
        // 大數值格式化
        if (value >= 1000000) {
            formattedValue = (value / 1000000).toFixed(1) + 'M';
        } else if (value >= 1000) {
            formattedValue = (value / 1000).toFixed(1) + 'K';
        } else {
            formattedValue = value.toLocaleString();
        }
        
        return prefix + formattedValue + suffix;
    }
    
    /**
     * 更新圖表數據
     */
    async updateCharts(charts) {
        console.log('[DashboardManager] 更新圖表數據:', Object.keys(charts));
        
        // 儲存圖表數據
        for (const [chartId, chartData] of Object.entries(charts)) {
            this.charts.set(chartId, chartData);
        }
        
        // 觸發圖表更新事件
        this.dispatchEvent('charts-updated', { charts });
    }
    
    /**
     * 更新快速操作
     */
    updateQuickActions(quickActions) {
        console.log('[DashboardManager] 更新快速操作:', quickActions.length);
        this.quickActions = quickActions;
        this.dispatchEvent('quick-actions-updated', { quickActions });
    }
    
    /**
     * 設定事件監聽器
     */
    setupEventListeners() {
        // 手動刷新按鈕
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-action="refresh-dashboard"]') || 
                e.target.closest('[data-action="refresh-dashboard"]')) {
                this.loadDashboardData();
            }
        });
        
        // 自動刷新切換
        document.addEventListener('change', (e) => {
            if (e.target.matches('[data-toggle="auto-refresh"]')) {
                this.isAutoRefresh = e.target.checked;
                if (this.isAutoRefresh) {
                    this.startAutoRefresh();
                } else {
                    this.stopAutoRefresh();
                }
            }
        });
        
        // 統計卡片刷新
        document.addEventListener('refresh-stat', (e) => {
            this.refreshSpecificStat(e.detail);
        });
        
        // 頁面可見性變化
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pauseAutoRefresh();
            } else {
                this.resumeAutoRefresh();
            }
        });
        
        // 網路狀態變化
        window.addEventListener('online', () => {
            console.log('[DashboardManager] 網路連線恢復');
            this.loadDashboardData();
        });
        
        window.addEventListener('offline', () => {
            console.log('[DashboardManager] 網路連線中斷');
            this.stopAutoRefresh();
        });
    }
    
    /**
     * 刷新特定統計數據
     */
    async refreshSpecificStat(statKey) {
        console.log('[DashboardManager] 刷新特定統計:', statKey);
        
        // 暫停自動刷新避免衝突
        const wasAutoRefreshing = this.isAutoRefresh;
        if (wasAutoRefreshing) {
            this.stopAutoRefresh();
        }
        
        try {
            await this.loadDashboardData();
        } finally {
            // 恢復自動刷新
            if (wasAutoRefreshing) {
                this.startAutoRefresh();
            }
        }
    }
    
    /**
     * 啟動自動刷新
     */
    startAutoRefresh() {
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
        }
        
        if (!this.isAutoRefresh) return;
        
        console.log('[DashboardManager] 啟動自動刷新 (間隔:', this.refreshInterval / 1000, '秒)');
        
        this.refreshTimer = setInterval(() => {
            if (this.isAutoRefresh && !document.hidden && navigator.onLine) {
                this.loadDashboardData();
            }
        }, this.refreshInterval);
    }
    
    /**
     * 停止自動刷新
     */
    stopAutoRefresh() {
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
            this.refreshTimer = null;
            console.log('[DashboardManager] 停止自動刷新');
        }
    }
    
    /**
     * 暫停自動刷新
     */
    pauseAutoRefresh() {
        this.stopAutoRefresh();
        console.log('[DashboardManager] 暫停自動刷新');
    }
    
    /**
     * 恢復自動刷新
     */
    resumeAutoRefresh() {
        if (this.isAutoRefresh) {
            this.startAutoRefresh();
            console.log('[DashboardManager] 恢復自動刷新');
        }
    }
    
    /**
     * 顯示載入狀態
     */
    showLoadingState() {
        // 更新統計卡片載入狀態
        document.querySelectorAll('[data-stat]').forEach(card => {
            card.classList.add('stat-card-loading');
        });
        
        // 更新刷新按鈕狀態
        const refreshBtn = document.querySelector('[data-action="refresh-dashboard"]');
        if (refreshBtn) {
            refreshBtn.disabled = true;
            const icon = refreshBtn.querySelector('svg');
            if (icon) {
                icon.classList.add('animate-spin');
            }
        }
        
        this.dispatchEvent('loading-start');
    }
    
    /**
     * 隱藏載入狀態
     */
    hideLoadingState() {
        // 移除統計卡片載入狀態
        document.querySelectorAll('[data-stat]').forEach(card => {
            card.classList.remove('stat-card-loading');
        });
        
        // 恢復刷新按鈕狀態
        const refreshBtn = document.querySelector('[data-action="refresh-dashboard"]');
        if (refreshBtn) {
            refreshBtn.disabled = false;
            const icon = refreshBtn.querySelector('svg');
            if (icon) {
                icon.classList.remove('animate-spin');
            }
        }
        
        this.dispatchEvent('loading-end');
    }
    
    /**
     * 更新最後刷新時間
     */
    updateLastRefreshTime() {
        const timeElement = document.getElementById('lastUpdateTime');
        if (timeElement && this.lastUpdate) {
            timeElement.textContent = `最後更新: ${this.lastUpdate.toLocaleTimeString()}`;
        }
    }
    
    /**
     * 處理載入錯誤
     */
    async handleLoadError(error) {
        this.retryCount++;
        
        if (this.retryCount <= this.maxRetryAttempts) {
            console.log(`[DashboardManager] 重試載入數據 (${this.retryCount}/${this.maxRetryAttempts})`);
            
            // 指數退避重試
            const delay = this.retryDelay * Math.pow(2, this.retryCount - 1);
            setTimeout(() => {
                this.loadDashboardData();
            }, delay);
            
        } else {
            console.error('[DashboardManager] 達到最大重試次數，停止重試');
            this.showErrorState(error);
        }
    }
    
    /**
     * 顯示錯誤狀態
     */
    showErrorState(error) {
        const errorMessage = error.message || '載入數據失敗';
        
        // 顯示錯誤訊息
        this.dispatchEvent('error', { error: errorMessage });
        
        // 停止自動刷新
        this.stopAutoRefresh();
        
        console.error('[DashboardManager] 錯誤狀態:', errorMessage);
    }
    
    /**
     * 一般錯誤處理
     */
    handleError(error, context = '') {
        console.error(`[DashboardManager] ${context} 錯誤:`, error);
        this.dispatchEvent('error', { error: error.message, context });
    }
    
    /**
     * 取得 CSRF Token
     */
    getCSRFToken() {
        return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
    }
    
    /**
     * 事件派發
     */
    dispatchEvent(eventName, data = {}) {
        const event = new CustomEvent(`dashboard-${eventName}`, { 
            detail: data,
            bubbles: true
        });
        document.dispatchEvent(event);
    }
    
    /**
     * 註冊事件監聽器
     */
    on(eventName, callback) {
        if (!this.eventListeners.has(eventName)) {
            this.eventListeners.set(eventName, new Set());
        }
        this.eventListeners.get(eventName).add(callback);
        
        // 監聽 DOM 事件
        document.addEventListener(`dashboard-${eventName}`, callback);
    }
    
    /**
     * 移除事件監聽器
     */
    off(eventName, callback) {
        if (this.eventListeners.has(eventName)) {
            this.eventListeners.get(eventName).delete(callback);
        }
        document.removeEventListener(`dashboard-${eventName}`, callback);
    }
    
    /**
     * 取得統計數據
     */
    getStatistics() {
        return Object.fromEntries(this.statistics);
    }
    
    /**
     * 取得圖表數據
     */
    getCharts() {
        return Object.fromEntries(this.charts);
    }
    
    /**
     * 取得快速操作
     */
    getQuickActions() {
        return [...this.quickActions];
    }
    
    /**
     * 銷毀管理器
     */
    destroy() {
        console.log('[DashboardManager] 銷毀管理器');
        
        // 停止自動刷新
        this.stopAutoRefresh();
        
        // 清除事件監聽器
        this.eventListeners.forEach((callbacks, eventName) => {
            callbacks.forEach(callback => {
                document.removeEventListener(`dashboard-${eventName}`, callback);
            });
        });
        this.eventListeners.clear();
        
        // 清除狀態
        this.statistics.clear();
        this.charts.clear();
        this.quickActions = [];
        
        this.dispatchEvent('destroyed');
    }
}

// 全域匯出
window.DashboardManager = DashboardManager;

// 自動初始化 (如果有儀表板元素)
document.addEventListener('DOMContentLoaded', function() {
    if (document.querySelector('[data-dashboard]') || document.querySelector('#dashboardStats')) {
        console.log('[DashboardManager] 自動初始化儀表板管理器');
        
        // 等待其他組件載入
        setTimeout(() => {
            if (!window.dashboardManager) {
                window.dashboardManager = new DashboardManager();
            }
        }, 100);
    }
});

// 清理函數
window.addEventListener('beforeunload', function() {
    if (window.dashboardManager) {
        window.dashboardManager.destroy();
    }
});