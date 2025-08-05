/**
 * ProductAutocomplete - 產品搜尋自動完成組件
 * 提供即時產品搜尋、選擇和資料填入功能
 */
class ProductAutocomplete {
    constructor(inputElement, options = {}) {
        this.input = inputElement;
        this.options = {
            minLength: 2,                    // 最小搜尋字元數
            debounceTime: 300,              // 防抖動延遲時間 (毫秒)
            apiUrl: '/api/products/search', // 搜尋 API 端點
            maxResults: 10,                 // 最大顯示結果數
            onSelect: null,                 // 選擇回調函數
            onError: null,                  // 錯誤回調函數
            placeholder: '輸入產品名稱（可搜尋或手動輸入）', // 佔位符文字
            noResultsText: '找不到相關產品',      // 無結果文字
            loadingText: '搜尋中...',            // 載入中文字
            ...options
        };
        
        // 組件狀態
        this.isOpen = false;
        this.selectedIndex = -1;
        this.results = [];
        this.currentRequest = null;
        
        this.init();
    }

    /**
     * 初始化組件
     */
    init() {
        this.setupInput();
        this.createDropdown();
        this.bindEvents();
        this.setupKeyboardNavigation();
    }

    /**
     * 設置輸入框
     */
    setupInput() {
        this.input.setAttribute('autocomplete', 'off');
        this.input.setAttribute('role', 'combobox');
        this.input.setAttribute('aria-expanded', 'false');
        this.input.setAttribute('aria-haspopup', 'listbox');
        
        if (this.options.placeholder) {
            this.input.setAttribute('placeholder', this.options.placeholder);
        }
    }

    /**
     * 建立下拉選單
     */
    createDropdown() {
        this.dropdown = document.createElement('div');
        this.dropdown.className = 'product-autocomplete-dropdown absolute z-50 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto';
        this.dropdown.style.display = 'none';
        this.dropdown.setAttribute('role', 'listbox');
        
        // 確保父容器有相對定位
        const parent = this.input.parentNode;
        if (getComputedStyle(parent).position === 'static') {
            parent.style.position = 'relative';
        }
        
        parent.appendChild(this.dropdown);
    }

