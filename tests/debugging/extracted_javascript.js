
const mode = 'edit';
const orderId = 7268;
const customerId = null;

let customers = [];
let products = [];
let itemIndex = 0;

document.addEventListener('DOMContentLoaded', function() {
    initializePage();
});

async function initializePage() {
    try {
        document.getElementById('loadingState').classList.remove('hidden');
        document.getElementById('formContent').classList.add('hidden');
        
        console.log('=== initializePage 開始 ===');
        
        // 檢查是否有伺服器傳來的數據
                    // 伺服器已提供數據，直接使用
            customers = [{"id":935,"name":"Test Company \u5ba2\u6236 1"},{"id":936,"name":"Test Company \u5ba2\u6236 2"},{"id":937,"name":"Test Company \u5ba2\u6236 3"},{"id":938,"name":"Test Company \u5ba2\u6236 4"},{"id":939,"name":"Test Company \u5ba2\u6236 5"},{"id":940,"name":"Test Company \u5ba2\u6236 6"},{"id":941,"name":"Test Company \u5ba2\u6236 7"},{"id":942,"name":"Test Company \u5ba2\u6236 8"},{"id":2233,"name":"Test Customer 1"},{"id":2232,"name":"Test Customer 1"},{"id":2231,"name":"Test Customer 1"},{"id":2234,"name":"\u6e2c\u8a66\u5ba2\u6236"},{"id":2235,"name":"\u6e2c\u8a66\u5ba2\u62362"},{"id":2236,"name":"\u6e2c\u8a66\u8868\u55ae\u5ba2\u6236"}];
            products = [{"id":832,"name":"\u6e2c\u8a66\u5546\u54c1 A","sku":"PROD-A-001","unit_price":"1299.99"},{"id":833,"name":"\u6e2c\u8a66\u5546\u54c1 B","sku":"PROD-B-002","unit_price":"499.99"},{"id":834,"name":"\u6e2c\u8a66\u5546\u54c1 C","sku":"PROD-C-003","unit_price":"799.99"},{"id":843,"name":"\u6e2c\u8a66\u7522\u54c1 1","sku":"TEST-PROD-001","unit_price":"824.00"},{"id":852,"name":"\u6e2c\u8a66\u7522\u54c1 10","sku":"TEST-PROD-010","unit_price":"341.00"},{"id":853,"name":"\u6e2c\u8a66\u7522\u54c1 11","sku":"TEST-PROD-011","unit_price":"1105.00"},{"id":854,"name":"\u6e2c\u8a66\u7522\u54c1 12","sku":"TEST-PROD-012","unit_price":"682.00"},{"id":855,"name":"\u6e2c\u8a66\u7522\u54c1 13","sku":"TEST-PROD-013","unit_price":"2336.00"},{"id":856,"name":"\u6e2c\u8a66\u7522\u54c1 14","sku":"TEST-PROD-014","unit_price":"1773.00"},{"id":857,"name":"\u6e2c\u8a66\u7522\u54c1 15","sku":"TEST-PROD-015","unit_price":"609.00"},{"id":844,"name":"\u6e2c\u8a66\u7522\u54c1 2","sku":"TEST-PROD-002","unit_price":"265.00"},{"id":845,"name":"\u6e2c\u8a66\u7522\u54c1 3","sku":"TEST-PROD-003","unit_price":"1051.00"},{"id":846,"name":"\u6e2c\u8a66\u7522\u54c1 4","sku":"TEST-PROD-004","unit_price":"2226.00"},{"id":847,"name":"\u6e2c\u8a66\u7522\u54c1 5","sku":"TEST-PROD-005","unit_price":"2065.00"},{"id":848,"name":"\u6e2c\u8a66\u7522\u54c1 6","sku":"TEST-PROD-006","unit_price":"2166.00"},{"id":849,"name":"\u6e2c\u8a66\u7522\u54c1 7","sku":"TEST-PROD-007","unit_price":"1364.00"},{"id":850,"name":"\u6e2c\u8a66\u7522\u54c1 8","sku":"TEST-PROD-008","unit_price":"986.00"},{"id":851,"name":"\u6e2c\u8a66\u7522\u54c1 9","sku":"TEST-PROD-009","unit_price":"453.00"}];
            console.log('使用伺服器提供的數據');
            console.log('客戶數量:', customers.length);
            console.log('產品數量:', products.length);
            
            // 立即填充客戶下拉選單
            populateCustomerSelect();
                
        // 確保產品數據載入完成後填充客戶選項
        populateCustomerSelect();
        
        // 設定預設日期
        if (!orderId) {
            document.getElementById('order_date').value = new Date().toISOString().split('T')[0];
        }
        
        // 如果是編輯模式且有伺服器數據，直接載入
                    console.log('編輯模式 - 使用伺服器數據');
            // 延遲執行確保 DOM 完全就緒和產品數據載入完成
            setTimeout(() => {
                populateServerData();
            }, 200); // 增加延遲時間確保產品數據載入完成
                
        setupEventListeners();
        
        // 初始化時觸發現有項目的小計計算
        document.querySelectorAll('.item-row').forEach(itemElement => {
            updateItemSubtotal(itemElement);
        });
        
        // 初始化時觸發一次總計計算（處理現有項目）
        updateTotals();
        
        document.getElementById('loadingState').classList.add('hidden');
        document.getElementById('formContent').classList.remove('hidden');
        
    } catch (error) {
        console.error('Initialize page error:', error);
        showError('載入頁面失敗: ' + error.message);
    }
}

