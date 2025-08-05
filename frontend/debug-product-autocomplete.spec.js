import { test, expect } from '@playwright/test';

test('深度診斷產品自動完成下拉選單問題', async ({ page }) => {
    console.log('🔧 開始深度診斷產品自動完成問題');
    
    // 1. 訪問頁面
    await page.goto('http://127.0.0.1:8000/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    
    await page.goto('http://127.0.0.1:8000/quotes/create');
    await page.waitForLoadState('networkidle');
    
    // 2. 找到產品輸入框
    const productInput = page.locator('.product-search').first();
    await expect(productInput).toBeVisible();
    console.log('✅ 產品輸入框已找到');
    
    // 3. 檢查初始 DOM 狀態
    const initialDropdownCheck = await page.evaluate(() => {
        const inputs = document.querySelectorAll('.product-search');
        const dropdown = document.querySelector('.product-autocomplete-dropdown');
        const parent = inputs[0]?.parentNode;
        
        return {
            inputCount: inputs.length,
            hasDropdown: !!dropdown,
            parentPosition: parent ? getComputedStyle(parent).position : null,
            parentHTML: parent ? parent.innerHTML.substring(0, 200) : null
        };
    });
    console.log('🔍 初始 DOM 狀態:', initialDropdownCheck);
    
    // 4. 手動觸發組件初始化
    await page.evaluate(() => {
        const input = document.querySelector('.product-search');
        if (input && window.ProductAutocomplete) {
            console.log('手動初始化 ProductAutocomplete...');
            new window.ProductAutocomplete(input, {
                onSelect: (product) => console.log('產品選擇:', product),
                onError: (error) => console.log('錯誤:', error)
            });
        }
    });
    
    // 5. 再次檢查 DOM 狀態
    const afterInitDropdownCheck = await page.evaluate(() => {
        const dropdown = document.querySelector('.product-autocomplete-dropdown');
        const parent = document.querySelector('.product-search')?.parentNode;
        
        return {
            hasDropdown: !!dropdown,
            dropdownDisplay: dropdown ? dropdown.style.display : null,
            dropdownClasses: dropdown ? dropdown.className : null,
            parentChildren: parent ? parent.children.length : null,
            parentPosition: parent ? getComputedStyle(parent).position : null
        };
    });
    console.log('🔍 初始化後 DOM 狀態:', afterInitDropdownCheck);
    
    // 6. 觸發搜尋並監控變化
    console.log('📋 測試搜尋功能...');
    
    // 監控網路請求
    const networkPromise = page.waitForRequest(req => 
        req.url().includes('/api/products/search')
    );
    
    await productInput.focus();
    await productInput.fill('test');
    
    try {
        const request = await networkPromise;
        console.log('✅ API 請求已發送:', request.url());
        
        // 等待響應
        const response = await request.response();
        const responseData = await response.json();
        console.log('✅ API 響應:', responseData);
        
    } catch (error) {
        console.log('⚠️ 沒有捕獲到 API 請求');
    }
    
    // 7. 檢查搜尋後的 DOM 狀態
    await page.waitForTimeout(1000); // 等待搜尋完成
    
    const searchResultCheck = await page.evaluate(() => {
        const dropdown = document.querySelector('.product-autocomplete-dropdown');
        const autocompleteItems = document.querySelectorAll('.autocomplete-item');
        
        return {
            hasDropdown: !!dropdown,
            dropdownVisible: dropdown ? dropdown.style.display !== 'none' : false,
            dropdownHTML: dropdown ? dropdown.innerHTML : null,
            itemCount: autocompleteItems.length,
            dropdownRect: dropdown ? dropdown.getBoundingClientRect() : null
        };
    });
    console.log('🔍 搜尋後狀態:', searchResultCheck);
    
    // 8. 檢查 CSS 樣式是否有問題
    const cssCheck = await page.evaluate(() => {
        const dropdown = document.querySelector('.product-autocomplete-dropdown');
        if (!dropdown) return null;
        
        const styles = getComputedStyle(dropdown);
        return {
            display: styles.display,
            visibility: styles.visibility,
            opacity: styles.opacity,
            zIndex: styles.zIndex,
            position: styles.position,
            top: styles.top,
            left: styles.left,
            width: styles.width,
            height: styles.height,
            backgroundColor: styles.backgroundColor,
            border: styles.border
        };
    });
    console.log('🔍 CSS 樣式檢查:', cssCheck);
    
    // 9. 截圖記錄
    await page.screenshot({ path: 'debug-autocomplete-state.png', fullPage: true });
    console.log('📸 已保存診斷截圖: debug-autocomplete-state.png');
    
    // 10. 最終建議
    console.log('\n🏁 診斷完成');
    console.log('請檢查上述輸出來識別問題原因');
});