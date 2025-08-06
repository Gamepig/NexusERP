// 調試產品下拉選單問題的輔助腳本
// 在瀏覽器控制台中運行此腳本來調試

console.log('=== 產品下拉選單調試 ===');

// 1. 檢查現有的產品數據
console.log('1. 檢查 products 變數:');
if (typeof products !== 'undefined') {
    console.log('Products array length:', products.length);
    console.log('Products data:', products);
    
    // 查找產品 ID 857
    const product857 = products.find(p => p.id == 857);
    console.log('Product 857 found:', product857);
} else {
    console.log('products 變數未定義');
}

// 2. 檢查伺服器端產品數據
console.log('2. 檢查伺服器端產品數據:');
if (typeof serverProducts !== 'undefined') {
    console.log('Server products:', serverProducts);
} else {
    console.log('serverProducts 未定義');
}

// 3. 檢查第一個產品下拉選單
console.log('3. 檢查產品下拉選單:');
const productSelects = document.querySelectorAll('.product-select');
console.log('找到產品選擇器數量:', productSelects.length);

productSelects.forEach((select, index) => {
    console.log(`選擇器 ${index}:`);
    console.log('  - 選項數量:', select.options.length);
    console.log('  - 當前值:', select.value);
    console.log('  - 選項列表:');
    
    Array.from(select.options).forEach((option, optIndex) => {
        console.log(`    ${optIndex}: value="${option.value}", text="${option.textContent}"`);
    });
});

// 4. 檢查訂單項目數據
console.log('4. 檢查訂單項目數據:');
if (typeof orderItems !== 'undefined') {
    console.log('Order items:', orderItems);
} else {
    console.log('orderItems 未定義');
}

// 5. 手動嘗試設置產品選擇
console.log('5. 手動設置產品選擇:');
const firstSelect = document.querySelector('.product-select');
if (firstSelect) {
    console.log('第一個選擇器當前狀態:');
    console.log('  - 當前值:', firstSelect.value);
    console.log('  - 選項數量:', firstSelect.options.length);
    
    // 嘗試找到產品 857 的選項
    const option857 = Array.from(firstSelect.options).find(opt => opt.value == '857');
    if (option857) {
        console.log('找到產品 857 選項:', option857.textContent);
        console.log('嘗試設置為選中...');
        option857.selected = true;
        firstSelect.value = '857';
        console.log('設置後的值:', firstSelect.value);
    } else {
        console.log('未找到產品 857 選項');
        console.log('可用選項:');
        Array.from(firstSelect.options).forEach(opt => {
            console.log(`  - ${opt.value}: ${opt.textContent}`);
        });
    }
}

console.log('=== 調試完成 ===');