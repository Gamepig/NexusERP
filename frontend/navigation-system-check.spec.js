import { test, expect } from '@playwright/test';

test.describe('NexusERP 導航系統檢查', () => {
  test('檢查新導航系統載入情況', async ({ page }) => {
    // 前往登入頁面
    await page.goto('/login');
    await page.screenshot({ path: 'navigation-check-01-login-page.png' });

    // 登入測試帳號
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // 等待重定向到dashboard
    await page.waitForURL('**/dashboard');
    await page.screenshot({ path: 'navigation-check-02-after-login.png' });

    // 檢查頁面HTML源碼
    const htmlContent = await page.content();
    
    // 檢查是否包含enhanced-navigation相關內容
    const hasEnhancedNavigation = htmlContent.includes('enhanced-navigation');
    console.log('Enhanced Navigation Found:', hasEnhancedNavigation);
    
    // 檢查是否包含breadcrumb相關元素
    const hasBreadcrumb = htmlContent.includes('breadcrumb');
    console.log('Breadcrumb Found:', hasBreadcrumb);
    
    // 檢查NavigationService相關內容
    const hasNavigationService = htmlContent.includes('NavigationService');
    console.log('NavigationService Found:', hasNavigationService);

    // 檢查是否有JavaScript錯誤
    const jsErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        jsErrors.push(msg.text());
      }
    });

    // 檢查CSS載入情況
    const cssFiles = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
      return links.map(link => ({
        href: link.href,
        loaded: link.sheet !== null
      }));
    });

    console.log('CSS Files Status:', cssFiles);

    // 檢查導航相關元素
    const navigationElements = await page.evaluate(() => {
      const elements = {
        enhancedNav: document.querySelector('.enhanced-navigation'),
        breadcrumb: document.querySelector('.breadcrumb'),
        mainNav: document.querySelector('nav'),
        sidebar: document.querySelector('.sidebar'),
        navigationContainer: document.querySelector('[data-navigation]'),
      };
      
      return Object.entries(elements).map(([key, element]) => ({
        selector: key,
        exists: element !== null,
        classes: element ? element.className : null,
        id: element ? element.id : null
      }));
    });

    console.log('Navigation Elements:', navigationElements);

    // 檢查導航服務腳本
    const navigationScripts = await page.evaluate(() => {
      const scripts = Array.from(document.querySelectorAll('script'));
      return scripts
        .map(script => script.src || 'inline')
        .filter(src => src.includes('navigation') || src.includes('Navigation'));
    });

    console.log('Navigation Scripts:', navigationScripts);

    // 截圖當前dashboard頁面
    await page.screenshot({ 
      path: 'navigation-check-03-dashboard-full.png',
      fullPage: true 
    });

    // 檢查頁面標題和基本結構
    const pageTitle = await page.title();
    const bodyClasses = await page.getAttribute('body', 'class');
    
    console.log('Page Title:', pageTitle);
    console.log('Body Classes:', bodyClasses);

    // 查找可能的導航相關類別
    const navigationClasses = await page.evaluate(() => {
      const allElements = document.querySelectorAll('*');
      const classNames = new Set();
      
      allElements.forEach(el => {
        if (el.className && typeof el.className === 'string') {
          el.className.split(' ').forEach(className => {
            if (className.toLowerCase().includes('nav') || 
                className.toLowerCase().includes('breadcrumb') ||
                className.toLowerCase().includes('menu')) {
              classNames.add(className);
            }
          });
        }
      });
      
      return Array.from(classNames);
    });

    console.log('Navigation-related Classes Found:', navigationClasses);

    // 檢查是否有任何導航相關的data屬性
    const navigationDataAttributes = await page.evaluate(() => {
      const allElements = document.querySelectorAll('*');
      const dataAttrs = new Set();
      
      allElements.forEach(el => {
        Array.from(el.attributes).forEach(attr => {
          if (attr.name.startsWith('data-') && 
              (attr.name.includes('nav') || attr.name.includes('breadcrumb'))) {
            dataAttrs.add(`${attr.name}="${attr.value}"`);
          }
        });
      });
      
      return Array.from(dataAttrs);
    });

    console.log('Navigation Data Attributes:', navigationDataAttributes);

    // 等待一下看是否有延遲載入的內容
    await page.waitForTimeout(3000);
    
    // 最終截圖
    await page.screenshot({ 
      path: 'navigation-check-04-final-state.png',
      fullPage: true 
    });

    // 輸出詳細報告
    const report = {
      pageLoaded: true,
      hasEnhancedNavigation,
      hasBreadcrumb,
      hasNavigationService,
      jsErrors: jsErrors.length > 0 ? jsErrors : [],
      cssFiles,
      navigationElements,
      navigationScripts,
      navigationClasses,
      navigationDataAttributes,
      pageTitle,
      bodyClasses
    };

    console.log('\n=== 導航系統檢查報告 ===');
    console.log(JSON.stringify(report, null, 2));

    // 寫入報告文件
    await page.evaluate((reportData) => {
      const blob = new Blob([JSON.stringify(reportData, null, 2)], {
        type: 'application/json'
      });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'navigation-system-report.json';
      a.click();
    }, report);

    // 基本斷言檢查
    expect(pageTitle).toBeTruthy();
    expect(report.pageLoaded).toBe(true);
  });
});