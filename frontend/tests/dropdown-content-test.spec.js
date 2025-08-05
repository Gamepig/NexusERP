import { test, expect } from '@playwright/test';

test('檢查下拉選單內容', async ({ page }) => {
  // 登入
  await page.goto('http://127.0.0.1:8000/login');
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');

  console.log('=== 下拉選單內容檢查 ===');

  // 等待頁面完全載入
  await page.waitForTimeout(2000);

  // 檢查頁面 HTML 中是否包含下拉選單內容
  const pageContent = await page.content();
  
  console.log('檢查頁面是否包含多層級導航相關的內容...');
  
  // 檢查是否有 NavigationService 的輸出
  if (pageContent.includes('multiLevelNav')) {
    console.log('✓ 找到 multiLevelNav 相關代碼');
  }
  
  if (pageContent.includes('Alpine')) {
    console.log('✓ 頁面包含 Alpine.js 相關內容');
  }

  // 檢查導航資料結構
  const navDataRegex = /x-data="multiLevelNav\(\[(.*?)\]"/s;
  const match = pageContent.match(navDataRegex);
  
  if (match) {
    console.log('✓ 找到導航資料結構');
    console.log('導航資料內容片段:', match[1].substring(0, 200) + '...');
  } else {
    console.log('❌ 未找到 multiLevelNav 資料結構');
  }

  // 檢查 NavigationService 輸出的項目
  const navigationItems = [
    '儀表板', '客戶關係管理', '產品與庫存', '採購管理', 
    '銷售管理', '財務管理', '分析與報表', '系統設定'
  ];

  for (const item of navigationItems) {
    if (pageContent.includes(item)) {
      console.log(`✓ 找到導航項目: ${item}`);
    } else {
      console.log(`❌ 未找到導航項目: ${item}`);
    }
  }

  // 檢查是否有子選單項目
  const submenuItems = [
    '客戶列表', '聯絡人管理', '產品列表', '庫存查詢', 
    '採購訂單', '供應商管理', '銷售訂單', '報價單'
  ];

  let foundSubmenuItems = 0;
  for (const item of submenuItems) {
    if (pageContent.includes(item)) {
      console.log(`✓ 找到子選單項目: ${item}`);
      foundSubmenuItems++;
    }
  }
  
  console.log(`✓ 總共找到 ${foundSubmenuItems} 個子選單項目`);

  // 檢查 Alpine.js 是否正確載入
  const alpineLoaded = await page.evaluate(() => {
    return typeof window.Alpine !== 'undefined';
  });
  
  console.log(`✓ Alpine.js 載入狀態: ${alpineLoaded ? '已載入' : '未載入'}`);

  // 檢查導航組件是否初始化
  const navInitialized = await page.evaluate(() => {
    return document.querySelector('[x-data*="multiLevelNav"]') !== null;
  });
  
  console.log(`✓ 多層級導航組件初始化: ${navInitialized ? '已初始化' : '未初始化'}`);

  // 最終截圖並標記分析結果
  await page.screenshot({ 
    path: 'tests/screenshots/content-analysis-final.png',
    fullPage: true 
  });
  console.log('✓ 內容分析最終截圖');
});