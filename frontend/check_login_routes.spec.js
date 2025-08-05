import { test, expect } from '@playwright/test';

test('檢查登入相關路由', async ({ page }) => {
  const routes = [
    'http://127.0.0.1:8000',
    'http://127.0.0.1:8000/login',
    'http://127.0.0.1:8000/auth/login',
    'http://127.0.0.1:8000/reports' // 直接測試是否需要登入
  ];
  
  for (const route of routes) {
    console.log(`\n=== 檢查路由: ${route} ===`);
    
    try {
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      
      const title = await page.title();
      const url = page.url();
      const hasLoginForm = await page.locator('input[type="password"]').count() > 0;
      
      console.log(`標題: ${title}`);
      console.log(`實際 URL: ${url}`);
      console.log(`包含登入表單: ${hasLoginForm}`);
      
      await page.screenshot({ path: `screenshots/route-check-${route.replace(/[^a-zA-Z0-9]/g, '_')}.png` });
      
      // 檢查是否被重定向到登入頁面
      if (url !== route) {
        console.log(`被重定向到: ${url}`);
      }
      
      // 如果有登入表單，列出表單元素
      if (hasLoginForm) {
        const inputs = await page.locator('input').all();
        console.log('表單元素:');
        for (let i = 0; i < inputs.length; i++) {
          const input = inputs[i];
          const type = await input.getAttribute('type');
          const name = await input.getAttribute('name');
          const id = await input.getAttribute('id');
          const placeholder = await input.getAttribute('placeholder');
          console.log(`  - type="${type}", name="${name}", id="${id}", placeholder="${placeholder}"`);
        }
      }
      
    } catch (error) {
      console.log(`錯誤: ${error.message}`);
    }
  }
});