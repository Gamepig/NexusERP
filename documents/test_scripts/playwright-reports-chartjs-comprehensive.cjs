const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

class NexusERPReportsChartJSTester {
    constructor() {
        this.browser = null;
        this.context = null;
        this.page = null;
        this.testResults = {
            authentication: {},
            reportPages: {},
            chartFunctionality: {},
            jsErrors: [],
            screenshots: [],
            summary: {}
        };
        this.testCredentials = {
            email: 'test@example.com',
            password: 'password123'
        };
        this.reportPages = [
            { path: '/reports', name: 'Main Reports Center', description: 'Reports dashboard with overview cards' },
            { path: '/reports/sales', name: 'Sales Reports', description: 'Sales analytics and charts' },
            { path: '/reports/financial', name: 'Financial Reports', description: 'Financial dashboard and metrics' },
            { path: '/reports/inventory', name: 'Inventory Reports', description: 'Inventory level charts and analytics' },
            { path: '/reports/purchase', name: 'Purchase Reports', description: 'Purchase order analytics' }
        ];
    }

    async setup() {
        console.log('🚀 Starting NexusERP Reports Chart.js Comprehensive Testing...\n');
        
        this.browser = await chromium.launch({
            headless: false,
            slowMo: 1000, // Slower to better observe chart rendering
            args: ['--disable-web-security', '--disable-features=VizDisplayCompositor']
        });
        
        this.context = await this.browser.newContext({
            viewport: { width: 1920, height: 1080 },
            ignoreHTTPSErrors: true
        });
        
        this.page = await this.context.newPage();
        
        // Enhanced network monitoring
        this.page.on('request', request => {
            const url = request.url();
            if (url.includes('chart') || url.includes('Chart') || url.includes('.js')) {
                console.log('📤 Chart-related request:', request.method(), url);
            }
        });
        
        this.page.on('response', response => {
            const url = response.url();
            if (response.status() >= 400) {
                console.log('❌ HTTP Error:', response.status(), url);
                this.testResults.jsErrors.push({
                    type: 'HTTP Error',
                    status: response.status(),
                    url: url,
                    timestamp: new Date().toISOString()
                });
            }
            
            // Track Chart.js library loading
            if (url.includes('chart') || url.includes('Chart')) {
                console.log('📊 Chart.js related response:', response.status(), url);
            }
        });
        
        // Enhanced console monitoring for Chart.js specific errors
        this.page.on('console', msg => {
            const text = msg.text();
            if (msg.type() === 'error') {
                console.log('🐛 Console Error:', text);
                this.testResults.jsErrors.push({
                    type: 'Console Error',
                    message: text,
                    timestamp: new Date().toISOString()
                });
            }
            
            // Track Chart.js specific messages
            if (text.includes('Chart') || text.includes('canvas') || text.includes('chart')) {
                console.log('📊 Chart-related console message:', msg.type(), text);
            }
        });
        
        // Monitor JavaScript errors
        this.page.on('pageerror', error => {
            console.log('💥 Page Error:', error.message);
            this.testResults.jsErrors.push({
                type: 'Page Error',
                message: error.message,
                stack: error.stack,
                timestamp: new Date().toISOString()
            });
        });
    }

    async authenticate() {
        console.log('🔐 Authenticating with test credentials...');
        
        try {
            await this.page.goto('http://127.0.0.1:8000/login');
            await this.page.waitForSelector('form', { timeout: 10000 });
            
            await this.page.fill('input[name="email"]', this.testCredentials.email);
            await this.page.fill('input[name="password"]', this.testCredentials.password);
            await this.page.click('button[type="submit"]');
            
            await this.page.waitForURL('**/dashboard', { timeout: 15000 });
            this.testResults.authentication.success = true;
            console.log('✅ Authentication successful');
            
        } catch (error) {
            console.log('❌ Authentication failed:', error.message);
            this.testResults.authentication.success = false;
            this.testResults.authentication.error = error.message;
            throw error;
        }
    }

