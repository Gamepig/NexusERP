import { test, expect } from '@playwright/test';

test('客戶管理頁面快速驗證', async ({ page }) => {
  console.log('🎯 開始快速驗證測試...');
  
  // 設定短超時時間
  test.setTimeout(60000);

  try {
    // 1. 登入
    await page.goto('http://127.0.0.1:8000/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 20000 });

    // 2. 前往客戶頁面
    await page.goto('http://127.0.0.1:8000/customers');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // 3. 檢查關鍵元素
    const hasNoDataMessage = await page.locator('text=尚無客戶資料').count();
    const hasTable = await page.locator('table').count();
    const customerRows = await page.locator('table tbody tr').count();
    const totalCustomersText = await page.locator('text=共 17 位客戶').count();
    
    console.log(`❌ "尚無客戶資料"訊息: ${hasNoDataMessage}`);
    console.log(`📊 資料表數量: ${hasTable}`);
    console.log(`📋 客戶行數: ${customerRows}`);
    console.log(`🔢 "共 17 位客戶"顯示: ${totalCustomersText}`);

    // 4. 檢查第一個客戶的詳細資訊
    const firstCustomerName = await page.locator('table tbody tr:first-child').textContent();
    console.log(`👤 第一個客戶資訊: ${firstCustomerName}`);

    // 5. 驗證結果
    const isFixed = hasNoDataMessage === 0 && hasTable > 0 && customerRows >= 15;
    console.log(`✅ 修復狀態: ${isFixed ? '成功' : '失敗'}`);
    
    // 6. 最終截圖
    await page.screenshot({ 
      path: 'customer-verification-quick-final.png',
      fullPage: true 
    });

    // 斷言
    expect(hasNoDataMessage).toBe(0);
    expect(hasTable).toBeGreaterThan(0);
    expect(customerRows).toBeGreaterThanOrEqual(15);

    console.log('✅ 客戶管理頁面修復驗證成功！');

  } catch (error) {
    console.error('❌ 測試失敗:', error);
    await page.screenshot({ 
      path: 'customer-verification-quick-error.png',
      fullPage: true 
    });
    throw error;
  }
});