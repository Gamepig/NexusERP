/**
 * Navigation Dropdown Mouse Leave Behavior Test
 * 測試導航下拉選單滑鼠移開行為
 */

class NavigationDropdownTester {
    constructor() {
        this.testResults = [];
        this.testCount = 0;
        this.passedTests = 0;
        this.init();
    }

    init() {
        console.log('🧪 Navigation Dropdown Mouse Leave Tester Initialized');
        this.createTestInterface();
        this.runAutomaticTests();
    }

    createTestInterface() {
        // 創建測試按鈕和結果面板
        const testButton = document.createElement('button');
        testButton.innerHTML = '🧪 Test Mouse Leave Behavior';
        testButton.className = 'fixed bottom-4 right-4 z-50 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-green-700 transition-colors';
        testButton.onclick = () => this.runManualTests();
        
        const resultsPanel = document.createElement('div');
        resultsPanel.id = 'mouse-test-results';
        resultsPanel.className = 'fixed bottom-16 right-4 z-50 bg-white dark:bg-gray-800 border rounded-lg shadow-lg p-4 max-w-md max-h-96 overflow-y-auto';
        resultsPanel.innerHTML = `
            <div class="flex justify-between items-center mb-2">
                <h3 class="font-semibold">Mouse Leave Test Results</h3>
                <button onclick="this.parentElement.parentElement.style.display='none'" class="text-gray-500">✕</button>
            </div>
            <div id="mouse-test-content"></div>
        `;
        resultsPanel.style.display = 'none';

        document.body.appendChild(testButton);
        document.body.appendChild(resultsPanel);
    }

    async runAutomaticTests() {
        // 等待頁面載入完成
        await this.delay(2000);
        
        console.log('🚀 Starting automatic navigation dropdown tests...');
        
        // 測試1: 檢查導航函數是否存在
        this.testNavigationFunctionExists();
        
        // 測試2: 檢查 scheduleHideDropdown 方法
        this.testScheduleHideDropdownMethod();
        
        // 測試3: 檢查 DOM 元素
        this.testDOMElements();
        
        // 顯示結果
        this.displayResults();
    }

    testNavigationFunctionExists() {
        const test = {
            name: 'Navigation Function Existence',
            status: 'unknown',
            details: ''
        };

        try {
            // 檢查 multiLevelNav 函數
            if (typeof window.multiLevelNav === 'function') {
                test.status = 'pass';
                test.details = 'multiLevelNav function exists';
            } else {
                test.status = 'fail';
                test.details = 'multiLevelNav function not found';
            }
        } catch (error) {
            test.status = 'error';
            test.details = `Error: ${error.message}`;
        }

        this.addTestResult(test);
    }

    testScheduleHideDropdownMethod() {
        const test = {
            name: 'scheduleHideDropdown Method',
            status: 'unknown',
            details: ''
        };

        try {
            // 查找具有 multiLevelNav 的元素
            const navElement = document.querySelector('[x-data*="multiLevelNav"]');
            
            if (navElement && navElement._x_dataStack) {
                const alpineData = navElement._x_dataStack[0];
                
                if (alpineData && typeof alpineData.scheduleHideDropdown === 'function') {
                    test.status = 'pass';
                    test.details = 'scheduleHideDropdown method exists in Alpine data';
                } else {
                    test.status = 'fail';
                    test.details = 'scheduleHideDropdown method not found in Alpine data';
                }
            } else {
                test.status = 'fail';
                test.details = 'Navigation element with multiLevelNav not found';
            }
        } catch (error) {
            test.status = 'error';
            test.details = `Error: ${error.message}`;
        }

        this.addTestResult(test);
    }

    testDOMElements() {
        const test = {
            name: 'DOM Elements Check',
            status: 'unknown',
            details: ''
        };

        try {
            const navItems = document.querySelectorAll('[x-data*="multiLevelNav"] li[class*="relative"]');
            const dropdowns = document.querySelectorAll('.nexus-nav-dropdown');
            
            if (navItems.length > 0 && dropdowns.length >= 0) {
                test.status = 'pass';
                test.details = `Found ${navItems.length} navigation items and ${dropdowns.length} potential dropdowns`;
            } else {
                test.status = 'fail';
                test.details = 'Navigation items or dropdowns not found';
            }
        } catch (error) {
            test.status = 'error';
            test.details = `Error: ${error.message}`;
        }

        this.addTestResult(test);
    }

    async runManualTests() {
        console.log('🧪 Starting manual dropdown tests...');
        this.testResults = []; // 清除之前的結果
        
        // 執行手動測試
        await this.testMouseLeaveFromNavigation();
        await this.testMouseLeaveFromDropdown();
        await this.testExclusiveBehavior();
        
        this.displayResults();
    }

    async testMouseLeaveFromNavigation() {
        const test = {
            name: 'Mouse Leave from Navigation',
            status: 'manual',
            details: 'Please manually test: Hover over menu item, then move mouse away completely. Dropdown should close within 300ms.'
        };

        this.addTestResult(test);
    }

    async testMouseLeaveFromDropdown() {
        const test = {
            name: 'Mouse Leave from Dropdown',
            status: 'manual',
            details: 'Please manually test: Open dropdown, move mouse to dropdown area, then move away. Should close within 300ms.'
        };

        this.addTestResult(test);
    }

    async testExclusiveBehavior() {
        const test = {
            name: 'Exclusive Dropdown Behavior',
            status: 'manual',
            details: 'Please manually test: Hover between different menu items. Only one dropdown should be visible at a time.'
        };

        this.addTestResult(test);
    }

    addTestResult(test) {
        this.testResults.push(test);
        this.testCount++;
        
        if (test.status === 'pass') {
            this.passedTests++;
        }
        
        console.log(`Test: ${test.name} - ${test.status.toUpperCase()}`);
        console.log(`Details: ${test.details}`);
    }

    displayResults() {
        const panel = document.getElementById('mouse-test-results');
        const content = document.getElementById('mouse-test-content');
        
        if (!panel || !content) return;

        const summary = `
            <div class="mb-4 p-2 bg-gray-100 dark:bg-gray-700 rounded">
                <strong>Test Summary:</strong> ${this.passedTests}/${this.testCount} tests passed
            </div>
        `;

        const results = this.testResults.map(test => {
            const statusColor = {
                'pass': 'text-green-600',
                'fail': 'text-red-600',
                'error': 'text-red-600',
                'manual': 'text-blue-600',
                'unknown': 'text-gray-600'
            }[test.status] || 'text-gray-600';

            const statusIcon = {
                'pass': '✅',
                'fail': '❌',
                'error': '⚠️',
                'manual': '👆',
                'unknown': '❓'
            }[test.status] || '❓';

            return `
                <div class="mb-3 p-2 border border-gray-200 dark:border-gray-600 rounded">
                    <div class="font-medium ${statusColor}">
                        ${statusIcon} ${test.name}
                    </div>
                    <div class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        ${test.details}
                    </div>
                </div>
            `;
        }).join('');

        content.innerHTML = summary + results;
        panel.style.display = 'block';
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// 當頁面載入完成後初始化測試器
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        window.navigationDropdownTester = new NavigationDropdownTester();
    }, 1000);
});

console.log('🧪 Navigation dropdown test script loaded');