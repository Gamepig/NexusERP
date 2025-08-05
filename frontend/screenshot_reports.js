const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class ReportScreenshotter {
    constructor() {
        this.baseUrl = 'http://127.0.0.1:8000';
        this.loginEmail = 'test@example.com';
        this.loginPassword = 'password123';
        this.screenshotsDir = 'report_screenshots';
    }

    async init() {
        // 建立截圖目錄
        if (!fs.existsSync(this.screenshotsDir)) {
            fs.mkdirSync(this.screenshotsDir, { recursive: true });
        }

        // 啟動瀏覽器
        this.browser = await puppeteer.launch({
            headless: false,
            defaultViewport: { width: 1920, height: 1080 }
        });
        this.page = await this.browser.newPage();
    }

    async login() {
        console.log('正在登入系統...');
        await this.page.goto(`${this.baseUrl}/login`);
        await this.page.waitForLoadState('networkidle');

        // 填入登入資訊
        await this.page.type('input[name="email"]', this.loginEmail);
        await this.page.type('input[name="password"]', this.loginPassword);
        await this.page.click('button[type="submit"]');

        // 等待登入完成
        await this.page.waitForNavigation();
        console.log('登入成功!');
    }

    async screenshotPage(urlPath, pageName) {
        const fullUrl = `${this.baseUrl}${urlPath}`;
        console.log(`正在截圖: ${pageName} (${urlPath})`);

        try {
            await this.page.goto(fullUrl);
            await this.page.waitForLoadState('networkidle');
            
            // 等待可能的 AJAX 請求
            await this.page.waitForTimeout(3000);

            // 截圖
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
            const screenshotPath = path.join(this.screenshotsDir, `${pageName}_${timestamp}.png`);
            
            await this.page.screenshot({
                path: screenshotPath,
                fullPage: true
            });

            // 檢查頁面元素
            const charts = await this.page.$$('canvas');
            const tables = await this.page.$$('table');
            const errors = await this.page.$$('.error, .alert-danger, [class*="error"]');

            console.log(`  ✓ 截圖保存: ${screenshotPath}`);
            console.log(`  📊 圖表數量: ${charts.length}`);
            console.log(`  📋 表格數量: ${tables.length}`);
            if (errors.length > 0) {
                console.log(`  ⚠️ 錯誤數量: ${errors.length}`);
            }

            return {
                pageName,
                urlPath,
                screenshotPath,
                chartsCount: charts.length,
                tablesCount: tables.length,
                errorsCount: errors.length
            };

        } catch (error) {
            console.log(`  ❌ 截圖失敗: ${error.message}`);
            return {
                pageName,
                urlPath,
                error: error.message
            };
        }
    }

    async screenshotAllReports() {
        const reportPages = [
            ['/reports/sales', '銷售總覽'],
            ['/reports/sales/by-product', '產品銷售分析'],
            ['/reports/sales/by-customer', '客戶銷售分析'],
            ['/reports/sales/trends', '銷售趨勢分析'],
            ['/reports/inventory', '庫存總覽'],
            ['/reports/inventory/valuation', '庫存估價'],
            ['/reports/financial/profit-loss', '損益表'],
            ['/reports/purchase', '採購總覽'],
            ['/reports/employees/attendance', '出勤統計']
        ];

        const results = [];
        for (const [urlPath, pageName] of reportPages) {
            const result = await this.screenshotPage(urlPath, pageName);
            results.push(result);
        }

        return results;
    }

    async generateReport(results) {
        const reportContent = `# NexusERP 報表頁面實際截圖分析
生成時間: ${new Date().toLocaleString()}

## 📊 分析結果

${results.map(result => {
    if (result.error) {
        return `### ❌ ${result.pageName} (${result.urlPath})
- 狀態: 載入失敗
- 錯誤: ${result.error}
`;
    } else {
        return `### 📄 ${result.pageName} (${result.urlPath})
- 截圖: ${result.screenshotPath}
- 圖表數量: ${result.chartsCount}
- 表格數量: ${result.tablesCount}
- 錯誤數量: ${result.errorsCount}
`;
    }
}).join('\n')}

## 🎯 總結

- 成功截圖: ${results.filter(r => !r.error).length} 頁面
- 失敗截圖: ${results.filter(r => r.error).length} 頁面
- 總圖表數: ${results.filter(r => !r.error).reduce((sum, r) => sum + r.chartsCount, 0)}
- 總表格數: ${results.filter(r => !r.error).reduce((sum, r) => sum + r.tablesCount, 0)}
`;

        const reportPath = path.join(this.screenshotsDir, 'screenshot_analysis.md');
        fs.writeFileSync(reportPath, reportContent);
        
        console.log(`\n📝 分析報告已保存: ${reportPath}`);
        return reportPath;
    }

    async cleanup() {
        if (this.browser) {
            await this.browser.close();
        }
    }
}

async function main() {
    const screenshotter = new ReportScreenshotter();
    
    try {
        await screenshotter.init();
        await screenshotter.login();
        const results = await screenshotter.screenshotAllReports();
        await screenshotter.generateReport(results);
        
    } catch (error) {
        console.error('❌ 執行過程中發生錯誤:', error);
    } finally {
        await screenshotter.cleanup();
    }
    
    console.log('\n✅ 截圖分析完成!');
}

main();