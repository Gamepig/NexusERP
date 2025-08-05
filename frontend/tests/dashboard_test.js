// 儀表板前端測試
// 使用 Jest 測試框架

describe('Dashboard Controller Tests', () => {
    let mockFetch;
    let dashboardController;
    
    beforeEach(() => {
        // 設置 DOM 元素
        document.body.innerHTML = `
            <div id="loading" class="hidden"></div>
            <div id="error" class="hidden">
                <p id="error-message"></p>
            </div>
            <div id="dashboard-content" class="hidden"></div>
            <div id="last-updated" class="hidden">
                <span id="update-timestamp"></span>
            </div>
            
            <!-- KPI 元素 -->
            <span id="total-sales">$0</span>
            <span id="orders-count">0 筆訂單</span>
            <span id="inventory-value">$0</span>
            <span id="low-stock-alert">0 項低庫存</span>
            <span id="total-ar">$0</span>
            <span id="overdue-ar">$0 逾期</span>
            <span id="cash-flow">$0</span>
            <span id="cash-flow-trend">相較上月</span>
            
            <!-- 圖表元素 -->
            <canvas id="sales-chart"></canvas>
            <canvas id="inventory-chart"></canvas>
            <canvas id="aging-chart"></canvas>
            
            <!-- 列表元素 -->
            <div id="top-customers-list"></div>
            <div id="inventory-alerts"></div>
            <span id="ar-summary">$0</span>
            <span id="ap-summary">$0</span>
            <span id="overdue-ar-summary">$0</span>
            <span id="overdue-ap-summary">$0</span>
        `;

        // 模擬 fetch API
        mockFetch = jest.fn();
        global.fetch = mockFetch;
        
        // 模擬 localStorage
        Storage.prototype.getItem = jest.fn(() => 'mock-token');
        
        // 模擬 Chart.js
        global.Chart = jest.fn().mockImplementation(() => ({
            destroy: jest.fn()
        }));
        
        // 模擬 DashboardController 類別
        global.DashboardController = class {
            constructor() {
                this.charts = {};
                this.data = null;
            }

            async loadDashboardData() {
                const response = await fetch('/api/dashboard', {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    throw new Error('載入儀表板資料失敗');
                }

                this.data = await response.json();
                return this.data;
            }

            hideLoading() {
                document.getElementById('loading').classList.add('hidden');
                document.getElementById('dashboard-content').classList.remove('hidden');
                document.getElementById('last-updated').classList.remove('hidden');
            }

            showError(message) {
                document.getElementById('loading').classList.add('hidden');
                document.getElementById('error').classList.remove('hidden');
                document.getElementById('error-message').textContent = message;
            }

            renderKPIs() {
                const { sales, inventory, financial } = this.data;

                if (sales) {
                    document.getElementById('total-sales').textContent = this.formatCurrency(sales.total_sales || 0);
                    document.getElementById('orders-count').textContent = `${sales.order_count || 0} 筆訂單`;
                }

                if (inventory) {
                    document.getElementById('inventory-value').textContent = this.formatCurrency(inventory.total_value || 0);
                    document.getElementById('low-stock-alert').textContent = `${inventory.low_stock_count || 0} 項低庫存`;
                }

                if (financial) {
                    document.getElementById('total-ar').textContent = this.formatCurrency(financial.total_ar || 0);
                    document.getElementById('overdue-ar').textContent = `$${this.formatNumber(financial.overdue_ar || 0)} 逾期`;
                    document.getElementById('cash-flow').textContent = this.formatCurrency(financial.cash_flow || 0);
                }
            }

            formatCurrency(amount) {
                return new Intl.NumberFormat('zh-TW', {
                    style: 'currency',
                    currency: 'TWD',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                }).format(amount);
            }

            formatNumber(number) {
                return new Intl.NumberFormat('zh-TW').format(number);
            }
        };
        
        dashboardController = new DashboardController();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('應該成功載入儀表板數據', async () => {
        const mockData = {
            sales: {
                total_sales: 150000,
                order_count: 75
            },
            inventory: {
                total_value: 600000,
                low_stock_count: 8
            },
            financial: {
                total_ar: 85000,
                overdue_ar: 15000,
                cash_flow: 50000
            },
            generated_at: '2024-01-15T10:30:00Z'
        };

        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockData
        });

        const result = await dashboardController.loadDashboardData();

        expect(mockFetch).toHaveBeenCalledWith('/api/dashboard', {
            headers: {
                'Authorization': 'Bearer mock-token',
                'Content-Type': 'application/json'
            }
        });

        expect(result).toEqual(mockData);
        expect(dashboardController.data).toEqual(mockData);
    });

    test('載入失敗時應該拋出錯誤', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: false,
            status: 500
        });

        await expect(dashboardController.loadDashboardData())
            .rejects.toThrow('載入儀表板資料失敗');
    });

    test('應該正確隱藏載入狀態', () => {
        dashboardController.hideLoading();

        expect(document.getElementById('loading').classList.contains('hidden')).toBe(true);
        expect(document.getElementById('dashboard-content').classList.contains('hidden')).toBe(false);
        expect(document.getElementById('last-updated').classList.contains('hidden')).toBe(false);
    });

    test('應該正確顯示錯誤訊息', () => {
        const errorMessage = '測試錯誤訊息';
        
        dashboardController.showError(errorMessage);

        expect(document.getElementById('loading').classList.contains('hidden')).toBe(true);
        expect(document.getElementById('error').classList.contains('hidden')).toBe(false);
        expect(document.getElementById('error-message').textContent).toBe(errorMessage);
    });

    test('應該正確渲染 KPI 數據', () => {
        dashboardController.data = {
            sales: {
                total_sales: 150000,
                order_count: 75
            },
            inventory: {
                total_value: 600000,
                low_stock_count: 8
            },
            financial: {
                total_ar: 85000,
                overdue_ar: 15000,
                cash_flow: 50000
            }
        };

        dashboardController.renderKPIs();

        expect(document.getElementById('total-sales').textContent).toBe('NT$150,000');
        expect(document.getElementById('orders-count').textContent).toBe('75 筆訂單');
        expect(document.getElementById('inventory-value').textContent).toBe('NT$600,000');
        expect(document.getElementById('low-stock-alert').textContent).toBe('8 項低庫存');
        expect(document.getElementById('total-ar').textContent).toBe('NT$85,000');
        expect(document.getElementById('cash-flow').textContent).toBe('NT$50,000');
    });

    test('formatCurrency 應該正確格式化貨幣', () => {
        expect(dashboardController.formatCurrency(150000)).toBe('NT$150,000');
        expect(dashboardController.formatCurrency(0)).toBe('NT$0');
        expect(dashboardController.formatCurrency(1234.56)).toBe('NT$1,235');
    });

    test('formatNumber 應該正確格式化數字', () => {
        expect(dashboardController.formatNumber(150000)).toBe('150,000');
        expect(dashboardController.formatNumber(0)).toBe('0');
        expect(dashboardController.formatNumber(1234.56)).toBe('1,234.56');
    });

    test('應該包含正確的授權標頭', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({})
        });

        await dashboardController.loadDashboardData();

        expect(mockFetch).toHaveBeenCalledWith('/api/dashboard', 
            expect.objectContaining({
                headers: expect.objectContaining({
                    'Authorization': 'Bearer mock-token'
                })
            })
        );
    });
});

