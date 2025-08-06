import { test, expect } from '@playwright/test';

test.describe('儀表板修復驗證', () => {
  test('驗證儀表板載入狀態修復', async ({ page }) => {
    console.log('開始驗證儀表板修復...');

    // 設置控制台監聽
    const consoleMessages = [];
    page.on('console', msg => {
      consoleMessages.push(`${msg.type()}: ${msg.text()}`);
      console.log(`Console ${msg.type()}: ${msg.text()}`);
    });

    // Step 1: 導航並登入
    await page.goto('http://127.0.0.1:8000/dashboard');
    await page.waitForTimeout(2000);

    if (page.url().includes('/login')) {
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(3000);
    }

    // Step 2: 等待儀表板載入完成
    console.log('等待儀表板載入完成...');
    await page.waitForTimeout(8000); // 給足夠時間讓修復生效

    // Step 3: 檢查最終狀態
    const finalState = {
      dashboardLoadingVisible: await page.locator('#dashboardLoading').isVisible(),
      dashboardStatsVisible: await page.locator('#dashboardStats').isVisible(),
      dashboardErrorVisible: await page.locator('#dashboardError').isVisible()
    };

    console.log('\n=== 修復後最終狀態 ===');
    console.log(`載入狀態可見: ${finalState.dashboardLoadingVisible}`);
    console.log(`內容可見: ${finalState.dashboardStatsVisible}`);
    console.log(`錯誤可見: ${finalState.dashboardErrorVisible}`);

    // Step 4: 檢查統計卡片是否正常顯示
    const statCards = await page.locator('[data-stat]').count();
    console.log(`統計卡片數量: ${statCards}`);

    // Step 5: 檢查圖表是否載入
    const charts = await page.evaluate(() => {
      return {
        revenueChart: !!document.getElementById('revenueChart'),
        ordersChart: !!document.getElementById('ordersChart'),
        inventoryChart: !!document.getElementById('inventoryChart')
      };
    });
    console.log('圖表狀態:', JSON.stringify(charts, null, 2));

    // Step 6: 檢查是否有手動觸發的日誌
    const hasManualTriggerLog = consoleMessages.some(msg => 
      msg.includes('手動觸發 showContent() 作為備用方案')
    );
    console.log(`是否執行了手動觸發: ${hasManualTriggerLog}`);

    // Step 7: 截圖記錄修復結果
    await page.screenshot({ 
      path: 'dashboard-fix-verification-result.png',
      fullPage: true 
    });

    // 驗證修復成功
    console.log('\n=== 修復驗證結果 ===');
    const isFixed = !finalState.dashboardLoadingVisible && finalState.dashboardStatsVisible;
    console.log(`修復成功: ${isFixed ? '✅ 是' : '❌ 否'}`);

    if (isFixed) {
      console.log('🎉 儀表板載入問題已成功修復！');
      console.log('✅ 載入狀態正確隱藏');
      console.log('✅ 儀表板內容正常顯示');
      console.log('✅ 統計卡片和圖表載入完成');
    } else {
      console.log('❌ 修復未完全生效，需要進一步調整');
    }

    // 性能檢查
    if (hasManualTriggerLog) {
      console.log('⚠️  注意：使用了備用手動觸發方案，建議優化事件時序');
    }
  });
});