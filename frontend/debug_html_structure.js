import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('🌐 Navigating to dashboard...');
  await page.goto('http://127.0.0.1:8000/dashboard');
  
  // Wait for page load
  await page.waitForLoadState('networkidle');
  
  console.log('📋 Page title:', await page.title());
  
  // Get full HTML structure
  console.log('\n🏗️ Full HTML Body Structure:');
  const bodyHTML = await page.evaluate(() => {
    return document.body.innerHTML;
  });
  
  console.log('Body HTML length:', bodyHTML.length);
  console.log('First 2000 characters:');
  console.log(bodyHTML.substring(0, 2000));
  
  // Check specifically for layout components
  console.log('\n🔍 Looking for Layout Components:');
  const layoutAnalysis = await page.evaluate(() => {
    const body = document.body;
    const children = Array.from(body.children);
    
    return children.map(child => ({
      tag: child.tagName,
      classes: child.className,
      id: child.id,
      hasNavigation: child.querySelector('nav') !== null,
      hasHeader: child.querySelector('header') !== null,
      hasMain: child.querySelector('main') !== null,
      innerHTML: child.innerHTML.substring(0, 200) + '...'
    }));
  });
  
  console.log('Body children:', layoutAnalysis);
  
  // Check what Laravel Blade template is being used
  console.log('\n📄 Laravel Template Analysis:');
  const templateInfo = await page.evaluate(() => {
    // Look for Laravel Blade comments or indicators
    const html = document.documentElement.outerHTML;
    
    return {
      hasAppLayout: html.includes('app.blade.php') || html.includes('app-layout'),
      hasNavigation: html.includes('navigation.blade.php') || html.includes('navigation'),
      hasEnhancedNav: html.includes('enhanced-navigation'),
      hasDashboardLayout: html.includes('dashboard') || html.includes('authenticated'),
      hasAlpineJs: html.includes('Alpine') || html.includes('x-data'),
      hasTailwind: html.includes('tailwind') || html.includes('tw-')
    };
  });
  
  console.log('Template indicators:', templateInfo);
  
  // Check head section for included files
  console.log('\n📚 Head Section Analysis:');
  const headInfo = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
    const scripts = Array.from(document.querySelectorAll('script[src]'));
    
    return {
      stylesheets: links.map(link => link.href),
      scripts: scripts.map(script => script.src),
      hasVite: document.querySelector('script[type="module"]') !== null
    };
  });
  
  console.log('Head resources:', headInfo);
  
  await browser.close();
})();