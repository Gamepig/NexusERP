/**
 * 測試 CSS 修復後的美化效果驗證
 */

const { test, expect } = require('@playwright/test');

test('CSS 修復後美化效果驗證', async ({ page }) => {
  console.log('🛠️ 驗證 CSS 修復後的美化效果');
  
  // 設定較大視窗以完整展示效果
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
  
  console.log('頁面載入完成，開始驗證具體視覺效果...');
  
  // 檢查頁面背景漸層
  const hasMainGradient = await page.locator('.bg-gradient-to-br.from-slate-50').count() > 0;
  console.log(`🌈 主背景漸層: ${hasMainGradient ? '✅ 已套用' : '❌ 未套用'}`);
  
  // 檢查頭部設計
  const hasHeaderGradient = await page.locator('.bg-gradient-to-r.from-blue-500.via-indigo-500').count() > 0;
  console.log(`🎯 頭部漸層條: ${hasHeaderGradient ? '✅ 已套用' : '❌ 未套用'}`);
  
  // 檢查建立按鈕漸層
  const hasCreateBtnGradient = await page.locator('a[href*="create"].bg-gradient-to-r.from-blue-600').count() > 0;
  console.log(`🔵 建立按鈕漸層: ${hasCreateBtnGradient ? '✅ 已套用' : '❌ 未套用'}`);
  
  // 檢查搜尋區塊背景
  const hasSearchBgGradient = await page.locator('.bg-gradient-to-r.from-slate-50.to-gray-50').count() > 0;
  console.log(`🔍 搜尋區塊背景: ${hasSearchBgGradient ? '✅ 已套用' : '❌ 未套用'}`);
  
  // 檢查表格標題漸層背景
  const hasTableHeaderGradient = await page.locator('thead.bg-gradient-to-r.from-slate-100').count() > 0;
  console.log(`📊 表格標題漸層: ${hasTableHeaderGradient ? '✅ 已套用' : '❌ 未套用'}`);
  
  // 檢查操作按鈕
  const actionButtons = await page.locator('a.bg-gradient-to-r, button.bg-gradient-to-r').count();
  console.log(`🎨 漸層操作按鈕數量: ${actionButtons}`);
  
  // 檢查狀態標籤
  const statusBadges = await page.locator('.inline-flex[class*="bg-gradient-to-r"]').count();
  console.log(`🏷️ 漸層狀態標籤數量: ${statusBadges}`);
  
  // 檢查彩色圖標
  const coloredIcons = await page.locator('svg.text-blue-500, svg.text-green-500, svg.text-purple-500, svg.text-orange-500, svg.text-emerald-500, svg.text-indigo-500, svg.text-red-500').count();
  console.log(`🌈 彩色圖標數量: ${coloredIcons}`);
  
  // 截圖保存 - 完整頁面
  await page.screenshot({ 
    path: 'test-results/css-fix-beautification-full.png',
    fullPage: true 
  });
  
  // 截圖保存 - 僅頭部區域
  const headerSection = page.locator('.bg-white.dark\\:bg-gray-800.rounded-2xl.shadow-lg').first();
  if (await headerSection.count() > 0) {
    await headerSection.screenshot({ 
      path: 'test-results/css-fix-header-detail.png'
    });
    console.log('📸 頭部區域詳細截圖已保存');
  }
  
  // 截圖保存 - 搜尋區域
  const searchSection = page.locator('.bg-white.dark\\:bg-gray-800.rounded-2xl').nth(1);
  if (await searchSection.count() > 0) {
    await searchSection.screenshot({ 
      path: 'test-results/css-fix-search-detail.png'
    });
    console.log('📸 搜尋區域詳細截圖已保存');
  }
  
  console.log('🎨 CSS 修復驗證完成');
  
  // 驗證基本元素存在
  await expect(page.locator('.bg-gradient-to-br')).toHaveCount(4); // 背景漸層
  await expect(page.locator('.bg-gradient-to-r')).toHaveCount(52); // 漸層按鈕（調整後數量）
});