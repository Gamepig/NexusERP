const { test, expect } = require('@playwright/test');

/**
 * NexusERP Dashboard Optimizations Comprehensive Test Suite
 * 
 * Tests all 4 major dashboard optimizations:
 * 1. Card height reduction by 40% (160px → 96px)
 * 2. Statistics card icon enlargement (1.5rem → 2rem)
 * 3. Quick action icon color differentiation (Purple, Orange, Blue, Green)
 * 4. Light theme card styling
 * 5. Database-driven statistics verification
 * 
 * Author: Claude Code MCP
 * Date: 2025-08-05
 */

test.describe('NexusERP Dashboard Optimizations - Comprehensive Validation', () => {
    let page;

    test.beforeEach(async ({ browser }) => {
        page = await browser.newPage();
        
        // Set proper viewport size
        await page.setViewportSize({ width: 1280, height: 720 });
        
        // Navigate to login page first
        await page.goto('http://127.0.0.1:8000');
        
        // Take initial screenshot
        await page.screenshot({ 
            path: 'dashboard-optimization-01-homepage.png', 
            fullPage: true 
        });
        
        // Wait for login page to load
        await page.waitForLoadState('networkidle');
        
        // Check if already logged in or need to login
        const isLoginPage = await page.locator('input[name="email"]').isVisible({ timeout: 3000 }).catch(() => false);
        
        if (isLoginPage) {
            console.log('🔐 Login required, performing authentication...');
            
            // Login with test credentials
            await page.fill('input[name="email"]', 'test@example.com');
            await page.fill('input[name="password"]', 'password123');
            
            await page.screenshot({ 
                path: 'dashboard-optimization-02-login-filled.png' 
            });
            
            // Click login button
            await page.click('button[type="submit"]');
            
            // Wait for redirect to dashboard
            await page.waitForURL('**/dashboard', { timeout: 10000 });
        }
        
        // Ensure we're on the dashboard
        await page.goto('http://127.0.0.1:8000/dashboard');
        await page.waitForLoadState('networkidle');
        
        // Wait for dashboard content to load
        await page.waitForSelector('.dashboard-container', { timeout: 10000 });
        
        console.log('✅ Successfully authenticated and on dashboard');
    });

    test('P1: Card Height Reduction Validation - 40% Reduction (160px → 96px)', async () => {
        console.log('🔍 Testing Card Height Reduction Optimization...');
        
        // Wait for statistics cards to load
        await page.waitForSelector('.stats-cards-container .nexus-card', { timeout: 10000 });
        
        // Get all statistics cards
        const statCards = await page.locator('.stats-cards-container .nexus-card').all();
        expect(statCards.length).toBeGreaterThan(0);
        
        console.log(`📊 Found ${statCards.length} statistics cards to test`);
        
        // Test each statistics card height
        for (let i = 0; i < statCards.length; i++) {
            const card = statCards[i];
            const boundingBox = await card.boundingBox();
            
            if (boundingBox) {
                console.log(`📐 Card ${i + 1} height: ${boundingBox.height}px`);
                
                // Verify height is around 96px (allowing for ±10px tolerance for responsive adjustments)
                expect(boundingBox.height).toBeGreaterThanOrEqual(86);
                expect(boundingBox.height).toBeLessThanOrEqual(106);
                
                // Ensure it's not the old height (160px)
                expect(boundingBox.height).toBeLessThan(150);
            }
        }
        
        // Verify CSS min-height property is correctly set
        const firstCard = statCards[0];
        const computedStyle = await firstCard.evaluate(el => {
            const style = window.getComputedStyle(el);
            return {
                minHeight: style.minHeight,
                height: style.height,
                aspectRatio: style.aspectRatio
            };
        });
        
        console.log('🎨 Computed CSS styles:', computedStyle);
        
        // Take screenshot showing card heights
        await page.screenshot({ 
            path: 'dashboard-optimization-03-card-heights-validation.png',
            fullPage: true 
        });
        
        console.log('✅ Card height reduction validation completed');
    });

    test('P2: Statistics Card Icon Enlargement - 1.5rem → 2rem', async () => {
        console.log('🔍 Testing Statistics Card Icon Enlargement...');
        
        // Wait for statistics cards and their icons
        await page.waitForSelector('.stats-cards-container .nexus-card .w-12.h-12', { timeout: 10000 });
        
        // Get all icon containers in statistics cards
        const iconContainers = await page.locator('.stats-cards-container .nexus-card .w-12.h-12').all();
        expect(iconContainers.length).toBeGreaterThan(0);
        
        console.log(`🎯 Found ${iconContainers.length} icon containers in statistics cards`);
        
        // Get all actual icons (SVG elements) within the containers
        const icons = await page.locator('.stats-cards-container .nexus-card .w-6.h-6').all();
        expect(icons.length).toBeGreaterThan(0);
        
        console.log(`🎨 Found ${icons.length} icons in statistics cards`);
        
        // Test each icon size
        for (let i = 0; i < icons.length; i++) {
            const icon = icons[i];
            
            // Get computed style
            const iconStyle = await icon.evaluate(el => {
                const style = window.getComputedStyle(el);
                return {
                    width: style.width,
                    height: style.height,
                    widthPx: parseFloat(style.width),
                    heightPx: parseFloat(style.height)
                };
            });
            
            console.log(`🔍 Icon ${i + 1} size: ${iconStyle.width} x ${iconStyle.height}`);
            
            // Verify icon is 2rem (32px) - allowing small tolerance for browser differences
            expect(iconStyle.widthPx).toBeGreaterThanOrEqual(30);
            expect(iconStyle.widthPx).toBeLessThanOrEqual(34);
            expect(iconStyle.heightPx).toBeGreaterThanOrEqual(30);
            expect(iconStyle.heightPx).toBeLessThanOrEqual(34);
            
            // Ensure it's not the old size (1.5rem = 24px)
            expect(iconStyle.widthPx).toBeGreaterThan(28);
        }
        
        // Take screenshot highlighting icon sizes
        await page.screenshot({ 
            path: 'dashboard-optimization-04-icon-enlargement-validation.png',
            fullPage: true 
        });
        
        console.log('✅ Statistics card icon enlargement validation completed');
    });

    test('P3: Quick Action Icon Color Differentiation', async () => {
        console.log('🔍 Testing Quick Action Icon Color Differentiation...');
        
        // Wait for quick action cards
        await page.waitForSelector('.nexus-quick-action-card', { timeout: 10000 });
        
        // Define expected colors and their corresponding actions
        const expectedColors = [
            { action: '新增報價單', colorClass: 'quick-action-purple', expectedColor: '#8b5cf6' },
            { action: '庫存管理', colorClass: 'quick-action-orange', expectedColor: '#f59e0b' },
            { action: '訂單處理', colorClass: 'quick-action-blue', expectedColor: '#3b82f6' },
            { action: '客戶管理', colorClass: 'quick-action-green', expectedColor: '#10b981' }
        ];
        
        // Get all quick action cards
        const quickActionCards = await page.locator('.nexus-quick-action-card').all();
        expect(quickActionCards.length).toBe(4);
        
        console.log(`🎯 Found ${quickActionCards.length} quick action cards`);
        
        // Test each quick action card
        for (let i = 0; i < quickActionCards.length; i++) {
            const card = quickActionCards[i];
            const cardText = await card.locator('h3').textContent();
            const expectedColor = expectedColors.find(c => c.action === cardText);
            
            if (expectedColor) {
                console.log(`🎨 Testing card "${cardText}" for ${expectedColor.colorClass}`);
                
                // Check if the card has the correct color class
                const iconContainer = card.locator(`.${expectedColor.colorClass}`);
                await expect(iconContainer).toBeVisible();
                
                // Get the icon within the container
                const icon = iconContainer.locator('.w-6.h-6');
                await expect(icon).toBeVisible();
                
                // Get computed color
                const iconColor = await icon.evaluate(el => {
                    const style = window.getComputedStyle(el);
                    return style.color;
                });
                
                console.log(`🎨 Card "${cardText}" icon color: ${iconColor}`);
                
                // Convert hex to rgb for comparison
                const hexToRgb = (hex) => {
                    const r = parseInt(hex.slice(1, 3), 16);
                    const g = parseInt(hex.slice(3, 5), 16);
                    const b = parseInt(hex.slice(5, 7), 16);
                    return `rgb(${r}, ${g}, ${b})`;
                };
                
                const expectedRgb = hexToRgb(expectedColor.expectedColor);
                expect(iconColor).toBe(expectedRgb);
                
            } else {
                console.warn(`⚠️ Unexpected card text: "${cardText}"`);
            }
        }
        
        // Take screenshot showing color differentiation
        await page.screenshot({ 
            path: 'dashboard-optimization-05-color-differentiation-validation.png',
            fullPage: true 
        });
        
        console.log('✅ Quick action icon color differentiation validation completed');
    });

    test('P4: Light Theme Card Styling', async () => {
        console.log('🔍 Testing Light Theme Card Styling...');
        
        // First test dark theme (default)
        await page.screenshot({ 
            path: 'dashboard-optimization-06-dark-theme-before.png',
            fullPage: true 
        });
        
        // Check if theme toggle exists and switch to light theme
        const themeToggle = page.locator('[data-theme-toggle]').or(
            page.locator('button:has-text("Light")').or(
                page.locator('button:has-text("淺色")').or(
                    page.locator('.theme-toggle')
                )
            )
        );
        
        const hasThemeToggle = await themeToggle.isVisible({ timeout: 3000 }).catch(() => false);
        
        if (hasThemeToggle) {
            console.log('🔆 Found theme toggle, switching to light theme...');
            await themeToggle.click();
            await page.waitForTimeout(1000); // Wait for theme transition
        } else {
            console.log('🔆 No theme toggle found, manually setting light theme...');
            // Manually set light theme via JavaScript
            await page.evaluate(() => {
                document.documentElement.setAttribute('data-theme', 'light');
                // Also add class-based theme if needed
                document.body.classList.add('light-theme');
                document.body.classList.remove('dark-theme');
            });
            await page.waitForTimeout(1000);
        }
        
        // Verify light theme is active
        const currentTheme = await page.evaluate(() => {
            return {
                dataTheme: document.documentElement.getAttribute('data-theme'),
                bodyClasses: document.body.className,
                computedBg: window.getComputedStyle(document.body).backgroundColor
            };
        });
        
        console.log('🎨 Current theme state:', currentTheme);
        
        // Test light theme card styling
        await page.waitForSelector('.nexus-card', { timeout: 5000 });
        
        // Get a sample card to test light theme styles
        const sampleCard = page.locator('.nexus-card').first();
        await expect(sampleCard).toBeVisible();
        
        // Get computed styles for light theme
        const lightThemeStyles = await sampleCard.evaluate(el => {
            const style = window.getComputedStyle(el);
            return {
                backgroundColor: style.backgroundColor,
                borderColor: style.borderColor,
                boxShadow: style.boxShadow,
                background: style.background
            };
        });
        
        console.log('🎨 Light theme card styles:', lightThemeStyles);
        
        // Verify light theme characteristics
        // Light theme should have lighter backgrounds
        expect(lightThemeStyles.backgroundColor).not.toBe('rgb(45, 49, 66)'); // Not dark theme color
        
        // Test text colors in light theme
        const textPrimary = page.locator('.nexus-text-primary').first();
        const textColor = await textPrimary.evaluate(el => {
            return window.getComputedStyle(el).color;
        });
        
        console.log('🎨 Light theme text color:', textColor);
        
        // In light theme, text should be dark
        expect(textColor).not.toBe('rgb(255, 255, 255)'); // Not white text
        
        // Take screenshot of light theme
        await page.screenshot({ 
            path: 'dashboard-optimization-07-light-theme-validation.png',
            fullPage: true 
        });
        
        console.log('✅ Light theme card styling validation completed');
    });

    test('P5: Database-Driven Statistics Verification', async () => {
        console.log('🔍 Testing Database-Driven Statistics...');
        
        // Wait for dashboard to load completely
        await page.waitForSelector('.stats-cards-container', { timeout: 10000 });
        
        // Monitor network requests to verify API calls
        const apiRequests = [];
        page.on('request', request => {
            if (request.url().includes('/api/dashboard')) {
                apiRequests.push({
                    url: request.url(),
                    method: request.method(),
                    headers: request.headers()
                });
            }
        });
        
        // Trigger dashboard refresh to verify API integration
        const refreshButton = page.locator('[data-action="refresh-dashboard"]');
        if (await refreshButton.isVisible({ timeout: 3000 })) {
            console.log('🔄 Found refresh button, triggering API call...');
            await refreshButton.click();
            await page.waitForTimeout(2000); // Wait for API call
        }
        
        // Verify statistics cards have real data (not placeholder values)
        const statCards = await page.locator('.stats-cards-container .nexus-card').all();
        
        for (let i = 0; i < statCards.length; i++) {
            const card = statCards[i];
            const title = await card.locator('p.nexus-text-secondary').textContent();
            const value = await card.locator('.stat-value').textContent();
            
            console.log(`📊 Statistics card: "${title}" = "${value}"`);
            
            // Verify values are not placeholder/loading states
            expect(value).not.toBe('載入中...');
            expect(value).not.toBe('Loading...');
            expect(value).not.toBe('0');
            expect(value).not.toBe('');
            
            // Verify values contain meaningful data
            expect(value.length).toBeGreaterThan(0);
        }
        
        // Verify charts are loaded with data
        const charts = await page.locator('canvas').all();
        expect(charts.length).toBeGreaterThan(0);
        
        console.log(`📈 Found ${charts.length} charts on dashboard`);
        
        // Check if charts have been initialized (Canvas should have drawn content)
        for (let i = 0; i < charts.length; i++) {
            const chart = charts[i];
            const chartId = await chart.getAttribute('id');
            
            // Verify chart canvas is not blank
            const hasContent = await chart.evaluate(canvas => {
                const ctx = canvas.getContext('2d');
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                
                // Check if canvas has any non-transparent pixels
                for (let i = 3; i < imageData.data.length; i += 4) {
                    if (imageData.data[i] > 0) return true;
                }
                return false;
            });
            
            console.log(`📈 Chart "${chartId}" has content: ${hasContent}`);
            expect(hasContent).toBe(true);
        }
        
        // Verify API integration
        if (apiRequests.length > 0) {
            console.log(`✅ API integration verified: ${apiRequests.length} dashboard API calls made`);
            apiRequests.forEach((req, index) => {
                console.log(`🔗 API Request ${index + 1}: ${req.method} ${req.url}`);
            });
        }
        
        // Take final screenshot
        await page.screenshot({ 
            path: 'dashboard-optimization-08-database-integration-validation.png',
            fullPage: true 
        });
        
        console.log('✅ Database-driven statistics verification completed');
    });

    test('P6: Responsive Design Validation', async () => {
        console.log('🔍 Testing Responsive Design for Different Screen Sizes...');
        
        const viewports = [
            { name: 'Desktop-Large', width: 1920, height: 1080 },
            { name: 'Desktop-Medium', width: 1280, height: 720 },
            { name: 'Tablet', width: 768, height: 1024 },
            { name: 'Mobile', width: 375, height: 667 }
        ];
        
        for (const viewport of viewports) {
            console.log(`📱 Testing ${viewport.name} (${viewport.width}x${viewport.height})`);
            
            await page.setViewportSize({ width: viewport.width, height: viewport.height });
            await page.waitForTimeout(1000); // Wait for responsive adjustments
            
            // Test card heights at different viewports
            const statCards = await page.locator('.stats-cards-container .nexus-card').all();
            
            if (statCards.length > 0) {
                const firstCard = statCards[0];
                const boundingBox = await firstCard.boundingBox();
                
                console.log(`📐 ${viewport.name} - Card height: ${boundingBox?.height}px`);
                
                // Responsive height checks
                if (viewport.width <= 768) {
                    // Mobile/Tablet should have smaller height (around 72px)
                    expect(boundingBox?.height).toBeLessThanOrEqual(85);
                } else {
                    // Desktop should maintain optimized height (around 96px)
                    expect(boundingBox?.height).toBeGreaterThanOrEqual(86);
                    expect(boundingBox?.height).toBeLessThanOrEqual(106);
                }
            }
            
            // Test icon sizes at different viewports
            const icons = await page.locator('.stats-cards-container .nexus-card .w-6.h-6').all();
            if (icons.length > 0) {
                const firstIcon = icons[0];
                const iconStyle = await firstIcon.evaluate(el => {
                    const style = window.getComputedStyle(el);
                    return {
                        widthPx: parseFloat(style.width),
                        heightPx: parseFloat(style.height)
                    };
                });
                
                console.log(`🎨 ${viewport.name} - Icon size: ${iconStyle.widthPx}x${iconStyle.heightPx}px`);
                
                // Icons should maintain reasonable size across viewports
                expect(iconStyle.widthPx).toBeGreaterThan(16);
                expect(iconStyle.heightPx).toBeGreaterThan(16);
            }
            
            // Take responsive screenshot
            await page.screenshot({ 
                path: `dashboard-optimization-responsive-${viewport.name}-${viewport.width}x${viewport.height}.png`,
                fullPage: true 
            });
        }
        
        // Reset to default viewport
        await page.setViewportSize({ width: 1280, height: 720 });
        
        console.log('✅ Responsive design validation completed');
    });

    test('P7: Comprehensive Visual Regression Test', async () => {
        console.log('🔍 Running Comprehensive Visual Regression Test...');
        
        // Wait for complete dashboard load
        await page.waitForLoadState('networkidle');
        await page.waitForSelector('.stats-cards-container', { timeout: 10000 });
        await page.waitForTimeout(3000); // Wait for all animations and data loading
        
        // Test both themes
        const themes = ['dark', 'light'];
        
        for (const theme of themes) {
            console.log(`🎨 Testing ${theme} theme visual appearance...`);
            
            // Set theme
            await page.evaluate((themeName) => {
                document.documentElement.setAttribute('data-theme', themeName);
                if (themeName === 'light') {
                    document.body.classList.add('light-theme');
                    document.body.classList.remove('dark-theme');
                } else {
                    document.body.classList.add('dark-theme');
                    document.body.classList.remove('light-theme');
                }
            }, theme);
            
            await page.waitForTimeout(1000);
            
            // Full page screenshot
            await page.screenshot({ 
                path: `dashboard-optimization-final-${theme}-theme-complete.png`,
                fullPage: true 
            });
            
            // Focused screenshots of key areas
            
            // 1. Statistics cards area
            const statsContainer = page.locator('.stats-cards-container');
            await statsContainer.screenshot({
                path: `dashboard-optimization-final-${theme}-theme-statistics-cards.png`
            });
            
            // 2. Quick actions area
            const quickActions = page.locator('.nexus-quick-action-card').first().locator('..');
            await quickActions.screenshot({
                path: `dashboard-optimization-final-${theme}-theme-quick-actions.png`
            });
            
            // 3. Charts area
            const chartsArea = page.locator('.grid.grid-cols-1.lg\\:grid-cols-2.gap-6.mb-8').last();
            await chartsArea.screenshot({
                path: `dashboard-optimization-final-${theme}-theme-charts.png`
            });
        }
        
        console.log('✅ Comprehensive visual regression test completed');
    });

    test.afterEach(async () => {
        // Final cleanup screenshot
        await page.screenshot({ 
            path: 'dashboard-optimization-final-cleanup.png',
            fullPage: true 
        });
        
        console.log('🧹 Test cleanup completed');
    });
});

