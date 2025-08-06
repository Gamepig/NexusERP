import { chromium } from 'playwright';

(async () => {
  // 啟動瀏覽器
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000 // 每個操作間隔 1 秒，方便觀察
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // 監聽控制台錯誤
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('❌ JavaScript 錯誤:', msg.text());
    }
  });
  
  // 監聽網路請求失敗
  page.on('requestfailed', request => {
    console.log('❌ 網路請求失敗:', request.url(), request.failure().errorText);
  });
  
  try {
    console.log('🚀 開始儀表板測試...');
    
    // 1. 導航到儀表板
    console.log('📍 導航到儀表板頁面...');
    await page.goto('http://127.0.0.1:8000/dashboard', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    // 2. 等待頁面完全載入
    console.log('⏳ 等待頁面載入...');
    await page.waitForTimeout(3000);
    
    // 3. 檢查頁面標題
    const title = await page.title();
    console.log('📄 頁面標題:', title);
    
    // 4. 檢查是否有載入指示器
    console.log('🔄 檢查載入狀態...');
    const loadingExists = await page.isVisible('[data-loading="true"]', { timeout: 2000 }).catch(() => false);
    if (loadingExists) {
      console.log('⏳ 發現載入指示器，等待載入完成...');
      await page.waitForSelector('[data-loading="true"]', { state: 'hidden', timeout: 10000 });
    }
    
    // 5. 檢查統計卡片
    console.log('📊 檢查統計卡片...');
    const statsCards = await page.locator('.stats-card, .stat-card, [class*="stat"]').count();
    console.log(`找到 ${statsCards} 個統計卡片`);
    
    // 6. 檢查圖表元素
    console.log('📈 檢查圖表元素...');
    const charts = await page.locator('canvas, .chart, [id*="chart"]').count();
    console.log(`找到 ${charts} 個圖表元素`);
    
    // 7. 檢查主要內容區域
    console.log('📋 檢查主要內容...');
    const mainContent = await page.isVisible('main, .main-content, .dashboard-content');
    console.log('主要內容區域可見:', mainContent);
    
    // 8. 檢查 API 響應 (檢查網路活動)
    console.log('🌐 檢查 API 請求...');
    const responses = [];
    page.on('response', response => {
      if (response.url().includes('/api/') || response.url().includes('dashboard')) {
        responses.push({
          url: response.url(),
          status: response.status(),
          ok: response.ok()
        });
      }
    });
    
    // 重新整理以捕獲 API 請求
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    
    console.log('📡 API 響應記錄:');
    responses.forEach(response => {
      const status = response.ok ? '✅' : '❌';
      console.log(`${status} ${response.status} - ${response.url}`);
    });
    
    // 9. 截圖保存
    console.log('📸 保存截圖...');
    await page.screenshot({ 
      path: 'dashboard-test-result.png', 
      fullPage: true 
    });
    
    // 10. 檢查是否有錯誤元素
    console.log('🚨 檢查錯誤狀態...');
    const errorElements = await page.locator('.error, .alert-danger, [class*="error"]').count();
    console.log(`發現 ${errorElements} 個錯誤元素`);
    
    // 11. 整體功能評估
    console.log('\n📋 測試結果總結:');
    console.log('================');
    console.log('✅ 頁面成功載入:', title !== 'Error');
    console.log('✅ 統計卡片數量:', statsCards);
    console.log('✅ 圖表元素數量:', charts);
    console.log('✅ 主要內容可見:', mainContent);
    console.log('✅ API 響應數量:', responses.length);
    console.log('✅ 錯誤元素數量:', errorElements);
    
    const hasBasicContent = statsCards > 0 || charts > 0 || mainContent;
    console.log('\n🎯 整體評估:', hasBasicContent ? '✅ 儀表板功能正常' : '❌ 儀表板可能有問題');
    
  } catch (error) {
    console.error('❌ 測試過程發生錯誤:', error.message);
  } finally {
    await browser.close();
    console.log('🏁 測試完成');
  }
})();