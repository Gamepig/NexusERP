import { test, expect } from '@playwright/test';

test('檢查HTML源碼和Vite配置', async ({ page }) => {
  console.log('🔍 檢查HTML源碼和資產載入...');
  
  await page.goto('http://127.0.0.1:8000');
  await page.waitForLoadState('networkidle');
  
  // 獲取頁面HTML源碼
  const htmlContent = await page.content();
  
  // 檢查HTML源碼中的重要部分
  console.log('\n=== 檢查<head>部分 ===');
  const headMatch = htmlContent.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
  if (headMatch) {
    const headContent = headMatch[1];
    
    // 檢查Vite相關的標籤
    const viteMatches = headContent.match(/<script[^>]*vite[^>]*>/gi) || [];
    const jsMatches = headContent.match(/<script[^>]*src[^>]*>/gi) || [];
    const cssMatches = headContent.match(/<link[^>]*stylesheet[^>]*>/gi) || [];
    
    console.log(`找到 ${viteMatches.length} 個Vite相關標籤:`);
    viteMatches.forEach((match, i) => {
      console.log(`  ${i+1}. ${match}`);
    });
    
    console.log(`找到 ${jsMatches.length} 個JavaScript標籤:`);
    jsMatches.forEach((match, i) => {
      console.log(`  ${i+1}. ${match}`);
    });
    
    console.log(`找到 ${cssMatches.length} 個CSS標籤:`);
    cssMatches.forEach((match, i) => {
      console.log(`  ${i+1}. ${match}`);
    });
    
    // 檢查是否有@vite指令
    const hasViteDirective = headContent.includes('@vite') || headContent.includes('vite(');
    console.log(`HTML中是否包含@vite指令: ${hasViteDirective ? '是' : '否'}`);
    
    // 檢查是否有Laravel mix manifest
    const hasMixManifest = headContent.includes('mix(') || headContent.includes('mix.js');
    console.log(`是否使用Laravel Mix: ${hasMixManifest ? '是' : '否'}`);
  }
  
  // 檢查頁面載入的實際資源
  console.log('\n=== 檢查網路請求 ===');
  const responses = [];
  
  page.on('response', response => {
    const url = response.url();
    if (url.includes('.js') || url.includes('.css') || url.includes('vite')) {
      responses.push({
        url: url,
        status: response.status(),
        type: response.headers()['content-type'] || 'unknown'
      });
    }
  });
  
  // 重新載入頁面收集請求
  await page.reload();
  await page.waitForLoadState('networkidle');
  
  console.log(`捕獲到 ${responses.length} 個相關網路請求:`);
  responses.forEach((resp, i) => {
    console.log(`  ${i+1}. [${resp.status}] ${resp.url}`);
    console.log(`      Type: ${resp.type}`);
  });
  
  // 檢查Vite開發伺服器是否可達
  console.log('\n=== 檢查Vite開發伺服器 ===');
  try {
    const viteResponse = await page.goto('http://localhost:5173/', { waitUntil: 'load', timeout: 5000 });
    console.log(`Vite開發伺服器狀態: ${viteResponse.status()}`);
  } catch (error) {
    console.log(`Vite開發伺服器錯誤: ${error.message}`);
  }
  
  // 檢查Laravel是否在開發模式
  await page.goto('http://127.0.0.1:8000');
  await page.waitForLoadState('networkidle');
  
  const isProduction = await page.evaluate(() => {
    // 檢查是否有production build的特徵
    const scripts = Array.from(document.querySelectorAll('script[src]'));
    const hasHashedAssets = scripts.some(script => 
      script.src.includes('/build/') && /\-[a-f0-9]{8,}\./i.test(script.src)
    );
    
    return {
      hasHashedAssets,
      scriptSources: scripts.map(s => s.src),
      appEnv: document.querySelector('meta[name="app-env"]')?.content || 'unknown'
    };
  });
  
  console.log('\n=== Laravel環境檢查 ===');
  console.log(`是否使用production build: ${isProduction.hasHashedAssets ? '是' : '否'}`);
  console.log(`APP_ENV: ${isProduction.appEnv}`);
  console.log('Script sources:', isProduction.scriptSources);
  
  // 最終截圖
  await page.screenshot({ path: 'html-source-debug.png', fullPage: true });
  console.log('\n📸 HTML源碼除錯截圖已保存');
});