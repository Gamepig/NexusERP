import { chromium } from 'playwright';

async function testMultiStepForm() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('🔍 專門測試多步驟報價單表單...\n');

  try {
    // 先登入
    console.log('🔐 執行登入流程');
    await page.goto('http://127.0.0.1:8000/login');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    console.log('✅ 登入完成\n');

    // 直接訪問多步驟表單
    console.log('🔍 測試多步驟表單頁面');
    await page.goto('http://127.0.0.1:8000/quotes/create/multi-step');
    await page.waitForLoadState('networkidle');
    
    const url = page.url();
    console.log(`當前 URL: ${url}`);
    
    // 檢查頁面是否正確載入
    const pageContent = await page.textContent('body');
    const hasContent = pageContent.length > 1000;
    console.log(`頁面內容長度: ${pageContent.length}`);
    console.log(`頁面有實質內容: ${hasContent}`);

    await page.screenshot({ path: 'multistep-01-initial.png', fullPage: true });
    console.log('✅ 已保存初始頁面截圖\n');

    // 詳細分析表單結構
    console.log('🔍 分析表單結構');
    
    // 檢查各種可能的客戶選擇元素
    const customerSelectors = [
      'select[name="customer_id"]',
      'input[name="customer_id"]', 
      '#customer_id',
      'select[id*="customer"]',
      'input[id*="customer"]',
      '[data-field="customer"]',
      '.customer-selector',
      '.customer-select'
    ];

    for (const selector of customerSelectors) {
      const count = await page.locator(selector).count();
      console.log(`${selector}: ${count} 個元素`);
      
      if (count > 0) {
        const isVisible = await page.locator(selector).first().isVisible();
        const isEnabled = await page.locator(selector).first().isEnabled();
        console.log(`  -> 可見: ${isVisible}, 可用: ${isEnabled}`);
      }
    }

    // 檢查所有表單元素
    const allInputs = await page.locator('input, select, textarea').count();
    const allButtons = await page.locator('button').count();
    const allForms = await page.locator('form').count();
    
    console.log(`\n表單統計:`);
    console.log(`總輸入元素: ${allInputs}`);
    console.log(`總按鈕數: ${allButtons}`);
    console.log(`總表單數: ${allForms}`);

    // 獲取所有輸入元素的詳細資訊
    console.log('\n🔍 輸入元素詳細資訊:');
    const inputs = await page.locator('input, select, textarea').all();
    
    for (let i = 0; i < Math.min(inputs.length, 10); i++) { // 只顯示前10個
      const input = inputs[i];
      const tagName = await input.evaluate(el => el.tagName.toLowerCase());
      const name = await input.getAttribute('name') || 'unnamed';
      const id = await input.getAttribute('id') || 'no-id';
      const type = await input.getAttribute('type') || 'default';
      const placeholder = await input.getAttribute('placeholder') || '';
      
      console.log(`${i+1}. <${tagName}> name="${name}" id="${id}" type="${type}" placeholder="${placeholder}"`);
    }

    // 檢查是否有Alpine.js或其他JS框架
    console.log('\n🔍 檢查JavaScript框架:');
    const hasAlpine = await page.evaluate(() => {
      return typeof window.Alpine !== 'undefined';
    });
    console.log(`Alpine.js 已載入: ${hasAlpine}`);

    const hasVue = await page.evaluate(() => {
      return typeof window.Vue !== 'undefined';
    });
    console.log(`Vue.js 已載入: ${hasVue}`);

    // 檢查頁面中的錯誤
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // 等待一下看是否有JS錯誤
    await page.waitForTimeout(2000);
    
    if (errors.length > 0) {
      console.log('\n⚠️ 發現JavaScript錯誤:');
      errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    } else {
      console.log('\n✅ 未發現JavaScript錯誤');
    }

    // 檢查HTML源碼中的重要片段
    console.log('\n🔍 分析HTML結構:');
    const htmlContent = await page.content();
    
    const hasCustomerField = htmlContent.includes('customer');
    const hasProductField = htmlContent.includes('product');
    const hasFormAction = htmlContent.includes('action=');
    const hasCSRF = htmlContent.includes('csrf');
    const hasMethod = htmlContent.includes('method=');
    
    console.log(`包含 customer 關鍵字: ${hasCustomerField}`);
    console.log(`包含 product 關鍵字: ${hasProductField}`);
    console.log(`包含 form action: ${hasFormAction}`);
    console.log(`包含 CSRF token: ${hasCSRF}`);
    console.log(`包含 form method: ${hasMethod}`);

    await page.screenshot({ path: 'multistep-02-analysis.png', fullPage: true });
    console.log('✅ 已保存分析截圖');

    console.log('\n📋 多步驟表單測試完成！');
    
  } catch (error) {
    console.error('❌ 測試過程中發生錯誤:', error.message);
    await page.screenshot({ path: 'multistep-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

testMultiStepForm().catch(console.error);