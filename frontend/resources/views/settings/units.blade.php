@extends('settings.layout')

@section('settings-content')
<div class="p-6" data-testid="units-settings-page">
    <!-- Page Header -->
    <div class="flex items-center justify-between mb-8">
        <div>
            <h2 class="text-2xl font-bold text-gray-900">計量單位管理</h2>
            <p class="mt-2 text-gray-600">管理產品計量單位，支援多種單位換算</p>
        </div>
        <button type="button" 
                class="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                data-testid="add-unit-button">
            <svg class="w-5 h-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
            </svg>
            新增計量單位
        </button>
    </div>

    <!-- Units Table -->
    <div class="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div class="flex items-center justify-between">
                <h3 class="text-lg font-semibold text-gray-900">計量單位列表</h3>
                <div class="flex items-center space-x-4">
                    <!-- Search Box -->
                    <div class="relative">
                        <input type="text" 
                               placeholder="搜尋計量單位..." 
                               class="w-64 px-3 py-2 pl-10 pr-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                               data-testid="search-units-input">
                        <svg class="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                        </svg>
                    </div>
                    <!-- Filter Dropdown -->
                    <select class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            data-testid="filter-category-select">
                        <option value="">所有類別</option>
                        <option value="weight">重量</option>
                        <option value="volume">體積</option>
                        <option value="length">長度</option>
                        <option value="quantity">數量</option>
                        <option value="time">時間</option>
                    </select>
                </div>
            </div>
        </div>

        <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200" data-testid="units-table">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            單位名稱
                        </th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            縮寫
                        </th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            類別
                        </th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            基礎單位
                        </th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            換算係數
                        </th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            狀態
                        </th>
                        <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            操作
                        </th>
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200" id="units-table-body">
                    <!-- Sample Data Rows -->
                    <tr data-testid="unit-row-1">
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">公斤</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">kg</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                重量
                            </span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">是</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">1.0</td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                啟用
                            </span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button class="text-blue-600 hover:text-blue-900 mr-3" data-testid="edit-unit-1">編輯</button>
                            <button class="text-red-600 hover:text-red-900" data-testid="delete-unit-1">刪除</button>
                        </td>
                    </tr>
                    <tr data-testid="unit-row-2">
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">公克</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">g</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                重量
                            </span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">否</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">0.001</td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                啟用
                            </span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button class="text-blue-600 hover:text-blue-900 mr-3" data-testid="edit-unit-2">編輯</button>
                            <button class="text-red-600 hover:text-red-900" data-testid="delete-unit-2">刪除</button>
                        </td>
                    </tr>
                    <tr data-testid="unit-row-3">
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">公升</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">L</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                體積
                            </span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">是</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">1.0</td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                啟用
                            </span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button class="text-blue-600 hover:text-blue-900 mr-3" data-testid="edit-unit-3">編輯</button>
                            <button class="text-red-600 hover:text-red-900" data-testid="delete-unit-3">刪除</button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- Pagination -->
        <div class="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
            <div class="flex items-center justify-between">
                <div class="flex-1 flex justify-between sm:hidden">
                    <button class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                        上一頁
                    </button>
                    <button class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                        下一頁
                    </button>
                </div>
                <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                        <p class="text-sm text-gray-700">
                            共 <span class="font-medium">3</span> 筆計量單位
                        </p>
                    </div>
                    <div>
                        <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                            <button class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                                <span class="sr-only">上一頁</span>
                                <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd"/>
                                </svg>
                            </button>
                            <button class="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-blue-50 text-sm font-medium text-blue-600">
                                1
                            </button>
                            <button class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                                <span class="sr-only">下一頁</span>
                                <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"/>
                                </svg>
                            </button>
                        </nav>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Add/Edit Unit Modal -->
