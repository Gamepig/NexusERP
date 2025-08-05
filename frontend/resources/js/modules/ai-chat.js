/**
 * AI 聊天模組 - NexusERP AI Assistant
 * 提供自然語言查詢和智慧助手功能
 */

class NexusAIChat {
    constructor(options = {}) {
        this.config = {
            apiBaseUrl: options.apiBaseUrl || '/api',
            maxMessageLength: options.maxMessageLength || 1000,
            sessionTimeout: options.sessionTimeout || 30 * 60 * 1000, // 30 分鐘
            enableNotifications: options.enableNotifications || true,
            theme: options.theme || 'auto', // light, dark, auto
            ...options
        };
        
        this.state = {
            isInitialized: false,
            isConnected: false,
            currentUser: null,
            sessionId: this.generateSessionId(),
            lastActivity: Date.now()
        };
        
        this.cache = {
            capabilities: null,
            recentQueries: [],
            userPreferences: {}
        };
        
        this.init();
    }

    /**
     * 初始化 AI 聊天系統
     */
    async init() {
        try {
            await this.loadConfiguration();
            await this.checkConnection();
            await this.loadUserData();
            
            this.setupUI();
            this.bindEvents();
            this.loadCachedData();
            
            this.state.isInitialized = true;
            this.log('AI 聊天系統初始化完成');
            
        } catch (error) {
            this.logError('初始化失敗', error);
            this.showInitializationError();
        }
    }

    /**
     * 載入系統配置
     */
    async loadConfiguration() {
        try {
            const response = await this.apiRequest('/ai/capabilities');
            this.cache.capabilities = response.capabilities;
            
            // 載入用戶偏好設定
            this.loadUserPreferences();
            
        } catch (error) {
            this.logError('載入配置失敗', error);
            // 使用預設配置
            this.cache.capabilities = this.getDefaultCapabilities();
        }
    }

    /**
     * 檢查連接狀態
     */
    async checkConnection() {
        try {
            const response = await this.apiRequest('/ai/status');
            this.state.isConnected = response.status.service === 'available';
            
            if (!this.state.isConnected) {
                throw new Error('AI 服務暫時無法使用');
            }
            
        } catch (error) {
            this.state.isConnected = false;
            this.logError('連接檢查失敗', error);
        }
    }

    /**
     * 載入用戶資料
     */
    async loadUserData() {
        try {
            const response = await this.apiRequest('/users/me');
            this.state.currentUser = response;
            
        } catch (error) {
            this.logError('載入用戶資料失敗', error);
            // 不阻止初始化，使用匿名模式
        }
    }

    /**
     * 設定 UI 介面
     */
    setupUI() {
        // 檢查是否已存在 UI 元素
        if (document.getElementById('ai-chat-container')) {
            return;
        }

        // 載入 AI 聊天組件
        this.loadChatComponent();
        
        // 設定主題
        this.applyTheme();
        
        // 設定響應式行為
        this.setupResponsiveDesign();
    }

    /**
     * 載入聊天組件
     */
    loadChatComponent() {
        // 動態載入 AIChatWindow 組件
        const script = document.createElement('script');
        script.src = '/js/components/ai/AIChatWindow.js';
        script.onload = () => {
            this.log('AI 聊天組件載入完成');
        };
        script.onerror = () => {
            this.logError('AI 聊天組件載入失敗');
        };
        
        document.head.appendChild(script);
    }

    /**
     * 綁定事件
     */
    bindEvents() {
        // 監聽頁面變化
        this.setupPageChangeHandler();
        
        // 監聽視窗大小變化
        window.addEventListener('resize', this.handleResize.bind(this));
        
        // 監聽網路狀態變化
        window.addEventListener('online', this.handleOnline.bind(this));
        window.addEventListener('offline', this.handleOffline.bind(this));
        
        // 監聽頁面可見性變化
        document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
        
        // 設定定期檢查
        this.setupPeriodicChecks();
    }

    /**
     * 設定頁面變化處理器
     */
    setupPageChangeHandler() {
        // 監聽路由變化（適用於 SPA）
        let currentPath = window.location.pathname;
        
        setInterval(() => {
            if (window.location.pathname !== currentPath) {
                currentPath = window.location.pathname;
                this.handlePageChange();
            }
        }, 1000);
    }

    /**
     * 處理頁面變化
     */
    handlePageChange() {
        const context = this.getCurrentPageContext();
        this.log('頁面變化', context);
        
        // 更新聊天上下文
        if (window.aiChat) {
            window.aiChat.updateContext(context);
        }
    }

    /**
     * 處理視窗大小變化
     */
    handleResize() {
        if (window.aiChat) {
            window.aiChat.adjustForScreenSize();
        }
    }

