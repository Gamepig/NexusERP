import { chromium } from 'playwright';

async function debugLocalStorage() {
    const browser = await chromium.launch({ 
        headless: false,
        devtools: true
    });
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
        console.log('🔍 Debugging localStorage theme settings...');
        
        // Navigate to dashboard
        await page.goto('http://127.0.0.1:8000/dashboard');
        await page.waitForLoadState('networkidle');
        
        // Check localStorage for theme setting
        const localStorageTheme = await page.evaluate(() => {
            return localStorage.getItem('nexus-theme');
        });
        
        console.log('💾 localStorage nexus-theme value:', localStorageTheme);
        
        // Check current data-theme attribute
        const currentDataTheme = await page.getAttribute('html', 'data-theme');
        console.log('🏷️ Current HTML data-theme:', currentDataTheme);
        
        // Check CSS classes on html element
        const htmlClasses = await page.evaluate(() => {
            return Array.from(document.documentElement.classList);
        });
        console.log('🎨 HTML element classes:', htmlClasses);
        
        // Clear localStorage and reload to test default
        console.log('🧹 Clearing localStorage and reloading...');
        await page.evaluate(() => {
            localStorage.clear();
        });
        
        await page.reload();
        await page.waitForLoadState('networkidle');
        
        // Check theme after clearing localStorage
        const newDataTheme = await page.getAttribute('html', 'data-theme');
        console.log('🆕 After localStorage clear - HTML data-theme:', newDataTheme);
        
        const newHtmlClasses = await page.evaluate(() => {
            return Array.from(document.documentElement.classList);
        });
        console.log('🎯 After localStorage clear - HTML classes:', newHtmlClasses);
        
        // Test theme toggle
        console.log('🔄 Testing theme toggle...');
        const toggleButton = await page.locator('[data-theme-toggle]').first();
        
        if (await toggleButton.isVisible()) {
            await toggleButton.click();
            await page.waitForTimeout(500);
            
            const toggledTheme = await page.getAttribute('html', 'data-theme');
            console.log('🔃 After toggle - HTML data-theme:', toggledTheme);
            
            const toggledClasses = await page.evaluate(() => {
                return Array.from(document.documentElement.classList);
            });
            console.log('🔃 After toggle - HTML classes:', toggledClasses);
            
            // Take screenshot after toggle
            await page.screenshot({ 
                path: '/Users/gamepig/projects/NexusERP/frontend/debug_after_toggle_screenshot.png',
                fullPage: true 
            });
            console.log('📸 Screenshot after toggle saved');
        } else {
            console.log('❌ Theme toggle button not found');
        }
        
        // Check CSS variables in light theme
        const cssVars = await page.evaluate(() => {
            const root = document.documentElement;
            const computedStyle = window.getComputedStyle(root);
            return {
                '--nexus-bg-primary': computedStyle.getPropertyValue('--nexus-bg-primary'),
                '--nexus-bg-secondary': computedStyle.getPropertyValue('--nexus-bg-secondary'),
                '--nexus-text-primary': computedStyle.getPropertyValue('--nexus-text-primary'),
                '--primary-50': computedStyle.getPropertyValue('--primary-50'),
                '--primary-100': computedStyle.getPropertyValue('--primary-100'),
                '--primary-200': computedStyle.getPropertyValue('--primary-200')
            };
        });
        console.log('🎨 CSS Custom Properties:', cssVars);
        
    } catch (error) {
        console.error('❌ Error during localStorage debugging:', error);
    } finally {
        await page.waitForTimeout(5000); // Keep browser open briefly
        await browser.close();
    }
}

debugLocalStorage();