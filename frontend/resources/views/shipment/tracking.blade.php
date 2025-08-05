@extends('layouts.app')

@section('title', '物流追蹤')

@push('head')
    <!-- React and other dependencies -->
    <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
    <script src="https://unpkg.com/axios/dist/axios.min.js"></script>
    
    <!-- Tailwind CSS (if not already included) -->
    <script src="https://cdn.tailwindcss.com"></script>
    
    <style>
        /* Custom styles for tracking timeline */
        .tracking-timeline {
            position: relative;
        }
        
        .tracking-timeline::before {
            content: '';
            position: absolute;
            left: 6px;
            top: 20px;
            bottom: 20px;
            width: 2px;
            background: #e5e7eb;
        }
        
        .tracking-dot {
            position: relative;
            z-index: 1;
        }
    </style>
@endpush

@section('content')
<div class="container mx-auto px-4 py-6">
    <!-- Page Header -->
    <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900">物流追蹤管理</h1>
        <p class="text-gray-600 mt-2">即時追蹤您的貨件狀態和配送進度</p>
    </div>

    <!-- Quick Tracking Search -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">快速追蹤</h2>
        <form id="quick-tracking-form" class="flex gap-4">
            <div class="flex-1">
                <input 
                    type="text" 
                    id="tracking-number-input"
                    placeholder="請輸入追蹤號碼"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
            </div>
            <button 
                type="submit"
                class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
            >
                追蹤
            </button>
        </form>
        
        <!-- Quick tracking result -->
        <div id="quick-tracking-result" class="mt-6"></div>
    </div>

    <!-- Tabs Navigation -->
    <div class="border-b border-gray-200 mb-6">
        <nav class="-mb-px flex space-x-8">
            <button 
                class="tab-button py-2 px-1 border-b-2 font-medium text-sm active"
                data-tab="dashboard"
            >
                追蹤總覽
            </button>
            <button 
                class="tab-button py-2 px-1 border-b-2 font-medium text-sm"
                data-tab="orders"
            >
                訂單貨件
            </button>
            <button 
                class="tab-button py-2 px-1 border-b-2 font-medium text-sm"
                data-tab="customers"
            >
                客戶貨件
            </button>
        </nav>
    </div>

    <!-- Tab Content -->
    <div id="tab-content">
        <!-- Dashboard Tab -->
        <div id="dashboard-tab" class="tab-content active">
            <div 
                id="shipment-dashboard"
                data-shipment-tracking
                data-tracking-type="dashboard"
            ></div>
        </div>

        <!-- Orders Tab -->
        <div id="orders-tab" class="tab-content hidden">
            <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 class="text-lg font-semibold text-gray-900 mb-4">依訂單查詢貨件</h3>
                
                <form id="order-search-form" class="mb-6">
                    <div class="flex gap-4">
                        <div class="flex-1">
                            <input 
                                type="text" 
                                id="order-id-input"
                                placeholder="請輸入銷售訂單ID"
                                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                        </div>
                        <button 
                            type="submit"
                            class="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500"
                        >
                            查詢
                        </button>
                    </div>
                </form>
                
                <div id="order-shipments-result"></div>
            </div>
        </div>

        <!-- Customers Tab -->
        <div id="customers-tab" class="tab-content hidden">
            <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 class="text-lg font-semibold text-gray-900 mb-4">依客戶查詢貨件</h3>
                
                <form id="customer-search-form" class="mb-6">
                    <div class="flex gap-4">
                        <div class="flex-1">
                            <input 
                                type="text" 
                                id="customer-id-input"
                                placeholder="請輸入客戶ID"
                                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                        </div>
                        <button 
                            type="submit"
                            class="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:ring-2 focus:ring-purple-500"
                        >
                            查詢
                        </button>
                    </div>
                </form>
                
                <div id="customer-shipments-result"></div>
            </div>
        </div>
    </div>
</div>
@endsection

