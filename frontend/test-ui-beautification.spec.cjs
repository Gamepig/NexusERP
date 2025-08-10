/**
 * 測試報價單管理頁面美化效果
 */

const { test, expect } = require('@playwright/test');

test('報價單管理頁面美化測試', async ({ page }) => {
  console.log('🎨 測試報價單管理頁面美化效果');
  
  // 設定較大的視窗以展示完整設計
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
  
  console.log('頁面載入完成，開始驗證美化效果...');
  
  // 檢查背景漸層
  const hasGradientBg = await page.locator('.bg-gradient-to-br').count();
  console.log(`✨ 背景漸層效果數量: ${hasGradientBg}`);
  
  // 檢查頭部區塊的增強設計
  const headerIcon = await page.locator('.bg-gradient-to-br.from-blue-500.to-indigo-600').count();
  console.log(`🎯 頭部圖標設計: ${headerIcon > 0 ? '已應用漸層效果' : '未應用'}`);
  
  // 檢查搜尋區塊的彩色圖標
  const searchIcons = await page.locator('svg.text-blue-500, svg.text-green-500, svg.text-purple-500, svg.text-pink-500').count();
  console.log(`🔍 搜尋區塊彩色圖標數量: ${searchIcons}`);
  
  // 檢查表格標題的彩色圖標
  const tableHeaderIcons = await page.locator('thead svg.text-blue-500, thead svg.text-green-500, thead svg.text-purple-500, thead svg.text-orange-500, thead svg.text-emerald-500, thead svg.text-indigo-500, thead svg.text-red-500').count();
  console.log(`📊 表格標題彩色圖標數量: ${tableHeaderIcons}`);
  
  // 檢查操作按鈕的漸層效果
  const gradientButtons = await page.locator('a[class*="bg-gradient-to-r"], button[class*="bg-gradient-to-r"]').count();
  console.log(`🎨 漸層按鈕數量: ${gradientButtons}`);
  
  // 檢查狀態標籤的新設計
  const statusBadges = await page.locator('.inline-flex.items-center[class*="bg-gradient-to-r"]').count();
  console.log(`🏷️ 美化狀態標籤數量: ${statusBadges}`);
  
  // 檢查是否有hover效果
  const hoverEffects = await page.locator('tr[class*="hover:bg-gradient-to-r"]').count();
  console.log(`✨ Hover 效果行數: ${hoverEffects}`);
  
  // 截圖保存美化後的效果
  await page.screenshot({ 
    path: 'test-results/quote-management-beautified.png',
    fullPage: true 
  });
  
  console.log('🖼️ 美化效果截圖已保存');
  console.log('🎉 美化測試完成');
});