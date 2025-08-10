const { chromium } = require('playwright');

class NexusERPTester {
    constructor() {
        this.browser = null;
        this.context = null;
        this.page = null;
        this.testResults = {
            authentication: {},
            navigation: {},
            modules: {},
            forms: {},
            api: {},
            ui: {},
            performance: {},
            errors: []
        };
        this.testCredentials = {
            email: 'test@example.com',
            password: 'password123'
        };
    }

    async setup() {
        console.log('🚀 啟動 NexusERP 全面測試...\n');
        
        this.browser = await chromium.launch({
            headless: false,
            slowMo: 500
        });
        
        this.context = await this.browser.newContext({
            viewport: { width: 1920, height: 1080 }
        });
        
        this.page = await this.context.newPage();
        
        // 監聽網路請求
        this.page.on('request', request => {
            if (!request.url().includes('static') && !request.url().includes('css') && !request.url().includes('js')) {
                console.log('📤 請求:', request.method(), request.url());
            }
        });
        
        this.page.on('response', response => {
            if (response.status() >= 400) {
                console.log('❌ 錯誤回應:', response.status(), response.url());
                this.testResults.errors.push({
                    type: 'HTTP Error',
                    status: response.status(),
                    url: response.url()
                });
            }
        });
        
        // 監聽控制台錯誤
        this.page.on('console', msg => {
            if (msg.type() === 'error') {
                console.log('🐛 控制台錯誤:', msg.text());
                this.testResults.errors.push({
                    type: 'Console Error',
                    message: msg.text()
                });
            }
        });
        
        // 監聽頁面錯誤
        this.page.on('pageerror', error => {
            console.log('💥 頁面錯誤:', error.message);
            this.testResults.errors.push({
                type: 'Page Error',
                message: error.message
            });
        });
    }

    async testAuthentication() {
        console.log('🔐 測試認證與授權流程...');
        
        const startTime = Date.now();
        
        try {
            // 1. 測試登入頁面載入
            await this.page.goto('http://127.0.0.1:8000/login');
            await this.page.waitForSelector('form', { timeout: 5000 });
            this.testResults.authentication.loginPageLoad = true;
            console.log('✅ 登入頁面載入成功');
            
            // 2. 測試無效登入
            await this.page.fill('input[name="email"]', 'invalid@test.com');
            await this.page.fill('input[name="password"]', 'wrongpassword');
            await this.page.click('button[type="submit"]');
            await this.page.waitForTimeout(2000);
            
            // 檢查是否顯示錯誤訊息
            const errorMessage = await this.page.locator('.text-red-600, .alert-danger, .error').first();
            if (await errorMessage.count() > 0) {
                this.testResults.authentication.invalidLoginHandling = true;
                console.log('✅ 無效登入錯誤處理正常');
            }
            
            // 3. 測試有效登入
            await this.page.fill('input[name="email"]', this.testCredentials.email);
            await this.page.fill('input[name="password"]', this.testCredentials.password);
            await this.page.click('button[type="submit"]');
            
            // 等待重定向到儀表板
            await this.page.waitForURL('**/dashboard', { timeout: 10000 });
            this.testResults.authentication.validLogin = true;
            console.log('✅ 有效登入成功');
            
            // 4. 測試登出功能
            const logoutButton = this.page.locator('form[method="POST"] button, a[href*="logout"], button:has-text("登出")').first();
            if (await logoutButton.count() > 0) {
                await logoutButton.click();
                await this.page.waitForURL('**/login', { timeout: 5000 });
                this.testResults.authentication.logout = true;
                console.log('✅ 登出功能正常');
            }
            
            // 重新登入以進行後續測試
            await this.page.goto('http://127.0.0.1:8000/login');
            await this.page.fill('input[name="email"]', this.testCredentials.email);
            await this.page.fill('input[name="password"]', this.testCredentials.password);
            await this.page.click('button[type="submit"]');
            await this.page.waitForURL('**/dashboard', { timeout: 10000 });
            
        } catch (error) {
            console.log('❌ 認證測試失敗:', error.message);
            this.testResults.authentication.error = error.message;
        }
        
        this.testResults.authentication.duration = Date.now() - startTime;
    }

