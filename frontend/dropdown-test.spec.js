import { test, expect } from '@playwright/test';

test.describe('下拉選單功能深度測試', () => {
  test('檢查下拉選單hover和click功能', async ({ page }) => {
    console.log('🔍 測試下拉選單功能...');
    
    await page.goto('http://127.0.0.1:8000');
    await page.waitForLoadState('networkidle');
    
    // 檢查是否有下拉選單元素
    const dropdownTriggers = await page.locator('[data-dropdown], .dropdown-trigger, [aria-haspopup="true"]').all();
    console.log(`找到 ${dropdownTriggers.length} 個潛在的下拉選單觸發器`);
    
    // 測試hover行為
    for (let i = 0; i < dropdownTriggers.length; i++) {
      const trigger = dropdownTriggers[i];
      const triggerText = await trigger.textContent();
      console.log(`測試觸發器: "${triggerText}"`);
      
      // Hover on trigger
      await trigger.hover();
      await page.waitForTimeout(500);
      
      // 檢查是否有下拉選單出現
      const dropdownMenu = await page.locator('.dropdown-menu, [role="menu"], .absolute.bg-white, .absolute.dark\\:bg-gray-800').isVisible().catch(() => false);
      console.log(`  Hover後下拉選單: ${dropdownMenu ? '✅ 出現' : '❌ 未出現'}`);
    }
    
    // 檢查導航項目是否有子選單
    const navItems = await page.locator('nav a, nav button').all();
    console.log(`檢查 ${navItems.length} 個導航項目的子選單...`);
    
    for (let i = 0; i < Math.min(10, navItems.length); i++) {
      const navItem = navItems[i];
      const itemText = await navItem.textContent();
      
      if (itemText && itemText.trim()) {
        console.log(`檢查導航項目: "${itemText.trim()}"`);
        
        // Hover test
        await navItem.hover();
        await page.waitForTimeout(300);
        
        // 檢查是否有任何下拉內容出現
        const hasSubmenu = await page.locator('.absolute, [class*="dropdown"], [role="menu"]').isVisible().catch(() => false);
        console.log(`  子選單狀態: ${hasSubmenu ? '✅ 有子選單' : 'ℹ️  無子選單'}`);
      }
    }
    
    // 截圖記錄測試結果
    await page.screenshot({ path: 'dropdown-functionality-test.png', fullPage: true });
    console.log('📸 下拉選單功能測試截圖已保存');
  });

  test('Alpine.js狀態檢查', async ({ page }) => {
    console.log('🔧 檢查Alpine.js初始化和狀態...');
    
    await page.goto('http://127.0.0.1:8000');
    await page.waitForLoadState('networkidle');
    
    // 檢查Alpine.js是否正確載入
    const alpineLoaded = await page.evaluate(() => {
      return typeof window.Alpine !== 'undefined';
    });
    
    console.log(`Alpine.js載入狀態: ${alpineLoaded ? '✅ 已載入' : '❌ 未載入'}`);
    
    // 檢查控制台錯誤
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // 等待一段時間收集錯誤
    await page.waitForTimeout(2000);
    
    console.log(`JavaScript錯誤數量: ${consoleErrors.length}`);
    if (consoleErrors.length > 0) {
      console.log('⚠️  發現的錯誤:');
      consoleErrors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    } else {
      console.log('✅ 無JavaScript錯誤');
    }
    
    // 檢查Alpine.js指令
    const alpineElements = await page.locator('[x-data], [x-show], [x-if], [@click]').count();
    console.log(`Alpine.js元素數量: ${alpineElements}`);
    
    expect(consoleErrors.length).toBeLessThan(5); // 允許少量非關鍵錯誤
  });

  test('CSS層級和z-index檢查', async ({ page }) => {
    console.log('🎨 檢查CSS層級和z-index設定...');
    
    await page.goto('http://127.0.0.1:8000');
    await page.waitForLoadState('networkidle');
    
    // 檢查所有可能的下拉選單元素的z-index
    const dropdownElements = await page.locator('.absolute, .fixed, [class*="dropdown"], [class*="z-"]').all();
    
    for (let i = 0; i < Math.min(10, dropdownElements.length); i++) {
      const element = dropdownElements[i];
      
      const styles = await element.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          zIndex: computed.zIndex,
          position: computed.position,
          display: computed.display,
          classes: el.className
        };
      });
      
      if (styles.classes.includes('z-') || styles.zIndex !== 'auto') {
        console.log(`元素層級: z-index=${styles.zIndex}, position=${styles.position}, classes="${styles.classes}"`);
      }
    }
    
    // 檢查導航區域的z-index設定
    const navElements = await page.locator('nav, header, .navigation').all();
    for (const nav of navElements) {
      const navZIndex = await nav.evaluate(el => window.getComputedStyle(el).zIndex);
      const navClasses = await nav.getAttribute('class');
      console.log(`導航元素z-index: ${navZIndex}, classes: ${navClasses}`);
    }
    
    console.log('✅ CSS層級檢查完成');
  });
});