@push('scripts')
    <!-- Include shipment tracking module -->
    <script type="module" src="{{ asset('js/modules/shipment-tracking.js') }}"></script>
    
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            // Tab switching functionality
            const tabButtons = document.querySelectorAll('.tab-button');
            const tabContents = document.querySelectorAll('.tab-content');

            tabButtons.forEach(button => {
                button.addEventListener('click', () => {
                    const targetTab = button.dataset.tab;

                    // Update button states
                    tabButtons.forEach(btn => {
                        btn.classList.remove('active');
                        btn.classList.add('text-gray-500', 'border-transparent');
                        btn.classList.remove('text-blue-600', 'border-blue-500');
                    });
                    button.classList.add('active');
                    button.classList.add('text-blue-600', 'border-blue-500');
                    button.classList.remove('text-gray-500', 'border-transparent');

                    // Update content visibility
                    tabContents.forEach(content => {
                        content.classList.add('hidden');
                        content.classList.remove('active');
                    });
                    const targetContent = document.getElementById(`${targetTab}-tab`);
                    if (targetContent) {
                        targetContent.classList.remove('hidden');
                        targetContent.classList.add('active');
                    }
                });
            });

            // Quick tracking form
            const quickTrackingForm = document.getElementById('quick-tracking-form');
            const trackingNumberInput = document.getElementById('tracking-number-input');
            const quickTrackingResult = document.getElementById('quick-tracking-result');

            quickTrackingForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const trackingNumber = trackingNumberInput.value.trim();
                
                if (!trackingNumber) {
                    alert('請輸入追蹤號碼');
                    return;
                }

                // Clear previous result
                quickTrackingResult.innerHTML = '<div class="text-center py-4"><div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div><p class="text-gray-600 mt-2">查詢中...</p></div>';

                try {
                    // Create a unique container for this tracking result
                    const resultContainer = document.createElement('div');
                    resultContainer.id = `tracking-${Date.now()}`;
                    quickTrackingResult.innerHTML = '';
                    quickTrackingResult.appendChild(resultContainer);

                    // Initialize tracking component
                    if (window.ShipmentTrackingModule) {
                        window.ShipmentTrackingModule.initTracking(resultContainer.id, {
                            trackingNumber: trackingNumber,
                            type: 'full'
                        });
                    }
                } catch (error) {
                    console.error('Error displaying tracking info:', error);
                    quickTrackingResult.innerHTML = '<div class="text-red-600 p-4 bg-red-50 border border-red-200 rounded">無法載入追蹤資訊，請稍後再試。</div>';
                }
            });

            // Order search form
            const orderSearchForm = document.getElementById('order-search-form');
            const orderIdInput = document.getElementById('order-id-input');
            const orderShipmentsResult = document.getElementById('order-shipments-result');

            orderSearchForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const orderId = orderIdInput.value.trim();
                
                if (!orderId) {
                    alert('請輸入訂單ID');
                    return;
                }

                // Create dashboard for specific order
                const resultContainer = document.createElement('div');
                resultContainer.id = `order-dashboard-${Date.now()}`;
                orderShipmentsResult.innerHTML = '';
                orderShipmentsResult.appendChild(resultContainer);

                if (window.ShipmentTrackingModule) {
                    window.ShipmentTrackingModule.initTracking(resultContainer.id, {
                        salesOrderId: orderId,
                        type: 'dashboard'
                    });
                }
            });

            // Customer search form
            const customerSearchForm = document.getElementById('customer-search-form');
            const customerIdInput = document.getElementById('customer-id-input');
            const customerShipmentsResult = document.getElementById('customer-shipments-result');

            customerSearchForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const customerId = customerIdInput.value.trim();
                
                if (!customerId) {
                    alert('請輸入客戶ID');
                    return;
                }

                // Create dashboard for specific customer
                const resultContainer = document.createElement('div');
                resultContainer.id = `customer-dashboard-${Date.now()}`;
                customerShipmentsResult.innerHTML = '';
                customerShipmentsResult.appendChild(resultContainer);

                if (window.ShipmentTrackingModule) {
                    window.ShipmentTrackingModule.initTracking(resultContainer.id, {
                        customerId: customerId,
                        type: 'dashboard'
                    });
                }
            });
        });
    </script>
@endpush