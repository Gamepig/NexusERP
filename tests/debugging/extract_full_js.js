/**
 * 提取完整的內聯 JavaScript 代碼
 * 找出語法錯誤的確切位置
 */

import { chromium } from 'playwright';
import fs from 'fs';

async function extractFullJavaScript() {
  console.log('🔍 提取完整 JavaScript 代碼...');
  
  const browser = await chromium.launch({ 
    headless: false, 
    slowMo: 100
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
    await page.waitForTimeout(3000);
    
    // 提取內聯 JavaScript
    console.log('\n📜 提取內聯 JavaScript...');
    
    const jsContent = await page.evaluate(() => {
      const scripts = Array.from(document.querySelectorAll('script'));
      const inlineScripts = scripts.filter(script => !script.src);
      
      if (inlineScripts.length > 0) {
        // 獲取最大的內聯腳本
        const mainScript = inlineScripts.reduce((largest, current) => {
          return current.textContent.length > largest.textContent.length ? current : largest;
        });
        
        return mainScript.textContent;
      }
      return null;
    });
    
    if (jsContent) {
      // 保存到檔案
      fs.writeFileSync('extracted_javascript.js', jsContent);
      console.log('✅ JavaScript 代碼已保存到 extracted_javascript.js');
      
      // 分析語法錯誤
      console.log('\n🔍 分析語法問題...');
      
      const lines = jsContent.split('\n');
      let lineNumber = 0;
      let foundErrors = [];
      
      for (const line of lines) {
        lineNumber++;
        
        // 檢查常見的語法問題
        if (line.includes(',,')) {
          foundErrors.push({
            line: lineNumber,
            issue: '雙逗號',
            content: line.trim()
          });
        }
        
        if (line.match(/,\s*[}\]]/)) {
          foundErrors.push({
            line: lineNumber,
            issue: '結尾多餘逗號',
            content: line.trim()
          });
        }
        
        if (line.match(/[{\[]\s*,/)) {
          foundErrors.push({
            line: lineNumber,
            issue: '開頭多餘逗號',
            content: line.trim()
          });
        }
        
        // 檢查可能的字符問題
        if (line.includes('\\u')) {
          // 檢查是否有截斷的 Unicode 字符
          const unicodeMatches = line.match(/\\u[0-9a-fA-F]{0,3}(?![0-9a-fA-F])/g);
          if (unicodeMatches) {
            foundErrors.push({
              line: lineNumber,
              issue: '可能的 Unicode 字符問題',
              content: line.trim()
            });
          }
        }
        
        // 檢查 JSON 結構
        if (line.includes('= [') || line.includes('= {')) {
          // 檢查基本的 JSON 語法
          try {
            // 提取 JSON 部分
            const jsonMatch = line.match(/=\s*(\[.*\]|\{.*\})/);
            if (jsonMatch) {
              const jsonStr = jsonMatch[1];
              // 嘗試解析 JSON
              JSON.parse(jsonStr);
            }
          } catch (e) {
            foundErrors.push({
              line: lineNumber,
              issue: `JSON 語法錯誤: ${e.message}`,
              content: line.slice(0, 100) + (line.length > 100 ? '...' : '')
            });
          }
        }
      }
      
      if (foundErrors.length > 0) {
        console.log(`\n🚨 發現 ${foundErrors.length} 個潛在問題:`);
        foundErrors.forEach((error, index) => {
          console.log(`\n${index + 1}. 第 ${error.line} 行 - ${error.issue}`);
          console.log(`   內容: ${error.content}`);
        });
      } else {
        console.log('\n✅ 未發現明顯的語法問題');
        
        // 顯示一些關鍵行供手動檢查
        console.log('\n📋 關鍵代碼行:');
        lines.forEach((line, index) => {
          const lineNum = index + 1;
          if (line.includes('customers =') || 
              line.includes('products =') || 
              line.includes('orderItems =') ||
              line.includes('salesOrder =') ||
              line.includes('const orderId') ||
              line.includes('const customerId')) {
            console.log(`第 ${lineNum} 行: ${line.trim()}`);
          }
        });
      }
      
    } else {
      console.log('❌ 未找到內聯 JavaScript');
    }
    
  } catch (error) {
    console.error('\n❌ 提取過程中發生錯誤:', error.message);
  } finally {
    await browser.close();
    console.log('\n✅ JavaScript 提取完成');
  }
}

// 執行提取
extractFullJavaScript().catch(console.error);