@extends('layouts.app')

@section('title', isset($mode) && $mode === 'edit' ? '編輯商品' : '新增商品')

@section('content')
<div class="container mx-auto px-4 py-6">
    <!-- Header Section -->
    <div class="flex items-center justify-between mb-6">
        <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {{ isset($mode) && $mode === 'edit' ? '編輯商品' : '新增商品' }}
            </h1>
            <p class="text-gray-600 dark:text-gray-400">
                {{ isset($mode) && $mode === 'edit' ? '修改商品資訊' : '建立新的商品項目' }}
            </p>
        </div>
        <div class="flex space-x-3">
            <a href="{{ route('products.index') }}" 
               class="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center">
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
                </svg>
                返回清單
            </a>
        </div>
    </div>

    <!-- Product Form -->
    <form id="product-form" class="space-y-6">
        @csrf
        @if(isset($mode) && $mode === 'edit')
            @method('PUT')
            <input type="hidden" id="product-id" value="{{ $productId ?? '' }}">
        @endif

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- Main Product Information -->
            <div class="lg:col-span-2 space-y-6">
                <!-- Basic Information Card -->
                <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">基本資訊</h3>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="md:col-span-2">
                            <label for="name" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                商品名稱 <span class="text-red-500">*</span>
                            </label>
                            <input type="text" id="name" name="name" required
                                   class="block w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                   placeholder="請輸入商品名稱">
                            <div class="invalid-feedback text-red-500 text-sm mt-1 hidden"></div>
                        </div>
                        
                        <div>
                            <label for="sku" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                SKU 編號 <span class="text-red-500">*</span>
                            </label>
                            <input type="text" id="sku" name="sku" required
                                   class="block w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                   placeholder="SKU001">
                            <div class="invalid-feedback text-red-500 text-sm mt-1 hidden"></div>
                        </div>
                        
                        <div>
                            <label for="barcode" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                條碼
                            </label>
                            <input type="text" id="barcode" name="barcode"
                                   class="block w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                   placeholder="請輸入條碼">
                            <div class="invalid-feedback text-red-500 text-sm mt-1 hidden"></div>
                        </div>
                        
                        <div class="md:col-span-2">
                            <label for="description" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                商品描述
                            </label>
                            <textarea id="description" name="description" rows="3"
                                      class="block w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                      placeholder="請輸入商品描述"></textarea>
                            <div class="invalid-feedback text-red-500 text-sm mt-1 hidden"></div>
                        </div>
                    </div>
                </div>

                <!-- Category and Classification -->
                <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">分類與規格</h3>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label for="category_id" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                商品分類 <span class="text-red-500">*</span>
                            </label>
                            <select id="category_id" name="category_id" required
                                    class="block w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                                <option value="">請選擇分類</option>
                                <!-- Categories will be loaded via JavaScript -->
                            </select>
                            <div class="invalid-feedback text-red-500 text-sm mt-1 hidden"></div>
                        </div>
                        
                        <div>
                            <label for="unit_of_measure_id" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                計量單位 <span class="text-red-500">*</span>
                            </label>
                            <select id="unit_of_measure_id" name="unit_of_measure_id" required
                                    class="block w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                                <option value="">請選擇單位</option>
                                <!-- Units will be loaded via JavaScript -->
                            </select>
                            <div class="invalid-feedback text-red-500 text-sm mt-1 hidden"></div>
                        </div>
                        
                        <div>
                            <label for="weight" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                重量 (kg)
                            </label>
                            <input type="number" id="weight" name="weight" step="0.01" min="0"
                                   class="block w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                   placeholder="0.00">
                            <div class="invalid-feedback text-red-500 text-sm mt-1 hidden"></div>
                        </div>
                        
                        <div>
                            <label for="dimensions" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                尺寸 (長x寬x高 cm)
                            </label>
                            <input type="text" id="dimensions" name="dimensions"
                                   class="block w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                   placeholder="例：10x20x30">
                            <div class="invalid-feedback text-red-500 text-sm mt-1 hidden"></div>
                        </div>
                    </div>
                </div>

                <!-- Pricing and Inventory -->
                <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">價格與庫存</h3>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label for="price" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                售價 <span class="text-red-500">*</span>
                            </label>
                            <div class="relative">
                                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <span class="text-gray-500 dark:text-gray-400 text-sm">NT$</span>
                                </div>
                                <input type="number" id="price" name="price" step="0.01" min="0" required
                                       class="block w-full pl-12 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                       placeholder="0.00">
                            </div>
                            <div class="invalid-feedback text-red-500 text-sm mt-1 hidden"></div>
                        </div>
                        
                        <div>
                            <label for="cost_price" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                成本價
                            </label>
                            <div class="relative">
                                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <span class="text-gray-500 dark:text-gray-400 text-sm">NT$</span>
                                </div>
                                <input type="number" id="cost_price" name="cost_price" step="0.01" min="0"
                                       class="block w-full pl-12 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                       placeholder="0.00">
                            </div>
                            <div class="invalid-feedback text-red-500 text-sm mt-1 hidden"></div>
                        </div>
                        
                        <div>
                            <label for="stock_quantity" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                初始庫存數量
                            </label>
                            <input type="number" id="stock_quantity" name="stock_quantity" min="0"
                                   class="block w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                   placeholder="0">
                            <div class="invalid-feedback text-red-500 text-sm mt-1 hidden"></div>
                        </div>
                        
                        <div>
                            <label for="low_stock_threshold" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                低庫存警告值
                            </label>
                            <input type="number" id="low_stock_threshold" name="low_stock_threshold" min="0"
                                   class="block w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                   placeholder="10">
                            <div class="invalid-feedback text-red-500 text-sm mt-1 hidden"></div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Sidebar -->
            <div class="space-y-6">
                <!-- Product Image -->
                <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">商品圖片</h3>
                    
                    <div class="space-y-4">
                        <div id="image-preview" class="w-full h-48 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center bg-gray-50 dark:bg-gray-700">
                            <div class="text-center">
                                <svg class="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                                <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                    點擊上傳圖片
                                </p>
                            </div>
                        </div>
                        
                        <input type="file" id="image" name="image" accept="image/*" class="hidden">
                        <button type="button" onclick="document.getElementById('image').click()" 
                                class="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200">
                            選擇圖片
                        </button>
                    </div>
                </div>

                <!-- Product Status -->
                <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">商品狀態</h3>
                    
                    <div class="space-y-4">
                        <div>
                            <label for="status" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                狀態
                            </label>
                            <select id="status" name="status"
                                    class="block w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                                <option value="active">上架中</option>
                                <option value="inactive">已下架</option>
                            </select>
                        </div>
                        
                        <div class="flex items-center">
                            <input type="checkbox" id="is_featured" name="is_featured" value="1"
                                   class="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4">
                            <label for="is_featured" class="ml-2 block text-sm text-gray-900 dark:text-white">
                                精選商品
                            </label>
                        </div>
                        
                        <div class="flex items-center">
                            <input type="checkbox" id="track_inventory" name="track_inventory" value="1" checked
                                   class="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4">
                            <label for="track_inventory" class="ml-2 block text-sm text-gray-900 dark:text-white">
                                追蹤庫存
                            </label>
                        </div>
                    </div>
                </div>

                <!-- Form Actions -->
                <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <div class="space-y-3">
                        <button type="submit" id="submit-btn"
                                class="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center justify-center">
                            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                            </svg>
                            {{ isset($mode) && $mode === 'edit' ? '更新商品' : '建立商品' }}
                        </button>
                        
                        <button type="button" onclick="window.location.href='{{ route('products.index') }}'"
                                class="w-full bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200">
                            取消
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </form>
</div>

