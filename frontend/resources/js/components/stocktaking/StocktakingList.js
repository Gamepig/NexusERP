// Stocktaking List Component
class StocktakingList {
    constructor(container) {
        this.container = container;
        this.state = window.stocktakingState;
        this.filters = {
            status: '',
            warehouse_id: '',
            limit: 10,
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
            this.renderOrders(state.orders);
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
            <div class="stocktaking-list">
                <div class="header mb-6">
                    <div class="flex justify-between items-center">
                        <h2 class="text-2xl font-bold text-gray-900">盤點管理</h2>
                        <button id="create-stocktaking-btn" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                            新增盤點
                        </button>
                    </div>
                </div>

                <div class="filters mb-6">
                    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                        <select id="status-filter" class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="">全部狀態</option>
                            <option value="PLANNED">已規劃</option>
                            <option value="IN_PROGRESS">進行中</option>
                            <option value="COMPLETED">已完成</option>
                            <option value="APPROVED">已核准</option>
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

                <div class="orders-grid">
                    <div id="orders-container" class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                        <!-- Orders will be rendered here -->
                    </div>
                </div>

                <div class="pagination mt-6">
                    <div class="flex justify-between items-center">
                        <div id="pagination-info" class="text-gray-600"></div>
                        <div id="pagination-controls" class="flex space-x-2"></div>
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

        // Create stocktaking button
        document.getElementById('create-stocktaking-btn').addEventListener('click', () => {
            this.showCreateForm();
        });
    }

    loadData() {
        this.state.loadOrders(this.filters);
    }

    applyFilters() {
        this.filters.status = document.getElementById('status-filter').value;
        this.filters.warehouse_id = document.getElementById('warehouse-filter').value;
        this.filters.offset = 0; // Reset pagination
        this.loadData();
    }

    resetFilters() {
        this.filters = { status: '', warehouse_id: '', limit: 10, offset: 0 };
        document.getElementById('status-filter').value = '';
        document.getElementById('warehouse-filter').value = '';
        this.loadData();
    }

    renderOrders(orders) {
        const container = document.getElementById('orders-container');
        
        if (!orders || orders.length === 0) {
            container.innerHTML = `
                <div class="col-span-full text-center py-8 text-gray-500">
                    <div class="text-6xl mb-4">📦</div>
                    <p class="text-lg">尚無盤點單據</p>
                    <p class="text-sm">點擊「新增盤點」建立第一個盤點單據</p>
                </div>
            `;
            return;
        }

        container.innerHTML = orders.map(order => this.renderOrderCard(order)).join('');
        
        // Bind card events
        orders.forEach(order => {
            const card = document.querySelector(`[data-order-id="${order.id}"]`);
            if (card) {
                card.addEventListener('click', () => this.viewOrder(order.id));
            }
        });
    }

    renderOrderCard(order) {
        const statusClass = this.getStatusClass(order.status_id);
        const statusText = this.getStatusText(order.status_id);
        
        return `
            <div class="order-card bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer border-l-4 ${statusClass}"
                 data-order-id="${order.id}">
                <div class="p-6">
                    <div class="flex justify-between items-start mb-4">
                        <div>
                            <h3 class="text-lg font-semibold text-gray-900">${order.title}</h3>
                            <p class="text-sm text-gray-500">${order.reference_number}</p>
                        </div>
                        <span class="px-2 py-1 rounded-full text-xs font-medium ${statusClass} bg-opacity-20">
                            ${statusText}
                        </span>
                    </div>
                    
                    <div class="space-y-2 text-sm text-gray-600">
                        <div class="flex justify-between">
                            <span>倉庫:</span>
                            <span>${order.warehouse?.name || '未知'}</span>
                        </div>
                        <div class="flex justify-between">
                            <span>規劃日期:</span>
                            <span>${order.planned_date ? new Date(order.planned_date).toLocaleDateString() : '未設定'}</span>
                        </div>
                        <div class="flex justify-between">
                            <span>建立者:</span>
                            <span>${order.created_by_user?.name || '未知'}</span>
                        </div>
                    </div>
                    
                    ${order.description ? `
                        <div class="mt-4 p-3 bg-gray-50 rounded-md">
                            <p class="text-sm text-gray-700">${order.description}</p>
                        </div>
                    ` : ''}
                    
                    <div class="mt-4 flex justify-between items-center text-xs text-gray-500">
                        <span>建立於 ${new Date(order.created_at).toLocaleDateString()}</span>
                        <div class="flex space-x-2">
                            <button class="view-btn text-blue-600 hover:text-blue-800" data-order-id="${order.id}">
                                檢視
                            </button>
                            ${this.canEdit(order) ? `
                                <button class="edit-btn text-green-600 hover:text-green-800" data-order-id="${order.id}">
                                    編輯
                                </button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    getStatusClass(statusId) {
        const statusClasses = {
            1: 'border-yellow-400 text-yellow-600', // PLANNED
            2: 'border-blue-400 text-blue-600',     // IN_PROGRESS
            3: 'border-green-400 text-green-600',   // COMPLETED
            4: 'border-purple-400 text-purple-600', // APPROVED
            5: 'border-red-400 text-red-600'        // CANCELLED
        };
        return statusClasses[statusId] || 'border-gray-400 text-gray-600';
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

    canEdit(order) {
        // Only allow editing for PLANNED status
        return order.status_id === 1;
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

    viewOrder(orderId) {
        // Navigate to order detail view
        window.location.href = `/stocktaking/${orderId}`;
    }

    showCreateForm() {
        // Show create form modal or navigate to create page
        console.log('Show create stocktaking form');
        // This would typically open a modal or navigate to a creation page
    }
}

// Export for use
window.StocktakingList = StocktakingList;