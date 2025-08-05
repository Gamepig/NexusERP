@extends('settings.layout')

@section('settings-content')
<div class="p-6" data-testid="categories-settings-page">
    <!-- Page Header -->
    <div class="flex items-center justify-between mb-8">
        <div>
            <h2 class="text-2xl font-bold text-gray-900">產品類別管理</h2>
            <p class="mt-2 text-gray-600">管理產品分類架構，支援層級分類和自訂屬性</p>
        </div>
        <button type="button" 
                class="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                data-testid="add-category-button">
            <svg class="w-5 h-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
            </svg>
            新增產品類別
        </button>
    </div>

    <!-- Categories Tree View -->
    <div class="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div class="flex items-center justify-between">
                <h3 class="text-lg font-semibold text-gray-900">產品類別架構</h3>
                <div class="flex items-center space-x-4">
                    <!-- Search Box -->
                    <div class="relative">
                        <input type="text" 
                               placeholder="搜尋類別..." 
                               class="w-64 px-3 py-2 pl-10 pr-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                               data-testid="search-categories-input">
                        <svg class="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                        </svg>
                    </div>
                    <!-- View Toggle -->
                    <div class="flex border border-gray-300 rounded-md">
                        <button class="px-3 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 border-r border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                data-testid="tree-view-button">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
                            </svg>
                        </button>
                        <button class="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-r-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                data-testid="grid-view-button">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Tree View Container -->
        <div class="p-6" id="categories-tree-view" data-testid="categories-tree">
            <!-- Root Categories -->
            <div class="space-y-4">
                <!-- Category 1: Electronics -->
                <div class="border border-gray-200 rounded-lg" data-testid="category-electronics">
                    <div class="flex items-center justify-between p-4 bg-gray-50">
                        <div class="flex items-center space-x-3">
                            <button class="text-gray-400 hover:text-gray-600" data-testid="expand-electronics">
                                <svg class="w-5 h-5 transform transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                                </svg>
                            </button>
                            <div class="flex items-center space-x-2">
                                <span class="inline-flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full text-sm font-medium">
                                    E
                                </span>
                                <div>
                                    <h4 class="text-lg font-semibold text-gray-900">電子產品</h4>
                                    <p class="text-sm text-gray-500">包含各種電子設備和組件</p>
                                </div>
                            </div>
                        </div>
                        <div class="flex items-center space-x-2">
                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                15 項產品
                            </span>
                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                啟用
                            </span>
                            <div class="flex space-x-1">
                                <button class="text-blue-600 hover:text-blue-900 text-sm" data-testid="edit-category-electronics">編輯</button>
                                <button class="text-red-600 hover:text-red-900 text-sm" data-testid="delete-category-electronics">刪除</button>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Subcategories (Initially Hidden) -->
                    <div class="hidden border-t border-gray-200 bg-white" id="subcategories-electronics">
                        <div class="pl-12 pr-4 py-3 space-y-2">
                            <div class="flex items-center justify-between p-3 bg-gray-50 rounded-md" data-testid="subcategory-smartphones">
                                <div class="flex items-center space-x-3">
                                    <span class="inline-flex items-center justify-center w-6 h-6 bg-gray-100 text-gray-600 rounded text-xs">
                                        S
                                    </span>
                                    <div>
                                        <h5 class="font-medium text-gray-900">智慧型手機</h5>
                                        <p class="text-xs text-gray-500">各品牌手機產品</p>
                                    </div>
                                </div>
                                <div class="flex items-center space-x-2">
                                    <span class="text-xs text-gray-500">8 項產品</span>
                                    <button class="text-blue-600 hover:text-blue-900 text-xs" data-testid="edit-subcategory-smartphones">編輯</button>
                                    <button class="text-red-600 hover:text-red-900 text-xs" data-testid="delete-subcategory-smartphones">刪除</button>
                                </div>
                            </div>
                            
                            <div class="flex items-center justify-between p-3 bg-gray-50 rounded-md" data-testid="subcategory-computers">
                                <div class="flex items-center space-x-3">
                                    <span class="inline-flex items-center justify-center w-6 h-6 bg-gray-100 text-gray-600 rounded text-xs">
                                        C
                                    </span>
                                    <div>
                                        <h5 class="font-medium text-gray-900">電腦設備</h5>
                                        <p class="text-xs text-gray-500">桌機、筆電、周邊設備</p>
                                    </div>
                                </div>
                                <div class="flex items-center space-x-2">
                                    <span class="text-xs text-gray-500">7 項產品</span>
                                    <button class="text-blue-600 hover:text-blue-900 text-xs" data-testid="edit-subcategory-computers">編輯</button>
                                    <button class="text-red-600 hover:text-red-900 text-xs" data-testid="delete-subcategory-computers">刪除</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Category 2: Clothing -->
                <div class="border border-gray-200 rounded-lg" data-testid="category-clothing">
                    <div class="flex items-center justify-between p-4 bg-gray-50">
                        <div class="flex items-center space-x-3">
                            <button class="text-gray-400 hover:text-gray-600" data-testid="expand-clothing">
                                <svg class="w-5 h-5 transform transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                                </svg>
                            </button>
                            <div class="flex items-center space-x-2">
                                <span class="inline-flex items-center justify-center w-8 h-8 bg-green-100 text-green-600 rounded-full text-sm font-medium">
                                    C
                                </span>
                                <div>
                                    <h4 class="text-lg font-semibold text-gray-900">服飾用品</h4>
                                    <p class="text-sm text-gray-500">各類服裝和配件</p>
                                </div>
                            </div>
                        </div>
                        <div class="flex items-center space-x-2">
                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                23 項產品
                            </span>
                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                啟用
                            </span>
                            <div class="flex space-x-1">
                                <button class="text-blue-600 hover:text-blue-900 text-sm" data-testid="edit-category-clothing">編輯</button>
                                <button class="text-red-600 hover:text-red-900 text-sm" data-testid="delete-category-clothing">刪除</button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Category 3: Home & Garden -->
                <div class="border border-gray-200 rounded-lg" data-testid="category-home-garden">
                    <div class="flex items-center justify-between p-4 bg-gray-50">
                        <div class="flex items-center space-x-3">
                            <button class="text-gray-400 hover:text-gray-600" data-testid="expand-home-garden">
                                <svg class="w-5 h-5 transform transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                                </svg>
                            </button>
                            <div class="flex items-center space-x-2">
                                <span class="inline-flex items-center justify-center w-8 h-8 bg-yellow-100 text-yellow-600 rounded-full text-sm font-medium">
                                    H
                                </span>
                                <div>
                                    <h4 class="text-lg font-semibold text-gray-900">居家園藝</h4>
                                    <p class="text-sm text-gray-500">家用品和園藝用品</p>
                                </div>
                            </div>
                        </div>
                        <div class="flex items-center space-x-2">
                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                31 項產品
                            </span>
                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                停用
                            </span>
                            <div class="flex space-x-1">
                                <button class="text-blue-600 hover:text-blue-900 text-sm" data-testid="edit-category-home-garden">編輯</button>
                                <button class="text-red-600 hover:text-red-900 text-sm" data-testid="delete-category-home-garden">刪除</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Summary Stats -->
        <div class="bg-gray-50 px-6 py-4 border-t border-gray-200">
            <div class="flex items-center justify-between text-sm text-gray-600">
                <div class="flex space-x-6">
                    <span>總類別: <strong class="text-gray-900">3</strong></span>
                    <span>子類別: <strong class="text-gray-900">2</strong></span>
                    <span>總產品數: <strong class="text-gray-900">69</strong></span>
                </div>
                <div class="flex items-center space-x-4">
                    <span>啟用: <strong class="text-green-600">2</strong></span>
                    <span>停用: <strong class="text-gray-600">1</strong></span>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Add/Edit Category Modal -->
