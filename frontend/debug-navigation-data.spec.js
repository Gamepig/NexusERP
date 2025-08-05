// 調試導航數據傳遞
import { test, expect } from '@playwright/test';

test('🔍 檢查導航數據傳遞和 Alpine.js 初始化', async ({ page }) => {
  const screenshotDir = './screenshots';
  
  // 捕獲控制台訊息
  page.on('console', msg => {
    console.log('📱 瀏覽器控制台:', msg.text());
  });
  
  console.log('🔍 開始檢查導航數據傳遞...');
  
  // 登入
  await page.goto('http://127.0.0.1:8000/login');
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');
  await page.waitForLoadState('networkidle');
  
  // 等待 Alpine.js 完全初始化
  await page.waitForSelector('.nexus-multi-nav', { timeout: 5000 });
  await page.waitForTimeout(2000);
  
  console.log('✅ 頁面已載入');
  
  // 檢查 multi-level-nav 組件是否存在
  const navComponent = await page.$('.nexus-multi-nav');
  if (!navComponent) {
    console.log('❌ 找不到 .nexus-multi-nav 組件');
    return;
  }
  
  console.log('✅ 找到 multi-level-nav 組件');
  
  // 檢查組件的 Alpine.js 數據
  const componentData = await page.evaluate(() => {
    const component = document.querySelector('.nexus-multi-nav');
    if (component && component._x_dataStack) {
      const data = component._x_dataStack[0];
      return {
        hasNavigationItems: Boolean(data.navigationItems),
        navigationItemsCount: data.navigationItems ? data.navigationItems.length : 0,
        navigationItems: data.navigationItems ? data.navigationItems.map(item => ({
          id: item.id,
          title: item.title,
          hasChildren: item.hasChildren,
          childrenCount: item.children ? item.children.length : 0
        })) : [],
        openDropdowns: data.openDropdowns || [],
        methods: Object.keys(data).filter(key => typeof data[key] === 'function')
      };
    }
    return { error: '無法取得 Alpine.js 數據' };
  });
  
  console.log('📊 組件 Alpine.js 數據:', JSON.stringify(componentData, null, 2));
  
  // 檢查 DOM 中的導航按鈕
  const navButtons = await page.$$eval('.nexus-multi-nav button', buttons => 
    buttons.map(btn => ({
      text: btn.textContent?.trim(),
      hasDropdownIcon: btn.querySelector('svg') !== null,
      onClick: btn.getAttribute('@click'),
      onMouseEnter: btn.getAttribute('@mouseenter'),
      classes: btn.className
    }))
  );
  
  console.log('🔘 DOM 中的導航按鈕:', JSON.stringify(navButtons, null, 2));
  
  // 檢查下拉選單元素在 DOM 中的存在
  const dropdownElements = await page.$$eval('.nexus-nav-dropdown', dropdowns => 
    dropdowns.map((dropdown, index) => ({
      index,
      xShow: dropdown.getAttribute('x-show'),
      display: getComputedStyle(dropdown).display,
      visibility: getComputedStyle(dropdown).visibility,
      innerHTML: dropdown.innerHTML.length > 0 ? 'Has content' : 'Empty',
      parent: dropdown.parentElement?.tagName
    }))
  );
  
  console.log('📋 下拉選單元素:', JSON.stringify(dropdownElements, null, 2));
  
  // 檢查 x-for 是否正確渲染
  const xForElements = await page.$$eval('[x-for]', elements => 
    elements.map(el => ({
      xFor: el.getAttribute('x-for'),
      key: el.getAttribute(':key'),
      tagName: el.tagName,
      parent: el.parentElement?.tagName
    }))
  );
  
  console.log('🔄 x-for 元素:', JSON.stringify(xForElements, null, 2));
  
  // 手動檢查特定項目的子項目
  if (componentData.navigationItems && componentData.navigationItems.length > 0) {
    const crmItem = componentData.navigationItems.find(item => item.id === 'crm');
    if (crmItem) {
      console.log('🔍 CRM 項目詳細資訊:', crmItem);
      
      // 手動觸發顯示 CRM 下拉選單
      const manualTrigger = await page.evaluate(() => {
        const component = document.querySelector('.nexus-multi-nav');
        if (component && component._x_dataStack) {
          const context = component._x_dataStack[0];
          if (typeof context.showDropdown === 'function') {
            context.showDropdown('crm');
            return {
              triggered: true,
              openDropdowns: context.openDropdowns || []
            };
          }
        }
        return { triggered: false };
      });
      
      console.log('🔧 手動觸發結果:', manualTrigger);
      
      if (manualTrigger.triggered) {
        await page.waitForTimeout(1000);
        
        // 檢查手動觸發後的下拉選單狀態
        const afterTrigger = await page.$$eval('.nexus-nav-dropdown', dropdowns => 
          dropdowns.map((dropdown, index) => ({
            index,
            display: getComputedStyle(dropdown).display,
            visibility: getComputedStyle(dropdown).visibility,
            opacity: getComputedStyle(dropdown).opacity,
            hasContent: dropdown.innerHTML.length > 0
          }))
        );
        
        console.log('📊 手動觸發後狀態:', JSON.stringify(afterTrigger, null, 2));
        
        // 拍攝手動觸發後的截圖
        await page.screenshot({ 
          path: `${screenshotDir}/debug-navigation-manual-trigger.png`,
          fullPage: true 
        });
      }
    }
  }
  
  // 最終截圖
  await page.screenshot({ 
    path: `${screenshotDir}/debug-navigation-data-final.png`,
    fullPage: true 
  });
  
  console.log('\n✅ 導航數據調試完成');
  
  // 總結
  if (componentData.error) {
    console.log('❌ 主要問題: Alpine.js 數據無法取得');
  } else if (!componentData.hasNavigationItems) {
    console.log('❌ 主要問題: navigationItems 為空或未定義');
  } else if (componentData.navigationItemsCount === 0) {
    console.log('❌ 主要問題: navigationItems 數組為空');
  } else if (dropdownElements.length === 0) {
    console.log('❌ 主要問題: 下拉選單元素不存在於 DOM 中');
  } else {
    console.log('✅ 數據傳遞正常，問題可能在 CSS 或事件綁定');
  }
});