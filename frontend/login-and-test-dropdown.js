import { chromium } from 'playwright';

(async () => {
    const browser = await chromium.launch({ 
        headless: false,
        slowMo: 1000 // Slow down for debugging
    });
    const page = await browser.newPage();
    
    try {
        // 1. Navigate and login
        console.log('🔄 Navigating to application...');
        await page.goto('http://127.0.0.1:8000');
        await page.waitForLoadState('networkidle');
        
        // 2. Login if needed
        const loginForm = await page.locator('form').first();
        if (await loginForm.count() > 0) {
            console.log('🔐 Logging in...');
            await page.fill('input[name="email"]', 'test@example.com');
            await page.fill('input[name="password"]', 'password123');
            await page.click('button[type="submit"]');
            await page.waitForLoadState('networkidle');
            console.log('✅ Login completed');
        }
        
        // 3. Wait for navigation to load
        console.log('⏳ Waiting for navigation to load...');
        await page.waitForSelector('nav', { timeout: 10000 });
        
        // 4. Check for enhanced navigation
        const enhancedNav = await page.locator('nav[x-data*="enhancedNavigation"]');
        if (await enhancedNav.count() === 0) {
            console.log('❌ Enhanced navigation not found');
            // Let's see what navigation we have
            const allNavs = await page.locator('nav').allTextContents();
            console.log('Available navs:', allNavs);
            return;
        }
        
        console.log('✅ Enhanced navigation found');
        
        // 5. Find user dropdown trigger
        const userTrigger = await page.locator('.nexus-user-trigger');
        if (await userTrigger.count() === 0) {
            console.log('❌ User trigger not found');
            // Look for alternative selectors
            const alternatives = [
                '[class*="user"]',
                'button[aria-haspopup="true"]',
                '[x-data] button',
                '.dropdown'
            ];
            
            for (const selector of alternatives) {
                const count = await page.locator(selector).count();
                if (count > 0) {
                    console.log(`Found ${count} elements with selector: ${selector}`);
                    const texts = await page.locator(selector).allTextContents();
                    console.log('Texts:', texts);
                }
            }
            return;
        }
        
        console.log('✅ User trigger found');
        
        // 6. Get Alpine.js state before clicking
        const initialState = await page.evaluate(() => {
            const nav = document.querySelector('nav[x-data*="enhancedNavigation"]');
            return nav ? nav._x_dataStack?.[0] : null;
        });
        console.log('📊 Initial Alpine state:', {
            showUserMenu: initialState?.showUserMenu,
            mobileMenuOpen: initialState?.mobileMenuOpen
        });
        
        // 7. Check dropdown visibility before click
        const dropdown = await page.locator('.nexus-user-dropdown');
        const initiallyVisible = await dropdown.isVisible();
        console.log(`📋 Dropdown initially visible: ${initiallyVisible}`);
        
        // 8. Click the user trigger
        console.log('🖱️ Clicking user dropdown trigger...');
        await userTrigger.click();
        await page.waitForTimeout(1000); // Wait for animation
        
        // 9. Check Alpine.js state after clicking
        const afterClickState = await page.evaluate(() => {
            const nav = document.querySelector('nav[x-data*="enhancedNavigation"]');
            return nav ? nav._x_dataStack?.[0] : null;
        });
        console.log('📊 After click Alpine state:', {
            showUserMenu: afterClickState?.showUserMenu,
            mobileMenuOpen: afterClickState?.mobileMenuOpen,
            justOpened: afterClickState?.justOpened
        });
        
        // 10. Check dropdown visibility after click
        const visibleAfterClick = await dropdown.isVisible();
        console.log(`📋 Dropdown visible after click: ${visibleAfterClick}`);
        
        // 11. Check CSS and attributes
        const dropdownInfo = await page.evaluate(() => {
            const dropdown = document.querySelector('.nexus-user-dropdown');
            if (!dropdown) return null;
            
            return {
                display: getComputedStyle(dropdown).display,
                visibility: getComputedStyle(dropdown).visibility,
                opacity: getComputedStyle(dropdown).opacity,
                transform: getComputedStyle(dropdown).transform,
                xShow: dropdown.getAttribute('x-show'),
                style: dropdown.getAttribute('style'),
                classes: dropdown.className
            };
        });
        console.log('🎨 Dropdown CSS info:', dropdownInfo);
        
        // 12. Check for JavaScript errors
        page.on('console', msg => {
            if (msg.type() === 'error') {
                console.log('❌ JS Error:', msg.text());
            }
        });
        
        // 13. Test manual trigger of Alpine method
        const manualTest = await page.evaluate(() => {
            const nav = document.querySelector('nav[x-data*="enhancedNavigation"]');
            if (nav && nav._x_dataStack?.[0]) {
                const data = nav._x_dataStack[0];
                console.log('Current showUserMenu:', data.showUserMenu);
                data.toggleUserMenu();
                console.log('After toggle showUserMenu:', data.showUserMenu);
                return data.showUserMenu;
            }
            return null;
        });
        console.log('🔧 Manual toggle result:', manualTest);
        
        await page.waitForTimeout(2000);
        
        // Final visibility check
        const finalVisible = await dropdown.isVisible();
        console.log(`📋 Final dropdown visibility: ${finalVisible}`);
        
        if (finalVisible) {
            console.log('🎉 SUCCESS: Dropdown is working!');
        } else {
            console.log('💔 FAILURE: Dropdown is not working');
        }
        
        await page.waitForTimeout(5000); // Keep open for inspection
        
    } catch (error) {
        console.error('❌ Test failed with error:', error);
    } finally {
        await browser.close();
    }
})();