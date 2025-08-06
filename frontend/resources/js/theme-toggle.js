/**
 * NexusERP 主題切換功能
 * 支援暗色/淺色主題切換，並保存使用者偏好設定
 */

class NexusThemeManager {
    constructor() {
        this.STORAGE_KEY = 'nexus-theme';
        this.DARK_THEME = 'dark';
        this.LIGHT_THEME = 'light';
        this.currentTheme = null;
        
        this.init();
    }

    /**
     * 初始化主題管理器
     */
    init() {
        // 載入儲存的主題偏好
        this.loadThemePreference();
        
        // 應用主題
        this.applyTheme();
        
        // 監聽系統主題變更
        this.watchSystemTheme();
        
        // 綁定主題切換事件
        this.bindThemeToggleEvents();
        
        console.log(`NexusERP Theme Manager initialized. Current theme: ${this.currentTheme}`);
    }

    /**
     * 載入主題偏好設定
     */
    loadThemePreference() {
        // 1. 優先使用本地儲存的設定
        const savedTheme = localStorage.getItem(this.STORAGE_KEY);
        if (savedTheme && this.isValidTheme(savedTheme)) {
            this.currentTheme = savedTheme;
            return;
        }

        // 2. 檢查系統偏好設定 - 優先深色主題
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            this.currentTheme = this.DARK_THEME;
        } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
            this.currentTheme = this.LIGHT_THEME;
        } else {
            // 3. 預設使用深色主題 (專業外觀)
            this.currentTheme = this.DARK_THEME;
        }
    }

    /**
     * 檢查主題名稱是否有效
     */
    isValidTheme(theme) {
        return theme === this.DARK_THEME || theme === this.LIGHT_THEME;
    }

    /**
     * 應用主題到頁面
     */
    applyTheme() {
        const root = document.documentElement;
        
        // 移除所有主題類別和屬性
        root.classList.remove('light-theme', 'dark-theme', 'dark');
        root.removeAttribute('data-theme');
        
        // 添加當前主題類別和屬性
        if (this.currentTheme === this.LIGHT_THEME) {
            root.classList.add('light-theme');
            root.setAttribute('data-theme', 'light');
        } else if (this.currentTheme === this.DARK_THEME) {
            root.classList.add('dark-theme');
            root.classList.add('dark'); // Tailwind 暗色模式
            root.setAttribute('data-theme', 'dark'); // 多重選擇器支援
        }
        
        // 更新主題切換按鈕狀態
        this.updateToggleButtons();
        
        // 儲存主題偏好
        this.saveThemePreference();
        
        // 觸發主題變更事件
        this.dispatchThemeChangeEvent();
    }

    /**
     * 切換主題
     */
    toggleTheme() {
        this.currentTheme = this.currentTheme === this.DARK_THEME ? this.LIGHT_THEME : this.DARK_THEME;
        this.applyTheme();
        
        console.log(`Theme switched to: ${this.currentTheme}`);
    }

    /**
     * 設置特定主題
     */
    setTheme(theme) {
        if (!this.isValidTheme(theme)) {
            console.warn(`Invalid theme: ${theme}`);
            return;
        }
        
        this.currentTheme = theme;
        this.applyTheme();
        
        console.log(`Theme set to: ${this.currentTheme}`);
    }

    /**
     * 儲存主題偏好設定
     */
    saveThemePreference() {
        try {
            localStorage.setItem(this.STORAGE_KEY, this.currentTheme);
        } catch (error) {
            console.warn('Unable to save theme preference:', error);
        }
    }

    /**
     * 監聽系統主題變更
     */
    watchSystemTheme() {
        if (window.matchMedia) {
            const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            const lightModeMediaQuery = window.matchMedia('(prefers-color-scheme: light)');
            
            const handleSystemThemeChange = () => {
                // 只在沒有手動設定主題時跟隨系統設定
                const hasManuallySetTheme = localStorage.getItem(this.STORAGE_KEY);
                if (!hasManuallySetTheme) {
                    this.loadThemePreference();
                    this.applyTheme();
                }
            };
            
            darkModeMediaQuery.addEventListener('change', handleSystemThemeChange);
            lightModeMediaQuery.addEventListener('change', handleSystemThemeChange);
        }
    }

    /**
     * 綁定主題切換事件
     */
    bindThemeToggleEvents() {
        // 查找所有主題切換按鈕
        const toggleButtons = document.querySelectorAll('[data-theme-toggle]');
        
        toggleButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleTheme();
            });
        });

        // 鍵盤快速鍵支援 (Ctrl/Cmd + Shift + T)
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'T') {
                e.preventDefault();
                this.toggleTheme();
            }
        });
    }

    /**
     * 更新切換按鈕狀態
     */
    updateToggleButtons() {
        const toggleButtons = document.querySelectorAll('[data-theme-toggle]');
        
        toggleButtons.forEach(button => {
            const sunIcon = button.querySelector('.theme-toggle-sun');
            const moonIcon = button.querySelector('.theme-toggle-moon');
            
            if (sunIcon && moonIcon) {
                if (this.currentTheme === this.LIGHT_THEME) {
                    sunIcon.style.opacity = '1';
                    sunIcon.style.transform = 'rotate(0deg)';
                    moonIcon.style.opacity = '0';
                    moonIcon.style.transform = 'rotate(-90deg)';
                } else {
                    sunIcon.style.opacity = '0';
                    sunIcon.style.transform = 'rotate(90deg)';
                    moonIcon.style.opacity = '1';
                    moonIcon.style.transform = 'rotate(0deg)';
                }
            }
            
            // 更新 aria 屬性以改善可訪問性
            const newLabel = this.currentTheme === this.DARK_THEME ? 
                '切換到淺色主題' : '切換到暗色主題';
            button.setAttribute('aria-label', newLabel);
            button.setAttribute('title', newLabel);
        });
    }

    /**
     * 觸發主題變更事件
     */
    dispatchThemeChangeEvent() {
        const event = new CustomEvent('nexus-theme-changed', {
            detail: {
                theme: this.currentTheme,
                isDark: this.currentTheme === this.DARK_THEME,
                isLight: this.currentTheme === this.LIGHT_THEME
            }
        });
        
        document.dispatchEvent(event);
    }

    /**
     * 獲取當前主題
     */
    getCurrentTheme() {
        return this.currentTheme;
    }

    /**
     * 檢查是否為暗色主題
     */
    isDarkTheme() {
        return this.currentTheme === this.DARK_THEME;
    }

    /**
     * 檢查是否為淺色主題
     */
    isLightTheme() {
        return this.currentTheme === this.LIGHT_THEME;
    }

    /**
     * 重置主題設定（回到系統預設）
     */
    resetTheme() {
        localStorage.removeItem(this.STORAGE_KEY);
        this.loadThemePreference();
        this.applyTheme();
        
        console.log('Theme preference reset to system default');
    }

    /**
     * 銷毀主題管理器
     */
    destroy() {
        // 移除事件監聽器
        const toggleButtons = document.querySelectorAll('[data-theme-toggle]');
        toggleButtons.forEach(button => {
            button.removeEventListener('click', this.toggleTheme);
        });
        
        console.log('NexusThemeManager destroyed');
    }
}

// 自動初始化
let nexusTheme = null;

// 立即應用預設深色主題（避免閃白）
(function() {
    const savedTheme = localStorage.getItem('nexus-theme');
    const root = document.documentElement;
    
    if (!savedTheme) {
        // 沒有儲存的偏好設定時，立即應用深色主題
        root.classList.add('dark-theme', 'dark');
        root.setAttribute('data-theme', 'dark');
    } else if (savedTheme === 'light') {
        root.classList.add('light-theme');
        root.setAttribute('data-theme', 'light');
    } else {
        root.classList.add('dark-theme', 'dark');
        root.setAttribute('data-theme', 'dark');
    }
})();

// DOM 載入完成後初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        nexusTheme = new NexusThemeManager();
    });
} else {
    nexusTheme = new NexusThemeManager();
}

// 全域訪問
window.NexusTheme = nexusTheme;

// ES6 模組支援
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NexusThemeManager;
}

// AMD 支援
if (typeof define === 'function' && define.amd) {
    define(() => NexusThemeManager);
}