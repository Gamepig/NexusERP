import { test, expect } from '@playwright/test';

test('Debug dropdown elements and structure', async ({ page }) => {
    console.log('🔍 Starting dropdown elements debugging...');
    
    // Navigate to the application
    await page.goto('http://127.0.0.1:8000', { timeout: 30000 });
    
    // Check if we need to login first
    const loginForm = await page.locator('form').count();
    
    if (loginForm > 0) {
        console.log('🔐 Login required, proceeding with authentication...');
        
        await page.fill('input[name="email"]', 'test@example.com');
        await page.fill('input[name="password"]', 'password123');
        await page.click('button[type="submit"]');
        
        // Wait for dashboard to load
        await page.waitForURL('**/dashboard', { timeout: 15000 });
        console.log('✅ Successfully logged in and navigated to dashboard');
    }
    
    // Wait for the page to be fully loaded
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Take screenshot of current state
    await page.screenshot({ path: 'debug-dropdown-elements-01-dashboard.png', fullPage: false });
    
    // Debug: Find all potential user menu elements
    const debugInfo = await page.evaluate(() => {
        // Look for various dropdown-related elements
        const selectors = [
            '#user-menu-trigger',
            '#user-dropdown-menu',
            '[x-data*="dropdown"]',
            '[x-data*="user"]',
            '.dropdown',
            '.user-menu',
            '.avatar',
            '[data-dropdown-toggle]',
            'button[aria-expanded]',
            'button[aria-haspopup]',
            '.relative button img', // Common pattern for user avatar buttons
            'nav button',
            'header button'
        ];
        
        const found = {};
        
        selectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            if (elements.length > 0) {
                found[selector] = {
                    count: elements.length,
                    elements: Array.from(elements).map(el => ({
                        tagName: el.tagName,
                        id: el.id,
                        className: el.className,
                        innerHTML: el.innerHTML.length > 200 ? el.innerHTML.substring(0, 200) + '...' : el.innerHTML,
                        attributes: Array.from(el.attributes).reduce((acc, attr) => {
                            acc[attr.name] = attr.value;
                            return acc;
                        }, {})
                    }))
                };
            }
        });
        
        // Also search for Alpine.js dropdown components
        const alpineElements = document.querySelectorAll('[x-data]');
        const alpineDropdowns = Array.from(alpineElements).filter(el => {
            const xData = el.getAttribute('x-data');
            return xData && (xData.includes('dropdown') || xData.includes('menu') || xData.includes('open'));
        });
        
        if (alpineDropdowns.length > 0) {
            found['alpine-dropdowns'] = {
                count: alpineDropdowns.length,
                elements: alpineDropdowns.map(el => ({
                    tagName: el.tagName,
                    id: el.id,
                    className: el.className,
                    xData: el.getAttribute('x-data'),
                    innerHTML: el.innerHTML.length > 200 ? el.innerHTML.substring(0, 200) + '...' : el.innerHTML
                }))
            };
        }
        
        return found;
    });
    
    console.log('🔍 Debug results:');
    console.log(JSON.stringify(debugInfo, null, 2));
    
    // Look specifically in the navigation/header area
    const navigationHTML = await page.evaluate(() => {
        const nav = document.querySelector('nav');
        const header = document.querySelector('header');
        const topbar = document.querySelector('.topbar, .navbar, .header');
        
        return {
            nav: nav ? nav.innerHTML : 'No nav element found',
            header: header ? header.innerHTML : 'No header element found',
            topbar: topbar ? topbar.innerHTML : 'No topbar element found'
        };
    });
    
    console.log('🧭 Navigation HTML structure:');
    console.log('NAV:', navigationHTML.nav.substring(0, 500));
    console.log('HEADER:', navigationHTML.header.substring(0, 500));
    console.log('TOPBAR:', navigationHTML.topbar.substring(0, 500));
    
    // Try to find user-related buttons or images
    const userButtons = await page.locator('button').all();
    console.log(`👤 Found ${userButtons.length} buttons on the page`);
    
    for (let i = 0; i < Math.min(userButtons.length, 10); i++) {
        const button = userButtons[i];
        const isVisible = await button.isVisible();
        if (isVisible) {
            const text = await button.textContent();
            const html = await button.innerHTML();
            console.log(`Button ${i + 1}: "${text}" (HTML: ${html.substring(0, 100)}...)`);
        }
    }
    
    // Check for images that might be user avatars
    const images = await page.locator('img').all();
    console.log(`🖼️ Found ${images.length} images on the page`);
    
    for (let i = 0; i < Math.min(images.length, 5); i++) {
        const img = images[i];
        const isVisible = await img.isVisible();
        if (isVisible) {
            const src = await img.getAttribute('src');
            const alt = await img.getAttribute('alt');
            const classes = await img.getAttribute('class');
            console.log(`Image ${i + 1}: src="${src}", alt="${alt}", class="${classes}"`);
        }
    }
    
    console.log('🔍 Debugging complete');
});