    /**
     * 處理網路連接
     */
    handleOnline() {
        this.state.isConnected = true;
        this.log('網路連接已恢復');
        
        if (window.aiChat) {
            window.aiChat.showConnectionStatus(true);
        }
    }

    /**
     * 處理網路斷線
     */
    handleOffline() {
        this.state.isConnected = false;
        this.log('網路連接已斷開');
        
        if (window.aiChat) {
            window.aiChat.showConnectionStatus(false);
        }
    }

    /**
     * 處理頁面可見性變化
     */
    handleVisibilityChange() {
        if (document.hidden) {
            this.log('頁面進入後台');
        } else {
            this.log('頁面恢復前台');
            this.state.lastActivity = Date.now();
        }
    }

    /**
     * 設定定期檢查
     */
    setupPeriodicChecks() {
        // 每 5 分鐘檢查連接狀態
        setInterval(() => {
            this.checkConnection();
        }, 5 * 60 * 1000);
        
        // 每分鐘檢查 session 超時
        setInterval(() => {
            this.checkSessionTimeout();
        }, 60 * 1000);
    }

    /**
     * 檢查 session 超時
     */
    checkSessionTimeout() {
        const now = Date.now();
        if (now - this.state.lastActivity > this.config.sessionTimeout) {
            this.log('Session 超時，重新初始化');
            this.reinitialize();
        }
    }

