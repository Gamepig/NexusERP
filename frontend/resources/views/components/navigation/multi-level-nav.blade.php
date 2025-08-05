{{--
    NexusERP 多層級導航組件
    支援下拉選單、動畫效果、響應式設計
--}}

@props([
    'items' => [],
    'orientation' => 'horizontal', // horizontal | vertical
    'size' => 'default', // compact | default | large
    'showIcons' => true,
    'showBadges' => true,
    'activeRoute' => null,
    'id' => 'nexus-nav-' . uniqid()
])

@php
    $navigationClasses = [
        'nexus-multi-nav',
        'nexus-nav-' . $orientation,
        'nexus-nav-size-' . $size,
        'relative',
        'w-full'
    ];
    
    // 獲取當前活動路由
    $currentRoute = $activeRoute ?? request()->route()->getName();
@endphp

<nav 
    x-data="multiLevelNav({{ json_encode($items) }}, '{{ $currentRoute }}')"
    x-init="init()"
    {{ $attributes->merge(['class' => implode(' ', $navigationClasses)]) }}
    id="{{ $id }}"
    role="navigation"
    aria-label="主要導航">
    
    <!-- 水平導航 -->
    @if($orientation === 'horizontal')
        <ul class="flex items-center space-x-1 lg:space-x-2 xl:space-x-3 overflow-x-auto">
            <template x-for="(item, index) in navigationItems" :key="item.id || index">
                <li class="relative" 
                    :class="{'text-blue-600 dark:text-blue-400': isActiveItem(item)}"
                    @mouseenter="item.hasChildren && smartShowDropdown(item.id, 'hover')"
                    @mouseleave="item.hasChildren && scheduleHideDropdown(item.id)"
                    @click.stop="item.hasChildren && smartShowDropdown(item.id, 'click')">
                    
                    <!-- 一級導航項目 -->
                    <template x-if="item.hasChildren">
                        <button
                            @keydown.enter="smartShowDropdown(item.id, 'keyboard')"
                            @keydown.escape="hideAllDropdowns()"
                            @keydown.arrow-down="focusFirstSubmenu(item.id)"
                            :class="getNavItemClasses(item)"
                            :aria-expanded="openDropdowns.includes(item.id) ? 'true' : 'false'"
                            aria-haspopup="true"
                            :id="'nav-item-' + item.id"
                            class="nexus-nav-button nexus-nav-item-enhanced flex items-center transition-all duration-400 whitespace-nowrap min-w-0">
                            
                            <!-- 圖示 -->
                            <span x-show="{{ $showIcons ? 'item.icon' : 'false' }}" 
                                  class="mr-1 lg:mr-2 h-4 w-4 lg:h-5 lg:w-5"
                                  x-html="item.icon"
                                  aria-hidden="true"></span>
                            
                            <!-- 標題 -->
                            <span class="nexus-nav-text" x-text="item.title"></span>
                            
                            <!-- 徽章 -->
                            <span x-show="{{ $showBadges ? 'item.badge' : 'false' }}" 
                                  class="nexus-nav-badge"
                                  x-text="item.badge"
                                  :class="'nexus-badge-' + (item.badgeType || 'default')"></span>
                            
                            <!-- 下拉箭頭 -->
                            <svg x-show="item.hasChildren" 
                                 class="nexus-nav-arrow transition-transform duration-200"
                                 :class="{'rotate-180': openDropdowns.includes(item.id)}"
                                 width="12" height="12" viewBox="0 0 12 12" fill="none">
                                <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </button>
                    </template>
                    
                    <!-- 無子項目的導航項目（用連結） -->
                    <template x-if="!item.hasChildren">
                        <a
                            :href="item.route"
                            @keydown.escape="hideAllDropdowns()"
                            :class="getNavItemClasses(item)"
                            :id="'nav-item-' + item.id"
                            class="nexus-nav-button nexus-nav-item-enhanced flex items-center transition-all duration-400 whitespace-nowrap min-w-0">
                            
                            <!-- 圖示 -->
                            <span x-show="{{ $showIcons ? 'item.icon' : 'false' }}" 
                                  class="mr-1 lg:mr-2 h-4 w-4 lg:h-5 lg:w-5"
                                  x-html="item.icon"
                                  aria-hidden="true"></span>
                            
                            <!-- 標題 -->
                            <span class="nexus-nav-text" x-text="item.title"></span>
                            
                            <!-- 徽章 -->
                            <span x-show="{{ $showBadges ? 'item.badge' : 'false' }}" 
                                  class="nexus-nav-badge"
                                  x-text="item.badge"
                                  :class="'nexus-badge-' + (item.badgeType || 'default')"></span>
                        </a>
                    </template>
                    
                    <!-- 下拉選單 -->
                    <div x-show="item.hasChildren && openDropdowns.includes(item.id)"
                         x-transition:enter="transition ease-out duration-200"
                         x-transition:enter-start="opacity-0 scale-95"
                         x-transition:enter-end="opacity-1 scale-100"
                         x-transition:leave="transition ease-in duration-100"
                         x-transition:leave-start="opacity-1 scale-100"
                         x-transition:leave-end="opacity-0 scale-95"
                         @keydown.escape="hideDropdown(item.id)"
                         @mouseenter="cancelHideDropdown(item.id)"
                         @mouseleave="scheduleHideDropdown(item.id)"
                         class="nexus-nav-dropdown absolute z-50 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg min-w-48"
                         :id="'dropdown-' + item.id"
                         role="menu"
                         :aria-labelledby="'nav-item-' + item.id"
                         x-init="$nextTick(() => {
                             const rect = $el.previousElementSibling.getBoundingClientRect();
                             $el.style.left = rect.left + 'px';
                         })"
                        
                        <ul class="nexus-dropdown-list" role="none">
                            <template x-for="(subItem, subIndex) in item.children" :key="subItem.id || subIndex">
                                <li role="none">
                                    <a x-bind:href="subItem.route"
                                       @click="handleItemClick(subItem)"
                                       @keydown.enter="handleItemClick(subItem)"
                                       :class="getSubItemClasses(subItem)"
                                       class="nexus-dropdown-item"
                                       role="menuitem"
                                       :aria-current="isActiveItem(subItem) ? 'page' : null">
                                        
                                        <!-- 子項目圖示 -->
                                        <span x-show="{{ $showIcons ? 'subItem.icon' : 'false' }}" 
                                              class="nexus-dropdown-icon"
                                              x-html="subItem.icon"
                                              aria-hidden="true"></span>
                                        
                                        <!-- 子項目標題 -->
                                        <span class="nexus-dropdown-text" x-text="subItem.title"></span>
                                        
                                        <!-- 子項目描述 -->
                                        <span x-show="subItem.description" 
                                              class="nexus-dropdown-description"
                                              x-text="subItem.description"></span>
                                        
                                        <!-- 子項目徽章 -->
                                        <span x-show="{{ $showBadges ? 'subItem.badge' : 'false' }}" 
                                              class="nexus-dropdown-badge"
                                              x-text="subItem.badge"
                                              :class="'nexus-badge-' + (subItem.badgeType || 'default')"></span>
                                    </a>
                                </li>
                            </template>
                        </ul>
                        
                        <!-- 下拉選單底部動作 -->
                        <div x-show="item.actions && item.actions.length > 0" 
                             class="nexus-dropdown-actions">
                            <template x-for="(action, actionIndex) in item.actions" :key="actionIndex">
                                <button @click="handleActionClick(action)"
                                        class="nexus-dropdown-action"
                                        :class="'nexus-action-' + (action.type || 'default')">
                                    <span x-text="action.title"></span>
                                </button>
                            </template>
                        </div>
                    </div>
                </li>
            </template>
        </ul>
    @endif
    
    <!-- 垂直導航 (改為水平排列) -->
    @if($orientation === 'vertical')
        <ul class="nexus-nav-list-vertical flex flex-wrap gap-2">
            <template x-for="(item, index) in navigationItems" :key="item.id || index">
                <li class="nexus-nav-item-vertical" 
                    :class="{'nexus-nav-item-active': isActiveItem(item)}">
                    
                    <!-- 垂直導航項目 -->
                    <div class="nexus-nav-item-wrapper">
                        <button
                            @click="toggleVerticalDropdown(item.id)"
                            @keydown.enter="toggleVerticalDropdown(item.id)"
                            @keydown.escape="hideAllDropdowns()"
                            @keydown.arrow-down="focusFirstSubmenu(item.id)"
                            :class="getNavItemClasses(item)"
                            :aria-expanded="item.hasChildren ? (openDropdowns.includes(item.id) ? 'true' : 'false') : null"
                            :aria-haspopup="item.hasChildren ? 'true' : 'false'"
                            class="nexus-nav-button-vertical flex items-center px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap">
                            
                            <!-- 圖示 -->
                            <span x-show="{{ $showIcons ? 'item.icon' : 'false' }}" 
                                  class="nexus-nav-icon-vertical"
                                  x-html="item.icon"
                                  aria-hidden="true"></span>
                            
                            <!-- 標題 -->
                            <span class="nexus-nav-text-vertical" x-text="item.title"></span>
                            
                            <!-- 徽章 -->
                            <span x-show="{{ $showBadges ? 'item.badge' : 'false' }}" 
                                  class="nexus-nav-badge-vertical"
                                  x-text="item.badge"
                                  :class="'nexus-badge-' + (item.badgeType || 'default')"></span>
                            
                            <!-- 垂直下拉箭頭 -->
                            <svg x-show="item.hasChildren" 
                                 class="nexus-nav-arrow-vertical transition-transform duration-200"
                                 :class="{'rotate-90': openDropdowns.includes(item.id)}"
                                 width="12" height="12" viewBox="0 0 12 12" fill="none">
                                <path d="M4.5 3L7.5 6L4.5 9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </button>
                        
                        <!-- 垂直子選單 -->
                        <div x-show="item.hasChildren && openDropdowns.includes(item.id)"
                             x-transition:enter="nexus-collapse-enter"
                             x-transition:enter-start="nexus-collapse-enter-start"
                             x-transition:enter-end="nexus-collapse-enter-end"
                             x-transition:leave="nexus-collapse-leave"
                             x-transition:leave-start="nexus-collapse-leave-start"
                             x-transition:leave-end="nexus-collapse-leave-end"
                             class="nexus-nav-submenu">
                            
                            <ul class="nexus-submenu-list absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-50 min-w-48">
                                <template x-for="(subItem, subIndex) in item.children" :key="subItem.id || subIndex">
                                    <li>
                                        <a x-bind:href="subItem.route"
                                           @click="handleItemClick(subItem)"
                                           :class="getSubItemClasses(subItem)"
                                           class="nexus-submenu-item"
                                           :aria-current="isActiveItem(subItem) ? 'page' : null">
                                            
                                            <!-- 子項目圖示 -->
                                            <span x-show="{{ $showIcons ? 'subItem.icon' : 'false' }}" 
                                                  class="nexus-submenu-icon"
                                                  x-html="subItem.icon"
                                                  aria-hidden="true"></span>
                                            
                                            <!-- 子項目標題 -->
                                            <span class="nexus-submenu-text" x-text="subItem.title"></span>
                                            
                                            <!-- 子項目徽章 -->
                                            <span x-show="{{ $showBadges ? 'subItem.badge' : 'false' }}" 
                                                  class="nexus-submenu-badge"
                                                  x-text="subItem.badge"
                                                  :class="'nexus-badge-' + (subItem.badgeType || 'default')"></span>
                                        </a>
                                    </li>
                                </template>
                            </ul>
                        </div>
                    </div>
                </li>
            </template>
        </ul>
    @endif
</nav>

{{-- Navigation function is now defined in resources/js/navigation-functions.js to prevent conflicts --}}