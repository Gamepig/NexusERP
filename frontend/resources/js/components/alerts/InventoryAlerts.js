// Inventory Alerts Dashboard Component
class InventoryAlerts {
    constructor(container) {
        this.container = container;
        this.state = window.stocktakingState;
        this.filters = {
            status: 'ACTIVE',
            alert_type_id: '',
            product_id: '',
            warehouse_id: '',
            limit: 20,
            offset: 0
        };
        
        this.init();
    }

    init() {
        this.render();
        this.bindEvents();
        this.loadData();
        
        // Subscribe to state changes
        this.unsubscribe = this.state.subscribe((state) => {
            this.renderAlerts(state.inventoryAlerts);
            this.updateLoadingState(state.loading);
            this.showError(state.error);
        });
    }

    destroy() {
        if (this.unsubscribe) {
            this.unsubscribe();
        }
    }

    render() {
        this.container.innerHTML = `
            <div class="inventory-alerts">
                <div class="header mb-6">
                    <div class="flex justify-between items-center">
                        <h2 class="text-2xl font-bold text-gray-900">庫存警示</h2>
                        <div class="flex space-x-2">
                            <button id="refresh-alerts" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                                刷新
                            </button>
                            <button id="alert-settings" class="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors">
                                警示設定
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Alert Summary Cards -->
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div class="bg-red-100 rounded-lg p-4 border-l-4 border-red-500">
                        <div class="flex items-center">
                            <div class="text-red-600">
                                <svg class="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
                                </svg>
                            </div>
                            <div class="ml-4">
                                <p class="text-sm font-medium text-red-800">緊急警示</p>
                                <p id="critical-count" class="text-2xl font-bold text-red-900">0</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="bg-yellow-100 rounded-lg p-4 border-l-4 border-yellow-500">
                        <div class="flex items-center">
                            <div class="text-yellow-600">
                                <svg class="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path>
                                </svg>
                            </div>
                            <div class="ml-4">
                                <p class="text-sm font-medium text-yellow-800">活躍警示</p>
                                <p id="active-count" class="text-2xl font-bold text-yellow-900">0</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="bg-green-100 rounded-lg p-4 border-l-4 border-green-500">
                        <div class="flex items-center">
                            <div class="text-green-600">
                                <svg class="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                                </svg>
                            </div>
                            <div class="ml-4">
                                <p class="text-sm font-medium text-green-800">已解決</p>
                                <p id="resolved-count" class="text-2xl font-bold text-green-900">0</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="bg-gray-100 rounded-lg p-4 border-l-4 border-gray-500">
                        <div class="flex items-center">
                            <div class="text-gray-600">
                                <svg class="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd"></path>
                                </svg>
                            </div>
                            <div class="ml-4">
                                <p class="text-sm font-medium text-gray-800">總計</p>
                                <p id="total-count" class="text-2xl font-bold text-gray-900">0</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Filters -->
                <div class="filters mb-6">
                    <div class="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 bg-gray-50 rounded-lg">
                        <select id="status-filter" class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="ACTIVE">活躍警示</option>
                            <option value="RESOLVED">已解決</option>
                            <option value="DISMISSED">已忽略</option>
                            <option value="">全部狀態</option>
                        </select>
                        
                        <select id="alert-type-filter" class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="">全部類型</option>
                            <option value="LOW_STOCK">庫存不足</option>
                            <option value="OUT_OF_STOCK">無庫存</option>
                            <option value="OVERSTOCK">庫存過量</option>
                            <option value="EXPIRED_STOCK">庫存過期</option>
                            <option value="SLOW_MOVING">滯銷商品</option>
                        </select>
                        
                        <select id="warehouse-filter" class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="">全部倉庫</option>
                        </select>
                        
                        <button id="apply-filters" class="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors">
                            套用篩選
                        </button>
                        
                        <button id="reset-filters" class="bg-gray-400 text-white px-4 py-2 rounded-md hover:bg-gray-500 transition-colors">
                            重設
                        </button>
                    </div>
                </div>

                <div id="loading-indicator" class="hidden text-center py-4">
                    <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span class="ml-2">載入中...</span>
                </div>

                <div id="error-message" class="hidden bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4"></div>

                <!-- Alerts List -->
                <div class="bg-white rounded-lg shadow-md">
                    <div class="p-6">
                        <div class="flex justify-between items-center mb-4">
                            <h3 class="text-lg font-semibold">警示清單</h3>
                            <div class="flex space-x-2">
                                <select id="sort-by" class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                                    <option value="triggered_at">觸發時間</option>
                                    <option value="severity_level">嚴重程度</option>
                                    <option value="product_name">產品名稱</option>
                                </select>
                                <button id="export-alerts" class="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors">
                                    匯出
                                </button>
                            </div>
                        </div>
                        
                        <div id="alerts-container">
                            <!-- Alerts will be rendered here -->
                        </div>
                        
                        <div id="alerts-pagination" class="mt-6">
                            <!-- Pagination will be rendered here -->
                        </div>
                    </div>
                </div>

                <!-- Alert Detail Modal -->
                <div id="alert-modal" class="hidden fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div class="relative top-20 mx-auto p-5 border max-w-2xl shadow-lg rounded-md bg-white">
                        <div class="mt-3">
                            <div class="flex justify-between items-center mb-4">
                                <h3 class="text-lg font-medium text-gray-900">警示詳情</h3>
                                <button id="close-alert-modal" class="text-gray-400 hover:text-gray-600">
                                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                                    </svg>
                                </button>
                            </div>
                            
                            <div id="alert-detail-content">
                                <!-- Alert details will be rendered here -->
                            </div>
                            
                            <div class="mt-6 flex justify-end space-x-2">
                                <button id="dismiss-alert" class="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors">
                                    忽略警示
                                </button>
                                <button id="resolve-alert" class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors">
                                    解決警示
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    bindEvents() {
        // Filter events
        document.getElementById('apply-filters').addEventListener('click', () => {
            this.applyFilters();
        });

        document.getElementById('reset-filters').addEventListener('click', () => {
            this.resetFilters();
        });

        // Refresh button
        document.getElementById('refresh-alerts').addEventListener('click', () => {
            this.loadData();
        });

        // Modal events
        document.getElementById('close-alert-modal').addEventListener('click', () => {
            this.hideAlertModal();
        });

        document.getElementById('resolve-alert').addEventListener('click', () => {
            this.resolveCurrentAlert();
        });

        document.getElementById('dismiss-alert').addEventListener('click', () => {
            this.dismissCurrentAlert();
        });

        // Sort change
        document.getElementById('sort-by').addEventListener('change', () => {
            this.loadData();
        });
    }

    loadData() {
        this.state.loadInventoryAlerts(this.filters);
    }

    applyFilters() {
        this.filters.status = document.getElementById('status-filter').value;
        this.filters.alert_type_id = document.getElementById('alert-type-filter').value;
        this.filters.warehouse_id = document.getElementById('warehouse-filter').value;
        this.filters.offset = 0; // Reset pagination
        this.loadData();
    }

    resetFilters() {
        this.filters = { status: 'ACTIVE', alert_type_id: '', warehouse_id: '', limit: 20, offset: 0 };
        document.getElementById('status-filter').value = 'ACTIVE';
        document.getElementById('alert-type-filter').value = '';
        document.getElementById('warehouse-filter').value = '';
        this.loadData();
    }

    renderAlerts(alerts) {
        this.updateSummaryCards(alerts);
        
        const container = document.getElementById('alerts-container');
        
        if (!alerts || alerts.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <div class="text-6xl mb-4">🔔</div>
                    <p class="text-lg">暫無警示</p>
                    <p class="text-sm">所有庫存狀況正常</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="space-y-4">
                ${alerts.map(alert => this.renderAlertCard(alert)).join('')}
            </div>
        `;
        
        // Bind alert card events
        alerts.forEach(alert => {
            const card = document.querySelector(`[data-alert-id="${alert.id}"]`);
            if (card) {
                card.addEventListener('click', () => this.showAlertDetail(alert));
            }
        });
    }

