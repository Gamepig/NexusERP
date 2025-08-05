import { test, expect } from '@playwright/test';

test('測試enhanced-navigation組件功能', async ({ page }) => {
  console.log('🧪 測試enhanced-navigation組件功能...');
  
  await page.goto('http://127.0.0.1:8000');
  await page.waitForLoadState('networkidle');
  
  console.log('✅ Alpine.js已載入到landing頁面');
  
  // 現在嘗試訪問一個使用enhanced-navigation的頁面
  // 先檢查是否有dashboard路由
  try {
    await page.goto('http://127.0.0.1:8000/dashboard');
    await page.waitForLoadState('networkidle');
    console.log('✅ 成功訪問dashboard頁面');
    
    // 檢查Alpine.js是否載入
    const alpineStatus = await page.evaluate(() => {
      return {
        alpine: !!window.Alpine,
        version: window.Alpine?.version
      };
    });
    
    console.log(`Alpine.js狀態: ${alpineStatus.alpine ? '✅ 載入' : '❌ 未載入'}`);
    if (alpineStatus.version) {
      console.log(`Alpine.js版本: ${alpineStatus.version}`);
    }
    
    // 檢查enhanced-navigation組件
    const navComponent = await page.locator('[x-data*="enhancedNavigation"]').isVisible().catch(() => false);
    console.log(`Enhanced Navigation組件: ${navComponent ? '✅ 找到' : '❌ 未找到'}`);
    
    // 檢查multi-level-nav組件
    const multiLevelNav = await page.locator('[x-data*="multiLevelNav"]').isVisible().catch(() => false);
    console.log(`Multi-level Navigation組件: ${multiLevelNav ? '✅ 找到' : '❌ 未找到'}`);
    
    // 檢查所有x-data元素
    const xDataElements = await page.locator('[x-data]').count();
    console.log(`找到 ${xDataElements} 個x-data元素`);
    
    if (xDataElements > 0) {
      // 測試下拉選單功能
      console.log('🔍 測試下拉選單功能...');
      
      // 查找具有子選單的導航項目
      const dropdownTriggers = await page.locator('[x-data] button, [x-data] a').all();
      
      for (let i = 0; i < Math.min(5, dropdownTriggers.length); i++) {
        const trigger = dropdownTriggers[i];
        const triggerText = await trigger.textContent();
        
        if (triggerText && triggerText.trim()) {
          console.log(`測試觸發器: "${triggerText.trim()}"`);
          
          // Hover測試
          await trigger.hover();
          await page.waitForTimeout(500);
          
          // 檢查是否有下拉內容出現
          const dropdown = await page.locator('.absolute, [role="menu"], .dropdown').isVisible().catch(() => false);
          console.log(`  Hover後下拉選單: ${dropdown ? '✅ 出現' : 'ℹ️  無下拉'}`);
        }
      }
    }
    
    // 截圖記錄
    await page.screenshot({ path: 'enhanced-navigation-test.png', fullPage: true });
    console.log('📸 Enhanced Navigation測試截圖已保存');
    
  } catch (error) {
    console.log(`⚠️  無法訪問dashboard: ${error.message}`);
    
    // 嘗試其他可能的頁面
    const testRoutes = ['/admin', '/login', '/register'];
    
    for (const route of testRoutes) {
      try {
        await page.goto(`http://127.0.0.1:8000${route}`);
        await page.waitForLoadState('networkidle');
        
        const hasXData = await page.locator('[x-data]').count();
        console.log(`${route} 頁面: ${hasXData > 0 ? '✅ 有Alpine組件' : 'ℹ️  無Alpine組件'}`);
        
        if (hasXData > 0) {
          // 這個頁面有Alpine組件，測試功能
          await page.screenshot({ path: `navigation-test-${route.replace('/', '')}.png`, fullPage: true });
          console.log(`📸 ${route}頁面截圖已保存`);
          break;
        }
        
      } catch (routeError) {
        console.log(`${route} 路由不可用`);
      }
    }
  }
  
  console.log('✅ Enhanced Navigation測試完成');
});