    async testNavigation() {
        console.log('🧭 測試導航和路由...');
        
        const startTime = Date.now();
        const routes = [
            { path: '/dashboard', name: '儀表板' },
            { path: '/inventory', name: '庫存管理' },
            { path: '/products', name: '產品管理' },
            { path: '/suppliers', name: '供應商管理' },
            { path: '/customers', name: '客戶管理' },
            { path: '/orders', name: '訂單管理' },
            { path: '/reports', name: '報表' },
            { path: '/settings', name: '設定' }
        ];
        
        this.testResults.navigation.routes = {};
        
        for (const route of routes) {
            try {
                await this.page.goto(`http://127.0.0.1:8000${route.path}`);
                await this.page.waitForLoadState('networkidle', { timeout: 10000 });
                
                // 檢查頁面是否正確載入
                const pageTitle = await this.page.title();
                const hasContent = await this.page.locator('main, .content, #app').count() > 0;
                
                this.testResults.navigation.routes[route.path] = {
                    accessible: true,
                    title: pageTitle,
                    hasContent: hasContent
                };
                
                console.log(`✅ ${route.name} (${route.path}) - 載入成功`);
                
            } catch (error) {
                console.log(`❌ ${route.name} (${route.path}) - 載入失敗: ${error.message}`);
                this.testResults.navigation.routes[route.path] = {
                    accessible: false,
                    error: error.message
                };
            }
        }
        
        this.testResults.navigation.duration = Date.now() - startTime;
    }

    async testMainModules() {
        console.log('📦 測試主要模組功能...');
        
        const startTime = Date.now();
        
        // 測試庫存管理模組
        await this.testInventoryModule();
        
        // 測試產品管理模組
        await this.testProductsModule();
        
        // 測試供應商管理模組
        await this.testSuppliersModule();
        
        // 測試客戶管理模組
        await this.testCustomersModule();
        
        // 測試訂單管理模組
        await this.testOrdersModule();
        
        // 測試報表模組
        await this.testReportsModule();
        
        // 測試設定模組
        await this.testSettingsModule();
        
        this.testResults.modules.duration = Date.now() - startTime;
    }

    async testInventoryModule() {
        console.log('  📊 測試庫存管理模組...');
        
        try {
            await this.page.goto('http://127.0.0.1:8000/inventory');
            await this.page.waitForLoadState('networkidle', { timeout: 10000 });
            
            const moduleTests = {
                pageLoad: false,
                hasTable: false,
                hasData: false,
                searchFunction: false,
                filterFunction: false
            };
            
            // 檢查頁面載入
            const mainContent = await this.page.locator('main, .content, #app').count();
            moduleTests.pageLoad = mainContent > 0;
            
            // 檢查是否有資料表格
            const table = await this.page.locator('table, .table, #inventory-table').first();
            moduleTests.hasTable = await table.count() > 0;
            
            if (moduleTests.hasTable) {
                // 檢查是否有資料
                const rows = await this.page.locator('tbody tr, .table-row').count();
                moduleTests.hasData = rows > 0;
                console.log(`    ℹ️ 庫存資料行數: ${rows}`);
            }
            
            // 測試搜尋功能
            const searchInput = await this.page.locator('input[type="search"], input[placeholder*="搜尋"], input[name*="search"]').first();
            if (await searchInput.count() > 0) {
                await searchInput.fill('test');
                await this.page.waitForTimeout(1000);
                moduleTests.searchFunction = true;
                console.log('    ✅ 搜尋功能存在');
            }
            
            this.testResults.modules.inventory = moduleTests;
            console.log('  ✅ 庫存管理模組測試完成');
            
        } catch (error) {
            console.log('  ❌ 庫存管理模組測試失敗:', error.message);
            this.testResults.modules.inventory = { error: error.message };
        }
    }

    async testProductsModule() {
        console.log('  🛍️ 測試產品管理模組...');
        
        try {
            await this.page.goto('http://127.0.0.1:8000/products');
            await this.page.waitForLoadState('networkidle', { timeout: 10000 });
            
            const moduleTests = {
                pageLoad: false,
                hasTable: false,
                hasAddButton: false,
                hasEditFunction: false
            };
            
            // 檢查頁面載入
            const mainContent = await this.page.locator('main, .content, #app').count();
            moduleTests.pageLoad = mainContent > 0;
            
            // 檢查是否有產品表格
            const table = await this.page.locator('table, .table, .products-table').first();
            moduleTests.hasTable = await table.count() > 0;
            
            // 檢查是否有新增按鈕
            const addButton = await this.page.locator('a[href*="create"], button:has-text("新增"), button:has-text("Add")').first();
            moduleTests.hasAddButton = await addButton.count() > 0;
            
            // 檢查是否有編輯功能
            const editLink = await this.page.locator('a[href*="edit"], button:has-text("編輯"), .edit-btn').first();
            moduleTests.hasEditFunction = await editLink.count() > 0;
            
            this.testResults.modules.products = moduleTests;
            console.log('  ✅ 產品管理模組測試完成');
            
        } catch (error) {
            console.log('  ❌ 產品管理模組測試失敗:', error.message);
            this.testResults.modules.products = { error: error.message };
        }
    }

