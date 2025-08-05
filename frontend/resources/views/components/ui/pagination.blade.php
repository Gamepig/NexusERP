{{--
  NexusERP Pagination Component - 企業級分頁導航組件系統
  
  使用範例：
  <x-ui.pagination :paginator="$products" />
  <x-ui.pagination :paginator="$orders" size="lg" />
  <x-ui.pagination :paginator="$customers" :simple="true" />
  <x-ui.pagination :paginator="$invoices" show-results />
--}}

@props([
    'paginator',
    'simple' => false,           // 簡化模式（只顯示上一頁/下一頁）
    'size' => 'md',             // sm, md, lg
    'showResults' => true,       // 顯示結果統計
    'showPerPage' => false,      // 顯示每頁數量選擇器
    'perPageOptions' => [10, 25, 50, 100],
    'maxLinks' => 7,            // 最大顯示的頁碼連結數量
    'responsive' => true,        // 響應式設計
    'showFirstLast' => true,     // 顯示第一頁/最後一頁按鈕
    'showNumbers' => true,       // 顯示頁碼
    'compact' => false,          // 緊湊模式
])

@php
    // 檢查是否有分頁資料
    if (!$paginator || !method_exists($paginator, 'hasPages') || !$paginator->hasPages()) {
        // 如果沒有分頁資料或只有一頁，則不顯示分頁組件
        $shouldRender = false;
    } else {
        $shouldRender = true;
    }
    
    // 尺寸樣式對應
    $sizeClasses = [
        'sm' => [
            'button' => 'px-nexus-2 py-nexus-1 text-nexus-xs rounded-nexus-sm min-h-[28px]',
            'text' => 'text-nexus-xs',
            'gap' => 'space-x-nexus-1',
        ],
        'md' => [
            'button' => 'px-nexus-3 py-nexus-2 text-nexus-sm rounded-nexus-md min-h-[36px]',
            'text' => 'text-nexus-sm',
            'gap' => 'space-x-nexus-2',
        ],
        'lg' => [
            'button' => 'px-nexus-4 py-nexus-2.5 text-nexus-base rounded-nexus-md min-h-[44px]',
            'text' => 'text-nexus-base',
            'gap' => 'space-x-nexus-3',
        ],
    ];
    
    $currentSize = $sizeClasses[$size];
    
    // 基礎按鈕樣式
    $baseButtonClasses = 'relative inline-flex items-center border border-nexus-primary bg-nexus-surface-primary text-nexus-text-secondary hover:bg-nexus-secondary focus:outline-none focus:ring-2 focus:ring-nexus-primary-500 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed nexus-transition-fast';
    
    // 當前頁面按鈕樣式
    $activeButtonClasses = 'relative inline-flex items-center border border-nexus-primary-500 bg-nexus-primary-50 text-nexus-primary-700 font-nexus-semibold z-10';
    
    // 計算顯示的頁碼範圍
    if ($shouldRender && $showNumbers && !$simple) {
        $currentPage = $paginator->currentPage();
        $lastPage = $paginator->lastPage();
        
        // 計算起始和結束頁碼
        if ($lastPage <= $maxLinks) {
            $startPage = 1;
            $endPage = $lastPage;
        } else {
            $halfLinks = floor($maxLinks / 2);
            
            if ($currentPage <= $halfLinks) {
                $startPage = 1;
                $endPage = $maxLinks;
            } elseif ($currentPage >= $lastPage - $halfLinks) {
                $startPage = $lastPage - $maxLinks + 1;
                $endPage = $lastPage;
            } else {
                $startPage = $currentPage - $halfLinks;
                $endPage = $currentPage + $halfLinks;
            }
        }
    }
@endphp

