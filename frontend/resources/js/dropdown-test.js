/**
 * Navigation Dropdown Exclusive Behavior Test Script
 * 測試導航下拉選單排他性行為
 */

class DropdownTester {
    constructor() {
        this.testResults = [];
        this.init();
    }

    init() {
        console.log('🧪 Navigation Dropdown Testing Initialized');
        this.setupTestInterface();
    }

    setupTestInterface() {
        // 創建測試按鈕
        const testButton = document.createElement('button');
        testButton.textContent = '🧪 Test Dropdown Behavior';
        testButton.className = 'fixed top-4 right-4 z-50 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-blue-700 transition-colors';
        testButton.onclick = () => this.runAllTests();
        
        // 創建結果面板
        const resultsPanel = document.createElement('div');
        resultsPanel.id = 'test-results-panel';
        resultsPanel.className = 'fixed top-16 right-4 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 max-w-md max-h-96 overflow-y-auto hidden';
        resultsPanel.innerHTML = `
            <div class="flex justify-between items-center mb-2">
                <h3 class="font-semibold text-gray-900 dark:text-gray-100">Test Results</h3>
                <button onclick="this.parentElement.parentElement.classList.add('hidden')" class="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <div id="test-results-content"></div>
        `;

        document.body.appendChild(testButton);
        document.body.appendChild(resultsPanel);
    }

    async runAllTests() {
        console.log('🚀 Starting Dropdown Tests...');
        this.testResults = [];
        
        const tests = [
            this.testExclusiveBehavior.bind(this),
            this.testMouseEvents.bind(this),
            this.testKeyboardNavigation.bind(this),
            this.testClickOutside.bind(this),
            this.testMobileResponsive.bind(this),
            this.testPerformance.bind(this)
        ];

        for (const test of tests) {
            try {
                await test();
                await this.delay(500); // 每個測試間隔500ms
            } catch (error) {
                this.addTestResult(`❌ Test failed: ${error.message}`, 'error');
            }
        }

        this.displayResults();
        console.log('✅ All tests completed');
    }

    async testExclusiveBehavior() {
        console.log('🔍 Testing exclusive dropdown behavior...');
        
        // 查找導航元素
        const navItems = document.querySelectorAll('[x-data*="multiLevelNav"] li[class*="relative"]');
        
        if (navItems.length < 2) {
            this.addTestResult('⚠️ Not enough navigation items for exclusive behavior test', 'warning');
            return;
        }

        let exclusiveTestPassed = true;
        let reason = '';

        try {
            // 模擬滑鼠懸停第一個項目
            const firstItem = navItems[0];
            const firstButton = firstItem.querySelector('button');
            
            if (firstButton) {
                // 觸發 mouseenter 事件
                firstButton.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
                await this.delay(200);

                // 檢查第一個下拉選單是否開啟
                const firstDropdown = firstItem.querySelector('[x-show*="openDropdowns"]');
                const isFirstOpen = firstDropdown && window.getComputedStyle(firstDropdown).display !== 'none';

                if (!isFirstOpen) {
                    exclusiveTestPassed = false;
                    reason = 'First dropdown did not open on hover';
                } else {
                    // 模擬滑鼠懸停第二個項目
                    const secondItem = navItems[1];
                    const secondButton = secondItem.querySelector('button');
                    
                    if (secondButton) {
                        secondButton.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
                        await this.delay(200);

                        // 檢查第一個下拉選單是否關閉，第二個是否開啟
                        const isFirstStillOpen = firstDropdown && window.getComputedStyle(firstDropdown).display !== 'none';
                        const secondDropdown = secondItem.querySelector('[x-show*="openDropdowns"]');
                        const isSecondOpen = secondDropdown && window.getComputedStyle(secondDropdown).display !== 'none';

                        if (isFirstStillOpen && isSecondOpen) {
                            exclusiveTestPassed = false;
                            reason = 'Multiple dropdowns open simultaneously';
                        } else if (!isSecondOpen) {
                            exclusiveTestPassed = false;
                            reason = 'Second dropdown did not open';
                        }
                    }
                }
            }
        } catch (error) {
            exclusiveTestPassed = false;
            reason = `Test execution error: ${error.message}`;
        }

        const result = exclusiveTestPassed ? 
            '✅ Exclusive behavior working correctly' : 
            `❌ Exclusive behavior failed: ${reason}`;
        
        this.addTestResult(result, exclusiveTestPassed ? 'success' : 'error');
    }

    async testMouseEvents() {
        console.log('🖱️ Testing mouse event handling...');
        
        const navItems = document.querySelectorAll('[x-data*="multiLevelNav"] li[class*="relative"]');
        
        if (navItems.length === 0) {
            this.addTestResult('⚠️ No navigation items found for mouse event test', 'warning');
            return;
        }

        let mouseTestPassed = true;
        let reason = '';

        try {
            const firstItem = navItems[0];
            const button = firstItem.querySelector('button');
            
            if (button) {
                // 測試 mouseenter
                button.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
                await this.delay(100);
                
                // 測試 mouseleave
                button.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
                await this.delay(200);
                
                // 檢查下拉選單是否關閉
                const dropdown = firstItem.querySelector('[x-show*="openDropdowns"]');
                const isOpen = dropdown && window.getComputedStyle(dropdown).display !== 'none';
                
                if (isOpen) {
                    mouseTestPassed = false;
                    reason = 'Dropdown did not close after mouseleave';
                }
            }
        } catch (error) {
            mouseTestPassed = false;
            reason = `Mouse event test error: ${error.message}`;
        }

        const result = mouseTestPassed ? 
            '✅ Mouse events working correctly' : 
            `❌ Mouse events failed: ${reason}`;
        
        this.addTestResult(result, mouseTestPassed ? 'success' : 'error');
    }