    async testReportPage(reportPage) {
        console.log(`\n📊 Testing ${reportPage.name} (${reportPage.path})...`);
        
        const pageResult = {
            name: reportPage.name,
            path: reportPage.path,
            description: reportPage.description,
            accessible: false,
            chartsFound: false,
            canvasElements: 0,
            chartJsLoaded: false,
            actualChartsRendered: false,
            interactiveFeatures: false,
            loadTime: 0,
            errors: [],
            chartDetails: []
        };

        try {
            const startTime = Date.now();
            
            // Navigate to report page
            await this.page.goto(`http://127.0.0.1:8000${reportPage.path}`);
            await this.page.waitForLoadState('networkidle', { timeout: 15000 });
            
            pageResult.accessible = true;
            pageResult.loadTime = Date.now() - startTime;
            
            console.log(`  ✅ Page accessible - Load time: ${pageResult.loadTime}ms`);
            
            // Wait for potential dynamic content loading
            await this.page.waitForTimeout(3000);
            
            // Check for Chart.js library
            const chartJsLoaded = await this.page.evaluate(() => {
                return typeof window.Chart !== 'undefined';
            });
            pageResult.chartJsLoaded = chartJsLoaded;
            console.log(`  📚 Chart.js library loaded: ${chartJsLoaded ? '✅ Yes' : '❌ No'}`);
            
            // Count canvas elements
            const canvasElements = await this.page.locator('canvas').count();
            pageResult.canvasElements = canvasElements;
            console.log(`  🖼️ Canvas elements found: ${canvasElements}`);
            
            if (canvasElements > 0) {
                pageResult.chartsFound = true;
                
                // Detailed analysis of each canvas element
                for (let i = 0; i < canvasElements; i++) {
                    const canvasInfo = await this.page.evaluate((index) => {
                        const canvas = document.querySelectorAll('canvas')[index];
                        if (!canvas) return null;
                        
                        const rect = canvas.getBoundingClientRect();
                        const ctx = canvas.getContext('2d');
                        
                        // Check if canvas has actual content (not just empty)
                        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                        const hasContent = imageData.data.some(pixel => pixel !== 0);
                        
                        return {
                            index: index,
                            width: canvas.width,
                            height: canvas.height,
                            visible: rect.width > 0 && rect.height > 0,
                            hasContent: hasContent,
                            id: canvas.id || null,
                            className: canvas.className || null,
                            parentElement: canvas.parentElement?.tagName || null
                        };
                    }, i);
                    
                    if (canvasInfo) {
                        pageResult.chartDetails.push(canvasInfo);
                        
                        if (canvasInfo.hasContent) {
                            pageResult.actualChartsRendered = true;
                        }
                        
                        console.log(`    📈 Canvas ${i + 1}: ${canvasInfo.width}x${canvasInfo.height}, Visible: ${canvasInfo.visible ? '✅' : '❌'}, Has Content: ${canvasInfo.hasContent ? '✅' : '❌'}`);
                    }
                }
            }
            
            // Check for loading indicators or placeholder text
            const loadingIndicators = await this.page.locator('text="Loading", text="loading", text="載入中", .loading, .spinner').count();
            if (loadingIndicators > 0) {
                console.log(`  ⏳ Loading indicators still present: ${loadingIndicators}`);
                pageResult.errors.push(`Still showing ${loadingIndicators} loading indicator(s)`);
            }
            
            // Test chart interactivity (hover, click)
            if (canvasElements > 0) {
                try {
                    const firstCanvas = this.page.locator('canvas').first();
                    await firstCanvas.hover();
                    await this.page.waitForTimeout(1000);
                    
                    // Check if tooltip or interaction appeared
                    const tooltips = await this.page.locator('.tooltip, .chart-tooltip, [role="tooltip"]').count();
                    if (tooltips > 0) {
                        pageResult.interactiveFeatures = true;
                        console.log(`  🎯 Interactive features detected: ${tooltips} tooltip(s)`);
                    }
                } catch (error) {
                    console.log(`  ⚠️ Chart interaction test failed: ${error.message}`);
                }
            }
            
            // Take screenshot
            const screenshotPath = `test-reports-${reportPage.name.toLowerCase().replace(/\s+/g, '-')}.png`;
            await this.page.screenshot({
                path: screenshotPath,
                fullPage: true
            });
            
            this.testResults.screenshots.push({
                page: reportPage.name,
                path: screenshotPath,
                canvasCount: pageResult.canvasElements,
                actualChartsRendered: pageResult.actualChartsRendered
            });
            
            console.log(`  📸 Screenshot saved: ${screenshotPath}`);
            
        } catch (error) {
            console.log(`  ❌ Error testing ${reportPage.name}: ${error.message}`);
            pageResult.errors.push(error.message);
        }
        
        this.testResults.reportPages[reportPage.path] = pageResult;
        return pageResult;
    }

