const { chromium } = require('playwright');

async function verifyCustomerAuthFix() {
    console.log('🔄 Verifying Customer Management Authentication Fix');
    
    const browser = await chromium.launch({ 
        headless: false,
        slowMo: 500 
    });
    
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Setup monitoring
    const apiCalls = [];
    const errors = [];
    
    page.on('request', request => {
        if (request.url().includes('8082') || request.url().includes('/api/')) {
            apiCalls.push({
                url: request.url(),
                method: request.method(),
                headers: request.headers()
            });
            console.log(`🌐 API REQUEST: ${request.method()} ${request.url()}`);
        }
    });
    
    page.on('response', response => {
        if (response.url().includes('8082') || response.url().includes('/api/')) {
            console.log(`📥 API RESPONSE: ${response.status()} ${response.url()}`);
            if (response.status() >= 400) {
                errors.push({
                    url: response.url(),
                    status: response.status(),
                    statusText: response.statusText()
                });
            }
        }
    });
    
    page.on('console', msg => {
        if (msg.type() === 'error') {
            console.log(`❌ CONSOLE ERROR: ${msg.text()}`);
            errors.push({ type: 'console', message: msg.text() });
        }
    });
    
    try {
        console.log('\n🚀 Step 1: Navigate to login page');
        await page.goto('http://127.0.0.1:8000/login');
        await page.waitForLoadState('networkidle');
        
        console.log('\n🔐 Step 2: Login with test credentials');
        await page.fill('input[name="email"]', 'test@example.com');
        await page.fill('input[name="password"]', 'password123');
        await page.click('button[type="submit"]');
        await page.waitForNavigation();
        
        console.log('\n👥 Step 3: Navigate to customers page');
        await page.goto('http://127.0.0.1:8000/customers');
        await page.waitForTimeout(5000); // Wait for API calls
        
        console.log('\n📊 Step 4: Analyze page content');
        
        // Check for error messages
        const errorMessages = await page.$$eval('.alert-danger, .error', elements => 
            elements.map(el => el.textContent?.trim()).filter(text => text && text.includes('token'))
        );
        
        // Check for successful customer content
        const hasCustomerTable = await page.$('.customer-table, table') !== null;
        const hasCustomerTitle = await page.textContent('h1, h2, .page-title') || '';
        const hasCustomerContent = hasCustomerTitle.includes('客戶') || hasCustomerTitle.includes('Customer');
        
        // Check for specific error indicators
        const hasInvalidTokenError = await page.textContent('body') || '';
        const containsInvalidToken = hasInvalidTokenError.toLowerCase().includes('invalid token') || 
                                   hasInvalidTokenError.includes('無效的令牌') ||
                                   hasInvalidTokenError.includes('token');
        
        // Take final screenshot
        await page.screenshot({ 
            path: '/Users/gamepig/projects/NexusERP/verify_auth_fix.png',
            fullPage: true 
        });
        
        console.log('\n📈 AUTHENTICATION FIX VERIFICATION RESULTS');
        console.log('=' .repeat(60));
        console.log(`✅ Page loaded successfully: ${page.url().includes('customers')}`);
        console.log(`✅ Customer content detected: ${hasCustomerContent}`);
        console.log(`❌ Error messages found: ${errorMessages.length}`);
        console.log(`❌ Invalid token errors: ${containsInvalidToken ? 'YES' : 'NO'}`);
        console.log(`🔗 Total API calls made: ${apiCalls.length}`);
        console.log(`❌ API errors encountered: ${errors.filter(e => e.status).length}`);
        
        if (errorMessages.length > 0) {
            console.log('\n🚨 ERROR MESSAGES:');
            errorMessages.forEach((msg, i) => console.log(`${i+1}. ${msg}`));
        }
        
        if (apiCalls.length > 0) {
            console.log('\n🌐 API CALLS MADE:');
            apiCalls.forEach((call, i) => {
                console.log(`${i+1}. ${call.method} ${call.url}`);
                if (call.headers.authorization) {
                    console.log(`   Auth: ${call.headers.authorization.substring(0, 20)}...`);
                }
            });
        }
        
        if (errors.filter(e => e.status).length > 0) {
            console.log('\n❌ API ERRORS:');
            errors.filter(e => e.status).forEach((error, i) => {
                console.log(`${i+1}. ${error.status} ${error.statusText} - ${error.url}`);
            });
        }
        
        // Final assessment
        const isFixed = !containsInvalidToken && hasCustomerContent && errors.filter(e => e.status && e.status >= 400).length === 0;
        console.log(`\n🎯 AUTHENTICATION FIX STATUS: ${isFixed ? '✅ SUCCESSFUL' : '❌ NEEDS ATTENTION'}`);
        
        if (isFixed) {
            console.log('🎉 Customer management page authentication is working correctly!');
            console.log('   - No invalid token errors detected');
            console.log('   - Customer content loads properly');
            console.log('   - API calls are authenticated successfully');
        } else {
            console.log('⚠️  Issues still detected:');
            if (containsInvalidToken) console.log('   - Invalid token errors still present');
            if (!hasCustomerContent) console.log('   - Customer content not loading');
            if (errors.filter(e => e.status && e.status >= 400).length > 0) console.log('   - API authentication errors');
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        await page.screenshot({ 
            path: '/Users/gamepig/projects/NexusERP/verify_auth_fix_error.png',
            fullPage: true 
        });
    } finally {
        await browser.close();
        console.log('\n📸 Screenshots saved to project directory');
    }
}

verifyCustomerAuthFix();