@push('scripts')
<script>
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('product-form');
    const submitBtn = document.getElementById('submit-btn');
    const isEditMode = document.getElementById('product-id');
    
    // Load form data
    loadCategories();
    loadUnitsOfMeasure();
    
    if (isEditMode && isEditMode.value) {
        loadProductData(isEditMode.value);
    }
    
    // Image upload handling
    const imageInput = document.getElementById('image');
    const imagePreview = document.getElementById('image-preview');
    
    imageInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                imagePreview.innerHTML = `
                    <img src="${e.target.result}" alt="Preview" class="w-full h-full object-cover rounded-lg">
                `;
            };
            reader.readAsDataURL(file);
        }
    });
    
    // Form submission
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        submitForm();
    });
    
    // Load categories
    function loadCategories() {
        fetch('/api/product-categories', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                'X-Requested-With': 'XMLHttpRequest'
            },
            credentials: 'same-origin'
        })
            .then(response => response.json())
            .then(data => {
                const select = document.getElementById('category_id');
                select.innerHTML = '<option value="">請選擇分類</option>';
                
                data.data.forEach(category => {
                    select.innerHTML += `<option value="${category.id}">${category.name}</option>`;
                });
            })
            .catch(error => console.error('Error loading categories:', error));
    }
    
    // Load units of measure
    function loadUnitsOfMeasure() {
        fetch('/api/units-of-measure', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                'X-Requested-With': 'XMLHttpRequest'
            },
            credentials: 'same-origin'
        })
            .then(response => response.json())
            .then(data => {
                const select = document.getElementById('unit_of_measure_id');
                select.innerHTML = '<option value="">請選擇單位</option>';
                
                data.data.forEach(unit => {
                    select.innerHTML += `<option value="${unit.id}">${unit.name} (${unit.symbol})</option>`;
                });
            })
            .catch(error => console.error('Error loading units:', error));
    }
    
    // Load product data for editing
    function loadProductData(productId) {
        fetch(`/api/products/${productId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                'X-Requested-With': 'XMLHttpRequest'
            },
            credentials: 'same-origin'
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                return response.json();
            })
            .then(data => {
                if (!data.success) {
                    throw new Error(data.message || '載入失敗');
                }
                
                const product = data.data;
                console.log('Loaded product data:', product);
                
                // Fill form fields
                Object.keys(product).forEach(key => {
                    const element = document.getElementById(key);
                    if (element) {
                        if (element.type === 'checkbox') {
                            element.checked = product[key];
                        } else if (element.type === 'file') {
                            // Skip file inputs - they cannot be programmatically set
                            return;
                        } else {
                            element.value = product[key] || '';
                        }
                    }
                });
                
                // Load product image if exists
                if (product.image_url || product.image) {
                    const imageUrl = product.image_url || product.image;
                    imagePreview.innerHTML = `
                        <img src="${imageUrl}" alt="${product.name}" class="w-full h-full object-cover rounded-lg">
                    `;
                }
            })
            .catch(error => {
                console.error('Error loading product:', error);
                alert(`載入商品資料時發生錯誤: ${error.message}`);
            });
    }
    
    // Submit form
    function submitForm() {
        const formData = new FormData(form);
        const productId = isEditMode ? isEditMode.value : null;
        const url = productId ? `/api/products/${productId}` : '/api/products';
        const method = 'POST'; // 總是使用 POST，編輯時通過 _method 指定 PUT
        
        // 編輯模式時添加 _method=PUT
        if (productId) {
            formData.append('_method', 'PUT');
        }
        
        // Show loading state
        submitBtn.disabled = true;
        submitBtn.innerHTML = `
            <svg class="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            ${productId ? '更新中...' : '建立中...'}
        `;
        
        // Clear previous errors
        clearFormErrors();
        
        fetch(url, {
            method: method,
            body: formData,
            headers: {
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert(productId ? '商品更新成功！' : '商品建立成功！');
                window.location.href = '/products';
            } else {
                // Show validation errors
                if (data.errors) {
                    showFormErrors(data.errors);
                } else {
                    alert('操作失敗：' + (data.message || '未知錯誤'));
                }
            }
        })
        .catch(error => {
            console.error('Error submitting form:', error);
            alert('提交時發生錯誤');
        })
        .finally(() => {
            // Reset button state
            submitBtn.disabled = false;
            submitBtn.innerHTML = `
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
                ${productId ? '更新商品' : '建立商品'}
            `;
        });
    }
    
    // Show form validation errors
    function showFormErrors(errors) {
        Object.keys(errors).forEach(field => {
            const element = document.getElementById(field);
            if (element) {
                element.classList.add('border-red-500');
                const errorDiv = element.parentNode.querySelector('.invalid-feedback');
                if (errorDiv) {
                    errorDiv.textContent = errors[field][0];
                    errorDiv.classList.remove('hidden');
                }
            }
        });
    }
    
    // Clear form errors
    function clearFormErrors() {
        const errorElements = document.querySelectorAll('.border-red-500');
        errorElements.forEach(element => {
            element.classList.remove('border-red-500');
        });
        
        const errorMessages = document.querySelectorAll('.invalid-feedback');
        errorMessages.forEach(element => {
            element.classList.add('hidden');
            element.textContent = '';
        });
    }
});
</script>
@endpush
@endsection