const { test, expect } = require('@playwright/test');

/**
 * Orders UI 排版驗證測試
 * 檢查頁面實際的視覺效果和樣式
 */

const BASE_URL = 'http://127.0.0.1:8000';

async function loginAndTest(page) {
  // 登錄
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2000);
}

async function validatePageLayout(page, url, pageName) {
  console.log(`\n🔍 檢查頁面: ${pageName} (${url})`);
  
  await page.goto(`${BASE_URL}${url}`);
  await page.waitForTimeout(2000);
  
  // 截圖保存
  await page.screenshot({ path: `test-results/${pageName.replace(/\s+/g, '-').toLowerCase()}.png`, fullPage: true });
  
  // 檢查基本佈局元素
  const issues = [];
  
  try {
    // 檢查是否有標題
    const title = await page.locator('h1').first();
    if (await title.count() === 0) {
      issues.push('❌ 缺少主標題 (h1)');
    } else {
      console.log(`  ✅ 主標題: ${await title.textContent()}`);
    }
    
    // 檢查是否有導航按鈕
    const buttons = await page.locator('.nexus-btn, .btn, button').count();
    if (buttons === 0) {
      issues.push('❌ 沒有找到任何按鈕');
    } else {
      console.log(`  ✅ 找到 ${buttons} 個按鈕`);
    }
    
    // 檢查表格是否存在且有內容
    const tables = await page.locator('table').count();
    if (tables > 0) {
      const rows = await page.locator('table tbody tr').count();
      if (rows === 0) {
        issues.push('❌ 表格存在但沒有數據行');
      } else {
        console.log(`  ✅ 表格有 ${rows} 行數據`);
      }
    }
    
    // 檢查 CSS 樣式是否載入
    const hasNexusStyles = await page.evaluate(() => {
      const styles = Array.from(document.styleSheets);
      return styles.some(sheet => {
        try {
          const rules = Array.from(sheet.cssRules || sheet.rules || []);
          return rules.some(rule => rule.selectorText && rule.selectorText.includes('nexus'));
        } catch (e) {
          return false;
        }
      });
    });
    
    if (!hasNexusStyles) {
      // 檢查是否有 nexus 相關的 class
      const nexusElements = await page.locator('[class*="nexus"]').count();
      if (nexusElements === 0) {
        issues.push('❌ 沒有找到 Nexus 樣式類別');
      } else {
        console.log(`  ⚠️ 找到 ${nexusElements} 個 Nexus 元素，但 CSS 可能未載入`);
      }
    } else {
      console.log('  ✅ Nexus 樣式已載入');
    }
    
    // 檢查錯誤訊息
    const errorMessages = await page.locator('.error, .alert-danger, .nexus-error').count();
    if (errorMessages > 0) {
      issues.push(`❌ 頁面有 ${errorMessages} 個錯誤訊息`);
    }
    
    // 檢查是否有空白內容區域
    const contentAreas = await page.locator('.nexus-card-body, .card-body, main').count();
    if (contentAreas === 0) {
      issues.push('❌ 沒有找到內容區域');
    }
    
    // 檢查是否有佈局問題 (重疊元素等)
    const overlappingElements = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      let overlaps = 0;
      for (let i = 0; i < elements.length - 1; i++) {
        const rect1 = elements[i].getBoundingClientRect();
        if (rect1.width === 0 || rect1.height === 0) continue;
        
        for (let j = i + 1; j < elements.length; j++) {
          const rect2 = elements[j].getBoundingClientRect();
          if (rect2.width === 0 || rect2.height === 0) continue;
          
          // 簡單的重疊檢測
          if (rect1.left < rect2.right && rect2.left < rect1.right &&
              rect1.top < rect2.bottom && rect2.top < rect1.bottom) {
            overlaps++;
            if (overlaps > 50) break; // 避免檢查太多
          }
        }
        if (overlaps > 50) break;
      }
      return overlaps;
    });
    
    if (overlappingElements > 20) {
      issues.push(`⚠️ 可能有佈局重疊問題 (${overlappingElements} 個重疊)`);
    }
    
  } catch (error) {
    issues.push(`❌ 檢查過程發生錯誤: ${error.message}`);
  }
  
  // 輸出結果
  if (issues.length === 0) {
    console.log(`  🎉 ${pageName} 頁面佈局正常！`);
    return true;
  } else {
    console.log(`  💥 ${pageName} 頁面有問題:`);
    issues.forEach(issue => console.log(`    ${issue}`));
    return false;
  }
}

async function runUIValidation() {
  console.log('🚀 開始 Orders UI 排版驗證...');
  
  const browser = await require('playwright').chromium.launch({ 
    headless: false,
    slowMo: 500
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();
  
  // 建立截圖目錄
  const fs = require('fs');
  if (!fs.existsSync('test-results')) {
    fs.mkdirSync('test-results');
  }
  
  try {
    await loginAndTest(page);
    
    const testPages = [
      { url: '/orders/sales', name: 'Sales Orders Index' },
      { url: '/orders/sales/create', name: 'Create Sales Order' },
      { url: '/orders/sales/1', name: 'Sales Order Detail' },
      { url: '/orders/purchase', name: 'Purchase Orders Index' },
      { url: '/orders/purchase/create', name: 'Create Purchase Order' },
      { url: '/orders/purchase/1', name: 'Purchase Order Detail' },
      { url: '/quotes', name: 'Quotes Index' },
      { url: '/quotes/1', name: 'Quote Detail' }
    ];
    
    let passedPages = 0;
    const failedPages = [];
    
    for (const testPage of testPages) {
      const passed = await validatePageLayout(page, testPage.url, testPage.name);
      if (passed) {
        passedPages++;
      } else {
        failedPages.push(testPage.name);
      }
      await page.waitForTimeout(1000);
    }
    
    console.log('\n📊 UI 驗證結果摘要:');
    console.log('==================');
    console.log(`✅ 通過: ${passedPages}/${testPages.length} 頁面`);
    
    if (failedPages.length > 0) {
      console.log(`❌ 失敗頁面: ${failedPages.join(', ')}`);
      console.log('\n💡 建議檢查:');
      console.log('1. CSS 樣式檔案是否正確載入');
      console.log('2. Nexus 主題樣式是否配置正確');
      console.log('3. 檢查截圖檔案了解具體問題');
    } else {
      console.log('🎉 所有頁面佈局都正常！');
    }
    
    console.log('\n📸 截圖已保存到 test-results/ 目錄');
    console.log('⏳ 10秒後關閉瀏覽器...');
    await page.waitForTimeout(10000);
    
  } catch (error) {
    console.error('💥 UI 驗證過程發生錯誤:', error);
  } finally {
    await browser.close();
  }
}

// 執行 UI 驗證
runUIValidation().catch(console.error);