<div id="category-modal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full hidden" data-testid="category-modal">
    <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div class="mt-3">
            <h3 class="text-lg font-medium text-gray-900 mb-4" id="category-modal-title">新增產品類別</h3>
            <form id="category-form" data-testid="category-form">
                <div class="space-y-4">
                    <div>
                        <label for="category_name" class="block text-sm font-medium text-gray-700 mb-1">類別名稱 *</label>
                        <input type="text" id="category_name" name="category_name" 
                               class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                               data-testid="category-name-input">
                    </div>
                    <div>
                        <label for="category_description" class="block text-sm font-medium text-gray-700 mb-1">類別描述</label>
                        <textarea id="category_description" name="category_description" rows="3"
                                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  data-testid="category-description-input"></textarea>
                    </div>
                    <div>
                        <label for="parent_category" class="block text-sm font-medium text-gray-700 mb-1">上層類別</label>
                        <select id="parent_category" name="parent_category" 
                                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                data-testid="parent-category-select">
                            <option value="">無（根類別）</option>
                            <option value="1">電子產品</option>
                            <option value="2">服飾用品</option>
                            <option value="3">居家園藝</option>
                        </select>
                    </div>
                    <div>
                        <label for="category_code" class="block text-sm font-medium text-gray-700 mb-1">類別代碼</label>
                        <input type="text" id="category_code" name="category_code" 
                               class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                               placeholder="自動產生或手動輸入"
                               data-testid="category-code-input">
                    </div>
                    <div>
                        <label for="sort_order" class="block text-sm font-medium text-gray-700 mb-1">排序順序</label>
                        <input type="number" id="sort_order" name="sort_order" min="0" 
                               class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                               data-testid="sort-order-input">
                    </div>
                    <div class="flex items-center">
                        <input type="checkbox" id="is_active" name="is_active" class="mr-2" checked data-testid="is-active-checkbox">
                        <label for="is_active" class="text-sm text-gray-700">啟用此類別</label>
                    </div>
                </div>
                <div class="flex justify-end space-x-3 mt-6">
                    <button type="button" id="cancel-category-modal" 
                            class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                            data-testid="cancel-category-modal-button">
                        取消
                    </button>
                    <button type="submit" 
                            class="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-white hover:bg-blue-700"
                            data-testid="save-category-button">
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
    const modal = document.getElementById('category-modal');
    const addButton = document.querySelector('[data-testid="add-category-button"]');
    const cancelButton = document.getElementById('cancel-category-modal');
    const form = document.getElementById('category-form');
    const searchInput = document.querySelector('[data-testid="search-categories-input"]');

    // Open modal for new category
    addButton.addEventListener('click', function() {
        document.getElementById('category-modal-title').textContent = '新增產品類別';
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
        const categoryName = form.querySelector('[name="category_name"]');
        if (!categoryName.value.trim()) {
            categoryName.classList.add('border-red-500');
            return;
        } else {
            categoryName.classList.remove('border-red-500');
        }
        
        // TODO: Submit to API
        alert('產品類別已儲存');
        modal.classList.add('hidden');
    });

    // Handle expand/collapse
    document.querySelectorAll('[data-testid^="expand-"]').forEach(button => {
        button.addEventListener('click', function() {
            const categoryName = this.getAttribute('data-testid').replace('expand-', '');
            const subcategoriesDiv = document.getElementById('subcategories-' + categoryName);
            const icon = this.querySelector('svg');
            
            if (subcategoriesDiv) {
                if (subcategoriesDiv.classList.contains('hidden')) {
                    subcategoriesDiv.classList.remove('hidden');
                    icon.classList.add('rotate-90');
                } else {
                    subcategoriesDiv.classList.add('hidden');
                    icon.classList.remove('rotate-90');
                }
            }
        });
    });

    // Handle edit buttons
    document.querySelectorAll('[data-testid^="edit-category-"], [data-testid^="edit-subcategory-"]').forEach(button => {
        button.addEventListener('click', function() {
            document.getElementById('category-modal-title').textContent = '編輯產品類別';
            // TODO: Load category data and populate form
            modal.classList.remove('hidden');
        });
    });

    // Handle delete buttons
    document.querySelectorAll('[data-testid^="delete-category-"], [data-testid^="delete-subcategory-"]').forEach(button => {
        button.addEventListener('click', function() {
            if (confirm('確定要刪除這個產品類別嗎？此操作無法復原。')) {
                // TODO: Delete category via API
                alert('產品類別已刪除');
            }
        });
    });

    // Search functionality
    searchInput.addEventListener('input', function() {
        // TODO: Implement search filtering
        console.log('搜尋類別：', this.value);
    });

    // View toggle buttons
    const treeViewButton = document.querySelector('[data-testid="tree-view-button"]');
    const gridViewButton = document.querySelector('[data-testid="grid-view-button"]');
    
    treeViewButton.addEventListener('click', function() {
        this.classList.add('bg-white');
        this.classList.remove('bg-gray-50');
        gridViewButton.classList.add('bg-gray-50');
        gridViewButton.classList.remove('bg-white');
        // TODO: Switch to tree view
    });
    
    gridViewButton.addEventListener('click', function() {
        this.classList.add('bg-white');
        this.classList.remove('bg-gray-50');
        treeViewButton.classList.add('bg-gray-50');
        treeViewButton.classList.remove('bg-white');
        // TODO: Switch to grid view
    });
});
</script>
@endpush