    async testSuppliersModule() {
        console.log('  🏢 測試供應商管理模組...');
        
        try {
            await this.page.goto('http://127.0.0.1:8000/suppliers');
            await this.page.waitForLoadState('networkidle', { timeout: 10000 });
            
            const moduleTests = {
                pageLoad: false,
                hasTable: false,
                hasAddButton: false
            };
            
            const mainContent = await this.page.locator('main, .content, #app').count();
            moduleTests.pageLoad = mainContent > 0;
            
            const table = await this.page.locator('table, .table').first();
            moduleTests.hasTable = await table.count() > 0;
            
            const addButton = await this.page.locator('a[href*="create"], button:has-text("新增")').first();
            moduleTests.hasAddButton = await addButton.count() > 0;
            
            this.testResults.modules.suppliers = moduleTests;
            console.log('  ✅ 供應商管理模組測試完成');
            
        } catch (error) {
            console.log('  ❌ 供應商管理模組測試失敗:', error.message);
            this.testResults.modules.suppliers = { error: error.message };
        }
    }

    async testCustomersModule() {
        console.log('  👥 測試客戶管理模組...');
        
        try {
            await this.page.goto('http://127.0.0.1:8000/customers');
            await this.page.waitForLoadState('networkidle', { timeout: 10000 });
            
            const moduleTests = {
                pageLoad: false,
                hasTable: false,
                hasAddButton: false
            };
            
            const mainContent = await this.page.locator('main, .content, #app').count();
            moduleTests.pageLoad = mainContent > 0;
            
            const table = await this.page.locator('table, .table').first();
            moduleTests.hasTable = await table.count() > 0;
            
            const addButton = await this.page.locator('a[href*="create"], button:has-text("新增")').first();
            moduleTests.hasAddButton = await addButton.count() > 0;
            
            this.testResults.modules.customers = moduleTests;
            console.log('  ✅ 客戶管理模組測試完成');
            
        } catch (error) {
            console.log('  ❌ 客戶管理模組測試失敗:', error.message);
            this.testResults.modules.customers = { error: error.message };
        }
    }

    async testOrdersModule() {
        console.log('  📋 測試訂單管理模組...');
        
        try {
            await this.page.goto('http://127.0.0.1:8000/orders');
            await this.page.waitForLoadState('networkidle', { timeout: 10000 });
            
            const moduleTests = {
                pageLoad: false,
                hasTable: false,
                hasStatusFilter: false
            };
            
            const mainContent = await this.page.locator('main, .content, #app').count();
            moduleTests.pageLoad = mainContent > 0;
            
            const table = await this.page.locator('table, .table').first();
            moduleTests.hasTable = await table.count() > 0;
            
            const statusFilter = await this.page.locator('select[name*="status"], .status-filter').first();
            moduleTests.hasStatusFilter = await statusFilter.count() > 0;
            
            this.testResults.modules.orders = moduleTests;
            console.log('  ✅ 訂單管理模組測試完成');
            
        } catch (error) {
            console.log('  ❌ 訂單管理模組測試失敗:', error.message);
            this.testResults.modules.orders = { error: error.message };
        }
    }

    async testReportsModule() {
        console.log('  📈 測試報表模組...');
        
        try {
            await this.page.goto('http://127.0.0.1:8000/reports');
            await this.page.waitForLoadState('networkidle', { timeout: 10000 });
            
            const moduleTests = {
                pageLoad: false,
                hasReportOptions: false,
                hasCharts: false
            };
            
            const mainContent = await this.page.locator('main, .content, #app').count();
            moduleTests.pageLoad = mainContent > 0;
            
            const reportOptions = await this.page.locator('.report-option, .card, .report-card').count();
            moduleTests.hasReportOptions = reportOptions > 0;
            
            const charts = await this.page.locator('canvas, .chart, #chart').count();
            moduleTests.hasCharts = charts > 0;
            
            this.testResults.modules.reports = moduleTests;
            console.log('  ✅ 報表模組測試完成');
            
        } catch (error) {
            console.log('  ❌ 報表模組測試失敗:', error.message);
            this.testResults.modules.reports = { error: error.message };
        }
    }

