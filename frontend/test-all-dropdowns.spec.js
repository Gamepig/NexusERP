// 測試所有導航項目的下拉選單
import { test, expect } from '@playwright/test';

test('測試所有導航項目的下拉選單觸發', async ({ page }) => {
  const screenshotDir = './screenshots';
  
  console.log('🚀 開始測試所有導航下拉選單...');
  
  // 登入
  await page.goto('http://127.0.0.1:8000/login');
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');
  await page.waitForLoadState('networkidle');
  
  // 等待導航載入
  await page.waitForSelector('.nexus-multi-nav', { timeout: 5000 });
  
  const expectedButtons = [
    { id: 'dashboard', title: '儀表板', hasChildren: false },
    { id: 'crm', title: '客戶關係管理', hasChildren: true },
    { id: 'inventory', title: '產品與庫存', hasChildren: true },
    { id: 'procurement', title: '採購管理', hasChildren: true },
    { id: 'sales', title: '銷售管理', hasChildren: true },
    { id: 'reports', title: '分析與報表', hasChildren: true }
  ];
  
  for (const buttonInfo of expectedButtons) {
    console.log(`\n🔍 測試 ${buttonInfo.title} (${buttonInfo.id})...`);
    
    // 找到對應的按鈕
    const button = await page.$(`button:has-text("${buttonInfo.title}")`);
    
    if (!button) {
      console.log(`❌ 找不到按鈕: ${buttonInfo.title}`);
      continue;
    }
    
    console.log(`✅ 找到按鈕: ${buttonInfo.title}`);
    
    // 懸停前檢查 openDropdowns 狀態
    const beforeHover = await page.evaluate(() => {
      const navElement = document.querySelector('[x-data*="multiLevelNav"]');
      return navElement && navElement._x_dataStack ? navElement._x_dataStack[0].openDropdowns : null;
    });
    
    console.log(`📊 懸停前 openDropdowns:`, beforeHover);
    
    // 懸停
    await button.hover();
    await page.waitForTimeout(1000);
    
    // 懸停後檢查狀態
    const afterHover = await page.evaluate(() => {
      const navElement = document.querySelector('[x-data*="multiLevelNav"]');
      return navElement && navElement._x_dataStack ? navElement._x_dataStack[0].openDropdowns : null;
    });
    
    console.log(`📊 懸停後 openDropdowns:`, afterHover);
    
    // 檢查是否包含預期的 ID
    const expectedInDropdowns = buttonInfo.hasChildren && afterHover && afterHover.includes(buttonInfo.id);
    const actuallyExpected = buttonInfo.hasChildren;
    
    console.log(`🎯 應該有下拉選單: ${actuallyExpected}`);
    console.log(`🎯 實際在 openDropdowns 中: ${expectedInDropdowns}`);
    
    if (actuallyExpected && !expectedInDropdowns) {
      console.log(`❌ 懸停事件未正確觸發 ${buttonInfo.id}`);
      
      // 檢查按鈕的事件監聽器
      const buttonEvents = await page.evaluate((buttonText) => {
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes(buttonText));
        if (btn) {
          return {
            hasMouseEnter: btn.getAttribute('@mouseenter') || btn.onmouseenter,
            hasClick: btn.getAttribute('@click') || btn.onclick,
            xData: btn.getAttribute('x-data'),
            parentXData: btn.closest('[x-data]')?.getAttribute('x-data')
          };
        }
        return null;
      }, buttonInfo.title);
      
      console.log(`🔧 按鈕事件檢查:`, buttonEvents);
    } else if (actuallyExpected && expectedInDropdowns) {
      console.log(`✅ 懸停事件正常工作 ${buttonInfo.id}`);
    } else if (!actuallyExpected) {
      console.log(`ℹ️ ${buttonInfo.id} 預期沒有下拉選單`);
    }
    
    // 拍攝截圖
    await page.screenshot({ 
      path: `${screenshotDir}/all-dropdowns-test-${buttonInfo.id}.png`,
      fullPage: true 
    });
    
    // 移開滑鼠，清除狀態
    await page.mouse.move(50, 50);
    await page.waitForTimeout(800);
  }
  
  console.log('\n✅ 所有導航項目測試完成');
});