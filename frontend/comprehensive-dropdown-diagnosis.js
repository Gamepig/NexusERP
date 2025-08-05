/**
 * 綜合下拉選單診斷工具
 * 用於分析 NexusERP 導航下拉選單問題
 */

console.log('🔍 開始綜合下拉選單診斷...');

function comprehensiveDiagnosis() {
    const results = {
        timestamp: new Date().toISOString(),
        phases: {
            basicSystemCheck: {},
            alpineInvestigation: {},
            cssPositioning: {},
            eventHandlers: {},
            recentChanges: {}
        },
        errors: [],
        recommendations: []
    };

    // Phase 1: 基本系統檢查
    console.log('\n🔵 Phase 1: 基本系統檢查');
    try {
        results.phases.basicSystemCheck = {
            alpineExists: typeof window.Alpine !== 'undefined',
            alpineVersion: window.Alpine ? window.Alpine.version || 'unknown' : null,
            navigationElement: !!document.querySelector('[x-data*="multiLevelNav"]'),
            navigationElementCount: document.querySelectorAll('[x-data*="multiLevelNav"]').length,
            dropdownElements: document.querySelectorAll('.nexus-nav-dropdown').length,
            jsErrors: [] // 會在 console.error 捕獲中填充
        };

        console.log('  ✓ Alpine.js 是否存在:', results.phases.basicSystemCheck.alpineExists);
        console.log('  ✓ 導航元素存在:', results.phases.basicSystemCheck.navigationElement);
        console.log('  ✓ 下拉選單元素數量:', results.phases.basicSystemCheck.dropdownElements);
    } catch (error) {
        results.errors.push('Basic system check failed: ' + error.message);
    }

    // Phase 2: Alpine.js 詳細調查
    console.log('\n🔵 Phase 2: Alpine.js 詳細調查');
    try {
        const navElement = document.querySelector('[x-data*="multiLevelNav"]');
        results.phases.alpineInvestigation = {
            navigationElement: !!navElement,
            alpineDataExists: navElement && navElement._x_dataStack,
            alpineDataCount: navElement && navElement._x_dataStack ? navElement._x_dataStack.length : 0
        };

        if (navElement && navElement._x_dataStack && navElement._x_dataStack[0]) {
            const alpineData = navElement._x_dataStack[0];
            results.phases.alpineInvestigation.alpineData = {
                openDropdowns: alpineData.openDropdowns || [],
                navigationItems: alpineData.navigationItems ? alpineData.navigationItems.length : 0,
                hideTimeouts: alpineData.hideTimeouts || {},
                methods: {
                    smartShowDropdown: typeof alpineData.smartShowDropdown,
                    scheduleHideDropdown: typeof alpineData.scheduleHideDropdown,
                    hideDropdown: typeof alpineData.hideDropdown,
                    showDropdown: typeof alpineData.showDropdown,
                    cancelHideDropdown: typeof alpineData.cancelHideDropdown
                }
            };

            // 嘗試測試方法調用
            console.log('  🧪 測試方法可用性:');
            console.log('    smartShowDropdown:', typeof alpineData.smartShowDropdown);
            console.log('    scheduleHideDropdown:', typeof alpineData.scheduleHideDropdown);
            console.log('    當前開啟的下拉選單:', alpineData.openDropdowns);
            console.log('    導航項目數量:', alpineData.navigationItems ? alpineData.navigationItems.length : 'N/A');
        } else {
            results.errors.push('Alpine.js data stack not found or empty');
        }
    } catch (error) {
        results.errors.push('Alpine investigation failed: ' + error.message);
    }

    // Phase 3: CSS 和定位分析
    console.log('\n🔵 Phase 3: CSS 和定位分析');
    try {
        const dropdowns = document.querySelectorAll('.nexus-nav-dropdown');
        results.phases.cssPositioning = {
            dropdownCount: dropdowns.length,
            dropdownStates: []
        };

        dropdowns.forEach((dropdown, index) => {
            const styles = window.getComputedStyle(dropdown);
            const state = {
                index: index,
                id: dropdown.id,
                display: styles.display,
                visibility: styles.visibility,
                opacity: styles.opacity,
                zIndex: styles.zIndex,
                position: styles.position,
                top: styles.top,
                left: styles.left,
                transform: styles.transform,
                hasXShow: dropdown.hasAttribute('x-show'),
                xShowValue: dropdown.getAttribute('x-show')
            };
            results.phases.cssPositioning.dropdownStates.push(state);
            
            console.log(`  下拉選單 ${index + 1} (${dropdown.id}):`, {
                display: state.display,
                visibility: state.visibility,
                opacity: state.opacity,
                xShow: state.xShowValue
            });
        });
    } catch (error) {
        results.errors.push('CSS positioning analysis failed: ' + error.message);
    }

    // Phase 4: 事件處理器測試
    console.log('\n🔵 Phase 4: 事件處理器測試');
    try {
        const navItems = document.querySelectorAll('[x-data*="multiLevelNav"] li[class*="relative"]');
        results.phases.eventHandlers = {
            navItemCount: navItems.length,
            eventTests: []
        };

        navItems.forEach((item, index) => {
            if (index < 3) { // 只測試前3個項目
                const button = item.querySelector('button');
                if (button) {
                    const test = {
                        index: index,
                        hasMouseEnter: item.hasAttribute('@mouseenter') || item.getAttribute('@mouseenter'),
                        hasMouseLeave: item.hasAttribute('@mouseleave') || item.getAttribute('@mouseleave'),
                        buttonId: button.id,
                        buttonAriaExpanded: button.getAttribute('aria-expanded')
                    };
                    results.phases.eventHandlers.eventTests.push(test);
                    
                    console.log(`  導航項目 ${index + 1}:`, test);
                }
            }
        });
    } catch (error) {
        results.errors.push('Event handler testing failed: ' + error.message);
    }

    // Phase 5: 近期變更分析
    console.log('\n🔵 Phase 5: 近期變更分析');
    try {
        const navElement = document.querySelector('[x-data*="multiLevelNav"]');
        if (navElement && navElement._x_dataStack && navElement._x_dataStack[0]) {
            const alpineData = navElement._x_dataStack[0];
            
            // 檢查 scheduleHideDropdown 方法的實現
            if (typeof alpineData.scheduleHideDropdown === 'function') {
                const functionString = alpineData.scheduleHideDropdown.toString();
                results.phases.recentChanges = {
                    scheduleHideDropdownExists: true,
                    hasDoubleCheck: functionString.includes('matches(\':hover\')'),
                    hasTimeout300: functionString.includes('300'),
                    hasElementCheck: functionString.includes('getElementById'),
                    functionLength: functionString.length
                };
                
                console.log('  ✓ scheduleHideDropdown 方法特徵:');
                console.log('    包含雙重檢查:', results.phases.recentChanges.hasDoubleCheck);
                console.log('    使用 300ms 超時:', results.phases.recentChanges.hasTimeout300);
                console.log('    包含元素檢查:', results.phases.recentChanges.hasElementCheck);
            } else {
                results.phases.recentChanges = {
                    scheduleHideDropdownExists: false,
                    error: 'scheduleHideDropdown method not found'
                };
                results.errors.push('scheduleHideDropdown method not found in Alpine data');
            }
        }
    } catch (error) {
        results.errors.push('Recent changes analysis failed: ' + error.message);
    }

    // 生成建議
    console.log('\n🔵 生成診斷建議');
    if (results.errors.length > 0) {
        results.recommendations.push('修復發現的錯誤: ' + results.errors.join(', '));
    }

    if (!results.phases.basicSystemCheck.alpineExists) {
        results.recommendations.push('Alpine.js 未載入 - 檢查腳本引入');
    }

    if (!results.phases.basicSystemCheck.navigationElement) {
        results.recommendations.push('導航元素未找到 - 檢查 Blade 模板');
    }

    if (results.phases.alpineInvestigation.alpineData && 
        results.phases.alpineInvestigation.alpineData.openDropdowns.length === 0) {
        results.recommendations.push('openDropdowns 陣列為空 - 下拉選單可能無法顯示');
    }

    // 輸出完整結果
    console.log('\n📊 診斷結果總結:');
    console.log('錯誤數量:', results.errors.length);
    console.log('建議數量:', results.recommendations.length);
    
    if (results.errors.length > 0) {
        console.log('\n🚨 發現的錯誤:');
        results.errors.forEach(error => console.log('  ❌', error));
    }
    
    if (results.recommendations.length > 0) {
        console.log('\n💡 建議修復:');
        results.recommendations.forEach(rec => console.log('  💡', rec));
    }

    return results;
}