    async testAllReportPages() {
        console.log('\n🔍 Testing all report pages systematically...');
        
        for (const reportPage of this.reportPages) {
            await this.testReportPage(reportPage);
            
            // Short delay between tests
            await this.page.waitForTimeout(2000);
        }
    }

    async performChartJSFunctionalityTests() {
        console.log('\n🧪 Performing Chart.js functionality verification tests...');
        
        const functionalityResults = {
            libraryAvailable: false,
            chartInstancesFound: 0,
            chartTypes: [],
            dataVisualization: false,
            responsive: false,
            animationsWorking: false
        };
        
        try {
            // Go to the main reports page for general Chart.js testing
            await this.page.goto('http://127.0.0.1:8000/reports');
            await this.page.waitForLoadState('networkidle', { timeout: 10000 });
            await this.page.waitForTimeout(5000); // Extra time for charts to render
            
            // Test Chart.js availability and functionality
            const chartJsInfo = await this.page.evaluate(() => {
                const results = {
                    libraryAvailable: typeof window.Chart !== 'undefined',
                    chartInstancesFound: 0,
                    chartTypes: [],
                    globalChartObject: null
                };
                
                if (window.Chart) {
                    results.globalChartObject = {
                        version: window.Chart.version || 'unknown',
                        defaults: !!window.Chart.defaults,
                        controllers: Object.keys(window.Chart.controllers || {}),
                        plugins: Object.keys(window.Chart.plugins || {})
                    };
                    
                    // Try to find existing chart instances
                    const canvases = document.querySelectorAll('canvas');
                    canvases.forEach(canvas => {
                        if (canvas.chart || canvas.__chart) {
                            results.chartInstancesFound++;
                            const chartInstance = canvas.chart || canvas.__chart;
                            if (chartInstance.config && chartInstance.config.type) {
                                results.chartTypes.push(chartInstance.config.type);
                            }
                        }
                    });
                }
                
                return results;
            });
            
            functionalityResults.libraryAvailable = chartJsInfo.libraryAvailable;
            functionalityResults.chartInstancesFound = chartJsInfo.chartInstancesFound;
            functionalityResults.chartTypes = [...new Set(chartJsInfo.chartTypes)]; // Remove duplicates
            
            console.log(`  📚 Chart.js Library: ${functionalityResults.libraryAvailable ? '✅ Available' : '❌ Not Available'}`);
            if (chartJsInfo.globalChartObject) {
                console.log(`  📊 Chart.js Version: ${chartJsInfo.globalChartObject.version}`);
                console.log(`  🎛️ Available Controllers: ${chartJsInfo.globalChartObject.controllers.length}`);
            }
            console.log(`  📈 Active Chart Instances: ${functionalityResults.chartInstancesFound}`);
            console.log(`  📊 Chart Types Found: ${functionalityResults.chartTypes.join(', ') || 'None'}`);
            
        } catch (error) {
            console.log(`  ❌ Chart.js functionality test failed: ${error.message}`);
            functionalityResults.error = error.message;
        }
        
        this.testResults.chartFunctionality = functionalityResults;
    }

