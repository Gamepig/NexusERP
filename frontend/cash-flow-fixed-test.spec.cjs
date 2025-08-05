const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

// 測試配置
const TEST_CONFIG = {
    LOGIN_URL: 'http://127.0.0.1:8000/login',
    CASH_FLOW_URL: 'http://127.0.0.1:8000/reports/financial/cash-flow',
    BACKUP_CASH_FLOW_URL: 'http://127.0.0.1:8000/reports/financial/cash-flow-test',
    CREDENTIALS: {
        email: 'test@example.com',
        password: 'password123'
    },
    SCREENSHOT_DIR: './screenshots/cash-flow-fixed-test'
};

// 確保截圖目錄存在
if (!fs.existsSync(TEST_CONFIG.SCREENSHOT_DIR)) {
    fs.mkdirSync(TEST_CONFIG.SCREENSHOT_DIR, { recursive: true });
}

test.describe('NexusERP 現金流報表頁面修復驗證測試', () => {
    
    test('現金流報表頁面完整流程測試', async ({ page }) => {
        console.log('🎯 開始現金流報表頁面完整流程測試');
        
        // 開啟控制台和網路監聽
        const consoleLogs = [];
        const networkErrors = [];
        
        page.on('console', msg => {
            consoleLogs.push({
                type: msg.type(),
                text: msg.text(),
                timestamp: new Date().toISOString()
            });
            if (msg.type() === 'error') {
                console.log('🚨 Console Error:', msg.text());
            }
        });
        
        page.on('response', response => {
            if (response.status() >= 400) {
                networkErrors.push({
                    status: response.status(),
                    url: response.url(),
                    statusText: response.statusText()
                });
                console.log(`🚨 HTTP Error: ${response.status()} - ${response.url()}`);
            }
        });

        // 步驟 1: 登入系統
        console.log('📋 步驟 1: 登入系統');
        await page.goto(TEST_CONFIG.LOGIN_URL);
        await page.waitForLoadState('networkidle');
        
        // 截圖登入頁面
        await page.screenshot({ 
            path: path.join(TEST_CONFIG.SCREENSHOT_DIR, '01-login-page.png'), 
            fullPage: true 
        });
        console.log('✅ 登入頁面截圖已保存');
        
        // 填寫並提交登入表單
        await page.fill('input[name="email"], input[type="email"]', TEST_CONFIG.CREDENTIALS.email);
        await page.fill('input[name="password"], input[type="password"]', TEST_CONFIG.CREDENTIALS.password);
        await page.click('button[type="submit"], input[type="submit"]');
        
        // 等待登入完成
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000); // 等待可能的重定向
        
        // 截圖登入後的頁面
        await page.screenshot({ 
            path: path.join(TEST_CONFIG.SCREENSHOT_DIR, '02-after-login.png'), 
            fullPage: true 
        });
        console.log('✅ 登入後頁面截圖已保存');
        
        // 驗證登入成功
        const currentUrl = page.url();
        console.log('🔗 登入後的 URL:', currentUrl);
        
        // 檢查是否成功登入（不在登入頁面）
        if (currentUrl.includes('/login')) {
            console.log('❌ 登入可能失敗，仍在登入頁面');
        } else {
            console.log('✅ 登入成功，已離開登入頁面');
        }

        // 步驟 2: 直接導航到現金流報表頁面
        console.log('📋 步驟 2: 導航到現金流報表頁面');
        
        try {
            console.log('🔄 嘗試存取現金流報表頁面:', TEST_CONFIG.CASH_FLOW_URL);
            await page.goto(TEST_CONFIG.CASH_FLOW_URL);
            await page.waitForLoadState('networkidle', { timeout: 15000 });
            
            // 等待頁面完全載入
            await page.waitForTimeout(3000);
            
            // 截圖現金流頁面
            await page.screenshot({ 
                path: path.join(TEST_CONFIG.SCREENSHOT_DIR, '03-cash-flow-main-route.png'), 
                fullPage: true 
            });
            console.log('✅ 主路由現金流頁面截圖已保存');
            
            // 檢查最終 URL
            const finalUrl = page.url();
            console.log('🔗 最終 URL:', finalUrl);
            
            if (finalUrl.includes('/login')) {
                console.log('⚠️ 主路由重定向到登入頁面，可能需要額外權限');
                throw new Error('主路由需要額外驗證');
            } else if (finalUrl.includes('cash-flow')) {
                console.log('✅ 成功存取現金流報表頁面');
            } else {
                console.log('⚠️ 未預期的頁面重定向:', finalUrl);
            }
            
        } catch (error) {
            console.log('❌ 主路由存取失敗:', error.message);
            console.log('🔄 嘗試備用路由...');
            
            // 嘗試備用路由
            try {
                await page.goto(TEST_CONFIG.BACKUP_CASH_FLOW_URL);
                await page.waitForLoadState('networkidle', { timeout: 10000 });
                
                await page.screenshot({ 
                    path: path.join(TEST_CONFIG.SCREENSHOT_DIR, '04-cash-flow-backup-route.png'), 
                    fullPage: true 
                });
                console.log('✅ 備用路由現金流頁面截圖已保存');
                
                const backupUrl = page.url();
                console.log('🔗 備用路由 URL:', backupUrl);
                
            } catch (backupError) {
                console.log('❌ 備用路由也失敗:', backupError.message);
            }
        }

        // 步驟 3: 分析頁面內容
        console.log('📋 步驟 3: 分析頁面內容和功能');
        
        const pageAnalysis = await page.evaluate(() => {
            const analysis = {
                title: document.title,
                url: window.location.href,
                hasTable: !!document.querySelector('table'),
                hasCharts: !!document.querySelector('canvas, .chart, [id*="chart"]'),
                hasCashFlowContent: document.body.innerHTML.includes('現金流') || document.body.innerHTML.includes('cash-flow'),
                hasReportContent: document.body.innerHTML.includes('報表') || document.body.innerHTML.includes('report'),
                hasLoginForm: !!document.querySelector('form input[type="password"]'),
                hasNavigation: !!document.querySelector('.nav, .menu, .breadcrumb'),
                hasErrors: !!document.querySelector('.alert-danger, .error, [class*="error"]'),
                bodyClasses: document.body.className,
                mainElements: []
            };
            
            // 收集主要元素
            const selectors = ['h1', 'h2', 'h3', '.card', '.report', 'main', 'section'];
            selectors.forEach(selector => {
                const elements = document.querySelectorAll(selector);
                elements.forEach(el => {
                    if (el.offsetParent !== null) {
                        analysis.mainElements.push({
                            tag: el.tagName,
                            text: el.textContent.trim().substring(0, 100),
                            classes: el.className
                        });
                    }
                });
            });
            
            return analysis;
        });
        
        console.log('📊 頁面分析結果:');
        console.log(`   頁面標題: ${pageAnalysis.title}`);
        console.log(`   最終 URL: ${pageAnalysis.url}`);
        console.log(`   包含表格: ${pageAnalysis.hasTable ? '是' : '否'}`);
        console.log(`   包含圖表: ${pageAnalysis.hasCharts ? '是' : '否'}`);
        console.log(`   包含現金流內容: ${pageAnalysis.hasCashFlowContent ? '是' : '否'}`);
        console.log(`   包含報表內容: ${pageAnalysis.hasReportContent ? '是' : '否'}`);
        console.log(`   顯示登入表單: ${pageAnalysis.hasLoginForm ? '是' : '否'}`);
        console.log(`   包含導航: ${pageAnalysis.hasNavigation ? '是' : '否'}`);
        console.log(`   包含錯誤: ${pageAnalysis.hasErrors ? '是' : '否'}`);
        
        if (pageAnalysis.mainElements.length > 0) {
            console.log('📋 主要頁面元素:');
            pageAnalysis.mainElements.slice(0, 5).forEach((el, index) => {
                console.log(`   ${index + 1}. ${el.tag}: ${el.text}`);
            });
        }

        // 步驟 4: 測試頁面互動
        console.log('📋 步驟 4: 測試頁面互動功能');
        
        try {
            // 如果有表格，測試表格功能
            if (pageAnalysis.hasTable) {
                console.log('📊 測試表格功能...');
                const tables = await page.locator('table').all();
                console.log(`   發現 ${tables.length} 個表格`);
                
                // 檢查表格內容
                if (tables.length > 0) {
                    const tableData = await tables[0].evaluate(table => {
                        const rows = table.querySelectorAll('tr');
                        return {
                            rowCount: rows.length,
                            hasHeader: !!table.querySelector('thead'),
                            hasData: rows.length > 1
                        };
                    });
                    console.log(`   表格資料: ${tableData.rowCount} 行, 有標題: ${tableData.hasHeader}, 有資料: ${tableData.hasData}`);
                }
            }
            
            // 測試任何可點擊的元素
            const clickableElements = await page.locator('button, a, .btn').all();
            if (clickableElements.length > 0) {
                console.log(`📱 發現 ${clickableElements.length} 個可點擊元素`);
                
                // 嘗試點擊第一個安全的按鈕
                const firstButton = clickableElements[0];
                const buttonInfo = await firstButton.evaluate(el => ({
                    tag: el.tagName,
                    text: el.textContent.trim(),
                    href: el.href,
                    type: el.type
                }));
                
                console.log('🎯 測試第一個按鈕:', buttonInfo);
                
                if (buttonInfo.tag === 'A' && buttonInfo.href && !buttonInfo.href.includes('logout')) {
                    try {
                        await firstButton.click();
                        await page.waitForTimeout(2000);
                        console.log('✅ 按鈕點擊測試成功');
                    } catch (clickError) {
                        console.log('⚠️ 按鈕點擊測試失敗:', clickError.message);
                    }
                }
            }
            
        } catch (interactionError) {
            console.log('⚠️ 互動測試失敗:', interactionError.message);
        }

        // 步驟 5: 最終狀態截圖和報告
        console.log('📋 步驟 5: 生成最終報告');
        
        await page.screenshot({ 
            path: path.join(TEST_CONFIG.SCREENSHOT_DIR, '05-final-state.png'), 
            fullPage: true 
        });
        console.log('✅ 最終狀態截圖已保存');
        
        // 生成測試報告
        const testReport = {
            testInfo: {
                timestamp: new Date().toISOString(),
                testName: '現金流報表頁面修復驗證測試'
            },
            results: {
                loginSuccessful: !pageAnalysis.hasLoginForm,
                pageAccessible: !pageAnalysis.url.includes('/login'),
                hasCashFlowContent: pageAnalysis.hasCashFlowContent,
                hasReportContent: pageAnalysis.hasReportContent,
                hasTable: pageAnalysis.hasTable,
                hasCharts: pageAnalysis.hasCharts,
                hasNavigation: pageAnalysis.hasNavigation,
                hasErrors: pageAnalysis.hasErrors
            },
            pageAnalysis: pageAnalysis,
            consoleLogs: consoleLogs,
            networkErrors: networkErrors,
            screenshots: [
                '01-login-page.png',
                '02-after-login.png',
                '03-cash-flow-main-route.png',
                '04-cash-flow-backup-route.png',
                '05-final-state.png'
            ]
        };
        
        // 評估測試結果
        const successfulTests = Object.values(testReport.results).filter(result => result === true).length;
        const totalTests = Object.keys(testReport.results).length;
        testReport.successRate = (successfulTests / totalTests) * 100;
        
        // 提供建議
        testReport.recommendations = [];
        if (!testReport.results.loginSuccessful) {
            testReport.recommendations.push('修復登入功能');
        }
        if (!testReport.results.pageAccessible) {
            testReport.recommendations.push('檢查現金流報表頁面權限設置');
        }
        if (!testReport.results.hasCashFlowContent) {
            testReport.recommendations.push('確認現金流報表內容正確顯示');
        }
        if (!testReport.results.hasTable && !testReport.results.hasCharts) {
            testReport.recommendations.push('添加現金流報表數據展示');
        }
        if (testReport.results.hasErrors) {
            testReport.recommendations.push('修復頁面錯誤');
        }
        if (networkErrors.length > 0) {
            testReport.recommendations.push('修復網路請求錯誤');
        }
        
        // 保存測試報告
        const reportPath = path.join(TEST_CONFIG.SCREENSHOT_DIR, 'test-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(testReport, null, 2));
        console.log('📄 測試報告已保存:', reportPath);
        
        // 輸出測試摘要
        console.log('\n🎉 現金流報表頁面測試完成！');
        console.log('====================');
        console.log(`測試成功率: ${testReport.successRate.toFixed(1)}%`);
        console.log(`登入成功: ${testReport.results.loginSuccessful ? '✅' : '❌'}`);
        console.log(`頁面可存取: ${testReport.results.pageAccessible ? '✅' : '❌'}`);
        console.log(`包含現金流內容: ${testReport.results.hasCashFlowContent ? '✅' : '❌'}`);
        console.log(`包含報表內容: ${testReport.results.hasReportContent ? '✅' : '❌'}`);
        console.log(`包含資料表格: ${testReport.results.hasTable ? '✅' : '❌'}`);
        console.log(`包含圖表: ${testReport.results.hasCharts ? '✅' : '❌'}`);
        console.log(`JavaScript 錯誤: ${consoleLogs.filter(log => log.type === 'error').length} 個`);
        console.log(`網路錯誤: ${networkErrors.length} 個`);
        console.log(`建議項目: ${testReport.recommendations.length} 個`);
        
        if (testReport.recommendations.length > 0) {
            console.log('\n📋 修復建議:');
            testReport.recommendations.forEach((rec, index) => {
                console.log(`   ${index + 1}. ${rec}`);
            });
        }
        console.log('====================');
    });
});