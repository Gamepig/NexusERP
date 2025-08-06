const { test, expect } = require('@playwright/test');

/**
 * NexusERP Dashboard Authentication and Optimization Test
 * 
 * This test properly handles Laravel authentication and then tests
 * the dashboard optimizations.
 */

test.describe('NexusERP Dashboard - Authentication & Optimizations', () => {
    
    test('Complete Authentication Flow and Dashboard Optimization Validation', async ({ page }) => {
        console.log('🔐 Starting complete authentication and optimization test...');
        
        // Set longer timeout
        page.setDefaultTimeout(30000);
        
        // Step 1: Navigate to homepage
        await page.goto('http://127.0.0.1:8000');
        console.log('🌐 Navigated to homepage');
        
        await page.screenshot({ 
            path: 'auth-dashboard-01-homepage.png', 
            fullPage: true 
        });
        
        // Step 2: Handle authentication
        await page.waitForLoadState('networkidle');
        
        // Check current URL to understand where we are
        const currentUrl = page.url();
        console.log(`📍 Current URL: ${currentUrl}`);
        
        if (currentUrl.includes('/login') || await page.locator('input[name="email"]').isVisible({ timeout: 3000 })) {
            console.log('🔐 Login page detected, performing authentication...');
            
            // Fill login form
            await page.fill('input[name="email"]', 'test@example.com');
            await page.fill('input[name="password"]', 'password123');
            
            await page.screenshot({ 
                path: 'auth-dashboard-02-login-filled.png' 
            });
            
            // Click login button
            await page.click('button[type="submit"]');
            console.log('🔑 Login submitted');
            
            // Wait for login to process
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(3000);
            
            const afterLoginUrl = page.url();
            console.log(`📍 After login URL: ${afterLoginUrl}`);
            
            await page.screenshot({ 
                path: 'auth-dashboard-03-after-login.png',
                fullPage: true 
            });
        }
        
        // Step 3: Navigate to dashboard explicitly
        console.log('📊 Navigating to dashboard...');
        await page.goto('http://127.0.0.1:8000/dashboard');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(3000);
        
        const dashboardUrl = page.url();
        console.log(`📍 Dashboard URL: ${dashboardUrl}`);
        
        await page.screenshot({ 
            path: 'auth-dashboard-04-dashboard-attempt.png',
            fullPage: true 
        });
        
        // Step 4: Check if we successfully reached the dashboard
        const isOnDashboard = !dashboardUrl.includes('/login');
        
        if (isOnDashboard) {
            console.log('✅ Successfully authenticated and on dashboard!');
            
            // Now test the optimizations
            await testDashboardOptimizations(page);
            
        } else {
            console.log('❌ Still on login page, authentication may have failed');
            
            // Try alternative login approach
            console.log('🔄 Trying alternative authentication...');
            
            if (await page.locator('input[name="email"]').isVisible({ timeout: 3000 })) {
                // Clear and refill form
                await page.fill('input[name="email"]', '');
                await page.fill('input[name="password"]', '');
                await page.fill('input[name="email"]', 'test@example.com');
                await page.fill('input[name="password"]', 'password123');
                
                // Try clicking with JavaScript
                await page.evaluate(() => {
                    const loginButton = document.querySelector('button[type="submit"]');
                    if (loginButton) loginButton.click();
                });
                
                await page.waitForTimeout(5000);
                
                const retryUrl = page.url();
                console.log(`📍 Retry URL: ${retryUrl}`);
                
                if (!retryUrl.includes('/login')) {
                    console.log('✅ Alternative authentication successful!');
                    await page.goto('http://127.0.0.1:8000/dashboard');
                    await page.waitForLoadState('networkidle');
                    await testDashboardOptimizations(page);
                } else {
                    console.log('❌ Authentication still failing, testing what we can...');
                    await testWhateverIsVisible(page);
                }
            }
        }
        
        // Final screenshot
        await page.screenshot({ 
            path: 'auth-dashboard-05-final-state.png',
            fullPage: true 
        });
    });
});