<div id="unit-modal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full hidden" data-testid="unit-modal">
    <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div class="mt-3">
            <h3 class="text-lg font-medium text-gray-900 mb-4" id="modal-title">新增計量單位</h3>
            <form id="unit-form" data-testid="unit-form">
                <div class="space-y-4">
                    <div>
                        <label for="unit_name" class="block text-sm font-medium text-gray-700 mb-1">單位名稱 *</label>
                        <input type="text" id="unit_name" name="unit_name" 
                               class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                               data-testid="unit-name-input">
                    </div>
                    <div>
                        <label for="unit_symbol" class="block text-sm font-medium text-gray-700 mb-1">縮寫 *</label>
                        <input type="text" id="unit_symbol" name="unit_symbol" 
                               class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                               data-testid="unit-symbol-input">
                    </div>
                    <div>
                        <label for="unit_category" class="block text-sm font-medium text-gray-700 mb-1">類別 *</label>
                        <select id="unit_category" name="unit_category" 
                                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                data-testid="unit-category-input">
                            <option value="">請選擇類別</option>
                            <option value="weight">重量</option>
                            <option value="volume">體積</option>
                            <option value="length">長度</option>
                            <option value="quantity">數量</option>
                            <option value="time">時間</option>
                        </select>
                    </div>
                    <div>
                        <label for="conversion_factor" class="block text-sm font-medium text-gray-700 mb-1">換算係數</label>
                        <input type="number" id="conversion_factor" name="conversion_factor" step="0.001"
                               class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                               data-testid="conversion-factor-input">
                    </div>
                    <div class="flex items-center">
                        <input type="checkbox" id="is_base_unit" name="is_base_unit" class="mr-2" data-testid="is-base-unit-checkbox">
                        <label for="is_base_unit" class="text-sm text-gray-700">設為基礎單位</label>
                    </div>
                </div>
                <div class="flex justify-end space-x-3 mt-6">
                    <button type="button" id="cancel-modal" 
                            class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                            data-testid="cancel-modal-button">
                        取消
                    </button>
                    <button type="submit" 
                            class="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-white hover:bg-blue-700"
                            data-testid="save-unit-button">
                        儲存
                    </button>
                </div>
            </form>
        </div>
    </div>
</div>
@endsection

@push('scripts')
<script>
document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('unit-modal');
    const addButton = document.querySelector('[data-testid="add-unit-button"]');
    const cancelButton = document.getElementById('cancel-modal');
    const form = document.getElementById('unit-form');
    const searchInput = document.querySelector('[data-testid="search-units-input"]');
    const categoryFilter = document.querySelector('[data-testid="filter-category-select"]');

    // Open modal for new unit
    addButton.addEventListener('click', function() {
        document.getElementById('modal-title').textContent = '新增計量單位';
        form.reset();
        modal.classList.remove('hidden');
    });

    // Close modal
    cancelButton.addEventListener('click', function() {
        modal.classList.add('hidden');
    });

    // Close modal when clicking outside
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.classList.add('hidden');
        }
    });

    // Handle form submission
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Basic validation
        const requiredFields = ['unit_name', 'unit_symbol', 'unit_category'];
        let isValid = true;
        
        requiredFields.forEach(fieldName => {
            const field = form.querySelector(`[name="${fieldName}"]`);
            if (!field.value.trim()) {
                field.classList.add('border-red-500');
                isValid = false;
            } else {
                field.classList.remove('border-red-500');
            }
        });
        
        if (isValid) {
            // TODO: Submit to API
            alert('計量單位已儲存');
            modal.classList.add('hidden');
        }
    });

    // Handle edit buttons
    document.querySelectorAll('[data-testid^="edit-unit-"]').forEach(button => {
        button.addEventListener('click', function() {
            document.getElementById('modal-title').textContent = '編輯計量單位';
            // TODO: Load unit data and populate form
            modal.classList.remove('hidden');
        });
    });

    // Handle delete buttons
    document.querySelectorAll('[data-testid^="delete-unit-"]').forEach(button => {
        button.addEventListener('click', function() {
            if (confirm('確定要刪除這個計量單位嗎？')) {
                // TODO: Delete unit via API
                alert('計量單位已刪除');
            }
        });
    });

    // Search functionality
    searchInput.addEventListener('input', function() {
        // TODO: Implement search filtering
        console.log('搜尋：', this.value);
    });

    // Category filter
    categoryFilter.addEventListener('change', function() {
        // TODO: Implement category filtering
        console.log('篩選類別：', this.value);
    });
});
</script>
@endpush