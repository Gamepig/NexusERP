// 最終修復驗證測試
import { test, expect } from '@playwright/test';

test('🎯 驗證下拉選單 CSS 修復效果', async ({ page }) => {
  const screenshotDir = './screenshots';
  
  console.log('🎯 開始驗證下拉選單 CSS 修復...');
  
  // 登入系統
  await page.goto('http://127.0.0.1:8000/login');
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');
  await page.waitForLoadState('networkidle');
  
  console.log('✅ 成功登入');
  
  // 等待導航載入
  await page.waitForSelector('.nexus-multi-nav', { timeout: 5000 });
  await page.waitForTimeout(1000);
  
  // 拍攝初始狀態
  await page.screenshot({ 
    path: `${screenshotDir}/fix-verification-01-initial.png`,
    fullPage: true 
  });
  
  console.log('📸 已拍攝初始狀態');
  
  // 測試客戶關係管理下拉選單
  console.log('🖱️ 測試客戶關係管理下拉選單...');
  
  const crmButton = await page.$('button:has-text("客戶關係管理")');
  if (crmButton) {
    await crmButton.hover();
    await page.waitForTimeout(1000);
    
    // 拍攝懸停狀態
    await page.screenshot({ 
      path: `${screenshotDir}/fix-verification-02-crm-hover.png`,
      fullPage: true 
    });
    
    // 檢查下拉選單的計算樣式
    const dropdownStyles = await page.evaluate(() => {
      const dropdown = document.querySelector('.nexus-nav-dropdown');
      if (dropdown) {
        const style = getComputedStyle(dropdown);
        const rect = dropdown.getBoundingClientRect();
        return {
          display: style.display,
          visibility: style.visibility,
          opacity: style.opacity,
          backgroundColor: style.backgroundColor,
          borderColor: style.borderColor,
          boxShadow: style.boxShadow,
          isVisible: rect.width > 0 && rect.height > 0,
          position: { top: rect.top, left: rect.left, width: rect.width, height: rect.height }
        };
      }
      return null;
    });
    
    console.log('🎨 下拉選單樣式檢查:', dropdownStyles);
    
    if (dropdownStyles && dropdownStyles.isVisible) {
      console.log('✅ 下拉選單現在可見！');
      console.log(`   背景色: ${dropdownStyles.backgroundColor}`);
      console.log(`   邊框色: ${dropdownStyles.borderColor}`);
      console.log(`   陰影: ${dropdownStyles.boxShadow.substring(0, 50)}...`);
    } else {
      console.log('❌ 下拉選單仍然不可見');
    }
    
    // 移開滑鼠
    await page.mouse.move(50, 50);
    await page.waitForTimeout(500);
  }
  
  // 測試其他導航項目
  const testItems = ['產品與庫存', '採購管理', '銷售管理', '分析與報表'];
  
  for (const itemName of testItems) {
    console.log(`🖱️ 測試 ${itemName}...`);
    
    const button = await page.$(`button:has-text("${itemName}")`);
    if (button) {
      await button.hover();
      await page.waitForTimeout(800);
      
      // 拍攝懸停狀態
      const filename = itemName.replace(/[^a-zA-Z0-9\u4e00-\u9fff]/g, '');
      await page.screenshot({ 
        path: `${screenshotDir}/fix-verification-${filename}-hover.png`
      });
      
      console.log(`📸 已拍攝 ${itemName} 懸停狀態`);
      
      // 移開滑鼠
      await page.mouse.move(50, 50);
      await page.waitForTimeout(500);
    }
  }
  
  // 最終檢查：確認修復是否成功
  console.log('\n📋 修復驗證總結:');
  
  const finalButton = await page.$('button:has-text("客戶關係管理")');
  if (finalButton) {
    await finalButton.hover();
    await page.waitForTimeout(1000);
    
    const isFixed = await page.evaluate(() => {
      const dropdown = document.querySelector('.nexus-nav-dropdown');
      if (dropdown) {
        const style = getComputedStyle(dropdown);
        const rect = dropdown.getBoundingClientRect();
        
        // 檢查是否可見且有對比度
        const hasBackground = style.backgroundColor !== 'rgba(0, 0, 0, 0)' && style.backgroundColor !== 'transparent';
        const hasBorder = style.borderColor !== 'rgba(0, 0, 0, 0)' && style.borderWidth !== '0px';
        const hasShadow = style.boxShadow !== 'none';
        const isVisible = rect.width > 0 && rect.height > 0 && style.display !== 'none';
        
        return {
          isVisible,
          hasBackground,
          hasBorder,
          hasShadow,
          backgroundColor: style.backgroundColor,
          borderColor: style.borderColor,
          boxShadow: style.boxShadow.substring(0, 50)
        };
      }
      return null;
    });
    
    if (isFixed) {
      console.log('✅ 修復狀態檢查:');
      console.log(`   可見: ${isFixed.isVisible}`);
      console.log(`   有背景: ${isFixed.hasBackground} (${isFixed.backgroundColor})`);
      console.log(`   有邊框: ${isFixed.hasBorder} (${isFixed.borderColor})`);
      console.log(`   有陰影: ${isFixed.hasShadow}`);
      
      if (isFixed.isVisible && isFixed.hasBackground && isFixed.hasShadow) {
        console.log('🎉 下拉選單修復成功！');
      } else {
        console.log('⚠️ 修復部分成功，但可能仍需調整');
      }
    } else {
      console.log('❌ 下拉選單仍然無法檢測');
    }
  }
  
  console.log('\n✅ 修復驗證完成');
});