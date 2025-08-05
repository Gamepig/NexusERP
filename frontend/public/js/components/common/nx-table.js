/**
 * NX-Table: 通用表格元件
 * 提供排序、篩選、分頁、搜尋等功能
 */
class NXTable {
    constructor(options = {}) {
        this.options = {
            tableId: options.tableId || 'nx-table',
            apiEndpoint: options.apiEndpoint || '',
            columns: options.columns || [],
            pageSize: options.pageSize || 25,
            sortable: options.sortable !== false,
            searchable: options.searchable !== false,
            filterable: options.filterable !== false,
            pageable: options.pageable !== false,
            selectable: options.selectable || false,
            exportable: options.exportable || false,
            refreshable: options.refreshable !== false,
            ...options
        };

        this.currentPage = 1;
        this.totalPages = 1;
        this.totalRecords = 0;
        this.sortField = '';
        this.sortDirection = 'asc';
        this.searchQuery = '';
        this.filters = {};
        this.selectedRows = new Set();
        this.data = [];

        this.init();
    }

    init() {
        this.bindEvents();
        this.setupTable();
        this.loadData();
    }

    bindEvents() {
        // 基本事件綁定方法 - 實際事件在 setupTable 中綁定
        console.log('NXTable events bound');
    }

    setupTable() {
        const table = document.getElementById(this.options.tableId);
        if (!table) {
            console.error(`Table with id "${this.options.tableId}" not found`);
            return;
        }

        this.table = table;
        this.tbody = table.querySelector('tbody');
        this.thead = table.querySelector('thead');

        // 設定可排序的列
        if (this.options.sortable) {
            this.setupSortableHeaders();
        }

        // 設定搜尋
        if (this.options.searchable) {
            this.setupSearch();
        }

        // 設定篩選
        if (this.options.filterable) {
            this.setupFilters();
        }

        // 設定分頁
        if (this.options.pageable) {
            this.setupPagination();
        }

        // 設定工具列
        this.setupToolbar();
    }

    setupSortableHeaders() {
        const sortableHeaders = this.thead.querySelectorAll('.sortable');
        sortableHeaders.forEach(header => {
            header.style.cursor = 'pointer';
            header.addEventListener('click', (e) => {
                const sortField = header.dataset.sort;
                if (sortField) {
                    this.sort(sortField);
                }
            });
        });
    }

    setupSearch() {
        const searchInput = document.querySelector(`#${this.options.tableId}-search`);
        if (searchInput) {
            searchInput.addEventListener('input', this.debounce((e) => {
                this.searchQuery = e.target.value;
                this.currentPage = 1;
                this.loadData();
            }, 300));
        }
    }

    setupFilters() {
        const filterElements = document.querySelectorAll(`[data-table-filter="${this.options.tableId}"]`);
        filterElements.forEach(element => {
            element.addEventListener('change', (e) => {
                const filterName = element.dataset.filterName;
                if (filterName) {
                    this.filters[filterName] = e.target.value;
                    this.currentPage = 1;
                    this.loadData();
                }
            });
        });
    }

    setupPagination() {
        // 分頁控制項設定
        const paginationContainer = document.querySelector(`#${this.options.tableId}-pagination`);
        if (paginationContainer) {
            this.paginationContainer = paginationContainer;
        }

        // 每頁顯示數量控制
        const perPageSelect = document.querySelector(`#${this.options.tableId}-per-page`);
        if (perPageSelect) {
            perPageSelect.addEventListener('change', (e) => {
                this.options.pageSize = parseInt(e.target.value);
                this.currentPage = 1;
                this.loadData();
            });
        }
    }

    setupToolbar() {
        // 重新整理按鈕
        if (this.options.refreshable) {
            const refreshBtn = document.querySelector(`#${this.options.tableId}-refresh`);
            if (refreshBtn) {
                refreshBtn.addEventListener('click', () => {
                    this.loadData();
                });
            }
        }

        // 匯出按鈕
        if (this.options.exportable) {
            const exportBtn = document.querySelector(`#${this.options.tableId}-export`);
            if (exportBtn) {
                exportBtn.addEventListener('click', () => {
                    this.exportData();
                });
            }
        }

        // 全選功能
        if (this.options.selectable) {
            const selectAllCheckbox = document.querySelector(`#${this.options.tableId}-select-all`);
            if (selectAllCheckbox) {
                selectAllCheckbox.addEventListener('change', (e) => {
                    this.selectAll(e.target.checked);
                });
            }
        }
    }

