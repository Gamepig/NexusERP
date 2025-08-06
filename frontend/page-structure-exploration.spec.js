import { test, expect } from '@playwright/test';

test.describe('Page Structure Exploration', () => {

  test('Explore page structure after login', async ({ page }) => {
    console.log('🔍 Starting page structure exploration...');
    
    // Navigate to homepage
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    
    // Take initial screenshot
    await page.screenshot({ 
      path: 'page-exploration-01-initial.png',
      fullPage: true 
    });
    
    // Check if we need to login
    const isLoginPage = await page.locator('input[type="email"]').isVisible();
    
    if (isLoginPage) {
      console.log('🔐 Login required, filling credentials...');
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      await page.waitForLoadState('networkidle', { timeout: 10000 });
      
      await page.screenshot({ 
        path: 'page-exploration-02-after-login.png',
        fullPage: true 
      });
    }
    
    // Wait a bit for any animations
    await page.waitForTimeout(3000);
    
    // Explore page structure
    console.log('\n📋 Analyzing page structure...');
    
    // Check various common selectors
    const selectors = [
      'main',
      '.main',
      '.main-content',
      '.content',
      '.dashboard',
      '.container',
      '.app',
      'body > div',
      '[id*="app"]',
      '[class*="app"]',
      '[class*="main"]',
      '[class*="content"]',
      '[class*="dashboard"]'
    ];
    
    for (const selector of selectors) {
      const elements = await page.locator(selector);
      const count = await elements.count();
      if (count > 0) {
        console.log(`✅ Found ${count} elements matching: ${selector}`);
      }
    }
    
    // Find all elements with card-like classes
    console.log('\n🃏 Looking for card-like elements...');
    const cardSelectors = [
      '.card',
      '[class*="card"]',
      '.bg-white',
      '.shadow',
      '.rounded',
      '[class*="bg-"]',
      '[class*="shadow"]',
      '[class*="rounded"]'
    ];
    
    const cardInfo = [];
    for (const selector of cardSelectors) {
      const elements = await page.locator(selector);
      const count = await elements.count();
      if (count > 0) {
        console.log(`📇 Found ${count} elements matching: ${selector}`);
        
        // Get more details for the first few elements
        for (let i = 0; i < Math.min(count, 3); i++) {
          const element = elements.nth(i);
          const box = await element.boundingBox();
          const classes = await element.getAttribute('class');
          const text = (await element.textContent() || '').trim().substring(0, 100);
          
          if (box && box.height > 30) {
            cardInfo.push({
              selector,
              index: i,
              height: Math.round(box.height),
              width: Math.round(box.width),
              classes,
              text: text.replace(/\n/g, ' ')
            });
          }
        }
      }
    }
    
    // Display detailed card information
    console.log('\n📊 Detailed Card Information:');
    console.log('='.repeat(80));
    cardInfo.forEach((card, i) => {
      console.log(`${i + 1}. Selector: ${card.selector}[${card.index}]`);
      console.log(`   Size: ${card.width}x${card.height}px`);
      console.log(`   Classes: ${card.classes}`);
      console.log(`   Text: "${card.text}"`);
      console.log('   ' + '-'.repeat(70));
    });
    
    // Take final screenshot with all explored
    await page.screenshot({ 
      path: 'page-exploration-03-final-structure.png',
      fullPage: true 
    });
    
    // Get body HTML to analyze structure
    const bodyHTML = await page.locator('body').innerHTML();
    console.log('\n🔍 Page Structure Analysis Complete');
    console.log(`📄 Total body HTML length: ${bodyHTML.length} characters`);
    
    // Look for specific dashboard elements
    const dashboardElements = await page.locator('*').evaluateAll(elements => {
      return elements
        .filter(el => {
          const classes = el.className || '';
          const id = el.id || '';
          return classes.includes('dashboard') || 
                 classes.includes('card') || 
                 classes.includes('chart') || 
                 classes.includes('stat') ||
                 id.includes('dashboard') ||
                 id.includes('chart');
        })
        .map(el => ({
          tagName: el.tagName,
          className: el.className,
          id: el.id,
          textContent: (el.textContent || '').substring(0, 50)
        }));
    });
    
    console.log('\n🎯 Dashboard-specific elements found:');
    dashboardElements.forEach((el, i) => {
      console.log(`${i + 1}. <${el.tagName.toLowerCase()}> class="${el.className}" id="${el.id}"`);
      console.log(`   Text: "${el.textContent}"`);
    });
    
    expect(cardInfo.length).toBeGreaterThan(0, 'Should find at least some card-like elements');
  });

});