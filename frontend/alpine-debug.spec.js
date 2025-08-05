import { test, expect } from '@playwright/test';

test('Alpine.js載入和功能檢查', async ({ page }) => {
  console.log('🔧 詳細檢查Alpine.js載入狀況...');
  
  // 開啟頁面前先設定監聽器
  const consoleMessages = [];
  page.on('console', msg => {
    consoleMessages.push({
      type: msg.type(),
      text: msg.text()
    });
  });
  
  const errors = [];
  page.on('pageerror', error => {
    errors.push(error.message);
  });
  
  await page.goto('http://127.0.0.1:8000');
  await page.waitForLoadState('networkidle');
  
  // 檢查頁面HTML結構
  const title = await page.title();
  console.log(`頁面標題: ${title}`);
  
  // 檢查JavaScript檔案是否載入
  const scripts = await page.locator('script[src]').all();
  console.log(`找到 ${scripts.length} 個外部JavaScript檔案:`);
  
  for (const script of scripts) {
    const src = await script.getAttribute('src');
    console.log(`  - ${src}`);
  }
  
  // 等待更長時間確保所有資源載入
  await page.waitForTimeout(3000);
  
  // 再次檢查Alpine.js
  const alpineCheck = await page.evaluate(() => {
    console.log('檢查window物件:', Object.keys(window));
    console.log('Alpine物件:', window.Alpine);
    console.log('Alpine類型:', typeof window.Alpine);
    
    return {
      windowAlpine: typeof window.Alpine,
      alpineExists: !!window.Alpine,
      alpineStarted: window.Alpine && window.Alpine.version,
      windowKeys: Object.keys(window).filter(key => key.toLowerCase().includes('alpine'))
    };
  });
  
  console.log('Alpine.js檢查結果:', alpineCheck);
  
  // 檢查所有控制台訊息
  console.log(`\n控制台訊息 (${consoleMessages.length}條):`);
  consoleMessages.forEach((msg, i) => {
    console.log(`  ${i+1}. [${msg.type}] ${msg.text}`);
  });
  
  // 檢查錯誤
  if (errors.length > 0) {
    console.log(`\n發現 ${errors.length} 個錯誤:`);
    errors.forEach((error, i) => {
      console.log(`  ${i+1}. ${error}`);
    });
  }
  
  // 檢查Alpine.js相關的DOM元素
  const alpineElements = await page.evaluate(() => {
    const elements = document.querySelectorAll('[x-data]');
    const results = [];
    
    elements.forEach((el, i) => {
      results.push({
        index: i,
        tagName: el.tagName,
        xData: el.getAttribute('x-data'),
        innerHTML: el.innerHTML.substring(0, 100) + '...'
      });
    });
    
    return results;
  });
  
  console.log(`\n找到 ${alpineElements.length} 個[x-data]元素:`);
  alpineElements.forEach(el => {
    console.log(`  ${el.index + 1}. <${el.tagName}> x-data="${el.xData}"`);
  });
  
  // 人工觸發Alpine初始化
  await page.evaluate(() => {
    console.log('嘗試手動初始化Alpine...');
    if (window.Alpine && !window.Alpine.version) {
      window.Alpine.start();
      console.log('Alpine手動啟動完成');
    }
  });
  
  // 再等待一下
  await page.waitForTimeout(1000);
  
  // 最終檢查
  const finalCheck = await page.evaluate(() => {
    return {
      alpine: !!window.Alpine,
      version: window.Alpine && window.Alpine.version
    };
  });
  
  console.log('最終Alpine.js狀態:', finalCheck);
  
  // 截圖記錄
  await page.screenshot({ path: 'alpine-debug-test.png', fullPage: true });
  console.log('📸 Alpine.js除錯截圖已保存');
  
  // 驗證Alpine最終是否載入
  expect(finalCheck.alpine).toBe(true);
});