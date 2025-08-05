const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

// 測試配置
const TEST_CONFIG = {
    LOGIN_URL: 'http://127.0.0.1:8000/login',
    CASH_FLOW_URL: 'http://127.0.0.1:8000/reports/financial/cash-flow',
    CREDENTIALS: {
        email: 'test@example.com',
        password: 'password123'
    },
    SCREENSHOT_DIR: './screenshots/cash-flow-final-test',
    TIMEOUT: 60000
};

// 確保截圖目錄存在
if (!fs.existsSync(TEST_CONFIG.SCREENSHOT_DIR)) {
    fs.mkdirSync(TEST_CONFIG.SCREENSHOT_DIR, { recursive: true });
}

test.describe('NexusERP 現金流量表頁面最終測試', () => {
    test.setTimeout(TEST_CONFIG.TIMEOUT);
    
    test('完整的現金流量表頁面測試流程', async ({ page }) => {
        console.log('🚀 開始 NexusERP 現金流量表頁面最終測試');
        console.log('=========================================');
        
        const testResults = {
            loginSuccessful: false,
            pageAccessible: false,
            hasContent: false,
            hasErrors: false,
            chartsRendered: false,
            errors: [],
            warnings: []
        };
        
        try {
            // 設置錯誤監聽器
            page.on('console', msg => {
                if (msg.type() === 'error') {
                    console.log('🚨 Console Error:', msg.text());
                    testResults.errors.push({
                        type: 'console',
                        message: msg.text(),
                        timestamp: new Date().toISOString()
                    });
                }
            });
            
            page.on('response', response => {
                if (response.status() >= 400) {
                    console.log(`🚨 HTTP Error: ${response.status()} - ${response.url()}`);
                    testResults.errors.push({
                        type: 'network',
                        status: response.status(),
                        url: response.url(),
                        timestamp: new Date().toISOString()
                    });
                }
            });
            
            // 步驟 1: 導航到登入頁面
            console.log('📋 步驟 1: 導航到登入頁面');
            await page.goto(TEST_CONFIG.LOGIN_URL, { waitUntil: 'networkidle' });
            await page.waitForSelector('form', { timeout: 10000 });
            
            await page.screenshot({ 
                path: path.join(TEST_CONFIG.SCREENSHOT_DIR, '01-login-page.png'),
                fullPage: true 
            });
            
            // 驗證登入表單
            const emailField = page.locator('input[name="email"], input[type="email"]');
            const passwordField = page.locator('input[name="password"], input[type="password"]');
            const loginButton = page.locator('button[type="submit"], input[type="submit"]');
            
            await expect(emailField).toBeVisible();
            await expect(passwordField).toBeVisible();
            await expect(loginButton).toBeVisible();
            console.log('✅ 登入頁面載入成功');
            
            // 步驟 2: 執行登入
            console.log('📋 步驟 2: 執行登入流程');
            await page.fill('input[name="email"], input[type="email"]', TEST_CONFIG.CREDENTIALS.email);
            await page.fill('input[name="password"], input[type="password"]', TEST_CONFIG.CREDENTIALS.password);
            
            // 提交登入表單
            await page.click('button[type="submit"], input[type="submit"]');
            await page.waitForLoadState('networkidle');
            
            await page.screenshot({ 
                path: path.join(TEST_CONFIG.SCREENSHOT_DIR, '02-after-login.png'),
                fullPage: true 
            });
            
            // 檢查登入是否成功
            const currentUrl = page.url();
            if (!currentUrl.includes('/login')) {
                testResults.loginSuccessful = true;
                console.log('✅ 登入成功，已重定向到:', currentUrl);
            } else {
                console.log('⚠️ 仍在登入頁面，檢查登入狀態');
            }
            
            // 步驟 3: 導航到現金流量表頁面
            console.log('📋 步驟 3: 導航到現金流量表頁面');
            await page.goto(TEST_CONFIG.CASH_FLOW_URL, { waitUntil: 'networkidle' });
            
            const title = await page.title();
            const url = page.url();
            console.log('📄 頁面標題:', title);
            console.log('🔗 當前 URL:', url);
            
            // 檢查是否成功存取頁面（不是重定向到登入頁面）
            if (!url.includes('/login')) {
                testResults.pageAccessible = true;
                console.log('✅ 成功存取現金流量表頁面');
            } else {
                console.log('❌ 被重定向到登入頁面，可能是認證失敗');
            }
            
            await page.screenshot({ 
                path: path.join(TEST_CONFIG.SCREENSHOT_DIR, '03-cash-flow-page.png'),
                fullPage: true 
            });
            
            // 步驟 4: 等待頁面完全載入
            console.log('📋 步驟 4: 等待頁面完全載入');
            
            // 等待可能的載入指示器
            try {
                await page.waitForSelector('.loading', { state: 'hidden', timeout: 5000 });
            } catch (e) {
                // 載入指示器可能不存在
            }
            
            // 給時間讓 JavaScript 執行
            await page.waitForTimeout(5000);
            
            // 步驟 5: 檢查頁面內容
            console.log('📋 步驟 5: 檢查頁面內容');
            
            const contentAnalysis = await page.evaluate(() => {
                const analysis = {
                    hasCharts: false,
                    hasTables: false,
                    hasReports: false,
                    hasNavigation: false,
                    hasErrors: false,
                    elements: []
                };
                
                // 檢查圖表 (Canvas 元素)
                const canvases = document.querySelectorAll('canvas');
                if (canvases.length > 0) {
                    analysis.hasCharts = true;
                    analysis.elements.push(`發現 ${canvases.length} 個 Canvas 圖表元素`);
                }
                
                // 檢查表格
                const tables = document.querySelectorAll('table');
                if (tables.length > 0) {
                    analysis.hasTables = true;
                    analysis.elements.push(`發現 ${tables.length} 個表格元素`);
                }
                
                // 檢查報表內容
                const reportElements = document.querySelectorAll('.report, .cash-flow, .financial, [class*="report"]');
                if (reportElements.length > 0) {
                    analysis.hasReports = true;
                    analysis.elements.push(`發現 ${reportElements.length} 個報表容器`);
                }
                
                // 檢查導航
                const navElements = document.querySelectorAll('.nav, .menu, .breadcrumb, nav');
                if (navElements.length > 0) {
                    analysis.hasNavigation = true;
                    analysis.elements.push(`發現 ${navElements.length} 個導航元素`);
                }
                
                // 檢查錯誤訊息
                const errorElements = document.querySelectorAll('.alert-danger, .error, [class*="error"]');
                errorElements.forEach(el => {
                    if (el.offsetParent !== null && el.textContent.trim()) {
                        analysis.hasErrors = true;
                        analysis.elements.push(`錯誤訊息: ${el.textContent.trim()}`);
                    }
                });
                
                return analysis;
            });
            
            testResults.hasContent = contentAnalysis.hasCharts || contentAnalysis.hasTables || contentAnalysis.hasReports;
            testResults.hasErrors = contentAnalysis.hasErrors;
            testResults.chartsRendered = contentAnalysis.hasCharts;
            
            console.log('📊 頁面內容分析:');
            console.log(`   包含圖表: ${contentAnalysis.hasCharts ? '是' : '否'}`);
            console.log(`   包含表格: ${contentAnalysis.hasTables ? '是' : '否'}`);
            console.log(`   包含報表: ${contentAnalysis.hasReports ? '是' : '否'}`);
            console.log(`   包含導航: ${contentAnalysis.hasNavigation ? '是' : '否'}`);
            console.log(`   包含錯誤: ${contentAnalysis.hasErrors ? '是' : '否'}`);
            
            if (contentAnalysis.elements.length > 0) {
                console.log('📋 發現的元素:');
                contentAnalysis.elements.forEach(element => {
                    console.log(`   - ${element}`);
                });
            }
            
            // 步驟 6: 檢查 Chart.js 和 JavaScript 功能
            console.log('📋 步驟 6: 檢查 Chart.js 和 JavaScript 功能');
            
            const jsAnalysis = await page.evaluate(() => {
                const js = {
                    hasChartJS: typeof window.Chart !== 'undefined',
                    hasJQuery: typeof window.jQuery !== 'undefined' || typeof window.$ !== 'undefined',
                    scriptsCount: document.scripts.length,
                    stylesheetsCount: document.styleSheets.length,
                    globalVars: []
                };
                
                // 檢查常見的全域變數
                const commonVars = ['Chart', 'jQuery', '$', 'Livewire', 'Echo', 'axios'];
                commonVars.forEach(varName => {
                    if (typeof window[varName] !== 'undefined') {
                        js.globalVars.push(varName);
                    }
                });
                
                return js;
            });
            
            console.log('🔧 JavaScript 分析:');
            console.log(`   Chart.js 載入: ${jsAnalysis.hasChartJS ? '是' : '否'}`);
            console.log(`   jQuery 載入: ${jsAnalysis.hasJQuery ? '是' : '否'}`);
            console.log(`   腳本數量: ${jsAnalysis.scriptsCount}`);
            console.log(`   樣式表數量: ${jsAnalysis.stylesheetsCount}`);
            console.log(`   全域變數: ${jsAnalysis.globalVars.join(', ') || '無'}`);
            
            await page.screenshot({ 
                path: path.join(TEST_CONFIG.SCREENSHOT_DIR, '04-content-analysis.png'),
                fullPage: true 
            });
            
            // 步驟 7: 響應式設計測試
            console.log('📋 步驟 7: 響應式設計測試');
            
            const viewports = [
                { name: 'Desktop', width: 1920, height: 1080 },
                { name: 'Tablet', width: 768, height: 1024 },
                { name: 'Mobile', width: 375, height: 667 }
            ];
            
            for (const viewport of viewports) {
                await page.setViewportSize({ width: viewport.width, height: viewport.height });
                await page.waitForTimeout(1000);
                
                await page.screenshot({ 
                    path: path.join(TEST_CONFIG.SCREENSHOT_DIR, `05-responsive-${viewport.name}.png`),
                    fullPage: true 
                });
                
                console.log(`📱 ${viewport.name} 截圖已保存`);
            }
            
            // 恢復桌面視窗
            await page.setViewportSize({ width: 1920, height: 1080 });
            
            // 步驟 8: 最終截圖
            console.log('📋 步驟 8: 最終狀態截圖');
            await page.screenshot({ 
                path: path.join(TEST_CONFIG.SCREENSHOT_DIR, '06-final-state.png'),
                fullPage: true 
            });
            
            // 生成測試報告
            const report = {
                testInfo: {
                    timestamp: new Date().toISOString(),
                    testUrl: TEST_CONFIG.CASH_FLOW_URL,
                    credentials: TEST_CONFIG.CREDENTIALS.email,
                    duration: 'N/A'
                },
                results: testResults,
                contentAnalysis: contentAnalysis,
                javascriptAnalysis: jsAnalysis,
                screenshots: [
                    '01-login-page.png',
                    '02-after-login.png',
                    '03-cash-flow-page.png',
                    '04-content-analysis.png',
                    '05-responsive-Desktop.png',
                    '05-responsive-Tablet.png',
                    '05-responsive-Mobile.png',
                    '06-final-state.png'
                ],
                summary: {
                    totalErrors: testResults.errors.length,
                    totalWarnings: testResults.warnings.length,
                    overallSuccess: testResults.loginSuccessful && testResults.pageAccessible && testResults.hasContent,
                    loginWorking: testResults.loginSuccessful,
                    pageAccessible: testResults.pageAccessible,
                    contentAvailable: testResults.hasContent,
                    chartsWorking: testResults.chartsRendered,
                    jsLibrariesLoaded: jsAnalysis.hasChartJS || jsAnalysis.hasJQuery
                },
                recommendations: []
            };
            
            // 生成建議
            if (!testResults.loginSuccessful) {
                report.recommendations.push('檢查登入認證流程和權限設定');
            }
            if (!testResults.pageAccessible) {
                report.recommendations.push('確認現金流量表路由和存取權限');
            }
            if (!testResults.hasContent) {
                report.recommendations.push('檢查現金流量表數據載入和顯示邏輯');
            }
            if (!testResults.chartsRendered) {
                report.recommendations.push('檢查 Chart.js 載入和圖表渲染功能');
            }
            if (testResults.errors.length > 0) {
                report.recommendations.push('修復發現的 JavaScript 和網路錯誤');
            }
            
            // 保存報告
            const reportPath = path.join(TEST_CONFIG.SCREENSHOT_DIR, 'test-report.json');
            fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
            
            console.log('\n📄 測試報告已生成:', reportPath);
            
            // 打印詳細測試摘要
            console.log('\n📊 NexusERP 現金流量表頁面測試報告');
            console.log('=========================================');
            console.log(`測試時間: ${report.testInfo.timestamp}`);
            console.log(`測試 URL: ${report.testInfo.testUrl}`);
            console.log(`使用帳號: ${report.testInfo.credentials}`);
            console.log('\n🔍 測試結果:');
            console.log(`✅ 登入功能: ${report.summary.loginWorking ? '正常' : '異常'}`);
            console.log(`✅ 頁面存取: ${report.summary.pageAccessible ? '正常' : '異常'}`);
            console.log(`✅ 內容載入: ${report.summary.contentAvailable ? '正常' : '異常'}`);
            console.log(`✅ 圖表渲染: ${report.summary.chartsWorking ? '正常' : '異常'}`);
            console.log(`✅ JS 函式庫: ${report.summary.jsLibrariesLoaded ? '已載入' : '未載入'}`);
            console.log(`\n📊 發現錯誤: ${report.summary.totalErrors} 個`);
            console.log(`📊 發現警告: ${report.summary.totalWarnings} 個`);
            console.log(`📊 整體評估: ${report.summary.overallSuccess ? '✅ 通過' : '❌ 需要改進'}`);
            
            if (report.recommendations.length > 0) {
                console.log('\n💡 改進建議:');
                report.recommendations.forEach((rec, index) => {
                    console.log(`   ${index + 1}. ${rec}`);
                });
            }
            
            console.log('\n📸 生成截圖:');
            report.screenshots.forEach((screenshot, index) => {
                console.log(`   ${index + 1}. ${screenshot}`);
            });
            
            console.log('\n🎉 現金流量表頁面測試完成！');
            console.log('=========================================');
            
        } catch (error) {
            console.log('❌ 測試執行失敗:', error.message);
            testResults.errors.push({
                type: 'test_execution',
                message: error.message,
                timestamp: new Date().toISOString()
            });
            
            // 即使失敗也嘗試截圖
            try {
                await page.screenshot({ 
                    path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'error-state.png'),
                    fullPage: true 
                });
            } catch (screenshotError) {
                console.log('無法生成錯誤截圖:', screenshotError.message);
            }
            
            throw error;
        }
    });
});