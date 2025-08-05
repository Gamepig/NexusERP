/**
 * Supplier Product Management Component
 * Handles product CRUD operations for suppliers
 */
class SupplierProductManagement {
    constructor() {
        this.apiBaseUrl = window.APP_CONFIG.API_BASE_URL;
        this.currentPage = 1;
        this.pageSize = 20;
        this.filters = {
            status: '',
            stock_status: '',
            search: ''
        };
        this.isLoading = false;
        this.selectedImages = [];
        this.currentProduct = null;

        this.init();
    }

    init() {
        this.bindEvents();
        this.loadProductStats();
        this.loadProducts();
        this.loadCategories();
    }

    bindEvents() {
        // 新增產品按鈕
        document.getElementById('create-product-btn').addEventListener('click', () => {
            this.openProductModal();
        });

        // 篩選器
        document.getElementById('status-filter').addEventListener('change', (e) => {
            this.filters.status = e.target.value;
            this.currentPage = 1;
            this.loadProducts();
        });

        document.getElementById('stock-filter').addEventListener('change', (e) => {
            this.filters.stock_status = e.target.value;
            this.currentPage = 1;
            this.loadProducts();
        });

        // 搜尋
        let searchTimeout;
        document.getElementById('search-input').addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                this.filters.search = e.target.value;
                this.currentPage = 1;
                this.loadProducts();
            }, 300);
        });

        // 模態框事件
        document.getElementById('close-modal').addEventListener('click', () => {
            this.closeProductModal();
        });

        document.getElementById('cancel-btn').addEventListener('click', () => {
            this.closeProductModal();
        });

        // 產品表單提交
        document.getElementById('product-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveProduct();
        });

        // 圖片上傳
        document.getElementById('file-upload').addEventListener('change', (e) => {
            this.handleImageUpload(e.target.files);
        });

        // 拖拽上傳
        const dropZone = document.querySelector('.border-dashed');
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('border-blue-500', 'bg-blue-50');
        });

        dropZone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            dropZone.classList.remove('border-blue-500', 'bg-blue-50');
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('border-blue-500', 'bg-blue-50');
            this.handleImageUpload(e.dataTransfer.files);
        });

        // 點擊模態框外部關閉
        document.getElementById('product-modal').addEventListener('click', (e) => {
            if (e.target.id === 'product-modal') {
                this.closeProductModal();
            }
        });
    }

    async loadProductStats() {
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`${this.apiBaseUrl}/marketplace/products/my?page_size=1000`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                const products = data.products || [];
                
                // 計算統計數據
                const totalProducts = products.length;
                const activeProducts = products.filter(p => p.status === 'approved').length;
                const pendingProducts = products.filter(p => p.status === 'pending').length;
                const totalViews = products.reduce((sum, p) => sum + (p.view_count || 0), 0);

                // 更新統計卡片
                document.getElementById('total-products').textContent = totalProducts;
                document.getElementById('active-products').textContent = activeProducts;
                document.getElementById('pending-products').textContent = pendingProducts;
                document.getElementById('total-views').textContent = totalViews;
            }
        } catch (error) {
            console.error('載入產品統計失敗:', error);
        }
    }

    async loadProducts() {
        if (this.isLoading) return;
        
        this.isLoading = true;
        this.showLoading();

        try {
            const token = localStorage.getItem('auth_token');
            const params = new URLSearchParams({
                page: this.currentPage,
                page_size: this.pageSize,
                sort_by: 'updated_at',
                sort_order: 'desc'
            });

            // 添加篩選參數
            if (this.filters.status) {
                params.append('status', this.filters.status);
            }
            if (this.filters.stock_status) {
                params.append('stock_status', this.filters.stock_status);
            }
            if (this.filters.search) {
                params.append('search', this.filters.search);
            }

            const response = await fetch(`${this.apiBaseUrl}/marketplace/products/my?${params}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.renderProducts(data);
                this.renderPagination(data);
            } else {
                throw new Error('載入產品失敗');
            }
        } catch (error) {
            console.error('載入產品失敗:', error);
            this.showError('載入產品失敗，請稍後再試。');
        } finally {
            this.isLoading = false;
            this.hideLoading();
        }
    }

    async loadCategories() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/product-categories`);
            if (response.ok) {
                const categories = await response.json();
                const select = document.getElementById('product-category');
                
                categories.forEach(category => {
                    const option = document.createElement('option');
                    option.value = category.id;
                    option.textContent = category.name;
                    select.appendChild(option);
                });
            }
        } catch (error) {
            console.error('載入產品類別失敗:', error);
        }
    }

    renderProducts(data) {
        const tbody = document.getElementById('products-tbody');
        const productsTable = document.getElementById('products-table');
        const emptyState = document.getElementById('empty-state');

        if (!data.products || data.products.length === 0) {
            productsTable.classList.add('hidden');
            emptyState.classList.remove('hidden');
            return;
        }

        emptyState.classList.add('hidden');
        productsTable.classList.remove('hidden');

        tbody.innerHTML = data.products.map(product => `
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                        <div class="flex-shrink-0 h-12 w-12">
                            ${product.images && product.images.length > 0 
                                ? `<img class="h-12 w-12 rounded-lg object-cover" src="${product.images[0].url}" alt="${product.name}">`
                                : `<div class="h-12 w-12 rounded-lg bg-gray-200 flex items-center justify-center">
                                     <svg class="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                         <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                     </svg>
                                   </div>`
                            }
                        </div>
                        <div class="ml-4">
                            <div class="text-sm font-medium text-gray-900">${product.name}</div>
                            <div class="text-sm text-gray-500">${product.brand || '無品牌'}</div>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${product.sku}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">$${Number(product.price).toFixed(2)}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${this.getStockStatusClass(product.stock_status)}">
                        ${this.getStockStatusText(product.stock_status)}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${this.getStatusClass(product.status)}">
                        ${this.getStatusText(product.status)}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${product.view_count || 0}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${this.formatDate(product.updated_at)}</td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div class="flex justify-end space-x-2">
                        <button onclick="supplierProductManagement.editProduct(${product.id})" 
                                class="text-blue-600 hover:text-blue-900">編輯</button>
                        <button onclick="supplierProductManagement.viewProduct(${product.id})" 
                                class="text-green-600 hover:text-green-900">查看</button>
                        <button onclick="supplierProductManagement.deleteProduct(${product.id})" 
                                class="text-red-600 hover:text-red-900">刪除</button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    renderPagination(data) {
        const pagination = document.getElementById('pagination');
        
        if (data.total_pages <= 1) {
            pagination.classList.add('hidden');
            return;
        }

        pagination.classList.remove('hidden');

        // 更新分頁資訊
        document.getElementById('page-start').textContent = (data.current_page - 1) * data.page_size + 1;
        document.getElementById('page-end').textContent = Math.min(data.current_page * data.page_size, data.total_count);
        document.getElementById('total-count').textContent = data.total_count;

        // 產生分頁按鈕
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
        const baseClasses = 'relative inline-flex items-center px-4 py-2 border text-sm font-medium';
        
        if (type === 'ellipsis') {
            button.className = `${baseClasses} border-gray-300 bg-white text-gray-500 cursor-default`;
            button.disabled = true;
        } else if (isActive) {
            button.className = `${baseClasses} border-blue-500 bg-blue-50 text-blue-600`;
        } else {
            button.className = `${baseClasses} border-gray-300 bg-white text-gray-500 hover:bg-gray-50`;
            button.addEventListener('click', () => {
                this.currentPage = page;
                this.loadProducts();
            });
        }
        
        button.textContent = text;
        return button;
    }

    openProductModal(product = null) {
        this.currentProduct = product;
        const modal = document.getElementById('product-modal');
        const form = document.getElementById('product-form');
        const title = document.getElementById('modal-title');

        // 重置表單
        form.reset();
        this.selectedImages = [];
        this.hideImagePreview();

        if (product) {
            title.textContent = '編輯產品';
            this.populateForm(product);
        } else {
            title.textContent = '新增產品';
        }

        modal.classList.remove('hidden');
    }

    closeProductModal() {
        document.getElementById('product-modal').classList.add('hidden');
        this.currentProduct = null;
        this.selectedImages = [];
    }

    populateForm(product) {
        document.getElementById('product-id').value = product.id;
        document.getElementById('product-name').value = product.name;
        document.getElementById('product-sku').value = product.sku;
        document.getElementById('product-description').value = product.description || '';
        document.getElementById('product-price').value = product.price;
        document.getElementById('product-min-quantity').value = product.minimum_order_quantity;
        document.getElementById('product-brand').value = product.brand || '';
        document.getElementById('product-category').value = product.category_id || '';
        document.getElementById('product-stock-quantity').value = product.stock_quantity || '';
        document.getElementById('product-low-stock-threshold').value = product.low_stock_threshold || '';
        document.getElementById('product-stock-status').value = product.stock_status || 'in_stock';
    }

    async saveProduct() {
        const form = document.getElementById('product-form');
        const formData = new FormData(form);
        const productId = document.getElementById('product-id').value;
        
        // 添加圖片檔案
        this.selectedImages.forEach((file, index) => {
            formData.append(`images[${index}]`, file);
        });

        const saveBtn = document.getElementById('save-btn');
        const originalText = saveBtn.textContent;
        saveBtn.textContent = '儲存中...';
        saveBtn.disabled = true;

        try {
            const token = localStorage.getItem('auth_token');
            const url = productId 
                ? `${this.apiBaseUrl}/marketplace/products/${productId}`
                : `${this.apiBaseUrl}/marketplace/products`;
            
            const method = productId ? 'PUT' : 'POST';

            // 如果是更新操作，需要轉換為 JSON 格式（因為後端期望 JSON）
            let requestInit;
            if (productId) {
                const data = {};
                for (let [key, value] of formData.entries()) {
                    if (!key.startsWith('images[')) {
                        data[key] = value;
                    }
                }
                
                requestInit = {
                    method,
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                };
            } else {
                // 新建產品，使用 FormData 以支援圖片上傳
                const data = {};
                for (let [key, value] of formData.entries()) {
                    if (!key.startsWith('images[')) {
                        data[key] = value;
                    }
                }

                requestInit = {
                    method,
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                };
            }

            const response = await fetch(url, requestInit);

            if (response.ok) {
                this.showSuccess(productId ? '產品更新成功！' : '產品建立成功！');
                this.closeProductModal();
                this.loadProducts();
                this.loadProductStats();
            } else {
                const error = await response.json();
                throw new Error(error.error || '儲存失敗');
            }
        } catch (error) {
            console.error('儲存產品失敗:', error);
            this.showError(error.message || '儲存產品失敗，請稍後再試。');
        } finally {
            saveBtn.textContent = originalText;
            saveBtn.disabled = false;
        }
    }

    async editProduct(productId) {
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`${this.apiBaseUrl}/marketplace/products/${productId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const product = await response.json();
                this.openProductModal(product);
            } else {
                throw new Error('載入產品資料失敗');
            }
        } catch (error) {
            console.error('載入產品資料失敗:', error);
            this.showError('載入產品資料失敗，請稍後再試。');
        }
    }

    async viewProduct(productId) {
        // 在新分頁中開啟產品詳情頁面
        window.open(`/marketplace/products/${productId}`, '_blank');
    }

    async deleteProduct(productId) {
        if (!confirm('確定要刪除此產品嗎？此操作無法復原。')) {
            return;
        }

        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`${this.apiBaseUrl}/marketplace/products/${productId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                this.showSuccess('產品已成功刪除！');
                this.loadProducts();
                this.loadProductStats();
            } else {
                throw new Error('刪除失敗');
            }
        } catch (error) {
            console.error('刪除產品失敗:', error);
            this.showError('刪除產品失敗，請稍後再試。');
        }
    }

    handleImageUpload(files) {
        const maxSize = 10 * 1024 * 1024; // 10MB
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];

        Array.from(files).forEach(file => {
            if (!allowedTypes.includes(file.type)) {
                this.showError(`檔案 ${file.name} 格式不支援，請選擇 JPG、PNG 格式的圖片。`);
                return;
            }

            if (file.size > maxSize) {
                this.showError(`檔案 ${file.name} 大小超過 10MB 限制。`);
                return;
            }

            this.selectedImages.push(file);
        });

        this.updateImagePreview();
    }

    updateImagePreview() {
        const preview = document.getElementById('image-preview');
        
        if (this.selectedImages.length === 0) {
            this.hideImagePreview();
            return;
        }

        preview.classList.remove('hidden');
        preview.innerHTML = this.selectedImages.map((file, index) => `
            <div class="relative">
                <img src="${URL.createObjectURL(file)}" alt="Preview" class="w-full h-24 object-cover rounded-lg">
                <button type="button" onclick="supplierProductManagement.removeImage(${index})"
                        class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600">
                    ×
                </button>
                <p class="mt-1 text-xs text-gray-500 truncate">${file.name}</p>
            </div>
        `).join('');
    }

    removeImage(index) {
        // 釋放 URL
        if (this.selectedImages[index]) {
            URL.revokeObjectURL(URL.createObjectURL(this.selectedImages[index]));
        }
        
        this.selectedImages.splice(index, 1);
        this.updateImagePreview();
    }

    hideImagePreview() {
        document.getElementById('image-preview').classList.add('hidden');
    }

    showLoading() {
        document.getElementById('loading-spinner').classList.remove('hidden');
        document.getElementById('products-table').classList.add('hidden');
        document.getElementById('empty-state').classList.add('hidden');
    }

    hideLoading() {
        document.getElementById('loading-spinner').classList.add('hidden');
    }

    getStatusClass(status) {
        const statusClasses = {
            'draft': 'bg-gray-100 text-gray-800',
            'pending': 'bg-yellow-100 text-yellow-800',
            'approved': 'bg-green-100 text-green-800',
            'rejected': 'bg-red-100 text-red-800',
            'inactive': 'bg-gray-100 text-gray-800'
        };
        return statusClasses[status] || 'bg-gray-100 text-gray-800';
    }

    getStatusText(status) {
        const statusTexts = {
            'draft': '草稿',
            'pending': '待審核',
            'approved': '已上架',
            'rejected': '已拒絕',
            'inactive': '已下架'
        };
        return statusTexts[status] || status;
    }

    getStockStatusClass(stockStatus) {
        const statusClasses = {
            'in_stock': 'bg-green-100 text-green-800',
            'low_stock': 'bg-yellow-100 text-yellow-800',
            'out_of_stock': 'bg-red-100 text-red-800'
        };
        return statusClasses[stockStatus] || 'bg-gray-100 text-gray-800';
    }

    getStockStatusText(stockStatus) {
        const statusTexts = {
            'in_stock': '有庫存',
            'low_stock': '庫存不足',
            'out_of_stock': '缺貨'
        };
        return statusTexts[stockStatus] || stockStatus;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('zh-TW', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    showSuccess(message) {
        // 可以使用 toast 通知或其他 UI 組件
        alert(message);
    }

    showError(message) {
        // 可以使用 toast 通知或其他 UI 組件
        alert(message);
    }
}

// 初始化組件
let supplierProductManagement;
document.addEventListener('DOMContentLoaded', () => {
    supplierProductManagement = new SupplierProductManagement();
});