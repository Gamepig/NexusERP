// NexusERP 報表功能簡化驗證測試
import { test, expect } from '@playwright/test';

const baseURL = 'http://127.0.0.1:8000';
const testUser = {
  email: 'test@example.com',
  password: 'password123'
};

test.describe('NexusERP 報表功能簡化驗證', () => {
  let page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    
    // 登入系統
    await page.goto(`${baseURL}/login`);
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.click('button[type="submit"]');
    
    // 等待登入完成
    await page.waitForURL(`${baseURL}/dashboard`);
    await page.waitForLoadState('networkidle');
  });

  test.afterEach(async () => {
    await page?.close();
  });

  // 完整的端到端測試
  test('完整端到端測試 - 所有報表頁面', async () => {
    console.log('🧪 開始完整端到端測試');
    
    const reportPages = [
      { url: '/reports/sales', name: '銷售總覽', expected: '銷售報表' },
      { url: '/reports/sales/by-product', name: '產品分析', expected: '產品銷售分析' },
      { url: '/reports/sales/by-customer', name: '客戶分析', expected: '客戶銷售分析' },
      { url: '/reports/sales/trends', name: '趨勢分析', expected: '銷售趨勢' }
    ];
    
    // 收集所有 API 請求
    const allApiRequests = [];
    page.on('response', response => {
      if (response.url().includes('/api/')) {
        allApiRequests.push({
          url: response.url(),
          status: response.status(),
          statusText: response.statusText(),
          page: 'unknown'
        });
      }
    });
    
    const results = [];
    
    for (const reportPage of reportPages) {
      console.log(`🔍 測試 ${reportPage.name}: ${reportPage.url}`);
      
      try {
        // 訪問頁面
        await page.goto(`${baseURL}${reportPage.url}`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(3000); // 給 API 請求時間
        
        // 截圖
        await page.screenshot({ 
          path: `screenshots/verification-${reportPage.name.replace(/\//g, '-')}.png`,
          fullPage: true 
        });
        
        // 檢查頁面內容
        const pageContent = await page.content();
        const pageTitle = await page.title();
        
        // 分析結果
        const result = {
          page: reportPage.name,
          url: reportPage.url,
          success: true,
          errors: [],
          warnings: [],
          hasExpectedContent: pageContent.includes(reportPage.expected) || pageTitle.includes(reportPage.expected),
          pageSize: new Blob([pageContent]).size,
          hasErrorMessage: pageContent.includes('載入銷售報表失敗') || pageContent.includes('error'),
          has500Error: pageContent.includes('500') || pageContent.includes('Server Error'),
          hasApiError: false
        };
        
        // 檢查各種問題
        if (result.has500Error) {
          result.errors.push('頁面包含 500 錯誤');
          result.success = false;
        }
        
        if (result.hasErrorMessage) {
          result.errors.push('頁面顯示錯誤訊息');
          result.success = false;
        }
        
        if (!result.hasExpectedContent) {
          result.warnings.push('頁面可能未包含預期內容');
        }
        
        if (result.pageSize < 1000) {
          result.warnings.push('頁面內容偏少，可能載入不完整');
        }
        
        results.push(result);
        
        console.log(`${result.success ? '✅' : '❌'} ${reportPage.name}: ${result.success ? '通過' : '失敗'}`);
        if (result.errors.length > 0) {
          console.log(`   錯誤: ${result.errors.join(', ')}`);
        }
        if (result.warnings.length > 0) {
          console.log(`   警告: ${result.warnings.join(', ')}`);
        }
        
      } catch (error) {
        console.log(`❌ ${reportPage.name} 測試失敗: ${error.message}`);
        results.push({
          page: reportPage.name,
          url: reportPage.url,
          success: false,
          errors: [`測試執行失敗: ${error.message}`],
          warnings: []
        });
      }
    }
    
    // 分析 API 請求
    console.log(`\n📊 API 請求分析 (總共 ${allApiRequests.length} 個請求):`);
    const apiErrors = allApiRequests.filter(req => req.status >= 400);
    const api500Errors = allApiRequests.filter(req => req.status >= 500);
    
    if (apiErrors.length > 0) {
      console.log(`❌ 發現 ${apiErrors.length} 個 API 錯誤:`);
      apiErrors.forEach(req => {
        console.log(`   ${req.status} ${req.statusText}: ${req.url}`);
      });
    } else {
      console.log('✅ 所有 API 請求狀態正常');
    }
    
    // 生成最終報告
    console.log('\n📋 最終測試報告:');
    const successCount = results.filter(r => r.success).length;
    const totalCount = results.length;
    
    console.log(`✅ 成功: ${successCount}/${totalCount}`);
    console.log(`❌ 失敗: ${totalCount - successCount}/${totalCount}`);
    console.log(`🌐 API 錯誤: ${apiErrors.length} 個`);
    console.log(`🚨 嚴重錯誤: ${api500Errors.length} 個`);
    
    if (successCount === totalCount && api500Errors.length === 0) {
      console.log('\n🎉 所有測試通過！報表功能已完全修復！');
    } else if (successCount > 0 && api500Errors.length === 0) {
      console.log('\n⚠️  部分測試通過，但仍有改進空間');
    } else {
      console.log('\n❌ 仍存在嚴重問題需要修復');
    }
    
    // 根據測試結果決定是否通過
    expect(api500Errors.length).toBe(0); // 不能有 500 錯誤
    expect(successCount).toBeGreaterThan(totalCount / 2); // 至少一半的頁面要成功
  });
});