    async testSettingsModule() {
        console.log('  ⚙️ 測試設定模組...');
        
        try {
            await this.page.goto('http://127.0.0.1:8000/settings');
            await this.page.waitForLoadState('networkidle', { timeout: 10000 });
            
            const moduleTests = {
                pageLoad: false,
                hasSettingsOptions: false,
                hasCompanySettings: false
            };
            
            const mainContent = await this.page.locator('main, .content, #app').count();
            moduleTests.pageLoad = mainContent > 0;
            
            const settingsOptions = await this.page.locator('.settings-option, .card, a[href*="settings"]').count();
            moduleTests.hasSettingsOptions = settingsOptions > 0;
            
            const companySettings = await this.page.locator('a[href*="company"], button:has-text("公司"), .company-settings').count();
            moduleTests.hasCompanySettings = companySettings > 0;
            
            this.testResults.modules.settings = moduleTests;
            console.log('  ✅ 設定模組測試完成');
            
        } catch (error) {
            console.log('  ❌ 設定模組測試失敗:', error.message);
            this.testResults.modules.settings = { error: error.message };
        }
    }

    async testAPIIntegration() {
        console.log('🔌 測試 API 整合...');
        
        const startTime = Date.now();
        const apiEndpoints = [
            { path: '/api/inventory/levels', name: '庫存水準' },
            { path: '/api/products', name: '產品列表' },
            { path: '/api/suppliers', name: '供應商列表' },
            { path: '/api/customers', name: '客戶列表' }
        ];
        
        this.testResults.api.endpoints = {};
        
        for (const endpoint of apiEndpoints) {
            try {
                const response = await this.page.request.get(`http://127.0.0.1:8000${endpoint.path}`, {
                    headers: {
                        'Accept': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest'
                    }
                });
                
                this.testResults.api.endpoints[endpoint.path] = {
                    status: response.status(),
                    success: response.ok(),
                    contentType: response.headers()['content-type']
                };
                
                if (response.ok()) {
                    console.log(`✅ ${endpoint.name} API - 狀態 ${response.status()}`);
                } else {
                    console.log(`❌ ${endpoint.name} API - 狀態 ${response.status()}`);
                }
                
            } catch (error) {
                console.log(`❌ ${endpoint.name} API - 錯誤: ${error.message}`);
                this.testResults.api.endpoints[endpoint.path] = {
                    error: error.message
                };
            }
        }
        
        this.testResults.api.duration = Date.now() - startTime;
    }

    async testPerformance() {
        console.log('⚡ 測試效能指標...');
        
        const startTime = Date.now();
        const pages = [
            { path: '/dashboard', name: '儀表板' },
            { path: '/inventory', name: '庫存' },
            { path: '/products', name: '產品' }
        ];
        
        this.testResults.performance.pages = {};
        
        for (const testPage of pages) {
            try {
                const pageStartTime = Date.now();
                
                await this.page.goto(`http://127.0.0.1:8000${testPage.path}`);
                await this.page.waitForLoadState('networkidle', { timeout: 15000 });
                
                const loadTime = Date.now() - pageStartTime;
                
                // 取得效能指標
                const metrics = await this.page.evaluate(() => {
                    const nav = performance.getEntriesByType('navigation')[0];
                    return {
                        domContentLoaded: nav.domContentLoadedEventEnd - nav.domContentLoadedEventStart,
                        loadComplete: nav.loadEventEnd - nav.loadEventStart,
                        firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
                        firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0
                    };
                });
                
                this.testResults.performance.pages[testPage.path] = {
                    totalLoadTime: loadTime,
                    ...metrics
                };
                
                console.log(`  📊 ${testPage.name} - 載入時間: ${loadTime}ms`);
                
            } catch (error) {
                console.log(`  ❌ ${testPage.name} - 效能測試失敗: ${error.message}`);
                this.testResults.performance.pages[testPage.path] = {
                    error: error.message
                };
            }
        }
        
        this.testResults.performance.duration = Date.now() - startTime;
    }

