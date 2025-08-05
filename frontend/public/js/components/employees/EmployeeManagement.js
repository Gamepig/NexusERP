class EmployeeManagement {
    constructor() {
        this.currentPage = 1;
        this.pageSize = 20;
        this.currentView = 'grid'; // 'grid' or 'table'
        this.employees = [];
        this.filteredEmployees = [];
        this.isLoading = false;
        
        this.initializeElements();
        this.bindEvents();
        this.loadEmployees();
    }

    initializeElements() {
        this.loadingState = document.getElementById('loadingState');
        this.gridView = document.getElementById('gridView');
        this.tableView = document.getElementById('tableView');
        this.emptyState = document.getElementById('emptyState');
        this.pagination = document.getElementById('pagination');
        
        this.searchInput = document.getElementById('searchInput');
        this.departmentFilter = document.getElementById('departmentFilter');
        this.statusFilter = document.getElementById('statusFilter');
        this.toggleViewBtn = document.getElementById('toggleView');
        this.gridIcon = document.getElementById('gridIcon');
        this.listIcon = document.getElementById('listIcon');
        
        this.employeeGrid = document.getElementById('employeeGrid');
        this.employeeTable = document.getElementById('employeeTable');
        this.resultsCount = document.getElementById('resultsCount');
        
        // Statistics elements
        this.totalEmployees = document.getElementById('totalEmployees');
        this.activeEmployees = document.getElementById('activeEmployees');
        this.onLeaveEmployees = document.getElementById('onLeaveEmployees');
        this.departmentCount = document.getElementById('departmentCount');
    }

    bindEvents() {
        // Search and filter events
        this.searchInput.addEventListener('input', this.debounce(() => this.applyFilters(), 300));
        this.departmentFilter.addEventListener('change', () => this.applyFilters());
        this.statusFilter.addEventListener('change', () => this.applyFilters());
        
        // View toggle
        this.toggleViewBtn.addEventListener('click', () => this.toggleView());
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

    async loadEmployees() {
        this.setLoading(true);
        
        try {
            // Try Laravel API first
            const response = await fetch(`/api/employees`, {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                // Transform API response to match our component format
                this.employees = this.transformApiResponse(data.data || []);
                this.updateStatistics();
                this.applyFilters();
            } else {
                console.warn('Laravel API unavailable, using mock data');
                this.loadMockData();
            }
        } catch (error) {
            console.error('Failed to load employees:', error);
            // Use mock data as fallback
            this.loadMockData();
        }
        
        this.setLoading(false);
    }

    transformApiResponse(apiData) {
        // Transform Laravel API response to match component expectations
        return apiData.map(emp => ({
            id: emp.id,
            employee_code: emp.employee_id,
            first_name: emp.name.split(' ')[0] || emp.name,
            last_name: emp.name.split(' ').slice(1).join(' ') || '',
            email: emp.email,
            phone: emp.phone,
            department: this.mapDepartmentToKey(emp.department),
            position: emp.position,
            hire_date: emp.hire_date,
            status: emp.status === 'vacation' ? 'on_leave' : emp.status,
            salary: null // Not provided in API
        }));
    }

    mapDepartmentToKey(departmentName) {
        const departmentMap = {
            '業務部': 'sales',
            '技術部': 'it',
            '財務部': 'finance',
            '人事部': 'hr',
            '營運部': 'operations'
        };
        return departmentMap[departmentName] || 'other';
    }

    loadMockData() {
        // Mock data for demonstration
        this.employees = [
            {
                id: 1,
                employee_code: 'EMP001',
                first_name: '張',
                last_name: '小明',
                email: 'ming.zhang@company.com',
                phone: '0912-345-678',
                department: 'it',
                position: '軟體工程師',
                hire_date: '2023-01-15',
                status: 'active',
                salary: 50000
            },
            {
                id: 2,
                employee_code: 'EMP002',
                first_name: '李',
                last_name: '小華',
                email: 'hua.li@company.com',
                phone: '0923-456-789',
                department: 'hr',
                position: '人資專員',
                hire_date: '2022-06-01',
                status: 'active',
                salary: 45000
            },
            {
                id: 3,
                employee_code: 'EMP003',
                first_name: '王',
                last_name: '大偉',
                email: 'wei.wang@company.com',
                phone: '0934-567-890',
                department: 'finance',
                position: '會計師',
                hire_date: '2021-03-10',
                status: 'on_leave',
                salary: 60000
            },
            {
                id: 4,
                employee_code: 'EMP004',
                first_name: '陳',
                last_name: '美玲',
                email: 'ling.chen@company.com',
                phone: '0945-678-901',
                department: 'sales',
                position: '業務經理',
                hire_date: '2020-08-20',
                status: 'active',
                salary: 70000
            },
            {
                id: 5,
                employee_code: 'EMP005',
                first_name: '林',
                last_name: '志明',
                email: 'ming.lin@company.com',
                phone: '0956-789-012',
                department: 'operations',
                position: '營運主管',
                hire_date: '2019-11-05',
                status: 'inactive',
                salary: 65000
            }
        ];
        
        this.updateStatistics();
        this.applyFilters();
    }

    getAuthToken() {
        // In a real implementation, get the token from localStorage or session
        return localStorage.getItem('auth_token') || 'mock_token';
    }

    updateStatistics() {
        const stats = {
            total: this.employees.length,
            active: this.employees.filter(emp => emp.status === 'active').length,
            onLeave: this.employees.filter(emp => emp.status === 'on_leave').length,
            departments: [...new Set(this.employees.map(emp => emp.department))].length
        };

        this.totalEmployees.textContent = stats.total;
        this.activeEmployees.textContent = stats.active;
        this.onLeaveEmployees.textContent = stats.onLeave;
        this.departmentCount.textContent = stats.departments;
    }

    applyFilters() {
        const searchTerm = this.searchInput.value.toLowerCase();
        const departmentFilter = this.departmentFilter.value;
        const statusFilter = this.statusFilter.value;

        this.filteredEmployees = this.employees.filter(employee => {
            const matchesSearch = !searchTerm || 
                employee.first_name.toLowerCase().includes(searchTerm) ||
                employee.last_name.toLowerCase().includes(searchTerm) ||
                employee.employee_code.toLowerCase().includes(searchTerm) ||
                (employee.email && employee.email.toLowerCase().includes(searchTerm)) ||
                (employee.department && this.getDepartmentName(employee.department).toLowerCase().includes(searchTerm)) ||
                (employee.position && employee.position.toLowerCase().includes(searchTerm));

            const matchesDepartment = !departmentFilter || employee.department === departmentFilter;
            const matchesStatus = !statusFilter || employee.status === statusFilter;

            return matchesSearch && matchesDepartment && matchesStatus;
        });

        this.currentPage = 1; // Reset to first page
        this.renderEmployees();
        this.updateResultsCount();
    }

    renderEmployees() {
        const startIndex = (this.currentPage - 1) * this.pageSize;
        const endIndex = startIndex + this.pageSize;
        const paginatedEmployees = this.filteredEmployees.slice(startIndex, endIndex);

        if (paginatedEmployees.length === 0) {
            this.showEmptyState();
            return;
        }

        this.hideEmptyState();

        if (this.currentView === 'grid') {
            this.renderGridView(paginatedEmployees);
        } else {
            this.renderTableView(paginatedEmployees);
        }

        this.renderPagination();
    }

    renderGridView(employees) {
        this.gridView.classList.remove('hidden');
        this.tableView.classList.add('hidden');

        this.employeeGrid.innerHTML = employees.map(employee => this.createEmployeeCard(employee)).join('');
    }

    renderTableView(employees) {
        this.tableView.classList.remove('hidden');
        this.gridView.classList.add('hidden');

        this.employeeTable.innerHTML = employees.map(employee => this.createEmployeeRow(employee)).join('');
    }

    createEmployeeCard(employee) {
        const statusClass = this.getStatusClass(employee.status);
        const statusText = this.getStatusText(employee.status);
        const departmentName = this.getDepartmentName(employee.department);

        return `
            <div class="employee-card bg-white dark:bg-gray-700 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-600">
                <div class="flex items-start justify-between mb-4">
                    <div class="flex items-center">
                        <div class="w-12 h-12 bg-emerald-100 dark:bg-emerald-900 rounded-full flex items-center justify-center">
                            <span class="text-emerald-600 dark:text-emerald-300 font-semibold">
                                ${employee.first_name.charAt(0)}${employee.last_name.charAt(0)}
                            </span>
                        </div>
                        <div class="ml-3">
                            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                                ${employee.first_name}${employee.last_name}
                            </h3>
                            <p class="text-sm text-gray-600 dark:text-gray-400">${employee.employee_code}</p>
                        </div>
                    </div>
                    <span class="status-badge ${statusClass}">${statusText}</span>
                </div>
                
                <div class="space-y-2 text-sm">
                    <div class="flex justify-between">
                        <span class="text-gray-600 dark:text-gray-400">部門:</span>
                        <span class="text-gray-900 dark:text-white">${departmentName}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-600 dark:text-gray-400">職位:</span>
                        <span class="text-gray-900 dark:text-white">${employee.position || '-'}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-600 dark:text-gray-400">到職日期:</span>
                        <span class="text-gray-900 dark:text-white">${this.formatDate(employee.hire_date)}</span>
                    </div>
                    ${employee.email ? `
                        <div class="flex justify-between">
                            <span class="text-gray-600 dark:text-gray-400">Email:</span>
                            <span class="text-gray-900 dark:text-white text-xs">${employee.email}</span>
                        </div>
                    ` : ''}
                </div>
                
                <div class="mt-4 flex space-x-2">
                    <button onclick="viewEmployee(${employee.id})" 
                            class="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded text-sm transition-colors">
                        查看詳情
                    </button>
                    <button onclick="editEmployee(${employee.id})" 
                            class="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm transition-colors">
                        編輯
                    </button>
                </div>
            </div>
        `;
    }

    createEmployeeRow(employee) {
        const statusClass = this.getStatusClass(employee.status);
        const statusText = this.getStatusText(employee.status);
        const departmentName = this.getDepartmentName(employee.department);

        return `
            <tr class="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                        <div class="w-10 h-10 bg-emerald-100 dark:bg-emerald-900 rounded-full flex items-center justify-center">
                            <span class="text-emerald-600 dark:text-emerald-300 font-semibold text-sm">
                                ${employee.first_name.charAt(0)}${employee.last_name.charAt(0)}
                            </span>
                        </div>
                        <div class="ml-4">
                            <div class="text-sm font-medium text-gray-900 dark:text-white">
                                ${employee.first_name}${employee.last_name}
                            </div>
                            ${employee.email ? `
                                <div class="text-sm text-gray-500 dark:text-gray-400">${employee.email}</div>
                            ` : ''}
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    ${employee.employee_code}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    ${departmentName}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    ${employee.position || '-'}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="status-badge ${statusClass}">${statusText}</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    ${this.formatDate(employee.hire_date)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div class="flex space-x-2">
                        <button onclick="viewEmployee(${employee.id})" 
                                class="text-emerald-600 hover:text-emerald-900 dark:text-emerald-400 dark:hover:text-emerald-300">
                            查看
                        </button>
                        <button onclick="editEmployee(${employee.id})" 
                                class="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300">
                            編輯
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    toggleView() {
        this.currentView = this.currentView === 'grid' ? 'table' : 'grid';
        
        if (this.currentView === 'grid') {
            this.gridIcon.classList.remove('hidden');
            this.listIcon.classList.add('hidden');
        } else {
            this.gridIcon.classList.add('hidden');
            this.listIcon.classList.remove('hidden');
        }
        
        this.renderEmployees();
    }

    renderPagination() {
        const totalPages = Math.ceil(this.filteredEmployees.length / this.pageSize);
        
        if (totalPages <= 1) {
            this.pagination.classList.add('hidden');
            return;
        }
        
        this.pagination.classList.remove('hidden');
        
        // Update pagination info
        const startIndex = (this.currentPage - 1) * this.pageSize + 1;
        const endIndex = Math.min(this.currentPage * this.pageSize, this.filteredEmployees.length);
        
        document.getElementById('pageStart').textContent = startIndex;
        document.getElementById('pageEnd').textContent = endIndex;
        document.getElementById('pageTotal').textContent = this.filteredEmployees.length;
        
        // Generate page numbers (simplified version)
        const pageNumbers = document.getElementById('pageNumbers');
        pageNumbers.innerHTML = '';
        
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= this.currentPage - 2 && i <= this.currentPage + 2)) {
                const button = document.createElement('button');
                button.className = `relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                    i === this.currentPage 
                        ? 'z-10 bg-emerald-50 border-emerald-500 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-300'
                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-600'
                }`;
                button.textContent = i;
                button.onclick = () => this.goToPage(i);
                pageNumbers.appendChild(button);
            } else if (i === this.currentPage - 3 || i === this.currentPage + 3) {
                const span = document.createElement('span');
                span.className = 'relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400';
                span.textContent = '...';
                pageNumbers.appendChild(span);
            }
        }
    }

    goToPage(page) {
        this.currentPage = page;
        this.renderEmployees();
    }

    updateResultsCount() {
        const count = this.filteredEmployees.length;
        this.resultsCount.textContent = `共 ${count} 位員工`;
    }

    setLoading(loading) {
        this.isLoading = loading;
        if (loading) {
            this.loadingState.classList.remove('hidden');
            this.gridView.classList.add('hidden');
            this.tableView.classList.add('hidden');
            this.emptyState.classList.add('hidden');
            this.pagination.classList.add('hidden');
        } else {
            this.loadingState.classList.add('hidden');
        }
    }

    showEmptyState() {
        this.emptyState.classList.remove('hidden');
        this.gridView.classList.add('hidden');
        this.tableView.classList.add('hidden');
        this.pagination.classList.add('hidden');
    }

    hideEmptyState() {
        this.emptyState.classList.add('hidden');
    }

    // Helper methods
    getStatusClass(status) {
        const statusClasses = {
            'active': 'status-active',
            'inactive': 'status-inactive',
            'terminated': 'status-terminated',
            'on_leave': 'status-on_leave'
        };
        return statusClasses[status] || 'status-inactive';
    }

    getStatusText(status) {
        const statusTexts = {
            'active': '在職',
            'inactive': '停職',
            'terminated': '離職',
            'on_leave': '請假'
        };
        return statusTexts[status] || '未知';
    }

    getDepartmentName(department) {
        const departmentNames = {
            'hr': '人力資源部',
            'it': '資訊技術部',
            'finance': '財務部',
            'sales': '業務部',
            'operations': '營運部'
        };
        return departmentNames[department] || department || '-';
    }

    formatDate(dateString) {
        if (!dateString) return '-';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('zh-TW');
        } catch (error) {
            return dateString;
        }
    }
}

// Global functions for button clicks
function viewEmployee(id) {
    window.location.href = `/employees/${id}`;
}

function editEmployee(id) {
    window.location.href = `/employees/${id}/edit`;
}

function exportEmployees() {
    if (window.employeeManager) {
        const employees = window.employeeManager.filteredEmployees;
        const csvContent = convertToCSV(employees);
        downloadCSV(csvContent, 'employees.csv');
    }
}

function convertToCSV(employees) {
    const headers = ['工號', '姓名', '電子郵件', '電話', '部門', '職位', '狀態', '到職日期'];
    const rows = employees.map(emp => [
        emp.employee_code,
        `${emp.first_name}${emp.last_name}`,
        emp.email || '',
        emp.phone || '',
        window.employeeManager.getDepartmentName(emp.department),
        emp.position || '',
        window.employeeManager.getStatusText(emp.status),
        emp.hire_date
    ]);
    
    const csvContent = [headers, ...rows]
        .map(row => row.map(field => `"${field || ''}"`).join(','))
        .join('\n');
    
    return csvContent;
}

function downloadCSV(csvContent, filename) {
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function closeModal() {
    const modal = document.getElementById('employeeModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}