import { chromium } from 'playwright';

(async () => {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    try {
        console.log('Navigating to http://127.0.0.1:8000...');
        await page.goto('http://127.0.0.1:8000');
        await page.waitForLoadState('networkidle');
        
        // Check page title and content
        const title = await page.title();
        console.log('Page title:', title);
        
        // Check if this is a login page or dashboard
        const bodyContent = await page.textContent('body');
        console.log('Page contains login form:', bodyContent.includes('Login') || bodyContent.includes('登入'));
        console.log('Page contains navigation:', bodyContent.includes('導航') || bodyContent.includes('nav'));
        
        // Look for any navigation elements
        const navElements = await page.locator('nav').count();
        console.log('Number of <nav> elements:', navElements);
        
        // Look for enhanced navigation specifically
        const enhancedNav = await page.locator('nav[x-data*="enhancedNavigation"]').count();
        console.log('Enhanced navigation elements:', enhancedNav);
        
        // Look for any user-related elements
        const userElements = await page.locator('[class*="user"]').count();
        console.log('Elements with "user" in class:', userElements);
        
        if (userElements > 0) {
            const userClasses = await page.locator('[class*="user"]').allInnerTexts();
            console.log('User element texts:', userClasses);
        }
        
        // Check for authentication state
        const authState = await page.evaluate(() => {
            // Look for CSRF token or session indicators
            const csrfMeta = document.querySelector('meta[name="csrf-token"]');
            const userInfo = document.querySelector('[class*="user"]');
            
            return {
                hasCsrfToken: !!csrfMeta,
                hasUserInfo: !!userInfo,
                currentUrl: window.location.href,
                documentReady: document.readyState
            };
        });
        
        console.log('Auth state:', authState);
        
        // If it's a login page, let's login
        if (bodyContent.includes('Login') || bodyContent.includes('登入') || bodyContent.includes('Email')) {
            console.log('This appears to be a login page, attempting login...');
            
            // Fill login form
            const emailInput = page.locator('input[type="email"], input[name="email"]');
            const passwordInput = page.locator('input[type="password"], input[name="password"]');
            const submitButton = page.locator('button[type="submit"], input[type="submit"]');
            
            if (await emailInput.count() > 0) {
                await emailInput.fill('test@example.com');
                await passwordInput.fill('password123');
                
                console.log('Submitting login form...');
                await submitButton.click();
                await page.waitForLoadState('networkidle');
                
                // Check if we're now on dashboard
                const newTitle = await page.title();
                console.log('After login title:', newTitle);
                
                // Now look for navigation again
                const navAfterLogin = await page.locator('nav[x-data*="enhancedNavigation"]').count();
                console.log('Enhanced navigation after login:', navAfterLogin);
                
                if (navAfterLogin > 0) {
                    const userTrigger = await page.locator('.nexus-user-trigger').count();
                    console.log('User trigger found after login:', userTrigger > 0);
                }
            }
        }
        
        await page.waitForTimeout(5000); // Keep browser open
        
    } catch (error) {
        console.error('Debug failed:', error);
    } finally {
        await browser.close();
    }
})();