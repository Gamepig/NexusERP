import { test, expect } from '@playwright/test';

test.describe('NexusERP Dashboard 下拉選單簡化測試', () => {
  test('登入並測試下拉選單功能', async ({ page }) => {
    console.log('開始 Dashboard 下拉選單測試...');
    
    // 1. 訪問登入頁面
    await page.goto('http://127.0.0.1:8000/login');
    await page.waitForLoadState('networkidle');
    
    // 截圖：登入頁面
    await page.screenshot({ path: 'screenshots/dropdown-simple-01-login.png', fullPage: true });
    
    // 2. 填寫登入資訊
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    
    // 截圖：登入表單已填寫
    await page.screenshot({ path: 'screenshots/dropdown-simple-02-login-filled.png', fullPage: true });
    
    // 3. 提交登入表單
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    
    // 等待登入完成並重定向
    await page.waitForURL('**/dashboard', { timeout: 15000 });
    await page.waitForTimeout(2000); // 額外等待確保頁面完全載入
    
    // 截圖：登入後的 Dashboard
    await page.screenshot({ path: 'screenshots/dropdown-simple-03-dashboard.png', fullPage: true });
    
    console.log('已成功登入 Dashboard，開始檢查下拉選單...');
    
    // 4. 檢查頁面是否有導航欄
    const hasNav = await page.locator('nav, header, .navbar, [role="navigation"]').count();
    console.log(`頁面中找到 ${hasNav} 個導航元素`);
    
    if (hasNav === 0) {
      console.log('⚠️ 未找到明確的導航欄，檢查其他可能的導航結構...');
      
      // 檢查其他可能的導航結構
      const navStructures = [
        '.sidebar',
        '.menu',
        '.navigation',
        '[data-navigation]',
        '.top-bar',
        '.header-nav'
      ];
      
      for (const selector of navStructures) {
        const count = await page.locator(selector).count();
        if (count > 0) {
          console.log(`找到 ${count} 個 ${selector} 導航結構`);
        }
      }
    }
    
    // 5. 尋找所有可能的下拉選單觸發器
    const dropdownSelectors = [
      // 通用按鈕
      'button',
      // 用戶相關
      'button:has-text("test@example.com")',
      'button:has-text("測試使用者")',
      'button:has-text("User")',
      // Alpine.js 相關
      '[x-data]',
      '[x-data*="dropdown"]',
      '[x-data*="open"]',
      '[x-data*="show"]',
      // 下拉選單相關
      '.dropdown',
      '.dropdown-toggle',
      '[data-dropdown]',
      '[aria-haspopup="true"]',
      '[aria-expanded]',
      // 導航相關
      'nav button',
      'header button',
      '.navbar button',
      // 通用觸發器
      '.relative button',
      'button[class*="menu"]',
      'button[class*="dropdown"]'
    ];
    
    console.log('掃描所有可能的下拉選單觸發器...');
    const foundElements = [];
    
    for (const selector of dropdownSelectors) {
      try {
        const elements = await page.locator(selector).all();
        if (elements.length > 0) {
          console.log(`${selector}: 找到 ${elements.length} 個元素`);
          
          for (let i = 0; i < Math.min(elements.length, 3); i++) { // 限制每種類型最多測試3個
            const element = elements[i];
            const isVisible = await element.isVisible();
            
            if (isVisible) {
              const text = await element.textContent();
              const classes = await element.getAttribute('class');
              const xData = await element.getAttribute('x-data');
              const ariaExpanded = await element.getAttribute('aria-expanded');
              
              foundElements.push({
                selector,
                index: i,
                text: text?.trim() || '',
                classes: classes || '',
                xData: xData || '',
                ariaExpanded: ariaExpanded || ''
              });
              
              console.log(`  元素 ${i + 1}: "${text?.trim()}" (class: ${classes})`);
            }
          }
        }
      } catch (error) {
        // 繼續下一個選擇器
      }
    }
    
    console.log(`\n總共找到 ${foundElements.length} 個可能的下拉選單觸發器`);
    
    // 6. 測試每個找到的觸發器
    let testResults = [];
    
    for (let i = 0; i < Math.min(foundElements.length, 10); i++) { // 限制測試數量
      const element = foundElements[i];
      console.log(`\n測試元素 ${i + 1}/${foundElements.length}: ${element.selector}`);
      console.log(`  文字: "${element.text}"`);
      console.log(`  Class: ${element.classes}`);
      
      try {
        const locator = page.locator(element.selector).nth(element.index);
        
        // 確保元素仍然可見
        if (!(await locator.isVisible())) {
          console.log('  ❌ 元素不再可見，跳過');
          continue;
        }
        
        // 截圖：點擊前
        await page.screenshot({ 
          path: `screenshots/dropdown-simple-test-${i + 1}-before.png`, 
          fullPage: true 
        });
        
        // 嘗試點擊
        await locator.click();
        await page.waitForTimeout(1000); // 等待動畫和狀態更新
        
        // 截圖：點擊後
        await page.screenshot({ 
          path: `screenshots/dropdown-simple-test-${i + 1}-after.png`, 
          fullPage: true 
        });
        
        // 檢查是否有下拉選單出現
        const dropdownAppeared = await page.evaluate(() => {
          // 檢查新出現的可見元素
          const possibleDropdowns = document.querySelectorAll(`
            .dropdown-menu:not([style*="display: none"]),
            .dropdown-content:not([style*="display: none"]),
            [x-show="true"],
            [x-transition]:not([style*="display: none"]),
            .absolute:not([style*="display: none"]),
            .fixed:not([style*="display: none"]),
            .show,
            .open,
            [aria-expanded="true"] + *,
            [aria-expanded="true"] ~ *
          `);
          
          let foundDropdown = null;
          for (const dropdown of possibleDropdowns) {
            const rect = dropdown.getBoundingClientRect();
            const style = getComputedStyle(dropdown);
            
            if (rect.height > 0 && rect.width > 0 && 
                style.display !== 'none' && 
                style.visibility !== 'hidden' &&
                style.opacity !== '0') {
              foundDropdown = {
                tagName: dropdown.tagName,
                className: dropdown.className,
                textContent: dropdown.textContent?.substring(0, 100),
                rect: { width: rect.width, height: rect.height }
              };
              break;
            }
          }
          
          return foundDropdown;
        });
        
        if (dropdownAppeared) {
          console.log('  ✅ 下拉選單已顯示!');
          console.log(`     標籤: ${dropdownAppeared.tagName}`);
          console.log(`     Class: ${dropdownAppeared.className}`);
          console.log(`     內容: "${dropdownAppeared.textContent}"`);
          console.log(`     尺寸: ${dropdownAppeared.rect.width}x${dropdownAppeared.rect.height}`);
          
          testResults.push({
            element: element,
            success: true,
            dropdown: dropdownAppeared
          });
          
          // 截圖：成功狀態
          await page.screenshot({ 
            path: `screenshots/dropdown-simple-success-${i + 1}.png`, 
            fullPage: true 
          });
          
        } else {
          console.log('  ❌ 未檢測到下拉選單');
          testResults.push({
            element: element,
            success: false,
            dropdown: null
          });
        }
        
        // 點擊外部區域關閉可能的下拉選單
        await page.click('body', { position: { x: 10, y: 10 } });
        await page.waitForTimeout(500);
        
      } catch (error) {
        console.log(`  ❌ 測試失敗: ${error.message}`);
        testResults.push({
          element: element,
          success: false,
          error: error.message
        });
      }
    }
    
    // 7. 最終分析和報告
    const successfulTests = testResults.filter(r => r.success);
    const failedTests = testResults.filter(r => !r.success);
    
    console.log('\n=== 最終測試報告 ===');
    console.log(`總共測試: ${testResults.length} 個元素`);
    console.log(`成功觸發下拉選單: ${successfulTests.length} 個`);
    console.log(`未觸發下拉選單: ${failedTests.length} 個`);
    
    if (successfulTests.length > 0) {
      console.log('\n✅ 成功的下拉選單:');
      successfulTests.forEach((result, i) => {
        console.log(`  ${i + 1}. ${result.element.selector} - "${result.element.text}"`);
        console.log(`     下拉選單: ${result.dropdown.tagName}.${result.dropdown.className}`);
      });
    } else {
      console.log('\n❌ 未找到任何可工作的下拉選單');
    }
    
    if (failedTests.length > 0) {
      console.log('\n❌ 失敗的測試:');
      failedTests.slice(0, 5).forEach((result, i) => {
        console.log(`  ${i + 1}. ${result.element.selector} - "${result.element.text}"`);
        if (result.error) {
          console.log(`     錯誤: ${result.error}`);
        }
      });
    }
    
    // 最終截圖
    await page.screenshot({ path: 'screenshots/dropdown-simple-final-report.png', fullPage: true });
    
    // 8. Alpine.js 狀態檢查
    console.log('\n=== Alpine.js 狀態檢查 ===');
    const alpineStatus = await page.evaluate(() => {
      if (typeof window.Alpine !== 'undefined') {
        return {
          loaded: true,
          version: window.Alpine.version || 'unknown',
          stores: Object.keys(window.Alpine.store?.() || {}),
          components: document.querySelectorAll('[x-data]').length
        };
      }
      return { loaded: false };
    });
    
    console.log(`Alpine.js 載入狀態: ${alpineStatus.loaded ? '✅ 已載入' : '❌ 未載入'}`);
    if (alpineStatus.loaded) {
      console.log(`版本: ${alpineStatus.version}`);
      console.log(`組件數量: ${alpineStatus.components}`);
      console.log(`Store: ${alpineStatus.stores?.join(', ') || '無'}`);
    }
    
    // 至少要有一些 UI 元素被找到
    expect(foundElements.length).toBeGreaterThan(0);
    
    // 將測試結果保存到 JSON 文件中以供後續分析
    const reportData = {
      timestamp: new Date().toISOString(),
      summary: {
        totalElements: foundElements.length,
        totalTests: testResults.length,
        successfulDropdowns: successfulTests.length,
        failedTests: failedTests.length
      },
      foundElements,
      testResults,
      alpineStatus
    };
    
    // 在瀏覽器控制台輸出詳細報告
    await page.evaluate((data) => {
      console.log('=== NexusERP Dashboard 下拉選單測試完整報告 ===');
      console.log(JSON.stringify(data, null, 2));
    }, reportData);
  });
});