@if($shouldRender)
<nav class="nexus-pagination" 
     role="navigation" 
     aria-label="分頁導航"
     x-data="nexusPagination()">
    
    {{-- 完整版分頁 --}}
    @if(!$simple)
        <div class="flex flex-col {{ $compact ? 'space-y-nexus-2' : 'space-y-nexus-4' }}">
            
            {{-- 頂部資訊區域 --}}
            @if($showResults || $showPerPage)
                <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between {{ $compact ? 'space-y-nexus-1' : 'space-y-nexus-2' }} sm:space-y-0">
                    
                    {{-- 結果統計 --}}
                    @if($showResults)
                        <div class="flex items-center">
                            <p class="{{ $currentSize['text'] }} text-nexus-text-secondary">
                                顯示第
                                <span class="font-nexus-semibold text-nexus-text-primary">{{ $paginator->firstItem() ?: 0 }}</span>
                                到
                                <span class="font-nexus-semibold text-nexus-text-primary">{{ $paginator->lastItem() ?: 0 }}</span>
                                筆，共
                                <span class="font-nexus-semibold text-nexus-text-primary">{{ $paginator->total() }}</span>
                                筆結果
                            </p>
                        </div>
                    @endif
                    
                    {{-- 每頁數量選擇器 --}}
                    @if($showPerPage)
                        <div class="flex items-center {{ $currentSize['gap'] }}">
                            <label for="perPage" class="{{ $currentSize['text'] }} text-nexus-text-secondary">
                                每頁顯示：
                            </label>
                            <select id="perPage" 
                                    name="perPage"
                                    @change="changePerPage($event.target.value)"
                                    class="{{ $currentSize['button'] }} border-nexus-primary focus:ring-nexus-primary-500 focus:border-nexus-primary-500 bg-nexus-surface-primary text-nexus-text-primary">
                                @foreach($perPageOptions as $option)
                                    <option value="{{ $option }}" 
                                            @if(request('per_page', 25) == $option) selected @endif>
                                        {{ $option }}
                                    </option>
                                @endforeach
                            </select>
                        </div>
                    @endif
                </div>
            @endif
            
            {{-- 分頁按鈕區域 --}}
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between {{ $compact ? 'space-y-nexus-2' : 'space-y-nexus-3' }} sm:space-y-0">
                
                {{-- 桌面版分頁按鈕 --}}
                <div class="{{ $responsive ? 'hidden sm:flex' : 'flex' }} items-center {{ $currentSize['gap'] }}">
                    <span class="isolate inline-flex rounded-nexus-md shadow-nexus-sm -space-x-px">
                        
                        {{-- 第一頁按鈕 --}}
                        @if($showFirstLast && $paginator->currentPage() > 1)
                            <a href="{{ $paginator->url(1) }}" 
                               class="{{ $baseButtonClasses }} {{ $currentSize['button'] }} rounded-l-nexus-md"
                               aria-label="第一頁">
                                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                                </svg>
                            </a>
                        @endif
                        
                        {{-- 上一頁按鈕 --}}
                        @if($paginator->onFirstPage())
                            <span class="{{ $baseButtonClasses }} {{ $currentSize['button'] }} {{ !$showFirstLast ? 'rounded-l-nexus-md' : '' }} cursor-not-allowed opacity-50">
                                <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
                                </svg>
                                <span class="sr-only">上一頁</span>
                            </span>
                        @else
                            <a href="{{ $paginator->previousPageUrl() }}" 
                               class="{{ $baseButtonClasses }} {{ $currentSize['button'] }} {{ !$showFirstLast ? 'rounded-l-nexus-md' : '' }}"
                               aria-label="上一頁">
                                <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
                                </svg>
                                <span class="sr-only">上一頁</span>
                            </a>
                        @endif

                        {{-- 頁碼按鈕 --}}
                        @if($showNumbers)
                            {{-- 第一頁省略號 --}}
                            @if($startPage > 1)
                                @if($startPage > 2)
                                    <span class="{{ $baseButtonClasses }} {{ $currentSize['button'] }} cursor-default">
                                        <span class="text-nexus-text-tertiary">⋯</span>
                                    </span>
                                @endif
                            @endif
                            
                            {{-- 頁碼 --}}
                            @for($page = $startPage; $page <= $endPage; $page++)
                                @if($page == $paginator->currentPage())
                                    <span class="{{ $activeButtonClasses }} {{ $currentSize['button'] }}"
                                          aria-current="page"
                                          aria-label="目前頁面，第 {{ $page }} 頁">
                                        {{ $page }}
                                    </span>
                                @else
                                    <a href="{{ $paginator->url($page) }}" 
                                       class="{{ $baseButtonClasses }} {{ $currentSize['button'] }}"
                                       aria-label="前往第 {{ $page }} 頁">
                                        {{ $page }}
                                    </a>
                                @endif
                            @endfor
                            
                            {{-- 最後頁省略號 --}}
                            @if($endPage < $paginator->lastPage())
                                @if($endPage < $paginator->lastPage() - 1)
                                    <span class="{{ $baseButtonClasses }} {{ $currentSize['button'] }} cursor-default">
                                        <span class="text-nexus-text-tertiary">⋯</span>
                                    </span>
                                @endif
                            @endif
                        @endif

                        {{-- 下一頁按鈕 --}}
                        @if($paginator->hasMorePages())
                            <a href="{{ $paginator->nextPageUrl() }}" 
                               class="{{ $baseButtonClasses }} {{ $currentSize['button'] }} {{ !$showFirstLast ? 'rounded-r-nexus-md' : '' }}"
                               aria-label="下一頁">
                                <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                                </svg>
                                <span class="sr-only">下一頁</span>
                            </a>
                        @else
                            <span class="{{ $baseButtonClasses }} {{ $currentSize['button'] }} {{ !$showFirstLast ? 'rounded-r-nexus-md' : '' }} cursor-not-allowed opacity-50">
                                <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                                </svg>
                                <span class="sr-only">下一頁</span>
                            </span>
                        @endif
                        
                        {{-- 最後頁按鈕 --}}
                        @if($showFirstLast && $paginator->currentPage() < $paginator->lastPage())
                            <a href="{{ $paginator->url($paginator->lastPage()) }}" 
                               class="{{ $baseButtonClasses }} {{ $currentSize['button'] }} rounded-r-nexus-md"
                               aria-label="最後頁">
                                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                                </svg>
                            </a>
                        @endif
                    </span>
                </div>
                
                {{-- 頁面跳轉 --}}
                @if(!$compact)
                    <div class="flex items-center {{ $currentSize['gap'] }}">
                        <label for="gotoPage" class="{{ $currentSize['text'] }} text-nexus-text-secondary">
                            跳至第
                        </label>
                        <input type="number" 
                               id="gotoPage"
                               min="1" 
                               max="{{ $paginator->lastPage() }}"
                               placeholder="{{ $paginator->currentPage() }}"
                               @keyup.enter="gotoPage($event.target.value)"
                               class="{{ $currentSize['button'] }} border-nexus-primary focus:ring-nexus-primary-500 focus:border-nexus-primary-500 bg-nexus-surface-primary text-nexus-text-primary w-16 text-center">
                        <span class="{{ $currentSize['text'] }} text-nexus-text-secondary">頁</span>
                        <button type="button"
                                @click="gotoPage(document.getElementById('gotoPage').value)"
                                class="{{ $baseButtonClasses }} {{ $currentSize['button'] }} rounded-nexus-md">
                            跳轉
                        </button>
                    </div>
                @endif
            </div>
            
            {{-- 行動版簡化分頁 --}}
            @if($responsive)
                <div class="flex justify-between sm:hidden">
                    @if($paginator->onFirstPage())
                        <span class="{{ $baseButtonClasses }} {{ $currentSize['button'] }} rounded-nexus-md cursor-not-allowed opacity-50">
                            上一頁
                        </span>
                    @else
                        <a href="{{ $paginator->previousPageUrl() }}" 
                           class="{{ $baseButtonClasses }} {{ $currentSize['button'] }} rounded-nexus-md">
                            上一頁
                        </a>
                    @endif

                    <span class="{{ $currentSize['text'] }} text-nexus-text-secondary flex items-center">
                        第 {{ $paginator->currentPage() }} 頁，共 {{ $paginator->lastPage() }} 頁
                    </span>

                    @if($paginator->hasMorePages())
                        <a href="{{ $paginator->nextPageUrl() }}" 
                           class="{{ $baseButtonClasses }} {{ $currentSize['button'] }} rounded-nexus-md">
                            下一頁
                        </a>
                    @else
                        <span class="{{ $baseButtonClasses }} {{ $currentSize['button'] }} rounded-nexus-md cursor-not-allowed opacity-50">
                            下一頁
                        </span>
                    @endif
                </div>
            @endif
        </div>
    
    {{-- 簡化版分頁 --}}
    @else
        <div class="flex justify-between items-center">
            @if($paginator->onFirstPage())
                <span class="{{ $baseButtonClasses }} {{ $currentSize['button'] }} rounded-nexus-md cursor-not-allowed opacity-50">
                    上一頁
                </span>
            @else
                <a href="{{ $paginator->previousPageUrl() }}" 
                   class="{{ $baseButtonClasses }} {{ $currentSize['button'] }} rounded-nexus-md">
                    上一頁
                </a>
            @endif

            @if($showResults)
                <span class="{{ $currentSize['text'] }} text-nexus-text-secondary">
                    第 {{ $paginator->currentPage() }} 頁，共 {{ $paginator->lastPage() }} 頁
                </span>
            @endif

            @if($paginator->hasMorePages())
                <a href="{{ $paginator->nextPageUrl() }}" 
                   class="{{ $baseButtonClasses }} {{ $currentSize['button'] }} rounded-nexus-md">
                    下一頁
                </a>
            @else
                <span class="{{ $baseButtonClasses }} {{ $currentSize['button'] }} rounded-nexus-md cursor-not-allowed opacity-50">
                    下一頁
                </span>
            @endif
        </div>
    @endif
