/**
 * 動態產品下拉選單測試
 * 專門測試動態載入的產品下拉選單功能
 */

import { chromium } from 'playwright';

async function testDynamicProductDropdown() {
  console.log('🚀 開始動態產品下拉選單測試...');
  
  const browser = await chromium.launch({ 
    headless: false, 
    slowMo: 500,
    args: ['--start-maximized']
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    ignoreHTTPSErrors: true
  });
  
  const page = await context.newPage();
  
  // 監控關鍵的控制台訊息
  const importantMessages = [];
  
  page.on('console', msg => {
    const text = msg.text();
    const type = msg.type();
    
    // 記錄重要訊息
    if (text.includes('產品') || text.includes('product') || 
        text.includes('項目') || text.includes('item') ||
        text.includes('載入') || text.includes('數據') ||
        text.includes('populateServerData') || text.includes('addItem')) {
      
      const message = `[${type.toUpperCase()}] ${text}`;
      console.log(message);
      importantMessages.push(message);
    }
  });
  
  page.on('pageerror', error => {
    console.log(`[JS ERROR] ${error.message}`);
    importantMessages.push(`[JS ERROR] ${error.message}`);
  });
  
  try {
    // 步驟 1: 登入
    console.log('\n🔐 步驟 1: 登入系統');
    await page.goto('http://127.0.0.1:8000/login');
    await page.waitForTimeout(2000);
    
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    // 步驟 2: 導航到編輯頁面
    console.log('\n🌐 步驟 2: 導航到銷售訂單編輯頁面');
    await page.goto('http://127.0.0.1:8000/orders/sales/7268/edit');
    
    // 等待基礎頁面載入
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'screenshots/dynamic-test-initial.png', fullPage: true });
    
    // 步驟 3: 等待動態內容載入
    console.log('\n⏳ 步驟 3: 等待動態內容載入');
    
    // 等待載入指示器消失
    try {
      console.log('等待載入指示器消失...');
      await page.waitForSelector('text=正在載入資料...', { state: 'detached', timeout: 15000 });
      console.log('✅ 載入指示器已消失');
    } catch (e) {
      console.log('⚠️ 載入指示器超時或未找到');
    }
    
    // 等待訂單項目出現
    try {
      console.log('等待訂單項目出現...');
      await page.waitForSelector('.item-row', { timeout: 15000 });
      console.log('✅ 訂單項目已出現');
    } catch (e) {
      console.log('⚠️ 訂單項目未出現，檢查是否需要手動添加');
    }
    
    await page.waitForTimeout(5000); // 額外等待確保 JavaScript 完成執行
    await page.screenshot({ path: 'screenshots/dynamic-test-loaded.png', fullPage: true });
    
    // 步驟 4: 檢查動態載入後的產品下拉選單
    console.log('\n🔍 步驟 4: 檢查產品下拉選單');
    
    // 尋找產品下拉選單
    const productSelectors = [
      '.product-select',          // 主要選擇器
      'select[name*="product_id"]', // 名稱包含 product_id
      'select[name*="items"]',    // 名稱包含 items
      '.item-row select'          // 項目行中的 select
    ];
    
    let foundDropdowns = [];
    let totalDropdowns = 0;
    
    for (const selector of productSelectors) {
      try {
        const elements = page.locator(selector);
        const count = await elements.count();
        if (count > 0) {
          console.log(`✅ ${selector}: 找到 ${count} 個下拉選單`);
          foundDropdowns.push({ selector, count, elements });
          totalDropdowns += count;
        }
      } catch (e) {
        console.log(`❌ ${selector}: 檢查失敗`);
      }
    }
    
    console.log(`\n📊 總共找到 ${totalDropdowns} 個產品下拉選單`);
    
    if (totalDropdowns === 0) {
      console.log('\n❌ 未找到任何產品下拉選單');
      
      // 檢查是否需要點擊"新增項目"按鈕
      try {
        const addButton = page.locator('#addItemBtn, button:has-text("新增項目")');
        const buttonExists = await addButton.count() > 0;
        
        if (buttonExists) {
          console.log('🔘 發現"新增項目"按鈕，嘗試點擊...');
          await addButton.click();
          await page.waitForTimeout(3000);
          
          // 重新檢查產品下拉選單
          const newCount = await page.locator('.product-select').count();
          console.log(`🔄 點擊後找到 ${newCount} 個產品下拉選單`);
          
          if (newCount > 0) {
            foundDropdowns = [{ 
              selector: '.product-select', 
              count: newCount, 
              elements: page.locator('.product-select') 
            }];
            totalDropdowns = newCount;
          }
        }
      } catch (e) {
        console.log('⚠️ 點擊新增項目按鈕失敗');
      }
    }
    
    // 步驟 5: 詳細分析找到的產品下拉選單
    if (totalDropdowns > 0) {
      console.log('\n📋 步驟 5: 分析產品下拉選單內容');
      
      const results = {
        totalDropdowns,
        dropdownsWithProducts: 0,
        dropdownsWithPlaceholder: 0,
        dropdownsWithTarget857: 0,
        dropdownsWithTarget854: 0,
        selectedProducts: []
      };
      
      // 分析每個找到的下拉選單組
      for (const { selector, count, elements } of foundDropdowns) {
        console.log(`\n--- 分析 ${selector} (${count} 個) ---`);
        
        for (let i = 0; i < count; i++) {
          const dropdown = elements.nth(i);
          
          try {
            // 獲取所有選項
            const options = await dropdown.locator('option').allTextContents();
            const optionValues = await dropdown.locator('option').evaluateAll(opts => 
              opts.map(opt => opt.value)
            );
            
            console.log(`下拉選單 ${i + 1}:`);
            console.log(`  - 選項數量: ${options.length}`);
            console.log(`  - 前3個選項: ${JSON.stringify(options.slice(0, 3))}`);
            
            // 檢查是否包含目標產品
            const hasProduct857 = optionValues.includes('857');
            const hasProduct854 = optionValues.includes('854');
            
            console.log(`  - 包含產品 857: ${hasProduct857 ? '✅' : '❌'}`);
            console.log(`  - 包含產品 854: ${hasProduct854 ? '✅' : '❌'}`);
            
            if (hasProduct857) results.dropdownsWithTarget857++;
            if (hasProduct854) results.dropdownsWithTarget854++;
            
            // 檢查選中狀態
            const selectedValue = await dropdown.inputValue();
            let selectedText = '';
            
            try {
              const selectedOption = dropdown.locator('option:checked');
              selectedText = await selectedOption.textContent({ timeout: 2000 });
            } catch (e) {
              console.log('  - 無法獲取選中文字');
            }
            
            console.log(`  - 選中值: "${selectedValue}"`);
            console.log(`  - 選中文字: "${selectedText}"`);
            
            // 分類統計
            if (options.length > 1) { // 除了占位符外還有其他選項
              results.dropdownsWithProducts++;
            }
            
            if (selectedText && (selectedText.includes('請選擇') || selectedText.includes('Select'))) {
              results.dropdownsWithPlaceholder++;
            }
            
            if (selectedValue && selectedValue !== '' && selectedValue !== '0') {
              results.selectedProducts.push({
                index: i,
                productId: selectedValue,
                productName: selectedText
              });
            }
            
          } catch (error) {
            console.log(`  ❌ 分析下拉選單 ${i + 1} 時發生錯誤: ${error.message}`);
          }
        }
      }
      
      await page.screenshot({ path: 'screenshots/dynamic-test-analysis.png', fullPage: true });
      
      // 步驟 6: 測試結果總結
      console.log('\n📊 步驟 6: 測試結果總結');
      console.log('===============================================');
      console.log(`📋 總下拉選單數量: ${results.totalDropdowns}`);
      console.log(`✅ 有產品選項的下拉選單: ${results.dropdownsWithProducts}`);
      console.log(`⚠️ 顯示占位符的下拉選單: ${results.dropdownsWithPlaceholder}`);
      console.log(`🎯 包含產品 857 的下拉選單: ${results.dropdownsWithTarget857}`);
      console.log(`🎯 包含產品 854 的下拉選單: ${results.dropdownsWithTarget854}`);
      console.log(`🔘 已選中產品的下拉選單: ${results.selectedProducts.length}`);
      
      if (results.selectedProducts.length > 0) {
        console.log('\n已選中的產品:');
        results.selectedProducts.forEach((product, index) => {
          console.log(`  ${index + 1}. ID: ${product.productId}, 名稱: "${product.productName}"`);
        });
      }
      
      // 最終評估
      console.log('\n🎯 最終評估:');
      
      const hasProductOptions = results.dropdownsWithProducts > 0;
      const hasTargetProducts = results.dropdownsWithTarget857 > 0 || results.dropdownsWithTarget854 > 0;
      const hasPreSelectedProducts = results.selectedProducts.length > 0;
      
      if (hasProductOptions && hasTargetProducts && hasPreSelectedProducts) {
        console.log('🎉 ✅ 產品下拉選單完全修復成功!');
        console.log('   - 下拉選單正確顯示產品選項');
        console.log('   - 包含目標產品 (857, 854)');
        console.log('   - 正確預選了產品');
        console.log('   - 修復狀況: 完美 ✨');
      } else if (hasProductOptions && hasTargetProducts) {
        console.log('⚠️ 🔧 產品下拉選單部分修復成功');
        console.log('   - 下拉選單顯示產品選項: ✅');
        console.log('   - 包含目標產品: ✅');
        console.log('   - 預選產品: ❌');
        console.log('   - 修復狀況: 良好，但預選功能需改進');
      } else if (hasProductOptions) {
        console.log('⚠️ 🔧 產品下拉選單基本修復成功');
        console.log('   - 下拉選單顯示產品選項: ✅');
        console.log('   - 包含目標產品: ❌');
        console.log('   - 修復狀況: 基本功能正常，但數據不完整');
      } else {
        console.log('❌ 🚫 產品下拉選單修復失敗');
        console.log('   - 下拉選單未顯示產品選項');
        console.log('   - 仍需檢查後端 API 和前端邏輯');
      }
      
    } else {
      console.log('\n❌ 無法找到任何產品下拉選單進行測試');
    }
    
    // 步驟 7: 檢查控制台訊息
    console.log('\n💬 步驟 7: 重要控制台訊息回顧');
    console.log(`總訊息數量: ${importantMessages.length}`);
    
    if (importantMessages.length > 0) {
      console.log('\n關鍵訊息:');
      importantMessages.slice(0, 10).forEach((msg, index) => {
        console.log(`  ${index + 1}. ${msg}`);
      });
    }
    
    await page.screenshot({ path: 'screenshots/dynamic-test-final.png', fullPage: true });
    
  } catch (error) {
    console.error('\n❌ 測試過程中發生錯誤:', error.message);
    await page.screenshot({ path: 'screenshots/dynamic-test-error.png', fullPage: true });
  } finally {
    await browser.close();
    console.log('\n✅ 動態產品下拉選單測試完成');
  }
}

// 執行測試
testDynamicProductDropdown().catch(console.error);