// 測試產品下拉選單修復的腳本
// 在瀏覽器控制台中運行

console.log('=== 產品下拉選單測試開始 ===');

// 1. 檢查頁面是否已載入
console.log('1. 檢查頁面載入狀態');
console.log('當前 URL:', window.location.href);
console.log('頁面標題:', document.title);

// 2. 檢查 products 變數
console.log('2. 檢查產品數據');
if (typeof products !== 'undefined') {
    console.log('✅ products 變數存在');
    console.log('產品數量:', products.length);
    console.log('前3個產品:', products.slice(0, 3));
} else {
    console.log('❌ products 變數不存在');
}

// 3. 檢查產品下拉選單
console.log('3. 檢查產品下拉選單');
const productSelects = document.querySelectorAll('.product-select');
console.log('找到產品選擇器數量:', productSelects.length);

productSelects.forEach((select, index) => {
    console.log(`選擇器 ${index + 1}:`);
    console.log('  選項數量:', select.options.length);
    console.log('  當前值:', select.value);
    
    // 檢查是否有產品選項（除了"請選擇產品"）
    const actualOptions = Array.from(select.options).filter(opt => opt.value !== '');
    console.log('  實際產品選項數量:', actualOptions.length);
    
    if (actualOptions.length > 0) {
        console.log('  ✅ 有產品選項');
        console.log('  前3個選項:', actualOptions.slice(0, 3).map(opt => ({
            value: opt.value,
            text: opt.textContent
        })));
    } else {
        console.log('  ❌ 沒有產品選項');
    }
});

// 4. 檢查目標產品（857 和 854）
console.log('4. 檢查目標產品');
const targetProducts = ['857', '854'];
targetProducts.forEach(productId => {
    const found = Array.from(document.querySelectorAll('.product-select option')).some(opt => opt.value === productId);
    console.log(`產品 ${productId}: ${found ? '✅ 找到' : '❌ 未找到'}`);
});

// 5. 檢查是否有 JavaScript 錯誤
console.log('5. 檢查控制台錯誤');
console.log('請查看控制台是否有紅色錯誤信息');

// 6. 測試 API 調用
console.log('6. 測試產品 API');
fetch('/api/products?paginate=false', {
    method: 'GET',
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        'X-Requested-With': 'XMLHttpRequest'
    },
    credentials: 'same-origin'
})
.then(response => {
    console.log('API 回應狀態:', response.status);
    return response.json();
})
.then(data => {
    console.log('API 回應成功:', data.success);
    if (data.success) {
        console.log('API 產品數量:', data.data?.length || 0);
        console.log('✅ API 測試成功');
    } else {
        console.log('❌ API 回應失敗:', data.message);
    }
})
.catch(error => {
    console.log('❌ API 測試失敗:', error);
});

console.log('=== 測試完成，請查看上方結果 ===');