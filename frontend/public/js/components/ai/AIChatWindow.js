/**
 * AI Chat Window Component
 * AI 聊天視窗元件
 */

// AI 聊天視窗元件初始化標記
console.log('AI Chat Window Component loaded');

// 確保全域物件存在
window.aiChat = window.aiChat || {};

// AI 聊天視窗類別
class AIChatWindow {
    constructor() {
        this.isOpen = false;
        this.conversationHistory = [];
        this.initialized = false;
        this.elements = {};
    }
    
    /**
     * 初始化聊天視窗
     */
    init() {
        if (this.initialized) {
            return;
        }
        
        console.log('Initializing AI Chat Window...');
        
        // 綁定 DOM 元素
        this.bindElements();
        
        // 綁定事件監聽器
        this.bindEvents();
        
        this.initialized = true;
        
        // 聊天視窗初始化完成
        console.log('AI Chat Window initialized successfully');
    }
    
    /**
     * 綁定 DOM 元素
     */
    bindElements() {
        this.elements = {
            chatButton: document.getElementById('ai-chat-button'),
            chatContainer: document.getElementById('ai-chat-container'),
            chatMessages: document.getElementById('chat-messages'),
            chatInput: document.getElementById('chat-input'),
            sendButton: document.getElementById('send-message'),
            minimizeButton: document.getElementById('minimize-chat'),
            chatIcon: document.getElementById('chat-icon'),
            closeIcon: document.getElementById('close-icon'),
            sendIcon: document.getElementById('send-icon'),
            loadingIcon: document.getElementById('loading-icon'),
            suggestionButtons: document.querySelectorAll('.suggestion-button')
        };
        
        // 檢查必要元素是否存在
        const requiredElements = ['chatButton', 'chatContainer', 'chatMessages', 'chatInput', 'sendButton'];
        const missingElements = requiredElements.filter(key => !this.elements[key]);
        
        if (missingElements.length > 0) {
            console.warn('Missing required AI chat elements:', missingElements);
        }
    }
    
