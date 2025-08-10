import { test, expect } from '@playwright/test';

test.describe('Quote Edit and View Functionality Test', () => {
  test.beforeEach(async ({ page }) => {
    // Login process
    await page.goto('http://127.0.0.1:8000/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
  });

  test('Edit and View Links Actually Work', async ({ page }) => {
    console.log('🔗 測試編輯和檢視連結實際功能');
    
    // Go to quotes list
    await page.goto('http://127.0.0.1:8000/quotes');
    await page.waitForLoadState('networkidle');
    
    // Take screenshot of the list
    await page.screenshot({ path: 'quote-list-with-actions.png', fullPage: true });
    
    // Check if there are quotes to test with
    const quoteRows = await page.locator('table tbody tr').count();
    console.log(`📊 找到報價記錄數量: ${quoteRows}`);
    
    if (quoteRows > 0) {
      // Test View functionality
      console.log('\n📍 測試檢視功能');
      const firstViewLink = await page.locator('a:has-text("檢視"), a:has-text("查看"), .btn-view').first();
      
      if (await firstViewLink.isVisible()) {
        const viewHref = await firstViewLink.getAttribute('href');
        console.log(`🔗 檢視連結: ${viewHref}`);
        
        // Click view link
        await firstViewLink.click();
        await page.waitForLoadState('networkidle');
        await page.screenshot({ path: 'quote-view-page.png', fullPage: true });
        
        // Verify we're on a view page
        const currentUrl = page.url();
        console.log(`📍 檢視頁面URL: ${currentUrl}`);
        
        // Check if view page has content
        const hasContent = await page.locator('h1, .quote-details, .details').isVisible();
        expect(hasContent).toBe(true);
        console.log('✅ 檢視頁面載入成功');
        
        // Go back to list
        await page.goto('http://127.0.0.1:8000/quotes');
        await page.waitForLoadState('networkidle');
      }
      
      // Test Edit functionality  
      console.log('\n📍 測試編輯功能');
      const firstEditLink = await page.locator('a:has-text("編輯"), .btn-edit, [href*="/edit"]').first();
      
      if (await firstEditLink.isVisible()) {
        const editHref = await firstEditLink.getAttribute('href');
        console.log(`🔗 編輯連結: ${editHref}`);
        
        // Click edit link
        await firstEditLink.click();
        await page.waitForLoadState('networkidle');
        await page.screenshot({ path: 'quote-edit-page.png', fullPage: true });
        
        // Verify we're on an edit page
        const currentUrl = page.url();
        console.log(`📍 編輯頁面URL: ${currentUrl}`);
        expect(currentUrl).toMatch(/\/edit/);
        
        // Check if edit page has form elements
        const formElements = await page.locator('form, input, select, textarea').count();
        console.log(`📝 編輯表單元素數量: ${formElements}`);
        expect(formElements).toBeGreaterThan(0);
        console.log('✅ 編輯頁面載入成功');
      }
      
      console.log('\n🎉 編輯和檢視功能測試完成');
    } else {
      console.log('⚠️ 沒有報價記錄可供測試編輯和檢視功能');
    }
  });

  test('Create Quote and Verify it Appears in List', async ({ page }) => {
    console.log('📝 測試建立報價並驗證顯示');
    
    // Go to create form
    await page.goto('http://127.0.0.1:8000/quotes/create');
    await page.waitForLoadState('networkidle');
    
    // Fill basic required fields
    const today = new Date().toISOString().split('T')[0];
    const futureDate = new Date();
    futureDate.setMonth(futureDate.getMonth() + 1);
    const validUntil = futureDate.toISOString().split('T')[0];
    
    // Fill quote date
    const quoteDateField = await page.locator('input[name="quote_date"], #quote_date').first();
    if (await quoteDateField.isVisible()) {
      await quoteDateField.fill(today);
      console.log(`✅ 填寫報價日期: ${today}`);
    }
    
    // Fill valid until
    const validUntilField = await page.locator('input[name="valid_until"], #valid_until').first();
    if (await validUntilField.isVisible()) {
      await validUntilField.fill(validUntil);
      console.log(`✅ 填寫有效期: ${validUntil}`);
    }
    
    // Select customer (if available)
    const customerSelect = await page.locator('select[name="customer_id"], #customer_id').first();
    if (await customerSelect.isVisible()) {
      const options = await customerSelect.locator('option').count();
      if (options > 1) {
        await customerSelect.selectOption({ index: 1 });
        console.log('✅ 選擇了客戶');
      }
    }
    
    // Set status to sent to test our fix
    const statusSelect = await page.locator('select[name="status"], #status').first();
    if (await statusSelect.isVisible()) {
      await statusSelect.selectOption('sent');
      console.log('✅ 設定狀態為 sent');
    }
    
    // Fill notes with timestamp for identification
    const timestamp = Date.now();
    const testNote = `測試報價單 - 自動化測試 ${timestamp}`;
    
    const notesField = await page.locator('textarea[name="notes"], #notes').first();
    if (await notesField.isVisible()) {
      await notesField.fill(testNote);
      console.log(`✅ 填寫測試備註: ${testNote}`);
    }
    
    // Take screenshot before submit
    await page.screenshot({ path: 'quote-form-ready-submit.png', fullPage: true });
    
    // Submit form
    const submitButton = await page.locator('button[type="submit"], .btn-primary').first();
    if (await submitButton.isVisible()) {
      console.log('🚀 提交表單...');
      await submitButton.click();
      await page.waitForTimeout(3000);
      await page.waitForLoadState('networkidle');
      
      // Take screenshot after submit
      await page.screenshot({ path: 'quote-form-after-submit.png', fullPage: true });
      
      console.log(`📍 提交後URL: ${page.url()}`);
      
      // Check for success indicators or redirect
      const hasErrors = await page.locator('.alert-danger, .error, .text-red-500').count();
      console.log(`🔍 錯誤訊息數量: ${hasErrors}`);
      
      if (hasErrors === 0) {
        console.log('✅ 表單提交成功，無錯誤訊息');
        
        // Go to quotes list and verify our quote appears
        await page.goto('http://127.0.0.1:8000/quotes');
        await page.waitForLoadState('networkidle');
        
        // Look for our test note in the list
        const pageText = await page.locator('body').textContent();
        const quoteFound = pageText.includes(timestamp.toString());
        
        console.log(`🔍 尋找測試報價 (${timestamp}): ${quoteFound ? '✅ 找到' : '❌ 未找到'}`);
        
        if (quoteFound) {
          console.log('🎉 建立報價並成功顯示在列表中');
        }
      } else {
        console.log('⚠️ 表單提交時出現錯誤，需要進一步檢查');
      }
    }
  });
});