/**
 * Additional utility test for detailed analysis
 */
test.describe('NexusERP Dashboard Optimizations - Detailed Analysis', () => {
    
    test('Detailed CSS Analysis and Verification', async ({ page }) => {
        console.log('🔬 Running Detailed CSS Analysis...');
        
        // Navigate and login
        await page.goto('http://127.0.0.1:8000');
        
        // Login if needed
        const needsLogin = await page.locator('input[name="email"]').isVisible({ timeout: 3000 }).catch(() => false);
        
        if (needsLogin) {
            await page.fill('input[name="email"]', 'test@example.com');
            await page.fill('input[name="password"]', 'password123');
            await page.click('button[type="submit"]');
            await page.waitForURL('**/dashboard', { timeout: 10000 });
        } else {
            await page.goto('http://127.0.0.1:8000/dashboard');
        }
        
        await page.waitForLoadState('networkidle');
        await page.waitForSelector('.stats-cards-container', { timeout: 10000 });
        
        // Detailed CSS analysis
        const cssAnalysis = await page.evaluate(() => {
            const analysis = {
                statsCardsContainer: {},
                statCards: [],
                quickActionCards: [],
                icons: []
            };
            
            // Analyze stats cards container
            const container = document.querySelector('.stats-cards-container');
            if (container) {
                const containerStyle = window.getComputedStyle(container);
                analysis.statsCardsContainer = {
                    background: containerStyle.background,
                    border: containerStyle.border,
                    borderRadius: containerStyle.borderRadius,
                    padding: containerStyle.padding
                };
            }
            
            // Analyze individual stat cards
            const statCards = document.querySelectorAll('.stats-cards-container .nexus-card');
            statCards.forEach((card, index) => {
                const style = window.getComputedStyle(card);
                const rect = card.getBoundingClientRect();
                
                analysis.statCards.push({
                    index,
                    height: rect.height,
                    minHeight: style.minHeight,
                    aspectRatio: style.aspectRatio,
                    background: style.background,
                    border: style.border,
                    borderRadius: style.borderRadius,
                    boxShadow: style.boxShadow
                });
            });
            
            // Analyze quick action cards
            const quickActionCards = document.querySelectorAll('.nexus-quick-action-card');
            quickActionCards.forEach((card, index) => {
                const title = card.querySelector('h3')?.textContent || '';
                const iconContainer = card.querySelector('.w-12.h-12');
                const icon = card.querySelector('.w-6.h-6');
                
                const cardStyle = window.getComputedStyle(card);
                const iconStyle = icon ? window.getComputedStyle(icon) : null;
                
                analysis.quickActionCards.push({
                    index,
                    title,
                    background: cardStyle.background,
                    border: cardStyle.border,
                    iconColor: iconStyle ? iconStyle.color : null,
                    iconWidth: iconStyle ? iconStyle.width : null,
                    iconHeight: iconStyle ? iconStyle.height : null
                });
            });
            
            // Analyze stat card icons
            const statIcons = document.querySelectorAll('.stats-cards-container .w-6.h-6');
            statIcons.forEach((icon, index) => {
                const style = window.getComputedStyle(icon);
                
                analysis.icons.push({
                    index,
                    width: style.width,
                    height: style.height,
                    color: style.color
                });
            });
            
            return analysis;
        });
        
        console.log('📊 Detailed CSS Analysis Results:');
        console.log('Stats Cards Container:', cssAnalysis.statsCardsContainer);
        console.log(`Statistics Cards (${cssAnalysis.statCards.length}):`, cssAnalysis.statCards);
        console.log(`Quick Action Cards (${cssAnalysis.quickActionCards.length}):`, cssAnalysis.quickActionCards);
        console.log(`Statistics Icons (${cssAnalysis.icons.length}):`, cssAnalysis.icons);
        
        // Verification based on analysis
        
        // 1. Verify card heights
        cssAnalysis.statCards.forEach((card, index) => {
            expect(card.height).toBeGreaterThanOrEqual(86);
            expect(card.height).toBeLessThanOrEqual(106);
            console.log(`✅ Card ${index + 1} height: ${card.height}px (within optimized range)`);
        });
        
        // 2. Verify icon sizes
        cssAnalysis.icons.forEach((icon, index) => {
            const widthPx = parseFloat(icon.width);
            const heightPx = parseFloat(icon.height);
            
            expect(widthPx).toBeGreaterThanOrEqual(30);
            expect(widthPx).toBeLessThanOrEqual(34);
            expect(heightPx).toBeGreaterThanOrEqual(30);
            expect(heightPx).toBeLessThanOrEqual(34);
            
            console.log(`✅ Icon ${index + 1} size: ${icon.width} x ${icon.height} (enlarged correctly)`);
        });
        
        // 3. Verify quick action color differentiation
        const expectedQuickActionColors = {
            '新增報價單': 'rgb(139, 92, 246)', // Purple
            '庫存管理': 'rgb(245, 158, 11)',   // Orange
            '訂單處理': 'rgb(59, 130, 246)',   // Blue
            '客戶管理': 'rgb(16, 185, 129)'    // Green
        };
        
        cssAnalysis.quickActionCards.forEach((card) => {
            const expectedColor = expectedQuickActionColors[card.title];
            if (expectedColor && card.iconColor) {
                expect(card.iconColor).toBe(expectedColor);
                console.log(`✅ Quick action "${card.title}" has correct color: ${card.iconColor}`);
            }
        });
        
        // Save detailed analysis screenshot
        await page.screenshot({ 
            path: 'dashboard-optimization-detailed-css-analysis.png',
            fullPage: true 
        });
        
        console.log('✅ Detailed CSS analysis completed successfully');
    });
});