async function loadCustomers() {
    try {
        const response = await fetch('/api/customers', {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        if (result.success) {
            customers = result.data;
            populateCustomerSelect();
        } else {
            throw new Error(result.message || '載入客戶資料失敗');
        }
    } catch (error) {
        console.error('Load customers error:', error);
        throw error;
    }
}

async function loadProducts() {
    try {
        console.log('=== loadProducts 開始載入 ===');
        const response = await fetch('/api/products?paginate=false', {
            method: 'GET', 
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                'X-Requested-With': 'XMLHttpRequest'
            },
            credentials: 'same-origin'
        });
        
        console.log('API 回應狀態:', response.status);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('API 回應結果:', result);
        
        if (result.success) {
            products = result.data;
            console.log('產品載入成功，數量:', products.length);
            console.log('產品列表:', products.slice(0, 3)); // 顯示前3個產品供調試
        } else {
            throw new Error(result.message || '載入產品資料失敗');
        }
    } catch (error) {
        console.error('Load products error:', error);
        // 如果 API 失敗，嘗試使用空陣列避免阻塞其他功能
        products = [];
        throw error;
    }
}

async function loadOrderData() {
    try {
        const response = await fetch(`/api/sales-orders/${orderId}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        if (result.success) {
            populateFormData(result.data);
        } else {
            throw new Error(result.message || '載入訂單資料失敗');
        }
    } catch (error) {
        console.error('Load order data error:', error);
        throw error;
    }
}

function populateCustomerSelect() {
    const customerSelect = document.getElementById('customer_id');
    customerSelect.innerHTML = '<option value="">請選擇客戶</option>';
    
    // 檢查是否有伺服器傳來的客戶數據
            const serverCustomers = [{"id":935,"name":"Test Company \u5ba2\u6236 1"},{"id":936,"name":"Test Company \u5ba2\u6236 2"},{"id":937,"name":"Test Company \u5ba2\u6236 3"},{"id":938,"name":"Test Company \u5ba2\u6236 4"},{"id":939,"name":"Test Company \u5ba2\u6236 5"},{"id":940,"name":"Test Company \u5ba2\u6236 6"},{"id":941,"name":"Test Company \u5ba2\u6236 7"},{"id":942,"name":"Test Company \u5ba2\u6236 8"},{"id":2233,"name":"Test Customer 1"},{"id":2232,"name":"Test Customer 1"},{"id":2231,"name":"Test Customer 1"},{"id":2234,"name":"\u6e2c\u8a66\u5ba2\u6236"},{"id":2235,"name":"\u6e2c\u8a66\u5ba2\u62362"},{"id":2236,"name":"\u6e2c\u8a66\u8868\u55ae\u5ba2\u6236"}];
        serverCustomers.forEach(customer => {
            const option = document.createElement('option');
            option.value = customer.id;
            option.textContent = customer.name;
            
            // 如果是編輯模式且匹配當前訂單的客戶，標記為選中
                            if (customer.id == 2235) {
                    option.selected = true;
                }
                        
            customerSelect.appendChild(option);
        });
    }

function populateProductSelect(selectElement) {
    console.log('=== populateProductSelect 開始 ===');
    selectElement.innerHTML = '<option value="">請選擇產品</option>';
    
    // 檢查是否有伺服器傳來的產品數據
            const serverProducts = [{"id":832,"name":"\u6e2c\u8a66\u5546\u54c1 A","sku":"PROD-A-001","unit_price":"1299.99"},{"id":833,"name":"\u6e2c\u8a66\u5546\u54c1 B","sku":"PROD-B-002","unit_price":"499.99"},{"id":834,"name":"\u6e2c\u8a66\u5546\u54c1 C","sku":"PROD-C-003","unit_price":"799.99"},{"id":843,"name":"\u6e2c\u8a66\u7522\u54c1 1","sku":"TEST-PROD-001","unit_price":"824.00"},{"id":852,"name":"\u6e2c\u8a66\u7522\u54c1 10","sku":"TEST-PROD-010","unit_price":"341.00"},{"id":853,"name":"\u6e2c\u8a66\u7522\u54c1 11","sku":"TEST-PROD-011","unit_price":"1105.00"},{"id":854,"name":"\u6e2c\u8a66\u7522\u54c1 12","sku":"TEST-PROD-012","unit_price":"682.00"},{"id":855,"name":"\u6e2c\u8a66\u7522\u54c1 13","sku":"TEST-PROD-013","unit_price":"2336.00"},{"id":856,"name":"\u6e2c\u8a66\u7522\u54c1 14","sku":"TEST-PROD-014","unit_price":"1773.00"},{"id":857,"name":"\u6e2c\u8a66\u7522\u54c1 15","sku":"TEST-PROD-015","unit_price":"609.00"},{"id":844,"name":"\u6e2c\u8a66\u7522\u54c1 2","sku":"TEST-PROD-002","unit_price":"265.00"},{"id":845,"name":"\u6e2c\u8a66\u7522\u54c1 3","sku":"TEST-PROD-003","unit_price":"1051.00"},{"id":846,"name":"\u6e2c\u8a66\u7522\u54c1 4","sku":"TEST-PROD-004","unit_price":"2226.00"},{"id":847,"name":"\u6e2c\u8a66\u7522\u54c1 5","sku":"TEST-PROD-005","unit_price":"2065.00"},{"id":848,"name":"\u6e2c\u8a66\u7522\u54c1 6","sku":"TEST-PROD-006","unit_price":"2166.00"},{"id":849,"name":"\u6e2c\u8a66\u7522\u54c1 7","sku":"TEST-PROD-007","unit_price":"1364.00"},{"id":850,"name":"\u6e2c\u8a66\u7522\u54c1 8","sku":"TEST-PROD-008","unit_price":"986.00"},{"id":851,"name":"\u6e2c\u8a66\u7522\u54c1 9","sku":"TEST-PROD-009","unit_price":"453.00"}];
        console.log('使用伺服器產品數據，數量:', serverProducts.length);
        serverProducts.forEach(product => {
            const option = document.createElement('option');
            option.value = product.id;
            option.textContent = `${product.name} (${product.sku || 'N/A'})`;
            option.dataset.price = product.selling_price || product.unit_price || product.price || 0;
            selectElement.appendChild(option);
        });
        
    console.log('產品選擇器填充完成，選項數量:', selectElement.options.length);
}

function populateServerData() {
    console.log('populateServerData() 被調用');
            const salesOrder = {"id":7268,"order_number":"SO2025000008","customer_id":2235,"business_unit_id":null,"status":"draft","user_id":1191,"order_date":"2025-08-01","total_amount":"1291.00","currency_id":null,"created_at":"2025-08-01 08:42:13+00","updated_at":"2025-08-01 08:42:13.368978+00","company_id":77,"customer_name":"\u6e2c\u8a66\u5ba2\u62362"};
        
        console.log('銷售訂單數據:', salesOrder);
        console.log('產品數據是否存在:',  true );
        
                    const serverProducts = [{"id":832,"name":"\u6e2c\u8a66\u5546\u54c1 A","sku":"PROD-A-001","unit_price":"1299.99"},{"id":833,"name":"\u6e2c\u8a66\u5546\u54c1 B","sku":"PROD-B-002","unit_price":"499.99"},{"id":834,"name":"\u6e2c\u8a66\u5546\u54c1 C","sku":"PROD-C-003","unit_price":"799.99"},{"id":843,"name":"\u6e2c\u8a66\u7522\u54c1 1","sku":"TEST-PROD-001","unit_price":"824.00"},{"id":852,"name":"\u6e2c\u8a66\u7522\u54c1 10","sku":"TEST-PROD-010","unit_price":"341.00"},{"id":853,"name":"\u6e2c\u8a66\u7522\u54c1 11","sku":"TEST-PROD-011","unit_price":"1105.00"},{"id":854,"name":"\u6e2c\u8a66\u7522\u54c1 12","sku":"TEST-PROD-012","unit_price":"682.00"},{"id":855,"name":"\u6e2c\u8a66\u7522\u54c1 13","sku":"TEST-PROD-013","unit_price":"2336.00"},{"id":856,"name":"\u6e2c\u8a66\u7522\u54c1 14","sku":"TEST-PROD-014","unit_price":"1773.00"},{"id":857,"name":"\u6e2c\u8a66\u7522\u54c1 15","sku":"TEST-PROD-015","unit_price":"609.00"},{"id":844,"name":"\u6e2c\u8a66\u7522\u54c1 2","sku":"TEST-PROD-002","unit_price":"265.00"},{"id":845,"name":"\u6e2c\u8a66\u7522\u54c1 3","sku":"TEST-PROD-003","unit_price":"1051.00"},{"id":846,"name":"\u6e2c\u8a66\u7522\u54c1 4","sku":"TEST-PROD-004","unit_price":"2226.00"},{"id":847,"name":"\u6e2c\u8a66\u7522\u54c1 5","sku":"TEST-PROD-005","unit_price":"2065.00"},{"id":848,"name":"\u6e2c\u8a66\u7522\u54c1 6","sku":"TEST-PROD-006","unit_price":"2166.00"},{"id":849,"name":"\u6e2c\u8a66\u7522\u54c1 7","sku":"TEST-PROD-007","unit_price":"1364.00"},{"id":850,"name":"\u6e2c\u8a66\u7522\u54c1 8","sku":"TEST-PROD-008","unit_price":"986.00"},{"id":851,"name":"\u6e2c\u8a66\u7522\u54c1 9","sku":"TEST-PROD-009","unit_price":"453.00"}];
            console.log('伺服器產品數據:', serverProducts);
            console.log('產品數量:', serverProducts.length);
                
        // 確保客戶下拉選單先填充完成
        populateCustomerSelect();
        
        // 延遲設定客戶選擇，確保選項已加載
        setTimeout(() => {
            const customerSelect = document.getElementById('customer_id');
            if (customerSelect) {
                customerSelect.value = salesOrder.customer_id || '';
                console.log('設定客戶ID:', salesOrder.customer_id, '實際值:', customerSelect.value);
                
                // 如果還是沒有選中，嘗試手動觸發選擇
                if (customerSelect.value !== salesOrder.customer_id) {
                    // 尋找對應的選項並標記為選中
                    const options = customerSelect.querySelectorAll('option');
                    options.forEach(option => {
                        if (option.value == salesOrder.customer_id) {
                            option.selected = true;
                            customerSelect.value = option.value;
                        }
                    });
                }
            }
        }, 100);
        
        const orderDateInput = document.getElementById('order_date');
        if (orderDateInput) {
            orderDateInput.value = salesOrder.order_date || '';
        }
        
        const notesInput = document.getElementById('notes');
        if (notesInput) {
            notesInput.value = salesOrder.notes || '';
        }
        
        // 設定訂單狀態
        const statusSelect = document.getElementById('status');
        if (statusSelect) {
            statusSelect.value = salesOrder.status || 'draft';
        }
        
        // 添加訂單項目
                    const orderItems = [{"id":25230,"sales_order_id":7268,"product_id":857,"quantity":"1.00","unit_price":"609.00","total_price":"609.00","status":"draft","created_at":"2025-08-01 08:42:13+00","updated_at":"2025-08-01 08:42:13+00","product_name":"\u6e2c\u8a66\u7522\u54c1 15","product_sku":"TEST-PROD-015"},{"id":25231,"sales_order_id":7268,"product_id":854,"quantity":"1.00","unit_price":"682.00","total_price":"682.00","status":"draft","created_at":"2025-08-01 08:42:13+00","updated_at":"2025-08-01 08:42:13+00","product_name":"\u6e2c\u8a66\u7522\u54c1 12","product_sku":"TEST-PROD-012"}];
            console.log('訂單項目數據:', orderItems);
            console.log('訂單項目數量:', orderItems.length);
            
            // 清空現有項目列表以避免重複
            const itemsList = document.getElementById('itemsList');
            itemsList.innerHTML = '';
            
            // 逐個添加項目，每個項目之間有延遲確保正確處理
            orderItems.forEach((item, index) => {
                console.log(`準備添加項目 ${index + 1}:`, item);
                setTimeout(() => {
                    addItem({
                        product_id: item.product_id,
                        quantity: item.quantity,
                        unit_price: item.unit_price,
                        product_name: item.product_name,
                        product_sku: item.product_sku
                    });
                }, index * 50); // 每個項目延遲50ms
            });
                
        updateTotals();
    }

function populateFormData(orderData) {
    // 確保客戶下拉選單已載入完成後才設定值
    setTimeout(() => {
        const customerSelect = document.getElementById('customer_id');
        if (customerSelect) {
            customerSelect.value = orderData.customer_id || '';
        }
    }, 100);
    
    // 填入基本資料
    const orderDateInput = document.getElementById('order_date');
    if (orderDateInput) {
        orderDateInput.value = orderData.order_date || '';
    }
    
    const notesInput = document.getElementById('notes');
    if (notesInput) {
        notesInput.value = orderData.notes || '';
    }
    
    // 設定訂單狀態
    const statusSelect = document.getElementById('status');
    if (statusSelect) {
        statusSelect.value = orderData.status || 'draft';
    }
    
    // 添加訂單項目
    if (orderData.items && orderData.items.length > 0) {
        orderData.items.forEach(item => {
            addItem(item);
        });
    }
    
    updateTotals();
}

function setupEventListeners() {
    // 新增項目按鈕
    document.getElementById('addItemBtn').addEventListener('click', () => addItem());
    
    // 表單提交
    document.getElementById('salesOrderForm').addEventListener('submit', handleSubmit);
    
    // 為現有項目設置事件監聽器
    document.querySelectorAll('.item-row').forEach(itemElement => {
        setupItemEventListeners(itemElement);
    });
}

function addItem(itemData = null) {
    console.log('=== addItem 被調用 ===');
    console.log('項目數據:', itemData);
    console.log('當前產品列表長度:', products.length);
    
    const template = document.getElementById('itemTemplate');
    const clone = template.content.cloneNode(true);
    
    // 更新索引
    const currentIndex = itemIndex++;
    console.log('當前索引:', currentIndex);
    
    // 替換模板中的 INDEX 標記
    clone.querySelectorAll('[name*="INDEX"]').forEach(element => {
        element.name = element.name.replace('INDEX', currentIndex);
    });
    
    // 先添加到 DOM，這樣後續的選擇器才能正確工作
    document.getElementById('itemsList').appendChild(clone);
    
    // 獲取剛添加的元素
    const itemsList = document.getElementById('itemsList');
    const addedElement = itemsList.lastElementChild;
    
    if (!addedElement) {
        console.error('無法找到新添加的元素');
        return;
    }
    
    // 設定產品下拉選單
    const productSelect = addedElement.querySelector('.product-select');
    if (productSelect) {
        populateProductSelect(productSelect);
        console.log('產品下拉選單已填充，選項數量:', productSelect.options.length);
    }
    
    // 設定事件監聽器
    setupItemEventListeners(addedElement);
    
    // 如果有提供項目資料，填入表單
    if (itemData) {
        console.log('設定項目數據...');
        // 直接設置值，不需要延遲
        if (productSelect && itemData.product_id) {
            
            if (!addedElement) {
                console.error('無法找到新添加的元素');
                return;
            }
            
            const productSelectAdded = addedElement.querySelector('.product-select');
            const quantityInputAdded = addedElement.querySelector('.quantity-input');
            const priceInputAdded = addedElement.querySelector('.price-input');
            
            console.log('設定項目數據:', itemData);
            
            if (productSelectAdded) {
                console.log('產品選擇器選項數量:', productSelectAdded.options.length);
                
                // 檢查產品選項是否存在，如果不存在，嘗試手動添加
                const existingOption = Array.from(productSelectAdded.options).find(option => option.value == itemData.product_id);
                console.log('檢查產品選項 - ID:', itemData.product_id, '存在:', !!existingOption, '產品名稱:', itemData.product_name);
                console.log('產品選擇器所有選項:', Array.from(productSelectAdded.options).map(opt => ({value: opt.value, text: opt.textContent})));
                
                if (!existingOption && itemData.product_name) {
                    console.log('產品選項不存在，手動添加:', itemData.product_name, 'SKU:', itemData.product_sku);
                    const newOption = document.createElement('option');
                    newOption.value = itemData.product_id;
                    newOption.textContent = `${itemData.product_name} (${itemData.product_sku || 'N/A'})`;
                    newOption.dataset.price = itemData.unit_price || 0;
                    productSelectAdded.appendChild(newOption);
                    console.log('產品選項已添加，新選項數量:', productSelectAdded.options.length);
                } else if (!existingOption) {
                    console.warn('產品選項不存在且沒有產品名稱 - ID:', itemData.product_id, '所有項目數據:', itemData);
                    console.warn('所有可用產品:', typeof products !== 'undefined' ? products : '未定義');
                }
                
                // 設置產品選擇值，添加重試機制
                productSelectAdded.value = itemData.product_id || '';
                console.log('設定產品ID:', itemData.product_id, '實際值:', productSelectAdded.value);
                
                // 如果設置失敗，嘗試手動觸發選擇
                if (productSelectAdded.value != itemData.product_id) {
                    console.log('設置失敗，嘗試手動觸發選擇');
                    const targetOption = Array.from(productSelectAdded.options).find(option => option.value == itemData.product_id);
                    if (targetOption) {
                        targetOption.selected = true;
                        productSelectAdded.value = targetOption.value;
                        console.log('手動選擇成功:', productSelectAdded.value);
                    } else {
                        console.warn('找不到目標選項 ID:', itemData.product_id);
                        // 列出所有可用選項供調試
                        console.log('可用選項:', Array.from(productSelectAdded.options).map(opt => ({value: opt.value, text: opt.textContent})));
                    }
                }
            }
            
            if (quantityInputAdded) {
                quantityInputAdded.value = itemData.quantity || '';
            }
            
            if (priceInputAdded) {
                priceInputAdded.value = itemData.unit_price || '';
            }
            
            // 觸發小計計算
            updateItemSubtotal(addedElement);
    }
    
    // 隱藏空狀態
    document.getElementById('emptyState').classList.add('hidden');
    
    updateTotals();
}

function setupItemEventListeners(itemElement) {
    // 產品選擇變更
    const productSelect = itemElement.querySelector('.product-select');
    if (productSelect) {
        productSelect.addEventListener('change', function() {
            const currentItemElement = this.closest('.item-row');
            const selectedOption = this.options[this.selectedIndex];
            const priceInput = currentItemElement.querySelector('.price-input');
            if (selectedOption && selectedOption.dataset.price && priceInput) {
                priceInput.value = selectedOption.dataset.price;
                // 確保數量欄位有預設值
                const quantityInput = currentItemElement.querySelector('.quantity-input');
                if (quantityInput && !quantityInput.value) {
                    quantityInput.value = '1';
                }
            }
            updateItemSubtotal(currentItemElement);
        });
    }
    
    // 數量或價格變更
    const quantityInput = itemElement.querySelector('.quantity-input');
    const priceInput = itemElement.querySelector('.price-input');
    
    if (quantityInput) {
        quantityInput.addEventListener('input', function() {
            updateItemSubtotal(this.closest('.item-row'));
        });
        quantityInput.addEventListener('change', function() {
            updateItemSubtotal(this.closest('.item-row'));
        });
    }
    
    if (priceInput) {
        priceInput.addEventListener('input', function() {
            updateItemSubtotal(this.closest('.item-row'));
        });
        priceInput.addEventListener('change', function() {
            updateItemSubtotal(this.closest('.item-row'));
        });
    }
    
    // 刪除項目
    const removeButton = itemElement.querySelector('.remove-item');
    if (removeButton) {
        removeButton.addEventListener('click', function() {
            itemElement.remove();
            updateTotals();
            
            // 如果沒有項目了，顯示空狀態
            if (document.getElementById('itemsList').children.length === 0) {
                document.getElementById('emptyState').classList.remove('hidden');
            }
        });
    }
}

function updateItemSubtotal(itemElement) {
    const quantityInput = itemElement.querySelector('.quantity-input');
    const priceInput = itemElement.querySelector('.price-input');
    const subtotalElement = itemElement.querySelector('.item-subtotal');
    
    // 檢查必要元素是否存在
    if (!quantityInput || !priceInput || !subtotalElement) {
        console.warn('Missing required elements in item row for subtotal calculation');
        return;
    }
    
    const quantity = parseFloat(quantityInput.value) || 0;
    const price = parseFloat(priceInput.value) || 0;
    const subtotal = quantity * price;
    
    subtotalElement.textContent = `$${subtotal.toLocaleString('en-US', {minimumFractionDigits: 2})}`;
    
    updateTotals();
}

function updateTotals() {
    let subtotal = 0;
    
    document.querySelectorAll('.item-row').forEach(itemElement => {
        const quantityInput = itemElement.querySelector('.quantity-input');
        const priceInput = itemElement.querySelector('.price-input');
        
        if (quantityInput && priceInput && quantityInput.value !== '' && priceInput.value !== '') {
            const quantity = parseFloat(quantityInput.value) || 0;
            const price = parseFloat(priceInput.value) || 0;
            
            if (quantity > 0 && price >= 0) {
                subtotal += quantity * price;
            }
        }
    });
    
    const taxRate = 0.05; // 5% 稅率
    const taxAmount = subtotal * taxRate;
    const total = subtotal + taxAmount;
    
    const subtotalElement = document.getElementById('subtotalAmount');
    const taxElement = document.getElementById('taxAmount');
    const totalElement = document.getElementById('totalAmount');
    
    if (subtotalElement) {
        subtotalElement.textContent = `$${subtotal.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    }
    
    if (taxElement) {
        taxElement.textContent = `$${taxAmount.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    }
    
    if (totalElement) {
        totalElement.textContent = `$${total.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    }
}

async function handleSubmit(event) {
    event.preventDefault();
    
    const submitBtn = document.getElementById('submitBtn');
    const submitText = document.getElementById('submitText');
    const submitSpinner = document.getElementById('submitSpinner');
    
    // 清除錯誤訊息
    clearErrors();
    
    // 驗證表單
    if (!validateForm()) {
        return;
    }
    
    // 顯示載入狀態
    submitBtn.disabled = true;
    submitText.classList.add('hidden');
    submitSpinner.classList.remove('hidden');
    
    try {
        const formData = collectFormData();
        const url = mode === 'create' ? '/api/sales-orders' : `/api/sales-orders/${orderId}`;
        const method = mode === 'create' ? 'POST' : 'PUT';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
            },
            body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            // 成功訊息
            alert(mode === 'create' ? '銷售訂單建立成功！' : '銷售訂單更新成功！');
            // 導向到訂單詳情頁面
            window.location.href = `/orders/sales/${result.data.id}`;
        } else {
            throw new Error(result.message || '操作失敗');
        }
        
    } catch (error) {
        console.error('Submit error:', error);
        alert('操作失敗: ' + error.message);
    } finally {
        // 恢復按鈕狀態
        submitBtn.disabled = false;
        submitText.classList.remove('hidden');
        submitSpinner.classList.add('hidden');
    }
}

function validateForm() {
    let isValid = true;
    
    // 驗證客戶
    const customerId = document.getElementById('customer_id').value;
    if (!customerId) {
        showFieldError('customer_id', '請選擇客戶');
        isValid = false;
    }
    
    // 驗證訂單日期
    const orderDate = document.getElementById('order_date').value;
    if (!orderDate) {
        showFieldError('order_date', '請選擇訂單日期');
        isValid = false;
    }
    
    // 驗證項目
    const items = document.querySelectorAll('.item-row');
    if (items.length === 0) {
        alert('請至少新增一個訂單項目');
        isValid = false;
    }
    
    // 驗證每個項目
    items.forEach((item, index) => {
        const productSelect = item.querySelector('.product-select');
        const quantityInput = item.querySelector('.quantity-input');
        const priceInput = item.querySelector('.price-input');
        
        if (!productSelect.value) {
            alert(`項目 ${index + 1}: 請選擇產品`);
            isValid = false;
        }
        
        if (!quantityInput.value || parseFloat(quantityInput.value) <= 0) {
            alert(`項目 ${index + 1}: 請輸入有效的數量`);
            isValid = false;
        }
        
        if (!priceInput.value || parseFloat(priceInput.value) < 0) {
            alert(`項目 ${index + 1}: 請輸入有效的單價`);
            isValid = false;
        }
    });
    
    return isValid;
}

function collectFormData() {
    const formData = {
        customer_id: document.getElementById('customer_id').value,
        order_date: document.getElementById('order_date').value,
        status: document.getElementById('status').value,
        notes: document.getElementById('notes').value,
        items: []
    };
    
    document.querySelectorAll('.item-row').forEach(item => {
        const itemData = {
            product_id: item.querySelector('.product-select').value,
            quantity: parseFloat(item.querySelector('.quantity-input').value),
            unit_price: parseFloat(item.querySelector('.price-input').value)
        };
        formData.items.push(itemData);
    });
    
    return formData;
}

function showFieldError(fieldId, message) {
    const errorElement = document.getElementById(`${fieldId}_error`);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.remove('hidden');
    }
}

function clearErrors() {
    document.querySelectorAll('[id$="_error"]').forEach(element => {
        element.classList.add('hidden');
        element.textContent = '';
    });
}

function showError(message) {
    document.getElementById('loadingState').classList.add('hidden');
    document.getElementById('formContent').classList.add('hidden');
    document.getElementById('errorState').classList.remove('hidden');
    document.getElementById('errorMessage').textContent = message;
}
