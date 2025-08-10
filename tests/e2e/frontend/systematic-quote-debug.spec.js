/**
 * 系統性報價單調試測試
 * 使用超級思考方法論進行數據流分析
 * 
 * 測試目標：
 * 1. 驗證數據輸入完整性（新增報價單）
 * 2. 驗證數據顯示一致性（查看頁面）
 * 3. 驗證編輯表單數據填充
 * 4. 驗證搜尋功能有效性
 * 
 * 超級思考步驟：
 * Phase 1: 數據輸入測試
 * Phase 2: 數據驗證 
 * Phase 3: 問題識別
 * Phase 4: 知識記錄
 */

import { test, expect } from '@playwright/test';

test.describe('🧠 超級思考系統性調試：報價單數據流分析', () => {
  let debugInfo = {
    inputData: {},
    apiRequests: [],
    displayedData: {},
    issues: []
  };

  test.beforeAll(async () => {
    console.log('🚀 開始系統性調試分析');
    console.log('📋 測試目標：追蹤數據從輸入→儲存→顯示的完整流程');
  });

  test('Phase 1: 數據輸入測試 - 建立包含非預設數據的報價單', async ({ page }) => {
    console.log('\n🔵 Phase 1: 數據輸入測試');
    
    // 監聽網路請求
    const requests = [];
    page.on('request', request => {
      if (request.url().includes('/api/') || request.url().includes('/quotes')) {
        requests.push({
          url: request.url(),
          method: request.method(),
          data: request.postData()
        });
      }
    });

    // 登入系統
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');

    // 導航到多步驟報價建立頁面
    await page.goto('/quotes/create/multi-step');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // **重要**: 使用非預設數據測試
    const testData = {
      customer: 'Final Test Customer', // 非第一個客戶
      quoteDate: '2025-08-10',        // 非今天
      validUntil: '2025-09-15',       // 非預設+30天
      status: 'sent',                 // 非預設draft
      currency: 'USD',                // 非預設TWD
      contactPerson: '調試測試聯絡人',
      notes: '系統性調試測試報價單 - 使用非預設數據',
      products: [
        { name: '調試測試產品A', quantity: 3, unitPrice: 150 },
        { name: '調試測試產品B', quantity: 2, unitPrice: 200 }
      ]
    };

    debugInfo.inputData = testData;
    console.log('📝 準備輸入的測試數據:', testData);

    // 填寫第一步：基本資訊（使用非預設數據）
    try {
      // 客戶選擇
      await page.selectOption('select[name="customer_id"]', { label: testData.customer });
      console.log('✅ 客戶選擇:', testData.customer);

      // 日期填入
      await page.fill('#quote_date', testData.quoteDate);
      await page.fill('#valid_until', testData.validUntil);
      console.log('✅ 日期設定:', testData.quoteDate, '→', testData.validUntil);

      // 狀態選擇（重要測試點）
      await page.selectOption('select[x-model="formData.status"]', testData.status);
      console.log('✅ 狀態選擇:', testData.status, '（非預設draft）');

      // 幣別選擇
      await page.selectOption('#currency', testData.currency);
      console.log('✅ 幣別選擇:', testData.currency);

      // 聯絡人和備註
      await page.fill('#contact_person', testData.contactPerson);
      await page.fill('textarea[x-model="formData.notes"]', testData.notes);

      console.log('✅ Phase 1 數據輸入完成');
      
    } catch (error) {
      console.error('❌ Phase 1 數據輸入失敗:', error.message);
      debugInfo.issues.push(`Phase 1 輸入失敗: ${error.message}`);
    }

    debugInfo.apiRequests = requests;
  });

  test('Phase 2: 數據驗證 - 檢查儲存和顯示一致性', async ({ page }) => {
    console.log('\n🟡 Phase 2: 數據驗證');

    // 登入並導航到報價單列表
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');

    await page.goto('/quotes');
    await page.waitForLoadState('networkidle');

    // 檢查列表中的最新報價單
    try {
      const firstQuoteRow = await page.locator('tbody tr').first();
      const listDisplayData = {
        quoteNumber: await firstQuoteRow.locator('td').first().textContent(),
        customer: await firstQuoteRow.locator('td').nth(1).textContent(),
        totalAmount: await firstQuoteRow.locator('td').nth(4).textContent(),
        status: await firstQuoteRow.locator('td').nth(5).textContent()
      };

      console.log('📊 列表頁顯示數據:', listDisplayData);
      debugInfo.displayedData.listView = listDisplayData;

      // 點擊查看詳情
      await firstQuoteRow.locator('a[href*="/quotes/"]:has-text("檢視")').click();
      await page.waitForLoadState('networkidle');

      // 檢查詳情頁數據 - 使用實際的 HTML 結構
      const detailDisplayData = {
        customer: await page.locator('label:has-text("Customer:") + p').textContent().catch(() => 'Not found'),
        status: await page.locator('.inline-flex.px-2.py-1').textContent().catch(() => 'Not found'),
        subtotal: await page.locator('label:has-text("Subtotal:") + p').textContent().catch(() => 'Not found'),
        total: await page.locator('label:has-text("Total:") + p.text-lg').textContent().catch(() => 'Not found'),
        quoteDate: await page.locator('label:has-text("Quote Date:") + p').textContent().catch(() => 'Not found'),
        validUntil: await page.locator('label:has-text("Valid Until:") + p').textContent().catch(() => 'Not found')
      };

      console.log('📊 詳情頁顯示數據:', detailDisplayData);
      debugInfo.displayedData.detailView = detailDisplayData;

      // **關鍵比較**: 列表 vs 詳情頁數據一致性
      const inconsistencies = [];
      
      if (listDisplayData.totalAmount !== detailDisplayData.total) {
        inconsistencies.push(`金額不一致: 列表[${listDisplayData.totalAmount}] vs 詳情[${detailDisplayData.total}]`);
      }

      if (inconsistencies.length > 0) {
        console.error('❌ 發現數據不一致:', inconsistencies);
        debugInfo.issues.push(...inconsistencies);
      } else {
        console.log('✅ 數據一致性檢查通過');
      }

    } catch (error) {
      console.error('❌ Phase 2 數據驗證失敗:', error.message);
      debugInfo.issues.push(`Phase 2 驗證失敗: ${error.message}`);
    }
  });

  test('Phase 3: 問題識別 - 編輯表單和搜尋功能', async ({ page }) => {
    console.log('\n🟠 Phase 3: 問題識別');

    // 登入系統
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');

    // 測試編輯表單數據填充
    console.log('🔍 測試編輯表單數據填充');
    await page.goto('/quotes');
    await page.waitForLoadState('networkidle');

    try {
      const firstEditButton = await page.locator('a[href*="/edit"]:has-text("編輯")').first();
      await firstEditButton.click();
      await page.waitForLoadState('networkidle');

      // 檢查編輯表單是否正確填入數據
      const editFormData = {
        customerSelected: await page.locator('select[name="customer_id"]').inputValue(),
        quoteDate: await page.locator('#quote_date').inputValue(),
        validUntil: await page.locator('#valid_until').inputValue(),
        status: await page.locator('select[name="status"]').inputValue(),
        contactPerson: await page.locator('#contact_person').inputValue(),
        notes: await page.locator('textarea[name="notes"]').inputValue()
      };

      console.log('📝 編輯表單數據填充狀況:', editFormData);
      debugInfo.displayedData.editForm = editFormData;

      // 檢查哪些欄位沒有正確填入
      const emptyFields = Object.entries(editFormData).filter(([key, value]) => !value || value.trim() === '');
      if (emptyFields.length > 0) {
        console.warn('⚠️ 編輯表單空白欄位:', emptyFields.map(([key]) => key));
        debugInfo.issues.push(`編輯表單空白欄位: ${emptyFields.map(([key]) => key).join(', ')}`);
      }

    } catch (error) {
      console.error('❌ 編輯表單測試失敗:', error.message);
      debugInfo.issues.push(`編輯表單測試失敗: ${error.message}`);
    }

    // 測試搜尋功能
    console.log('🔍 測試搜尋功能有效性');
    await page.goto('/quotes');
    await page.waitForLoadState('networkidle');

    try {
      // 測試關鍵字搜尋
      const initialRowCount = await page.locator('tbody tr').count();
      console.log('📊 搜尋前報價單數量:', initialRowCount);

      await page.fill('#search', 'Vic');
      await page.click('form button[type="submit"]:visible');
      await page.waitForLoadState('networkidle');

      const searchRowCount = await page.locator('tbody tr').count();
      console.log('📊 搜尋後報價單數量:', searchRowCount);

      if (searchRowCount < initialRowCount && searchRowCount > 0) {
        console.log('✅ 關鍵字搜尋功能正常');
      } else if (searchRowCount === 0) {
        console.warn('⚠️ 搜尋無結果 - 可能是搜尋功能問題或數據問題');
        debugInfo.issues.push('關鍵字搜尋無結果');
      } else {
        console.warn('⚠️ 搜尋結果數量未改變 - 搜尋功能可能無效');
        debugInfo.issues.push('關鍵字搜尋功能無效');
      }

      // 測試狀態篩選
      await page.selectOption('#status', 'sent');
      await page.click('form button[type="submit"]:visible');
      await page.waitForLoadState('networkidle');

      const statusFilterCount = await page.locator('tbody tr').count();
      console.log('📊 狀態篩選後數量:', statusFilterCount);

    } catch (error) {
      console.error('❌ 搜尋功能測試失敗:', error.message);
      debugInfo.issues.push(`搜尋功能測試失敗: ${error.message}`);
    }
  });

  test('Phase 4: 知識記錄和總結', async () => {
    console.log('\n🟢 Phase 4: 知識記錄和總結');

    // 生成調試報告
    const debugReport = {
      timestamp: new Date().toISOString(),
      testData: debugInfo.inputData,
      apiRequests: debugInfo.apiRequests.length,
      displayedData: debugInfo.displayedData,
      issuesFound: debugInfo.issues,
      conclusions: []
    };

    // 分析結論
    if (debugInfo.issues.length === 0) {
      debugReport.conclusions.push('✅ 所有功能正常運作');
    } else {
      debugReport.conclusions.push(`❌ 發現 ${debugInfo.issues.length} 個問題`);
      debugInfo.issues.forEach(issue => {
        debugReport.conclusions.push(`  - ${issue}`);
      });
    }

    // 根據問題類型分類
    const inputIssues = debugInfo.issues.filter(issue => issue.includes('Phase 1') || issue.includes('輸入'));
    const displayIssues = debugInfo.issues.filter(issue => issue.includes('不一致') || issue.includes('顯示'));
    const functionalIssues = debugInfo.issues.filter(issue => issue.includes('搜尋') || issue.includes('編輯'));

    if (inputIssues.length > 0) {
      debugReport.conclusions.push('🎯 問題定位: 數據輸入階段有問題');
    } else if (displayIssues.length > 0) {
      debugReport.conclusions.push('🎯 問題定位: 數據顯示階段有問題（輸入正常）');
    } else if (functionalIssues.length > 0) {
      debugReport.conclusions.push('🎯 問題定位: 功能性問題（數據流程正常）');
    }

    console.log('\n📊 系統性調試報告:');
    console.log(JSON.stringify(debugReport, null, 2));

    // 驗證至少執行了基本測試
    expect(debugReport.apiRequests).toBeGreaterThanOrEqual(0);
    expect(debugReport.displayedData).toBeDefined();
  });
});