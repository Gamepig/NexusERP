/**
 * HTML 內容調試腳本
 * 檢查頁面的實際 HTML 內容
 */

import { chromium } from 'playwright';

async function debugHtmlContent() {
  console.log('🔍 開始 HTML 內容調試...');
  
  const browser = await chromium.launch({ 
    headless: false, 
    slowMo: 300
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    ignoreHTTPSErrors: true
  });
  
  const page = await context.newPage();
  
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
    
    // 獲取完整的 HTML 內容
    console.log('\n📄 獲取頁面 HTML 內容...');
    const htmlContent = await page.content();
    
    // 將 HTML 保存到檔案
    const fs = await import('fs');
    fs.writeFileSync('debug_page_content.html', htmlContent);
    console.log('✅ HTML 內容已保存到 debug_page_content.html');
    
    // 分析關鍵部分
    console.log('\n🔍 分析關鍵內容...');
    
    // 檢查是否包含產品相關字詞
    const productKeywords = ['product', '產品', 'item', '項目', 'sku'];
    for (const keyword of productKeywords) {
      const count = (htmlContent.match(new RegExp(keyword, 'gi')) || []).length;
      console.log(`"${keyword}" 出現次數: ${count}`);
    }
    
    // 檢查表單結構
    const formMatch = htmlContent.match(/<form[^>]*>([\s\S]*?)<\/form>/gi);
    if (formMatch) {
      console.log(`\n📋 找到 ${formMatch.length} 個表單`);
      
      formMatch.forEach((form, index) => {
        console.log(`\n--- 表單 ${index + 1} ---`);
        
        // 檢查表單動作
        const actionMatch = form.match(/action=["']([^"']*)["']/);
        if (actionMatch) {
          console.log(`動作: ${actionMatch[1]}`);
        }
        
        // 檢查輸入元素
        const inputMatches = form.match(/<(input|select|textarea)[^>]*>/gi) || [];
        console.log(`輸入元素數量: ${inputMatches.length}`);
        
        // 分析輸入元素
        inputMatches.forEach((input, inputIndex) => {
          const nameMatch = input.match(/name=["']([^"']*)["']/);
          const typeMatch = input.match(/type=["']([^"']*)["']/);
          const idMatch = input.match(/id=["']([^"']*)["']/);
          
          if (nameMatch || idMatch) {
            console.log(`  ${inputIndex + 1}. name="${nameMatch?.[1] || 'none'}" id="${idMatch?.[1] || 'none'}" type="${typeMatch?.[1] || 'unknown'}"`);
          }
        });
      });
    }
    
    // 檢查是否有隱藏的或動態載入的內容
    console.log('\n🔍 檢查動態內容區域...');
    
    // 查找可能的產品容器
    const containerSelectors = [
      '[id*="product"]',
      '[class*="product"]',
      '[id*="item"]', 
      '[class*="item"]',
      '.order-items',
      '.order-details',
      '#order-items',
      '#order-details'
    ];
    
    for (const selector of containerSelectors) {
      try {
        const elements = page.locator(selector);
        const count = await elements.count();
        if (count > 0) {
          console.log(`✅ ${selector}: 找到 ${count} 個容器`);
          
          // 獲取容器內容
          for (let i = 0; i < count; i++) {
            const element = elements.nth(i);
            const text = await element.textContent();
            const innerHTML = await element.innerHTML();
            console.log(`  容器 ${i + 1} 文字: "${text?.slice(0, 100)}..."`);
            console.log(`  容器 ${i + 1} HTML 長度: ${innerHTML.length} 字符`);
          }
        }
      } catch (e) {
        // 靜默忽略錯誤
      }
    }
    
    // 檢查 JavaScript 變數
    console.log('\n🔍 檢查 JavaScript 變數...');
    
    const jsVariables = await page.evaluate(() => {
      const variables = {};
      
      // 檢查常見的全域變數
      if (typeof window.orderData !== 'undefined') {
        variables.orderData = window.orderData;
      }
      
      if (typeof window.productsData !== 'undefined') {
        variables.productsData = window.productsData;
      }
      
      if (typeof window.salesOrderData !== 'undefined') {
        variables.salesOrderData = window.salesOrderData;
      }
      
      return variables;
    });
    
    console.log('JavaScript 變數:');
    for (const [key, value] of Object.entries(jsVariables)) {
      console.log(`  ${key}: ${JSON.stringify(value).slice(0, 200)}...`);
    }
    
    // 檢查網路請求
    console.log('\n🌐 等待可能的網路請求...');
    await page.waitForTimeout(5000);
    
    // 最終截圖
    await page.screenshot({ path: 'screenshots/debug-html-final.png', fullPage: true });
    
  } catch (error) {
    console.error('\n❌ 調試過程中發生錯誤:', error.message);
  } finally {
    await browser.close();
    console.log('\n✅ HTML 內容調試完成');
  }
}

// 執行調試
debugHtmlContent().catch(console.error);