    updateSummaryCards(alerts) {
        if (!alerts) return;

        const criticalCount = alerts.filter(alert => 
            alert.alert_type?.severity_level >= 4 && alert.status === 'ACTIVE'
        ).length;
        
        const activeCount = alerts.filter(alert => alert.status === 'ACTIVE').length;
        const resolvedCount = alerts.filter(alert => alert.status === 'RESOLVED').length;
        const totalCount = alerts.length;

        document.getElementById('critical-count').textContent = criticalCount;
        document.getElementById('active-count').textContent = activeCount;
        document.getElementById('resolved-count').textContent = resolvedCount;
        document.getElementById('total-count').textContent = totalCount;
    }

    renderAlertCard(alert) {
        const severityClass = this.getSeverityClass(alert.alert_type?.severity_level);
        const statusClass = this.getStatusClass(alert.status);
        const alertTypeText = this.getAlertTypeText(alert.alert_type?.name);
        
        return `
            <div class="alert-card bg-white border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer border-l-4 ${severityClass}"
                 data-alert-id="${alert.id}">
                <div class="flex justify-between items-start">
                    <div class="flex-1">
                        <div class="flex items-center space-x-2 mb-2">
                            <span class="text-sm font-medium ${statusClass}">${alertTypeText}</span>
                            <span class="text-xs text-gray-500">${this.formatTime(alert.triggered_at)}</span>
                        </div>
                        
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div>
                                <span class="text-gray-500">產品:</span>
                                <p class="font-medium">${alert.product?.name || '未知產品'}</p>
                                <p class="text-xs text-gray-400">${alert.product?.sku || ''}</p>
                            </div>
                            
                            <div>
                                <span class="text-gray-500">倉庫:</span>
                                <p class="font-medium">${alert.warehouse?.name || '未知倉庫'}</p>
                            </div>
                            
                            <div>
                                <span class="text-gray-500">當前庫存:</span>
                                <p class="font-medium ${alert.current_level <= 0 ? 'text-red-600' : alert.current_level <= (alert.safety_level || 0) ? 'text-yellow-600' : 'text-green-600'}">
                                    ${alert.current_level}
                                </p>
                                ${alert.safety_level ? `<p class="text-xs text-gray-400">安全庫存: ${alert.safety_level}</p>` : ''}
                            </div>
                        </div>
                        
                        ${alert.alert_message ? `
                            <div class="mt-2 p-2 bg-gray-50 rounded text-sm text-gray-700">
                                ${alert.alert_message}
                            </div>
                        ` : ''}
                    </div>
                    
                    <div class="flex flex-col items-end space-y-2">
                        <span class="px-2 py-1 rounded-full text-xs font-medium ${statusClass} bg-opacity-20">
                            ${this.getStatusText(alert.status)}
                        </span>
                        
                        ${alert.status === 'ACTIVE' ? `
                            <div class="flex space-x-1">
                                <button class="resolve-btn text-green-600 hover:text-green-800 text-xs px-2 py-1 border border-green-600 rounded"
                                        data-alert-id="${alert.id}" onclick="event.stopPropagation()">
                                    解決
                                </button>
                                <button class="dismiss-btn text-gray-600 hover:text-gray-800 text-xs px-2 py-1 border border-gray-600 rounded"
                                        data-alert-id="${alert.id}" onclick="event.stopPropagation()">
                                    忽略
                                </button>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    getSeverityClass(severityLevel) {
        if (severityLevel >= 4) return 'border-red-500';
        if (severityLevel >= 3) return 'border-yellow-500';
        if (severityLevel >= 2) return 'border-blue-500';
        return 'border-gray-500';
    }

    getStatusClass(status) {
        const statusClasses = {
            'ACTIVE': 'text-red-600',
            'RESOLVED': 'text-green-600',
            'DISMISSED': 'text-gray-600'
        };
        return statusClasses[status] || 'text-gray-600';
    }

    getStatusText(status) {
        const statusTexts = {
            'ACTIVE': '活躍',
            'RESOLVED': '已解決',
            'DISMISSED': '已忽略'
        };
        return statusTexts[status] || '未知';
    }

    getAlertTypeText(alertType) {
        const typeTexts = {
            'LOW_STOCK': '庫存不足',
            'OUT_OF_STOCK': '無庫存',
            'OVERSTOCK': '庫存過量',
            'EXPIRED_STOCK': '庫存過期',
            'SLOW_MOVING': '滯銷商品'
        };
        return typeTexts[alertType] || alertType;
    }

    formatTime(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffHours / 24);

        if (diffDays > 0) {
            return `${diffDays}天前`;
        } else if (diffHours > 0) {
            return `${diffHours}小時前`;
        } else {
            const diffMinutes = Math.floor(diffMs / (1000 * 60));
            return `${diffMinutes}分鐘前`;
        }
    }

