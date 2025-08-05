import { test, expect } from '@playwright/test';

test.describe('NexusERP Dashboard 下拉選單功能測試', () => {
  test.beforeEach(async ({ page }) => {
    // 登入系統
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // 檢查是否需要登入
    const loginForm = page.locator('form[action*="login"]');
    if (await loginForm.isVisible()) {
      console.log('需要登入，執行登入流程...');
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'password123');
      
      // 截圖：登入表單填寫完成
      await page.screenshot({ path: 'screenshots/dropdown-test-01-login-filled.png', fullPage: true });
      
      await page.click('button[type="submit"]');
      await page.waitForLoadState('networkidle');
      
      // 等待重定向到 dashboard
      await page.waitForURL('**/dashboard', { timeout: 10000 });
    }
    
    // 確保在 dashboard 頁面
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // 截圖：Dashboard 初始狀態
    await page.screenshot({ path: 'screenshots/dropdown-test-02-dashboard-initial.png', fullPage: true });
  });

  test('系統性測試導航欄下拉選單功能', async ({ page }) => {
    console.log('開始系統性測試 Dashboard 下拉選單功能...');
    
    // 1. 檢查導航欄結構
    const navbar = page.locator('nav');
    await expect(navbar).toBeVisible();
    
    // 截圖：初始導航欄狀態
    await page.screenshot({ path: 'screenshots/dropdown-test-03-navbar-initial.png', fullPage: true });
    
    // 2. 尋找所有可能的下拉選單觸發器
    const potentialDropdowns = [
      'nav [data-dropdown]',
      'nav .dropdown',
      'nav [x-data]',
      'nav button[aria-expanded]',
      'nav button[aria-haspopup]',
      'nav .relative > button',
      'nav [class*="dropdown"]',
      'nav li:has(ul)',
      'nav a:has(+ ul)',
      'nav button:has(+ div)',
      'nav .group',
      'nav [role="button"]'
    ];
    
    console.log('檢查導航欄中的下拉選單觸發器...');
    const foundDropdowns = [];
    
    for (const selector of potentialDropdowns) {
      const elements = await page.locator(selector).all();
      if (elements.length > 0) {
        console.log(`找到 ${elements.length} 個 ${selector} 元素`);
        foundDropdowns.push({ selector, count: elements.length });
        
        // 檢查每個元素的詳細信息
        for (let i = 0; i < elements.length; i++) {
          const element = elements[i];
          const text = await element.textContent();
          const classes = await element.getAttribute('class');
          console.log(`  元素 ${i + 1}: "${text?.trim()}" (classes: ${classes})`);
        }
      }
    }
    
    // 3. 檢查 Alpine.js 下拉選單組件
    console.log('檢查 Alpine.js 下拉選單組件...');
    const alpineDropdowns = await page.locator('[x-data*="dropdown"], [x-data*="open"], [x-data*="show"]').all();
    
    for (let i = 0; i < alpineDropdowns.length; i++) {
      const dropdown = alpineDropdowns[i];
      const xData = await dropdown.getAttribute('x-data');
      const text = await dropdown.textContent();
      console.log(`Alpine 下拉選單 ${i + 1}: x-data="${xData}", 內容: "${text?.trim()?.substring(0, 50)}..."`);
    }
    
    // 4. 測試所有可能的下拉選單
    const testTargets = [
      // 基於常見的導航模式
      { selector: 'nav button', type: 'button', action: 'click' },
      { selector: 'nav .dropdown-toggle', type: 'dropdown-toggle', action: 'click' },
      { selector: 'nav [data-dropdown-toggle]', type: 'data-dropdown-toggle', action: 'click' },
      { selector: 'nav .relative button', type: 'relative-button', action: 'click' },
      
      // 基於 hover 的下拉選單
      { selector: 'nav li:has(ul)', type: 'nav-hover', action: 'hover' },
      { selector: 'nav .group', type: 'group-hover', action: 'hover' },
      
      // 用戶相關下拉選單
      { selector: '[data-dropdown="user"]', type: 'user-dropdown', action: 'click' },
      { selector: '.user-menu button', type: 'user-menu', action: 'click' },
      { selector: '[class*="user"] button', type: 'user-button', action: 'click' },
      
      // 通知和設定下拉選單
      { selector: '[data-dropdown="notifications"]', type: 'notifications', action: 'click' },
      { selector: '[data-dropdown="settings"]', type: 'settings', action: 'click' },
    ];
    
    let testResults = [];
    
    for (const target of testTargets) {
      try {
        const elements = await page.locator(target.selector).all();
        
        if (elements.length > 0) {
          console.log(`\n測試 ${target.type} (${target.selector}) - 找到 ${elements.length} 個元素`);
          
          for (let i = 0; i < elements.length; i++) {
            const element = elements[i];
            const isVisible = await element.isVisible();
            
            if (!isVisible) continue;
            
            const elementText = await element.textContent();
            console.log(`  測試元素 ${i + 1}: "${elementText?.trim()}"`);
            
            // 記錄測試前狀態
            await page.screenshot({ 
              path: `screenshots/dropdown-test-before-${target.type}-${i + 1}.png`, 
              fullPage: true 
            });
            
            // 執行動作
            if (target.action === 'click') {
              await element.click();
              await page.waitForTimeout(500); // 等待動畫完成
            } else if (target.action === 'hover') {
              await element.hover();
              await page.waitForTimeout(500); // 等待 hover 效果
            }
            
            // 記錄測試後狀態
            await page.screenshot({ 
              path: `screenshots/dropdown-test-after-${target.type}-${i + 1}.png`, 
              fullPage: true 
            });
            
            // 檢查是否有下拉選單出現
            const possibleDropdownSelectors = [
              `${target.selector} + div`,
              `${target.selector} + ul`,
              `${target.selector} ~ div`,
              `${target.selector} ~ ul`,
              '.dropdown-menu:visible',
              '.dropdown-content:visible',
              '[x-show]:visible',
              '[x-transition]:visible',
              '.absolute:visible',
              '.fixed:visible'
            ];
            
            let dropdownFound = false;
            for (const dropdownSelector of possibleDropdownSelectors) {
              const dropdown = page.locator(dropdownSelector).first();
              if (await dropdown.isVisible()) {
                dropdownFound = true;
                const dropdownContent = await dropdown.textContent();
                console.log(`    ✅ 找到下拉選單! 內容: "${dropdownContent?.trim()?.substring(0, 100)}..."`);
                break;
              }
            }
            
            if (!dropdownFound) {
              console.log(`    ❌ 未找到下拉選單`);
            }
            
            testResults.push({
              type: target.type,
              selector: target.selector,
              elementIndex: i + 1,
              elementText: elementText?.trim(),
              dropdownFound,
              action: target.action
            });
            
            // 點擊外部關閉可能的下拉選單
            await page.click('body', { position: { x: 100, y: 100 } });
            await page.waitForTimeout(300);
          }
        }
      } catch (error) {
        console.log(`測試 ${target.type} 時發生錯誤: ${error.message}`);
      }
    }
    
    // 5. 檢查 DOM 中隱藏的下拉選單元素
    console.log('\n檢查 DOM 中隱藏的下拉選單元素...');
    const hiddenDropdowns = await page.locator('div[style*="display: none"], div[hidden], .hidden, [x-show="false"]').all();
    
    for (let i = 0; i < hiddenDropdowns.length; i++) {
      const element = hiddenDropdowns[i];
      const classes = await element.getAttribute('class');
      const style = await element.getAttribute('style');
      const xShow = await element.getAttribute('x-show');
      
      if (classes?.includes('dropdown') || classes?.includes('menu') || xShow) {
        console.log(`隱藏的下拉選單 ${i + 1}: classes="${classes}", style="${style}", x-show="${xShow}"`);
      }
    }
    
    // 6. 檢查 Alpine.js 狀態
    console.log('\n檢查 Alpine.js 初始化狀態...');
    const alpineElements = await page.locator('[x-data]').all();
    console.log(`找到 ${alpineElements.length} 個 Alpine.js 組件`);
    
    // 7. 檢查 CSS 樣式影響
    console.log('\n檢查可能影響下拉選單的 CSS 樣式...');
    const styles = await page.evaluate(() => {
      const sheets = Array.from(document.styleSheets);
      const relevantRules = [];
      
      try {
        sheets.forEach(sheet => {
          try {
            const rules = Array.from(sheet.cssRules || sheet.rules || []);
            rules.forEach(rule => {
              if (rule.selectorText && (
                rule.selectorText.includes('dropdown') ||
                rule.selectorText.includes('menu') ||
                rule.selectorText.includes('hidden') ||
                rule.selectorText.includes('show')
              )) {
                relevantRules.push({
                  selector: rule.selectorText,
                  style: rule.style.cssText
                });
              }
            });
          } catch (e) {
            // 跨域樣式表無法存取
          }
        });
      } catch (e) {
        console.error('無法檢查樣式表:', e);
      }
      
      return relevantRules;
    });
    
    console.log(`找到 ${styles.length} 個相關 CSS 規則`);
    styles.slice(0, 5).forEach((rule, i) => {
      console.log(`  規則 ${i + 1}: ${rule.selector} { ${rule.style} }`);
    });
    
    // 最終截圖
    await page.screenshot({ path: 'screenshots/dropdown-test-final-analysis.png', fullPage: true });
    
    // 總結測試結果
    console.log('\n=== 測試結果總結 ===');
    console.log(`總共測試了 ${testResults.length} 個潛在的下拉選單元素`);
    
    const successfulDropdowns = testResults.filter(r => r.dropdownFound);
    const failedDropdowns = testResults.filter(r => !r.dropdownFound);
    
    console.log(`✅ 成功觸發下拉選單: ${successfulDropdowns.length} 個`);
    successfulDropdowns.forEach(r => {
      console.log(`   - ${r.type}: "${r.elementText}" (${r.action})`);
    });
    
    console.log(`❌ 未觸發下拉選單: ${failedDropdowns.length} 個`);
    failedDropdowns.forEach(r => {
      console.log(`   - ${r.type}: "${r.elementText}" (${r.action})`);
    });
    
    // 將結果保存到文件
    const reportData = {
      timestamp: new Date().toISOString(),
      testResults,
      summary: {
        totalTests: testResults.length,
        successfulDropdowns: successfulDropdowns.length,
        failedDropdowns: failedDropdowns.length,
        foundDropdowns,
        alpineElements: alpineElements.length,
        hiddenDropdowns: hiddenDropdowns.length,
        cssRules: styles.length
      }
    };
    
    await page.evaluate((data) => {
      console.log('=== 下拉選單測試報告 ===');
      console.log(JSON.stringify(data, null, 2));
    }, reportData);
    
    // 驗證至少有一些導航元素存在
    expect(foundDropdowns.length).toBeGreaterThan(0);
  });

  test('具體測試用戶選單下拉功能', async ({ page }) => {
    console.log('具體測試用戶選單下拉功能...');
    
    // 尋找用戶相關的按鈕或連結
    const userSelectors = [
      'button:has-text("test@example.com")',
      'button:has-text("測試使用者")',
      'button:has-text("User")',
      '.user-menu button',
      '[data-dropdown="user"] button',
      'nav button[aria-expanded]',
      'nav .relative button:last-child',
      'nav button:has([class*="user"])',
      'nav button:has(svg)'
    ];
    
    let userMenuFound = false;
    
    for (const selector of userSelectors) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible()) {
          console.log(`找到用戶選單按鈕: ${selector}`);
          
          // 截圖：點擊前
          await page.screenshot({ path: 'screenshots/dropdown-test-user-menu-before.png', fullPage: true });
          
          // 點擊用戶選單
          await element.click();
          await page.waitForTimeout(1000);
          
          // 截圖：點擊後
          await page.screenshot({ path: 'screenshots/dropdown-test-user-menu-after.png', fullPage: true });
          
          // 檢查下拉選單是否出現
          const dropdownVisible = await page.locator('.dropdown-menu, .user-dropdown, [x-show="true"], .absolute.right-0, .absolute.top-full').isVisible();
          
          if (dropdownVisible) {
            console.log('✅ 用戶下拉選單成功顯示');
            userMenuFound = true;
            
            // 檢查下拉選單內容
            const dropdownContent = await page.locator('.dropdown-menu, .user-dropdown, [x-show="true"], .absolute.right-0, .absolute.top-full').first().textContent();
            console.log(`下拉選單內容: ${dropdownContent}`);
          } else {
            console.log('❌ 用戶下拉選單未顯示');
          }
          
          break;
        }
      } catch (error) {
        console.log(`測試 ${selector} 時發生錯誤: ${error.message}`);
      }
    }
    
    if (!userMenuFound) {
      console.log('⚠️ 未找到可識別的用戶選單按鈕');
    }
  });

  test('檢查響應式下拉選單功能', async ({ page }) => {
    console.log('檢查響應式下拉選單功能...');
    
    // 測試不同螢幕尺寸
    const viewports = [
      { name: 'Desktop', width: 1280, height: 720 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Mobile', width: 375, height: 667 }
    ];
    
    for (const viewport of viewports) {
      console.log(`測試 ${viewport.name} 視窗 (${viewport.width}x${viewport.height})`);
      
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.waitForTimeout(500);
      
      // 截圖：該視窗大小的初始狀態
      await page.screenshot({ 
        path: `screenshots/dropdown-test-responsive-${viewport.name}.png`, 
        fullPage: true 
      });
      
      // 尋找漢堡選單或行動版導航
      const mobileMenuSelectors = [
        'button[aria-label*="menu"]',
        'button[aria-label*="navigation"]',
        '.mobile-menu-button',
        '[data-mobile-menu]',
        'button:has([class*="hamburger"])',
        'button:has(svg[viewBox*="24"])', // 常見的漢堡選單 SVG
        'nav button[class*="md:hidden"]'
      ];
      
      for (const selector of mobileMenuSelectors) {
        try {
          const element = page.locator(selector).first();
          if (await element.isVisible()) {
            console.log(`  找到行動版選單按鈕: ${selector}`);
            
            await element.click();
            await page.waitForTimeout(500);
            
            // 檢查行動版選單是否出現
            const mobileMenuVisible = await page.locator('.mobile-menu, .mobile-navigation, [x-show="true"]').isVisible();
            
            if (mobileMenuVisible) {
              console.log(`  ✅ ${viewport.name} 行動版選單成功顯示`);
            } else {
              console.log(`  ❌ ${viewport.name} 行動版選單未顯示`);
            }
            
            // 截圖：行動版選單狀態
            await page.screenshot({ 
              path: `screenshots/dropdown-test-responsive-${viewport.name}-menu-open.png`, 
              fullPage: true 
            });
            
            break;
          }
        } catch (error) {
          // 繼續測試下一個選擇器
        }
      }
    }
    
    // 恢復桌面視窗
    await page.setViewportSize({ width: 1280, height: 720 });
  });
});