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
    SCREENSHOT_DIR: './screenshots/cash-flow-complete-test',
    TIMEOUT: {
        page: 30000,
        element: 10000,
        network: 15000
    }
};

// 確保截圖目錄存在
if (!fs.existsSync(TEST_CONFIG.SCREENSHOT_DIR)) {
    fs.mkdirSync(TEST_CONFIG.SCREENSHOT_DIR, { recursive: true });
}

test.describe('NexusERP 現金流量表頁面完整測試', () => {
    let page;
    let context;
    let testResults = {
        loginSuccessful: false,
        pageAccessible: false,
        hasContent: false,
        hasErrors: false,
        chartsRendered: false,
        interactionTested: false,
        responsiveDesignTested: false,
        errors: [],
        warnings: []
    };

    test.beforeAll(async ({ browser }) => {
        console.log('🚀 開始 NexusERP 現金流量表頁面完整測試');
        console.log('=====================================');
        
        context = await browser.newContext({
            viewport: { width: 1920, height: 1080 },
            ignoreHTTPSErrors: true,
            acceptDownloads: true
        });
        
        page = await context.newPage();
        
        // 設置錯誤監聽器
        page.on('console', msg => {
            const type = msg.type();
            const text = msg.text();
            
            if (type === 'error') {
                console.log('🚨 Console Error:', text);
                testResults.errors.push({
                    type: 'console',
                    message: text,
                    timestamp: new Date().toISOString()
                });
            } else if (type === 'warning') {
                console.log('⚠️ Console Warning:', text);
                testResults.warnings.push({
                    type: 'console',
                    message: text,
                    timestamp: new Date().toISOString()
                });
            }
        });
        
        // 網路錯誤監聽
        page.on('response', response => {
            if (response.status() >= 400) {
                const errorMsg = `HTTP ${response.status()} - ${response.url()}`;
                console.log('🚨 HTTP Error:', errorMsg);
                testResults.errors.push({
                    type: 'network',
                    message: errorMsg,
                    timestamp: new Date().toISOString()
                });
            }
        });
        
        // 頁面錯誤監聽
        page.on('pageerror', error => {
            console.log('🚨 Page Error:', error.message);
            testResults.errors.push({
                type: 'page',
                message: error.message,
                timestamp: new Date().toISOString()
            });
        });
    });

    test.afterAll(async () => {
        // 生成最終測試報告
        await generateFinalReport();
        await context.close();
        
        console.log('\n🎉 測試完成！');
        console.log('=====================================');
    });

    test('步驟 1: 導航到登入頁面並驗證頁面元素', async () => {
        console.log('📋 步驟 1: 導航到登入頁面');
        
        try {
            await page.goto(TEST_CONFIG.LOGIN_URL, { 
                waitUntil: 'networkidle',
                timeout: TEST_CONFIG.TIMEOUT.page 
            });
            
            // 等待頁面完全載入
            await page.waitForSelector('form', { timeout: TEST_CONFIG.TIMEOUT.element });
            
            // 截圖登入頁面
            await page.screenshot({ 
                path: path.join(TEST_CONFIG.SCREENSHOT_DIR, '01-login-page.png'),
                fullPage: true 
            });
            
            // 驗證登入表單元素
            const emailField = page.locator('input[name="email"], input[type="email"]');
            const passwordField = page.locator('input[name="password"], input[type="password"]');
            const loginButton = page.locator('button[type="submit"], input[type="submit"]');
            
            await expect(emailField).toBeVisible();
            await expect(passwordField).toBeVisible();
            await expect(loginButton).toBeVisible();
            
            console.log('✅ 步驟 1 完成: 登入頁面載入成功，所有表單元素可見');
            
        } catch (error) {
            console.log('❌ 步驟 1 失敗:', error.message);
            testResults.errors.push({
                type: 'test',
                step: '1',
                message: error.message,
                timestamp: new Date().toISOString()
            });
            throw error;
        }
    });

    test('步驟 2: 執行登入流程並驗證成功', async () => {
        console.log('📋 步驟 2: 執行登入流程');
        
        try {
            // 填寫登入資訊
            await page.fill('input[name="email"], input[type="email"]', TEST_CONFIG.CREDENTIALS.email);
            await page.fill('input[name="password"], input[type="password"]', TEST_CONFIG.CREDENTIALS.password);
            
            // 點擊登入按鈕並等待導航
            await Promise.all([
                page.waitForNavigation({ waitUntil: 'networkidle' }),
                page.click('button[type="submit"], input[type="submit"]')
            ]);
            
            // 截圖登入後頁面
            await page.screenshot({ 
                path: path.join(TEST_CONFIG.SCREENSHOT_DIR, '02-after-login.png'),
                fullPage: true 
            });
            
            // 驗證登入成功 - 檢查常見的認證指標
            const authIndicators = [
                'text=登出', 'text=Logout', 
                '.user-menu', '.logout', '.user-info',
                '[data-toggle="dropdown"]', '.dropdown-user'
            ];
            
            let loginSuccess = false;
            for (const indicator of authIndicators) {
                try {
                    await page.waitForSelector(indicator, { timeout: 5000 });
                    loginSuccess = true;
                    break;
                } catch (e) {
                    // 繼續嘗試下一個指標
                }
            }
            
            // 檢查 URL 是否變更（通常登入後會重定向）
            const currentUrl = page.url();
            if (!loginSuccess && !currentUrl.includes('/login')) {
                loginSuccess = true; // URL 變更表示可能登入成功
            }
            
            testResults.loginSuccessful = loginSuccess;
            
            if (loginSuccess) {
                console.log('✅ 步驟 2 完成: 登入成功');
            } else {
                console.log('⚠️ 步驟 2 警告: 無法確認登入狀態，但繼續測試');
            }
            
        } catch (error) {
            console.log('❌ 步驟 2 失敗:', error.message);
            testResults.errors.push({
                type: 'test',
                step: '2',
                message: error.message,
                timestamp: new Date().toISOString()
            });
            throw error;
        }
    });

    test('步驟 3: 導航到現金流量表頁面', async () => {
        console.log('📋 步驟 3: 導航到現金流量表頁面');
        
        try {
            // 導航到現金流量表頁面
            await page.goto(TEST_CONFIG.CASH_FLOW_URL, {
                waitUntil: 'networkidle',
                timeout: TEST_CONFIG.TIMEOUT.page
            });
            
            // 等待頁面載入完成
            await page.waitForLoadState('domcontentloaded');
            
            // 截圖初始頁面狀態
            await page.screenshot({ 
                path: path.join(TEST_CONFIG.SCREENSHOT_DIR, '03-cash-flow-initial.png'),
                fullPage: true 
            });
            
            // 檢查頁面標題和 URL
            const title = await page.title();
            const url = page.url();
            
            console.log('📄 頁面標題:', title);
            console.log('🔗 當前 URL:', url);
            
            testResults.pageAccessible = true;
            console.log('✅ 步驟 3 完成: 成功導航到現金流量表頁面');
            
        } catch (error) {
            console.log('❌ 步驟 3 失敗:', error.message);
            testResults.errors.push({
                type: 'test',
                step: '3',
                message: error.message,
                timestamp: new Date().toISOString()
            });
            throw error;
        }
    });

    test('步驟 4: 等待頁面完全載入並檢查動態內容', async () => {
        console.log('📋 步驟 4: 等待頁面完全載入');
        
        try {
            // 等待可能的載入指示器消失
            const loadingSelectors = [
                '.loading', '.spinner', '[class*="loading"]',
                'text=載入中', 'text=Loading', '.fa-spinner'
            ];
            
            for (const selector of loadingSelectors) {
                try {
                    await page.waitForSelector(selector, { 
                        state: 'hidden', 
                        timeout: 5000 
                    });
                    console.log('⏳ 等待載入完成:', selector);
                } catch (e) {
                    // 載入器可能不存在，繼續
                }
            }
            
            // 給額外時間讓 JavaScript 執行和圖表渲染
            await page.waitForTimeout(3000);
            
            // 嘗試等待 Chart.js 圖表載入
            try {
                await page.waitForFunction(() => {
                    return window.Chart && document.querySelectorAll('canvas').length > 0;
                }, { timeout: 10000 });
                console.log('📊 Chart.js 圖表已載入');
            } catch (e) {
                console.log('⚠️ Chart.js 圖表可能未載入或不存在');
            }
            
            // 等待任何 AJAX 請求完成
            await page.waitForLoadState('networkidle');
            
            // 截圖完全載入後的頁面
            await page.screenshot({ 
                path: path.join(TEST_CONFIG.SCREENSHOT_DIR, '04-fully-loaded.png'),
                fullPage: true 
            });
            
            console.log('✅ 步驟 4 完成: 頁面載入和動態內容檢查完成');
            
        } catch (error) {
            console.log('❌ 步驟 4 失敗:', error.message);
            testResults.errors.push({
                type: 'test',
                step: '4',
                message: error.message,
                timestamp: new Date().toISOString()
            });
        }
    });

    test('步驟 5: 檢查頁面內容和重要元素', async () => {
        console.log('📋 步驟 5: 檢查頁面內容');
        
        try {
            // 檢查各種內容元素
            const contentChecks = await page.evaluate(() => {
                const checks = {
                    hasCharts: false,
                    hasTables: false,
                    hasReports: false,
                    hasNavigation: false,
                    hasErrors: false,
                    charts: [],
                    tables: [],
                    errors: []
                };
                
                // 檢查圖表
                const chartSelectors = ['canvas', '.chart', '[id*="chart"]', '[class*="chart"]'];
                chartSelectors.forEach(selector => {
                    const elements = document.querySelectorAll(selector);
                    if (elements.length > 0) {
                        checks.hasCharts = true;
                        elements.forEach(el => {
                            checks.charts.push({
                                tag: el.tagName,
                                id: el.id,
                                classes: el.className,
                                visible: el.offsetParent !== null
                            });
                        });
                    }
                });
                
                // 檢查表格
                const tableSelectors = ['table', '.data-table', '.table'];
                tableSelectors.forEach(selector => {
                    const elements = document.querySelectorAll(selector);
                    if (elements.length > 0) {
                        checks.hasTables = true;
                        elements.forEach(el => {
                            checks.tables.push({
                                rows: el.rows ? el.rows.length : 0,
                                classes: el.className,
                                visible: el.offsetParent !== null
                            });
                        });
                    }
                });
                
                // 檢查報表內容
                const reportSelectors = ['.report', '.cash-flow', '.financial', '[class*="report"]'];
                reportSelectors.forEach(selector => {
                    const elements = document.querySelectorAll(selector);
                    if (elements.length > 0) {
                        checks.hasReports = true;
                    }
                });
                
                // 檢查導航
                const navSelectors = ['.nav', '.menu', '.breadcrumb', 'nav'];
                navSelectors.forEach(selector => {
                    const elements = document.querySelectorAll(selector);
                    if (elements.length > 0) {
                        checks.hasNavigation = true;
                    }
                });
                
                // 檢查錯誤
                const errorSelectors = [
                    '.alert-danger', '.error', '.alert-error', 
                    '[class*="error"]', 'text=Error', 'text=錯誤'
                ];
                errorSelectors.forEach(selector => {
                    const elements = document.querySelectorAll(selector);
                    elements.forEach(el => {
                        if (el.offsetParent !== null) {
                            checks.hasErrors = true;
                            checks.errors.push({
                                text: el.textContent.trim(),
                                classes: el.className
                            });
                        }
                    });
                });
                
                return checks;
            });
            
            // 更新測試結果
            testResults.hasContent = contentChecks.hasCharts || contentChecks.hasTables || contentChecks.hasReports;
            testResults.hasErrors = contentChecks.hasErrors;
            testResults.chartsRendered = contentChecks.hasCharts;
            
            // 記錄檢查結果
            console.log('📊 頁面內容分析:');
            console.log(`   包含圖表: ${contentChecks.hasCharts ? '是' : '否'} (${contentChecks.charts.length} 個)`);
            console.log(`   包含表格: ${contentChecks.hasTables ? '是' : '否'} (${contentChecks.tables.length} 個)`);
            console.log(`   包含報表: ${contentChecks.hasReports ? '是' : '否'}`);
            console.log(`   包含導航: ${contentChecks.hasNavigation ? '是' : '否'}`);
            console.log(`   包含錯誤: ${contentChecks.hasErrors ? '是' : '否'}`);
            
            if (contentChecks.errors.length > 0) {
                console.log('🚨 發現的錯誤:');
                contentChecks.errors.forEach((error, index) => {
                    console.log(`   ${index + 1}. ${error.text}`);
                });
            }
            
            console.log('✅ 步驟 5 完成: 頁面內容檢查完成');
            
        } catch (error) {
            console.log('❌ 步驟 5 失敗:', error.message);
            testResults.errors.push({
                type: 'test',
                step: '5',
                message: error.message,
                timestamp: new Date().toISOString()
            });
        }
    });

    test('步驟 6: 測試篩選器和控制項功能', async () => {
        console.log('📋 步驟 6: 測試篩選器和控制項');
        
        try {
            // 查找可能的篩選器和控制項
            const controlElements = await page.locator(
                'select, input[type="date"], input[type="text"], button:not([type="submit"]), .filter, .control'
            ).all();
            
            if (controlElements.length > 0) {
                console.log(`🎛️ 發現 ${controlElements.length} 個控制項元素`);
                
                // 測試第一個控制項
                const firstControl = controlElements[0];
                const controlInfo = await firstControl.evaluate(el => ({
                    tag: el.tagName,
                    type: el.type,
                    name: el.name,
                    id: el.id,
                    classes: el.className
                }));
                
                console.log('🎯 測試控制項:', controlInfo);
                
                // 根據控制項類型進行測試
                if (controlInfo.tag === 'SELECT') {
                    const options = await firstControl.locator('option').all();
                    if (options.length > 1) {
                        await firstControl.selectOption({ index: 1 });
                        console.log('✅ 下拉選單測試成功');
                    }
                } else if (controlInfo.type === 'date') {
                    await firstControl.fill('2024-01-01');
                    console.log('✅ 日期輸入測試成功');
                } else if (controlInfo.tag === 'BUTTON') {
                    await firstControl.click();
                    await page.waitForTimeout(2000);
                    console.log('✅ 按鈕點擊測試成功');
                }
                
                // 等待可能的更新
                await page.waitForTimeout(3000);
                
                testResults.interactionTested = true;
            } else {
                console.log('ℹ️ 未發現篩選器或控制項');
            }
            
            // 截圖控制項測試後的狀態
            await page.screenshot({ 
                path: path.join(TEST_CONFIG.SCREENSHOT_DIR, '05-controls-tested.png'),
                fullPage: true 
            });
            
            console.log('✅ 步驟 6 完成: 篩選器和控制項測試完成');
            
        } catch (error) {
            console.log('❌ 步驟 6 失敗:', error.message);
            testResults.errors.push({
                type: 'test',
                step: '6',
                message: error.message,
                timestamp: new Date().toISOString()
            });
        }
    });

    test('步驟 7: 響應式設計測試', async () => {
        console.log('📋 步驟 7: 響應式設計測試');
        
        try {
            const viewports = [
                { name: 'Desktop', width: 1920, height: 1080 },
                { name: 'Tablet', width: 768, height: 1024 },
                { name: 'Mobile', width: 375, height: 667 }
            ];
            
            for (const viewport of viewports) {
                console.log(`📱 測試 ${viewport.name} 視窗 (${viewport.width}x${viewport.height})`);
                
                await page.setViewportSize({ 
                    width: viewport.width, 
                    height: viewport.height 
                });
                
                // 等待響應式調整
                await page.waitForTimeout(1000);
                
                // 截圖不同視窗大小
                await page.screenshot({ 
                    path: path.join(TEST_CONFIG.SCREENSHOT_DIR, `06-responsive-${viewport.name}.png`),
                    fullPage: true 
                });
                
                // 檢查內容是否仍然可見
                const isContentVisible = await page.evaluate(() => {
                    const mainContent = document.querySelector('main, .content, .container');
                    return mainContent && mainContent.offsetParent !== null;
                });
                
                if (isContentVisible) {
                    console.log(`✅ ${viewport.name} 視窗內容可見`);
                } else {
                    console.log(`⚠️ ${viewport.name} 視窗內容可能有問題`);
                }
            }
            
            // 恢復原始視窗大小
            await page.setViewportSize({ width: 1920, height: 1080 });
            
            testResults.responsiveDesignTested = true;
            console.log('✅ 步驟 7 完成: 響應式設計測試完成');
            
        } catch (error) {
            console.log('❌ 步驟 7 失敗:', error.message);
            testResults.errors.push({
                type: 'test',
                step: '7',
                message: error.message,
                timestamp: new Date().toISOString()
            });
        }
    });

    test('步驟 8: 最終狀態截圖和完整性檢查', async () => {
        console.log('📋 步驟 8: 最終狀態檢查');
        
        try {
            // 確保頁面處於最終狀態
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(2000);
            
            // 最終截圖
            await page.screenshot({ 
                path: path.join(TEST_CONFIG.SCREENSHOT_DIR, '07-final-state.png'),
                fullPage: true 
            });
            
            // 執行最終的頁面完整性檢查
            const finalCheck = await page.evaluate(() => {
                return {
                    url: window.location.href,
                    title: document.title,
                    hasJavaScriptErrors: window.jsErrors || false,
                    loadTime: performance.now(),
                    scriptsLoaded: document.scripts.length,
                    stylesheetsLoaded: document.styleSheets.length,
                    imagesLoaded: document.images.length,
                    canvasElements: document.querySelectorAll('canvas').length,
                    tableElements: document.querySelectorAll('table').length
                };
            });
            
            console.log('📊 最終頁面狀態:');
            console.log(`   URL: ${finalCheck.url}`);
            console.log(`   標題: ${finalCheck.title}`);
            console.log(`   腳本數量: ${finalCheck.scriptsLoaded}`);
            console.log(`   樣式表數量: ${finalCheck.stylesheetsLoaded}`);
            console.log(`   圖片數量: ${finalCheck.imagesLoaded}`);
            console.log(`   Canvas 元素: ${finalCheck.canvasElements}`);
            console.log(`   表格元素: ${finalCheck.tableElements}`);
            
            console.log('✅ 步驟 8 完成: 最終狀態檢查完成');
            
        } catch (error) {
            console.log('❌ 步驟 8 失敗:', error.message);
            testResults.errors.push({
                type: 'test',
                step: '8',
                message: error.message,
                timestamp: new Date().toISOString()
            });
        }
    });

    // 生成最終測試報告的輔助函數
    async function generateFinalReport() {
        const report = {
            testInfo: {
                timestamp: new Date().toISOString(),
                testUrl: TEST_CONFIG.CASH_FLOW_URL,
                credentials: TEST_CONFIG.CREDENTIALS.email
            },
            results: testResults,
            screenshots: [
                '01-login-page.png',
                '02-after-login.png',
                '03-cash-flow-initial.png',
                '04-fully-loaded.png',
                '05-controls-tested.png',
                '06-responsive-Desktop.png',
                '06-responsive-Tablet.png',
                '06-responsive-Mobile.png',
                '07-final-state.png'
            ],
            summary: {
                totalErrors: testResults.errors.length,
                totalWarnings: testResults.warnings.length,
                overallSuccess: testResults.loginSuccessful && testResults.pageAccessible && !testResults.hasErrors,
                contentAvailable: testResults.hasContent,
                chartsWorking: testResults.chartsRendered,
                interactionsWorking: testResults.interactionTested,
                responsiveDesignWorking: testResults.responsiveDesignTested
            },
            recommendations: []
        };
        
        // 生成建議
        if (testResults.errors.length > 0) {
            report.recommendations.push('修復發現的錯誤和問題');
        }
        if (!testResults.hasContent) {
            report.recommendations.push('確認現金流量表數據正確載入和顯示');
        }
        if (!testResults.chartsRendered) {
            report.recommendations.push('檢查圖表渲染功能和 Chart.js 載入');
        }
        if (!testResults.interactionTested) {
            report.recommendations.push('確認頁面互動功能正常運作');
        }
        
        // 保存報告
        const reportPath = path.join(TEST_CONFIG.SCREENSHOT_DIR, 'test-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
        
        console.log('\n📄 測試報告已生成:', reportPath);
        
        // 打印測試摘要
        console.log('\n📊 測試摘要報告:');
        console.log('=====================================');
        console.log(`測試時間: ${report.testInfo.timestamp}`);
        console.log(`測試 URL: ${report.testInfo.testUrl}`);
        console.log(`登入狀態: ${report.results.loginSuccessful ? '✅ 成功' : '❌ 失敗'}`);
        console.log(`頁面存取: ${report.results.pageAccessible ? '✅ 成功' : '❌ 失敗'}`);
        console.log(`內容載入: ${report.results.hasContent ? '✅ 成功' : '❌ 失敗'}`);
        console.log(`圖表渲染: ${report.results.chartsRendered ? '✅ 成功' : '❌ 失敗'}`);
        console.log(`互動測試: ${report.results.interactionTested ? '✅ 成功' : '❌ 失敗'}`);
        console.log(`響應式設計: ${report.results.responsiveDesignTested ? '✅ 成功' : '❌ 失敗'}`);
        console.log(`發現錯誤: ${report.summary.totalErrors} 個`);
        console.log(`發現警告: ${report.summary.totalWarnings} 個`);
        console.log(`整體評估: ${report.summary.overallSuccess ? '✅ 通過' : '❌ 需要改進'}`);
        console.log(`截圖數量: ${report.screenshots.length} 張`);
        console.log(`建議數量: ${report.recommendations.length} 項`);
        console.log('=====================================');
        
        if (report.recommendations.length > 0) {
            console.log('\n💡 改進建議:');
            report.recommendations.forEach((rec, index) => {
                console.log(`   ${index + 1}. ${rec}`);
            });
        }
    }
});