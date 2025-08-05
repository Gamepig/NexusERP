import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('🔑 Logging in to access dashboard...');
  await page.goto('http://127.0.0.1:8000/login');
  
  // Login with test credentials
  await page.fill('input[type="email"]', 'test@example.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  
  // Wait for dashboard to load
  await page.waitForLoadState('networkidle');
  
  console.log('📍 Current URL:', page.url());
  
  if (page.url().includes('dashboard')) {
    console.log('✅ Successfully logged in to dashboard!');
    
    // Detailed navigation analysis
    console.log('\n🔍 Detailed Navigation Analysis:');
    const detailedNavInfo = await page.evaluate(() => {
      const navs = document.querySelectorAll('nav');
      const navDetails = Array.from(navs).map((nav, index) => ({
        index: index + 1,
        tag: nav.tagName,
        classes: nav.className,
        id: nav.id,
        xData: nav.getAttribute('x-data'),
        innerHTML: nav.innerHTML
      }));
      
      return { navs: navDetails };
    });
    
    console.log(`Found ${detailedNavInfo.navs.length} navigation elements:`);
    detailedNavInfo.navs.forEach(nav => {
      console.log(`\n--- Navigation ${nav.index} ---`);
      console.log('Classes:', nav.classes);
      console.log('ID:', nav.id);
      console.log('x-data:', nav.xData);
      console.log('HTML preview:', nav.innerHTML.substring(0, 500) + '...');
    });
    
    // Check for user dropdown functionality
    console.log('\n👤 User Dropdown Functionality Check:');
    const userDropdownInfo = await page.evaluate(() => {
      // Look for user avatar/trigger
      const userAvatar = document.querySelector('#user-menu-trigger, .nexus-user-trigger, [data-user-menu], .user-avatar');
      const avatarByText = Array.from(document.querySelectorAll('button')).find(btn => 
        btn.textContent.trim() === 'T' || btn.innerHTML.includes('avatar')
      );
      
      // Look for dropdown menu
      const dropdownMenu = document.querySelector('#user-dropdown-menu, .nexus-user-dropdown, [role="menu"]');
      
      // Check if there's an Alpine.js component for user menu
      const alpineUserMenu = document.querySelector('[x-data*="userMenu"], [x-data*="dropdown"], [x-data*="user"]');
      
      return {
        userAvatar: userAvatar ? {
          tag: userAvatar.tagName,
          classes: userAvatar.className,
          id: userAvatar.id,
          text: userAvatar.textContent.trim(),
          hasClickHandler: !!userAvatar.getAttribute('@click') || !!userAvatar.getAttribute('x-on:click'),
          xData: userAvatar.getAttribute('x-data')
        } : null,
        avatarByText: avatarByText ? {
          tag: avatarByText.tagName,
          classes: avatarByText.className,
          id: avatarByText.id,
          text: avatarByText.textContent.trim(),
          hasClickHandler: !!avatarByText.getAttribute('@click') || !!avatarByText.getAttribute('x-on:click')
        } : null,
        dropdownMenu: dropdownMenu ? {
          tag: dropdownMenu.tagName,
          classes: dropdownMenu.className,
          id: dropdownMenu.id,
          visible: window.getComputedStyle(dropdownMenu).display !== 'none',
          innerHTML: dropdownMenu.innerHTML.substring(0, 300)
        } : null,
        alpineUserMenu: alpineUserMenu ? {
          tag: alpineUserMenu.tagName,
          classes: alpineUserMenu.className,
          id: alpineUserMenu.id,
          xData: alpineUserMenu.getAttribute('x-data')
        } : null
      };
    });
    
    console.log('User dropdown info:', userDropdownInfo);
    
    // Try to find and click the user avatar
    console.log('\n🎯 Testing User Avatar Interaction:');
    try {
      // Look for the purple avatar with "T"
      const userAvatarSelector = '.justify-end button, .user-avatar, [data-user-menu]';
      const userAvatar = page.locator(userAvatarSelector).first();
      
      if (await userAvatar.count() > 0) {
        console.log('Found user avatar, attempting click...');
        
        // Take screenshot before click
        await page.screenshot({ path: '/Users/gamepig/projects/NexusERP/frontend/before_click.png' });
        
        await userAvatar.click();
        await page.waitForTimeout(1000); // Wait for dropdown animation
        
        // Take screenshot after click
        await page.screenshot({ path: '/Users/gamepig/projects/NexusERP/frontend/after_click.png' });
        
        // Check if dropdown appeared
        const dropdownState = await page.evaluate(() => {
          const dropdown = document.querySelector('#user-dropdown-menu, .nexus-user-dropdown, [role="menu"]');
          const visibleDropdowns = Array.from(document.querySelectorAll('[x-show], .dropdown-menu')).filter(el => 
            window.getComputedStyle(el).display !== 'none' && 
            window.getComputedStyle(el).visibility !== 'hidden' &&
            window.getComputedStyle(el).opacity !== '0'
          );
          
          return {
            dropdownExists: !!dropdown,
            dropdownVisible: dropdown ? window.getComputedStyle(dropdown).display !== 'none' : false,
            visibleDropdowns: visibleDropdowns.length,
            allVisibleElements: visibleDropdowns.map(el => ({
              tag: el.tagName,
              classes: el.className,
              id: el.id
            }))
          };
        });
        
        console.log('Dropdown state after click:', dropdownState);
        
        if (dropdownState.visibleDropdowns === 0) {
          console.log('⚠️ No dropdown appeared after clicking user avatar');
          console.log('🔍 This confirms the issue: dropdown functionality is missing or broken');
        } else {
          console.log('✅ Dropdown appeared successfully!');
        }
        
      } else {
        console.log('❌ No user avatar found to click');
      }
      
    } catch (error) {
      console.log('❌ Error during avatar interaction:', error.message);
    }
    
  } else {
    console.log('❌ Login failed or not redirected to dashboard');
  }
  
  await browser.close();
})();