    /**
     * API 請求封裝
     */
    async apiRequest(endpoint, options = {}) {
        const url = `${this.config.apiBaseUrl}${endpoint}`;
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.getAuthToken()}`
            }
        };
        
        const response = await fetch(url, { ...defaultOptions, ...options });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `請求失敗: ${response.status}`);
        }
        
        return await response.json();
    }

    /**
     * 發送 AI 查詢
     */
    async sendQuery(query, context = {}) {
        try {
            this.updateActivity();
            
            const requestData = {
                query: query,
                context: JSON.stringify({
                    ...context,
                    page: this.getCurrentPageContext(),
                    session_id: this.state.sessionId,
                    timestamp: new Date().toISOString()
                })
            };
            
            const response = await this.apiRequest('/ai/query', {
                method: 'POST',
                body: JSON.stringify(requestData)
            });
            
            // 快取查詢記錄
            this.cacheQuery(query, response);
            
            return response;
            
        } catch (error) {
            this.logError('AI 查詢失敗', error);
            throw error;
        }
    }

    /**
     * 快取查詢記錄
     */
    cacheQuery(query, response) {
        const record = {
            query,
            response: response.response,
            intent: response.intent,
            timestamp: Date.now()
        };
        
        this.cache.recentQueries.unshift(record);
        
        // 限制快取大小
        if (this.cache.recentQueries.length > 50) {
            this.cache.recentQueries = this.cache.recentQueries.slice(0, 50);
        }
        
        // 儲存到 localStorage
        this.saveToLocalStorage('recentQueries', this.cache.recentQueries);
    }

    /**
     * 載入快取資料
     */
    loadCachedData() {
        this.cache.recentQueries = this.loadFromLocalStorage('recentQueries', []);
        this.cache.userPreferences = this.loadFromLocalStorage('userPreferences', {});
    }

    /**
     * 載入用戶偏好設定
     */
    loadUserPreferences() {
        const saved = this.loadFromLocalStorage('aiChatPreferences', {});
        this.cache.userPreferences = {
            theme: 'auto',
            notifications: true,
            soundEffects: false,
            compactMode: false,
            autoSuggestions: true,
            ...saved
        };
    }

    /**
     * 儲存用戶偏好設定
     */
    saveUserPreferences() {
        this.saveToLocalStorage('aiChatPreferences', this.cache.userPreferences);
    }

    /**
     * 套用主題
     */
    applyTheme() {
        const theme = this.cache.userPreferences.theme || 'auto';
        
        if (theme === 'auto') {
            // 跟隨系統主題
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            this.setTheme(mediaQuery.matches ? 'dark' : 'light');
            
            mediaQuery.addEventListener('change', (e) => {
                this.setTheme(e.matches ? 'dark' : 'light');
            });
        } else {
            this.setTheme(theme);
        }
    }

    /**
     * 設定主題
     */
    setTheme(theme) {
        document.documentElement.setAttribute('data-ai-theme', theme);
        this.log(`主題已設定為: ${theme}`);
    }

    /**
     * 設定響應式設計
     */
    setupResponsiveDesign() {
        // 檢測行動裝置
        const isMobile = window.innerWidth <= 768;
        
        if (isMobile) {
            this.enableMobileOptimizations();
        }
    }

    /**
     * 啟用行動裝置優化
     */
    enableMobileOptimizations() {
        // 調整聊天視窗大小
        const chatContainer = document.getElementById('ai-chat-container');
        if (chatContainer) {
            chatContainer.classList.add('mobile-optimized');
        }
        
        this.log('已啟用行動裝置優化');
    }

    /**
     * 取得當前頁面上下文
     */
    getCurrentPageContext() {
        return {
            url: window.location.pathname,
            title: document.title,
            module: this.getModuleFromPath(window.location.pathname),
            params: new URLSearchParams(window.location.search).toString(),
            timestamp: new Date().toISOString()
        };
    }

    /**
     * 從路徑取得模組名稱
     */
    getModuleFromPath(path) {
        const moduleMap = {
            '/dashboard': 'dashboard',
            '/products': 'product_management',
            '/customers': 'customer_management',
            '/sales': 'sales_management',
            '/inventory': 'inventory_management',
            '/reports': 'reports',
            '/settings': 'settings'
        };
        
        for (const [pattern, module] of Object.entries(moduleMap)) {
            if (path.includes(pattern)) {
                return module;
            }
        }
        
        return 'general';
    }

    /**
     * 取得認證 token
     */
    getAuthToken() {
        return localStorage.getItem('auth_token') || '';
    }

    /**
     * 產生 session ID
     */
    generateSessionId() {
        return 'ai_session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * 更新活動時間
     */
    updateActivity() {
        this.state.lastActivity = Date.now();
    }

    /**
     * 重新初始化
     */
    async reinitialize() {
        this.log('正在重新初始化...');
        
        this.state.sessionId = this.generateSessionId();
        await this.checkConnection();
        await this.loadUserData();
        
        this.log('重新初始化完成');
    }

    /**
     * 顯示初始化錯誤
     */
    showInitializationError() {
        console.error('AI 助手初始化失敗，部分功能可能無法使用');
        
        // 可以顯示用戶通知
        if (this.config.enableNotifications) {
            this.showNotification('AI 助手暫時無法使用', 'error');
        }
    }

    /**
     * 顯示通知
     */
    showNotification(message, type = 'info') {
        // 實作通知顯示邏輯
        console.log(`[${type.toUpperCase()}] ${message}`);
    }

    /**
     * 取得預設功能配置
     */
    getDefaultCapabilities() {
        return {
            intents: ['data_query', 'action_request', 'navigation_help', 'general_help'],
            supported_modules: ['product_management', 'sales_management'],
            features: ['natural_language_query', 'intent_classification'],
            limitations: ['query_length_limit']
        };
    }

    /**
     * 儲存到 localStorage
     */
    saveToLocalStorage(key, data) {
        try {
            localStorage.setItem(`nexus_ai_${key}`, JSON.stringify(data));
        } catch (error) {
            this.logError('儲存到 localStorage 失敗', error);
        }
    }

    /**
     * 從 localStorage 載入
     */
    loadFromLocalStorage(key, defaultValue = null) {
        try {
            const data = localStorage.getItem(`nexus_ai_${key}`);
            return data ? JSON.parse(data) : defaultValue;
        } catch (error) {
            this.logError('從 localStorage 載入失敗', error);
            return defaultValue;
        }
    }

    /**
     * 日誌記錄
     */
    log(message, data = null) {
        console.log(`[NexusAI] ${message}`, data || '');
    }

    /**
     * 錯誤日誌記錄
     */
    logError(message, error = null) {
        console.error(`[NexusAI Error] ${message}`, error || '');
    }

    /**
     * 取得統計資訊
     */
    getStats() {
        return {
            sessionId: this.state.sessionId,
            isConnected: this.state.isConnected,
            queryCount: this.cache.recentQueries.length,
            lastActivity: new Date(this.state.lastActivity),
            uptime: Date.now() - this.state.sessionStart
        };
    }

    /**
     * 清除快取
     */
    clearCache() {
        this.cache.recentQueries = [];
        localStorage.removeItem('nexus_ai_recentQueries');
        this.log('快取已清除');
    }

    /**
     * 銷毀實例
     */
    destroy() {
        // 清理事件監聽器
        window.removeEventListener('resize', this.handleResize);
        window.removeEventListener('online', this.handleOnline);
        window.removeEventListener('offline', this.handleOffline);
        
        this.log('AI 聊天系統已銷毀');
    }
}

// 自動初始化
document.addEventListener('DOMContentLoaded', function() {
    // 檢查是否已經初始化
    if (window.nexusAIChat) {
        return;
    }
    
    // 初始化 AI 聊天系統
    window.nexusAIChat = new NexusAIChat();
    
    // 全域快捷鍵
    document.addEventListener('keydown', function(e) {
        // Ctrl/Cmd + K: 開啟 AI 助手
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            if (window.aiChat) {
                window.aiChat.toggleChat();
            }
        }
    });
});

// 匯出為模組（如果支援）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NexusAIChat;
}