class InventoryManagement {
    constructor() {
        this.currentPage = 1;
        this.pageSize = 20;
        this.currentView = 'grid'; // 'grid' or 'table'
        this.inventory = [];
        this.filteredInventory = [];
        this.isLoading = false;
        
        this.initializeElements();
        this.bindEvents();
        this.loadInventory();
    }

    initializeElements() {
        // Main containers
        this.loadingState = document.getElementById('loadingState');
        this.gridView = document.getElementById('gridView');
        this.tableView = document.getElementById('tableView');
        this.emptyState = document.getElementById('emptyState');
        this.pagination = document.getElementById('pagination');
        
        // Form controls
        this.searchInput = document.getElementById('searchInput');
        this.warehouseFilter = document.getElementById('warehouseFilter');
        this.categoryFilter = document.getElementById('categoryFilter');
        this.statusFilter = document.getElementById('statusFilter');
        this.toggleViewBtn = document.getElementById('toggleView');
        this.gridIcon = document.getElementById('gridIcon');
        this.listIcon = document.getElementById('listIcon');
        
        // Content containers
        this.inventoryGrid = document.getElementById('inventoryGrid');
        this.inventoryTable = document.getElementById('inventoryTable');
        this.resultsCount = document.getElementById('resultsCount');
        
        // Statistics elements
        this.totalProducts = document.getElementById('totalProducts');
        this.inStockProducts = document.getElementById('inStockProducts');
        this.lowStockProducts = document.getElementById('lowStockProducts');
        this.totalValue = document.getElementById('totalValue');
    }

