import { chromium } from 'playwright';

(async () => {
    const browser = await chromium.launch({ 
        headless: false,
        slowMo: 500
    });
    const page = await browser.newPage();
    
    try {
        console.log('🔄 Navigating to application...');
        await page.goto('http://127.0.0.1:8000');
        await page.waitForLoadState('networkidle');
        
        // Check if we see the landing page with login link
        const loginLink = await page.locator('text=登入').first();
        if (await loginLink.count() > 0) {
            console.log('🔗 Clicking login link...');
            await loginLink.click();
            await page.waitForLoadState('networkidle');
        }
        
        // Now we should be on login page - check for form
        const emailInput = await page.locator('input[name="email"]');
        if (await emailInput.count() > 0) {
            console.log('🔐 Filling login form...');
            await emailInput.fill('test@example.com');
            await page.locator('input[name="password"]').fill('password123');
            
            console.log('📤 Submitting login form...');
            await page.click('button[type="submit"]');
            await page.waitForLoadState('networkidle');
            
            // Wait a bit more for redirect
            await page.waitForTimeout(2000);
            
            const currentUrl = page.url();
            console.log('📍 Current URL after login:', currentUrl);
            
            // Check page title
            const title = await page.title();
            console.log('📄 Page title:', title);
            
            // If we're still on login or landing page, try going to dashboard directly
            if (currentUrl.includes('login') || currentUrl === 'http://127.0.0.1:8000/') {
                console.log('🏠 Navigating to dashboard...');
                await page.goto('http://127.0.0.1:8000/dashboard');
                await page.waitForLoadState('networkidle');
            }
            
            // Now look for enhanced navigation
            console.log('🔍 Looking for enhanced navigation...');
            const enhancedNav = await page.locator('nav[x-data*="enhancedNavigation"]');
            const navCount = await enhancedNav.count();
            console.log(`📊 Enhanced navigation count: ${navCount}`);
            
            if (navCount > 0) {
                console.log('✅ Enhanced navigation found!');
                
                // Look for user trigger
                const userTrigger = await page.locator('.nexus-user-trigger');
                const triggerCount = await userTrigger.count();
                console.log(`👤 User trigger count: ${triggerCount}`);
                
                if (triggerCount > 0) {
                    console.log('✅ User trigger found! Testing dropdown...');
                    
                    // Get initial state
                    const dropdown = await page.locator('.nexus-user-dropdown');
                    const initiallyVisible = await dropdown.isVisible();
                    console.log(`📋 Initially visible: ${initiallyVisible}`);
                    
                    // Click trigger
                    console.log('🖱️ Clicking user trigger...');
                    await userTrigger.click();
                    await page.waitForTimeout(500);
                    
                    // Check if visible now
                    const visibleAfterClick = await dropdown.isVisible();
                    console.log(`📋 Visible after click: ${visibleAfterClick}`);
                    
                    if (visibleAfterClick) {
                        console.log('🎉 SUCCESS: Dropdown is working!');
                        
                        // Test clicking outside to close
                        await page.click('body');
                        await page.waitForTimeout(300);
                        const closedAfterOutsideClick = await dropdown.isVisible();
                        console.log(`📋 Closed after outside click: ${!closedAfterOutsideClick}`);
                        
                    } else {
                        console.log('❌ PROBLEM: Dropdown not appearing');
                        
                        // Get Alpine state
                        const alpineState = await page.evaluate(() => {
                            const nav = document.querySelector('nav[x-data*="enhancedNavigation"]');
                            return nav?._x_dataStack?.[0];
                        });
                        console.log('📊 Alpine state:', {
                            showUserMenu: alpineState?.showUserMenu,
                            justOpened: alpineState?.justOpened
                        });
                    }
                }
            } else {
                console.log('❌ Enhanced navigation still not found');
                // Check what navigation we do have
                const allNavs = await page.locator('nav').count();
                console.log(`📊 Total nav elements: ${allNavs}`);
                
                if (allNavs > 0) {
                    const navContent = await page.locator('nav').first().textContent();
                    console.log('📄 Nav content:', navContent.substring(0, 200));
                }
            }
        }
        
        await page.waitForTimeout(5000); // Keep open for inspection
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        await browser.close();
    }
})();