    showAlertDetail(alert) {
        this.currentAlert = alert;
        
        document.getElementById('alert-detail-content').innerHTML = `
            <div class="space-y-4">
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <span class="text-sm text-gray-500">警示類型</span>
                        <p class="font-medium">${this.getAlertTypeText(alert.alert_type?.name)}</p>
                    </div>
                    <div>
                        <span class="text-sm text-gray-500">嚴重程度</span>
                        <p class="font-medium">${alert.alert_type?.severity_level}/5</p>
                    </div>
                    <div>
                        <span class="text-sm text-gray-500">產品</span>
                        <p class="font-medium">${alert.product?.name || '未知產品'}</p>
                        <p class="text-sm text-gray-400">SKU: ${alert.product?.sku || ''}</p>
                    </div>
                    <div>
                        <span class="text-sm text-gray-500">倉庫</span>
                        <p class="font-medium">${alert.warehouse?.name || '未知倉庫'}</p>
                    </div>
                    <div>
                        <span class="text-sm text-gray-500">當前庫存</span>
                        <p class="font-medium text-lg">${alert.current_level}</p>
                    </div>
                    <div>
                        <span class="text-sm text-gray-500">安全庫存</span>
                        <p class="font-medium">${alert.safety_level || '未設定'}</p>
                    </div>
                    <div>
                        <span class="text-sm text-gray-500">觸發時間</span>
                        <p class="font-medium">${new Date(alert.triggered_at).toLocaleString()}</p>
                    </div>
                    <div>
                        <span class="text-sm text-gray-500">狀態</span>
                        <span class="px-2 py-1 rounded-full text-xs font-medium ${this.getStatusClass(alert.status)} bg-opacity-20">
                            ${this.getStatusText(alert.status)}
                        </span>
                    </div>
                </div>
                
                ${alert.alert_message ? `
                    <div>
                        <span class="text-sm text-gray-500">警示訊息</span>
                        <div class="mt-1 p-3 bg-gray-50 rounded">
                            <p>${alert.alert_message}</p>
                        </div>
                    </div>
                ` : ''}
                
                ${alert.resolved_at ? `
                    <div>
                        <span class="text-sm text-gray-500">解決時間</span>
                        <p class="font-medium">${new Date(alert.resolved_at).toLocaleString()}</p>
                        ${alert.resolved_by_user ? `<p class="text-sm text-gray-400">解決者: ${alert.resolved_by_user.name}</p>` : ''}
                    </div>
                ` : ''}
            </div>
        `;

        // Show/hide action buttons based on status
        const resolveBtn = document.getElementById('resolve-alert');
        const dismissBtn = document.getElementById('dismiss-alert');
        
        if (alert.status === 'ACTIVE') {
            resolveBtn.classList.remove('hidden');
            dismissBtn.classList.remove('hidden');
        } else {
            resolveBtn.classList.add('hidden');
            dismissBtn.classList.add('hidden');
        }

        document.getElementById('alert-modal').classList.remove('hidden');
    }