    async generateComprehensiveReport() {
        console.log('\n📋 Generating comprehensive test report...');
        
        const summary = {
            totalPages: this.reportPages.length,
            accessiblePages: 0,
            pagesWithCharts: 0,
            pagesWithActualCharts: 0,
            totalCanvasElements: 0,
            totalJsErrors: this.testResults.jsErrors.length,
            chartJsAvailable: this.testResults.chartFunctionality.libraryAvailable,
            chartInstancesFound: this.testResults.chartFunctionality.chartInstancesFound
        };
        
        // Calculate summary statistics
        Object.values(this.testResults.reportPages).forEach(page => {
            if (page.accessible) summary.accessiblePages++;
            if (page.chartsFound) summary.pagesWithCharts++;
            if (page.actualChartsRendered) summary.pagesWithActualCharts++;
            summary.totalCanvasElements += page.canvasElements;
        });
        
        this.testResults.summary = summary;
        
        // Create detailed JSON report
        const detailedReport = {
            testDateTime: new Date().toISOString(),
            testCredentials: {
                email: this.testCredentials.email,
                // Don't include password in report
            },
            summary: summary,
            authentication: this.testResults.authentication,
            reportPages: this.testResults.reportPages,
            chartFunctionality: this.testResults.chartFunctionality,
            jsErrors: this.testResults.jsErrors,
            screenshots: this.testResults.screenshots,
            evidenceBasedFindings: this.generateEvidenceBasedFindings()
        };
        
        // Save JSON report
        fs.writeFileSync('nexus-erp-reports-chartjs-test.json', JSON.stringify(detailedReport, null, 2));
        
        // Generate and save markdown report
        const markdownReport = this.generateMarkdownReport(detailedReport);
        fs.writeFileSync('nexus-erp-reports-chartjs-test.md', markdownReport);
        
        // Console summary
        console.log('\n📊 TEST SUMMARY - EVIDENCE-BASED FINDINGS:');
        console.log('═══════════════════════════════════════════');
        console.log(`📄 Pages Tested: ${summary.totalPages}`);
        console.log(`✅ Accessible Pages: ${summary.accessiblePages}/${summary.totalPages}`);
        console.log(`📊 Chart.js Library Available: ${summary.chartJsAvailable ? '✅ YES' : '❌ NO'}`);
        console.log(`🖼️ Total Canvas Elements: ${summary.totalCanvasElements}`);
        console.log(`📈 Pages with Canvas Elements: ${summary.pagesWithCharts}/${summary.totalPages}`);
        console.log(`🎨 Pages with ACTUAL Rendered Charts: ${summary.pagesWithActualCharts}/${summary.totalPages}`);
        console.log(`⚡ Chart Instances Active: ${summary.chartInstancesFound}`);
        console.log(`🐛 JavaScript Errors: ${summary.totalJsErrors}`);
        console.log(`📸 Screenshots Captured: ${this.testResults.screenshots.length}`);
        
        console.log('\n📄 DETAILED EVIDENCE:');
        console.log('─────────────────────');
        Object.values(this.testResults.reportPages).forEach(page => {
            const status = page.accessible ? '✅' : '❌';
            const charts = page.actualChartsRendered ? `📊 (${page.canvasElements} canvas, rendered)` : 
                          page.canvasElements > 0 ? `⚪ (${page.canvasElements} canvas, not rendered)` : '❌ (no canvas)';
            console.log(`${status} ${page.name}: ${charts}`);
        });
        
        if (this.testResults.jsErrors.length > 0) {
            console.log('\n🐛 JAVASCRIPT ERRORS DETECTED:');
            console.log('──────────────────────────────');
            this.testResults.jsErrors.forEach((error, index) => {
                console.log(`${index + 1}. [${error.type}] ${error.message}`);
            });
        }
        
        console.log('\n📁 REPORTS GENERATED:');
        console.log('─────────────────────');
        console.log('• nexus-erp-reports-chartjs-test.json (Detailed JSON)');
        console.log('• nexus-erp-reports-chartjs-test.md (Markdown Report)');
        this.testResults.screenshots.forEach(screenshot => {
            console.log(`• ${screenshot.path} - ${screenshot.page} (${screenshot.canvasCount} canvas elements)`);
        });
        
        return detailedReport;
    }

