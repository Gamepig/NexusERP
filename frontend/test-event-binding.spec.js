// 測試事件綁定
import { test, expect } from '@playwright/test';

test('🎯 測試導航事件綁定', async ({ page }) => {
  const screenshotDir = './screenshots';
  
  // 捕獲所有控制台訊息
  const consoleMessages = [];
  page.on('console', msg => {
    consoleMessages.push(msg.text());
    console.log('📱 控制台:', msg.text());
  });
  
  console.log('🎯 開始測試事件綁定...');
  
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
  
  console.log('✅ 頁面已載入');
  
  // 測試客戶關係管理按鈕的懸停事件
  console.log('🖱️ 測試客戶關係管理懸停事件...');
  
  const crmButton = await page.$('button:has-text("客戶關係管理")');
  if (crmButton) {
    console.log('✅ 找到 CRM 按鈕');
    
    // 懸停
    await crmButton.hover();
    await page.waitForTimeout(2000); // 等待事件處理和可能的動畫
    
    // 檢查是否有下拉選單顯示
    const dropdownVisible = await page.$$eval('.nexus-nav-dropdown', dropdowns => 
      dropdowns.filter(d => getComputedStyle(d).display === 'block').length
    );
    
    console.log(`📊 懸停後可見下拉選單數量: ${dropdownVisible}`);
    
    // 拍攝懸停狀態
    await page.screenshot({ 
      path: `${screenshotDir}/event-binding-hover-test.png`,
      fullPage: true 
    });
    
    // 點擊測試
    console.log('🖱️ 測試點擊事件...');
    await crmButton.click();
    await page.waitForTimeout(2000);
    
    const dropdownVisibleAfterClick = await page.$$eval('.nexus-nav-dropdown', dropdowns => 
      dropdowns.filter(d => getComputedStyle(d).display === 'block').length
    );
    
    console.log(`📊 點擊後可見下拉選單數量: ${dropdownVisibleAfterClick}`);
    
    // 拍攝點擊狀態
    await page.screenshot({ 
      path: `${screenshotDir}/event-binding-click-test.png`,
      fullPage: true 
    });
  } else {
    console.log('❌ 找不到 CRM 按鈕');
  }
  
  // 檢查控制台訊息
  console.log('\n📋 控制台訊息摘要:');
  const clickMessages = consoleMessages.filter(msg => msg.includes('Click:'));
  const mouseEnterMessages = consoleMessages.filter(msg => msg.includes('MouseEnter:'));
  const mouseLeaveMessages = consoleMessages.filter(msg => msg.includes('MouseLeave:'));
  
  console.log(`   - Click 事件: ${clickMessages.length} 個`);
  console.log(`   - MouseEnter 事件: ${mouseEnterMessages.length} 個`);
  console.log(`   - MouseLeave 事件: ${mouseLeaveMessages.length} 個`);
  
  if (clickMessages.length > 0) {
    console.log('   - Click 訊息:', clickMessages.slice(0, 3));
  }
  
  if (mouseEnterMessages.length > 0) {
    console.log('   - MouseEnter 訊息:', mouseEnterMessages.slice(0, 3));
  }
  
  // 測試其他按鈕
  const testButtons = ['產品與庫存', '採購管理'];
  
  for (const buttonText of testButtons) {
    console.log(`\n🖱️ 測試 ${buttonText}...`);
    
    const button = await page.$(`button:has-text("${buttonText}")`);
    if (button) {
      await button.hover();
      await page.waitForTimeout(1000);
      
      await button.click();
      await page.waitForTimeout(1000);
      
      // 移開滑鼠
      await page.mouse.move(50, 50);
      await page.waitForTimeout(500);
    }
  }
  
  console.log('\n✅ 事件綁定測試完成');
  
  // 最終總結
  const totalEvents = clickMessages.length + mouseEnterMessages.length + mouseLeaveMessages.length;
  
  if (totalEvents === 0) {
    console.log('❌ 嚴重問題：沒有任何事件被觸發');
    console.log('   可能原因：');
    console.log('   1. Alpine.js 事件綁定語法錯誤');
    console.log('   2. 按鈕元素沒有正確的事件監聽器');
    console.log('   3. Alpine.js 作用域問題');
  } else {
    console.log(`✅ 事件系統運作中：檢測到 ${totalEvents} 個事件`);
  }
});