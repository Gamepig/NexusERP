// Stocktaking Detail Component
class StocktakingDetail {
    constructor(container, orderId) {
        this.container = container;
        this.orderId = orderId;
        this.state = window.stocktakingState;
        this.currentOrder = null;
        this.items = [];
        
        this.init();
    }

    init() {
        this.render();
        this.bindEvents();
        this.loadData();
        
        // Subscribe to state changes
        this.unsubscribe = this.state.subscribe((state) => {
            this.currentOrder = state.currentOrder;
            this.items = state.orderItems;
            this.renderOrderInfo();
            this.renderItems();
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
            <div class="stocktaking-detail">
                <div class="header mb-6">
                    <div class="flex justify-between items-center">
                        <div class="flex items-center space-x-4">
                            <button id="back-btn" class="text-gray-600 hover:text-gray-800">
                                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                                </svg>
                            </button>
                            <h2 class="text-2xl font-bold text-gray-900">盤點詳情</h2>
                        </div>
                        <div id="action-buttons" class="flex space-x-2">
                            <!-- Action buttons will be rendered based on order status -->
                        </div>
                    </div>
                </div>

                <div id="loading-indicator" class="hidden text-center py-4">
                    <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span class="ml-2">載入中...</span>
                </div>

                <div id="error-message" class="hidden bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4"></div>

                <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <!-- Order Information -->
                    <div class="lg:col-span-1">
                        <div class="bg-white rounded-lg shadow-md p-6">
                            <h3 class="text-lg font-semibold mb-4">盤點資訊</h3>
                            <div id="order-info">
                                <!-- Order info will be rendered here -->
                            </div>
                        </div>
                    </div>

                    <!-- Items List -->
                    <div class="lg:col-span-2">
                        <div class="bg-white rounded-lg shadow-md p-6">
                            <div class="flex justify-between items-center mb-4">
                                <h3 class="text-lg font-semibold">盤點項目</h3>
                                <div class="flex space-x-2">
                                    <button id="bulk-count-btn" class="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors">
                                        批次盤點
                                    </button>
                                    <button id="export-btn" class="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors">
                                        匯出
                                    </button>
                                </div>
                            </div>
                            
                            <div class="mb-4">
                                <input type="text" id="item-search" placeholder="搜尋產品..." 
                                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                            </div>
                            
                            <div id="items-container">
                                <!-- Items will be rendered here -->
                            </div>
                            
                            <div id="items-pagination" class="mt-4">
                                <!-- Pagination will be rendered here -->
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Count Item Modal -->
                <div id="count-modal" class="hidden fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                        <div class="mt-3">
                            <h3 class="text-lg font-medium text-gray-900 mb-4">記錄盤點數量</h3>
                            <form id="count-form">
                                <div id="count-product-info" class="mb-4 p-3 bg-gray-50 rounded">
                                    <!-- Product info will be displayed here -->
                                </div>
                                
                                <div class="mb-4">
                                    <label class="block text-sm font-medium text-gray-700 mb-2">盤點數量</label>
                                    <input type="number" id="counted-quantity" min="0" required 
                                           class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                                </div>
                                
                                <div class="mb-4">
                                    <label class="block text-sm font-medium text-gray-700 mb-2">批號</label>
                                    <input type="text" id="batch-number" 
                                           class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                                </div>
                                
                                <div class="mb-4">
                                    <label class="block text-sm font-medium text-gray-700 mb-2">到期日</label>
                                    <input type="date" id="expiry-date" 
                                           class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                                </div>
                                
                                <div class="mb-4">
                                    <label class="block text-sm font-medium text-gray-700 mb-2">備註</label>
                                    <textarea id="count-notes" rows="3" 
                                              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
                                </div>
                                
                                <div class="flex justify-end space-x-2">
                                    <button type="button" id="cancel-count" class="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors">
                                        取消
                                    </button>
                                    <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
                                        儲存
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    bindEvents() {
        // Back button
        document.getElementById('back-btn').addEventListener('click', () => {
            window.history.back();
        });

        // Count modal events
        document.getElementById('cancel-count').addEventListener('click', () => {
            this.hideCountModal();
        });

        document.getElementById('count-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitCount();
        });

        // Search
        document.getElementById('item-search').addEventListener('input', (e) => {
            this.filterItems(e.target.value);
        });

        // Bulk count
        document.getElementById('bulk-count-btn').addEventListener('click', () => {
            this.showBulkCountForm();
        });
    }

    loadData() {
        this.state.loadOrder(this.orderId);
        this.state.loadOrderItems(this.orderId);
    }

    renderOrderInfo() {
        if (!this.currentOrder) return;

        const order = this.currentOrder;
        const statusClass = this.getStatusClass(order.status_id);
        const statusText = this.getStatusText(order.status_id);

        document.getElementById('order-info').innerHTML = `
            <div class="space-y-4">
                <div>
                    <span class="text-sm text-gray-500">單號</span>
                    <p class="font-medium">${order.reference_number}</p>
                </div>
                
                <div>
                    <span class="text-sm text-gray-500">標題</span>
                    <p class="font-medium">${order.title}</p>
                </div>
                
                <div>
                    <span class="text-sm text-gray-500">狀態</span>
                    <span class="inline-block px-2 py-1 rounded-full text-xs font-medium ${statusClass} bg-opacity-20">
                        ${statusText}
                    </span>
                </div>
                
                <div>
                    <span class="text-sm text-gray-500">倉庫</span>
                    <p class="font-medium">${order.warehouse?.name || '未知'}</p>
                </div>
                
                <div>
                    <span class="text-sm text-gray-500">規劃日期</span>
                    <p class="font-medium">${order.planned_date ? new Date(order.planned_date).toLocaleDateString() : '未設定'}</p>
                </div>
                
                <div>
                    <span class="text-sm text-gray-500">建立者</span>
                    <p class="font-medium">${order.created_by_user?.name || '未知'}</p>
                </div>
                
                ${order.description ? `
                    <div>
                        <span class="text-sm text-gray-500">描述</span>
                        <p class="font-medium">${order.description}</p>
                    </div>
                ` : ''}
                
                <div>
                    <span class="text-sm text-gray-500">建立時間</span>
                    <p class="font-medium">${new Date(order.created_at).toLocaleString()}</p>
                </div>
            </div>
        `;

        this.renderActionButtons();
    }

    renderActionButtons() {
        if (!this.currentOrder) return;

        const order = this.currentOrder;
        let buttons = '';

        switch (order.status_id) {
            case 1: // PLANNED
                buttons = `
                    <button id="start-order" class="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors">
                        開始盤點
                    </button>
                    <button id="edit-order" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors">
                        編輯
                    </button>
                `;
                break;
            case 2: // IN_PROGRESS
                buttons = `
                    <button id="finalize-order" class="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition-colors">
                        完成盤點
                    </button>
                `;
                break;
            case 3: // COMPLETED
                buttons = `
                    <button id="approve-order" class="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors">
                        核准
                    </button>
                `;
                break;
        }

        document.getElementById('action-buttons').innerHTML = buttons;
        this.bindActionButtons();
    }

    bindActionButtons() {
        const startBtn = document.getElementById('start-order');
        const finalizeBtn = document.getElementById('finalize-order');
        const approveBtn = document.getElementById('approve-order');

        if (startBtn) {
            startBtn.addEventListener('click', () => this.startOrder());
        }
        if (finalizeBtn) {
            finalizeBtn.addEventListener('click', () => this.finalizeOrder());
        }
        if (approveBtn) {
            approveBtn.addEventListener('click', () => this.approveOrder());
        }
    }

    renderItems() {
        const container = document.getElementById('items-container');
        
        if (!this.items || this.items.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <div class="text-4xl mb-4">📋</div>
                    <p>尚無盤點項目</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">產品</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">系統數量</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">盤點數量</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">差異</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">狀態</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                        ${this.items.map(item => this.renderItemRow(item)).join('')}
                    </tbody>
                </table>
            </div>
        `;

        // Bind count buttons
        this.items.forEach(item => {
            const countBtn = document.querySelector(`[data-count-item="${item.product_id}"]`);
            if (countBtn) {
                countBtn.addEventListener('click', () => this.showCountModal(item));
            }
        });
    }

    renderItemRow(item) {
        const difference = (item.counted_quantity ?? 0) - item.system_quantity;
        const isCounted = item.counted_quantity !== null;
        
        return `
            <tr class="${isCounted ? 'bg-green-50' : ''}">
                <td class="px-6 py-4 whitespace-nowrap">
                    <div>
                        <div class="text-sm font-medium text-gray-900">${item.product?.name || '未知產品'}</div>
                        <div class="text-sm text-gray-500">${item.product?.sku || ''}</div>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${item.system_quantity}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${item.counted_quantity ?? '-'}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm">
                    <span class="${difference === 0 ? 'text-green-600' : difference > 0 ? 'text-blue-600' : 'text-red-600'}">
                        ${isCounted ? (difference > 0 ? `+${difference}` : difference) : '-'}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        isCounted ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }">
                        ${isCounted ? '已盤點' : '待盤點'}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm">
                    <button data-count-item="${item.product_id}" 
                            class="text-blue-600 hover:text-blue-900 ${this.canCount() ? '' : 'opacity-50 cursor-not-allowed'}"
                            ${this.canCount() ? '' : 'disabled'}>
                        ${isCounted ? '重新盤點' : '盤點'}
                    </button>
                </td>
            </tr>
        `;
    }

    canCount() {
        return this.currentOrder?.status_id === 2; // IN_PROGRESS
    }

    showCountModal(item) {
        if (!this.canCount()) return;

        this.currentItem = item;
        
        document.getElementById('count-product-info').innerHTML = `
            <div class="text-sm">
                <div class="font-medium">${item.product?.name || '未知產品'}</div>
                <div class="text-gray-500">SKU: ${item.product?.sku || ''}</div>
                <div class="text-gray-500">系統數量: ${item.system_quantity}</div>
                ${item.counted_quantity !== null ? `<div class="text-gray-500">目前盤點: ${item.counted_quantity}</div>` : ''}
            </div>
        `;

        // Pre-fill form if already counted
        if (item.counted_quantity !== null) {
            document.getElementById('counted-quantity').value = item.counted_quantity;
            document.getElementById('batch-number').value = item.batch_number || '';
            document.getElementById('expiry-date').value = item.expiry_date ? item.expiry_date.split('T')[0] : '';
            document.getElementById('count-notes').value = item.notes || '';
        } else {
            document.getElementById('count-form').reset();
        }

        document.getElementById('count-modal').classList.remove('hidden');
    }

    hideCountModal() {
        document.getElementById('count-modal').classList.add('hidden');
        this.currentItem = null;
    }

    async submitCount() {
        if (!this.currentItem) return;

        const formData = {
            counted_quantity: parseInt(document.getElementById('counted-quantity').value),
            batch_number: document.getElementById('batch-number').value,
            expiry_date: document.getElementById('expiry-date').value || null,
            notes: document.getElementById('count-notes').value
        };

        try {
            await this.state.countItem(this.orderId, this.currentItem.product_id, formData);
            this.hideCountModal();
        } catch (error) {
            console.error('Count submission failed:', error);
        }
    }

    async startOrder() {
        try {
            await this.state.api.startOrder(this.orderId, {
                start_date: new Date().toISOString(),
                notes: '開始盤點作業'
            });
            this.loadData();
        } catch (error) {
            console.error('Start order failed:', error);
        }
    }

    async finalizeOrder() {
        try {
            await this.state.api.finalizeOrder(this.orderId, {
                end_date: new Date().toISOString(),
                notes: '完成盤點作業'
            });
            this.loadData();
        } catch (error) {
            console.error('Finalize order failed:', error);
        }
    }

    async approveOrder() {
        try {
            await this.state.api.approveOrder(this.orderId, {
                notes: '核准盤點結果'
            });
            this.loadData();
        } catch (error) {
            console.error('Approve order failed:', error);
        }
    }

    filterItems(query) {
        // Filter items based on product name/SKU
        const filteredItems = this.items.filter(item => {
            const productName = item.product?.name?.toLowerCase() || '';
            const productSku = item.product?.sku?.toLowerCase() || '';
            const searchQuery = query.toLowerCase();
            return productName.includes(searchQuery) || productSku.includes(searchQuery);
        });
        
        // Re-render with filtered items
        this.items = filteredItems;
        this.renderItems();
    }

    showBulkCountForm() {
        console.log('Show bulk count form');
        // Implementation for bulk counting would go here
    }

    getStatusClass(statusId) {
        const statusClasses = {
            1: 'text-yellow-600',
            2: 'text-blue-600',
            3: 'text-green-600',
            4: 'text-purple-600',
            5: 'text-red-600'
        };
        return statusClasses[statusId] || 'text-gray-600';
    }

    getStatusText(statusId) {
        const statusTexts = {
            1: '已規劃',
            2: '進行中',
            3: '已完成',
            4: '已核准',
            5: '已取消'
        };
        return statusTexts[statusId] || '未知';
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
window.StocktakingDetail = StocktakingDetail;