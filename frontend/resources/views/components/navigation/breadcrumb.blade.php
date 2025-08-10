{{-- 簡易麵包屑組件 --}}
@props(['items' => []])

@if(!empty($items))
<nav aria-label="麵包屑" class="mb-4">
  <ol class="flex items-center space-x-2 text-sm">
    @foreach($items as $i => $item)
      @if($i > 0)
        <li class="text-gray-400">/</li>
      @endif
      <li>
        @if(!empty($item['url']) && empty($item['active']))
          <a href="{{ $item['url'] }}" class="hover:underline" style="color: var(--nexus-text-secondary)">{{ $item['label'] }}</a>
        @else
          <span class="nexus-breadcrumb-indicator">{{ $item['label'] ?? '' }}</span>
        @endif
      </li>
    @endforeach
  </ol>
@endif

{{--
    麵包屑導航組件
    動態生成基於路由的導航路徑
--}}

@php
    use App\Services\NavigationService;
    
    $navigationService = app(NavigationService::class);
    $currentRoute = request()->route();
    $routeName = $currentRoute ? $currentRoute->getName() : '';
    
    // 生成麵包屑路徑
    $breadcrumbs = $navigationService->generateBreadcrumbs($routeName, request());
@endphp

@if(false)
<nav aria-label="麵包屑導航" 
     class="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <ol class="nexus-breadcrumb-list" 
            itemscope 
            itemtype="https://schema.org/BreadcrumbList">
            
            @foreach($breadcrumbs as $index => $crumb)
                <li class="nexus-breadcrumb-item {{ $loop->last ? 'active' : '' }}"
                    itemprop="itemListElement" 
                    itemscope 
                    itemtype="https://schema.org/ListItem">
                    
                    @if(!$loop->last && $crumb['url'])
                        <a href="{{ $crumb['url'] }}" 
                           class="nexus-breadcrumb-link"
                           itemprop="item"
                           aria-label="前往 {{ $crumb['title'] }}">
                            
                            @if($loop->first && isset($crumb['icon']))
                                <span class="nexus-breadcrumb-icon mr-1">
                                    {!! $crumb['icon'] !!}
                                </span>
                            @endif
                            
                            <span itemprop="name">{{ $crumb['title'] }}</span>
                            <meta itemprop="position" content="{{ $index + 1 }}">
                        </a>
                    @else
                        <span class="nexus-breadcrumb-current"
                              itemprop="item">
                            
                            @if($loop->first && isset($crumb['icon']))
                                <span class="nexus-breadcrumb-icon mr-1">
                                    {!! $crumb['icon'] !!}
                                </span>
                            @endif
                            
                            <span itemprop="name">{{ $crumb['title'] }}</span>
                            <meta itemprop="position" content="{{ $index + 1 }}">
                        </span>
                    @endif
                    
                    @if(!$loop->last)
                        <span class="nexus-breadcrumb-separator" aria-hidden="true">
                            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 111.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"></path>
                            </svg>
                        </span>
                    @endif
                </li>
            @endforeach
        </ol>
        
        <!-- 額外操作按鈕 -->
        @if(count($breadcrumbs) > 2)
        <div class="nexus-breadcrumb-actions">
            <button type="button" 
                    class="nexus-breadcrumb-back-btn"
                    onclick="history.back()"
                    title="返回上一頁"
                    aria-label="返回上一頁">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                </svg>
                <span class="hidden sm:inline ml-1">返回</span>
            </button>
        </div>
        @endif
    </div>
</nav>
@endif

@push('styles')
<style>
/* 麵包屑容器 */
.nexus-breadcrumb-container {
    @apply bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700;
    background-color: var(--nexus-nav-breadcrumb-bg, rgb(249 250 251));
    border-color: var(--nexus-border-secondary);
}

/* 麵包屑列表 */
.nexus-breadcrumb-list {
    @apply flex items-center space-x-2 text-sm flex-wrap;
}

/* 麵包屑項目 */
.nexus-breadcrumb-item {
    @apply flex items-center;
}

/* 麵包屑連結 */
.nexus-breadcrumb-link {
    @apply flex items-center px-2 py-1 rounded-md transition-all duration-200;
    @apply text-gray-600 dark:text-gray-400;
    @apply hover:text-gray-900 dark:hover:text-gray-100;
    @apply hover:bg-gray-100 dark:hover:bg-gray-700;
    color: var(--nexus-text-secondary);
}

.nexus-breadcrumb-link:hover {
    color: var(--nexus-text-primary);
    background-color: var(--nexus-nav-item-hover-bg);
}

/* 當前頁面 */
.nexus-breadcrumb-current {
    @apply flex items-center px-2 py-1 font-medium;
    @apply text-gray-900 dark:text-gray-100;
    color: var(--nexus-text-primary);
}

/* 圖標 */
.nexus-breadcrumb-icon {
    @apply flex-shrink-0;
}

.nexus-breadcrumb-icon svg {
    @apply w-4 h-4;
}

/* 分隔符 */
.nexus-breadcrumb-separator {
    @apply flex items-center text-gray-400 dark:text-gray-500 mx-1;
    color: var(--nexus-text-muted);
}

/* 操作按鈕 */
.nexus-breadcrumb-actions {
    @apply mt-2 flex items-center;
}

.nexus-breadcrumb-back-btn {
    @apply inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md;
    @apply text-gray-600 dark:text-gray-400;
    @apply hover:text-gray-900 dark:hover:text-gray-100;
    @apply hover:bg-gray-100 dark:hover:bg-gray-700;
    @apply transition-all duration-200;
    color: var(--nexus-text-secondary);
}

.nexus-breadcrumb-back-btn:hover {
    color: var(--nexus-text-primary);
    background-color: var(--nexus-nav-item-hover-bg);
}

/* 響應式設計 */
@media (max-width: 640px) {
    .nexus-breadcrumb-list {
        @apply text-xs;
    }
    
    .nexus-breadcrumb-link,
    .nexus-breadcrumb-current {
        @apply px-1 py-0.5;
    }
    
    .nexus-breadcrumb-actions {
        @apply mt-1;
    }
    
    .nexus-breadcrumb-back-btn {
        @apply px-2 py-1 text-xs;
    }
}

/* 過長文字處理 */
.nexus-breadcrumb-item:not(.active) .nexus-breadcrumb-link span,
.nexus-breadcrumb-item.active .nexus-breadcrumb-current span {
    @apply max-w-32 sm:max-w-48 md:max-w-none truncate;
}

/* 動畫效果 */
.nexus-breadcrumb-item {
    @apply transform transition-all duration-200;
}

.nexus-breadcrumb-item:hover {
    @apply scale-105;
}

/* 無障礙設計 */
.nexus-breadcrumb-link:focus,
.nexus-breadcrumb-back-btn:focus {
    @apply outline-none ring-2 ring-purple-500 ring-offset-2 ring-offset-white dark:ring-offset-gray-800;
}

/* 主題適配 */
@media (prefers-color-scheme: dark) {
    .nexus-breadcrumb-container {
        background-color: var(--nexus-nav-breadcrumb-bg, rgb(31 41 55 / 0.5));
    }
}

/* 列印樣式 */
@media print {
    .nexus-breadcrumb-container {
        @apply bg-white border-b border-gray-300;
    }
    
    .nexus-breadcrumb-actions {
        @apply hidden;
    }
}
</style>
@endpush