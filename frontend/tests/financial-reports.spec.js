import { test, expect } from '@playwright/test';

test.describe('財務報表頁面深色主題和圖表測試', () => {
  let page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    
    // 設置視窗大小
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    // 登入系統
    console.log('開始登入流程...');
    await page.goto('http://127.0.0.1:8000/login');
    await page.waitForLoadState('networkidle');
    
    // 填入登入資訊
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // 等待登入完成
    await page.waitForURL('**/dashboard**');
    console.log('登入成功');
  });

  test.afterAll(async () => {
    await page.close();
  });

  // 測試利潤損益表頁面
  test('利潤損益表頁面深色主題和圖表測試', async () => {
    console.log('測試利潤損益表頁面...');
    await page.goto('http://127.0.0.1:8000/reports/financial/profit-loss');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // 等待圖表載入

    // 檢查深色主題
    const bodyBg = await page.evaluate(() => {
      const body = document.body;
      return window.getComputedStyle(body).backgroundColor;
    });
    console.log('Body背景色:', bodyBg);

    // 檢查卡片背景
    const cardBg = await page.evaluate(() => {
      const cards = document.querySelectorAll('.card, .card-body, .content-wrapper');
      if (cards.length > 0) {
        return window.getComputedStyle(cards[0]).backgroundColor;
      }
      return null;
    });
    console.log('卡片背景色:', cardBg);

    // 檢查文字顏色
    const textColor = await page.evaluate(() => {
      const texts = document.querySelectorAll('h1, h2, h3, p, span, td, th');
      if (texts.length > 0) {
        return window.getComputedStyle(texts[0]).color;
      }
      return null;
    });
    console.log('文字顏色:', textColor);

    // 檢查圖表是否載入
    const chartExists = await page.evaluate(() => {
      const canvas = document.querySelector('canvas[id*="chart"], canvas[id*="Chart"]');
      return canvas !== null;
    });
    console.log('圖表是否存在:', chartExists);

    // 檢查是否還有載入中文字
    const loadingText = await page.textContent('body');
    const hasLoadingText = loadingText.includes('圖表載入中') || loadingText.includes('載入中');
    console.log('是否有載入中文字:', hasLoadingText);

    // 截圖
    await page.screenshot({ 
      path: 'test-results/profit-loss-report.png', 
      fullPage: true 
    });

    // 驗證深色主題
    expect(bodyBg).not.toBe('rgb(255, 255, 255)'); // 不應該是白色
    expect(chartExists).toBe(true);
    expect(hasLoadingText).toBe(false);
  });

  // 測試應收帳款報表頁面
  test('應收帳款報表頁面深色主題和圖表測試', async () => {
    console.log('測試應收帳款報表頁面...');
    await page.goto('http://127.0.0.1:8000/reports/financial/accounts-receivable');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // 等待圖表載入

    // 檢查深色主題
    const bodyBg = await page.evaluate(() => {
      const body = document.body;
      return window.getComputedStyle(body).backgroundColor;
    });
    console.log('應收帳款 - Body背景色:', bodyBg);

    // 檢查卡片背景
    const cardBg = await page.evaluate(() => {
      const cards = document.querySelectorAll('.card, .card-body, .content-wrapper');
      if (cards.length > 0) {
        return window.getComputedStyle(cards[0]).backgroundColor;
      }
      return null;
    });
    console.log('應收帳款 - 卡片背景色:', cardBg);

    // 檢查圖表是否載入
    const chartExists = await page.evaluate(() => {
      const canvas = document.querySelector('canvas[id*="chart"], canvas[id*="Chart"]');
      return canvas !== null;
    });
    console.log('應收帳款 - 圖表是否存在:', chartExists);

    // 檢查是否還有載入中文字
    const loadingText = await page.textContent('body');
    const hasLoadingText = loadingText.includes('圖表載入中') || loadingText.includes('載入中');
    console.log('應收帳款 - 是否有載入中文字:', hasLoadingText);

    // 截圖
    await page.screenshot({ 
      path: 'test-results/accounts-receivable-report.png', 
      fullPage: true 
    });

    // 驗證深色主題
    expect(bodyBg).not.toBe('rgb(255, 255, 255)'); // 不應該是白色
    expect(chartExists).toBe(true);
    expect(hasLoadingText).toBe(false);
  });

  // 測試應付帳款報表頁面
  test('應付帳款報表頁面深色主題和圖表測試', async () => {
    console.log('測試應付帳款報表頁面...');
    await page.goto('http://127.0.0.1:8000/reports/financial/accounts-payable');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // 等待圖表載入

    // 檢查深色主題
    const bodyBg = await page.evaluate(() => {
      const body = document.body;
      return window.getComputedStyle(body).backgroundColor;
    });
    console.log('應付帳款 - Body背景色:', bodyBg);

    // 檢查卡片背景
    const cardBg = await page.evaluate(() => {
      const cards = document.querySelectorAll('.card, .card-body, .content-wrapper');
      if (cards.length > 0) {
        return window.getComputedStyle(cards[0]).backgroundColor;
      }
      return null;
    });
    console.log('應付帳款 - 卡片背景色:', cardBg);

    // 檢查圖表是否載入
    const chartExists = await page.evaluate(() => {
      const canvas = document.querySelector('canvas[id*="chart"], canvas[id*="Chart"]');
      return canvas !== null;
    });
    console.log('應付帳款 - 圖表是否存在:', chartExists);

    // 檢查是否還有載入中文字
    const loadingText = await page.textContent('body');
    const hasLoadingText = loadingText.includes('圖表載入中') || loadingText.includes('載入中');
    console.log('應付帳款 - 是否有載入中文字:', hasLoadingText);

    // 截圖
    await page.screenshot({ 
      path: 'test-results/accounts-payable-report.png', 
      fullPage: true 
    });

    // 驗證深色主題
    expect(bodyBg).not.toBe('rgb(255, 255, 255)'); // 不應該是白色
    expect(chartExists).toBe(true);
    expect(hasLoadingText).toBe(false);
  });

  // 額外測試：檢查圖表具體內容
  test('圖表內容詳細檢查', async () => {
    console.log('詳細檢查圖表載入狀況...');
    
    const reportPages = [
      { url: 'http://127.0.0.1:8000/reports/financial/profit-loss', name: '利潤損益表' },
      { url: 'http://127.0.0.1:8000/reports/financial/accounts-receivable', name: '應收帳款' },
      { url: 'http://127.0.0.1:8000/reports/financial/accounts-payable', name: '應付帳款' }
    ];

    for (const reportPage of reportPages) {
      await page.goto(reportPage.url);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(5000); // 給圖表更多載入時間

      // 檢查Chart.js是否載入
      const chartJsLoaded = await page.evaluate(() => {
        return typeof Chart !== 'undefined';
      });

      // 檢查圖表實例是否存在
      const chartInstances = await page.evaluate(() => {
        if (typeof Chart !== 'undefined' && Chart.instances) {
          return Object.keys(Chart.instances).length;
        }
        return 0;
      });

      // 檢查canvas元素
      const canvasCount = await page.locator('canvas').count();

      console.log(`${reportPage.name} - Chart.js載入:`, chartJsLoaded);
      console.log(`${reportPage.name} - 圖表實例數:`, chartInstances);
      console.log(`${reportPage.name} - Canvas元素數:`, canvasCount);
    }
  });
});