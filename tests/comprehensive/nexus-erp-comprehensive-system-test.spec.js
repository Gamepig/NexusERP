/**
 * NexusERP Comprehensive System Testing Suite
 * 
 * This comprehensive test suite performs systematic testing of the NexusERP system
 * including all major modules and functionality with detailed reporting.
 * 
 * Test Coverage:
 * - Phase 1: System Access & Login Testing  
 * - Phase 2: Customer Management Module
 * - Phase 3: Product Management Module
 * - Phase 4: Supplier Management Module
 * - Phase 5: Comprehensive Error & Performance Analysis
 * 
 * Features:
 * - Complete screenshot documentation
 * - Console error monitoring
 * - Network failure detection
 * - Performance metrics collection
 * - Detailed HTML and JSON reports
 * 
 * @author Claude Code Assistant
 * @version 2.0
 * @created 2025-07-30
 */

import { test, expect } from '@playwright/test';
import { writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Configuration
const CONFIG = {
  baseURL: 'http://127.0.0.1:8000',
  testCredentials: {
    email: 'test@example.com',
    password: 'password123'
  },
  screenshots: {
    path: 'test-results/comprehensive-screenshots',
    quality: 90
  },
  reports: {
    path: 'test-results/comprehensive-reports',
    filename: `nexus-erp-comprehensive-test-${Date.now()}`
  },
  timeouts: {
    navigation: 30000,
    action: 15000,
    assertion: 10000
  }
};

// Test Report Data Structure
let testReport = {
  metadata: {
    testSuite: 'NexusERP Comprehensive System Test',
    startTime: new Date().toISOString(),
    endTime: null,
    duration: null,
    testUrl: CONFIG.baseURL,
    browser: null,
    viewport: null
  },
  phases: [],
  summary: {
    totalTests: 0,
    passed: 0,
    failed: 0,
    warnings: 0,
    errors: []
  },
  performance: {
    pageLoadTimes: [],
    networkRequests: [],
    consoleErrors: [],
    screenshots: []
  },
  recommendations: []
};

// Utility Functions
class TestReporter {
  static async createDirectory(path) {
    try {
      await mkdir(path, { recursive: true });
    } catch (error) {
      console.log(`Directory already exists or created: ${path}`);
    }
  }

  static async captureScreenshot(page, name, description = '') {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${timestamp}_${name}.png`;
    const fullPath = join(CONFIG.screenshots.path, filename);
    
    await this.createDirectory(CONFIG.screenshots.path);
    await page.screenshot({ 
      path: fullPath, 
      fullPage: true,
      quality: CONFIG.screenshots.quality
    });
    
    testReport.performance.screenshots.push({
      filename,
      name,
      description,
      timestamp: new Date().toISOString(),
      path: fullPath
    });
    
    console.log(`📸 Screenshot captured: ${name} -> ${filename}`);
    return filename;
  }

  static async monitorConsoleErrors(page) {
    const errors = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const error = {
          type: 'console-error',
          message: msg.text(),
          timestamp: new Date().toISOString(),
          url: page.url()
        };
        errors.push(error);
        testReport.performance.consoleErrors.push(error);
        console.log(`🚨 Console Error: ${msg.text()}`);
      }
    });

    page.on('pageerror', error => {
      const errorData = {
        type: 'page-error',
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
        url: page.url()
      };
      errors.push(errorData);
      testReport.performance.consoleErrors.push(errorData);
      console.log(`💥 Page Error: ${error.message}`);
    });

    return errors;
  }

  static async monitorNetworkRequests(page) {
    const requests = [];
    
    page.on('request', request => {
      requests.push({
        url: request.url(),
        method: request.method(),
        timestamp: new Date().toISOString(),
        resourceType: request.resourceType()
      });
    });

    page.on('response', response => {
      const request = requests.find(req => req.url === response.url());
      if (request) {
        request.status = response.status();
        request.statusText = response.statusText();
        request.responseTime = Date.now();
      }
      
      // Log failed requests
      if (response.status() >= 400) {
        const errorData = {
          type: 'network-error',
          url: response.url(),
          status: response.status(),
          statusText: response.statusText(),
          timestamp: new Date().toISOString()
        };
        testReport.performance.consoleErrors.push(errorData);
        console.log(`🌐 Network Error: ${response.status()} ${response.url()}`);
      }
      
      testReport.performance.networkRequests.push({
        url: response.url(),
        status: response.status(),
        method: response.request().method(),
        timestamp: new Date().toISOString()
      });
    });

    return requests;
  }

  static addPhaseResult(phaseName, results) {
    testReport.phases.push({
      name: phaseName,
      timestamp: new Date().toISOString(),
      results,
      success: !results.some(r => r.status === 'failed'),
      duration: results.reduce((acc, r) => acc + (r.duration || 0), 0)
    });
  }

  static async generateFinalReport() {
    testReport.metadata.endTime = new Date().toISOString();
    testReport.metadata.duration = new Date(testReport.metadata.endTime).getTime() - 
                                   new Date(testReport.metadata.startTime).getTime();

    // Calculate summary
    testReport.phases.forEach(phase => {
      phase.results.forEach(result => {
        testReport.summary.totalTests++;
        if (result.status === 'passed') testReport.summary.passed++;
        if (result.status === 'failed') testReport.summary.failed++;
        if (result.status === 'warning') testReport.summary.warnings++;
      });
    });

    // Generate recommendations
    testReport.recommendations = TestReporter.generateRecommendations();

    // Save reports
    await TestReporter.createDirectory(CONFIG.reports.path);
    
    // JSON Report
    const jsonReportPath = join(CONFIG.reports.path, `${CONFIG.reports.filename}.json`);
    await writeFile(jsonReportPath, JSON.stringify(testReport, null, 2));
    
    // HTML Report
    const htmlReport = TestReporter.generateHTMLReport();
    const htmlReportPath = join(CONFIG.reports.path, `${CONFIG.reports.filename}.html`);
    await writeFile(htmlReportPath, htmlReport);
    
    console.log(`📊 Reports generated:`);
    console.log(`   JSON: ${jsonReportPath}`);
    console.log(`   HTML: ${htmlReportPath}`);
    
    return testReport;
  }

  static generateRecommendations() {
    const recommendations = [];
    
    // Console errors analysis
    if (testReport.performance.consoleErrors.length > 0) {
      recommendations.push({
        type: 'critical',
        category: 'JavaScript Errors',
        message: `Found ${testReport.performance.consoleErrors.length} console/network errors that need attention`,
        details: testReport.performance.consoleErrors.slice(0, 5) // Show first 5
      });
    }

    // Performance analysis
    const avgLoadTime = testReport.performance.pageLoadTimes.length > 0 ?
      testReport.performance.pageLoadTimes.reduce((a, b) => a + b, 0) / testReport.performance.pageLoadTimes.length : 0;
    
    if (avgLoadTime > 3000) {
      recommendations.push({
        type: 'performance',
        category: 'Page Load Speed',
        message: `Average page load time is ${(avgLoadTime/1000).toFixed(2)}s, consider optimization`,
        details: { avgLoadTime, threshold: 3000 }
      });
    }

    // Success rate analysis
    const successRate = testReport.summary.totalTests > 0 ? 
      (testReport.summary.passed / testReport.summary.totalTests) * 100 : 0;
    
    if (successRate < 90) {
      recommendations.push({
        type: 'warning',
        category: 'Test Success Rate',
        message: `Test success rate is ${successRate.toFixed(1)}%, investigate failing tests`,
        details: { successRate, failed: testReport.summary.failed }
      });
    }

    return recommendations;
  }

  static generateHTMLReport() {
    return `
<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NexusERP Comprehensive Test Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
        .header h1 { margin: 0; font-size: 2.5em; }
        .header .meta { opacity: 0.9; margin-top: 10px; }
        .content { padding: 30px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .summary-card { background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #007bff; }
        .summary-card.success { border-left-color: #28a745; }
        .summary-card.warning { border-left-color: #ffc107; }
        .summary-card.error { border-left-color: #dc3545; }
        .summary-card h3 { margin: 0 0 10px 0; color: #333; }
        .summary-card .number { font-size: 2em; font-weight: bold; color: #007bff; }
        .phase { margin-bottom: 30px; border: 1px solid #dee2e6; border-radius: 8px; overflow: hidden; }
        .phase-header { background: #e9ecef; padding: 15px; font-weight: bold; color: #495057; }
        .phase-content { padding: 20px; }
        .test-result { display: flex; align-items: center; margin-bottom: 10px; padding: 10px; border-radius: 4px; }
        .test-result.passed { background: #d4edda; border-left: 4px solid #28a745; }
        .test-result.failed { background: #f8d7da; border-left: 4px solid #dc3545; }
        .test-result.warning { background: #fff3cd; border-left: 4px solid #ffc107; }
        .status-icon { margin-right: 10px; font-weight: bold; }
        .recommendations { background: #fff3cd; padding: 20px; border-radius: 8px; margin-top: 30px; }
        .recommendation { margin-bottom: 15px; padding: 10px; border-left: 4px solid #ffc107; background: white; }
        .screenshot-gallery { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-top: 20px; }
        .screenshot { border: 1px solid #dee2e6; border-radius: 8px; overflow: hidden; }
        .screenshot img { width: 100%; height: 200px; object-fit: cover; }
        .screenshot-info { padding: 10px; font-size: 0.9em; color: #666; }
        .errors-section { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-top: 20px; }
        .error-item { background: white; margin-bottom: 10px; padding: 15px; border-left: 4px solid #dc3545; border-radius: 4px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧪 NexusERP 綜合測試報告</h1>
            <div class="meta">
                <div>測試時間: ${testReport.metadata.startTime} - ${testReport.metadata.endTime}</div>
                <div>測試網址: ${testReport.metadata.testUrl}</div>
                <div>測試時長: ${(testReport.metadata.duration/1000/60).toFixed(2)} 分鐘</div>
            </div>
        </div>
        
        <div class="content">
            <div class="summary">
                <div class="summary-card">
                    <h3>總測試數</h3>
                    <div class="number">${testReport.summary.totalTests}</div>
                </div>
                <div class="summary-card success">
                    <h3>通過測試</h3>
                    <div class="number" style="color: #28a745">${testReport.summary.passed}</div>
                </div>
                <div class="summary-card error">
                    <h3>失敗測試</h3>
                    <div class="number" style="color: #dc3545">${testReport.summary.failed}</div>
                </div>
                <div class="summary-card warning">
                    <h3>警告</h3>
                    <div class="number" style="color: #ffc107">${testReport.summary.warnings}</div>
                </div>
            </div>

            ${testReport.phases.map(phase => `
            <div class="phase">
                <div class="phase-header">
                    ${phase.success ? '✅' : '❌'} ${phase.name}
                    <span style="float: right; font-weight: normal;">執行時間: ${(phase.duration/1000).toFixed(2)}s</span>
                </div>
                <div class="phase-content">
                    ${phase.results.map(result => `
                    <div class="test-result ${result.status}">
                        <span class="status-icon">${result.status === 'passed' ? '✅' : result.status === 'failed' ? '❌' : '⚠️'}</span>
                        <div>
                            <strong>${result.name}</strong>
                            ${result.description ? `<br><small>${result.description}</small>` : ''}
                            ${result.error ? `<br><small style="color: #dc3545;">錯誤: ${result.error}</small>` : ''}
                        </div>
                    </div>
                    `).join('')}
                </div>
            </div>
            `).join('')}

            ${testReport.recommendations.length > 0 ? `
            <div class="recommendations">
                <h3>🔍 建議與改進項目</h3>
                ${testReport.recommendations.map(rec => `
                <div class="recommendation">
                    <strong>${rec.category}</strong>: ${rec.message}
                </div>
                `).join('')}
            </div>
            ` : ''}

            ${testReport.performance.consoleErrors.length > 0 ? `
            <div class="errors-section">
                <h3>⚠️ 發現的錯誤 (${testReport.performance.consoleErrors.length})</h3>
                ${testReport.performance.consoleErrors.slice(0, 10).map(error => `
                <div class="error-item">
                    <strong>${error.type}</strong>: ${error.message}
                    <br><small>時間: ${error.timestamp} | 頁面: ${error.url || 'N/A'}</small>
                </div>
                `).join('')}
                ${testReport.performance.consoleErrors.length > 10 ? '<p>... 更多錯誤請查看 JSON 報告</p>' : ''}
            </div>
            ` : ''}

            <div class="screenshot-gallery">
                <h3 style="grid-column: 1 / -1;">📸 測試截圖</h3>
                ${testReport.performance.screenshots.map(screenshot => `
                <div class="screenshot">
                    <div class="screenshot-info">
                        <strong>${screenshot.name}</strong><br>
                        <small>${screenshot.description}</small><br>
                        <small>${screenshot.timestamp}</small>
                    </div>
                </div>
                `).join('')}
            </div>
        </div>
    </div>
</body>
</html>`;
  }
}

// Main Test Suite
test.describe('NexusERP Comprehensive System Testing', () => {
  let page;
  let context;
  let startTime;

  test.beforeAll(async ({ browser }) => {
    startTime = Date.now();
    context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      locale: 'zh-TW'
    });
    
    testReport.metadata.browser = browser.browserType().name();
    testReport.metadata.viewport = '1920x1080';
    
    console.log('🚀 開始 NexusERP 綜合系統測試');
  });

  test.beforeEach(async () => {
    page = await context.newPage();
    
    // Setup monitoring
    await TestReporter.monitorConsoleErrors(page);
    await TestReporter.monitorNetworkRequests(page);
  });

  test.afterEach(async () => {
    if (page) {
      await page.close();
    }
  });

  test.afterAll(async () => {
    await TestReporter.generateFinalReport();
    console.log('✅ 測試完成，報告已生成');
  });

  // Phase 1: System Access & Login Testing
  test('Phase 1: System Access & Login Testing', async () => {
    const phaseResults = [];
    console.log('🔍 Phase 1: 系統存取與登入測試');

    try {
      // Test 1.1: Homepage Access
      const homepageStart = Date.now();
      await page.goto(CONFIG.baseURL, { waitUntil: 'networkidle' });
      const homepageLoadTime = Date.now() - homepageStart;
      testReport.performance.pageLoadTimes.push(homepageLoadTime);
      
      await TestReporter.captureScreenshot(page, 'homepage-initial-load', '系統首頁初始載入');
      
      // Verify homepage loaded correctly
      const title = await page.title();
      const isHomepageValid = title.includes('NexusERP') || title.includes('ERP') || await page.locator('body').isVisible();
      
      phaseResults.push({
        name: '首頁載入測試',
        description: `載入時間: ${homepageLoadTime}ms`,
        status: isHomepageValid ? 'passed' : 'failed',
        duration: homepageLoadTime,
        error: !isHomepageValid ? 'Homepage failed to load or title incorrect' : null
      });

      // Test 1.2: Navigate to Login
      let loginNavigationSuccess = false;
      try {
        // Try multiple login navigation methods
        const loginSelectors = [
          'a[href*="login"]',
          'button:has-text("登入")',
          'button:has-text("Login")',
          '.login-btn',
          '#login-button'
        ];

        let loginFound = false;
        for (const selector of loginSelectors) {
          try {
            await page.waitForSelector(selector, { timeout: 5000 });
            await page.click(selector);
            loginFound = true;
            break;
          } catch (e) {
            continue;
          }
        }

        // If no login button found, try direct navigation
        if (!loginFound) {
          await page.goto(`${CONFIG.baseURL}/login`, { waitUntil: 'networkidle' });
        }

        await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 10000 });
        loginNavigationSuccess = true;
        await TestReporter.captureScreenshot(page, 'login-page-loaded', '登入頁面成功載入');
      } catch (error) {
        phaseResults.push({
          name: '登入頁面導航',
          description: '嘗試導航到登入頁面',
          status: 'failed',
          duration: 0,
          error: error.message
        });
      }

      if (loginNavigationSuccess) {
        phaseResults.push({
          name: '登入頁面導航',
          description: '成功導航到登入頁面',
          status: 'passed',
          duration: 0
        });
      }

      // Test 1.3: Login Form Testing
      if (loginNavigationSuccess) {
        try {
          // Fill login form
          await page.fill('input[type="email"], input[name="email"]', CONFIG.testCredentials.email);
          await page.fill('input[type="password"], input[name="password"]', CONFIG.testCredentials.password);
          
          await TestReporter.captureScreenshot(page, 'login-form-filled', '登入表單已填寫');

          // Submit form
          const loginSubmitStart = Date.now();
          await page.click('button[type="submit"], input[type="submit"], .login-submit');
          
          // Wait for navigation or dashboard
          await page.waitForURL(/dashboard|home|admin/, { timeout: 15000 });
          const loginTime = Date.now() - loginSubmitStart;

          await TestReporter.captureScreenshot(page, 'post-login-dashboard', '登入後儀表板');

          phaseResults.push({
            name: '登入認證測試',
            description: `登入處理時間: ${loginTime}ms`,
            status: 'passed',
            duration: loginTime
          });

          // Test 1.4: Dashboard Verification
          const dashboardElements = [
            { selector: '.dashboard, #dashboard, [class*="dashboard"]', name: '儀表板容器' },
            { selector: 'nav, .navbar, .navigation', name: '導航選單' },
            { selector: '.card, .widget, .panel', name: '儀表板卡片' }
          ];

          let dashboardScore = 0;
          for (const element of dashboardElements) {
            try {
              await page.waitForSelector(element.selector, { timeout: 5000 });
              dashboardScore++;
            } catch (e) {
              console.log(`⚠️ ${element.name} 未找到`);
            }
          }

          const dashboardHealthy = dashboardScore >= 2;
          phaseResults.push({
            name: '儀表板健康檢查',
            description: `找到 ${dashboardScore}/${dashboardElements.length} 個關鍵元素`,
            status: dashboardHealthy ? 'passed' : 'warning',
            duration: 0
          });

        } catch (error) {
          phaseResults.push({
            name: '登入認證測試',
            description: '登入過程發生錯誤',
            status: 'failed',
            duration: 0,
            error: error.message
          });
        }
      }

    } catch (error) {
      phaseResults.push({
        name: 'Phase 1 Critical Error',
        description: 'Phase 1 遇到嚴重錯誤',
        status: 'failed',
        duration: 0,
        error: error.message
      });
    }

    TestReporter.addPhaseResult('Phase 1: 系統存取與登入測試', phaseResults);
  });

  // Phase 2: Customer Management Testing
  test('Phase 2: Customer Management Module Testing', async () => {
    const phaseResults = [];
    console.log('🔍 Phase 2: 客戶管理模組測試');

    try {
      // Ensure we're logged in
      await page.goto(`${CONFIG.baseURL}/login`, { waitUntil: 'networkidle' });
      
      try {
        await page.fill('input[type="email"], input[name="email"]', CONFIG.testCredentials.email);
        await page.fill('input[type="password"], input[name="password"]', CONFIG.testCredentials.password);
        await page.click('button[type="submit"], input[type="submit"], .login-submit');
        await page.waitForURL(/dashboard|home|admin/, { timeout: 10000 });
      } catch (e) {
        console.log('⚠️ Already logged in or login bypass');
      }

      // Test 2.1: Navigate to Customers
      const customerNavSelectors = [
        'a[href*="customer"]',
        'nav a:has-text("客戶")',
        'nav a:has-text("Customer")',
        '.menu a[href*="customer"]',
        '[data-nav="customers"]'
      ];

      let customerNavSuccess = false;
      for (const selector of customerNavSelectors) {
        try {
          await page.click(selector, { timeout: 5000 });
          await page.waitForURL(/customer/, { timeout: 10000 });
          customerNavSuccess = true;
          break;
        } catch (e) {
          continue;
        }
      }

      // Try direct URL if navigation failed
      if (!customerNavSuccess) {
        await page.goto(`${CONFIG.baseURL}/customers`, { waitUntil: 'networkidle' });
        customerNavSuccess = await page.url().includes('customer');
      }

      await TestReporter.captureScreenshot(page, 'customer-module-loaded', '客戶管理模組載入');

      phaseResults.push({
        name: '客戶模組導航',
        description: '導航到客戶管理頁面',
        status: customerNavSuccess ? 'passed' : 'failed',
        duration: 0,
        error: !customerNavSuccess ? 'Unable to navigate to customer module' : null
      });

      if (customerNavSuccess) {
        // Test 2.2: Customer List Verification
        const customerListElements = [
          { selector: 'table, .table, .customer-list', name: '客戶列表' },
          { selector: '.add-customer, button:has-text("新增"), .btn-add', name: '新增按鈕' },
          { selector: '.search, input[type="search"], .search-box', name: '搜尋功能' }
        ];

        let customerListScore = 0;
        for (const element of customerListElements) {
          try {
            await page.waitForSelector(element.selector, { timeout: 5000 });
            customerListScore++;
          } catch (e) {
            console.log(`⚠️ ${element.name} 未找到`);
          }
        }

        phaseResults.push({
          name: '客戶列表介面檢查',
          description: `找到 ${customerListScore}/${customerListElements.length} 個介面元素`,
          status: customerListScore >= 2 ? 'passed' : 'warning',
          duration: 0
        });

        // Test 2.3: Add Customer Form Test
        try {
          const addButtons = [
            '.add-customer',
            'button:has-text("新增")',
            'button:has-text("Add")',
            '.btn-add',
            'a:has-text("新增客戶")'
          ];

          let addFormLoaded = false;
          for (const selector of addButtons) {
            try {
              await page.click(selector, { timeout: 5000 });
              // Wait for form elements
              await page.waitForSelector('input[name*="name"], input[name*="customer"]', { timeout: 5000 });
              addFormLoaded = true;
              break;
            } catch (e) {
              continue;
            }
          }

          if (addFormLoaded) {
            await TestReporter.captureScreenshot(page, 'customer-add-form', '客戶新增表單');
            
            phaseResults.push({
              name: '客戶新增表單',
              description: '成功開啟客戶新增表單',
              status: 'passed',
              duration: 0
            });

            // Test form fields
            const formFields = await page.locator('input, select, textarea').count();
            phaseResults.push({
              name: '表單欄位檢查',
              description: `發現 ${formFields} 個表單欄位`,
              status: formFields > 0 ? 'passed' : 'warning',
              duration: 0
            });

          } else {
            phaseResults.push({
              name: '客戶新增表單',
              description: '無法開啟客戶新增表單',
              status: 'failed',
              duration: 0,
              error: 'Add customer form not accessible'
            });
          }
        } catch (error) {
          phaseResults.push({
            name: '客戶新增表單測試',
            description: '測試客戶新增功能時發生錯誤',
            status: 'failed',
            duration: 0,
            error: error.message
          });
        }

        // Test 2.4: Sales Order Integration
        try {
          await page.goto(`${CONFIG.baseURL}/sales-orders`, { waitUntil: 'networkidle' });
          const salesOrderExists = await page.locator('h1, .title, .page-title').count() > 0;
          
          await TestReporter.captureScreenshot(page, 'sales-orders-page', '銷售訂單頁面');

          phaseResults.push({
            name: '銷售訂單整合',
            description: '檢查銷售訂單功能',
            status: salesOrderExists ? 'passed' : 'warning',
            duration: 0
          });
        } catch (error) {
          phaseResults.push({
            name: '銷售訂單整合',
            description: '銷售訂單頁面存取失敗',
            status: 'warning',
            duration: 0,
            error: error.message
          });
        }

        // Test 2.5: Quotation System
        try {
          const quotationUrls = [
            `${CONFIG.baseURL}/quotations`,
            `${CONFIG.baseURL}/quotes`,
            `${CONFIG.baseURL}/sales/quotes`
          ];

          let quotationFound = false;
          for (const url of quotationUrls) {
            try {
              await page.goto(url, { waitUntil: 'networkidle' });
              if (!page.url().includes('404') && !page.url().includes('error')) {
                quotationFound = true;
                break;
              }
            } catch (e) {
              continue;
            }
          }

          if (quotationFound) {
            await TestReporter.captureScreenshot(page, 'quotations-page', '報價單頁面');
          }

          phaseResults.push({
            name: '報價單系統',
            description: '檢查報價單功能',
            status: quotationFound ? 'passed' : 'warning',
            duration: 0,
            error: !quotationFound ? 'Quotation system not found' : null
          });
        } catch (error) {
          phaseResults.push({
            name: '報價單系統',
            description: '報價單系統測試失敗',
            status: 'warning',
            duration: 0,
            error: error.message
          });
        }
      }

    } catch (error) {
      phaseResults.push({
        name: 'Phase 2 Critical Error',
        description: 'Phase 2 遇到嚴重錯誤',
        status: 'failed',
        duration: 0,
        error: error.message
      });
    }

    TestReporter.addPhaseResult('Phase 2: 客戶管理模組測試', phaseResults);
  });

  // Phase 3: Product Management Testing
  test('Phase 3: Product Management Module Testing', async () => {
    const phaseResults = [];
    console.log('🔍 Phase 3: 產品管理模組測試');

    try {
      // Ensure logged in
      await page.goto(`${CONFIG.baseURL}/login`, { waitUntil: 'networkidle' });
      
      try {
        await page.fill('input[type="email"], input[name="email"]', CONFIG.testCredentials.email);
        await page.fill('input[type="password"], input[name="password"]', CONFIG.testCredentials.password);
        await page.click('button[type="submit"], input[type="submit"], .login-submit');
        await page.waitForURL(/dashboard|home|admin/, { timeout: 10000 });
      } catch (e) {
        console.log('⚠️ Login bypass or already authenticated');
      }

      // Test 3.1: Navigate to Products
      const productNavSelectors = [
        'a[href*="product"]',
        'nav a:has-text("產品")',
        'nav a:has-text("Product")',
        '.menu a[href*="product"]',
        '[data-nav="products"]'
      ];

      let productNavSuccess = false;
      for (const selector of productNavSelectors) {
        try {
          await page.click(selector, { timeout: 5000 });
          await page.waitForURL(/product/, { timeout: 10000 });
          productNavSuccess = true;
          break;
        } catch (e) {
          continue;
        }
      }

      if (!productNavSuccess) {
        await page.goto(`${CONFIG.baseURL}/products`, { waitUntil: 'networkidle' });
        productNavSuccess = await page.url().includes('product');
      }

      await TestReporter.captureScreenshot(page, 'product-module-loaded', '產品管理模組載入');

      phaseResults.push({
        name: '產品模組導航',
        description: '導航到產品管理頁面',
        status: productNavSuccess ? 'passed' : 'failed',
        duration: 0,
        error: !productNavSuccess ? 'Unable to navigate to product module' : null
      });

      if (productNavSuccess) {
        // Test 3.2: Product List and Features
        const productFeatures = [
          { selector: 'table, .product-list, .products-table', name: '產品列表' },
          { selector: '.add-product, button:has-text("新增"), .btn-add', name: '新增產品' },
          { selector: '.search, input[type="search"]', name: '產品搜尋' },
          { selector: '.edit, .btn-edit, a:has-text("編輯")', name: '編輯功能' }
        ];

        let productFeatureScore = 0;
        for (const feature of productFeatures) {
          try {
            await page.waitForSelector(feature.selector, { timeout: 5000 });
            productFeatureScore++;
          } catch (e) {
            console.log(`⚠️ ${feature.name} 未找到`);
          }
        }

        phaseResults.push({
          name: '產品列表功能檢查',
          description: `找到 ${productFeatureScore}/${productFeatures.length} 個功能`,
          status: productFeatureScore >= 2 ? 'passed' : 'warning',
          duration: 0
        });

        // Test 3.3: Add/Edit Product Form
        try {
          const addButtons = [
            '.add-product',
            'button:has-text("新增")',
            'button:has-text("Add")',
            '.btn-add'
          ];

          let formOpened = false;
          for (const selector of addButtons) {
            try {
              await page.click(selector, { timeout: 5000 });
              await page.waitForSelector('input[name*="name"], input[name*="product"]', { timeout: 5000 });
              formOpened = true;
              break;
            } catch (e) {
              continue;
            }
          }

          if (formOpened) {
            await TestReporter.captureScreenshot(page, 'product-add-form', '產品新增表單');
            
            const formFields = await page.locator('input, select, textarea').count();
            phaseResults.push({
              name: '產品表單檢查',
              description: `產品表單包含 ${formFields} 個欄位`,
              status: formFields > 3 ? 'passed' : 'warning',
              duration: 0
            });
          } else {
            phaseResults.push({
              name: '產品表單檢查',
              description: '無法開啟產品新增表單',
              status: 'failed',
              duration: 0,
              error: 'Product add form not accessible'
            });
          }
        } catch (error) {
          phaseResults.push({
            name: '產品表單測試',
            description: '產品表單測試失敗',
            status: 'failed',
            duration: 0,
            error: error.message
          });
        }

        // Test 3.4: Inventory Integration
        try {
          const inventoryUrls = [
            `${CONFIG.baseURL}/inventory`,
            `${CONFIG.baseURL}/inventory/levels`,
            `${CONFIG.baseURL}/stock`
          ];

          let inventoryFound = false;
          for (const url of inventoryUrls) {
            try {
              await page.goto(url, { waitUntil: 'networkidle' });
              if (!page.url().includes('404')) {
                inventoryFound = true;
                await TestReporter.captureScreenshot(page, 'inventory-integration', '庫存管理整合');
                break;
              }
            } catch (e) {
              continue;
            }
          }

          phaseResults.push({
            name: '庫存管理整合',
            description: '檢查產品與庫存系統整合',
            status: inventoryFound ? 'passed' : 'warning',
            duration: 0,
            error: !inventoryFound ? 'Inventory system not accessible' : null
          });
        } catch (error) {
          phaseResults.push({
            name: '庫存管理整合',
            description: '庫存系統整合測試失敗',
            status: 'warning',
            duration: 0,
            error: error.message
          });
        }
      }

    } catch (error) {
      phaseResults.push({
        name: 'Phase 3 Critical Error',
        description: 'Phase 3 遇到嚴重錯誤',
        status: 'failed',
        duration: 0,
        error: error.message
      });
    }

    TestReporter.addPhaseResult('Phase 3: 產品管理模組測試', phaseResults);
  });

  // Phase 4: Supplier Management Testing
  test('Phase 4: Supplier Management Module Testing', async () => {
    const phaseResults = [];
    console.log('🔍 Phase 4: 供應商管理模組測試');

    try {
      // Ensure logged in
      await page.goto(`${CONFIG.baseURL}/login`, { waitUntil: 'networkidle' });
      
      try {
        await page.fill('input[type="email"], input[name="email"]', CONFIG.testCredentials.email);
        await page.fill('input[type="password"], input[name="password"]', CONFIG.testCredentials.password);
        await page.click('button[type="submit"], input[type="submit"], .login-submit');
        await page.waitForURL(/dashboard|home|admin/, { timeout: 10000 });
      } catch (e) {
        console.log('⚠️ Login bypass or already authenticated');
      }

      // Test 4.1: Navigate to Suppliers
      const supplierNavSelectors = [
        'a[href*="supplier"]',
        'nav a:has-text("供應商")',
        'nav a:has-text("Supplier")',
        '.menu a[href*="supplier"]',
        '[data-nav="suppliers"]'
      ];

      let supplierNavSuccess = false;
      for (const selector of supplierNavSelectors) {
        try {
          await page.click(selector, { timeout: 5000 });
          await page.waitForURL(/supplier/, { timeout: 10000 });
          supplierNavSuccess = true;
          break;
        } catch (e) {
          continue;
        }
      }

      if (!supplierNavSuccess) {
        await page.goto(`${CONFIG.baseURL}/suppliers`, { waitUntil: 'networkidle' });
        supplierNavSuccess = await page.url().includes('supplier');
      }

      await TestReporter.captureScreenshot(page, 'supplier-module-loaded', '供應商管理模組載入');

      phaseResults.push({
        name: '供應商模組導航',
        description: '導航到供應商管理頁面',
        status: supplierNavSuccess ? 'passed' : 'failed',
        duration: 0,
        error: !supplierNavSuccess ? 'Unable to navigate to supplier module' : null
      });

      if (supplierNavSuccess) {
        // Test 4.2: Supplier List Display
        const supplierElements = [
          { selector: 'table, .supplier-list, .suppliers-table', name: '供應商列表' },
          { selector: '.add-supplier, button:has-text("新增"), .btn-add', name: '新增供應商' },
          { selector: '.supplier-status, .status', name: '狀態顯示' }
        ];

        let supplierElementScore = 0;
        for (const element of supplierElements) {
          try {
            await page.waitForSelector(element.selector, { timeout: 5000 });
            supplierElementScore++;
          } catch (e) {
            console.log(`⚠️ ${element.name} 未找到`);
          }
        }

        phaseResults.push({
          name: '供應商列表檢查',
          description: `找到 ${supplierElementScore}/${supplierElements.length} 個列表元素`,
          status: supplierElementScore >= 1 ? 'passed' : 'warning',
          duration: 0
        });

        // Test 4.3: Supplier Status Display
        try {
          const statusElements = await page.locator('.status, .supplier-status, [class*="status"]').count();
          const hasStatusInfo = statusElements > 0;

          phaseResults.push({
            name: '供應商狀態顯示',
            description: `找到 ${statusElements} 個狀態顯示元素`,
            status: hasStatusInfo ? 'passed' : 'warning',
            duration: 0
          });

          if (hasStatusInfo) {
            await TestReporter.captureScreenshot(page, 'supplier-status-display', '供應商狀態顯示');
          }
        } catch (error) {
          phaseResults.push({
            name: '供應商狀態顯示',
            description: '狀態顯示檢查失敗',
            status: 'warning',
            duration: 0,
            error: error.message
          });
        }

        // Test 4.4: Supplier Form Testing
        try {
          const addButtons = [
            '.add-supplier',
            'button:has-text("新增")',
            'button:has-text("Add")',
            '.btn-add'
          ];

          let supplierFormOpened = false;
          for (const selector of addButtons) {
            try {
              await page.click(selector, { timeout: 5000 });
              await page.waitForSelector('input[name*="name"], input[name*="supplier"]', { timeout: 5000 });
              supplierFormOpened = true;
              break;
            } catch (e) {
              continue;
            }
          }

          if (supplierFormOpened) {
            await TestReporter.captureScreenshot(page, 'supplier-add-form', '供應商新增表單');
            
            const formInputs = await page.locator('input, select, textarea').count();
            phaseResults.push({
              name: '供應商表單功能',
              description: `供應商表單包含 ${formInputs} 個輸入欄位`,
              status: formInputs > 2 ? 'passed' : 'warning',
              duration: 0
            });
          } else {
            phaseResults.push({
              name: '供應商表單功能',
              description: '無法開啟供應商新增表單',
              status: 'failed',
              duration: 0,
              error: 'Supplier add form not accessible'
            });
          }
        } catch (error) {
          phaseResults.push({
            name: '供應商表單測試',
            description: '供應商表單測試失敗',
            status: 'failed',
            duration: 0,
            error: error.message
          });
        }
      }

    } catch (error) {
      phaseResults.push({
        name: 'Phase 4 Critical Error',
        description: 'Phase 4 遇到嚴重錯誤',
        status: 'failed',
        duration: 0,
        error: error.message
      });
    }

    TestReporter.addPhaseResult('Phase 4: 供應商管理模組測試', phaseResults);
  });

  // Phase 5: Comprehensive Analysis & Reporting
  test('Phase 5: Comprehensive System Analysis', async () => {
    const phaseResults = [];
    console.log('🔍 Phase 5: 綜合系統分析');

    try {
      // Test 5.1: Performance Analysis
      const avgLoadTime = testReport.performance.pageLoadTimes.length > 0 ?
        testReport.performance.pageLoadTimes.reduce((a, b) => a + b, 0) / testReport.performance.pageLoadTimes.length : 0;

      phaseResults.push({
        name: '系統效能分析',
        description: `平均頁面載入時間: ${(avgLoadTime/1000).toFixed(2)}秒`,
        status: avgLoadTime < 3000 ? 'passed' : avgLoadTime < 5000 ? 'warning' : 'failed',
        duration: avgLoadTime
      });

      // Test 5.2: Error Analysis
      const totalErrors = testReport.performance.consoleErrors.length;
      const criticalErrors = testReport.performance.consoleErrors.filter(e => 
        e.type === 'page-error' || e.message.includes('500') || e.message.includes('404')
      ).length;

      phaseResults.push({
        name: '錯誤分析',
        description: `總錯誤數: ${totalErrors}, 嚴重錯誤: ${criticalErrors}`,
        status: criticalErrors === 0 ? (totalErrors < 5 ? 'passed' : 'warning') : 'failed',
        duration: 0
      });

      // Test 5.3: Network Request Analysis
      const networkRequests = testReport.performance.networkRequests;
      const failedRequests = networkRequests.filter(req => req.status >= 400);
      const successRate = networkRequests.length > 0 ? 
        ((networkRequests.length - failedRequests.length) / networkRequests.length * 100) : 100;

      phaseResults.push({
        name: '網路請求分析',
        description: `成功率: ${successRate.toFixed(1)}% (${failedRequests.length}/${networkRequests.length} 失敗)`,
        status: successRate >= 95 ? 'passed' : successRate >= 85 ? 'warning' : 'failed',
        duration: 0
      });

      // Test 5.4: Module Coverage Analysis
      const testedModules = ['登入系統', '客戶管理', '產品管理', '供應商管理'];
      const passedPhases = testReport.phases.filter(phase => phase.success).length;
      const moduleSuccessRate = (passedPhases / testedModules.length) * 100;

      phaseResults.push({
        name: '模組覆蓋率分析',
        description: `模組測試成功率: ${moduleSuccessRate.toFixed(1)}% (${passedPhases}/${testedModules.length})`,
        status: moduleSuccessRate >= 75 ? 'passed' : moduleSuccessRate >= 50 ? 'warning' : 'failed',
        duration: 0
      });

      // Test 5.5: Final System Health Check
      await page.goto(CONFIG.baseURL, { waitUntil: 'networkidle' });
      const finalHealthCheck = await page.evaluate(() => {
        return {
          hasErrors: !!document.querySelector('.error, .alert-danger'),
          hasContent: document.body.innerText.length > 100,
          hasNavigation: !!document.querySelector('nav, .navbar, .navigation'),
          responsive: window.innerWidth > 0 && window.innerHeight > 0
        };
      });

      const healthScore = Object.values(finalHealthCheck).filter(Boolean).length;
      await TestReporter.captureScreenshot(page, 'final-system-health-check', '最終系統健康檢查');

      phaseResults.push({
        name: '最終系統健康檢查',
        description: `系統健康得分: ${healthScore}/4`,
        status: healthScore >= 3 ? 'passed' : healthScore >= 2 ? 'warning' : 'failed',
        duration: 0,
        details: finalHealthCheck
      });

    } catch (error) {
      phaseResults.push({
        name: 'Phase 5 Analysis Error',
        description: 'Phase 5 分析過程發生錯誤',
        status: 'failed',
        duration: 0,
        error: error.message
      });
    }

    TestReporter.addPhaseResult('Phase 5: 綜合系統分析', phaseResults);
  });
});