</nav>
@endif

{{-- Alpine.js 功能增強 --}}
@once
@push('scripts')
<script>
    function nexusPagination() {
        return {
            gotoPage(page) {
                page = parseInt(page);
                if (isNaN(page) || page < 1) return;
                
                const currentUrl = new URL(window.location.href);
                currentUrl.searchParams.set('page', page);
                window.location.href = currentUrl.toString();
            },
            
            changePerPage(perPage) {
                const currentUrl = new URL(window.location.href);
                currentUrl.searchParams.set('per_page', perPage);
                currentUrl.searchParams.delete('page'); // 重置到第一頁
                window.location.href = currentUrl.toString();
            }
        }
    }
    
    // 鍵盤導航支援
    document.addEventListener('keydown', function(e) {
        // 如果焦點在輸入框或其他表單元素上，不處理快捷鍵
        if (e.target.matches('input, textarea, select')) return;
        
        // 左箭頭：上一頁
        if (e.key === 'ArrowLeft' && e.ctrlKey) {
            e.preventDefault();
            const prevLink = document.querySelector('.nexus-pagination a[aria-label="上一頁"]');
            if (prevLink) prevLink.click();
        }
        
        // 右箭頭：下一頁
        if (e.key === 'ArrowRight' && e.ctrlKey) {
            e.preventDefault();
            const nextLink = document.querySelector('.nexus-pagination a[aria-label="下一頁"]');
            if (nextLink) nextLink.click();
        }
        
        // Home：第一頁
        if (e.key === 'Home' && e.ctrlKey) {
            e.preventDefault();
            const firstLink = document.querySelector('.nexus-pagination a[aria-label="第一頁"]');
            if (firstLink) firstLink.click();
        }
        
        // End：最後頁
        if (e.key === 'End' && e.ctrlKey) {
            e.preventDefault();
            const lastLink = document.querySelector('.nexus-pagination a[aria-label="最後頁"]');
            if (lastLink) lastLink.click();
        }
    });
