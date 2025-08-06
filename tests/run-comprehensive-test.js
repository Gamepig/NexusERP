#!/usr/bin/env node

/**
 * NexusERP Comprehensive Test Runner
 * 
 * This script orchestrates the comprehensive testing of the NexusERP system
 * including all phases of testing with detailed reporting and monitoring.
 * 
 * Usage:
 *   node run-comprehensive-test.js
 *   npm run test:comprehensive (if configured in package.json)
 * 
 * @author Claude Code Assistant
 * @version 1.0
 */

import { exec } from 'child_process';
import { existsSync, mkdirSync } from 'fs';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Configuration
const CONFIG = {
  testCommand: 'npx playwright test tests/comprehensive/nexus-erp-comprehensive-system-test.spec.js',
  browsers: ['chromium'], // Start with Chromium only for comprehensive test
  maxRetries: 2,
  timeout: 300000, // 5 minutes
  outputDir: 'test-results'
};

console.log('🚀 NexusERP 綜合測試運行器');
console.log('=' .repeat(50));

async function checkPrerequisites() {
  console.log('🔍 檢查測試前置條件...');
  
  // Check if NexusERP is running
  try {
    const { stdout, stderr } = await execAsync('curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8000', {
      timeout: 10000
    });
    
    if (stdout.trim() === '200') {
      console.log('✅ NexusERP 伺服器運行中 (http://127.0.0.1:8000)');
    } else {
      console.log('⚠️ NexusERP 伺服器回應異常，狀態碼:', stdout.trim());
      console.log('請確保 NexusERP 在 http://127.0.0.1:8000 上運行');
    }
  } catch (error) {
    console.log('❌ 無法連接到 NexusERP 伺服器');
    console.log('請確保伺服器在 http://127.0.0.1:8000 上運行');
    console.log('啟動命令: php artisan serve --host=127.0.0.1 --port=8000');
  }
  
  // Check Playwright installation
  try {
    await execAsync('npx playwright --version');
    console.log('✅ Playwright 已安裝');
  } catch (error) {
    console.log('❌ Playwright 未安裝或無法執行');
    console.log('安裝命令: npm install playwright');
    process.exit(1);
  }
  
  // Create output directory
  if (!existsSync(CONFIG.outputDir)) {
    mkdirSync(CONFIG.outputDir, { recursive: true });
    console.log(`✅ 建立輸出目錄: ${CONFIG.outputDir}`);
  } else {
    console.log(`✅ 輸出目錄已存在: ${CONFIG.outputDir}`);
  }
}

async function runComprehensiveTest() {
  console.log('\n🧪 開始執行綜合測試...');
  console.log('測試範圍: 系統存取、登入、客戶管理、產品管理、供應商管理');
  console.log('預計時間: 5-10 分鐘');
  console.log('');
  
  const startTime = Date.now();
  
  try {
    // Run the comprehensive test
    const command = `${CONFIG.testCommand} --project=comprehensive-chrome --reporter=list`;
    console.log(`執行命令: ${command}`);
    console.log('');
    
    const { stdout, stderr } = await execAsync(command, {
      timeout: CONFIG.timeout,
      maxBuffer: 1024 * 1024 * 10 // 10MB buffer
    });
    
    console.log('📊 測試輸出:');
    console.log(stdout);
    
    if (stderr) {
      console.log('⚠️ 警告訊息:');
      console.log(stderr);
    }
    
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    
    console.log(`\n✅ 測試完成！執行時間: ${duration.toFixed(2)} 秒`);
    
    return { success: true, duration, output: stdout };
    
  } catch (error) {
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    
    console.log(`\n❌ 測試執行失敗！執行時間: ${duration.toFixed(2)} 秒`);
    console.log('錯誤詳情:');
    console.log(error.message);
    
    if (error.stdout) {
      console.log('\n測試輸出:');
      console.log(error.stdout);
    }
    
    if (error.stderr) {
      console.log('\n錯誤輸出:');
      console.log(error.stderr);
    }
    
    return { success: false, duration, error: error.message };
  }
}

async function generateSummary(testResult) {
  console.log('\n📋 測試摘要');
  console.log('=' .repeat(50));
  
  if (testResult.success) {
    console.log('🎉 測試狀態: 成功完成');
  } else {
    console.log('❌ 測試狀態: 執行失敗');
  }
  
  console.log(`⏱️ 執行時間: ${testResult.duration.toFixed(2)} 秒`);
  console.log(`📁 結果目錄: ${CONFIG.outputDir}/`);
  
  console.log('\n📄 查看結果:');
  console.log(`   HTML 報告: ${CONFIG.outputDir}/html-report/index.html`);
  console.log(`   截圖目錄: ${CONFIG.outputDir}/comprehensive-screenshots/`);
  console.log(`   JSON 報告: ${CONFIG.outputDir}/comprehensive-reports/`);
  
  if (!testResult.success) {
    console.log('\n🔧 故障排除建議:');
    console.log('1. 確認 NexusERP 服務正在運行');
    console.log('2. 檢查測試帳號 test@example.com 是否存在');
    console.log('3. 查看截圖了解失敗的具體步驟');
    console.log('4. 檢查控制台錯誤訊息');
  }
  
  console.log('\n🚀 下一步:');
  console.log('1. 查看 HTML 報告了解詳細結果');
  console.log('2. 檢視測試截圖分析問題');
  console.log('3. 根據建議修復發現的問題');
  console.log('4. 重新執行測試驗證修復');
}

// Main execution
async function main() {
  try {
    await checkPrerequisites();
    const testResult = await runComprehensiveTest();
    await generateSummary(testResult);
    
    // Exit with appropriate code
    process.exit(testResult.success ? 0 : 1);
    
  } catch (error) {
    console.log('\n💥 執行過程發生未預期的錯誤:');
    console.log(error.message);
    console.log('\n請檢查環境設定並重試');
    process.exit(1);
  }
}

// Handle process signals
process.on('SIGINT', () => {
  console.log('\n\n⚠️ 測試被使用者中斷');
  console.log('正在清理並退出...');
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('\n\n⚠️ 測試被系統終止');
  console.log('正在清理並退出...');
  process.exit(1);
});

// Run the main function
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});