    /**
     * 綁定事件監聽器
     */
    bindEvents() {
        // 聊天按鈕點擊事件
        if (this.elements.chatButton) {
            this.elements.chatButton.addEventListener('click', () => this.toggleChat());
        }
        
        // 最小化按鈕點擊事件
        if (this.elements.minimizeButton) {
            this.elements.minimizeButton.addEventListener('click', () => this.closeChat());
        }
        
        // 發送按鈕點擊事件
        if (this.elements.sendButton) {
            this.elements.sendButton.addEventListener('click', () => this.handleSendMessage());
        }
        
        // 輸入框鍵盤事件
        if (this.elements.chatInput) {
            this.elements.chatInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.handleSendMessage();
                }
            });
        }
        
        // 建議按鈕點擊事件
        this.elements.suggestionButtons.forEach(button => {
            button.addEventListener('click', () => {
                const suggestion = button.getAttribute('data-suggestion');
                if (suggestion) {
                    this.elements.chatInput.value = suggestion;
                    this.handleSendMessage();
                }
            });
        });
    }
    
    /**
     * 切換聊天視窗顯示狀態
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
        if (!this.elements.chatContainer) return;
        
        this.isOpen = true;
        this.elements.chatContainer.classList.remove('hidden');
        
        // 更新按鈕圖示
        if (this.elements.chatIcon && this.elements.closeIcon) {
            this.elements.chatIcon.classList.add('hidden');
            this.elements.closeIcon.classList.remove('hidden');
        }
        
        // 焦點到輸入框
        if (this.elements.chatInput) {
            setTimeout(() => this.elements.chatInput.focus(), 300);
        }
        
        console.log('AI Chat Window opened');
    }
    
    /**
     * 關閉聊天視窗
     */
    closeChat() {
        if (!this.elements.chatContainer) return;
        
        this.isOpen = false;
        this.elements.chatContainer.classList.add('hidden');
        
        // 更新按鈕圖示
        if (this.elements.chatIcon && this.elements.closeIcon) {
            this.elements.chatIcon.classList.remove('hidden');
            this.elements.closeIcon.classList.add('hidden');
        }
        
        console.log('AI Chat Window closed');
    }
    
    /**
     * 處理發送訊息
     */
    async handleSendMessage() {
        const message = this.elements.chatInput?.value.trim();
        if (!message) return;
        
        // 清空輸入框
        this.elements.chatInput.value = '';
        
        // 添加用戶訊息到聊天區域
        this.addMessageToChat('user', message);
        
        // 顯示載入狀態
        this.setLoadingState(true);
        
        try {
            // 發送訊息到 AI
            const response = await this.sendMessage(message);
            
            if (response && response.success && response.data?.response) {
                this.addMessageToChat('ai', response.data.response);
            } else {
                this.addMessageToChat('ai', '抱歉，我現在無法回應。請稍後再試。');
            }
        } catch (error) {
            console.error('Failed to send message:', error);
            this.addMessageToChat('ai', '發生錯誤，請稍後再試。');
        } finally {
            this.setLoadingState(false);
        }
    }
    
    /**
     * 設置載入狀態
     */
    setLoadingState(loading) {
        if (this.elements.sendButton && this.elements.sendIcon && this.elements.loadingIcon) {
            this.elements.sendButton.disabled = loading;
            
            if (loading) {
                this.elements.sendIcon.classList.add('hidden');
                this.elements.loadingIcon.classList.remove('hidden');
            } else {
                this.elements.sendIcon.classList.remove('hidden');
                this.elements.loadingIcon.classList.add('hidden');
            }
        }
    }
    
    /**
     * 添加訊息到聊天區域
     */
    addMessageToChat(sender, message) {
        if (!this.elements.chatMessages) return;
        
        const messageDiv = document.createElement('div');
        messageDiv.className = 'flex items-start space-x-2 chat-message';
        
        if (sender === 'user') {
            messageDiv.innerHTML = `
                <div class="flex-1"></div>
                <div class="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg p-3 shadow-sm ml-auto max-w-fit">
                    <p class="text-sm break-words whitespace-pre-wrap">${this.escapeHtml(message)}</p>
                </div>
                <div class="flex-shrink-0 w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center">
                    <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                    </svg>
                </div>
            `;
        } else {
            messageDiv.innerHTML = `
                <div class="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                    <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                    </svg>
                </div>
                <div class="flex-1 bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm border border-gray-200 dark:border-gray-700">
                    <p class="text-sm text-gray-800 dark:text-gray-200 break-words whitespace-pre-wrap">${this.escapeHtml(message)}</p>
                </div>
            `;
        }
        
        this.elements.chatMessages.appendChild(messageDiv);
        
        // 滾動到底部
        this.elements.chatMessages.scrollTop = this.elements.chatMessages.scrollHeight;
        
        // 添加到對話歷史
        this.addMessageToHistory(sender, message);
    }
    
    /**
     * 發送訊息到 AI
     */
    async sendMessage(message) {
        if (!message.trim()) {
            return;
        }
        
        try {
            // 使用 AI Chat Module 發送訊息
            if (window.aiChatModule) {
                const response = await window.aiChatModule.sendMessage(message, this.conversationHistory);
                return response;
            }
        } catch (error) {
            console.error('Failed to send message:', error);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * 添加訊息到對話歷史
     */
    addMessageToHistory(sender, message) {
        this.conversationHistory.push({
            sender: sender,
            message: message,
            timestamp: new Date().toISOString()
        });
        
        // 保持歷史記錄在合理大小內
        if (this.conversationHistory.length > 20) {
            this.conversationHistory = this.conversationHistory.slice(-10);
        }
    }
    
    /**
     * 清空對話歷史
     */
    clearHistory() {
        this.conversationHistory = [];
        
        // 清空聊天視窗（保留歡迎訊息）
        if (this.elements.chatMessages) {
            const welcomeMessage = this.elements.chatMessages.querySelector('.chat-message');
            this.elements.chatMessages.innerHTML = '';
            if (welcomeMessage) {
                this.elements.chatMessages.appendChild(welcomeMessage);
            }
        }
        
        console.log('AI Chat history cleared');
    }
    
    /**
     * HTML 轉義
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// 創建全域 AI 聊天視窗實例
window.aiChat = new AIChatWindow();

// 當 DOM 載入完成時自動初始化
document.addEventListener('DOMContentLoaded', function() {
    window.aiChat.init();
});