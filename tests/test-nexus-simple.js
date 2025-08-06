#!/usr/bin/env node

/**
 * NexusERP Simple Functional Testing Script
 * 簡化版功能測試腳本
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://127.0.0.1:8000';
const TEST_CREDENTIALS = {
  email: 'test@example.com',
  password: 'password123'
};

class NexusERPTester {
  constructor() {
    this.browser = null;
    this.context = null;  
    this.page = null;
    this.results = [];
    this.screenshotDir = 'test-results/screenshots';
    
    // Ensure screenshot directory exists
    if (!fs.existsSync(this.screenshotDir)) {
      fs.mkdirSync(this.screenshotDir, { recursive: true });
    }
  }

  async initialize() {
    console.log('🚀 初始化 NexusERP 測試環境...');
    
    this.browser = await chromium.launch({ 
      headless: false,
      slowMo: 1000 // Slow down for visibility
    });
    
    this.context = await this.browser.newContext({
      viewport: { width: 1920, height: 1080 },
      acceptDownloads: true
    });
    
    this.page = await this.context.newPage();
    
    // Enable request logging
    this.page.on('response', response => {
      if (response.status() >= 400) {
        console.log(`❌ HTTP Error: ${response.status()} - ${response.url()}`);
      }
    });
    
    console.log('✅ 瀏覽器初始化完成');
  }

  async takeScreenshot(name, description = '') {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${timestamp}-${name}.png`;
    const filepath = path.join(this.screenshotDir, filename);
    
    await this.page.screenshot({ 
      path: filepath, 
      fullPage: true 
    });
    
    console.log(`📸 截圖已保存: ${filename}${description ? ' - ' + description : ''}`);
    return filename;
  }

  async addResult(testName, status, details, screenshot = null) {
    this.results.push({
      test: testName,
      status,
      details,
      screenshot,
      timestamp: new Date().toISOString()
    });
    
    const emoji = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
    console.log(`${emoji} ${testName}: ${status} - ${details}`);
  }

  async testAuthentication() {
    console.log('\n🔐 測試系統存取與認證...');
    
    try {
      // Navigate to application
      await this.page.goto(BASE_URL, { waitUntil: 'networkidle' });
      await this.takeScreenshot('01-homepage', '首頁載入');
      
      // This is a landing page, look for login button
      const loginButton = await this.page.locator('text=登入');
      if (await loginButton.count() === 0) {
        await this.addResult('首頁載入', 'FAIL', '未找到登入按鈕');
        return false;
      }
      
      await this.addResult('首頁載入', 'PASS', '成功載入首頁並找到登入按鈕');
      
      // Click login button to go to actual login page
      await loginButton.click();
      await this.page.waitForTimeout(2000);
      await this.takeScreenshot('02-login-page', '登入頁面');
      
      // Check if we're now on a login form page
      const emailInput = await this.page.locator('input[name="email"], input[type="email"]');
      const passwordInput = await this.page.locator('input[name="password"], input[type="password"]');
      
      if (await emailInput.count() === 0 || await passwordInput.count() === 0) {
        await this.addResult('登入表單檢查', 'FAIL', '未找到登入表單輸入欄位');
        return false;
      }
      
      await this.addResult('登入表單檢查', 'PASS', '成功找到登入表單');
      
      // Fill login form
      await emailInput.fill(TEST_CREDENTIALS.email);
      await passwordInput.fill(TEST_CREDENTIALS.password);
      
      await this.takeScreenshot('03-login-form-filled', '填寫登入表單');
      
      // Submit login
      const submitButton = await this.page.locator('button[type="submit"], input[type="submit"]');
      if (await submitButton.count() > 0) {
        await submitButton.click();
        await this.page.waitForTimeout(3000);
        
        // Check for successful login
        const currentUrl = this.page.url();
        await this.takeScreenshot('04-after-login', '登入後頁面');
        
        // Check for dashboard or admin interface indicators
        const pageContent = await this.page.textContent('body');
        if (pageContent.includes('儀表板') || pageContent.includes('Dashboard') || 
            pageContent.includes('客戶') || pageContent.includes('產品') ||
            currentUrl.includes('dashboard') || currentUrl.includes('admin')) {
          await this.addResult('用戶認證', 'PASS', `成功登入ERP系統，當前URL: ${currentUrl}`);
          return true;
        } else {
          // Check for error messages
          const errorMessages = await this.page.locator('.alert-danger, .error, .invalid-feedback, .text-red-500').allTextContents();
          if (errorMessages.length > 0) {
            await this.addResult('用戶認證', 'FAIL', `登入失敗: ${errorMessages.join(', ')}`);
          } else {
            await this.addResult('用戶認證', 'WARN', `登入狀態不明確，當前URL: ${currentUrl}`);
          }
          return false;
        }
      } else {
        await this.addResult('登入按鈕檢查', 'FAIL', '未找到登入提交按鈕');
        return false;
      }
      
    } catch (error) {
      await this.takeScreenshot('error-authentication', '認證測試錯誤');
      await this.addResult('用戶認證', 'FAIL', `認證測試失敗: ${error.message}`);
      return false;
    }
  }

  async testCustomerManagement() {
    console.log('\n👥 測試客戶管理功能...');
    
    try {
      // First check if we're logged in, if not skip this test
      const currentUrl = this.page.url();
      const pageContent = await this.page.textContent('body');
      
      if (currentUrl === BASE_URL + '/' || currentUrl === BASE_URL) {
        await this.addResult('客戶管理前置檢查', 'SKIP', '未登入ERP系統，跳過客戶管理測試');
        return false;
      }
      
      // Look for customer management navigation in the current page
      let customerLinkFound = false;
      const customerLinks = await this.page.locator('a:has-text("客戶"), a:has-text("Customer"), a[href*="customer"]');
      
      if (await customerLinks.count() > 0) {
        customerLinkFound = true;
        await customerLinks.first().click();
        await this.page.waitForTimeout(2000);
        await this.takeScreenshot('05-customer-page', '客戶管理頁面');
        await this.addResult('客戶頁面導航', 'PASS', '成功透過導覽列存取客戶管理頁面');
      } else {
        // Try different possible customer management routes
        const customerRoutes = ['/customers', '/customer', '/admin/customers'];
        
        for (const route of customerRoutes) {
          try {
            await this.page.goto(BASE_URL + route, { waitUntil: 'networkidle' });
            const routePageContent = await this.page.textContent('body');
            
            if (routePageContent.includes('客戶') || routePageContent.includes('Customer') || 
                !routePageContent.includes('404') && !routePageContent.includes('Not Found')) {
              customerLinkFound = true;
              await this.takeScreenshot('05-customer-page', `客戶管理頁面 (${route})`);
              await this.addResult('客戶頁面導航', 'PASS', `成功存取客戶管理頁面: ${route}`);
              break;
            }
          } catch (e) {
            continue;
          }
        }
      }
      
      if (!customerLinkFound) {
        await this.addResult('客戶頁面導航', 'FAIL', '無法找到客戶管理頁面');
        return false;
      }
      
      // Test sales order creation path
      try {
        await this.page.goto(BASE_URL + '/customers/2236/orders/create', { waitUntil: 'networkidle' });
        await this.takeScreenshot('05-customer-order-create', '客戶訂單建立頁面');
        
        const pageContent = await this.page.textContent('body');
        if (pageContent.includes('404') || pageContent.includes('Not Found')) {
          await this.addResult('客戶訂單建立', 'FAIL', '客戶訂單建立路徑不存在 (404錯誤)');
        } else {
          await this.addResult('客戶訂單建立', 'PASS', '成功存取客戶訂單建立頁面');
        }
      } catch (error) {
        await this.addResult('客戶訂單建立', 'FAIL', `客戶訂單建立測試失敗: ${error.message}`);
      }
      
      return true;
      
    } catch (error) {
      await this.takeScreenshot('error-customer-management', '客戶管理測試錯誤');  
      await this.addResult('客戶管理功能', 'FAIL', `客戶管理測試失敗: ${error.message}`);
      return false;
    }
  }

  async testProductManagement() {
    console.log('\n📦 測試產品管理功能...');
    
    try {
      const productRoutes = ['/products', '/product', '/產品管理', '/admin/products'];
      let productPageFound = false;
      
      for (const route of productRoutes) {
        try {
          await this.page.goto(BASE_URL + route, { waitUntil: 'networkidle' });
          const pageContent = await this.page.textContent('body');
          
          if (pageContent.includes('產品') || pageContent.includes('Product') || pageContent.includes('庫存')) {
            productPageFound = true;
            await this.takeScreenshot('06-product-page', `產品管理頁面 (${route})`);
            await this.addResult('產品頁面導航', 'PASS', `成功存取產品管理頁面: ${route}`);
            break;
          }
        } catch (e) {
          continue;
        }
      }
      
      if (!productPageFound) {
        await this.addResult('產品頁面導航', 'FAIL', '無法找到產品管理頁面');
        return false;
      }
      
      // Test product creation functionality
      const createButtons = await this.page.locator('a[href*="create"], button:has-text("新增"), button:has-text("建立"), button:has-text("Create")').count();
      if (createButtons > 0) {
        await this.addResult('產品建立功能', 'PASS', '找到產品建立按鈕');
      } else {
        await this.addResult('產品建立功能', 'WARN', '未找到明顯的產品建立按鈕');
      }
      
      return true;
      
    } catch (error) {
      await this.takeScreenshot('error-product-management', '產品管理測試錯誤');
      await this.addResult('產品管理功能', 'FAIL', `產品管理測試失敗: ${error.message}`);
      return false;
    }
  }

  async testSupplierManagement() {
    console.log('\n🏭 測試供應商管理功能...');
    
    try {
      const supplierRoutes = ['/suppliers', '/supplier', '/供應商管理', '/admin/suppliers'];
      let supplierPageFound = false;
      
      for (const route of supplierRoutes) {
        try {
          await this.page.goto(BASE_URL + route, { waitUntil: 'networkidle' });
          const pageContent = await this.page.textContent('body');
          
          if (pageContent.includes('供應商') || pageContent.includes('Supplier') || pageContent.includes('供應商管理')) {
            supplierPageFound = true;
            await this.takeScreenshot('07-supplier-page', `供應商管理頁面 (${route})`);
            await this.addResult('供應商頁面導航', 'PASS', `成功存取供應商管理頁面: ${route}`);
            break;
          }
        } catch (e) {
          continue;
        }
      }
      
      if (!supplierPageFound) {
        await this.addResult('供應商頁面導航', 'FAIL', '無法找到供應商管理頁面');
        return false;
      }
      
      return true;
      
    } catch (error) {
      await this.takeScreenshot('error-supplier-management', '供應商管理測試錯誤');
      await this.addResult('供應商管理功能', 'FAIL', `供應商管理測試失敗: ${error.message}`);
      return false;
    }
  }

  async testSalesOrderManagement() {
    console.log('\n🛒 測試銷售訂單功能...');
    
    try {
      const orderRoutes = ['/orders', '/sales-orders', '/訂單管理', '/admin/orders'];
      let orderPageFound = false;
      
      for (const route of orderRoutes) {
        try {
          await this.page.goto(BASE_URL + route, { waitUntil: 'networkidle' });
          const pageContent = await this.page.textContent('body');
          
          if (pageContent.includes('訂單') || pageContent.includes('Order') || pageContent.includes('銷售')) {
            orderPageFound = true;
            await this.takeScreenshot('08-order-page', `訂單管理頁面 (${route})`);
            await this.addResult('訂單頁面導航', 'PASS', `成功存取訂單管理頁面: ${route}`);
            break;
          }
        } catch (e) {
          continue;
        }
      }
      
      if (!orderPageFound) {
        await this.addResult('訂單頁面導航', 'FAIL', '無法找到訂單管理頁面');
        return false;
      }
      
      return true;
      
    } catch (error) {
      await this.takeScreenshot('error-sales-order', '訂單管理測試錯誤');
      await this.addResult('訂單管理功能', 'FAIL', `訂單管理測試失敗: ${error.message}`);
      return false;
    }
  }

  async generateReport() {
    const endTime = Date.now();
    const duration = Math.round((endTime - this.startTime) / 1000);
    
    const report = {
      summary: {
        totalTests: this.results.length,
        passed: this.results.filter(r => r.status === 'PASS').length,
        failed: this.results.filter(r => r.status === 'FAIL').length,
        warnings: this.results.filter(r => r.status === 'WARN').length,
        duration: `${duration} 秒`
      },
      results: this.results,
      generatedAt: new Date().toISOString()
    };
    
    // Save JSON report
    const jsonPath = path.join('test-results', `nexus-erp-test-report-${Date.now()}.json`);
    if (!fs.existsSync('test-results')) {
      fs.mkdirSync('test-results', { recursive: true });
    }
    fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));
    
    // Generate HTML report
    const htmlReport = this.generateHTMLReport(report);
    const htmlPath = path.join('test-results', 'nexus-erp-test-report.html');
    fs.writeFileSync(htmlPath, htmlReport);
    
    console.log('\n📊 測試執行摘要');
    console.log('=====================================');
    console.log(`📋 總測試數: ${report.summary.totalTests}`);
    console.log(`✅ 通過: ${report.summary.passed}`);
    console.log(`❌ 失敗: ${report.summary.failed}`);
    console.log(`⚠️ 警告: ${report.summary.warnings}`);
    console.log(`⏱️ 執行時間: ${report.summary.duration}`);
    console.log(`📄 詳細報告: ${htmlPath}`);
    console.log(`📊 JSON 報告: ${jsonPath}`);
    
    return report;
  }

  generateHTMLReport(report) {
    return `
<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NexusERP 功能測試報告</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        h1 { color: #2c3e50; text-align: center; margin-bottom: 30px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .stat-card { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; }
        .stat-card.passed { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); }
        .stat-card.failed { background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); }
        .stat-card.warning { background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%); }
        .stat-number { font-size: 2em; font-weight: bold; margin-bottom: 5px; }
        .stat-label { font-size: 0.9em; opacity: 0.9; }
        .results { margin-top: 30px; }
        .result-item { background: white; border: 1px solid #ddd; border-radius: 5px; margin-bottom: 10px; padding: 15px; }
        .result-item.PASS { border-left: 5px solid #27ae60; }
        .result-item.FAIL { border-left: 5px solid #e74c3c; }
        .result-item.WARN { border-left: 5px solid #f39c12; }
        .result-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
        .result-title { font-weight: bold; font-size: 1.1em; }
        .result-status { padding: 5px 10px; border-radius: 3px; color: white; font-size: 0.8em; }
        .result-status.PASS { background: #27ae60; }
        .result-status.FAIL { background: #e74c3c; }
        .result-status.WARN { background: #f39c12; }
        .result-details { color: #666; }
        .result-time { font-size: 0.8em; color: #999; }
        .screenshot-link { color: #3498db; text-decoration: none; font-size: 0.9em; }
        .screenshot-link:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 NexusERP 功能測試報告</h1>
        
        <div class="summary">
            <div class="stat-card">
                <div class="stat-number">${report.summary.totalTests}</div>
                <div class="stat-label">總測試數</div>
            </div>
            <div class="stat-card passed">
                <div class="stat-number">${report.summary.passed}</div>
                <div class="stat-label">通過</div>
            </div>
            <div class="stat-card failed">
                <div class="stat-number">${report.summary.failed}</div>
                <div class="stat-label">失敗</div>
            </div>
            <div class="stat-card warning">
                <div class="stat-number">${report.summary.warnings}</div>
                <div class="stat-label">警告</div>
            </div>
        </div>
        
        <div style="text-align: center; margin: 20px 0; color: #666;">
            執行時間: ${report.summary.duration} | 生成時間: ${new Date(report.generatedAt).toLocaleString('zh-TW')}
        </div>
        
        <div class="results">
            <h2>測試結果詳情</h2>
            ${report.results.map(result => `
                <div class="result-item ${result.status}">
                    <div class="result-header">
                        <span class="result-title">${result.test}</span>
                        <span class="result-status ${result.status}">${result.status}</span>
                    </div>
                    <div class="result-details">${result.details}</div>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px;">
                        <div class="result-time">${new Date(result.timestamp).toLocaleString('zh-TW')}</div>
                        ${result.screenshot ? `<a href="screenshots/${result.screenshot}" class="screenshot-link" target="_blank">📸 查看截圖</a>` : ''}
                    </div>
                </div>
            `).join('')}
        </div>
    </div>
</body>
</html>`;
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
    console.log('🧹 測試環境清理完成');
  }

  async run() {
    const startTime = Date.now();
    
    try {
      await this.initialize();
      
      // Run tests in sequence
      await this.testAuthentication();
      await this.testCustomerManagement();
      await this.testProductManagement();
      await this.testSupplierManagement();
      await this.testSalesOrderManagement();
      
      await this.generateReport();
      
    } catch (error) {
      console.error('❌ 測試執行失敗:', error.message);
      await this.takeScreenshot('critical-error', '嚴重錯誤');
    } finally {
      await this.cleanup();
    }
  }
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new NexusERPTester();
  await tester.run();
}

export default NexusERPTester;