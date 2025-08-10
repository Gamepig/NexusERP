@extends('layouts.app')

@section('title', '報價單管理 - NexusERP')

@section('content')
<!-- 頁面背景漸層 - 柔和色調 -->
<div class="min-h-screen bg-gradient-to-br from-slate-50 via-slate-50 to-blue-50 dark:from-slate-900 dark:via-slate-850 dark:to-slate-800">
    <div class="container mx-auto px-4 py-6">
        <!-- Header Section - 增強視覺設計 -->
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 mb-6 overflow-hidden">
            <!-- 頂部漸層條 - 柔和色調 -->
            <div class="h-2 bg-gradient-to-r from-blue-200 via-indigo-200 to-purple-200 dark:from-blue-800 dark:via-indigo-800 dark:to-purple-800"></div>
            
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6">
                <div class="flex items-center">
                    <!-- 報價單圖標 - 柔和色調 -->
                    <div class="bg-gradient-to-br from-blue-300 to-indigo-400 dark:from-blue-600 dark:to-indigo-700 rounded-xl p-3 mr-4">
                        <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                        </svg>
                    </div>
                    <div>
                        <h1 class="text-3xl font-bold bg-gradient-to-r from-slate-700 to-slate-800 dark:from-slate-200 dark:to-slate-300 bg-clip-text text-transparent mb-2">
                            報價單管理
                        </h1>
                        <p class="text-gray-600 dark:text-gray-400 flex items-center">
                            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                            </svg>
                            管理您的報價單與客戶溝通
                        </p>
                    </div>
                </div>
                <div class="flex space-x-3 mt-4 sm:mt-0">
                    <!-- 統計卡片 -->
                    @if(isset($quotes['total']) && $quotes['total'] > 0)
                        <div class="hidden sm:flex items-center bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900 dark:to-teal-900 rounded-xl px-4 py-2 mr-3">
                            <div class="text-center">
                                <div class="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{{ $quotes['total'] }}</div>
                                <div class="text-xs text-emerald-600 dark:text-emerald-400">總報價單</div>
                            </div>
                        </div>
                    @endif
                    
                    <!-- 建立按鈕增強 - 下拉選單 (修復定位問題) -->
                    <div class="relative" x-data="{ open: false }" x-ref="dropdown">
                        <button @click="open = !open; $nextTick(() => { if (open) repositionDropdown() })" 
                               x-ref="button"
                               class="bg-gradient-to-r from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700 text-white px-6 py-3 rounded-xl text-sm font-medium transition-all duration-300 flex items-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                            </svg>
                            建立報價單
                            <svg class="w-4 h-4 ml-2" :class="open ? 'rotate-180' : ''" 
                                 fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                 class="transition-transform duration-200">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                            </svg>
                        </button>
                        
                        <!-- 修復後的下拉選單 - 使用fixed定位避免overflow衝突 -->
                        <div x-show="open" 
                             x-ref="menu"
                             @click.away="open = false"
                             x-transition:enter="transition ease-out duration-100"
                             x-transition:enter-start="opacity-0 scale-95"
                             x-transition:enter-end="opacity-100 scale-100"
                             x-transition:leave="transition ease-in duration-75"
                             x-transition:leave-start="opacity-100 scale-100"
                             x-transition:leave-end="opacity-0 scale-95"
                             class="fixed w-64 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700"
                             style="z-index: 9999;"
                             x-init="
                                repositionDropdown = () => {
                                    const button = $refs.button;
                                    const menu = $refs.menu;
                                    if (button && menu && open) {
                                        const buttonRect = button.getBoundingClientRect();
                                        const viewportWidth = window.innerWidth;
                                        const viewportHeight = window.innerHeight;
                                        const menuWidth = 256; // w-64 = 256px
                                        const menuHeight = 140; // 更新估計高度
                                        
                                        let top = buttonRect.bottom + 8;
                                        let left = buttonRect.right - menuWidth;
                                        
                                        // 確保下拉選單不會超出視口右邊界
                                        if (left < 8) {
                                            left = buttonRect.left;
                                        }
                                        
                                        // 確保下拉選單不會超出視口底部
                                        if (top + menuHeight > viewportHeight) {
                                            top = buttonRect.top - menuHeight - 8;
                                        }
                                        
                                        // 最終邊界檢查
                                        top = Math.max(8, Math.min(top, viewportHeight - menuHeight - 8));
                                        left = Math.max(8, Math.min(left, viewportWidth - menuWidth - 8));
                                        
                                        menu.style.top = top + 'px';
                                        menu.style.left = left + 'px';
                                    }
                                };
                                
                                // 監聽視窗大小變化，重新定位下拉選單
                                window.addEventListener('resize', () => {
                                    if (open) repositionDropdown();
                                });
                                
                                // 監聽滾動事件，重新定位下拉選單
                                window.addEventListener('scroll', () => {
                                    if (open) repositionDropdown();
                                });
                             ">
                            <div class="py-2">
                                <a href="{{ route('quotes.create') }}" 
                                   @click="open = false"
                                   class="flex items-center px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors">
                                    <svg class="w-5 h-5 mr-3 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                                    </svg>
                                    <div>
                                        <div class="font-medium">標準表單</div>
                                        <div class="text-xs text-gray-500 dark:text-gray-400">傳統的單頁表單</div>
                                    </div>
                                </a>
                                <a href="{{ route('quotes.create.multi-step') }}" 
                                   @click="open = false"
                                   class="flex items-center px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors border-t border-gray-100 dark:border-gray-700">
                                    <svg class="w-5 h-5 mr-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                                    </svg>
                                    <div>
                                        <div class="font-medium text-blue-600 dark:text-blue-400">多步驟表單</div>
                                        <div class="text-xs text-gray-500 dark:text-gray-400">引導式三步驟建立流程</div>
                                    </div>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 搜尋和篩選區塊 - 美化設計 -->
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 mb-6 overflow-hidden">
            <!-- 搜尋區塊標題 -->
            <div class="bg-gradient-to-r from-slate-50 to-gray-50 dark:from-gray-700 dark:to-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <div class="flex items-center">
                    <div class="bg-gradient-to-br from-slate-400 to-gray-500 dark:from-slate-500 dark:to-gray-600 rounded-lg p-2 mr-3">
                        <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                        </svg>
                    </div>
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white">搜尋和篩選</h3>
                    <span class="ml-2 text-sm text-gray-500 dark:text-gray-400">快速找到您需要的報價單</span>
                </div>
            </div>
        
        <form method="GET" action="{{ route('quotes.index') }}" class="p-6" id="searchForm">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <!-- 搜尋關鍵字 -->
                <div class="group">
                    <label for="search" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                        <svg class="w-4 h-4 mr-1 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"/>
                        </svg>
                        搜尋關鍵字
                    </label>
                    <div class="relative">
                        <input type="text" 
                               id="search" 
                               name="search" 
                               value="{{ request('search') }}" 
                               placeholder="報價編號、客戶名稱..."
                               class="w-full px-4 py-3 pl-10 border-2 border-gray-300 dark:border-gray-600 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all duration-200 group-hover:border-blue-400">
                        <svg class="w-5 h-5 absolute left-3 top-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                        </svg>
                    </div>
                </div>

                <!-- 狀態篩選 -->
                <div class="group">
                    <label for="status" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                        <svg class="w-4 h-4 mr-1 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                        狀態
                    </label>
                    <select id="status" 
                            name="status"
                            onchange="this.form.submit()"
                            class="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white transition-all duration-200 group-hover:border-green-400 cursor-pointer">
                        <option value="">🌐 全部狀態</option>
                        <option value="draft" {{ request('status') === 'draft' ? 'selected' : '' }}>📝 草稿</option>
                        <option value="pending" {{ request('status') === 'pending' || request('status') === 'sent' ? 'selected' : '' }}>📤 已發送</option>
                        <option value="approved" {{ request('status') === 'approved' || request('status') === 'accepted' ? 'selected' : '' }}>✅ 已批准</option>
                        <option value="rejected" {{ request('status') === 'rejected' ? 'selected' : '' }}>❌ 已拒絕</option>
                        <option value="expired" {{ request('status') === 'expired' ? 'selected' : '' }}>⏰ 已過期</option>
                        <option value="converted" {{ request('status') === 'converted' ? 'selected' : '' }}>🔄 已轉換</option>
                    </select>
                </div>

                <!-- 日期範圍 -->
                <div class="group">
                    <label for="date_from" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                        <svg class="w-4 h-4 mr-1 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                        </svg>
                        開始日期
                    </label>
                    <input type="date" 
                           id="date_from" 
                           name="date_from" 
                           value="{{ request('date_from') }}"
                           class="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white transition-all duration-200 group-hover:border-purple-400 cursor-pointer">
                </div>

                <div class="group">
                    <label for="date_to" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                        <svg class="w-4 h-4 mr-1 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                        </svg>
                        結束日期
                    </label>
                    <input type="date" 
                           id="date_to" 
                           name="date_to" 
                           value="{{ request('date_to') }}"
                           class="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl shadow-sm focus:ring-2 focus:ring-pink-500 focus:border-pink-500 dark:bg-gray-700 dark:text-white transition-all duration-200 group-hover:border-pink-400 cursor-pointer">
                </div>
            </div>

            <!-- 操作按鈕區 -->
            <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-8 space-y-4 sm:space-y-0">
                <!-- 搜尋和清除按鈕 -->
                <div class="flex flex-wrap gap-3">
                    <button type="submit" 
                            class="bg-gradient-to-r from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700 text-white px-6 py-3 rounded-xl text-sm font-medium transition-all duration-300 flex items-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                        </svg>
                        🔍 搜尋
                    </button>
                    <a href="{{ route('quotes.index') }}" 
                       class="bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white px-6 py-3 rounded-xl text-sm font-medium transition-all duration-300 flex items-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                        </svg>
                        🗑️ 清除篩選
                    </a>
                </div>
                
                <!-- 每頁顯示數量和排序選項 -->
                <div class="flex flex-wrap items-center gap-4">
                    <!-- 每頁選項 -->
                    <div class="flex items-center space-x-2 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900 dark:to-teal-900 rounded-xl px-4 py-2">
                        <svg class="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"/>
                        </svg>
                        <label for="per_page" class="text-sm font-semibold text-emerald-700 dark:text-emerald-300">每頁：</label>
                        <select id="per_page" 
                                name="per_page" 
                                onchange="this.form.submit()"
                                class="px-3 py-1 border-2 border-emerald-300 dark:border-emerald-600 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-emerald-800 dark:text-emerald-100 cursor-pointer transition-all duration-200">
                            <option value="10" {{ request('per_page', 20) == 10 ? 'selected' : '' }}>📄 10</option>
                            <option value="20" {{ request('per_page', 20) == 20 ? 'selected' : '' }}>📃 20</option>
                            <option value="50" {{ request('per_page', 20) == 50 ? 'selected' : '' }}>📑 50</option>
                            <option value="100" {{ request('per_page', 20) == 100 ? 'selected' : '' }}>📚 100</option>
                        </select>
                    </div>
                    
                    <!-- 排序選項 -->
                    <div class="flex items-center space-x-2 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900 dark:to-orange-900 rounded-xl px-4 py-2">
                        <svg class="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4"/>
                        </svg>
                        <label for="sort" class="text-sm font-semibold text-amber-700 dark:text-amber-300">排序：</label>
                        <select id="sort" 
                                name="sort" 
                                onchange="this.form.submit()"
                                class="px-3 py-1 border-2 border-amber-300 dark:border-amber-600 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 dark:bg-amber-800 dark:text-amber-100 cursor-pointer transition-all duration-200">
                            <option value="created_at_desc" {{ request('sort', 'created_at_desc') === 'created_at_desc' ? 'selected' : '' }}>🆕 最新建立</option>
                            <option value="created_at_asc" {{ request('sort') === 'created_at_asc' ? 'selected' : '' }}>🕐 最舊建立</option>
                            <option value="quote_date_desc" {{ request('sort') === 'quote_date_desc' ? 'selected' : '' }}>📅 報價日期 (新→舊)</option>
                            <option value="quote_date_asc" {{ request('sort') === 'quote_date_asc' ? 'selected' : '' }}>📅 報價日期 (舊→新)</option>
                            <option value="total_amount_desc" {{ request('sort') === 'total_amount_desc' ? 'selected' : '' }}>💰 金額 (高→低)</option>
                            <option value="total_amount_asc" {{ request('sort') === 'total_amount_asc' ? 'selected' : '' }}>💰 金額 (低→高)</option>
                            <option value="quote_number_desc" {{ request('sort') === 'quote_number_desc' ? 'selected' : '' }}>🔢 報價編號 (新→舊)</option>
                            <option value="quote_number_asc" {{ request('sort') === 'quote_number_asc' ? 'selected' : '' }}>🔢 報價編號 (舊→新)</option>
                            <option value="customer_name_desc" {{ request('sort') === 'customer_name_desc' ? 'selected' : '' }}>👤 客戶名稱 (Z→A)</option>
                            <option value="customer_name_asc" {{ request('sort') === 'customer_name_asc' ? 'selected' : '' }}>👤 客戶名稱 (A→Z)</option>
                        </select>
                    </div>

                    <!-- 已儲存條件（P3.1） -->
                    <div class="flex items-center space-x-2 bg-gradient-to-r from-slate-50 to-gray-50 dark:from-gray-800 dark:to-gray-800 rounded-xl px-4 py-2">
                        <svg class="w-4 h-4 text-slate-600 dark:text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                        </svg>
                        <select id="savedFilters" class="px-2 py-1 border rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200">
                            <option value="">已儲存條件</option>
                        </select>
                        <button type="button" id="applySavedFilter" class="px-2 py-1 text-xs rounded bg-blue-600 text-white hover:bg-blue-700">套用</button>
                        <button type="button" id="deleteSavedFilter" class="px-2 py-1 text-xs rounded bg-red-600 text-white hover:bg-red-700">刪除</button>
                        <div class="flex items-center space-x-1">
                            <input id="saveFilterName" placeholder="條件名稱" class="px-2 py-1 text-xs border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" />
                            <button type="button" id="saveCurrentFilter" class="px-2 py-1 text-xs rounded bg-emerald-600 text-white hover:bg-emerald-700">儲存</button>
                        </div>
                    </div>
                </div>
            </div>
        </form>
    </div>

        <!-- 報價列表表格 - 美化設計 -->
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <!-- 列表標題區 -->
            <div class="bg-gradient-to-r from-slate-50 via-gray-50 to-slate-100 dark:from-slate-800 dark:via-gray-800 dark:to-slate-800 px-6 py-5 border-b border-gray-200 dark:border-gray-700">
                <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0">
                    <div class="flex items-center">
                        <div class="bg-gradient-to-br from-slate-500 to-slate-600 dark:from-slate-600 dark:to-slate-700 rounded-lg p-2 mr-3">
                            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                            </svg>
                        </div>
                        <div>
                            <h3 class="text-xl font-bold text-gray-900 dark:text-white">報價單列表</h3>
                            <p class="text-sm text-gray-600 dark:text-gray-400">所有報價單的詳細資訊</p>
                        </div>
                    </div>
                    @if(isset($quotes['total']))
                        <div class="bg-white dark:bg-gray-800 rounded-xl px-4 py-2 shadow-sm">
                            <div class="flex items-center space-x-2">
                                <svg class="w-4 h-4 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                                </svg>
                                <span class="text-sm font-semibold text-slate-600 dark:text-slate-400">
                                    共 {{ $quotes['total'] }} 筆
                                </span>
                            </div>
                        </div>
                    @endif
                </div>
            </div>
        
            <!-- 表格區域 -->
            <div class="overflow-x-auto">
                <table class="w-full min-w-[1200px] divide-y divide-gray-200 dark:divide-gray-700">
                    <thead class="bg-gradient-to-r from-slate-100 to-gray-100 dark:from-slate-700 dark:to-gray-700">
                        <tr>
                            <th class="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                <div class="flex items-center space-x-1">
                                    <svg class="w-4 h-4 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"/>
                                    </svg>
                                    <span>報價編號</span>
                                </div>
                            </th>
                            <th class="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                <div class="flex items-center space-x-1">
                                    <svg class="w-4 h-4 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                                    </svg>
                                    <span>客戶名稱</span>
                                </div>
                            </th>
                            <th class="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                <div class="flex items-center space-x-1">
                                    <svg class="w-4 h-4 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                                    </svg>
                                    <span>報價日期</span>
                                </div>
                            </th>
                            <th class="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                <div class="flex items-center space-x-1">
                                    <svg class="w-4 h-4 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                    </svg>
                                    <span>有效期限</span>
                                </div>
                            </th>
                            <th class="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                <div class="flex items-center space-x-1">
                                    <svg class="w-4 h-4 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"/>
                                    </svg>
                                    <span>總金額</span>
                                </div>
                            </th>
                            <th class="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                <div class="flex items-center space-x-1">
                                    <svg class="w-4 h-4 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                    </svg>
                                    <span>狀態</span>
                                </div>
                            </th>
                            <th class="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                <div class="flex items-center space-x-1">
                                    <svg class="w-4 h-4 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"/>
                                    </svg>
                                    <span>操作</span>
                                </div>
                            </th>
                        </tr>
                    </thead>
                <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    @if(isset($quotes['quotes']) && count($quotes['quotes']) > 0)
                        @foreach($quotes['quotes'] as $quote)
                            <tr class="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 dark:hover:from-blue-900 dark:hover:to-indigo-900 transition-all duration-300 cursor-pointer transform hover:shadow-sm" 
                                data-quote-id="{{ $quote['id'] ?? '' }}"
                                title="點擊查看報價單詳細資訊">
                                <!-- 報價編號 -->
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <div class="flex items-center">
                                        <div class="bg-blue-100 dark:bg-blue-900 rounded-lg px-3 py-1">
                                            <span class="text-sm font-bold text-blue-700 dark:text-blue-300">
                                                {{ $quote['quote_number'] ?? 'QT-' . str_pad($quote['id'], 4, '0', STR_PAD_LEFT) }}
                                            </span>
                                        </div>
                                    </div>
                                </td>
                                <!-- 客戶名稱 -->
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <div class="flex items-center">
                                        <div class="bg-green-100 dark:bg-green-900 rounded-full w-8 h-8 flex items-center justify-center mr-3">
                                            <svg class="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                                            </svg>
                                        </div>
                                        <span class="text-sm font-medium text-gray-900 dark:text-white">
                                            {{ $quote['customer']['name'] ?? '未知客戶' }}
                                        </span>
                                    </div>
                                </td>
                                <!-- 報價日期 -->
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <div class="flex items-center">
                                        <svg class="w-4 h-4 text-slate-500 dark:text-slate-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                                        </svg>
                                        <span class="text-sm text-gray-900 dark:text-white">
                                            @php
                                                $quoteDate = '--';
                                                if (isset($quote['quote_date']) && !empty($quote['quote_date'])) {
                                                    try {
                                                        $quoteDate = date('Y-m-d', strtotime($quote['quote_date']));
                                                    } catch (Exception $e) {
                                                        $quoteDate = $quote['quote_date']; // 顯示原始值
                                                    }
                                                }
                                            @endphp
                                            {{ $quoteDate }}
                                        </span>
                                    </div>
                                </td>
                                <!-- 有效期限 -->
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <div class="flex items-center">
                                        <svg class="w-4 h-4 text-slate-500 dark:text-slate-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                        </svg>
                                        <span class="text-sm text-gray-900 dark:text-white">
                                            @php
                                                $validUntil = '--';
                                                if (isset($quote['valid_until']) && !empty($quote['valid_until'])) {
                                                    try {
                                                        $validUntil = date('Y-m-d', strtotime($quote['valid_until']));
                                                    } catch (Exception $e) {
                                                        $validUntil = $quote['valid_until']; // 顯示原始值
                                                    }
                                                } elseif (isset($quote['valid_until_date']) && !empty($quote['valid_until_date'])) {
                                                    try {
                                                        $validUntil = date('Y-m-d', strtotime($quote['valid_until_date']));
                                                    } catch (Exception $e) {
                                                        $validUntil = $quote['valid_until_date']; // 顯示原始值
                                                    }
                                                }
                                            @endphp
                                            {{ $validUntil }}
                                        </span>
                                    </div>
                                </td>
                                <!-- 總金額 -->
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <div class="flex items-center">
                                        <div class="bg-emerald-100 dark:bg-emerald-900 rounded-lg px-3 py-1">
                                            <span class="text-sm font-bold text-emerald-700 dark:text-emerald-300">
                                                ${{ number_format($quote['total_amount'] ?? 0, 2) }}
                                            </span>
                                        </div>
                                    </div>
                                </td>
                                <!-- 狀態 -->
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <div class="flex items-center">
                                        <span class="inline-flex items-center px-3 py-1 text-xs font-bold rounded-full shadow-sm
                                            @switch($quote['status'])
                                                @case('draft')
                                                    bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 dark:from-gray-700 dark:to-gray-600 dark:text-gray-300
                                                    @break
                                                @case('sent')
                                                @case('pending')
                                                    bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 dark:from-blue-700 dark:to-blue-600 dark:text-blue-300
                                                    @break
                                                @case('approved')
                                                @case('accepted')
                                                    bg-gradient-to-r from-green-100 to-green-200 text-green-800 dark:from-green-700 dark:to-green-600 dark:text-green-300
                                                    @break
                                                @case('rejected')
                                                    bg-gradient-to-r from-red-100 to-red-200 text-red-800 dark:from-red-700 dark:to-red-600 dark:text-red-300
                                                    @break
                                                @case('expired')
                                                    bg-gradient-to-r from-orange-100 to-orange-200 text-orange-800 dark:from-orange-700 dark:to-orange-600 dark:text-orange-300
                                                    @break
                                                @case('converted')
                                                    bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 dark:from-purple-700 dark:to-purple-600 dark:text-purple-300
                                                    @break
                                                @default
                                                    bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 dark:from-gray-700 dark:to-gray-600 dark:text-gray-300
                                            @endswitch">
                                            
                                            @php
                                                $statusLabels = [
                                                    'draft' => '草稿',
                                                    'pending' => '已發送',
                                                    'sent' => '已發送',
                                                    'approved' => '已批准',
                                                    'accepted' => '已批准',
                                                    'rejected' => '已拒絕',
                                                    'expired' => '已過期',
                                                    'converted' => '已轉換'
                                                ];
                                                $currentStatus = $quote['status'];
                                                $statusDisplay = $statusLabels[$currentStatus] ?? ucfirst($currentStatus);
                                            @endphp
                                            @switch($quote['status'])
                                                @case('draft')
                                                    <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                                                    </svg>
                                                    {{ $statusDisplay }}
                                                    @break
                                                @case('sent')
                                                @case('pending')
                                                    <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
                                                    </svg>
                                                    {{ $statusDisplay }}
                                                    @break
                                                @case('approved')
                                                @case('accepted')
                                                    <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                                                    </svg>
                                                    {{ $statusDisplay }}
                                                    @break
                                                @case('rejected')
                                                    <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                                                    </svg>
                                                    {{ $statusDisplay }}
                                                    @break
                                                @case('expired')
                                                    <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                                    </svg>
                                                    {{ $statusDisplay }}
                                                    @break
                                                @case('converted')
                                                    <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                                                    </svg>
                                                    {{ $statusDisplay }}
                                                    @break
                                                @default
                                                    <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                                    </svg>
                                                    {{ $statusDisplay }}
                                            @endswitch
                                        </span>
                                    </div>
                                </td>
                                <!-- 操作 -->
                                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <div class="flex items-center space-x-2">
                                        <!-- 檢視按鈕 -->
                                        <a href="{{ route('quotes.show', $quote['id']) }}" 
                                           class="inline-flex items-center px-3 py-1 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-xs font-medium rounded-lg transition-all duration-200 transform hover:-translate-y-0.5 hover:shadow-md"
                                           title="檢視報價單詳情">
                                            <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                                            </svg>
                                            檢視
                                        </a>
                                        <!-- 編輯按鈕 -->
                                        <a href="{{ route('quotes.edit', $quote['id']) }}" 
                                           class="inline-flex items-center px-3 py-1 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-xs font-medium rounded-lg transition-all duration-200 transform hover:-translate-y-0.5 hover:shadow-md"
                                           title="編輯報價單">
                                            <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                                            </svg>
                                            編輯
                                        </a>
                                        @if($quote['status'] === 'draft')
                                            <!-- 刪除按鈕 -->
                                            <form method="POST" action="{{ route('quotes.destroy', $quote['id']) }}" class="inline">
                                                @csrf
                                                @method('DELETE')
                                                <button type="submit" 
                                                        onclick="return confirm('確定要刪除這個報價單嗎？')"
                                                        class="inline-flex items-center px-3 py-1 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white text-xs font-medium rounded-lg transition-all duration-200 transform hover:-translate-y-0.5 hover:shadow-md"
                                                        title="刪除報價單">
                                                    <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                                                    </svg>
                                                    刪除
                                                </button>
                                            </form>
                                        @elseif($quote['status'] === 'sent')
                                            <!-- 批准按鈕 -->
                                            <form method="POST" action="{{ route('quotes.approve', $quote['id']) }}" class="inline">
                                                @csrf
                                                <button type="submit" 
                                                        onclick="return confirm('確定要批准這個報價單嗎？')"
                                                        class="inline-flex items-center px-3 py-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white text-xs font-medium rounded-lg transition-all duration-200 transform hover:-translate-y-0.5 hover:shadow-md"
                                                        title="批准報價單">
                                                    <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                                                    </svg>
                                                    批准
                                                </button>
                                            </form>
                                            <!-- 拒絕按鈕 -->
                                            <form method="POST" action="{{ route('quotes.reject', $quote['id']) }}" class="inline">
                                                @csrf
                                                <button type="submit" 
                                                        onclick="return confirm('確定要拒絕這個報價單嗎？')"
                                                        class="inline-flex items-center px-3 py-1 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white text-xs font-medium rounded-lg transition-all duration-200 transform hover:-translate-y-0.5 hover:shadow-md"
                                                        title="拒絕報價單">
                                                    <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                                                    </svg>
                                                    拒絕
                                                </button>
                                            </form>
                                        @elseif($quote['status'] === 'approved')
                                            <!-- 轉換按鈕（POST） -->
                                            <form method="POST" action="{{ route('quotes.convert', $quote['id']) }}" class="inline">
                                                @csrf
                                                <button type="submit"
                                                        onclick="return confirm('確定要將此報價單轉換為銷售訂單嗎？')"
                                                        class="inline-flex items-center px-3 py-1 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white text-xs font-medium rounded-lg transition-all duration-200 transform hover:-translate-y-0.5 hover:shadow-md"
                                                        title="轉換為銷售訂單">
                                                    <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/>
                                                    </svg>
                                                    轉換為訂單
                                                </button>
                                            </form>
                                        @endif
                                    </div>
                                </td>
                            </tr>
                        @endforeach
                    @else
                        <tr>
                            <td colspan="7" class="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                                @if(isset($quotes['quotes']))
                                    <div class="flex flex-col items-center">
                                        <svg class="w-12 h-12 mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                                        </svg>
                                        <p class="text-lg font-medium mb-2">目前沒有報價單</p>
                                        <p class="text-sm">開始建立您的第一個報價單</p>
                                        <a href="{{ route('quotes.create') }}" 
                                           class="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200">
                                            建立報價單
                                        </a>
                                    </div>
                                @else
                                    <div class="flex flex-col items-center">
                                        <svg class="w-8 h-8 animate-spin text-blue-600 mb-4" fill="none" viewBox="0 0 24 24">
                                            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" class="opacity-25"/>
                                            <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" class="opacity-75"/>
                                        </svg>
                                        <p>載入報價單資料中...</p>
                                    </div>
                                @endif
                            </td>
                        </tr>
                    @endif
                </tbody>
                </table>
            </div>

        <!-- 分頁 -->
        @if(isset($quotes['quotes']) && count($quotes['quotes']) > 0 && isset($quotes['last_page']) && $quotes['last_page'] > 1)
            <div class="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                <div class="flex items-center justify-between">
                    <div class="text-sm text-gray-700 dark:text-gray-300">
                        顯示第 {{ ($quotes['current_page'] - 1) * $quotes['per_page'] + 1 }} 到 
                        {{ min($quotes['current_page'] * $quotes['per_page'], $quotes['total']) }} 筆，
                        共 {{ $quotes['total'] }} 筆資料
                    </div>
                    
                    <div class="flex space-x-2">
                        <!-- 上一頁 -->
                        @if($quotes['current_page'] > 1)
                            <a href="{{ request()->fullUrlWithQuery(['page' => $quotes['current_page'] - 1]) }}" 
                               class="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600">
                                上一頁
                            </a>
                        @endif

                        <!-- 頁碼 -->
                        @for($i = max(1, $quotes['current_page'] - 2); $i <= min($quotes['last_page'], $quotes['current_page'] + 2); $i++)
                            <a href="{{ request()->fullUrlWithQuery(['page' => $i]) }}" 
                               class="px-3 py-2 text-sm font-medium rounded-md
                                   @if($i === $quotes['current_page'])
                                       text-white bg-blue-600 border border-blue-600
                                   @else
                                       text-gray-500 bg-white border border-gray-300 hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600
                                   @endif">
                                {{ $i }}
                            </a>
                        @endfor

                        <!-- 下一頁 -->
                        @if($quotes['current_page'] < $quotes['last_page'])
                            <a href="{{ request()->fullUrlWithQuery(['page' => $quotes['current_page'] + 1]) }}" 
                               class="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600">
                                下一頁
                            </a>
                        @endif
                    </div>
                </div>
            </div>
        @endif
    </div>

    <!-- 手機版卡片檢視 (隱藏在桌面版) -->
    <div class="block md:hidden space-y-4">
        @if(isset($quotes['quotes']) && count($quotes['quotes']) > 0)
            @foreach($quotes['quotes'] as $quote)
                <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                    <div class="flex justify-between items-start mb-3">
                        <h4 class="text-lg font-medium text-gray-900 dark:text-white">
                            {{ $quote['quote_number'] ?? 'QT-' . str_pad($quote['id'], 4, '0', STR_PAD_LEFT) }}
                        </h4>
                        <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full
                            @switch($quote['status'])
                                @case('draft')
                                    bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300
                                    @break
                                @case('sent')
                                @case('pending')
                                    bg-blue-100 text-blue-800 dark:bg-blue-700 dark:text-blue-300
                                    @break
                                @case('approved')
                                @case('accepted')
                                    bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-300
                                    @break
                                @case('rejected')
                                    bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-300
                                    @break
                                @case('expired')
                                    bg-orange-100 text-orange-800 dark:bg-orange-700 dark:text-orange-300
                                    @break
                                @case('converted')
                                    bg-purple-100 text-purple-800 dark:bg-purple-700 dark:text-purple-300
                                    @break
                                @default
                                    bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300
                            @endswitch">
                            @php
                                $statusLabels = [
                                    'draft' => '草稿',
                                    'pending' => '已發送',
                                    'sent' => '已發送',
                                    'approved' => '已批准',
                                    'accepted' => '已批准',
                                    'rejected' => '已拒絕',
                                    'expired' => '已過期',
                                    'converted' => '已轉換'
                                ];
                                $currentStatus = $quote['status'];
                                $statusDisplay = $statusLabels[$currentStatus] ?? ucfirst($currentStatus);
                            @endphp
                            {{ $statusDisplay }}
                        </span>
                    </div>
                    
                    <div class="space-y-2 text-sm">
                        <div class="flex justify-between">
                            <span class="text-gray-500 dark:text-gray-400">客戶:</span>
                            <span class="text-gray-900 dark:text-white">{{ $quote['customer']['name'] ?? '未知客戶' }}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-500 dark:text-gray-400">報價日期:</span>
                            <span class="text-gray-900 dark:text-white">{{ isset($quote['quote_date']) ? date('Y-m-d', strtotime($quote['quote_date'])) : '--' }}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-500 dark:text-gray-400">總金額:</span>
                            <span class="text-gray-900 dark:text-white font-medium">${{ number_format($quote['total_amount'] ?? 0, 2) }}</span>
                        </div>
                    </div>
                    
                    <div class="flex space-x-2 mt-4">
                        <a href="{{ route('quotes.show', $quote['id']) }}" 
                           class="flex-1 text-center bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm font-medium">
                            檢視
                        </a>
                        <a href="{{ route('quotes.edit', $quote['id']) }}" 
                           class="flex-1 text-center bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-2 rounded text-sm font-medium">
                            編輯
                        </a>
                    </div>
                </div>
            @endforeach
            
            <!-- 手機版分頁控制項 -->
            @if(isset($quotes['last_page']) && $quotes['last_page'] > 1)
                <div class="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                    <div class="flex flex-col items-center space-y-3">
                        <!-- 手機版分頁信息 -->
                        <div class="text-sm text-gray-700 dark:text-gray-300 text-center">
                            顯示第 {{ ($quotes['current_page'] - 1) * $quotes['per_page'] + 1 }} 到 
                            {{ min($quotes['current_page'] * $quotes['per_page'], $quotes['total']) }} 筆，
                            共 {{ $quotes['total'] }} 筆資料
                        </div>
                        
                        <!-- 手機版分頁按鈕 -->
                        <div class="flex items-center justify-center space-x-2 w-full">
                            <!-- 上一頁 -->
                            @if($quotes['current_page'] > 1)
                                <a href="{{ request()->fullUrlWithQuery(['page' => $quotes['current_page'] - 1]) }}" 
                                   class="flex-1 max-w-24 px-4 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600 text-center">
                                    上一頁
                                </a>
                            @else
                                <div class="flex-1 max-w-24"></div>
                            @endif

                            <!-- 頁碼指示器 -->
                            <div class="flex items-center space-x-1">
                                @for($i = max(1, $quotes['current_page'] - 1); $i <= min($quotes['last_page'], $quotes['current_page'] + 1); $i++)
                                    <a href="{{ request()->fullUrlWithQuery(['page' => $i]) }}" 
                                       class="w-10 h-10 flex items-center justify-center text-sm font-medium rounded-lg
                                           @if($i === $quotes['current_page'])
                                               text-white bg-blue-600 border border-blue-600
                                           @else
                                               text-gray-500 bg-white border border-gray-300 hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600
                                           @endif">
                                        {{ $i }}
                                    </a>
                                @endfor
                            </div>

                            <!-- 下一頁 -->
                            @if($quotes['current_page'] < $quotes['last_page'])
                                <a href="{{ request()->fullUrlWithQuery(['page' => $quotes['current_page'] + 1]) }}" 
                                   class="flex-1 max-w-24 px-4 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600 text-center">
                                    下一頁
                                </a>
                            @else
                                <div class="flex-1 max-w-24"></div>
                            @endif
                        </div>
                    </div>
                </div>
            @endif
        @endif
        </div>
    </div>
