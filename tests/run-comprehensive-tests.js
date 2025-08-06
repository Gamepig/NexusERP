#!/usr/bin/env node

/**
 * NexusERP Comprehensive Test Runner
 * 綜合測試執行器
 * 
 * Features:
 * - Multiple test execution modes
 * - Browser-specific testing
 * - Parallel execution control
 * - Report generation
 * - Error handling and recovery
 * - Performance monitoring
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

// Configuration
const CONFIG = {
  browsers: ['chromium', 'firefox', 'webkit'],
  testSuites: {
    auth: 'tests/comprehensive/auth-tests.spec.js',
    customers: 'tests/comprehensive/customer-management-tests.spec.js',
    products: 'tests/comprehensive/product-management-tests.spec.js',
    suppliers: 'tests/comprehensive/supplier-management-tests.spec.js',
    salesOrders: 'tests/comprehensive/sales-order-tests.spec.js'
  },
  timeouts: {
    individual: 60000,
    suite: 300000,
    total: 1800000 // 30 minutes max
  }
};

class TestRunner {
  constructor() {
    this.startTime = Date.now();
    this.results = {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      suites: []
    };
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      info: '🔵',
      success: '✅',
      warning: '⚠️',
      error: '❌',
      debug: '🔍'
    }[type] || '💬';
    
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async runCommand(command, args = [], options = {}) {
    return new Promise((resolve, reject) => {
      this.log(`執行指令: ${command} ${args.join(' ')}`, 'debug');
      
      const process = spawn(command, args, {
        stdio: 'pipe',
        shell: true,
        ...options
      });
      
      let stdout = '';
      let stderr = '';
      
      process.stdout?.on('data', (data) => {
        stdout += data.toString();
        if (options.verbose) {
          console.log(data.toString());
        }
      });
      
      process.stderr?.on('data', (data) => {
        stderr += data.toString();
        if (options.verbose) {
          console.error(data.toString());
        }
      });
      
      process.on('close', (code) => {
        if (code === 0) {
          resolve({ stdout, stderr, code });
        } else {
          reject(new Error(`Command failed with code ${code}: ${stderr}`));
        }
      });
      
      process.on('error', reject);
    });
  }

  async checkEnvironment() {
    this.log('檢查測試環境...', 'info');
    
    try {
      // Check if Laravel is running
      const response = await fetch('http://127.0.0.1:8000');
      if (!response.ok) {
        throw new Error('Laravel application not responding');
      }
      this.log('Laravel 應用程式運行正常', 'success');
    } catch (error) {
      this.log(`Laravel 應用程式檢查失敗: ${error.message}`, 'error');
      throw error;
    }
    
    // Check Playwright installation
    try {
      await this.runCommand('npx', ['playwright', '--version']);
      this.log('Playwright 安裝正常', 'success');
    } catch (error) {
      this.log('Playwright 未正確安裝', 'error');
      throw error;
    }
    
    // Create test results directory
    if (!fs.existsSync('test-results')) {
      fs.mkdirSync('test-results', { recursive: true });
      this.log('建立測試結果目錄', 'success');
    }
  }

  async runSingleTest(testFile, browser = 'chromium', options = {}) {
    const suiteName = path.basename(testFile, '.spec.js');
    this.log(`執行測試套件: ${suiteName} (${browser})`, 'info');
    
    const args = [
      'playwright', 'test',
      testFile,
      `--project=${browser}-desktop`,
      '--reporter=json',
      `--output-dir=test-results/${suiteName}-${browser}`,
      ...((options.headed && !process.env.CI) ? ['--headed'] : []),
      ...(options.debug ? ['--debug'] : []),
      ...(options.retries ? [`--retries=${options.retries}`] : [])
    ];
    
    try {
      const result = await this.runCommand('npx', args, {
        verbose: options.verbose,
        timeout: CONFIG.timeouts.suite
      });
      
      this.log(`測試套件 ${suiteName} 完成`, 'success');
      return { success: true, output: result.stdout, suite: suiteName };
      
    } catch (error) {
      this.log(`測試套件 ${suiteName} 失敗: ${error.message}`, 'error');
      return { success: false, error: error.message, suite: suiteName };
    }
  }

  async runAllTests(options = {}) {
    this.log('開始執行所有測試套件', 'info');
    
    const results = [];
    const selectedBrowser = options.browser || 'chromium';
    
    for (const [suiteName, testFile] of Object.entries(CONFIG.testSuites)) {
      if (options.suite && options.suite !== suiteName) {
        continue;
      }
      
      this.log(`準備執行: ${suiteName}`, 'info');
      
      try {
        const result = await this.runSingleTest(testFile, selectedBrowser, options);
        results.push(result);
        
        if (result.success) {
          this.results.passed++;
        } else {
          this.results.failed++;
        }
        
      } catch (error) {
        this.log(`套件 ${suiteName} 執行出現異常: ${error.message}`, 'error');
        results.push({ 
          success: false, 
          error: error.message, 
          suite: suiteName 
        });
        this.results.failed++;
      }
      
      this.results.total++;
      
      // Add delay between test suites to prevent resource conflicts
      if (results.length < Object.keys(CONFIG.testSuites).length) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    return results;
  }

  async runParallelTests(options = {}) {
    this.log('開始並行執行測試套件', 'info');
    
    const promises = [];
    const selectedBrowser = options.browser || 'chromium';
    
    for (const [suiteName, testFile] of Object.entries(CONFIG.testSuites)) {
      if (options.suite && options.suite !== suiteName) {
        continue;
      }
      
      promises.push(
        this.runSingleTest(testFile, selectedBrowser, options)
          .then(result => ({ ...result, suite: suiteName }))
          .catch(error => ({ 
            success: false, 
            error: error.message, 
            suite: suiteName 
          }))
      );
    }
    
    try {
      const results = await Promise.all(promises);
      
      results.forEach(result => {
        if (result.success) {
          this.results.passed++;
        } else {
          this.results.failed++;
        }
        this.results.total++;
      });
      
      return results;
      
    } catch (error) {
      this.log(`並行測試執行失敗: ${error.message}`, 'error');
      throw error;
    }
  }

  async generateReport(results) {
    this.log('生成測試報告...', 'info');
    
    const executionTime = Date.now() - this.startTime;
    const report = {
      summary: {
        executionTime: executionTime,
        executionTimeFormatted: `${Math.round(executionTime / 1000)}s`,
        total: this.results.total,
        passed: this.results.passed,
        failed: this.results.failed,
        skipped: this.results.skipped,
        passRate: this.results.total > 0 ? 
          Math.round((this.results.passed / this.results.total) * 100) : 0
      },
      results: results,
      environment: {
        node: process.version,
        platform: process.platform,
        arch: process.arch,
        timestamp: new Date().toISOString()
      }
    };
    
    const reportPath = `test-results/comprehensive-test-report-${Date.now()}.json`;
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    // Generate HTML report
    await this.generateHTMLReport(report);
    
    this.log(`測試報告已生成: ${reportPath}`, 'success');
    return report;
  }

  async generateHTMLReport(report) {
    const htmlContent = `
<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NexusERP Comprehensive Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; border-bottom: 2px solid #007cba; padding-bottom: 20px; margin-bottom: 20px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .stat-card { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; border-left: 4px solid #007cba; }
        .stat-number { font-size: 2em; font-weight: bold; color: #007cba; }
        .stat-label { color: #666; margin-top: 5px; }
        .results { margin-top: 30px; }
        .result-item { background: #f8f9fa; margin: 10px 0; padding: 15px; border-radius: 8px; border-left: 4px solid #28a745; }
        .result-item.failed { border-left-color: #dc3545; }
        .result-title { font-weight: bold; margin-bottom: 10px; }
        .result-details { color: #666; font-size: 0.9em; }
        .success { color: #28a745; }
        .failed { color: #dc3545; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧪 NexusERP Comprehensive Test Report</h1>
            <p>Generated on ${new Date().toLocaleString('zh-TW')}</p>
        </div>
        
        <div class="summary">
            <div class="stat-card">
                <div class="stat-number">${report.summary.total}</div>
                <div class="stat-label">Total Tests</div>
            </div>
            <div class="stat-card">
                <div class="stat-number success">${report.summary.passed}</div>
                <div class="stat-label">Passed</div>
            </div>
            <div class="stat-card">
                <div class="stat-number failed">${report.summary.failed}</div>
                <div class="stat-label">Failed</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${report.summary.passRate}%</div>
                <div class="stat-label">Pass Rate</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${report.summary.executionTimeFormatted}</div>
                <div class="stat-label">Execution Time</div>
            </div>
        </div>
        
        <div class="results">
            <h2>Test Results</h2>
            ${report.results.map(result => `
                <div class="result-item ${result.success ? 'success' : 'failed'}">
                    <div class="result-title">${result.suite}: ${result.success ? '✅ PASSED' : '❌ FAILED'}</div>
                    ${result.error ? `<div class="result-details">Error: ${result.error}</div>` : ''}
                </div>
            `).join('')}
        </div>
        
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #666;">
            <p>Generated by NexusERP Comprehensive Test Runner</p>
            <p>Environment: Node ${report.environment.node} on ${report.environment.platform}</p>
        </div>
    </div>
</body>
</html>`;
    
    const htmlReportPath = `test-results/comprehensive-test-report.html`;
    fs.writeFileSync(htmlReportPath, htmlContent);
    this.log(`HTML 報告已生成: ${htmlReportPath}`, 'success');
  }

  printSummary(report) {
    console.log('\n' + '='.repeat(60));
    console.log('🎯 NexusERP 綜合測試執行摘要');
    console.log('='.repeat(60));
    console.log(`📊 總測試數: ${report.summary.total}`);
    console.log(`✅ 通過: ${report.summary.passed}`);
    console.log(`❌ 失敗: ${report.summary.failed}`);
    console.log(`📈 通過率: ${report.summary.passRate}%`);
    console.log(`⏱️ 執行時間: ${report.summary.executionTimeFormatted}`);
    console.log('='.repeat(60));
    
    if (report.summary.failed > 0) {
      console.log('\n❌ 失敗的測試套件:');
      report.results
        .filter(r => !r.success)
        .forEach(r => console.log(`   - ${r.suite}: ${r.error}`));
    }
    
    console.log(`\n📋 詳細報告: test-results/comprehensive-test-report.html`);
    console.log(`📊 JSON 報告: test-results/comprehensive-test-report-*.json`);
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const options = {
    suite: args.find(arg => arg.startsWith('--suite='))?.split('=')[1],
    browser: args.find(arg => arg.startsWith('--browser='))?.split('=')[1] || 'chromium',
    parallel: args.includes('--parallel'),
    headed: args.includes('--headed'),
    debug: args.includes('--debug'),
    verbose: args.includes('--verbose'),
    retries: args.find(arg => arg.startsWith('--retries='))?.split('=')[1] || '1'
  };
  
  const runner = new TestRunner();
  
  try {
    await runner.checkEnvironment();
    
    let results;
    if (options.parallel) {
      results = await runner.runParallelTests(options);
    } else {
      results = await runner.runAllTests(options);
    }
    
    const report = await runner.generateReport(results);
    runner.printSummary(report);
    
    // Exit with appropriate code
    process.exit(report.summary.failed > 0 ? 1 : 0);
    
  } catch (error) {
    runner.log(`測試執行失敗: ${error.message}`, 'error');
    process.exit(1);
  }
}

// Help text
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
🧪 NexusERP Comprehensive Test Runner

Usage: node run-comprehensive-tests.js [options]

Options:
  --suite=<name>     Run specific test suite (auth, customers, products, suppliers, salesOrders)
  --browser=<name>   Run tests on specific browser (chromium, firefox, webkit)
  --parallel         Run test suites in parallel
  --headed           Run tests in headed mode (visible browser)
  --debug            Run tests in debug mode
  --verbose          Show detailed output
  --retries=<n>      Number of retries for failed tests
  --help, -h         Show this help message

Examples:
  node run-comprehensive-tests.js                           # Run all tests
  node run-comprehensive-tests.js --suite=auth              # Run only auth tests
  node run-comprehensive-tests.js --browser=firefox         # Run on Firefox
  node run-comprehensive-tests.js --parallel --headed       # Parallel execution with visible browser
  node run-comprehensive-tests.js --suite=customers --debug # Debug customer tests
`);
  process.exit(0);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export default TestRunner;