    /**
     * 綁定事件監聽器
     */
    bindEvents() {
        let searchTimeout;
        
        // 輸入事件 (防抖動搜尋)
        this.input.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            const query = e.target.value.trim();
            
            if (query.length === 0) {
                this.hideDropdown();
                return;
            }
            
            if (query.length < this.options.minLength) {
                this.showMessage(this.options.loadingText);
                return;
            }
            
            searchTimeout = setTimeout(() => {
                this.search(query);
            }, this.options.debounceTime);
        });

        // 焦點事件
        this.input.addEventListener('focus', () => {
            if (this.results.length > 0) {
                this.showDropdown();
            }
        });

        // 失焦事件 (延遲隱藏以允許點擊選項)
        this.input.addEventListener('blur', () => {
            setTimeout(() => {
                this.hideDropdown();
            }, 200);
        });

        // 點擊外部關閉
        document.addEventListener('click', (e) => {
            if (!this.input.contains(e.target) && !this.dropdown.contains(e.target)) {
                this.hideDropdown();
            }
        });
    }

    /**
     * 設置鍵盤導航
     */
    setupKeyboardNavigation() {
        this.input.addEventListener('keydown', (e) => {
            if (!this.isOpen) return;

            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    this.selectedIndex = Math.min(this.selectedIndex + 1, this.results.length - 1);
                    this.highlightOption();
                    break;
                    
                case 'ArrowUp':
                    e.preventDefault();
                    this.selectedIndex = Math.max(this.selectedIndex - 1, -1);
                    this.highlightOption();
                    break;
                    
                case 'Enter':
                    e.preventDefault();
                    if (this.selectedIndex >= 0 && this.results[this.selectedIndex]) {
                        this.selectOption(this.results[this.selectedIndex]);
                    }
                    break;
                    
                case 'Escape':
                    e.preventDefault();
                    this.hideDropdown();
                    break;
            }
        });
    }

    /**
     * 執行產品搜尋
     */
    async search(query) {
        try {
            // 取消上一個請求
            if (this.currentRequest) {
                this.currentRequest.abort();
            }

            this.showMessage(this.options.loadingText);

            // 建立新請求
            const controller = new AbortController();
            this.currentRequest = controller;

            const response = await fetch(`${this.options.apiUrl}?q=${encodeURIComponent(query)}&limit=${this.options.maxResults}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || ''
                },
                credentials: 'include', // 重要：包含session cookie進行認證
                signal: controller.signal
            });

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('請登入後再搜尋產品');
                } else if (response.status === 403) {
                    throw new Error('沒有權限搜尋產品');
                } else {
                    throw new Error(`搜尋失敗 (${response.status})`);
                }
            }

            const data = await response.json();
            
            if (data.success && Array.isArray(data.products)) {
                this.results = data.products;
                this.displayResults();
            } else {
                this.showMessage(this.options.noResultsText);
            }

        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('Product search error:', error);
                this.showMessage('搜尋失敗，請稍後再試');
                
                if (this.options.onError) {
                    this.options.onError(error);
                }
            }
        } finally {
            this.currentRequest = null;
        }
    }

    /**
     * 顯示搜尋結果
     */
    displayResults() {
        if (this.results.length === 0) {
            this.showMessage(this.options.noResultsText);
            return;
        }

        const html = this.results.map((product, index) => {
            return `
                <div class="autocomplete-item px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-200 dark:border-gray-600 last:border-b-0" 
                     data-index="${index}" role="option">
                    <div class="flex justify-between items-start">
                        <div class="flex-1">
                            <h4 class="text-sm font-medium text-gray-900 dark:text-white">
                                ${this.escapeHtml(product.name)}
                            </h4>
                            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                編號: ${this.escapeHtml(product.sku || 'N/A')}
                            </p>
                            ${product.description ? `
                                <p class="text-xs text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                                    ${this.escapeHtml(product.description)}
                                </p>
                            ` : ''}
                        </div>
                        <div class="text-right ml-4">
                            <div class="text-sm font-semibold text-gray-900 dark:text-white">
                                $${this.formatPrice(product.unit_price || 0)}
                            </div>
                            ${product.stock_quantity !== undefined ? `
                                <div class="text-xs ${product.stock_quantity > 0 ? 'text-green-600' : 'text-red-600'} mt-1">
                                    庫存: ${product.stock_quantity}
                                </div>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        this.dropdown.innerHTML = html;
        this.bindOptionEvents();
        this.showDropdown();
        this.selectedIndex = -1;
    }

    /**
     * 顯示訊息
     */
    showMessage(message) {
        this.dropdown.innerHTML = `
            <div class="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center">
                ${this.escapeHtml(message)}
            </div>
        `;
        this.showDropdown();
    }

    /**
     * 綁定選項事件
     */
    bindOptionEvents() {
        const options = this.dropdown.querySelectorAll('.autocomplete-item');
        options.forEach((option, index) => {
            option.addEventListener('click', () => {
                this.selectOption(this.results[index]);
            });

            option.addEventListener('mouseenter', () => {
                this.selectedIndex = index;
                this.highlightOption();
            });
        });
    }

    /**
     * 選擇選項
     */
    selectOption(product) {
        this.input.value = product.name;
        this.hideDropdown();

        if (this.options.onSelect) {
            this.options.onSelect(product);
        }

        // 觸發自定義事件
        const event = new CustomEvent('productSelected', {
            detail: { product }
        });
        this.input.dispatchEvent(event);
    }

    /**
     * 高亮選項
     */
    highlightOption() {
        const options = this.dropdown.querySelectorAll('.autocomplete-item');
        options.forEach((option, index) => {
            if (index === this.selectedIndex) {
                option.classList.add('bg-blue-100', 'dark:bg-blue-900');
            } else {
                option.classList.remove('bg-blue-100', 'dark:bg-blue-900');
            }
        });
    }

    /**
     * 顯示下拉選單
     */
    showDropdown() {
        this.dropdown.style.display = 'block';
        this.isOpen = true;
        this.input.setAttribute('aria-expanded', 'true');
    }

    /**
     * 隱藏下拉選單
     */
    hideDropdown() {
        this.dropdown.style.display = 'none';
        this.isOpen = false;
        this.selectedIndex = -1;
        this.input.setAttribute('aria-expanded', 'false');
    }

    /**
     * 格式化價格
     */
    formatPrice(price) {
        return Number(price).toFixed(2);
    }

    /**
     * 轉義 HTML
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * 清理組件
     */
    destroy() {
        if (this.currentRequest) {
            this.currentRequest.abort();
        }
        
        if (this.dropdown && this.dropdown.parentNode) {
            this.dropdown.parentNode.removeChild(this.dropdown);
        }
        
        this.input.removeAttribute('autocomplete');
        this.input.removeAttribute('role');
        this.input.removeAttribute('aria-expanded');
        this.input.removeAttribute('aria-haspopup');
    }
}

// 自動初始化功能
document.addEventListener('DOMContentLoaded', function() {
    // 自動為有 product-search 類別的輸入框初始化自動完成
    const productInputs = document.querySelectorAll('input.product-search');
    productInputs.forEach(input => {
        new ProductAutocomplete(input);
    });
});

// 導出給全局使用
window.ProductAutocomplete = ProductAutocomplete;