    async testUIResponsiveness() {
        console.log('📱 測試響應式設計...');
        
        const startTime = Date.now();
        const viewports = [
            { width: 1920, height: 1080, name: '桌面' },
            { width: 1024, height: 768, name: '平板' },
            { width: 375, height: 667, name: '手機' }
        ];
        
        this.testResults.ui.responsiveness = {};
        
        for (const viewport of viewports) {
            try {
                await this.page.setViewportSize({ width: viewport.width, height: viewport.height });
                await this.page.goto('http://127.0.0.1:8000/dashboard');
                await this.page.waitForLoadState('networkidle', { timeout: 10000 });
                
                // 檢查導航是否正常顯示
                const nav = await this.page.locator('nav, .navbar, .navigation').first();
                const navVisible = await nav.isVisible();
                
                // 檢查主要內容是否可見
                const mainContent = await this.page.locator('main, .content, #app').first();
                const contentVisible = await mainContent.isVisible();
                
                this.testResults.ui.responsiveness[viewport.name] = {
                    navigationVisible: navVisible,
                    contentVisible: contentVisible,
                    viewport: viewport
                };
                
                console.log(`  📱 ${viewport.name} (${viewport.width}x${viewport.height}) - 響應式測試完成`);
                
            } catch (error) {
                console.log(`  ❌ ${viewport.name} - 響應式測試失敗: ${error.message}`);
                this.testResults.ui.responsiveness[viewport.name] = {
                    error: error.message,
                    viewport: viewport
                };
            }
        }
        
        // 恢復預設視窗大小
        await this.page.setViewportSize({ width: 1920, height: 1080 });
        
        this.testResults.ui.duration = Date.now() - startTime;
    }

    async takeScreenshots() {
        console.log('📸 擷取測試截圖...');
        
        const pages = [
            { path: '/login', name: 'login' },
            { path: '/dashboard', name: 'dashboard' },
            { path: '/inventory', name: 'inventory' },
            { path: '/products', name: 'products' },
            { path: '/suppliers', name: 'suppliers' },
            { path: '/customers', name: 'customers' },
            { path: '/orders', name: 'orders' },
            { path: '/reports', name: 'reports' },
            { path: '/settings', name: 'settings' }
        ];
        
        for (const testPage of pages) {
            try {
                if (testPage.path === '/login') {
                    // 登出以截取登入頁面
                    await this.page.goto('http://127.0.0.1:8000/logout');
                    await this.page.waitForTimeout(1000);
                }
                
                await this.page.goto(`http://127.0.0.1:8000${testPage.path}`);
                await this.page.waitForLoadState('networkidle', { timeout: 10000 });
                
                await this.page.screenshot({
                    path: `test-screenshot-${testPage.name}.png`,
                    fullPage: true
                });
                
                console.log(`  📸 ${testPage.name} 截圖已保存`);
                
                if (testPage.path === '/login') {
                    // 重新登入
                    await this.page.fill('input[name="email"]', this.testCredentials.email);
                    await this.page.fill('input[name="password"]', this.testCredentials.password);
                    await this.page.click('button[type="submit"]');
                    await this.page.waitForURL('**/dashboard', { timeout: 10000 });
                }
                
            } catch (error) {
                console.log(`  ❌ ${testPage.name} 截圖失敗: ${error.message}`);
            }
        }
    }