</div>

<!-- 顯示成功或錯誤訊息 -->
@if(session('success'))
    <div class="fixed top-20 md:top-6 right-4 bg-green-500 text-white p-4 rounded-lg shadow-lg z-[10000]" id="successAlert">
        {{ session('success') }}
    </div>
@endif

@if(session('error'))
    <div class="fixed top-20 md:top-6 right-4 bg-red-500 text-white p-4 rounded-lg shadow-lg z-[10000]" id="errorAlert">
        {{ session('error') }}
    </div>
@endif

<script>
document.addEventListener('DOMContentLoaded', function() {
    // 自動隱藏提示訊息
    setTimeout(function() {
        const alerts = document.querySelectorAll('#successAlert, #errorAlert');
        alerts.forEach(alert => {
            if (alert) {
                alert.style.opacity = '0';
                setTimeout(() => alert.remove(), 300);
            }
        });
    }, 10000);
    
    // **即時搜尋功能**: 減少伺服器請求次數
    let searchTimeout;
    const searchInput = document.getElementById('search');
    const searchForm = document.getElementById('searchForm');
    
    if (searchInput && searchForm) {
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(function() {
                if (searchInput.value.length === 0 || searchInput.value.length >= 2) {
                    searchForm.submit();
                }
            }, 800); // 等待 800ms 後執行搜尋
        });
    }
    
    // **鍵盤快捷鍵支援**
    document.addEventListener('keydown', function(e) {
        // Ctrl+F 或 Cmd+F 聚焦到搜尋框
        if ((e.ctrlKey || e.metaKey) && e.key === 'f' && !e.shiftKey) {
            e.preventDefault();
            if (searchInput) {
                searchInput.focus();
                searchInput.select();
            }
        }
        
        // Ctrl+N 或 Cmd+N 建立新報價單
        if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
            e.preventDefault();
            const createButton = document.querySelector('a[href*="quotes/create"]');
            if (createButton) {
                window.location.href = createButton.href;
            }
        }
    });
    
    // **表格行點擊功能**: 點擊行可直接進入詳細頁面
    const tableRows = document.querySelectorAll('tbody tr[data-quote-id]');
    tableRows.forEach(row => {
        row.style.cursor = 'pointer';
        row.addEventListener('click', function(e) {
            // 避免點擊操作按鈕時觸發行點擊
            if (!e.target.closest('a') && !e.target.closest('button') && !e.target.closest('form')) {
                const quoteId = this.dataset.quoteId;
                if (quoteId) {
                    window.location.href = '/quotes/' + quoteId;
                }
            }
        });
    });
    
    // **狀態篩選快捷按鈕**
    const statusFilter = document.getElementById('status');
    if (statusFilter) {
        // 建立快捷按鈕組
        const quickFilters = document.createElement('div');
        quickFilters.className = 'flex flex-wrap gap-2 mt-3';
        quickFilters.innerHTML = `
            <button type="button" class="px-3 py-1 text-xs rounded-full border transition-colors status-filter" data-status="">
                全部
            </button>
            <button type="button" class="px-3 py-1 text-xs rounded-full border transition-colors status-filter" data-status="draft">
                草稿
            </button>
            <button type="button" class="px-3 py-1 text-xs rounded-full border transition-colors status-filter" data-status="pending">
                已發送
            </button>
            <button type="button" class="px-3 py-1 text-xs rounded-full border transition-colors status-filter" data-status="approved">
                已批准
            </button>
            <button type="button" class="px-3 py-1 text-xs rounded-full border transition-colors status-filter" data-status="rejected">
                已拒絕
            </button>
            <button type="button" class="px-3 py-1 text-xs rounded-full border transition-colors status-filter" data-status="converted">
                已轉換
            </button>
        `;
        
        // 插入到狀態選擇框後面
        statusFilter.parentNode.insertBefore(quickFilters, statusFilter.nextSibling);
        
        // 添加點擊事件
        quickFilters.querySelectorAll('.status-filter').forEach(button => {
            const status = button.dataset.status;
            
            // 設置初始樣式
            if (status === (new URLSearchParams(window.location.search).get('status') || '')) {
                button.classList.add('bg-blue-500', 'text-white', 'border-blue-500');
            } else {
                button.classList.add('bg-white', 'text-gray-700', 'border-gray-300', 'hover:bg-gray-50');
                button.classList.add('dark:bg-gray-700', 'dark:text-gray-300', 'dark:border-gray-600', 'dark:hover:bg-gray-600');
            }
            
            button.addEventListener('click', function() {
                statusFilter.value = status;
                searchForm.submit();
            });
        });
    }

    // 快速條件徽章（預設置頂，最多 3 筆）
    try {
        const container = document.createElement('div');
        container.className = 'flex flex-wrap gap-2 mt-2';
        const map = getSaved();
        fetch('/api/quotes/filter-presets').then(r=>r.json()).then(json=>{
            const list = (json.data||[]);
            list.sort((a,b)=> (b.is_default?1:0)-(a.is_default?1:0) || a.name.localeCompare(b.name));
            const picked = list.slice(0,3);
            picked.forEach(p=>{
                const name = p.name; const cfg = p.filters || map[name];
                const badge = document.createElement('button');
                badge.type = 'button';
                badge.className = 'px-2 py-1 text-xs rounded-full border bg-white hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200';
                badge.innerHTML = (p.is_default? '⭐ ':'') + name;
                badge.addEventListener('click', ()=> applyToForm(cfg));
                container.appendChild(badge);
            });
            if (picked.length>0) statusFilter?.parentNode?.appendChild(container);
        }).catch(()=>{
            const names = Object.keys(map).slice(0,3);
            names.forEach(n=>{
                const badge = document.createElement('button');
                badge.type = 'button';
                badge.className = 'px-2 py-1 text-xs rounded-full border bg-white hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200';
                badge.textContent = n;
                badge.addEventListener('click', ()=> applyToForm(map[n]));
                container.appendChild(badge);
            });
            if (names.length>0) statusFilter?.parentNode?.appendChild(container);
        });
    } catch(e) {}
    
    // **載入狀態指示器**
    const form = document.getElementById('searchForm');
    if (form) {
        form.addEventListener('submit', function() {
            // 顯示載入指示器
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) {
                const originalText = submitBtn.innerHTML;
                submitBtn.innerHTML = '<svg class="w-4 h-4 animate-spin inline mr-2" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" class="opacity-25"/><path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" class="opacity-75"/></svg>搜尋中...';
                submitBtn.disabled = true;
                
                // 2秒後恢復（防止卡住）
                setTimeout(() => {
                    submitBtn.innerHTML = originalText;
                    submitBtn.disabled = false;
                }, 2000);
            }
        });
    }

    // P3.1 已儲存條件（localStorage）
    const STORAGE_KEY = 'nexus_quotes_saved_filters';
    const savedSelect = document.getElementById('savedFilters');
    const applyBtn = document.getElementById('applySavedFilter');
    const delBtn = document.getElementById('deleteSavedFilter');
    const saveBtn = document.getElementById('saveCurrentFilter');
    const nameInput = document.getElementById('saveFilterName');
    function getSaved() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch(e){ return {}; } }
    function setSaved(data){ localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }
    function refreshSavedOptions(){
        if (!savedSelect) return;
        const data = getSaved();
        savedSelect.innerHTML = '<option value="">已儲存條件</option>' + Object.keys(data).map(k=>`<option value="${k}">${k}</option>`).join('');
    }
    function collectForm(){
        return {
            search: document.getElementById('search')?.value || '',
            status: document.getElementById('status')?.value || '',
            date_from: document.getElementById('date_from')?.value || '',
            date_to: document.getElementById('date_to')?.value || '',
            per_page: document.getElementById('per_page')?.value || '',
            sort: document.getElementById('sort')?.value || ''
        };
    }
    function applyToForm(cfg){
        if (!cfg) return;
        const set = (id,val)=>{ const el=document.getElementById(id); if(el){ el.value = val || ''; } };
        set('search', cfg.search); set('status', cfg.status); set('date_from', cfg.date_from); set('date_to', cfg.date_to); set('per_page', cfg.per_page); set('sort', cfg.sort);
        if (form) form.submit();
    }
    if (saveBtn) saveBtn.addEventListener('click', async ()=>{
        const name = (nameInput?.value || '').trim();
        if (!name) { alert('請輸入條件名稱'); return; }
        const cfg = collectForm();
        // 先存 local
        const data = getSaved(); data[name] = cfg; setSaved(data);
        // 再呼叫後端保存
        try {
            await fetch('/api/quotes/filter-presets', { method:'POST', headers:{'Content-Type':'application/json','X-CSRF-TOKEN':document.querySelector('meta[name="csrf-token"]').getAttribute('content')}, body: JSON.stringify({ name, filters: cfg, is_default: false }) });
        } catch(e) { /* ignore */ }
        nameInput.value = '';
        refreshSavedOptions();
    });
    if (applyBtn) applyBtn.addEventListener('click', async ()=>{
        const key = savedSelect?.value || '';
        let cfg = getSaved()[key];
        if (!cfg) {
            // 從後端載入（一次性同步全部）
            try {
                const res = await fetch('/api/quotes/filter-presets', { credentials:'same-origin' });
                const json = await res.json();
                const map = {}; (json.data||[]).forEach(p=>{ map[p.name]=p.filters; });
                setSaved(map); cfg = map[key];
            } catch(e){ /* ignore */ }
        }
        applyToForm(cfg);
    });
    if (delBtn) delBtn.addEventListener('click', async ()=>{
        const key = savedSelect?.value || '';
        if (!key) return;
        const data = getSaved();
        delete data[key];
        setSaved(data);
        // 嘗試通知後端刪除（需先查到 id，簡化：用名稱匹配）
        try {
            const res = await fetch('/api/quotes/filter-presets');
            const json = await res.json();
            const item = (json.data||[]).find(p=>p.name===key);
            if (item) await fetch(`/api/quotes/filter-presets/${item.id}`, { method:'DELETE', headers:{'X-CSRF-TOKEN':document.querySelector('meta[name="csrf-token"]').getAttribute('content')} });
        } catch(e){ /* ignore */ }
        refreshSavedOptions();
    });
    refreshSavedOptions();
});
</script>

@endsection