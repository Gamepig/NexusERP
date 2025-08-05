{{-- AI 助手模組 --}}
{{-- 此模組可以包含在任何頁面中以提供 AI 助手功能 --}}

{{-- AI 助手 HTML 結構 --}}
<!-- 浮動聊天按鈕 -->
<button id="ai-chat-button" class="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 z-50 flex items-center justify-center group">
    <svg id="chat-icon" class="w-6 h-6 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
    </svg>
    <svg id="close-icon" class="w-6 h-6 hidden transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
    </svg>
    <!-- 脈衝動畫指示器 -->
    <div class="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full animate-pulse border-2 border-white"></div>
    <!-- Tooltip -->
    <div class="absolute bottom-16 right-0 mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded-lg py-2 px-3 whitespace-nowrap">
        按 Ctrl+K 或點擊開啟 AI 助手
        <div class="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
    </div>
</button>

<!-- AI 聊天視窗 -->
<div id="ai-chat-container" class="fixed bottom-24 right-6 w-80 h-96 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 hidden z-40 flex flex-col overflow-hidden">
    <!-- 聊天視窗標題列 -->
    <div class="flex items-center justify-between p-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
        <div class="flex items-center space-x-2">
            <div class="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            <h3 class="font-semibold text-sm">NexusERP AI 助手</h3>
        </div>
        <button id="minimize-chat" class="hover:bg-white hover:bg-opacity-20 rounded p-1 transition-colors">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
            </svg>
        </button>
    </div>
    
    <!-- 聊天訊息區域 -->
    <div id="chat-messages" class="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
        <!-- 初始歡迎訊息 -->
        <div class="flex items-start space-x-2 chat-message">
            <div class="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                </svg>
            </div>
            <div class="flex-1 bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm border border-gray-200 dark:border-gray-700">
                <p class="text-sm text-gray-800 dark:text-gray-200">您好！我是 NexusERP 的 AI 助手。我可以幫助您：</p>
                <ul class="mt-2 text-xs text-gray-600 dark:text-gray-400 space-y-1">
                    <li>• 解釋儀表板數據</li>
                    <li>• 快速導航到所需功能</li>
                    <li>• 提供操作建議</li>
                    <li>• 回答系統相關問題</li>
                </ul>
            </div>
        </div>
    </div>
    
    <!-- 快速建議按鈕 -->
    <div id="quick-suggestions" class="px-4 py-2 border-t border-gray-200 dark:border-gray-700">
        <div class="flex flex-wrap gap-2">
            <button class="suggestion-button text-xs px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors" data-suggestion="解釋我的銷售數據">
                📊 解釋銷售數據
            </button>
            <button class="suggestion-button text-xs px-3 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full hover:bg-green-200 dark:hover:bg-green-800 transition-colors" data-suggestion="如何管理庫存">
                📦 庫存管理
            </button>
            <button class="suggestion-button text-xs px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-full hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors" data-suggestion="查看員工管理">
                👥 員工管理
            </button>
        </div>
    </div>
    
    <!-- 輸入區域 -->
    <div class="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div class="flex space-x-2">
            <input type="text" id="chat-input" class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" placeholder="輸入您的問題..." autocomplete="off">
            <button id="send-message" class="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-lg transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed">
                <svg id="send-icon" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
                </svg>
                <svg id="loading-icon" class="w-4 h-4 animate-spin hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                </svg>
            </button>
        </div>
        
        <!-- 輸入提示 -->
        <div class="mt-2 text-xs text-gray-500 dark:text-gray-400 flex items-center justify-between">
            <span>按 Enter 發送，Shift+Enter 換行</span>
            <span class="flex items-center">
                <div class="w-2 h-2 bg-green-400 rounded-full mr-1"></div>
                AI 已連線
            </span>
        </div>
    </div>
</div>

