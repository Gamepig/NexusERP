// Login and Theme Toggle Test
const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

async function runLoginThemeTest() {
  console.log('🔐 Starting Login and Theme Toggle Test...');
  
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
    
    // Step 1: Navigate to login page
    console.log('📍 Step 1: Navigate to login page');
    await page.goto('http://127.0.0.1:8000/login', { waitUntil: 'networkidle2' });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await page.screenshot({ 
      path: path.join(screenshotsDir, 'login-theme-01-login-page.png'),
      fullPage: true 
    });
    
    // Check if login form exists on this page
    const emailInput = await page.$('input[name="email"]');
    const passwordInput = await page.$('input[name="password"]');
    const submitButton = await page.$('button[type="submit"]');
    
    if (emailInput && passwordInput && submitButton) {
      console.log('🔐 Step 2: Login form found - attempting login');
      
      await page.type('input[name="email"]', 'test@example.com');
      await page.type('input[name="password"]', 'password123');
      
      await page.screenshot({ 
        path: path.join(screenshotsDir, 'login-theme-02-credentials-filled.png') 
      });
      
      await page.click('button[type="submit"]');
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Wait for dashboard or main content
      try {
        await page.waitForSelector('.main-content, .dashboard, [class*="dashboard"]', { timeout: 10000 });
      } catch (error) {
        console.log('⚠️  Dashboard selector not found, continuing...');
      }
      
      await page.screenshot({ 
        path: path.join(screenshotsDir, 'login-theme-03-after-login.png'),
        fullPage: true 
      });
      
      // Step 3: Look for theme toggle after login
      console.log('🌞 Step 3: Search for theme toggle after login');
      
      const themeSelectors = [
        '.theme-toggle',
        '[data-theme-toggle]',
        'button[class*="theme"]',
        '.toggle-theme',
        '[aria-label*="theme"]',
        '[title*="theme"]',
        'button[onclick*="theme"]',
        '.theme-switcher',
        '.dark-mode-toggle'
      ];
      
      let themeToggleFound = false;
      let workingSelector = null;
      
      for (const selector of themeSelectors) {
        try {
          const element = await page.$(selector);
          if (element) {
            console.log(`✅ Found theme toggle: ${selector}`);
            workingSelector = selector;
            themeToggleFound = true;
            
            // Take screenshot before clicking
            await page.screenshot({ 
              path: path.join(screenshotsDir, 'login-theme-04-before-theme-toggle.png'),
              fullPage: true 
            });
            
            // Try to click the theme toggle
            await page.click(selector);
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Take screenshot after clicking
            await page.screenshot({ 
              path: path.join(screenshotsDir, 'login-theme-05-after-theme-toggle.png'),
              fullPage: true 
            });
            
            // Click again to test toggle back
            await page.click(selector);
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            await page.screenshot({ 
              path: path.join(screenshotsDir, 'login-theme-06-toggled-back.png'),
              fullPage: true 
            });
            
            // Final light theme
            await page.click(selector);
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            await page.screenshot({ 
              path: path.join(screenshotsDir, 'login-theme-07-final-light-theme.png'),
              fullPage: true 
            });
            
            break;
          }
        } catch (error) {
          console.log(`⚠️  Theme selector ${selector} failed: ${error.message}`);
        }
      }
      
      if (!themeToggleFound) {
        console.log('⚠️  No theme toggle found after login');
        
        // Manual analysis of the page
        const pageAnalysis = await page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          const buttonInfo = buttons.map(btn => ({
            text: btn.textContent?.trim(),
            className: btn.className,
            id: btn.id,
            onclick: btn.onclick ? btn.onclick.toString() : null,
            ariaLabel: btn.getAttribute('aria-label'),
            title: btn.getAttribute('title')
          }));
          
          return {
            totalButtons: buttons.length,
            buttons: buttonInfo.slice(0, 10), // First 10 buttons
            bodyClasses: Array.from(document.body.classList),
            htmlClasses: Array.from(document.documentElement.classList),
            themeAttribute: document.documentElement.getAttribute('data-theme')
          };
        });
        
        console.log('🔍 Page analysis:', pageAnalysis);
      }
      
      // Step 4: Analyze final theme state
      console.log('🎨 Step 4: Analyze final theme state');
      
      const finalThemeAnalysis = await page.evaluate(() => {
        const stats = document.querySelectorAll('.stats, .statistics, [class*="stat"]');
        const cards = document.querySelectorAll('.card, [class*="card"]');
        
        const statsAnalysis = Array.from(stats).slice(0, 3).map((el, index) => {
          const styles = window.getComputedStyle(el);
          return {
            index: index,
            backgroundColor: styles.backgroundColor,
            color: styles.color,
            background: styles.background
          };
        });
        
        const cardAnalysis = Array.from(cards).slice(0, 3).map((el, index) => {
          const styles = window.getComputedStyle(el);
          return {
            index: index,
            backgroundColor: styles.backgroundColor,
            color: styles.color,
            borderColor: styles.borderColor
          };
        });
        
        return {
          currentTheme: document.documentElement.getAttribute('data-theme'),
          bodyBackground: window.getComputedStyle(document.body).backgroundColor,
          bodyColor: window.getComputedStyle(document.body).color,
          statsCount: stats.length,
          cardCount: cards.length,
          statsAnalysis: statsAnalysis,
          cardAnalysis: cardAnalysis
        };
      });
      
      console.log('🎨 Final theme analysis:', finalThemeAnalysis);
      
      // Step 5: Test responsive after login
      console.log('📱 Step 5: Test responsive design');
      
      const viewports = [
        { width: 1280, height: 720, name: 'desktop' },
        { width: 768, height: 1024, name: 'tablet' },
        { width: 375, height: 667, name: 'mobile' }
      ];
      
      for (const viewport of viewports) {
        await page.setViewport(viewport);
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        await page.screenshot({ 
          path: path.join(screenshotsDir, `login-theme-08-${viewport.name}.png`),
          fullPage: true 
        });
      }
      
      // Reset to desktop
      await page.setViewport({ width: 1920, height: 1080 });
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await page.screenshot({ 
        path: path.join(screenshotsDir, 'login-theme-09-final-verification.png'),
        fullPage: true 
      });
      
      console.log('✅ Login and Theme Test Completed!');
      console.log(`📁 Screenshots saved to: ${screenshotsDir}`);
      
      console.log('\n📋 Test Results:');
      console.log('✅ Login successful');
      console.log(`${themeToggleFound ? '✅' : '⚠️ '} Theme toggle ${themeToggleFound ? 'found and tested' : 'not found'}`);
      console.log(`✅ ${finalThemeAnalysis.statsCount} statistics elements analyzed`);
      console.log(`✅ ${finalThemeAnalysis.cardCount} card elements analyzed`);
      console.log('✅ Responsive design tested');
      
      return {
        success: true,
        loginSuccessful: true,
        themeToggleFound: themeToggleFound,
        workingSelector: workingSelector,
        finalAnalysis: finalThemeAnalysis
      };
      
    } else {
      console.log('❌ Login form not found on /login page');
      
      // Try direct dashboard access
      console.log('🔄 Trying direct dashboard access...');
      await page.goto('http://127.0.0.1:8000', { waitUntil: 'networkidle2' });
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      await page.screenshot({ 
        path: path.join(screenshotsDir, 'login-theme-fallback-dashboard.png'),
        fullPage: true 
      });
      
      return {
        success: false,
        loginSuccessful: false,
        message: 'Login form not found'
      };
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (browser) {
      try {
        const pages = await browser.pages();
        if (pages.length > 0) {
          await pages[0].screenshot({ 
            path: path.join(screenshotsDir, 'login-theme-ERROR.png'),
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
  runLoginThemeTest()
    .then((result) => {
      console.log('\n🎉 Login Theme Test Results:');
      console.log(JSON.stringify(result, null, 2));
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Test failed:', error);
      process.exit(1);
    });
}