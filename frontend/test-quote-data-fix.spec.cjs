/**
 * 測試報價資料顯示修復
 */

const { test, expect } = require('@playwright/test');

test('報價資料顯示修復測試', async ({ page }) => {
  console.log('🔧 測試報價資料顯示修復');
  
  // 設定視窗大小
  await page.setViewportSize({ width: 1920, height: 1080 });
  
  // 登入
  await page.goto('http://127.0.0.1:8000/login');
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);
  
  // 訪問報價頁面
  await page.goto('http://127.0.0.1:8000/quotes');
  await page.waitForTimeout(3000);
  
  // 檢查頁面內容
  const pageContent = await page.textContent('body');
  console.log('頁面載入狀態：', page.url());
  
  // 檢查是否有報價資料
  if (pageContent.includes('目前沒有報價單')) {
    console.log('❌ 仍然顯示"目前沒有報價單"');
  } else if (pageContent.includes('QT2025000005') || pageContent.includes('共 1 筆報價單')) {
    console.log('✅ 成功顯示報價資料！');
  } else {
    console.log('⚠️ 狀態未明，需要進一步檢查');
  }
  
  // 檢查表格行數
  const tableRows = await page.locator('tbody tr').count();
  console.log(`表格資料行數: ${tableRows}`);
  
  if (tableRows > 1) { // 有資料行（不只是空狀態行）
    const firstRowContent = await page.locator('tbody tr').first().textContent();
    console.log('第一行內容:', firstRowContent);
  }
  
  // 截圖保存
  await page.screenshot({ 
    path: 'test-results/quote-list-after-fix.png',
    fullPage: true 
  });
  
  console.log('🏁 測試完成');
});