    hideAlertModal() {
        document.getElementById('alert-modal').classList.add('hidden');
        this.currentAlert = null;
    }

    async resolveCurrentAlert() {
        if (!this.currentAlert) return;

        try {
            await this.state.resolveAlert(this.currentAlert.id, '已手動解決警示');
            this.hideAlertModal();
            this.loadData(); // Refresh the list
        } catch (error) {
            console.error('Resolve alert failed:', error);
        }
    }

    async dismissCurrentAlert() {
        if (!this.currentAlert) return;

        try {
            await this.state.api.dismissAlert(this.currentAlert.id, { notes: '已忽略警示' });
            this.hideAlertModal();
            this.loadData(); // Refresh the list
        } catch (error) {
            console.error('Dismiss alert failed:', error);
        }
    }

    updateLoadingState(loading) {
        const indicator = document.getElementById('loading-indicator');
        if (loading) {
            indicator.classList.remove('hidden');
        } else {
            indicator.classList.add('hidden');
        }
    }

    showError(error) {
        const errorDiv = document.getElementById('error-message');
        if (error) {
            errorDiv.textContent = error;
            errorDiv.classList.remove('hidden');
        } else {
            errorDiv.classList.add('hidden');
        }
    }
}

// Export for use
window.InventoryAlerts = InventoryAlerts;