/**
 * AI Chat Module
 * 基礎 AI 聊天功能模組
 */

// AI 聊天模組初始化標記
console.log('AI Chat Module loaded');

// 確保全域物件存在
window.aiChatModule = window.aiChatModule || {};

// AI 聊天功能的基礎架構
window.aiChatModule = {
    initialized: false,
    
    /**
     * 初始化 AI 聊天模組
     */
    init: function() {
        if (this.initialized) {
            return;
        }
        
        console.log('Initializing AI Chat Module...');
        this.initialized = true;
        
        // 模組初始化完成
        console.log('AI Chat Module initialized successfully');
    },
    
    /**
     * 檢查 AI 服務狀態
     */
    checkAIStatus: async function() {
        try {
            const response = await fetch('/api/ai/health');
            const data = await response.json();
            return data.success;
        } catch (error) {
            console.warn('AI service status check failed:', error);
            return false;
        }
    },
    
    /**
     * 發送消息給 AI
     */
    sendMessage: async function(message, conversationHistory = []) {
        try {
            const response = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
                },
                body: JSON.stringify({
                    message: message,
                    conversation_history: conversationHistory
                })
            });
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Failed to send message to AI:', error);
            return { success: false, error: error.message };
        }
    }
};

// 當 DOM 載入完成時自動初始化
document.addEventListener('DOMContentLoaded', function() {
    window.aiChatModule.init();
});