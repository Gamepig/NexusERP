import { chromium } from 'playwright';

(async () => {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    try {
        // 1. Navigate to the application
        console.log('Navigating to http://127.0.0.1:8000...');
        await page.goto('http://127.0.0.1:8000');
        await page.waitForLoadState('networkidle');
        
        // 2. Check if the user dropdown trigger exists
        console.log('Looking for user dropdown trigger...');
        const userTrigger = await page.locator('.nexus-user-trigger').first();
        
        if (await userTrigger.count() === 0) {
            console.log('❌ User dropdown trigger not found');
            return;
        }
        
        console.log('✅ User dropdown trigger found');
        
        // 3. Check if dropdown is initially hidden
        const dropdown = await page.locator('.nexus-user-dropdown').first();
        const isInitiallyVisible = await dropdown.isVisible();
        console.log(`Initial dropdown visibility: ${isInitiallyVisible}`);
        
        // 4. Click the user trigger
        console.log('Clicking user dropdown trigger...');
        await userTrigger.click();
        await page.waitForTimeout(500); // Wait for animation
        
        // 5. Check if dropdown becomes visible
        const isVisibleAfterClick = await dropdown.isVisible();
        console.log(`Dropdown visibility after click: ${isVisibleAfterClick}`);
        
        if (!isVisibleAfterClick) {
            console.log('❌ Dropdown did not appear after clicking');
            
            // Check for JavaScript errors
            const logs = [];
            page.on('console', msg => {
                if (msg.type() === 'error') {
                    logs.push(msg.text());
                }
            });
            
            // Check Alpine.js state
            const alpineState = await page.evaluate(() => {
                const nav = document.querySelector('nav[x-data*="enhancedNavigation"]');
                return nav ? nav._x_dataStack?.[0] : null;
            });
            
            console.log('Alpine.js state:', JSON.stringify(alpineState, null, 2));
            
            // Check if showUserMenu is being set
            const showUserMenuState = await page.evaluate(() => {
                const nav = document.querySelector('nav[x-data*="enhancedNavigation"]');
                return nav ? nav._x_dataStack?.[0]?.showUserMenu : undefined;
            });
            
            console.log('showUserMenu state:', showUserMenuState);
            
        } else {
            console.log('✅ Dropdown appeared successfully');
            
            // Test clicking outside to close
            console.log('Testing click outside to close...');
            await page.click('body');
            await page.waitForTimeout(300);
            
            const isClosedAfterOutsideClick = await dropdown.isVisible();
            console.log(`Dropdown closed after outside click: ${!isClosedAfterOutsideClick}`);
        }
        
        // 6. Check CSS classes and styles
        const dropdownClasses = await dropdown.getAttribute('class');
        const dropdownStyle = await dropdown.getAttribute('style');
        console.log('Dropdown classes:', dropdownClasses);
        console.log('Dropdown inline styles:', dropdownStyle);
        
        // 7. Check x-show directive
        const xShow = await dropdown.getAttribute('x-show');
        console.log('x-show directive:', xShow);
        
        await page.waitForTimeout(3000); // Keep browser open for manual inspection
        
    } catch (error) {
        console.error('Test failed:', error);
    } finally {
        await browser.close();
    }
})();