import { chromium } from 'playwright';

async function testLightThemeFix() {
    const browser = await chromium.launch({ 
        headless: false,
        devtools: true
    });
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
        console.log('🔍 Testing light theme fix...');
        
        // Navigate to login and login
        await page.goto('http://127.0.0.1:8000/login');
        await page.waitForLoadState('networkidle');
        
        await page.fill('input[name="email"]', 'test@example.com');
        await page.fill('input[name="password"]', 'password123');
        await page.click('button[type="submit"]');
        await page.waitForURL('**/dashboard', { timeout: 10000 });
        await page.waitForLoadState('networkidle');
        
        // Force set to light theme
        console.log('🌞 Setting theme to light...');
        await page.evaluate(() => {
            localStorage.setItem('nexus-theme', 'light');
            if (window.NexusTheme) {
                window.NexusTheme.setTheme('light');
            }
        });
        
        await page.reload();
        await page.waitForLoadState('networkidle');
        
        // Check theme after forcing light
        const dataTheme = await page.getAttribute('html', 'data-theme');
        console.log('🏷️ HTML data-theme after forcing light:', dataTheme);
        
        // Check CSS custom properties
        const cssVars = await page.evaluate(() => {
            const root = document.documentElement;
            const computedStyle = window.getComputedStyle(root);
            return {
                '--primary-500': computedStyle.getPropertyValue('--primary-500'),
                '--orange-500': computedStyle.getPropertyValue('--orange-500'),
                '--blue-500': computedStyle.getPropertyValue('--blue-500'),
                '--nexus-bg-primary': computedStyle.getPropertyValue('--nexus-bg-primary')
            };
        });
        console.log('🎨 CSS Custom Properties after fix:', cssVars);
        
        // Check card styling
        const cardStyles = await page.evaluate(() => {
            const cards = document.querySelectorAll('.bg-gradient-to-br');
            const results = [];
            
            for (let i = 0; i < Math.min(cards.length, 4); i++) {
                const card = cards[i];
                const styles = window.getComputedStyle(card);
                results.push({
                    index: i,
                    classes: card.className,
                    backgroundColor: styles.backgroundColor,
                    backgroundImage: styles.backgroundImage,
                    border: styles.border,
                    boxShadow: styles.boxShadow
                });
            }
            return results;
        });
        
        console.log('🎯 Card styles after fix:', cardStyles);
        
        // Check statistics container
        const statsContainer = await page.evaluate(() => {
            const container = document.querySelector('.bg-white\\/10');
            if (container) {
                const styles = window.getComputedStyle(container);
                return {
                    backgroundColor: styles.backgroundColor,
                    border: styles.border,
                    backdropFilter: styles.backdropFilter
                };
            }
            return null;
        });
        console.log('📊 Statistics container after fix:', statsContainer);
        
        // Take screenshot after fix
        await page.screenshot({ 
            path: '/Users/gamepig/projects/NexusERP/frontend/light_theme_fixed_screenshot.png',
            fullPage: true 
        });
        console.log('📸 Screenshot saved: light_theme_fixed_screenshot.png');
        
        // Test theme toggle functionality
        console.log('🔄 Testing theme toggle...');
        const toggleButton = await page.locator('[data-theme-toggle]').first();
        
        if (await toggleButton.isVisible()) {
            console.log('✅ Theme toggle button found');
            
            // Click to switch to dark theme
            await toggleButton.click();
            await page.waitForTimeout(500);
            
            const toggledTheme = await page.getAttribute('html', 'data-theme');
            console.log('🌙 After toggle - theme:', toggledTheme);
            
            // Click again to switch back to light theme
            await toggleButton.click();
            await page.waitForTimeout(500);
            
            const backToLightTheme = await page.getAttribute('html', 'data-theme');
            console.log('🌞 After second toggle - theme:', backToLightTheme);
            
            // Take final screenshot
            await page.screenshot({ 
                path: '/Users/gamepig/projects/NexusERP/frontend/light_theme_final_screenshot.png',
                fullPage: true 
            });
            console.log('📸 Final screenshot saved');
            
        } else {
            console.log('❌ Theme toggle button not found');
        }
        
    } catch (error) {
        console.error('❌ Error during testing:', error);
        await page.screenshot({ 
            path: '/Users/gamepig/projects/NexusERP/frontend/test_error_screenshot.png'
        });
    } finally {
        console.log('⏱️ Keeping browser open for 10 seconds for manual inspection...');
        await page.waitForTimeout(10000);
        await browser.close();
    }
}

testLightThemeFix();