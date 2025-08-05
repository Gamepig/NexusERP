import { chromium } from 'playwright';

async function testNexusERPReports() {
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
        console.log('🔍 開始測試 NexusERP 報表頁面...');
        
        // 1. 導航到登入頁面
        console.log('📍 Step 1: 導航到登入頁面');
        await page.goto('http://127.0.0.1:8000/login');
        await page.waitForLoadState('networkidle');
        console.log('✅ 登入頁面載入完成');

        // 2. 登入測試帳號
        console.log('📍 Step 2: 輸入測試帳號登入');
        await page.fill('input[name="email"]', 'test@example.com');
        await page.fill('input[name="password"]', 'password123');
        await page.click('button[type="submit"]');
        
        // 等待登入完成
        await page.waitForTimeout(3000);
        const currentUrl = page.url();
        console.log(`✅ 登入完成，目前 URL: ${currentUrl}`);

        // 3. 測試銷售報表總覽頁面
        console.log('📍 Step 3: 測試銷售報表總覽頁面');
        await page.goto('http://127.0.0.1:8000/reports/sales');
        await page.waitForLoadState('networkidle');
        
        // 檢查是否有錯誤訊息
        const errorElements = await page.locator('.alert-danger, .error, [class*="error"]').count();
        if (errorElements > 0) {
            const errorText = await page.locator('.alert-danger, .error, [class*="error"]').first().textContent();
            console.log(`❌ 銷售報表總覽頁面有錯誤: ${errorText}`);
        } else {
            console.log('✅ 銷售報表總覽頁面載入成功，無錯誤訊息');
        }

        // 檢查頁面標題
        const title1 = await page.title();
        console.log(`📄 銷售報表總覽頁面標題: ${title1}`);

        // 檢查是否有數據表格或圖表
        const hasTable = await page.locator('table, .table, .chart, .graph').count() > 0;
        const hasData = await page.locator('tbody tr, .data-row, .chart-container').count() > 0;
        
        console.log(`📊 是否有表格/圖表元素: ${hasTable}`);
        console.log(`📈 是否有數據顯示: ${hasData}`);

        // 截圖保存
        await page.screenshot({ path: 'sales_report_overview.png', fullPage: true });
        console.log('📸 銷售報表總覽頁面截圖已保存');

        // 4. 測試產品銷售分析頁面
        console.log('📍 Step 4: 測試產品銷售分析頁面');
        await page.goto('http://127.0.0.1:8000/reports/sales/by-product');
        await page.waitForLoadState('networkidle');
        
        // 檢查是否有錯誤訊息
        const errorElements2 = await page.locator('.alert-danger, .error, [class*="error"]').count();
        if (errorElements2 > 0) {
            const errorText2 = await page.locator('.alert-danger, .error, [class*="error"]').first().textContent();
            console.log(`❌ 產品銷售分析頁面有錯誤: ${errorText2}`);
        } else {
            console.log('✅ 產品銷售分析頁面載入成功，無錯誤訊息');
        }

        // 檢查頁面標題
        const title2 = await page.title();
        console.log(`📄 產品銷售分析頁面標題: ${title2}`);

        // 檢查是否有數據表格或圖表
        const hasTable2 = await page.locator('table, .table, .chart, .graph').count() > 0;
        const hasData2 = await page.locator('tbody tr, .data-row, .chart-container').count() > 0;
        
        console.log(`📊 是否有表格/圖表元素: ${hasTable2}`);
        console.log(`📈 是否有數據顯示: ${hasData2}`);

        // 截圖保存
        await page.screenshot({ path: 'sales_report_by_product.png', fullPage: true });
        console.log('📸 產品銷售分析頁面截圖已保存');

        // 5. 檢查網路請求錯誤
        console.log('📍 Step 5: 檢查網路請求');
        page.on('response', response => {
            if (!response.ok()) {
                console.log(`❌ 網路請求失敗: ${response.url()} - ${response.status()}`);
            }
        });

        console.log('🎉 測試完成！');

    } catch (error) {
        console.error('❌ 測試過程中發生錯誤:', error);
        await page.screenshot({ path: 'error_screenshot.png', fullPage: true });
    } finally {
        await browser.close();
    }
}

testNexusERPReports();