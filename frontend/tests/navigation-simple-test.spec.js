import { test, expect } from '@playwright/test';

test.describe('NexusERP 導航修復簡單驗證', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://127.0.0.1:8000/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    await page.waitForLoadState('networkidle');
  });

  test('檢查導航列和拍攝整體截圖', async ({ page }) => {
    console.log('拍攝 Dashboard 整體截圖...');
    
    // 拍攝初始狀態截圖
    await page.screenshot({
      path: 'tests/screenshots/navigation-initial-state.png',
      fullPage: true
    });

    // 檢查導航列是否存在
    const nav = page.locator('nav');
    await expect(nav).toBeVisible();
    console.log('✓ 導航列可見');

    // 列出所有可能的導航連結
    const allLinks = await page.locator('nav a').all();
    console.log(`找到 ${allLinks.length} 個導航連結`);

    for (let i = 0; i < allLinks.length; i++) {
      const link = allLinks[i];
      const text = await link.textContent();
      const href = await link.getAttribute('href');
      console.log(`連結 ${i + 1}: "${text}" -> ${href}`);
    }
  });

  test('測試各導航項目的懸停效果', async ({ page }) => {
    // 尋找所有含有下拉箭頭的導航項目
    const navItems = [
      '客戶關係管理',
      '產品與庫存', 
      '採購管理',
      '銷售管理',
      '分析與報表'
    ];

    for (const itemText of navItems) {
      console.log(`測試 "${itemText}" 懸停效果...`);
      
      // 使用不同的選擇器策略
      const selectors = [
        `nav a:has-text("${itemText}")`,
        `a:has-text("${itemText}")`,
        `[data-nav-item="${itemText}"]`,
        `*:has-text("${itemText}")`,
      ];

      let found = false;
      for (const selector of selectors) {
        try {
          const element = page.locator(selector).first();
          if (await element.count() > 0) {
            console.log(`使用選擇器找到: ${selector}`);
            
            // 懸停並等待
            await element.hover();
            await page.waitForTimeout(500);
            
            // 拍攝懸停截圖
            await page.screenshot({
              path: `tests/screenshots/hover-${itemText.replace(/[^\w]/g, '')}.png`,
              fullPage: true
            });
            
            found = true;
            break;
          }
        } catch (error) {
          console.log(`選擇器 "${selector}" 失敗:`, error.message);
        }
      }
      
      if (!found) {
        console.log(`⚠ 無法找到導航項目: ${itemText}`);
      }
      
      // 移開滑鼠
      await page.hover('body');
      await page.waitForTimeout(300);
    }
  });

  test('檢查下拉選單 CSS 類別', async ({ page }) => {
    console.log('檢查頁面中的下拉選單相關元素...');
    
    // 檢查是否有 nexus-nav-dropdown 類別的元素
    const dropdownElements = page.locator('.nexus-nav-dropdown');
    const count = await dropdownElements.count();
    console.log(`找到 ${count} 個 .nexus-nav-dropdown 元素`);
    
    if (count > 0) {
      for (let i = 0; i < count; i++) {
        const element = dropdownElements.nth(i);
        const styles = await element.evaluate((el) => {
          const computed = window.getComputedStyle(el);
          return {
            display: computed.display,
            position: computed.position,
            zIndex: computed.zIndex,
            visibility: computed.visibility
          };
        });
        console.log(`下拉選單 ${i + 1} 樣式:`, styles);
      }
    }

    // 檢查所有下拉相關的類別
    const dropdownClasses = [
      '.nexus-nav-dropdown',
      '.dropdown-menu',
      '.nav-dropdown',
      '[class*="dropdown"]'
    ];

    for (const className of dropdownClasses) {
      const elements = page.locator(className);
      const elementCount = await elements.count();
      if (elementCount > 0) {
        console.log(`找到 ${elementCount} 個 "${className}" 元素`);
      }
    }
  });
});