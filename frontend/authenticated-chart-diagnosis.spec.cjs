const { test, expect } = require('@playwright/test');

// 認證成功後的圖表診斷測試
test.describe('認證成功後的圖表診斷', () => {
    
    test('完整登入流程並診斷圖表問題', async ({ page }) => {
        
        // 開啟控制台監聽
        page.on('console', msg => {
            if (msg.type() === 'error') {
                console.log(`❌ Console Error: ${msg.text()}`);
            }
        });

        page.on('pageerror', err => {
            console.log(`❌ Page Error: ${err.message}`);
        });

        try {
            console.log('🔍 Step 1: 訪問主頁並登入...');
            
            // 1. 訪問主頁
            await page.goto('http://127.0.0.1:8000', { waitUntil: 'networkidle' });
            await page.screenshot({ path: 'screenshots/auth-01-homepage.png', fullPage: true });
            
            // 2. 點擊登入按鈕（檢查是否為landing page）
            const loginButton = await page.locator('text=登入').first();
            if (await loginButton.count() > 0) {
                console.log('✅ 找到登入按鈕，點擊進入登入頁面');
                await loginButton.click();
                await page.waitForTimeout(2000);
            } else {
                // 或者嘗試直接前往登入頁面
                console.log('🔄 直接前往登入頁面');
                await page.goto('http://127.0.0.1:8000/login', { waitUntil: 'networkidle' });
            }
            
            await page.screenshot({ path: 'screenshots/auth-02-login-page.png', fullPage: true });
            
            // 3. 填寫登入表單
            const emailInput = await page.locator('input[name="email"]');
            const passwordInput = await page.locator('input[name="password"]');
            
            if (await emailInput.count() > 0 && await passwordInput.count() > 0) {
                console.log('✅ 找到登入表單，正在填寫...');
                
                await emailInput.fill('test@example.com');
                await passwordInput.fill('password123');
                
                // 點擊提交按鈕
                const submitButton = await page.locator('button[type="submit"]').first();
                await submitButton.click();
                
                // 等待登入完成
                await page.waitForTimeout(3000);
                await page.screenshot({ path: 'screenshots/auth-03-after-login.png', fullPage: true });
                
                // 檢查是否成功登入
                const currentUrl = page.url();
                console.log(`當前URL: ${currentUrl}`);
                
                if (currentUrl.includes('dashboard') || currentUrl.includes('reports')) {
                    console.log('✅ 登入成功');
                } else {
                    console.log('⚠️ 登入可能未成功，繼續測試...');
                }
            } else {
                console.log('❌ 未找到登入表單');
                return;
            }
            
            console.log('\n🔍 Step 2: 開始測試報表頁面...');
            
            // 測試頁面列表
            const testPages = [
                { url: '/reports/financial', name: '財務報表', expectedCanvas: true },
                { url: '/reports/inventory/turnover', name: '庫存週轉率', expectedCanvas: false },
                { url: '/reports/inventory/aging', name: '庫存老化', expectedCanvas: false },
                { url: '/reports/inventory/movements', name: '庫存異動', expectedCanvas: false },
                { url: '/reports/purchase', name: '採購報表', expectedCanvas: false },
                { url: '/reports/purchase/by-supplier', name: '供應商分析', expectedCanvas: false },
                { url: '/reports/employees/attendance', name: '員工出勤', expectedCanvas: false },
                { url: '/reports/employees/performance', name: '員工績效', expectedCanvas: false }
            ];
            
            const results = [];
            
            for (const pageInfo of testPages) {
                console.log(`\n🔍 測試 ${pageInfo.name} (${pageInfo.url})`);
                
                await page.goto(`http://127.0.0.1:8000${pageInfo.url}`, { waitUntil: 'networkidle' });
                
                // 等待頁面完全載入
                await page.waitForTimeout(2000);
                
                // 截圖
                const fileName = `auth-04-${pageInfo.name.replace(/\s+/g, '-')}.png`;
                await page.screenshot({ path: `screenshots/${fileName}`, fullPage: true });
                
                // 檢查是否被重定向到登入頁面
                const currentUrl = page.url();
                const isLoginPage = currentUrl.includes('login') || 
                                   await page.locator('text=登入').count() > 0 ||
                                   await page.locator('input[name="email"]').count() > 0;
                
                if (isLoginPage) {
                    console.log(`❌ ${pageInfo.name} 被重定向到登入頁面`);
                    results.push({
                        name: pageInfo.name,
                        url: pageInfo.url,
                        status: '需要登入',
                        canvases: 0,
                        loadingTexts: 0,
                        chartJs: false
                    });
                    continue;
                }
                
                // 檢查頁面元素
                const canvases = await page.locator('canvas').count();
                const loadingTexts = await page.locator('text=圖表載入中...').count();
                const chartJsLoaded = await page.evaluate(() => typeof Chart !== 'undefined');
                
                // 檢查特定Canvas ID（針對財務報表）
                let specificCanvases = 0;
                if (pageInfo.url.includes('financial')) {
                    const arAging = await page.locator('#ar-aging-chart').count();
                    const cashFlow = await page.locator('#cash-flow-chart').count();
                    const comparison = await page.locator('#ar-ap-comparison-chart').count();
                    specificCanvases = arAging + cashFlow + comparison;
                }
                
                const status = canvases > 0 ? '✅ 有Canvas實現' : '❌ 僅佔位符';
                
                console.log(`   Canvas元素: ${canvases} 個`);
                console.log(`   載入占位符: ${loadingTexts} 個`);
                console.log(`   Chart.js: ${chartJsLoaded}`);
                console.log(`   狀態: ${status}`);
                
                if (pageInfo.url.includes('financial')) {
                    console.log(`   特定Canvas (財務): ${specificCanvases} 個`);
                }
                
                results.push({
                    name: pageInfo.name,
                    url: pageInfo.url,
                    status: status,
                    canvases: canvases,
                    loadingTexts: loadingTexts,
                    chartJs: chartJsLoaded,
                    specificCanvases: specificCanvases
                });
            }
            
            // 生成最終診斷報告
            console.log('\n=== 🔍 前端圖表渲染問題深度診斷報告 ===');
            console.log(`測試時間: ${new Date().toLocaleString()}`);
            console.log('');
            
            console.log('📊 各頁面圖表實現狀態:');
            results.forEach((result, index) => {
                const statusIcon = result.status.includes('✅') ? '✅' : '❌';
                console.log(`${index + 1}. ${statusIcon} ${result.name}`);
                console.log(`   URL: ${result.url}`);
                console.log(`   狀態: ${result.status}`);
                
                if (result.status !== '需要登入') {
                    console.log(`   Canvas元素: ${result.canvases} 個`);
                    console.log(`   載入占位符: ${result.loadingTexts} 個`);
                    console.log(`   Chart.js載入: ${result.chartJs}`);
                    
                    if (result.specificCanvases !== undefined) {
                        console.log(`   財務特定Canvas: ${result.specificCanvases} 個`);
                    }
                }
                console.log('');
            });
            
            // 統計分析
            const accessibleResults = results.filter(r => r.status !== '需要登入');
            const withCharts = accessibleResults.filter(r => r.status.includes('✅'));
            const withoutCharts = accessibleResults.filter(r => r.status.includes('❌'));
            const needsLogin = results.filter(r => r.status === '需要登入');
            
            console.log('📈 診斷統計:');
            console.log(`✅ 有圖表實現: ${withCharts.length} 個頁面`);
            console.log(`❌ 僅佔位符: ${withoutCharts.length} 個頁面`);
            console.log(`🔒 需要登入: ${needsLogin.length} 個頁面`);
            console.log('');
            
            if (withoutCharts.length > 0) {
                console.log('🚨 關鍵發現 - 需要修復的圖表問題:');
                withoutCharts.forEach(page => {
                    console.log(`   - ${page.name}: 缺少Canvas元素和圖表初始化`);
                    console.log(`     問題描述: 只有"圖表載入中..."佔位符，無實際圖表渲染`);
                });
                console.log('');
            }
            
            if (withCharts.length > 0) {
                console.log('✅ 正常運作的圖表頁面:');
                withCharts.forEach(page => {
                    console.log(`   - ${page.name}: 有 ${page.canvases} 個Canvas元素`);
                });
                console.log('');
            }
            
            // 修復建議
            console.log('🔧 修復建議:');
            console.log('1. 為沒有Canvas的頁面添加對應的<canvas>元素');
            console.log('2. 在reports-style.blade.php中添加對應的圖表初始化JavaScript');
            console.log('3. 確保每個圖表都有唯一的ID和對應的初始化函數');
            console.log('4. 參考財務報表頁面的實現模式進行統一改造');
            
        } catch (error) {
            console.error('❌ 測試執行錯誤:', error.message);
            await page.screenshot({ path: 'screenshots/auth-error-state.png', fullPage: true });
        }
    });
});