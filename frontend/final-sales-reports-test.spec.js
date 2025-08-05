import { test, expect } from '@playwright/test';

test.describe('修復後的銷售報表測試', () => {
    
    test('測試銷售報表是否正常載入', async ({ page }) => {
        console.log('🔍 測試修復後的銷售報表...');

        // 監聽錯誤
        const errors = [];
        page.on('pageerror', error => {
            errors.push(error.message);
            console.log('🚨 Page Error:', error.message);
        });

        page.on('console', msg => {
            if (msg.type() === 'error') {
                console.log('🔴 Console Error:', msg.text());
            }
        });

        // 登入
        await page.goto('http://127.0.0.1:8000/login');
        await page.fill('input[name="email"]', 'test@example.com');
        await page.fill('input[name="password"]', 'password123');
        await page.click('button[type="submit"]');
        await page.waitForURL(/dashboard/);

        // 訪問銷售報表頁面
        console.log('📊 訪問銷售報表頁面...');
        await page.goto('http://127.0.0.1:8000/reports/sales');
        
        // 等待頁面載入
        await page.waitForTimeout(3000);

        // 檢查頁面是否正常載入
        const bodyText = await page.textContent('body');
        console.log('📝 頁面內容長度:', bodyText.length);
        console.log('📝 頁面包含銷售報表:', bodyText.includes('銷售報表'));

        // 檢查是否有載入狀態
        const loadingVisible = await page.locator('#loading').isVisible();
        console.log('🔄 載入狀態是否可見:', loadingVisible);

        // 檢查報表內容是否顯示
        const reportContentVisible = await page.locator('#report-content').isVisible();
        console.log('📊 報表內容是否可見:', reportContentVisible);

        // 檢查是否有錯誤訊息
        const errorVisible = await page.locator('#error').isVisible();
        console.log('❌ 錯誤訊息是否可見:', errorVisible);

        // 檢查 Chart.js 是否載入
        const chartJsLoaded = await page.evaluate(() => {
            return typeof window.Chart !== 'undefined';
        });
        console.log('📊 Chart.js 是否載入:', chartJsLoaded);

        // 檢查 Canvas 元素
        const canvasCount = await page.locator('canvas').count();
        console.log('🎨 Canvas 元素數量:', canvasCount);

        // 檢查是否有 JavaScript 錯誤
        console.log('📋 JavaScript 錯誤數量:', errors.length);
        if (errors.length > 0) {
            console.log('🚨 錯誤列表:', errors);
        }

        // 檢查頁面標題
        const pageTitle = await page.locator('h1').textContent();
        console.log('📄 頁面標題:', pageTitle);

        // 截圖
        await page.screenshot({ 
            path: '/Users/gamepig/projects/NexusERP/frontend/screenshots/fixed-sales-reports.png',
            fullPage: true 
        });

        // 驗證關鍵元素
        await expect(page.locator('h1')).toContainText('銷售報表');
        
        console.log('✅ 銷售報表測試完成');
    });
});