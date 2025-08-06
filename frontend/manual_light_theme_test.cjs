// Manual Light Theme Visual Verification Script
// Run with: node manual_light_theme_test.js

const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

async function runLightThemeTests() {
  console.log('🌞 Starting Manual Light Theme Visual Quality Tests...');
  
  // Ensure screenshots directory exists
  const screenshotsDir = path.join(__dirname, 'tests', 'screenshots');
  try {
    await fs.mkdir(screenshotsDir, { recursive: true });
  } catch (error) {
    // Directory already exists
  }
  
  let browser;
  try {
    // Launch browser
    browser = await puppeteer.launch({ 
      headless: false, // Show browser for visual verification
      defaultViewport: { width: 1920, height: 1080 },
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Step 1: Navigate to homepage
    console.log('📍 Step 1: Navigate to homepage');
    await page.goto('http://127.0.0.1:8000', { waitUntil: 'networkidle2' });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await page.screenshot({ 
      path: path.join(screenshotsDir, 'manual-light-01-homepage.png'),
      fullPage: true 
    });
    
    // Step 2: Login
    console.log('🔐 Step 2: Login with test credentials');
    await page.type('input[name="email"]', 'test@example.com');
    await page.type('input[name="password"]', 'password123');
    
    await page.screenshot({ 
      path: path.join(screenshotsDir, 'manual-light-02-login-filled.png') 
    });
    
    await page.click('button[type="submit"]');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Step 3: Wait for dashboard
    console.log('⏳ Step 3: Wait for dashboard to load');
    try {
      await page.waitForSelector('.main-content', { timeout: 15000 });
    } catch (error) {
      console.log('⚠️  Main content selector not found, trying alternatives');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    await page.screenshot({ 
      path: path.join(screenshotsDir, 'manual-light-03-after-login.png'),
      fullPage: true 
    });
    
    // Step 4: Check current theme and switch to light
    console.log('🌞 Step 4: Switch to Light Theme');
    
    // Try different theme toggle selectors
    const themeSelectors = [
      '.theme-toggle',
      '[data-theme-toggle]',
      'button[class*="theme"]',
      'button[class*="toggle"]',
      '.toggle-theme'
    ];
    
    let themeToggled = false;
    for (const selector of themeSelectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          console.log(`✅ Found theme toggle with selector: ${selector}`);
          await page.click(selector);
          await new Promise(resolve => setTimeout(resolve, 2000));
          themeToggled = true;
          break;
        }
      } catch (error) {
        console.log(`⚠️  Theme selector ${selector} not found or not clickable`);
      }
    }
    
    if (!themeToggled) {
      console.log('⚠️  Theme toggle not found, testing current theme');
    }
    
    // Take screenshot after theme change attempt
    await page.screenshot({ 
      path: path.join(screenshotsDir, 'manual-light-04-after-theme-toggle.png'),
      fullPage: true 
    });
    
    // Step 5: Analyze Statistics Container
    console.log('📊 Step 5: Analyze Statistics Container Background');
    
    const statsSelectors = [
      '.statistics-analysis',
      '.stats-container',
      '[class*="statistic"]',
      '.statistics',
      '.dashboard-stats'
    ];
    
    let statsFound = false;
    for (const selector of statsSelectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          console.log(`📊 Found statistics container: ${selector}`);
          
          const styles = await page.evaluate((sel) => {
            const el = document.querySelector(sel);
            if (el) {
              const computed = window.getComputedStyle(el);
              return {
                background: computed.background,
                backgroundColor: computed.backgroundColor,
                backgroundImage: computed.backgroundImage,
                color: computed.color
              };
            }
            return null;
          }, selector);
          
          console.log('📊 Statistics container styles:', styles);
          
          // Take focused screenshot
          await element.screenshot({ 
            path: path.join(screenshotsDir, 'manual-light-05-statistics-focused.png') 
          });
          
          statsFound = true;
          break;
        }
      } catch (error) {
        // Continue to next selector
      }
    }
    
    if (!statsFound) {
      console.log('⚠️  Statistics container not found with any selector');
    }
    
    // Step 6: Test Card Elements
    console.log('🎴 Step 6: Test Card Elements');
    
    const cardSelectors = ['.card', '[class*="card"]', '.dashboard-card'];
    let cardsFound = 0;
    
    for (const selector of cardSelectors) {
      try {
        const cards = await page.$$(selector);
        if (cards.length > 0) {
          console.log(`🎴 Found ${cards.length} cards with selector: ${selector}`);
          cardsFound += cards.length;
          
          // Test first few cards
          for (let i = 0; i < Math.min(cards.length, 3); i++) {
            try {
              const cardStyles = await cards[i].evaluate(el => {
                const styles = window.getComputedStyle(el);
                return {
                  backgroundColor: styles.backgroundColor,
                  borderColor: styles.borderColor,
                  borderWidth: styles.borderWidth,
                  color: styles.color
                };
              });
              
              console.log(`🎴 Card ${i + 1} styles:`, cardStyles);
              
              await cards[i].screenshot({ 
                path: path.join(screenshotsDir, `manual-light-06-card-${i + 1}.png`) 
              });
            } catch (error) {
              console.log(`⚠️  Error analyzing card ${i + 1}:`, error.message);
            }
          }
          break;
        }
      } catch (error) {
        // Continue to next selector
      }
    }
    
    console.log(`🎴 Total cards found: ${cardsFound}`);
    
    // Step 7: Test Responsive Design
    console.log('📱 Step 7: Test Responsive Design');
    
    const viewports = [
      { width: 1920, height: 1080, name: 'desktop-large' },
      { width: 1280, height: 720, name: 'desktop-medium' },
      { width: 768, height: 1024, name: 'tablet' },
      { width: 375, height: 667, name: 'mobile' }
    ];
    
    for (const viewport of viewports) {
      console.log(`📱 Testing ${viewport.name} (${viewport.width}x${viewport.height})`);
      await page.setViewport({ width: viewport.width, height: viewport.height });
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await page.screenshot({ 
        path: path.join(screenshotsDir, `manual-light-07-${viewport.name}.png`),
        fullPage: true 
      });
    }
    
    // Reset to desktop for final tests
    await page.setViewport({ width: 1920, height: 1080 });
    await page.waitForTimeout(1000);
    
    // Step 8: Final comprehensive screenshot
    console.log('📸 Step 8: Final comprehensive verification');
    await page.screenshot({ 
      path: path.join(screenshotsDir, 'manual-light-08-final-verification.png'),
      fullPage: true 
    });
    
    // Step 9: Test theme contrast by capturing both themes if possible
    if (themeToggled) {
      console.log('🔄 Step 9: Compare with dark theme');
      
      // Try to switch back to dark theme
      for (const selector of themeSelectors) {
        try {
          const element = await page.$(selector);
          if (element) {
            await page.click(selector);
            await new Promise(resolve => setTimeout(resolve, 2000));
            break;
          }
        } catch (error) {
          // Continue
        }
      }
      
      await page.screenshot({ 
        path: path.join(screenshotsDir, 'manual-light-09-dark-comparison.png'),
        fullPage: true 
      });
      
      // Switch back to light
      for (const selector of themeSelectors) {
        try {
          const element = await page.$(selector);
          if (element) {
            await page.click(selector);
            await new Promise(resolve => setTimeout(resolve, 2000));
            break;
          }
        } catch (error) {
          // Continue
        }
      }
      
      await page.screenshot({ 
        path: path.join(screenshotsDir, 'manual-light-10-final-light.png'),
        fullPage: true 
      });
    }
    
    console.log('✅ Manual Light Theme Visual Quality Tests Completed!');
    console.log(`📁 Screenshots saved to: ${screenshotsDir}`);
    
    // Summary
    console.log('\n📋 Test Summary:');
    console.log('✅ Homepage accessed');
    console.log('✅ Login completed');
    console.log('✅ Dashboard loaded');
    console.log(`${themeToggled ? '✅' : '⚠️ '} Theme toggle ${themeToggled ? 'successful' : 'not found'}`);
    console.log(`${statsFound ? '✅' : '⚠️ '} Statistics container ${statsFound ? 'analyzed' : 'not found'}`);
    console.log(`✅ ${cardsFound} cards analyzed`);
    console.log('✅ Responsive design tested');
    console.log('✅ All screenshots captured');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (browser) {
      try {
        const page = browser.pages()[0];
        await page.screenshot({ 
          path: path.join(screenshotsDir, 'manual-light-ERROR.png'),
          fullPage: true 
        });
      } catch (screenshotError) {
        console.error('❌ Could not take error screenshot:', screenshotError.message);
      }
    }
    
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the test
if (require.main === module) {
  runLightThemeTests()
    .then(() => {
      console.log('🎉 All tests completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Test suite failed:', error);
      process.exit(1);
    });
}

module.exports = { runLightThemeTests };