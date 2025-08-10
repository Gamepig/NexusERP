const { chromium } = require('playwright');

async function testCustomerAPI() {
    console.log('=== PostgreSQL Database Customer ID Validation ===\n');
    
    // Valid customer IDs found in database
    const validCustomerIds = [429, 430, 435, 440, 450];
    const apiBaseUrl = 'http://127.0.0.1:8082';
    
    const browser = await chromium.launch({
        headless: true
    });
    
    try {
        const context = await browser.newContext();
        const page = await context.newPage();
        
        // Test each valid customer ID
        for (const customerId of validCustomerIds) {
            console.log(`\n--- 測試客戶 ID: ${customerId} ---`);
            
            try {
                // Make API request
                const response = await page.evaluate(async (params) => {
                    try {
                        const res = await fetch(`${params.apiUrl}/api/customers/${params.id}`, {
                            method: 'GET',
                            headers: {
                                'Content-Type': 'application/json',
                                'Accept': 'application/json'
                            }
                        });
                        
                        return {
                            status: res.status,
                            statusText: res.statusText,
                            data: res.ok ? await res.json() : await res.text()
                        };
                    } catch (error) {
                        return {
                            error: error.message
                        };
                    }
                }, { apiUrl: apiBaseUrl, id: customerId });
                
                if (response.error) {
                    console.log(`❌ API 請求失敗: ${response.error}`);
                } else {
                    console.log(`📊 狀態碼: ${response.status} ${response.statusText}`);
                    
                    if (response.status === 200) {
                        console.log(`✅ 客戶資料存在`);
                        console.log(`客戶名稱: ${response.data.name || 'N/A'}`);
                        console.log(`客戶代碼: ${response.data.customer_code || 'N/A'}`);
                        console.log(`公司名稱: ${response.data.company_name || 'N/A'}`);
                    } else {
                        console.log(`❌ API 回應: ${JSON.stringify(response.data).substring(0, 200)}`);
                    }
                }
            } catch (error) {
                console.log(`❌ 測試客戶 ${customerId} 時發生錯誤:`, error.message);
            }
        }
        
        // Test direct database query result format
        console.log('\n=== PostgreSQL 資料庫查詢結果 ===\n');
        console.log('資料庫中找到的有效客戶 ID:');
        console.log('ID: 429, 代碼: CUST000001, 姓名: 謝雅婷, 公司: 寶雅國際股份有限公司');
        console.log('ID: 430, 代碼: CUST000002, 姓名: 陳建宏, 公司: 欣亞數位股份有限公司');
        console.log('ID: 435, 代碼: CUST000007, 姓名: 楊雅雯, 公司: 寶雅國際股份有限公司');
        console.log('ID: 440, 代碼: CUST000012, 姓名: 邱麗華, 公司: 康是美藥妝店股份有限公司');
        console.log('ID: 450, 代碼: CUST000022, 姓名: 劉國強, 公司: 燦坤實業股份有限公司');
        
        console.log('\n📈 資料庫統計:');
        console.log('- 總客戶數: 1810 (活躍)');
        console.log('- 客戶 ID 範圍: 429 ~ 2238');
        console.log('- 建議測試用 ID: 429, 430, 435, 440, 450');
        
    } catch (error) {
        console.error('❌ 測試過程中發生錯誤:', error);
    } finally {
        await browser.close();
    }
}

// Also test simple HTTP request without Playwright
async function testDirectHTTP() {
    console.log('\n=== 直接 HTTP 請求測試 ===\n');
    
    const validCustomerIds = [429, 430, 435];
    const apiBaseUrl = 'http://127.0.0.1:8082';
    
    for (const customerId of validCustomerIds) {
        try {
            console.log(`測試客戶 ID ${customerId}...`);
            
            // Simple Node.js fetch (requires Node 18+)
            const response = await fetch(`${apiBaseUrl}/api/customers/${customerId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });
            
            console.log(`狀態: ${response.status} ${response.statusText}`);
            
            if (response.ok) {
                const data = await response.json();
                console.log(`✅ 成功獲取客戶資料: ${data.name} (${data.customer_code})`);
            } else {
                const error = await response.text();
                console.log(`❌ 錯誤回應: ${error.substring(0, 100)}`);
            }
            
        } catch (error) {
            console.log(`❌ HTTP 請求失敗: ${error.message}`);
        }
        console.log('---');
    }
}

// Run tests
async function runAllTests() {
    console.log('🔍 開始測試 PostgreSQL 資料庫中的有效客戶 ID...\n');
    
    await testCustomerAPI();
    
    // Check if native fetch is available (Node 18+)
    if (typeof fetch !== 'undefined') {
        await testDirectHTTP();
    } else {
        console.log('\n💡 注意: 需要 Node.js 18+ 才能執行直接 HTTP 測試');
    }
    
    console.log('\n✅ 測試完成！建議使用以上任一有效的客戶 ID 進行除錯。');
}

runAllTests();