// 捕獲 JavaScript 錯誤
const originalConsoleError = console.error;
const jsErrors = [];
console.error = function(...args) {
    jsErrors.push(args.join(' '));
    originalConsoleError.apply(console, args);
};

// 執行診斷
window.dropdownDiagnosis = comprehensiveDiagnosis();

// 恢復原始 console.error
console.error = originalConsoleError;

// 將 JS 錯誤添加到結果中
if (jsErrors.length > 0) {
    window.dropdownDiagnosis.phases.basicSystemCheck.jsErrors = jsErrors;
    console.log('\n🚨 JavaScript 錯誤:', jsErrors);
}

console.log('\n✅ 診斷完成！結果已保存到 window.dropdownDiagnosis');
console.log('📋 使用 JSON.stringify(window.dropdownDiagnosis, null, 2) 查看完整報告');

// 提供手動測試函數
window.testDropdown = function(itemId) {
    console.log(`🧪 手動測試下拉選單: ${itemId}`);
    const navElement = document.querySelector('[x-data*="multiLevelNav"]');
    if (navElement && navElement._x_dataStack && navElement._x_dataStack[0]) {
        const alpineData = navElement._x_dataStack[0];
        console.log('測試前 openDropdowns:', alpineData.openDropdowns);
        
        try {
            alpineData.smartShowDropdown(itemId, 'manual');
            console.log('測試後 openDropdowns:', alpineData.openDropdowns);
            console.log('✅ 測試完成');
        } catch (error) {
            console.error('❌ 測試失敗:', error);
        }
    } else {
        console.error('❌ 無法找到 Alpine 數據');
    }
};

console.log('\n🛠️  手動測試工具: window.testDropdown("your-dropdown-id")');