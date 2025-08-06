/**
 * JavaScript 錯誤調試腳本
 * 定位和分析 "Unexpected token ','" 錯誤
 */

import { chromium } from 'playwright';

async function debugJavaScriptError() {
  console.log('🔍 開始 JavaScript 錯誤調試...');
  
  const browser = await chromium.launch({ 
    headless: false, 
    slowMo: 300
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    ignoreHTTPSErrors: true
  });
  
  const page = await context.newPage();
  
  // 收集所有控制台訊息和錯誤
  const allMessages = [];
  const jsErrors = [];
  
  page.on('console', msg => {
    const message = {
      type: msg.type(),
      text: msg.text(),
      location: msg.location(),
      timestamp: new Date().toISOString()
    };
    allMessages.push(message);
    console.log(`[Console ${msg.type().toUpperCase()}] ${msg.text()}`);
    
    if (msg.location() && (msg.location().url || msg.location().lineNumber)) {
      console.log(`  位置: ${msg.location().url || 'unknown'}:${msg.location().lineNumber || 0}:${msg.location().columnNumber || 0}`);
    }
  });
  
  page.on('pageerror', error => {
    const jsError = {
      message: error.message,
      stack: error.stack,
      name: error.name,
      timestamp: new Date().toISOString()
    };
    jsErrors.push(jsError);
    console.log(`[JS ERROR] ${error.name}: ${error.message}`);
    if (error.stack) {
      console.log(`[STACK] ${error.stack}`);
    }
  });
  
  // 監控網路請求，特別是 JavaScript 檔案
  page.on('response', response => {
    const url = response.url();
    if (url.includes('.js') || url.includes('javascript')) {
      console.log(`[JS RESPONSE] ${response.status()} ${url}`);
    }
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
    
    // 清空之前的錯誤記錄，專注於編輯頁面的錯誤
    jsErrors.length = 0;
    allMessages.length = 0;
    
    // 導航到編輯頁面
    console.log('\n🌐 導航到編輯頁面...');
    await page.goto('http://127.0.0.1:8000/orders/sales/7268/edit');
    await page.waitForTimeout(8000);
    
    // 分析錯誤
    console.log('\n🐛 錯誤分析:');
    console.log(`JavaScript 錯誤數量: ${jsErrors.length}`);
    console.log(`控制台訊息數量: ${allMessages.length}`);
    
    if (jsErrors.length > 0) {
      console.log('\n=== JavaScript 錯誤詳情 ===');
      jsErrors.forEach((error, index) => {
        console.log(`\n錯誤 ${index + 1}:`);
        console.log(`  名稱: ${error.name}`);
        console.log(`  訊息: ${error.message}`);
        if (error.stack) {
          console.log(`  堆疊追蹤:`);
          error.stack.split('\n').forEach(line => {
            if (line.trim()) {
              console.log(`    ${line.trim()}`);
            }
          });
        }
      });
    }
    
    // 檢查頁面中的內聯 JavaScript
    console.log('\n📜 檢查內聯 JavaScript...');
    
    const scriptContents = await page.evaluate(() => {
      const scripts = Array.from(document.querySelectorAll('script'));
      return scripts.map((script, index) => ({
        index,
        src: script.src || 'inline',
        content: script.src ? null : script.textContent?.slice(0, 500) + '...',
        hasContent: !script.src && script.textContent && script.textContent.length > 0
      }));
    });
    
    console.log(`找到 ${scriptContents.length} 個 script 標籤:`);
    scriptContents.forEach(script => {
      console.log(`  Script ${script.index}: ${script.src}`);
      if (script.hasContent) {
        console.log(`    內容預覽: ${script.content}`);
      }
    });
    
    // 嘗試執行 JavaScript 代碼檢查語法
    console.log('\n🔍 檢查 JavaScript 語法...');
    
    try {
      const jsVarCheck = await page.evaluate(() => {
        // 檢查關鍵變數
        const vars = {};
        try { vars.customers = typeof customers !== 'undefined' ? customers.length : 'undefined'; } catch(e) { vars.customers = 'error'; }
        try { vars.products = typeof products !== 'undefined' ? products.length : 'undefined'; } catch(e) { vars.products = 'error'; }
        try { vars.orderData = typeof orderData !== 'undefined' ? 'defined' : 'undefined'; } catch(e) { vars.orderData = 'error'; }
        
        return vars;
      });
      
      console.log('JavaScript 變數檢查:');
      Object.entries(jsVarCheck).forEach(([key, value]) => {
        console.log(`  ${key}: ${value}`);
      });
      
    } catch (evalError) {
      console.log(`JavaScript 評估錯誤: ${evalError.message}`);
    }
    
    // 檢查頁面是否已完全載入
    console.log('\n📄 頁面載入狀態檢查...');
    
    const pageState = await page.evaluate(() => ({
      readyState: document.readyState,
      title: document.title,
      url: location.href,
      hasCustomerSelect: !!document.getElementById('customer_id'),
      hasItemsList: !!document.getElementById('itemsList'),
      hasAddItemBtn: !!document.getElementById('addItemBtn'),
      itemsListContent: document.getElementById('itemsList')?.innerHTML?.length || 0
    }));
    
    console.log('頁面狀態:');
    Object.entries(pageState).forEach(([key, value]) => {
      console.log(`  ${key}: ${value}`);
    });
    
    // 嘗試手動觸發 JavaScript 函數
    console.log('\n🔧 嘗試手動觸發功能...');
    
    try {
      const manualTrigger = await page.evaluate(() => {
        const results = {};
        
        // 檢查函數是否存在
        results.addItemExists = typeof addItem === 'function';
        results.populateServerDataExists = typeof populateServerData === 'function';
        results.loadProductsExists = typeof loadProducts === 'function';
        
        // 嘗試調用函數
        if (typeof populateServerData === 'function') {
          try {
            populateServerData();
            results.populateServerDataCall = 'success';
          } catch (e) {
            results.populateServerDataCall = e.message;
          }
        }
        
        return results;
      });
      
      console.log('手動觸發結果:');
      Object.entries(manualTrigger).forEach(([key, value]) => {
        console.log(`  ${key}: ${value}`);
      });
      
    } catch (triggerError) {
      console.log(`手動觸發錯誤: ${triggerError.message}`);
    }
    
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'screenshots/js-debug-final.png', fullPage: true });
    
    // 最終建議
    console.log('\n💡 修復建議:');
    
    if (jsErrors.some(err => err.message.includes('Unexpected token'))) {
      console.log('1. ✅ 確認發現語法錯誤 - "Unexpected token"');
      console.log('2. 🔧 建議檢查頁面中的 JavaScript 代碼語法');
      console.log('3. 🔍 特別注意 JSON 數據的格式，可能有多餘的逗號');
      console.log('4. 📝 查看錯誤堆疊追蹤定位具體位置');
    }
    
    if (allMessages.some(msg => msg.text.includes('產品') || msg.text.includes('customer'))) {
      console.log('5. ✅ 數據載入邏輯存在，問題可能在語法錯誤阻止執行');
    }
    
    console.log('6. 🚀 修復語法錯誤後，產品下拉選單應該能正常工作');
    
  } catch (error) {
    console.error('\n❌ 調試過程中發生錯誤:', error.message);
  } finally {
    await browser.close();
    console.log('\n✅ JavaScript 錯誤調試完成');
  }
}

// 執行調試
debugJavaScriptError().catch(console.error);