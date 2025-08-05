import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('🌐 Navigating to dashboard...');
  await page.goto('http://127.0.0.1:8000/dashboard');
  
  // Wait for page load
  await page.waitForLoadState('networkidle');
  
  console.log('📍 Current URL:', page.url());
  console.log('📋 Page title:', await page.title());
  
  // Check if we got redirected
  if (page.url() !== 'http://127.0.0.1:8000/dashboard') {
    console.log('🔄 Page was redirected from dashboard');
  }
  
  // Look for login/auth form elements
  console.log('\n🔐 Authentication Status Check:');
  const authInfo = await page.evaluate(() => {
    const emailInput = document.querySelector('input[type="email"], input[name="email"]');
    const passwordInput = document.querySelector('input[type="password"], input[name="password"]');
    const loginForm = document.querySelector('form');
    const submitButton = document.querySelector('button[type="submit"], input[type="submit"]');
    
    // Look for "Remember me" or login-specific elements
    const rememberMe = document.querySelector('input[name="remember"]');
    const loginButton = Array.from(document.querySelectorAll('button')).find(btn => 
                         btn.textContent.toLowerCase().includes('log in') || 
                         btn.textContent.toLowerCase().includes('sign in') ||
                         btn.textContent.toLowerCase().includes('login')
                       );
    
    return {
      hasEmailInput: !!emailInput,
      hasPasswordInput: !!passwordInput,
      hasLoginForm: !!loginForm,
      hasSubmitButton: !!submitButton,
      hasRememberMe: !!rememberMe,
      hasLoginButton: !!loginButton,
      buttonText: loginButton ? loginButton.textContent.trim() : null,
      pageIsAuthenticationPage: !!(emailInput && passwordInput)
    };
  });
  
  console.log('Auth info:', authInfo);
  
  if (authInfo.pageIsAuthenticationPage) {
    console.log('\n✅ Confirmed: This is an authentication/login page, not the dashboard');
    console.log('🎯 The user needs to log in first to see the dashboard with navigation');
    
    // Check if there are any test credentials or login hints
    const loginHints = await page.evaluate(() => {
      const allText = document.body.textContent;
      const hasGuestLogin = allText.includes('guest') || allText.includes('demo');
      const hasTestAccount = allText.includes('test@') || allText.includes('admin@');
      
      return {
        bodyText: allText.substring(0, 500),
        hasGuestLogin,
        hasTestAccount
      };
    });
    
    console.log('\n💡 Login hints:', loginHints);
    
    // Try to login with the test account mentioned in CLAUDE.md
    console.log('\n🔑 Attempting login with test@example.com...');
    try {
      await page.fill('input[type="email"], input[name="email"]', 'test@example.com');
      await page.fill('input[type="password"], input[name="password"]', 'password123');
      
      // Click login button
      const loginButton = page.locator('button[type="submit"], input[type="submit"], button:has-text("Log in")').first();
      await loginButton.click();
      
      // Wait for navigation
      await page.waitForLoadState('networkidle');
      
      console.log('🎯 After login attempt:');
      console.log('📍 Current URL:', page.url());
      console.log('📋 Page title:', await page.title());
      
      // Now check for navigation elements
      if (page.url().includes('dashboard')) {
        console.log('\n🎉 Successfully logged in! Now checking navigation...');
        
        const navAnalysis = await page.evaluate(() => {
          const navs = document.querySelectorAll('nav');
          const rightSection = document.querySelector('.justify-end');
          const userElements = document.querySelectorAll('[id*="user"], [class*="user"]');
          
          return {
            navigationCount: navs.length,
            hasRightSection: !!rightSection,
            userElementsCount: userElements.length,
            rightSectionHTML: rightSection ? rightSection.innerHTML.substring(0, 500) : null
          };
        });
        
        console.log('📊 Navigation analysis after login:', navAnalysis);
        
        // Take screenshot of logged-in state
        await page.screenshot({ path: '/Users/gamepig/projects/NexusERP/frontend/debug_logged_in_dashboard.png' });
        console.log('📸 Screenshot saved: debug_logged_in_dashboard.png');
      }
      
    } catch (error) {
      console.log('❌ Login failed:', error.message);
    }
  }
  
  await browser.close();
})();