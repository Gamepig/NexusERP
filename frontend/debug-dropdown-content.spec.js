// 檢查下拉選單內容和數據
import { test, expect } from '@playwright/test';

test('調試下拉選單內容和數據', async ({ page }) => {
  console.log('🔍 開始調試下拉選單內容...');
  
  // 登入到系統
  await page.goto('http://127.0.0.1:8000/login');
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');
  await page.waitForLoadState('networkidle');
  
  // 等待導航載入
  await page.waitForSelector('.nexus-multi-nav', { timeout: 5000 });
  
  // 檢查 Alpine.js 導航數據
  const navigationData = await page.evaluate(() => {
    const navElement = document.querySelector('[x-data*="multiLevelNav"]');
    if (navElement && navElement._x_dataStack) {
      return navElement._x_dataStack[0];
    }
    return null;
  });
  
  console.log('📊 Alpine.js 導航數據:');
  if (navigationData) {
    console.log('  - navigationItems 數量:', navigationData.navigationItems?.length || 0);
    console.log('  - openDropdowns:', navigationData.openDropdowns || []);
    
    if (navigationData.navigationItems) {
      navigationData.navigationItems.forEach((item, index) => {
        console.log(`  - 項目 ${index + 1}: "${item.title}"`);
        console.log(`    - hasChildren: ${item.hasChildren}`);
        console.log(`    - children 數量: ${item.children?.length || 0}`);
        if (item.children && item.children.length > 0) {
          item.children.forEach((child, childIndex) => {
            console.log(`      - 子項目 ${childIndex + 1}: "${child.title}"`);
          });
        }
      });
    }
  } else {
    console.log('❌ 無法取得 Alpine.js 數據');
  }
  
  // 檢查下拉選單DOM元素
  const dropdownInfo = await page.evaluate(() => {
    const dropdowns = document.querySelectorAll('.nexus-nav-dropdown');
    return Array.from(dropdowns).map((dropdown, index) => {
      const style = getComputedStyle(dropdown);
      const items = dropdown.querySelectorAll('.nexus-dropdown-item, a, button');
      return {
        index,
        display: style.display,
        visibility: style.visibility,
        opacity: style.opacity,
        position: style.position,
        zIndex: style.zIndex,
        top: style.top,
        left: style.left,
        width: style.width,
        height: style.height,
        itemCount: items.length,
        innerHTML: dropdown.innerHTML.substring(0, 200) + '...'
      };
    });
  });
  
  console.log('🎯 下拉選單DOM信息:');
  dropdownInfo.forEach((info, index) => {
    console.log(`  下拉選單 ${index + 1}:`);
    console.log(`    - display: ${info.display}`);
    console.log(`    - visibility: ${info.visibility}`);
    console.log(`    - opacity: ${info.opacity}`);
    console.log(`    - position: ${info.position}`);
    console.log(`    - z-index: ${info.zIndex}`);
    console.log(`    - top: ${info.top}`);
    console.log(`    - left: ${info.left}`);
    console.log(`    - size: ${info.width} x ${info.height}`);
    console.log(`    - 項目數量: ${info.itemCount}`);
    console.log(`    - 內容預覽: ${info.innerHTML}`);
  });
  
  // 測試懸停並檢查變化
  console.log('🖱️ 測試客戶關係管理懸停...');
  
  const crmButton = await page.$('button:has-text("客戶關係管理")');
  if (crmButton) {
    await crmButton.hover();
    await page.waitForTimeout(1000);
    
    // 檢查懸停後的狀態
    const hoverData = await page.evaluate(() => {
      const navElement = document.querySelector('[x-data*="multiLevelNav"]');
      if (navElement && navElement._x_dataStack) {
        return {
          openDropdowns: navElement._x_dataStack[0].openDropdowns || []
        };
      }
      return null;
    });
    
    console.log('📊 懸停後數據:', hoverData);
    
    // 檢查可見的下拉選單
    const visibleDropdowns = await page.evaluate(() => {
      const dropdowns = document.querySelectorAll('.nexus-nav-dropdown');
      return Array.from(dropdowns).map((dropdown, index) => {
        const style = getComputedStyle(dropdown);
        const rect = dropdown.getBoundingClientRect();
        return {
          index,
          isVisible: style.display !== 'none' && style.visibility !== 'hidden' && parseFloat(style.opacity) > 0,
          boundingRect: {
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height
          },
          itemsHTML: Array.from(dropdown.querySelectorAll('*')).map(el => el.tagName + ': ' + (el.textContent || '').trim()).filter(text => text.length > 2)
        };
      });
    });
    
    console.log('👁️ 可見下拉選單狀態:');
    visibleDropdowns.forEach((dropdown, index) => {
      console.log(`  下拉選單 ${index + 1}:`);
      console.log(`    - 是否可見: ${dropdown.isVisible}`);
      console.log(`    - 位置: top=${dropdown.boundingRect.top}, left=${dropdown.boundingRect.left}`);
      console.log(`    - 尺寸: ${dropdown.boundingRect.width}x${dropdown.boundingRect.height}`);
      console.log(`    - 內容元素:`, dropdown.itemsHTML.slice(0, 5));
    });
  }
  
  console.log('✅ 調試完成');
});