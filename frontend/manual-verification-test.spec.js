import { test, expect } from '@playwright/test';

test.describe('手動驗證測試 - 產品選擇實際狀態', () => {
  
  test('手動驗證產品選擇的實際狀態', async ({ page }) => {
    // 設置控制台消息監聽
    const consoleMessages = [];
    page.on('console', msg => {
      const message = `[${msg.type()}] ${msg.text()}`;
      consoleMessages.push(message);
      console.log(message);
    });

    console.log('🔍 開始手動驗證測試');
    console.log('==========================================');

    // 1. 登入
    await page.goto('http://127.0.0.1:8000/login');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // 2. 導航到編輯頁面
    await page.goto('http://127.0.0.1:8000/orders/sales/7246/edit');
    await page.waitForLoadState('networkidle');
    
    // 等待足夠長的時間讓所有 JavaScript 執行完成
    console.log('⏳ 等待 JavaScript 增強邏輯執行完成...');
    await page.waitForTimeout(5000); // 5 秒等待

    // 3. 使用 JavaScript 直接檢查每個產品下拉選單的實際狀態
    console.log('\n🔍 使用 JavaScript 直接檢查產品下拉選單狀態');
    
    const productStates = await page.evaluate(() => {
      const results = [];
      
      for (let i = 0; i < 4; i++) {
        const selector = `select[name="items[${i}][product_id]"]`;
        const selectElement = document.querySelector(selector);
        
        if (selectElement) {
          const value = selectElement.value;
          const selectedOption = selectElement.selectedOptions[0];
          const selectedText = selectedOption ? selectedOption.textContent : '無選中選項';
          const selectedIndex = selectElement.selectedIndex;
          
          // 獲取所有選項
          const allOptions = Array.from(selectElement.options).map(opt => ({
            value: opt.value,
            text: opt.textContent,
            selected: opt.selected
          }));
          
          results.push({
            index: i,
            selector: selector,
            found: true,
            value: value,
            selectedText: selectedText,
            selectedIndex: selectedIndex,
            totalOptions: selectElement.options.length,
            allOptions: allOptions
          });
        } else {
          results.push({
            index: i,
            selector: selector,
            found: false
          });
        }
      }
      
      return results;
    });

    // 4. 分析結果
    console.log('\n📊 產品下拉選單實際狀態分析:');
    productStates.forEach(state => {
      if (state.found) {
        console.log(`\n項目 ${state.index}:`);
        console.log(`  選擇器: ${state.selector}`);
        console.log(`  當前值: "${state.value}"`);
        console.log(`  選中文字: "${state.selectedText}"`);
        console.log(`  選中索引: ${state.selectedIndex}`);
        console.log(`  總選項數: ${state.totalOptions}`);
        
        // 檢查是否為預設選項
        const isDefault = state.value === '' || state.value === '0' || state.selectedText.includes('請選擇');
        console.log(`  是否為預設值: ${isDefault ? '是' : '否'}`);
        
        // 顯示前幾個選項
        console.log(`  前5個選項:`);
        state.allOptions.slice(0, 5).forEach((opt, idx) => {
          const marker = opt.selected ? ' ✅' : '';
          console.log(`    ${idx}: "${opt.text}" (值: "${opt.value}")${marker}`);
        });
      } else {
        console.log(`\n項目 ${state.index}: ❌ 未找到選擇器 ${state.selector}`);
      }
    });

    // 5. 使用 JavaScript 檢查數量和價格欄位
    console.log('\n🔍 檢查數量和價格欄位');
    const quantityPriceStates = await page.evaluate(() => {
      const results = [];
      
      for (let i = 0; i < 4; i++) {
        const quantitySelector = `input[name="items[${i}][quantity]"]`;
        const priceSelector = `input[name="items[${i}][unit_price]"]`;
        
        const quantityElement = document.querySelector(quantitySelector);
        const priceElement = document.querySelector(priceSelector);
        
        results.push({
          index: i,
          quantity: quantityElement ? quantityElement.value : '未找到',
          price: priceElement ? priceElement.value : '未找到'
        });
      }
      
      return results;
    });

    quantityPriceStates.forEach(state => {
      console.log(`項目 ${state.index}: 數量="${state.quantity}", 價格="${state.price}"`);
    });

    // 6. 截圖記錄當前實際狀態
    await page.screenshot({ 
      path: 'frontend/test-results/manual-verification-full-page.png', 
      fullPage: true 
    });

    // 7. 生成手動驗證摘要
    console.log('\n📋 手動驗證摘要');
    console.log('==========================================');
    
    const successfulItems = productStates.filter(state => 
      state.found && state.value !== '' && state.value !== '0' && !state.selectedText.includes('請選擇')
    ).length;
    
    const successRate = (successfulItems / 4) * 100;
    
    console.log(`✅ 成功設定的產品項目: ${successfulItems}/4`);
    console.log(`✅ 成功率: ${successRate.toFixed(1)}%`);
    
    console.log(`\n📈 詳細狀態統計:`);
    console.log(`  - 找到的產品下拉選單: ${productStates.filter(s => s.found).length}/4`);
    console.log(`  - 有實際值的項目: ${productStates.filter(s => s.found && s.value !== '').length}/4`);
    console.log(`  - 非預設選項的項目: ${successfulItems}/4`);
    
    // 控制台消息分析
    const enhancementMessages = consoleMessages.filter(msg => 
      msg.includes('設定產品ID:') || 
      msg.includes('設置失敗') || 
      msg.includes('手動選擇成功') ||
      msg.includes('找不到目標選項')
    );
    
    console.log(`\n🧠 增強邏輯執行記錄:`);
    console.log(`  - 相關控制台消息數量: ${enhancementMessages.length}`);
    enhancementMessages.forEach(msg => console.log(`    ${msg}`));

    console.log(`\n🏆 最終評估:`);
    if (successRate >= 75) {
      console.log(`🎉 優秀: ${successRate.toFixed(1)}% 成功率`);
    } else if (successRate >= 50) {
      console.log(`✅ 良好: ${successRate.toFixed(1)}% 成功率`);
    } else if (successRate >= 25) {
      console.log(`⚠️ 部分成功: ${successRate.toFixed(1)}% 成功率`);
    } else {
      console.log(`❌ 需要改進: ${successRate.toFixed(1)}% 成功率`);
    }

    console.log('\n🎯 手動驗證測試完成！');
  });
});