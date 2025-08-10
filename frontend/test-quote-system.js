import { chromium } from 'playwright';

async function testQuoteSystem() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('📋 開始測試 NexusERP 報價單系統...\n');

  try {
    // Phase 1: 基礎導航測試
    console.log('🔍 Phase 1: 基礎導航測試');
    await page.goto('http://127.0.0.1:8000/quotes');
    await page.waitForLoadState('networkidle');
    
    // 檢查頁面標題
    const title = await page.title();
    console.log(`頁面標題: ${title}`);
    
    // 檢查是否有報價單表格
    const tableExists = await page.locator('table').count() > 0;
    console.log(`報價單表格存在: ${tableExists}`);
    
    // 截圖保存
    await page.screenshot({ path: 'quote-list-page.png', fullPage: true });
    console.log('✅ 已保存報價單列表頁截圖: quote-list-page.png\n');

    // Phase 2: 檢查表格內容
    console.log('🔍 Phase 2: 檢查表格數據');
    const rows = await page.locator('table tbody tr').count();
    console.log(`表格行數: ${rows}`);
    
    if (rows > 0) {
      // 獲取第一行的數據
      const firstRowData = await page.locator('table tbody tr:first-child').textContent();
      console.log(`第一行數據: ${firstRowData.replace(/\s+/g, ' ').trim()}`);
      
      // 尋找檢視按鈕
      const viewButtons = await page.locator('a:has-text("檢視"), button:has-text("檢視"), .btn:has-text("檢視")').count();
      console.log(`檢視按鈕數量: ${viewButtons}`);
      
      if (viewButtons > 0) {
        // Phase 3: 詳情頁測試
        console.log('\n🔍 Phase 3: 詳情頁數據顯示測試');
        await page.locator('a:has-text("檢視"), button:has-text("檢視"), .btn:has-text("檢視")').first().click();
        await page.waitForLoadState('networkidle');
        
        const detailContent = await page.textContent('body');
        console.log(`詳情頁內容長度: ${detailContent.length}`);
        
        if (detailContent.includes('Not found') || detailContent.includes('not found')) {
          console.log('❌ 詳情頁顯示 "Not found"');
        } else {
          console.log('✅ 詳情頁有內容');
        }
        
        await page.screenshot({ path: 'quote-detail-page.png', fullPage: true });
        console.log('✅ 已保存詳情頁截圖: quote-detail-page.png\n');
        
        // 回到列表頁
        await page.goto('http://127.0.0.1:8000/quotes');
        await page.waitForLoadState('networkidle');
      }
    }

    // Phase 4: 編輯表單測試
    console.log('🔍 Phase 4: 編輯表單測試');
    const editButtons = await page.locator('a:has-text("編輯"), button:has-text("編輯"), .btn:has-text("編輯")').count();
    console.log(`編輯按鈕數量: ${editButtons}`);
    
    if (editButtons > 0) {
      await page.locator('a:has-text("編輯"), button:has-text("編輯"), .btn:has-text("編輯")').first().click();
      await page.waitForLoadState('networkidle');
      
      await page.screenshot({ path: 'quote-edit-page.png', fullPage: true });
      console.log('✅ 已保存編輯頁截圖: quote-edit-page.png\n');
    }

    // Phase 5: 多步驟表單測試
    console.log('🔍 Phase 5: 多步驟表單測試');
    await page.goto('http://127.0.0.1:8000/quotes/create/multi-step');
    await page.waitForLoadState('networkidle');
    
    // 檢查客戶選擇器
    const customerSelectExists = await page.locator('select[name="customer_id"]').count() > 0;
    console.log(`客戶選擇器 select[name="customer_id"] 存在: ${customerSelectExists}`);
    
    // 檢查其他可能的客戶選擇元素
    const alternativeSelectors = [
      'select:has([value*="customer"])',
      'input[name="customer_id"]',
      '#customer_id',
      '.customer-select'
    ];
    
    for (const selector of alternativeSelectors) {
      const exists = await page.locator(selector).count() > 0;
      console.log(`選擇器 "${selector}" 存在: ${exists}`);
    }
    
    await page.screenshot({ path: 'quote-multistep-page.png', fullPage: true });
    console.log('✅ 已保存多步驟表單頁截圖: quote-multistep-page.png\n');

    // Phase 6: 檢查頁面原始碼
    console.log('🔍 Phase 6: 檢查頁面結構');
    const bodyHTML = await page.innerHTML('body');
    
    // 查找表單元素
    const formExists = bodyHTML.includes('<form');
    const selectExists = bodyHTML.includes('<select');
    const inputExists = bodyHTML.includes('customer');
    
    console.log(`頁面包含表單: ${formExists}`);
    console.log(`頁面包含選擇器: ${selectExists}`);
    console.log(`頁面包含 'customer' 文字: ${inputExists}`);

    console.log('\n📋 測試完成！請檢查生成的截圖文件。');

  } catch (error) {
    console.error('❌ 測試過程中發生錯誤:', error.message);
    await page.screenshot({ path: 'error-screenshot.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

testQuoteSystem().catch(console.error);