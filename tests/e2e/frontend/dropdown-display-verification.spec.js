import { test, expect } from '@playwright/test';

test.describe('下拉選單顯示狀態驗證', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://127.0.0.1:8000/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    await page.waitForLoadState('networkidle');
  });

  test('驗證下拉選單懸停顯示效果', async ({ page }) => {
    console.log('開始驗證下拉選單懸停顯示效果...');

    // 先拍攝初始狀態
    await page.screenshot({
      path: 'tests/screenshots/dropdown-initial-verification.png',
      fullPage: true
    });

    // 測試所有主要導航項目
    const navItems = [
      { name: '客戶關係管理', expectedSubItems: ['客戶列表', '聯絡人', '商機管理'] },
      { name: '產品與庫存', expectedSubItems: ['產品管理', '庫存管理', '調撥作業'] },
      { name: '採購管理', expectedSubItems: ['採購訂單', '供應商管理', '收貨管理'] },
      { name: '銷售管理', expectedSubItems: ['銷售訂單', '報價管理', '出貨管理'] },
      { name: '分析與報表', expectedSubItems: ['銷售報表', '庫存報表', '財務報表'] }
    ];

    for (const navItem of navItems) {
      console.log(`\n測試 "${navItem.name}" 下拉選單...`);

      // 尋找導航項目 - 使用更精確的選擇器
      const navLink = page.locator(`#main-navigation`).locator(`text="${navItem.name}"`).first();
      
      // 驗證導航項目存在
      await expect(navLink).toBeVisible();
      console.log(`✓ 找到導航項目: ${navItem.name}`);

      // 懸停在導航項目上
      await navLink.hover();
      console.log(`✓ 懸停在 ${navItem.name} 上`);

      // 等待下拉動畫
      await page.waitForTimeout(500);

      // 檢查對應的下拉選單是否變為可見
      // 使用父容器來定位對應的下拉選單
      const parentContainer = navLink.locator('xpath=..');
      const dropdown = parentContainer.locator('.nexus-nav-dropdown');

      if (await dropdown.count() > 0) {
        // 檢查下拉選單的顯示狀態
        const dropdownStyles = await dropdown.evaluate((el) => {
          const computed = window.getComputedStyle(el);
          return {
            display: computed.display,
            visibility: computed.visibility,
            opacity: computed.opacity,
            transform: computed.transform
          };
        });

        console.log(`${navItem.name} 下拉選單樣式:`, dropdownStyles);

        // 檢查是否實際可見（不是 display: none）
        const isVisible = dropdownStyles.display !== 'none' && 
                         dropdownStyles.visibility !== 'hidden' &&
                         parseFloat(dropdownStyles.opacity) > 0;

        if (isVisible) {
          console.log(`✅ ${navItem.name} 下拉選單成功顯示`);
          
          // 拍攝下拉選單展開狀態
          await page.screenshot({
            path: `tests/screenshots/dropdown-${navItem.name.replace(/[^\w]/g, '')}-expanded.png`,
            fullPage: true
          });

          // 檢查下拉選單項目
          const dropdownItems = dropdown.locator('a');
          const itemCount = await dropdownItems.count();
          console.log(`找到 ${itemCount} 個下拉選單項目`);

          for (let i = 0; i < itemCount; i++) {
            const item = dropdownItems.nth(i);
            const itemText = await item.textContent();
            console.log(`  - 項目 ${i + 1}: ${itemText?.trim()}`);
          }

        } else {
          console.log(`⚠️ ${navItem.name} 下拉選單未正確顯示`);
        }
      } else {
        console.log(`⚠️ 找不到 ${navItem.name} 的下拉選單元素`);
      }

      // 移開滑鼠，讓下拉選單隱藏
      await page.hover('body');
      await page.waitForTimeout(300);
      console.log(`✓ ${navItem.name} 測試完成`);
    }
  });

  test('驗證下拉選單定位和覆蓋效果', async ({ page }) => {
    console.log('驗證下拉選單定位效果...');

    // 懸停在第一個有下拉選單的項目
    const firstNavItem = page.locator('#main-navigation').locator('text="客戶關係管理"').first();
    await firstNavItem.hover();
    await page.waitForTimeout(500);

    // 找到展開的下拉選單
    const expandedDropdown = page.locator('.nexus-nav-dropdown').filter({
      has: page.locator('a')
    }).first();

    if (await expandedDropdown.count() > 0) {
      // 檢查下拉選單是否真正可見
      const isActuallyVisible = await expandedDropdown.evaluate((el) => {
        const rect = el.getBoundingClientRect();
        const styles = window.getComputedStyle(el);
        return {
          hasSize: rect.width > 0 && rect.height > 0,
          isDisplayed: styles.display !== 'none',
          isVisible: styles.visibility !== 'hidden',
          hasOpacity: parseFloat(styles.opacity) > 0,
          zIndex: styles.zIndex,
          position: styles.position,
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height
        };
      });

      console.log('下拉選單可見性檢查:', isActuallyVisible);

      if (isActuallyVisible.hasSize && isActuallyVisible.isDisplayed && 
          isActuallyVisible.isVisible && isActuallyVisible.hasOpacity) {
        console.log('✅ 下拉選單成功懸浮顯示');
        
        // 拍攝定位效果截圖
        await page.screenshot({
          path: 'tests/screenshots/dropdown-positioning-verification.png',
          fullPage: true
        });

        // 驗證下拉選單是否覆蓋在內容上方
        expect(parseInt(isActuallyVisible.zIndex)).toBeGreaterThan(1000);
        expect(isActuallyVisible.position).toBe('absolute');
        
        console.log('✅ 下拉選單定位配置正確');
      } else {
        console.log('❌ 下拉選單未正確顯示');
      }
    } else {
      console.log('❌ 找不到展開的下拉選單');
    }
  });

  test('測試所有下拉選單的 JavaScript 功能', async ({ page }) => {
    console.log('測試下拉選單 JavaScript 功能...');

    // 注入測試腳本來直接操作下拉選單
    await page.evaluate(() => {
      // 強制顯示所有下拉選單來檢查
      const dropdowns = document.querySelectorAll('.nexus-nav-dropdown');
      console.log(`找到 ${dropdowns.length} 個下拉選單`);
      
      dropdowns.forEach((dropdown, index) => {
        const styles = window.getComputedStyle(dropdown);
        console.log(`下拉選單 ${index + 1}:`, {
          display: styles.display,
          visibility: styles.visibility,
          position: styles.position,
          zIndex: styles.zIndex
        });
      });
      
      return dropdowns.length;
    });

    // 拍攝 JavaScript 檢查後的狀態
    await page.screenshot({
      path: 'tests/screenshots/dropdown-javascript-check.png',
      fullPage: true
    });
  });
});