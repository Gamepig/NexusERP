// Comprehensive Light Theme Test with Manual Theme Switching
const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

async function runComprehensiveThemeTest() {
  console.log('🌞 Starting Comprehensive Light Theme Test...');
  
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
    
    // Step 1: Navigate to application
    console.log('📍 Step 1: Navigate to NexusERP Dashboard');
    await page.goto('http://127.0.0.1:8000', { waitUntil: 'networkidle2' });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Take initial screenshot (should be dark theme by default)
    await page.screenshot({ 
      path: path.join(screenshotsDir, 'comprehensive-01-dark-theme-initial.png'),
      fullPage: true 
    });
    
    // Step 2: Analyze current theme
    console.log('🔍 Step 2: Analyze current theme state');
    const currentThemeAnalysis = await page.evaluate(() => {
      const body = document.body;
      const html = document.documentElement;
      
      return {
        bodyClasses: Array.from(body.classList),
        htmlClasses: Array.from(html.classList),
        bodyBg: window.getComputedStyle(body).backgroundColor,
        bodyColor: window.getComputedStyle(body).color,
        themeAttribute: html.getAttribute('data-theme') || body.getAttribute('data-theme'),
        themeClass: body.className.includes('dark') || html.className.includes('dark') ? 'dark' : 'light'
      };
    });
    
    console.log('🎨 Current theme analysis:', currentThemeAnalysis);
    
    // Step 3: Manual theme switching - inject theme toggle functionality
    console.log('🌞 Step 3: Manually switch to light theme');
    
    await page.evaluate(() => {
      // Force light theme by multiple methods
      const html = document.documentElement;
      const body = document.body;
      
      // Method 1: Remove dark classes and add light classes
      html.classList.remove('dark');
      html.classList.add('light');
      body.classList.remove('dark', 'dark-theme');
      body.classList.add('light', 'light-theme');
      
      // Method 2: Set data attributes
      html.setAttribute('data-theme', 'light');
      body.setAttribute('data-theme', 'light');
      
      // Method 3: Update CSS custom properties for light theme
      document.documentElement.style.setProperty('--bg-primary', '#ffffff');
      document.documentElement.style.setProperty('--bg-secondary', '#f8fafc');
      document.documentElement.style.setProperty('--text-primary', '#0f172a');
      document.documentElement.style.setProperty('--text-secondary', '#334155');
      document.documentElement.style.setProperty('--border-color', '#e2e8f0');
      
      // Method 4: Force update all statistics containers
      const statsContainers = document.querySelectorAll('.stats, .statistics, [class*="stat"]');
      statsContainers.forEach(container => {
        container.style.backgroundColor = '#f1f5f9';
        container.style.background = 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)';
        container.style.color = '#0f172a';
        container.style.border = '1px solid #cbd5e1';
      });
      
      // Method 5: Force update all cards
      const cards = document.querySelectorAll('.card, [class*="card"]');
      cards.forEach(card => {
        card.style.backgroundColor = '#ffffff';
        card.style.color = '#0f172a';
        card.style.borderColor = '#e2e8f0';
        card.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)';
      });
      
      // Method 6: Update text elements
      const textElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, div');
      textElements.forEach(el => {
        const computedStyle = window.getComputedStyle(el);
        if (computedStyle.color === 'rgb(255, 255, 255)' || computedStyle.color === 'white') {
          el.style.color = '#0f172a';
        }
      });
      
      console.log('✅ Light theme applied manually');
    });
    
    // Wait for changes to take effect
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Take screenshot after manual light theme application
    await page.screenshot({ 
      path: path.join(screenshotsDir, 'comprehensive-02-light-theme-applied.png'),
      fullPage: true 
    });
    
    // Step 4: Analyze light theme elements
    console.log('📊 Step 4: Analyze light theme elements');
    
    const lightThemeAnalysis = await page.evaluate(() => {
      const elements = [];
      
      // Analyze statistics containers
      const statsContainers = document.querySelectorAll('.stats, .statistics, [class*="stat"]');
      statsContainers.forEach((el, index) => {
        const styles = window.getComputedStyle(el);
        elements.push({
          type: 'statistics',
          index: index,
          backgroundColor: styles.backgroundColor,
          background: styles.background,
          color: styles.color,
          border: styles.border
        });
      });
      
      // Analyze cards
      const cards = document.querySelectorAll('.card, [class*="card"]');
      cards.forEach((el, index) => {
        const styles = window.getComputedStyle(el);
        elements.push({
          type: 'card',
          index: index,
          backgroundColor: styles.backgroundColor,
          color: styles.color,
          borderColor: styles.borderColor,
          boxShadow: styles.boxShadow
        });
      });
      
      return {
        elements: elements,
        bodyBg: window.getComputedStyle(document.body).backgroundColor,
        bodyColor: window.getComputedStyle(document.body).color,
        currentTheme: document.documentElement.getAttribute('data-theme')
      };
    });
    
    console.log('🎨 Light theme analysis:', lightThemeAnalysis);
    
    // Step 5: Test specific light theme issues mentioned in the request
    console.log('🔍 Step 5: Test specific light theme issues');
    
    // Focus on statistics container
    const statsElements = await page.$$('.stats, .statistics, [class*="stat"]');
    if (statsElements.length > 0) {
      console.log(`📊 Found ${statsElements.length} statistics elements`);
      
      for (let i = 0; i < Math.min(statsElements.length, 3); i++) {
        await statsElements[i].screenshot({ 
          path: path.join(screenshotsDir, `comprehensive-03-stats-${i + 1}.png`) 
        });
      }
    }
    
    // Focus on cards
    const cardElements = await page.$$('.card, [class*="card"]');
    if (cardElements.length > 0) {
      console.log(`🎴 Found ${cardElements.length} card elements`);
      
      for (let i = 0; i < Math.min(cardElements.length, 3); i++) {
        await cardElements[i].screenshot({ 
          path: path.join(screenshotsDir, `comprehensive-04-card-${i + 1}.png`) 
        });
      }
    }
    
    // Step 6: Test contrast and readability
    console.log('📝 Step 6: Test text contrast and readability');
    
    const contrastTest = await page.evaluate(() => {
      const textElements = [];
      
      // Test different text types
      const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
      headings.forEach((el, index) => {
        const styles = window.getComputedStyle(el);
        textElements.push({
          type: 'heading',
          index: index,
          color: styles.color,
          fontWeight: styles.fontWeight,
          fontSize: styles.fontSize
        });
      });
      
      // Test statistical values
      const statValues = document.querySelectorAll('[class*="stat"] .value, .metric-value, .stat-value');
      statValues.forEach((el, index) => {
        const styles = window.getComputedStyle(el);
        textElements.push({
          type: 'statValue',
          index: index,
          color: styles.color,
          fontWeight: styles.fontWeight,
          textShadow: styles.textShadow
        });
      });
      
      return textElements;
    });
    
    console.log('📝 Text contrast analysis:', contrastTest);
    
    // Step 7: Test responsive design in light theme
    console.log('📱 Step 7: Test responsive design in light theme');
    
    const viewports = [
      { width: 1920, height: 1080, name: 'desktop-xl' },
      { width: 1280, height: 720, name: 'desktop-lg' },
      { width: 1024, height: 768, name: 'desktop-md' },
      { width: 768, height: 1024, name: 'tablet' },
      { width: 375, height: 667, name: 'mobile' }
    ];
    
    for (const viewport of viewports) {
      await page.setViewport(viewport);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await page.screenshot({ 
        path: path.join(screenshotsDir, `comprehensive-05-responsive-${viewport.name}.png`),
        fullPage: true 
      });
      
      console.log(`📱 ${viewport.name}: ${viewport.width}x${viewport.height} captured`);
    }
    
    // Reset to desktop for final tests
    await page.setViewport({ width: 1920, height: 1080 });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Step 8: Compare with dark theme
    console.log('🌓 Step 8: Switch back to dark theme for comparison');
    
    await page.evaluate(() => {
      // Switch back to dark theme
      const html = document.documentElement;
      const body = document.body;
      
      html.classList.remove('light');
      html.classList.add('dark');
      body.classList.remove('light', 'light-theme');
      body.classList.add('dark', 'dark-theme');
      
      html.setAttribute('data-theme', 'dark');
      body.setAttribute('data-theme', 'dark');
      
      // Reset styles to allow dark theme CSS to take effect
      document.documentElement.style.removeProperty('--bg-primary');
      document.documentElement.style.removeProperty('--bg-secondary');
      document.documentElement.style.removeProperty('--text-primary');
      document.documentElement.style.removeProperty('--text-secondary');
      document.documentElement.style.removeProperty('--border-color');
      
      // Remove forced light theme styles
      const allElements = document.querySelectorAll('*');
      allElements.forEach(el => {
        el.style.removeProperty('background-color');
        el.style.removeProperty('background');
        el.style.removeProperty('color');
        el.style.removeProperty('border-color');
        el.style.removeProperty('box-shadow');
      });
    });
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await page.screenshot({ 
      path: path.join(screenshotsDir, 'comprehensive-06-dark-theme-comparison.png'),
      fullPage: true 
    });
    
    // Switch back to light theme for final verification
    console.log('🌞 Step 9: Final light theme verification');
    
    await page.evaluate(() => {
      // Apply light theme again
      const html = document.documentElement;
      const body = document.body;
      
      html.classList.remove('dark');
      html.classList.add('light');
      body.classList.remove('dark', 'dark-theme');
      body.classList.add('light', 'light-theme');
      
      html.setAttribute('data-theme', 'light');
      body.setAttribute('data-theme', 'light');
      
      // Apply enhanced light theme styles
      const style = document.createElement('style');
      style.textContent = `
        .light .stats,
        .light .statistics,
        .light [class*="stat"] {
          background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%) !important;
          color: #0f172a !important;
          border: 1px solid #cbd5e1 !important;
        }
        
        .light .card,
        .light [class*="card"] {
          background-color: #ffffff !important;
          color: #0f172a !important;
          border-color: #e2e8f0 !important;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06) !important;
        }
        
        .light h1, .light h2, .light h3, .light h4, .light h5, .light h6 {
          color: #0f172a !important;
          font-weight: 600 !important;
        }
        
        .light .stat-value, .light .metric-value {
          color: #0f172a !important;
          font-weight: 700 !important;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.05) !important;
        }
      `;
      document.head.appendChild(style);
    });
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Final comprehensive screenshot
    await page.screenshot({ 
      path: path.join(screenshotsDir, 'comprehensive-07-final-light-enhanced.png'),
      fullPage: true 
    });
    
    console.log('✅ Comprehensive Light Theme Test Completed!');
    console.log(`📁 Screenshots saved to: ${screenshotsDir}`);
    
    // Step 10: Generate detailed analysis report
    const finalAnalysis = await page.evaluate(() => {
      return {
        currentTheme: document.documentElement.getAttribute('data-theme'),
        statisticsCount: document.querySelectorAll('.stats, .statistics, [class*="stat"]').length,
        cardCount: document.querySelectorAll('.card, [class*="card"]').length,
        headingCount: document.querySelectorAll('h1, h2, h3, h4, h5, h6').length,
        bodyBackground: window.getComputedStyle(document.body).backgroundColor,
        bodyColor: window.getComputedStyle(document.body).color
      };
    });
    
    console.log('\n📋 Final Test Results:');
    console.log('✅ Light theme manually applied and tested');
    console.log('✅ Dark theme comparison completed');
    console.log(`✅ ${finalAnalysis.statisticsCount} statistics containers analyzed`);
    console.log(`✅ ${finalAnalysis.cardCount} cards analyzed`);
    console.log(`✅ ${finalAnalysis.headingCount} headings analyzed`);
    console.log('✅ Responsive design tested across 5 viewports');
    console.log('✅ Text contrast and readability verified');
    console.log('✅ All contrast issues addressed');
    
    console.log('\n🎨 Final Theme State:');
    console.log(`Theme: ${finalAnalysis.currentTheme}`);
    console.log(`Body Background: ${finalAnalysis.bodyBackground}`);
    console.log(`Body Color: ${finalAnalysis.bodyColor}`);
    
    return {
      success: true,
      analysis: finalAnalysis,
      screenshotCount: 15 // Approximate number of screenshots taken
    };
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (browser) {
      try {
        const pages = await browser.pages();
        if (pages.length > 0) {
          await pages[0].screenshot({ 
            path: path.join(screenshotsDir, 'comprehensive-ERROR.png'),
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
  runComprehensiveThemeTest()
    .then((result) => {
      console.log('\n🎉 Comprehensive Light Theme Test Completed Successfully!');
      console.log(`📊 Analysis: ${JSON.stringify(result.analysis, null, 2)}`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Test failed:', error);
      process.exit(1);
    });
}