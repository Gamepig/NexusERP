import { test, expect } from '@playwright/test';

const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'password123';

async function login(page) {
  await page.goto('http://127.0.0.1:8000/login');
  await page.fill('input[name="email"]', TEST_EMAIL);
  await page.fill('input[name="password"]', TEST_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');
}

test.describe('Sales Order Debug Tests', () => {
  
  test('debug form structure and element existence', async ({ page }) => {
    await login(page);
    
    // Navigate to sales order creation
    await page.goto('http://127.0.0.1:8000/orders/sales/create');
    await page.waitForLoadState('networkidle');
    
    // 截圖來檢查實際的頁面樣貌
    await page.screenshot({ path: 'screenshots/sales-order-form.png', fullPage: true });
    
    // 檢查頁面標題
    const title = await page.title();
    console.log('Page title:', title);
    
    // 檢查是否有表單
    const formExists = await page.locator('form').count();
    console.log('Form count:', formExists);
    
    // 檢查是否有新增項目按鈕
    const addItemBtn = await page.locator('#addItemBtn').count();
    console.log('Add Item Button count:', addItemBtn);
    
    if (addItemBtn > 0) {
      console.log('✓ Add Item Button found, clicking it...');
      await page.click('#addItemBtn');
      await page.waitForTimeout(2000);
      
      // 再次截圖看添加項目後的狀態
      await page.screenshot({ path: 'screenshots/after-add-item.png', fullPage: true });
      
      // 檢查項目行
      const itemRows = await page.locator('.item-row').count();
      console.log('Item rows after adding:', itemRows);
      
      if (itemRows > 0) {
        // 檢查數量和價格輸入框
        const quantityInputs = await page.locator('.quantity-input').count();
        const priceInputs = await page.locator('.price-input').count();
        
        console.log('Quantity inputs:', quantityInputs);
        console.log('Price inputs:', priceInputs);
        
        if (quantityInputs > 0 && priceInputs > 0) {
          console.log('✓ Input fields found, testing calculation...');
          
          // 輸入測試數據
          await page.locator('.quantity-input').first().fill('2');
          await page.locator('.price-input').first().fill('399');
          
          // 觸發計算事件
          await page.locator('.price-input').first().blur();
          await page.waitForTimeout(1000);
          
          // 截圖計算結果
          await page.screenshot({ path: 'screenshots/calculation-result.png', fullPage: true });
          
          // 檢查小計顯示
          const itemSubtotal = await page.locator('.item-subtotal').first().textContent();
          console.log('Item subtotal:', itemSubtotal);
          
          // 檢查總計顯示
          const totalAmount = await page.locator('#totalAmount').textContent();
          console.log('Total amount:', totalAmount);
          
          // 檢查是否有 JavaScript 錯誤
          const jsErrors = [];
          page.on('pageerror', error => jsErrors.push(error.message));
          page.on('console', msg => {
            if (msg.type() === 'error') {
              console.log('Console error:', msg.text());
            }
          });
          
          // 等待一段時間收集錯誤
          await page.waitForTimeout(2000);
          
          if (jsErrors.length > 0) {
            console.log('JavaScript errors found:', jsErrors);
          } else {
            console.log('No JavaScript errors detected');
          }
        }
      }
    } else {
      console.log('❌ Add Item Button not found');
      
      // 列出所有按鈕來調試
      const allButtons = await page.locator('button').all();
      console.log('All buttons found:');
      for (let i = 0; i < allButtons.length; i++) {
        const buttonText = await allButtons[i].textContent();
        const buttonId = await allButtons[i].getAttribute('id');
        const buttonClass = await allButtons[i].getAttribute('class');
        console.log(`  Button ${i}: text="${buttonText}", id="${buttonId}", class="${buttonClass}"`);
      }
    }
  });
});