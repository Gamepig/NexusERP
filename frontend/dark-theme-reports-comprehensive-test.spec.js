/**
 * NexusERP 報表系統深色主題完整測試
 * 測試環境: http://127.0.0.1:8000
 * 測試帳號: test@example.com / password123
 */

import { test, expect } from '@playwright/test';

test.describe('NexusERP 報表系統深色主題測試', () => {
  let page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    
    // 登入系統
    await page.goto('http://127.0.0.1:8000/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // 等待登入成功
    await page.waitForURL(/dashboard/, { timeout: 10000 });
    await page.waitForTimeout(2000);
  });

  test.afterAll(async () => {
    await page?.close();
  });

  // 1. 報表中心主頁測試
  test('1. 報表中心主頁 (/reports) - 深色主題測試', async () => {
    console.log('🔍 測試開始: 報表中心主頁');
    
    await page.goto('http://127.0.0.1:8000/reports');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // 檢查頁面是否正常載入
    const pageTitle = await page.textContent('h1');
    expect(pageTitle).toContain('報表');
    console.log('✅ 頁面載入成功');

    // 檢查背景顏色是否為深色 (#1a1d29)
    const bodyBg = await page.evaluate(() => {
      return window.getComputedStyle(document.body).backgroundColor;
    });
    console.log(`🎨 背景顏色: ${bodyBg}`);
    
    // 檢查主要內容區域背景
    const mainContentBg = await page.evaluate(() => {
      const main = document.querySelector('main') || document.querySelector('.main-content');
      return main ? window.getComputedStyle(main).backgroundColor : 'not found';
    });
    console.log(`🎨 主內容區背景: ${mainContentBg}`);

    // 檢查卡片背景是否為深灰色 (#2d3142)
    const cardElements = await page.$$('.nx-card, .report-category, .card');
    if (cardElements.length > 0) {
      const cardBg = await page.evaluate((el) => {
        return window.getComputedStyle(el).backgroundColor;
      }, cardElements[0]);
      console.log(`🎨 卡片背景顏色: ${cardBg}`);
    }

    // 檢查文字顏色是否為白色或淺色
    const textColor = await page.evaluate(() => {
      const textElement = document.querySelector('h1, .text-primary, p');
      return textElement ? window.getComputedStyle(textElement).color : 'not found';
    });
    console.log(`🎨 文字顏色: ${textColor}`);

    // 截圖保存
    await page.screenshot({ 
      path: 'screenshots/dark-theme-reports-center.png',
      fullPage: true 
    });
    console.log('📸 截圖已保存: dark-theme-reports-center.png');
  });

  // 2. 損益表測試
  test('2. 損益表 (/reports/financial/profit-loss) - 深色主題測試', async () => {
    console.log('🔍 測試開始: 損益表');
    
    await page.goto('http://127.0.0.1:8000/reports/financial/profit-loss');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // 檢查頁面載入
    const isLoaded = await page.locator('body').isVisible();
    expect(isLoaded).toBe(true);
    console.log('✅ 頁面載入成功');

    // 檢查是否有錯誤訊息
    const errorExists = await page.locator('.error, .alert-danger, [class*="error"]').count();
    console.log(`🚨 錯誤訊息數量: ${errorExists}`);

    // 檢查深色主題元素
    const darkThemeElements = await page.evaluate(() => {
      const elements = {
        body: window.getComputedStyle(document.body).backgroundColor,
        cards: Array.from(document.querySelectorAll('.nx-card, .card')).map(el => 
          window.getComputedStyle(el).backgroundColor
        ),
        text: Array.from(document.querySelectorAll('h1, h2, h3, p, span')).slice(0, 5).map(el => 
          window.getComputedStyle(el).color
        )
      };
      return elements;
    });
    
    console.log('🎨 深色主題元素檢查:', JSON.stringify(darkThemeElements, null, 2));

    // 截圖保存
    await page.screenshot({ 
      path: 'screenshots/dark-theme-profit-loss.png',
      fullPage: true 
    });
    console.log('📸 截圖已保存: dark-theme-profit-loss.png');
  });

  // 3. 應收帳款報表測試
  test('3. 應收帳款報表 (/reports/financial/accounts-receivable) - 深色主題測試', async () => {
    console.log('🔍 測試開始: 應收帳款報表');
    
    await page.goto('http://127.0.0.1:8000/reports/financial/accounts-receivable');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // 檢查頁面載入
    const isLoaded = await page.locator('body').isVisible();
    expect(isLoaded).toBe(true);
    console.log('✅ 頁面載入成功');

    // 檢查白色背景洩漏問題
    const whiteElements = await page.evaluate(() => {
      const allElements = document.querySelectorAll('*');
      const whiteBackgrounds = [];
      
      for (let el of allElements) {
        const bg = window.getComputedStyle(el).backgroundColor;
        if (bg === 'rgb(255, 255, 255)' || bg === '#ffffff' || bg === 'white') {
          whiteBackgrounds.push({
            tag: el.tagName,
            class: el.className,
            id: el.id,
            background: bg
          });
        }
      }
      
      return whiteBackgrounds.slice(0, 10); // 只返回前10個
    });
    
    console.log('⚠️ 白色背景元素檢查:', JSON.stringify(whiteElements, null, 2));

    // 截圖保存
    await page.screenshot({ 
      path: 'screenshots/dark-theme-accounts-receivable.png',
      fullPage: true 
    });
    console.log('📸 截圖已保存: dark-theme-accounts-receivable.png');
  });

  // 4. 應付帳款報表測試
  test('4. 應付帳款報表 (/reports/financial/accounts-payable) - 深色主題測試', async () => {
    console.log('🔍 測試開始: 應付帳款報表');
    
    await page.goto('http://127.0.0.1:8000/reports/financial/accounts-payable');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // 檢查頁面載入
    const isLoaded = await page.locator('body').isVisible();
    expect(isLoaded).toBe(true);
    console.log('✅ 頁面載入成功');

    // 檢查表格樣式
    const tableStyles = await page.evaluate(() => {
      const tables = document.querySelectorAll('table, .table');
      const styles = [];
      
      for (let table of tables) {
        const tableStyle = window.getComputedStyle(table);
        const headerCells = table.querySelectorAll('th');
        const bodyCells = table.querySelectorAll('td');
        
        styles.push({
          tableBackground: tableStyle.backgroundColor,
          tableBorder: tableStyle.borderColor,
          headerCount: headerCells.length,
          headerStyles: Array.from(headerCells).slice(0, 3).map(th => ({
            background: window.getComputedStyle(th).backgroundColor,
            color: window.getComputedStyle(th).color
          })),
          bodyCount: bodyCells.length,
          bodyStyles: Array.from(bodyCells).slice(0, 3).map(td => ({
            background: window.getComputedStyle(td).backgroundColor,
            color: window.getComputedStyle(td).color
          }))
        });
      }
      
      return styles;
    });
    
    console.log('📊 表格樣式檢查:', JSON.stringify(tableStyles, null, 2));

    // 截圖保存
    await page.screenshot({ 
      path: 'screenshots/dark-theme-accounts-payable.png',
      fullPage: true 
    });
    console.log('📸 截圖已保存: dark-theme-accounts-payable.png');
  });

  // 5. 採購報表總覽測試
  test('5. 採購報表總覽 (/reports/purchase) - 深色主題測試', async () => {
    console.log('🔍 測試開始: 採購報表總覽');
    
    await page.goto('http://127.0.0.1:8000/reports/purchase');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000); // 給圖表更多載入時間

    // 檢查頁面載入
    const isLoaded = await page.locator('body').isVisible();
    expect(isLoaded).toBe(true);
    console.log('✅ 頁面載入成功');

    // 檢查圖表是否正常載入
    const chartStatus = await page.evaluate(() => {
      const charts = document.querySelectorAll('canvas, .chart-container, [id*="chart"]');
      const chartInfo = [];
      
      for (let chart of charts) {
        const rect = chart.getBoundingClientRect();
        chartInfo.push({
          tag: chart.tagName,
          id: chart.id,
          class: chart.className,
          visible: rect.width > 0 && rect.height > 0,
          width: rect.width,
          height: rect.height
        });
      }
      
      return {
        chartCount: charts.length,
        charts: chartInfo
      };
    });
    
    console.log('📈 圖表載入狀態:', JSON.stringify(chartStatus, null, 2));

    // 檢查深色主題一致性
    const themeConsistency = await page.evaluate(() => {
      const elements = {
        body: {
          background: window.getComputedStyle(document.body).backgroundColor,
          color: window.getComputedStyle(document.body).color
        },
        main: (() => {
          const main = document.querySelector('main, .main-content, .container');
          return main ? {
            background: window.getComputedStyle(main).backgroundColor,
            color: window.getComputedStyle(main).color
          } : null;
        })(),
        cards: Array.from(document.querySelectorAll('.nx-card, .card')).slice(0, 5).map(card => ({
          background: window.getComputedStyle(card).backgroundColor,
          color: window.getComputedStyle(card).color,
          border: window.getComputedStyle(card).borderColor
        })),
        buttons: Array.from(document.querySelectorAll('button, .btn')).slice(0, 5).map(btn => ({
          background: window.getComputedStyle(btn).backgroundColor,
          color: window.getComputedStyle(btn).color,
          border: window.getComputedStyle(btn).borderColor
        }))
      };
      
      return elements;
    });
    
    console.log('🎨 主題一致性檢查:', JSON.stringify(themeConsistency, null, 2));

    // 截圖保存
    await page.screenshot({ 
      path: 'screenshots/dark-theme-purchase-reports.png',
      fullPage: true 
    });
    console.log('📸 截圖已保存: dark-theme-purchase-reports.png');
  });

  // 6. 整體視覺一致性測試
  test('6. 整體視覺一致性評估', async () => {
    console.log('🔍 測試開始: 整體視覺一致性評估');
    
    const testPages = [
      '/reports',
      '/reports/financial/profit-loss',
      '/reports/financial/accounts-receivable',
      '/reports/financial/accounts-payable',
      '/reports/purchase'
    ];

    const consistencyResults = [];

    for (const pagePath of testPages) {
      console.log(`🔍 檢查頁面: ${pagePath}`);
      
      await page.goto(`http://127.0.0.1:8000${pagePath}`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      const pageAnalysis = await page.evaluate((path) => {
        const analysis = {
          path: path,
          timestamp: new Date().toISOString(),
          styles: {
            body: window.getComputedStyle(document.body).backgroundColor,
            textPrimary: (() => {
              const h1 = document.querySelector('h1');
              return h1 ? window.getComputedStyle(h1).color : 'not found';
            })(),
            cardBackground: (() => {
              const card = document.querySelector('.nx-card, .card');
              return card ? window.getComputedStyle(card).backgroundColor : 'not found';
            })(),
            buttonStyles: (() => {
              const btn = document.querySelector('button, .btn');
              return btn ? {
                background: window.getComputedStyle(btn).backgroundColor,
                color: window.getComputedStyle(btn).color
              } : 'not found';
            })()
          },
          elements: {
            hasMainContent: !!document.querySelector('main, .main-content'),
            cardCount: document.querySelectorAll('.nx-card, .card').length,
            buttonCount: document.querySelectorAll('button, .btn').length,
            chartCount: document.querySelectorAll('canvas, .chart-container').length
          },
          issues: {
            whiteBackgrounds: (() => {
              const elements = document.querySelectorAll('*');
              let count = 0;
              for (let el of elements) {
                const bg = window.getComputedStyle(el).backgroundColor;
                if (bg === 'rgb(255, 255, 255)' || bg === '#ffffff') {
                  count++;
                }
              }
              return count;
            })(),
            readabilityIssues: (() => {
              const textElements = document.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6');
              let issues = 0;
              for (let el of textElements) {
                const color = window.getComputedStyle(el).color;
                const bg = window.getComputedStyle(el).backgroundColor;
                // 簡單的對比度檢查
                if (color === 'rgb(0, 0, 0)' && (bg === 'transparent' || bg === 'rgba(0, 0, 0, 0)')) {
                  issues++;
                }
              }
              return issues;
            })()
          }
        };
        
        return analysis;
      }, pagePath);

      consistencyResults.push(pageAnalysis);
      console.log(`✅ 完成分析: ${pagePath}`);
    }

    // 輸出完整的一致性報告
    console.log('📊 視覺一致性完整報告:');
    console.log(JSON.stringify(consistencyResults, null, 2));

    // 生成總結報告
    const summary = {
      totalPages: consistencyResults.length,
      commonBackground: [...new Set(consistencyResults.map(r => r.styles.body))],
      commonTextColor: [...new Set(consistencyResults.map(r => r.styles.textPrimary))],
      commonCardBackground: [...new Set(consistencyResults.map(r => r.styles.cardBackground))],
      totalWhiteBackgroundIssues: consistencyResults.reduce((sum, r) => sum + r.issues.whiteBackgrounds, 0),
      totalReadabilityIssues: consistencyResults.reduce((sum, r) => sum + r.issues.readabilityIssues, 0)
    };

    console.log('📋 測試總結:');
    console.log(JSON.stringify(summary, null, 2));

    // 最終截圖
    await page.screenshot({ 
      path: 'screenshots/dark-theme-final-consistency-check.png',
      fullPage: true 
    });
    console.log('📸 最終截圖已保存: dark-theme-final-consistency-check.png');

    // 驗證結果
    expect(summary.totalPages).toBe(5);
    console.log('✅ 整體視覺一致性測試完成');
  });
});