import { test, expect } from '@playwright/test';

test.describe('手動下拉選單檢查', () => {
  test('手動檢查下拉選單狀態', async ({ page }) => {
    // 登入
    await page.goto('http://127.0.0.1:8000/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    await page.waitForLoadState('networkidle');

    console.log('🔍 開始手動檢查下拉選單...');

    // 拍攝初始狀態
    await page.screenshot({
      path: 'tests/screenshots/manual-dropdown-initial.png',
      fullPage: true
    });

    // 手動懸停在每個導航項目上並停留更長時間
    const navItems = ['客戶關係管理', '產品與庫存', '採購管理', '銷售管理', '分析與報表'];

    for (const navText of navItems) {
      console.log(`\n📍 測試 "${navText}"...`);

      // 找到導航項目並懸停
      const navElement = page.getByText(navText, { exact: true }).first();
      
      try {
        await navElement.hover();
        console.log(`✓ 成功懸停在 "${navText}"`);
        
        // 等待更長時間讓動畫完成
        await page.waitForTimeout(1000);

        // 拍攝懸停狀態
        await page.screenshot({
          path: `tests/screenshots/manual-dropdown-${navText.replace(/[^\w]/g, '')}.png`,
          fullPage: true
        });

        // 檢查頁面上所有可見的下拉選單
        const visibleDropdowns = await page.evaluate(() => {
          const dropdowns = Array.from(document.querySelectorAll('.nexus-nav-dropdown'));
          return dropdowns.map((dropdown, index) => {
            const rect = dropdown.getBoundingClientRect();
            const styles = window.getComputedStyle(dropdown);
            const isVisible = styles.display !== 'none' && 
                            styles.visibility !== 'hidden' && 
                            parseFloat(styles.opacity) > 0 &&
                            rect.width > 0 && rect.height > 0;
            
            return {
              index: index,
              isVisible: isVisible,
              display: styles.display,
              visibility: styles.visibility,
              opacity: styles.opacity,
              width: rect.width,
              height: rect.height,
              top: rect.top,
              left: rect.left,
              innerHTML: dropdown.innerHTML.substring(0, 100) + '...'
            };
          });
        });

        console.log(`找到 ${visibleDropdowns.length} 個下拉選單:`);
        visibleDropdowns.forEach((dropdown, i) => {
          console.log(`  下拉選單 ${i + 1}: ${dropdown.isVisible ? '✅ 可見' : '❌ 隐藏'} (${dropdown.display}, ${dropdown.visibility}, opacity: ${dropdown.opacity})`);
          if (dropdown.isVisible) {
            console.log(`    位置: (${dropdown.left}, ${dropdown.top}) 尺寸: ${dropdown.width}x${dropdown.height}`);
          }
        });

        // 檢查是否有可見的下拉選單
        const hasVisibleDropdown = visibleDropdowns.some(d => d.isVisible);
        if (hasVisibleDropdown) {
          console.log(`🎉 "${navText}" 下拉選單成功顯示！`);
        } else {
          console.log(`⚠️ "${navText}" 下拉選單未顯示`);
        }

      } catch (error) {
        console.log(`❌ "${navText}" 測試失敗:`, error.message);
      }

      // 移開滑鼠到安全位置
      await page.hover('h1');
      await page.waitForTimeout(500);
    }

    // 最終截圖
    await page.screenshot({
      path: 'tests/screenshots/manual-dropdown-final.png',
      fullPage: true
    });

    console.log('\n✅ 手動檢查完成！請查看截圖檔案以確認下拉選單效果。');
  });
});