    generateEvidenceBasedFindings() {
        const findings = {
            chartJsImplementationStatus: 'NOT_IMPLEMENTED',
            actualVisualizationWorking: false,
            recommendedActions: [],
            technicalEvidence: []
        };
        
        // Analyze evidence
        if (!this.testResults.chartFunctionality.libraryAvailable) {
            findings.chartJsImplementationStatus = 'LIBRARY_NOT_LOADED';
            findings.recommendedActions.push('Load Chart.js library in application');
            findings.technicalEvidence.push('window.Chart is undefined');
        } else if (this.testResults.chartFunctionality.chartInstancesFound === 0) {
            findings.chartJsImplementationStatus = 'LIBRARY_LOADED_BUT_NOT_USED';
            findings.recommendedActions.push('Create chart instances and bind to canvas elements');
            findings.technicalEvidence.push('Chart.js loaded but no active chart instances found');
        } else {
            findings.chartJsImplementationStatus = 'PARTIALLY_IMPLEMENTED';
            findings.technicalEvidence.push(`${this.testResults.chartFunctionality.chartInstancesFound} chart instances found`);
        }
        
        // Check for actual rendering
        const pagesWithActualCharts = Object.values(this.testResults.reportPages).filter(p => p.actualChartsRendered).length;
        if (pagesWithActualCharts > 0) {
            findings.actualVisualizationWorking = true;
        } else {
            findings.recommendedActions.push('Verify chart data binding and rendering logic');
            findings.technicalEvidence.push('Canvas elements present but no visual content detected');
        }
        
        return findings;
    }

    generateMarkdownReport(report) {
        let markdown = `# NexusERP Reports Chart.js Comprehensive Test Report\n\n`;
        markdown += `**Test Date/Time**: ${new Date(report.testDateTime).toLocaleString()}\n`;
        markdown += `**Test Credentials**: ${report.testCredentials.email}\n`;
        markdown += `**Test Focus**: Chart.js functionality and data visualization verification\n\n`;
        
        markdown += `## 🎯 EXECUTIVE SUMMARY\n\n`;
        markdown += `This report provides **evidence-based verification** of Chart.js implementation status in NexusERP reports system.\n\n`;
        
        const summary = report.summary;
        markdown += `### Key Findings\n`;
        markdown += `- **Pages Tested**: ${summary.totalPages}\n`;
        markdown += `- **Chart.js Library**: ${summary.chartJsAvailable ? '✅ Available' : '❌ Not Available'}\n`;
        markdown += `- **Canvas Elements**: ${summary.totalCanvasElements} total found\n`;
        markdown += `- **Actual Charts Rendered**: ${summary.pagesWithActualCharts}/${summary.totalPages} pages\n`;
        markdown += `- **Active Chart Instances**: ${summary.chartInstancesFound}\n`;
        markdown += `- **JavaScript Errors**: ${summary.totalJsErrors}\n\n`;
        
        markdown += `## 📊 DETAILED PAGE ANALYSIS\n\n`;
        markdown += `| Page | Status | Canvas Count | Charts Rendered | Load Time | Interactive |\n`;
        markdown += `|------|--------|--------------|----------------|-----------|-------------|\n`;
        
        Object.values(report.reportPages).forEach(page => {
            const status = page.accessible ? '✅ Accessible' : '❌ Failed';
            const rendered = page.actualChartsRendered ? '✅ Yes' : (page.canvasElements > 0 ? '⚪ Empty' : '❌ None');
            const interactive = page.interactiveFeatures ? '✅ Yes' : '❌ No';
            markdown += `| ${page.name} | ${status} | ${page.canvasElements} | ${rendered} | ${page.loadTime}ms | ${interactive} |\n`;
        });
        
        markdown += `\n## 🔍 TECHNICAL EVIDENCE\n\n`;
        
        Object.values(report.reportPages).forEach(page => {
            markdown += `### ${page.name} (${page.path})\n\n`;
            markdown += `**Description**: ${page.description}\n\n`;
            
            if (page.accessible) {
                markdown += `- ✅ Page accessible (${page.loadTime}ms load time)\n`;
                markdown += `- Canvas elements: ${page.canvasElements}\n`;
                markdown += `- Charts rendered: ${page.actualChartsRendered ? '✅ Yes' : '❌ No'}\n`;
                
                if (page.chartDetails.length > 0) {
                    markdown += `\n**Canvas Element Details**:\n`;
                    page.chartDetails.forEach((canvas, index) => {
                        markdown += `- Canvas ${index + 1}: ${canvas.width}x${canvas.height}, `;
                        markdown += `Visible: ${canvas.visible ? '✅' : '❌'}, `;
                        markdown += `Content: ${canvas.hasContent ? '✅' : '❌'}\n`;
                    });
                }
                
                if (page.errors.length > 0) {
                    markdown += `\n**Issues Found**:\n`;
                    page.errors.forEach(error => {
                        markdown += `- ⚠️ ${error}\n`;
                    });
                }
            } else {
                markdown += `- ❌ Page not accessible\n`;
                if (page.errors.length > 0) {
                    markdown += `- Error: ${page.errors[0]}\n`;
                }
            }
            
            markdown += `\n`;
        });
        
        // Chart.js Functionality Section
        markdown += `## 📚 CHART.JS LIBRARY ANALYSIS\n\n`;
        const chartFunc = report.chartFunctionality;
        markdown += `- **Library Available**: ${chartFunc.libraryAvailable ? '✅ Yes' : '❌ No'}\n`;
        markdown += `- **Active Chart Instances**: ${chartFunc.chartInstancesFound}\n`;
        if (chartFunc.chartTypes && chartFunc.chartTypes.length > 0) {
            markdown += `- **Chart Types Found**: ${chartFunc.chartTypes.join(', ')}\n`;
        }
        
        // JavaScript Errors Section
        if (report.jsErrors.length > 0) {
            markdown += `\n## 🐛 JAVASCRIPT ERRORS\n\n`;
            report.jsErrors.forEach((error, index) => {
                markdown += `### Error ${index + 1}: ${error.type}\n`;
                markdown += `**Message**: ${error.message}\n`;
                markdown += `**Time**: ${error.timestamp}\n`;
                if (error.url) markdown += `**URL**: ${error.url}\n`;
                markdown += `\n`;
            });
        }
        
        // Evidence-Based Findings
        markdown += `## 🎯 EVIDENCE-BASED FINDINGS\n\n`;
        const findings = report.evidenceBasedFindings;
        markdown += `### Implementation Status\n`;
        markdown += `**Status**: ${findings.chartJsImplementationStatus}\n\n`;
        
        markdown += `### Technical Evidence\n`;
        findings.technicalEvidence.forEach(evidence => {
            markdown += `- ${evidence}\n`;
        });
        
        markdown += `\n### Recommended Actions\n`;
        findings.recommendedActions.forEach(action => {
            markdown += `1. ${action}\n`;
        });
        
        // Screenshots Section
        markdown += `\n## 📸 VISUAL EVIDENCE (Screenshots)\n\n`;
        report.screenshots.forEach(screenshot => {
            markdown += `### ${screenshot.page}\n`;
            markdown += `![${screenshot.page}](${screenshot.path})\n`;
            markdown += `- Canvas elements: ${screenshot.canvasCount}\n`;
            markdown += `- Charts rendered: ${screenshot.actualChartsRendered ? '✅ Yes' : '❌ No'}\n\n`;
        });
        
        markdown += `---\n`;
        markdown += `*Report generated: ${new Date().toLocaleString()}*\n`;
        markdown += `*Testing methodology: Evidence-based verification with actual DOM inspection*\n`;
        
        return markdown;
    }