    async generateReport() {
        console.log('\n📋 生成測試報告...');
        
        const report = {
            testDateTime: new Date().toISOString(),
            summary: {
                totalModules: Object.keys(this.testResults.modules).length - 1, // 減去 duration
                passedModules: 0,
                failedModules: 0,
                totalErrors: this.testResults.errors.length,
                totalDuration: 0
            },
            results: this.testResults
        };
        
        // 計算通過和失敗的模組數量
        Object.entries(this.testResults.modules).forEach(([key, value]) => {
            if (key !== 'duration' && typeof value === 'object') {
                if (value.error) {
                    report.summary.failedModules++;
                } else {
                    report.summary.passedModules++;
                }
            }
        });
        
        // 計算總測試時間
        report.summary.totalDuration = [
            this.testResults.authentication.duration || 0,
            this.testResults.navigation.duration || 0,
            this.testResults.modules.duration || 0,
            this.testResults.api.duration || 0,
            this.testResults.performance.duration || 0,
            this.testResults.ui.duration || 0
        ].reduce((a, b) => a + b, 0);
        
        // 保存詳細報告
        const fs = require('fs');
        fs.writeFileSync('nexus-erp-test-report.json', JSON.stringify(report, null, 2));
        
        // 生成 Markdown 報告
        const markdownReport = this.generateMarkdownReport(report);
        fs.writeFileSync('nexus-erp-test-report.md', markdownReport);
        
        console.log('\n📊 測試總結:');
        console.log(`  • 總測試時間: ${Math.round(report.summary.totalDuration / 1000)}秒`);
        console.log(`  • 測試模組: ${report.summary.totalModules}`);
        console.log(`  • 通過模組: ${report.summary.passedModules}`);
        console.log(`  • 失敗模組: ${report.summary.failedModules}`);
        console.log(`  • 錯誤總數: ${report.summary.totalErrors}`);
        console.log(`\n📄 詳細報告已保存至:`);
        console.log(`  • nexus-erp-test-report.json (JSON格式)`);
        console.log(`  • nexus-erp-test-report.md (Markdown格式)`);
        
        return report;
    }

    generateMarkdownReport(report) {
        let markdown = `# NexusERP 全面測試報告\n\n`;
        markdown += `**測試時間**: ${new Date(report.testDateTime).toLocaleString('zh-TW')}\n`;
        markdown += `**總測試時間**: ${Math.round(report.summary.totalDuration / 1000)}秒\n\n`;
        
        markdown += `## 📊 測試總覽\n\n`;
        markdown += `| 項目 | 數量 |\n`;
        markdown += `|------|------|\n`;
        markdown += `| 測試模組 | ${report.summary.totalModules} |\n`;
        markdown += `| 通過模組 | ${report.summary.passedModules} |\n`;
        markdown += `| 失敗模組 | ${report.summary.failedModules} |\n`;
        markdown += `| 錯誤總數 | ${report.summary.totalErrors} |\n\n`;
        
        // 認證測試結果
        markdown += `## 🔐 認證與授權測試\n\n`;
        const auth = report.results.authentication;
        markdown += `| 測試項目 | 結果 |\n`;
        markdown += `|----------|------|\n`;
        markdown += `| 登入頁面載入 | ${auth.loginPageLoad ? '✅ 通過' : '❌ 失敗'} |\n`;
        markdown += `| 無效登入處理 | ${auth.invalidLoginHandling ? '✅ 通過' : '❌ 失敗'} |\n`;
        markdown += `| 有效登入 | ${auth.validLogin ? '✅ 通過' : '❌ 失敗'} |\n`;
        markdown += `| 登出功能 | ${auth.logout ? '✅ 通過' : '❌ 失敗'} |\n\n`;
        
        // 導航測試結果
        markdown += `## 🧭 導航和路由測試\n\n`;
        markdown += `| 路由 | 狀態 | 頁面標題 |\n`;
        markdown += `|------|------|----------|\n`;
        Object.entries(report.results.navigation.routes || {}).forEach(([path, result]) => {
            const status = result.accessible ? '✅ 可存取' : '❌ 無法存取';
            markdown += `| ${path} | ${status} | ${result.title || 'N/A'} |\n`;
        });
        markdown += `\n`;
        
        // 模組測試結果
        markdown += `## 📦 主要模組測試\n\n`;
        Object.entries(report.results.modules).forEach(([moduleName, moduleResult]) => {
            if (moduleName !== 'duration' && typeof moduleResult === 'object') {
                markdown += `### ${this.getModuleName(moduleName)}\n\n`;
                if (moduleResult.error) {
                    markdown += `❌ **錯誤**: ${moduleResult.error}\n\n`;
                } else {
                    markdown += `| 測試項目 | 結果 |\n`;
                    markdown += `|----------|------|\n`;
                    Object.entries(moduleResult).forEach(([testName, testResult]) => {
                        const status = testResult ? '✅ 通過' : '❌ 失敗';
                        markdown += `| ${this.getTestName(testName)} | ${status} |\n`;
                    });
                    markdown += `\n`;
                }
            }
        });
        
        // API 測試結果
        markdown += `## 🔌 API 整合測試\n\n`;
        markdown += `| API 端點 | 狀態碼 | 結果 |\n`;
        markdown += `|----------|--------|------|\n`;
        Object.entries(report.results.api.endpoints || {}).forEach(([endpoint, result]) => {
            const status = result.success ? '✅ 成功' : '❌ 失敗';
            markdown += `| ${endpoint} | ${result.status || 'N/A'} | ${status} |\n`;
        });
        markdown += `\n`;
        
        // 效能測試結果
        markdown += `## ⚡ 效能測試\n\n`;
        markdown += `| 頁面 | 載入時間 (ms) | DOM載入時間 (ms) |\n`;
        markdown += `|------|---------------|------------------|\n`;
        Object.entries(report.results.performance.pages || {}).forEach(([path, metrics]) => {
            if (!metrics.error) {
                markdown += `| ${path} | ${metrics.totalLoadTime} | ${Math.round(metrics.domContentLoaded)} |\n`;
            }
        });
        markdown += `\n`;
        
        // 響應式設計測試
        markdown += `## 📱 響應式設計測試\n\n`;
        markdown += `| 裝置類型 | 解析度 | 導航可見 | 內容可見 |\n`;
        markdown += `|----------|--------|----------|----------|\n`;
        Object.entries(report.results.ui.responsiveness || {}).forEach(([deviceName, result]) => {
            if (!result.error) {
                const navStatus = result.navigationVisible ? '✅' : '❌';
                const contentStatus = result.contentVisible ? '✅' : '❌';
                markdown += `| ${deviceName} | ${result.viewport.width}x${result.viewport.height} | ${navStatus} | ${contentStatus} |\n`;
            }
        });
        markdown += `\n`;
        
        // 錯誤列表
        if (report.results.errors.length > 0) {
            markdown += `## ❌ 發現的錯誤\n\n`;
            report.results.errors.forEach((error, index) => {
                markdown += `### 錯誤 ${index + 1}: ${error.type}\n`;
                markdown += `**詳情**: ${error.message || error.status || 'N/A'}\n`;
                if (error.url) {
                    markdown += `**URL**: ${error.url}\n`;
                }
                markdown += `\n`;
            });
        }
        
        // 改進建議
        markdown += `## 💡 改進建議\n\n`;
        markdown += `1. **效能優化**: 關注載入時間超過3秒的頁面\n`;
        markdown += `2. **錯誤處理**: 修復發現的API錯誤和控制台錯誤\n`;
        markdown += `3. **響應式設計**: 確保在所有裝置上都能正常顯示\n`;
        markdown += `4. **使用者體驗**: 改善表單驗證和錯誤訊息顯示\n`;
        markdown += `5. **測試覆蓋率**: 增加自動化測試覆蓋更多功能\n\n`;
        
        markdown += `---\n`;
        markdown += `*報告生成時間: ${new Date().toLocaleString('zh-TW')}*\n`;
        
        return markdown;
    }

