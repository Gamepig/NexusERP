// 調試下拉選單可見性測試
import { test, expect } from '@playwright/test';

test('🐛 調試下拉選單可見性 - 強化樣式測試', async ({ page }) => {
  const screenshotDir = './screenshots';
  
  console.log('🐛 開始調試下拉選單可見性問題...');
  
  // 登入系統
  await page.goto('http://127.0.0.1:8000/login');
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');
  await page.waitForLoadState('networkidle');
  
  console.log('✅ 成功登入到 Dashboard');
  
  // 等待導航載入
  await page.waitForSelector('.nexus-multi-nav', { timeout: 5000 });
  
  // 拍攝初始狀態 - 檢查是否有紅色下拉選單框
  await page.screenshot({ 
    path: `${screenshotDir}/debug-01-initial-with-debug-styles.png`,
    fullPage: true 
  });
  
  console.log('📸 已拍攝初始狀態（應該能看到紅色調試框）');
  
  // 檢查頁面上是否有 .nexus-nav-dropdown 元素
  const dropdownElements = await page.$$('.nexus-nav-dropdown');
  console.log(`🔍 找到 ${dropdownElements.length} 個 .nexus-nav-dropdown 元素`);
  
  // 檢查這些元素的計算樣式
  for (let i = 0; i < dropdownElements.length; i++) {
    const styles = await page.evaluate((element) => {
      const computed = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return {
        display: computed.display,
        visibility: computed.visibility,
        opacity: computed.opacity,
        backgroundColor: computed.backgroundColor,
        borderColor: computed.borderColor,
        zIndex: computed.zIndex,
        position: computed.position,
        top: computed.top,
        left: computed.left,
        width: computed.width,
        height: computed.height,
        boundingRect: {
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
          visible: rect.width > 0 && rect.height > 0
        }
      };
    }, dropdownElements[i]);
    
    console.log(`📊 下拉選單 ${i + 1} 調試樣式:`, styles);
  }
  
  // 測試每個導航項目的懸停
  const navButtons = await page.$$('.nexus-multi-nav button');
  console.log(`🔘 找到 ${navButtons.length} 個導航按鈕`);
  
  for (let i = 0; i < Math.min(navButtons.length, 6); i++) {
    const button = navButtons[i];
    const buttonText = await button.textContent();
    
    console.log(`\n🖱️ 測試按鈕 ${i + 1}: "${buttonText?.trim()}"`);
    
    // 懸停前檢查紅色框的數量
    const beforeHover = await page.$$eval('.nexus-nav-dropdown', dropdowns => 
      dropdowns.filter(d => {
        const style = getComputedStyle(d);
        const rect = d.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 && style.backgroundColor.includes('220, 38, 38');
      }).length
    );
    
    console.log(`📊 懸停前可見紅色框數量: ${beforeHover}`);
    
    // 懸停
    await button.hover();
    await page.waitForTimeout(1000);
    
    // 懸停後檢查紅色框的數量
    const afterHover = await page.$$eval('.nexus-nav-dropdown', dropdowns => 
      dropdowns.filter(d => {
        const style = getComputedStyle(d);
        const rect = d.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 && style.backgroundColor.includes('220, 38, 38');
      }).length
    );
    
    console.log(`📊 懸停後可見紅色框數量: ${afterHover}`);
    
    // 拍攝懸停狀態
    await page.screenshot({ 
      path: `${screenshotDir}/debug-${String(i + 2).padStart(2, '0')}-hover-${buttonText?.trim().replace(/[^a-zA-Z0-9\u4e00-\u9fff]/g, '') || 'unknown'}.png`,
      fullPage: true 
    });
    
    // 移開滑鼠
    await page.mouse.move(50, 50);
    await page.waitForTimeout(500);
  }
  
  // 最終檢查 - 使用開發者工具查看 DOM 結構
  const domStructure = await page.evaluate(() => {
    const navContainer = document.querySelector('.nexus-multi-nav');
    if (!navContainer) return { error: '找不到導航容器' };
    
    const dropdowns = navContainer.querySelectorAll('.nexus-nav-dropdown');
    return {
      navContainer: navContainer.tagName + '.' + navContainer.className,
      dropdownCount: dropdowns.length,
      dropdowns: Array.from(dropdowns).map((dropdown, index) => ({
        index,
        html: dropdown.outerHTML.substring(0, 200) + '...',
        parentTag: dropdown.parentElement?.tagName,
        parentClass: dropdown.parentElement?.className
      }))
    };
  });
  
  console.log('🔍 DOM 結構分析:', JSON.stringify(domStructure, null, 2));
  
  console.log('\n✅ 調試測試完成');
  console.log('📋 總結:');
  console.log('   - 如果看到紅色框，說明下拉選單元素存在但之前被隱藏');
  console.log('   - 如果沒有紅色框，說明下拉選單元素根本不存在或有結構問題');
  console.log('   - 如果紅色框位置不對，說明是定位問題');
});