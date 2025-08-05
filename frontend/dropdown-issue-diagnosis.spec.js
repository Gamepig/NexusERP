import { test, expect } from '@playwright/test';

test.describe('NexusERP Dropdown Menu Issue Diagnosis', () => {
  test('檢查下拉選單文字排列問題', async ({ page }) => {
    console.log('=== 開始下拉選單問題診斷 ===');
    
    // 1. 開啟首頁
    console.log('1. 開啟 NexusERP 首頁');
    await page.goto('http://127.0.0.1:8000');
    await page.waitForLoadState('networkidle');
    
    // 截圖：初始狀態
    await page.screenshot({ 
      path: '/Users/gamepig/projects/NexusERP/frontend/dropdown-diagnosis-01-initial.png', 
      fullPage: true 
    });
    
    // 2. 等待登入頁面加載並登入
    console.log('2. 等待並填寫登入表單');
    try {
      await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 5000 });
      await page.fill('input[type="email"], input[name="email"]', 'test@example.com');
      await page.fill('input[type="password"], input[name="password"]', 'password123');
      await page.click('button[type="submit"], .btn-primary');
      
      // 等待登入完成
      await page.waitForSelector('.main-header', { timeout: 10000 });
      console.log('✅ 登入成功');
    } catch (error) {
      console.log('ℹ️ 可能已經登入或直接在主頁面');
    }
    
    // 截圖：登入後狀態
    await page.screenshot({ 
      path: '/Users/gamepig/projects/NexusERP/frontend/dropdown-diagnosis-02-after-login.png', 
      fullPage: true 
    });
    
    // 3. 檢查主導航選單元素
    console.log('3. 檢查主導航選單元素');
    const navItems = await page.locator('.nav-item').all();
    console.log(`找到 ${navItems.length} 個導航項目`);
    
    // 4. 逐個測試下拉選單
    const dropdownItems = [
      { selector: 'li:has-text("客戶關係管理")', name: '客戶關係管理' },
      { selector: 'li:has-text("產品與庫存")', name: '產品與庫存' },
      { selector: 'li:has-text("採購管理")', name: '採購管理' },
      { selector: 'li:has-text("銷售管理")', name: '銷售管理' },
      { selector: 'li:has-text("財務會計")', name: '財務會計' },
      { selector: 'li:has-text("分析與報表")', name: '分析與報表' }
    ];
    
    for (let i = 0; i < dropdownItems.length; i++) {
      const item = dropdownItems[i];
      console.log(`\n=== 測試 ${item.name} 下拉選單 ===`);
      
      try {
        // 尋找下拉選單項目
        const dropdown = page.locator(item.selector).first();
        
        if (await dropdown.isVisible()) {
          console.log(`✅ 找到 ${item.name} 選單項目`);
          
          // 懸停觸發下拉選單
          await dropdown.hover();
          await page.waitForTimeout(500); // 等待動畫
          
          // 截圖：下拉選單展開狀態
          await page.screenshot({ 
            path: `/Users/gamepig/projects/NexusERP/frontend/dropdown-diagnosis-${i+3}-${item.name}.png`, 
            fullPage: true 
          });
          
          // 檢查下拉選單內容
          const dropdownMenu = dropdown.locator('.dropdown-menu, .sub-menu');
          if (await dropdownMenu.isVisible()) {
            const menuItems = await dropdownMenu.locator('li, a').all();
            console.log(`📋 ${item.name} 下拉選單包含 ${menuItems.length} 個子項目`);
            
            // 檢查文字方向和CSS樣式
            const menuStyle = await dropdownMenu.evaluate((element) => {
              const computed = window.getComputedStyle(element);
              return {
                writingMode: computed.writingMode,
                textOrientation: computed.textOrientation,
                direction: computed.direction,
                flexDirection: computed.flexDirection,
                display: computed.display
              };
            });
            
            console.log(`🎨 ${item.name} CSS 樣式:`, menuStyle);
            
            // 檢查是否有垂直文字問題
            if (menuStyle.writingMode !== 'horizontal-tb' || 
                menuStyle.textOrientation === 'upright' ||
                menuStyle.flexDirection === 'column') {
              console.log(`🚨 發現潛在的垂直文字問題於 ${item.name}`);
            }
          } else {
            console.log(`⚠️ ${item.name} 下拉選單未顯示`);
          }
          
          // 移開滑鼠避免干擾下一個測試
          await page.hover('body', { position: { x: 100, y: 100 } });
          await page.waitForTimeout(300);
        } else {
          console.log(`❌ 未找到 ${item.name} 選單項目`);
        }
      } catch (error) {
        console.log(`❌ 測試 ${item.name} 時發生錯誤:`, error.message);
      }
    }
    
    // 5. 檢查頁面整體 CSS
    console.log('\n=== 檢查頁面整體 CSS 設定 ===');
    const bodyStyle = await page.evaluate(() => {
      const body = document.body;
      const computed = window.getComputedStyle(body);
      return {
        writingMode: computed.writingMode,
        textOrientation: computed.textOrientation,
        direction: computed.direction,
        lang: body.lang || document.documentElement.lang
      };
    });
    
    console.log('🌐 頁面整體樣式:', bodyStyle);
    
    // 6. 檢查是否有相關的 CSS 錯誤
    const cssErrors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error' && msg.text().includes('CSS')) {
        cssErrors.push(msg.text());
      }
    });
    
    // 最終截圖
    await page.screenshot({ 
      path: '/Users/gamepig/projects/NexusERP/frontend/dropdown-diagnosis-final.png', 
      fullPage: true 
    });
    
    console.log('\n=== 診斷完成 ===');
    console.log(`📊 總共檢查了 ${dropdownItems.length} 個下拉選單`);
    if (cssErrors.length > 0) {
      console.log('🚨 發現 CSS 錯誤:', cssErrors);
    }
    
    // 產生診斷報告
    const report = {
      timestamp: new Date().toISOString(),
      dropdownCount: dropdownItems.length,
      cssErrors: cssErrors,
      bodyStyle: bodyStyle,
      summary: '下拉選單診斷完成，請檢查截圖和控制台輸出'
    };
    
    console.log('\n📋 診斷報告:', JSON.stringify(report, null, 2));
  });
});