/**
 * 頁面結構調試腳本
 * 用於分析銷售訂單編輯頁面的具體結構
 */

import { chromium } from 'playwright';

async function debugPageStructure() {
  console.log('🔍 開始頁面結構調試...');
  
  const browser = await chromium.launch({ 
    headless: false, 
    slowMo: 500,
    args: ['--start-maximized']
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    ignoreHTTPSErrors: true
  });
  
  const page = await context.newPage();
  
  // 監控所有網路請求
  page.on('request', request => {
    if (request.url().includes('api') || request.url().includes('product')) {
      console.log(`[REQUEST] ${request.method()} ${request.url()}`);
    }
  });
  
  page.on('response', response => {
    if (response.url().includes('api') || response.url().includes('product')) {
      console.log(`[RESPONSE] ${response.status()} ${response.url()}`);
    }
  });
  
  // 監控控制台
  page.on('console', msg => {
    console.log(`[Console ${msg.type().toUpperCase()}] ${msg.text()}`);
  });
  
  page.on('pageerror', error => {
    console.log(`[JS ERROR] ${error.message}`);
  });
  
  try {
    // 登入
    console.log('\n🔐 登入系統...');
    await page.goto('http://127.0.0.1:8000/login');
    await page.waitForTimeout(2000);
    
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    // 導航到編輯頁面
    console.log('\n🌐 導航到編輯頁面...');
    await page.goto('http://127.0.0.1:8000/orders/sales/7268/edit');
    await page.waitForTimeout(8000);
    
    await page.screenshot({ path: 'screenshots/debug-page-loaded.png', fullPage: true });
    
    // 分析頁面結構
    console.log('\n📋 分析頁面結構...');
    
    // 1. 查找所有 select 元素
    console.log('\n--- 所有 SELECT 元素 ---');
    const allSelects = await page.locator('select').allTextContents();
    const selectCount = await page.locator('select').count();
    console.log(`SELECT 元素數量: ${selectCount}`);
    
    for (let i = 0; i < selectCount; i++) {
      try {
        const select = page.locator('select').nth(i);
        const id = await select.getAttribute('id') || 'no-id';
        const name = await select.getAttribute('name') || 'no-name';
        const classes = await select.getAttribute('class') || 'no-class';
        console.log(`SELECT ${i + 1}: id="${id}", name="${name}", class="${classes}"`);
        
        // 獲取選項
        const options = await select.locator('option').allTextContents();
        console.log(`  選項 (前3個): ${JSON.stringify(options.slice(0, 3))}`);
      } catch (e) {
        console.log(`SELECT ${i + 1}: 無法分析 - ${e.message}`);
      }
    }
    
    // 2. 查找所有包含 "product" 的元素
    console.log('\n--- 包含 "product" 的元素 ---');
    const productElements = page.locator('*[name*="product"], *[id*="product"], *[class*="product"]');
    const productCount = await productElements.count();
    console.log(`包含 "product" 的元素數量: ${productCount}`);
    
    for (let i = 0; i < Math.min(productCount, 10); i++) {
      try {
        const element = productElements.nth(i);
        const tagName = await element.evaluate(el => el.tagName.toLowerCase());
        const id = await element.getAttribute('id') || 'no-id';
        const name = await element.getAttribute('name') || 'no-name';
        const classes = await element.getAttribute('class') || 'no-class';
        console.log(`PRODUCT ${i + 1}: <${tagName}> id="${id}", name="${name}", class="${classes}"`);
      } catch (e) {
        console.log(`PRODUCT ${i + 1}: 無法分析 - ${e.message}`);
      }
    }
    
    // 3. 查找表單元素
    console.log('\n--- 表單分析 ---');
    const forms = page.locator('form');
    const formCount = await forms.count();
    console.log(`表單數量: ${formCount}`);
    
    for (let i = 0; i < formCount; i++) {
      try {
        const form = forms.nth(i);
        const action = await form.getAttribute('action') || 'no-action';
        const method = await form.getAttribute('method') || 'no-method';
        console.log(`FORM ${i + 1}: action="${action}", method="${method}"`);
        
        // 表單內的輸入元素
        const inputs = form.locator('input, select, textarea');
        const inputCount = await inputs.count();
        console.log(`  表單內元素數量: ${inputCount}`);
      } catch (e) {
        console.log(`FORM ${i + 1}: 無法分析 - ${e.message}`);
      }
    }
    
    // 4. 檢查頁面標題和內容
    console.log('\n--- 頁面內容分析 ---');
    const title = await page.title();
    const url = page.url();
    console.log(`頁面標題: "${title}"`);
    console.log(`當前 URL: ${url}`);
    
    // 查找可能的錯誤訊息
    const errorMessages = page.locator('.alert, .error, .warning, [class*="error"], [class*="alert"]');
    const errorCount = await errorMessages.count();
    if (errorCount > 0) {
      console.log(`\n發現 ${errorCount} 個可能的錯誤/警告訊息:`);
      for (let i = 0; i < errorCount; i++) {
        try {
          const errorText = await errorMessages.nth(i).textContent();
          console.log(`  錯誤 ${i + 1}: "${errorText}"`);
        } catch (e) {
          console.log(`  錯誤 ${i + 1}: 無法讀取`);
        }
      }
    }
    
    // 5. 檢查是否有動態載入的內容
    console.log('\n--- 動態內容檢查 ---');
    await page.waitForTimeout(3000);
    
    // 再次檢查 select 元素
    const newSelectCount = await page.locator('select').count();
    if (newSelectCount !== selectCount) {
      console.log(`動態載入後 SELECT 元素數量變化: ${selectCount} -> ${newSelectCount}`);
    }
    
    // 檢查是否有載入指示器
    const loadingIndicators = page.locator('.loading, .spinner, [class*="load"], [class*="spin"]');
    const loadingCount = await loadingIndicators.count();
    console.log(`載入指示器數量: ${loadingCount}`);
    
    // 6. 檢查特定的產品相關元素
    console.log('\n--- 產品相關元素深度分析 ---');
    const possibleSelectors = [
      'select[name*="product"]',
      'select[name*="item"]',
      'select[name*="sku"]',
      '.product-select',
      '.item-select', 
      '#product_id',
      '#item_id',
      'select.form-control',
      'select.form-select'
    ];
    
    for (const selector of possibleSelectors) {
      try {
        const elements = page.locator(selector);
        const count = await elements.count();
        if (count > 0) {
          console.log(`✅ ${selector}: 找到 ${count} 個元素`);
          
          // 分析第一個元素
          const firstElement = elements.first();
          const options = await firstElement.locator('option').allTextContents();
          console.log(`  選項數量: ${options.length}`);
          console.log(`  前3個選項: ${JSON.stringify(options.slice(0, 3))}`);
        } else {
          console.log(`❌ ${selector}: 未找到`);
        }
      } catch (e) {
        console.log(`⚠️ ${selector}: 檢查時出錯 - ${e.message}`);
      }
    }
    
    await page.screenshot({ path: 'screenshots/debug-final-analysis.png', fullPage: true });
    
  } catch (error) {
    console.error('\n❌ 調試過程中發生錯誤:', error.message);
    await page.screenshot({ path: 'screenshots/debug-error.png', fullPage: true });
  } finally {
    await browser.close();
    console.log('\n✅ 調試完成');
  }
}

// 執行調試
debugPageStructure().catch(console.error);