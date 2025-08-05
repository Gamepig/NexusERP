<!-- Main Navigation Component -->
<div class="w-full max-w-4xl mx-auto">
    <div class="bg-white rounded-lg shadow-lg p-6 mb-8">
        <h2 class="text-2xl font-bold text-gray-900 mb-6">
            NexusERP Modules
        </h2>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <!-- Invoice OCR Module -->
            <a href="{{ route('invoice.upload') }}" 
               class="group block p-6 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 hover:border-blue-500">
                <div class="flex items-center mb-3">
                    <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                        <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <h3 class="text-lg font-semibold text-gray-900 group-hover:text-blue-600">
                        Invoice OCR
                    </h3>
                </div>
                <p class="text-sm text-gray-600">
                    Upload and process invoices with automated OCR data extraction
                </p>
                <div class="mt-4 text-blue-600 text-sm font-medium">
                    Process Invoices →
                </div>
            </a>

            <!-- Stocktaking Module -->
            <a href="{{ route('stocktaking.index') }}" 
               class="group block p-6 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 hover:border-green-500">
                <div class="flex items-center mb-3">
                    <div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                        <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                    </div>
                    <h3 class="text-lg font-semibold text-gray-900 group-hover:text-green-600">
                        Stocktaking
                    </h3>
                </div>
                <p class="text-sm text-gray-600">
                    Manage inventory counts and stocktaking operations
                </p>
                <div class="mt-4 text-green-600 text-sm font-medium">
                    View Stocktaking →
                </div>
            </a>

            <!-- Inventory Alerts Module -->
            <a href="{{ route('inventory.alerts') }}" 
               class="group block p-6 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 hover:border-yellow-500">
                <div class="flex items-center mb-3">
                    <div class="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center mr-3">
                        <svg class="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                    </div>
                    <h3 class="text-lg font-semibold text-gray-900 group-hover:text-yellow-600">
                        Inventory Alerts
                    </h3>
                </div>
                <p class="text-sm text-gray-600">
                    Monitor inventory levels and receive low stock alerts
                </p>
                <div class="mt-4 text-yellow-600 text-sm font-medium">
                    Check Alerts →
                </div>
            </a>

            <!-- Dashboard Module -->
            <a href="{{ route('dashboard.index') }}" 
               class="group block p-6 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 hover:border-indigo-500">
                <div class="flex items-center mb-3">
                    <div class="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center mr-3">
                        <svg class="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                        </svg>
                    </div>
                    <h3 class="text-lg font-semibold text-gray-900 group-hover:text-indigo-600">
                        管理儀表板
                    </h3>
                </div>
                <p class="text-sm text-gray-600">
                    查看業務總覽、銷售趨勢和關鍵績效指標
                </p>
                <div class="mt-4 text-indigo-600 text-sm font-medium">
                    查看儀表板 →
                </div>
            </a>

            <!-- Sales Reports Module -->
            <a href="{{ route('reports.sales.index') }}" 
               class="group block p-6 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 hover:border-green-500">
                <div class="flex items-center mb-3">
                    <div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                        <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                    </div>
                    <h3 class="text-lg font-semibold text-gray-900 group-hover:text-green-600">
                        銷售報表
                    </h3>
                </div>
                <p class="text-sm text-gray-600">
                    詳細的銷售數據分析和趨勢報告
                </p>
                <div class="mt-4 text-green-600 text-sm font-medium">
                    查看銷售報表 →
                </div>
            </a>

            <!-- Inventory Reports Module -->
            <a href="{{ route('reports.inventory') }}" 
               class="group block p-6 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 hover:border-blue-500">
                <div class="flex items-center mb-3">
                    <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                        <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                    </div>
                    <h3 class="text-lg font-semibold text-gray-900 group-hover:text-blue-600">
                        庫存報表
                    </h3>
                </div>
                <p class="text-sm text-gray-600">
                    庫存水準、週轉率和庫存價值分析
                </p>
                <div class="mt-4 text-blue-600 text-sm font-medium">
                    查看庫存報表 →
                </div>
            </a>

            <!-- Financial Reports Module -->
            <a href="{{ route('reports.financial') }}" 
               class="group block p-6 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 hover:border-purple-500">
                <div class="flex items-center mb-3">
                    <div class="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                        <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <h3 class="text-lg font-semibold text-gray-900 group-hover:text-purple-600">
                        財務報表
                    </h3>
                </div>
                <p class="text-sm text-gray-600">
                    應收應付帳款、現金流和財務狀況分析
                </p>
                <div class="mt-4 text-purple-600 text-sm font-medium">
                    查看財務報表 →
                </div>
            </a>

            <!-- Test Module -->
            <a href="{{ route('test.stocktaking') }}" 
               class="group block p-6 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 hover:border-gray-500">
                <div class="flex items-center mb-3">
                    <div class="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                        <svg class="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <h3 class="text-lg font-semibold text-gray-900 group-hover:text-gray-600">
                        Test Features
                    </h3>
                </div>
                <p class="text-sm text-gray-600">
                    Test and demo various ERP features and functionalities
                </p>
                <div class="mt-4 text-gray-600 text-sm font-medium">
                    Run Tests →
                </div>
            </a>

            <!-- Employee Management Module -->
            <a href="{{ route('employees.index') }}" 
               class="group block p-6 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 hover:border-emerald-500">
                <div class="flex items-center mb-3">
                    <div class="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center mr-3">
                        <svg class="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                    </div>
                    <h3 class="text-lg font-semibold text-gray-900 group-hover:text-emerald-600">
                        員工管理
                    </h3>
                </div>
                <p class="text-sm text-gray-600">
                    管理員工資料、出勤記錄和人力資源資訊
                </p>
                <div class="mt-4 text-emerald-600 text-sm font-medium">
                    管理員工 →
                </div>
            </a>

            <!-- Attendance Management Module -->
            <a href="{{ route('attendance.index') }}" 
               class="group block p-6 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 hover:border-teal-500">
                <div class="flex items-center mb-3">
                    <div class="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center mr-3">
                        <svg class="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h3 class="text-lg font-semibold text-gray-900 group-hover:text-teal-600">
                        出勤管理
                    </h3>
                </div>
                <p class="text-sm text-gray-600">
                    員工出勤打卡、考勤記錄和出勤統計報表
                </p>
                <div class="mt-4 text-teal-600 text-sm font-medium">
                    出勤管理 →
                </div>
            </a>

            <!-- Supplier Registration Module -->
            <a href="{{ route('marketplace.supplier.register') }}" 
               class="group block p-6 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 hover:border-orange-500">
                <div class="flex items-center mb-3">
                    <div class="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                        <svg class="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                    </div>
                    <h3 class="text-lg font-semibold text-gray-900 group-hover:text-orange-600">
                        供應商註冊
                    </h3>
                </div>
                <p class="text-sm text-gray-600">
                    申請成為 NexusERP 市場平台的供應商合作夥伴
                </p>
                <div class="mt-4 text-orange-600 text-sm font-medium">
                    立即註冊 →
                </div>
            </a>

            <!-- Coming Soon - More modules -->
            <div class="p-6 bg-gray-50 border border-gray-200 rounded-lg shadow-sm border-dashed">
                <div class="flex items-center mb-3">
                    <div class="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                        <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                    </div>
                    <h3 class="text-lg font-medium text-gray-500">
                        More Modules
                    </h3>
                </div>
                <p class="text-sm text-gray-400">
                    Additional ERP modules coming soon...
                </p>
                <div class="mt-4 text-gray-400 text-sm">
                    Coming Soon
                </div>
            </div>
        </div>
    </div>
</div>