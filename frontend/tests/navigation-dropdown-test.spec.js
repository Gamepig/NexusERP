import { test, expect } from '@playwright/test';

test.describe('NexusERP 導航下拉選單修復驗證', () => {
  test.beforeEach(async ({ page }) => {
    // 前往登入頁面
    await page.goto('http://127.0.0.1:8000/login');
    
    // 登入系統
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // 等待導航到 dashboard
    await page.waitForURL('**/dashboard');
    await page.waitForLoadState('networkidle');
  });

  const navigationItems = [
    {
      name: '客戶關係管理',
      selector: 'a:has-text("客戶關係管理")',
      dropdownItems: ['客戶列表', '潛在客戶', '客戶分析']
    },
    {
      name: '產品與庫存',
      selector: 'a:has-text("產品與庫存")',
      dropdownItems: ['產品管理', '庫存管理', '庫存報表']
    },
    {
      name: '採購管理',
      selector: 'a:has-text("採購管理")',
      dropdownItems: ['採購訂單', '供應商管理', '採購報表']
    },
    {
      name: '銷售管理',
      selector: 'a:has-text("銷售管理")',
      dropdownItems: ['銷售訂單', '報價管理', '銷售報表']
    },
    {
      name: '分析與報表',
      selector: 'a:has-text("分析與報表")',
      dropdownItems: ['業績分析', '庫存分析', '財務報表']
    }
  ];

  test('驗證所有導航下拉選單的顯示和定位', async ({ page }) => {
    console.log('開始測試導航下拉選單修復效果...');

    for (const navItem of navigationItems) {
      console.log(`測試 ${navItem.name} 下拉選單...`);

      // 懸停在導航項目上
      await page.hover(navItem.selector);
      
      // 等待下拉選單顯示
      await page.waitForTimeout(300);

      // 檢查下拉選單是否可見
      const dropdown = page.locator('.nexus-nav-dropdown').first();
      await expect(dropdown).toBeVisible();

      // 拍攝下拉選單展開狀態的截圖
      await page.screenshot({
        path: `tests/screenshots/navigation-${navItem.name.replace(/[^\w]/g, '')}-dropdown.png`,
        fullPage: true
      });

      // 驗證下拉選單的 CSS 樣式
      const dropdownStyles = await dropdown.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return {
          position: styles.position,
          zIndex: styles.zIndex,
          display: styles.display,
          backgroundColor: styles.backgroundColor,
          boxShadow: styles.boxShadow
        };
      });

      console.log(`${navItem.name} 下拉選單樣式:`, dropdownStyles);

      // 驗證關鍵樣式屬性
      expect(dropdownStyles.position).toBe('absolute');
      expect(parseInt(dropdownStyles.zIndex)).toBeGreaterThan(1000);
      expect(dropdownStyles.display).not.toBe('none');

      // 檢查下拉選單項目是否存在
      for (const itemText of navItem.dropdownItems) {
        const dropdownItem = dropdown.locator(`a:has-text("${itemText}")`);
        if (await dropdownItem.count() > 0) {
          await expect(dropdownItem).toBeVisible();
          console.log(`✓ 找到下拉選單項目: ${itemText}`);
        } else {
          console.log(`⚠ 未找到預期的下拉選單項目: ${itemText}`);
        }
      }

      // 移開滑鼠，讓下拉選單隱藏
      await page.hover('body');
      await page.waitForTimeout(300);

      console.log(`${navItem.name} 測試完成\n`);
    }
  });

  test('驗證下拉選單的定位和層級效果', async ({ page }) => {
    console.log('測試下拉選單定位和覆蓋效果...');

    // 懸停在第一個導航項目
    const firstNavItem = navigationItems[0];
    await page.hover(firstNavItem.selector);
    await page.waitForTimeout(300);

    const dropdown = page.locator('.nexus-nav-dropdown').first();
    await expect(dropdown).toBeVisible();

    // 獲取下拉選單和導航欄的位置資訊
    const dropdownBox = await dropdown.boundingBox();
    const navBar = page.locator('nav').first();
    const navBarBox = await navBar.boundingBox();

    console.log('下拉選單位置:', dropdownBox);
    console.log('導航欄位置:', navBarBox);

    // 驗證下拉選單是否正確定位在導航欄下方
    if (dropdownBox && navBarBox) {
      expect(dropdownBox.y).toBeGreaterThan(navBarBox.y + navBarBox.height - 10);
      console.log('✓ 下拉選單正確定位在導航欄下方');
    }

    // 拍攝整頁截圖以檢視覆蓋效果
    await page.screenshot({
      path: 'tests/screenshots/navigation-overlay-effect.png',
      fullPage: true
    });

    console.log('定位測試完成');
  });

  test('驗證下拉選單互動功能', async ({ page }) => {
    console.log('測試下拉選單互動功能...');

    // 測試懸停顯示/隱藏
    const testNavItem = navigationItems[1]; // 產品與庫存
    
    // 初始狀態 - 下拉選單應該不可見
    const dropdown = page.locator('.nexus-nav-dropdown');
    
    // 懸停顯示
    await page.hover(testNavItem.selector);
    await page.waitForTimeout(300);
    await expect(dropdown.first()).toBeVisible();
    console.log('✓ 懸停顯示下拉選單正常');

    // 移開隱藏
    await page.hover('body');
    await page.waitForTimeout(500);
    
    // 檢查下拉選單是否隱藏（visibility 或 display）
    const isHidden = await dropdown.first().evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return styles.display === 'none' || styles.visibility === 'hidden';
    });
    
    if (isHidden) {
      console.log('✓ 移開滑鼠隱藏下拉選單正常');
    } else {
      console.log('⚠ 下拉選單可能未正確隱藏');
    }

    console.log('互動功能測試完成');
  });

  test('驗證主題顏色和樣式', async ({ page }) => {
    console.log('測試主題顏色和樣式...');

    await page.hover(navigationItems[0].selector);
    await page.waitForTimeout(300);

    const dropdown = page.locator('.nexus-nav-dropdown').first();
    await expect(dropdown).toBeVisible();

    // 檢查主題相關的 CSS 屬性
    const themeStyles = await dropdown.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return {
        backgroundColor: styles.backgroundColor,
        border: styles.border,
        borderRadius: styles.borderRadius,
        boxShadow: styles.boxShadow,
        color: styles.color
      };
    });

    console.log('下拉選單主題樣式:', themeStyles);

    // 檢查下拉選單項目的樣式
    const dropdownItems = dropdown.locator('a');
    if (await dropdownItems.count() > 0) {
      const itemStyles = await dropdownItems.first().evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return {
          color: styles.color,
          padding: styles.padding,
          textDecoration: styles.textDecoration
        };
      });
      console.log('下拉選單項目樣式:', itemStyles);
    }

    // 拍攝樣式截圖
    await page.screenshot({
      path: 'tests/screenshots/navigation-theme-styles.png',
      fullPage: false
    });

    console.log('主題樣式測試完成');
  });
});