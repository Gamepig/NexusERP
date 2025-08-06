/**
 * JavaScript 語法錯誤精確定位測試
 * 專門找出 "Unexpected token ','" 錯誤的確切位置
 */

import { chromium } from 'playwright';

async function testJavaScriptSyntax() {
  console.log('🔍 開始 JavaScript 語法錯誤精確定位...');
  
  const browser = await chromium.launch({ 
    headless: false, 
    slowMo: 300
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    ignoreHTTPSErrors: true
  });
  
  const page = await context.newPage();
  
  // 詳細監控 JavaScript 錯誤
  const jsErrors = [];
  
  page.on('pageerror', error => {
    const jsError = {
      name: error.name,
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    };
    jsErrors.push(jsError);
    
    console.log(`\n[JS ERROR DETECTED]`);
    console.log(`名稱: ${error.name}`);
    console.log(`訊息: ${error.message}`);
    console.log(`堆疊追蹤:`);
    if (error.stack) {
      error.stack.split('\n').forEach((line, index) => {
        console.log(`  ${index + 1}: ${line}`);
      });
    }
  });
  
  // 監控控制台錯誤
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`[Console ERROR] ${msg.text()}`);
      const location = msg.location();
      if (location) {
        console.log(`  位置: ${location.url}:${location.lineNumber}:${location.columnNumber}`);
      }
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
    
    // 清空錯誤記錄
    jsErrors.length = 0;
    
    // 導航到編輯頁面
    console.log('\n🌐 導航到編輯頁面...');
    await page.goto('http://127.0.0.1:8000/orders/sales/7268/edit');
    
    // 等待頁面完全載入
    await page.waitForTimeout(5000);
    
    // 分析錯誤
    console.log('\n🔍 語法錯誤分析:');
    
    if (jsErrors.length > 0) {
      console.log(`發現 ${jsErrors.length} 個 JavaScript 錯誤`);
      
      jsErrors.forEach((error, index) => {
        console.log(`\n--- 錯誤 ${index + 1} ---`);
        console.log(`類型: ${error.name}`);
        console.log(`訊息: ${error.message}`);
        
        if (error.stack) {
          // 解析堆疊追蹤尋找具體行號
          const stackLines = error.stack.split('\n');
          stackLines.forEach((line, lineIndex) => {
            if (line.includes('orders/sales/7268/edit') || line.includes('localhost:8000')) {
              console.log(`  ► 相關行 ${lineIndex + 1}: ${line.trim()}`);
            }
          });
        }
      });
      
      // 嘗試獲取頁面內聯 JavaScript 內容進行分析
      console.log('\n📝 分析內聯 JavaScript...');
      
      const inlineScript = await page.evaluate(() => {
        const scripts = Array.from(document.querySelectorAll('script'));
        const inlineScripts = scripts.filter(script => !script.src);
        
        if (inlineScripts.length > 0) {
          const script = inlineScripts[inlineScripts.length - 1]; // 獲取最後一個內聯腳本
          return script.textContent;
        }
        return null;
      });
      
      if (inlineScript) {
        console.log('找到內聯 JavaScript 腳本');
        
        // 檢查關鍵部分的語法
        const lines = inlineScript.split('\n');
        let foundIssue = false;
        
        lines.forEach((line, index) => {
          const lineNum = index + 1;
          
          // 檢查可能的語法問題
          if (line.includes('customers =') || 
              line.includes('products =') || 
              line.includes('orderItems =') ||
              line.includes('salesOrder =')) {
            
            console.log(`第 ${lineNum} 行: ${line.trim()}`);
            
            // 檢查 JSON 語法
            if (line.includes('= [') || line.includes('= {')) {
              // 檢查是否有多餘的逗號
              if (line.includes(',,') || line.endsWith(',]') || line.endsWith(',}')) {
                console.log(`  ⚠️ 可能的語法問題: 多餘逗號`);
                foundIssue = true;
              }
            }
          }
          
          // 檢查其他語法問題
          if (line.includes(',,') || line.match(/,\s*[}\]]/) || line.match(/[{\[]\s*,/)) {
            console.log(`第 ${lineNum} 行有語法問題: ${line.trim()}`);
            foundIssue = true;
          }
        });
        
        if (!foundIssue) {
          console.log('未在顯示的行中發現明顯語法問題');
          
          // 顯示包含 JSON 數據的關鍵行
          console.log('\n關鍵數據行:');
          lines.forEach((line, index) => {
            if (line.includes('@json') || 
                line.includes('customers =') || 
                line.includes('products =') ||
                (line.includes('[{') && line.length > 100)) {
              console.log(`第 ${index + 1} 行: ${line.slice(0, 200)}...`);
            }
          });
        }
      }
      
    } else {
      console.log('✅ 未發現 JavaScript 錯誤');
    }
    
    // 嘗試手動執行 JavaScript 檢查
    console.log('\n🧪 手動 JavaScript 檢查...');
    
    try {
      const jsCheck = await page.evaluate(() => {
        const checks = {};
        
        // 檢查基本變數
        checks.customersType = typeof customers;
        checks.productsType = typeof products;
        checks.modeValue = typeof mode !== 'undefined' ? mode : 'undefined';
        checks.orderIdValue = typeof orderId !== 'undefined' ? orderId : 'undefined';
        
        // 檢查函數是否存在
        checks.initializePageExists = typeof initializePage === 'function';
        checks.addItemExists = typeof addItem === 'function';
        
        return checks;
      });
      
      console.log('JavaScript 變數和函數檢查:');
      Object.entries(jsCheck).forEach(([key, value]) => {
        console.log(`  ${key}: ${value}`);
      });
      
    } catch (evalError) {
      console.log(`JavaScript 評估失敗: ${evalError.message}`);
    }
    
  } catch (error) {
    console.error('\n❌ 測試過程中發生錯誤:', error.message);
  } finally {
    await browser.close();
    console.log('\n✅ JavaScript 語法錯誤定位完成');
  }
}

// 執行測試
testJavaScriptSyntax().catch(console.error);