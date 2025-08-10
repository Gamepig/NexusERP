import { chromium } from 'playwright';

async function testQuoteSystemWithAuth() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('🔐 開始測試 NexusERP 報價單系統（含認證流程）...\n');

  try {
    // Phase 1: 認證流程
    console.log('🔍 Phase 1: 執行登入流程');
    await page.goto('http://127.0.0.1:8000/login');
    await page.waitForLoadState('networkidle');
    
    // 填入測試帳號資料
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    
    await page.screenshot({ path: 'auth-test-01-login-filled.png', fullPage: true });
    console.log('✅ 已填入登入資料並截圖');
    
    // 執行登入
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ path: 'auth-test-02-after-login.png', fullPage: true });
    console.log('✅ 已完成登入流程\n');

    // Phase 2: 測試報價單列表頁
    console.log('🔍 Phase 2: 測試報價單列表頁');
    await page.goto('http://127.0.0.1:8000/quotes');
    await page.waitForLoadState('networkidle');
    
    const currentUrl = page.url();
    console.log(`當前 URL: ${currentUrl}`);
    
    // 檢查是否成功進入報價單頁面
    const pageTitle = await page.title();
    console.log(`頁面標題: ${pageTitle}`);
    
    // 檢查頁面內容
    const bodyText = await page.textContent('body');
    const hasQuotesText = bodyText.includes('報價') || bodyText.includes('Quote') || bodyText.includes('quotes');
    console.log(`頁面包含報價相關文字: ${hasQuotesText}`);
    
    // 檢查表格或數據容器
    const tableExists = await page.locator('table').count() > 0;
    const cardExists = await page.locator('.card').count() > 0;
    const containerExists = await page.locator('.container').count() > 0;
    
    console.log(`表格存在: ${tableExists}`);
    console.log(`卡片元素存在: ${cardExists}`);
    console.log(`容器元素存在: ${containerExists}`);
    
    await page.screenshot({ path: 'auth-test-03-quotes-list.png', fullPage: true });
    console.log('✅ 已保存報價單列表頁截圖\n');

    // Phase 3: 檢查報價單數據
    console.log('🔍 Phase 3: 檢查報價單數據內容');
    if (tableExists) {
      const rows = await page.locator('table tbody tr').count();
      console.log(`表格數據行數: ${rows}`);
      
      if (rows > 0) {
        const firstRowText = await page.locator('table tbody tr:first-child').textContent();
        console.log(`第一行內容: ${firstRowText.replace(/\s+/g, ' ').trim()}`);
        
        // 查找操作按鈕
        const viewButtons = await page.locator('a:has-text("檢視"), button:has-text("檢視"), [href*="quotes/"][href*="/view"], [href*="quotes/"][class*="btn"]').count();
        const editButtons = await page.locator('a:has-text("編輯"), button:has-text("編輯"), [href*="quotes/"][href*="/edit"]').count();
        
        console.log(`檢視按鈕數量: ${viewButtons}`);
        console.log(`編輯按鈕數量: ${editButtons}`);
        
        // Phase 4: 測試詳情頁
        if (viewButtons > 0) {
          console.log('\n🔍 Phase 4: 測試詳情頁');
          await page.locator('a:has-text("檢視"), button:has-text("檢視"), [href*="quotes/"][href*="/view"], [href*="quotes/"][class*="btn"]').first().click();
          await page.waitForLoadState('networkidle');
          
          const detailUrl = page.url();
          const detailContent = await page.textContent('body');
          
          console.log(`詳情頁 URL: ${detailUrl}`);
          console.log(`詳情頁內容長度: ${detailContent.length}`);
          
          const hasErrorMessage = detailContent.includes('Not found') || detailContent.includes('404') || detailContent.includes('錯誤');
          console.log(`詳情頁顯示錯誤: ${hasErrorMessage}`);
          
          await page.screenshot({ path: 'auth-test-04-quote-detail.png', fullPage: true });
          console.log('✅ 已保存詳情頁截圖');
          
          // 返回列表頁
          await page.goto('http://127.0.0.1:8000/quotes');
          await page.waitForLoadState('networkidle');
        }
      }
    } else {
      // 檢查是否有其他數據顯示方式
      const dataElements = await page.locator('[class*="quote"], [id*="quote"], .list-group-item, .row').count();
      console.log(`其他數據顯示元素數量: ${dataElements}`);
    }

    // Phase 5: 測試建立報價單功能
    console.log('\n🔍 Phase 5: 測試建立報價單功能');
    
    // 查找建立按鈕
    const createButtons = await page.locator('a:has-text("建立"), a:has-text("新增"), a:has-text("Create"), button:has-text("建立"), [href*="quotes/create"]').count();
    console.log(`建立按鈕數量: ${createButtons}`);
    
    if (createButtons > 0) {
      await page.locator('a:has-text("建立"), a:has-text("新增"), a:has-text("Create"), button:has-text("建立"), [href*="quotes/create"]').first().click();
      await page.waitForLoadState('networkidle');
      
      const createUrl = page.url();
      console.log(`建立頁面 URL: ${createUrl}`);
      
      await page.screenshot({ path: 'auth-test-05-create-form.png', fullPage: true });
      console.log('✅ 已保存建立表單截圖');
    }

    // Phase 6: 測試多步驟表單
    console.log('\n🔍 Phase 6: 測試多步驟表單');
    await page.goto('http://127.0.0.1:8000/quotes/create/multi-step');
    await page.waitForLoadState('networkidle');
    
    const multiStepUrl = page.url();
    console.log(`多步驟表單 URL: ${multiStepUrl}`);
    
    // 檢查表單元素
    const formExists = await page.locator('form').count() > 0;
    const customerSelect = await page.locator('select[name="customer_id"]').count();
    const customerInput = await page.locator('input[name="customer_id"]').count();
    const customerField = await page.locator('[name*="customer"], #customer').count();
    
    console.log(`表單存在: ${formExists}`);
    console.log(`客戶選擇器 select[name="customer_id"]: ${customerSelect}`);
    console.log(`客戶輸入框 input[name="customer_id"]: ${customerInput}`);
    console.log(`客戶相關欄位總數: ${customerField}`);
    
    // 檢查其他重要表單元素
    const productFields = await page.locator('[name*="product"], [id*="product"]').count();
    const submitButtons = await page.locator('button[type="submit"], input[type="submit"]').count();
    
    console.log(`產品相關欄位數量: ${productFields}`);
    console.log(`提交按鈕數量: ${submitButtons}`);
    
    await page.screenshot({ path: 'auth-test-06-multi-step-form.png', fullPage: true });
    console.log('✅ 已保存多步驟表單截圖\n');

    // Phase 7: 分析頁面原始碼
    console.log('🔍 Phase 7: 分析頁面結構');
    const pageSource = await page.content();
    
    // 檢查重要的HTML元素和類別
    const hasBootstrap = pageSource.includes('bootstrap') || pageSource.includes('btn-');
    const hasAlpineJS = pageSource.includes('x-data') || pageSource.includes('alpine');
    const hasTailwind = pageSource.includes('tailwind') || pageSource.includes('tw-');
    const hasLaravel = pageSource.includes('laravel') || pageSource.includes('csrf');
    
    console.log(`Bootstrap CSS/JS: ${hasBootstrap}`);
    console.log(`Alpine.js: ${hasAlpineJS}`);
    console.log(`Tailwind CSS: ${hasTailwind}`);
    console.log(`Laravel 元素: ${hasLaravel}`);

    console.log('\n📋 測試完成！');
    console.log('生成的截圖文件:');
    console.log('- auth-test-01-login-filled.png');
    console.log('- auth-test-02-after-login.png');
    console.log('- auth-test-03-quotes-list.png');
    console.log('- auth-test-04-quote-detail.png (如果有數據)');
    console.log('- auth-test-05-create-form.png (如果找到建立按鈕)');
    console.log('- auth-test-06-multi-step-form.png');

  } catch (error) {
    console.error('❌ 測試過程中發生錯誤:', error.message);
    await page.screenshot({ path: 'auth-test-error.png', fullPage: true });
    console.log('✅ 已保存錯誤截圖: auth-test-error.png');
  } finally {
    await browser.close();
  }
}

testQuoteSystemWithAuth().catch(console.error);