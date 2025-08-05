import { test, expect } from '@playwright/test';

test('Analyze User Dropdown CSS Issues', async ({ page }) => {
  // 訪問登入頁面
  await page.goto('http://127.0.0.1:8000/login');
  
  // 填寫登入表單
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  
  // 等待導航到儀表板
  await page.waitForURL('**/dashboard');
  await page.waitForTimeout(2000);
  
  console.log('=== CSS Dropdown Analysis ===');
  
  // 1. 檢查用戶下拉選單觸發器
  const userTrigger = await page.locator('.nexus-user-trigger').first();
  const triggerExists = await userTrigger.count() > 0;
  console.log('1. User trigger exists:', triggerExists);
  
  if (triggerExists) {
    const triggerStyles = await userTrigger.evaluate(el => {
      return window.getComputedStyle(el);
    });
    console.log('Trigger background:', triggerStyles.backgroundColor);
  }
  
  // 2. 點擊用戶下拉選單觸發器
  if (triggerExists) {
    await userTrigger.click();
    await page.waitForTimeout(1000);
  }
  
  // 3. 檢查下拉選單是否顯示
  const dropdown = await page.locator('.nexus-user-dropdown').first();
  const dropdownVisible = await dropdown.isVisible();
  console.log('2. Dropdown visible after click:', dropdownVisible);
  
  if (dropdownVisible) {
    // 4. 分析下拉選單的計算樣式
    const dropdownStyles = await dropdown.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        backgroundColor: computed.backgroundColor,
        color: computed.color,
        border: computed.border,
        borderRadius: computed.borderRadius,
        boxShadow: computed.boxShadow,
        display: computed.display,
        position: computed.position,
        zIndex: computed.zIndex,
        top: computed.top,
        right: computed.right,
      };
    });
    
    console.log('3. Computed Dropdown Styles:');
    console.log('   Background:', dropdownStyles.backgroundColor);
    console.log('   Color:', dropdownStyles.color);  
    console.log('   Border:', dropdownStyles.border);
    console.log('   Display:', dropdownStyles.display);
    console.log('   Position:', dropdownStyles.position);
    console.log('   Z-Index:', dropdownStyles.zIndex);
    
    // 5. 檢查所有應用的CSS規則
    const appliedRules = await dropdown.evaluate(el => {
      const sheets = Array.from(document.styleSheets);
      const rules = [];
      
      sheets.forEach(sheet => {
        try {
          const cssRules = Array.from(sheet.cssRules || []);
          cssRules.forEach(rule => {
            if (rule.selectorText && el.matches(rule.selectorText)) {
              rules.push({
                selector: rule.selectorText,
                cssText: rule.cssText,
                href: sheet.href
              });
            }
          });
        } catch (e) {
          // Skip CORS-blocked stylesheets
        }
      });
      
      return rules;
    });
    
    console.log('4. Applied CSS Rules:');
    appliedRules.forEach((rule, index) => {
      console.log(`   Rule ${index + 1}: ${rule.selector}`);
      if (rule.cssText.includes('background')) {
        console.log(`     ${rule.cssText}`);
      }
    });
    
    // 6. 檢查所有相關的CSS類別
    const classList = await dropdown.evaluate(el => {
      return Array.from(el.classList);
    });
    console.log('5. Dropdown Classes:', classList);
    
    // 7. 檢查CSS變數值
    const cssVariables = await dropdown.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        navBgDropdown: computed.getPropertyValue('--nexus-nav-bg-dropdown'),
        bgSecondary: computed.getPropertyValue('--nexus-bg-secondary'),
        bgTertiary: computed.getPropertyValue('--nexus-bg-tertiary'),
        surfacePrimary: computed.getPropertyValue('--nexus-surface-primary'),
      };
    });
    
    console.log('6. CSS Variables:');
    console.log('   --nexus-nav-bg-dropdown:', cssVariables.navBgDropdown);
    console.log('   --nexus-bg-secondary:', cssVariables.bgSecondary);
    console.log('   --nexus-bg-tertiary:', cssVariables.bgTertiary);
    console.log('   --nexus-surface-primary:', cssVariables.surfacePrimary);
  }
  
  // 8. 檢查主題狀態
  const rootElement = await page.locator('html').first();
  const themeClass = await rootElement.getAttribute('class');
  console.log('7. Current theme class on html:', themeClass);
  
  // 9. 檢查是否有影響的內聯樣式或其他覆蓋
  const inlineStyle = await dropdown.getAttribute('style');
  console.log('8. Dropdown inline styles:', inlineStyle);
  
  // 10. 截圖保存當前狀態
  await page.screenshot({ 
    path: 'css-dropdown-analysis.png',
    fullPage: false
  });
  
  console.log('=== Analysis Complete ===');
  console.log('Screenshot saved as: css-dropdown-analysis.png');
});