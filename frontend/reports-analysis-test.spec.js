import { test, expect } from '@playwright/test';

// 配置測試參數
const BASE_URL = 'http://127.0.0.1:8000';
const TEST_USER = {
  email: 'test@example.com',
  password: 'password123'
};

// 報表頁面清單
const REPORT_PAGES = [
  { path: '/reports/inventory/turnover', name: '庫存週轉率' },
  { path: '/reports/inventory/aging', name: '庫存老化' },
  { path: '/reports/inventory/movements', name: '庫存異動' },
  { path: '/reports/financial', name: '財務總覽' },
  { path: '/reports/purchase/by-supplier', name: '供應商分析' },
  { path: '/reports/purchase/by-product', name: '採購商品分析' },
  { path: '/reports/employees/attendance', name: '員工出勤' },
  { path: '/reports/employees/performance', name: '員工績效' }
];

test.describe('NexusERP 報表頁面技術狀況分析', () => {
  
  test.beforeEach(async ({ page }) => {
    // 登入系統
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[name="email"]', TEST_USER.email);
    await page.fill('input[name="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    
    // 等待登入完成
    await page.waitForURL(`${BASE_URL}/dashboard`);
    await page.waitForTimeout(2000);
  });

  // 針對每個報表頁面進行個別測試
  for (const report of REPORT_PAGES) {
    test(`分析報表頁面: ${report.name} (${report.path})`, async ({ page }) => {
      const analysis = {
        pageName: report.name,
        pagePath: report.path,
        accessible: false,
        hasJsErrors: false,
        jsErrors: [],
        hasCanvasElements: false,
        canvasElementsEmpty: false,
        hasLoadingText: false,
        loadingTexts: [],
        pageContent: '',
        networkErrors: [],
        screenshotPath: `screenshots/report-analysis-${report.path.replace(/\//g, '_')}.png`
      };

      try {
        // 監聽 JavaScript 錯誤
        const jsErrors = [];
        const networkErrors = [];
        
        page.on('console', (msg) => {
          if (msg.type() === 'error') {
            jsErrors.push(msg.text());
          }
        });

        page.on('response', (response) => {
          if (response.status() >= 400) {
            networkErrors.push({
              url: response.url(),
              status: response.status(),
              statusText: response.statusText()
            });
          }
        });

        // 訪問報表頁面
        console.log(`\n===== 開始分析: ${report.name} =====`);
        await page.goto(`${BASE_URL}${report.path}`, { 
          waitUntil: 'networkidle',
          timeout: 30000 
        });
        
        analysis.accessible = true;
        console.log(`✅ 頁面可成功訪問: ${report.path}`);

        // 等待頁面完全載入
        await page.waitForTimeout(5000);

        // 檢查 JavaScript 錯誤
        if (jsErrors.length > 0) {
          analysis.hasJsErrors = true;
          analysis.jsErrors = jsErrors;
          console.log(`❌ 發現 ${jsErrors.length} 個 JavaScript 錯誤:`);
          jsErrors.forEach((error, index) => {
            console.log(`   ${index + 1}. ${error}`);
          });
        } else {
          console.log(`✅ 無 JavaScript 錯誤`);
        }

        // 檢查網路錯誤
        if (networkErrors.length > 0) {
          analysis.networkErrors = networkErrors;
          console.log(`❌ 發現 ${networkErrors.length} 個網路錯誤:`);
          networkErrors.forEach((error, index) => {
            console.log(`   ${index + 1}. ${error.status} ${error.statusText} - ${error.url}`);
          });
        } else {
          console.log(`✅ 無網路錯誤`);
        }

        // 檢查 Canvas 元素
        const canvasElements = await page.locator('canvas').count();
        if (canvasElements > 0) {
          analysis.hasCanvasElements = true;
          console.log(`✅ 找到 ${canvasElements} 個 Canvas 元素`);

          // 檢查 Canvas 是否為空
          const canvasInfos = [];
          for (let i = 0; i < canvasElements; i++) {
            const canvas = page.locator('canvas').nth(i);
            const width = await canvas.getAttribute('width');
            const height = await canvas.getAttribute('height');
            const isEmpty = await canvas.evaluate((el) => {
              const ctx = el.getContext('2d');
              const imageData = ctx.getImageData(0, 0, el.width, el.height);
              return imageData.data.every(pixel => pixel === 0);
            });
            
            canvasInfos.push({
              index: i,
              width: width,
              height: height,
              isEmpty: isEmpty
            });

            if (isEmpty) {
              analysis.canvasElementsEmpty = true;
              console.log(`❌ Canvas ${i + 1} 為空 (${width}x${height})`);
            } else {
              console.log(`✅ Canvas ${i + 1} 有內容 (${width}x${height})`);
            }
          }
        } else {
          console.log(`❌ 未找到 Canvas 元素`);
        }

        // 檢查載入中文字
        const loadingTexts = [
          '圖表載入中',
          '載入中',
          'Loading',
          '正在載入',
          '數據載入中',
          '圖表生成中'
        ];

        const foundLoadingTexts = [];
        for (const loadingText of loadingTexts) {
          const elements = await page.locator(`text=${loadingText}`).count();
          if (elements > 0) {
            foundLoadingTexts.push(loadingText);
            analysis.hasLoadingText = true;
          }
        }

        if (foundLoadingTexts.length > 0) {
          analysis.loadingTexts = foundLoadingTexts;
          console.log(`⚠️  發現載入中文字: ${foundLoadingTexts.join(', ')}`);
        } else {
          console.log(`✅ 無載入中文字`);
        }

        // 獲取頁面內容快照
        analysis.pageContent = await page.textContent('body');

        // 截圖
        await page.screenshot({ 
          path: analysis.screenshotPath,
          fullPage: true 
        });
        console.log(`📸 截圖已保存: ${analysis.screenshotPath}`);

        // 輸出分析結果
        console.log(`\n===== ${report.name} 分析結果 =====`);
        console.log(`頁面路徑: ${report.path}`);
        console.log(`可訪問: ${analysis.accessible ? '是' : '否'}`);
        console.log(`JavaScript錯誤: ${analysis.hasJsErrors ? '有' : '無'}`);
        console.log(`Canvas元素: ${analysis.hasCanvasElements ? '有' : '無'}`);
        console.log(`Canvas為空: ${analysis.canvasElementsEmpty ? '是' : '否'}`);
        console.log(`載入中文字: ${analysis.hasLoadingText ? '有' : '無'}`);
        console.log(`網路錯誤: ${analysis.networkErrors.length > 0 ? '有' : '無'}`);

      } catch (error) {
        console.log(`❌ 頁面訪問失敗: ${error.message}`);
        analysis.accessible = false;
        analysis.error = error.message;
      }

      // 記錄到全域分析結果（這裡簡化處理）
      console.log(`\n===== 完成分析: ${report.name} =====\n`);
    });
  }

  test('生成綜合分析報告', async ({ page }) => {
    // 這個測試用於生成最終的綜合報告
    console.log('\n========================================');
    console.log('NexusERP 報表頁面技術狀況分析完成');
    console.log('========================================');
    console.log('請檢查 screenshots/ 目錄中的截圖檔案');
    console.log('所有分析結果已記錄在測試輸出中');
    console.log('========================================\n');
  });
});