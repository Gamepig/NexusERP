import { test, expect } from '@playwright/test';

test.describe('手動檢查下拉選單問題', () => {
  test('逐一檢查每個下拉選單的文字排列', async ({ page }) => {
    console.log('=== 手動下拉選單檢查開始 ===');
    
    // 1. 直接導航到儀表板
    await page.goto('http://127.0.0.1:8000/dashboard');
    await page.waitForTimeout(2000);
    
    // 如果需要登入，先登入
    if (page.url().includes('login')) {
      await page.waitForSelector('input[name="email"]');
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(3000);
    }
    
    // 2. 等待頁面完全加載
    await page.waitForSelector('.main-header, nav', { timeout: 10000 });
    
    // 截圖：初始狀態
    await page.screenshot({ 
      path: '/Users/gamepig/projects/NexusERP/frontend/manual-inspect-01-initial.png', 
      fullPage: true 
    });
    
    // 3. 定義要測試的下拉選單
    const dropdownTests = [
      {
        name: '客戶關係管理',
        trigger: 'text=客戶關係管理',
        description: 'CRM 模組'
      },
      {
        name: '產品與庫存',
        trigger: 'text=產品與庫存',
        description: '產品和庫存管理'
      },
      {
        name: '採購管理',
        trigger: 'text=採購管理',
        description: '採購相關功能'
      },
      {
        name: '銷售管理',
        trigger: 'text=銷售管理',
        description: '銷售相關功能'
      },
      {
        name: '分析與報表',
        trigger: 'text=分析與報表',
        description: '報表分析功能'
      }
    ];
    
    // 4. 逐一測試每個下拉選單
    for (let i = 0; i < dropdownTests.length; i++) {
      const testItem = dropdownTests[i];
      console.log(`\n=== 測試 ${testItem.name} ===`);
      
      try {
        // 尋找觸發元素
        const trigger = page.locator(testItem.trigger).first();
        
        if (await trigger.count() > 0) {
          console.log(`✅ 找到觸發器: ${testItem.name}`);
          
          // 懸停觸發下拉選單
          await trigger.hover();
          await page.waitForTimeout(800); // 給足夠時間讓動畫完成
          
          // 截圖：下拉選單展開狀態
          await page.screenshot({ 
            path: `/Users/gamepig/projects/NexusERP/frontend/manual-inspect-${i+2}-${testItem.name}.png`, 
            fullPage: true 
          });
          
          // 檢查下拉選單是否出現
          const dropdownMenu = page.locator('.dropdown-menu, .sub-menu, [class*="dropdown"]').first();
          
          if (await dropdownMenu.isVisible()) {
            console.log(`🎯 下拉選單已展開`);
            
            // 分析下拉選單的 CSS 樣式
            const menuStyles = await dropdownMenu.evaluate((element) => {
              const computed = window.getComputedStyle(element);
              const rect = element.getBoundingClientRect();
              
              return {
                writingMode: computed.writingMode,
                textOrientation: computed.textOrientation,
                direction: computed.direction,
                flexDirection: computed.flexDirection,
                display: computed.display,
                position: computed.position,
                width: rect.width,
                height: rect.height,
                className: element.className
              };
            });
            
            console.log(`📊 ${testItem.name} CSS 樣式:`, menuStyles);
            
            // 檢查下拉選單內的項目
            const menuItems = await dropdownMenu.locator('a, li, .menu-item, [class*="item"]').all();
            console.log(`📋 找到 ${menuItems.length} 個選單項目`);
            
            // 分析前3個項目的文字內容和樣式
            for (let j = 0; j < Math.min(menuItems.length, 3); j++) {
              const item = menuItems[j];
              const itemText = await item.textContent();
              
              const itemStyles = await item.evaluate((el) => {
                const computed = window.getComputedStyle(el);
                return {
                  writingMode: computed.writingMode,
                  textOrientation: computed.textOrientation,
                  direction: computed.direction,
                  fontSize: computed.fontSize,
                  lineHeight: computed.lineHeight
                };
              });
              
              console.log(`  項目 ${j + 1}: "${itemText?.trim()}" | 樣式:`, itemStyles);
            }
            
            // 檢查是否有垂直文字問題的特徵
            if (menuStyles.writingMode !== 'horizontal-tb' || 
                menuStyles.textOrientation === 'upright' ||
                menuStyles.direction === 'rtl') {
              console.log(`🚨 發현潛在的文字排列問題於 ${testItem.name}:`);
              console.log(`   - writingMode: ${menuStyles.writingMode}`);
              console.log(`   - textOrientation: ${menuStyles.textOrientation}`);
              console.log(`   - direction: ${menuStyles.direction}`);
            } else {
              console.log(`✅ ${testItem.name} 文字排列正常`);
            }
            
          } else {
            console.log(`⚠️ ${testItem.name} 下拉選單未展開`);
          }
          
          // 移開滑鼠，關閉下拉選單
          await page.hover('body', { position: { x: 100, y: 100 } });
          await page.waitForTimeout(500);
          
        } else {
          console.log(`❌ 未找到 ${testItem.name} 觸發器`);
        }
        
      } catch (error) {
        console.log(`❌ 測試 ${testItem.name} 時發生錯誤:`, error.message);
      }
    }
    
    // 5. 生成最終分析報告
    console.log('\n=== 生成分析報告 ===');
    
    const finalAnalysis = await page.evaluate(() => {
      // 檢查頁面中所有下拉相關元素
      const dropdowns = Array.from(document.querySelectorAll('[class*="dropdown"], .sub-menu, .nav-item'));
      
      return {
        totalDropdowns: dropdowns.length,
        hasAlpineJS: !!window.Alpine,
        hasBootstrap: !!window.bootstrap,
        hasTailwind: document.querySelector('script[src*="tailwind"]') !== null,
        bodyLang: document.body.lang || document.documentElement.lang,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        }
      };
    });
    
    console.log('📊 最終分析:', finalAnalysis);
    
    // 最終截圖
    await page.screenshot({ 
      path: '/Users/gamepig/projects/NexusERP/frontend/manual-inspect-final-report.png', 
      fullPage: true 
    });
    
    console.log('\n=== 手動檢查完成 ===');
    console.log('請檢查生成的截圖檔案以了解實際的下拉選單狀態');
  });
});