    bindEvents() {
        // Search and filter events
        if (this.searchInput) {
            this.searchInput.addEventListener('input', this.debounce(() => this.applyFilters(), 300));
        }
        if (this.warehouseFilter) {
            this.warehouseFilter.addEventListener('change', () => this.applyFilters());
        }
        if (this.categoryFilter) {
            this.categoryFilter.addEventListener('change', () => this.applyFilters());
        }
        if (this.statusFilter) {
            this.statusFilter.addEventListener('change', () => this.applyFilters());
        }
        
        // View toggle
        if (this.toggleViewBtn) {
            this.toggleViewBtn.addEventListener('click', () => this.toggleView());
        }
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    async loadInventory() {
        this.setLoading(true);
        
        try {
            // Get backend API configuration
            const config = window.appConfig || {};
            const backendUrl = config.backend_url || 'http://localhost:8080';
            
            const response = await fetch(`${backendUrl}/api/inventory/levels?page=${this.currentPage}&page_size=${this.pageSize}`, {
                headers: {
                    'Authorization': `Bearer ${this.getAuthToken()}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                this.inventory = data.inventory_levels || [];
                this.updateStatistics();
                this.applyFilters();
            } else {
                // If API fails, use mock data for demonstration
                console.warn('API unavailable, using mock data');
                this.loadMockData();
            }
        } catch (error) {
            console.error('Failed to load inventory:', error);
            // Use mock data as fallback
            this.loadMockData();
        }
        
        this.setLoading(false);
    }

    loadMockData() {
        // Mock inventory data for demonstration
        this.inventory = [
            {
                id: 1,
                product_id: 'PROD001',
                product_name: 'iPhone 15 Pro',
                sku: 'IPH15P-128-BLU',
                category: 'electronics',
                warehouse: 'main',
                warehouse_name: '主倉庫',
                current_stock: 45,
                safety_stock: 10,
                max_stock: 100,
                unit_cost: 35000,
                status: 'in-stock',
                last_updated: '2025-07-23T10:30:00Z'
            },
            {
                id: 2,
                product_id: 'PROD002',
                product_name: 'MacBook Air M2',
                sku: 'MBA-M2-256-SLV',
                category: 'electronics',
                warehouse: 'main',
                warehouse_name: '主倉庫',
                current_stock: 8,
                safety_stock: 5,
                max_stock: 50,
                unit_cost: 40000,
                status: 'low-stock',
                last_updated: '2025-07-23T09:15:00Z'
            },
            {
                id: 3,
                product_id: 'PROD003',
                product_name: 'Nike Air Max 270',
                sku: 'NK270-42-BLK',
                category: 'clothing',
                warehouse: 'backup',
                warehouse_name: '備用倉庫',
                current_stock: 0,
                safety_stock: 15,
                max_stock: 80,
                unit_cost: 4500,
                status: 'out-of-stock',
                last_updated: '2025-07-22T18:45:00Z'
            },
            {
                id: 4,
                product_id: 'PROD004',
                product_name: '有機咖啡豆 500g',
                sku: 'CFB-ORG-500',
                category: 'food',
                warehouse: 'main',
                warehouse_name: '主倉庫',
                current_stock: 150,
                safety_stock: 20,
                max_stock: 200,
                unit_cost: 680,
                status: 'excess-stock',
                last_updated: '2025-07-23T11:20:00Z'
            },
            {
                id: 5,
                product_id: 'PROD005',
                product_name: '商業管理學教科書',
                sku: 'BK-BIZ-MGMT-01',
                category: 'books',
                warehouse: 'main',
                warehouse_name: '主倉庫',
                current_stock: 32,
                safety_stock: 5,
                max_stock: 60,
                unit_cost: 1200,
                status: 'in-stock',
                last_updated: '2025-07-23T08:30:00Z'
            },
            {
                id: 6,
                product_id: 'PROD006',
                product_name: 'Samsung Galaxy S24',
                sku: 'SGS24-256-WHT',
                category: 'electronics',
                warehouse: 'transit',
                warehouse_name: '在途倉庫',
                current_stock: 25,
                safety_stock: 8,
                max_stock: 75,
                unit_cost: 32000,
                status: 'in-stock',
                last_updated: '2025-07-23T12:10:00Z'
            }
        ];
        
        this.updateStatistics();
        this.applyFilters();
    }

    getAuthToken() {
        // Try to get token from localStorage, sessionStorage, or cookie
        return localStorage.getItem('auth_token') || 
               sessionStorage.getItem('auth_token') || 
               this.getCookie('auth_token') || '';
    }

    getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return '';
    }

    setLoading(loading) {
        this.isLoading = loading;
        
        if (this.loadingState) {
            this.loadingState.style.display = loading ? 'block' : 'none';
        }
        
        if (!loading) {
            this.renderCurrentView();
        }
    }

    updateStatistics() {
        if (!this.inventory) return;
        
        const stats = {
            total: this.inventory.length,
            inStock: this.inventory.filter(item => item.status === 'in-stock' || item.status === 'excess-stock').length,
            lowStock: this.inventory.filter(item => item.status === 'low-stock').length,
            totalValue: this.inventory.reduce((sum, item) => sum + (item.current_stock * item.unit_cost), 0)
        };
        
        if (this.totalProducts) {
            this.totalProducts.textContent = stats.total.toLocaleString();
        }
        if (this.inStockProducts) {
            this.inStockProducts.textContent = stats.inStock.toLocaleString();
        }
        if (this.lowStockProducts) {
            this.lowStockProducts.textContent = stats.lowStock.toLocaleString();
        }
        if (this.totalValue) {
            this.totalValue.textContent = `NT$ ${stats.totalValue.toLocaleString()}`;
        }
    }

    applyFilters() {
        if (!this.inventory) return;
        
        let filtered = [...this.inventory];
        
        // Search filter
        const searchTerm = this.searchInput?.value?.toLowerCase() || '';
        if (searchTerm) {
            filtered = filtered.filter(item => 
                item.product_name.toLowerCase().includes(searchTerm) ||
                item.sku.toLowerCase().includes(searchTerm) ||
                item.category.toLowerCase().includes(searchTerm)
            );
        }
        
        // Warehouse filter
        const warehouseFilter = this.warehouseFilter?.value || '';
        if (warehouseFilter) {
            filtered = filtered.filter(item => item.warehouse === warehouseFilter);
        }
        
        // Category filter
        const categoryFilter = this.categoryFilter?.value || '';
        if (categoryFilter) {
            filtered = filtered.filter(item => item.category === categoryFilter);
        }
        
        // Status filter
        const statusFilter = this.statusFilter?.value || '';
        if (statusFilter) {
            filtered = filtered.filter(item => item.status === statusFilter);
        }
        
        this.filteredInventory = filtered;
        this.updateResultsCount();
        this.renderCurrentView();
    }

    updateResultsCount() {
        if (this.resultsCount) {
            const count = this.filteredInventory.length;
            this.resultsCount.textContent = `顯示 ${count} 項產品`;
        }
    }

    toggleView() {
        this.currentView = this.currentView === 'grid' ? 'table' : 'grid';
        
        if (this.gridIcon && this.listIcon) {
            if (this.currentView === 'grid') {
                this.gridIcon.classList.remove('hidden');
                this.listIcon.classList.add('hidden');
            } else {
                this.gridIcon.classList.add('hidden');
                this.listIcon.classList.remove('hidden');
            }
        }
        
        this.renderCurrentView();
    }

    renderCurrentView() {
        if (this.isLoading) return;
        
        if (this.filteredInventory.length === 0) {
            this.showEmptyState();
            return;
        }
        
        this.hideEmptyState();
        
        if (this.currentView === 'grid') {
            this.renderGridView();
        } else {
            this.renderTableView();
        }
    }

    renderGridView() {
        if (!this.gridView || !this.inventoryGrid) return;
        
        this.gridView.style.display = 'block';
        this.tableView && (this.tableView.style.display = 'none');
        
        this.inventoryGrid.innerHTML = this.filteredInventory.map(item => this.createInventoryCard(item)).join('');
    }

    renderTableView() {
        if (!this.tableView || !this.inventoryTable) return;
        
        this.tableView.style.display = 'block';
        this.gridView && (this.gridView.style.display = 'none');
        
        this.inventoryTable.innerHTML = this.filteredInventory.map(item => this.createInventoryRow(item)).join('');
    }

    createInventoryCard(item) {
        const statusClass = this.getStatusClass(item.status);
        const statusText = this.getStatusText(item.status);
        
        return `
            <div class="inventory-card bg-white rounded-lg shadow-lg p-6 cursor-pointer" onclick="inventoryManager.showItemDetails('${item.id}')">
                <div class="flex justify-between items-start mb-4">
                    <div class="flex-1">
                        <h3 class="text-lg font-semibold text-gray-900 mb-1">${item.product_name}</h3>
                        <p class="text-sm text-gray-600">SKU: ${item.sku}</p>
                    </div>
                    <span class="status-badge ${statusClass}">${statusText}</span>
                </div>
                
                <div class="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <p class="text-gray-600">現有庫存</p>
                        <p class="font-semibold text-lg">${item.current_stock.toLocaleString()}</p>
                    </div>
                    <div>
                        <p class="text-gray-600">安全庫存</p>
                        <p class="font-semibold">${item.safety_stock.toLocaleString()}</p>
                    </div>
                    <div>
                        <p class="text-gray-600">倉庫</p>
                        <p class="font-semibold">${item.warehouse_name}</p>
                    </div>
                    <div>
                        <p class="text-gray-600">總價值</p>
                        <p class="font-semibold">NT$ ${(item.current_stock * item.unit_cost).toLocaleString()}</p>
                    </div>
                </div>
            </div>
        `;
    }

    createInventoryRow(item) {
        const statusClass = this.getStatusClass(item.status);
        const statusText = this.getStatusText(item.status);
        
        return `
            <tr class="hover:bg-gray-50 cursor-pointer" onclick="inventoryManager.showItemDetails('${item.id}')">
                <td class="px-6 py-4 whitespace-nowrap">
                    <div>
                        <div class="text-sm font-medium text-gray-900">${item.product_name}</div>
                        <div class="text-sm text-gray-500">${item.category}</div>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${item.sku}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${this.getCategoryText(item.category)}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${item.warehouse_name}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">${item.current_stock.toLocaleString()}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${item.safety_stock.toLocaleString()}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="status-badge ${statusClass}">${statusText}</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button onclick="event.stopPropagation(); inventoryManager.editItem('${item.id}')" class="text-blue-600 hover:text-blue-900 mr-3">編輯</button>
                    <button onclick="event.stopPropagation(); inventoryManager.showItemDetails('${item.id}')" class="text-gray-600 hover:text-gray-900">詳情</button>
                </td>
            </tr>
        `;
    }

    showEmptyState() {
        if (this.emptyState) {
            this.emptyState.style.display = 'block';
        }
        if (this.gridView) {
            this.gridView.style.display = 'none';
        }
        if (this.tableView) {
            this.tableView.style.display = 'none';
        }
    }

    hideEmptyState() {
        if (this.emptyState) {
            this.emptyState.style.display = 'none';
        }
    }

    getStatusClass(status) {
        const statusClasses = {
            'in-stock': 'status-in-stock',
            'low-stock': 'status-low-stock',
            'out-of-stock': 'status-out-of-stock',
            'excess-stock': 'status-excess-stock'
        };
        return statusClasses[status] || 'status-in-stock';
    }

    getStatusText(status) {
        const statusTexts = {
            'in-stock': '有庫存',
            'low-stock': '低庫存',
            'out-of-stock': '無庫存',
            'excess-stock': '超量庫存'
        };
        return statusTexts[status] || '未知';
    }

    getCategoryText(category) {
        const categoryTexts = {
            'electronics': '電子產品',
            'clothing': '服飾',
            'food': '食品',
            'books': '書籍'
        };
        return categoryTexts[category] || category;
    }

    showItemDetails(itemId) {
        const item = this.inventory.find(i => i.id.toString() === itemId.toString());
        if (!item) return;
        
        const modal = document.getElementById('inventoryModal');
        const modalTitle = document.getElementById('modalTitle');
        const modalContent = document.getElementById('modalContent');
        
        if (modal && modalTitle && modalContent) {
            modalTitle.textContent = `${item.product_name} - 庫存詳情`;
            modalContent.innerHTML = `
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h4 class="text-lg font-semibold mb-3">基本資訊</h4>
                        <dl class="space-y-2">
                            <div class="flex justify-between">
                                <dt class="text-gray-600">產品名稱:</dt>
                                <dd class="font-medium">${item.product_name}</dd>
                            </div>
                            <div class="flex justify-between">
                                <dt class="text-gray-600">SKU:</dt>
                                <dd class="font-medium">${item.sku}</dd>
                            </div>
                            <div class="flex justify-between">
                                <dt class="text-gray-600">分類:</dt>
                                <dd class="font-medium">${this.getCategoryText(item.category)}</dd>
                            </div>
                            <div class="flex justify-between">
                                <dt class="text-gray-600">倉庫:</dt>
                                <dd class="font-medium">${item.warehouse_name}</dd>
                            </div>
                        </dl>
                    </div>
                    <div>
                        <h4 class="text-lg font-semibold mb-3">庫存資訊</h4>
                        <dl class="space-y-2">
                            <div class="flex justify-between">
                                <dt class="text-gray-600">現有庫存:</dt>
                                <dd class="font-medium text-lg">${item.current_stock.toLocaleString()}</dd>
                            </div>
                            <div class="flex justify-between">
                                <dt class="text-gray-600">安全庫存:</dt>
                                <dd class="font-medium">${item.safety_stock.toLocaleString()}</dd>
                            </div>
                            <div class="flex justify-between">
                                <dt class="text-gray-600">最大庫存:</dt>
                                <dd class="font-medium">${item.max_stock.toLocaleString()}</dd>
                            </div>
                            <div class="flex justify-between">
                                <dt class="text-gray-600">單位成本:</dt>
                                <dd class="font-medium">NT$ ${item.unit_cost.toLocaleString()}</dd>
                            </div>
                            <div class="flex justify-between">
                                <dt class="text-gray-600">總價值:</dt>
                                <dd class="font-medium text-lg">NT$ ${(item.current_stock * item.unit_cost).toLocaleString()}</dd>
                            </div>
                            <div class="flex justify-between">
                                <dt class="text-gray-600">狀態:</dt>
                                <dd><span class="status-badge ${this.getStatusClass(item.status)}">${this.getStatusText(item.status)}</span></dd>
                            </div>
                        </dl>
                    </div>
                </div>
                <div class="mt-6 pt-6 border-t border-gray-200">
                    <div class="flex justify-between items-center">
                        <span class="text-sm text-gray-500">最後更新: ${new Date(item.last_updated).toLocaleString('zh-TW')}</span>
                        <div class="space-x-3">
                            <button onclick="inventoryManager.editItem('${item.id}')" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm">編輯</button>
                            <button onclick="closeModal()" class="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg text-sm">關閉</button>
                        </div>
                    </div>
                </div>
            `;
            modal.classList.remove('hidden');
        }
    }

    editItem(itemId) {
        // Placeholder for edit functionality
        alert(`編輯產品 ID: ${itemId} (功能開發中)`);
    }
}

// Global functions for modal control
window.closeModal = function() {
    const modal = document.getElementById('inventoryModal');
    if (modal) {
        modal.classList.add('hidden');
    }
};

// Global functions for export/import
window.exportInventory = function() {
    // Placeholder for export functionality
    alert('匯出庫存功能開發中');
};

window.importInventory = function() {
    // Placeholder for import functionality
    alert('匯入庫存功能開發中');
};