import { test, expect } from '@playwright/test';

test('模擬登入測試Dashboard導航功能', async ({ page }) => {
  console.log('🔓 模擬登入測試Dashboard導航功能...');
  
  // 第1步：訪問登入頁面
  console.log('\n=== 第1步：訪問登入頁面 ===');
  await page.goto('http://127.0.0.1:8000/login');
  await page.waitForLoadState('networkidle');
  
  // 檢查登入表單
  const hasLoginForm = await page.locator('form').isVisible();
  console.log(`登入表單可見: ${hasLoginForm}`);
  
  if (!hasLoginForm) {
    console.log('❌ 沒有找到登入表單，無法進行認證測試');
    return;
  }
  
  // 第2步：嘗試查找測試帳號或社群登入
  console.log('\n=== 第2步：檢查登入選項 ===');
  
  // 檢查是否有Google登入
  const hasGoogleLogin = await page.locator('text*="Google", [href*="google"]').isVisible().catch(() => false);
  console.log(`Google登入選項: ${hasGoogleLogin ? '存在' : '不存在'}`);
  
  // 檢查是否有LINE登入
  const hasLineLogin = await page.locator('text*="LINE", [href*="line"]').isVisible().catch(() => false);
  console.log(`LINE登入選項: ${hasLineLogin ? '存在' : '不存在'}`);
  
  // 檢查表單欄位
  const emailField = page.locator('input[type="email"], input[name="email"]');
  const passwordField = page.locator('input[type="password"], input[name="password"]');
  const hasEmailField = await emailField.isVisible();
  const hasPasswordField = await passwordField.isVisible();
  
  console.log(`郵箱欄位: ${hasEmailField ? '存在' : '不存在'}`);
  console.log(`密碼欄位: ${hasPasswordField ? '存在' : '不存在'}`);
  
  // 第3步：嘗試使用測試帳號登入
  if (hasEmailField && hasPasswordField) {
    console.log('\n=== 第3步：嘗試測試帳號登入 ===');
    
    try {
      // 嘗試常見的測試帳號
      const testAccounts = [
        { email: 'test@example.com', password: 'password' },
        { email: 'test@test.com', password: 'password' },
        { email: 'admin@nexuserp.com', password: 'password' },
        { email: 'demo@demo.com', password: 'demo123' }
      ];
      
      for (const account of testAccounts) {
        console.log(`嘗試帳號: ${account.email}`);
        
        await emailField.fill(account.email);
        await passwordField.fill(account.password);
        
        // 尋找登入按鈕
        const loginButton = page.locator('button[type="submit"], input[type="submit"], button:has-text("登入"), button:has-text("Login")');
        
        if (await loginButton.isVisible()) {
          await loginButton.click();
          await page.waitForTimeout(2000);
          
          // 檢查是否登入成功
          const currentUrl = page.url();
          console.log(`登入後URL: ${currentUrl}`);
          
          if (currentUrl.includes('dashboard') || !currentUrl.includes('login')) {
            console.log('✅ 登入成功！');
            break;
          } else {
            console.log(`❌ 登入失敗，繼續嘗試下一個帳號...`);
            // 清除表單
            await emailField.fill('');
            await passwordField.fill('');
          }
        }
      }
      
    } catch (error) {
      console.log(`登入嘗試錯誤: ${error.message}`);
    }
  }
  
  // 第4步：檢查當前狀態
  console.log('\n=== 第4步：檢查當前頁面狀態 ===');
  
  const currentUrl = page.url();
  const isLoggedIn = !currentUrl.includes('login');
  console.log(`當前URL: ${currentUrl}`);
  console.log(`登入狀態: ${isLoggedIn ? '已登入' : '未登入'}`);
  
  if (isLoggedIn) {
    console.log('\n=== 第5步：測試Dashboard導航功能 ===');
    
    // 等待頁面完全載入
    await page.waitForLoadState('networkidle');
    
    // 檢查Alpine.js
    const alpineStatus = await page.evaluate(() => ({
      alpine: !!window.Alpine,
      version: window.Alpine?.version
    }));
    console.log('Alpine.js狀態:', alpineStatus);
    
    // 檢查enhanced-navigation組件
    const navInfo = await page.evaluate(() => ({
      enhancedNavElements: document.querySelectorAll('[x-data*="enhancedNavigation"]').length,
      multiLevelNavElements: document.querySelectorAll('[x-data*="multiLevelNav"]').length,
      totalXDataElements: document.querySelectorAll('[x-data]').length,
      navElements: document.querySelectorAll('nav').length
    }));
    
    console.log('導航組件狀態:', navInfo);
    
    if (navInfo.enhancedNavElements > 0) {
      console.log('✅ Enhanced Navigation組件存在，測試下拉功能...');
      
      // 測試下拉選單
      const dropdownTriggers = await page.locator('[x-data] button, [x-data] a').all();
      
      for (let i = 0; i < Math.min(3, dropdownTriggers.length); i++) {
        const trigger = dropdownTriggers[i];
        const triggerText = await trigger.textContent();
        
        if (triggerText && triggerText.trim()) {
          console.log(`測試下拉觸發器: "${triggerText.trim()}"`);
          
          await trigger.hover();
          await page.waitForTimeout(500);
          
          const hasDropdown = await page.locator('.absolute, [role="menu"], .dropdown').isVisible().catch(() => false);
          console.log(`  下拉選單: ${hasDropdown ? '✅ 正常顯示' : '❌ 未顯示'}`);
        }
      }
      
      // 截圖已登入的dashboard
      await page.screenshot({ path: 'authenticated-dashboard.png', fullPage: true });
      console.log('📸 已認證Dashboard截圖已保存');
      
    } else {
      console.log('❌ Enhanced Navigation組件不存在');
      
      // 檢查是否有其他錯誤
      const pageErrors = await page.evaluate(() => {
        const errors = [];
        
        // 檢查控制台錯誤
        if (window.console && window.console.error) {
          // 這裡無法直接獲取控制台錯誤，但可以檢查其他狀態
        }
        
        // 檢查Alpine是否初始化
        if (!window.Alpine) {
          errors.push('Alpine.js 未載入');
        }
        
        // 檢查CSS變數
        const style = getComputedStyle(document.documentElement);
        if (!style.getPropertyValue('--nexus-primary-500')) {
          errors.push('Nexus CSS變數未載入');
        }
        
        return errors;
      });
      
      console.log('頁面錯誤檢查:', pageErrors);
    }
    
  } else {
    console.log('❌ 無法登入，無法測試Dashboard導航功能');
    console.log('建議：');
    console.log('1. 檢查是否有有效的測試帳號');
    console.log('2. 檢查登入功能是否正常');
    console.log('3. 考慮暫時停用認證中介軟體來測試導航組件');
  }
  
  console.log('\n=== 測試完成 ===');
});