import { test, expect } from '@playwright/test';

test.describe('銷售報表深度診斷測試', () => {
    let page;

    test.beforeAll(async ({ browser }) => {
        page = await browser.newPage();
        
        // 監聽控制台錯誤
        page.on('console', msg => {
            if (msg.type() === 'error') {
                console.log('🔴 Console Error:', msg.text());
            } else if (msg.type() === 'warn') {
                console.log('🟡 Console Warning:', msg.text());
            } else if (msg.type() === 'log') {
                console.log('📝 Console Log:', msg.text());
            }
        });

        // 監聽頁面錯誤
        page.on('pageerror', error => {
            console.log('🚨 Page Error:', error.message);
        });

        // 監聽請求失敗
        page.on('requestfailed', request => {
            console.log('❌ Request Failed:', request.url(), request.failure().errorText);
        });

        // 監聽響應
        page.on('response', response => {
            if (response.url().includes('/api/') && !response.ok()) {
                console.log('🔴 API Error Response:', response.url(), response.status(), response.statusText());
            }
        });
    });

    test('步驟 1: 系統登入驗證', async () => {
        console.log('🔑 開始登入測試...');
        
        // 訪問登入頁面
        await page.goto('http://127.0.0.1:8000/login');
        await page.waitForLoadState('networkidle');
        
        // 填寫登入資訊
        await page.fill('input[name="email"]', 'test@example.com');
        await page.fill('input[name="password"]', 'password123');
        
        // 提交登入
        await page.click('button[type="submit"]');
        await page.waitForLoadState('networkidle');
        
        // 驗證登入成功
        await expect(page).toHaveURL(/dashboard/);
        console.log('✅ 登入成功');
    });

    test('步驟 2: 訪問銷售報表頁面', async () => {
        console.log('📊 訪問銷售報表頁面...');
        
        // 直接訪問銷售報表頁面
        await page.goto('http://127.0.0.1:8000/reports/sales');
        await page.waitForLoadState('networkidle');
        
        // 檢查頁面標題和基本結構
        const title = await page.title();
        console.log('📄 頁面標題:', title);
        
        // 檢查頁面是否載入完成
        const bodyText = await page.textContent('body');
        console.log('📝 頁面包含內容:', bodyText.substring(0, 200) + '...');
        
        // 檢查是否有錯誤訊息
        const errorElements = await page.locator('.alert-danger, .error, [class*="error"]').all();
        if (errorElements.length > 0) {
            for (const error of errorElements) {
                const errorText = await error.textContent();
                console.log('🚨 頁面錯誤訊息:', errorText);
            }
        }
    });

    test('步驟 3: 檢查載入狀態和 API 請求', async () => {
        console.log('🔄 檢查載入狀態...');
        
        // 等待頁面穩定
        await page.waitForTimeout(2000);
        
        // 檢查載入指示器
        const loadingElements = await page.locator('.loading, [class*="loading"], .spinner, [class*="spinner"]').all();
        console.log('🔄 載入元素數量:', loadingElements.length);
        
        for (const loading of loadingElements) {
            const isVisible = await loading.isVisible();
            const text = await loading.textContent();
            console.log('🔄 載入元素:', { visible: isVisible, text: text });
        }
        
        // 等待 API 請求完成
        console.log('🌐 等待 API 請求...');
        
        // 手動觸發 API 請求並監聽響應
        const apiResponse = await page.waitForResponse(
            response => response.url().includes('/api/reports/sales') && response.status() !== 404,
            { timeout: 10000 }
        ).catch(() => null);
        
        if (apiResponse) {
            console.log('🌐 API 響應狀態:', apiResponse.status());
            console.log('🌐 API 響應 URL:', apiResponse.url());
            
            const responseText = await apiResponse.text();
            console.log('🌐 API 響應內容 (前 500 字):', responseText.substring(0, 500));
            
            try {
                const responseJson = JSON.parse(responseText);
                console.log('📊 API 響應 JSON 結構:', Object.keys(responseJson));
                console.log('📊 API 響應詳情:', JSON.stringify(responseJson, null, 2));
            } catch (e) {
                console.log('❌ API 響應不是有效的 JSON:', e.message);
            }
        } else {
            console.log('❌ 沒有收到 API 響應');
        }
    });

    test('步驟 4: 檢查圖表元素和 Canvas', async () => {
        console.log('📈 檢查圖表元素...');
        
        // 等待頁面穩定
        await page.waitForTimeout(3000);
        
        // 檢查 Canvas 元素
        const canvasElements = await page.locator('canvas').all();
        console.log('🎨 Canvas 元素數量:', canvasElements.length);
        
        for (let i = 0; i < canvasElements.length; i++) {
            const canvas = canvasElements[i];
            const isVisible = await canvas.isVisible();
            const boundingBox = await canvas.boundingBox();
            
            console.log(`🎨 Canvas ${i + 1}:`, {
                visible: isVisible,
                width: boundingBox?.width,
                height: boundingBox?.height
            });
        }
        
        // 檢查 Chart.js 相關元素
        const chartElements = await page.locator('[class*="chart"], [id*="chart"]').all();
        console.log('📊 圖表容器數量:', chartElements.length);
        
        for (let i = 0; i < chartElements.length; i++) {
            const chart = chartElements[i];
            const isVisible = await chart.isVisible();
            const className = await chart.getAttribute('class');
            const id = await chart.getAttribute('id');
            
            console.log(`📊 圖表容器 ${i + 1}:`, {
                visible: isVisible,
                class: className,
                id: id
            });
        }
    });

    test('步驟 5: JavaScript 錯誤檢測', async () => {
        console.log('🔍 執行 JavaScript 錯誤檢測...');
        
        // 檢查 Chart.js 是否載入
        const chartJsLoaded = await page.evaluate(() => {
            return typeof window.Chart !== 'undefined';
        });
        console.log('📊 Chart.js 是否載入:', chartJsLoaded);
        
        // 檢查 jQuery 是否載入
        const jqueryLoaded = await page.evaluate(() => {
            return typeof window.$ !== 'undefined';
        });
        console.log('💲 jQuery 是否載入:', jqueryLoaded);
        
        // 檢查全局錯誤
        const globalErrors = await page.evaluate(() => {
            return window.errors || [];
        });
        console.log('🌍 全局錯誤:', globalErrors);
        
        // 檢查頁面特定的圖表初始化
        const chartInitialization = await page.evaluate(() => {
            const results = [];
            
            // 檢查所有 canvas 元素
            const canvases = document.querySelectorAll('canvas');
            canvases.forEach((canvas, index) => {
                results.push({
                    index: index,
                    id: canvas.id,
                    width: canvas.width,
                    height: canvas.height,
                    hasChart: !!canvas.chart
                });
            });
            
            return results;
        });
        console.log('🎨 Canvas 詳細資訊:', chartInitialization);
    });

    test('步驟 6: 元素互動測試', async () => {
        console.log('🖱️ 測試頁面元素互動...');
        
        // 等待頁面穩定
        await page.waitForTimeout(2000);
        
        // 檢查是否有按鈕或互動元素
        const buttons = await page.locator('button, .btn, [role="button"]').all();
        console.log('🔘 按鈕數量:', buttons.length);
        
        for (let i = 0; i < Math.min(buttons.length, 5); i++) {
            const button = buttons[i];
            const text = await button.textContent();
            const isVisible = await button.isVisible();
            const isEnabled = await button.isEnabled();
            
            console.log(`🔘 按鈕 ${i + 1}:`, {
                text: text?.trim(),
                visible: isVisible,
                enabled: isEnabled
            });
        }
        
        // 檢查表單元素
        const formElements = await page.locator('input, select, textarea').all();
        console.log('📝 表單元素數量:', formElements.length);
        
        // 檢查連結
        const links = await page.locator('a[href]').all();
        console.log('🔗 連結數量:', links.length);
    });

    test('步驟 7: 網路請求分析', async () => {
        console.log('🌐 分析網路請求...');
        
        // 重新載入頁面以捕獲所有請求
        const responses = [];
        
        page.on('response', (response) => {
            responses.push({
                url: response.url(),
                status: response.status(),
                contentType: response.headers()['content-type']
            });
        });
        
        await page.reload();
        await page.waitForLoadState('networkidle');
        
        // 分析收集到的響應
        console.log('📡 總請求數:', responses.length);
        
        const apiRequests = responses.filter(r => r.url.includes('/api/'));
        const jsRequests = responses.filter(r => r.url.includes('.js'));
        const cssRequests = responses.filter(r => r.url.includes('.css'));
        const failedRequests = responses.filter(r => r.status >= 400);
        
        console.log('🔧 API 請求:', apiRequests.length);
        console.log('📜 JavaScript 請求:', jsRequests.length);
        console.log('🎨 CSS 請求:', cssRequests.length);
        console.log('❌ 失敗的請求:', failedRequests.length);
        
        if (failedRequests.length > 0) {
            console.log('❌ 失敗的請求詳情:');
            failedRequests.forEach(req => {
                console.log(`   - ${req.url} (${req.status})`);
            });
        }
        
        if (apiRequests.length > 0) {
            console.log('🔧 API 請求詳情:');
            apiRequests.forEach(req => {
                console.log(`   - ${req.url} (${req.status})`);
            });
        }
    });

    test('步驟 8: 最終診斷報告', async () => {
        console.log('📋 生成最終診斷報告...');
        
        // 截圖當前狀態
        await page.screenshot({ 
            path: '/Users/gamepig/projects/NexusERP/frontend/screenshots/sales-reports-final-diagnostic.png',
            fullPage: true 
        });
        
        // 獲取頁面 HTML 結構
        const pageHTML = await page.content();
        const htmlLength = pageHTML.length;
        
        // 檢查頁面最終狀態
        const finalState = await page.evaluate(() => {
            return {
                readyState: document.readyState,
                hasCharts: document.querySelectorAll('canvas').length,
                hasErrors: document.querySelectorAll('.alert-danger, .error').length,
                bodyClasses: document.body.className,
                scriptTags: document.querySelectorAll('script').length
            };
        });
        
        console.log('📊 最終診斷結果:', {
            htmlLength: htmlLength,
            ...finalState
        });
        
        // 創建詳細報告
        const diagnosticReport = {
            timestamp: new Date().toISOString(),
            pageUrl: page.url(),
            finalState: finalState,
            summary: {
                canvasElements: finalState.hasCharts,
                errorElements: finalState.hasErrors,
                pageReady: finalState.readyState === 'complete'
            }
        };
        
        console.log('📋 完整診斷報告:', JSON.stringify(diagnosticReport, null, 2));
    });

    test.afterAll(async () => {
        if (page) {
            await page.close();
        }
    });
});