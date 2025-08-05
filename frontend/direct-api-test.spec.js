import { test, expect } from '@playwright/test';

test('直接 API 測試', async ({ page }) => {
  console.log('🚀 開始直接 API 測試...');
  
  // 登入
  await page.goto('http://127.0.0.1:8000/login');
  await page.locator('input[type="email"]').fill('test@example.com');
  await page.locator('input[type="password"]').fill('password123');
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(/.*\/(dashboard|home|$)/, { timeout: 10000 });
  
  console.log('✅ 登入成功');
  
  // 獲取 CSRF token
  await page.goto('http://127.0.0.1:8000/orders/purchase/create');
  await page.waitForSelector('#purchase-order-form');
  
  const csrfToken = await page.evaluate(() => {
    const metaToken = document.querySelector('meta[name="csrf-token"]');
    const inputToken = document.querySelector('input[name="_token"]');
    return metaToken ? metaToken.getAttribute('content') : 
           inputToken ? inputToken.value : null;
  });
  
  console.log('📋 CSRF Token:', csrfToken ? 'Found' : 'Not found');
  
  // 準備測試資料
  const testData = {
    supplier_id: 258, // 使用實際存在的供應商 ID
    order_date: new Date().toISOString().split('T')[0],
    expected_delivery_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    currency: 'USD',
    payment_terms: 'Net 30 days',
    notes: 'Playwright API 測試',
    items: [
      {
        product_id: 765, // 使用實際存在的產品 ID
        quantity: 10,
        unit_price: 25.50
      }
    ]
  };
  
  console.log('📊 測試資料準備完成:', JSON.stringify(testData, null, 2));
  
  // 直接調用 API
  const response = await page.evaluate(async (data) => {
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || 
                     document.querySelector('input[name="_token"]')?.value;
    
    try {
      const response = await fetch('/api/purchase-orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': csrfToken
        },
        body: JSON.stringify(data)
      });
      
      const result = {
        status: response.status,
        statusText: response.statusText,
        data: null,
        error: null
      };
      
      try {
        const text = await response.text();
        try {
          result.data = JSON.parse(text);
        } catch (e) {
          result.error = 'Failed to parse JSON response';
          result.rawResponse = text.substring(0, 500); // 顯示前 500 字元
        }
      } catch (e) {
        result.error = 'Failed to get response text';
      }
      
      return result;
    } catch (error) {
      return {
        status: 0,
        statusText: 'Network Error',
        data: null,
        error: error.message
      };
    }
  }, testData);
  
  console.log('📊 API 回應:', JSON.stringify(response, null, 2));
  
  if (response.status === 201 || response.status === 200) {
    console.log('🎉 採購單創建成功！');
    console.log('📋 採購單資料:', response.data);
  } else if (response.status === 422) {
    console.log('❌ 驗證錯誤');
    console.log('📋 錯誤詳情:', response.data);
  } else if (response.status === 500) {
    console.log('❌ 伺服器錯誤');
    // 檢查 Laravel 日誌
    console.log('請檢查 Laravel 日誌以獲取詳細錯誤資訊');
  } else {
    console.log('❌ 其他錯誤');
    console.log('📋 錯誤資訊:', response);
  }
  
  console.log('🎯 直接 API 測試完成！');
});