</script>
@endpush
@endonce

{{-- 組件樣式 --}}
@once
@push('styles')
<style>
    /* 分頁組件基礎樣式 */
    .nexus-pagination {
        font-feature-settings: 'tnum';
    }
    
    /* 分頁按鈕懸停效果 */
    .nexus-pagination a:hover {
        background-color: var(--nexus-bg-secondary);
        border-color: var(--nexus-border-secondary);
    }
    
    /* 當前頁面按鈕樣式增強 */
    .nexus-pagination [aria-current="page"] {
        background-color: var(--nexus-primary-50);
        border-color: var(--nexus-primary-500);
        color: var(--nexus-primary-700);
        font-weight: var(--nexus-font-semibold);
    }
    
    /* 省略號樣式 */
    .nexus-pagination .cursor-default {
        pointer-events: none;
        user-select: none;
    }
    
    /* 頁面跳轉輸入框樣式 */
    .nexus-pagination input[type="number"] {
        -moz-appearance: textfield;
    }
    
    .nexus-pagination input[type="number"]::-webkit-outer-spin-button,
    .nexus-pagination input[type="number"]::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
    }
    
    /* 每頁數量選擇器樣式 */
    .nexus-pagination select {
        appearance: none;
        background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
        background-position: right 0.5rem center;
        background-repeat: no-repeat;
        background-size: 1.5em 1.5em;
        padding-right: 2.5rem;
    }
    
    /* 響應式設計增強 */
    @media (max-width: 640px) {
        .nexus-pagination .isolate {
            font-size: 0.875rem;
        }
        
        .nexus-pagination .space-x-px > * + * {
            margin-left: 1px;
        }
    }
    
    /* 高對比度模式支援 */
    @media (prefers-contrast: high) {
        .nexus-pagination a,
        .nexus-pagination button,
        .nexus-pagination span {
            border-width: 2px;
        }
        
        .nexus-pagination [aria-current="page"] {
            background-color: var(--nexus-primary-600);
            color: white;
        }
    }
    
    /* 暗色主題特殊處理 */
    [data-theme="dark"] .nexus-pagination select {
        background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%9ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
    }
    
    /* 焦點環增強 */
    .nexus-pagination a:focus,
    .nexus-pagination button:focus,
    .nexus-pagination input:focus,
    .nexus-pagination select:focus {
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }
    
    /* 載入狀態 */
    .nexus-pagination.loading {
        pointer-events: none;
        opacity: 0.6;
    }
    
    .nexus-pagination.loading::after {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        width: 20px;
        height: 20px;
        margin: -10px 0 0 -10px;
        border: 2px solid var(--nexus-primary-500);
        border-radius: 50%;
        border-top-color: transparent;
        animation: spin 1s linear infinite;
    }
</style>
@endpush
@endonce