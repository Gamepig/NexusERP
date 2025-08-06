import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testInternalPages() {
  console.log('🔐 開始 NexusERP 內部頁面測試...\n');
  
  const browser = await chromium.launch({ 
    headless: false, 
    slowMo: 1000 
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  try {
    // 1. 直接訪問登入頁面
    console.log('📋 1. 嘗試訪問登入頁面');
    await page.goto('http://127.0.0.1:8000/login', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    await page.screenshot({ 
      path: 'screenshots/login-page-direct.png', 
      fullPage: true 
    });
    console.log('   ✅ 登入頁面截圖已保存');
    
    // 2. 嘗試登入
    const emailInput = page.locator('input[name="email"], input[type="email"]').first();
    const passwordInput = page.locator('input[name="password"], input[type="password"]').first();
    const loginButton = page.locator('button[type="submit"], input[type="submit"]').first();
    
    if (await emailInput.isVisible() && await passwordInput.isVisible()) {
      console.log('   📝 填寫登入資訊');
      await emailInput.fill('test@example.com');
      await passwordInput.fill('password123');
      
      await page.screenshot({ 
        path: 'screenshots/login-filled.png', 
        fullPage: true 
      });
      
      await loginButton.click();
      await page.waitForTimeout(3000);
      
      await page.screenshot({ 
        path: 'screenshots/after-login-attempt.png', 
        fullPage: true 
      });
      console.log('   ✅ 登入嘗試完成');
    }
    
    // 3. 嘗試訪問受保護頁面
    const protectedPages = [
      { name: 'Dashboard', url: 'http://127.0.0.1:8000/dashboard' },
      { name: 'Admin', url: 'http://127.0.0.1:8000/admin' },
      { name: 'Home', url: 'http://127.0.0.1:8000/home' },
      { name: 'Inventory', url: 'http://127.0.0.1:8000/inventory' }
    ];
    
    console.log('\n📋 2. 測試受保護頁面訪問');
    for (const pageInfo of protectedPages) {
      try {
        console.log(`   🔗 嘗試訪問 ${pageInfo.name}: ${pageInfo.url}`);
        await page.goto(pageInfo.url, { waitUntil: 'networkidle', timeout: 10000 });
        await page.waitForTimeout(2000);
        
        await page.screenshot({ 
          path: `screenshots/protected-${pageInfo.name.toLowerCase()}.png`, 
          fullPage: true 
        });
        console.log(`   ✅ ${pageInfo.name} 頁面截圖已保存`);
        
        // 檢查是否有導航欄 (表示已登入)
        const hasNavigation = await page.locator('.navbar, .nav, .sidebar, [class*="nav"]').first().isVisible();
        console.log(`   📊 ${pageInfo.name} 導航狀態: ${hasNavigation ? '已顯示' : '未顯示'}`);
        
      } catch (error) {
        console.log(`   ⚠️  ${pageInfo.name} 頁面訪問失敗: ${error.message}`);
      }
    }
    
    // 4. 檢查當前 URL 和頁面標題
    const currentUrl = page.url();
    const pageTitle = await page.title();
    console.log(`\n📊 最終狀態:`);
    console.log(`   URL: ${currentUrl}`);
    console.log(`   標題: ${pageTitle}`);
    
    await page.screenshot({ 
      path: 'screenshots/final-internal-state.png', 
      fullPage: true 
    });
    console.log('   ✅ 最終狀態截圖已保存');
    
    console.log('\n🎉 內部頁面測試完成！');
    
  } catch (error) {
    console.error('❌ 測試過程中發生錯誤:', error.message);
    
    await page.screenshot({ 
      path: 'screenshots/internal-error.png', 
      fullPage: true 
    });
  } finally {
    await browser.close();
  }
}

// 確保截圖目錄存在
const screenshotsDir = path.join(__dirname, 'screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

testInternalPages().catch(console.error);