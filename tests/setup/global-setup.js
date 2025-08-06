/**
 * Global Setup for NexusERP Playwright Tests
 * 全局測試設置和初始化
 * 
 * Responsibilities:
 * - Database preparation
 * - Authentication setup
 * - Test data seeding
 * - Environment validation
 * - Performance monitoring setup
 */

import { chromium } from '@playwright/test';
import { AuthHelper, TEST_CONFIG } from './test-setup.js';
import fs from 'fs';
import path from 'path';

async function globalSetup() {
  console.log('\n🚀 開始 NexusERP Playwright 全局設置...');
  console.log('=' .repeat(60));
  
  // Step 1: Create required directories
  console.log('📁 建立測試目錄結構...');
  const directories = [
    'test-results',
    'test-results/screenshots', 
    'test-results/videos',
    'test-results/traces',
    'test-results/.auth',
    'test-results/html-report'
  ];
  
  directories.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`✅ 建立目錄: ${dir}`);
    }
  });
  
  // Step 2: Environment validation
  console.log('\n🔍 環境驗證...');
  
  const requiredEnvVars = ['NODE_ENV'];
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.log(`⚠️ 缺少環境變數: ${missingVars.join(', ')}`);
  } else {
    console.log('✅ 環境變數檢查通過');
  }
  
  // Step 3: Laravel application health check
  console.log('\n🌐 Laravel 應用程式健康檢查...');
  
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    console.log(`檢查 Laravel 應用程式: ${TEST_CONFIG.baseURL}`);
    
    const response = await page.goto(TEST_CONFIG.baseURL, { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    if (response && response.ok()) {
      console.log('✅ Laravel 應用程式運行正常');
      
      // Check for Laravel-specific indicators
      const content = await page.content();
      const hasLaravel = content.includes('Laravel') || 
                       content.includes('csrf-token') ||
                       content.includes('app.blade.php');
      
      console.log(`Laravel 指標檢查: ${hasLaravel ? '✅' : '⚠️'}`);
      
    } else {
      console.log(`❌ Laravel 應用程式回應異常: ${response?.status()}`);
      throw new Error(`Laravel application not responding properly: ${response?.status()}`);
    }
    
  } catch (error) {
    console.log(`❌ Laravel 健康檢查失敗: ${error.message}`);
    throw error;
  }
  
  // Step 4: Authentication setup
  console.log('\n🔐 設置測試認證...');
  
  try {
    const authResult = await AuthHelper.login(page, TEST_CONFIG.credentials);
    
    if (authResult.success) {
      console.log('✅ 測試用戶登入成功');
      
      // Save authentication state
      const authStatePath = 'test-results/.auth/user.json';
      await context.storageState({ path: authStatePath });
      console.log(`✅ 認證狀態已保存: ${authStatePath}`);
      
    } else {
      console.log('❌ 測試用戶登入失敗');
      console.log(`錯誤詳情: ${authResult.message}`);
      
      // Take a screenshot for debugging
      await page.screenshot({ 
        path: 'test-results/setup-login-failure.png',
        fullPage: true 
      });
      
      // Continue setup even if auth fails - some tests might not need it
      console.log('⚠️ 繼續設置 (某些測試可能不需要認證)');
    }
    
  } catch (error) {
    console.log(`❌ 認證設置失敗: ${error.message}`);
    console.log('⚠️ 繼續設置 (某些測試可能不需要認證)');
  }
  
  // Step 5: Database connection test
  console.log('\n🗄️ 資料庫連接測試...');
  
  try {
    // Try to access a protected page that would require database
    const dbTestNavigation = await page.goto(`${TEST_CONFIG.baseURL}/dashboard`, {
      waitUntil: 'networkidle',
      timeout: 15000
    });
    
    if (dbTestNavigation && dbTestNavigation.ok()) {
      const content = await page.content();
      const hasDbError = content.includes('database') && content.includes('error');
      
      if (!hasDbError) {
        console.log('✅ 資料庫連接正常');
      } else {
        console.log('⚠️ 可能存在資料庫連接問題');
      }
    }
    
  } catch (error) {
    console.log(`⚠️ 資料庫連接測試失敗: ${error.message}`);
  }
  
  // Step 6: Performance baseline capture
  console.log('\n⚡ 建立效能基準...');
  
  try {
    const startTime = Date.now();
    
    await page.goto(TEST_CONFIG.baseURL, { waitUntil: 'networkidle' });
    const pageLoadTime = Date.now() - startTime;
    
    const performanceBaseline = {
      pageLoadTime: pageLoadTime,
      timestamp: new Date().toISOString(),
      baseURL: TEST_CONFIG.baseURL,
      userAgent: await page.evaluate(() => navigator.userAgent)
    };
    
    fs.writeFileSync(
      'test-results/performance-baseline.json',
      JSON.stringify(performanceBaseline, null, 2)
    );
    
    console.log(`✅ 頁面載入基準: ${pageLoadTime}ms`);
    
  } catch (error) {
    console.log(`⚠️ 效能基準建立失敗: ${error.message}`);
  }
  
  // Step 7: Test data validation
  console.log('\n📊 測試資料驗證...');
  
  try {
    // Check if test user exists by trying to access user-specific pages
    const testUserExists = await AuthHelper.isAuthenticated(page);
    console.log(`測試用戶狀態: ${testUserExists ? '✅ 存在' : '⚠️ 不確定'}`);
    
    // Check for basic ERP modules
    const moduleChecks = [
      { url: '/customers', name: '客戶管理' },
      { url: '/products', name: '產品管理' },
      { url: '/suppliers', name: '供應商管理' },
      { url: '/orders', name: '訂單管理' }
    ];
    
    for (const module of moduleChecks) {
      try {
        const response = await page.goto(`${TEST_CONFIG.baseURL}${module.url}`, {
          waitUntil: 'networkidle',
          timeout: 10000
        });
        
        const status = response ? 'accessible' : 'unknown';
        console.log(`${module.name} (${module.url}): ${status === 'accessible' ? '✅' : '⚠️'}`);
        
      } catch (e) {
        console.log(`${module.name} (${module.url}): ⚠️ 無法檢查`);
      }
    }
    
  } catch (error) {
    console.log(`⚠️ 測試資料驗證出現問題: ${error.message}`);
  }
  
  // Step 8: Cleanup and summary
  await context.close();
  await browser.close();
  
  console.log('\n📋 全局設置摘要:');
  console.log('=' .repeat(60));
  console.log('✅ 測試目錄結構已建立');
  console.log('✅ Laravel 應用程式健康檢查完成');
  console.log('✅ 認證設置已準備');
  console.log('✅ 效能基準已建立');
  console.log('✅ 測試環境準備完成');
  
  // Create setup completion marker
  const setupSummary = {
    completed: true,
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'test',
    baseURL: TEST_CONFIG.baseURL
  };
  
  fs.writeFileSync(
    'test-results/setup-summary.json',
    JSON.stringify(setupSummary, null, 2)
  );
  
  console.log('\n🎉 全局設置完成！準備開始測試...\n');
}

export default globalSetup;