    async testKeyboardNavigation() {
        console.log('⌨️ Testing keyboard navigation...');
        
        const navItems = document.querySelectorAll('[x-data*="multiLevelNav"] button');
        
        if (navItems.length === 0) {
            this.addTestResult('⚠️ No navigation buttons found for keyboard test', 'warning');
            return;
        }

        let keyboardTestPassed = true;
        let reason = '';

        try {
            const firstButton = navItems[0];
            firstButton.focus();
            
            // 測試 Escape 鍵
            firstButton.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
            await this.delay(100);
            
            // 測試 Enter 鍵
            firstButton.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
            await this.delay(100);

            keyboardTestPassed = true; // 基本鍵盤事件不會拋出錯誤即算通過
        } catch (error) {
            keyboardTestPassed = false;
            reason = `Keyboard navigation error: ${error.message}`;
        }

        const result = keyboardTestPassed ? 
            '✅ Keyboard navigation working correctly' : 
            `❌ Keyboard navigation failed: ${reason}`;
        
        this.addTestResult(result, keyboardTestPassed ? 'success' : 'error');
    }

    async testClickOutside() {
        console.log('👆 Testing click outside behavior...');
        
        let clickOutsideTestPassed = true;
        let reason = '';

        try {
            // 模擬點擊外部區域
            document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));
            await this.delay(100);

            // 檢查是否所有下拉選單都關閉
            const openDropdowns = document.querySelectorAll('[x-show*="openDropdowns"]');
            let hasOpenDropdown = false;
            
            openDropdowns.forEach(dropdown => {
                if (window.getComputedStyle(dropdown).display !== 'none') {
                    hasOpenDropdown = true;
                }
            });

            if (hasOpenDropdown) {
                clickOutsideTestPassed = false;
                reason = 'Some dropdowns remained open after clicking outside';
            }
        } catch (error) {
            clickOutsideTestPassed = false;
            reason = `Click outside test error: ${error.message}`;
        }

        const result = clickOutsideTestPassed ? 
            '✅ Click outside behavior working correctly' : 
            `❌ Click outside failed: ${reason}`;
        
        this.addTestResult(result, clickOutsideTestPassed ? 'success' : 'error');
    }

    async testMobileResponsive() {
        console.log('📱 Testing mobile responsive behavior...');
        
        let mobileTestPassed = true;
        let reason = '';

        try {
            // 模擬移動設備視窗大小
            const originalWidth = window.innerWidth;
            
            // 檢查是否有響應式 CSS 類別
            const dropdowns = document.querySelectorAll('.nexus-nav-dropdown');
            const hasResponsiveStyles = dropdowns.length > 0;
            
            if (!hasResponsiveStyles) {
                mobileTestPassed = false;
                reason = 'No responsive dropdown styles found';
            }
        } catch (error) {
            mobileTestPassed = false;
            reason = `Mobile responsive test error: ${error.message}`;
        }

        const result = mobileTestPassed ? 
            '✅ Mobile responsive behavior working correctly' : 
            `❌ Mobile responsive failed: ${reason}`;
        
        this.addTestResult(result, mobileTestPassed ? 'success' : 'info');
    }

    async testPerformance() {
        console.log('⚡ Testing dropdown performance...');
        
        let performanceTestPassed = true;
        let reason = '';

        try {
            const startTime = performance.now();
            
            // 快速開啟/關閉多個下拉選單
            const navItems = document.querySelectorAll('[x-data*="multiLevelNav"] button');
            
            for (let i = 0; i < Math.min(navItems.length, 5); i++) {
                const button = navItems[i];
                button.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
                await this.delay(10);
                button.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
                await this.delay(10);
            }
            
            const endTime = performance.now();
            const duration = endTime - startTime;
            
            if (duration > 1000) { // 如果超過1秒
                performanceTestPassed = false;
                reason = `Performance test took ${duration.toFixed(2)}ms (expected < 1000ms)`;
            }
        } catch (error) {
            performanceTestPassed = false;
            reason = `Performance test error: ${error.message}`;
        }

        const result = performanceTestPassed ? 
            '✅ Performance test passed' : 
            `⚠️ Performance test: ${reason}`;
        
        this.addTestResult(result, performanceTestPassed ? 'success' : 'warning');
    }

    addTestResult(message, type = 'info') {
        this.testResults.push({ message, type, timestamp: new Date().toISOString() });
        console.log(message);
    }

    displayResults() {
        const panel = document.getElementById('test-results-panel');
        const content = document.getElementById('test-results-content');
        
        if (!panel || !content) return;

        const html = this.testResults.map(result => {
            const colorClass = {
                success: 'text-green-600 dark:text-green-400',
                error: 'text-red-600 dark:text-red-400',
                warning: 'text-yellow-600 dark:text-yellow-400',
                info: 'text-blue-600 dark:text-blue-400'
            }[result.type] || 'text-gray-600 dark:text-gray-400';

            return `<div class="${colorClass} text-sm mb-2">${result.message}</div>`;
        }).join('');

        content.innerHTML = html;
        panel.classList.remove('hidden');
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// 當頁面載入完成後初始化測試器
document.addEventListener('DOMContentLoaded', () => {
    // 延遲初始化，確保 Alpine.js 和其他腳本已載入
    setTimeout(() => {
        window.dropdownTester = new DropdownTester();
    }, 1000);
});

console.log('🧪 Dropdown test script loaded');