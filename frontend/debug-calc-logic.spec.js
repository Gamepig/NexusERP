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

test.describe('Sales Order Calculation Logic Debug', () => {
  
  test('debug calculation function execution', async ({ page }) => {
    await login(page);
    
    // Navigate to sales order creation
    await page.goto('http://127.0.0.1:8000/orders/sales/create');
    await page.waitForLoadState('networkidle');
    
    // 添加控制台監聽
    const consoleMessages = [];
    page.on('console', msg => {
      consoleMessages.push(`${msg.type()}: ${msg.text()}`);
    });
    
    // 點擊新增項目
    await page.click('#addItemBtn');
    await page.waitForTimeout(1000);
    
    // 注入調試程式碼來檢查 updateItemSubtotal 函式
    await page.evaluate(() => {
      // 重寫 updateItemSubtotal 函式來添加調試
      const originalUpdateItemSubtotal = window.updateItemSubtotal;
      
      window.updateItemSubtotal = function(itemElement) {
        console.log('=== updateItemSubtotal called ===');
        console.log('itemElement:', itemElement);
        
        const quantityInput = itemElement.querySelector('.quantity-input');
        const priceInput = itemElement.querySelector('.price-input');
        const subtotalElement = itemElement.querySelector('.item-subtotal');
        
        console.log('quantityInput:', quantityInput);
        console.log('quantityInput value:', quantityInput ? quantityInput.value : 'null');
        console.log('priceInput:', priceInput);
        console.log('priceInput value:', priceInput ? priceInput.value : 'null');
        console.log('subtotalElement:', subtotalElement);
        
        if (!quantityInput || !priceInput || !subtotalElement) {
          console.warn('Missing required elements in item row for subtotal calculation');
          return;
        }
        
        const quantity = parseFloat(quantityInput.value) || 0;
        const price = parseFloat(priceInput.value) || 0;
        const subtotal = quantity * price;
        
        console.log('parsed quantity:', quantity);
        console.log('parsed price:', price);
        console.log('calculated subtotal:', subtotal);
        
        subtotalElement.textContent = `$${subtotal.toLocaleString('en-US', {minimumFractionDigits: 2})}`;
        console.log('updated subtotalElement.textContent:', subtotalElement.textContent);
        
        // 調用原始的 updateTotals 函式
        if (typeof window.updateTotals === 'function') {
          console.log('calling updateTotals...');
          window.updateTotals();
        } else {
          console.error('updateTotals function not found');
        }
      };
      
      // 重寫 updateTotals 函式來添加調試
      const originalUpdateTotals = window.updateTotals;
      
      window.updateTotals = function() {
        console.log('=== updateTotals called ===');
        let subtotal = 0;
        
        const itemRows = document.querySelectorAll('.item-row');
        console.log('found item rows:', itemRows.length);
        
        itemRows.forEach((itemElement, index) => {
          const quantityInput = itemElement.querySelector('.quantity-input');
          const priceInput = itemElement.querySelector('.price-input');
          
          console.log(`item ${index}:`);
          console.log('  quantityInput:', quantityInput);
          console.log('  quantityInput.value:', quantityInput ? quantityInput.value : 'null');
          console.log('  priceInput:', priceInput);
          console.log('  priceInput.value:', priceInput ? priceInput.value : 'null');
          
          if (quantityInput && priceInput && quantityInput.value !== '' && priceInput.value !== '') {
            const quantity = parseFloat(quantityInput.value) || 0;
            const price = parseFloat(priceInput.value) || 0;
            
            console.log('  parsed quantity:', quantity);
            console.log('  parsed price:', price);
            
            if (quantity > 0 && price >= 0) {
              const itemSubtotal = quantity * price;
              subtotal += itemSubtotal;
              console.log('  item subtotal:', itemSubtotal);
              console.log('  running total:', subtotal);
            }
          }
        });
        
        const taxRate = 0.05;
        const taxAmount = subtotal * taxRate;
        const total = subtotal + taxAmount;
        
        console.log('final subtotal:', subtotal);
        console.log('tax amount:', taxAmount);
        console.log('final total:', total);
        
        const subtotalElement = document.getElementById('subtotalAmount');
        const taxElement = document.getElementById('taxAmount');
        const totalElement = document.getElementById('totalAmount');
        
        console.log('subtotalElement:', subtotalElement);
        console.log('taxElement:', taxElement);
        console.log('totalElement:', totalElement);
        
        if (subtotalElement) {
          subtotalElement.textContent = `$${subtotal.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
          console.log('updated subtotalElement.textContent:', subtotalElement.textContent);
        }
        
        if (taxElement) {
          taxElement.textContent = `$${taxAmount.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
          console.log('updated taxElement.textContent:', taxElement.textContent);
        }
        
        if (totalElement) {
          totalElement.textContent = `$${total.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
          console.log('updated totalElement.textContent:', totalElement.textContent);
        }
      };
      
      console.log('Debug functions injected successfully');
    });
    
    // 填入測試數據
    await page.locator('.quantity-input').first().fill('2');
    console.log('Filled quantity field');
    
    await page.locator('.price-input').first().fill('399');
    console.log('Filled price field');
    
    // 觸發計算事件
    await page.locator('.price-input').first().blur();
    await page.waitForTimeout(2000);
    
    // 手動觸發計算函式
    await page.evaluate(() => {
      const itemElement = document.querySelector('.item-row');
      if (itemElement && typeof window.updateItemSubtotal === 'function') {
        console.log('Manually calling updateItemSubtotal...');
        window.updateItemSubtotal(itemElement);
      } else {
        console.error('Cannot manually call updateItemSubtotal');
      }
    });
    
    await page.waitForTimeout(1000);
    
    // 檢查結果
    const itemSubtotal = await page.locator('.item-subtotal').first().textContent();
    const totalAmount = await page.locator('#totalAmount').textContent();
    
    console.log('Final item subtotal:', itemSubtotal);
    console.log('Final total amount:', totalAmount);
    
    // 輸出所有控制台訊息
    console.log('\n=== Console Messages ===');
    consoleMessages.forEach(msg => console.log(msg));
    
    // 截圖最終結果
    await page.screenshot({ path: 'screenshots/debug-calculation-final.png', fullPage: true });
  });
});