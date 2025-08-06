import puppeteer from 'puppeteer';

(async () => {
  console.log('🚀 Starting colorful light theme test...');
  
  const browser = await puppeteer.launch({ 
    headless: false, 
    defaultViewport: { width: 1920, height: 1080 }
  });
  
  const page = await browser.newPage();
  
  try {
    // Navigate to dashboard
    console.log('📍 Navigating to dashboard...');
    await page.goto('http://127.0.0.1:8000/dashboard');
    
    // Wait for page to load
    await page.waitForSelector('.dashboard-container', { timeout: 10000 });
    
    // Check if login is required
    const loginForm = await page.$('form[action*="login"]');
    if (loginForm) {
      console.log('🔐 Login required - filling credentials...');
      await page.type('input[name="email"]', 'test@example.com');
      await page.type('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      await page.waitForNavigation();
      await page.waitForSelector('.dashboard-container', { timeout: 10000 });
    }
    
    // Clear theme preference as requested
    console.log('🧹 Clearing stored theme preference...');
    await page.evaluate(() => {
      localStorage.removeItem('nexus-theme');
      location.reload();
    });
    
    await page.waitForSelector('.dashboard-container', { timeout: 10000 });
    
    // Check current theme attribute
    console.log('🔍 Inspecting current theme...');
    const currentTheme = await page.evaluate(() => {
      const html = document.documentElement;
      return {
        dataTheme: html.getAttribute('data-theme'),
        className: html.className,
        hasLightThemeClass: html.classList.contains('light-theme')
      };
    });
    
    console.log('Current theme state:', currentTheme);
    
    // Take screenshot of default state
    await page.screenshot({ 
      path: 'dashboard-default-theme.png',
      fullPage: true 
    });
    console.log('📸 Screenshot saved: dashboard-default-theme.png');
    
    // Check quick action cards styling
    console.log('🎨 Checking quick action cards...');
    const quickActionCards = await page.evaluate(() => {
      const cards = document.querySelectorAll('.nexus-quick-action-card');
      return Array.from(cards).map((card, index) => {
        const computedStyle = window.getComputedStyle(card);
        return {
          index: index + 1,
          background: computedStyle.background,
          backgroundColor: computedStyle.backgroundColor,
          border: computedStyle.border,
          boxShadow: computedStyle.boxShadow
        };
      });
    });
    
    console.log('Quick Action Cards Styling:', quickActionCards);
    
    // Check statistics container
    console.log('📊 Checking statistics container...');
    const statsContainer = await page.evaluate(() => {
      const container = document.getElementById('statsGrid');
      if (container) {
        const computedStyle = window.getComputedStyle(container);
        return {
          background: computedStyle.background,
          backgroundColor: computedStyle.backgroundColor,
          border: computedStyle.border
        };
      }
      return null;
    });
    
    console.log('Statistics Container Styling:', statsContainer);
    
    // Test theme switching
    console.log('🌓 Testing theme switching...');
    
    // Look for theme toggle button
    const themeToggle = await page.$('.theme-toggle, [data-action="toggle-theme"], button[onclick*="theme"]');
    
    if (themeToggle) {
      console.log('🎛️ Found theme toggle, clicking...');
      await themeToggle.click();
      await page.waitForTimeout(1000);
      
      // Check theme after toggle
      const newTheme = await page.evaluate(() => {
        const html = document.documentElement;
        return {
          dataTheme: html.getAttribute('data-theme'),
          className: html.className
        };
      });
      
      console.log('Theme after toggle:', newTheme);
      
      // Take screenshot of toggled theme
      await page.screenshot({ 
        path: 'dashboard-toggled-theme.png',
        fullPage: true 
      });
      console.log('📸 Screenshot saved: dashboard-toggled-theme.png');
      
      // Toggle back
      await themeToggle.click();
      await page.waitForTimeout(1000);
      
      // Final screenshot
      await page.screenshot({ 
        path: 'dashboard-final-theme.png',
        fullPage: true 
      });
      console.log('📸 Screenshot saved: dashboard-final-theme.png');
      
    } else {
      console.log('⚠️ No theme toggle button found, trying manual theme setting...');
      
      // Manually set light theme
      await page.evaluate(() => {
        document.documentElement.setAttribute('data-theme', 'light');
        document.documentElement.classList.add('light-theme');
      });
      
      await page.waitForTimeout(1000);
      
      // Check light theme styling
      const lightThemeCards = await page.evaluate(() => {
        const cards = document.querySelectorAll('.nexus-quick-action-card');
        return Array.from(cards).map((card, index) => {
          const computedStyle = window.getComputedStyle(card);
          return {
            index: index + 1,
            background: computedStyle.background,
            backgroundColor: computedStyle.backgroundColor,
            border: computedStyle.border,
            boxShadow: computedStyle.boxShadow
          };
        });
      });
      
      console.log('Light Theme Quick Action Cards:', lightThemeCards);
      
      // Take screenshot of light theme
      await page.screenshot({ 
        path: 'dashboard-light-theme.png',
        fullPage: true 
      });
      console.log('📸 Screenshot saved: dashboard-light-theme.png');
      
      // Check if colorful gradients are applied
      const hasColorfulGradients = await page.evaluate(() => {
        const cards = document.querySelectorAll('.nexus-quick-action-card');
        let hasGradients = false;
        
        cards.forEach(card => {
          const style = window.getComputedStyle(card);
          if (style.background.includes('gradient') || style.backgroundImage.includes('gradient')) {
            hasGradients = true;
          }
        });
        
        return hasGradients;
      });
      
      console.log('Has colorful gradients:', hasColorfulGradients);
    }
    
    // Generate detailed inspection report
    console.log('📋 Generating inspection report...');
    const inspectionReport = await page.evaluate(() => {
      const report = {
        htmlThemeAttribute: document.documentElement.getAttribute('data-theme'),
        htmlClasses: document.documentElement.className,
        cssVariables: {},
        quickActionCards: [],
        statisticsContainer: {},
        appliedCSSRules: []
      };
      
      // Get CSS variables
      const rootStyles = window.getComputedStyle(document.documentElement);
      const cssProps = ['--nexus-bg-primary', '--nexus-bg-secondary', '--primary-500', '--orange-500', '--blue-500', '--green-500'];
      cssProps.forEach(prop => {
        report.cssVariables[prop] = rootStyles.getPropertyValue(prop);
      });
      
      // Check quick action cards
      const cards = document.querySelectorAll('.nexus-quick-action-card');
      cards.forEach((card, index) => {
        const style = window.getComputedStyle(card);
        report.quickActionCards.push({
          index: index + 1,
          hasGradientBG: style.background.includes('gradient') || style.backgroundImage.includes('gradient'),
          background: style.background.substring(0, 200),
          border: style.border,
          transform: style.transform
        });
      });
      
      // Check statistics container
      const statsGrid = document.getElementById('statsGrid');
      if (statsGrid) {
        const style = window.getComputedStyle(statsGrid);
        report.statisticsContainer = {
          background: style.background.substring(0, 200),
          backgroundColor: style.backgroundColor,
          border: style.border
        };
      }
      
      return report;
    });
    
    console.log('\n📊 INSPECTION REPORT:');
    console.log('='.repeat(50));
    console.log('HTML Theme Attribute:', inspectionReport.htmlThemeAttribute);
    console.log('HTML Classes:', inspectionReport.htmlClasses);
    console.log('CSS Variables:', inspectionReport.cssVariables);
    console.log('Quick Action Cards:', inspectionReport.quickActionCards);
    console.log('Statistics Container:', inspectionReport.statisticsContainer);
    console.log('='.repeat(50));
    
    console.log('✅ Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    
    // Take error screenshot
    await page.screenshot({ 
      path: 'dashboard-error.png',
      fullPage: true 
    });
    console.log('📸 Error screenshot saved: dashboard-error.png');
  }
  
  // Keep browser open for manual inspection
  console.log('🔍 Browser will stay open for 30 seconds for manual inspection...');
  await page.waitForTimeout(30000);
  
  await browser.close();
  console.log('🏁 Test completed and browser closed.');
})();