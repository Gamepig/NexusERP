import { test, expect } from '@playwright/test';

test.describe('下拉選單容器修復驗證測試', () => {
  test('測試最後兩個導航項目的下拉選單容器大小', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    console.log('1. 登入系統...');
    
    await page.goto('http://127.0.0.1:8000/login', { waitUntil: 'networkidle' });
    
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"], input[type="submit"], .btn-primary');
    
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    console.log('2. 監聽控制台修復日誌...');
    
    // 監聽控制台日誌
    const consoleLogs = [];
    page.on('console', msg => {
      const text = msg.text();
      consoleLogs.push(`[${msg.type()}] ${text}`);
    });
    
    console.log('3. 測試「分析與報表」下拉選單...');
    
    // 尋找「分析與報表」導航項目
    const reportsNav = await page.locator('text=分析與報表').first();
    const reportsExists = await reportsNav.isVisible().catch(() => false);
    console.log('「分析與報表」導航項目是否存在:', reportsExists);
    
    if (reportsExists) {
      // 點擊前的狀態截圖
      await page.screenshot({ 
        path: '/Users/gamepig/projects/NexusERP/frontend/dropdown-test-before-click.png',
        fullPage: false 
      });
      
      // 點擊「分析與報表」
      await reportsNav.click();
      await page.waitForTimeout(1500);
      
      // 點擊後的狀態截圖
      await page.screenshot({ 
        path: '/Users/gamepig/projects/NexusERP/frontend/dropdown-test-after-click.png',
        fullPage: false 
      });
      
      console.log('4. 檢查下拉選單是否出現...');
      
      // 尋找下拉選單
      const dropdown = await page.locator('.dropdown-menu, .dropdown-content, [role="menu"], .sub-menu').first();
      const dropdownVisible = await dropdown.isVisible().catch(() => false);
      console.log('下拉選單是否可見:', dropdownVisible);
      
      if (dropdownVisible) {
        // 檢查下拉選單尺寸
        const dropdownBox = await dropdown.boundingBox();
        console.log('下拉選單位置和尺寸:', dropdownBox);
        
        // 檢查滾動條
        const scrollInfo = await dropdown.evaluate((element) => {
          return {
            scrollHeight: element.scrollHeight,
            clientHeight: element.clientHeight,
            hasScrollbar: element.scrollHeight > element.clientHeight,
            overflow: window.getComputedStyle(element).overflow,
            overflowY: window.getComputedStyle(element).overflowY
          };
        });
        console.log('下拉選單滾動資訊:', scrollInfo);
        
        // 檢查下拉選單項目
        const dropdownItems = await dropdown.locator('a, li, [role="menuitem"]').all();
        console.log('下拉選單項目數量:', dropdownItems.length);
        
        // 列出前5個項目
        for (let i = 0; i < Math.min(5, dropdownItems.length); i++) {
          const itemText = await dropdownItems[i].textContent();
          console.log(`項目 ${i + 1}:`, itemText?.trim());
        }
      }
    }
    
    console.log('5. 測試「訂單管理」下拉選單...');
    
    // 點擊其他地方關閉之前的下拉選單
    await page.click('body');
    await page.waitForTimeout(500);
    
    // 尋找「訂單管理」導航項目
    const ordersNav = await page.locator('text=訂單管理').first();
    const ordersExists = await ordersNav.isVisible().catch(() => false);
    console.log('「訂單管理」導航項目是否存在:', ordersExists);
    
    if (ordersExists) {
      await ordersNav.click();
      await page.waitForTimeout(1500);
      
      const ordersDropdown = await page.locator('.dropdown-menu, .dropdown-content, [role="menu"], .sub-menu').last();
      const ordersDropdownVisible = await ordersDropdown.isVisible().catch(() => false);
      console.log('訂單管理下拉選單是否可見:', ordersDropdownVisible);
      
      if (ordersDropdownVisible) {
        const ordersScrollInfo = await ordersDropdown.evaluate((element) => {
          return {
            scrollHeight: element.scrollHeight,
            clientHeight: element.clientHeight,
            hasScrollbar: element.scrollHeight > element.clientHeight
          };
        });
        console.log('訂單管理下拉選單滾動資訊:', ordersScrollInfo);
      }
    }
    
    console.log('6. 檢查修復日誌...');
    
    // 等待可能的延遲執行的修復腳本
    await page.waitForTimeout(2000);
    
    // 過濾相關日誌
    const relevantLogs = consoleLogs.filter(log => 
      log.includes('容器') || 
      log.includes('修復') || 
      log.includes('dropdown') || 
      log.includes('navigation') ||
      log.includes('scroll') ||
      log.includes('fix')
    );
    
    console.log('相關控制台日誌:');
    relevantLogs.forEach(log => console.log('  ', log));
    
    if (relevantLogs.length === 0) {
      console.log('  沒有發現修復相關的控制台日誌');
    }
    
    console.log('7. 最終狀態截圖...');
    
    await page.screenshot({ 
      path: '/Users/gamepig/projects/NexusERP/frontend/dropdown-container-final-test.png',
      fullPage: true 
    });
    
    console.log('下拉選單容器修復驗證測試完成！');
  });
});