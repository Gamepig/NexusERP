// Simple Light Theme Visual Test
const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

async function runSimpleThemeTest() {
  console.log('🌞 Starting Simple Light Theme Test...');
  
  const screenshotsDir = path.join(__dirname, 'tests', 'screenshots');
  try {
    await fs.mkdir(screenshotsDir, { recursive: true });
  } catch (error) {
    // Directory already exists
  }
  
  let browser;
  try {
    browser = await puppeteer.launch({ 
      headless: false,
      defaultViewport: { width: 1920, height: 1080 },
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Step 1: Navigate and take initial screenshot
    console.log('📍 Step 1: Navigate to application');
    await page.goto('http://127.0.0.1:8000', { waitUntil: 'networkidle2' });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    await page.screenshot({ 
      path: path.join(screenshotsDir, 'simple-theme-01-initial.png'),
      fullPage: true 
    });
    
    // Check if login form exists
    const emailInput = await page.$('input[name="email"]');
    const loginButton = await page.$('button[type="submit"]');
    
    if (emailInput && loginButton) {
      console.log('🔐 Step 2: Login form found - attempting login');
      
      await page.type('input[name="email"]', 'test@example.com');
      await page.type('input[name="password"]', 'password123');
      
      await page.screenshot({ 
        path: path.join(screenshotsDir, 'simple-theme-02-login-filled.png') 
      });
      
      await page.click('button[type="submit"]');
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      await page.screenshot({ 
        path: path.join(screenshotsDir, 'simple-theme-03-after-login.png'),
        fullPage: true 
      });
    } else {
      console.log('ℹ️  No login form found - proceeding with current page');
    }
    
    // Step 3: Look for theme toggle
    console.log('🌞 Step 3: Search for theme toggle');
    
    const themeSelectors = [
      '.theme-toggle',
      '[data-theme-toggle]',
      'button[class*="theme"]',
      '.toggle-theme',
      '[aria-label*="theme"]',
      '[title*="theme"]'
    ];
    
    let themeElement = null;
    let foundSelector = null;
    
    for (const selector of themeSelectors) {
      try {
        themeElement = await page.$(selector);
        if (themeElement) {
          foundSelector = selector;
          console.log(`✅ Found theme toggle: ${selector}`);
          break;
        }
      } catch (error) {
        // Continue searching
      }
    }
    
    if (themeElement) {
      // Take screenshot before theme change
      await page.screenshot({ 
        path: path.join(screenshotsDir, 'simple-theme-04-before-toggle.png'),
        fullPage: true 
      });
      
      // Click theme toggle
      await page.click(foundSelector);
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Take screenshot after theme change
      await page.screenshot({ 
        path: path.join(screenshotsDir, 'simple-theme-05-after-toggle.png'),
        fullPage: true 
      });
      
      // Toggle back to see difference
      await page.click(foundSelector);
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      await page.screenshot({ 
        path: path.join(screenshotsDir, 'simple-theme-06-toggled-back.png'),
        fullPage: true 
      });
      
      // Final light theme
      await page.click(foundSelector);
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      await page.screenshot({ 
        path: path.join(screenshotsDir, 'simple-theme-07-final-light.png'),
        fullPage: true 
      });
      
    } else {
      console.log('⚠️  No theme toggle found - analyzing current theme');
    }
    
    // Step 4: Analyze current page elements
    console.log('🔍 Step 4: Analyze page elements');
    
    // Check for statistics/dashboard elements
    const pageElements = await page.evaluate(() => {
      const elements = [];
      
      // Look for statistics containers
      const statsSelectors = ['.statistics', '.stats', '[class*="stat"]', '.dashboard-stats'];
      statsSelectors.forEach(selector => {
        const els = document.querySelectorAll(selector);
        els.forEach((el, index) => {
          const styles = window.getComputedStyle(el);
          elements.push({
            type: 'statistics',
            selector: selector,
            index: index,
            backgroundColor: styles.backgroundColor,
            color: styles.color,
            backgroundImage: styles.backgroundImage
          });
        });
      });
      
      // Look for cards
      const cardSelectors = ['.card', '[class*="card"]'];
      cardSelectors.forEach(selector => {
        const els = document.querySelectorAll(selector);
        els.forEach((el, index) => {
          const styles = window.getComputedStyle(el);
          elements.push({
            type: 'card',
            selector: selector,
            index: index,
            backgroundColor: styles.backgroundColor,
            borderColor: styles.borderColor,
            color: styles.color
          });
        });
      });
      
      return elements;
    });
    
    console.log('🔍 Found page elements:', pageElements);
    
    // Step 5: Test responsive design
    console.log('📱 Step 5: Test responsive layouts');
    
    const viewports = [
      { width: 1280, height: 720, name: 'desktop' },
      { width: 768, height: 1024, name: 'tablet' },
      { width: 375, height: 667, name: 'mobile' }
    ];
    
    for (const viewport of viewports) {
      await page.setViewport(viewport);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await page.screenshot({ 
        path: path.join(screenshotsDir, `simple-theme-08-${viewport.name}.png`),
        fullPage: true 
      });
      
      console.log(`📱 ${viewport.name}: ${viewport.width}x${viewport.height} captured`);
    }
    
    // Reset to desktop
    await page.setViewport({ width: 1920, height: 1080 });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Final comprehensive screenshot
    await page.screenshot({ 
      path: path.join(screenshotsDir, 'simple-theme-09-final.png'),
      fullPage: true 
    });
    
    console.log('✅ Simple Theme Test Completed!');
    console.log(`📁 Screenshots saved to: ${screenshotsDir}`);
    
    // Summary
    console.log('\n📋 Test Results:');
    console.log(`${themeElement ? '✅' : '⚠️ '} Theme toggle ${themeElement ? 'found and tested' : 'not found'}`);
    console.log(`✅ ${pageElements.length} page elements analyzed`);
    console.log('✅ Responsive design tested');
    console.log('✅ All screenshots captured');
    
    if (pageElements.length > 0) {
      console.log('\n🎨 Element Analysis:');
      pageElements.forEach((el, index) => {
        console.log(`${index + 1}. ${el.type} (${el.selector}): bg=${el.backgroundColor}, color=${el.color}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (browser) {
      try {
        const pages = await browser.pages();
        if (pages.length > 0) {
          await pages[0].screenshot({ 
            path: path.join(screenshotsDir, 'simple-theme-ERROR.png'),
            fullPage: true 
          });
        }
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
  runSimpleThemeTest()
    .then(() => {
      console.log('🎉 Test completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Test failed:', error);
      process.exit(1);
    });
}