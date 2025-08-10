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
        this.lastFocusedElement = null;
        this._handleEsc = null;
        this.recentStorageKey = 'nx_recent_products';
        this.recentLimit = 12;

        this.init();
    }

    init() {
        this.bindEvents();
        this.loadCategories();
        this.loadProducts();
        this.renderRecentViewed();
    }

    getProductImage(product) {
        const explicitUrl = product?.images && product.images.length > 0 && product.images[0]?.url;
        if (explicitUrl) return explicitUrl;
        // 線上即時搜尋產品代表圖（無需金鑰，僅 DEMO 用途）
        const q = encodeURIComponent(product?.name || 'product');
        return `https://source.unsplash.com/featured/?${q}`;
    }

    // 最近瀏覽：存取、渲染
    saveRecentView(product) {
        try {
            const list = this.getRecentViews();
            const minimal = {
                id: product.id,
                name: product.name,
                price: product.price,
                category: product.category?.name || product.category || '',
                image: this.getProductImage(product)
            };
            const filtered = list.filter(p => p.id !== minimal.id);
            filtered.unshift(minimal);
            const trimmed = filtered.slice(0, this.recentLimit);
            localStorage.setItem(this.recentStorageKey, JSON.stringify(trimmed));
        } catch (_) {}
    }

    getRecentViews() {
        try {
            const raw = localStorage.getItem(this.recentStorageKey);
            if (!raw) return [];
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : [];
        } catch (_) { return []; }
    }

    renderRecentViewed() {
        const section = document.getElementById('recent-viewed-section');
        const grid = document.getElementById('recent-grid');
        if (!section || !grid) return;
        const items = this.getRecentViews();
        if (!items.length) {
            section.classList.add('hidden');
            return;
        }
        section.classList.remove('hidden');
        grid.innerHTML = items.map(item => {
            const img = item.image || this.getFallbackImage(item);
            return `
            <div class="nx-card overflow-hidden cursor-pointer" role="button" tabindex="0"
                 onclick="productBrowser.viewProductDetail(${item.id})"
                 onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();productBrowser.viewProductDetail(${item.id});}">
                <img src="${img}" alt="${item.name}" class="w-full h-28 object-cover"
                     onerror="this.onerror=null;this.src='https://picsum.photos/seed/recent-${item.id}/400/300'">
                <div class="p-3">
                    <div class="text-sm font-medium truncate" style="color: var(--nx-text-primary);">${item.name}</div>
                    <div class="text-xs" style="color: var(--nx-text-secondary);">$${Number(item.price).toFixed(2)}</div>
                </div>
            </div>`;
        }).join('');
    }

    getFallbackImage(product) {
        const q = encodeURIComponent(product?.name || 'product');
        return `https://source.unsplash.com/featured/?${q}`;
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

        grid.innerHTML = products.map(product => {
            const imageUrl = this.getProductImage(product);
            const fallbackUrl = this.getFallbackImage(product);
            return `
            <div class="nx-card hover:shadow-lg transition-shadow duration-200 overflow-hidden cursor-pointer" 
                 role="button" tabindex="0" aria-label="查看 ${product.name} 詳情"
                 onclick="productBrowser.viewProductDetail(${product.id})"
                 onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();productBrowser.viewProductDetail(${product.id});}">
                <!-- 產品圖片 -->
                <div class="aspect-w-1 aspect-h-1 w-full overflow-hidden relative" style="background: var(--nx-border-primary);">
                    <img src="${imageUrl}" alt="${product.name}"
                         class="w-full h-48 object-cover group-hover:opacity-75"
                         onerror="this.onerror=null;this.src='${fallbackUrl}';">
                    
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
        `;}).join('');
    }

    renderPagination(data) {
        const pagination = document.getElementById('pagination');
        // 兼容多種 API 回應：total_pages、last_page 或由 total/per_page 推導
        const totalPages = data.total_pages || data.last_page || Math.ceil((data.total || 0) / (data.per_page || this.pageSize)) || 1;
        const currentPage = data.current_page || this.currentPage || 1;

        if (totalPages <= 1) {
            pagination.classList.add('hidden');
            return;
        }

        pagination.classList.remove('hidden');

        const nav = document.getElementById('pagination-nav');
        nav.innerHTML = '';

        // 上一頁按鈕
        if (currentPage > 1) {
            nav.appendChild(this.createPageButton('previous', currentPage - 1, '上一頁'));
        }

        // 頁碼按鈕
        const startPage = Math.max(1, currentPage - 2);
        const endPage = Math.min(totalPages, currentPage + 2);

        if (startPage > 1) {
            nav.appendChild(this.createPageButton('page', 1, '1'));
            if (startPage > 2) {
                nav.appendChild(this.createPageButton('ellipsis', null, '...'));
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            nav.appendChild(this.createPageButton('page', i, i.toString(), i === currentPage));
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                nav.appendChild(this.createPageButton('ellipsis', null, '...'));
            }
            nav.appendChild(this.createPageButton('page', totalPages, totalPages.toString()));
        }

        // 下一頁按鈕
        if (currentPage < totalPages) {
            nav.appendChild(this.createPageButton('next', currentPage + 1, '下一頁'));
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
                // 記錄最近瀏覽並刷新區塊
                this.saveRecentView(product);
                this.renderRecentViewed();
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
        const breadcrumb = document.getElementById('product-detail-breadcrumb');
        const content = document.getElementById('product-detail-content');

        // 記錄先前聚焦元素，供關閉後還原
        this.lastFocusedElement = document.activeElement;

        title.textContent = product.name;
        if (breadcrumb) {
            const supplierPart = product.supplier_id
                ? `<li>/</li><li><a href="/marketplace/suppliers/${product.supplier_id}" class="hover:underline" style="color: var(--nx-text-secondary);">${product.supplier?.company_name || '商家'}</a></li>`
                : '';
            breadcrumb.innerHTML = `
                <ol class="inline-flex items-center space-x-1">
                    <li><a href="/marketplace" class="hover:underline" style="color: var(--nx-text-secondary);">市集</a></li>
                    <li>/</li>
                    <li><a href="/marketplace/products" class="hover:underline" style="color: var(--nx-text-secondary);">商品列表</a></li>
                    ${supplierPart}
                    <li>/</li>
                    <li class="text-xs" style="color: var(--nx-text-primary);">${product.name}</li>
                </ol>`;
        }

        const primaryImg = this.getProductImage(product);
        const primaryFallback = this.getFallbackImage(product);
        content.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- 產品圖片 -->
                <div>
                    <div class="space-y-4">
                        <img src="${primaryImg}" alt="${product.name}"
                             class="w-full h-64 object-cover rounded-lg"
                             onerror="this.onerror=null;this.src='${primaryFallback}';">
                        ${product.images && product.images.length > 1 
                            ? `<div class="grid grid-cols-4 gap-2">
                                 ${product.images.slice(1, 5).map(img => 
                                     `<img src="${img.url}" alt="${product.name}" 
                                           class="w-full h-16 object-cover rounded cursor-pointer hover:opacity-75"
                                           onclick="document.querySelector('#product-detail-modal img').src='${img.url}'">`
                                 ).join('')}
                               </div>`
                            : ''
                        }
                    </div>
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
                                ${product.supplier_id ? `
                                  <div class="pt-2">
                                    <a href="/marketplace/suppliers/${product.supplier_id}" class="nx-btn nx-btn-secondary text-xs inline-flex items-center">
                                      前往商家頁
                                    </a>
                                  </div>
                                ` : ''}
                            </div>
                        </div>
                    ` : ''}

                    <div class="border-t pt-4" style="border-color: var(--nx-border-primary);">
                        <button onclick="productBrowser.inquireProduct(${product.id})" 
                                class="w-full nx-btn nx-btn-primary py-3">
                            立即詢價
                        </button>
                        <div class="mt-2 grid grid-cols-2 gap-2">
                            <button id="btn-add-cart" class="nx-btn nx-btn-secondary">加入購物車</button>
                            <button id="btn-go-cart" class="nx-btn nx-btn-secondary">前往購物車</button>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- 推薦商品 -->
            <div class="mt-8 border-t pt-6" style="border-color: var(--nx-border-primary);">
                <h5 class="text-lg font-semibold mb-4" style="color: var(--nx-text-primary);">猜你喜歡</h5>
                <div id="suggestions-grid" class="grid grid-cols-1 sm:grid-cols-2 gap-4"></div>
            </div>
        `;

        modal.classList.remove('hidden');
        // ESC 關閉與焦點設定
        const closeBtn = document.getElementById('close-detail-modal');
        if (closeBtn) closeBtn.focus();
        this._handleEsc = (e) => { if (e.key === 'Escape') { this.closeProductDetailModal(); } };
        document.addEventListener('keydown', this._handleEsc);

        // 綁定購物車按鈕
        try {
            const addBtn = document.getElementById('btn-add-cart');
            const goBtn = document.getElementById('btn-go-cart');
            const payload = { id: product.id, name: product.name, price: product.price, images: product.images, supplier_id: product.supplier_id };
            if (addBtn) addBtn.onclick = () => { demoCart.addItem(payload, 1); (window.nxToast||function(m){console.log(m)})('已加入購物車（DEMO）'); };
            if (goBtn) goBtn.onclick = () => { demoCart.addItem(payload, 1); window.location.href='/marketplace/cart'; };
        } catch(_) {}

        // 載入推薦清單（同類別）
        try {
            const categoryName = product.category?.name || product.category || '';
            const params = new URLSearchParams();
            if (categoryName) params.append('category', categoryName);
            params.append('exclude_id', String(product.id));
            fetch(`${this.apiBaseUrl}/marketplace/products/suggestions?${params.toString()}`)
                .then(r => r.json())
                .then(s => {
                    const suggestions = s.data || [];
                    const grid = document.getElementById('suggestions-grid');
                    if (!grid) return;
                    grid.innerHTML = suggestions.map(item => {
                        const sugUrl = productBrowser.getProductImage(item);
                        const sugFallback = productBrowser.getFallbackImage(item);
                        return `
                        <div class="nx-card p-3 hover:shadow transition-shadow cursor-pointer" role="button" tabindex="0"
                             onclick="productBrowser.viewProductDetail(${item.id})"
                             onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();productBrowser.viewProductDetail(${item.id});}">
                            <div class="flex items-center gap-3">
                                <img src="${sugUrl}" alt="${item.name}" class="w-16 h-16 object-cover rounded"
                                     onerror="this.onerror=null;this.src='${sugFallback}';" />
                                <div class="flex-1">
                                    <div class="text-sm font-medium" style="color: var(--nx-text-primary);">${item.name}</div>
                                    <div class="text-xs" style="color: var(--nx-text-secondary);">$${Number(item.price).toFixed(2)}</div>
                                </div>
                            </div>
                        </div>
                    `;}).join('');
                })
                .catch(() => {});
        } catch (_) {}
    }

    closeProductDetailModal() {
        document.getElementById('product-detail-modal').classList.add('hidden');
        if (this._handleEsc) {
            document.removeEventListener('keydown', this._handleEsc);
            this._handleEsc = null;
        }
        // 還原焦點
        if (this.lastFocusedElement && typeof this.lastFocusedElement.focus === 'function') {
            try { this.lastFocusedElement.focus(); } catch (_) {}
        }
    }

    inquireProduct(productId) {
        // 這裡可以實作詢價功能，例如開啟詢價表單或跳轉到詢價頁面
        (window.nxToast||function(m){console.log(m)})(`產品 ID ${productId} 的詢價功能尚未實作`);
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
        (window.nxToast||function(m){console.log(m)})(message);
    }
}

// 初始化組件
let productBrowser;
document.addEventListener('DOMContentLoaded', () => {
    productBrowser = new ProductBrowser();
});