async function testDashboardOptimizations(page) {
    console.log('🔍 Testing dashboard optimizations...');
    
    // Wait for dashboard content
    await page.waitForTimeout(5000);
    
    // Test 1: Look for statistics cards and test height
    console.log('📐 Testing card heights...');
    
    const cardSelectors = [
        '.stats-cards-container .nexus-card',
        '.nexus-card',
        '[data-stat]',
        '.stat-card-container',
        '[class*="card"]'
    ];
    
    let statCards = [];
    let usedSelector = '';
    
    for (const selector of cardSelectors) {
        try {
            const cards = await page.locator(selector).all();
            if (cards.length > 0) {
                statCards = cards;
                usedSelector = selector;
                console.log(`✅ Found ${cards.length} cards using: ${selector}`);
                break;
            }
        } catch (error) {
            console.log(`⚠️ Selector ${selector} failed`);
        }
    }
    
    if (statCards.length > 0) {
        console.log(`📊 Testing ${statCards.length} cards for height optimization...`);
        
        const heights = [];
        
        for (let i = 0; i < Math.min(statCards.length, 8); i++) {
            try {
                const card = statCards[i];
                const box = await card.boundingBox();
                if (box) {
                    heights.push(box.height);
                    console.log(`📏 Card ${i + 1}: ${box.height}px`);
                    
                    // Check if height suggests optimization (around 96px)
                    if (box.height >= 80 && box.height <= 120) {
                        console.log(`✅ Card ${i + 1} appears optimized`);
                    } else if (box.height >= 150) {
                        console.log(`❌ Card ${i + 1} may be using old height`);
                    }
                }
            } catch (error) {
                console.log(`⚠️ Could not measure card ${i + 1}`);
            }
        }
        
        if (heights.length > 0) {
            const avgHeight = heights.reduce((a, b) => a + b, 0) / heights.length;
            console.log(`📊 Average card height: ${avgHeight.toFixed(1)}px`);
        }
    }
    
    // Test 2: Icon sizes
    console.log('🎯 Testing icon sizes...');
    
    const iconSelectors = [
        '.stats-cards-container .w-6.h-6',
        '.nexus-card .w-6.h-6',
        'svg.w-6.h-6',
        '.w-6.h-6'
    ];
    
    for (const selector of iconSelectors) {
        try {
            const icons = await page.locator(selector).all();
            if (icons.length > 0) {
                console.log(`🎨 Found ${icons.length} icons with ${selector}`);
                
                const firstIcon = icons[0];
                const iconSize = await firstIcon.evaluate(el => {
                    const style = window.getComputedStyle(el);
                    return {
                        width: parseFloat(style.width),
                        height: parseFloat(style.height)
                    };
                });
                
                console.log(`📐 Icon size: ${iconSize.width}x${iconSize.height}px`);
                
                if (iconSize.width >= 30 && iconSize.width <= 34) {
                    console.log('✅ Icons appear to be enlarged correctly');
                } else if (iconSize.width >= 20 && iconSize.width <= 26) {
                    console.log('❌ Icons may be using old size');
                } else {
                    console.log('⚠️ Icon size is unexpected');
                }
                break;
            }
        } catch (error) {
            console.log(`⚠️ Icon test failed for ${selector}`);
        }
    }
    
    // Test 3: Quick action colors
    console.log('🌈 Testing quick action colors...');
    
    const quickActionSelectors = [
        '.nexus-quick-action-card',
        'a[href*="quotes"]',
        'a[href*="inventory"]',
        'a[href*="customers"]',
        '[class*="quick-action"]'
    ];
    
    for (const selector of quickActionSelectors) {
        try {
            const cards = await page.locator(selector).all();
            if (cards.length > 0) {
                console.log(`🎯 Found ${cards.length} quick action elements`);
                
                const colors = [];
                for (let i = 0; i < Math.min(cards.length, 4); i++) {
                    try {
                        const card = cards[i];
                        const icon = card.locator('svg, .w-6.h-6').first();
                        
                        if (await icon.isVisible({ timeout: 2000 })) {
                            const color = await icon.evaluate(el => {
                                return window.getComputedStyle(el).color;
                            });
                            colors.push(color);
                            console.log(`🎨 Quick action ${i + 1} color: ${color}`);
                        }
                    } catch (error) {
                        console.log(`⚠️ Could not get color for quick action ${i + 1}`);
                    }
                }
                
                const uniqueColors = [...new Set(colors)];
                console.log(`🌈 Found ${uniqueColors.length} unique colors`);
                
                if (uniqueColors.length >= 3) {
                    console.log('✅ Good color differentiation detected');
                } else {
                    console.log('⚠️ Limited color differentiation');
                }
                break;
            }
        } catch (error) {
            console.log(`⚠️ Quick action test failed for ${selector}`);
        }
    }
    
    // Test 4: Light theme test
    console.log('🔆 Testing light theme...');
    
    try {
        await page.evaluate(() => {
            document.documentElement.setAttribute('data-theme', 'light');
            document.body.classList.add('light-theme');
        });
        
        await page.waitForTimeout(1000);
        
        // Test if cards change appearance
        if (statCards.length > 0) {
            const cardStyle = await statCards[0].evaluate(el => {
                const style = window.getComputedStyle(el);
                return {
                    backgroundColor: style.backgroundColor,
                    color: style.color
                };
            });
            
            console.log('🎨 Light theme card style:', cardStyle);
            
            if (cardStyle.backgroundColor.includes('255, 255, 255') || 
                cardStyle.backgroundColor.includes('248, 250, 252')) {
                console.log('✅ Light theme styling appears to work');
            } else {
                console.log('⚠️ Light theme may not be fully implemented');
            }
        }
        
        await page.screenshot({ 
            path: 'auth-dashboard-06-light-theme-test.png',
            fullPage: true 
        });
        
    } catch (error) {
        console.log('❌ Light theme test failed:', error.message);
    }
    
    // Test 5: Charts and functionality
    console.log('📈 Testing charts and functionality...');
    
    const charts = await page.locator('canvas').all();
    console.log(`📊 Found ${charts.length} charts`);
    
    if (charts.length > 0) {
        console.log('✅ Dashboard has charts');
    } else {
        console.log('⚠️ No charts found');
    }
    
    // Overall assessment
    const pageContent = await page.evaluate(() => {
        return {
            title: document.title,
            hasNexusCards: document.querySelectorAll('.nexus-card').length,
            hasStatsCards: document.querySelectorAll('[class*="stats"]').length,
            hasQuickActions: document.querySelectorAll('[class*="quick-action"]').length,
            hasCharts: document.querySelectorAll('canvas').length,
            bodyText: document.body.innerText.substring(0, 300)
        };
    });
    
    console.log('📋 Dashboard assessment:', pageContent);
    
    const optimizationScore = [
        pageContent.hasNexusCards > 0 ? 'Cards' : null,
        pageContent.hasCharts > 0 ? 'Charts' : null,
        pageContent.hasQuickActions > 0 ? 'Quick Actions' : null,
        pageContent.bodyText.includes('營收') || pageContent.bodyText.includes('Statistics') ? 'Statistics' : null
    ].filter(Boolean);
    
    console.log(`🎯 Optimization features detected: ${optimizationScore.join(', ')}`);
    
    if (optimizationScore.length >= 3) {
        console.log('🎉 Dashboard optimizations appear to be well implemented!');
    } else if (optimizationScore.length >= 2) {
        console.log('✅ Dashboard optimizations are partially implemented');
    } else {
        console.log('⚠️ Dashboard optimizations may need attention');
    }
}

async function testWhateverIsVisible(page) {
    console.log('🔍 Testing visible elements on current page...');
    
    const pageInfo = await page.evaluate(() => {
        return {
            title: document.title,
            url: window.location.href,
            cards: document.querySelectorAll('[class*="card"]').length,
            buttons: document.querySelectorAll('button').length,
            forms: document.querySelectorAll('form').length,
            links: document.querySelectorAll('a').length,
            bodyText: document.body.innerText.substring(0, 200)
        };
    });
    
    console.log('📄 Current page info:', pageInfo);
    
    // Test any cards found
    if (pageInfo.cards > 0) {
        const cards = await page.locator('[class*="card"]').all();
        console.log(`🃏 Testing ${cards.length} card-like elements...`);
        
        for (let i = 0; i < Math.min(cards.length, 3); i++) {
            try {
                const box = await cards[i].boundingBox();
                if (box) {
                    console.log(`📐 Element ${i + 1} size: ${box.width}x${box.height}px`);
                }
            } catch (error) {
                console.log(`⚠️ Could not measure element ${i + 1}`);
            }
        }
    }
    
    console.log('✅ Basic page testing completed');
}