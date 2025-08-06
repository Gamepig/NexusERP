const { chromium } = require('playwright');

async function testCustomerPageAuth() {
    console.log('🚀 Starting Customer Page Authentication Test');
    
    const browser = await chromium.launch({ 
        headless: false,
        slowMo: 1000 
    });
    
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Setup request monitoring
    const requests = [];
    const responses = [];
    
    page.on('request', request => {
        requests.push({
            url: request.url(),
            method: request.method(),
            headers: request.headers()
        });
        console.log(`📤 REQUEST: ${request.method()} ${request.url()}`);
    });
    
    page.on('response', response => {
        responses.push({
            url: response.url(),
            status: response.status(),
            statusText: response.statusText()
        });
        console.log(`📥 RESPONSE: ${response.status()} ${response.url()}`);
    });
    
    try {
        // Step 1: Navigate to login page
        console.log('\n📝 Step 1: Navigating to login page...');
        await page.goto('http://127.0.0.1:8000/login');
        await page.waitForLoadState('networkidle');
        
        // Step 2: Login with test credentials
        console.log('\n🔐 Step 2: Logging in with test@example.com...');
        await page.fill('input[name="email"]', 'test@example.com');
        await page.fill('input[name="password"]', 'password123');
        await page.click('button[type="submit"]');
        await page.waitForLoadState('networkidle');
        
        // Check if login was successful
        const currentUrl = page.url();
        console.log(`Current URL after login: ${currentUrl}`);
        
        // Step 3: Navigate to customers page
        console.log('\n👥 Step 3: Navigating to customers page...');
        await page.goto('http://127.0.0.1:8000/customers');
        await page.waitForTimeout(3000); // Wait for potential API calls
        
        // Step 4: Check for error messages
        console.log('\n🔍 Step 4: Checking for error messages...');
        const errorElements = await page.$$('.alert-danger, .error, [class*="error"]');
        const invalidTokenErrors = [];
        
        for (const element of errorElements) {
            const text = await element.textContent();
            if (text && text.toLowerCase().includes('invalid token')) {
                invalidTokenErrors.push(text);
            }
        }
        
        // Step 5: Check page content
        console.log('\n📄 Step 5: Analyzing page content...');
        const pageTitle = await page.title();
        const pageContent = await page.textContent('body');
        
        // Check for customer-related content
        const hasCustomerContent = pageContent.includes('客戶') || 
                                 pageContent.includes('Customer') || 
                                 pageContent.includes('客戶管理');
        
        // Step 6: Take screenshot
        console.log('\n📸 Step 6: Taking screenshot...');
        await page.screenshot({ 
            path: '/Users/gamepig/projects/NexusERP/customer_page_test.png',
            fullPage: true 
        });
        
        // Step 7: Check API requests to Go backend
        console.log('\n🔗 Step 7: Analyzing API requests...');
        const goBackendRequests = requests.filter(req => 
            req.url.includes(':8082') || req.url.includes('api')
        );
        
        const goBackendResponses = responses.filter(res => 
            res.url.includes(':8082') || res.url.includes('api')
        );
        
        // Generate report
        console.log('\n📊 TEST RESULTS SUMMARY');
        console.log('='.repeat(50));
        console.log(`✅ Login successful: ${currentUrl.includes('dashboard') || !currentUrl.includes('login')}`);
        console.log(`✅ Customers page accessible: ${currentUrl.includes('customers')}`);
        console.log(`❌ Invalid token errors found: ${invalidTokenErrors.length}`);
        console.log(`✅ Customer content detected: ${hasCustomerContent}`);
        console.log(`📤 Total requests: ${requests.length}`);
        console.log(`📥 Total responses: ${responses.length}`);
        console.log(`🔗 Go backend requests: ${goBackendRequests.length}`);
        console.log(`🔗 Go backend responses: ${goBackendResponses.length}`);
        
        if (invalidTokenErrors.length > 0) {
            console.log('\n🚨 INVALID TOKEN ERRORS:');
            invalidTokenErrors.forEach((error, index) => {
                console.log(`${index + 1}. ${error}`);
            });
        }
        
        if (goBackendRequests.length > 0) {
            console.log('\n🔗 GO BACKEND API REQUESTS:');
            goBackendRequests.forEach((req, index) => {
                console.log(`${index + 1}. ${req.method} ${req.url}`);
                if (req.headers.authorization) {
                    console.log(`   Auth: ${req.headers.authorization.substring(0, 20)}...`);
                }
            });
        }
        
        if (goBackendResponses.length > 0) {
            console.log('\n📥 GO BACKEND API RESPONSES:');
            goBackendResponses.forEach((res, index) => {
                console.log(`${index + 1}. ${res.status} ${res.statusText} - ${res.url}`);
            });
        }
        
        // Final assessment
        const isFixed = invalidTokenErrors.length === 0 && hasCustomerContent;
        console.log(`\n🎯 AUTHENTICATION FIX STATUS: ${isFixed ? '✅ SUCCESS' : '❌ NEEDS WORK'}`);
        
    } catch (error) {
        console.error('❌ Test failed with error:', error.message);
        await page.screenshot({ 
            path: '/Users/gamepig/projects/NexusERP/customer_page_error.png',
            fullPage: true 
        });
    } finally {
        await browser.close();
        console.log('\n🏁 Test completed. Screenshots saved to project directory.');
    }
}

testCustomerPageAuth();