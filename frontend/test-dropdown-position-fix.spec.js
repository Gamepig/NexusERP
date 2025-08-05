import { test, expect } from '@playwright/test';

test('Verify user dropdown positioning after CSS fix', async ({ page }) => {
    // 1. Navigate to dashboard
    console.log('📍 Starting dropdown position verification test...');
    
    // Navigate to the application
    await page.goto('http://127.0.0.1:8000', { timeout: 30000 });
    
    // 2. Take screenshot before click to see initial state
    await page.screenshot({ path: 'dropdown-position-test-01-initial.png', fullPage: false });
    console.log('📸 Screenshot 1: Initial state saved');
    
    // Check if we're on the landing page and need to navigate to login
    const isOnLandingPage = await page.locator('.nav-container .logo').count() > 0;
    
    if (isOnLandingPage) {
        console.log('📍 On landing page, navigating to login...');
        // Navigate directly to login page
        await page.goto('http://127.0.0.1:8000/login', { timeout: 30000 });
    }
    
    // Check if we need to login
    const loginForm = await page.locator('form').count();
    
    if (loginForm > 0) {
        console.log('🔐 Login required, proceeding with authentication...');
        
        // Wait for form elements to be available
        await page.waitForSelector('input[name="email"]', { timeout: 10000 });
        await page.waitForSelector('input[name="password"]', { timeout: 10000 });
        
        await page.fill('input[name="email"]', 'test@example.com');
        await page.fill('input[name="password"]', 'password123');
        
        // Click submit and wait for redirect
        await Promise.all([
            page.waitForURL('**/dashboard', { timeout: 15000 }),
            page.click('button[type="submit"]')
        ]);
        
        console.log('✅ Successfully logged in and navigated to dashboard');
    } else {
        // If no login form, try to navigate directly to dashboard
        await page.goto('http://127.0.0.1:8000/dashboard', { timeout: 30000 });
    }
    
    // Wait for the page to be fully loaded
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Give some time for Alpine.js to initialize
    
    // 3. Take screenshot after login
    await page.screenshot({ path: 'dropdown-position-test-02-after-login.png', fullPage: false });
    console.log('📸 Screenshot 2: After login saved');
    
    // 4. Find and analyze user avatar/trigger element
    const userMenuTrigger = page.locator('#user-menu-trigger');
    await expect(userMenuTrigger).toBeVisible({ timeout: 10000 });
    
    console.log('👤 User menu trigger found');
    
    // Get initial positions before clicking
    const triggerBeforeClick = await userMenuTrigger.boundingBox();
    console.log('📏 Trigger position before click:', triggerBeforeClick);
    
    // 5. Click the user avatar to open dropdown
    console.log('🖱️ Clicking user avatar to open dropdown...');
    await userMenuTrigger.click();
    
    // Wait a moment for the dropdown to appear
    await page.waitForTimeout(1000);
    
    // 6. Take screenshot after click to see dropdown position
    await page.screenshot({ path: 'dropdown-position-test-03-after-click.png', fullPage: false });
    console.log('📸 Screenshot 3: After click saved');
    
    // 7. Check dropdown position with JavaScript evaluation
    const positionData = await page.evaluate(() => {
        const dropdown = document.querySelector('#user-dropdown-menu');
        const trigger = document.querySelector('#user-menu-trigger');
        
        if (dropdown && trigger) {
            const dropdownRect = dropdown.getBoundingClientRect();
            const triggerRect = trigger.getBoundingClientRect();
            const dropdownStyles = window.getComputedStyle(dropdown);
            
            return {
                dropdownVisible: dropdownStyles.display !== 'none' && dropdownStyles.visibility !== 'hidden',
                dropdownPosition: {
                    top: dropdownRect.top,
                    left: dropdownRect.left,
                    right: dropdownRect.right,
                    bottom: dropdownRect.bottom,
                    width: dropdownRect.width,
                    height: dropdownRect.height
                },
                triggerPosition: {
                    top: triggerRect.top,
                    left: triggerRect.left,
                    right: triggerRect.right,
                    bottom: triggerRect.bottom,
                    width: triggerRect.width,
                    height: triggerRect.height
                },
                dropdownStyles: {
                    display: dropdownStyles.display,
                    visibility: dropdownStyles.visibility,
                    position: dropdownStyles.position,
                    top: dropdownStyles.top,
                    left: dropdownStyles.left,
                    right: dropdownStyles.right,
                    zIndex: dropdownStyles.zIndex,
                    transform: dropdownStyles.transform
                },
                isPositionedCorrectly: dropdownRect.top > triggerRect.bottom && 
                                      Math.abs(dropdownRect.right - triggerRect.right) <= 50, // Some tolerance
                verticalGap: dropdownRect.top - triggerRect.bottom,
                horizontalAlignment: dropdownRect.right - triggerRect.right
            };
        }
        return { error: 'Elements not found' };
    });
    
    console.log('📊 Position Analysis Results:');
    console.log(JSON.stringify(positionData, null, 2));
    
    // 8. Verify dropdown appears and is positioned correctly
    if (positionData.error) {
        console.log('❌ Error: Required elements not found');
        throw new Error('Dropdown or trigger elements not found');
    }
    
    // Check if dropdown is visible
    expect(positionData.dropdownVisible).toBe(true);
    console.log('✅ Dropdown is visible');
    
    // Check if dropdown appears below the trigger (not at bottom of screen)
    expect(positionData.isPositionedCorrectly).toBe(true);
    console.log('✅ Dropdown is positioned correctly below the trigger');
    
    // Additional position checks
    const isNearTrigger = positionData.verticalGap >= 0 && positionData.verticalGap <= 50;
    expect(isNearTrigger).toBe(true);
    console.log(`✅ Dropdown appears ${positionData.verticalGap}px below trigger (within acceptable range)`);
    
    const isAlignedRight = Math.abs(positionData.horizontalAlignment) <= 50;
    expect(isAlignedRight).toBe(true);
    console.log(`✅ Dropdown is right-aligned (offset: ${positionData.horizontalAlignment}px)`);
    
    // 9. Test if dropdown is in the navigation area (not at bottom of screen)
    const isInNavigationArea = positionData.dropdownPosition.top < 200; // Should be in top navigation area
    expect(isInNavigationArea).toBe(true);
    console.log(`✅ Dropdown appears in navigation area (top: ${positionData.dropdownPosition.top}px)`);
    
    // 10. Final screenshot for verification
    await page.screenshot({ path: 'dropdown-position-test-04-final-verification.png', fullPage: false });
    console.log('📸 Screenshot 4: Final verification saved');
    
    console.log('🎉 Dropdown positioning test completed successfully!');
    console.log('📋 Summary:');
    console.log(`   - Dropdown is visible: ${positionData.dropdownVisible}`);
    console.log(`   - Positioned correctly: ${positionData.isPositionedCorrectly}`);
    console.log(`   - Vertical gap: ${positionData.verticalGap}px`);
    console.log(`   - Horizontal alignment: ${positionData.horizontalAlignment}px`);
    console.log(`   - Top position: ${positionData.dropdownPosition.top}px`);
});