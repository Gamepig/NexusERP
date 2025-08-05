/**
 * Product Browser Component
 * Handles public product browsing and search functionality
 */
class ProductBrowser {
    constructor() {
        this.apiBaseUrl = '/api';  // Use Laravel API
        this.currentPage = 1;
        this.pageSize = 12;
        this.filters = {
            search: '',
            category_id: '',
            brand: '',
            price_min: '',
            price_max: '',
            stock_status: [],
            is_featured: false,
            is_new_arrival: false,
            is_bestseller: false
        };
        this.sortBy = 'created_at';
        this.sortOrder = 'desc';
        this.isLoading = false;

        this.init();
    }

    init() {
        this.bindEvents();
        this.loadCategories();
        this.loadProducts();
    }

    bindEvents() {
        // 搜尋
        let searchTimeout;
        document.getElementById('search').addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                this.filters.search = e.target.value;
                this.currentPage = 1;
                this.loadProducts();
            }, 300);
        });

        // 類別篩選
        document.getElementById('category').addEventListener('change', (e) => {
            this.filters.category_id = e.target.value;
            this.currentPage = 1;
            this.loadProducts();
        });

        // 價格範圍
        let priceTimeout;
        document.getElementById('price-min').addEventListener('input', (e) => {
            clearTimeout(priceTimeout);
            priceTimeout = setTimeout(() => {
                this.filters.price_min = e.target.value;
                this.currentPage = 1;
                this.loadProducts();
            }, 500);
        });

        document.getElementById('price-max').addEventListener('input', (e) => {
            clearTimeout(priceTimeout);
            priceTimeout = setTimeout(() => {
                this.filters.price_max = e.target.value;
                this.currentPage = 1;
                this.loadProducts();
            }, 500);
        });

        // 品牌篩選
        let brandTimeout;
        document.getElementById('brand').addEventListener('input', (e) => {
            clearTimeout(brandTimeout);
            brandTimeout = setTimeout(() => {
                this.filters.brand = e.target.value;
                this.currentPage = 1;
                this.loadProducts();
            }, 300);
        });

        // 庫存狀態複選框
        document.getElementById('stock-in').addEventListener('change', () => {
            this.updateStockStatusFilter();
        });

        document.getElementById('stock-low').addEventListener('change', () => {
            this.updateStockStatusFilter();
        });

        // 特殊標籤複選框
        document.getElementById('featured').addEventListener('change', (e) => {
            this.filters.is_featured = e.target.checked;
            this.currentPage = 1;
            this.loadProducts();
        });

        document.getElementById('new-arrival').addEventListener('change', (e) => {
            this.filters.is_new_arrival = e.target.checked;
            this.currentPage = 1;
            this.loadProducts();
        });

        document.getElementById('bestseller').addEventListener('change', (e) => {
            this.filters.is_bestseller = e.target.checked;
            this.currentPage = 1;
            this.loadProducts();
        });

        // 排序
        document.getElementById('sort-by').addEventListener('change', (e) => {
            const value = e.target.value;
            if (value.startsWith('-')) {
                this.sortBy = value.substring(1);
                this.sortOrder = 'desc';
            } else {
                this.sortBy = value;
                this.sortOrder = 'asc';
            }
            this.currentPage = 1;
            this.loadProducts();
        });

        // 每頁顯示數量
        document.getElementById('page-size').addEventListener('change', (e) => {
            this.pageSize = parseInt(e.target.value);
            this.currentPage = 1;
            this.loadProducts();
        });

        // 重置篩選
        document.getElementById('reset-filters').addEventListener('click', () => {
            this.resetFilters();
        });

        // 產品詳情模態框
        document.getElementById('close-detail-modal').addEventListener('click', () => {
            this.closeProductDetailModal();
        });

        document.getElementById('product-detail-modal').addEventListener('click', (e) => {
            if (e.target.id === 'product-detail-modal') {
                this.closeProductDetailModal();
            }
        });
    }

    updateStockStatusFilter() {
        const stockStatus = [];
        if (document.getElementById('stock-in').checked) {
            stockStatus.push('in_stock');
        }
        if (document.getElementById('stock-low').checked) {
            stockStatus.push('low_stock');
        }
        
        this.filters.stock_status = stockStatus;
        this.currentPage = 1;
        this.loadProducts();
    }

    resetFilters() {
        // 重置所有篩選條件
        document.getElementById('search').value = '';
        document.getElementById('category').value = '';
        document.getElementById('price-min').value = '';
        document.getElementById('price-max').value = '';
        document.getElementById('brand').value = '';
        document.getElementById('stock-in').checked = false;
        document.getElementById('stock-low').checked = false;
        document.getElementById('featured').checked = false;
        document.getElementById('new-arrival').checked = false;
        document.getElementById('bestseller').checked = false;

        this.filters = {
            search: '',
            category_id: '',
            brand: '',
            price_min: '',
            price_max: '',
            stock_status: [],
            is_featured: false,
            is_new_arrival: false,
            is_bestseller: false
        };

        this.currentPage = 1;
        this.loadProducts();
    }

    async loadCategories() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/marketplace/categories`);
            if (response.ok) {
                const data = await response.json();
                const categories = data.data || [];
                const select = document.getElementById('category');
                
                categories.forEach(category => {
                    const option = document.createElement('option');
                    option.value = category.id;
                    option.textContent = category.name;
                    select.appendChild(option);
                });
            }
        } catch (error) {
            console.error('載入產品類別失敗:', error);
            // Use fallback mock data
            this.loadMockCategories();
        }
    }

    loadMockCategories() {
        const mockCategories = [
            { id: 1, name: '電子產品' },
            { id: 2, name: '辦公用品' },
            { id: 3, name: '服裝配件' },
            { id: 4, name: '家居用品' }
        ];
        
        const select = document.getElementById('category');
        mockCategories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            select.appendChild(option);
        });
    }

    async loadProducts() {
        if (this.isLoading) return;
        
        this.isLoading = true;
        this.showLoading();

        try {
            const params = new URLSearchParams({
                page: this.currentPage,
                page_size: this.pageSize,
                sort_by: this.sortBy,
                sort_order: this.sortOrder,
                status: 'approved' // 只顯示已審核通過的產品
            });

            // 添加篩選參數
            if (this.filters.search) {
                params.append('search', this.filters.search);
            }
            if (this.filters.category_id) {
                params.append('category_id', this.filters.category_id);
            }
            if (this.filters.brand) {
                params.append('brand', this.filters.brand);
            }
            if (this.filters.price_min) {
                params.append('price_min', this.filters.price_min);
            }
            if (this.filters.price_max) {
                params.append('price_max', this.filters.price_max);
            }
            if (this.filters.stock_status.length > 0) {
                params.append('stock_status', this.filters.stock_status.join(','));
            }
            if (this.filters.is_featured) {
                params.append('is_featured', 'true');
            }
            if (this.filters.is_new_arrival) {
                params.append('is_new_arrival', 'true');
            }
            if (this.filters.is_bestseller) {
                params.append('is_bestseller', 'true');
            }

            const response = await fetch(`${this.apiBaseUrl}/marketplace/products?${params}`);

            if (response.ok) {
                const data = await response.json();
                this.renderProducts(data);
                this.renderPagination(data);
                this.updateProductCount(data.total || data.data?.length || 0);
            } else {
                throw new Error('載入產品失敗');
            }
        } catch (error) {
            console.error('載入產品失敗:', error);
            // Use fallback mock data
            this.loadMockProducts();
        } finally {
            this.isLoading = false;
            this.hideLoading();
        }
    }

    loadMockProducts() {
        const mockData = {
            data: [
                {
                    id: 1,
                    name: '無線藍牙耳機',
                    description: '高品質無線藍牙耳機，支援降噪功能',
                    price: 2999,
                    supplier: '科技供應商 A',
                    category: '電子產品',
                    images: [{ url: '/images/products/bluetooth-headphones.jpg' }],
                    rating: 4.5,
                    reviews_count: 128,
                    in_stock: true,
                    is_featured: true,
                    stock_status: 'in_stock',
                    minimum_order_quantity: 1,
                    view_count: 256,
                    sku: 'BT-HEAD-001',
                    brand: '科技品牌'
                },
                {
                    id: 2,
                    name: '辦公桌椅組合',
                    description: '人體工學設計辦公桌椅，提升工作效率',
                    price: 8900,
                    supplier: '家具供應商 B',
                    category: '辦公用品',
                    images: [{ url: '/images/products/office-chair.jpg' }],
                    rating: 4.2,
                    reviews_count: 89,
                    in_stock: true,
                    is_new_arrival: true,
                    stock_status: 'in_stock',
                    minimum_order_quantity: 1,
                    view_count: 184,
                    sku: 'OFF-CHAIR-002',
                    brand: '家具品牌'
                },
                {
                    id: 3,
                    name: '商務背包',
                    description: '多功能商務背包，適合出差和日常使用',
                    price: 1599,
                    supplier: '箱包供應商 C',
                    category: '服裝配件',
                    images: [{ url: '/images/products/business-backpack.jpg' }],
                    rating: 4.7,
                    reviews_count: 203,
                    in_stock: false,
                    is_bestseller: true,
                    stock_status: 'out_of_stock',
                    minimum_order_quantity: 1,
                    view_count: 312,
                    sku: 'BAG-BUS-003',
                    brand: '箱包品牌'
                },
                {
                    id: 4,
                    name: '智慧溫控水壺',
                    description: '可調節溫度的智慧保溫水壺',
                    price: 799,
                    supplier: '家電供應商 D',
                    category: '家居用品',
                    images: [{ url: '/images/products/smart-bottle.jpg' }],
                    rating: 4.3,
                    reviews_count: 156,
                    in_stock: true,
                    stock_status: 'low_stock',
                    minimum_order_quantity: 2,
                    view_count: 95,
                    sku: 'BOT-SMART-004',
                    brand: '家電品牌'
                }
            ],
            total: 4,
            per_page: 20,
            current_page: 1,
            last_page: 1
        };
        
        this.renderProducts(mockData);
        this.renderPagination(mockData);
        this.updateProductCount(mockData.total);
    }

    renderProducts(data) {
        const grid = document.getElementById('products-grid');
        const emptyState = document.getElementById('empty-state');
        
        // Handle both API response formats
        const products = data.products || data.data || [];

        if (products.length === 0) {
            grid.classList.add('hidden');
            emptyState.classList.remove('hidden');
            return;
        }

        emptyState.classList.add('hidden');
        grid.classList.remove('hidden');

        grid.innerHTML = products.map(product => `
            <div class="nx-card hover:shadow-lg transition-shadow duration-200 overflow-hidden cursor-pointer" 
                 onclick="productBrowser.viewProductDetail(${product.id})">
                <!-- 產品圖片 -->
                <div class="aspect-w-1 aspect-h-1 w-full overflow-hidden relative" style="background: var(--nx-border-primary);">
                    ${product.images && product.images.length > 0 
                        ? `<img src="${product.images[0].url}" alt="${product.name}" 
                               class="w-full h-48 object-cover group-hover:opacity-75">`
                        : `<div class="w-full h-48 flex items-center justify-center">
                             <svg class="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="color: var(--nx-text-muted);">
                                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                       d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z">
                                 </path>
                             </svg>
                           </div>`
                    }
                    
                    <!-- 標籤 -->
                    <div class="absolute top-2 left-2 flex flex-col space-y-1">
                        ${product.is_featured ? '<span class="text-white text-xs px-2 py-1 rounded" style="background: var(--nx-accent-orange);">精選</span>' : ''}
                        ${product.is_new_arrival ? '<span class="text-white text-xs px-2 py-1 rounded" style="background: var(--nx-accent-green);">新品</span>' : ''}
                        ${product.is_bestseller ? '<span class="text-white text-xs px-2 py-1 rounded" style="background: var(--nx-accent-red);">熱銷</span>' : ''}
                    </div>
                    
                    <!-- 庫存狀態 -->
                    <div class="absolute top-2 right-2">
                        <span class="px-2 py-1 text-xs font-medium rounded-full text-white" style="background: ${this.getStockStatusColor(product.stock_status)};">
                            ${this.getStockStatusText(product.stock_status)}
                        </span>
                    </div>
                </div>

                <!-- 產品資訊 -->
                <div class="p-4">
                    <h3 class="text-lg font-medium mb-1 truncate" title="${product.name}" style="color: var(--nx-text-primary);">
                        ${product.name}
                    </h3>
                    
                    <p class="text-sm mb-2" style="color: var(--nx-text-secondary);">${product.brand || '無品牌'}</p>
                    
                    <p class="text-sm mb-3 line-clamp-2" style="color: var(--nx-text-secondary);">
                        ${product.description || '暫無描述'}
                    </p>
                    
                    <div class="flex justify-between items-center">
                        <div>
                            <span class="text-2xl font-bold" style="color: var(--nx-accent-blue);">$${Number(product.price).toFixed(2)}</span>
                            <div class="text-xs" style="color: var(--nx-text-muted);">最小訂購量: ${product.minimum_order_quantity}</div>
                        </div>
                        <div class="text-right">
                            <div class="text-xs" style="color: var(--nx-text-muted);">瀏覽 ${product.view_count || 0} 次</div>
                            <div class="text-xs" style="color: var(--nx-text-muted);">${product.supplier?.company_name || '供應商'}</div>
                        </div>
                    </div>
                    
                    <!-- 詢價按鈕 -->
                    <button onclick="event.stopPropagation(); productBrowser.inquireProduct(${product.id})" 
                            class="mt-3 w-full nx-btn nx-btn-primary">
                        詢價
                    </button>
                </div>
            </div>
        `).join('');
    }

    renderPagination(data) {
        const pagination = document.getElementById('pagination');
        
        if (data.total_pages <= 1) {
            pagination.classList.add('hidden');
            return;
        }

        pagination.classList.remove('hidden');

        const nav = document.getElementById('pagination-nav');
        nav.innerHTML = '';

        // 上一頁按鈕
        if (data.current_page > 1) {
            nav.appendChild(this.createPageButton('previous', data.current_page - 1, '上一頁'));
        }

        // 頁碼按鈕
        const startPage = Math.max(1, data.current_page - 2);
        const endPage = Math.min(data.total_pages, data.current_page + 2);

        if (startPage > 1) {
            nav.appendChild(this.createPageButton('page', 1, '1'));
            if (startPage > 2) {
                nav.appendChild(this.createPageButton('ellipsis', null, '...'));
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            nav.appendChild(this.createPageButton('page', i, i.toString(), i === data.current_page));
        }

        if (endPage < data.total_pages) {
            if (endPage < data.total_pages - 1) {
                nav.appendChild(this.createPageButton('ellipsis', null, '...'));
            }
            nav.appendChild(this.createPageButton('page', data.total_pages, data.total_pages.toString()));
        }

        // 下一頁按鈕
        if (data.current_page < data.total_pages) {
            nav.appendChild(this.createPageButton('next', data.current_page + 1, '下一頁'));
        }
    }

    createPageButton(type, page, text, isActive = false) {
        const button = document.createElement('button');
        const baseClasses = 'relative inline-flex items-center px-4 py-2 border text-sm font-medium transition-colors';
        
        if (type === 'ellipsis') {
            button.className = `${baseClasses} cursor-default`;
            button.style.cssText = `
                border-color: var(--nx-border-primary);
                background: var(--nx-card-bg);
                color: var(--nx-text-muted);
            `;
            button.disabled = true;
        } else if (isActive) {
            button.className = `${baseClasses}`;
            button.style.cssText = `
                border-color: var(--nx-accent-purple);
                background: var(--nx-accent-purple);
                color: white;
            `;
        } else {
            button.className = `${baseClasses}`;
            button.style.cssText = `
                border-color: var(--nx-border-primary);
                background: var(--nx-card-bg);
                color: var(--nx-text-secondary);
            `;
            button.addEventListener('mouseenter', () => {
                button.style.background = 'var(--nx-border-primary)';
            });
            button.addEventListener('mouseleave', () => {
                button.style.background = 'var(--nx-card-bg)';
            });
            button.addEventListener('click', () => {
                this.currentPage = page;
                this.loadProducts();
            });
        }
        
        button.textContent = text;
        return button;
    }

    async viewProductDetail(productId) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/marketplace/products/${productId}`);
            
            if (response.ok) {
                const product = await response.json();
                this.showProductDetailModal(product);
            } else {
                throw new Error('載入產品詳情失敗');
            }
        } catch (error) {
            console.error('載入產品詳情失敗:', error);
            this.showError('載入產品詳情失敗，請稍後再試。');
        }
    }

    showProductDetailModal(product) {
        const modal = document.getElementById('product-detail-modal');
        const title = document.getElementById('product-detail-title');
        const content = document.getElementById('product-detail-content');

        title.textContent = product.name;

        content.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- 產品圖片 -->
                <div>
                    ${product.images && product.images.length > 0 
                        ? `<div class="space-y-4">
                             <img src="${product.images[0].url}" alt="${product.name}" 
                                  class="w-full h-64 object-cover rounded-lg">
                             ${product.images.length > 1 
                                 ? `<div class="grid grid-cols-4 gap-2">
                                      ${product.images.slice(1, 5).map(img => 
                                          `<img src="${img.url}" alt="${product.name}" 
                                                class="w-full h-16 object-cover rounded cursor-pointer hover:opacity-75"
                                                onclick="document.querySelector('#product-detail-modal img').src='${img.url}'">`
                                      ).join('')}
                                    </div>`
                                 : ''
                             }
                           </div>`
                        : `<div class="w-full h-64 rounded-lg flex items-center justify-center" style="background: var(--nx-border-primary);">
                             <svg class="h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="color: var(--nx-text-muted);">
                                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                       d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z">
                                 </path>
                             </svg>
                           </div>`
                    }
                </div>

                <!-- 產品資訊 -->
                <div class="space-y-4">
                    <div>
                        <h4 class="text-xl font-semibold" style="color: var(--nx-text-primary);">${product.name}</h4>
                        <p style="color: var(--nx-text-secondary);">${product.brand || '無品牌'}</p>
                    </div>

                    <div>
                        <span class="text-3xl font-bold" style="color: var(--nx-accent-blue);">$${Number(product.price).toFixed(2)}</span>
                        <div class="mt-1 text-sm" style="color: var(--nx-text-muted);">最小訂購量: ${product.minimum_order_quantity}</div>
                    </div>

                    <div class="space-y-2">
                        <div class="flex items-center space-x-2">
                            <span class="text-sm font-medium" style="color: var(--nx-text-secondary);">庫存狀態:</span>
                            <span class="px-2 py-1 text-xs font-medium rounded-full text-white" style="background: ${this.getStockStatusColor(product.stock_status)};">
                                ${this.getStockStatusText(product.stock_status)}
                            </span>
                        </div>
                        
                        <div class="flex items-center space-x-2">
                            <span class="text-sm font-medium" style="color: var(--nx-text-secondary);">SKU:</span>
                            <span class="text-sm" style="color: var(--nx-text-primary);">${product.sku}</span>
                        </div>
                        
                        ${product.category ? `
                            <div class="flex items-center space-x-2">
                                <span class="text-sm font-medium" style="color: var(--nx-text-secondary);">類別:</span>
                                <span class="text-sm" style="color: var(--nx-text-primary);">${product.category.name}</span>
                            </div>
                        ` : ''}
                        
                        <div class="flex items-center space-x-2">
                            <span class="text-sm font-medium" style="color: var(--nx-text-secondary);">瀏覽次數:</span>
                            <span class="text-sm" style="color: var(--nx-text-primary);">${product.view_count || 0}</span>
                        </div>
                    </div>

                    ${product.description ? `
                        <div>
                            <h5 class="text-sm font-medium mb-2" style="color: var(--nx-text-secondary);">產品描述</h5>
                            <p class="text-sm" style="color: var(--nx-text-primary);">${product.description}</p>
                        </div>
                    ` : ''}

                    ${product.supplier ? `
                        <div class="border-t pt-4" style="border-color: var(--nx-border-primary);">
                            <h5 class="text-sm font-medium mb-2" style="color: var(--nx-text-secondary);">供應商資訊</h5>
                            <div class="space-y-1">
                                <p class="text-sm" style="color: var(--nx-text-primary);">${product.supplier.company_name}</p>
                                ${product.supplier.contact_person ? `<p class="text-sm" style="color: var(--nx-text-secondary);">聯絡人: ${product.supplier.contact_person}</p>` : ''}
                                ${product.supplier.business_type ? `<p class="text-sm" style="color: var(--nx-text-secondary);">業務類型: ${this.getBusinessTypeText(product.supplier.business_type)}</p>` : ''}
                            </div>
                        </div>
                    ` : ''}

                    <div class="border-t pt-4" style="border-color: var(--nx-border-primary);">
                        <button onclick="productBrowser.inquireProduct(${product.id})" 
                                class="w-full nx-btn nx-btn-primary py-3">
                            立即詢價
                        </button>
                    </div>
                </div>
            </div>
        `;

        modal.classList.remove('hidden');
    }

    closeProductDetailModal() {
        document.getElementById('product-detail-modal').classList.add('hidden');
    }

    inquireProduct(productId) {
        // 這裡可以實作詢價功能，例如開啟詢價表單或跳轉到詢價頁面
        alert(`產品 ID ${productId} 的詢價功能尚未實作`);
    }

    updateProductCount(count) {
        document.getElementById('total-products-count').textContent = `找到 ${count} 個產品`;
    }

    showLoading() {
        document.getElementById('loading').classList.remove('hidden');
        document.getElementById('products-grid').classList.add('hidden');
        document.getElementById('empty-state').classList.add('hidden');
    }

    hideLoading() {
        document.getElementById('loading').classList.add('hidden');
    }

    getStockStatusClass(stockStatus) {
        const statusClasses = {
            'in_stock': 'text-white text-xs px-2 py-1 rounded-full',
            'low_stock': 'text-white text-xs px-2 py-1 rounded-full',
            'out_of_stock': 'text-white text-xs px-2 py-1 rounded-full'
        };
        return statusClasses[stockStatus] || 'text-white text-xs px-2 py-1 rounded-full';
    }

    getStockStatusColor(stockStatus) {
        const statusColors = {
            'in_stock': 'var(--nx-accent-green)',
            'low_stock': 'var(--nx-accent-orange)',
            'out_of_stock': 'var(--nx-accent-red)'
        };
        return statusColors[stockStatus] || '#6b7280';
    }

    getStockStatusText(stockStatus) {
        const statusTexts = {
            'in_stock': '有庫存',
            'low_stock': '庫存不足',
            'out_of_stock': '缺貨'
        };
        return statusTexts[stockStatus] || stockStatus;
    }

    getBusinessTypeText(businessType) {
        const typeTexts = {
            'manufacturer': '製造商',
            'distributor': '經銷商',
            'retailer': '零售商',
            'service_provider': '服務供應商'
        };
        return typeTexts[businessType] || businessType;
    }

    showError(message) {
        alert(message);
    }
}

// 初始化組件
let productBrowser;
document.addEventListener('DOMContentLoaded', () => {
    productBrowser = new ProductBrowser();
});