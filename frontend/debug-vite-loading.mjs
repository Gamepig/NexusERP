import { chromium } from 'playwright';

async function debugViteLoading() {
    console.log('🔍 檢查 Vite 資源載入狀況...');
    
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();
    
    const requests = [];
    const responses = [];
    
    // 監聽所有網路請求
    page.on('request', request => {
        requests.push({
            url: request.url(),
            method: request.method(),
            resourceType: request.resourceType()
        });
    });
    
    page.on('response', response => {
        responses.push({
            url: response.url(),
            status: response.status(),
            statusText: response.statusText()
        });
    });
    
    try {
        console.log('📍 前往損益表頁面...');
        await page.goto('http://127.0.0.1:8000/reports/financial/profit-loss', {
            waitUntil: 'networkidle'
        });
        
        await page.waitForTimeout(3000);
        
        // 檢查載入的 CSS 和 JS 檔案
        const cssRequests = requests.filter(r => r.resourceType === 'stylesheet');
        const jsRequests = requests.filter(r => r.resourceType === 'script');
        
        console.log('🎨 CSS 檔案載入情況:');
        cssRequests.forEach(req => {
            const response = responses.find(r => r.url === req.url);
            console.log(`  ${req.url} - ${response ? response.status : 'N/A'}`);
        });
        
        console.log('🔧 JavaScript 檔案載入情況:');
        jsRequests.forEach(req => {
            const response = responses.find(r => r.url === req.url);
            console.log(`  ${req.url} - ${response ? response.status : 'N/A'}`);
        });
        
        // 檢查 Vite 開發伺服器連接
        const viteRequests = requests.filter(r => r.url.includes('localhost:5173') || r.url.includes('5174'));
        console.log('⚡ Vite 開發伺服器請求:');
        if (viteRequests.length === 0) {
            console.log('  ❌ 沒有找到對 Vite 開發伺服器的請求');
        } else {
            viteRequests.forEach(req => {
                const response = responses.find(r => r.url === req.url);
                console.log(`  ${req.url} - ${response ? response.status : 'N/A'}`);
            });
        }
        
        // 檢查頁面 HTML 中的 script 和 link 標籤
        const htmlContent = await page.content();
        const scriptTags = htmlContent.match(/<script[^>]*src[^>]*>/g) || [];
        const linkTags = htmlContent.match(/<link[^>]*href[^>]*>/g) || [];
        
        console.log('📄 HTML 中的 script 標籤:');
        scriptTags.forEach(tag => console.log(`  ${tag}`));
        
        console.log('📄 HTML 中的 link 標籤:');
        linkTags.forEach(tag => console.log(`  ${tag}`));
        
        // 檢查是否有錯誤
        const failedRequests = responses.filter(r => r.status >= 400);
        if (failedRequests.length > 0) {
            console.log('❌ 失敗的請求:');
            failedRequests.forEach(req => {
                console.log(`  ${req.url} - ${req.status} ${req.statusText}`);
            });
        }
        
    } catch (error) {
        console.error('❌ 測試失敗:', error);
    } finally {
        await browser.close();
    }
}

debugViteLoading();