    async cleanup() {
        if (this.browser) {
            await this.browser.close();
        }
    }

    async runComprehensiveTest() {
        try {
            await this.setup();
            await this.authenticate();
            await this.testAllReportPages();
            await this.performChartJSFunctionalityTests();
            
            const report = await this.generateComprehensiveReport();
            return report;
            
        } catch (error) {
            console.error('❌ Comprehensive test execution failed:', error);
            this.testResults.jsErrors.push({
                type: 'Test Execution Error',
                message: error.message,
                timestamp: new Date().toISOString()
            });
        } finally {
            await this.cleanup();
        }
    }
}

// Execute the comprehensive test
(async () => {
    const tester = new NexusERPReportsChartJSTester();
    console.log('🔬 NEXUSERP REPORTS CHART.JS COMPREHENSIVE TESTING');
    console.log('═══════════════════════════════════════════════════');
    console.log('📋 Test Objectives:');
    console.log('   1. Verify Chart.js library loading and availability');
    console.log('   2. Count and analyze canvas elements on each report page');
    console.log('   3. Verify actual chart rendering (not just placeholders)');
    console.log('   4. Test chart interactivity and functionality');
    console.log('   5. Capture visual evidence with screenshots');
    console.log('   6. Document JavaScript errors and issues');
    console.log('   7. Provide evidence-based recommendations\n');
    
    await tester.runComprehensiveTest();
})();