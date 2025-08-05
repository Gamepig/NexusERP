// 使用點擊測試下拉選單
import { test, expect } from '@playwright/test';

test('🖱️ 點擊測試下拉選單顯示', async ({ page }) => {
  const screenshotDir = './screenshots';
  
  // 啟用控制台監聽
  page.on('console', msg => {
    if (msg.text().includes('🔄') || msg.text().includes('openDropdowns') || msg.text().includes('showDropdown')) {
      console.log('📱 Alpine.js:', msg.text());
    }
  });
  
  console.log('🖱️ 開始點擊測試...');
  
  // 登入
  await page.goto('http://127.0.0.1:8000/login');
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');
  await page.waitForLoadState('networkidle');
  
  // 等待導航載入
  await page.waitForSelector('.nexus-multi-nav', { timeout: 5000 });
  await page.waitForTimeout(1000);
  
  console.log('✅ 導航已載入');
  
  // 重新添加臨時調試 - 強制顯示下拉選單
  await page.addStyleTag({
    content: `
      .nexus-nav-dropdown {
        display: block !important;
        opacity: 1 !important;
        visibility: visible !important;
        background-color: #f8fafc !important;
        border: 2px solid #d1d5db !important;
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.25) !important;
        position: absolute !important;
        z-index: 9999 !important;
        top: 100% !important;
        left: 0 !important;
        width: 256px !important;
        min-height: 100px !important;
      }
      
      .nexus-nav-dropdown::before {
        content: "🐛 强制顯示下拉選單";
        display: block;
        color: #dc2626;
        font-weight: bold;
        padding: 0.5rem;
        background: #fef2f2;
        border-bottom: 1px solid #fca5a5;
      }
    `
  });
  
  console.log('🔧 已添加強制顯示樣式');
  
  // 拍攝強制顯示狀態
  await page.screenshot({ 
    path: `${screenshotDir}/click-test-01-forced-display.png`,
    fullPage: true 
  });
  
  console.log('📸 已拍攝強制顯示狀態');
  
  // 點擊測試每個導航項目
  const testItems = ['客戶關係管理', '產品與庫存', '採購管理', '銷售管理', '分析與報表'];
  
  for (const itemName of testItems) {
    console.log(`\n🖱️ 點擊測試 ${itemName}...`);
    
    const button = await page.$(`button:has-text("${itemName}")`);
    if (!button) {
      console.log(`❌ 找不到按鈕: ${itemName}`);
      continue;
    }
    
    // 點擊按鈕
    await button.click();
    await page.waitForTimeout(1000);
    
    // 檢查 Alpine.js 狀態
    const alpineState = await page.evaluate(() => {
      const navElement = document.querySelector('[x-data*="multiLevelNav"]');
      if (navElement && navElement._x_dataStack) {
        const data = navElement._x_dataStack[0];
        return {
          openDropdowns: data.openDropdowns || [],
          navigationItems: data.navigationItems?.length || 0
        };
      }
      return null;
    });
    
    console.log(`📊 Alpine.js 狀態:`, alpineState);
    
    // 拍攝點擊後狀態
    const filename = itemName.replace(/[^a-zA-Z0-9\u4e00-\u9fff]/g, '');
    await page.screenshot({ 
      path: `${screenshotDir}/click-test-${filename}-clicked.png`,
      fullPage: true 
    });
    
    console.log(`📸 已拍攝 ${itemName} 點擊狀態`);
    
    // 等待再點擊其他地方關閉
    await page.mouse.click(100, 300);
    await page.waitForTimeout(500);
  }
  
  // 最終檢查 - 手動觸發 Alpine.js 函數
  console.log('\n🔧 手動觸發 Alpine.js 函數測試...');
  
  const manualTrigger = await page.evaluate(() => {
    const navElement = document.querySelector('[x-data*="multiLevelNav"]');
    if (navElement && navElement._x_dataStack) {
      const context = navElement._x_dataStack[0];
      
      // 手動調用 showDropdown 函數
      if (typeof context.showDropdown === 'function') {
        context.showDropdown('crm');
        
        return {
          called: true,
          openDropdowns: context.openDropdowns || [],
          crmInOpen: (context.openDropdowns || []).includes('crm')
        };
      }
    }
    return { called: false };
  });
  
  console.log('🔧 手動觸發結果:', manualTrigger);
  
  if (manualTrigger.called) {
    await page.waitForTimeout(1000);
    
    await page.screenshot({ 
      path: `${screenshotDir}/click-test-manual-trigger.png`,
      fullPage: true 
    });
    
    console.log('📸 已拍攝手動觸發狀態');
  }
  
  console.log('\n✅ 點擊測試完成');
  console.log('\n📋 總結: 如果在強制顯示狀態下能看到下拉選單框，說明CSS沒問題，只是Alpine.js邏輯需要調整');
});