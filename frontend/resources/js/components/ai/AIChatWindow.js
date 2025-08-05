/**
 * AI 聊天視窗組件
 * 提供自然語言查詢和AI助手互動功能
 */
class AIChatWindow {
    constructor() {
        this.isOpen = false;
        this.isMinimized = false;
        this.messages = [];
        this.isLoading = false;
        this.currentUser = null;
        this.apiBaseUrl = '/api';
        
        this.init();
        this.loadUserData();
    }

    /**
     * 初始化聊天視窗
     */
    init() {
        this.createChatContainer();
        this.createFloatingButton();
        this.bindEvents();
        this.loadWelcomeMessage();
    }

    /**
     * 載入用戶資料
     */
    async loadUserData() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/users/me`, {
                headers: {
                    'Authorization': `Bearer ${this.getAuthToken()}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                this.currentUser = await response.json();
            }
        } catch (error) {
            console.warn('無法載入用戶資料:', error);
        }
    }

    /**
     * 建立聊天容器
     */
    createChatContainer() {
        const chatContainer = document.createElement('div');
        chatContainer.id = 'ai-chat-container';
        chatContainer.className = 'fixed bottom-20 right-6 w-96 h-96 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 hidden';
        
        chatContainer.innerHTML = `
            <div class="flex flex-col h-full">
                <!-- Chat Header -->
                <div class="flex items-center justify-between p-4 bg-blue-600 text-white rounded-t-lg">
                    <div class="flex items-center space-x-2">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.847a4.5 4.5 0 003.09 3.09L15.75 12l-2.847.813a4.5 4.5 0 00-3.09 3.09z"></path>
                        </svg>
                        <span class="font-semibold">NexusERP 智慧助手</span>
                    </div>
                    <div class="flex space-x-2">
                        <button id="chat-minimize" class="hover:bg-blue-700 p-1 rounded" title="最小化">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"></path>
                            </svg>
                        </button>
                        <button id="chat-close" class="hover:bg-blue-700 p-1 rounded" title="關閉">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </button>
                    </div>
                </div>

                <!-- Chat Messages -->
                <div id="chat-messages" class="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                    <!-- 訊息會動態添加到這裡 -->
                </div>

                <!-- Chat Input -->
                <div class="p-4 bg-white border-t border-gray-200 rounded-b-lg">
                    <div class="flex space-x-2">
                        <input 
                            type="text" 
                            id="chat-input" 
                            placeholder="請輸入您的問題..." 
                            class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            maxlength="1000"
                        >
                        <button 
                            id="chat-send" 
                            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled
                        >
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(chatContainer);
    }

    /**
     * 建立浮動按鈕
     */
    createFloatingButton() {
        const floatingButton = document.createElement('div');
        floatingButton.id = 'ai-chat-button';
        floatingButton.className = 'fixed bottom-6 right-6 w-14 h-14 bg-blue-600 hover:bg-blue-700 rounded-full shadow-lg cursor-pointer flex items-center justify-center text-white z-40 transition-all duration-300';
        floatingButton.title = '開啟 AI 助手';
        
        floatingButton.innerHTML = `
            <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.847a4.5 4.5 0 003.09 3.09L15.75 12l-2.847.813a4.5 4.5 0 00-3.09 3.09z"></path>
            </svg>
        `;

        document.body.appendChild(floatingButton);
    }

    /**
     * 綁定事件
     */
    bindEvents() {
        // 浮動按鈕點擊
        document.getElementById('ai-chat-button').addEventListener('click', () => {
            this.toggleChat();
        });

        // 關閉按鈕
        document.getElementById('chat-close').addEventListener('click', () => {
            this.closeChat();
        });

        // 最小化按鈕
        document.getElementById('chat-minimize').addEventListener('click', () => {
            this.minimizeChat();
        });

        // 發送按鈕
        document.getElementById('chat-send').addEventListener('click', () => {
            this.sendMessage();
        });

        // 輸入框事件
        const chatInput = document.getElementById('chat-input');
        
        // Enter 鍵發送
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // 輸入變化檢測
        chatInput.addEventListener('input', (e) => {
            const sendButton = document.getElementById('chat-send');
            sendButton.disabled = e.target.value.trim().length === 0;
        });

        // 點擊外部關閉（可選）
        document.addEventListener('click', (e) => {
            const chatContainer = document.getElementById('ai-chat-container');
            const chatButton = document.getElementById('ai-chat-button');
            
            if (this.isOpen && !chatContainer.contains(e.target) && !chatButton.contains(e.target)) {
                // 可以選擇是否點擊外部自動關閉
                // this.closeChat();
            }
        });
    }

    /**
     * 載入歡迎訊息
     */
    loadWelcomeMessage() {
        const welcomeMessage = {
            type: 'ai',
            content: '您好！我是 NexusERP 智慧助手。我可以協助您查詢數據、操作指導和解答系統相關問題。請告訴我您需要什麼協助？',
            timestamp: new Date(),
            suggestions: [
                '查詢銷售數據',
                '查看庫存狀況',
                '如何新增產品',
                '系統功能介紹'
            ]
        };
        
        this.messages.push(welcomeMessage);
    }

    /**
     * 切換聊天視窗
     */
    toggleChat() {
        if (this.isOpen) {
            this.closeChat();
        } else {
            this.openChat();
        }
    }

    /**
     * 開啟聊天視窗
     */
    openChat() {
        const chatContainer = document.getElementById('ai-chat-container');
        const chatButton = document.getElementById('ai-chat-button');
        
        chatContainer.classList.remove('hidden');
        chatButton.style.transform = 'scale(0.9)';
        
        this.isOpen = true;
        this.isMinimized = false;
        
        // 渲染訊息
        this.renderMessages();
        
        // 聚焦輸入框
        setTimeout(() => {
            document.getElementById('chat-input').focus();
        }, 100);

        // 滾動到底部
        this.scrollToBottom();
    }

    /**
     * 關閉聊天視窗
     */
    closeChat() {
        const chatContainer = document.getElementById('ai-chat-container');
        const chatButton = document.getElementById('ai-chat-button');
        
        chatContainer.classList.add('hidden');
        chatButton.style.transform = 'scale(1)';
        
        this.isOpen = false;
        this.isMinimized = false;
    }

    /**
     * 最小化聊天視窗
     */
    minimizeChat() {
        this.closeChat();
        this.isMinimized = true;
        
        // 可以實作最小化狀態的UI提示
        this.showMinimizedIndicator();
    }

    /**
     * 顯示最小化指示器
     */
    showMinimizedIndicator() {
        const chatButton = document.getElementById('ai-chat-button');
        chatButton.classList.add('animate-pulse');
        
        setTimeout(() => {
            chatButton.classList.remove('animate-pulse');
        }, 3000);
    }

    /**
     * 發送訊息
     */
    async sendMessage() {
        const chatInput = document.getElementById('chat-input');
        const message = chatInput.value.trim();
        
        if (!message || this.isLoading) {
            return;
        }

        // 清空輸入框
        chatInput.value = '';
        document.getElementById('chat-send').disabled = true;

        // 添加用戶訊息
        const userMessage = {
            type: 'user',
            content: message,
            timestamp: new Date()
        };
        
        this.messages.push(userMessage);
        this.renderMessages();
        this.scrollToBottom();

        // 顯示加載狀態
        this.showTypingIndicator();
        
        try {
            // 發送到 AI API
            const response = await this.sendToAI(message);
            
            // 隱藏加載狀態
            this.hideTypingIndicator();
            
            // 添加 AI 回應
            const aiMessage = {
                type: 'ai',
                content: response.response,
                intent: response.intent,
                data: response.data,
                suggestions: response.suggestions || [],
                timestamp: new Date()
            };
            
            this.messages.push(aiMessage);
            this.renderMessages();
            this.scrollToBottom();
            
        } catch (error) {
            console.error('AI 查詢失敗:', error);
            
            this.hideTypingIndicator();
            
            // 添加錯誤訊息
            const errorMessage = {
                type: 'ai',
                content: '抱歉，目前無法處理您的請求。請稍後再試或聯繫系統管理員。',
                isError: true,
                timestamp: new Date()
            };
            
            this.messages.push(errorMessage);
            this.renderMessages();
            this.scrollToBottom();
        }
    }

    /**
     * 發送到 AI API
     */
    async sendToAI(query) {
        const response = await fetch(`${this.apiBaseUrl}/ai/query`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.getAuthToken()}`
            },
            body: JSON.stringify({
                query: query,
                context: this.getContextFromRecentMessages()
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || '網路請求失敗');
        }

        return await response.json();
    }

    /**
     * 從最近訊息取得上下文
     */
    getContextFromRecentMessages() {
        return this.messages
            .slice(-3) // 最近3條訊息
            .map(msg => `${msg.type}: ${msg.content}`)
            .join('\n');
    }

    /**
     * 取得認證 token
     */
    getAuthToken() {
        // 從 localStorage 或其他地方取得 token
        return localStorage.getItem('auth_token') || '';
    }

    /**
     * 顯示輸入指示器
     */
    showTypingIndicator() {
        this.isLoading = true;
        
        const indicator = document.createElement('div');
        indicator.id = 'typing-indicator';
        indicator.className = 'flex items-center space-x-2 text-gray-500 text-sm';
        indicator.innerHTML = `
            <div class="flex space-x-1">
                <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
                <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
            </div>
            <span>AI 助手正在思考...</span>
        `;
        
        document.getElementById('chat-messages').appendChild(indicator);
        this.scrollToBottom();
    }

    /**
     * 隱藏輸入指示器
     */
    hideTypingIndicator() {
        this.isLoading = false;
        const indicator = document.getElementById('typing-indicator');
        if (indicator) {
            indicator.remove();
        }
    }

    /**
     * 渲染訊息列表
     */
    renderMessages() {
        const messagesContainer = document.getElementById('chat-messages');
        
        // 移除現有訊息（保留輸入指示器）
        const existingMessages = messagesContainer.querySelectorAll('.chat-message');
        existingMessages.forEach(msg => msg.remove());
        
        // 渲染所有訊息
        this.messages.forEach(message => {
            const messageElement = this.createMessageElement(message);
            
            // 插入到輸入指示器之前（如果存在）
            const typingIndicator = document.getElementById('typing-indicator');
            if (typingIndicator) {
                messagesContainer.insertBefore(messageElement, typingIndicator);
            } else {
                messagesContainer.appendChild(messageElement);
            }
        });
    }

    /**
     * 建立訊息元素
     */
    createMessageElement(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'chat-message';
        
        if (message.type === 'user') {
            messageDiv.innerHTML = `
                <div class="flex justify-end">
                    <div class="max-w-xs lg:max-w-md px-4 py-2 bg-blue-600 text-white rounded-lg">
                        <div class="text-sm">${this.escapeHtml(message.content)}</div>
                        <div class="text-xs text-blue-100 mt-1">${this.formatTime(message.timestamp)}</div>
                    </div>
                </div>
            `;
        } else {
            // AI 訊息
            const suggestions = message.suggestions && message.suggestions.length > 0 
                ? `<div class="mt-2 flex flex-wrap gap-1">
                     ${message.suggestions.map(suggestion => 
                         `<button class="suggestion-button px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded text-gray-700 border border-gray-300" 
                                 onclick="window.aiChat.sendSuggestion('${this.escapeHtml(suggestion)}')">
                            ${this.escapeHtml(suggestion)}
                          </button>`
                     ).join('')}
                   </div>`
                : '';
                
            messageDiv.innerHTML = `
                <div class="flex justify-start">
                    <div class="max-w-xs lg:max-w-md px-4 py-2 bg-white rounded-lg border border-gray-200 ${message.isError ? 'border-red-300 bg-red-50' : ''}">
                        <div class="text-sm text-gray-800 whitespace-pre-line">${this.escapeHtml(message.content)}</div>
                        ${suggestions}
                        <div class="text-xs text-gray-500 mt-1">${this.formatTime(message.timestamp)}</div>
                    </div>
                </div>
            `;
        }
        
        return messageDiv;
    }

    /**
     * 發送建議查詢
     */
    sendSuggestion(suggestion) {
        const chatInput = document.getElementById('chat-input');
        chatInput.value = suggestion;
        document.getElementById('chat-send').disabled = false;
        this.sendMessage();
    }

    /**
     * 滾動到底部
     */
    scrollToBottom() {
        const messagesContainer = document.getElementById('chat-messages');
        setTimeout(() => {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }, 100);
    }

    /**
     * 轉義 HTML
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * 格式化時間
     */
    formatTime(timestamp) {
        return new Date(timestamp).toLocaleTimeString('zh-TW', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    /**
     * 清除聊天記錄
     */
    clearChat() {
        this.messages = [];
        this.loadWelcomeMessage();
        this.renderMessages();
    }

    /**
     * 取得聊天記錄
     */
    getChatHistory() {
        return this.messages;
    }
}

// 初始化 AI 聊天視窗
document.addEventListener('DOMContentLoaded', function() {
    window.aiChat = new AIChatWindow();
});