import { test, expect } from '@playwright/test';

const baseURL = 'http://127.0.0.1:8000';
const testAccount = {
  email: 'test@example.com',
  password: 'password123'
};

test.describe('API 庫存數據測試', () => {
  
  test('直接測試產品 API 數據', async ({ page }) => {
    console.log('🚀 開始直接測試產品 API 數據...');
    
    // 登入
    await page.goto(`${baseURL}/login`);
    await page.fill('input[name="email"]', testAccount.email);
    await page.fill('input[name="password"]', testAccount.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*\/dashboard.*/);
    console.log('✅ 登入成功');
    
    // 直接 API 請求
    try {
      const apiResponse = await page.request.get(`${baseURL}/api/products`, {
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          'Accept': 'application/json'
        }
      });
      
      if (apiResponse.ok()) {
        const apiData = await apiResponse.json();
        console.log('📡 API 請求成功');
        console.log('📡 響應狀態:', apiResponse.status());
        
        if (apiData.data) {
          const products = Array.isArray(apiData.data) ? 
            apiData.data : 
            (apiData.data.data || []);
          
          console.log(`📊 API 返回產品數量: ${products.length}`);
          
          // 顯示所有產品的詳細庫存資訊
          console.log('\n📊 所有產品詳細庫存資訊:');
          products.forEach((product, index) => {
            console.log(`\n產品 ${index + 1}:`);
            console.log(`  ID: ${product.id}`);
            console.log(`  名稱: ${product.name}`);
            console.log(`  SKU: ${product.sku}`);
            console.log(`  庫存數量: ${product.stock_quantity}`);
            console.log(`  低庫存警告: ${product.low_stock_threshold}`);
            console.log(`  分類ID: ${product.category_id}`);
            console.log(`  價格: ${product.price}`);
            
            // 特別標記產品857
            if (product.id == 857) {
              console.log(`🎯 *** 這是產品857 ***`);
              console.log(`🎯 完整產品857資訊:`, JSON.stringify(product, null, 2));
            }
          });
          
          // 檢查是否有庫存為0的產品
          const zeroStockProducts = products.filter(p => p.stock_quantity == 0);
          console.log(`\n⚠️  庫存為0的產品數量: ${zeroStockProducts.length}`);
          
          zeroStockProducts.forEach(product => {
            console.log(`  - 產品 ${product.id} (${product.name}): 庫存=${product.stock_quantity}`);
          });
          
          // 檢查是否有正常庫存的產品
          const normalStockProducts = products.filter(p => p.stock_quantity > 0);
          console.log(`\n✅ 有庫存的產品數量: ${normalStockProducts.length}`);
          
          normalStockProducts.forEach(product => {
            console.log(`  - 產品 ${product.id} (${product.name}): 庫存=${product.stock_quantity}`);
          });
          
        } else {
          console.error('❌ API 響應中沒有產品數據');
          console.log('完整響應:', JSON.stringify(apiData, null, 2));
        }
      } else {
        console.error('❌ API 請求失敗:', apiResponse.status());
        const errorText = await apiResponse.text();
        console.error('錯誤內容:', errorText);
      }
    } catch (error) {
      console.error('❌ API 請求發生錯誤:', error.message);
    }
    
    console.log('🎉 API 數據測試完成！');
  });
});