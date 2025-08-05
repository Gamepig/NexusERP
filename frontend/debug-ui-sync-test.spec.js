import { test, expect } from '@playwright/test';

test.describe('調試 UI 同步問題', () => {
  
  test('調試為什麼 JavaScript 設定成功但 UI 未更新', async ({ page }) => {
    // 設置詳細的控制台監聽
    const consoleMessages = [];
    page.on('console', msg => {
      const message = `[${msg.type()}] ${msg.text()}`;
      consoleMessages.push(message);
      console.log(message);
    });

    console.log('🔧 開始調試 UI 同步問題');
    console.log('==========================================');

    // 1. 登入並導航
    await page.goto('http://127.0.0.1:8000/login');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await page.goto('http://127.0.0.1:8000/orders/sales/7246/edit');
    await page.waitForLoadState('networkidle');
    
    // 2. 在 JavaScript 執行之前檢查初始狀態
    console.log('\n🔍 檢查 JavaScript 執行前的初始狀態');
    const initialStates = await page.evaluate(() => {
      const results = [];
      for (let i = 0; i < 4; i++) {
        const selector = `select[name="items[${i}][product_id]"]`;
        const element = document.querySelector(selector);
        if (element) {
          results.push({
            index: i,
            value: element.value,
            selectedText: element.selectedOptions[0]?.textContent || 'no selection'
          });
        }
      }
      return results;
    });
    
    initialStates.forEach(state => {
      console.log(`初始狀態 - 項目 ${state.index}: 值="${state.value}", 文字="${state.selectedText}"`);
    });

    // 3. 等待 JavaScript 執行完成
    console.log('\n⏳ 等待 JavaScript 增強邏輯執行...');
    await page.waitForTimeout(3000);

    // 4. 檢查 JavaScript 執行後的狀態
    console.log('\n🔍 檢查 JavaScript 執行後的狀態');
    const afterJsStates = await page.evaluate(() => {
      const results = [];
      for (let i = 0; i < 4; i++) {
        const selector = `select[name="items[${i}][product_id]"]`;
        const element = document.querySelector(selector);
        if (element) {
          results.push({
            index: i,
            value: element.value,
            selectedText: element.selectedOptions[0]?.textContent || 'no selection',
            selectedIndex: element.selectedIndex
          });
        }
      }
      return results;
    });
    
    afterJsStates.forEach(state => {
      console.log(`JS執行後 - 項目 ${state.index}: 值="${state.value}", 文字="${state.selectedText}", 索引=${state.selectedIndex}`);
    });

    // 5. 手動嘗試設定並觀察結果
    console.log('\n🧪 手動嘗試設定產品選擇');
    
    const manualTestResults = await page.evaluate(() => {
      const results = [];
      const expectedValues = ['843', '856', '832', '833']; // 根據控制台日誌
      
      for (let i = 0; i < 4; i++) {
        const selector = `select[name="items[${i}][product_id]"]`;
        const element = document.querySelector(selector);
        const expectedValue = expectedValues[i];
        
        if (element) {
          console.log(`嘗試設定項目 ${i} 為值 ${expectedValue}`);
          
          // 記錄設定前狀態
          const beforeValue = element.value;
          const beforeText = element.selectedOptions[0]?.textContent || 'no selection';
          
          // 嘗試設定值
          element.value = expectedValue;
          
          // 觸發 change 事件
          element.dispatchEvent(new Event('change', { bubbles: true }));
          element.dispatchEvent(new Event('input', { bubbles: true }));
          
          // 記錄設定後狀態
          const afterValue = element.value;
          const afterText = element.selectedOptions[0]?.textContent || 'no selection';
          
          results.push({
            index: i,
            expectedValue: expectedValue,
            beforeValue: beforeValue,
            beforeText: beforeText,
            afterValue: afterValue,
            afterText: afterText,
            success: afterValue === expectedValue
          });
          
          console.log(`項目 ${i} 手動設定結果: ${beforeValue} -> ${afterValue} (成功: ${afterValue === expectedValue})`);
        }
      }
      
      return results;
    });

    // 6. 分析手動設定結果
    console.log('\n📊 手動設定結果分析:');
    manualTestResults.forEach(result => {
      console.log(`項目 ${result.index}:`);
      console.log(`  預期值: ${result.expectedValue}`);
      console.log(`  設定前: 值="${result.beforeValue}", 文字="${result.beforeText}"`);
      console.log(`  設定後: 值="${result.afterValue}", 文字="${result.afterText}"`);
      console.log(`  是否成功: ${result.success ? '✅' : '❌'}`);
    });

    // 7. 等待一段時間後再次檢查狀態
    console.log('\n⏳ 等待 2 秒後再次檢查狀態...');
    await page.waitForTimeout(2000);
    
    const finalStates = await page.evaluate(() => {
      const results = [];
      for (let i = 0; i < 4; i++) {
        const selector = `select[name="items[${i}][product_id]"]`;
        const element = document.querySelector(selector);
        if (element) {
          results.push({
            index: i,
            value: element.value,
            selectedText: element.selectedOptions[0]?.textContent || 'no selection'
          });
        }
      }
      return results;
    });
    
    console.log('\n🔍 最終狀態檢查:');
    finalStates.forEach(state => {
      console.log(`最終狀態 - 項目 ${state.index}: 值="${state.value}", 文字="${state.selectedText}"`);
    });

    // 8. 檢查是否有其他 JavaScript 可能干擾設定
    console.log('\n🔍 檢查可能的 JavaScript 干擾');
    const interferenceCheck = await page.evaluate(() => {
      // 檢查是否有監聽器可能重置值
      const selects = document.querySelectorAll('select[name*="product_id"]');
      const info = [];
      
      selects.forEach((select, idx) => {
        const listeners = getEventListeners ? getEventListeners(select) : 'unavailable';
        info.push({
          index: idx,
          tagName: select.tagName,
          name: select.name,
          id: select.id,
          className: select.className,
          hasChangeListeners: listeners && listeners.change ? listeners.change.length : 'unknown'
        });
      });
      
      return info;
    });
    
    console.log('產品選擇器資訊:');
    interferenceCheck.forEach(info => {
      console.log(`  項目 ${info.index}: name="${info.name}", change監聽器數量=${info.hasChangeListeners}`);
    });

    // 9. 截圖記錄調試結果
    await page.screenshot({ 
      path: 'frontend/test-results/debug-ui-sync-result.png', 
      fullPage: true 
    });

    // 10. 生成調試總結
    console.log('\n📋 調試總結');
    console.log('==========================================');
    
    const manualSuccessCount = manualTestResults.filter(r => r.success).length;
    console.log(`手動設定成功項目: ${manualSuccessCount}/4`);
    
    // 比較狀態變化
    console.log('\n📈 狀態變化分析:');
    console.log('初始 -> JS執行後 -> 手動設定後 -> 最終狀態');
    
    for (let i = 0; i < 4; i++) {
      const initial = initialStates[i]?.value || 'N/A';
      const afterJs = afterJsStates[i]?.value || 'N/A'; 
      const manual = manualTestResults[i]?.afterValue || 'N/A';
      const final = finalStates[i]?.value || 'N/A';
      
      console.log(`項目 ${i}: ${initial} -> ${afterJs} -> ${manual} -> ${final}`);
    }

    // 分析控制台消息
    const enhancementLogs = consoleMessages.filter(msg => 
      msg.includes('設定產品ID:') || 
      msg.includes('設置失敗') || 
      msg.includes('populateServerData')
    );
    
    console.log(`\n🧠 增強邏輯相關日誌 (${enhancementLogs.length} 條):`);
    enhancementLogs.forEach(log => console.log(`  ${log}`));

    console.log('\n🎯 調試測試完成！');
    console.log('==========================================');
  });
});