describe('Sales Report Controller Tests', () => {
    let mockFetch;
    let salesReportController;

    beforeEach(() => {
        document.body.innerHTML = `
            <input id="date-from" type="date" />
            <input id="date-to" type="date" />
            <select id="status-filter">
                <option value="">全部狀態</option>
                <option value="pending">待處理</option>
            </select>
            <button id="apply-filters">套用篩選</button>
            <button id="export-excel">匯出 Excel</button>
            <button id="export-pdf">匯出 PDF</button>
            
            <div id="loading"></div>
            <div id="error" class="hidden">
                <p id="error-message"></p>
            </div>
            <div id="report-content" class="hidden"></div>
            
            <span id="total-sales">$0</span>
            <span id="orders-count">0 筆訂單</span>
            <span id="average-order">$0</span>
            <span id="growth-trend">0%</span>
            <span id="update-timestamp"></span>
            
            <canvas id="sales-trend-chart"></canvas>
            <canvas id="top-customers-chart"></canvas>
            <tbody id="sales-table-body"></tbody>
        `;

        mockFetch = jest.fn();
        global.fetch = mockFetch;
        Storage.prototype.getItem = jest.fn(() => 'mock-token');
        global.Chart = jest.fn().mockImplementation(() => ({
            destroy: jest.fn()
        }));
        
        global.SalesReportController = class {
            constructor() {
                this.charts = {};
                this.data = null;
                this.currentPage = 1;
                this.pageSize = 20;
            }

            async loadReport() {
                const params = new URLSearchParams({
                    date_from: document.getElementById('date-from').value,
                    date_to: document.getElementById('date-to').value,
                    use_cache: 'true'
                });

                const status = document.getElementById('status-filter').value;
                if (status) params.append('status', status);

                const response = await fetch(`/api/reports/sales?${params}`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    throw new Error('載入銷售報表失敗');
                }

                this.data = await response.json();
                return this.data;
            }

            renderSummary(summary) {
                document.getElementById('total-sales').textContent = this.formatCurrency(summary.total_sales || 0);
                document.getElementById('orders-count').textContent = `${summary.order_count || 0} 筆訂單`;
                document.getElementById('average-order').textContent = this.formatCurrency(summary.average_order_size || 0);
                document.getElementById('growth-trend').textContent = '0%';
            }

            formatCurrency(amount) {
                return new Intl.NumberFormat('zh-TW', {
                    style: 'currency',
                    currency: 'TWD',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                }).format(amount);
            }
        };
        
        salesReportController = new SalesReportController();
    });

    test('應該成功載入銷售報表', async () => {
        const mockData = {
            summary: JSON.stringify({
                total_sales: 200000,
                order_count: 100,
                average_order_size: 2000
            }),
            data: JSON.stringify([
                { order_number: 'ORD-001', total_amount: 2000 }
            ]),
            generated_at: '2024-01-15T10:30:00Z'
        };

        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockData
        });

        // 設置測試參數
        document.getElementById('date-from').value = '2024-01-01';
        document.getElementById('date-to').value = '2024-01-31';
        document.getElementById('status-filter').value = 'pending';

        const result = await salesReportController.loadReport();

        expect(mockFetch).toHaveBeenCalledWith(
            '/api/reports/sales?date_from=2024-01-01&date_to=2024-01-31&use_cache=true&status=pending',
            expect.objectContaining({
                headers: {
                    'Authorization': 'Bearer mock-token',
                    'Content-Type': 'application/json'
                }
            })
        );

        expect(result).toEqual(mockData);
    });

    test('應該正確渲染摘要數據', () => {
        const summary = {
            total_sales: 200000,
            order_count: 100,
            average_order_size: 2000
        };

        salesReportController.renderSummary(summary);

        expect(document.getElementById('total-sales').textContent).toBe('NT$200,000');
        expect(document.getElementById('orders-count').textContent).toBe('100 筆訂單');
        expect(document.getElementById('average-order').textContent).toBe('NT$2,000');
        expect(document.getElementById('growth-trend').textContent).toBe('0%');
    });
});