    getModuleName(moduleName) {
        const names = {
            inventory: '庫存管理',
            products: '產品管理',
            suppliers: '供應商管理',
            customers: '客戶管理',
            orders: '訂單管理',
            reports: '報表管理',
            settings: '設定管理'
        };
        return names[moduleName] || moduleName;
    }

    getTestName(testName) {
        const names = {
            pageLoad: '頁面載入',
            hasTable: '資料表格',
            hasData: '資料存在',
            searchFunction: '搜尋功能',
            filterFunction: '篩選功能',
            hasAddButton: '新增按鈕',
            hasEditFunction: '編輯功能',
            hasSettingsOptions: '設定選項',
            hasCompanySettings: '公司設定',
            hasReportOptions: '報表選項',
            hasCharts: '圖表顯示',
            hasStatusFilter: '狀態篩選'
        };
        return names[testName] || testName;
    }

    async cleanup() {
        if (this.browser) {
            await this.browser.close();
        }
    }

    async runAllTests() {
        try {
            await this.setup();
            
            // 執行所有測試
            await this.testAuthentication();
            await this.testNavigation();
            await this.testMainModules();
            await this.testAPIIntegration();
            await this.testPerformance();
            await this.testUIResponsiveness();
            await this.takeScreenshots();
            
            // 生成報告
            const report = await this.generateReport();
            
            return report;
            
        } catch (error) {
            console.error('測試執行失敗:', error);
            this.testResults.errors.push({
                type: 'Test Execution Error',
                message: error.message
            });
        } finally {
            await this.cleanup();
        }
    }
}

// 執行測試
(async () => {
    const tester = new NexusERPTester();
    await tester.runAllTests();
})();