    async loadData() {
        try {
            this.showLoading();
            
            const params = {
                page: this.currentPage,
                limit: this.options.pageSize,
                sort: this.sortField,
                direction: this.sortDirection,
                search: this.searchQuery,
                ...this.filters
            };

            const queryString = new URLSearchParams(params).toString();
            const response = await fetch(`${this.options.apiEndpoint}?${queryString}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            this.data = result.data || [];
            this.totalRecords = result.total || 0;
            this.totalPages = Math.ceil(this.totalRecords / this.options.pageSize);

            this.renderTable();
            this.renderPagination();
            this.updateInfo();

        } catch (error) {
            console.error('Error loading data:', error);
            this.showError('載入資料時發生錯誤');
        } finally {
            this.hideLoading();
        }
    }

    renderTable() {
        if (!this.tbody) return;

        this.tbody.innerHTML = '';

        if (this.data.length === 0) {
            this.tbody.innerHTML = `
                <tr>
                    <td colspan="${this.getColumnCount()}" class="text-center text-gray-500 dark:text-gray-400 py-4">
                        <i class="fas fa-inbox text-2xl mb-2"></i><br>
                        沒有找到符合條件的資料
                    </td>
                </tr>
            `;
            return;
        }

        this.data.forEach((row, index) => {
            const tr = document.createElement('tr');
            tr.dataset.id = row.id || index;
            
            if (this.options.selectable) {
                tr.innerHTML += `
                    <td>
                        <input type="checkbox" class="rounded border-gray-300 text-blue-600 focus:ring-blue-500 row-select" 
                               value="${row.id || index}" 
                               ${this.selectedRows.has(row.id || index) ? 'checked' : ''}>
                    </td>
                `;
            }

            this.options.columns.forEach(column => {
                const cellValue = this.getCellValue(row, column);
                tr.innerHTML += `<td>${cellValue}</td>`;
            });

            this.tbody.appendChild(tr);
        });

        // 綁定行選擇事件
        if (this.options.selectable) {
            this.bindRowSelection();
        }
    }

    getCellValue(row, column) {
        let value = this.getNestedValue(row, column.field);
        
        if (column.formatter && typeof column.formatter === 'function') {
            return column.formatter(value, row);
        }

        if (column.type === 'date' && value) {
            return new Date(value).toLocaleDateString('zh-TW');
        }

        if (column.type === 'currency' && value !== null && value !== undefined) {
            return new Intl.NumberFormat('zh-TW', {
                style: 'currency',
                currency: 'TWD'
            }).format(value);
        }

        if (column.type === 'number' && value !== null && value !== undefined) {
            return new Intl.NumberFormat('zh-TW').format(value);
        }

        return value || '-';
    }

    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    }

    renderPagination() {
        if (!this.paginationContainer || !this.options.pageable) return;

        const pagination = this.buildPagination();
        this.paginationContainer.innerHTML = pagination;
        this.bindPaginationEvents();
    }

    buildPagination() {
        if (this.totalPages <= 1) return '';

        let pagination = '';
        
        // 上一頁
        pagination += `
            <button class="px-3 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-l-lg hover:bg-gray-100 dark:hover:bg-gray-600 hover:text-gray-700 dark:hover:text-gray-200 ${this.currentPage === 1 ? 'cursor-not-allowed opacity-50' : ''}" 
                    data-page="${this.currentPage - 1}" ${this.currentPage === 1 ? 'disabled' : ''}>
                <i class="fas fa-chevron-left"></i>
            </button>
        `;

        // 頁碼
        const startPage = Math.max(1, this.currentPage - 2);
        const endPage = Math.min(this.totalPages, this.currentPage + 2);

        if (startPage > 1) {
            pagination += `<button class="px-3 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 hover:text-gray-700 dark:hover:text-gray-200" data-page="1">1</button>`;
            if (startPage > 2) {
                pagination += `<span class="px-3 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600">...</span>`;
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            pagination += `
                <button class="px-3 py-2 text-sm font-medium border border-gray-300 dark:border-gray-600 ${i === this.currentPage ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900 border-blue-500 dark:border-blue-400 z-10' : 'text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 hover:text-gray-700 dark:hover:text-gray-200'}" data-page="${i}">${i}</button>
            `;
        }

        if (endPage < this.totalPages) {
            if (endPage < this.totalPages - 1) {
                pagination += `<span class="px-3 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600">...</span>`;
            }
            pagination += `<button class="px-3 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 hover:text-gray-700 dark:hover:text-gray-200" data-page="${this.totalPages}">${this.totalPages}</button>`;
        }

        // 下一頁
        pagination += `
            <button class="px-3 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-r-lg hover:bg-gray-100 dark:hover:bg-gray-600 hover:text-gray-700 dark:hover:text-gray-200 ${this.currentPage === this.totalPages ? 'cursor-not-allowed opacity-50' : ''}" 
                    data-page="${this.currentPage + 1}" ${this.currentPage === this.totalPages ? 'disabled' : ''}>
                <i class="fas fa-chevron-right"></i>
            </button>
        `;

        return pagination;
    }

    bindPaginationEvents() {
        if (!this.paginationContainer) return;

        const pageButtons = this.paginationContainer.querySelectorAll('button[data-page]');
        pageButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                if (button.disabled) return;
                const page = parseInt(e.target.dataset.page);
                if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
                    this.currentPage = page;
                    this.loadData();
                }
            });
        });
    }

    bindRowSelection() {
        const checkboxes = this.tbody.querySelectorAll('.row-select');
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const rowId = e.target.value;
                if (e.target.checked) {
                    this.selectedRows.add(rowId);
                } else {
                    this.selectedRows.delete(rowId);
                }
                this.updateSelectAllState();
            });
        });
    }

    selectAll(checked) {
        const checkboxes = this.tbody.querySelectorAll('.row-select');
        checkboxes.forEach(checkbox => {
            checkbox.checked = checked;
            const rowId = checkbox.value;
            if (checked) {
                this.selectedRows.add(rowId);
            } else {
                this.selectedRows.delete(rowId);
            }
        });
    }

    updateSelectAllState() {
        const selectAllCheckbox = document.querySelector(`#${this.options.tableId}-select-all`);
        if (selectAllCheckbox) {
            const checkboxes = this.tbody.querySelectorAll('.row-select');
            const checkedCount = this.tbody.querySelectorAll('.row-select:checked').length;
            
            selectAllCheckbox.checked = checkboxes.length > 0 && checkedCount === checkboxes.length;
            selectAllCheckbox.indeterminate = checkedCount > 0 && checkedCount < checkboxes.length;
        }
    }

    updateInfo() {
        const start = (this.currentPage - 1) * this.options.pageSize + 1;
        const end = Math.min(this.currentPage * this.options.pageSize, this.totalRecords);

        // 更新顯示資訊
        const infoElements = document.querySelectorAll(`[data-table-info="${this.options.tableId}"]`);
        infoElements.forEach(element => {
            const infoType = element.dataset.infoType;
            switch (infoType) {
                case 'start':
                    element.textContent = start;
                    break;
                case 'end':
                    element.textContent = end;
                    break;
                case 'total':
                    element.textContent = this.totalRecords;
                    break;
                case 'range':
                    element.textContent = `${start}-${end}`;
                    break;
            }
        });
    }

    sort(field) {
        if (this.sortField === field) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortField = field;
            this.sortDirection = 'asc';
        }

        // 更新排序圖示
        this.updateSortIcons();
        
        this.currentPage = 1;
        this.loadData();
    }

    updateSortIcons() {
        const sortableHeaders = this.thead.querySelectorAll('.sortable i');
        sortableHeaders.forEach(icon => {
            icon.className = 'fas fa-sort ml-1';
        });

        const currentHeader = this.thead.querySelector(`[data-sort="${this.sortField}"] i`);
        if (currentHeader) {
            currentHeader.className = `fas fa-sort-${this.sortDirection === 'asc' ? 'up' : 'down'} ml-1`;
        }
    }

    getColumnCount() {
        let count = this.options.columns.length;
        if (this.options.selectable) count++;
        return count;
    }

    showLoading() {
        if (this.tbody) {
            this.tbody.innerHTML = `
                <tr>
                    <td colspan="${this.getColumnCount()}" class="text-center py-4">
                        <div class="flex flex-col items-center">
                            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            <div class="mt-2 text-gray-500">載入中...</div>
                        </div>
                    </td>
                </tr>
            `;
        }
    }

    hideLoading() {
        // Loading will be hidden when renderTable is called
    }

    showError(message) {
        if (this.tbody) {
            this.tbody.innerHTML = `
                <tr>
                    <td colspan="${this.getColumnCount()}" class="text-center text-red-600 py-4">
                        <i class="fas fa-exclamation-triangle text-2xl mb-2"></i><br>
                        ${message}
                    </td>
                </tr>
            `;
        }
    }

    exportData() {
        const params = {
            export: true,
            sort: this.sortField,
            direction: this.sortDirection,
            search: this.searchQuery,
            ...this.filters
        };

        const queryString = new URLSearchParams(params).toString();
        window.open(`${this.options.apiEndpoint}?${queryString}`, '_blank');
    }

    refresh() {
        this.loadData();
    }

    getSelectedRows() {
        return Array.from(this.selectedRows);
    }

    clearSelection() {
        this.selectedRows.clear();
        const checkboxes = this.tbody.querySelectorAll('.row-select');
        checkboxes.forEach(checkbox => {
            checkbox.checked = false;
        });
        this.updateSelectAllState();
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
}

// 全域可用
window.NXTable = NXTable;