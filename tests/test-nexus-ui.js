import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testNexusERP() {
  console.log('🚀 開始 NexusERP 全面功能測試驗證...\n');
  
  const browser = await chromium.launch({ 
    headless: false, 
    slowMo: 1000,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
  });
  
  const page = await context.newPage();
  
  try {
    // 1. 核心修復驗證
    console.log('📋 1. 核心修復驗證');
    console.log('   導航到 http://127.0.0.1:8000');
    
    await page.goto('http://127.0.0.1:8000', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    // 截圖首頁
    await page.screenshot({ 
      path: 'screenshots/01-homepage.png', 
      fullPage: true 
    });
    console.log('   ✅ 首頁截圖已保存');
    
    // 檢查登入頁面
    const loginForm = await page.locator('form').first();
    if (await loginForm.isVisible()) {
      console.log('   📝 需要登入，開始登入流程');
      
      // 填寫登入信息
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'password123');
      
      await page.screenshot({ 
        path: 'screenshots/02-login-form.png', 
        fullPage: true 
      });
      console.log('   ✅ 登入表單截圖已保存');
      
      // 提交登入
      await page.click('button[type="submit"]');
      await page.waitForURL('**/dashboard**', { timeout: 10000 });
      await page.waitForTimeout(3000);
    }
    
    // 截圖主儀表板
    await page.screenshot({ 
      path: 'screenshots/03-dashboard.png', 
      fullPage: true 
    });
    console.log('   ✅ 主儀表板截圖已保存');
    
    // 2. 導航測試
    console.log('\n📋 2. 使用者體驗測試');
    
    // 檢查左側導航
    const sidebar = page.locator('.sidebar, .nav-sidebar, [class*="sidebar"]').first();
    if (await sidebar.isVisible()) {
      console.log('   ✅ 左側導航可見');
      
      // 測試導航項目
      const navItems = page.locator('.sidebar a, .nav-link, [class*="nav"] a');
      const navCount = await navItems.count();
      console.log(`   📊 找到 ${navCount} 個導航項目`);
      
      // 檢查垂直文字問題
      const navTexts = await navItems.allTextContents();
      const hasVerticalText = navTexts.some(text => 
        text.includes('\n') || text.length < 3
      );
      
      if (!hasVerticalText) {
        console.log('   ✅ 導航文字顯示正常，無垂直顯示問題');
      } else {
        console.log('   ⚠️  檢測到可能的垂直文字問題');
      }
    }
    
    // 檢查使用者下拉選單
    const userDropdown = page.locator('.dropdown-toggle, .user-menu, [class*="user"]').first();
    if (await userDropdown.isVisible()) {
      console.log('   👤 測試使用者下拉選單');
      await userDropdown.click();
      await page.waitForTimeout(1000);
      
      await page.screenshot({ 
        path: 'screenshots/04-user-dropdown.png', 
        fullPage: true 
      });
      console.log('   ✅ 使用者下拉選單截圖已保存');
    }
    
    // 3. 視覺一致性檢查
    console.log('\n📋 3. 視覺一致性檢查');
    
    // 檢查色彩主題
    const bodyStyles = await page.locator('body').getAttribute('style');
    const hasCustomTheme = bodyStyles && bodyStyles.includes('background');
    console.log(`   🎨 主題檢查: ${hasCustomTheme ? '自定義主題已應用' : '使用預設主題'}`);
    
    // 4. 響應式測試
    console.log('\n📋 4. 響應式設計測試');
    
    // 測試不同視窗大小
    const viewports = [
      { name: 'Desktop', width: 1920, height: 1080 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Mobile', width: 375, height: 667 }
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.waitForTimeout(1000);
      
      await page.screenshot({ 
        path: `screenshots/05-responsive-${viewport.name.toLowerCase()}.png`, 
        fullPage: true 
      });
      console.log(`   ✅ ${viewport.name} 響應式截圖已保存`);
    }
    
    // 恢復桌面視窗大小
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    // 5. 功能完整性測試
    console.log('\n📋 5. 功能完整性測試');
    
    // 測試主要頁面導航
    const mainPages = [
      { name: '庫存管理', selector: 'a[href*="inventory"], a[href*="stock"]' },
      { name: '報價管理', selector: 'a[href*="quote"], a[href*="quotation"]' },
      { name: '報表', selector: 'a[href*="report"], a[href*="analytics"]' }
    ];
    
    for (const pageInfo of mainPages) {
      const link = page.locator(pageInfo.selector).first();
      if (await link.isVisible()) {
        console.log(`   🔗 測試 ${pageInfo.name} 頁面`);
        await link.click();
        await page.waitForTimeout(2000);
        
        await page.screenshot({ 
          path: `screenshots/06-page-${pageInfo.name.replace(/\s+/g, '-').toLowerCase()}.png`, 
          fullPage: true 
        });
        console.log(`   ✅ ${pageInfo.name} 頁面截圖已保存`);
      }
    }
    
    // 最終全頁面截圖
    await page.screenshot({ 
      path: 'screenshots/07-final-state.png', 
      fullPage: true 
    });
    console.log('   ✅ 最終狀態截圖已保存');
    
    console.log('\n🎉 測試完成！請檢查 screenshots/ 目錄中的截圖');
    
  } catch (error) {
    console.error('❌ 測試過程中發生錯誤:', error.message);
    
    // 錯誤截圖
    await page.screenshot({ 
      path: 'screenshots/error-state.png', 
      fullPage: true 
    });
    console.log('   ✅ 錯誤狀態截圖已保存');
  } finally {
    await browser.close();
  }
}

// 確保截圖目錄存在
const screenshotsDir = path.join(__dirname, 'screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

// 執行測試
testNexusERP().catch(console.error);