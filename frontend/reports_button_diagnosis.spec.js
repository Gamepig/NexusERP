import { test, expect } from '@playwright/test';

test.describe('報表中心按鈕點擊問題深入診斷', () => {
  test('詳細診斷銷售總覽按鈕點擊問題', async ({ page }) => {
    // 監聽所有控制台訊息
    const consoleMessages = [];
    page.on('console', msg => {
      consoleMessages.push({
        type: msg.type(),
        text: msg.text(),
        timestamp: new Date().toISOString()
      });
    });

    // 監聽所有網絡請求
    const networkRequests = [];
    page.on('request', request => {
      networkRequests.push({
        method: request.method(),
        url: request.url(),
        timestamp: new Date().toISOString()
      });
    });

    // 監聽所有響應
    const responses = [];
    page.on('response', response => {
      responses.push({
        status: response.status(),
        url: response.url(),
        timestamp: new Date().toISOString()
      });
    });

    // 1. 前往登入頁面
    console.log('步驟 1: 前往登入頁面');
    await page.goto('http://127.0.0.1:8000/login');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'screenshots/01-診斷-登入頁面.png' });

    // 2. 執行登入
    console.log('步驟 2: 執行登入');
    await page.fill('#email', 'test@example.com');
    await page.fill('#password', 'password123');
    await page.screenshot({ path: 'screenshots/02-診斷-登入表單.png' });
    
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'screenshots/03-診斷-登入完成.png' });

    // 3. 前往報表中心首頁
    console.log('步驟 3: 前往報表中心首頁');
    await page.goto('http://127.0.0.1:8000/reports');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'screenshots/04-診斷-報表中心首頁.png' });

    // 4. 檢查頁面元素
    console.log('步驟 4: 檢查頁面元素');
    const salesOverviewButton = await page.locator('a[href*="reports/sales"]').first();
    const buttonExists = await salesOverviewButton.count() > 0;
    console.log('銷售總覽按鈕是否存在:', buttonExists);

    if (buttonExists) {
      const buttonHref = await salesOverviewButton.getAttribute('href');
      console.log('按鈕 href 屬性:', buttonHref);
      
      const buttonText = await salesOverviewButton.textContent();
      console.log('按鈕文字內容:', buttonText);

      // 檢查按鈕是否可見和可點擊
      const isVisible = await salesOverviewButton.isVisible();
      const isEnabled = await salesOverviewButton.isEnabled();
      console.log('按鈕是否可見:', isVisible);
      console.log('按鈕是否可點擊:', isEnabled);
    }

    // 5. 點擊前的狀態檢查
    console.log('步驟 5: 點擊前的狀態檢查');
    const currentUrl = page.url();
    console.log('點擊前的 URL:', currentUrl);

    // 清空之前的網絡監聽記錄
    networkRequests.length = 0;
    responses.length = 0;
    consoleMessages.length = 0;

    // 6. 點擊銷售總覽按鈕
    console.log('步驟 6: 點擊銷售總覽按鈕');
    await page.screenshot({ path: 'screenshots/05-診斷-點擊前狀態.png' });

    // 使用 Promise.all 同時監聽導航和點擊
    const [response] = await Promise.all([
      page.waitForResponse(response => {
        console.log('監聽到響應:', response.url(), response.status());
        return response.url().includes('/reports/sales');
      }).catch(() => null), // 如果沒有匹配的響應就返回 null
      salesOverviewButton.click()
    ]);

    // 等待可能的頁面變化
    await page.waitForTimeout(2000);
    
    // 7. 點擊後的狀態檢查
    console.log('步驟 7: 點擊後的狀態檢查');
    const newUrl = page.url();
    console.log('點擊後的 URL:', newUrl);
    
    await page.screenshot({ path: 'screenshots/06-診斷-點擊後狀態.png' });

    // 8. 檢查是否有錯誤訊息
    console.log('步驟 8: 檢查是否有錯誤訊息');
    const errorElements = await page.locator('.error, .alert-danger, [class*="error"]').count();
    console.log('頁面錯誤元素數量:', errorElements);

    if (errorElements > 0) {
      const errorTexts = await page.locator('.error, .alert-danger, [class*="error"]').allTextContents();
      console.log('錯誤訊息:', errorTexts);
    }

    // 9. 檢查 JavaScript 錯誤
    console.log('步驟 9: JavaScript 控制台訊息');
    consoleMessages.forEach((msg, index) => {
      console.log(`控制台訊息 ${index + 1}: [${msg.type}] ${msg.text} (${msg.timestamp})`);
    });

    // 10. 檢查網絡請求
    console.log('步驟 10: 網絡請求記錄');
    networkRequests.forEach((req, index) => {
      console.log(`請求 ${index + 1}: ${req.method} ${req.url} (${req.timestamp})`);
    });

    // 11. 檢查網絡響應
    console.log('步驟 11: 網絡響應記錄');
    responses.forEach((res, index) => {
      console.log(`響應 ${index + 1}: ${res.status} ${res.url} (${res.timestamp})`);
    });

    // 12. 檢查頁面標題變化
    const pageTitle = await page.title();
    console.log('當前頁面標題:', pageTitle);

    // 13. 檢查當前頁面內容
    const bodyText = await page.locator('body').textContent();
    const hasSalesContent = bodyText.includes('銷售報表') || bodyText.includes('銷售總覽');
    console.log('頁面是否包含銷售相關內容:', hasSalesContent);

    // 14. 嘗試手動導航
    console.log('步驟 14: 嘗試手動導航到銷售報表頁面');
    await page.goto('http://127.0.0.1:8000/reports/sales');
    await page.waitForLoadState('networkidle');
    
    const manualNavigationUrl = page.url();
    console.log('手動導航後的 URL:', manualNavigationUrl);
    
    await page.screenshot({ path: 'screenshots/07-診斷-手動導航結果.png' });

    // 15. 檢查手動導航是否成功
    const manualNavigationTitle = await page.title();
    console.log('手動導航後的頁面標題:', manualNavigationTitle);

    // 16. 最終診斷總結
    console.log('\n=== 診斷總結 ===');
    console.log(`按鈕存在: ${buttonExists}`);
    console.log(`點擊前 URL: ${currentUrl}`);
    console.log(`點擊後 URL: ${newUrl}`);
    console.log(`URL 是否改變: ${currentUrl !== newUrl}`);
    console.log(`手動導航 URL: ${manualNavigationUrl}`);
    console.log(`手動導航是否成功: ${manualNavigationUrl.includes('/reports/sales')}`);
    console.log(`JavaScript 錯誤數量: ${consoleMessages.filter(m => m.type === 'error').length}`);
    console.log(`網絡請求數量: ${networkRequests.length}`);
    console.log(`網絡響應數量: ${responses.length}`);

    // 如果點擊沒有導航，但手動導航成功，則說明按鈕點擊事件有問題
    if (currentUrl === newUrl && manualNavigationUrl.includes('/reports/sales')) {
      console.log('\n🚨 問題診斷: 按鈕點擊事件未生效，但頁面存在且可訪問');
      console.log('可能原因:');
      console.log('1. JavaScript 攔截了點擊事件');
      console.log('2. CSS 樣式阻止了點擊');
      console.log('3. 事件監聽器衝突');
      console.log('4. 頁面載入時序問題');
    }
  });
});