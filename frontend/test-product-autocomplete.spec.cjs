const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  console.log('🔍 測試報價表單產品自動完成功能...');
  
  // 設置監聽器
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('❌ JavaScript錯誤:', msg.text());
    }
  });
  
  page.on('request', request => {
    if (request.url().includes('/api/products/search')) {
      console.log('📤 產品搜尋API請求:', request.url());
    }
  });
  
  page.on('response', response => {
    if (response.url().includes('/api/products/search')) {
      console.log('📥 產品搜尋API回應:', response.status(), response.url());
    }
  });
  
  try {
    // 步驟1: 登入
    console.log('📍 步驟1: 登入系統');
    await page.goto('http://127.0.0.1:8000/login');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    
    console.log('✅ 登入完成');
    
    // 步驟2: 訪問報價建立頁面
    console.log('📍 步驟2: 訪問報價建立頁面');
    await page.goto('http://127.0.0.1:8000/quotes/create');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    console.log('✅ 報價頁面載入完成');
    
    // 步驟3: 尋找產品搜尋輸入框
    console.log('📍 步驟3: 尋找產品搜尋輸入框');
    
    const productInputSelectors = [
      'input[placeholder*="搜尋產品"]',
      'input[placeholder*="產品"]',
      'input[placeholder*="product"]',
      'input[name*="product"]',
      '.product-search input',
      '#product-search',
      'input[data-autocomplete]'
    ];
    
    let productInput = null;
    let usedSelector = '';
    
    for (const selector of productInputSelectors) {
      const elements = await page.locator(selector);
      const count = await elements.count();
      
      if (count > 0) {
        console.log(`✅ 找到產品輸入框: ${selector} (數量: ${count})`);
        productInput = elements.first();
        usedSelector = selector;
        break;
      }
    }
    
    if (!productInput) {
      console.log('❌ 未找到明確的產品搜尋輸入框');
      
      // 列出所有輸入框
      const allInputs = await page.locator('input[type="text"], input:not([type])').all();
      console.log('📝 所有文字輸入框:');
      
      for (let i = 0; i < allInputs.length; i++) {
        const input = allInputs[i];
        const placeholder = await input.getAttribute('placeholder') || '';
        const name = await input.getAttribute('name') || '';
        const id = await input.getAttribute('id') || '';
        const className = await input.getAttribute('class') || '';
        
        console.log(`  ${i + 1}. placeholder="${placeholder}" name="${name}" id="${id}" class="${className}"`);
        
        // 如果找到可能的產品輸入框
        if (placeholder.includes('產品') || placeholder.includes('搜尋') || 
            name.includes('product') || className.includes('product')) {
          productInput = input;
          usedSelector = `input[placeholder="${placeholder}"]`;
          console.log(`🎯 選擇此輸入框作為產品搜尋框`);
          break;
        }
      }
    }
    
    // 步驟4: 測試產品自動完成
    if (productInput) {
      console.log('📍 步驟4: 測試產品自動完成功能');
      
      // 聚焦到輸入框
      await productInput.focus();
      console.log('🎯 已聚焦到產品輸入框');
      
      await page.screenshot({ path: 'product-input-focused.png' });
      
      // 測試不同的搜尋關鍵字
      const searchTerms = ['產品', 'test', 'laptop', 'A'];
      
      for (const term of searchTerms) {
        console.log(`\n🔍 測試搜尋關鍵字: "${term}"`);
        
        // 清空輸入框
        await productInput.clear();
        
        // 輸入搜尋關鍵字
        await productInput.fill(term);
        
        // 等待API請求和回應
        await page.waitForTimeout(1500);
        
        // 截圖記錄狀態
        await page.screenshot({ 
          path: `product-search-${term.replace(/[^a-zA-Z0-9]/g, '_')}.png` 
        });
        
        // 檢查是否出現下拉選單或建議
        const dropdownSelectors = [
          '.dropdown-menu',
          '.autocomplete-dropdown', 
          '.search-dropdown',
          '.suggestions',
          '.autocomplete-results',
          'ul[role="listbox"]',
          '.product-list',
          '.search-results',
          '[data-dropdown]'
        ];
        
        let foundDropdown = false;
        let dropdownSelector = '';
        
        for (const selector of dropdownSelectors) {
          const dropdown = page.locator(selector);
          const isVisible = await dropdown.isVisible().catch(() => false);
          
          if (isVisible) {
            foundDropdown = true;
            dropdownSelector = selector;
            
            const itemCount = await dropdown.locator('li, .item, .option').count();
            console.log(`  ✅ 找到下拉選單: ${selector}, 項目數: ${itemCount}`);
            
            // 顯示前幾個項目
            const items = await dropdown.locator('li, .item, .option').all();
            for (let i = 0; i < Math.min(items.length, 3); i++) {
              const itemText = await items[i].textContent();
              console.log(`    ${i + 1}. ${itemText?.trim()}`);
            }
            
            // 嘗試點擊第一個項目
            if (items.length > 0) {
              console.log(`  🖱️ 嘗試點擊第一個項目`);
              await items[0].click();
              await page.waitForTimeout(1000);
              
              const inputValue = await productInput.inputValue();
              console.log(`  📝 選擇後輸入框值: "${inputValue}"`);
            }
            
            break;
          }
        }
        
        if (!foundDropdown) {
          console.log(`  ❌ 未找到下拉選單`);
          
          // 檢查是否有 JavaScript 錯誤
          const consoleErrors = [];
          page.on('console', msg => {
            if (msg.type() === 'error') {
              consoleErrors.push(msg.text());
            }
          });
          
          if (consoleErrors.length > 0) {
            console.log(`  🐛 JavaScript錯誤: ${consoleErrors.join(', ')}`);
          }
        }
      }
      
      // 步驟5: 檢查網路請求
      console.log('\n📍 步驟5: 檢查網路請求記錄');
      
      // 手動觸發搜尋並監控請求
      await productInput.clear();
      await productInput.fill('test');
      
      // 等待可能的網路請求
      await page.waitForTimeout(2000);
      
      console.log('📊 網路請求檢查完成');
      
    } else {
      console.log('❌ 無法找到產品輸入框，跳過自動完成測試');
    }
    
    // 步驟6: 最終狀態截圖
    console.log('📍 步驟6: 保存最終狀態');
    await page.screenshot({ path: 'product-autocomplete-final.png', fullPage: true });
    
    console.log('✅ 產品自動完成功能測試完成');
    
  } catch (error) {
    console.log('❌ 測試過程發生錯誤:', error.message);
  } finally {
    await browser.close();
  }
})();