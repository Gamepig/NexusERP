@props(['navigation' => [], 'active' => false])

@php
$classes = ($active ?? false)
    ? 'inline-flex items-center px-1 pt-1 border-b-2 border-indigo-400 dark:border-indigo-600 text-xs lg:text-sm font-medium leading-5 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-indigo-700 transition duration-150 ease-in-out whitespace-nowrap'
    : 'inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-xs lg:text-sm font-medium leading-5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-700 focus:outline-none focus:text-gray-700 dark:focus:text-gray-300 focus:border-gray-300 dark:focus:border-gray-700 transition duration-150 ease-in-out whitespace-nowrap';
@endphp

<div class="relative" x-data="{ open: false }" @click.outside="open = false" @close.stop="open = false">
    <!-- 觸發按鈕 -->
    <button @click="open = !open" 
            class="{{ $classes }} relative"
            style="{{ ($active ?? false) ? 'color: var(--nexus-text-primary); border-color: var(--nexus-accent-purple);' : 'color: var(--nexus-text-secondary);' }}"
            onmouseover="{{ ($active ?? false) ? '' : 'this.style.color=\'var(--nexus-text-primary)\'; this.style.borderColor=\'var(--nexus-border-secondary)\';' }}"
            onmouseout="{{ ($active ?? false) ? '' : 'this.style.color=\'var(--nexus-text-secondary)\'; this.style.borderColor=\'transparent\';' }}"
            :aria-expanded="open"
            aria-haspopup="true">
        
        <!-- 導航項目內容 -->
        <span class="flex items-center">
            @if(isset($navigation['icon']))
                <span class="mr-2">{!! $navigation['icon'] !!}</span>
            @endif
            {{ $navigation['title'] ?? $slot }}
            
            @if(isset($navigation['badge']) && $navigation['badge'])
                <span class="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                    {{ $navigation['badge'] }}
                </span>
            @endif
        </span>
        
        <!-- 下拉箭頭 -->
        <svg class="ml-1 w-4 h-4 transition-transform duration-200" 
             :class="{'rotate-180': open}" 
             fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
        </svg>
    </button>

    <!-- 下拉選單 -->
    <div x-show="open"
         x-transition:enter="transition ease-out duration-200"
         x-transition:enter-start="opacity-0 scale-95"
         x-transition:enter-end="opacity-100 scale-100"
         x-transition:leave="transition ease-in duration-75"
         x-transition:leave-start="opacity-100 scale-100"
         x-transition:leave-end="opacity-0 scale-95"
         class="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 min-w-72 max-w-96"
         style="background-color: var(--nexus-bg-secondary); border-color: var(--nexus-border-primary); display: none;"
         @click="open = false">

        <!-- 動態容器寬度檢測和調整 -->
        <div class="py-2" x-init="
            // 智能寬度和位置調整邏輯
            $nextTick(() => {
                const dropdown = $el.closest('[x-show=\'open\']');
                const trigger = dropdown.previousElementSibling;
                const navbar = trigger.closest('nav');
                
                // 等待 DOM 穩定後再計算
                setTimeout(() => {
                    const navbarRect = navbar.getBoundingClientRect();
                    const triggerRect = trigger.getBoundingClientRect();
                    const viewportWidth = window.innerWidth;
                    
                    // 計算各方向的可用空間
                    const rightSpace = viewportWidth - triggerRect.right;
                    const leftSpace = triggerRect.left;
                    const centerSpace = navbarRect.right - triggerRect.left;
                    
                    const minWidth = 288; // min-w-72 = 18rem = 288px
                    const maxWidth = 384; // max-w-96 = 24rem = 384px
                    const preferredWidth = 320; // 理想寬度
                    
                    // 決定最佳寬度和位置
                    let finalWidth = preferredWidth;
                    let finalPosition = 'left';
                    
                    if (centerSpace >= preferredWidth) {
                        // 中心位置有足夠空間，保持左對齊
                        finalWidth = Math.min(preferredWidth, centerSpace - 20);
                        finalPosition = 'left';
                    } else if (rightSpace >= minWidth) {
                        // 右側有足夠空間但中心不足，右對齊
                        finalWidth = Math.min(preferredWidth, rightSpace - 20);
                        finalPosition = 'right';
                    } else if (leftSpace >= minWidth) {
                        // 左側有空間，完全左對齊到觸發器左邊緣
                        finalWidth = Math.min(preferredWidth, leftSpace - 20);
                        finalPosition = 'full-left';
                    } else {
                        // 空間非常有限，使用全寬度
                        finalWidth = Math.min(minWidth, viewportWidth - 40);
                        finalPosition = 'center';
                    }
                    
                    // 應用計算出的樣式
                    switch (finalPosition) {
                        case 'left':
                            dropdown.style.left = '0';
                            dropdown.style.right = 'auto';
                            dropdown.style.transform = 'none';
                            break;
                        case 'right':
                            dropdown.style.left = 'auto';
                            dropdown.style.right = '0';
                            dropdown.style.transform = 'none';
                            break;
                        case 'full-left':
                            dropdown.style.left = '-' + (triggerRect.left - 20) + 'px';
                            dropdown.style.right = 'auto';
                            dropdown.style.transform = 'none';
                            break;
                        case 'center':
                            dropdown.style.left = '50%';
                            dropdown.style.right = 'auto';
                            dropdown.style.transform = 'translateX(-50%)';
                            break;
                    }
                    
                    dropdown.style.width = finalWidth + 'px';
                    dropdown.style.minWidth = Math.max(minWidth, finalWidth) + 'px';
                    dropdown.style.maxWidth = maxWidth + 'px';
                    
                    // 為調試添加類別
                    dropdown.classList.add('dropdown-positioned');
                    dropdown.setAttribute('data-position', finalPosition);
                    dropdown.setAttribute('data-width', finalWidth);
                }, 50);
            });
        ">
            @if(isset($navigation['children']) && count($navigation['children']) > 0)
                @foreach($navigation['children'] as $child)
                    <a href="{{ $child['route'] ?? '#' }}" 
                       class="flex items-center px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150"
                       style="color: var(--nexus-text-secondary);"
                       onmouseover="this.style.backgroundColor='var(--nexus-bg-tertiary)'; this.style.color='var(--nexus-text-primary)';"
                       onmouseout="this.style.backgroundColor='transparent'; this.style.color='var(--nexus-text-secondary)';">
                        
                        @if(isset($child['icon']))
                            <span class="mr-3 w-5 h-5 flex-shrink-0">{!! $child['icon'] !!}</span>
                        @endif
                        
                        <div class="flex-1 min-w-0">
                            <div class="font-medium truncate">{{ $child['title'] }}</div>
                            @if(isset($child['description']))
                                <div class="text-xs opacity-75 mt-1 line-clamp-2">{{ $child['description'] }}</div>
                            @endif
                        </div>
                        
                        @if(isset($child['badge']) && $child['badge'])
                            <span class="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium 
                                {{ $child['badgeType'] === 'danger' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' : '' }}
                                {{ $child['badgeType'] === 'warning' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' : '' }}
                                {{ $child['badgeType'] === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : '' }}
                                {{ $child['badgeType'] === 'info' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' : '' }}
                                {{ !isset($child['badgeType']) || $child['badgeType'] === 'default' ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200' : '' }}">
                                {{ $child['badge'] }}
                            </span>
                        @endif
                    </a>
                @endforeach
            @else
                <div class="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                    暫無子項目
                </div>
            @endif
        </div>
    </div>
</div>