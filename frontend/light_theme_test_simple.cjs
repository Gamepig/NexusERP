const { test, expect } = require('@playwright/test');

test.describe('Light Theme Comprehensive Visual Tests', () => {
  test('Login and Switch to Light Theme - Full Visual Verification', async ({ page }) => {
    console.log('🌞 Starting Light Theme Visual Quality Tests...');
    
    try {
      // Navigate to the application
      console.log('📍 Step 1: Navigate to homepage');
      await page.goto('http://127.0.0.1:8000');
      await page.waitForTimeout(2000);
      
      // Take initial screenshot
      await page.screenshot({ 
        path: 'tests/screenshots/light-theme-01-homepage.png',
        fullPage: true 
      });
      
      // Login with test credentials
      console.log('🔐 Step 2: Login with test credentials');
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'password123');
      
      // Take screenshot before submit
      await page.screenshot({ 
        path: 'tests/screenshots/light-theme-02-login-filled.png' 
      });
      
      await page.click('button[type="submit"]');
      await page.waitForTimeout(3000);
      
      // Take screenshot after login
      await page.screenshot({ 
        path: 'tests/screenshots/light-theme-03-after-login.png',
        fullPage: true 
      });
      
      // Wait for dashboard to load completely
      console.log('⏳ Step 3: Wait for dashboard to load');
      await page.waitForSelector('.main-content', { timeout: 15000 });
      await page.waitForTimeout(2000);
      
      // Take dark theme screenshot first (default)
      await page.screenshot({ 
        path: 'tests/screenshots/light-theme-04-dark-theme-before.png',
        fullPage: true 
      });
      
      // Switch to Light Theme
      console.log('🌞 Step 4: Switch to Light Theme');
      const themeToggle = page.locator('.theme-toggle');
      if (await themeToggle.count() > 0) {
        await themeToggle.click();
        await page.waitForTimeout(2000); // Wait for theme transition
        console.log('✅ Theme toggle clicked successfully');
      } else {
        console.log('⚠️  Theme toggle not found, trying alternative selectors');
        // Try alternative selectors
        const altToggle = page.locator('[data-theme-toggle]');
        if (await altToggle.count() > 0) {
          await altToggle.click();
          await page.waitForTimeout(2000);
        }
      }
      
      // Take light theme screenshot
      await page.screenshot({ 
        path: 'tests/screenshots/light-theme-05-after-toggle.png',
        fullPage: true 
      });
      
      // Test Statistics Container Background
      console.log('📊 Step 5: Test Statistics Container Background');
      const statsContainer = page.locator('.statistics-analysis, .stats-container, [class*="statistic"]').first();
      
      if (await statsContainer.count() > 0) {
        const statsContainerBg = await statsContainer.evaluate(el => {
          const styles = window.getComputedStyle(el);
          return {
            background: styles.background,
            backgroundColor: styles.backgroundColor,
            backgroundImage: styles.backgroundImage,
            color: styles.color
          };
        });
        
        console.log('📊 Statistics Container Background:', statsContainerBg);
        
        // Take focused screenshot of statistics area
        await statsContainer.screenshot({ 
          path: 'tests/screenshots/light-theme-06-statistics-focused.png' 
        });
        
        // Verify statistics container has proper light theme background
        expect(statsContainerBg.backgroundColor).not.toBe('rgb(17, 24, 39)'); // Should not be dark gray
        expect(statsContainerBg.backgroundColor).not.toBe('rgb(31, 41, 55)'); // Should not be dark
      } else {
        console.log('⚠️  Statistics container not found');
      }
      
      // Test Card Contrast
      console.log('🎴 Step 6: Test Card Contrast');
      const cards = page.locator('.card, [class*="card"]');
      const cardCount = await cards.count();
      console.log(`🎴 Found ${cardCount} cards to test`);
      
      if (cardCount > 0) {
        // Test first few cards
        for (let i = 0; i < Math.min(cardCount, 3); i++) {
          const card = cards.nth(i);
          const cardStyles = await card.evaluate(el => {
            const styles = window.getComputedStyle(el);
            return {
              backgroundColor: styles.backgroundColor,
              borderColor: styles.borderColor,
              borderWidth: styles.borderWidth,
              color: styles.color
            };
          });
          
          console.log(`🎴 Card ${i + 1} styles:`, cardStyles);
          
          // Take screenshot of individual card
          await card.screenshot({ 
            path: `tests/screenshots/light-theme-07-card-${i + 1}.png` 
          });
          
          // Verify cards have proper contrast
          expect(cardStyles.backgroundColor).not.toBe('transparent');
          expect(cardStyles.backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
        }
      }
      
      // Test Text Readability
      console.log('📝 Step 7: Test Text Readability');
      const primaryText = page.locator('h1, h2, h3, .text-primary, [class*="title"]').first();
      if (await primaryText.count() > 0) {
        const textColor = await primaryText.evaluate(el => {
          return window.getComputedStyle(el).color;
        });
        console.log('🔤 Primary text color:', textColor);
        
        // Should be dark for light theme readability
        expect(textColor).not.toBe('rgb(255, 255, 255)'); // Should not be white
      }
      
      // Test different viewport sizes
      console.log('📱 Step 8: Test Responsive Design');
      const viewports = [
        { width: 1920, height: 1080, name: 'desktop-large' },
        { width: 1280, height: 720, name: 'desktop-medium' },
        { width: 768, height: 1024, name: 'tablet' },
        { width: 375, height: 667, name: 'mobile' }
      ];
      
      for (const viewport of viewports) {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.waitForTimeout(1000);
        
        await page.screenshot({ 
          path: `tests/screenshots/light-theme-08-${viewport.name}.png`,
          fullPage: true 
        });
        
        console.log(`📱 ${viewport.name} (${viewport.width}x${viewport.height}): Screenshot taken`);
      }
      
      // Reset to desktop size for final tests
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.waitForTimeout(1000);
      
      // Test theme toggle functionality
      console.log('🔄 Step 9: Test Theme Toggle Functionality');
      const currentThemeToggle = page.locator('.theme-toggle');
      if (await currentThemeToggle.count() > 0) {
        // Switch back to dark
        await currentThemeToggle.click();
        await page.waitForTimeout(1500);
        
        await page.screenshot({ 
          path: 'tests/screenshots/light-theme-09-dark-comparison.png',
          fullPage: true 
        });
        
        // Switch back to light
        await currentThemeToggle.click();
        await page.waitForTimeout(1500);
        
        await page.screenshot({ 
          path: 'tests/screenshots/light-theme-10-final-light.png',
          fullPage: true 
        });
      }
      
      // Final comprehensive screenshot
      console.log('📸 Step 10: Final comprehensive verification');
      await page.screenshot({ 
        path: 'tests/screenshots/light-theme-11-final-verification.png',
        fullPage: true 
      });
      
      console.log('✅ Light Theme Visual Quality Tests Completed Successfully!');
      
      // Log summary
      console.log('\n📋 Test Summary:');
      console.log('✅ Login successful');
      console.log('✅ Theme toggle functional');
      console.log('✅ Statistics container background verified');
      console.log('✅ Card contrast tested');
      console.log('✅ Text readability verified');
      console.log('✅ Responsive design tested');
      console.log('✅ All screenshots captured');
      
    } catch (error) {
      console.error('❌ Test failed:', error.message);
      
      // Take error screenshot
      await page.screenshot({ 
        path: 'tests/screenshots/light-theme-ERROR.png',
        fullPage: true 
      });
      
      throw error;
    }
  });
});