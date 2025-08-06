import { chromium } from 'playwright';

async function debugLightTheme() {
    const browser = await chromium.launch({ 
        headless: false,
        devtools: true,
        args: ['--disable-web-security', '--disable-features=VizDisplayCompositor']
    });
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
        console.log('🔍 Starting light theme debugging...');
        
        // Navigate to login page
        await page.goto('http://127.0.0.1:8000/login');
        await page.waitForLoadState('networkidle');
        
        // Login
        await page.fill('input[name="email"]', 'test@example.com');
        await page.fill('input[name="password"]', 'password123');
        await page.click('button[type="submit"]');
        
        // Wait for dashboard
        await page.waitForURL('**/dashboard', { timeout: 10000 });
        await page.waitForLoadState('networkidle');
        
        console.log('✅ Successfully logged in and navigated to dashboard');
        
        // 1. Check data-theme attribute on HTML element
        const htmlTheme = await page.getAttribute('html', 'data-theme');
        console.log('📋 HTML data-theme attribute:', htmlTheme);
        
        // 2. Check if theme toggle button exists and its state
        const themeToggle = await page.locator('[data-theme-toggle]').first();
        if (await themeToggle.isVisible()) {
            const toggleText = await themeToggle.textContent();
            console.log('🔄 Theme toggle text:', toggleText?.trim());
        } else {
            console.log('❌ Theme toggle button not found');
        }
        
        // 3. Check statistics container background
        const statsContainer = await page.locator('.bg-white\\/10').first();
        if (await statsContainer.isVisible()) {
            const computedStyle = await statsContainer.evaluate(el => {
                const styles = window.getComputedStyle(el);
                return {
                    backgroundColor: styles.backgroundColor,
                    backdropFilter: styles.backdropFilter,
                    border: styles.border,
                    backgroundImage: styles.backgroundImage
                };
            });
            console.log('📊 Statistics container styles:', computedStyle);
        }
        
        // 4. Check card backgrounds
        const cards = await page.locator('.bg-gradient-to-br').all();
        console.log(`🎨 Found ${cards.length} gradient cards`);
        
        for (let i = 0; i < Math.min(cards.length, 3); i++) {
            const card = cards[i];
            const cardStyles = await card.evaluate(el => {
                const styles = window.getComputedStyle(el);
                return {
                    backgroundColor: styles.backgroundColor,
                    backgroundImage: styles.backgroundImage,
                    border: styles.border,
                    boxShadow: styles.boxShadow
                };
            });
            console.log(`🎯 Card ${i + 1} styles:`, cardStyles);
        }
        
        // 5. Check if CSS custom properties are available
        const cssCustomProps = await page.evaluate(() => {
            const html = document.documentElement;
            const computedStyle = window.getComputedStyle(html);
            return {
                '--primary-50': computedStyle.getPropertyValue('--primary-50'),
                '--primary-100': computedStyle.getPropertyValue('--primary-100'),
                '--primary-200': computedStyle.getPropertyValue('--primary-200'),
                '--primary-300': computedStyle.getPropertyValue('--primary-300'),
                '--primary-400': computedStyle.getPropertyValue('--primary-400'),
                '--primary-500': computedStyle.getPropertyValue('--primary-500'),
            };
        });
        console.log('🎨 CSS Custom Properties:', cssCustomProps);
        
        // 6. Check specific light theme classes
        const lightThemeElements = await page.evaluate(() => {
            const elements = document.querySelectorAll('[data-theme="light"] .bg-gradient-to-br, [data-theme="light"] .bg-white\\/10');
            return Array.from(elements).map(el => {
                const styles = window.getComputedStyle(el);
                return {
                    className: el.className,
                    backgroundColor: styles.backgroundColor,
                    backgroundImage: styles.backgroundImage,
                    border: styles.border
                };
            });
        });
        console.log('🌞 Light theme specific elements:', lightThemeElements);
        
        // 7. Check for CSS conflicts
        const allStylesheets = await page.evaluate(() => {
            return Array.from(document.styleSheets).map(sheet => {
                try {
                    return {
                        href: sheet.href,
                        rulesCount: sheet.cssRules ? sheet.cssRules.length : 'N/A'
                    };
                } catch (e) {
                    return {
                        href: sheet.href,
                        error: 'Cannot access rules'
                    };
                }
            });
        });
        console.log('📋 Loaded stylesheets:', allStylesheets);
        
        // 8. Take a screenshot
        await page.screenshot({ 
            path: '/Users/gamepig/projects/NexusERP/frontend/debug_dashboard_screenshot.png', 
            fullPage: true 
        });
        console.log('📸 Screenshot saved as debug_dashboard_screenshot.png');
        
        // Wait for manual inspection
        console.log('🔍 Keeping browser open for manual inspection...');
        console.log('⏱️ Page will close in 60 seconds or press Ctrl+C to close now');
        
        await page.waitForTimeout(60000);
        
    } catch (error) {
        console.error('❌ Error during debugging:', error);
        await page.screenshot({ 
            path: '/Users/gamepig/projects/NexusERP/frontend/debug_error_screenshot.png'
        });
    } finally {
        await browser.close();
    }
}

debugLightTheme();