{{-- AI 助手樣式 --}}
<style>
    /* AI 聊天視窗動畫 */
    #ai-chat-container {
        transform-origin: bottom right;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    #ai-chat-container:not(.hidden) {
        animation: slideInUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    @keyframes slideInUp {
        from {
            transform: translateY(20px) scale(0.95);
            opacity: 0;
        }
        to {
            transform: translateY(0) scale(1);
            opacity: 1;
        }
    }
    
    /* 浮動按鈕動畫和效果 */
    #ai-chat-button {
        animation: fadeInScale 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    #ai-chat-button:hover {
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    }
    
    @keyframes fadeInScale {
        from {
            transform: scale(0) rotate(-180deg);
            opacity: 0;
        }
        to {
            transform: scale(1) rotate(0deg);
            opacity: 1;
        }
    }
    
    /* 訊息動畫 */
    .chat-message {
        animation: messageSlideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    @keyframes messageSlideIn {
        from {
            transform: translateY(15px);
            opacity: 0;
        }
        to {
            transform: translateY(0);
            opacity: 1;
        }
    }
    
    /* 建議按鈕樣式 */
    .suggestion-button {
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .suggestion-button:hover {
        transform: translateY(-2px) scale(1.05);
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    }
    
    .suggestion-button:active {
        transform: translateY(0) scale(0.98);
    }
    
    /* 輸入框聚焦效果 */
    #chat-input:focus {
        box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
    }
    
    /* 發送按鈕載入動畫 */
    #send-message:disabled {
        cursor: not-allowed;
        opacity: 0.6;
    }
    
    /* 滾動條樣式 */
    #chat-messages::-webkit-scrollbar {
        width: 6px;
    }
    
    #chat-messages::-webkit-scrollbar-track {
        background: transparent;
    }
    
    #chat-messages::-webkit-scrollbar-thumb {
        background: rgba(156, 163, 175, 0.5);
        border-radius: 3px;
    }
    
    #chat-messages::-webkit-scrollbar-thumb:hover {
        background: rgba(107, 114, 128, 0.7);
    }
    
    /* 脈衝動畫 */
    .pulse-dot {
        animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }
    
    @keyframes pulse {
        0%, 100% {
            opacity: 1;
        }
        50% {
            opacity: 0.5;
        }
    }
    
    /* Tooltip 樣式 */
    .tooltip {
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        transform: translateY(5px);
        opacity: 0;
        pointer-events: none;
    }
    
    .group:hover .tooltip {
        transform: translateY(0);
        opacity: 1;
        pointer-events: auto;
    }
    
    /* 響應式設計 */
    @media (max-width: 640px) {
        #ai-chat-container {
            width: calc(100vw - 1rem);
            height: calc(100vh - 8rem);
            bottom: 6rem;
            right: 0.5rem;
            left: 0.5rem;
        }
        
        #ai-chat-button {
            bottom: 1rem;
            right: 1rem;
            width: 3.5rem;
            height: 3.5rem;
        }
    }
    
    /* 深色模式自動適配 */
    @media (prefers-color-scheme: dark) {
        #chat-messages::-webkit-scrollbar-thumb {
            background: rgba(156, 163, 175, 0.3);
        }
        
        #chat-messages::-webkit-scrollbar-thumb:hover {
            background: rgba(156, 163, 175, 0.5);
        }
    }
    
    /* 高對比度模式支援 */
    @media (prefers-contrast: high) {
        #ai-chat-button {
            border: 2px solid rgba(255, 255, 255, 0.5);
        }
        
        .suggestion-button {
            border: 1px solid currentColor;
        }
    }
    
    /* 減少動畫偏好 */
    @media (prefers-reduced-motion: reduce) {
        #ai-chat-container,
        #ai-chat-button,
        .chat-message,
        .suggestion-button {
            animation: none;
            transition: none;
        }
    }
</style>

{{-- AI 助手腳本 --}}
<script>
    // 配置 AI 助手
    document.addEventListener('DOMContentLoaded', function() {
        // 檢查用戶是否已登入（使用 Laravel session 認證）
        const isAuthenticated = {{ auth()->check() ? 'true' : 'false' }};
        if (!isAuthenticated) {
            console.info('AI 助手在未登入狀態下以訪客模式運行');
        } else {
            console.log('AI 助手已載入，用戶已認證');
        }
        
        // 載入 AI 助手配置
        loadAICapabilities();
        
        // 設定快捷鍵
        setupKeyboardShortcuts();
    });
    
    /**
     * 載入 AI 功能配置
     */
    async function loadAICapabilities() {
        try {
            const response = await fetch('/api/ai/capabilities', {
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    @if(auth()->check())
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                    @endif
                }
            });
            
            if (response.ok) {
                const capabilities = await response.json();
                console.log('AI 功能配置已載入:', capabilities);
            } else {
                console.warn('AI 功能配置載入失敗，HTTP狀態:', response.status);
            }
        } catch (error) {
            console.warn('無法載入 AI 功能配置:', error);
        }
    }
    
    /**
     * 設定鍵盤快捷鍵
     */
    function setupKeyboardShortcuts() {
        document.addEventListener('keydown', function(e) {
            // Ctrl/Cmd + K: 開啟 AI 助手
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                if (window.aiChat) {
                    window.aiChat.toggleChat();
                }
            }
            
            // Escape: 關閉 AI 助手
            if (e.key === 'Escape' && window.aiChat && window.aiChat.isOpen) {
                window.aiChat.closeChat();
            }
        });
    }
    
    /**
     * 取得當前頁面資訊作為 AI 上下文
     */
    function getCurrentPageContext() {
        return {
            url: window.location.pathname,
            title: document.title,
            module: getModuleFromPath(window.location.pathname),
            timestamp: new Date().toISOString()
        };
    }
    
    /**
     * 從路徑取得模組名稱
     */
    function getModuleFromPath(path) {
        if (path.includes('/products')) return 'product_management';
        if (path.includes('/customers')) return 'customer_management';
        if (path.includes('/sales')) return 'sales_management';
        if (path.includes('/inventory')) return 'inventory_management';
        if (path.includes('/reports')) return 'reports';
        if (path.includes('/dashboard')) return 'dashboard';
        return 'general';
    }
</script>

{{-- 使用說明註解 --}}
{{-- 
    使用方式：
    1. 在主佈局文件中包含此組件：@include('ai.assistant')
    2. 確保頁面已載入 Tailwind CSS
    3. 確保已設定正確的認證 token
    
    功能特點：
    - 浮動聊天按鈕
    - 響應式聊天視窗
    - 自然語言查詢
    - 智慧意圖識別
    - 操作建議
    - 鍵盤快捷鍵支援
    - 深色模式支援
    
    鍵盤快捷鍵：
    - Ctrl/Cmd + K: 開啟/關閉 AI 助手
    - Escape: 關閉 AI 助手
    - Enter: 發送訊息
--}}