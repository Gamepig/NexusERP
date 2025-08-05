import { test, expect } from '@playwright/test';

test.describe('NexusERP 銷售報表子頁面測試', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(60000);
    
    // 登入流程
    await page.goto('http://127.0.0.1:8000/login');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
  });

  test('測試銷售報表所有子頁面', async ({ page }) => {
    console.log('=== 開始銷售報表子頁面測試 ===');
    
    // 測試路徑列表
    const reportPages = [
      { 
        path: '/reports/sales',
        name: '銷售報表主頁',
        shouldHaveElements: ['銷售總覽', '產品銷售分析', '客戶銷售分析', '銷售趨勢']
      },
      { 
        path: '/reports/sales/summary',
        name: '銷售總覽',
        shouldHaveElements: ['銷售總覽']
      },
      { 
        path: '/reports/sales/by-product',
        name: '產品銷售分析',
        shouldHaveElements: ['產品銷售分析']
      },
      { 
        path: '/reports/sales/by-customer',
        name: '客戶銷售分析',
        shouldHaveElements: ['客戶銷售分析']
      },
      { 
        path: '/reports/sales/trends',
        name: '銷售趨勢',
        shouldHaveElements: ['銷售趨勢']
      }
    ];
    
    for (const reportPage of reportPages) {
      console.log(`\n--- 測試 ${reportPage.name} (${reportPage.path}) ---`);
      
      try {
        // 導航到頁面
        await page.goto(`http://127.0.0.1:8000${reportPage.path}`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(3000);
        
        // 檢查是否成功載入
        const currentUrl = page.url();
        console.log(`當前 URL: ${currentUrl}`);
        
        // 檢查錯誤狀態
        const has500Error = await page.locator('text=500').count() > 0;
        const has404Error = await page.locator('text=404').count() > 0;
        const hasServerError = await page.locator('text=Server Error').count() > 0;
        
        if (has500Error || has404Error || hasServerError) {
          console.log(`❌ ${reportPage.name} 載入失敗 - 發現錯誤頁面`);
          await page.screenshot({ 
            path: `screenshots/subpage-error-${reportPage.path.replace(/\//g, '-')}.png`, 
            fullPage: true 
          });
        } else {
          console.log(`✅ ${reportPage.name} 載入成功`);
          
          // 檢查特定元素
          let foundElements = 0;
          for (const element of reportPage.shouldHaveElements) {
            const count = await page.locator(`text=${element}`).count();
            if (count > 0) {
              foundElements++;
              console.log(`  ✅ 找到元素: ${element}`);
            } else {
              console.log(`  ⚠️ 未找到元素: ${element}`);
            }
          }
          
          console.log(`  📊 元素檢查: ${foundElements}/${reportPage.shouldHaveElements.length} 個元素找到`);
          
          // 截圖記錄
          await page.screenshot({ 
            path: `screenshots/subpage-success-${reportPage.path.replace(/\//g, '-')}.png`, 
            fullPage: true 
          });
        }
        
      } catch (error) {
        console.log(`❌ ${reportPage.name} 測試失敗: ${error.message}`);
        await page.screenshot({ 
          path: `screenshots/subpage-error-${reportPage.path.replace(/\//g, '-')}.png`, 
          fullPage: true 
        });
      }
    }
    
    console.log('\n=== 銷售報表子頁面測試完成 ===');
  });

  test('測試銷售報表功能點擊', async ({ page }) => {
    console.log('=== 開始銷售報表功能點擊測試 ===');
    
    // 先導航到銷售報表主頁
    await page.goto('http://127.0.0.1:8000/reports/sales');
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ path: 'screenshots/sales-main-before-clicks.png', fullPage: true });
    
    // 測試點擊各個功能卡片
    const functionCards = [
      '銷售總覽',
      '產品銷售分析', 
      '客戶銷售分析',
      '銷售趨勢'
    ];
    
    for (const cardName of functionCards) {
      try {
        console.log(`\n--- 測試點擊 ${cardName} ---`);
        
        // 回到主頁
        await page.goto('http://127.0.0.1:8000/reports/sales');
        await page.waitForLoadState('networkidle');
        
        // 尋找並點擊卡片
        const cardLink = page.locator(`a:has(h4:text("${cardName}"))`);
        
        if (await cardLink.count() > 0) {
          console.log(`  找到 ${cardName} 卡片，準備點擊`);
          
          await cardLink.click();
          await page.waitForLoadState('networkidle');
          await page.waitForTimeout(2000);
          
          const currentUrl = page.url();
          console.log(`  點擊後 URL: ${currentUrl}`);
          
          // 檢查是否有錯誤
          const hasError = await page.locator('text=500, text=404, text=Server Error').count() > 0;
          
          if (hasError) {
            console.log(`  ❌ ${cardName} 點擊後顯示錯誤頁面`);
          } else {
            console.log(`  ✅ ${cardName} 點擊成功`);
          }
          
          // 截圖記錄結果
          await page.screenshot({ 
            path: `screenshots/click-test-${cardName.replace(/\s+/g, '-')}.png`, 
            fullPage: true 
          });
          
        } else {
          console.log(`  ❌ 未找到 ${cardName} 卡片`);
        }
        
      } catch (error) {
        console.log(`  ❌ 點擊 ${cardName} 失敗: ${error.message}`);
      }
    }
    
    console.log('\n=== 銷售報表功能點擊測試完成 ===');
  });
});